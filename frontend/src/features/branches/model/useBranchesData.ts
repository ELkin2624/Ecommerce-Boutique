import { useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/shared/api/axios-client';
import { queryKeys } from '@/shared/api/query-keys';
import { STALE_TIMES } from '@/app/providers/QueryProvider';
import type { Branch, City } from '@/shared/types/api';
import type { EnrichedLocation } from './types';
import { toast } from '@/shared/ui/Toast';

export function useBranchesData({
  searchTerm,
  cityFilter,
  branchFilter,
}: {
  searchTerm: string;
  cityFilter: string;
  branchFilter: string;
}) {
  const queryClient = useQueryClient();

  const { data: branches = [], isLoading: isLoadingBranches } = useQuery<Branch[]>({
    queryKey: queryKeys.branches.all,
    queryFn: async () => {
      const res = await apiClient.get('/branches');
      return res.data;
    },
    staleTime: STALE_TIMES.SEMI,
  });

  const { data: cities = [] } = useQuery<City[]>({
    queryKey: queryKeys.branches.cities,
    queryFn: async () => {
      const res = await apiClient.get('/branches/cities');
      return res.data;
    },
    staleTime: STALE_TIMES.STATIC,
  });

  const deleteBranchMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await apiClient.delete(`/branches/${id}`);
      return res.data;
    },
    onSuccess: (data) => {
      toast.success('Sucursal eliminada', data.message || 'La sucursal fue eliminada correctamente');
      queryClient.invalidateQueries({ queryKey: queryKeys.branches.all });
    },
    onError: (err: any) => {
      toast.error(
        'No se pudo eliminar la sucursal',
        err.response?.data?.message || 'Verifica que la sucursal no tenga órdenes o reservas activas.',
      );
    },
  });

  const deleteLocationMutation = useMutation({
    mutationFn: async (locationId: string) => {
      const res = await apiClient.delete(`/branches/locations/${locationId}`);
      return res.data;
    },
    onSuccess: (data) => {
      toast.success('Ubicación eliminada', data.message || 'La ubicación fue removida exitosamente');
      queryClient.invalidateQueries({ queryKey: queryKeys.branches.all });
    },
    onError: (err: any) => {
      toast.error(
        'No se pudo eliminar la ubicación',
        err.response?.data?.message || 'Verifica que la ubicación no tenga existencias activas (stock > 0).',
      );
    },
  });

  const unassignWarehouseMutation = useMutation({
    mutationFn: async ({ branchId, warehouseId }: { branchId: string; warehouseId: string }) => {
      const res = await apiClient.delete(`/branches/${branchId}/warehouses/${warehouseId}`);
      return res.data;
    },
    onSuccess: () => {
      toast.success('Acceso removido', 'El almacén compartido fue desasignado de la sucursal.');
      queryClient.invalidateQueries({ queryKey: queryKeys.branches.all });
    },
    onError: (err: any) => {
      toast.error('Error al desasignar', err.response?.data?.message || 'No se pudo remover el acceso.');
    },
  });

  const { allWarehouses, allPos, branchWarehousesMap } = useMemo(() => {
    const warehousesMap = new Map<string, EnrichedLocation>();
    const posList: EnrichedLocation[] = [];
    const branchWhsMap = new Map<string, EnrichedLocation[]>();

    branches.forEach((branch) => {
      const branchWhs: EnrichedLocation[] = [];

      branch.locations?.forEach((loc) => {
        const enriched: EnrichedLocation = {
          id: loc.id,
          name: loc.name,
          type: loc.type,
          stocksCount: loc._count?.stocks ?? 0,
          isShared: false,
          branch: {
            id: branch.id,
            name: branch.name,
            address: branch.address,
            city: branch.city,
          },
          sharedByBranches: loc.sharedByBranches?.map((sb) => ({
            id: sb.id,
            name: sb.name,
            address: sb.address,
            city: sb.city,
          })) || [],
        };

        if (loc.type === 'WAREHOUSE') {
          warehousesMap.set(loc.id, enriched);
          branchWhs.push(enriched);
        } else if (loc.type === 'SALES_FLOOR') {
          posList.push(enriched);
        }
      });

      branch.sharedWarehouses?.forEach((loc) => {
        const enriched: EnrichedLocation = {
          id: loc.id,
          name: loc.name,
          type: loc.type,
          stocksCount: loc._count?.stocks ?? 0,
          isShared: true,
          branch: {
            id: loc.branch?.id || branch.id,
            name: loc.branch?.name || branch.name,
            address: loc.branch?.address || branch.address,
            city: loc.branch?.city || branch.city,
          },
          sharedByBranches: loc.sharedByBranches?.map((sb) => ({
            id: sb.id,
            name: sb.name,
            address: sb.address,
            city: sb.city,
          })) || [],
        };
        branchWhs.push(enriched);
      });

      branchWhsMap.set(branch.id, branchWhs);
    });

    return { allWarehouses: Array.from(warehousesMap.values()), allPos: posList, branchWarehousesMap: branchWhsMap };
  }, [branches]);

  const filteredBranches = useMemo(() => {
    return branches.filter((b) => {
      if (cityFilter !== 'ALL' && b.city?.name !== cityFilter) return false;
      if (!searchTerm.trim()) return true;
      const term = searchTerm.toLowerCase();
      return (
        b.name?.toLowerCase().includes(term) ||
        b.address?.toLowerCase().includes(term) ||
        b.city?.name?.toLowerCase().includes(term)
      );
    });
  }, [branches, cityFilter, searchTerm]);

  const filteredWarehouses = useMemo(() => {
    let source = allWarehouses;
    if (branchFilter !== 'ALL') {
      source = branchWarehousesMap.get(branchFilter) || [];
    }

    return source.filter((loc) => {
      if (cityFilter !== 'ALL' && loc.branch.city?.name !== cityFilter) return false;
      if (!searchTerm.trim()) return true;
      const term = searchTerm.toLowerCase();
      const matchOwner =
        loc.name.toLowerCase().includes(term) ||
        loc.branch.name.toLowerCase().includes(term) ||
        loc.branch.address.toLowerCase().includes(term);
      const matchShared = loc.sharedByBranches?.some(
        (sb) =>
          sb.name.toLowerCase().includes(term) ||
          sb.address?.toLowerCase().includes(term) ||
          sb.city?.name?.toLowerCase().includes(term)
      );
      return matchOwner || matchShared;
    });
  }, [allWarehouses, branchWarehousesMap, cityFilter, branchFilter, searchTerm]);

  const deleteCityMutation = useMutation({
    mutationFn: async (cityId: string) => {
      const res = await apiClient.delete(`/branches/cities/${cityId}`);
      return res.data;
    },
    onSuccess: (data) => {
      toast.success('Ciudad eliminada', data.message || 'La ciudad fue eliminada exitosamente');
      queryClient.invalidateQueries({ queryKey: queryKeys.branches.cities });
      queryClient.invalidateQueries({ queryKey: queryKeys.branches.all });
    },
    onError: (err: any) => {
      toast.error(
        'No se pudo eliminar la ciudad',
        err.response?.data?.message || 'Verifica que la ciudad no tenga sucursales asociadas.',
      );
    },
  });

  const filteredPos = useMemo(() => {
    return allPos.filter((loc) => {
      if (cityFilter !== 'ALL' && loc.branch.city?.name !== cityFilter) return false;
      if (branchFilter !== 'ALL' && loc.branch.id !== branchFilter) return false;
      if (!searchTerm.trim()) return true;
      const term = searchTerm.toLowerCase();
      return (
        loc.name.toLowerCase().includes(term) ||
        loc.branch.name.toLowerCase().includes(term) ||
        loc.branch.address.toLowerCase().includes(term)
      );
    });
  }, [allPos, cityFilter, branchFilter, searchTerm]);

  const filteredCities = useMemo(() => {
    return cities.filter((c) => {
      if (!searchTerm.trim()) return true;
      const term = searchTerm.toLowerCase();
      const matchName = c.name.toLowerCase().includes(term);
      const matchBranch = c.branches?.some(
        (b) => b.name.toLowerCase().includes(term) || b.address.toLowerCase().includes(term)
      );
      return matchName || matchBranch;
    });
  }, [cities, searchTerm]);

  return {
    branches,
    cities,
    isLoadingBranches,
    filteredBranches,
    filteredWarehouses,
    filteredPos,
    filteredCities,
    allWarehouses,
    deleteBranch: deleteBranchMutation.mutate,
    isDeletingBranch: deleteBranchMutation.isPending,
    deleteLocation: deleteLocationMutation.mutate,
    isDeletingLocation: deleteLocationMutation.isPending,
    unassignWarehouse: unassignWarehouseMutation.mutate,
    isUnassigningWarehouse: unassignWarehouseMutation.isPending,
    deleteCity: deleteCityMutation.mutate,
    isDeletingCity: deleteCityMutation.isPending,
  };
}
