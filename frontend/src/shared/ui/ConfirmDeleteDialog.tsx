import { AlertTriangle, X } from 'lucide-react';
import { Button } from '@/shared/ui/Button';

interface ConfirmDeleteDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  itemName?: string;
  confirmText?: string;
  isPending?: boolean;
}

export function ConfirmDeleteDialog({
  open,
  onClose,
  onConfirm,
  title,
  description,
  itemName,
  confirmText = 'Eliminar definitivamente',
  isPending = false,
}: ConfirmDeleteDialogProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-md rounded-2xl border border-destructive/30 bg-card text-card-foreground shadow-2xl p-6 space-y-4">
        <button
          onClick={onClose}
          disabled={isPending}
          className="absolute right-4 top-4 rounded-md p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="flex items-start gap-3.5">
          <div className="p-3 rounded-xl bg-destructive/10 text-destructive shrink-0 mt-0.5">
            <AlertTriangle className="h-6 w-6" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-bold text-foreground leading-tight">{title}</h3>
            {itemName && (
              <p className="text-xs font-semibold text-primary">
                &ldquo;{itemName}&rdquo;
              </p>
            )}
            <p className="text-xs text-muted-foreground leading-relaxed pt-1">
              {description}
            </p>
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-3 border-t">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={isPending}
            onClick={onClose}
          >
            Cancelar
          </Button>
          <Button
            type="button"
            variant="destructive"
            size="sm"
            disabled={isPending}
            onClick={onConfirm}
          >
            {isPending ? 'Eliminando...' : confirmText}
          </Button>
        </div>
      </div>
    </div>
  );
}
