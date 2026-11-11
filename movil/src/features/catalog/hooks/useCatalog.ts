import { useState, useEffect, useCallback } from 'react';
import { apiClient } from '@/shared/api/api-client';
import { sqliteService } from '@/shared/db/sqlite.service';
import { useTenantStore } from '@/features/tenant/store/tenant.store';
import type { Product } from '@/entities/product/types';
import type { Promotion } from '@/entities/promotion/types';

export function useCatalog() {
  const activeTenantSlug = useTenantStore((state) => state.currentTenant?.slug);

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [loading, setLoading] = useState(true);
  const [isOfflineCatalog, setIsOfflineCatalog] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  // Al cambiar de tienda, reiniciar filtro de categoría seleccionada
  useEffect(() => {
    setSelectedCategory(null);
  }, [activeTenantSlug]);

  const fetchData = useCallback(async () => {
    if (!activeTenantSlug) {
      setProducts([]);
      setCategories([]);
      setPromotions([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // 1. Cargar primero desde SQLite local para disponibilidad inmediata Offline-First
      const localCatalog = await sqliteService.getTenantCatalogFromSqlite(
        activeTenantSlug,
        searchTerm,
        selectedCategory
      );

      setProducts(localCatalog.products);
      setCategories(localCatalog.categories);
      setPromotions(localCatalog.promotions);

      // 2. Intentar sincronizar con el backend cuando haya conexión
      try {
        const [prodsRes, catsRes, promosRes] = await Promise.all([
          apiClient.get<{ items: Product[] }>('/catalog/products', {
            search: searchTerm || undefined,
            categoryId: selectedCategory || undefined,
            limit: 30,
          }),
          apiClient.get<{ id: string; name: string }[]>('/catalog/categories').catch(() => []),
          apiClient.get<Promotion[]>('/promotions', { activeOnly: true }).catch(() => []),
        ]);

        const remoteItems = prodsRes?.items || [];
        const remoteCats = Array.isArray(catsRes) && catsRes.length > 0 ? catsRes : localCatalog.categories;
        const remotePromos = Array.isArray(promosRes) ? promosRes : localCatalog.promotions;

        if (remoteItems.length > 0) {
          setProducts(remoteItems);
          setCategories(remoteCats);
          setPromotions(remotePromos);
          setIsOfflineCatalog(false);
          useTenantStore.getState().setOfflineMode(false);

          // Si no hay filtros activos, persistir catálogo completo de la tienda en SQLite
          if (!searchTerm && !selectedCategory) {
            await sqliteService.saveTenantCatalogToSqlite(
              activeTenantSlug,
              remoteItems,
              remoteCats,
              remotePromos
            );
          }
        } else if (searchTerm || selectedCategory) {
          setProducts([]);
          setIsOfflineCatalog(false);
          useTenantStore.getState().setOfflineMode(false);
        } else {
          // Si la tienda remota aún no tiene productos cargados, usar el respaldo SQLite
          setIsOfflineCatalog(false);
          useTenantStore.getState().setOfflineMode(false);
        }
      } catch {
        // Modo Offline activo: mantener los productos, categorías y promociones cargados desde SQLite
        setIsOfflineCatalog(true);
        useTenantStore.getState().setOfflineMode(true);
        setError(null);
      }
    } catch {
      const fallback = await sqliteService.getTenantCatalogFromSqlite(
        activeTenantSlug,
        searchTerm,
        selectedCategory
      );
      setProducts(fallback.products);
      setCategories(fallback.categories);
      setPromotions(fallback.promotions);
      setIsOfflineCatalog(true);
      setError(null);
    } finally {
      setLoading(false);
    }
  }, [activeTenantSlug, searchTerm, selectedCategory]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    products,
    categories,
    promotions,
    loading,
    isOfflineCatalog,
    error,
    searchTerm,
    setSearchTerm,
    selectedCategory,
    setSelectedCategory,
    refetch: fetchData,
  };
}
