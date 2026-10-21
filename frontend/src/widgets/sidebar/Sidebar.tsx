import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard, ShoppingCart, ReceiptText, Boxes, CalendarCheck,
  Shirt, Building2, Users, Sparkles, Tag, Truck, PanelLeftClose,
  PanelLeftOpen, Settings,
} from 'lucide-react';
import { useAuthStore } from '@/app/store/auth.store';
import { useUiStore } from '@/app/store/ui.store';
import { useTenantStore } from '@/app/store/tenant.store';
import { cn } from '@/shared/lib/utils';
import { AppLogo } from '@/shared/ui/AppLogo';
import { BRAND_CONFIG } from '@/shared/config/brand.config';

interface NavGroup {
  label?: string;
  items: {
    title: string;
    href: string;
    icon: React.ComponentType<{ className?: string }>;
    permission?: string;
  }[];
}

const navGroups: NavGroup[] = [
  {
    label: 'GENERAL',
    items: [
      {
        title: 'Dashboard',
        href: '/dashboard',
        icon: LayoutDashboard,
      },
    ],
  },
  {
    label: 'VENTAS & POS',
    items: [
      {
        title: 'Punto de Venta (POS)',
        href: '/pos',
        icon: ShoppingCart,
        permission: 'ORDER:CREATE',
      },
      {
        title: 'Historial de Ventas',
        href: '/sales',
        icon: ReceiptText,
        permission: 'ORDER:VIEW',
      },
      {
        title: 'Reservas Probador',
        href: '/reservations',
        icon: CalendarCheck,
        permission: 'RESERVATION:VIEW',
      },
    ],
  },
  {
    label: 'TIENDA & STOCK',
    items: [
      {
        title: 'Catálogo & Prendas',
        href: '/catalog',
        icon: Shirt,
        permission: 'PRODUCT:READ',
      },
      {
        title: 'Inventario & Stock',
        href: '/inventory',
        icon: Boxes,
        permission: 'INVENTORY:VIEW',
      },
      {
        title: 'Promociones & Cupones',
        href: '/promotions',
        icon: Tag,
        permission: 'PRODUCT:READ',
      },
      {
        title: 'Proveedores',
        href: '/suppliers',
        icon: Truck,
        permission: 'PRODUCT:READ',
      },
    ],
  },
  {
    label: 'SISTEMA',
    items: [
      {
        title: 'Sucursales & Almacenes',
        href: '/branches',
        icon: Building2,
        permission: 'USER:READ',
      },
      {
        title: 'Usuarios & Roles',
        href: '/users',
        icon: Users,
        permission: 'USER:READ',
      },
      {
        title: 'Reportes IA (Voz/Texto)',
        href: '/reports',
        icon: Sparkles,
        permission: 'REPORT:GENERATE',
      },
    ],
  },
];

export function Sidebar() {
  const { hasPermission } = useAuthStore();
  const { sidebarOpen, toggleSidebar, setStoreSettingsOpen } = useUiStore();
  const { currentTenant } = useTenantStore();

  const storeName = currentTenant?.name || BRAND_CONFIG.name;
  const storeCategory =
    currentTenant?.category ||
    (currentTenant?.plan ? `Plan ${currentTenant.plan}` : BRAND_CONFIG.subtitle);

  return (
    <aside
      className={cn(
        'relative border-r border-border/70 bg-card transition-all duration-300 flex flex-col z-30 select-none shrink-0 h-screen',
        sidebarOpen ? 'w-64' : 'w-[68px]',
      )}
    >
      {/* Header del Sidebar */}
      <div
        className={cn(
          'flex h-16 items-center border-b border-border/60 transition-all px-3',
          sidebarOpen ? 'justify-between' : 'justify-center',
        )}
      >
        {sidebarOpen ? (
          <>
            <div className="flex items-center gap-2.5 min-w-0 flex-1">
              <AppLogo
                size="sm"
                showText={false}
                title={storeName}
                logoUrl={currentTenant?.logoUrl}
                primaryColor={currentTenant?.primaryColor || '#1D8B94'}
                useMonogram={true}
              />
              <div className="flex flex-col min-w-0 flex-1">
                <div className="flex items-center gap-1">
                  <span
                    className="font-bold text-sm text-foreground truncate font-serif"
                    title={storeName}
                  >
                    {storeName}
                  </span>
                  <button
                    type="button"
                    onClick={() => setStoreSettingsOpen(true)}
                    className="p-1 rounded-md text-muted-foreground hover:text-primary hover:bg-muted transition-colors shrink-0"
                    title="Editar nombre y configuración de tienda"
                  >
                    <Settings className="h-3 w-3" />
                  </button>
                </div>
                <span
                  className="text-[10px] text-muted-foreground truncate"
                  title={storeCategory}
                >
                  {storeCategory}
                </span>
              </div>
            </div>

            {/* Único botón de colapsar con tooltip */}
            <div className="relative group/collapse">
              <button
                type="button"
                onClick={toggleSidebar}
                className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
                aria-label="Colapsar menú"
              >
                <PanelLeftClose className="h-4 w-4" />
              </button>
              <div className="pointer-events-none absolute right-0 top-full mt-1.5 z-50 hidden group-hover/collapse:flex items-center px-2 py-0.5 text-[10px] font-medium text-background bg-foreground rounded shadow-md whitespace-nowrap animate-in fade-in-50 duration-150">
                Colapsar menú
              </div>
            </div>
          </>
        ) : (
          /* Botón interactivo cuando está colapsado: muestra el logo por defecto y al hacer hover muestra el icono 'Abrir menú' y su mensaje */
          <div className="relative group/toggle flex items-center justify-center">
            <button
              type="button"
              onClick={toggleSidebar}
              className="relative flex items-center justify-center h-11 w-11 rounded-xl hover:bg-muted/80 text-muted-foreground hover:text-foreground transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
              aria-label="Abrir menú"
            >
              {/* 1. Logo de la marca: visible siempre que el cursor NO esté encima */}
              <div className="transition-all duration-200 group-hover/toggle:opacity-0 group-hover/toggle:scale-75 group-hover/toggle:invisible flex items-center justify-center pointer-events-none">
                <AppLogo
                  size="xs"
                  showText={false}
                  imageClassName="h-7 w-7"
                  title={storeName}
                  logoUrl={currentTenant?.logoUrl}
                  primaryColor={currentTenant?.primaryColor || '#1D8B94'}
                  useMonogram={true}
                />
              </div>

              {/* 2. Icono de abrir menú: aparece al hacer hover sobre el botón */}
              <div className="absolute inset-0 flex items-center justify-center opacity-0 scale-75 invisible group-hover/toggle:opacity-100 group-hover/toggle:scale-100 group-hover/toggle:visible transition-all duration-200 text-primary pointer-events-none">
                <PanelLeftOpen className="h-5 w-5" />
              </div>
            </button>

            {/* Tooltip flotante con el texto "Abrir menú" */}
            <div className="pointer-events-none absolute left-full ml-3 z-50 hidden group-hover/toggle:flex items-center px-2.5 py-1 text-[11px] font-semibold tracking-wide text-background bg-foreground rounded-md shadow-xl whitespace-nowrap animate-in fade-in-50 zoom-in-95 duration-150">
              Abrir menú
              <div className="absolute -left-1 top-1/2 -translate-y-1/2 border-y-4 border-y-transparent border-r-4 border-r-foreground" />
            </div>
          </div>
        )}
      </div>

      {/* Lista de Navegación */}
      <nav className="flex-1 px-2.5 py-3 space-y-4 overflow-y-auto overflow-x-hidden scrollbar-thin">
        {navGroups.map((group, gIdx) => {
          const visibleItems = group.items.filter(
            (item) => !item.permission || hasPermission(item.permission),
          );

          if (visibleItems.length === 0) return null;

          return (
            <div key={gIdx} className="space-y-1">
              {/* Título de Sección */}
              {sidebarOpen && group.label && (
                <p className="px-3 text-[10px] font-bold uppercase tracking-wider text-muted-foreground/70 py-1">
                  {group.label}
                </p>
              )}

              {visibleItems.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.href}
                    to={item.href}
                    className={({ isActive }) =>
                      cn(
                        'flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium transition-all group',
                        isActive
                          ? 'bg-primary/10 text-primary font-semibold shadow-2xs'
                          : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                        !sidebarOpen && 'justify-center px-0 h-10 w-10 mx-auto',
                      )
                    }
                    title={!sidebarOpen ? item.title : undefined}
                  >
                    <Icon className="h-4 w-4 shrink-0 transition-transform group-hover:scale-105" />
                    {sidebarOpen && <span className="truncate">{item.title}</span>}
                  </NavLink>
                );
              })}
            </div>
          );
        })}
      </nav>

      {/* Footer Info sutil */}
      {sidebarOpen && (
        <div className="p-3 border-t border-border/50 text-[11px] text-muted-foreground/70 text-center flex flex-col items-center gap-0.5">
          <span className="font-semibold text-foreground/80 truncate max-w-[200px]">
            {storeName}
          </span>
          <span className="text-[10px] text-muted-foreground">
            Impulsado por FashionStore
          </span>
        </div>
      )}
    </aside>
  );
}
