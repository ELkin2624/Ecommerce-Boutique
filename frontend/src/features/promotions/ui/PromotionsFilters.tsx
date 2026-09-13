import { Search, X, Filter } from 'lucide-react';

interface PromotionsFiltersProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  onlyActive: boolean;
  onToggleOnlyActive: () => void;
  filteredCount: number;
}

export function PromotionsFilters({
  searchTerm,
  onSearchChange,
  onlyActive,
  onToggleOnlyActive,
  filteredCount,
}: PromotionsFiltersProps) {
  return (
    <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-card p-3 rounded-xl border shadow-xs">
      {/* Botones de filtro rápido */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onToggleOnlyActive}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg border font-semibold transition-all cursor-pointer ${
            onlyActive
              ? 'bg-primary text-primary-foreground border-primary shadow-xs'
              : 'bg-background text-muted-foreground hover:text-foreground border-border hover:bg-muted/50'
          }`}
        >
          <Filter className="h-3 w-3" />
          <span>Solo Vigentes</span>
        </button>

        <span className="text-xs text-muted-foreground ml-1">
          Mostrando: <strong className="text-foreground">{filteredCount}</strong>
        </span>
      </div>

      {/* Buscador de promociones */}
      <div className="relative w-full sm:w-72">
        <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
        <input
          type="text"
          placeholder="Buscar por nombre o cupón..."
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          className="h-8.5 w-full rounded-lg border border-input bg-background pl-8 pr-7 text-xs shadow-xs placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
        />
        {searchTerm && (
          <button
            type="button"
            onClick={() => onSearchChange('')}
            className="absolute right-2 top-2 p-0.5 text-muted-foreground hover:text-foreground rounded-full hover:bg-muted cursor-pointer"
            title="Limpiar búsqueda"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
    </div>
  );
}
