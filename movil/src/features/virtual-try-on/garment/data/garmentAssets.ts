/**
 * Garment Asset Catalog
 * FashionStore Virtual Try-On
 *
 * AR Try-on garments with measured shoulder line ratios and calibrated width factors:
 * - shoulderLineRatio: exact vertical percentage where the shoulder seams lie in the texture
 * - shoulderWidthFactor: scale factor relative to anatomical shoulder distance (1.8 to 2.1)
 * - minShoulderScore: 0.15 for rock-solid stability without flickering
 */

import type { VirtualGarment } from '../types/garment.types';

export const JACKET_NAVY_SPORT: VirtualGarment = {
  id: 'jacket-navy-sport',
  name: 'Chaqueta Sport Azul Marino',
  category: 'OUTERWEAR',
  price: '$49.99',
  description: 'Chaqueta deportiva de alto rendimiento con cremallera frontal y cuello alto.',
  imageSource: require('../../../../../assets/garments/tops/jacket-navy.png'),
  originalWidth: 1024,
  originalHeight: 1024,
  baseWidth: 320,
  baseHeight: 320,
  topOffset: 38,
  topOffsetFactor: 0.10,
  shoulderLineRatio: 0.22, // Shoulder seams lie at 22% of texture height
  horizontalOffset: 0,
  minShoulderScore: 0.15,
  shoulderWidthFactor: 2.05,
  minRenderWidth: 160,
  maxRenderWidth: 620,
  applyRotation: true,
};

export const TSHIRT_DARK_TECH: VirtualGarment = {
  id: 'tshirt-dark-tech',
  name: 'Camiseta Técnica Deportiva',
  category: 'TOP',
  price: '$29.99',
  description: 'Camiseta transpirable de secado rápido para entrenamiento y running.',
  imageSource: require('../../../../../assets/garments/tops/tshirt-dark.png'),
  originalWidth: 1024,
  originalHeight: 1024,
  baseWidth: 290,
  baseHeight: 290,
  topOffset: 28,
  topOffsetFactor: 0.08,
  shoulderLineRatio: 0.14, // Shoulder seams lie at 14% of texture height
  horizontalOffset: 0,
  minShoulderScore: 0.15,
  shoulderWidthFactor: 1.85,
  minRenderWidth: 150,
  maxRenderWidth: 600,
  applyRotation: true,
};

export const TSHIRT_GREY_SPORT: VirtualGarment = {
  id: 'tshirt-grey-sport',
  name: 'Camiseta Gris Heather',
  category: 'TOP',
  price: '$24.99',
  description: 'Camiseta casual deportiva de algodón elástico y corte regular.',
  imageSource: require('../../../../../assets/garments/tops/tshirt-grey.png'),
  originalWidth: 1024,
  originalHeight: 1024,
  baseWidth: 290,
  baseHeight: 290,
  topOffset: 28,
  topOffsetFactor: 0.08,
  shoulderLineRatio: 0.15, // Shoulder seams lie at 15% of texture height
  horizontalOffset: 0,
  minShoulderScore: 0.15,
  shoulderWidthFactor: 1.85,
  minRenderWidth: 150,
  maxRenderWidth: 600,
  applyRotation: true,
};

export const HOODIE_GREY_SPORT: VirtualGarment = {
  id: 'hoodie-grey-sport',
  name: 'Sudadera Hoodie con Capucha',
  category: 'OUTERWEAR',
  price: '$59.99',
  description: 'Sudadera térmica con capucha ajustable y bolsillos delanteros.',
  imageSource: require('../../../../../assets/garments/tops/hoodie-grey.png'),
  originalWidth: 1024,
  originalHeight: 1024,
  baseWidth: 330,
  baseHeight: 330,
  topOffset: 42,
  topOffsetFactor: 0.12,
  shoulderLineRatio: 0.25, // Shoulder seams lie at 25% of texture height
  horizontalOffset: 0,
  minShoulderScore: 0.15,
  shoulderWidthFactor: 2.10,
  minRenderWidth: 170,
  maxRenderWidth: 640,
  applyRotation: true,
};

export const SAMPLE_BLOUSE: VirtualGarment = {
  id: 'blouse-basic-black',
  name: 'Blusa Básica Cuello Alto',
  category: 'TOP',
  price: '$34.99',
  description: 'Blusa femenina entallada de cuello alto en color negro clásico.',
  imageSource: require('../../../../../assets/garments/tops/blouse-basic.png'),
  originalWidth: 1024,
  originalHeight: 1024,
  baseWidth: 280,
  baseHeight: 280,
  topOffset: 32,
  topOffsetFactor: 0.10,
  shoulderLineRatio: 0.22, // Shoulder seams lie at 22% of texture height
  horizontalOffset: 0,
  minShoulderScore: 0.15,
  shoulderWidthFactor: 1.85,
  minRenderWidth: 140,
  maxRenderWidth: 550,
  applyRotation: true,
};

export const AVAILABLE_GARMENTS: readonly VirtualGarment[] = [
  JACKET_NAVY_SPORT,
  TSHIRT_DARK_TECH,
  TSHIRT_GREY_SPORT,
  HOODIE_GREY_SPORT,
  SAMPLE_BLOUSE,
] as const;

export function getGarmentById(id: string): VirtualGarment | undefined {
  return AVAILABLE_GARMENTS.find((g) => g.id === id);
}

export const DEFAULT_GARMENT = JACKET_NAVY_SPORT;
