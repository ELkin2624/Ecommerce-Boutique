import { ArrowDown } from 'lucide-react';
import { useTenantStore } from '@/app/store/tenant.store';

interface StoreEditorialStoriesProps {
  onSelectWomen: () => void;
  onSelectMen: () => void;
}

export function StoreEditorialStories({
  onSelectWomen,
  onSelectMen,
}: StoreEditorialStoriesProps) {
  const { currentTenant } = useTenantStore();
  const storeName = currentTenant?.name || 'Boutique Oficial';

  return (
    <section className="max-w-7xl mx-auto px-6 sm:px-12">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
        {/* Panel 1: Colección Mujer */}
        <div className="group relative aspect-[4/5] sm:aspect-[3/4] rounded-2xl overflow-hidden bg-neutral-100 border border-border/40 shadow-sm flex flex-col justify-end p-8 sm:p-10 text-white">
          <img
            src="/fondos/vestido.webp"
            alt={`Colección Mujer ${storeName}`}
            className="absolute inset-0 w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-1000 ease-out"
            onError={(e) => {
              (e.target as HTMLImageElement).src =
                'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=1000&q=85';
            }}
          />
          {/* Gradiente de sombra Prada para legibilidad */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent" />

          <div className="relative z-10 space-y-3">
            <span className="text-[10px] font-mono tracking-[0.25em] uppercase text-white/80 font-bold">
              COLECCIÓN FEMENINA
            </span>
            <h3 className="text-2xl sm:text-3xl font-light uppercase tracking-tight font-serif text-white">
              Vestidos & Siluetas Couture
            </h3>
            <p className="text-xs text-white/80 max-w-sm leading-relaxed line-clamp-2">
              Prendas de alta confección diseñadas para capturar miradas con caídas fluidas y elegancia innata.
            </p>
            <div className="pt-2">
              <button
                type="button"
                onClick={onSelectWomen}
                className="inline-flex items-center gap-2 text-xs font-bold tracking-widest uppercase text-white hover:text-white/80 border-b border-white pb-1 group-hover:translate-x-1 transition-all cursor-pointer"
              >
                <span>Explorar Colección Mujer</span>
                <ArrowDown className="h-3 w-3" />
              </button>
            </div>
          </div>
        </div>

        {/* Panel 2: Colección Hombre & Casual Urbano */}
        <div className="group relative aspect-[4/5] sm:aspect-[3/4] rounded-2xl overflow-hidden bg-neutral-100 border border-border/40 shadow-sm flex flex-col justify-end p-8 sm:p-10 text-white">
          <img
            src="/fondos/canguro2.webp"
            alt={`Colección Hombre & Urbana ${storeName}`}
            className="absolute inset-0 w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-1000 ease-out"
            onError={(e) => {
              (e.target as HTMLImageElement).src =
                'https://images.unsplash.com/photo-1509631179647-0177331693ae?w=1000&q=85';
            }}
          />
          {/* Gradiente de sombra Prada para legibilidad */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent" />

          <div className="relative z-10 space-y-3">
            <span className="text-[10px] font-mono tracking-[0.25em] uppercase text-white/80 font-bold">
              COLECCIÓN MASCULINA & URBANA
            </span>
            <h3 className="text-2xl sm:text-3xl font-light uppercase tracking-tight font-serif text-white">
              Vanguardia & Sastrería
            </h3>
            <p className="text-xs text-white/80 max-w-sm leading-relaxed line-clamp-2">
              Cortes contemporáneos y tejidos premium pensados para un estilo sofisticado en todo momento.
            </p>
            <div className="pt-2">
              <button
                type="button"
                onClick={onSelectMen}
                className="inline-flex items-center gap-2 text-xs font-bold tracking-widest uppercase text-white hover:text-white/80 border-b border-white pb-1 group-hover:translate-x-1 transition-all cursor-pointer"
              >
                <span>Explorar Colección Urbana</span>
                <ArrowDown className="h-3 w-3" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
