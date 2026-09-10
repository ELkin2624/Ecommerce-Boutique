import React from 'react';
import { useAuthStore } from '@/app/store/auth.store';
import { AlertCircle } from 'lucide-react';
import { Button } from '@/shared/ui/Button';

export interface RequirePermissionProps {
  permission?: string | string[];
  role?: string | string[];
  children: React.ReactNode;
}

export function RequirePermission({ permission, role, children }: RequirePermissionProps) {
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
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] p-8 text-center">
        <div className="rounded-full bg-rose-100 dark:bg-rose-950/50 p-4 mb-4">
          <AlertCircle className="h-10 w-10 text-rose-600 dark:text-rose-400" />
        </div>
        <h2 className="text-xl font-bold tracking-tight">Acceso No Autorizado (403)</h2>
        <p className="mt-2 text-sm text-muted-foreground max-w-md">
          Su cuenta no dispone de los privilegios necesarios ({Array.isArray(permission) ? permission.join(', ') : permission}) para acceder a este módulo.
        </p>
        <div className="mt-6">
          <Button variant="outline" onClick={() => window.history.back()}>
            Volver Atrás
          </Button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
