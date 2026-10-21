import { useEffect } from 'react';
import { QueryProvider } from '@/app/providers/QueryProvider';
import { AppRouter } from '@/app/router/AppRouter';
import { useAuthStore } from '@/app/store/auth.store';
import { useTenantStore } from '@/app/store/tenant.store';
import { useSettingsStore } from '@/features/settings';
import {
  registerPwaServiceWorker,
  offlineApi,
  outboxManager,
  OfflineBanner,
} from '@/shared/offline';

export function App() {
  const user = useAuthStore((state) => state.user);
  const currentTenantSlug = useTenantStore((state) => state.currentTenant?.slug);

  useEffect(() => {
    // 1. Cargar automáticamente preferencias de usuario
    useSettingsStore.getState().loadUserSettings(user?.id || null, user?.preferences);

    // 2. Registrar el Service Worker de la PWA para soporte 100% offline
    registerPwaServiceWorker();

    // 3. Limpiar cualquier operación SaaS/Auth que hubiera quedado en cola por error previo
    outboxManager.purgeControlPlaneItems().catch(() => {});
  }, [user?.id, user?.preferences]);

  useEffect(() => {
    // 4. Precargar catálogos y datos críticos en IndexedDB solo cuando exista tienda activa
    if (user?.id && (currentTenantSlug || localStorage.getItem('fashionstore_tenant_slug'))) {
      offlineApi.preloadCriticalData();
    }
  }, [user?.id, currentTenantSlug]);

  return (
    <QueryProvider>
      <AppRouter />
      <OfflineBanner />
    </QueryProvider>
  );
}

export default App;

