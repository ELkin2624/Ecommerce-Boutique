/**
 * Garment Matcher Utility
 * FashionStore Virtual Try-On - Catalog & Cart Integration
 *
 * Matches catalog products or cart items to corresponding AR try-on garments,
 * preserving product names, prices, and thumbnail preview URIs.
 */

import { AVAILABLE_GARMENTS, DEFAULT_GARMENT, getGarmentById } from '../data/garmentAssets';
import type { VirtualGarment } from '../types/garment.types';
import { formatCurrency } from '@/shared/lib/utils';

export interface MatchableProduct {
  readonly id: string;
  readonly name: string;
  readonly category?: string | null | { name?: string | null };
  readonly description?: string | null;
  readonly price?: number | string;
  readonly coverImage?: string;
  readonly arImageUrl?: string | null;
  readonly images?: Array<{ imageUrl: string }>;
  readonly variants?: Array<{
    id: string;
    price: number;
    size?: string;
    color?: string;
    image?: string;
  }>;
}

export interface CartItemLike {
  readonly variantId: string;
  readonly productId: string;
  readonly productName: string;
  readonly size: string;
  readonly color: string;
  readonly image: string;
  readonly price: number;
}

/**
 * Resolves the best matching AR garment for a given catalog product.
 */
export function matchGarmentForProduct(product?: MatchableProduct | null): VirtualGarment {
  if (!product) {
    return DEFAULT_GARMENT;
  }

  // 1. Direct ID match against local AR presets
  const direct = getGarmentById(product.id);
  if (direct) {
    return direct;
  }

  const categoryStr =
    typeof product.category === 'string'
      ? product.category
      : product.category?.name || '';

  const textToSearch = [
    product.name || '',
    categoryStr,
    product.description || '',
  ]
    .join(' ')
    .toLowerCase();

  // 2. Keyword matching against garment catalog
  // Outerwear / Chaquetas / Abrigos / Blazers
  if (
    textToSearch.includes('chaqueta') ||
    textToSearch.includes('jacket') ||
    textToSearch.includes('abrigo') ||
    textToSearch.includes('blazer') ||
    textToSearch.includes('campera') ||
    textToSearch.includes('cazadora') ||
    textToSearch.includes('parka') ||
    textToSearch.includes('trench') ||
    textToSearch.includes('outerwear') ||
    textToSearch.includes('saco')
  ) {
    return getGarmentById('jacket-navy-sport') ?? DEFAULT_GARMENT;
  }

  // Hoodies / Sudaderas / Sweaters
  if (
    textToSearch.includes('hoodie') ||
    textToSearch.includes('sudadera') ||
    textToSearch.includes('buzo') ||
    textToSearch.includes('canguro') ||
    textToSearch.includes('polerón') ||
    textToSearch.includes('poleron') ||
    textToSearch.includes('sweater') ||
    textToSearch.includes('suéter') ||
    textToSearch.includes('sueter') ||
    textToSearch.includes('cardigan') ||
    textToSearch.includes('jersey') ||
    textToSearch.includes('chaleco')
  ) {
    return getGarmentById('hoodie-grey-sport') ?? DEFAULT_GARMENT;
  }

  // Blusas / Vestidos / Camisas / Elegantes / Cuello alto
  if (
    textToSearch.includes('blusa') ||
    textToSearch.includes('vestido') ||
    textToSearch.includes('cuello') ||
    textToSearch.includes('camisa') ||
    textToSearch.includes('elegante') ||
    textToSearch.includes('blouse') ||
    textToSearch.includes('dress') ||
    textToSearch.includes('shirt') ||
    textToSearch.includes('lencero') ||
    textToSearch.includes('musculosa') ||
    textToSearch.includes('crop')
  ) {
    return getGarmentById('blouse-basic-black') ?? DEFAULT_GARMENT;
  }

  // Camisetas Grises / Casuales / Algodón
  if (
    textToSearch.includes('gris') ||
    textToSearch.includes('heather') ||
    textToSearch.includes('algodón') ||
    textToSearch.includes('algodon') ||
    textToSearch.includes('cotton') ||
    textToSearch.includes('casual') ||
    textToSearch.includes('playera')
  ) {
    return getGarmentById('tshirt-grey-sport') ?? DEFAULT_GARMENT;
  }

  // Camisetas / Remeras / Polos / Tech / Negras
  if (
    textToSearch.includes('camiseta') ||
    textToSearch.includes('remera') ||
    textToSearch.includes('polo') ||
    textToSearch.includes('tech') ||
    textToSearch.includes('negra') ||
    textToSearch.includes('black') ||
    textToSearch.includes('top') ||
    textToSearch.includes('tee') ||
    textToSearch.includes('t-shirt')
  ) {
    return getGarmentById('tshirt-dark-tech') ?? DEFAULT_GARMENT;
  }

  return DEFAULT_GARMENT;
}

/**
 * Builds a VirtualGarment from a store catalog product,
 * retaining the product's real identity, price, and cover image.
 */
export function resolveProductToGarment(product: MatchableProduct): VirtualGarment {
  const baseGarment = matchGarmentForProduct(product);
  const firstVariant = product.variants?.[0];
  const priceNum =
    typeof product.price === 'number'
      ? product.price
      : firstVariant?.price || 0;
  const priceStr =
    typeof product.price === 'string'
      ? product.price
      : formatCurrency(priceNum);
  const preview =
    product.coverImage ||
    product.images?.[0]?.imageUrl ||
    firstVariant?.image ||
    undefined;

  return {
    ...baseGarment,
    id: product.id,
    name: product.name,
    price: priceStr || baseGarment.price,
    imageSource: product.arImageUrl ? product.arImageUrl : baseGarment.imageSource,
    previewUri: preview,
    productId: product.id,
    isFromCatalog: true,
  };
}

/**
 * Builds a VirtualGarment from a user's shopping cart item,
 * retaining the item's real identity, price, and thumbnail.
 */
export function resolveCartItemToGarment(item: CartItemLike): VirtualGarment {
  const baseGarment = matchGarmentForProduct({
    id: item.productId,
    name: item.productName,
  });

  return {
    ...baseGarment,
    id: item.variantId || item.productId,
    name: item.productName,
    price: formatCurrency(item.price),
    previewUri: item.image,
    productId: item.productId,
    variantId: item.variantId,
    isFromCart: true,
  };
}

/**
 * Resolves an identifier (UUID, preset slug, or keyword) into a full VirtualGarment.
 */
export function resolveGarmentIdentifier(
  id: string,
  catalogProducts: readonly MatchableProduct[] = [],
  cartItems: readonly CartItemLike[] = []
): VirtualGarment | null {
  if (!id) return null;

  // 1. Direct local AR asset id
  const local = getGarmentById(id);
  if (local) return local;

  // 2. Direct cart item match (by variantId or productId)
  const cartMatch = cartItems.find((it) => it.variantId === id || it.productId === id);
  if (cartMatch) {
    return resolveCartItemToGarment(cartMatch);
  }

  // 3. Direct catalog product match
  const catalogMatch = catalogProducts.find((p) => p.id === id);
  if (catalogMatch) {
    return resolveProductToGarment(catalogMatch);
  }

  // 4. Keyword search across catalog items
  const query = id.toLowerCase();
  const foundInCatalog = catalogProducts.find((p) => p.name.toLowerCase().includes(query));
  if (foundInCatalog) {
    return resolveProductToGarment(foundInCatalog);
  }

  return null;
}
