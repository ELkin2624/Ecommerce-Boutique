import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { apiClient } from '@/shared/api/axios-client';
import { Dialog } from '@/shared/ui/Dialog';
import { Button } from '@/shared/ui/Button';
import { Input } from '@/shared/ui/Input';
import { Select } from '@/shared/ui/Select';
import { toast } from '@/shared/ui/Toast';

interface StockTransferDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  variantId: string;
  variantSku: string;
  fromLocationId: string;
  fromLocationName: string;
  maxQuantity: number;
  locations: Array<{ id: string; name: string; branch?: { name: string } }>;
  onSuccess: () => void;
}

export function StockTransferDialog({
  open,
  onOpenChange,
  variantId,
  variantSku,
  fromLocationId,
  fromLocationName,
  maxQuantity,
  locations,
  onSuccess,
}: StockTransferDialogProps) {
  const [isLoading, setIsLoading] = useState(false);

  // Excluir la ubicación origen
  const targetLocations = locations.filter((l) => l.id !== fromLocationId);

  const { register, handleSubmit, reset } = useForm({
    defaultValues: {
      toLocationId: targetLocations[0]?.id || '',
      quantity: 1,
      reason: 'Traslado interno de inventario',
    },
  });

  const onSubmit = async (data: any) => {
    setIsLoading(true);
    try {
      await apiClient.post('/inventory/transfer', {
        variantId,
        fromLocationId,
        toLocationId: data.toLocationId,
        quantity: Number(data.quantity),
        reason: data.reason,
      });

      toast.success(
        'Traslado Exitoso',
        `Se transfirieron ${data.quantity} unid. de SKU ${variantSku}`,
      );
      reset();
      onOpenChange(false);
      onSuccess();
    } catch (err: any) {
      toast.error('Error en transferencia', err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title="Transferencia entre Ubicaciones"
      description={`Trasladar unidades de SKU ${variantSku} desde ${fromLocationName}`}
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Select
          label="Ubicación / Sucursal Destino"
          options={targetLocations.map((l) => ({
            value: l.id,
            label: `${l.branch?.name ? `${l.branch.name} - ` : ''}${l.name}`,
          }))}
          required
          {...register('toLocationId')}
        />

        <Input
          label={`Cantidad a Trasladar (Máx: ${maxQuantity})`}
          type="number"
          min="1"
          max={maxQuantity}
          required
          {...register('quantity')}
        />

        <Input
          label="Motivo del Traslado"
          placeholder="Ej. Reabastecimiento de piso de venta..."
          required
          {...register('reason')}
        />

        <div className="flex justify-end gap-2 pt-2 border-t">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button type="submit" isLoading={isLoading}>
            Ejecutar Traslado
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
