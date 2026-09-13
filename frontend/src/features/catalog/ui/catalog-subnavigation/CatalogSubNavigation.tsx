import { Shirt, Tag, Calendar, Layers, Truck, Palette } from 'lucide-react';
import type { CatalogTab } from '../../model/types';

interface CatalogSubNavigationProps {
  activeTab: CatalogTab;
  onChangeTab: (tab: CatalogTab) => void;
  counts: {
    products: number;
    categories: number;
    seasons: number;
    collections: number;
    suppliers: number;
  };
}

export function CatalogSubNavigation({
  activeTab,
  onChangeTab,
  counts,
}: CatalogSubNavigationProps) {
  const tabs = [
    { id: 'products' as const, label: 'Prendas & Variantes', icon: Shirt, count: counts.products },
    { id: 'categories' as const, label: 'Categorías', icon: Tag, count: counts.categories },
    { id: 'sizes-colors' as const, label: 'Tallas & Colores', icon: Palette, count: 18 },
    { id: 'seasons' as const, label: 'Temporadas', icon: Calendar, count: counts.seasons },
    { id: 'collections' as const, label: 'Colecciones', icon: Layers, count: counts.collections },
    { id: 'suppliers' as const, label: 'Proveedores', icon: Truck, count: counts.suppliers },
  ];

  return (
    <div className="flex flex-wrap items-center gap-1.5 bg-muted/60 p-1 rounded-xl border">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => onChangeTab(tab.id)}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 ${
              isActive
                ? 'bg-background text-foreground shadow-sm ring-1 ring-border/50'
                : 'text-muted-foreground hover:text-foreground hover:bg-background/50'
            }`}
          >
            <Icon className={`h-3.5 w-3.5 ${isActive ? 'text-primary' : 'text-muted-foreground'}`} />
            <span>{tab.label}</span>
            <span
              className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                isActive ? 'bg-primary/10 text-primary font-bold' : 'bg-muted text-muted-foreground'
              }`}
            >
              {tab.count}
            </span>
          </button>
        );
      })}
    </div>
  );
}
