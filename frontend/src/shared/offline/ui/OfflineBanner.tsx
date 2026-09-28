import { useState } from 'react';
import { WifiOff, RefreshCw, CheckCircle2, AlertTriangle, X } from 'lucide-react';
import { useNetworkStatus } from '../network/useNetworkStatus';
import { useOfflineSync } from '../hooks/useOfflineSync';

/**
 * Banner flotante inteligente que informa sobre el estado de conectividad,
 * progreso de sincronización y mutaciones locales pendientes.
 */
export function OfflineBanner() {
  const { isOnline, isServerReachable } = useNetworkStatus();
  const { isSyncing, pendingCount, progress, syncNow } = useOfflineSync();
  const [dismissed, setDismissed] = useState(false);

  // Si todo está online y no hay operaciones pendientes ni sincronización, no mostrar nada
  const isHealthy = isOnline && isServerReachable && pendingCount === 0 && !isSyncing;

  if (isHealthy || dismissed) {
    return null;
  }

  return (
    <aside 
      aria-label="Notificación de conectividad y sincronización"
      className="fixed bottom-4 right-4 z-50 max-w-md w-[calc(100vw-2rem)] transition-all duration-300 ease-out"
    >
      <div
        className={`rounded-2xl border p-4 shadow-xl backdrop-blur-md transition-all ${
          !isOnline || !isServerReachable
            ? 'bg-amber-950/90 border-amber-600/40 text-amber-100 shadow-amber-950/20'
            : isSyncing
            ? 'bg-blue-950/90 border-blue-600/40 text-blue-100 shadow-blue-950/20'
            : 'bg-emerald-950/90 border-emerald-600/40 text-emerald-100 shadow-emerald-950/20'
        }`}
      >
        <div className="flex items-start gap-3">
          {/* Icono de Estado */}
          <div className="mt-0.5 shrink-0">
            {!isOnline || !isServerReachable ? (
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-500/20 text-amber-400">
                <WifiOff className="h-4 w-4 animate-pulse" />
              </div>
            ) : isSyncing ? (
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-500/20 text-blue-400">
                <RefreshCw className="h-4 w-4 animate-spin" />
              </div>
            ) : (
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-400">
                <CheckCircle2 className="h-4 w-4" />
              </div>
            )}
          </div>

          {/* Contenido Textual */}
          <div className="flex-1 min-w-0">
            <h4 className="text-sm font-semibold tracking-tight">
              {!isOnline
                ? 'Modo Sin Conexión (Offline)'
                : !isServerReachable
                ? 'Servidor No Disponible'
                : isSyncing
                ? 'Sincronizando Cambios...'
                : 'Pendiente de Sincronización'}
            </h4>

            <p className="mt-1 text-xs text-stone-300 leading-relaxed">
              {!isOnline || !isServerReachable
                ? `Puedes seguir operando normalmente. ${
                    pendingCount > 0
                      ? `Tienes ${pendingCount} cambio(s) guardados localmente que se subirán automáticamente al volver la red.`
                      : 'Tus acciones se guardarán de forma segura en este dispositivo.'
                  }`
                : isSyncing
                ? progress
                  ? `Subiendo ${progress.processed} de ${progress.total} transacciones...`
                  : 'Transmitiendo registros locales hacia la base central...'
                : `Hay ${pendingCount} operación(es) local(es) en espera de sincronización.`}
            </p>

            {/* Acciones */}
            <div className="mt-3 flex items-center gap-2">
              {isOnline && isServerReachable && pendingCount > 0 && !isSyncing && (
                <button
                  type="button"
                  onClick={() => syncNow()}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-500/20 px-3 py-1.5 text-xs font-medium text-emerald-300 transition-colors hover:bg-emerald-500/30 border border-emerald-500/30"
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                  Sincronizar ahora
                </button>
              )}

              {(!isOnline || !isServerReachable) && (
                <span className="inline-flex items-center gap-1 text-[11px] text-amber-300/80">
                  <AlertTriangle className="h-3 w-3" />
                  Base de datos local activa
                </span>
              )}
            </div>
          </div>

          {/* Botón Cerrar */}
          <button
            type="button"
            onClick={() => setDismissed(true)}
            className="shrink-0 rounded-lg p-1 text-stone-400 transition-colors hover:bg-white/10 hover:text-stone-200"
            title="Cerrar notificación"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}
