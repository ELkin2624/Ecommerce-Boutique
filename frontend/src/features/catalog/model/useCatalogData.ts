import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/shared/api/axios-client';
import { queryKeys } from '@/shared/api/query-keys';
import type { Product, Category, Season, Collection, Supplier } from '@/shared/types/api';

interface UseCatalogDataProps {
  productSearch?: string;
  categoryFilter?: string;
  seasonFilter?: string;
}

export function useCatalogData({
  productSearch = '',
  categoryFilter = '',
  seasonFilter = '',
}: UseCatalogDataProps = {}) {
  // 1. Consultar productos
  const {
    data: productsData,
    isLoading: isProductsLoading,
    refetch: refetchProducts,
  } = useQuery<{ items: Product[]; meta: any }>({
    queryKey: queryKeys.catalog.products(),
    queryFn: async () => {
      const res = await apiClient.get('/catalog/products', { params: { limit: 100 } });
      return res.data;
    },
  });

  // 2. Consultar categorías
  const {
    data: categories = [],
    isLoading: isCategoriesLoading,
    refetch: refetchCategories,
  } = useQuery<Category[]>({
    queryKey: queryKeys.catalog.categories,
    queryFn: async () => {
      const res = await apiClient.get('/catalog/categories');
      return res.data;
    },
    staleTime: 0,
  });

  // 3. Consultar temporadas
  const {
    data: seasons = [],
    isLoading: isSeasonsLoading,
    refetch: refetchSeasons,
  } = useQuery<Season[]>({
    queryKey: queryKeys.catalog.seasons,
    queryFn: async () => {
      const res = await apiClient.get('/catalog/seasons');
      return res.data;
    },
    staleTime: 0,
  });

  // 4. Consultar colecciones
  const {
    data: collections = [],
    isLoading: isCollectionsLoading,
    refetch: refetchCollections,
  } = useQuery<Collection[]>({
    queryKey: queryKeys.catalog.collections,
    queryFn: async () => {
      const res = await apiClient.get('/catalog/collections');
      return res.data;
    },
    staleTime: 0,
  });

  // 5. Consultar proveedores
  const {
    data: suppliers = [],
    isLoading: isSuppliersLoading,
    refetch: refetchSuppliers,
  } = useQuery<Supplier[]>({
    queryKey: queryKeys.catalog.suppliers,
    queryFn: async () => {
      const res = await apiClient.get('/catalog/suppliers');
      return res.data;
    },
    staleTime: 0,
  });

  const allProducts: Product[] = useMemo(() => {
    if (Array.isArray(productsData)) return productsData;
    return (productsData?.items as Product[]) || [];
  }, [productsData]);

  // Filtrado de productos en cliente
  const filteredProducts = useMemo(() => {
    const term = productSearch.trim().toLowerCase();
    return allProducts.filter((p) => {
      const matchesSearch =
        !term ||
        p.name.toLowerCase().includes(term) ||
        (p.description && p.description.toLowerCase().includes(term)) ||
        p.brand.toLowerCase().includes(term) ||
        p.variants?.some(
          (v) =>
            v.sku.toLowerCase().includes(term) ||
            v.color.toLowerCase().includes(term) ||
            v.size.toLowerCase().includes(term)
        );

      const matchesCat = !categoryFilter || p.categoryId === categoryFilter || p.category?.id === categoryFilter;
      const matchesSeason = !seasonFilter || p.seasonId === seasonFilter || p.season?.id === seasonFilter;

      return matchesSearch && matchesCat && matchesSeason;
    });
  }, [allProducts, productSearch, categoryFilter, seasonFilter]);

  return {
    allProducts,
    filteredProducts,
    categories,
    seasons,
    collections,
    suppliers,
    isProductsLoading,
    isCategoriesLoading,
    isSeasonsLoading,
    isCollectionsLoading,
    isSuppliersLoading,
    isLoading:
      isProductsLoading ||
      isCategoriesLoading ||
      isSeasonsLoading ||
      isCollectionsLoading ||
      isSuppliersLoading,
    refetchProducts,
    refetchCategories,
    refetchSeasons,
    refetchCollections,
    refetchSuppliers,
    refetchAll: () => {
      refetchProducts();
      refetchCategories();
      refetchSeasons();
      refetchCollections();
      refetchSuppliers();
    },
  };
}
