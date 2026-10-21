import { useState } from 'react';
import { Store, Palette, Type, Layout, Sliders, RotateCcw, X } from 'lucide-react';
import { useSettingsStore } from '../model/useSettingsStore';
import { Button } from '@/shared/ui/Button';
import { StoreSettingsTab } from './tabs/StoreSettingsTab';
import { AppearanceTab } from './tabs/AppearanceTab';
import { TypographyTab } from './tabs/TypographyTab';
import { InterfaceTab } from './tabs/InterfaceTab';

type SettingsTab = 'store' | 'appearance' | 'typography' | 'interface';

interface TabConfig {
  id: SettingsTab;
  label: string;
  icon: typeof Palette;
}

const TABS: TabConfig[] = [
  { id: 'store', label: 'Mi Tienda & Marca', icon: Store },
  { id: 'appearance', label: 'Tema & Apariencia', icon: Palette },
  { id: 'typography', label: 'Tipografía & Escala', icon: Type },
  { id: 'interface', label: 'Rendimiento & Densidad', icon: Layout },
];

interface SettingsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultTab?: SettingsTab;
}

export function SettingsModal({ open, onOpenChange, defaultTab = 'store' }: SettingsModalProps) {
  const { resetToDefaults } = useSettingsStore();
  const [activeTab, setActiveTab] = useState<SettingsTab>(defaultTab);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="fixed inset-0"
        onClick={() => onOpenChange(false)}
        aria-hidden="true"
      />

      <div className="relative w-full max-w-2xl rounded-2xl border border-border bg-card text-foreground shadow-2xl overflow-hidden flex flex-col max-h-[90vh] z-10 animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-muted/30">
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
              <Sliders className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold tracking-tight">Preferencias & Configuración</h2>
              <p className="text-xs text-muted-foreground">Personaliza tu entorno visual con guardado por cuenta</p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
            title="Cerrar ventana"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-border px-6 gap-6 text-xs font-semibold bg-muted/10">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 py-3 border-b-2 transition-all cursor-pointer ${
                  isActive
                    ? 'border-primary text-primary font-bold'
                    : 'border-transparent text-muted-foreground hover:text-foreground'
                }`}
              >
                <Icon className="h-4 w-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Tab Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {activeTab === 'store' && <StoreSettingsTab />}
          {activeTab === 'appearance' && <AppearanceTab />}
          {activeTab === 'typography' && <TypographyTab />}
          {activeTab === 'interface' && <InterfaceTab />}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-border bg-muted/20">
          <button
            type="button"
            onClick={resetToDefaults}
            className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-destructive transition-colors font-medium cursor-pointer"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span>Restablecer valores por defecto</span>
          </button>

          <Button onClick={() => onOpenChange(false)} className="rounded-xl px-5 text-xs font-bold">
            Guardar y Aplicar
          </Button>
        </div>
      </div>
    </div>
  );
}
