import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  CalendarCheck,
  Clock,
  User,
  CheckCircle2,
  XCircle,
  PackageCheck,
  Sparkles,
} from 'lucide-react';
import { apiClient } from '@/shared/api/axios-client';
import { queryKeys } from '@/shared/api/query-keys';
import { useAuthStore } from '@/app/store/auth.store';
import type { ReservationStatus } from '@/shared/types/api';
import { Card, CardContent, CardHeader } from '@/shared/ui/Card';
import { Button } from '@/shared/ui/Button';
import { Badge } from '@/shared/ui/Badge';
import { toast } from '@/shared/ui/Toast';
import { Can } from '@/shared/lib/rbac/Can';
import { formatDate } from '@/shared/lib/utils';

export function ReservationsPage() {
  const { activeBranchId, activeBranchName } = useAuthStore();
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');

  const { data: rawReservationsData, isLoading, refetch } = useQuery<any>({
    queryKey: queryKeys.reservations.queue(activeBranchId || undefined, selectedStatus),
    queryFn: async () => {
      const res = await apiClient.get('/reservations', {
        params: {
          branchId: activeBranchId || undefined,
          status: selectedStatus !== 'ALL' ? selectedStatus : undefined,
        },
      });
      return res.data;
    },
    refetchInterval: 15000, // Polling ligero cada 15s para cola de probadores
  });

  const reservations: any[] = Array.isArray(rawReservationsData)
    ? rawReservationsData
    : rawReservationsData?.items || [];

  const handleUpdateStatus = async (id: string, newStatus: ReservationStatus) => {
    try {
      await apiClient.patch(`/reservations/${id}/status`, { status: newStatus });
      toast.success('Estado Actualizado', `La reserva cambió a estado ${newStatus}`);
      refetch();
    } catch (err: any) {
      toast.error('Error al actualizar reserva', err.message);
    }
  };

  const getStatusBadge = (status: ReservationStatus) => {
    switch (status) {
      case 'PENDING':
        return <Badge variant="warning">Pendiente</Badge>;
      case 'CONFIRMED':
        return <Badge variant="secondary">Confirmada</Badge>;
      case 'PREPARED':
        return <Badge variant="info">Prendas en Probador</Badge>;
      case 'READY':
        return <Badge variant="success">Listo para Probar</Badge>;
      case 'COMPLETED':
        return <Badge variant="default">Completada / Comprada</Badge>;
      case 'CANCELLED':
        return <Badge variant="destructive">Cancelada</Badge>;
      case 'EXPIRED':
        return <Badge variant="destructive">Expirada (Stock Liberado)</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Status Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Cola de Reservas en Probador</h1>
          <p className="text-xs text-muted-foreground">
            Gestión física en tiempo real para <span className="font-semibold text-foreground">{activeBranchName || 'General'}</span>
          </p>
        </div>

        {/* Filter Badges */}
        <div className="flex flex-wrap gap-1.5 bg-muted p-1 rounded-lg border">
          {['ALL', 'PENDING', 'CONFIRMED', 'PREPARED', 'READY', 'COMPLETED', 'CANCELLED', 'EXPIRED'].map(
            (st) => (
              <button
                key={st}
                onClick={() => setSelectedStatus(st)}
                className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-colors ${
                  selectedStatus === st
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {st === 'ALL' ? 'Todas' : st}
              </button>
            ),
          )}
        </div>
      </div>

      {/* Reservation Queue Cards */}
      {isLoading ? (
        <div className="py-16 text-center text-sm text-muted-foreground">
          Cargando cola de probadores...
        </div>
      ) : reservations.length === 0 ? (
        <Card className="py-16 text-center shadow-sm">
          <CalendarCheck className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
          <h3 className="font-semibold text-base">No hay reservas en esta categoría</h3>
          <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
            Las reservas solicitadas por los clientes en la aplicación móvil aparecerán aquí automáticamente.
          </p>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {reservations.map((r) => {
            const isTerminal = ['COMPLETED', 'CANCELLED', 'EXPIRED'].includes(r.status);

            return (
              <Card
                key={r.id}
                className={`flex flex-col justify-between shadow-sm transition-all ${
                  r.status === 'READY'
                    ? 'border-emerald-500/50 bg-emerald-50/20 dark:bg-emerald-950/10'
                    : ''
                }`}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
                        <User className="h-3.5 w-3.5" />
                        <span className="font-bold text-foreground">
                          {r.client || (r.user ? `${r.user.firstName} ${r.user.lastName}` : 'Cliente')}
                        </span>
                      </div>
                      <span className="text-[11px] text-muted-foreground block font-mono">
                        {r.email || r.user?.email || ''} {(r.phone || r.user?.phone) ? `• ${r.phone || r.user?.phone}` : ''}
                      </span>
                    </div>
                    {getStatusBadge(r.status)}
                  </div>
                </CardHeader>

                <CardContent className="space-y-3 flex-1">
                  {/* Items list */}
                  <div className="rounded-md border bg-muted/40 p-2.5 space-y-1.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
                      Prendas Apartadas ({r.items?.length || 0})
                    </span>
                    {r.items?.map((it: any, idx: number) => (
                      <div key={idx} className="text-xs flex items-center justify-between">
                        <span className="font-medium truncate max-w-[180px]">
                          {it.productName || it.variant?.product?.name || 'Prenda'}
                        </span>
                        <span className="font-mono text-[11px] text-muted-foreground">
                          {it.size || it.variant?.size || ''} • {it.color || it.variant?.color || ''} (x{it.quantity})
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Expiration Info */}
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Clock className="h-3.5 w-3.5 text-amber-600" />
                    <span>Tolerancia hasta: {formatDate(r.expiresAt)}</span>
                  </div>

                  {r.notes && (
                    <p className="text-xs italic text-muted-foreground bg-muted/30 p-2 rounded">
                      "{r.notes}"
                    </p>
                  )}
                </CardContent>

                {/* State Transition Actions */}
                <div className="p-4 pt-0 border-t mt-3 flex flex-wrap items-center justify-end gap-2">
                  <Can permission="RESERVATION:UPDATE_STATUS">
                    {!isTerminal && (
                      <>
                        {r.status === 'PENDING' && (
                          <Button
                            size="sm"
                            className="h-8 text-xs gap-1"
                            onClick={() => handleUpdateStatus(r.id, 'CONFIRMED')}
                          >
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            <span>Confirmar</span>
                          </Button>
                        )}

                        {r.status === 'CONFIRMED' && (
                          <Button
                            size="sm"
                            className="h-8 text-xs gap-1"
                            onClick={() => handleUpdateStatus(r.id, 'PREPARED')}
                          >
                            <PackageCheck className="h-3.5 w-3.5" />
                            <span>Prendas en Probador</span>
                          </Button>
                        )}

                        {r.status === 'PREPARED' && (
                          <Button
                            size="sm"
                            variant="success"
                            className="h-8 text-xs gap-1"
                            onClick={() => handleUpdateStatus(r.id, 'READY')}
                          >
                            <Sparkles className="h-3.5 w-3.5" />
                            <span>Avisar Cliente Listo</span>
                          </Button>
                        )}

                        {r.status === 'READY' && (
                          <Button
                            size="sm"
                            variant="default"
                            className="h-8 text-xs gap-1 bg-emerald-600 hover:bg-emerald-700"
                            onClick={() => handleUpdateStatus(r.id, 'COMPLETED')}
                          >
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            <span>Venta Concluida</span>
                          </Button>
                        )}

                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8 text-xs text-destructive hover:bg-destructive/10"
                          onClick={() => handleUpdateStatus(r.id, 'CANCELLED')}
                        >
                          <XCircle className="h-3.5 w-3.5" />
                          <span>Cancelar</span>
                        </Button>
                      </>
                    )}
                  </Can>
                  {isTerminal && (
                    <span className="text-[11px] text-muted-foreground italic">
                      Operación finalizada
                    </span>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
