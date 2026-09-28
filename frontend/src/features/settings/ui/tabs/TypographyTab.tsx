import { Minus, Plus } from 'lucide-react';
import { useSettingsStore } from '../../model/useSettingsStore';
import { FONT_OPTIONS } from '../../model/settings.types';

export function TypographyTab() {
  const { settings, updateSetting } = useSettingsStore();

  const currentFontSize = Number(settings.fontSize) || 15;
  const percentage = Math.round((currentFontSize / 15) * 100);

  const handleFontSizeChange = (val: number) => {
    const clamped = Math.max(12, Math.min(18.5, Number(val.toFixed(1))));
    updateSetting('fontSize', clamped);
  };

  return (
    <div className="space-y-6 animate-in fade-in-50 duration-150">
      {/* SLIDER DE ESCALA FLUIDA (ESTILO VOLUMEN) */}
      <div className="p-5 rounded-2xl border border-border bg-muted/20 space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <label className="text-xs font-bold uppercase tracking-wider text-foreground">
              Escala de Tamaño de Letra
            </label>
            <p className="text-[11px] text-muted-foreground">
              Desliza suavemente para ajustar la comodidad visual sin saltos bruscos
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 rounded-lg bg-primary/10 text-primary font-mono font-bold text-xs border border-primary/20">
              {currentFontSize}px ({percentage}%)
            </span>
          </div>
        </div>

        {/* Control Deslizante Suave */}
        <div className="flex items-center gap-3 pt-1">
          <button
            type="button"
            onClick={() => handleFontSizeChange(currentFontSize - 0.5)}
            className="p-2 rounded-xl border border-border bg-card hover:bg-muted text-muted-foreground hover:text-foreground transition-colors active:scale-95"
            title="Reducir tamaño (0.5px)"
          >
            <Minus className="h-4 w-4" />
          </button>

          <div className="flex-1 relative flex items-center">
            <input
              type="range"
              min={12}
              max={18.5}
              step={0.5}
              value={currentFontSize}
              onChange={(e) => handleFontSizeChange(parseFloat(e.target.value))}
              className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer accent-primary transition-all"
            />
          </div>

          <button
            type="button"
            onClick={() => handleFontSizeChange(currentFontSize + 0.5)}
            className="p-2 rounded-xl border border-border bg-card hover:bg-muted text-muted-foreground hover:text-foreground transition-colors active:scale-95"
            title="Aumentar tamaño (0.5px)"
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>

        {/* Marcadores de escala porcentuales */}
        <div className="flex justify-between text-[10px] font-mono text-muted-foreground px-8">
          <span>80% (12px)</span>
          <span>100% (15px normal)</span>
          <span>123% (18.5px)</span>
        </div>

        {/* Tarjeta de Previsualización en Vivo */}
        <div className="p-4 rounded-xl border border-border/80 bg-card space-y-1.5 shadow-xs">
          <div className="flex items-center justify-between text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
            <span>Muestra de texto en vivo</span>
            <span className="text-primary font-mono">{percentage}%</span>
          </div>
          <p className="font-medium text-foreground leading-relaxed transition-all">
            Boutique Kitty — Panel de ventas, inventario, punto de venta y catálogo con escala fluida.
          </p>
        </div>
      </div>

      {/* Selector de Familia Tipográfica */}
      <div className="space-y-3 pt-2">
        <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
          Familia Tipográfica
        </label>
        <div className="space-y-2">
          {FONT_OPTIONS.map((font) => {
            const isSelected = settings.fontFamily === font.id;
            return (
              <button
                key={font.id}
                type="button"
                onClick={() => updateSetting('fontFamily', font.id)}
                className={`w-full flex items-center justify-between p-3.5 rounded-xl border text-left transition-all ${
                  isSelected
                    ? 'border-primary bg-primary/10 text-primary ring-1 ring-primary'
                    : 'border-border bg-card hover:bg-muted/60 text-foreground'
                }`}
              >
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold">{font.label}</span>
                    {isSelected && (
                      <span className="text-[10px] bg-primary text-primary-foreground px-1.5 py-0.2 rounded font-semibold">
                        Activa
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-muted-foreground">{font.description}</p>
                </div>
                <span className="text-sm font-semibold italic text-muted-foreground hidden sm:inline">
                  {font.preview}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
