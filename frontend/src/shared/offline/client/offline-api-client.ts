import { apiClient } from '@/shared/api/axios-client';
import { offlineDb } from '../db/app-db';
import { outboxManager } from '../outbox/outbox-manager';
import { networkMonitor } from '../network/network-monitor';
import { syncEngine } from '../sync/sync-engine';
import type { OutboxAction, QueryStrategy } from '../types';

export interface OfflineQueryOptions {
  ttl?: number; // Tiempo de vida en milisegundos (default: 30 minutos)
  strategy?: QueryStrategy;
}

export interface OfflineMutationOptions<T = any> {
  entity: string;
  action: OutboxAction;
  endpoint: string;
  method?: 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  payload: T;
  entityId?: string;
  optimisticSave?: () => Promise<void>;
  headers?: Record<string, string>;
}

export interface OfflineMutationResult<R = any> {
  data: R;
  isOffline: boolean;
  pendingSync: boolean;
  idempotencyKey?: string;
}

/**
 * Cliente Unificado Offline-First.
 * Abstrae de forma transparente la lectura de caché IndexedDB y el encolado
 * de mutaciones en el Outbox cuando no hay red o cuando el servidor no responde.
 */
export class OfflineApiClient {
  /**
   * Ejecuta una consulta con estrategia Offline-First / Cache-First / Stale-While-Revalidate.
   */
  async get<T>(
    cacheKey: string,
    fetcher: () => Promise<T>,
    options: OfflineQueryOptions = {},
  ): Promise<{ data: T; fromCache: boolean }> {
    const { ttl = 30 * 60 * 1000, strategy = 'STALE_WHILE_REVALIDATE' } = options;
    const now = Date.now();

    // 1. Consultar si existe en la base local IndexedDB
    const cached = await offlineDb.kvCache.get(cacheKey);
    const isCacheValid = cached && cached.expiresAt > now;

    // Si la estrategia es CACHE_FIRST y está vigente, retornar sin tocar la red
    if (strategy === 'CACHE_FIRST' && isCacheValid) {
      return { data: cached.data as T, fromCache: true };
    }

    // 2. Si no hay conexión a internet, retornar caché obligatoriamente si existe
    if (!networkMonitor.getState().isOnline) {
      if (cached) {
        return { data: cached.data as T, fromCache: true };
      }
      throw new Error(`[OfflineClient] Sin conexión a internet y sin copia local para "${cacheKey}".`);
    }

    // 3. Si hay red, ejecutar la petición
    try {
      const data = await fetcher();

      // Guardar asíncronamente en IndexedDB sin bloquear el render
      offlineDb.kvCache.put({
        key: cacheKey,
        data,
        expiresAt: now + ttl,
        updatedAt: now,
      });

      return { data, fromCache: false };
    } catch (networkError) {
      // Si la red falló pero teníamos caché (aunque esté expirado), salvar la experiencia de usuario
      if (cached) {
        console.warn(`[OfflineClient] Fallo de red para "${cacheKey}". Usando respaldo local en IndexedDB.`);
        return { data: cached.data as T, fromCache: true };
      }
      throw networkError;
    }
  }

  /**
   * Ejecuta una mutación (POST, PUT, DELETE, PATCH).
   * Si hay red, la envía de inmediato. Si falla o estamos offline:
   * 1. Aplica la mutación optimista en IndexedDB para respuesta instantánea.
   * 2. Encola la operación en el Outbox para sincronización automática posterior.
   */
  async mutate<TPayload = any, TResponse = any>(
    options: OfflineMutationOptions<TPayload>,
  ): Promise<OfflineMutationResult<TResponse>> {
    const {
      entity,
      action,
      endpoint,
      method = action === 'DELETE' ? 'DELETE' : action === 'UPDATE' ? 'PUT' : 'POST',
      payload,
      entityId,
      optimisticSave,
      headers,
    } = options;

    const isOnline = networkMonitor.getState().isOnline;

    // Si estamos online, intentamos la petición directa
    if (isOnline) {
      try {
        const response = await apiClient.request<TResponse>({
          url: endpoint,
          method,
          data: payload,
          headers,
        });

        // Aplicar persistencia local si fue provista
        if (optimisticSave) {
          await optimisticSave();
        }

        return {
          data: response.data,
          isOffline: false,
          pendingSync: false,
        };
      } catch (err: any) {
        const isNetworkErr = !err.response || err.code === 'ERR_NETWORK' || err.response.status >= 500;
        if (!isNetworkErr) {
          // Errores 4xx son de validación/negocio; no deben encolarse ciegamente
          throw err;
        }
        console.warn('[OfflineClient] Error en red o servidor. Derivando a cola Outbox offline...');
      }
    }

    // FLUJO OFFLINE:
    // 1. Guardar de forma optimista en la BD local
    if (optimisticSave) {
      await optimisticSave();
    }

    // 2. Encolar en Outbox para cuando vuelva la red
    const outboxItem = await outboxManager.enqueue({
      entity,
      action,
      entityId,
      endpoint,
      method,
      payload,
      headers,
    });

    // 3. Despertar el sincronizador si es que la red se recupera en breve
    syncEngine.scheduleSync();

    return {
      data: payload as unknown as TResponse,
      isOffline: true,
      pendingSync: true,
      idempotencyKey: outboxItem.idempotencyKey,
    };
  }

  /**
   * Precarga catálogos clave en IndexedDB para disponibilidad offline absoluta
   */
  async preloadCriticalData(): Promise<void> {
    if (!networkMonitor.getState().isOnline) return;

    try {
      // 1. Precargar sucursales
      const branchesRes = await apiClient.get('/branches');
      if (Array.isArray(branchesRes.data)) {
        await offlineDb.branches.bulkPut(
          branchesRes.data.map((b: any) => ({
            ...b,
            syncedAt: Date.now(),
            updatedAt: Date.now(),
          })),
        );
      }

      // 2. Precargar categorías
      const catRes = await apiClient.get('/catalog/categories');
      if (Array.isArray(catRes.data)) {
        await offlineDb.categories.bulkPut(
          catRes.data.map((c: any) => ({
            ...c,
            syncedAt: Date.now(),
            updatedAt: Date.now(),
          })),
        );
      }

      // 3. Precargar catálogo de productos inicial
      const prodRes = await apiClient.get('/catalog/products?limit=100');
      const products = Array.isArray(prodRes.data) ? prodRes.data : prodRes.data?.items;
      if (Array.isArray(products)) {
        await offlineDb.products.bulkPut(
          products.map((p: any) => ({
            ...p,
            syncedAt: Date.now(),
            updatedAt: Date.now(),
          })),
        );
      }

      // 4. Precargar temporadas, colecciones, proveedores y ciudades
      await Promise.allSettled([
        apiClient.get('/catalog/seasons'),
        apiClient.get('/catalog/collections'),
        apiClient.get('/catalog/suppliers'),
        apiClient.get('/branches/cities'),
      ]);

      console.log('[OfflineClient] Precarga integral de catálogos en IndexedDB completada con éxito.');
    } catch (err) {
      console.warn('[OfflineClient] No se pudo completar la precarga inicial:', err);
    }
  }
}

export const offlineApi = new OfflineApiClient();
