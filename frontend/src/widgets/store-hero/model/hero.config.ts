import type { HeroSlide } from './hero.types';

export const HERO_SLIDES: HeroSlide[] = [
  {
    id: 'slide-1',
    image: '/fondos/canguro.webp',
    fallbackImage: '/fondos/vestido.webp',
    eyebrow: 'BOUTIQUE KITTY · ATELIER 2026',
    headlinePrefix: 'Todo lo que buscas,',
    headlineHighlight: 'en un solo lugar.',
    description:
      'Una curaduría exclusiva de prendas y siluetas confeccionadas para elevar tu estilo y celebrar tu autenticidad cada día.',
    primaryCtaText: 'Descubrir Colección',
  },
  {
    id: 'slide-2',
    image: '/fondos/vestido.webp',
    fallbackImage: '/fondos/canguro.webp',
    eyebrow: 'SILUETAS NOCHE & ALTA COSTURA',
    headlinePrefix: 'Nacida para brillar',
    headlineHighlight: 'con luz propia.',
    description:
      'Diseños exclusivos que capturan la mirada, combinando caídas impecables, detalles sofisticados y elegancia sin esfuerzo.',
    primaryCtaText: 'Explorar Vestidos & Noche',
  },
  {
    id: 'slide-3',
    image: '/fondos/canguro2.webp',
    fallbackImage: '/fondos/vestido.webp',
    eyebrow: 'VANGUARDIA URBANA & CONFORT',
    headlinePrefix: 'El estilo que buscas',
    headlineHighlight: 'no se sigue, se define.',
    description:
      'Prendas contemporáneas con ajuste perfecto y tecnología de probador virtual 3D interactivo en tiempo real.',
    primaryCtaText: 'Ver Prendas & Tendencias',
  },
];
