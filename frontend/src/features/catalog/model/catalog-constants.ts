import type { ColorPreset } from './types';

export const STANDARD_SIZES = [
  'XS', 'S', 'M', 'L', 'XL', 'XXL',
  '36', '38', '40', '42', '44', 'Única'
];

export const COLOR_PRESETS: ColorPreset[] = [
  { name: 'Negro', hex: '#111827' },
  { name: 'Blanco', hex: '#FFFFFF' },
  { name: 'Gris Grafito', hex: '#4B5563' },
  { name: 'Azul Marino', hex: '#1E3A8A' },
  { name: 'Azul Royal', hex: '#2563EB' },
  { name: 'Rojo Escarlata', hex: '#DC2626' },
  { name: 'Borgoña / Vino', hex: '#881337' },
  { name: 'Verde Militar', hex: '#3F6212' },
  { name: 'Verde Esmeralda', hex: '#059669' },
  { name: 'Beige / Arena', hex: '#D4B996' },
  { name: 'Rosa Pastel', hex: '#F472B6' },
  { name: 'Naranja Vivo', hex: '#EA580C' },
  { name: 'Amarillo Mostaza', hex: '#D97706' },
  { name: 'Café Chocolate', hex: '#5C3A21' },
];

export const SIZES_GUIDE = [
  { size: 'XS', chest: '82-86 cm', waist: '62-66 cm', hips: '88-92 cm', category: 'Superior / Vestidos' },
  { size: 'S', chest: '86-90 cm', waist: '66-70 cm', hips: '92-96 cm', category: 'Superior / Vestidos' },
  { size: 'M', chest: '90-94 cm', waist: '70-74 cm', hips: '96-100 cm', category: 'Superior / Vestidos' },
  { size: 'L', chest: '94-98 cm', waist: '74-78 cm', hips: '100-104 cm', category: 'Superior / Vestidos' },
  { size: 'XL', chest: '98-104 cm', waist: '78-84 cm', hips: '104-110 cm', category: 'Superior / Vestidos' },
  { size: '36', chest: '80 cm', waist: '60 cm', hips: '86 cm', category: 'Pantalones / Faldas' },
  { size: '38', chest: '84 cm', waist: '64 cm', hips: '90 cm', category: 'Pantalones / Faldas' },
  { size: '40', chest: '88 cm', waist: '68 cm', hips: '94 cm', category: 'Pantalones / Faldas' },
  { size: '42', chest: '92 cm', waist: '72 cm', hips: '98 cm', category: 'Pantalones / Faldas' },
  { size: '44', chest: '96 cm', waist: '76 cm', hips: '102 cm', category: 'Pantalones / Faldas' },
];
