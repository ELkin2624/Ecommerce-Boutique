import { offlineDb } from '../db/app-db';
import type { OutboxItem, OutboxAction, OutboxStatus } from '../types';

export interface EnqueueOptions<T = any> {
  entity: string;
  action: OutboxAction;
  entityId?: string;
  endpoint: string;
  method: 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  payload: T;
  headers?: Record<string, string>;
  maxRetries?: number;
}

/**
 * Gestor del patrón Outbox (Cola de operaciones offline).
 * Encola mutaciones pendientes para ser transmitidas al servidor cuando haya conexión.
 */
export class OutboxManager {
  /**
   * Encola una nueva mutación con clave de idempotencia única y contexto de tienda.
   */
  async enqueue<T = any>(options: EnqueueOptions<T>): Promise<OutboxItem<T>> {
    const idempotencyKey = this.generateIdempotencyKey();
    const now = Date.now();

    const activeTenantSlug =
      typeof window !== 'undefined'
        ? localStorage.getItem('fashionstore_tenant_slug') ||
          localStorage.getItem('fashionstore-active-tenant') ||
          ''
        : '';

    const headers: Record<string, string> = {
      ...(options.headers || {}),
    };
    if (activeTenantSlug && !headers['x-tenant-slug']) {
      headers['x-tenant-slug'] = activeTenantSlug;
    }

    const item: OutboxItem<T> = {
      idempotencyKey,
      entity: options.entity,
      action: options.action,
      entityId: options.entityId,
      endpoint: options.endpoint,
      method: options.method,
      payload: options.payload,
      headers,
      status: 'PENDING',
      retryCount: 0,
      maxRetries: options.maxRetries ?? 5,
      createdAt: now,
      updatedAt: now,
    };

    const id = await offlineDb.syncQueue.add(item);
    return { ...item, id };
  }

  /**
   * Limpia cualquier operación de plano de control (/saas, /auth) que no pertenezca a operaciones comerciales offline.
   */
  async purgeControlPlaneItems(): Promise<void> {
    try {
      const invalidKeys = await offlineDb.syncQueue
        .filter(
          (item) =>
            Boolean(item.endpoint?.includes('/saas')) ||
            Boolean(item.endpoint?.includes('/auth')),
        )
        .primaryKeys();
      if (invalidKeys.length > 0) {
        await offlineDb.syncQueue.bulkDelete(invalidKeys);
      }
    } catch {
      // Ignorar errores de acceso inicial a IndexedDB
    }
  }

  /**
   * Obtiene las mutaciones pendientes de sincronizar en orden cronológico (FIFO).
   */
  async getPending(): Promise<OutboxItem[]> {
    await this.purgeControlPlaneItems();
    return offlineDb.syncQueue
      .where('status')
      .anyOf(['PENDING', 'FAILED'])
      .filter((item) => item.retryCount < item.maxRetries)
      .sortBy('createdAt');
  }

  /**
   * Cuenta cuántas operaciones siguen pendientes en la cola.
   */
  async getPendingCount(): Promise<number> {
    await this.purgeControlPlaneItems();
    return offlineDb.syncQueue
      .where('status')
      .anyOf(['PENDING', 'FAILED'])
      .filter((item) => item.retryCount < item.maxRetries)
      .count();
  }

  /**
   * Obtiene los ítems que fallaron definitivamente o entraron en conflicto de negocio (ej. falta de stock).
   */
  async getFailed(): Promise<OutboxItem[]> {
    await this.purgeControlPlaneItems();
    return offlineDb.syncQueue
      .where('status')
      .equals('FAILED')
      .reverse()
      .sortBy('updatedAt');
  }

  /**
   * Cuenta cuántos ítems fallaron o entraron en conflicto irresoluble.
   */
  async getFailedCount(): Promise<number> {
    await this.purgeControlPlaneItems();
    return offlineDb.syncQueue
      .where('status')
      .equals('FAILED')
      .count();
  }

  /**
   * Reintenta manualmente un ítem encolado o fallido.
   */
  async retryItem(id: number): Promise<void> {
    await offlineDb.syncQueue.update(id, {
      status: 'PENDING' as OutboxStatus,
      retryCount: 0,
      updatedAt: Date.now(),
    });
  }

  /**
   * Marca un ítem como en proceso de sincronización.
   */
  async markSyncing(id: number): Promise<void> {
    await offlineDb.syncQueue.update(id, {
      status: 'SYNCING' as OutboxStatus,
      updatedAt: Date.now(),
    });
  }

  /**
   * Marca un ítem como exitosamente sincronizado con el servidor.
   */
  async markCompleted(id: number): Promise<void> {
    await offlineDb.syncQueue.update(id, {
      status: 'COMPLETED' as OutboxStatus,
      updatedAt: Date.now(),
    });
  }

  /**
   * Registra un fallo en la sincronización, incrementando el contador de reintentos.
   */
  async markFailed(id: number, error: string, isPermanent = false): Promise<void> {
    const item = await offlineDb.syncQueue.get(id);
    if (!item) return;

    const retryCount = item.retryCount + 1;
    const shouldFailPermanently = isPermanent || retryCount >= item.maxRetries;

    await offlineDb.syncQueue.update(id, {
      status: (shouldFailPermanently ? 'FAILED' : 'PENDING') as OutboxStatus,
      retryCount,
      lastError: error,
      updatedAt: Date.now(),
    });
  }

  /**
   * Elimina un ítem específico de la cola.
   */
  async removeItem(id: number): Promise<void> {
    await offlineDb.syncQueue.delete(id);
  }

  /**
   * Elimina ítems completados para no saturar IndexedDB.
   */
  async purgeCompleted(maxAgeMs = 24 * 60 * 60 * 1000): Promise<number> {
    const threshold = Date.now() - maxAgeMs;
    const completedItems = await offlineDb.syncQueue
      .where('status')
      .equals('COMPLETED')
      .filter((item) => item.updatedAt < threshold)
      .primaryKeys();

    if (completedItems.length > 0) {
      await offlineDb.syncQueue.bulkDelete(completedItems);
    }
    return completedItems.length;
  }

  /**
   * Generador seguro de claves de idempotencia UUID v4
   */
  private generateIdempotencyKey(): string {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
      return crypto.randomUUID();
    }
    return `idemp_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
  }
}

export const outboxManager = new OutboxManager();
