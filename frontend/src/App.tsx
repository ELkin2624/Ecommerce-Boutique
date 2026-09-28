import { useEffect } from 'react';
import { QueryProvider } from '@/app/providers/QueryProvider';
import { AppRouter } from '@/app/router/AppRouter';
import { useAuthStore } from '@/app/store/auth.store';
import { useSettingsStore } from '@/features/settings';
import { registerPwaServiceWorker, offlineApi, OfflineBanner } from '@/shared/offline';

export function App() {
  const user = useAuthStore((state) => state.user);

  useEffect(() => {
    // 1. Cargar automáticamente preferencias de usuario
    useSettingsStore.getState().loadUserSettings(user?.id || null, user?.preferences);

    // 2. Registrar el Service Worker de la PWA para soporte 100% offline
    registerPwaServiceWorker();

    // 3. Precargar catálogos y datos críticos en IndexedDB (Dexie)
    offlineApi.preloadCriticalData();
  }, [user?.id, user?.preferences]);

  return (
    <QueryProvider>
      <AppRouter />
      <OfflineBanner />
    </QueryProvider>
  );
}

export default App;

