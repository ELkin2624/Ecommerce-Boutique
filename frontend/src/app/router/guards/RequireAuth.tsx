import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/app/store/auth.store';

export function RequireAuth({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, accessToken, refreshToken } = useAuthStore();
  const location = useLocation();

  // Si no está autenticado ni tiene token para refresh, redirigir al login guardando la ruta previa
  if (!isAuthenticated && !accessToken && !refreshToken) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
}
