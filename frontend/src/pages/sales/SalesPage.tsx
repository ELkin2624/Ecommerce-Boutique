import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ReceiptText, Eye } from 'lucide-react';
import { apiClient } from '@/shared/api/axios-client';
import { queryKeys } from '@/shared/api/query-keys';
import { useAuthStore } from '@/app/store/auth.store';
import type { Order } from '@/shared/types/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/Card';
import { Badge } from '@/shared/ui/Badge';
import { Button } from '@/shared/ui/Button';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/shared/ui/Table';
import { ReceiptModal } from '@/features/pos/ui/ReceiptModal';
import { formatCurrency, formatDate } from '@/shared/lib/utils';

export function SalesPage() {
  const { activeBranchId, activeBranchName } = useAuthStore();
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  const { data: ordersData, isLoading } = useQuery<{ items: Order[]; meta: any }>({
    queryKey: queryKeys.orders.list({ branchId: activeBranchId || undefined }),
    queryFn: async () => {
      const res = await apiClient.get('/orders', {
        params: { branchId: activeBranchId || undefined, limit: 50 },
      });
      return res.data;
    },
  });

  const orders = Array.isArray(ordersData) ? ordersData : ordersData?.items || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Historial de Ventas</h1>
          <p className="text-xs text-muted-foreground">
            Registro de pedidos canal digital (ONLINE) y mostrador (IN_STORE) en <span className="font-semibold text-foreground">{activeBranchName || 'General'}</span>
          </p>
        </div>
      </div>

      <Card className="shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <ReceiptText className="h-4 w-4 text-primary" />
            <span>Transacciones Realizadas ({orders.length})</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="py-12 text-center text-sm text-muted-foreground">
              Cargando historial de ventas...
            </div>
          ) : orders.length === 0 ? (
            <div className="py-12 text-center text-sm text-muted-foreground">
              No hay ventas registradas aún.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fecha / Hora</TableHead>
                  <TableHead>N° Pedido</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Canal</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead className="text-right">Comprobante</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orders.map((o) => (
                  <TableRow key={o.id}>
                    <TableCell className="text-xs font-mono text-muted-foreground">
                      {formatDate(o.createdAt)}
                    </TableCell>
                    <TableCell className="font-mono text-xs font-bold text-primary">
                      {o.id.substring(0, 8)}...
                    </TableCell>
                    <TableCell className="text-xs font-medium">
                      {o.client || 'Venta Presencial'}
                    </TableCell>
                    <TableCell>
                      <Badge variant={o.type === 'IN_STORE' ? 'secondary' : 'default'} className="text-[10px]">
                        {o.type}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="success" className="text-[10px]">
                        {o.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-bold text-sm text-emerald-600">
                      {formatCurrency(o.total)}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 text-xs gap-1"
                        onClick={async () => {
                          try {
                            const res = await apiClient.get(`/orders/${o.id}`);
                            setSelectedOrder(res.data);
                          } catch {
                            setSelectedOrder(o);
                          }
                        }}
                      >
                        <Eye className="h-3.5 w-3.5" />
                        <span>Ver</span>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <ReceiptModal
        open={Boolean(selectedOrder)}
        onOpenChange={(open) => !open && setSelectedOrder(null)}
        order={selectedOrder}
      />
    </div>
  );
}
