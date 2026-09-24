import { useAuthStore } from '../store/auth.store';

export const useAuth = () => {
  const { user, isAuthenticated, isHydrated, isLoading, error, login, register, logout, clearError, hydrate } = useAuthStore();

  return {
    user,
    isAuthenticated,
    isHydrated,
    isLoading,
    error,
    login,
    register,
    logout,
    clearError,
    hydrate,
  };
};
