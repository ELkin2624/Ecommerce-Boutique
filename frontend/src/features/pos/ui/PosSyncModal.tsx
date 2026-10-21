import {
  X,
  RefreshCw,
  AlertTriangle,
  Clock,
  Trash2,
  RotateCcw,
  CheckCircle2,
  WifiOff,
  ShoppingBag,
} from 'lucide-react';
import { useOfflineSync } from '@/shared/offline';
import { Button } from '@/shared/ui/Button';
import { Badge } from '@/shared/ui/Badge';
import type { OutboxItem } from '@/shared/offline';

interface PosSyncModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function PosSyncModal({ open, onOpenChange }: PosSyncModalProps) {
  const {
    isSyncing,
    pendingCount,
    failedCount,
    failedItems,
    syncNow,
    retryFailedItem,
    discardFailedItem,
  } = useOfflineSync();

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-md p-4 animate-in fade-in duration-150">
      <div className="relative w-full max-w-2xl max-h-[90vh] flex flex-col rounded-2xl border border-border bg-card text-card-foreground shadow-2xl overflow-hidden">
        {/* Cabecera */}
        <div className="flex items-center justify-between p-5 pb-4 border-b shrink-0 bg-muted/20">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <RefreshCw className={`h-5 w-5 ${isSyncing ? 'animate-spin' : ''}`} />
            </div>
            <div>
              <h2 className="text-base font-bold text-foreground flex items-center gap-2">
                Bandeja de Sincronización & Conflictos
                {failedCount > 0 && (
                  <Badge variant="destructive" className="text-[10px] font-bold">
                    {failedCount} {failedCount === 1 ? 'conflicto' : 'conflictos'}
                  </Badge>
                )}
              </h2>
              <p className="text-xs text-muted-foreground">
                Estado de la cola Outbox local y transacciones encoladas en este terminal
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="text-muted-foreground hover:text-foreground p-1.5 rounded-lg hover:bg-muted transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Contenido */}
        <div className="overflow-y-auto flex-1 p-5 space-y-5">
          {/* Tarjeta de Resumen */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div className="rounded-xl border border-border bg-background p-3 flex flex-col">
              <span className="text-[11px] font-medium text-muted-foreground flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5 text-amber-500" /> Pendientes
              </span>
              <span className="text-xl font-bold text-foreground mt-1">
                {pendingCount}
              </span>
            </div>

            <div className="rounded-xl border border-border bg-background p-3 flex flex-col">
              <span className="text-[11px] font-medium text-muted-foreground flex items-center gap-1.5">
                <AlertTriangle className="h-3.5 w-3.5 text-destructive" /> Rechazados (ACID)
              </span>
              <span className="text-xl font-bold text-destructive mt-1">
                {failedCount}
              </span>
            </div>

            <div className="col-span-2 sm:col-span-1 rounded-xl border border-border bg-background p-3 flex flex-col justify-between">
              <span className="text-[11px] font-medium text-muted-foreground">
                Acción Manual
              </span>
              <Button
                size="sm"
                variant="outline"
                disabled={isSyncing}
                onClick={() => syncNow()}
                className="mt-1 w-full gap-1.5 text-xs font-semibold"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                {isSyncing ? 'Sincronizando...' : 'Sincronizar ahora'}
              </Button>
            </div>
          </div>

          {/* Sección de Conflictos / Ventas Rechazadas por el Servidor */}
          {failedCount > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-destructive" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-destructive">
                  Ventas con Conflicto de Negocio (Server Wins)
                </h3>
              </div>

              <div className="space-y-2.5">
                {failedItems.map((item: OutboxItem) => {
                  const payload = item.payload || {};
                  const isOrder = item.entity === 'order';
                  const orderItems = Array.isArray(payload.items) ? payload.items : [];

                  return (
                    <div
                      key={item.id}
                      className="rounded-xl border border-destructive/40 bg-destructive/5 p-4 space-y-3 transition-all"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-2">
                          <div className="h-7 w-7 rounded-lg bg-destructive/15 text-destructive flex items-center justify-center shrink-0">
                            <ShoppingBag className="h-4 w-4" />
                          </div>
                          <div>
                            <p className="text-xs font-bold text-foreground">
                              {isOrder ? 'Venta Mostrador Rechazada' : `Operación ${item.entity}`}
                            </p>
                            <p className="text-[10px] text-muted-foreground font-mono">
                              ID Clave: {item.idempotencyKey.slice(0, 16)}...
                            </p>
                          </div>
                        </div>

                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-destructive/20 text-destructive uppercase">
                          Rechazado por Servidor
                        </span>
                      </div>

                      {/* Motivo del rechazo devuelto por PostgreSQL */}
                      <div className="rounded-lg bg-background/80 border border-destructive/30 p-2.5 text-xs">
                        <span className="font-semibold text-destructive block mb-0.5">
                          Motivo del rechazo:
                        </span>
                        <p className="text-foreground leading-relaxed">
                          {item.lastError ||
                            'Stock insuficiente en la nube. Otra caja o cliente en línea compró la última unidad disponible.'}
                        </p>
                      </div>

                      {/* Detalles del carrito fallido */}
                      {orderItems.length > 0 && (
                        <div className="text-[11px] text-muted-foreground">
                          <span className="font-semibold text-foreground">Prendas en el ticket: </span>
                          {orderItems.map((it: any, idx: number) => (
                            <span key={idx} className="font-mono">
                              {it.quantity}x [{it.variantId.slice(0, 8)}]
                              {idx < orderItems.length - 1 ? ', ' : ''}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Botones de acción para el cajero */}
                      <div className="flex items-center justify-end gap-2 pt-1 border-t border-destructive/20">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => item.id && discardFailedItem(item.id)}
                          className="h-8 gap-1.5 text-xs text-muted-foreground hover:text-destructive"
                          title="Descartar esta venta rechazada de la cola local"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          Descartar de la cola
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => item.id && retryFailedItem(item.id)}
                          className="h-8 gap-1.5 text-xs font-semibold"
                          title="Reintentar envío si el stock fue repuesto"
                        >
                          <RotateCcw className="h-3.5 w-3.5" />
                          Reintentar
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Estado Limpio: Sin conflictos */}
          {failedCount === 0 && pendingCount === 0 && (
            <div className="rounded-xl border border-dashed border-border p-8 text-center space-y-2">
              <CheckCircle2 className="h-8 w-8 text-emerald-500 mx-auto" />
              <p className="text-sm font-bold text-foreground">
                Cola local 100% sincronizada
              </p>
              <p className="text-xs text-muted-foreground max-w-md mx-auto">
                No hay operaciones pendientes ni ventas en conflicto. Todas las transacciones
                realizadas en este terminal están asentadas en la base de datos de la nube.
              </p>
            </div>
          )}

          {/* Estado: Pendientes sin errores */}
          {failedCount === 0 && pendingCount > 0 && (
            <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-4 flex items-start gap-3">
              <WifiOff className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
              <div className="text-xs space-y-1">
                <p className="font-bold text-foreground">
                  {pendingCount} {pendingCount === 1 ? 'operación guardada' : 'operaciones guardadas'} localmente
                </p>
                <p className="text-muted-foreground leading-relaxed">
                  Las ventas se registraron de forma segura en IndexedDB y se transmitirán
                  automáticamente en cuanto el navegador detecte conexión a internet.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Pie */}
        <div className="p-4 border-t bg-muted/20 flex items-center justify-between text-xs text-muted-foreground shrink-0">
          <span>Garantía ACID & Idempotencia activa</span>
          <Button size="sm" variant="outline" onClick={() => onOpenChange(false)}>
            Cerrar
          </Button>
        </div>
      </div>
    </div>
  );
}
