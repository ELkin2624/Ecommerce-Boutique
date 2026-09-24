import type { Promotion } from '@/entities/promotion/types';

export interface CartItem {
  variantId: string;
  productId: string;
  productName: string;
  sku?: string;
  size: string;
  color: string;
  image: string;
  price: number;
  wholesalePrice?: number | null;
  wholesaleMinUnits?: number;
  quantity: number;
  availableStock?: number;
}

export interface RemoteCartItem {
  id: string;
  variantId: string;
  productId: string;
  productName: string;
  coverImage: string | null;
  sku: string;
  size: string;
  color: string;
  unitPrice: number;
  quantity: number;
  subtotal: number;
  availableStock: number;
}

export interface RemoteCartResponse {
  cartId: string;
  items: RemoteCartItem[];
  total: number;
  itemsCount: number;
}

export interface CartState {
  items: CartItem[];
  isLoading: boolean;
  isHydrated: boolean;
  activePromotion: Promotion | null;
  error: string | null;
}
