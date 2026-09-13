import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/shared/api/axios-client';
import type { Promotion, PromotionStats, PromotionsFilterParams } from './types';

export function usePromotionsData(filters: PromotionsFilterParams) {
  const { searchTerm, onlyActive } = filters;

  const {
    data: promotions = [],
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery<Promotion[]>({
    queryKey: ['promotions', onlyActive],
    queryFn: async () => {
      const res = await apiClient.get('/promotions', {
        params: onlyActive ? { activeOnly: true } : {},
      });
      return res.data;
    },
  });

  // Filtrado en memoria por término de búsqueda (nombre o código)
  const filteredPromotions = useMemo(() => {
    if (!searchTerm.trim()) return promotions;
    const term = searchTerm.toLowerCase();
    return promotions.filter(
      (p) =>
        p.name.toLowerCase().includes(term) ||
        p.code.toLowerCase().includes(term) ||
        (p.description && p.description.toLowerCase().includes(term)),
    );
  }, [promotions, searchTerm]);

  // Cálculo de KPIs / Estadísticas
  const stats: PromotionStats = useMemo(() => {
    const now = new Date();
    const activeCount = promotions.filter(
      (p) => p.isActive && new Date(p.endDate) >= now,
    ).length;

    const maxDiscount =
      promotions.length > 0
        ? Math.max(...promotions.map((p) => Number(p.discountPercent) || 0))
        : 0;

    return {
      activeCount,
      maxDiscount,
      totalCount: promotions.length,
    };
  }, [promotions]);

  return {
    promotions,
    filteredPromotions,
    stats,
    isLoading,
    isError,
    error,
    refetch,
  };
}
