import { AlertTriangle, UserCheck } from 'lucide-react';
import type { UserListItem } from '@/shared/types/api';
import { Button } from '@/shared/ui/Button';

interface UserStatusDialogProps {
  userToToggle: UserListItem | null;
  onClose: () => void;
  onConfirm: (id: string, isActive: boolean) => void;
  isPending: boolean;
}

export function UserStatusDialog({
  userToToggle,
  onClose,
  onConfirm,
  isPending,
}: UserStatusDialogProps) {
  if (!userToToggle) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-md rounded-2xl border border-border bg-white dark:bg-slate-900 text-foreground p-6 shadow-2xl space-y-5 animate-in zoom-in-95 duration-200">
        {/* Header del Modal */}
        <div className="flex items-start gap-3.5">
          <div
            className={`h-11 w-11 shrink-0 rounded-xl flex items-center justify-center border shadow-sm ${
              userToToggle.isActive
                ? 'bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 border-red-200 dark:border-red-900/50'
                : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900/50'
            }`}
          >
            {userToToggle.isActive ? (
              <AlertTriangle className="h-5 w-5" />
            ) : (
              <UserCheck className="h-5 w-5" />
            )}
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-bold tracking-tight text-slate-900 dark:text-slate-100">
              {userToToggle.isActive ? '¿Suspender / Banear usuario?' : '¿Reactivar cuenta de usuario?'}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              {userToToggle.fullName} <span className="opacity-70">&bull; {userToToggle.email}</span>
            </p>
          </div>
        </div>

        {/* Caja Informativa de Política */}
        <div className="text-xs rounded-xl p-3.5 border bg-slate-50 dark:bg-slate-800/60 border-slate-200/80 dark:border-slate-700/60 text-slate-600 dark:text-slate-300 space-y-1 leading-relaxed">
          {userToToggle.isActive ? (
            <>
              <p className="font-semibold text-red-600 dark:text-red-400 flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-red-500" />
                Política de Seguridad
              </p>
              <p>
                El usuario no podrá iniciar sesión y todas sus sesiones activas serán revocadas inmediatamente. Sus compras, ventas y reservas históricas se conservarán intactas para fines de auditoría legal y financiera.
              </p>
            </>
          ) : (
            <p className="text-slate-600 dark:text-slate-300">
              El usuario recuperará el acceso inmediato al sistema con sus credenciales y permisos habituales.
            </p>
          )}
        </div>

        {/* Botones de Acción */}
        <div className="flex justify-end items-center gap-2.5 pt-3 border-t border-slate-100 dark:border-slate-800">
          <Button
            variant="outline"
            size="sm"
            className="h-9 px-4 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 border-slate-300 dark:border-slate-700"
            disabled={isPending}
            onClick={onClose}
          >
            Cancelar
          </Button>
          <Button
            variant={userToToggle.isActive ? 'destructive' : 'default'}
            size="sm"
            className={`h-9 px-4 text-xs font-semibold shadow-sm ${
              userToToggle.isActive
                ? 'bg-red-600 hover:bg-red-700 text-white'
                : 'bg-emerald-600 hover:bg-emerald-700 text-white'
            }`}
            disabled={isPending}
            onClick={() => onConfirm(userToToggle.id, !userToToggle.isActive)}
          >
            {isPending
              ? 'Procesando...'
              : userToToggle.isActive
              ? 'Confirmar Suspensión'
              : 'Confirmar Reactivación'}
          </Button>
        </div>
      </div>
    </div>
  );
}
