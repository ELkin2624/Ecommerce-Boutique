import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface CartItem {
  variantId: string;
  productId: string;
  productName: string;
  brand: string;
  sku: string;
  size: string;
  color: string;
  price: number;
  imageUrl: string;
  quantity: number;
  maxStock?: number;
}

interface CartState {
  items: CartItem[];
  isDrawerOpen: boolean;

  // Acciones
  addItem: (item: Omit<CartItem, 'quantity'> & { quantity?: number }) => void;
  updateQuantity: (variantId: string, quantity: number) => void;
  removeItem: (variantId: string) => void;
  clearCart: () => void;
  setDrawerOpen: (open: boolean) => void;
  openDrawer: () => void;
  closeDrawer: () => void;
  toggleDrawer: () => void;
  
  // Computados
  getItemCount: () => number;
  getSubtotal: () => number;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      isDrawerOpen: false,

      addItem: (itemToAdd) => {
        const { items } = get();
        const quantity = itemToAdd.quantity || 1;
        const existingIndex = items.findIndex((i) => i.variantId === itemToAdd.variantId);

        if (existingIndex > -1) {
          const updated = [...items];
          const current = updated[existingIndex];
          const newQuantity = current.quantity + quantity;
          const max = current.maxStock !== undefined ? current.maxStock : Infinity;
          updated[existingIndex] = {
            ...current,
            quantity: Math.min(newQuantity, max),
          };
          set({ items: updated, isDrawerOpen: true });
        } else {
          set({
            items: [...items, { ...itemToAdd, quantity }],
            isDrawerOpen: true,
          });
        }
      },

      updateQuantity: (variantId, quantity) => {
        if (quantity <= 0) {
          get().removeItem(variantId);
          return;
        }

        const { items } = get();
        const updated = items.map((item) => {
          if (item.variantId === variantId) {
            const max = item.maxStock !== undefined ? item.maxStock : Infinity;
            return { ...item, quantity: Math.min(quantity, max) };
          }
          return item;
        });

        set({ items: updated });
      },

      removeItem: (variantId) => {
        set({ items: get().items.filter((i) => i.variantId !== variantId) });
      },

      clearCart: () => {
        set({ items: [] });
      },

      setDrawerOpen: (isDrawerOpen) => set({ isDrawerOpen }),
      openDrawer: () => set({ isDrawerOpen: true }),
      closeDrawer: () => set({ isDrawerOpen: false }),
      toggleDrawer: () => set((state) => ({ isDrawerOpen: !state.isDrawerOpen })),

      getItemCount: () => {
        return get().items.reduce((total, item) => total + item.quantity, 0);
      },

      getSubtotal: () => {
        return get().items.reduce((total, item) => total + item.price * item.quantity, 0);
      },
    }),
    {
      name: 'boutique-kitty-cart',
      partialize: (state) => ({ items: state.items }),
    },
  ),
);
