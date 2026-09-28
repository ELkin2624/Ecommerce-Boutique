import { Outlet } from 'react-router-dom';
import { StoreHeader } from '@/widgets/store-header';
import { StoreFooter } from '@/widgets/store-footer/StoreFooter';
import { CartDrawer } from '@/features/cart';
import { Toaster } from '@/shared/ui/Toast';

export function StoreLayout() {
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
