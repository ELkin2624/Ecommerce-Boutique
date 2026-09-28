import { Trash2, Plus, Minus } from 'lucide-react';
import { useCartStore, type CartItem } from '../model/cart.store';
import { formatPrice } from '@/entities/product';

interface CartItemRowProps {
  item: CartItem;
  compact?: boolean;
}

export function CartItemRow({ item, compact = false }: CartItemRowProps) {
  const { updateQuantity, removeItem } = useCartStore();

  return (
    <div className={`flex gap-3 py-3 border-b border-border/60 last:border-b-0 ${compact ? 'text-xs' : 'text-sm'}`}>
      {/* Imagen */}
      <div className="relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-md border border-border bg-muted">
        <img
          src={item.imageUrl || '/placeholder-fashion.jpg'}
          alt={item.productName}
          className="h-full w-full object-cover"
          onError={(e) => {
            (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1489987707025-afc232f7ea0f?w=300&q=80';
          }}
        />
      </div>

      {/* Info & Controles */}
      <div className="flex flex-1 flex-col justify-between min-w-0">
        <div className="flex justify-between items-start gap-2">
          <div className="min-w-0">
            <h4 className="font-medium text-foreground truncate">{item.productName}</h4>
            <p className="text-xs text-muted-foreground">
              Talla: <span className="font-semibold text-foreground">{item.size}</span> | Color: <span className="font-semibold text-foreground">{item.color}</span>
            </p>
          </div>
          <button
            onClick={() => removeItem(item.variantId)}
            className="text-muted-foreground hover:text-destructive transition-colors p-1"
            title="Eliminar producto"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>

        <div className="flex items-center justify-between mt-2">
          {/* Contador de cantidad */}
          <div className="flex items-center border border-border rounded-md bg-background">
            <button
              onClick={() => updateQuantity(item.variantId, item.quantity - 1)}
              className="p-1 hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
              title="Disminuir"
            >
              <Minus className="h-3 w-3" />
            </button>
            <span className="px-2 text-xs font-semibold">{item.quantity}</span>
            <button
              onClick={() => updateQuantity(item.variantId, item.quantity + 1)}
              className="p-1 hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
              title="Aumentar"
              disabled={item.maxStock !== undefined && item.quantity >= item.maxStock}
            >
              <Plus className="h-3 w-3" />
            </button>
          </div>

          <span className="font-semibold text-foreground">
            {formatPrice(item.price * item.quantity)}
          </span>
        </div>
      </div>
    </div>
  );
}
