import { create } from 'zustand';
import { CheckCircle, AlertCircle, Info, X } from 'lucide-react';
import { cn } from '@/shared/lib/utils';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface ToastItem {
  id: string;
  title: string;
  message?: string;
  type: ToastType;
}

interface ToastStore {
  toasts: ToastItem[];
  addToast: (toast: Omit<ToastItem, 'id'>) => void;
  removeToast: (id: string) => void;
}

export const useToastStore = create<ToastStore>((set) => ({
  toasts: [],
  addToast: (toast) => {
    const id = Math.random().toString(36).substring(2, 9);
    set((state) => ({ toasts: [...state.toasts, { ...toast, id }] }));
    setTimeout(() => {
      set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) }));
    }, 4500);
  },
  removeToast: (id) => set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) })),
}));

export const toast = {
  success: (title: string, message?: string) =>
    useToastStore.getState().addToast({ title, message, type: 'success' }),
  error: (title: string, message?: string) =>
    useToastStore.getState().addToast({ title, message, type: 'error' }),
  info: (title: string, message?: string) =>
    useToastStore.getState().addToast({ title, message, type: 'info' }),
  warning: (title: string, message?: string) =>
    useToastStore.getState().addToast({ title, message, type: 'warning' }),
};

export function Toaster() {
  const { toasts, removeToast } = useToastStore();

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col space-y-2 max-w-sm w-full pointer-events-none">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={cn(
            'pointer-events-auto flex items-start gap-3 rounded-lg border p-4 shadow-lg transition-all animate-in slide-in-from-bottom-5 duration-300',
            t.type === 'success' && 'bg-emerald-50 border-emerald-200 text-emerald-950 dark:bg-emerald-950 dark:border-emerald-800 dark:text-emerald-100',
            t.type === 'error' && 'bg-rose-50 border-rose-200 text-rose-950 dark:bg-rose-950 dark:border-rose-800 dark:text-rose-100',
            t.type === 'warning' && 'bg-amber-50 border-amber-200 text-amber-950 dark:bg-amber-950 dark:border-amber-800 dark:text-amber-100',
            t.type === 'info' && 'bg-sky-50 border-sky-200 text-sky-950 dark:bg-sky-950 dark:border-sky-800 dark:text-sky-100',
          )}
        >
          {t.type === 'success' && <CheckCircle className="h-5 w-5 text-emerald-600 mt-0.5 shrink-0" />}
          {t.type === 'error' && <AlertCircle className="h-5 w-5 text-rose-600 mt-0.5 shrink-0" />}
          {t.type === 'warning' && <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5 shrink-0" />}
          {t.type === 'info' && <Info className="h-5 w-5 text-sky-600 mt-0.5 shrink-0" />}
          <div className="flex-1">
            <h5 className="font-semibold text-sm leading-none">{t.title}</h5>
            {t.message && <p className="text-xs opacity-90 mt-1">{t.message}</p>}
          </div>
          <button
            onClick={() => removeToast(t.id)}
            className="opacity-70 hover:opacity-100 p-0.5"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ))}
    </div>
  );
}
