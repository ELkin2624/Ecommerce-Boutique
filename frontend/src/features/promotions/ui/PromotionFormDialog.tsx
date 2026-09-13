import React, { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Percent, DollarSign, X, Wand2 } from 'lucide-react';
import { apiClient } from '@/shared/api/axios-client';
import type { Promotion } from '@/shared/types/api';
import { Dialog } from '@/shared/ui/Dialog';
import { Button } from '@/shared/ui/Button';
import { Input } from '@/shared/ui/Input';
import { toast } from '@/shared/ui/Toast';
import { DateRangePicker } from '@/shared/ui/DateRangePicker';

interface PromotionFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  promotionToEdit?: Promotion | null;
  onSuccess: () => void;
}

const DISCOUNT_PRESETS = ['10', '15', '20', '25', '30', '50'];
const MIN_PURCHASE_PRESETS = [
  { label: 'Sin mínimo', value: '' },
  { label: '50 BOB', value: '50' },
  { label: '100 BOB', value: '100' },
  { label: '200 BOB', value: '200' },
  { label: '500 BOB', value: '500' },
];

export function PromotionFormDialog({
  open,
  onOpenChange,
  promotionToEdit,
  onSuccess,
}: PromotionFormDialogProps) {
  const queryClient = useQueryClient();
  const isEditing = Boolean(promotionToEdit);

  // Almacenamos valores numéricos como string para permitir borrar completamente sin que el '0' quede trabado
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    description: '',
    discountPercent: '15',
    minPurchaseAmount: '',
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    isActive: true,
  });

  useEffect(() => {
    if (open) {
      if (promotionToEdit) {
        setFormData({
          name: promotionToEdit.name || '',
          code: promotionToEdit.code || '',
          description: promotionToEdit.description || '',
          discountPercent:
            promotionToEdit.discountPercent !== undefined && promotionToEdit.discountPercent !== null
              ? String(Number(promotionToEdit.discountPercent))
              : '15',
          minPurchaseAmount:
            promotionToEdit.minPurchaseAmount !== undefined &&
            promotionToEdit.minPurchaseAmount !== null &&
            Number(promotionToEdit.minPurchaseAmount) > 0
              ? String(Number(promotionToEdit.minPurchaseAmount))
              : '',
          startDate: promotionToEdit.startDate
            ? new Date(promotionToEdit.startDate).toISOString().split('T')[0]
            : new Date().toISOString().split('T')[0],
          endDate: promotionToEdit.endDate
            ? new Date(promotionToEdit.endDate).toISOString().split('T')[0]
            : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          isActive: promotionToEdit.isActive ?? true,
        });
      } else {
        setFormData({
          name: '',
          code: '',
          description: '',
          discountPercent: '15',
          minPurchaseAmount: '',
          startDate: new Date().toISOString().split('T')[0],
          endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          isActive: true,
        });
      }
    }
  }, [promotionToEdit, open]);

  // Manejo limpio de Porcentaje de Descuento (evita el "0" trabado)
  const handleDiscountChange = (val: string) => {
    if (val === '') {
      setFormData((prev) => ({ ...prev, discountPercent: '' }));
      return;
    }
    let clean = val.replace(/[^0-9.]/g, '');
    const parts = clean.split('.');
    if (parts.length > 2) clean = parts[0] + '.' + parts.slice(1).join('');

    // Eliminar ceros a la izquierda (ej. "05" -> "5", pero respetar "0" o "0.5")
    if (clean.length > 1 && clean.startsWith('0') && !clean.startsWith('0.')) {
      clean = clean.replace(/^0+/, '');
      if (clean === '') clean = '0';
    }

    // Límite superior 100%
    const num = parseFloat(clean);
    if (!isNaN(num) && num > 100) {
      clean = '100';
    }

    setFormData((prev) => ({ ...prev, discountPercent: clean }));
  };

  // Manejo limpio de Compra Mínima (evita el "0" trabado)
  const handleMinPurchaseChange = (val: string) => {
    if (val === '') {
      setFormData((prev) => ({ ...prev, minPurchaseAmount: '' }));
      return;
    }
    let clean = val.replace(/[^0-9.]/g, '');
    const parts = clean.split('.');
    if (parts.length > 2) clean = parts[0] + '.' + parts.slice(1).join('');

    if (clean.length > 1 && clean.startsWith('0') && !clean.startsWith('0.')) {
      clean = clean.replace(/^0+/, '');
      if (clean === '') clean = '0';
    }

    setFormData((prev) => ({ ...prev, minPurchaseAmount: clean }));
  };

  // Sugerir código de cupón automático
  const handleSuggestCode = () => {
    const cleanName = formData.name
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, '')
      .slice(0, 8);
    const p = formData.discountPercent || '15';
    const suggested = cleanName ? `${cleanName}${p}` : `PROMO${p}`;
    setFormData((prev) => ({ ...prev, code: suggested }));
  };

  const saveMutation = useMutation({
    mutationFn: async (payload: any) => {
      if (isEditing && promotionToEdit) {
        const res = await apiClient.patch(`/promotions/${promotionToEdit.id}`, payload);
        return res.data;
      }
      const res = await apiClient.post('/promotions', payload);
      return res.data;
    },
    onSuccess: (data) => {
      toast.success(
        isEditing ? 'Promoción actualizada' : 'Promoción creada',
        `La promoción "${data.name}" con código ${data.code} fue guardada exitosamente`,
      );
      queryClient.invalidateQueries({ queryKey: ['promotions'] });
      onOpenChange(false);
      onSuccess();
    },
    onError: (err: any) => {
      toast.error('Error al guardar promoción', err.response?.data?.message || err.message);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      toast.error('Nombre requerido', 'Ingresa el nombre descriptivo de la campaña');
      return;
    }

    if (!formData.code.trim()) {
      toast.error('Código requerido', 'Ingresa el código del cupón (ej. VERANO25)');
      return;
    }

    const discountNum = parseFloat(formData.discountPercent);
    if (isNaN(discountNum) || discountNum <= 0 || discountNum > 100) {
      toast.error('Descuento inválido', 'El porcentaje debe ser mayor a 0% y menor o igual a 100%');
      return;
    }

    if (new Date(formData.startDate) > new Date(formData.endDate)) {
      toast.error('Rango de fechas inválido', 'La fecha de inicio no puede ser posterior a la de fin');
      return;
    }

    const minPurchaseNum = formData.minPurchaseAmount.trim()
      ? parseFloat(formData.minPurchaseAmount)
      : undefined;

    saveMutation.mutate({
      name: formData.name.trim(),
      code: formData.code.trim().toUpperCase(),
      description: formData.description.trim() || undefined,
      discountPercent: discountNum,
      minPurchaseAmount: minPurchaseNum && minPurchaseNum > 0 ? minPurchaseNum : undefined,
      startDate: new Date(formData.startDate + 'T00:00:00.000Z').toISOString(),
      endDate: new Date(formData.endDate + 'T23:59:59.999Z').toISOString(),
      isActive: formData.isActive,
    });
  };

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title={isEditing ? 'Editar Promoción / Cupón' : 'Nueva Promoción Comercial'}
      description="Configura descuentos de temporada, códigos promocionales y vigencia para las ventas digitales y presenciales"
      className="max-w-2xl max-h-[92vh] flex flex-col"
    >
      <form onSubmit={handleSubmit} className="flex-1 flex flex-col min-h-0 space-y-4">
        {/* Cuerpo con scroll suave */}
        <div className="flex-1 overflow-y-auto pr-1 space-y-4">
          {/* Fila 1: Nombre y Código */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label="Nombre de la Campaña / Promoción *"
              placeholder="Ej. Liquidación Temporada Invierno"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-muted-foreground">
                  Código de Cupón *
                </label>
                {!isEditing && (
                  <button
                    type="button"
                    onClick={handleSuggestCode}
                    className="text-[10px] text-primary hover:underline flex items-center gap-1 font-medium cursor-pointer"
                  >
                    <Wand2 className="h-3 w-3" />
                    <span>Sugerir Código</span>
                  </button>
                )}
              </div>
              <Input
                placeholder="Ej. INVIERNO30"
                required
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                className="font-mono uppercase font-bold"
              />
            </div>
          </div>

          {/* Fila 2: Descripción o Condiciones */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-muted-foreground">
              Descripción o Condiciones de Aplicación (Opcional)
            </label>
            <textarea
              className="flex min-h-[56px] w-full rounded-md border border-input bg-background px-3 py-2 text-xs shadow-xs placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              placeholder="Ej. Válido en compras presenciales y app móvil para todas las prendas de temporada seleccionadas..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </div>

          {/* Fila 3: Porcentaje y Compra Mínima (Solución de "0" trabado y atajos rápidos) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 rounded-xl border bg-muted/15">
            {/* Campo Porcentaje Descuento */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-foreground flex items-center gap-1.5">
                  <Percent className="h-3.5 w-3.5 text-primary" />
                  <span>Porcentaje Descuento (%) *</span>
                </label>
                <span className="text-[11px] font-mono font-bold text-primary">
                  {formData.discountPercent ? `${formData.discountPercent}%` : '0%'}
                </span>
              </div>

              <div className="relative">
                <Input
                  type="text"
                  inputMode="decimal"
                  placeholder="Ej. 15"
                  required
                  value={formData.discountPercent}
                  onChange={(e) => handleDiscountChange(e.target.value)}
                  className="font-bold pr-8"
                />
                <span className="absolute right-3 top-2 text-xs font-bold text-muted-foreground pointer-events-none">
                  %
                </span>
              </div>

              {/* Presets rápidos de porcentaje */}
              <div className="flex flex-wrap items-center gap-1 pt-0.5">
                <span className="text-[10px] text-muted-foreground">Rápido:</span>
                {DISCOUNT_PRESETS.map((pct) => (
                  <button
                    key={pct}
                    type="button"
                    onClick={() => handleDiscountChange(pct)}
                    className={`px-2 py-0.5 text-[10px] font-semibold rounded-md border transition-all cursor-pointer ${
                      formData.discountPercent === pct
                        ? 'bg-primary text-primary-foreground border-primary shadow-2xs scale-105'
                        : 'bg-background hover:bg-muted text-muted-foreground hover:text-foreground border-border'
                    }`}
                  >
                    {pct}%
                  </button>
                ))}
              </div>
            </div>

            {/* Campo Compra Mínima */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-foreground flex items-center gap-1.5">
                  <DollarSign className="h-3.5 w-3.5 text-emerald-600" />
                  <span>Compra Mínima (BOB)</span>
                </label>
                <span className="text-[10px] text-muted-foreground">
                  {formData.minPurchaseAmount ? `${formData.minPurchaseAmount} BOB` : 'Sin requisito'}
                </span>
              </div>

              <div className="relative">
                <Input
                  type="text"
                  inputMode="decimal"
                  placeholder="Sin compra mínima (opcional)"
                  value={formData.minPurchaseAmount}
                  onChange={(e) => handleMinPurchaseChange(e.target.value)}
                  className="pr-7"
                />
                {formData.minPurchaseAmount && (
                  <button
                    type="button"
                    onClick={() => handleMinPurchaseChange('')}
                    className="absolute right-2 top-2 p-0.5 text-muted-foreground hover:text-foreground rounded-full hover:bg-muted cursor-pointer"
                    title="Quitar compra mínima"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>

              {/* Presets rápidos de compra mínima */}
              <div className="flex flex-wrap items-center gap-1 pt-0.5">
                {MIN_PURCHASE_PRESETS.map((preset) => (
                  <button
                    key={preset.label}
                    type="button"
                    onClick={() => handleMinPurchaseChange(preset.value)}
                    className={`px-2 py-0.5 text-[10px] font-semibold rounded-md border transition-all cursor-pointer ${
                      formData.minPurchaseAmount === preset.value
                        ? 'bg-primary text-primary-foreground border-primary shadow-2xs scale-105'
                        : 'bg-background hover:bg-muted text-muted-foreground hover:text-foreground border-border'
                    }`}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Fila 4: Calendario Visual Moderno (DateRangePicker) */}
          <DateRangePicker
            startDate={formData.startDate}
            endDate={formData.endDate}
            onChange={(start, end) =>
              setFormData((prev) => ({
                ...prev,
                startDate: start,
                endDate: end,
              }))
            }
          />

          {/* Fila 5: Estado Activo */}
          <div className="flex items-center gap-2.5 p-3 rounded-xl border bg-muted/10">
            <input
              type="checkbox"
              id="isActivePromo"
              checked={formData.isActive}
              onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
              className="rounded border-input text-primary focus:ring-primary h-4 w-4 cursor-pointer"
            />
            <label htmlFor="isActivePromo" className="text-xs font-semibold cursor-pointer text-foreground select-none">
              Promoción activa inmediatamente para ventas y carrito digital
            </label>
          </div>
        </div>

        {/* Footer Pegajoso (Sticky) */}
        <div className="sticky -bottom-5 -mx-5 px-5 py-3.5 bg-background/95 backdrop-blur-md border-t flex items-center justify-between gap-2 shrink-0 z-10">
          <span className="text-[11px] text-muted-foreground hidden sm:inline">
            Descuento de <strong>{formData.discountPercent || '0'}%</strong> aplicable con código{' '}
            <strong className="font-mono">{formData.code || '---'}</strong>
          </span>

          <div className="flex items-center gap-2 ml-auto">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" isLoading={saveMutation.isPending} className="shadow-xs">
              {isEditing ? 'Guardar Cambios' : 'Crear Promoción'}
            </Button>
          </div>
        </div>
      </form>
    </Dialog>
  );
}
