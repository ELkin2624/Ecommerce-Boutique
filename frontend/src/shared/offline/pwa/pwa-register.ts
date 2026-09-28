import { registerSW } from 'virtual:pwa-register';

export interface PwaRegistrationOptions {
  onNeedRefresh?: () => void;
  onOfflineReady?: () => void;
}

/**
 * Registrador del Service Worker de la PWA.
 * Gestiona actualizaciones transparentes de la aplicación sin recargas forzadas.
 */
export function registerPwaServiceWorker(options: PwaRegistrationOptions = {}) {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return () => {};
  }

  const updateSW = registerSW({
    onNeedRefresh() {
      console.log('[PWA] Nueva versión disponible');
      options.onNeedRefresh?.();
    },
    onOfflineReady() {
      console.log('[PWA] Aplicación lista para operar 100% offline');
      options.onOfflineReady?.();
    },
    onRegistered(registration) {
      console.log('[PWA] Service Worker registrado exitosamente:', registration?.scope);
    },
    onRegisterError(error) {
      console.error('[PWA] Error registrando Service Worker:', error);
    },
  });

  return updateSW;
}
