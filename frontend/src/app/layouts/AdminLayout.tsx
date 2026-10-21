import { useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from '@/widgets/sidebar/Sidebar';
import { Topbar } from '@/widgets/topbar/Topbar';
import { Toaster } from '@/shared/ui/Toast';
import { useUiStore } from '@/app/store/ui.store';
import { useTenantStore } from '@/app/store/tenant.store';
import { SettingsModal } from '@/features/settings/ui/SettingsModal';

export function AdminLayout() {
  const { storeSettingsOpen, setStoreSettingsOpen } = useUiStore();
  const { currentTenant } = useTenantStore();

  useEffect(() => {
    if (currentTenant?.name) {
      document.title = `${currentTenant.name} — Panel de Control`;
    } else {
      document.title = 'FashionStore — Panel de Control';
    }
  }, [currentTenant?.name]);

  return (
    <div className="flex h-[100dvh] w-full overflow-hidden bg-background text-foreground">
      {/* Sidebar Navigation */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <Topbar />
        <main className="flex-1 overflow-y-auto p-6 bg-muted/20">
          <div className="max-w-7xl mx-auto space-y-6">
            <Outlet />
          </div>
        </main>
      </div>

      {/* Modal de Configuración de Tienda y Preferencias */}
      <SettingsModal
        open={storeSettingsOpen}
        onOpenChange={setStoreSettingsOpen}
        defaultTab="store"
      />

      {/* Global Toast Notifications */}
      <Toaster />
    </div>
  );
}

