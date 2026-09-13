/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

import '@/global.css';

import { Platform } from 'react-native';

export const Colors = {
  light: {
    text: '#000000',
    background: '#ffffff',
    backgroundElement: '#F0F0F3',
    backgroundSelected: '#E0E1E6',
    textSecondary: '#60646C',
  },
  dark: {
    text: '#ffffff',
    background: '#000000',
    backgroundElement: '#212225',
    backgroundSelected: '#2E3135',
    textSecondary: '#B0B4BA',
  },
} as const;

/**
 * ============================================================================
 * PALETAS BOUTIQUE OFICIALES (Hombres & Mujeres)
 * ============================================================================
 * Diseñadas para estilizar colecciones de ropa, temas por preferencia
 * de usuario en la app móvil y resaltar prendas de manera armónica.
 */
export const BoutiquePalette = {
  // Paleta Masculina (Navy, Teal, Sky Blue, Beige, White)
  men: {
    navy: '#2F4156',
    teal: '#567C8D',
    sky: '#C8D9E6',
    beige: '#F5EFEB',
    white: '#FFFFFF',
    // Aliases semánticos para componentes UI
    primary: '#2F4156',
    accent: '#567C8D',
    surface: '#F5EFEB',
    highlight: '#C8D9E6',
  },
  // Paleta Femenina (Soft Pink, Rose, Peach Cream, Dusty Mauve, Mint Mist)
  women: {
    pink: '#FFCAD4',
    rose: '#F4ACB7',
    peach: '#FFE5D9',
    mauve: '#9D8189',
    mint: '#D8E2DC',
    // Aliases semánticos para componentes UI
    primary: '#9D8189',
    accent: '#F4ACB7',
    surface: '#FFE5D9',
    highlight: '#FFCAD4',
    secondary: '#D8E2DC',
  },
} as const;

export type GenderTheme = 'men' | 'women';
export type BoutiquePaletteType = typeof BoutiquePalette;

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: 'system-ui',
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: 'ui-serif',
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: 'ui-rounded',
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: 'var(--font-display)',
    serif: 'var(--font-serif)',
    rounded: 'var(--font-rounded)',
    mono: 'var(--font-mono)',
  },
});

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
export const MaxContentWidth = 800;
