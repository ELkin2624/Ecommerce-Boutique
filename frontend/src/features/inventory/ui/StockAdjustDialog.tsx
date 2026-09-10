import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { apiClient } from '@/shared/api/axios-client';
import { Dialog } from '@/shared/ui/Dialog';
import { Button } from '@/shared/ui/Button';
import { Input } from '@/shared/ui/Input';
import { toast } from '@/shared/ui/Toast';

interface StockAdjustDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  variantId: string;
  variantSku: string;
  locationId: string;
  locationName: string;
  currentQuantity: number;
  onSuccess: () => void;
}

export function StockAdjustDialog({
  open,
  onOpenChange,
  variantId,
  variantSku,
  locationId,
  locationName,
  currentQuantity,
  onSuccess,
}: StockAdjustDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { register, handleSubmit, reset } = useForm({
    defaultValues: {
      newQuantity: currentQuantity,
      reason: '',
    },
  });

  const onSubmit = async (data: any) => {
    setIsLoading(true);
    try {
      await apiClient.post('/inventory/adjust', {
        variantId,
        locationId,
        newQuantity: Number(data.newQuantity),
        reason: data.reason,
      });

      toast.success(
        'Ajuste Registrado',
        `Stock de SKU ${variantSku} actualizado a ${data.newQuantity} en ${locationName}`,
      );
      reset();
      onOpenChange(false);
      onSuccess();
    } catch (err: any) {
      toast.error('Error al ajustar stock', err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title="Ajuste Manual de Inventario (Kardex)"
      description={`Ajustar stock físico para SKU ${variantSku} en ${locationName}`}
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="p-3 bg-muted/40 rounded-md border text-xs space-y-1">
          <p>
            <span className="font-semibold">Stock Actual Registrado:</span> {currentQuantity} unidades
          </p>
          <p className="text-muted-foreground">
            El cambio generará un movimiento de tipo <span className="font-mono font-bold">ADJUSTMENT</span> en el Kardex auditable.
          </p>
        </div>

        <Input
          label="Nueva Cantidad Física Real"
          type="number"
          min="0"
          required
          {...register('newQuantity')}
        />

        <div className="space-y-1">
          <label className="text-xs font-semibold text-muted-foreground">
            Motivo / Justificación Obligatoria
          </label>
          <textarea
            className="flex min-h-[70px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            placeholder="Ej. Conteo físico de fin de mes, prenda con tara dada de baja..."
            required
            {...register('reason')}
          />
        </div>

        <div className="flex justify-end gap-2 pt-2 border-t">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button type="submit" isLoading={isLoading}>
            Confirmar Ajuste
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
