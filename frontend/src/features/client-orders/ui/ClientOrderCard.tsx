import { Package, Calendar, Building2, CreditCard } from 'lucide-react';
import type { Order } from '@/shared/types/api';
import { formatPrice } from '@/entities/product';
import { OrderStatusBadge, PaymentStatusBadge } from '@/entities/order';

interface ClientOrderCardProps {
  order: Order;
}

export function ClientOrderCard({ order }: ClientOrderCardProps) {
  return (
    <div className="border border-border/40 bg-card p-6 sm:p-8 space-y-6 hover:border-foreground/40 transition-colors">
      {/* Encabezado del Pedido */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/40 pb-5">
        <div className="flex items-center gap-3.5">
          <div className="h-10 w-10 border border-border/60 flex items-center justify-center text-foreground">
            <Package className="h-5 w-5" />
          </div>
          <div>
            <h4 className="font-mono font-bold text-xs uppercase tracking-widest text-foreground">
              Orden #{order.id.slice(0, 10).toUpperCase()}
            </h4>
            <p className="text-[11px] font-mono text-muted-foreground flex items-center gap-1.5 pt-0.5">
              <Calendar className="h-3 w-3" />
              {new Date(order.createdAt).toLocaleDateString('es-BO', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <OrderStatusBadge status={order.status} />
          {order.payments?.[0]?.status && (
            <PaymentStatusBadge status={order.payments[0].status} />
          )}
        </div>
      </div>

      {/* Lista de Prendas en la orden */}
      <div className="space-y-3 font-mono text-xs">
        {order.items?.map((item) => (
          <div key={item.id} className="flex justify-between items-center py-1">
            <div className="flex items-center gap-2.5 min-w-0">
              <span className="font-bold text-foreground">{item.quantity}x</span>
              <span className="text-muted-foreground truncate uppercase">{item.productName}</span>
              <span className="text-[10px] text-muted-foreground/70">
                ({item.size} / {item.color})
              </span>
            </div>
            <span className="font-bold text-foreground flex-shrink-0">
              {formatPrice(Number(item.unitPrice) * item.quantity)}
            </span>
          </div>
        ))}
      </div>

      {/* Pie con Sucursal y Total */}
      <div className="pt-4 border-t border-border/40 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs font-mono">
        <div className="flex flex-wrap items-center gap-4 text-muted-foreground">
          {order.branch && (
            <span className="flex items-center gap-1.5 uppercase">
              <Building2 className="h-3.5 w-3.5 text-foreground" />
              {order.branch.name}
            </span>
          )}
          {order.payments?.[0]?.method && (
            <span className="flex items-center gap-1.5 uppercase">
              <CreditCard className="h-3.5 w-3.5 text-foreground" />
              Pago: {order.payments[0].method}
            </span>
          )}
        </div>

        <div className="flex items-baseline gap-2">
          <span className="text-[10px] uppercase tracking-widest text-muted-foreground">Total:</span>
          <span className="font-serif font-light text-xl text-foreground">
            {formatPrice(Number(order.total))}
          </span>
        </div>
      </div>
    </div>
  );
}
