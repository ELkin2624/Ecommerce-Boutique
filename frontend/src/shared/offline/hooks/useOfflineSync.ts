import { useState, useEffect, useCallback } from 'react';
import { syncEngine } from '../sync/sync-engine';
import { outboxManager } from '../outbox/outbox-manager';
import { syncEvents, type SyncProgressPayload } from '../sync/sync-events';
import type { SyncCycleResult } from '../types';

/**
 * Hook para monitorear el estado del motor de sincronización y cantidad de operaciones pendientes.
 */
export function useOfflineSync() {
  const [isSyncing, setIsSyncing] = useState(syncEngine.active);
  const [pendingCount, setPendingCount] = useState(0);
  const [progress, setProgress] = useState<SyncProgressPayload | null>(null);
  const [lastResult, setLastResult] = useState<SyncCycleResult | null>(null);

  const refreshPendingCount = useCallback(async () => {
    try {
      const count = await outboxManager.getPendingCount();
      setPendingCount(count);
    } catch {
      // Ignorar si la base aún no ha inicializado
    }
  }, []);

  useEffect(() => {
    refreshPendingCount();

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
      refreshPendingCount();
    });

    const unsubError = syncEvents.on('sync:error', () => {
      setIsSyncing(false);
      setProgress(null);
      refreshPendingCount();
    });

    return () => {
      unsubStart();
      unsubProgress();
      unsubComplete();
      unsubError();
    };
  }, [refreshPendingCount]);

  const syncNow = useCallback(async () => {
    return syncEngine.syncNow();
  }, []);

  return {
    isSyncing,
    pendingCount,
    progress,
    lastResult,
    syncNow,
    refreshPendingCount,
  };
}
