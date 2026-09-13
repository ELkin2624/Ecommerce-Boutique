import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/shared/api/axios-client';
import { toast } from '@/shared/ui/Toast';

export function usePromotionMutations() {
  const queryClient = useQueryClient();

  const invalidatePromotions = () => {
    queryClient.invalidateQueries({ queryKey: ['promotions'] });
  };

  // Mutación para alternar estado activo/pausado
  const toggleStatusMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      const res = await apiClient.patch(`/promotions/${id}/status`, { isActive });
      return res.data;
    },
    onSuccess: (data) => {
      toast.success('Estado actualizado', data.message || 'El estado de la promoción ha cambiado');
      invalidatePromotions();
    },
    onError: (err: any) => {
      toast.error('Error al cambiar estado', err.response?.data?.message || err.message);
    },
  });

  // Mutación para eliminar promoción
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await apiClient.delete(`/promotions/${id}`);
      return res.data;
    },
    onSuccess: () => {
      toast.success('Promoción eliminada', 'La promoción fue retirada del sistema correctamente');
      invalidatePromotions();
    },
    onError: (err: any) => {
      toast.error('Error al eliminar', err.response?.data?.message || err.message);
    },
  });

  return {
    toggleStatusMutation,
    deleteMutation,
    invalidatePromotions,
  };
}
