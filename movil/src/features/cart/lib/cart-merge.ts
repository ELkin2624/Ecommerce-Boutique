import { cartApi } from '../api/cart.api';
import { CartItem, RemoteCartItem } from '../model/cart.types';

/**
 * Convierte un ítem remoto del backend al modelo CartItem de la app móvil.
 */
export function mapRemoteItemToCartItem(
  remote: RemoteCartItem,
  existingLocal?: CartItem
): CartItem {
  return {
    variantId: remote.variantId,
    productId: remote.productId,
    productName: remote.productName,
    sku: remote.sku,
    size: remote.size,
    color: remote.color,
    image:
      remote.coverImage ||
      existingLocal?.image ||
      'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=500',
    price: Number(remote.unitPrice) || existingLocal?.price || 0,
    wholesalePrice: existingLocal?.wholesalePrice ?? null,
    wholesaleMinUnits: existingLocal?.wholesaleMinUnits ?? 6,
    quantity: remote.quantity,
    availableStock: remote.availableStock,
  };
}

/**
 * Sincroniza los ítems del carrito de invitado con el carrito remoto al iniciar sesión.
 */
export async function mergeGuestWithRemoteCart(guestItems: CartItem[]): Promise<CartItem[]> {
  for (const item of guestItems) {
    try {
      await cartApi.addItem(item.variantId, item.quantity);
    } catch {
      // Continuar con los demás productos si alguno no tiene stock suficiente
    }
  }

  const remoteCart = await cartApi.getCart();
  return remoteCart.items.map((rem) =>
    mapRemoteItemToCartItem(
      rem,
      guestItems.find((g) => g.variantId === rem.variantId)
    )
  );
}
