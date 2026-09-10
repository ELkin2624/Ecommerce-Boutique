import React from 'react';
import { useAuthStore } from '@/app/store/auth.store';

export interface CanProps {
  permission?: string | string[];
  role?: string | string[];
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

/**
 * Componente UX para visibilidad condicional de botones y elementos según permisos/roles.
 *
 * NOTA DE SEGURIDAD:
 * Este componente es exclusivamente para mejorar la experiencia de usuario (UX) en el cliente.
 * La seguridad definitiva e inviolable está garantizada por los Guards de NestJS en el backend.
 */
export function Can({ permission, role, children, fallback = null }: CanProps) {
  const { hasPermission, hasRole } = useAuthStore();

  let isAllowed = true;

  if (permission) {
    if (Array.isArray(permission)) {
      isAllowed = permission.some((p) => hasPermission(p));
    } else {
      isAllowed = hasPermission(permission);
    }
  }

  if (isAllowed && role) {
    if (Array.isArray(role)) {
      isAllowed = role.some((r) => hasRole(r));
    } else {
      isAllowed = hasRole(role);
    }
  }

  if (!isAllowed) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}

export function useCan(permission: string | string[]): boolean {
  const { hasPermission } = useAuthStore();
  if (Array.isArray(permission)) {
    return permission.some((p) => hasPermission(p));
  }
  return hasPermission(permission);
}

export function useHasRole(role: string | string[]): boolean {
  const { hasRole } = useAuthStore();
  if (Array.isArray(role)) {
    return role.some((r) => hasRole(r));
  }
  return hasRole(role);
}
