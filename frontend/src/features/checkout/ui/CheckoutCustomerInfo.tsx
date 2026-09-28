import type { User } from '@/shared/types/api';

interface CheckoutCustomerInfoProps {
  user: User | null;
}

export function CheckoutCustomerInfo({ user }: CheckoutCustomerInfoProps) {
  return (
    <div className="rounded-2xl border border-border bg-card p-6 shadow-sm space-y-4">
      <h3 className="text-base font-bold text-foreground">1. Datos del Cliente</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
        <div className="p-3 rounded-xl bg-muted/40 border border-border space-y-1">
          <span className="text-muted-foreground">Comprador(a):</span>
          <p className="font-semibold text-sm text-foreground">
            {user?.firstName} {user?.lastName}
          </p>
        </div>
        <div className="p-3 rounded-xl bg-muted/40 border border-border space-y-1">
          <span className="text-muted-foreground">Correo de notificación:</span>
          <p className="font-semibold text-sm text-foreground truncate">{user?.email}</p>
        </div>
      </div>
    </div>
  );
}
