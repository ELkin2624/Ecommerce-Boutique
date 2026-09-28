/**
 * Configuración centralizada de marca y logos (Móvil / Expo).
 * 
 * Para actualizar o cambiar el logo en toda la app móvil:
 * 1. Opción recomendada: Reemplaza los archivos en `movil/assets/brand/logo.png` o `movil/assets/expo.icon/kitty.png`.
 * 2. Opción configurable: Modifica las fuentes 'source' o 'svgSource' en este archivo.
 */
export const BRAND_CONFIG = {
  name: 'Boutique Kitty',
  shortName: 'Kitty',
  subtitle: 'Moda & Estilo',
  tagline: 'Colección 2026',
  legalName: 'BOUTIQUE KITTY S.R.L.',
  version: '1.0.0',
  logo: {
    /** Fuente principal del logo (PNG de alta resolución, óptimo para React Native) */
    source: require('@/assets/brand/logo.png'),
  },
} as const;

export type BrandConfig = typeof BRAND_CONFIG;
