import React, { useState, useRef, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Sun, Moon, LogOut, Store, ExternalLink, ChevronDown, Sliders,
  LayoutDashboard, Shirt, Boxes, ShoppingCart, ReceiptText,
  CalendarCheck, Users, Building2, Truck, Tag, Sparkles,
} from 'lucide-react';
import { useAuthStore } from '@/app/store/auth.store';
import { useSettingsStore } from '@/features/settings';
import { apiClient } from '@/shared/api/axios-client';
import { Badge } from '@/shared/ui/Badge';
import { SettingsModal } from '@/features/settings/ui/SettingsModal';
import { cn } from '@/shared/lib/utils';
import { OfflineBadge, PwaInstallButton } from '@/shared/offline';


// Diccionario de títulos por ruta
const ROUTE_TITLES: Record<string, { title: string; icon: React.ComponentType<{ className?: string }> }> = {
  '/dashboard': { title: 'Dashboard', icon: LayoutDashboard },
  '/catalog': { title: 'Catálogo & Prendas', icon: Shirt },
  '/inventory': { title: 'Inventario & Stock', icon: Boxes },
  '/pos': { title: 'Punto de Venta (POS)', icon: ShoppingCart },
  '/sales': { title: 'Historial de Ventas', icon: ReceiptText },
  '/reservations': { title: 'Reservas en Probador', icon: CalendarCheck },
  '/users': { title: 'Usuarios & Roles', icon: Users },
  '/branches': { title: 'Sucursales & Almacenes', icon: Building2 },
  '/suppliers': { title: 'Proveedores', icon: Truck },
  '/promotions': { title: 'Promociones & Cupones', icon: Tag },
  '/reports': { title: 'Reportes de Inteligencia', icon: Sparkles },
};

export function Topbar() {
  const location = useLocation();
  const { user, clearSession } = useAuthStore();
  const { settings, updateSetting } = useSettingsStore();

  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Cerrar menú al hacer clic afuera
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    try {
      await apiClient.post('/auth/logout');
    } catch {
      // Ignorar errores en logout
    } finally {
      clearSession();
      window.location.href = '/admin/login';
    }
  };

  const toggleThemeMode = () => {
    const nextTheme = settings.theme === 'dark' ? 'light' : 'dark';
    updateSetting('theme', nextTheme);
  };

  const currentRoute = ROUTE_TITLES[location.pathname] || {
    title: 'Panel Administrativo',
    icon: LayoutDashboard,
  };
  const Icon = currentRoute.icon;

  const initials = `${user?.firstName?.[0] || ''}${user?.lastName?.[0] || ''}`.toUpperCase() || 'AD';
  const roleName = user?.roles?.[0] || 'STAFF';

  return (
    <>
      <header className="h-16 border-b border-border/70 bg-card/85 backdrop-blur-md px-4 sm:px-6 flex items-center justify-between sticky top-0 z-20 select-none">
        {/* =======================================================================
            LADO IZQUIERDO: Título de Página Limpio
           ======================================================================= */}
        <div className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
            <Icon className="h-4 w-4" />
          </div>
          <h1 className="font-bold text-sm sm:text-base text-foreground tracking-tight">
            {currentRoute.title}
          </h1>
        </div>

        {/* =======================================================================
            LADO DERECHO: Tienda Online, Tema y Perfil de Usuario (Estilo AWS)
           ======================================================================= */}
        <div className="flex items-center gap-3">
          {/* Indicador de Conectividad & Sincronización */}
          <OfflineBadge className="hidden md:inline-flex" />

          {/* Botón de Instalación PWA */}
          <PwaInstallButton className="hidden lg:inline-flex" />

          {/* Acceso a la Tienda de Clientes */}
          <Link
            to="/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-muted border border-border/70 transition-all shadow-2xs"
            title="Abrir la tienda virtual de cara al cliente"
          >
            <Store className="h-3.5 w-3.5 text-primary" />
            <span className="hidden sm:inline">Tienda Online</span>
            <ExternalLink className="h-3 w-3 text-muted-foreground" />
          </Link>

          {/* Toggle Rápido de Tema */}
          <button
            onClick={toggleThemeMode}
            className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted transition-colors border border-border/70"
            title={settings.theme === 'dark' ? 'Cambiar a Modo Claro' : 'Cambiar a Modo Oscuro'}
          >
            {settings.theme === 'dark' ? (
              <Sun className="h-4 w-4 text-amber-500" />
            ) : (
              <Moon className="h-4 w-4 text-slate-600" />
            )}
          </button>

          {/* Separador vertical */}
          <div className="h-5 w-px bg-border/60" />

          {/* Perfil de Usuario con Menú AWS-Style + Configuración */}
          {user && (
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setIsDropdownOpen((prev) => !prev)}
                className={cn(
                  'flex items-center gap-2.5 p-1 sm:px-2.5 sm:py-1.5 rounded-xl transition-all border text-left',
                  isDropdownOpen
                    ? 'bg-muted border-border text-foreground'
                    : 'border-border/60 hover:bg-muted/80 text-muted-foreground hover:text-foreground',
                )}
              >
                {/* Avatar con Iniciales */}
                <div className="h-7 w-7 rounded-lg bg-primary text-primary-foreground font-bold text-xs flex items-center justify-center shrink-0 shadow-2xs">
                  {initials}
                </div>

                {/* Nombre y Rol */}
                <div className="hidden sm:flex flex-col">
                  <span className="text-xs font-bold leading-tight text-foreground truncate max-w-[120px]">
                    {user.firstName} {user.lastName}
                  </span>
                  <span className="text-[10px] text-muted-foreground uppercase font-semibold">
                    {roleName}
                  </span>
                </div>

                <ChevronDown
                  className={cn(
                    'h-3.5 w-3.5 text-muted-foreground transition-transform duration-200 hidden sm:block',
                    isDropdownOpen && 'rotate-180',
                  )}
                />
              </button>

              {/* Menú Desplegable */}
              {isDropdownOpen && (
                <div className="absolute right-0 mt-2 w-56 rounded-2xl border border-border bg-card shadow-xl p-1.5 z-50 animate-in fade-in-80 zoom-in-95 duration-150 text-xs">
                  {/* Info del Usuario */}
                  <div className="p-3 border-b border-border/70">
                    <p className="font-bold text-foreground truncate">
                      {user.firstName} {user.lastName}
                    </p>
                    <p className="text-[11px] text-muted-foreground truncate">{user.email}</p>
                    <div className="mt-1.5">
                      <Badge variant="outline" className="text-[9px] px-1.5 py-0 uppercase font-bold">
                        Rol: {roleName}
                      </Badge>
                    </div>
                  </div>

                  {/* Opciones del Menú */}
                  <div className="p-1 space-y-0.5">
                    {/* Opción de Configuración */}
                    <button
                      onClick={() => {
                        setIsSettingsOpen(true);
                        setIsDropdownOpen(false);
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-foreground hover:bg-muted transition-colors font-medium text-left"
                    >
                      <Sliders className="h-3.5 w-3.5 text-primary" />
                      <span>Configuración</span>
                    </button>

                    {/* Cerrar Sesión */}
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-destructive hover:bg-destructive/10 transition-colors font-semibold text-left"
                    >
                      <LogOut className="h-3.5 w-3.5" />
                      <span>Cerrar Sesión</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </header>

      {/* Modal de Configuración Desacoplado y Reutilizable */}
      <SettingsModal open={isSettingsOpen} onOpenChange={setIsSettingsOpen} />
    </>
  );
}
