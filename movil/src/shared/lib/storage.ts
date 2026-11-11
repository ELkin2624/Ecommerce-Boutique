import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

const memoryCache = new Map<string, string>();

/**
 * Almacenamiento multiplataforma seguro (iOS, Android y Web)
 * Compatible con tokens JWT, carrito de invitado y configuración de Tenant activo.
 */
export const appStorage = {
  async getItem(key: string): Promise<string | null> {
    try {
      if (Platform.OS === 'web') {
        if (typeof window !== 'undefined' && window.localStorage) {
          return window.localStorage.getItem(key);
        }
        return memoryCache.get(key) ?? null;
      }
      const value = await SecureStore.getItemAsync(key);
      if (value !== null) {
        memoryCache.set(key, value);
        return value;
      }
      return memoryCache.get(key) ?? null;
    } catch {
      return memoryCache.get(key) ?? null;
    }
  },

  async setItem(key: string, value: string): Promise<void> {
    memoryCache.set(key, value);
    try {
      if (Platform.OS === 'web') {
        if (typeof window !== 'undefined' && window.localStorage) {
          window.localStorage.setItem(key, value);
        }
        return;
      }
      await SecureStore.setItemAsync(key, value);
    } catch {
      // Fallback en memoria si el payload supera el límite de SecureStore
    }
  },

  async removeItem(key: string): Promise<void> {
    memoryCache.delete(key);
    try {
      if (Platform.OS === 'web') {
        if (typeof window !== 'undefined' && window.localStorage) {
          window.localStorage.removeItem(key);
        }
        return;
      }
      await SecureStore.deleteItemAsync(key);
    } catch {
      // Ignorar errores al limpiar claves inexistentes
    }
  },
};
