import { useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { StoreHeader } from '@/widgets/store-header';
import { StoreFooter } from '@/widgets/store-footer/StoreFooter';
import { CartDrawer } from '@/features/cart';
import { Toaster } from '@/shared/ui/Toast';
import { useTenantStore } from '@/app/store/tenant.store';

export function StoreLayout() {
  const { currentTenant } = useTenantStore();

  useEffect(() => {
    if (currentTenant?.name) {
      document.title = `${currentTenant.name} — Tienda Oficial`;
    } else {
      document.title = 'FashionStore — Tienda Oficial';
    }
  }, [currentTenant?.name]);

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground selection:bg-primary selection:text-primary-foreground">
      {/* Barra de navegación de la tienda */}
      <StoreHeader />

      {/* Contenido principal de la página */}
      <main className="flex-1">
        <Outlet />
      </main>

      {/* Pie de página con datos de boutique */}
      <StoreFooter />

      {/* Drawer lateral de la bolsa de compras */}
      <CartDrawer />

      {/* Notificaciones Toaster */}
      <Toaster />
    </div>
  );
}
