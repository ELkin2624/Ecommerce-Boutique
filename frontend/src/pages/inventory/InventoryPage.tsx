import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Boxes,
  History,
  SlidersHorizontal,
  ArrowRightLeft,
  PlusCircle,
  Globe,
  AlertTriangle,
  Search,
  CheckCircle2,
  PackageX,
} from 'lucide-react';
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
import { CreateMovementDialog } from '@/features/inventory/ui/CreateMovementDialog';
import { Can } from '@/shared/lib/rbac/Can';
import { formatDate } from '@/shared/lib/utils';

export function InventoryPage() {
  const { activeBranchId, activeBranchName } = useAuthStore();

  const [activeTab, setActiveTab] = useState<'stocks' | 'movements'>('stocks');
  const [selectedBranchId, setSelectedBranchId] = useState<string>(activeBranchId || 'ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [lowStockFilter, setLowStockFilter] = useState(false);

  // Diálogos
  const [adjustTarget, setAdjustTarget] = useState<InventoryStock | null>(null);
  const [transferTarget, setTransferTarget] = useState<InventoryStock | null>(null);
  const [isCreateMovementOpen, setIsCreateMovementOpen] = useState(false);

  // 1. Consultar sucursales para el filtro multitienda
  const { data: branches = [] } = useQuery<any[]>({
    queryKey: queryKeys.branches.all,
    queryFn: async () => {
      const res = await apiClient.get('/branches');
      return res.data;
    },
  });

  // 2. Consultar Stock (Global si es 'ALL', o de la sucursal seleccionada)
  const isGlobal = selectedBranchId === 'ALL';
  const {
    data: rawStockData,
    isLoading: isStockLoading,
    refetch: refetchStocks,
  } = useQuery<any>({
    queryKey: ['inventory', 'stocks', selectedBranchId],
    queryFn: async () => {
      const params: any = { limit: 200 };
      if (!isGlobal) {
        params.branchId = selectedBranchId;
      }
      const res = await apiClient.get('/inventory/stock', { params });
      return res.data;
    },
  });

  const allStockItems: InventoryStock[] = Array.isArray(rawStockData)
    ? rawStockData
    : rawStockData?.items || [];

  // Filtrado en cliente por búsqueda y por stock bajo
  const filteredStocks = allStockItems.filter((item) => {
    const prodName = (item.variant?.product?.name || (item as any).productName || '').toLowerCase();
    const sku = (item.variant?.sku || (item as any).sku || '').toLowerCase();
    const matchesSearch = !searchTerm.trim() || prodName.includes(searchTerm.toLowerCase()) || sku.includes(searchTerm.toLowerCase());
    const isLow = item.quantity <= item.minStock;
    if (lowStockFilter && !isLow) return false;
    return matchesSearch;
  });

  // KPIs agregados
  const totalUnits = allStockItems.reduce((acc, it) => acc + (it.quantity || 0), 0);
  const totalLowStock = allStockItems.filter((it) => it.quantity <= it.minStock && it.quantity > 0).length;
  const totalOutOfStock = allStockItems.filter((it) => it.quantity === 0).length;

  // 3. Consultar Movimientos Kardex
  const {
    data: movementsData,
    isLoading: isMovementsLoading,
    refetch: refetchMovements,
  } = useQuery<{ items: InventoryMovement[]; meta: any }>({
    queryKey: queryKeys.inventory.movements(),
    queryFn: async () => {
      const res = await apiClient.get('/inventory/movements', { params: { limit: 100 } });
      return res.data;
    },
    enabled: activeTab === 'movements',
  });

  // 4. Consultar ubicaciones para el diálogo de transferencias
  const { data: allLocations = [] } = useQuery<any[]>({
    queryKey: queryKeys.branches.locations(),
    queryFn: async () => {
      const res = await apiClient.get('/inventory/locations');
      return res.data;
    },
  });

  const movements = movementsData?.items || [];

  const handleMovementSuccess = () => {
    refetchStocks();
    if (activeTab === 'movements') {
      refetchMovements();
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            {isGlobal ? 'Inventario Global Consolidado' : `Inventario — ${branches.find(b => b.id === selectedBranchId)?.name || activeBranchName || 'Sucursal'}`}
          </h1>
          <p className="text-xs text-muted-foreground">
            {isGlobal
              ? 'Supervisión centralizada multitienda de existencias físicas, valorización y alertas de reposición'
              : 'Control de existencias físicas y auditoría inmutable de la sucursal seleccionada'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Botón Registrar Movimiento */}
          <Can permission="INVENTORY:TRANSFER">
            <Button
              onClick={() => setIsCreateMovementOpen(true)}
              size="sm"
              className="gap-1.5 shadow-sm"
            >
              <PlusCircle className="h-4 w-4" />
              <span>Registrar Ingreso / Movimiento</span>
            </Button>
          </Can>

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
              <span>Existencias ({filteredStocks.length})</span>
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
              <span>Kardex Inmutable</span>
            </button>
          </div>
        </div>
      </div>

      {/* KPI Cards de Inventario */}
      <div className="grid gap-3 grid-cols-2 md:grid-cols-4">
        <Card className="shadow-sm">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-muted-foreground">Unidades Totales</p>
              <p className="text-xl font-bold mt-1 text-foreground">{totalUnits} u.</p>
            </div>
            <div className="p-2.5 rounded-lg bg-primary/10 text-primary">
              <Boxes className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-muted-foreground">Variantes Registradas</p>
              <p className="text-xl font-bold mt-1 text-foreground">{allStockItems.length} SKUs</p>
            </div>
            <div className="p-2.5 rounded-lg bg-sky-500/10 text-sky-600">
              <CheckCircle2 className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-muted-foreground">Stock Bajo / Crítico</p>
              <p className="text-xl font-bold mt-1 text-amber-600">{totalLowStock}</p>
            </div>
            <div className="p-2.5 rounded-lg bg-amber-500/10 text-amber-600">
              <AlertTriangle className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-muted-foreground">Agotados (Stock 0)</p>
              <p className="text-xl font-bold mt-1 text-rose-600">{totalOutOfStock}</p>
            </div>
            <div className="p-2.5 rounded-lg bg-rose-500/10 text-rose-600">
              <PackageX className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Controles de Filtro */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-card p-3 rounded-lg border shadow-sm">
        <div className="flex flex-wrap items-center gap-3">
          {/* Selector Multitienda */}
          <div className="flex items-center gap-1.5">
            <Globe className="h-4 w-4 text-muted-foreground" />
            <select
              value={selectedBranchId}
              onChange={(e) => setSelectedBranchId(e.target.value)}
              className="h-8 rounded-md border border-input bg-background px-2.5 text-xs font-medium shadow-sm focus:outline-none focus:ring-1 focus:ring-primary"
            >
              <option value="ALL">🌐 Todas las Sucursales (Global)</option>
              {branches.map((b: any) => (
                <option key={b.id} value={b.id}>
                  {b.name} ({b.city?.name || 'Ciudad'})
                </option>
              ))}
            </select>
          </div>

          {/* Toggle Solo Stock Bajo */}
          <button
            onClick={() => setLowStockFilter(!lowStockFilter)}
            className={`px-2.5 py-1 text-xs rounded-md border transition-colors flex items-center gap-1.5 ${
              lowStockFilter
                ? 'bg-amber-500 text-white border-amber-500 font-semibold'
                : 'bg-background text-muted-foreground hover:text-foreground'
            }`}
          >
            <AlertTriangle className="h-3 w-3" />
            <span>Solo Stock Crítico</span>
          </button>
        </div>

        {/* Búsqueda por SKU o Prenda */}
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
          <input
            type="text"
            placeholder="Buscar por prenda o SKU..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="h-8 w-full rounded-md border border-input bg-background pl-8 pr-3 text-xs shadow-sm focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>
      </div>

      {/* TAB 1: Existencias Físicas */}
      {activeTab === 'stocks' && (
        <Card className="shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Stock por Ubicación y Prenda</CardTitle>
            <CardDescription className="text-xs">
              Valores actualizados en tiempo real. Cualquier ajuste o transferencia impacta el Kardex auditable.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isStockLoading ? (
              <div className="py-12 text-center text-sm text-muted-foreground">
                Cargando existencias de inventario...
              </div>
            ) : filteredStocks.length === 0 ? (
              <div className="py-12 text-center text-sm text-muted-foreground">
                No hay stock registrado con los filtros seleccionados.
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
                  {filteredStocks.map((item) => {
                    const prodName = item.variant?.product?.name || (item as any).productName || 'Prenda';
                    const sku = item.variant?.sku || (item as any).sku || 'SKU-N/A';
                    const size = item.variant?.size || (item as any).size || '';
                    const color = item.variant?.color || (item as any).color || '';
                    const branchName = item.location?.branch?.name || (item as any).branchName || 'Sucursal';
                    const locName = item.location?.name || (item as any).locationName || 'Piso de Venta';
                    const locType = item.location?.type || (item as any).locationType || 'SALES_FLOOR';

                    return (
                      <TableRow key={item.id}>
                        <TableCell className="font-semibold text-foreground">
                          {prodName}
                        </TableCell>
                        <TableCell className="font-mono text-xs font-bold text-primary">
                          {sku}
                        </TableCell>
                        <TableCell className="text-xs">
                          {size} • {color}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-xs">
                            {branchName} - {locName} ({locType === 'WAREHOUSE' ? 'Almacén' : 'Piso de Venta'})
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
                    );
                  })}
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
              Auditoría completa de ingresos por compras, traslados entre sucursales, reservas y salidas de venta
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isMovementsLoading ? (
              <div className="py-12 text-center text-sm text-muted-foreground">
                Cargando movimientos de Kardex...
              </div>
            ) : movements.length === 0 ? (
              <div className="py-12 text-center text-sm text-muted-foreground">
                No se encontraron movimientos registrados en la auditoría.
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Fecha / Hora</TableHead>
                    <TableHead>Prenda / SKU</TableHead>
                    <TableHead>Operación</TableHead>
                    <TableHead>Cantidad</TableHead>
                    <TableHead>Origen / Destino</TableHead>
                    <TableHead>Motivo / Responsable</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {movements.map((m) => (
                    <TableRow key={m.id}>
                      <TableCell className="text-xs font-mono text-muted-foreground">
                        {formatDate(m.createdAt)}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-semibold text-xs text-foreground">
                            {(m as any).productName || m.variant?.product?.name || 'Prenda'}
                          </span>
                          <span className="font-mono text-[11px] text-primary">
                            {(m as any).sku || m.variant?.sku}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            m.type === 'PURCHASE_RECEIPT'
                              ? 'success'
                              : m.type === 'SALE'
                              ? 'default'
                              : m.type === 'RESERVATION_HOLD'
                              ? 'warning'
                              : 'secondary'
                          }
                          className="text-[10px]"
                        >
                          {m.type}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-bold font-mono text-xs">
                        {['SALE', 'RESERVATION_HOLD'].includes(m.type) ? `-${m.quantity}` : `+${m.quantity}`}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {(m as any).fromLocation ? `${typeof (m as any).fromLocation === 'string' ? (m as any).fromLocation : (m as any).fromLocation?.name} → ` : ''}
                        <span className="font-semibold text-foreground">
                          {typeof (m as any).toLocation === 'string' ? (m as any).toLocation : (m as any).toLocation?.name || 'Despachado'}
                        </span>
                      </TableCell>
                      <TableCell className="text-xs">
                        <div className="flex flex-col">
                          <span className="text-foreground line-clamp-1">
                            {m.reason || 'Sin observación'}
                          </span>
                          <span className="text-[10px] text-muted-foreground">
                            Por: {(m as any).performedBy || (m.user ? `${m.user.firstName} ${m.user.lastName}` : 'Sistema')}
                          </span>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      )}

      {/* Diálogos */}
      {adjustTarget && (
        <StockAdjustDialog
          open={Boolean(adjustTarget)}
          onOpenChange={(open) => !open && setAdjustTarget(null)}
          variantId={adjustTarget.variantId}
          variantSku={adjustTarget.variant?.sku || (adjustTarget as any).sku || ''}
          locationId={adjustTarget.locationId}
          locationName={adjustTarget.location?.name || (adjustTarget as any).locationName || ''}
          currentQuantity={adjustTarget.quantity}
          onSuccess={handleMovementSuccess}
        />
      )}

      {transferTarget && (
        <StockTransferDialog
          open={Boolean(transferTarget)}
          onOpenChange={(open) => !open && setTransferTarget(null)}
          variantId={transferTarget.variantId}
          variantSku={transferTarget.variant?.sku || (transferTarget as any).sku || ''}
          fromLocationId={transferTarget.locationId}
          fromLocationName={transferTarget.location?.name || (transferTarget as any).locationName || ''}
          maxQuantity={transferTarget.quantity}
          locations={allLocations}
          onSuccess={handleMovementSuccess}
        />
      )}

      {isCreateMovementOpen && (
        <CreateMovementDialog
          open={isCreateMovementOpen}
          onOpenChange={setIsCreateMovementOpen}
          onSuccess={handleMovementSuccess}
          defaultBranchId={selectedBranchId !== 'ALL' ? selectedBranchId : undefined}
        />
      )}
    </div>
  );
}
