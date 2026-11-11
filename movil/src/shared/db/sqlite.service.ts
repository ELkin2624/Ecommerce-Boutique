import { Platform } from 'react-native';
import { requireOptionalNativeModule } from 'expo-modules-core';
import { appStorage } from '@/shared/lib/storage';
import type { TenantInfo } from '@/entities/tenant/types';
import type { Product } from '@/entities/product/types';
import type { Promotion } from '@/entities/promotion/types';
import {
  OFFLINE_SEED_TENANTS,
  OFFLINE_SEED_CATEGORIES,
  OFFLINE_SEED_PROMOTIONS,
  OFFLINE_SEED_BRANCHES,
  getSeedProductsForTenant,
} from './offline-seed';

const DB_NAME = 'boutique_multi_tenant.db';
const FALLBACK_TENANTS_KEY = 'sqlite_mirror_tenants_v1';
const FALLBACK_CATALOG_PREFIX = 'sqlite_mirror_catalog_v1_';

let sqliteDbInstance: any = null;
let isInitialized = false;
let initPromise: Promise<void> | null = null;

/**
 * Obtiene la instancia nativa de SQLite si el binario nativo ExpoSQLite está enlazado.
 * Si el APK actual aún no fue recompilado tras instalar expo-sqlite (o en Web),
 * retorna null de forma segura sin lanzar excepción nativa.
 */
async function getNativeSqliteDb(): Promise<any | null> {
  if (Platform.OS === 'web') return null;
  if (sqliteDbInstance) return sqliteDbInstance;

  try {
    const nativeMod = requireOptionalNativeModule('ExpoSQLite');
    if (!nativeMod) return null;

    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const SQLite = require('expo-sqlite');
    if (SQLite && typeof SQLite.openDatabaseAsync === 'function') {
      sqliteDbInstance = await SQLite.openDatabaseAsync(DB_NAME);
      return sqliteDbInstance;
    }
  } catch {
    return null;
  }
  return null;
}

/**
 * Motor SQLite Offline-First para Tiendas Multi-Tenant y Catálogo Local.
 * Crea las tablas relacionales en SQLite y garantiza disponibilidad 100% offline.
 */
export const sqliteService = {
  async initDatabase(): Promise<void> {
    if (isInitialized) return;
    if (initPromise) return initPromise;

    initPromise = (async () => {
      try {
        const db = await getNativeSqliteDb();
        if (db) {
          await db.execAsync(`
            PRAGMA journal_mode = WAL;
            CREATE TABLE IF NOT EXISTS tenants (
              slug TEXT PRIMARY KEY NOT NULL,
              id TEXT NOT NULL,
              name TEXT NOT NULL,
              plan TEXT NOT NULL,
              status TEXT NOT NULL,
              owner_name TEXT,
              primary_color TEXT,
              logo_url TEXT,
              category TEXT,
              settings_json TEXT,
              updated_at INTEGER NOT NULL
            );
            CREATE TABLE IF NOT EXISTS catalog_products (
              tenant_slug TEXT NOT NULL,
              product_id TEXT NOT NULL,
              name TEXT NOT NULL,
              category_id TEXT,
              data_json TEXT NOT NULL,
              updated_at INTEGER NOT NULL,
              PRIMARY KEY (tenant_slug, product_id)
            );
            CREATE TABLE IF NOT EXISTS catalog_categories (
              tenant_slug TEXT NOT NULL,
              category_id TEXT NOT NULL,
              name TEXT NOT NULL,
              updated_at INTEGER NOT NULL,
              PRIMARY KEY (tenant_slug, category_id)
            );
            CREATE TABLE IF NOT EXISTS catalog_promotions (
              tenant_slug TEXT NOT NULL,
              promo_id TEXT NOT NULL,
              data_json TEXT NOT NULL,
              updated_at INTEGER NOT NULL,
              PRIMARY KEY (tenant_slug, promo_id)
            );
            CREATE TABLE IF NOT EXISTS tenant_branches (
              tenant_slug TEXT NOT NULL,
              branch_id TEXT NOT NULL,
              data_json TEXT NOT NULL,
              updated_at INTEGER NOT NULL,
              PRIMARY KEY (tenant_slug, branch_id)
            );
          `);

          const countRow = await db.getFirstAsync('SELECT COUNT(*) as total FROM tenants;');
          const count = countRow?.total ?? 0;

          if (count === 0) {
            await this.saveTenantsToSqlite(OFFLINE_SEED_TENANTS);
            for (const tenant of OFFLINE_SEED_TENANTS) {
              await this.saveTenantCatalogToSqlite(
                tenant.slug,
                getSeedProductsForTenant(tenant.slug),
                OFFLINE_SEED_CATEGORIES,
                OFFLINE_SEED_PROMOTIONS
              );
              await this.saveTenantBranchesToSqlite(tenant.slug, OFFLINE_SEED_BRANCHES);
            }
          }
        } else {
          // Respaldo persistente cuando el binario nativo aún no ha sido recompilado
          const existing = await appStorage.getItem(FALLBACK_TENANTS_KEY);
          if (!existing) {
            await appStorage.setItem(FALLBACK_TENANTS_KEY, JSON.stringify(OFFLINE_SEED_TENANTS));
          }
        }
        isInitialized = true;
      } catch (err) {
        console.warn('[SQLiteService] Aviso inicializando SQLite:', err);
        isInitialized = true;
      } finally {
        initPromise = null;
      }
    })();

    return initPromise;
  },

  /**
   * Obtiene todas las tiendas registradas desde SQLite para navegación Offline.
   */
  async getTenantsFromSqlite(): Promise<TenantInfo[]> {
    await this.initDatabase();

    try {
      const db = await getNativeSqliteDb();
      if (db) {
        const rows = await db.getAllAsync(
          'SELECT * FROM tenants ORDER BY updated_at DESC, name ASC;'
        );
        if (Array.isArray(rows) && rows.length > 0) {
          return rows.map((r: any) => ({
            id: r.id,
            name: r.name,
            slug: r.slug,
            plan: r.plan,
            status: r.status || 'ACTIVE',
            ownerName: r.owner_name,
            primaryColor: r.primary_color,
            logoUrl: r.logo_url,
            category: r.category || 'Moda Femenina & Boutiques',
            settings: r.settings_json ? JSON.parse(r.settings_json) : null,
          }));
        }
      }

      const cachedJson = await appStorage.getItem(FALLBACK_TENANTS_KEY);
      if (cachedJson) {
        const parsed = JSON.parse(cachedJson) as TenantInfo[];
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch {
      // Fallback directo a semilla offline
    }

    return OFFLINE_SEED_TENANTS;
  },

  /**
   * Guarda o actualiza el listado de tiendas en SQLite (INSERT OR REPLACE).
   * Conserva las tiendas locales previas y agrega cualquier tienda nueva creada cuando hay internet.
   */
  async saveTenantsToSqlite(tenants: TenantInfo[]): Promise<void> {
    if (!Array.isArray(tenants) || tenants.length === 0) return;

    try {
      // 1. Fusionar con el respaldo local por slug para nunca perder tiendas previas
      const existingRaw = await appStorage.getItem(FALLBACK_TENANTS_KEY);
      const existingList: TenantInfo[] = existingRaw ? JSON.parse(existingRaw) : OFFLINE_SEED_TENANTS;
      const mergedMap = new Map<string, TenantInfo>();

      for (const item of existingList) {
        if (item?.slug) mergedMap.set(item.slug, item);
      }
      for (const incoming of tenants) {
        if (incoming?.slug) {
          const prev = mergedMap.get(incoming.slug);
          mergedMap.set(incoming.slug, {
            ...prev,
            ...incoming,
            category:
              incoming.category ||
              (incoming.settings as any)?.category ||
              prev?.category ||
              'Moda Femenina & Boutiques',
          });
        }
      }

      const mergedTenants = Array.from(mergedMap.values());
      await appStorage.setItem(FALLBACK_TENANTS_KEY, JSON.stringify(mergedTenants));

      const db = await getNativeSqliteDb();
      if (!db) return;

      const now = Date.now();
      for (const t of mergedTenants) {
        await db.runAsync(
          `INSERT OR REPLACE INTO tenants (
            slug, id, name, plan, status, owner_name, primary_color, logo_url, category, settings_json, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
          [
            t.slug,
            t.id,
            t.name,
            t.plan || 'PRO',
            t.status || 'ACTIVE',
            t.ownerName ?? null,
            t.primaryColor ?? '#1D8B94',
            t.logoUrl ?? null,
            t.category || (t.settings as any)?.category || 'Moda Femenina & Boutiques',
            t.settings ? JSON.stringify(t.settings) : null,
            now,
          ]
        );

        // Si es una tienda nueva creada en la nube y aún no tiene catálogo local en SQLite, inicializar su semilla base
        const prodCountRow = await db.getFirstAsync(
          'SELECT COUNT(*) as total FROM catalog_products WHERE tenant_slug = ?;',
          [t.slug]
        );
        if ((prodCountRow?.total ?? 0) === 0) {
          await this.saveTenantCatalogToSqlite(
            t.slug,
            getSeedProductsForTenant(t.slug),
            OFFLINE_SEED_CATEGORIES,
            OFFLINE_SEED_PROMOTIONS
          );
          await this.saveTenantBranchesToSqlite(t.slug, OFFLINE_SEED_BRANCHES);
        }
      }
    } catch (err) {
      console.warn('[SQLiteService] Error guardando tenants en SQLite:', err);
    }
  },

  /**
   * Obtiene el catálogo completo (productos, categorías, promociones) de un tenant desde SQLite.
   */
  async getTenantCatalogFromSqlite(
    tenantSlug: string,
    search?: string,
    categoryId?: string | null
  ): Promise<{
    products: Product[];
    categories: { id: string; name: string }[];
    promotions: Promotion[];
  }> {
    await this.initDatabase();

    let products: Product[] = [];
    let categories: { id: string; name: string }[] = [];
    let promotions: Promotion[] = [];

    try {
      const db = await getNativeSqliteDb();
      if (db) {
        const prodRows = await db.getAllAsync(
          'SELECT data_json FROM catalog_products WHERE tenant_slug = ?;',
          [tenantSlug]
        );
        const catRows = await db.getAllAsync(
          'SELECT category_id, name FROM catalog_categories WHERE tenant_slug = ?;',
          [tenantSlug]
        );
        const promoRows = await db.getAllAsync(
          'SELECT data_json FROM catalog_promotions WHERE tenant_slug = ?;',
          [tenantSlug]
        );

        if (Array.isArray(prodRows) && prodRows.length > 0) {
          products = prodRows.map((r: any) => JSON.parse(r.data_json) as Product);
        }
        if (Array.isArray(catRows) && catRows.length > 0) {
          categories = catRows.map((r: any) => ({ id: r.category_id, name: r.name }));
        }
        if (Array.isArray(promoRows) && promoRows.length > 0) {
          promotions = promoRows.map((r: any) => JSON.parse(r.data_json) as Promotion);
        }
      }

      if (products.length === 0) {
        const fallbackRaw = await appStorage.getItem(`${FALLBACK_CATALOG_PREFIX}${tenantSlug}`);
        if (fallbackRaw) {
          const parsed = JSON.parse(fallbackRaw);
          products = parsed.products || [];
          categories = parsed.categories || [];
          promotions = parsed.promotions || [];
        }
      }
    } catch {
      // Continuar a semilla si hubo error de lectura
    }

    if (products.length === 0) {
      products = getSeedProductsForTenant(tenantSlug);
    }
    if (categories.length === 0) {
      categories = OFFLINE_SEED_CATEGORIES;
    }
    if (promotions.length === 0) {
      promotions = OFFLINE_SEED_PROMOTIONS;
    }

    // Filtrado local en modo offline por categoría y búsqueda
    const filteredProducts = products.filter((p) => {
      const matchesCat =
        !categoryId || p.categoryId === categoryId || p.category?.id === categoryId;
      if (!matchesCat) return false;

      if (!search || !search.trim()) return true;
      const q = search.toLowerCase().trim();
      const nameMatch = p.name?.toLowerCase().includes(q);
      const descMatch = p.description?.toLowerCase().includes(q);
      const brandMatch = p.brand?.toLowerCase().includes(q);
      return Boolean(nameMatch || descMatch || brandMatch);
    });

    return {
      products: filteredProducts,
      categories,
      promotions,
    };
  },

  /**
   * Sincroniza y guarda en SQLite el catálogo de una tienda cuando hay conexión.
   */
  async saveTenantCatalogToSqlite(
    tenantSlug: string,
    products: Product[],
    categories: { id: string; name: string }[],
    promotions: Promotion[]
  ): Promise<void> {
    if (!tenantSlug) return;

    try {
      if (products.length > 0) {
        await appStorage.setItem(
          `${FALLBACK_CATALOG_PREFIX}${tenantSlug}`,
          JSON.stringify({ products, categories, promotions })
        );
      }

      const db = await getNativeSqliteDb();
      if (!db) return;

      const now = Date.now();
      for (const p of products) {
        await db.runAsync(
          `INSERT OR REPLACE INTO catalog_products (
            tenant_slug, product_id, name, category_id, data_json, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?);`,
          [
            tenantSlug,
            p.id,
            p.name,
            p.categoryId || p.category?.id || null,
            JSON.stringify(p),
            now,
          ]
        );
      }

      for (const c of categories) {
        await db.runAsync(
          `INSERT OR REPLACE INTO catalog_categories (
            tenant_slug, category_id, name, updated_at
          ) VALUES (?, ?, ?, ?);`,
          [tenantSlug, c.id, c.name, now]
        );
      }

      for (const promo of promotions) {
        await db.runAsync(
          `INSERT OR REPLACE INTO catalog_promotions (
            tenant_slug, promo_id, data_json, updated_at
          ) VALUES (?, ?, ?, ?);`,
          [tenantSlug, promo.id, JSON.stringify(promo), now]
        );
      }
    } catch (err) {
      console.warn('[SQLiteService] Error guardando catálogo en SQLite:', err);
    }
  },

  /**
   * Guarda las sucursales de una tienda en SQLite.
   */
  async saveTenantBranchesToSqlite(tenantSlug: string, branches: any[]): Promise<void> {
    if (!tenantSlug || !Array.isArray(branches) || branches.length === 0) return;

    try {
      const db = await getNativeSqliteDb();
      if (!db) return;

      const now = Date.now();
      for (const b of branches) {
        await db.runAsync(
          `INSERT OR REPLACE INTO tenant_branches (
            tenant_slug, branch_id, data_json, updated_at
          ) VALUES (?, ?, ?, ?);`,
          [tenantSlug, b.id, JSON.stringify(b), now]
        );
      }
    } catch {
      // Ignorar errores de escritura secundaria
    }
  },

  /**
   * Obtiene el detalle de un producto y las sucursales de la tienda desde SQLite para vista Offline.
   */
  async getProductDetailFromSqlite(
    tenantSlug: string,
    productId: string
  ): Promise<{ product: Product | null; branches: any[] }> {
    await this.initDatabase();

    let product: Product | null = null;
    let branches: any[] = [];

    try {
      const db = await getNativeSqliteDb();
      if (db) {
        const prodRow = await db.getFirstAsync(
          'SELECT data_json FROM catalog_products WHERE tenant_slug = ? AND product_id = ?;',
          [tenantSlug, productId]
        );
        if (prodRow?.data_json) {
          product = JSON.parse(prodRow.data_json) as Product;
        }

        const branchRows = await db.getAllAsync(
          'SELECT data_json FROM tenant_branches WHERE tenant_slug = ?;',
          [tenantSlug]
        );
        if (Array.isArray(branchRows) && branchRows.length > 0) {
          branches = branchRows.map((r: any) => JSON.parse(r.data_json));
        }
      }
    } catch {
      // Fallback a búsqueda en catálogo local
    }

    if (!product) {
      const { products } = await this.getTenantCatalogFromSqlite(tenantSlug);
      product = products.find((p) => p.id === productId) || products[0] || null;
    }

    if (branches.length === 0) {
      branches = OFFLINE_SEED_BRANCHES;
    }

    return { product, branches };
  },
};
