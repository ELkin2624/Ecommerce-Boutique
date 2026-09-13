import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/shared/api/axios-client';
import { queryKeys } from '@/shared/api/query-keys';
import { toast } from '@/shared/ui/Toast';
import type { DeleteTarget, MasterEntityType } from './types';

export function useProductMutations() {
  const queryClient = useQueryClient();

  const invalidateCatalog = () => {
    queryClient.invalidateQueries({ queryKey: ['catalog'] });
  };

  // Mutación de Eliminación Genérica
  const deleteMutation = useMutation({
    mutationFn: async (target: DeleteTarget) => {
      if (target.type === 'product') {
        const res = await apiClient.delete(`/catalog/products/${target.id}`);
        return res.data;
      }
      if (target.type === 'variant') {
        const res = await apiClient.delete(`/catalog/variants/${target.id}`);
        return res.data;
      }
      const res = await apiClient.delete(
        `/catalog/${
          target.type === 'category'
            ? 'categories'
            : target.type === 'season'
            ? 'seasons'
            : target.type === 'collection'
            ? 'collections'
            : 'suppliers'
        }/${target.id}`
      );
      return res.data;
    },
    onSuccess: (data, target) => {
      toast.success('Eliminado exitosamente', data?.message || `El elemento "${target.name}" fue eliminado.`);
      invalidateCatalog();
    },
    onError: (err: any) => {
      const msg = err.response?.data?.message || err.message || 'No se pudo eliminar el elemento';
      toast.error('Error al eliminar', msg);
    },
  });

  // Mutación para entidades maestras (Categoría, Temporada, Colección, Proveedor)
  const saveMasterEntityMutation = useMutation({
    mutationFn: async ({
      type,
      id,
      payload,
    }: {
      type: MasterEntityType;
      id?: string;
      payload: any;
    }) => {
      const endpoint = `/catalog/${type}`;
      if (id) {
        const res = await apiClient.patch(`${endpoint}/${id}`, payload);
        return res.data;
      }
      const res = await apiClient.post(endpoint, payload);
      return res.data;
    },
    onSuccess: () => {
      toast.success('Guardado exitoso', 'La información ha sido guardada en el catálogo');
      invalidateCatalog();
    },
    onError: (err: any) => {
      toast.error('Error al guardar', err.response?.data?.message || 'Verifica los datos');
    },
  });

  // Mutación para agregar imágenes a una prenda
  const addImagesMutation = useMutation({
    mutationFn: async ({
      productId,
      images,
    }: {
      productId: string;
      images: Array<{ imageUrl: string; isCover?: boolean; sortOrder?: number }>;
    }) => {
      const res = await apiClient.post(`/catalog/products/${productId}/images`, images);
      return res.data;
    },
    onSuccess: () => {
      toast.success('Galería actualizada', 'Las imágenes fueron agregadas exitosamente');
      queryClient.invalidateQueries({ queryKey: queryKeys.catalog.products() });
    },
    onError: (err: any) => {
      toast.error('Error al subir imagen', err.response?.data?.message || 'No se pudo guardar la imagen');
    },
  });

  // Mutación para eliminar imagen de una prenda
  const deleteImageMutation = useMutation({
    mutationFn: async ({ productId, imageId }: { productId: string; imageId: string }) => {
      const res = await apiClient.delete(`/catalog/products/${productId}/images/${imageId}`);
      return res.data;
    },
    onSuccess: () => {
      toast.success('Imagen eliminada', 'La fotografía fue removida de la galería');
      queryClient.invalidateQueries({ queryKey: queryKeys.catalog.products() });
    },
    onError: (err: any) => {
      toast.error('Error al eliminar imagen', err.response?.data?.message || 'No se pudo eliminar la imagen');
    },
  });

  // Mutación para marcar imagen como portada
  const setCoverImageMutation = useMutation({
    mutationFn: async ({ productId, imageId }: { productId: string; imageId: string }) => {
      const res = await apiClient.patch(`/catalog/products/${productId}/images/${imageId}/cover`);
      return res.data;
    },
    onSuccess: () => {
      toast.success('Portada establecida', 'La imagen ahora es la foto principal de la prenda');
      queryClient.invalidateQueries({ queryKey: queryKeys.catalog.products() });
    },
    onError: (err: any) => {
      toast.error('Error al cambiar portada', err.response?.data?.message || 'No se pudo actualizar la portada');
    },
  });

  return {
    deleteMutation,
    saveMasterEntityMutation,
    addImagesMutation,
    deleteImageMutation,
    setCoverImageMutation,
    invalidateCatalog,
  };
}
