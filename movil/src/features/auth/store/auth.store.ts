import { create } from 'zustand';
import { User, LoginCredentials, RegisterData } from '../model/auth.model';
import { authService } from '../api/auth.service';
import { appStorage } from '@/shared/lib/storage';
import { useCartStore } from '@/features/cart/model/useCartStore';

// Definimos la interfaz del estado global de autenticación
interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isHydrated: boolean;
  isLoading: boolean;
  error: string | null;

  // Actions
  hydrate: () => Promise<void>;
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>()((set, get) => ({
  user: null,
  isAuthenticated: false,
  isHydrated: false,
  isLoading: false,
  error: null,

  hydrate: async () => {
    try {
      const token = await appStorage.getItem('auth_token');
      if (token) {
        const user = await authService.me();
        set({ user, isAuthenticated: true, isHydrated: true });
        useCartStore.getState().hydrate(true).catch(() => {});
      } else {
        set({ isHydrated: true });
        useCartStore.getState().hydrate(false).catch(() => {});
      }
    } catch (error) {
      console.log('Hydration failed:', error);
      await appStorage.removeItem('auth_token');
      await appStorage.removeItem('refresh_token');
      set({ user: null, isAuthenticated: false, isHydrated: true });
      useCartStore.getState().hydrate(false).catch(() => {});
    }
  },

  login: async (credentials: LoginCredentials) => {
    set({ isLoading: true, error: null });
    try {
      const response = await authService.login(credentials);
      await appStorage.setItem('auth_token', response.accessToken);
      await appStorage.setItem('refresh_token', response.refreshToken);
      set({ user: response.user, isAuthenticated: true, isLoading: false });
      
      // Enterprise merge de carrito local con backend al autenticarse
      useCartStore.getState().mergeOnLogin().catch((err) => {
        console.warn('[Auth] Error ejecutando merge de carrito:', err);
      });
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
      throw error;
    }
  },

  register: async (data: RegisterData) => {
    set({ isLoading: true, error: null });
    try {
      // Registra al usuario
      await authService.register(data);
      // Auto login después del registro
      await get().login({ email: data.email, password: data.password });
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
      throw error;
    }
  },

  logout: async () => {
    set({ isLoading: true });
    try {
      const refreshToken = await appStorage.getItem('refresh_token');
      if (refreshToken) {
        await authService.logout(refreshToken);
      }
    } finally {
      await appStorage.removeItem('auth_token');
      await appStorage.removeItem('refresh_token');
      // Resetear estado del carrito local para el nuevo invitado, manteniendo el del backend a salvo
      await useCartStore.getState().resetOnLogout().catch(() => {});
      set({ user: null, isAuthenticated: false, isLoading: false });
    }
  },

  clearError: () => set({ error: null }),
}));
