import { apiClient } from '@/shared/api/api-client';
import { AuthResponse, LoginCredentials, RegisterData, User, AuthTokens } from '../model/auth.model';
import { normalizeAuthError } from '@/shared/lib/auth-errors';

export const authService = {
  login: async (credentials: LoginCredentials): Promise<AuthResponse> => {
    try {
      return await apiClient.post<AuthResponse>('/auth/login', credentials);
    } catch (error) {
      throw normalizeAuthError(error);
    }
  },

  register: async (data: RegisterData): Promise<{ user: User }> => {
    try {
      return await apiClient.post<{ user: User }>('/auth/register', data);
    } catch (error) {
      throw normalizeAuthError(error);
    }
  },

  refresh: async (refreshToken: string): Promise<AuthTokens> => {
    try {
      return await apiClient.post<AuthTokens>('/auth/refresh', { refreshToken });
    } catch (error) {
      throw normalizeAuthError(error);
    }
  },

  me: async (): Promise<User> => {
    try {
      return await apiClient.get<User>('/auth/me');
    } catch (error) {
      throw normalizeAuthError(error);
    }
  },

  logout: async (refreshToken: string): Promise<void> => {
    try {
      await apiClient.post<void>('/auth/logout', { refreshToken });
    } catch (error) {
      // Ignorar errores de logout, localmente igual limpiaremos
      console.warn('Logout warning:', error);
    }
  }
};
