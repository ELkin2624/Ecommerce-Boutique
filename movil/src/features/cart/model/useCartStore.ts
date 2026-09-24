import { create } from 'zustand';
import { appStorage } from '@/shared/lib/storage';
import type { Promotion } from '@/entities/promotion/types';
import { CartItem } from './cart.types';
import { cartApi } from '../api/cart.api';
import { mergeGuestWithRemoteCart, mapRemoteItemToCartItem } from '../lib/cart-merge';

const GUEST_CART_STORAGE_KEY = 'guest_cart_state';

interface CartStateBase {
  items: CartItem[];
  isHydrated: boolean;
  isLoading: boolean;
  activePromotion: Promotion | null;
  error: string | null;

  // Acciones principales
  hydrate: (isAuthenticated?: boolean) => Promise<void>;
  addItem: (item: CartItem, isAuthenticated?: boolean) => Promise<void>;
  updateQuantity: (variantId: string, quantity: number, isAuthenticated?: boolean) => Promise<void>;
  removeItem: (variantId: string, isAuthenticated?: boolean) => Promise<void>;
  clearCart: (isAuthenticated?: boolean) => Promise<void>;
  applyPromotion: (promo: Promotion | null) => void;

  // Acciones de ciclo de vida (Login / Logout)
  mergeOnLogin: () => Promise<void>;
  resetOnLogout: () => Promise<void>;
}

export const useCartStoreBase = create<CartStateBase>()((set, get) => ({
  items: [],
  isHydrated: false,
  isLoading: false,
  activePromotion: null,
  error: null,

  hydrate: async (isAuthenticated = false) => {
    try {
      if (isAuthenticated) {
        set({ isLoading: true });
        const remoteCart = await cartApi.getCart();
        const mappedItems = remoteCart.items.map((it) => mapRemoteItemToCartItem(it));
        set({ items: mappedItems, isHydrated: true, isLoading: false });
      } else {
        const stored = await appStorage.getItem(GUEST_CART_STORAGE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed)) {
            set({ items: parsed, isHydrated: true });
            return;
          }
        }
        set({ items: [], isHydrated: true });
      }
    } catch (err) {
      console.warn('[useCartStore] Error hidratando carrito:', err);
      set({ isHydrated: true, isLoading: false });
    }
  },

  addItem: async (item: CartItem, isAuthenticated = false) => {
    const currentItems = get().items;
    const existingIndex = currentItems.findIndex((i) => i.variantId === item.variantId);

    let updatedItems: CartItem[];
    if (existingIndex >= 0) {
      updatedItems = currentItems.map((it, idx) =>
        idx === existingIndex ? { ...it, quantity: it.quantity + item.quantity } : it
      );
    } else {
      updatedItems = [...currentItems, { ...item }];
    }

    set({ items: updatedItems });

    if (isAuthenticated) {
      try {
        await cartApi.addItem(item.variantId, item.quantity);
        const remote = await cartApi.getCart();
        const freshItems = remote.items.map((rem) =>
          mapRemoteItemToCartItem(rem, updatedItems.find((u) => u.variantId === rem.variantId))
        );
        set({ items: freshItems });
      } catch (err: any) {
        console.warn('[useCartStore] Error sincronizando addItem en backend:', err);
      }
    } else {
      await appStorage.setItem(GUEST_CART_STORAGE_KEY, JSON.stringify(updatedItems));
    }
  },

  updateQuantity: async (variantId: string, quantity: number, isAuthenticated = false) => {
    if (quantity <= 0) {
      await get().removeItem(variantId, isAuthenticated);
      return;
    }

    const currentItems = get().items;
    const updatedItems = currentItems.map((it) =>
      it.variantId === variantId ? { ...it, quantity } : it
    );
    set({ items: updatedItems });

    if (isAuthenticated) {
      try {
        await cartApi.updateItem(variantId, quantity);
      } catch (err) {
        console.warn('[useCartStore] Error sincronizando updateQuantity en backend:', err);
      }
    } else {
      await appStorage.setItem(GUEST_CART_STORAGE_KEY, JSON.stringify(updatedItems));
    }
  },

  removeItem: async (variantId: string, isAuthenticated = false) => {
    const currentItems = get().items;
    const updatedItems = currentItems.filter((i) => i.variantId !== variantId);
    set({ items: updatedItems });

    if (isAuthenticated) {
      try {
        await cartApi.removeItem(variantId);
      } catch (err) {
        console.warn('[useCartStore] Error sincronizando removeItem en backend:', err);
      }
    } else {
      await appStorage.setItem(GUEST_CART_STORAGE_KEY, JSON.stringify(updatedItems));
    }
  },

  clearCart: async (isAuthenticated = false) => {
    set({ items: [], activePromotion: null });

    if (isAuthenticated) {
      try {
        await cartApi.clearCart();
      } catch (err) {
        console.warn('[useCartStore] Error vaciando carrito en backend:', err);
      }
    } else {
      await appStorage.removeItem(GUEST_CART_STORAGE_KEY);
    }
  },

  applyPromotion: (promo: Promotion | null) => {
    set({ activePromotion: promo });
  },

  mergeOnLogin: async () => {
    set({ isLoading: true });
    try {
      let guestItems = get().items;
      if (guestItems.length === 0) {
        const stored = await appStorage.getItem(GUEST_CART_STORAGE_KEY);
        if (stored) {
          guestItems = JSON.parse(stored);
        }
      }

      if (guestItems.length > 0) {
        const mergedItems = await mergeGuestWithRemoteCart(guestItems);
        set({ items: mergedItems, isLoading: false });
        await appStorage.removeItem(GUEST_CART_STORAGE_KEY);
      } else {
        const remoteCart = await cartApi.getCart();
        const mapped = remoteCart.items.map((it) => mapRemoteItemToCartItem(it));
        set({ items: mapped, isLoading: false });
      }
    } catch (err: any) {
      console.warn('[useCartStore] Error en mergeOnLogin:', err);
      set({ isLoading: false, error: err.message });
    }
  },

  resetOnLogout: async () => {
    set({ items: [], activePromotion: null });
    await appStorage.removeItem(GUEST_CART_STORAGE_KEY);
  },
}));

// Hook público con cálculos automáticos para compatibilidad total de API
export function useCartStore() {
  const store = useCartStoreBase();

  let subtotalRegular = 0;
  let subtotalWithWholesale = 0;
  let totalItemsCount = 0;

  store.items.forEach((item) => {
    totalItemsCount += item.quantity;
    const regularTotal = item.price * item.quantity;
    subtotalRegular += regularTotal;

    const minUnits = item.wholesaleMinUnits || 6;
    const isWholesaleApplied =
      item.wholesalePrice !== null &&
      item.wholesalePrice !== undefined &&
      item.quantity >= minUnits;

    const activeUnitPrice = isWholesaleApplied ? item.wholesalePrice! : item.price;
    subtotalWithWholesale += activeUnitPrice * item.quantity;
  });

  const wholesaleSavings = Math.max(0, subtotalRegular - subtotalWithWholesale);

  let promoDiscount = 0;
  if (store.activePromotion) {
    const minRequired = Number(store.activePromotion.minPurchaseAmount) || 0;
    if (subtotalWithWholesale >= minRequired) {
      const pct = Number(store.activePromotion.discountPercent) || 0;
      promoDiscount = (subtotalWithWholesale * pct) / 100;
    }
  }

  const finalTotal = Math.max(0, subtotalWithWholesale - promoDiscount);

  return {
    ...store,
    totalCount: totalItemsCount,
    subtotalRegular,
    subtotal: subtotalWithWholesale,
    wholesaleSavings,
    promoDiscount,
    finalTotal,
  };
}

// Permitir acceso estático sin hooks cuando sea necesario (ej: en auth.store.ts)
useCartStore.getState = useCartStoreBase.getState;
useCartStore.setState = useCartStoreBase.setState;
useCartStore.subscribe = useCartStoreBase.subscribe;

export type { CartItem } from './cart.types';
