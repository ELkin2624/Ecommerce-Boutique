import { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AdminLayout } from '@/app/layouts/AdminLayout';
import { RequireAuth } from './guards/RequireAuth';
import { RequirePermission } from './guards/RequirePermission';

// Lazy loading por página para code-splitting FSD óptimo
const LoginPage = lazy(() => import('@/pages/login/LoginPage').then((m) => ({ default: m.LoginPage })));
const DashboardPage = lazy(() => import('@/pages/dashboard/DashboardPage').then((m) => ({ default: m.DashboardPage })));
const CatalogPage = lazy(() => import('@/pages/catalog/CatalogPage').then((m) => ({ default: m.CatalogPage })));
const InventoryPage = lazy(() => import('@/pages/inventory/InventoryPage').then((m) => ({ default: m.InventoryPage })));
const ReservationsPage = lazy(() => import('@/pages/reservations/ReservationsPage').then((m) => ({ default: m.ReservationsPage })));
const PosPage = lazy(() => import('@/pages/pos/PosPage').then((m) => ({ default: m.PosPage })));
const SalesPage = lazy(() => import('@/pages/sales/SalesPage').then((m) => ({ default: m.SalesPage })));
const ReportsPage = lazy(() => import('@/pages/reports/ReportsPage').then((m) => ({ default: m.ReportsPage })));
const BranchesPage = lazy(() => import('@/pages/branches/BranchesPage').then((m) => ({ default: m.BranchesPage })));
const UsersPage = lazy(() => import('@/pages/users/UsersPage').then((m) => ({ default: m.UsersPage })));
const PromotionsPage = lazy(() => import('@/pages/promotions/PromotionsPage').then((m) => ({ default: m.PromotionsPage })));
const SuppliersPage = lazy(() => import('@/pages/suppliers/SuppliersPage').then((m) => ({ default: m.SuppliersPage })));

export function AppRouter() {
  return (
    <BrowserRouter>
      <Suspense
        fallback={
          <div className="h-screen w-screen flex items-center justify-center bg-background">
            <div className="flex flex-col items-center gap-3">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
              <span className="text-xs font-semibold text-muted-foreground">Cargando FashionStore...</span>
            </div>
          </div>
        }
      >
        <Routes>
          {/* Ruta pública: Login */}
          <Route path="/login" element={<LoginPage />} />

          {/* Rutas protegidas bajo AdminLayout */}
          <Route
            element={
              <RequireAuth>
                <AdminLayout />
              </RequireAuth>
            }
          >
            <Route index element={<Navigate to="/dashboard" replace />} />
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

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}
