import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/app/store/auth.store';

interface RequireStaffProps {
  children: React.ReactNode;
}

export function RequireStaff({ children }: RequireStaffProps) {
  const { isAuthenticated, isStaff, accessToken, refreshToken } = useAuthStore();
  const location = useLocation();

  if (!isAuthenticated && !accessToken && !refreshToken) {
    return <Navigate to="/admin/login" state={{ from: location }} replace />;
  }

  // Si está autenticado pero no es empleado/staff (ej. es un cliente común)
  if (isAuthenticated && !isStaff()) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}
