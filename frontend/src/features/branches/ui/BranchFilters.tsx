import { Search, MapPin, Building2, X } from 'lucide-react';
import { Card, CardContent } from '@/shared/ui/Card';

interface BranchFiltersProps {
  searchTerm: string;
  setSearchTerm: (val: string) => void;
  cityFilter: string;
  setCityFilter: (val: string) => void;
  branchFilter?: string;
  setBranchFilter?: (val: string) => void;
  cities: { id: string; name: string }[];
  branches?: { id: string; name: string }[];
  showCityFilter?: boolean;
  showBranchFilter?: boolean;
  searchPlaceholder?: string;
}

export function BranchFilters({
  searchTerm,
  setSearchTerm,
  cityFilter,
  setCityFilter,
  branchFilter = 'ALL',
  setBranchFilter,
  cities,
  branches = [],
  showCityFilter = true,
  showBranchFilter = false,
  searchPlaceholder = 'Buscar por nombre, dirección...',
}: BranchFiltersProps) {
  const hasActiveFilters =
    searchTerm.trim() !== '' ||
    (showCityFilter && cityFilter !== 'ALL') ||
    (showBranchFilter && branchFilter !== 'ALL');

  const handleReset = () => {
    setSearchTerm('');
    setCityFilter('ALL');
    if (setBranchFilter) setBranchFilter('ALL');
  };

  return (
    <Card className="shadow-sm">
      <CardContent className="p-3.5 sm:p-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={searchPlaceholder}
              className="h-9 w-full rounded-md border border-input bg-background pl-9 pr-8 text-xs shadow-sm focus:outline-none focus:ring-1 focus:ring-primary"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-2.5 top-2.5 text-muted-foreground hover:text-foreground p-0.5"
                title="Limpiar búsqueda"
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </div>

          {/* Dropdown Filters */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Filter by City */}
            {showCityFilter && (
              <div className="flex items-center gap-1.5 min-w-[140px]">
                <MapPin className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                <select
                  value={cityFilter}
                  onChange={(e) => setCityFilter(e.target.value)}
                  className="h-9 w-full rounded-md border border-input bg-background px-2.5 text-xs font-medium shadow-sm focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  <option value="ALL">Todas las ciudades</option>
                  {cities.map((c) => (
                    <option key={c.id} value={c.name}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Filter by Branch (Only on location tabs if requested) */}
            {showBranchFilter && setBranchFilter && (
              <div className="flex items-center gap-1.5 min-w-[150px]">
                <Building2 className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                <select
                  value={branchFilter}
                  onChange={(e) => setBranchFilter(e.target.value)}
                  className="h-9 w-full rounded-md border border-input bg-background px-2.5 text-xs font-medium shadow-sm focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  <option value="ALL">Todas las sucursales</option>
                  {branches.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Reset Filters Button */}
            {hasActiveFilters && (
              <button
                onClick={handleReset}
                className="h-9 px-2.5 text-xs font-medium text-destructive hover:bg-destructive/10 rounded-md border border-destructive/20 transition-colors flex items-center gap-1"
                title="Restablecer filtros"
              >
                <X className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Limpiar</span>
              </button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
