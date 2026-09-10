import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import {
  TrendingUp,
  DollarSign,
  CalendarCheck,
  AlertTriangle,
  ShoppingCart,
  Sparkles,
  ArrowUpRight,
} from 'lucide-react';
import { apiClient } from '@/shared/api/axios-client';
import { queryKeys } from '@/shared/api/query-keys';
import { useAuthStore } from '@/app/store/auth.store';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/shared/ui/Card';
import { Button } from '@/shared/ui/Button';
import { Badge } from '@/shared/ui/Badge';
import { formatCurrency, formatDate } from '@/shared/lib/utils';

export function DashboardPage() {
  const navigate = useNavigate();
  const { user, activeBranchId, activeBranchName } = useAuthStore();

  const { data: kpis, isLoading } = useQuery({
    queryKey: queryKeys.reports.dashboard(activeBranchId || undefined),
    queryFn: async () => {
      const res = await apiClient.get('/reports/dashboard', {
        params: activeBranchId ? { branchId: activeBranchId } : {},
      });
      return res.data;
    },
  });

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-gradient-to-r from-primary/10 via-background to-secondary/30 p-6 rounded-xl border">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight">
            Hola, {user?.firstName} 👋
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            Gestión en sucursal activa: <span className="font-semibold text-foreground">{activeBranchName || 'General'}</span>
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={() => navigate('/pos')} className="gap-2 shadow-sm" size="sm">
            <ShoppingCart className="h-4 w-4" />
            <span>Abrir POS</span>
          </Button>
          <Button
            onClick={() => navigate('/reports')}
            variant="outline"
            className="gap-2"
            size="sm"
          >
            <Sparkles className="h-4 w-4 text-purple-600" />
            <span>Consultar IA</span>
          </Button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">
              Ventas Totales
            </CardTitle>
            <DollarSign className="h-4 w-4 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoading ? '...' : formatCurrency(kpis?.totalSalesAmount || 0)}
            </div>
            <p className="text-[11px] text-muted-foreground mt-1 flex items-center gap-1">
              <TrendingUp className="h-3 w-3 text-emerald-600" />
              <span>{kpis?.totalSalesCount || 0} transacciones registradas</span>
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">
              Reservas Activas
            </CardTitle>
            <CalendarCheck className="h-4 w-4 text-sky-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoading ? '...' : kpis?.activeReservationsCount || 0}
            </div>
            <p className="text-[11px] text-muted-foreground mt-1">
              En cola de probador físico
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">
              Stock Crítico
            </CardTitle>
            <AlertTriangle className="h-4 w-4 text-amber-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">
              {isLoading ? '...' : kpis?.criticalStockCount || 0}
            </div>
            <p className="text-[11px] text-muted-foreground mt-1">
              Variantes bajo el umbral mínimo
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">
              Prendas en Catálogo
            </CardTitle>
            <ArrowUpRight className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoading ? '...' : kpis?.totalProductsCount || 0}
            </div>
            <p className="text-[11px] text-muted-foreground mt-1">
              Modelos activos disponibles
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Orders Overview */}
      <Card className="shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <div>
            <CardTitle className="text-base">Últimas Transacciones</CardTitle>
            <CardDescription className="text-xs">
              Ventas recientes generadas en el sistema (Online y POS físico)
            </CardDescription>
          </div>
          <Button variant="ghost" size="sm" onClick={() => navigate('/sales')}>
            Ver todas
          </Button>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="py-8 text-center text-sm text-muted-foreground">
              Cargando transacciones...
            </div>
          ) : !kpis?.recentOrders || kpis.recentOrders.length === 0 ? (
            <div className="py-8 text-center text-sm text-muted-foreground">
              No hay transacciones recientes registradas.
            </div>
          ) : (
            <div className="divide-y divide-border">
              {kpis.recentOrders.map((order: any) => (
                <div key={order.id} className="py-3 flex items-center justify-between">
                  <div className="flex flex-col">
                    <span className="font-semibold text-sm">
                      {order.client || 'Venta Mostrador'}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {formatDate(order.createdAt)} • {order.branchName || 'Sucursal'}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant={order.type === 'IN_STORE' ? 'secondary' : 'default'}>
                      {order.type}
                    </Badge>
                    <span className="font-bold text-sm">
                      {formatCurrency(order.total)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
