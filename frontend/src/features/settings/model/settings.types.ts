/**
 * Definiciones de tipos y valores por defecto para el Módulo de Configuración de Usuario.
 * Diseñado como componente desacoplado y reutilizable para cualquier proyecto React + Tailwind.
 */

export type ThemeMode = 'light' | 'dark' | 'system';
export type FontFamily = 'inter' | 'outfit' | 'jakarta' | 'geist' | 'system';
export type AccentColor = 'rose' | 'emerald' | 'violet' | 'blue' | 'neutral';
export type TableDensity = 'compact' | 'comfortable';

export interface UserSettings {
  // Apariencia
  theme: ThemeMode;
  accentColor: AccentColor;

  // Tipografía & Lectura (Control de tamaño tipo volumen 13px - 18px)
  fontFamily: FontFamily;
  fontSize: number; // en px (ej: 13, 14, 15, 16, 17, 18)

  // Interfaz & Accesibilidad / Rendimiento
  tableDensity: TableDensity;
  reducedMotion: boolean; // Modo Alto Rendimiento (elimina blur, sombras pesadas y animaciones)

  // Comportamiento & Sonidos
  soundEffects: boolean;
  autoSaveForms: boolean;
}

/**
 * Configuración estándar por defecto (Fallback cuando el usuario ingresa por primera vez).
 */
export const DEFAULT_USER_SETTINGS: UserSettings = {
  theme: 'light',
  accentColor: 'rose',
  fontFamily: 'inter',
  fontSize: 15, // Tamaño óptimo balanceado
  tableDensity: 'comfortable',
  reducedMotion: false,
  soundEffects: true,
  autoSaveForms: true,
};

export interface FontOption {
  id: FontFamily;
  label: string;
  description: string;
  preview: string;
}

export const FONT_OPTIONS: FontOption[] = [
  {
    id: 'inter',
    label: 'Inter',
    description: 'Moderna, limpia y altamente legible para dashboards',
    preview: 'Boutique Kitty 2026',
  },
  {
    id: 'outfit',
    label: 'Outfit',
    description: 'Geométrica, elegante y vanguardista para marcas de moda',
    preview: 'Boutique Kitty 2026',
  },
  {
    id: 'jakarta',
    label: 'Plus Jakarta Sans',
    description: 'Estilo SaaS contemporáneo y balance visual perfecto',
    preview: 'Boutique Kitty 2026',
  },
  {
    id: 'geist',
    label: 'Geist',
    description: 'Precisa, técnica y minimalista estilo Vercel / Linear',
    preview: 'Boutique Kitty 2026',
  },
  {
    id: 'system',
    label: 'Sistema Nativo',
    description: 'Fuente nativa del sistema operativo (Apple / Windows)',
    preview: 'Boutique Kitty 2026',
  },
];

export interface AccentColorOption {
  id: AccentColor;
  label: string;
  colorClass: string;
  hexPreview: string;
}

export const ACCENT_COLOR_OPTIONS: AccentColorOption[] = [
  { id: 'rose', label: 'Rosa Boutique', colorClass: 'bg-rose-500', hexPreview: '#F43F5E' },
  { id: 'emerald', label: 'Esmeralda', colorClass: 'bg-emerald-500', hexPreview: '#10B981' },
  { id: 'violet', label: 'Violeta Luxe', colorClass: 'bg-violet-500', hexPreview: '#8B5CF6' },
  { id: 'blue', label: 'Azul Real', colorClass: 'bg-blue-500', hexPreview: '#3B82F6' },
  { id: 'neutral', label: 'Monocromo Slate', colorClass: 'bg-slate-800 dark:bg-slate-200', hexPreview: '#1E293B' },
];
