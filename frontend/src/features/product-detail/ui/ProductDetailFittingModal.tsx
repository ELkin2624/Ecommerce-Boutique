import { Ruler, Sparkles, X } from 'lucide-react';
import type { FitPreference, FittingResult } from '../model/useProductDetail';
import { Button } from '@/shared/ui/Button';

interface ProductDetailFittingModalProps {
  isOpen: boolean;
  onClose: () => void;
  heightCm: number;
  onHeightChange: (val: number) => void;
  weightKg: number;
  onWeightChange: (val: number) => void;
  fitPreference: FitPreference;
  onFitPreferenceChange: (pref: FitPreference) => void;
  isCalculating: boolean;
  fittingResult: FittingResult | null;
  onCalculate: () => void;
}

export function ProductDetailFittingModal({
  isOpen,
  onClose,
  heightCm,
  onHeightChange,
  weightKg,
  onWeightChange,
  fitPreference,
  onFitPreferenceChange,
  isCalculating,
  fittingResult,
  onCalculate,
}: ProductDetailFittingModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-md animate-in fade-in-50">
      <div className="w-full max-w-md border border-border/80 bg-card p-6 shadow-2xl space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border/40 pb-3">
          <div className="flex items-center gap-2 text-foreground font-mono uppercase tracking-wider text-xs font-bold">
            <Ruler className="h-4 w-4" />
            <span>Guía & Recomendador de Talla IA</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground transition-colors p-1"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <p className="text-xs text-muted-foreground leading-relaxed">
          Ingresa tus parámetros biométricos para calcular la talla óptima según el corte y patrón de esta prenda:
        </p>

        {/* Sliders y Opciones */}
        <div className="space-y-4">
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs font-mono">
              <span className="uppercase tracking-wider text-foreground">Estatura</span>
              <span className="font-bold text-foreground">{heightCm} cm</span>
            </div>
            <input
              type="range"
              min={140}
              max={210}
              value={heightCm}
              onChange={(e) => onHeightChange(Number(e.target.value))}
              className="w-full accent-foreground cursor-pointer"
            />
          </div>

          <div className="space-y-1.5">
            <div className="flex justify-between text-xs font-mono">
              <span className="uppercase tracking-wider text-foreground">Peso</span>
              <span className="font-bold text-foreground">{weightKg} kg</span>
            </div>
            <input
              type="range"
              min={40}
              max={130}
              value={weightKg}
              onChange={(e) => onWeightChange(Number(e.target.value))}
              className="w-full accent-foreground cursor-pointer"
            />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-mono uppercase tracking-[0.2em] text-foreground block">
              Preferencia de Calce
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(['SLIM', 'REGULAR', 'OVERSIZE'] as const).map((pref) => {
                const isSelected = fitPreference === pref;
                return (
                  <button
                    key={pref}
                    type="button"
                    onClick={() => onFitPreferenceChange(pref)}
                    className={`py-2 text-[11px] font-mono uppercase tracking-wider border transition-all ${
                      isSelected
                        ? 'border-foreground bg-foreground text-background font-bold'
                        : 'border-border/60 bg-background text-foreground hover:border-foreground/50'
                    }`}
                  >
                    {pref === 'SLIM' ? 'Slim' : pref === 'REGULAR' ? 'Regular' : 'Oversize'}
                  </button>
                );
              })}
            </div>
          </div>

          {/* CTA Calcular */}
          <Button
            type="button"
            onClick={onCalculate}
            isLoading={isCalculating}
            className="w-full h-11 rounded-none bg-foreground text-background hover:bg-foreground/90 font-mono uppercase tracking-[0.2em] text-xs font-bold gap-2 mt-3"
          >
            <Sparkles className="h-4 w-4" />
            <span>Calcular Talla Sugerida</span>
          </Button>

          {/* Resultado */}
          {fittingResult && (
            <div className="p-4 border border-foreground/30 bg-muted/20 space-y-1 text-center animate-in zoom-in-95">
              <span className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
                Talla Sugerida
              </span>
              <div className="text-3xl font-serif font-light text-foreground uppercase tracking-widest">
                {fittingResult.recommendedSize || 'M'}
              </div>
              <p className="text-xs text-muted-foreground">
                {fittingResult.explanation || 'Calculado según las proporciones de confección.'}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
