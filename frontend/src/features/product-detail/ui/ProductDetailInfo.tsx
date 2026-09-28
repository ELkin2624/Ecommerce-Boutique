import { ShoppingBag, Ruler, Check, Minus, Plus } from 'lucide-react';
import type { Product, ProductVariant } from '@/shared/types/api';
import { formatPrice } from '@/entities/product';
import { Button } from '@/shared/ui/Button';

interface ProductDetailInfoProps {
  product: Product;
  selectedVariant: ProductVariant | null;
  onSelectVariant: (variant: ProductVariant) => void;
  quantity: number;
  onQuantityChange: (qty: number) => void;
  onAddToCart: () => void;
  onOpenFittingModal: () => void;
}

export function ProductDetailInfo({
  product,
  selectedVariant,
  onSelectVariant,
  quantity,
  onQuantityChange,
  onAddToCart,
  onOpenFittingModal,
}: ProductDetailInfoProps) {
  const availableSizes = Array.from(new Set(product.variants?.map((v) => v.size) || []));
  const availableColors = Array.from(new Set(product.variants?.map((v) => v.color) || []));

  const isOutOfStock =
    !selectedVariant || (selectedVariant.stock !== undefined && selectedVariant.stock <= 0);

  return (
    <div className="space-y-6">
      {/* Encabezado Editorial */}
      <div className="space-y-2 border-b border-border/40 pb-5">
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-mono uppercase tracking-[0.25em] text-muted-foreground font-semibold">
            {product.brand || 'Boutique Kitty'}
          </span>
          {product.category && (
            <>
              <span className="text-border">/</span>
              <span className="text-[11px] font-mono uppercase tracking-[0.2em] text-muted-foreground">
                {product.category.name}
              </span>
            </>
          )}
        </div>

        <h1 className="text-2xl sm:text-4xl font-light font-serif tracking-tight text-foreground uppercase">
          {product.name}
        </h1>

        {/* Precio */}
        <div className="text-2xl sm:text-3xl font-light text-foreground pt-1 tracking-tight">
          {selectedVariant ? formatPrice(selectedVariant.price) : 'Precio variable'}
        </div>
      </div>

      {/* Descripción */}
      {product.description && (
        <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
          {product.description}
        </p>
      )}

      {/* Selector de Color */}
      {availableColors.length > 0 && (
        <div className="space-y-2.5">
          <label className="text-[10px] font-mono font-bold uppercase tracking-[0.2em] text-foreground block">
            Color:{' '}
            <span className="font-normal text-muted-foreground font-sans">
              {selectedVariant?.color || 'Selecciona un color'}
            </span>
          </label>
          <div className="flex flex-wrap gap-2">
            {availableColors.map((color) => {
              const isSelected = selectedVariant?.color === color;
              return (
                <button
                  key={color}
                  type="button"
                  onClick={() => {
                    const variantWithColor = product.variants?.find((v) => v.color === color);
                    if (variantWithColor) onSelectVariant(variantWithColor);
                  }}
                  className={`px-3.5 py-1.5 text-xs uppercase tracking-wider font-mono border transition-all ${
                    isSelected
                      ? 'border-foreground bg-foreground text-background font-bold'
                      : 'border-border/60 hover:border-foreground/50 text-foreground bg-background'
                  }`}
                >
                  {color}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Selector de Talla */}
      {availableSizes.length > 0 && (
        <div className="space-y-2.5">
          <div className="flex items-center justify-between">
            <label className="text-[10px] font-mono font-bold uppercase tracking-[0.2em] text-foreground">
              Talla:{' '}
              <span className="font-normal text-muted-foreground font-sans">
                {selectedVariant?.size || 'Selecciona una talla'}
              </span>
            </label>

            {/* Asistente IA de Talla */}
            <button
              type="button"
              onClick={onOpenFittingModal}
              className="inline-flex items-center gap-1.5 text-xs font-mono uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors"
            >
              <Ruler className="h-3.5 w-3.5" />
              <span>Guía de Tallas · IA Fit</span>
            </button>
          </div>

          <div className="flex flex-wrap gap-2">
            {availableSizes.map((size) => {
              const matchingVariant =
                product.variants?.find(
                  (v) =>
                    v.size === size &&
                    (!selectedVariant?.color || v.color === selectedVariant.color),
                ) || product.variants?.find((v) => v.size === size);

              const isSelected = selectedVariant?.size === size;
              const isAvailable =
                matchingVariant?.isActive &&
                (matchingVariant?.stock === undefined || matchingVariant?.stock > 0);

              return (
                <button
                  key={size}
                  type="button"
                  disabled={!isAvailable}
                  onClick={() => {
                    if (matchingVariant) onSelectVariant(matchingVariant);
                  }}
                  className={`min-w-[48px] h-10 px-3 text-xs font-mono font-bold uppercase border transition-all flex items-center justify-center ${
                    isSelected
                      ? 'border-foreground bg-foreground text-background'
                      : isAvailable
                      ? 'border-border/60 hover:border-foreground text-foreground bg-background'
                      : 'border-border/30 text-muted-foreground/30 line-through bg-muted/10 cursor-not-allowed'
                  }`}
                >
                  {size}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Cantidad & CTA Agregar a la Bolsa */}
      <div className="space-y-4 pt-2">
        <div className="flex items-center gap-3">
          {/* Stepper de Cantidad */}
          <div className="flex items-center border border-border/60 bg-background h-12">
            <button
              type="button"
              onClick={() => onQuantityChange(Math.max(1, quantity - 1))}
              className="px-3 h-full hover:bg-muted/40 text-muted-foreground hover:text-foreground transition-colors"
            >
              <Minus className="h-3.5 w-3.5" />
            </button>
            <span className="px-4 text-xs font-mono font-bold">{quantity}</span>
            <button
              type="button"
              onClick={() =>
                onQuantityChange(
                  selectedVariant?.stock !== undefined
                    ? Math.min(selectedVariant.stock, quantity + 1)
                    : quantity + 1,
                )
              }
              className="px-3 h-full hover:bg-muted/40 text-muted-foreground hover:text-foreground transition-colors"
            >
              <Plus className="h-3.5 w-3.5" />
            </button>
          </div>

          {/* Botón CTA Prada Minimal */}
          <Button
            size="lg"
            onClick={onAddToCart}
            disabled={isOutOfStock}
            className="flex-1 h-12 rounded-none bg-foreground text-background hover:bg-foreground/90 uppercase tracking-[0.2em] text-xs font-mono font-bold transition-all shadow-none"
          >
            <ShoppingBag className="h-4 w-4 mr-2" />
            <span>{isOutOfStock ? 'Agotado' : 'Añadir a la Bolsa'}</span>
          </Button>
        </div>

        {/* Indicador de Disponibilidad */}
        {selectedVariant && (
          <p className="text-[11px] font-mono text-muted-foreground flex items-center gap-1.5 uppercase tracking-wide">
            <Check className="h-3.5 w-3.5 text-emerald-600" />
            <span>
              {selectedVariant.stock !== undefined
                ? `${selectedVariant.stock} unidades en stock boutique`
                : 'Prenda disponible para envío inmediato'}
            </span>
          </p>
        )}
      </div>
    </div>
  );
}
