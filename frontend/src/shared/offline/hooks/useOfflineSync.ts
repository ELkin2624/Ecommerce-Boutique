import { useState, useEffect, useCallback } from 'react';
import { syncEngine } from '../sync/sync-engine';
import { outboxManager } from '../outbox/outbox-manager';
import { syncEvents, type SyncProgressPayload } from '../sync/sync-events';
import type { SyncCycleResult, OutboxItem } from '../types';

/**
 * Hook para monitorear el estado del motor de sincronización, cantidad de operaciones pendientes
 * y resolución de colisiones o fallos en el Outbox.
 */
export function useOfflineSync() {
  const [isSyncing, setIsSyncing] = useState(syncEngine.active);
  const [pendingCount, setPendingCount] = useState(0);
  const [failedCount, setFailedCount] = useState(0);
  const [failedItems, setFailedItems] = useState<OutboxItem[]>([]);
  const [progress, setProgress] = useState<SyncProgressPayload | null>(null);
  const [lastResult, setLastResult] = useState<SyncCycleResult | null>(null);

  const refreshQueueStatus = useCallback(async () => {
    try {
      const [pending, failed, items] = await Promise.all([
        outboxManager.getPendingCount(),
        outboxManager.getFailedCount(),
        outboxManager.getFailed(),
      ]);
      setPendingCount(pending);
      setFailedCount(failed);
      setFailedItems(items);

      // Si estamos en línea y hay operaciones pendientes, sincronizar automáticamente
      if (
        pending > 0 &&
        typeof navigator !== 'undefined' &&
        navigator.onLine &&
        !syncEngine.active
      ) {
        syncEngine.scheduleSync(250);
      }
    } catch {
      // Ignorar si la base aún no ha inicializado
    }
  }, []);

  useEffect(() => {
    refreshQueueStatus();

    const unsubStart = syncEvents.on('sync:start', () => {
      setIsSyncing(true);
      setProgress(null);
    });

    const unsubProgress = syncEvents.on<SyncProgressPayload>('sync:progress', (data) => {
      setProgress(data);
    });

    const unsubComplete = syncEvents.on<SyncCycleResult>('sync:complete', (result) => {
      setIsSyncing(false);
      setProgress(null);
      setLastResult(result);
      refreshQueueStatus();
    });

    const unsubError = syncEvents.on('sync:error', () => {
      setIsSyncing(false);
      setProgress(null);
      refreshQueueStatus();
    });

    return () => {
      unsubStart();
      unsubProgress();
      unsubComplete();
      unsubError();
    };
  }, [refreshQueueStatus]);

  const syncNow = useCallback(async () => {
    return syncEngine.syncNow();
  }, []);

  const retryFailedItem = useCallback(
    async (id: number) => {
      await outboxManager.retryItem(id);
      await refreshQueueStatus();
      syncEngine.scheduleSync(300);
    },
    [refreshQueueStatus],
  );

  const discardFailedItem = useCallback(
    async (id: number) => {
      await outboxManager.removeItem(id);
      await refreshQueueStatus();
    },
    [refreshQueueStatus],
  );

  return {
    isSyncing,
    pendingCount,
    failedCount,
    failedItems,
    progress,
    lastResult,
    syncNow,
    refreshQueueStatus,
    retryFailedItem,
    discardFailedItem,
  };
}
