import Dexie, { type Table } from 'dexie';
import type {
  OfflineProduct,
  OfflineCategory,
  OfflineBranch,
  OfflineCustomer,
  OfflineOrder,
  OfflineInventory,
  OutboxItem,
  KVCacheItem,
} from '../types';

/**
 * Base de Datos Local IndexedDB de alto rendimiento con Dexie.
 * Maneja persistencia estructurada para catálogos, pedidos offline,
 * caché genérico KV y la cola de transacciones pendientes (Outbox).
 */
export class AppOfflineDatabase extends Dexie {
  products!: Table<OfflineProduct, string>;
  categories!: Table<OfflineCategory, string>;
  branches!: Table<OfflineBranch, string>;
  customers!: Table<OfflineCustomer, string>;
  orders!: Table<OfflineOrder, string>;
  inventory!: Table<OfflineInventory, string>;
  syncQueue!: Table<OutboxItem, number>;
  kvCache!: Table<KVCacheItem, string>;

  constructor() {
    super('BoutiqueFashionOfflineDB');

    // Esquema versión 1 con índices optimizados
    this.version(1).stores({
      products: 'id, name, categoryId, isActive, isLocalOnly, updatedAt',
      categories: 'id, name, slug',
      branches: 'id, cityId, name, isActive',
      customers: 'id, email, phone, isLocalOnly',
      orders: 'id, orderNumber, customerId, branchId, status, paymentMethod, isLocalOnly, createdAt',
      inventory: 'id, variantId, locationId, quantity',
      syncQueue: '++id, idempotencyKey, entity, action, entityId, status, createdAt',
      kvCache: 'key, expiresAt, updatedAt',
    });
  }

  /**
   * Limpia registros de caché KV expirados para mantener la base liviana
   */
  async purgeExpiredCache(): Promise<number> {
    const now = Date.now();
    const expiredKeys = await this.kvCache
      .where('expiresAt')
      .below(now)
      .primaryKeys();

    if (expiredKeys.length > 0) {
      await this.kvCache.bulkDelete(expiredKeys);
    }
    return expiredKeys.length;
  }

  /**
   * Retorna una estimación del espacio de almacenamiento utilizado
   */
  async getStorageQuotaInfo(): Promise<{ usedBytes: number; quotaBytes: number; percentage: number } | null> {
    if (typeof navigator !== 'undefined' && 'storage' in navigator && 'estimate' in navigator.storage) {
      const estimate = await navigator.storage.estimate();
      const used = estimate.usage || 0;
      const quota = estimate.quota || 0;
      return {
        usedBytes: used,
        quotaBytes: quota,
        percentage: quota > 0 ? (used / quota) * 100 : 0,
      };
    }
    return null;
  }

  /**
   * Limpia toda la base local (útil para logout o reinicio forzado)
   */
  async resetAllData(): Promise<void> {
    await this.transaction('rw', this.tables, async () => {
      for (const table of this.tables) {
        await table.clear();
      }
    });
  }
}

/**
 * Instancia Singleton de la Base de Datos Local
 */
export const offlineDb = new AppOfflineDatabase();
