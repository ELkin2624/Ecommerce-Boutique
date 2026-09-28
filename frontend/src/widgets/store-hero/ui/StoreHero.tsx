import { useState, useEffect } from 'react';
import { ArrowDown, Sparkles } from 'lucide-react';
import { HERO_SLIDES } from '../model/hero.config';

interface StoreHeroProps {
  onExploreClick: () => void;
}

export function StoreHero({ onExploreClick }: StoreHeroProps) {
  const [currentSlide, setCurrentSlide] = useState(0);

  // Transición automática cinematográfica cada 6 segundos
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % HERO_SLIDES.length);
    }, 6000);
    return () => clearInterval(timer);
  }, []);

  const activeSlide = HERO_SLIDES[currentSlide];

  return (
    <section className="relative min-h-[90vh] flex flex-col justify-between pt-6 pb-12 px-6 sm:px-12 md:px-16 overflow-hidden">
      {/* Fondos Rotativos de Pantalla Completa (Full Width & Full Height) */}
      <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden">
        {HERO_SLIDES.map((slide, index) => {
          const isActive = index === currentSlide;
          return (
            <div
              key={slide.id}
              className={`absolute inset-0 transition-all duration-1000 ease-in-out ${
                isActive
                  ? 'opacity-100 scale-100'
                  : 'opacity-0 scale-105 pointer-events-none'
              }`}
            >
              <img
                src={slide.image}
                alt={slide.headlinePrefix}
                className="w-full h-full object-cover object-center sm:object-top filter contrast-[1.03]"
                onError={(e) => {
                  if (slide.fallbackImage) {
                    (e.target as HTMLImageElement).src = slide.fallbackImage;
                  }
                }}
              />
            </div>
          );
        })}

        {/* Gradientes y Viñetas de Lujo para Legibilidad y Fundido Suave al Catálogo */}
        <div className="absolute inset-0 bg-gradient-to-r from-background/95 via-background/70 to-background/20 sm:w-3/4 lg:w-3/5" />
        <div className="absolute inset-x-0 bottom-0 h-44 bg-gradient-to-t from-background via-background/60 to-transparent" />
        <div className="absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-background/40 to-transparent" />
      </div>

      {/* Espacio superior para compensar el Header flotante */}
      <div className="h-6" />

      {/* Bloque Central de Tipografía Editorial de Alta Costura */}
      <div className="relative z-10 max-w-2xl space-y-6 pt-24 sm:pt-36">
        <div className="space-y-3">
          {/* Eyebrow de Marca */}
          <div className="flex items-center gap-2 text-[11px] font-mono tracking-widest text-muted-foreground uppercase font-bold">
            <span className="h-2 w-2 rounded-full bg-primary animate-pulse" />
            <span>{activeSlide.eyebrow}</span>
          </div>

          {/* Titular Principal en Dos Tiempos */}
          <h1
            key={activeSlide.id}
            className="text-4xl sm:text-5xl lg:text-6xl font-light tracking-tight text-foreground leading-[1.08] animate-in fade-in-50 slide-in-from-bottom-2 duration-700 font-serif"
          >
            <span className="block font-light">{activeSlide.headlinePrefix}</span>
            <span className="block font-medium text-foreground">{activeSlide.headlineHighlight}</span>
          </h1>

          {/* Descripción / Manifiesto */}
          <p
            key={`${activeSlide.id}-desc`}
            className="text-xs sm:text-sm text-muted-foreground max-w-lg leading-relaxed animate-in fade-in-50 slide-in-from-bottom-1 duration-700 pt-1"
          >
            {activeSlide.description}
          </p>
        </div>

        {/* Llamadas a la Acción de Alto Nivel */}
        <div className="flex flex-wrap items-center gap-3 pt-2">
          <button
            type="button"
            onClick={onExploreClick}
            className="h-12 px-7 rounded-full bg-foreground text-background hover:bg-foreground/90 font-medium text-xs sm:text-sm inline-flex items-center gap-2 shadow-xl shadow-foreground/5 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer font-sans"
          >
            <span>{activeSlide.primaryCtaText}</span>
            <ArrowDown className="h-4 w-4" />
          </button>

          <a
            href="#probador-ar"
            className="h-12 px-6 rounded-full border border-border/80 bg-card/70 hover:bg-card backdrop-blur-xl text-foreground font-medium text-xs sm:text-sm inline-flex items-center gap-2 shadow-sm hover:border-primary/50 transition-all group font-sans"
          >
            <Sparkles className="h-4 w-4 text-primary group-hover:rotate-12 transition-transform" />
            <span>Probador AR en Vivo</span>
          </a>
        </div>
      </div>

      {/* Barra Inferior: Scroll Indicator + Selector Editorial de Diapositivas */}
      <div className="relative z-10 pt-10 flex items-center justify-between">
        {/* Scroll Down */}
        <button
          type="button"
          onClick={onExploreClick}
          className="h-11 w-7 rounded-full border border-border/80 bg-card/70 backdrop-blur-md flex items-center justify-center text-muted-foreground hover:text-foreground hover:border-foreground transition-all cursor-pointer shadow-xs animate-bounce"
          title="Desplazarse hacia el catálogo"
          aria-label="Ver Catálogo"
        >
          <ArrowDown className="h-3.5 w-3.5" />
        </button>

        {/* Indicadores de diapositiva estilo Atelier / Galería */}
        <div className="flex items-center gap-3 bg-card/80 border border-border/80 backdrop-blur-xl px-4 py-2 rounded-full shadow-sm">
          <span className="text-[11px] font-mono font-bold text-foreground">
            0{currentSlide + 1}
          </span>
          <span className="text-[10px] font-mono text-muted-foreground">/ 0{HERO_SLIDES.length}</span>

          <div className="flex items-center gap-1.5 ml-1">
            {HERO_SLIDES.map((slide, idx) => (
              <button
                key={slide.id}
                type="button"
                onClick={() => setCurrentSlide(idx)}
                className={`h-1.5 rounded-full transition-all cursor-pointer ${
                  idx === currentSlide
                    ? 'w-6 bg-primary'
                    : 'w-2 bg-muted-foreground/30 hover:bg-muted-foreground/70'
                }`}
                title={`Ver diapositiva ${idx + 1}`}
                aria-label={`Slide ${idx + 1}`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
