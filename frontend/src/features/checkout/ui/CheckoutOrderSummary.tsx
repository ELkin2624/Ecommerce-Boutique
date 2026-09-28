import { ShoppingBag, ArrowRight } from 'lucide-react';
import { formatPrice } from '@/entities/product';
import { Button } from '@/shared/ui/Button';
import type { CartItem } from '@/features/cart';

interface CheckoutOrderSummaryProps {
  items: CartItem[];
  subtotal: number;
  isProcessing: boolean;
  onConfirmOrder: () => void;
}

export function CheckoutOrderSummary({
  items,
  subtotal,
  isProcessing,
  onConfirmOrder,
}: CheckoutOrderSummaryProps) {
  return (
    <div className="rounded-2xl border border-border bg-card p-6 shadow-sm space-y-6 sticky top-24">
      <h3 className="text-base font-bold text-foreground pb-3 border-b border-border flex items-center justify-between">
        <span>Resumen de Compra</span>
        <span className="text-xs font-mono font-normal text-muted-foreground">
          {items.length} {items.length === 1 ? 'prenda' : 'prendas'}
        </span>
      </h3>

      {/* Lista de Prendas */}
      <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
        {items.map((item) => (
          <div key={item.variantId} className="flex gap-3 text-xs">
            <div className="h-12 w-12 rounded-lg bg-muted border border-border overflow-hidden shrink-0">
              {item.imageUrl ? (
                <img
                  src={item.imageUrl}
                  alt={item.productName}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="h-full w-full flex items-center justify-center text-muted-foreground">
                  <ShoppingBag className="h-4 w-4" />
                </div>
              )}
            </div>

            <div className="flex-1 min-w-0 space-y-0.5">
              <p className="font-semibold text-foreground truncate">{item.productName}</p>
              <p className="text-[11px] text-muted-foreground font-mono">
                {item.size} · {item.color} · Cant: {item.quantity}
              </p>
              <p className="font-mono font-bold text-foreground">
                {formatPrice(item.price * item.quantity)}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Totales */}
      <div className="pt-4 border-t border-border space-y-2 text-xs">
        <div className="flex justify-between text-muted-foreground">
          <span>Subtotal:</span>
          <span className="font-mono font-semibold text-foreground">{formatPrice(subtotal)}</span>
        </div>
        <div className="flex justify-between text-muted-foreground">
          <span>Envío:</span>
          <span className="font-mono text-emerald-600 font-semibold">Gratis</span>
        </div>
        <div className="flex justify-between pt-2 border-t border-border text-sm font-bold text-foreground">
          <span>Total a Pagar:</span>
          <span className="font-mono font-extrabold text-base text-primary">
            {formatPrice(subtotal)}
          </span>
        </div>
      </div>

      {/* Botón de Confirmación */}
      <Button
        onClick={onConfirmOrder}
        isLoading={isProcessing}
        className="w-full h-12 text-sm font-bold tracking-wide rounded-xl gap-2 shadow-md"
      >
        <span>Confirmar y Pagar Orden</span>
        <ArrowRight className="h-4 w-4" />
      </Button>
    </div>
  );
}
