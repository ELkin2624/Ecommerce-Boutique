/**
 * Configuración centralizada de marca, logos y datos de contacto de Boutique Kitty.
 */
export const BRAND_CONFIG = {
  name: 'Boutique Kitty',
  shortName: 'Kitty',
  legalName: 'BOUTIQUE KITTY S.R.L.',
  
  // Título e identidad del portal administrativo
  subtitle: 'Panel de Control',
  tagline: 'Gestión de ventas, inventario y caja',
  version: 'v2.1',

  // Identidad para el e-commerce y clientes
  storeTagline: 'Moda, tendencia y elegancia para cada ocasión',
  storeDescription: 'Descubre nuestra colección exclusiva de prendas, calzado y accesorios de alta calidad.',

  // Contacto y redes
  contact: {
    whatsapp: '+591 71234567',
    email: 'contacto@boutiquekitty.com',
    instagram: '@boutiquekitty',
    address: 'Av. San Martín #450, Equipetrol, Santa Cruz - Bolivia',
    schedule: 'Lunes a Sábado: 09:00 - 20:00',
  },

  // Logos y recursos visuales
  logo: {
    svg: '/logo/logo.svg',
    png: '/logo/logo.png',
    webp: '/logo/logo.webp',
    default: '/logo/logo.svg',
  },
} as const;

export type BrandConfig = typeof BRAND_CONFIG;
