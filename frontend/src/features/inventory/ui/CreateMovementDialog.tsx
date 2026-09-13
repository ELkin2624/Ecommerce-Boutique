import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/shared/api/axios-client';
import { Dialog } from '@/shared/ui/Dialog';
import { Button } from '@/shared/ui/Button';
import { Input } from '@/shared/ui/Input';
import { toast } from '@/shared/ui/Toast';
import { queryKeys } from '@/shared/api/query-keys';
import type { MovementType } from '@/shared/types/api';

interface CreateMovementDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  defaultBranchId?: string;
}

export function CreateMovementDialog({
  open,
  onOpenChange,
  onSuccess,
  defaultBranchId,
}: CreateMovementDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [selectedVariantId, setSelectedVariantId] = useState('');
  const [selectedLocationId, setSelectedLocationId] = useState('');
  const [movementType, setMovementType] = useState<MovementType>('PURCHASE_RECEIPT');
  const [quantity, setQuantity] = useState<number>(10);
  const [reason, setReason] = useState('');

  // 1. Obtener ubicaciones
  const { data: locations = [] } = useQuery<any[]>({
    queryKey: queryKeys.branches.locations(defaultBranchId || undefined),
    queryFn: async () => {
      const res = await apiClient.get('/inventory/locations', {
        params: defaultBranchId ? { branchId: defaultBranchId } : {},
      });
      return res.data;
    },
    enabled: open,
  });

  // 2. Obtener productos y sus variantes para seleccionar la prenda
  const { data: productsData } = useQuery<any>({
    queryKey: queryKeys.catalog.products(),
    queryFn: async () => {
      const res = await apiClient.get('/catalog/products', { params: { limit: 100 } });
      return res.data;
    },
    enabled: open,
  });

  const products = Array.isArray(productsData) ? productsData : productsData?.items || [];
  const allVariants = products.flatMap((p: any) =>
    (p.variants || []).map((v: any) => ({
      ...v,
      productName: p.name,
    }))
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedVariantId) {
      toast.error('Prenda requerida', 'Por favor selecciona la variante SKU');
      return;
    }
    if (!selectedLocationId) {
      toast.error('Ubicación requerida', 'Por favor selecciona la ubicación física');
      return;
    }
    if (quantity <= 0) {
      toast.error('Cantidad inválida', 'La cantidad debe ser mayor a 0');
      return;
    }

    setIsLoading(true);
    try {
      await apiClient.post('/inventory/movements', {
        variantId: selectedVariantId,
        locationId: selectedLocationId,
        quantity: Number(quantity),
        type: movementType,
        reason: reason.trim() || `Registro manual tipo ${movementType}`,
      });

      toast.success(
        'Movimiento Registrado',
        `Se han registrado ${quantity} unidades en Kardex correctamente`,
      );
      onOpenChange(false);
      setSelectedVariantId('');
      setSelectedLocationId('');
      setReason('');
      setQuantity(10);
      onSuccess();
    } catch (err: any) {
      toast.error('Error al registrar movimiento', err.response?.data?.message || err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title="Registrar Movimiento de Inventario"
      description="Ingreso de mercadería desde proveedor, devoluciones o ajustes físicos con registro inmutable en Kardex"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Tipo de movimiento */}
        <div className="space-y-1">
          <label className="text-xs font-semibold text-muted-foreground">
            Tipo de Operación *
          </label>
          <select
            value={movementType}
            onChange={(e) => setMovementType(e.target.value as MovementType)}
            className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-xs shadow-sm focus:outline-none focus:ring-1 focus:ring-primary"
          >
            <option value="PURCHASE_RECEIPT">📦 Ingreso por Compra a Proveedor (Recepción)</option>
            <option value="RETURN">🔄 Devolución de Prenda</option>
            <option value="ADJUSTMENT">⚖️ Ajuste por Conteo Físico / Regularización</option>
          </select>
        </div>

        {/* Prenda / SKU */}
        <div className="space-y-1">
          <label className="text-xs font-semibold text-muted-foreground">
            Prenda y Variante (SKU) *
          </label>
          <select
            value={selectedVariantId}
            onChange={(e) => setSelectedVariantId(e.target.value)}
            required
            className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-xs shadow-sm focus:outline-none focus:ring-1 focus:ring-primary"
          >
            <option value="">-- Selecciona una prenda y talla/color --</option>
            {allVariants.map((v: any) => (
              <option key={v.id} value={v.id}>
                {v.productName} — {v.sku} ({v.size} / {v.color})
              </option>
            ))}
          </select>
        </div>

        {/* Ubicación destino */}
        <div className="space-y-1">
          <label className="text-xs font-semibold text-muted-foreground">
            Ubicación Destino en Sucursal *
          </label>
          <select
            value={selectedLocationId}
            onChange={(e) => setSelectedLocationId(e.target.value)}
            required
            className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-xs shadow-sm focus:outline-none focus:ring-1 focus:ring-primary"
          >
            <option value="">-- Selecciona ubicación física --</option>
            {locations.map((loc: any) => (
              <option key={loc.id} value={loc.id}>
                {loc.branch?.name} - {loc.name} ({loc.type === 'WAREHOUSE' ? 'Almacén' : 'Piso de Venta'})
              </option>
            ))}
          </select>
        </div>

        {/* Cantidad */}
        <Input
          label="Cantidad de Unidades *"
          type="number"
          min="1"
          required
          value={quantity}
          onChange={(e) => setQuantity(Number(e.target.value))}
        />

        {/* Justificación */}
        <div className="space-y-1">
          <label className="text-xs font-semibold text-muted-foreground">
            Motivo / N° de Guía o Factura Proveedor *
          </label>
          <textarea
            className="flex min-h-[60px] w-full rounded-md border border-input bg-background px-3 py-2 text-xs shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            placeholder="Ej. Recepción Factura N° 4022 de Textiles Andinos, reposición de temporada..."
            required
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          />
        </div>

        <div className="flex justify-end gap-2 pt-2 border-t">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button type="submit" isLoading={isLoading}>
            Confirmar Movimiento
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
