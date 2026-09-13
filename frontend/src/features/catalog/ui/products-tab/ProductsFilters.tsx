import { Search } from 'lucide-react';
import { Button } from '@/shared/ui/Button';
import type { Category, Season } from '@/shared/types/api';

interface ProductsFiltersProps {
  search: string;
  onSearchChange: (val: string) => void;
  categoryFilter: string;
  onCategoryFilterChange: (val: string) => void;
  seasonFilter: string;
  onSeasonFilterChange: (val: string) => void;
  categories: Category[];
  seasons: Season[];
}

export function ProductsFilters({
  search,
  onSearchChange,
  categoryFilter,
  onCategoryFilterChange,
  seasonFilter,
  onSeasonFilterChange,
  categories,
  seasons,
}: ProductsFiltersProps) {
  const hasActiveFilters = Boolean(search || categoryFilter || seasonFilter);

  return (
    <div className="flex flex-wrap items-center gap-2.5 pt-2 pb-1 border-t">
      {/* Buscador reactivo */}
      <div className="relative flex-1 min-w-[240px]">
        <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
        <input
          type="text"
          placeholder="Buscar prenda por nombre, código, marca, color o talla..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-input bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary shadow-xs transition-colors"
        />
      </div>

      <div className="flex items-center gap-2">
        {/* Filtro Categoría */}
        <select
          value={categoryFilter}
          onChange={(e) => onCategoryFilterChange(e.target.value)}
          className="h-8 rounded-lg border border-input bg-background px-2.5 py-1 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary shadow-xs"
        >
          <option value="">Todas las Categorías</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>

        {/* Filtro Temporada */}
        <select
          value={seasonFilter}
          onChange={(e) => onSeasonFilterChange(e.target.value)}
          className="h-8 rounded-lg border border-input bg-background px-2.5 py-1 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary shadow-xs"
        >
          <option value="">Todas las Temporadas</option>
          {seasons.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>

        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            className="h-8 text-xs text-muted-foreground hover:text-foreground"
            onClick={() => {
              onSearchChange('');
              onCategoryFilterChange('');
              onSeasonFilterChange('');
            }}
          >
            Limpiar Filtros
          </Button>
        )}
      </div>
    </div>
  );
}
