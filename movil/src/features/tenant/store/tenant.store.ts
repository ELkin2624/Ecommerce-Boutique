import { create } from 'zustand';
import { appStorage } from '@/shared/lib/storage';
import { TENANT_STORAGE_KEYS, type TenantInfo } from '@/entities/tenant/types';
import { tenantApi } from '../api/tenant.api';
import { useCartStore } from '@/features/cart/model/useCartStore';
import { useAuthStore } from '@/features/auth/store/auth.store';

interface TenantState {
  currentTenant: TenantInfo | null;
  tenants: TenantInfo[];
  isLoading: boolean;
  isHydrated: boolean;
  error: string | null;

  hydrateTenant: () => Promise<void>;
  fetchTenants: () => Promise<TenantInfo[]>;
  selectTenant: (tenant: TenantInfo) => Promise<void>;
  clearTenant: () => Promise<void>;
}

export const useTenantStore = create<TenantState>((set, get) => ({
  currentTenant: null,
  tenants: [],
  isLoading: false,
  isHydrated: false,
  error: null,

  hydrateTenant: async () => {
    if (get().isHydrated) return;

    try {
      set({ isLoading: true, error: null });

      const [savedSlug, savedDataJson, remoteTenants] = await Promise.all([
        appStorage.getItem(TENANT_STORAGE_KEYS.ACTIVE_SLUG),
        appStorage.getItem(TENANT_STORAGE_KEYS.ACTIVE_DATA),
        tenantApi.getAllTenants().catch(() => [] as TenantInfo[]),
      ]);

      let resolvedCurrent: TenantInfo | null = null;

      if (savedSlug) {
        const matchedFromRemote = remoteTenants.find((t) => t.slug === savedSlug);
        if (matchedFromRemote) {
          resolvedCurrent = matchedFromRemote;
          await appStorage.setItem(
            TENANT_STORAGE_KEYS.ACTIVE_DATA,
            JSON.stringify(matchedFromRemote)
          );
        } else if (savedDataJson) {
          try {
            resolvedCurrent = JSON.parse(savedDataJson) as TenantInfo;
          } catch {
            resolvedCurrent = null;
          }
        }
      }

      set({
        tenants: remoteTenants,
        currentTenant: resolvedCurrent,
        isHydrated: true,
        isLoading: false,
      });
    } catch (err: any) {
      set({
        error: err?.message || 'Error al cargar las tiendas disponibles',
        isHydrated: true,
        isLoading: false,
      });
    }
  },

  fetchTenants: async () => {
    try {
      set({ isLoading: true, error: null });
      const list = await tenantApi.getAllTenants();
      const activeSlug = get().currentTenant?.slug;

      const updatedCurrent = activeSlug
        ? list.find((t) => t.slug === activeSlug) || get().currentTenant
        : null;

      set({
        tenants: list,
        currentTenant: updatedCurrent,
        isLoading: false,
      });
      return list;
    } catch (err: any) {
      set({
        error: err?.message || 'No se pudieron cargar las tiendas registradas',
        isLoading: false,
      });
      return [];
    }
  },

  selectTenant: async (tenant: TenantInfo) => {
    const previousSlug = get().currentTenant?.slug;
    const isSwitchingStore = Boolean(previousSlug && previousSlug !== tenant.slug);

    // 1. Guardar inmediatamente el nuevo slug antes de cualquier llamada subsiguiente
    await appStorage.setItem(TENANT_STORAGE_KEYS.ACTIVE_SLUG, tenant.slug);
    await appStorage.setItem(TENANT_STORAGE_KEYS.ACTIVE_DATA, JSON.stringify(tenant));

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
