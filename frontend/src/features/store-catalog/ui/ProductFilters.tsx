import { Search, SlidersHorizontal, X } from 'lucide-react';
import type { Category } from '@/shared/types/api';

interface ProductFiltersProps {
  categories: Category[];
  selectedCategoryId: string;
  onSelectCategory: (categoryId: string) => void;
  searchTerm: string;
  onSearchChange: (term: string) => void;
  sortBy: string;
  onSortChange: (sort: string) => void;
  totalProductsCount?: number;
}

export function ProductFilters({
  categories,
  selectedCategoryId,
  onSelectCategory,
  searchTerm,
  onSearchChange,
  sortBy,
  onSortChange,
  totalProductsCount,
}: ProductFiltersProps) {
  return (
    <div className="space-y-6">
      {/* Selector de Categorías Estilo Prada (Tabs de Texto en Mayúsculas) */}
      <div className="flex items-center gap-6 sm:gap-8 overflow-x-auto pb-3 scrollbar-none border-b border-border/40 text-xs tracking-wider uppercase font-medium">
        <button
          type="button"
          onClick={() => onSelectCategory('ALL')}
          className={`pb-2 transition-all cursor-pointer whitespace-nowrap relative ${
            selectedCategoryId === 'ALL'
              ? 'text-foreground font-bold'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <span>Todas las Prendas</span>
          {selectedCategoryId === 'ALL' && (
            <span className="absolute bottom-0 inset-x-0 h-0.5 bg-foreground" />
          )}
        </button>

        {categories.map((cat) => {
          const isSelected = selectedCategoryId === cat.id;
          return (
            <button
              key={cat.id}
              type="button"
              onClick={() => onSelectCategory(cat.id)}
              className={`pb-2 transition-all cursor-pointer whitespace-nowrap relative ${
                isSelected
                  ? 'text-foreground font-bold'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <span>{cat.name}</span>
              {isSelected && (
                <span className="absolute bottom-0 inset-x-0 h-0.5 bg-foreground" />
              )}
            </button>
          );
        })}
      </div>

      {/* Buscador & Selector de Orden Minimalista */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-3 h-3.5 w-3.5 text-muted-foreground" />
          <input
            type="text"
            placeholder="Buscar en el catálogo..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="flex h-10 w-full rounded-lg border border-border/60 bg-muted/20 pl-9 pr-9 py-1 text-xs text-foreground placeholder:text-muted-foreground/70 focus-visible:outline-none focus-visible:border-foreground transition-colors"
          />
          {searchTerm && (
            <button
              type="button"
              onClick={() => onSearchChange('')}
              className="absolute right-3 top-2.5 p-0.5 text-muted-foreground hover:text-foreground cursor-pointer"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-3">
          {totalProductsCount !== undefined && (
            <span className="text-[11px] font-mono text-muted-foreground uppercase tracking-widest">
              {totalProductsCount} {totalProductsCount === 1 ? 'Prenda' : 'Prendas'}
            </span>
          )}

          <div className="relative flex items-center">
            <SlidersHorizontal className="absolute left-3 h-3 w-3 text-muted-foreground pointer-events-none" />
            <select
              value={sortBy}
              onChange={(e) => onSortChange(e.target.value)}
              className="h-10 rounded-lg border border-border/60 bg-muted/20 pl-8 pr-7 py-1 text-xs text-foreground font-medium tracking-wide uppercase focus-visible:outline-none focus-visible:border-foreground cursor-pointer appearance-none"
            >
              <option value="featured">Destacados</option>
              <option value="price_asc">Precio: Menor a Mayor</option>
              <option value="price_desc">Precio: Mayor a Menor</option>
              <option value="name_asc">Nombre: A → Z</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );
}
