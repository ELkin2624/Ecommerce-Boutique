import { Sun, Moon, Monitor, Check } from 'lucide-react';
import { useSettingsStore } from '../../model/useSettingsStore';
import { ACCENT_COLOR_OPTIONS, type ThemeMode } from '../../model/settings.types';

const THEME_OPTIONS: Array<{ id: ThemeMode; label: string; icon: typeof Sun; desc: string }> = [
  { id: 'light', label: 'Claro', icon: Sun, desc: 'Fondo blanco nítido' },
  { id: 'dark', label: 'Oscuro', icon: Moon, desc: 'Ideal para poca luz' },
  { id: 'system', label: 'Sistema', icon: Monitor, desc: 'Sincronizar con el SO' },
];

export function AppearanceTab() {
  const { settings, updateSetting } = useSettingsStore();

  return (
    <div className="space-y-6 animate-in fade-in-50 duration-150">
      {/* Selector de Modo de Tema */}
      <div className="space-y-3">
        <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
          Modo de Color
        </label>
        <div className="grid grid-cols-3 gap-3">
          {THEME_OPTIONS.map((mode) => {
            const Icon = mode.icon;
            const isSelected = settings.theme === mode.id;
            return (
              <button
                key={mode.id}
                type="button"
                onClick={() => updateSetting('theme', mode.id)}
                className={`p-4 rounded-xl border text-left transition-all relative flex flex-col justify-between h-24 ${
                  isSelected
                    ? 'border-primary bg-primary/10 text-primary ring-1 ring-primary'
                    : 'border-border bg-card hover:bg-muted/60 text-foreground'
                }`}
              >
                <div className="flex items-center justify-between w-full">
                  <Icon className="h-5 w-5" />
                  {isSelected && <Check className="h-4 w-4 text-primary" />}
                </div>
                <div>
                  <p className="font-bold text-xs">{mode.label}</p>
                  <p className="text-[10px] text-muted-foreground">{mode.desc}</p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Selector de Color de Acento */}
      <div className="space-y-3 pt-2">
        <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
          Color de Acento Principal
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {ACCENT_COLOR_OPTIONS.map((accent) => {
            const isSelected = settings.accentColor === accent.id;
            return (
              <button
                key={accent.id}
                type="button"
                onClick={() => updateSetting('accentColor', accent.id)}
                className={`flex items-center justify-between p-3 rounded-xl border transition-all ${
                  isSelected
                    ? 'border-primary bg-primary/10 text-primary ring-1 ring-primary'
                    : 'border-border bg-card hover:bg-muted/60 text-foreground'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span
                    className="h-6 w-6 rounded-full flex items-center justify-center shadow-xs"
                    style={{ backgroundColor: accent.hexPreview }}
                  >
                    {isSelected && <Check className="h-3.5 w-3.5 text-white" />}
                  </span>
                  <span className="text-xs font-semibold">{accent.label}</span>
                </div>
                <span className="text-[10px] font-mono text-muted-foreground">{accent.hexPreview}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
