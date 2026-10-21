import { apiClient } from '@/shared/api/axios-client';
import { queryClient } from '@/app/providers/QueryProvider';
import { outboxManager } from '../outbox/outbox-manager';
import { conflictResolver } from './conflict-resolver';
import { syncEvents } from './sync-events';
import { offlineDb } from '../db/app-db';
import type { OutboxItem, SyncCycleResult, SyncItemResult } from '../types';

/**
 * Motor central de sincronización en segundo plano.
 * Procesa la cola de mutaciones offline secuencialmente con control de concurrencia,
 * idempotencia y tolerancia a fallos transitorios.
 */
export class OfflineSyncEngine {
  private isSyncing = false;
  private syncTimeoutRef: any = null;

  /**
   * Indica si hay una sincronización en ejecución.
   */
  get active(): boolean {
    return this.isSyncing;
  }

  /**
   * Dispara un ciclo de sincronización inmediato.
   */
  async syncNow(): Promise<SyncCycleResult | null> {
    if (this.isSyncing) {
      return null;
    }

    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      return null;
    }

    const pendingItems = await outboxManager.getPending();
    const total = pendingItems.length;

    if (total === 0) {
      return null;
    }

    this.isSyncing = true;
    const startedAt = Date.now();
    syncEvents.emit('sync:start', { startedAt });

    const results: SyncItemResult[] = [];
    let succeeded = 0;
    let failed = 0;
    let conflicts = 0;

    try {
      for (let i = 0; i < total; i++) {
        const item = pendingItems[i];

        // Verificar si se perdió la red en medio del procesamiento
        if (typeof navigator !== 'undefined' && !navigator.onLine) {
          console.warn('[SyncEngine] Conexión perdida durante el ciclo de sincronización.');
          break;
        }

        syncEvents.emit('sync:progress', {
          processed: i + 1,
          total,
          currentItem: item,
        });

        const itemResult = await this.processItem(item);
        results.push(itemResult);

        if (itemResult.status === 'SUCCESS') succeeded++;
        else if (itemResult.status === 'CONFLICT') conflicts++;
        else failed++;
      }

      // Limpieza de ítems antiguos completados para no degradar memoria
      await outboxManager.purgeCompleted();
      await offlineDb.purgeExpiredCache();

      const finalResult: SyncCycleResult = {
        totalProcessed: results.length,
        succeeded,
        failed,
        conflicts,
        startedAt,
        completedAt: Date.now(),
        items: results,
      };

      if (succeeded > 0 || conflicts > 0) {
        queryClient.invalidateQueries();
      }

      syncEvents.emit('sync:complete', finalResult);
      return finalResult;
    } catch (err: any) {
      console.error('[SyncEngine] Error fatal en ciclo de sincronización:', err);
      syncEvents.emit('sync:error', { error: err.message || 'Error desconocido' });
      return null;
    } finally {
      this.isSyncing = false;
    }
  }

  /**
   * Procesa un ítem individual de la cola Outbox.
   */
  private async processItem(item: OutboxItem): Promise<SyncItemResult> {
    if (!item.id) {
      return {
        idempotencyKey: item.idempotencyKey,
        entity: item.entity,
        action: item.action,
        status: 'FAILED',
        error: 'Ítem sin identificador de cola',
      };
    }

    await outboxManager.markSyncing(item.id);

    try {
      const response = await apiClient.request({
        url: item.endpoint,
        method: item.method,
        data: item.payload,
        headers: {
          ...item.headers,
          'X-Idempotency-Key': item.idempotencyKey,
          'X-Offline-Synced': 'true',
        },
      });

      // Operación exitosa en el servidor
      await outboxManager.markCompleted(item.id);

      // Si la operación fue crear o actualizar una entidad local, actualizar la BD local
      await this.reconcileLocalEntity(item, response.data);

      return {
        id: item.id,
        idempotencyKey: item.idempotencyKey,
        entity: item.entity,
        action: item.action,
        status: 'SUCCESS',
        serverData: response.data,
      };
    } catch (err: any) {
      const status = err.response?.status || 0;
      const errorData = err.response?.data;

      // Si es un error de conectividad (offline durante el envío)
      if (status === 0 || err.code === 'ERR_NETWORK') {
        await outboxManager.markFailed(item.id, 'Error de conexión de red', false);
        return {
          id: item.id,
          idempotencyKey: item.idempotencyKey,
          entity: item.entity,
          action: item.action,
          status: 'FAILED',
          error: 'Error de red. Pendiente de reintento.',
        };
      }

      // Evaluar conflicto
      const resolution = conflictResolver.resolve({
        outboxItem: item,
        serverStatus: status,
        serverErrorResponse: errorData,
      });

      const isPermanent = !resolution.shouldRetry;
      await outboxManager.markFailed(item.id, resolution.userMessage, isPermanent);

      return {
        id: item.id,
        idempotencyKey: item.idempotencyKey,
        entity: item.entity,
        action: item.action,
        status: resolution.strategy === 'SERVER_WINS' ? 'CONFLICT' : 'FAILED',
        error: resolution.userMessage,
      };
    }
  }

  /**
   * Reconcilia la entidad local con los datos definitivos devueltos por el servidor.
   */
  private async reconcileLocalEntity(item: OutboxItem, serverData: any): Promise<void> {
    if (!serverData) return;

    try {
      if (item.entity === 'product' && serverData.id) {
        await offlineDb.products.put({
          ...serverData,
          isLocalOnly: false,
          syncedAt: Date.now(),
          updatedAt: Date.now(),
        });
      } else if (item.entity === 'order' && serverData.id) {
        // Si teníamos un pedido guardado con un ID temporal local, limpiarlo o actualizarlo
        if (item.entityId && item.entityId !== serverData.id) {
          await offlineDb.orders.delete(item.entityId);
        }
        await offlineDb.orders.put({
          ...serverData,
          isLocalOnly: false,
          syncedAt: Date.now(),
          updatedAt: Date.now(),
        });
      }
    } catch (err) {
      console.warn('[SyncEngine] Error reconciliando entidad local:', err);
    }
  }

  /**
   * Programa una sincronización con debounce para agrupar múltiples mutaciones seguidas
   */
  scheduleSync(delayMs = 1500): void {
    if (this.syncTimeoutRef) {
      clearTimeout(this.syncTimeoutRef);
    }
    this.syncTimeoutRef = setTimeout(() => {
      this.syncNow();
    }, delayMs);
  }
}

export const syncEngine = new OfflineSyncEngine();
