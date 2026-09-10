import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User } from '@/shared/types/api';

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  activeBranchId: string | null;
  activeBranchName: string | null;
  isAuthenticated: boolean;

  // Acciones
  setSession: (data: { user: User; accessToken: string; refreshToken?: string }) => void;
  setTokens: (accessToken: string, refreshToken?: string) => void;
  setActiveBranch: (branchId: string, branchName: string) => void;
  clearSession: () => void;
  hasPermission: (permission: string) => boolean;
  hasRole: (role: string) => boolean;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      activeBranchId: null,
      activeBranchName: null,
      isAuthenticated: false,

      setSession: ({ user, accessToken, refreshToken }) => {
        set({
          user,
          accessToken,
          refreshToken: refreshToken || null,
          isAuthenticated: true,
        });
      },

      setTokens: (accessToken, refreshToken) => {
        set((state) => ({
          accessToken,
          refreshToken: refreshToken ?? state.refreshToken,
        }));
      },

      setActiveBranch: (activeBranchId, activeBranchName) => {
        set({ activeBranchId, activeBranchName });
      },

      clearSession: () => {
        set({
          user: null,
          accessToken: null,
          refreshToken: null,
          isAuthenticated: false,
        });
      },

      hasPermission: (permission: string) => {
        const { user } = get();
        if (!user) return false;
        if (user.roles?.includes('ADMIN')) return true;
        return user.permissions?.includes(permission) || false;
      },

      hasRole: (role: string) => {
        const { user } = get();
        if (!user) return false;
        return user.roles?.includes(role) || false;
      },
    }),
    {
      name: 'fashionstore-auth',
      // Persistir de forma segura datos de sesión y refresh token para recuperación
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        activeBranchId: state.activeBranchId,
        activeBranchName: state.activeBranchName,
        isAuthenticated: state.isAuthenticated,
      }),
    },
  ),
);
