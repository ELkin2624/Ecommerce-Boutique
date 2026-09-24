import { useState, useEffect, useCallback } from 'react';
import { apiClient } from '@/shared/api/api-client';
import type { Product } from '@/entities/product/types';
import type { Promotion } from '@/entities/promotion/types';

export function useCatalog() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const [prodsRes, catsRes, promosRes] = await Promise.all([
        apiClient.get<{ items: Product[] }>('/catalog/products', {
          search: searchTerm || undefined,
          categoryId: selectedCategory || undefined,
          limit: 30,
        }).catch(() => ({ items: [] })),
        apiClient.get<{ id: string; name: string }[]>('/catalog/categories').catch(() => []),
        apiClient.get<Promotion[]>('/promotions', { activeOnly: true }).catch(() => []),
      ]);

      setProducts(prodsRes.items || []);
      setCategories(catsRes || []);
      setPromotions(promosRes || []);
    } catch (err: any) {
      setError(err.message || 'Error al conectar con la tienda');
    } finally {
      setLoading(false);
    }
  }, [searchTerm, selectedCategory]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    products,
    categories,
    promotions,
    loading,
    error,
    searchTerm,
    setSearchTerm,
    selectedCategory,
    setSelectedCategory,
    refetch: fetchData,
  };
}
