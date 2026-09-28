import { ShoppingBag, RefreshCw } from 'lucide-react';
import type { Product } from '@/shared/types/api';
import { ProductCard } from './ProductCard';
import { Button } from '@/shared/ui/Button';

interface ProductCatalogGridProps {
  products: Product[];
  isLoading: boolean;
  onClearFilters: () => void;
}

export function ProductCatalogGrid({
  products,
  isLoading,
  onClearFilters,
}: ProductCatalogGridProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6 py-6">
        {Array.from({ length: 8 }).map((_, i) => (
          <div
            key={i}
            className="rounded-2xl border border-border/40 bg-neutral-100/50 overflow-hidden animate-pulse"
          >
            <div className="aspect-[3/4] bg-muted/60" />
            <div className="p-4 space-y-2">
              <div className="h-3 bg-muted rounded w-1/3" />
              <div className="h-4 bg-muted rounded w-3/4" />
              <div className="h-4 bg-muted rounded w-1/2" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="py-20 text-center space-y-4 rounded-2xl border border-dashed border-border bg-muted/10">
        <div className="h-14 w-14 rounded-2xl bg-muted flex items-center justify-center mx-auto text-muted-foreground">
          <ShoppingBag className="h-6 w-6" />
        </div>
        <div className="space-y-1">
          <h3 className="font-bold text-sm uppercase tracking-wider font-mono">
            No se encontraron prendas
          </h3>
          <p className="text-xs text-muted-foreground max-w-sm mx-auto">
            Prueba seleccionando otra categoría o limpiando los términos de búsqueda.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={onClearFilters}
          className="rounded-full gap-2 text-xs font-mono tracking-wider uppercase"
        >
          <RefreshCw className="h-3.5 w-3.5" /> [ Limpiar Filtros ]
        </Button>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5 sm:gap-8">
      {products.map((product, index) => (
        <ProductCard key={product.id} product={product} index={index} />
      ))}
    </div>
  );
}
