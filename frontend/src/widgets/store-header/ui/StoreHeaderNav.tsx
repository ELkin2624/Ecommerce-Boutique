import { Flame, Sparkles, MapPin, Search } from 'lucide-react';

interface StoreHeaderNavProps {
  activeMenu: 'categories' | 'ar_app' | null;
  onToggleCategories: () => void;
  onToggleArApp: () => void;
  onOpenSearch: () => void;
  onCloseMenus: () => void;
}

export function StoreHeaderNav({
  activeMenu,
  onToggleCategories,
  onToggleArApp,
  onOpenSearch,
  onCloseMenus,
}: StoreHeaderNavProps) {
  return (
    <nav className="flex items-center gap-1 sm:gap-2 px-3 sm:px-6 py-1.5 rounded-full bg-card/80 hover:bg-card/95 border border-border/80 backdrop-blur-xl shadow-sm text-xs sm:text-sm font-medium text-foreground transition-all overflow-x-auto scrollbar-none">
      {/* Opción 1: Categorías */}
      <button
        type="button"
        onClick={onToggleCategories}
        className={`px-3 py-1.5 rounded-full transition-all cursor-pointer whitespace-nowrap ${
          activeMenu === 'categories'
            ? 'bg-muted text-foreground font-bold'
            : 'text-muted-foreground hover:text-foreground'
        }`}
      >
        Categorías
      </button>

      {/* Opción 2: Novedades / Colección */}
      <a
        href="#catalogo"
        onClick={onCloseMenus}
        className="px-3 py-1.5 rounded-full text-muted-foreground hover:text-foreground transition-all flex items-center gap-1 whitespace-nowrap"
      >
        <Flame className="h-3.5 w-3.5 text-amber-500" />
        <span>Novedades</span>
      </a>

      {/* Opción 3: Probador AR & App Móvil */}
      <button
        type="button"
        onClick={onToggleArApp}
        className={`px-3 py-1.5 rounded-full transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
          activeMenu === 'ar_app'
            ? 'bg-primary/10 text-primary font-bold border border-primary/30'
            : 'text-muted-foreground hover:text-primary hover:bg-primary/10'
        }`}
      >
        <Sparkles className="h-3.5 w-3.5 text-primary" />
        <span>Probador AR</span>
      </button>

      {/* Opción 4: Sucursales / Ubicación */}
      <a
        href="#contacto"
        onClick={onCloseMenus}
        className="hidden md:flex items-center gap-1 px-3 py-1.5 rounded-full text-muted-foreground hover:text-foreground transition-all whitespace-nowrap"
      >
        <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
        <span>Sucursales</span>
      </a>

      {/* Opción 5: Buscar */}
      <button
        type="button"
        onClick={onOpenSearch}
        className="px-3 py-1.5 rounded-full text-muted-foreground hover:text-foreground transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
      >
        <Search className="h-3.5 w-3.5" />
        <span>Buscar</span>
      </button>
    </nav>
  );
}
