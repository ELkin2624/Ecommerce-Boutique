import React, { useState, useRef, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  Sun,
  Moon,
  LogOut,
  Store,
  ExternalLink,
  ChevronDown,
  Sliders,
  LayoutDashboard,
  Shirt,
  Boxes,
  ShoppingCart,
  ReceiptText,
  CalendarCheck,
  Users,
  Building2,
  Truck,
  Tag,
  Sparkles,
  Plus,
  Check,
  Loader2,
} from 'lucide-react';
import { useAuthStore } from '@/app/store/auth.store';
import { useTenantStore } from '@/app/store/tenant.store';
import { useSettingsStore } from '@/features/settings';
import { CreateStoreModal } from '@/features/saas';
import { apiClient } from '@/shared/api/axios-client';
import { queryClient } from '@/app/providers/QueryProvider';
import { offlineApi } from '@/shared/offline/client/offline-api-client';
import { Badge } from '@/shared/ui/Badge';
import { toast } from '@/shared/ui/Toast';
import { SettingsModal } from '@/features/settings/ui/SettingsModal';
import { cn } from '@/shared/lib/utils';
import { OfflineBadge, PwaInstallButton } from '@/shared/offline';

// Diccionario de títulos por ruta
const ROUTE_TITLES: Record<
  string,
  { title: string; icon: React.ComponentType<{ className?: string }> }
> = {
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
  const navigate = useNavigate();
  const { user, clearSession } = useAuthStore();
  const {
    currentTenant,
    myTenants,
    planQuota,
    isSwitchingTenant,
    fetchMyTenants,
    switchActiveTenant,
    clearTenantContext,
  } = useTenantStore();
  const { settings, updateSetting } = useSettingsStore();

  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isStoreSwitcherOpen, setIsStoreSwitcherOpen] = useState(false);
  const [isCreateStoreOpen, setIsCreateStoreOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const dropdownRef = useRef<HTMLDivElement>(null);
  const storeSwitcherRef = useRef<HTMLDivElement>(null);

  // Cargar tiendas autorizadas y cupo del plan del usuario autenticado
  useEffect(() => {
    if (user?.id) {
      fetchMyTenants();
    }
  }, [user?.id, fetchMyTenants]);

  // Cerrar menús al hacer clic afuera
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
      if (
        storeSwitcherRef.current &&
        !storeSwitcherRef.current.contains(event.target as Node)
      ) {
        setIsStoreSwitcherOpen(false);
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
      await offlineApi.clearTenantCache();
      queryClient.clear();
      clearTenantContext();
      clearSession();
      window.location.href = '/admin/login';
    }
  };

  const handleSelectTenant = async (slug: string) => {
    if (slug === currentTenant?.slug) {
      setIsStoreSwitcherOpen(false);
      return;
    }

    try {
      const target = await switchActiveTenant(slug);
      setIsStoreSwitcherOpen(false);
      toast.success(
        `Tienda activa: ${target.name}`,
        `Contexto cambiado a ${target.slug}.fashionstore.com`,
      );
      navigate('/dashboard');
    } catch (err: any) {
      toast.error(
        'No se pudo cambiar de tienda',
        err?.response?.data?.message || err?.message || 'Verifica tus permisos.',
      );
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

  const initials =
    `${user?.firstName?.[0] || ''}${user?.lastName?.[0] || ''}`.toUpperCase() || 'AD';
  const roleName = user?.roles?.[0] || 'STAFF';

  const storesList =
    myTenants.length > 0 ? myTenants : currentTenant ? [currentTenant] : [];

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
            LADO DERECHO: Selector Multi-Tienda, Crear Tienda, Tema y Perfil
           ======================================================================= */}
        <div className="flex items-center gap-2.5">
          {/* Selector Interactivo de Tienda + Botón Crear Nueva Tienda */}
          <div className="relative flex items-center gap-1.5" ref={storeSwitcherRef}>
            <button
              type="button"
              onClick={() => {
                setIsStoreSwitcherOpen((prev) => !prev);
                fetchMyTenants();
              }}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold bg-primary/10 text-primary hover:bg-primary/15 border border-primary/25 transition-all"
              title="Cambiar entre tus tiendas o crear una nueva tienda"
            >
              {isSwitchingTenant ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin shrink-0" />
              ) : (
                <Store className="h-3.5 w-3.5 shrink-0" />
              )}
              <span className="truncate max-w-[140px]">
                {currentTenant?.name || 'Seleccionar Tienda'}
              </span>
              {currentTenant?.plan && (
                <span className="hidden md:inline-block text-[9px] uppercase px-1.5 py-0.5 rounded-md bg-primary/15 text-primary font-extrabold">
                  {currentTenant.plan}
                </span>
              )}
              <ChevronDown
                className={cn(
                  'h-3.5 w-3.5 transition-transform duration-200',
                  isStoreSwitcherOpen && 'rotate-180',
                )}
              />
            </button>

            {/* Acción Rápida Visible: Crear Nueva Tienda */}
            <button
              type="button"
              onClick={() => setIsCreateStoreOpen(true)}
              className="hidden sm:inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-semibold bg-card hover:bg-muted text-foreground border border-border/80 transition-all shadow-2xs"
              title="Crear una nueva tienda independiente bajo tu cuenta"
            >
              <Plus className="h-3.5 w-3.5 text-primary" />
              <span className="hidden xl:inline">Crear nueva tienda</span>
            </button>

            {/* Menú Desplegable de Tiendas del Usuario */}
            {isStoreSwitcherOpen && (
              <div className="absolute right-0 top-full mt-2 w-72 rounded-2xl border border-border bg-card shadow-2xl p-2 z-50 animate-in fade-in-80 zoom-in-95 duration-150 text-xs">
                <div className="px-2.5 py-2 border-b border-border/70 flex items-center justify-between">
                  <div>
                    <p className="font-bold text-foreground">Mis Tiendas Autorizadas</p>
                    {planQuota && (
                      <p className="text-[10px] text-muted-foreground mt-0.5">
                        Plan {planQuota.effectivePlan}: {planQuota.ownedCount} de{' '}
                        {planQuota.maxStores}{' '}
                        {planQuota.maxStores === 1 ? 'tienda' : 'tiendas'}
                      </p>
                    )}
                  </div>
                  {planQuota && (
                    <Badge variant="outline" className="text-[9px] font-bold">
                      {planQuota.ownedCount}/{planQuota.maxStores}
                    </Badge>
                  )}
                </div>

                <div className="py-1.5 max-h-60 overflow-y-auto space-y-1">
                  {storesList.map((store) => {
                    const isActive = store.slug === currentTenant?.slug;
                    return (
                      <button
                        key={store.id || store.slug}
                        type="button"
                        disabled={isSwitchingTenant}
                        onClick={() => handleSelectTenant(store.slug)}
                        className={cn(
                          'w-full flex items-center justify-between gap-2 px-2.5 py-2 rounded-xl text-left transition-colors',
                          isActive
                            ? 'bg-primary/10 text-primary font-bold'
                            : 'hover:bg-muted text-foreground font-medium',
                        )}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span
                            className="h-6 w-6 rounded-lg flex items-center justify-center text-white text-[10px] font-bold shrink-0"
                            style={{
                              backgroundColor: store.primaryColor || '#1D8B94',
                            }}
                          >
                            {store.name?.slice(0, 2).toUpperCase() || 'FS'}
                          </span>
                          <div className="min-w-0">
                            <p className="truncate text-xs leading-tight">{store.name}</p>
                            <p className="truncate text-[10px] text-muted-foreground font-mono">
                              {store.slug}.fashionstore.com
                            </p>
                          </div>
                        </div>
                        {isActive && <Check className="h-4 w-4 text-primary shrink-0" />}
                      </button>
                    );
                  })}
                </div>

                <div className="pt-1.5 border-t border-border/70">
                  <button
                    type="button"
                    onClick={() => {
                      setIsStoreSwitcherOpen(false);
                      setIsCreateStoreOpen(true);
                    }}
                    className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 font-semibold transition-colors shadow-xs"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span>Crear nueva tienda</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Indicador de Conectividad & Sincronización */}
          <OfflineBadge className="hidden md:inline-flex" />

          {/* Botón de Instalación PWA */}
          <PwaInstallButton className="hidden lg:inline-flex" />

          {/* Acceso a la Tienda de Clientes */}
          <Link
            to={currentTenant?.slug ? `/store?tenant=${currentTenant.slug}` : '/store'}
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
                <div className="absolute right-0 mt-2 w-60 rounded-2xl border border-border bg-card shadow-xl p-1.5 z-50 animate-in fade-in-80 zoom-in-95 duration-150 text-xs">
                  {/* Info del Usuario */}
                  <div className="p-3 border-b border-border/70">
                    <p className="font-bold text-foreground truncate">
                      {user.firstName} {user.lastName}
                    </p>
                    <p className="text-[11px] text-muted-foreground truncate">{user.email}</p>
                    <div className="mt-1.5 flex items-center gap-1.5 flex-wrap">
                      <Badge variant="outline" className="text-[9px] px-1.5 py-0 uppercase font-bold">
                        Rol: {roleName}
                      </Badge>
                      {planQuota && (
                        <Badge variant="outline" className="text-[9px] px-1.5 py-0 font-bold">
                          Plan {planQuota.effectivePlan} ({planQuota.ownedCount}/{planQuota.maxStores})
                        </Badge>
                      )}
                    </div>
                  </div>

                  {/* Opciones del Menú */}
                  <div className="p-1 space-y-0.5">
                    {/* Opción: Crear nueva tienda desde el panel */}
                    <button
                      onClick={() => {
                        setIsDropdownOpen(false);
                        setIsCreateStoreOpen(true);
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-primary hover:bg-primary/10 transition-colors font-semibold text-left"
                    >
                      <Plus className="h-3.5 w-3.5 text-primary" />
                      <span>Crear nueva tienda</span>
                    </button>

                    {/* Opción: Cambiar de Tienda */}
                    <button
                      onClick={() => {
                        setIsDropdownOpen(false);
                        setIsStoreSwitcherOpen(true);
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-foreground hover:bg-muted transition-colors font-medium text-left"
                    >
                      <Store className="h-3.5 w-3.5 text-primary" />
                      <span>Mis tiendas ({storesList.length})</span>
                    </button>

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

      {/* Modal para Crear Nueva Tienda (reutilizando identidad global autenticada) */}
      <CreateStoreModal open={isCreateStoreOpen} onOpenChange={setIsCreateStoreOpen} />

      {/* Modal de Configuración Desacoplado y Reutilizable */}
      <SettingsModal open={isSettingsOpen} onOpenChange={setIsSettingsOpen} />
    </>
  );
}
