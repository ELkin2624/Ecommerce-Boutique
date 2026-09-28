import { Link } from 'react-router-dom';
import { CheckCircle2 } from 'lucide-react';
import { formatPrice } from '@/entities/product';
import { Button } from '@/shared/ui/Button';
import type { User } from '@/shared/types/api';

interface CheckoutSuccessProps {
  user: User | null;
  completedOrder: any;
  paymentMethod: string;
  subtotal: number;
}

export function CheckoutSuccess({
  user,
  completedOrder,
  paymentMethod,
  subtotal,
}: CheckoutSuccessProps) {
  return (
    <div className="max-w-2xl mx-auto px-4 py-12 text-center space-y-6 animate-in zoom-in-95 duration-300">
      <div className="h-20 w-20 rounded-full bg-emerald-500/10 text-emerald-600 flex items-center justify-center mx-auto">
        <CheckCircle2 className="h-10 w-10" />
      </div>

      <div className="space-y-2">
        <span className="text-xs font-bold uppercase tracking-wider text-emerald-600">
          ¡Pedido Confirmado con Éxito!
        </span>
        <h1 className="text-3xl font-bold font-serif text-foreground">
          Gracias por tu compra, {user?.firstName}
        </h1>
        <p className="text-xs sm:text-sm text-muted-foreground max-w-md mx-auto">
          Hemos registrado tu orden #{completedOrder.id?.slice(0, 8).toUpperCase()}. Te notificaremos cuando tu paquete esté listo.
        </p>
      </div>

      {/* Resumen del Pedido Creado */}
      <div className="rounded-2xl border border-border bg-card p-6 text-left space-y-4 shadow-sm max-w-lg mx-auto">
        <div className="flex justify-between items-center text-xs pb-3 border-b border-border">
          <span className="text-muted-foreground">Número de Orden:</span>
          <span className="font-mono font-bold text-foreground">
            {completedOrder.id?.slice(0, 12).toUpperCase()}
          </span>
        </div>

        <div className="flex justify-between items-center text-xs">
          <span className="text-muted-foreground">Método de Pago:</span>
          <span className="font-semibold text-foreground">
            {completedOrder.payments?.[0]?.method || paymentMethod}
          </span>
        </div>

        <div className="flex justify-between items-center text-xs">
          <span className="text-muted-foreground">Sucursal asignada:</span>
          <span className="font-semibold text-foreground">
            {completedOrder.branch?.name || 'Sucursal Central'}
          </span>
        </div>

        <div className="flex justify-between items-center pt-3 border-t border-border">
          <span className="font-bold text-sm text-foreground">Total Pagado:</span>
          <span className="font-extrabold text-lg text-primary">
            {formatPrice(completedOrder.total || subtotal)}
          </span>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4">
        <Link to="/orders">
          <Button size="lg" className="w-full sm:w-auto font-semibold">
            Ver Mis Pedidos
          </Button>
        </Link>
        <Link to="/">
          <Button variant="outline" size="lg" className="w-full sm:w-auto">
            Seguir Explorando
          </Button>
        </Link>
      </div>
    </div>
  );
}
