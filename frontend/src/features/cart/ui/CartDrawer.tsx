import { useNavigate } from 'react-router-dom';
import { ShoppingBag, X, ArrowRight } from 'lucide-react';
import { useCartStore } from '../model/cart.store';
import { CartItemRow } from './CartItemRow';
import { formatPrice } from '@/entities/product';
import { Button } from '@/shared/ui/Button';

export function CartDrawer() {
  const navigate = useNavigate();
  const { items, isDrawerOpen, closeDrawer, getSubtotal, getItemCount } = useCartStore();

  if (!isDrawerOpen) return null;

  const subtotal = getSubtotal();
  const itemCount = getItemCount();

  const handleCheckout = () => {
    closeDrawer();
    navigate('/checkout');
  };

  const handleViewCart = () => {
    closeDrawer();
    navigate('/cart');
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-background/80 backdrop-blur-sm transition-opacity"
        onClick={closeDrawer}
      />

      {/* Drawer content */}
      <div className="relative z-50 w-full max-w-md bg-card border-l border-border shadow-2xl flex flex-col h-full animate-in slide-in-from-right duration-300">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <div className="flex items-center gap-2">
            <ShoppingBag className="h-5 w-5 text-primary" />
            <h3 className="font-semibold text-base">Bolsa de Compras</h3>
            <span className="text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded-full font-medium">
              {itemCount} {itemCount === 1 ? 'prenda' : 'prendas'}
            </span>
          </div>
          <button
            onClick={closeDrawer}
            className="rounded-md p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Item list */}
        <div className="flex-1 overflow-y-auto px-5 py-2">
          {items.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-3">
              <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center text-muted-foreground">
                <ShoppingBag className="h-8 w-8" />
              </div>
              <div className="space-y-1">
                <p className="font-medium text-foreground">Tu bolsa está vacía</p>
                <p className="text-xs text-muted-foreground">
                  Explora nuestro catálogo y agrega tus prendas favoritas.
                </p>
              </div>
              <Button variant="outline" size="sm" onClick={closeDrawer} className="mt-2">
                Explorar Catálogo
              </Button>
            </div>
          ) : (
            <div className="divide-y divide-border/60">
              {items.map((item) => (
                <CartItemRow key={item.variantId} item={item} />
              ))}
            </div>
          )}
        </div>

        {/* Footer with subtotal & actions */}
        {items.length > 0 && (
          <div className="p-5 border-t border-border bg-card/50 space-y-4">
            <div className="flex justify-between items-baseline">
              <span className="text-sm font-medium text-muted-foreground">Subtotal estimado</span>
              <span className="text-lg font-bold text-foreground">{formatPrice(subtotal)}</span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <Button variant="outline" onClick={handleViewCart}>
                Ver Bolsa
              </Button>
              <Button onClick={handleCheckout} className="gap-1.5">
                Pagar <ArrowRight className="h-4 w-4" />
              </Button>
            </div>

            <p className="text-[11px] text-center text-muted-foreground">
              Impuestos y envíos calculados en el checkout
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
