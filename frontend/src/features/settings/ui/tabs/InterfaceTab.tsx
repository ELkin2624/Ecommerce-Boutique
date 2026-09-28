import { Zap, Volume2 } from 'lucide-react';
import { useSettingsStore } from '../../model/useSettingsStore';
import { type TableDensity } from '../../model/settings.types';

const TABLE_DENSITY_OPTIONS: Array<{ id: TableDensity; label: string; desc: string }> = [
  { id: 'comfortable', label: 'Espaciado Cómodo', desc: 'Filas amplias con márgenes cómodos' },
  { id: 'compact', label: 'Alta Densidad (Compacta)', desc: 'Mayor cantidad de registros visibles' },
];

export function InterfaceTab() {
  const { settings, updateSetting } = useSettingsStore();

  return (
    <div className="space-y-6 animate-in fade-in-50 duration-150">
      {/* Densidad de Tablas */}
      <div className="space-y-3">
        <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
          Densidad de Tablas y Listados (POS & Kardex)
        </label>
        <div className="grid grid-cols-2 gap-3">
          {TABLE_DENSITY_OPTIONS.map((dens) => {
            const isSelected = settings.tableDensity === dens.id;
            return (
              <button
                key={dens.id}
                type="button"
                onClick={() => updateSetting('tableDensity', dens.id)}
                className={`p-4 rounded-xl border text-left transition-all ${
                  isSelected
                    ? 'border-primary bg-primary/10 text-primary ring-1 ring-primary'
                    : 'border-border bg-card hover:bg-muted/60 text-foreground'
                }`}
              >
                <p className="font-bold text-xs">{dens.label}</p>
                <p className="text-[11px] text-muted-foreground mt-0.5">{dens.desc}</p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Modo Alto Rendimiento y Sonido */}
      <div className="space-y-3 pt-2">
        <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
          Rendimiento & Respuestas del Sistema
        </label>
        <div className="space-y-2">
          <label className="flex items-start justify-between p-4 rounded-xl border border-border bg-card hover:bg-muted/40 cursor-pointer gap-3">
            <div className="flex items-start gap-3">
              <Zap className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
              <div className="space-y-0.5">
                <p className="text-xs font-bold text-foreground">Modo Alto Rendimiento (Ultra Fluido)</p>
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  Desactiva desenfoques de vidrio (blur), sombras pesadas y animaciones para que el sistema responda instantáneamente a 60 FPS en laptops o terminales POS lentas.
                </p>
              </div>
            </div>
            <input
              type="checkbox"
              checked={settings.reducedMotion}
              onChange={(e) => updateSetting('reducedMotion', e.target.checked)}
              className="h-4 w-4 rounded border-border text-primary focus:ring-primary mt-1"
            />
          </label>

          <label className="flex items-start justify-between p-4 rounded-xl border border-border bg-card hover:bg-muted/40 cursor-pointer gap-3">
            <div className="flex items-start gap-3">
              <Volume2 className="h-5 w-5 text-primary shrink-0 mt-0.5" />
              <div className="space-y-0.5">
                <p className="text-xs font-bold text-foreground">Efectos de Sonido en Operaciones</p>
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  Emite confirmación acústica al escanear código de barras o cobrar un pedido en la caja POS.
                </p>
              </div>
            </div>
            <input
              type="checkbox"
              checked={settings.soundEffects}
              onChange={(e) => updateSetting('soundEffects', e.target.checked)}
              className="h-4 w-4 rounded border-border text-primary focus:ring-primary mt-1"
            />
          </label>
        </div>
      </div>
    </div>
  );
}
