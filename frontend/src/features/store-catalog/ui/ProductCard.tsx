import React from 'react';
import { Link } from 'react-router-dom';
import { ShoppingBag, Sparkles, ArrowRight } from 'lucide-react';
import type { Product } from '@/shared/types/api';
import {
  getProductPriceRange,
  getProductCoverImage,
  getAvailableSizes,
} from '@/entities/product';
import { useCartStore } from '@/features/cart';
import { useTenantStore } from '@/app/store/tenant.store';
import { toast } from '@/shared/ui/Toast';

interface ProductCardProps {
  product: Product;
  index?: number;
}

export function ProductCard({ product }: ProductCardProps) {
  const { addItem } = useCartStore();
  const { currentTenant } = useTenantStore();
  const defaultBrand = currentTenant?.name || 'Colección Oficial';
  const priceInfo = getProductPriceRange(product);
  const coverImage = getProductCoverImage(product);
  const sizes = getAvailableSizes(product.variants || []);

  const handleQuickAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const variant =
      product.variants?.find((v) => v.isActive && (v.stock === undefined || v.stock > 0)) ||
      product.variants?.[0];

    if (!variant) {
      toast.error('Producto sin stock', 'Esta prenda no tiene variantes disponibles actualmente.');
      return;
    }

    addItem({
      variantId: variant.id,
      productId: product.id,
      productName: product.name,
      brand: product.brand || defaultBrand,
      sku: variant.sku,
      size: variant.size,
      color: variant.color,
      price: Number(variant.price),
      imageUrl: coverImage,
      maxStock: variant.stock,
    });

    toast.success('Agregado a la bolsa', `${product.name} (${variant.size} - ${variant.color})`);
  };

  return (
    <Link
      to={`/products/${product.id}`}
      className="group flex flex-col bg-background overflow-hidden transition-all duration-300 relative text-left"
    >
      {/* Contenedor de Imagen de Alta Definición (Prada Portrait Frame) */}
      <div className="relative aspect-[3/4] w-full overflow-hidden bg-neutral-100/70 border border-border/40 rounded-xl">
        <img
          src={coverImage}
          alt={product.name}
          className="h-full w-full object-cover object-center group-hover:scale-105 transition-transform duration-700 ease-out"
          loading="lazy"
          onError={(e) => {
            (e.target as HTMLImageElement).src =
              'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=600&q=80';
          }}
        />

        {/* Badges Minimalistas Prada */}
        <div className="absolute top-2.5 inset-x-2.5 flex items-center justify-between gap-2 pointer-events-none">
          {product.category && (
            <span className="bg-background/90 text-foreground text-[9px] font-mono tracking-widest px-2 py-0.5 rounded-full uppercase border border-border/40">
              {product.category.name}
            </span>
          )}

          {product.arImageUrl && (
            <span className="bg-foreground text-background text-[9px] font-mono font-bold tracking-wider px-2 py-0.5 rounded-full flex items-center gap-1 uppercase">
              <Sparkles className="h-2.5 w-2.5" />
              <span>AR</span>
            </span>
          )}
        </div>

        {/* Botón Flotante Prada en Hover */}
        <div className="absolute inset-x-2.5 bottom-2.5 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-2 group-hover:translate-y-0">
          <button
            type="button"
            onClick={handleQuickAdd}
            className="w-full h-9 bg-foreground text-background hover:bg-foreground/90 text-[11px] font-medium tracking-wider uppercase rounded-lg flex items-center justify-center gap-2 shadow-lg backdrop-blur-md transition-all active:scale-95 cursor-pointer"
          >
            <ShoppingBag className="h-3 w-3" />
            <span>+ Añadir a Bolsa</span>
          </button>
        </div>
      </div>

      {/* Info Editorial Prada */}
      <div className="pt-3 pb-1 space-y-1">
        <div className="flex items-center justify-between gap-1 text-[10px] tracking-widest text-muted-foreground uppercase font-mono">
          <span>{product.brand || defaultBrand.toUpperCase()}</span>
          <ArrowRight className="h-3 w-3 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
        </div>

        <h3 className="font-medium text-xs sm:text-sm text-foreground uppercase tracking-tight group-hover:underline line-clamp-1">
          {product.name}
        </h3>

        <div className="flex items-baseline justify-between pt-0.5">
          <span className="font-mono font-bold text-xs sm:text-sm text-foreground tracking-tight">
            {priceInfo.formatted}
          </span>

          {sizes.length > 0 && (
            <div className="flex items-center gap-1 text-[10px] font-mono text-muted-foreground">
              {sizes.slice(0, 3).map((s) => (
                <span key={s} className="opacity-70">{s}</span>
              ))}
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}
