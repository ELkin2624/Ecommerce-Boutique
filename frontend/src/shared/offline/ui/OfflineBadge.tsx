import { Wifi, WifiOff, RefreshCw } from 'lucide-react';
import { useNetworkStatus } from '../network/useNetworkStatus';
import { useOfflineSync } from '../hooks/useOfflineSync';

interface OfflineBadgeProps {
  showLabel?: boolean;
  className?: string;
}

/**
 * Indicador visual compacto para la barra de navegación o pie de página.
 */
export function OfflineBadge({ showLabel = true, className = '' }: OfflineBadgeProps) {
  const { isOnline, isServerReachable } = useNetworkStatus();
  const { isSyncing, pendingCount, syncNow } = useOfflineSync();

  const isConnected = isOnline && isServerReachable;

  if (isSyncing) {
    return (
      <div
        className={`inline-flex items-center gap-1.5 rounded-full bg-blue-500/10 px-2.5 py-1 text-xs font-medium text-blue-600 dark:text-blue-400 border border-blue-500/20 ${className}`}
        title="Sincronizando operaciones con el servidor"
      >
        <RefreshCw className="h-3 w-3 animate-spin text-blue-500" />
        {showLabel && <span>Sincronizando...</span>}
      </div>
    );
  }

  if (!isConnected) {
    return (
      <button
        type="button"
        onClick={() => syncNow()}
        className={`inline-flex items-center gap-1.5 rounded-full bg-amber-500/10 px-2.5 py-1 text-xs font-medium text-amber-600 dark:text-amber-400 border border-amber-500/20 transition-colors hover:bg-amber-500/20 ${className}`}
        title={
          pendingCount > 0
            ? `${pendingCount} transacciones guardadas localmente. Haz clic para reintentar sincronización.`
            : 'Modo sin conexión. Datos guardándose localmente.'
        }
      >
        <WifiOff className="h-3 w-3 text-amber-500" />
        {showLabel && (
          <span>
            Offline {pendingCount > 0 ? `(${pendingCount})` : ''}
          </span>
        )}
      </button>
    );
  }

  return (
    <div
      className={`inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2.5 py-1 text-xs font-medium text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 ${className}`}
      title="Conectado y sincronizado en tiempo real"
    >
      <Wifi className="h-3 w-3 text-emerald-500" />
      {showLabel && <span>En línea</span>}
    </div>
  );
}
