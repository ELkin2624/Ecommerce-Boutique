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
   * Encola una nueva mutación con clave de idempotencia única.
   */
  async enqueue<T = any>(options: EnqueueOptions<T>): Promise<OutboxItem<T>> {
    const idempotencyKey = this.generateIdempotencyKey();
    const now = Date.now();

    const item: OutboxItem<T> = {
      idempotencyKey,
      entity: options.entity,
      action: options.action,
      entityId: options.entityId,
      endpoint: options.endpoint,
      method: options.method,
      payload: options.payload,
      headers: options.headers || {},
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
   * Obtiene las mutaciones pendientes de sincronizar en orden cronológico (FIFO).
   */
  async getPending(): Promise<OutboxItem[]> {
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
    return offlineDb.syncQueue
      .where('status')
      .anyOf(['PENDING', 'FAILED'])
      .filter((item) => item.retryCount < item.maxRetries)
      .count();
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
