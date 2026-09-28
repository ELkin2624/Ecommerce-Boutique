import { useState, useEffect } from 'react';
import { networkMonitor } from './network-monitor';
import { syncEvents } from '../sync/sync-events';
import type { NetworkState } from '../types';

/**
 * Hook reactivo para consultar el estado de conectividad en cualquier componente.
 */
export function useNetworkStatus(): NetworkState & { isFullyConnected: boolean } {
  const [state, setState] = useState<NetworkState>(() => networkMonitor.getState());

  useEffect(() => {
    // Suscribirse a cambios de conectividad
    const unsubscribe = syncEvents.on<NetworkState>('network:change', (newState) => {
      setState(newState);
    });

    // Validar estado inicial al montar
    networkMonitor.checkServerReachable();

    return () => {
      unsubscribe();
    };
  }, []);

  return {
    ...state,
    isFullyConnected: state.isOnline && state.isServerReachable,
  };
}
