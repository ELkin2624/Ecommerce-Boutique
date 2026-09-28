import type { Product, ProductVariant, ProductImage } from '@/shared/types/api';
import { formatCurrency } from '@/shared/lib/utils';

export const formatPrice = formatCurrency;

export interface FormattedProductPrice {
  minPrice: number;
  maxPrice: number;
  hasRange: boolean;
  formatted: string;
}

export function getProductPriceRange(product: Product): FormattedProductPrice {
  if (!product.variants || product.variants.length === 0) {
    return { minPrice: 0, maxPrice: 0, hasRange: false, formatted: 'Bs. 0.00' };
  }

  const prices = product.variants.map((v) => Number(v.price));
  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);

  if (minPrice === maxPrice) {
    return {
      minPrice,
      maxPrice,
      hasRange: false,
      formatted: formatPrice(minPrice),
    };
  }

  return {
    minPrice,
    maxPrice,
    hasRange: true,
    formatted: `${formatPrice(minPrice)} - ${formatPrice(maxPrice)}`,
  };
}

export function getProductCoverImage(product: Product): string {
  if (product.coverImage && product.coverImage.trim() !== '') return product.coverImage;
  const coverImg = product.images?.find((img: ProductImage) => img.isCover && img.imageUrl);
  if (coverImg && coverImg.imageUrl.trim() !== '') return coverImg.imageUrl;
  if (product.images && product.images.length > 0 && product.images[0].imageUrl) {
    return product.images[0].imageUrl;
  }
  // Fallbacks de alta calidad curados por categoría o estilo
  const fallbacks = [
    'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=800&q=80',
    'https://images.unsplash.com/photo-1539109136881-3be0616acf4b?w=800&q=80',
    'https://images.unsplash.com/photo-1496747611176-843222e1e57c?w=800&q=80',
    'https://images.unsplash.com/photo-1509631179647-0177331693ae?w=800&q=80',
    'https://images.unsplash.com/photo-1558769132-cb1aea458c5e?w=800&q=80',
  ];
  const charCode = (product.name || 'product').charCodeAt(0) || 0;
  return fallbacks[charCode % fallbacks.length];
}

export function getAvailableSizes(variants: ProductVariant[]): string[] {
  if (!variants) return [];
  const sizes = new Set<string>();
  variants.forEach((v) => {
    if (v.isActive && (v.stock === undefined || v.stock > 0)) {
      sizes.add(v.size);
    }
  });
  return Array.from(sizes);
}

export function getAvailableColors(variants: ProductVariant[]): string[] {
  if (!variants) return [];
  const colors = new Set<string>();
  variants.forEach((v) => {
    if (v.isActive && (v.stock === undefined || v.stock > 0)) {
      colors.add(v.color);
    }
  });
  return Array.from(colors);
}
