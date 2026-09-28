import { Download } from 'lucide-react';
import { usePwaInstall } from '../pwa/usePwaInstall';

interface PwaInstallButtonProps {
  className?: string;
}

/**
 * Botón para instalar la PWA como aplicación nativa en Windows, Android, Mac o iOS.
 * Se oculta automáticamente si la aplicación ya está instalada o no es instalable.
 */
export function PwaInstallButton({ className = '' }: PwaInstallButtonProps) {
  const { isInstallable, isInstalled, installApp } = usePwaInstall();

  if (isInstalled || !isInstallable) {
    return null;
  }

  return (
    <button
      type="button"
      onClick={installApp}
      className={`inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-stone-900 to-stone-800 dark:from-stone-100 dark:to-stone-200 px-3.5 py-1.5 text-xs font-semibold text-white dark:text-stone-900 shadow-sm transition-all hover:scale-105 active:scale-95 border border-stone-700 dark:border-stone-300 ${className}`}
      title="Instalar Boutique Kitty como aplicación de escritorio o móvil"
    >
      <Download className="h-3.5 w-3.5" />
      <span>Instalar App</span>
    </button>
  );
}
