import { apiClient } from '@/shared/api/api-client';
import { RemoteCartResponse } from '../model/cart.types';

export const cartApi = {
  async getCart(): Promise<RemoteCartResponse> {
    return apiClient.get<RemoteCartResponse>('/cart');
  },

  async addItem(variantId: string, quantity: number): Promise<RemoteCartResponse> {
    return apiClient.post<RemoteCartResponse>('/cart/items', { variantId, quantity });
  },

  async updateItem(variantId: string, quantity: number): Promise<RemoteCartResponse> {
    return apiClient.patch<RemoteCartResponse>(`/cart/items/${variantId}`, { quantity });
  },

  async removeItem(variantId: string): Promise<RemoteCartResponse> {
    return apiClient.delete<RemoteCartResponse>(`/cart/items/${variantId}`);
  },

  async clearCart(): Promise<{ success: boolean; message: string }> {
    return apiClient.delete<{ success: boolean; message: string }>('/cart');
  },
};
