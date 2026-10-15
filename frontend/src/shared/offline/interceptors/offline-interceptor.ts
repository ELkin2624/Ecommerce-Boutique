import type { AxiosInstance, AxiosError } from 'axios';
import { outboxManager } from '../outbox/outbox-manager';
import { offlineDb } from '../db/app-db';
import { syncEngine } from '../sync/sync-engine';
import { toast } from '@/shared/ui/Toast';
import type { OutboxAction } from '../types';

/**
 * Normaliza cualquier URL de la API a su ruta limpia sin dominio, sin prefijo /api/v1 ni query params.
 * Ej: "http://192.168.0.32:3000/api/v1/catalog/products?limit=100" -> "/catalog/products"
 */
function normalizePath(rawUrl: string): string {
  let path = rawUrl;
  try {
    if (rawUrl.startsWith('http://') || rawUrl.startsWith('https://')) {
      const parsed = new URL(rawUrl);
      path = parsed.pathname;
    }
  } catch {}
  return path.split('?')[0].replace(/^\/api\/v1/, '');
}

/**
 * Deduce la entidad afectada a partir de la URL de la API.
 */
function extractEntity(url: string): string {
  if (url.includes('/variants')) return 'variant';
  if (url.includes('/products')) return 'product';
  if (url.includes('/categories')) return 'category';
  if (url.includes('/branches')) return 'branch';
  if (url.includes('/orders')) return 'order';
  if (url.includes('/reservations')) return 'reservation';
  if (url.includes('/inventory')) return 'inventory';
  if (url.includes('/suppliers')) return 'supplier';
  if (url.includes('/promotions')) return 'promotion';
  if (url.includes('/users')) return 'user';
  return 'general';
}

/**
 * Guarda una variante creada offline en la base de datos local para que aparezca
 * en la interfaz de inmediato.
 */
async function saveVariantLocally(url: string, payload: any, tempId: string): Promise<void> {
  try {
    const match = url.match(/\/catalog\/products\/([^/]+)\/variants/);
    if (match && match[1]) {
      const productId = match[1];
      const product = await offlineDb.products.get(productId);
      if (product) {
        const variants = Array.isArray(product.variants) ? [...product.variants] : [];
        const newVariant = {
          id: tempId,
          productId,
          ...payload,
          isLocalOnly: true,
          offlinePendingSync: true,
          createdAt: new Date().toISOString(),
        };
        variants.push(newVariant);
        await offlineDb.products.update(productId, {
          variants,
          updatedAt: Date.now(),
        });
        console.log(`[OfflineInterceptor] Variante ${tempId} agregada localmente al producto ${productId}`);
      }
    }
  } catch (err) {
    console.warn('[OfflineInterceptor] No se pudo persistir la variante en la BD local:', err);
  }
}

/**
 * Configura el interceptor transparente de Axios para capturar peticiones offline
 * tanto en consultas GET (fallback a IndexedDB) como en mutaciones (Outbox + Optimistic UI).
 */
export function setupOfflineInterceptor(axiosInstance: AxiosInstance): void {
  // 1. REQUEST INTERCEPTOR:
  // Si el navegador ya está sin conexión, cortocircuitar la llamada antes de que XHR
  // intente salir a la red y Chrome DevTools arroje "net::ERR_INTERNET_DISCONNECTED" en consola.
  axiosInstance.interceptors.request.use(
    (config) => {
      const isBrowserOffline = typeof navigator !== 'undefined' && !navigator.onLine;
      const url = config.url || '';

      // Nunca cortocircuitar autenticación
      if (isBrowserOffline && !url.includes('/auth/')) {
        const offlineError: any = new Error(`Modo offline activo: ${config.method?.toUpperCase()} ${url}`);
        offlineError.name = 'AxiosError';
        offlineError.code = 'ERR_NETWORK';
        offlineError.config = config;
        offlineError.isAxiosError = true;
        offlineError.isOfflineShortCircuit = true;
        return Promise.reject(offlineError);
      }

      return config;
    },
    (error) => Promise.reject(error),
  );

  // 2. RESPONSE INTERCEPTOR:
  axiosInstance.interceptors.response.use(
    (response) => {
      // Guardar consultas GET exitosas en el almacén Clave-Valor de IndexedDB
      if (response.config.method?.toUpperCase() === 'GET' && response.config.url) {
        const rawUrl = response.config.url;
        if (!rawUrl.includes('/auth/') && !rawUrl.includes('/voice')) {
          const cleanPath = normalizePath(rawUrl);
          const paramsSuffix = response.config.params ? JSON.stringify(response.config.params) : '';
          const expiresAt = Date.now() + 24 * 60 * 60 * 1000; // 24 horas
          const now = Date.now();

          // Guardar con clave normalizada y con clave parametrizada
          offlineDb.kvCache.put({
            key: cleanPath + paramsSuffix,
            data: response.data,
            expiresAt,
            updatedAt: now,
          }).catch(() => {});

          if (paramsSuffix) {
            offlineDb.kvCache.put({
              key: cleanPath,
              data: response.data,
              expiresAt,
              updatedAt: now,
            }).catch(() => {});
          }

          // Guardar también con rawUrl por compatibilidad
          offlineDb.kvCache.put({
            key: rawUrl,
            data: response.data,
            expiresAt,
            updatedAt: now,
          }).catch(() => {});
        }
      }
      return response;
    },
    async (error: AxiosError | any) => {
      const config = error?.config || error?.response?.config;
      if (!config) return Promise.reject(error);

      const rawUrl = config.url || '';
      const method = (config.method || 'GET').toUpperCase();
      const cleanPath = normalizePath(rawUrl);

      // No interceptar autenticación
      if (rawUrl.includes('/auth/')) {
        return Promise.reject(error);
      }

      // Detectar desconexión de red o servidor inalcanzable
      const isOfflineError =
        error?.isOfflineShortCircuit ||
        (typeof navigator !== 'undefined' && !navigator.onLine) ||
        error?.code === 'ERR_NETWORK' ||
        error?.code === 'ECONNABORTED' ||
        error?.message?.includes('Network Error') ||
        error?.message?.includes('net::ERR_INTERNET_DISCONNECTED') ||
        !error?.response;

      if (!isOfflineError) {
        return Promise.reject(error);
      }

      console.warn(`[OfflineInterceptor] Respondiendo desde IndexedDB local para ${method} "${cleanPath}"`);

      // -------------------------------------------------------------
      // 1. MANEJO DE CONSULTAS GET EN MODO OFFLINE
      // -------------------------------------------------------------
      if (method === 'GET') {
        const paramsSuffix = config.params ? JSON.stringify(config.params) : '';

        // 1a. Buscar primero en caché Clave-Valor de IndexedDB
        const cached =
          (await offlineDb.kvCache.get(cleanPath + paramsSuffix)) ||
          (await offlineDb.kvCache.get(cleanPath)) ||
          (await offlineDb.kvCache.get(rawUrl)) ||
          (await offlineDb.kvCache.get(rawUrl.split('?')[0]));

        if (cached) {
          console.log(`[OfflineInterceptor] Caché KV entregado para GET "${cleanPath}"`);
          return Promise.resolve({
            data: cached.data,
            status: 200,
            statusText: 'OK (From IndexedDB Cache)',
            headers: {},
            config,
          });
        }

        // 1b. Fallback a tablas estructuradas de IndexedDB
        if (cleanPath.includes('/catalog/products')) {
          const localProducts = await offlineDb.products.toArray();
          console.log(`[OfflineInterceptor] Entregando ${localProducts.length} productos desde tabla local IndexedDB`);
          return Promise.resolve({
            data: { items: localProducts, meta: { total: localProducts.length, page: 1, limit: 100 } },
            status: 200,
            statusText: 'OK (From Local Products Table)',
            headers: {},
            config,
          });
        }

        if (cleanPath.includes('/catalog/categories')) {
          const localCats = await offlineDb.categories.toArray();
          console.log(`[OfflineInterceptor] Entregando ${localCats.length} categorías desde tabla local IndexedDB`);
          return Promise.resolve({
            data: localCats,
            status: 200,
            statusText: 'OK (From Local Categories Table)',
            headers: {},
            config,
          });
        }

        if (cleanPath.includes('/branches/cities')) {
          const cachedCities =
            (await offlineDb.kvCache.get('/branches/cities')) ||
            (await offlineDb.kvCache.get('branches_cities'));
          return Promise.resolve({
            data: cachedCities?.data || [],
            status: 200,
            statusText: 'OK (Local Cities Fallback)',
            headers: {},
            config,
          });
        }

        if (cleanPath.includes('/branches')) {
          const localBranches = await offlineDb.branches.toArray();
          return Promise.resolve({
            data: localBranches,
            status: 200,
            statusText: 'OK (From Local Branches Table)',
            headers: {},
            config,
          });
        }

        // 1c. Endpoints auxiliares de catálogo (temporadas, colecciones, proveedores)
        if (
          cleanPath.includes('/catalog/seasons') ||
          cleanPath.includes('/catalog/collections') ||
          cleanPath.includes('/catalog/suppliers')
        ) {
          return Promise.resolve({
            data: [],
            status: 200,
            statusText: 'OK (Offline Safe Fallback)',
            headers: {},
            config,
          });
        }

        // 1d. Fallback seguro para cualquier otra consulta GET offline
        return Promise.resolve({
          data: [],
          status: 200,
          statusText: 'OK (Generic Offline Safe Fallback)',
          headers: {},
          config,
        });
      }

      // -------------------------------------------------------------
      // 2. MANEJO DE MUTACIONES (POST, PUT, PATCH, DELETE) EN MODO OFFLINE
      // -------------------------------------------------------------
      let parsedPayload: any = {};
      try {
        parsedPayload = typeof config.data === 'string' ? JSON.parse(config.data) : config.data || {};
      } catch {
        parsedPayload = config.data || {};
      }

      const entity = extractEntity(cleanPath);
      const action: OutboxAction =
        method === 'DELETE' ? 'DELETE' : method === 'POST' ? 'CREATE' : 'UPDATE';

      const tempId = `off_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

      // Encolar en la cola Outbox con Idempotency Key única
      const outboxItem = await outboxManager.enqueue({
        entity,
        action,
        entityId: parsedPayload.id || tempId,
        endpoint: rawUrl,
        method: method as any,
        payload: parsedPayload,
        headers: config.headers as any,
      });

      // Si es una variante, agregarla al producto local en IndexedDB
      if (cleanPath.includes('/variants')) {
        await saveVariantLocally(rawUrl, parsedPayload, tempId);
      }

      // Notificar al usuario mediante Toast
      toast.info(
        'Guardado Localmente (Offline)',
        'Los cambios se guardaron en tu dispositivo y se sincronizarán al recuperar la conexión.',
      );

      // Programar sincronización pasiva
      syncEngine.scheduleSync(3000);

      // Responder con HTTP 200 sintético para que React y React Query continúen normalmente
      return Promise.resolve({
        data: {
          id: tempId,
          ...parsedPayload,
          isLocalOnly: true,
          offlinePendingSync: true,
          idempotencyKey: outboxItem.idempotencyKey,
          message: 'Operación registrada en IndexedDB en modo offline.',
        },
        status: 200,
        statusText: 'OK (Offline Intercepted)',
        headers: {},
        config,
      });
    },
  );
}
