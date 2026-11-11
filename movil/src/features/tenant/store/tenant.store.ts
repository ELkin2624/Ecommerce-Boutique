import { create } from 'zustand';
import { appStorage } from '@/shared/lib/storage';
import { sqliteService } from '@/shared/db/sqlite.service';
import { TENANT_STORAGE_KEYS, type TenantInfo } from '@/entities/tenant/types';
import { tenantApi } from '../api/tenant.api';
import { useCartStore } from '@/features/cart/model/useCartStore';
import { useAuthStore } from '@/features/auth/store/auth.store';

interface TenantState {
  currentTenant: TenantInfo | null;
  tenants: TenantInfo[];
  isLoading: boolean;
  isHydrated: boolean;
  isOfflineMode: boolean;
  error: string | null;

  hydrateTenant: () => Promise<void>;
  fetchTenants: () => Promise<TenantInfo[]>;
  selectTenant: (tenant: TenantInfo) => Promise<void>;
  clearTenant: () => Promise<void>;
  setOfflineMode: (offline: boolean) => void;
}

export const useTenantStore = create<TenantState>((set, get) => ({
  currentTenant: null,
  tenants: [],
  isLoading: false,
  isHydrated: false,
  isOfflineMode: false,
  error: null,

  setOfflineMode: (offline: boolean) => {
    if (get().isOfflineMode !== offline) {
      set({ isOfflineMode: offline });
    }
  },

  hydrateTenant: async () => {
    if (get().isHydrated) return;

    try {
      set({ isLoading: true, error: null });

      // 1. Inicializar SQLite y cargar instantáneamente tiendas locales y tenant activo
      await sqliteService.initDatabase();
      const [savedSlug, savedDataJson, sqliteTenants] = await Promise.all([
        appStorage.getItem(TENANT_STORAGE_KEYS.ACTIVE_SLUG),
        appStorage.getItem(TENANT_STORAGE_KEYS.ACTIVE_DATA),
        sqliteService.getTenantsFromSqlite(),
      ]);

      let resolvedCurrent: TenantInfo | null = null;
      if (savedSlug) {
        resolvedCurrent =
          sqliteTenants.find((t) => t.slug === savedSlug) ||
          (savedDataJson ? (JSON.parse(savedDataJson) as TenantInfo) : null);
      }

      // Hidratar inmediatamente con los datos de SQLite para soporte Offline-First
      set({
        tenants: sqliteTenants,
        currentTenant: resolvedCurrent,
        isHydrated: true,
        isLoading: false,
      });

      // 2. Sincronizar en segundo plano con el servidor / nube si hay conexión
      try {
        const remoteTenants = await tenantApi.getAllTenants();
        if (Array.isArray(remoteTenants) && remoteTenants.length > 0) {
          await sqliteService.saveTenantsToSqlite(remoteTenants);
          const allSavedTenants = await sqliteService.getTenantsFromSqlite();

          const activeSlug = get().currentTenant?.slug || savedSlug;
          const syncedCurrent = activeSlug
            ? allSavedTenants.find((t) => t.slug === activeSlug) || get().currentTenant
            : get().currentTenant;

          if (syncedCurrent) {
            await appStorage.setItem(
              TENANT_STORAGE_KEYS.ACTIVE_DATA,
              JSON.stringify(syncedCurrent)
            );
          }

          set({
            tenants: allSavedTenants,
            currentTenant: syncedCurrent,
            isOfflineMode: false,
            error: null,
          });
        } else {
          set({ isOfflineMode: false });
        }
      } catch {
        // Sin conexión al backend: mantener las tiendas de SQLite en Modo Offline
        set({
          tenants: sqliteTenants,
          isOfflineMode: true,
          error: null,
        });
      }
    } catch {
      const fallbackList = await sqliteService.getTenantsFromSqlite();
      set({
        tenants: fallbackList,
        isOfflineMode: true,
        isHydrated: true,
        isLoading: false,
        error: null,
      });
    }
  },

  fetchTenants: async () => {
    try {
      set({ isLoading: true, error: null });

      // 1. Cargar primero desde SQLite para respuesta inmediata
      const localList = await sqliteService.getTenantsFromSqlite();
      if (localList.length > 0 && get().tenants.length === 0) {
        set({ tenants: localList });
      }

      // 2. Intentar sincronizar con el servidor / nube para guardar tiendas nuevas
      try {
        const remoteList = await tenantApi.getAllTenants();
        if (Array.isArray(remoteList) && remoteList.length > 0) {
          await sqliteService.saveTenantsToSqlite(remoteList);
          const allSavedTenants = await sqliteService.getTenantsFromSqlite();

          const activeSlug = get().currentTenant?.slug;
          const updatedCurrent = activeSlug
            ? allSavedTenants.find((t) => t.slug === activeSlug) || get().currentTenant
            : null;

          set({
            tenants: allSavedTenants,
            currentTenant: updatedCurrent,
            isOfflineMode: false,
            isLoading: false,
            error: null,
          });
          return allSavedTenants;
        }
      } catch {
        // Servidor no disponible: operar desde SQLite en Modo Offline sin bloquear al usuario
        set({
          tenants: localList,
          isOfflineMode: true,
          isLoading: false,
          error: null,
        });
        return localList;
      }

      set({
        tenants: localList,
        isOfflineMode: false,
        isLoading: false,
      });
      return localList;
    } catch {
      const fallbackList = await sqliteService.getTenantsFromSqlite();
      set({
        tenants: fallbackList,
        isOfflineMode: true,
        isLoading: false,
        error: null,
      });
      return fallbackList;
    }
  },

  selectTenant: async (tenant: TenantInfo) => {
    const previousSlug = get().currentTenant?.slug;
    const isSwitchingStore = Boolean(previousSlug && previousSlug !== tenant.slug);

    // 1. Guardar inmediatamente el nuevo slug y asegurar registro en SQLite
    await appStorage.setItem(TENANT_STORAGE_KEYS.ACTIVE_SLUG, tenant.slug);
    await appStorage.setItem(TENANT_STORAGE_KEYS.ACTIVE_DATA, JSON.stringify(tenant));
    await sqliteService.saveTenantsToSqlite([tenant]);

    // 2. Si cambia de una tienda a otra distinta, aislar carrito y sesión del esquema anterior
    if (isSwitchingStore) {
      try {
        await useCartStore.getState().resetOnLogout();
        const isAuth = useAuthStore.getState().isAuthenticated;
        if (isAuth) {
          await useAuthStore.getState().logout();
        }
      } catch {
        // Ignorar errores de limpieza de estado previo
      }
    }

    set({ currentTenant: tenant, error: null });
  },

  clearTenant: async () => {
    await appStorage.removeItem(TENANT_STORAGE_KEYS.ACTIVE_SLUG);
    await appStorage.removeItem(TENANT_STORAGE_KEYS.ACTIVE_DATA);
    set({ currentTenant: null });
  },
}));
