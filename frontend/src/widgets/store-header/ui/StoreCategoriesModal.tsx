import { X, ArrowRight } from 'lucide-react';
import type { Category } from '@/shared/types/api';

const DEFAULT_CATEGORIES: Array<{ id: string; name: string; slug: string }> = [
  { id: '1', name: 'Vestidos & Fiesta', slug: 'vestidos' },
  { id: '2', name: 'Blusas & Camisas', slug: 'blusas' },
  { id: '3', name: 'Pantalones & Jeans', slug: 'pantalones' },
  { id: '4', name: 'Trajes & Blazers', slug: 'trajes' },
  { id: '5', name: 'Ropa Deportiva / Active', slug: 'deportivo' },
  { id: '6', name: 'Accesorios & Calzado', slug: 'accesorios' },
];

interface StoreCategoriesModalProps {
  categories: Category[];
  onClose: () => void;
}

export function StoreCategoriesModal({ categories, onClose }: StoreCategoriesModalProps) {
  const displayCategories = categories.length > 0 ? categories : DEFAULT_CATEGORIES;

  return (
    <div className="fixed inset-0 z-40 flex items-start justify-center pt-20 sm:pt-24 px-4">
      <div
        className="fixed inset-0 bg-background/60 backdrop-blur-md transition-opacity duration-300"
        onClick={onClose}
      />

      <div className="relative w-full max-w-xl rounded-3xl border border-border/80 bg-card/95 p-6 shadow-2xl backdrop-blur-xl z-50 animate-in fade-in-50 zoom-in-95 duration-200 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-border/60">
          <div>
            <h3 className="text-base font-bold tracking-tight text-foreground">
              Catálogo & Colecciones
            </h3>
            <p className="text-xs text-muted-foreground">
              Moda femenina, masculina
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Departamentos / Géneros */}
        <div className="flex items-center gap-2 pb-2">
          <a
            href="#catalogo"
            onClick={onClose}
            className="px-3 py-1.5 rounded-full bg-foreground text-background font-mono text-xs font-bold shadow-xs"
          >
            Todas las Prendas
          </a>
          <a
            href="#catalogo"
            onClick={onClose}
            className="px-3 py-1.5 rounded-full border border-border/80 hover:bg-muted text-xs font-medium text-foreground transition-colors"
          >
            Colección Mujer
          </a>
          <a
            href="#catalogo"
            onClick={onClose}
            className="px-3 py-1.5 rounded-full border border-border/80 hover:bg-muted text-xs font-medium text-foreground transition-colors"
          >
            Colección Hombre
          </a>
        </div>

        {/* Grid de Categorías en Cápsulas Anchas con Flecha */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-72 overflow-y-auto pr-1">
          {displayCategories.map((cat) => (
            <a
              key={cat.id}
              href="#catalogo"
              onClick={onClose}
              className="flex items-center justify-between p-3 rounded-2xl bg-muted/40 hover:bg-muted text-foreground transition-all group border border-border/40"
            >
              <div className="flex items-center gap-2.5">
                <span className="h-2 w-2 rounded-full bg-primary" />
                <span className="text-xs font-semibold">{cat.name}</span>
              </div>
              <div className="h-5 w-6 rounded-full border border-border bg-card flex items-center justify-center group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                <ArrowRight className="h-2.5 w-2.5" />
              </div>
            </a>
          ))}
        </div>

        <div className="pt-2 border-t border-border/40 text-center">
          <a
            href="#catalogo"
            onClick={onClose}
            className="inline-flex items-center gap-1.5 text-xs font-mono font-bold text-primary hover:underline"
          >
            <span>Explorar todo el stock disponible</span>
            <ArrowRight className="h-3 w-3" />
          </a>
        </div>
      </div>
    </div>
  );
}
