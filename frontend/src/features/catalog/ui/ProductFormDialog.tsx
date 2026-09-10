import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { apiClient } from '@/shared/api/axios-client';
import { Dialog } from '@/shared/ui/Dialog';
import { Button } from '@/shared/ui/Button';
import { Input } from '@/shared/ui/Input';
import { Select } from '@/shared/ui/Select';
import { toast } from '@/shared/ui/Toast';

interface ProductFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  categories: Array<{ id: string; name: string }>;
  seasons: Array<{ id: string; name: string }>;
  onSuccess: () => void;
}

export function ProductFormDialog({
  open,
  onOpenChange,
  categories,
  seasons,
  onSuccess,
}: ProductFormDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { register, handleSubmit, reset } = useForm({
    defaultValues: {
      name: '',
      brand: 'FashionStore',
      description: '',
      categoryId: categories[0]?.id || '',
      seasonId: seasons[0]?.id || '',
    },
  });

  const onSubmit = async (data: any) => {
    setIsLoading(true);
    try {
      await apiClient.post('/catalog/products', {
        ...data,
        seasonId: data.seasonId || undefined,
      });
      toast.success('Producto creado', `El modelo "${data.name}" fue registrado exitosamente`);
      reset();
      onOpenChange(false);
      onSuccess();
    } catch (err: any) {
      toast.error('Error al crear producto', err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title="Nuevo Producto / Prenda"
      description="Registre un nuevo modelo base en el catálogo omnicanal"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Input label="Nombre de la Prenda" placeholder="Ej. Vestido Seda Floral" required {...register('name')} />
        <Input label="Marca" placeholder="FashionStore" {...register('brand')} />
        <Input label="Descripción" placeholder="Detalles de diseño, composición textil..." {...register('description')} />

        <Select
          label="Categoría"
          options={categories.map((c) => ({ value: c.id, label: c.name }))}
          {...register('categoryId')}
        />

        <Select
          label="Temporada (Opcional)"
          options={[{ value: '', label: 'Ninguna' }, ...seasons.map((s) => ({ value: s.id, label: s.name }))]}
          {...register('seasonId')}
        />

        <div className="flex justify-end gap-2 pt-2 border-t">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button type="submit" isLoading={isLoading}>
            Guardar Producto
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
