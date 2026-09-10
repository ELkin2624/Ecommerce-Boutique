import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { apiClient } from '@/shared/api/axios-client';
import { Dialog } from '@/shared/ui/Dialog';
import { Button } from '@/shared/ui/Button';
import { Input } from '@/shared/ui/Input';
import { toast } from '@/shared/ui/Toast';

interface VariantFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  productId: string;
  productName: string;
  onSuccess: () => void;
}

export function VariantFormDialog({
  open,
  onOpenChange,
  productId,
  productName,
  onSuccess,
}: VariantFormDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { register, handleSubmit, reset } = useForm({
    defaultValues: {
      sku: '',
      size: 'M',
      color: 'Negro',
      price: 150,
      cost: 75,
    },
  });

  const onSubmit = async (data: any) => {
    setIsLoading(true);
    try {
      await apiClient.post(`/catalog/products/${productId}/variants`, {
        sku: data.sku.toUpperCase(),
        size: data.size,
        color: data.color,
        price: Number(data.price),
        cost: Number(data.cost),
      });
      toast.success('Variante agregada', `SKU ${data.sku.toUpperCase()} registrado para ${productName}`);
      reset();
      onOpenChange(false);
      onSuccess();
    } catch (err: any) {
      toast.error('Error al crear variante', err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title={`Agregar Variante a: ${productName}`}
      description="Defina talla, color y precio para generar un nuevo SKU único"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Input
          label="Código SKU"
          placeholder="Ej. VEST-ROJ-M"
          required
          {...register('sku')}
        />

        <div className="grid grid-cols-2 gap-3">
          <Input label="Talla" placeholder="S, M, L, XL, 38..." required {...register('size')} />
          <Input label="Color" placeholder="Rojo, Azul, Negro..." required {...register('color')} />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Precio de Venta (BOB)"
            type="number"
            step="0.01"
            required
            {...register('price')}
          />
          <Input
            label="Costo Unitario (BOB)"
            type="number"
            step="0.01"
            required
            {...register('cost')}
          />
        </div>

        <div className="flex justify-end gap-2 pt-2 border-t">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button type="submit" isLoading={isLoading}>
            Crear Variante
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
