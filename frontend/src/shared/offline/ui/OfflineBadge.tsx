import { Wifi, WifiOff, RefreshCw, AlertTriangle } from 'lucide-react';
import { useNetworkStatus } from '../network/useNetworkStatus';
import { useOfflineSync } from '../hooks/useOfflineSync';

interface OfflineBadgeProps {
  showLabel?: boolean;
  className?: string;
  onClick?: () => void;
}

/**
 * Indicador visual compacto para la barra de navegación o pie de página.
 * Soporta estados: Sincronizando, Offline, En Línea y Conflictos ACID detectados.
 */
export function OfflineBadge({
  showLabel = true,
  className = '',
  onClick,
}: OfflineBadgeProps) {
  const { isOnline, isServerReachable } = useNetworkStatus();
  const { isSyncing, pendingCount, failedCount } = useOfflineSync();

  const isConnected = isOnline && isServerReachable;

  // 1. Cuando se pierde la señal / sin conexión
  if (!isConnected) {
    return (
      <button
        type="button"
        onClick={onClick}
        className={`inline-flex items-center gap-1.5 rounded-full bg-amber-500/10 px-2.5 py-1 text-xs font-medium text-amber-600 dark:text-amber-400 border border-amber-500/20 transition-colors ${onClick ? 'cursor-pointer hover:bg-amber-500/20' : ''} ${className}`}
        title={
          pendingCount > 0
            ? `Sin conexión. ${pendingCount} operación(es) guardada(s) localmente; se sincronizarán automáticamente al volver la red.`
            : 'Sin conexión a Internet. Operando con base de datos local.'
        }
      >
        <WifiOff className="h-3 w-3 text-amber-500" />
        {showLabel && (
          <span>
            Offline{pendingCount > 0 ? ` (${pendingCount})` : ''}
          </span>
        )}
      </button>
    );
  }

  // 2. Cuando vuelve la red y se está sincronizando automáticamente
  if (isSyncing) {
    return (
      <div
        className={`inline-flex items-center gap-1.5 rounded-full bg-blue-500/10 px-2.5 py-1 text-xs font-medium text-blue-600 dark:text-blue-400 border border-blue-500/20 ${className}`}
        title="Red restablecida: sincronizando datos automáticamente con la nube..."
      >
        <RefreshCw className="h-3 w-3 animate-spin text-blue-500" />
        {showLabel && <span>Sincronizando...</span>}
      </div>
    );
  }

  // 3. Si hubo una colisión ACID de stock rechazada por el servidor
  if (failedCount > 0 && onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        className={`inline-flex items-center gap-1.5 rounded-full bg-destructive/10 px-2.5 py-1 text-xs font-semibold text-destructive border border-destructive/30 transition-colors hover:bg-destructive/20 animate-pulse ${className}`}
        title={`${failedCount} venta(s) offline rechazada(s) por falta de stock en la nube. Haz clic para revisar.`}
      >
        <AlertTriangle className="h-3 w-3 text-destructive" />
        {showLabel && <span>Conflictos ({failedCount})</span>}
      </button>
    );
  }

  // 4. Estado normal En Línea (limpio, sin mensajes de sincronización manual)
  return (
    <div
      className={`inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2.5 py-1 text-xs font-medium text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 ${className}`}
      title="Conectado en línea en tiempo real"
    >
      <Wifi className="h-3 w-3 text-emerald-500" />
      {showLabel && <span>En línea</span>}
    </div>
  );
}
