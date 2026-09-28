import { Link } from 'react-router-dom';
import { ArrowLeft, Trash2 } from 'lucide-react';
import {
  useCartStore,
  CartItemRow,
  CartEmptyState,
  CartOrderSummaryCard,
} from '@/features/cart';

export function CartPage() {
  const { items, clearCart, getSubtotal, getItemCount } = useCartStore();

  const subtotal = getSubtotal();
  const itemCount = getItemCount();

  return (
    <div className="max-w-7xl mx-auto px-6 sm:px-12 py-10 space-y-10 selection:bg-foreground selection:text-background">
      {/* Encabezado Editorial */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-border/40 pb-5">
        <div className="space-y-1">
          <span className="text-[10px] font-mono tracking-[0.25em] text-muted-foreground uppercase font-bold">
            SELECCIÓN EXCLUSIVA
          </span>
          <h1 className="text-2xl sm:text-4xl font-light font-serif uppercase tracking-tight text-foreground">
            Bolsa de Compras
          </h1>
        </div>

        {items.length > 0 && (
          <button
            type="button"
            onClick={clearCart}
            className="inline-flex items-center gap-1.5 text-[11px] font-mono uppercase tracking-wider text-muted-foreground hover:text-destructive transition-colors"
          >
            <Trash2 className="h-3.5 w-3.5" />
            <span>Vaciar Bolsa</span>
          </button>
        )}
      </div>

      {items.length === 0 ? (
        <CartEmptyState />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14">
          {/* Lista de Prendas */}
          <div className="lg:col-span-8 space-y-6">
            <div className="border border-border/40 bg-card p-6 divide-y divide-border/40">
              {items.map((item) => (
                <CartItemRow key={item.variantId} item={item} />
              ))}
            </div>

            <div>
              <Link
                to="/"
                className="inline-flex items-center gap-2 text-[11px] font-mono uppercase tracking-[0.2em] text-muted-foreground hover:text-foreground transition-colors"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                <span>Continuar Viendo Prendas</span>
              </Link>
            </div>
          </div>

          {/* Resumen de la Orden */}
          <div className="lg:col-span-4">
            <CartOrderSummaryCard subtotal={subtotal} itemCount={itemCount} />
          </div>
        </div>
      )}
    </div>
  );
}
