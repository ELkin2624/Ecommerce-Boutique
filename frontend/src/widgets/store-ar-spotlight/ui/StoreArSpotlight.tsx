import { Sparkles, CheckCircle2, Camera, Layers } from 'lucide-react';
import type { Product } from '@/shared/types/api';

interface StoreArSpotlightProps {
  arProducts: Product[];
  onExploreClick: () => void;
}

export function StoreArSpotlight({
  arProducts,
  onExploreClick,
}: StoreArSpotlightProps) {
  const handleTryAr = () => {
    const firstAr = arProducts[0];
    if (firstAr) {
      window.location.href = `/products/${firstAr.id}`;
    } else {
      onExploreClick();
    }
  };

  return (
    <section id="probador-ar" className="max-w-7xl mx-auto px-6 sm:px-12 scroll-mt-24">
      <div className="rounded-3xl border border-border/80 bg-card p-8 sm:p-14 relative overflow-hidden shadow-xl backdrop-blur-xl">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center relative z-10">
          <div className="lg:col-span-7 space-y-6">
            <div className="inline-flex items-center gap-2 text-primary text-[11px] font-mono font-bold uppercase tracking-[0.2em]">
              <Sparkles className="h-3.5 w-3.5" />
              <span>[ ATELIER DIGITAL · PROBADOR AR 3D ]</span>
            </div>

            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-light uppercase tracking-tight text-foreground font-serif leading-[1.1]">
              Prueba la caída de cada prenda <br />
              <span className="italic font-normal">en Tiempo Real</span>.
            </h2>

            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed max-w-xl">
              Nuestra tecnología de visión computacional proyecta las prendas en 3D sobre tu silueta en vivo mediante tu cámara web o smartphone, garantizando el calce exacto antes de ordenar.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 pt-2">
              <div className="flex items-start gap-2.5">
                <CheckCircle2 className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider font-mono">01. En Vivo</p>
                  <p className="text-[11px] text-muted-foreground">Cámara web o móvil</p>
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <CheckCircle2 className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider font-mono">02. Sin Apps</p>
                  <p className="text-[11px] text-muted-foreground">100% web nativo</p>
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <CheckCircle2 className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider font-mono">03. Ajuste</p>
                  <p className="text-[11px] text-muted-foreground">Talla recomendada</p>
                </div>
              </div>
            </div>

            <div className="pt-2">
              <button
                type="button"
                onClick={handleTryAr}
                className="h-12 px-7 rounded-full bg-foreground text-background font-medium text-xs tracking-wider uppercase hover:bg-foreground/90 transition-all shadow-sm cursor-pointer inline-flex items-center gap-2"
              >
                <Camera className="h-4 w-4" />
                <span>Probar Prenda en AR ({arProducts.length})</span>
              </button>
            </div>
          </div>

          {/* Demostración Visual Prada Atelier Card */}
          <div className="lg:col-span-5 flex justify-center">
            <div className="w-full max-w-sm rounded-2xl border border-border/80 bg-muted/40 p-5 space-y-4 shadow-xl backdrop-blur-md">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
                  <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-foreground">
                    [ AR ENGINE ACTIVO ]
                  </span>
                </div>
                <span className="text-[10px] font-mono text-muted-foreground">60 FPS</span>
              </div>

              <div className="relative aspect-[4/3] rounded-xl overflow-hidden bg-neutral-900 flex items-center justify-center">
                <img
                  src="https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=600&q=80"
                  alt="AR Virtual Fitting Preview"
                  className="w-full h-full object-cover opacity-80"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent flex items-end p-4">
                  <div className="flex items-center gap-2 text-white text-xs font-mono">
                    <Layers className="h-4 w-4 text-primary" />
                    <span>Proyección 3D en Vivo</span>
                  </div>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-card border border-border/60 text-xs font-mono flex items-center justify-between">
                <span className="text-muted-foreground">Calce recomendado:</span>
                <span className="font-bold text-primary">Talla M (98% match)</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
