import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Boxes, History, SlidersHorizontal, ArrowRightLeft } from 'lucide-react';
import { apiClient } from '@/shared/api/axios-client';
import { queryKeys } from '@/shared/api/query-keys';
import { useAuthStore } from '@/app/store/auth.store';
import type { InventoryStock, InventoryMovement } from '@/shared/types/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/shared/ui/Card';
import { Button } from '@/shared/ui/Button';
import { Badge } from '@/shared/ui/Badge';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/shared/ui/Table';
import { StockBadge } from '@/entities/inventory/ui/StockBadge';
import { StockAdjustDialog } from '@/features/inventory/ui/StockAdjustDialog';
import { StockTransferDialog } from '@/features/inventory/ui/StockTransferDialog';
import { Can } from '@/shared/lib/rbac/Can';
import { formatDate } from '@/shared/lib/utils';

export function InventoryPage() {
  const { activeBranchId, activeBranchName } = useAuthStore();
  const [activeTab, setActiveTab] = useState<'stocks' | 'movements'>('stocks');

  // Diálogos
  const [adjustTarget, setAdjustTarget] = useState<InventoryStock | null>(null);
  const [transferTarget, setTransferTarget] = useState<InventoryStock | null>(null);

  // 1. Consultar Stock
  const {
    data: rawStockData,
    isLoading: isStockLoading,
    refetch: refetchStocks,
  } = useQuery<any>({
    queryKey: queryKeys.inventory.stocks(activeBranchId || undefined),
    queryFn: async () => {
      const res = await apiClient.get('/inventory/stock', {
        params: activeBranchId ? { branchId: activeBranchId } : {},
      });
      return res.data;
    },
  });

  const stockItems: InventoryStock[] = Array.isArray(rawStockData)
    ? rawStockData
    : rawStockData?.items || [];

  // 2. Consultar Movimientos Kardex
  const {
    data: movementsData,
    isLoading: isMovementsLoading,
    refetch: refetchMovements,
  } = useQuery<{ items: InventoryMovement[]; meta: any }>({
    queryKey: queryKeys.inventory.movements(),
    queryFn: async () => {
      const res = await apiClient.get('/inventory/movements', { params: { limit: 50 } });
      return res.data;
    },
    enabled: activeTab === 'movements',
  });

  // 3. Consultar ubicaciones para el diálogo de transferencias
  const { data: allLocations = [] } = useQuery<any[]>({
    queryKey: queryKeys.branches.locations(),
    queryFn: async () => {
      const res = await apiClient.get('/inventory/locations');
      return res.data;
    },
  });

  const movements = movementsData?.items || [];

  return (
    <div className="space-y-6">
      {/* Header & Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Inventario & Kardex</h1>
          <p className="text-xs text-muted-foreground">
            Control de existencias físicas en <span className="font-semibold text-foreground">{activeBranchName || 'General'}</span> y auditoría inmutable
          </p>
        </div>

        {/* Tab Buttons */}
        <div className="flex items-center gap-1 bg-muted p-1 rounded-lg border">
          <button
            onClick={() => setActiveTab('stocks')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${
              activeTab === 'stocks'
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Boxes className="h-4 w-4" />
            <span>Existencias Físicas ({stockItems.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('movements')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${
              activeTab === 'movements'
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <History className="h-4 w-4" />
            <span>Auditoría Kardex</span>
          </button>
        </div>
      </div>

      {/* TAB 1: Existencias Físicas */}
      {activeTab === 'stocks' && (
        <Card className="shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Stock por Ubicación y Prenda</CardTitle>
            <CardDescription className="text-xs">
              Valores en tiempo real. Cualquier ajuste o transferencia impacta el Kardex.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isStockLoading ? (
              <div className="py-12 text-center text-sm text-muted-foreground">
                Cargando existencias de inventario...
              </div>
            ) : stockItems.length === 0 ? (
              <div className="py-12 text-center text-sm text-muted-foreground">
                No hay stock registrado en esta sucursal o ubicación.
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Prenda / Modelo</TableHead>
                    <TableHead>SKU</TableHead>
                    <TableHead>Talla / Color</TableHead>
                    <TableHead>Ubicación Física</TableHead>
                    <TableHead>Estado Stock</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {stockItems.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-semibold text-foreground">
                        {item.variant.product.name}
                      </TableCell>
                      <TableCell className="font-mono text-xs font-bold text-primary">
                        {item.variant.sku}
                      </TableCell>
                      <TableCell className="text-xs">
                        {item.variant.size} • {item.variant.color}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs">
                          {item.location.branch.name} - {item.location.name} ({item.location.type})
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <StockBadge quantity={item.quantity} minStock={item.minStock} />
                      </TableCell>
                      <TableCell className="text-right space-x-2">
                        <Can permission="INVENTORY:TRANSFER">
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-7 text-xs gap-1"
                            onClick={() => setAdjustTarget(item)}
                          >
                            <SlidersHorizontal className="h-3 w-3" />
                            <span>Ajustar</span>
                          </Button>
                        </Can>
                        <Can permission="INVENTORY:TRANSFER">
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-7 text-xs gap-1"
                            disabled={item.quantity <= 0}
                            onClick={() => setTransferTarget(item)}
                          >
                            <ArrowRightLeft className="h-3 w-3" />
                            <span>Trasladar</span>
                          </Button>
                        </Can>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      )}

      {/* TAB 2: Movimientos Inmutables Kardex */}
      {activeTab === 'movements' && (
        <Card className="shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Historial Inmutable de Movimientos (Kardex)</CardTitle>
            <CardDescription className="text-xs">
              Registro estricto de auditoría con tipo de operación, usuario responsable y justificación
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isMovementsLoading ? (
              <div className="py-12 text-center text-sm text-muted-foreground">
                Cargando movimientos de Kardex...
              </div>
            ) : movements.length === 0 ? (
              <div className="py-12 text-center text-sm text-muted-foreground">
                No hay movimientos registrados en el sistema aún.
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Fecha / Hora</TableHead>
                    <TableHead>Tipo Operación</TableHead>
                    <TableHead>SKU</TableHead>
                    <TableHead>Cant.</TableHead>
                    <TableHead>Origen & Destino</TableHead>
                    <TableHead>Responsable</TableHead>
                    <TableHead>Motivo</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {movements.map((mov: any) => (
                    <TableRow key={mov.id}>
                      <TableCell className="text-xs font-mono text-muted-foreground">
                        {formatDate(mov.createdAt)}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            mov.type === 'SALE'
                              ? 'success'
                              : mov.type === 'ADJUSTMENT'
                              ? 'warning'
                              : mov.type.startsWith('RESERVATION')
                              ? 'info'
                              : 'secondary'
                          }
                          className="text-[11px]"
                        >
                          {mov.type}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-mono text-xs font-bold">
                        {mov.sku || mov.variant?.sku}
                      </TableCell>
                      <TableCell className="font-bold text-sm">
                        {mov.quantity}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {mov.fromLocation || '—'} ➔ {mov.toLocation || '—'}
                      </TableCell>
                      <TableCell className="text-xs font-medium">
                        {mov.performedBy || `${mov.user?.firstName || ''} ${mov.user?.lastName || ''}`}
                      </TableCell>
                      <TableCell className="text-xs italic text-muted-foreground max-w-xs truncate">
                        {mov.reason || 'Sin observación'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      )}

      {/* Dialogs */}
      {adjustTarget && (
        <StockAdjustDialog
          open={Boolean(adjustTarget)}
          onOpenChange={(open) => !open && setAdjustTarget(null)}
          variantId={adjustTarget.variantId}
          variantSku={adjustTarget.variant.sku}
          locationId={adjustTarget.locationId}
          locationName={`${adjustTarget.location.branch.name} - ${adjustTarget.location.name}`}
          currentQuantity={adjustTarget.quantity}
          onSuccess={() => {
            refetchStocks();
            refetchMovements();
          }}
        />
      )}

      {transferTarget && (
        <StockTransferDialog
          open={Boolean(transferTarget)}
          onOpenChange={(open) => !open && setTransferTarget(null)}
          variantId={transferTarget.variantId}
          variantSku={transferTarget.variant.sku}
          fromLocationId={transferTarget.locationId}
          fromLocationName={`${transferTarget.location.branch.name} - ${transferTarget.location.name}`}
          maxQuantity={transferTarget.quantity}
          locations={allLocations}
          onSuccess={() => {
            refetchStocks();
            refetchMovements();
          }}
        />
      )}
    </div>
  );
}
