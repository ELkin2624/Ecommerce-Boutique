import { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AdminLayout } from '@/app/layouts/AdminLayout';
import { StoreLayout } from '@/app/layouts/StoreLayout';
import { RequireStaff } from './guards/RequireStaff';
import { RequireClient } from './guards/RequireClient';
import { RequirePermission } from './guards/RequirePermission';
import { AppLogo } from '@/shared/ui/AppLogo';
import { BRAND_CONFIG } from '@/shared/config/brand.config';

// Lazy loading Store (Clientes / E-commerce)
const StoreHomePage = lazy(() =>
  import('@/pages/store/StoreHomePage').then((m) => ({ default: m.StoreHomePage })),
);
const ProductDetailPage = lazy(() =>
  import('@/pages/store/ProductDetailPage').then((m) => ({ default: m.ProductDetailPage })),
);
const CartPage = lazy(() =>
  import('@/pages/store/CartPage').then((m) => ({ default: m.CartPage })),
);
const CheckoutPage = lazy(() =>
  import('@/pages/store/CheckoutPage').then((m) => ({ default: m.CheckoutPage })),
);
const ClientAuthPage = lazy(() =>
  import('@/pages/store/ClientAuthPage').then((m) => ({ default: m.ClientAuthPage })),
);
const ClientOrdersPage = lazy(() =>
  import('@/pages/store/ClientOrdersPage').then((m) => ({ default: m.ClientOrdersPage })),
);

// Lazy loading Admin / Staff (Backoffice & POS)
const AdminLoginPage = lazy(() =>
  import('@/pages/login/LoginPage').then((m) => ({ default: m.LoginPage })),
);
const DashboardPage = lazy(() =>
  import('@/pages/dashboard/DashboardPage').then((m) => ({ default: m.DashboardPage })),
);
const CatalogPage = lazy(() =>
  import('@/pages/catalog/CatalogPage').then((m) => ({ default: m.CatalogPage })),
);
const InventoryPage = lazy(() =>
  import('@/pages/inventory/InventoryPage').then((m) => ({ default: m.InventoryPage })),
);
const ReservationsPage = lazy(() =>
  import('@/pages/reservations/ReservationsPage').then((m) => ({ default: m.ReservationsPage })),
);
const PosPage = lazy(() =>
  import('@/pages/pos/PosPage').then((m) => ({ default: m.PosPage })),
);
const SalesPage = lazy(() =>
  import('@/pages/sales/SalesPage').then((m) => ({ default: m.SalesPage })),
);
const ReportsPage = lazy(() =>
  import('@/pages/reports/ReportsPage').then((m) => ({ default: m.ReportsPage })),
);
const BranchesPage = lazy(() =>
  import('@/pages/branches/BranchesPage').then((m) => ({ default: m.BranchesPage })),
);
const UsersPage = lazy(() =>
  import('@/pages/users/UsersPage').then((m) => ({ default: m.UsersPage })),
);
const PromotionsPage = lazy(() =>
  import('@/pages/promotions/PromotionsPage').then((m) => ({ default: m.PromotionsPage })),
);
const SuppliersPage = lazy(() =>
  import('@/pages/suppliers/SuppliersPage').then((m) => ({ default: m.SuppliersPage })),
);

export function AppRouter() {
  return (
    <BrowserRouter>
      <Suspense
        fallback={
          <div className="h-screen w-screen flex items-center justify-center bg-background">
            <div className="flex flex-col items-center gap-3">
              <AppLogo size="md" withContainer={true} className="animate-pulse" />
              <span className="text-xs font-semibold text-muted-foreground">
                Cargando {BRAND_CONFIG.name}...
              </span>
            </div>
          </div>
        }
      >
        <Routes>
          {/* ========================================================================= */}
          {/* 1. SECTOR CLIENTES (E-Commerce Storefront)                                */}
          {/* ========================================================================= */}
          <Route element={<StoreLayout />}>
            <Route index element={<StoreHomePage />} />
            <Route path="products/:id" element={<ProductDetailPage />} />
            <Route path="cart" element={<CartPage />} />
            <Route path="checkout" element={<CheckoutPage />} />
            <Route path="login" element={<ClientAuthPage />} />
            <Route path="register" element={<ClientAuthPage />} />
            <Route
              path="orders"
              element={
                <RequireClient>
                  <ClientOrdersPage />
                </RequireClient>
              }
            />
          </Route>

          {/* ========================================================================= */}
          {/* 2. ACCESO ADMINISTRATIVO Y POS                                           */}
          {/* ========================================================================= */}
          <Route path="/admin/login" element={<AdminLoginPage />} />

          {/* Redirección rápida /admin -> /dashboard */}
          <Route path="/admin" element={<Navigate to="/dashboard" replace />} />

          {/* ========================================================================= */}
          {/* 3. RUTAS PROTEGIDAS ADMINISTRATIVAS (RequireStaff: ADMIN, CASHIER, etc.) */}
          {/* ========================================================================= */}
          <Route
            element={
              <RequireStaff>
                <AdminLayout />
              </RequireStaff>
            }
          >
            <Route path="dashboard" element={<DashboardPage />} />

            {/* Punto de Venta (POS) */}
            <Route
              path="pos"
              element={
                <RequirePermission permission="ORDER:CREATE">
                  <PosPage />
                </RequirePermission>
              }
            />

            {/* Ventas y Pedidos */}
            <Route
              path="sales"
              element={
                <RequirePermission permission="ORDER:VIEW">
                  <SalesPage />
                </RequirePermission>
              }
            />

            {/* Inventario & Kardex */}
            <Route
              path="inventory"
              element={
                <RequirePermission permission="INVENTORY:VIEW">
                  <InventoryPage />
                </RequirePermission>
              }
            />

            {/* Reservas en Probador */}
            <Route
              path="reservations"
              element={
                <RequirePermission permission="RESERVATION:VIEW">
                  <ReservationsPage />
                </RequirePermission>
              }
            />

            {/* Catálogo y Prendas */}
            <Route
              path="catalog"
              element={
                <RequirePermission permission="PRODUCT:READ">
                  <CatalogPage />
                </RequirePermission>
              }
            />

            {/* Promociones y Cupones */}
            <Route
              path="promotions"
              element={
                <RequirePermission permission="PRODUCT:READ">
                  <PromotionsPage />
                </RequirePermission>
              }
            />

            {/* Proveedores */}
            <Route
              path="suppliers"
              element={
                <RequirePermission permission="PRODUCT:READ">
                  <SuppliersPage />
                </RequirePermission>
              }
            />

            {/* Sucursales y Ubicaciones */}
            <Route
              path="branches"
              element={
                <RequirePermission permission="USER:READ">
                  <BranchesPage />
                </RequirePermission>
              }
            />

            {/* Gestión de Usuarios y Roles */}
            <Route
              path="users"
              element={
                <RequirePermission permission="USER:READ">
                  <UsersPage />
                </RequirePermission>
              }
            />

            {/* Reportes Inteligentes por Voz/Texto */}
            <Route
              path="reports"
              element={
                <RequirePermission permission="REPORT:GENERATE">
                  <ReportsPage />
                </RequirePermission>
              }
            />
          </Route>

          {/* Fallback general */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}
