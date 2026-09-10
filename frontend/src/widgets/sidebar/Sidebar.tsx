import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  ShoppingCart,
  ReceiptText,
  Boxes,
  CalendarCheck,
  Shirt,
  Sparkles,
  ChevronLeft,
  Store,
} from 'lucide-react';
import { useAuthStore } from '@/app/store/auth.store';
import { useUiStore } from '@/app/store/ui.store';
import { cn } from '@/shared/lib/utils';

interface NavItem {
  title: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  permission?: string;
}

const navItems: NavItem[] = [
  {
    title: 'Dashboard',
    href: '/dashboard',
    icon: LayoutDashboard,
  },
  {
    title: 'Punto de Venta (POS)',
    href: '/pos',
    icon: ShoppingCart,
    permission: 'ORDER:CREATE_IN_STORE',
  },
  {
    title: 'Historial de Ventas',
    href: '/sales',
    icon: ReceiptText,
    permission: 'ORDER:VIEW',
  },
  {
    title: 'Inventario & Stock',
    href: '/inventory',
    icon: Boxes,
    permission: 'INVENTORY:VIEW',
  },
  {
    title: 'Reservas Probador',
    href: '/reservations',
    icon: CalendarCheck,
    permission: 'RESERVATION:VIEW',
  },
  {
    title: 'Catálogo & Variantes',
    href: '/catalog',
    icon: Shirt,
    permission: 'PRODUCT:VIEW',
  },
  {
    title: 'Reportes IA (Voz/Texto)',
    href: '/reports',
    icon: Sparkles,
    permission: 'REPORT:GENERATE',
  },
];

export function Sidebar() {
  const { hasPermission } = useAuthStore();
  const { sidebarOpen, toggleSidebar } = useUiStore();

  const filteredItems = navItems.filter((item) => {
    if (!item.permission) return true;
    return hasPermission(item.permission);
  });

  return (
    <aside
      className={cn(
        'relative border-r bg-card transition-all duration-300 flex flex-col z-30 select-none shrink-0',
        sidebarOpen ? 'w-64' : 'w-16',
      )}
    >
      {/* Brand Header */}
      <div className="flex h-16 items-center justify-between px-4 border-b">
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="h-9 w-9 rounded-lg bg-primary text-primary-foreground flex items-center justify-center font-bold text-lg shadow shrink-0">
            <Store className="h-5 w-5" />
          </div>
          {sidebarOpen && (
            <div className="flex flex-col overflow-hidden">
              <span className="font-bold text-sm leading-tight tracking-tight truncate">
                FashionStore
              </span>
              <span className="text-[10px] text-muted-foreground uppercase font-semibold tracking-wider">
                Panel Interno
              </span>
            </div>
          )}
        </div>
        <button
          onClick={toggleSidebar}
          className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
          title={sidebarOpen ? 'Colapsar menú' : 'Expandir menú'}
        >
          <ChevronLeft className={cn('h-4 w-4 transition-transform duration-200', !sidebarOpen && 'rotate-180')} />
        </button>
      </div>

      {/* Nav List */}
      <nav className="flex-1 p-2 space-y-1 overflow-y-auto">
        {filteredItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.href}
              to={item.href}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors group',
                  isActive
                    ? 'bg-primary text-primary-foreground shadow-sm font-semibold'
                    : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
                  !sidebarOpen && 'justify-center px-2',
                )
              }
              title={!sidebarOpen ? item.title : undefined}
            >
              <Icon className="h-4 w-4 shrink-0 transition-transform group-hover:scale-105" />
              {sidebarOpen && <span className="truncate">{item.title}</span>}
            </NavLink>
          );
        })}
      </nav>

      {/* Footer info */}
      {sidebarOpen && (
        <div className="p-3 border-t text-[11px] text-muted-foreground text-center">
          Omnichannel FashionStore v2.1
        </div>
      )}
    </aside>
  );
}
