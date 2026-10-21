import {
  useClientOrders,
  ClientOrderCard,
  ClientOrdersEmpty,
} from '@/features/client-orders';
import { useTenantStore } from '@/app/store/tenant.store';

export function ClientOrdersPage() {
  const { orders, isLoading } = useClientOrders();
  const { currentTenant } = useTenantStore();
  const storeName = currentTenant?.name || 'nuestra boutique';

  return (
    <div className="max-w-5xl mx-auto px-6 sm:px-12 py-10 space-y-10 selection:bg-foreground selection:text-background">
      {/* Encabezado Editorial */}
      <div className="space-y-1 border-b border-border/40 pb-5">
        <span className="text-[10px] font-mono tracking-[0.25em] text-muted-foreground uppercase font-bold">
          CUENTA PERSONAL
        </span>
        <h1 className="text-2xl sm:text-4xl font-light font-serif uppercase tracking-tight text-foreground">
          Mis Pedidos & Compras
        </h1>
        <p className="text-xs font-mono text-muted-foreground">
          Historial y estado de tus compras en {storeName}
        </p>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="h-36 border border-border/40 bg-card/60 p-6 animate-pulse"
            />
          ))}
        </div>
      ) : orders.length === 0 ? (
        <ClientOrdersEmpty />
      ) : (
        <div className="space-y-6">
          {orders.map((order) => (
            <ClientOrderCard key={order.id} order={order} />
          ))}
        </div>
      )}
    </div>
  );
}
