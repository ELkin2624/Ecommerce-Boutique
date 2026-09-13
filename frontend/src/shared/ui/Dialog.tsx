import * as React from 'react';
import { X } from 'lucide-react';
import { cn } from '@/shared/lib/utils';

export interface DialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
}

export function Dialog({ open, onOpenChange, title, description, children, className }: DialogProps) {
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onOpenChange(false);
      }
    };
    if (open) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [open, onOpenChange]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 md:p-6 overflow-hidden">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-950/70 backdrop-blur-md transition-opacity"
        onClick={() => onOpenChange(false)}
      />
      {/* Content */}
      <div
        className={cn(
          'relative z-50 w-full max-w-lg rounded-2xl border border-border bg-white dark:bg-slate-900 text-foreground shadow-2xl flex flex-col max-h-[92vh] animate-in fade-in-0 zoom-in-95 duration-200',
          className,
        )}
      >
        {/* Header Fijo */}
        <div className="flex items-start justify-between p-5 pb-3.5 border-b shrink-0 bg-white/50 dark:bg-slate-900/50 backdrop-blur-xs">
          <div className="pr-4">
            <h2 className="text-lg font-semibold leading-tight tracking-tight">{title}</h2>
            {description && (
              <p className="mt-1 text-xs text-muted-foreground leading-relaxed">{description}</p>
            )}
          </div>
          <button
            onClick={() => onOpenChange(false)}
            className="rounded-lg opacity-70 ring-offset-background transition-all hover:opacity-100 hover:bg-muted p-1.5 shrink-0 text-muted-foreground hover:text-foreground"
            title="Cerrar modal"
          >
            <X className="h-4 w-4" />
            <span className="sr-only">Cerrar</span>
          </button>
        </div>

        {/* Body Scrolleable */}
        <div className="p-5 overflow-y-auto flex-1 overscroll-contain">
          {children}
        </div>
      </div>
    </div>
  );
}
