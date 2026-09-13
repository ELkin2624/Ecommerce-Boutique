import { useEffect, useState, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { Upload, TrendingUp, Sparkles, Image as ImageIcon, Trash2, Check } from 'lucide-react';
import { apiClient } from '@/shared/api/axios-client';
import { Dialog } from '@/shared/ui/Dialog';
import { Button } from '@/shared/ui/Button';
import { Input } from '@/shared/ui/Input';
import { Badge } from '@/shared/ui/Badge';
import { toast } from '@/shared/ui/Toast';
import { formatCurrency } from '@/shared/lib/utils';
import { fileToOptimizedDataUrl } from '@/shared/lib/image-utils';
import { STANDARD_SIZES, COLOR_PRESETS } from '../../model/catalog-constants';

interface VariantFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  productId: string;
  productName: string;
  productImages?: Array<{ id: string; imageUrl: string; isCover?: boolean }>;
  variantToEdit?: any | null;
  onSuccess: () => void;
}

export function VariantFormDialog({
  open,
  onOpenChange,
  productId,
  productName,
  productImages = [],
  variantToEdit = null,
  onSuccess,
}: VariantFormDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [variantImage, setVariantImage] = useState('');
  const [selectedColorHex, setSelectedColorHex] = useState('#111827');
  const [isProcessingFile, setIsProcessingFile] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isEditing = Boolean(variantToEdit);

  const { register, handleSubmit, reset, watch, setValue } = useForm({
    defaultValues: {
      sku: '',
      size: 'M',
      color: 'Negro',
      price: 150,
      cost: 75,
    },
  });

  const currentPrice = Number(watch('price') || 0);
  const currentCost = Number(watch('cost') || 0);
  const currentSize = watch('size');
  const currentColor = watch('color');

  const marginAmount = currentPrice - currentCost;
  const marginPercent = currentPrice > 0 ? ((marginAmount / currentPrice) * 100).toFixed(0) : '0';

  useEffect(() => {
    if (open) {
      if (variantToEdit) {
        const meta = (variantToEdit.measurementsJson as any) || {};
        reset({
          sku: variantToEdit.sku || '',
          size: variantToEdit.size || 'M',
          color: variantToEdit.color || 'Negro',
          price: Number(variantToEdit.price || 0),
          cost: Number(variantToEdit.cost || 0),
        });
        setVariantImage(meta.imageUrl || '');
        setSelectedColorHex(meta.colorHex || '#111827');
      } else {
        const defaultColor = COLOR_PRESETS[0];
        reset({
          sku: generateSkuSuggestion(productName, defaultColor.name, 'M'),
          size: 'M',
          color: defaultColor.name,
          price: 150,
          cost: 75,
        });
        setVariantImage('');
        setSelectedColorHex(defaultColor.hex);
      }
    }
  }, [open, variantToEdit, productName, reset]);

  // Generador de sugerencia de SKU limpio
  function generateSkuSuggestion(prodName: string, col: string, sz: string) {
    const pClean = prodName
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, '')
      .slice(0, 4) || 'MOD';
    const cClean = col
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, '')
      .slice(0, 3) || 'COL';
    const sClean = sz.toUpperCase().replace(/[^A-Z0-9]/g, '') || 'M';
    const rand = Math.floor(100 + Math.random() * 900);
    return `${pClean}-${cClean}-${sClean}-${rand}`;
  }

  // Manejador del selector de archivo para la variante
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsProcessingFile(true);
      const dataUrl = await fileToOptimizedDataUrl(file, 800, 0.85);
      setVariantImage(dataUrl);
      toast.success('Foto de colorway cargada', 'La imagen de la variante está lista');
    } catch (err: any) {
      toast.error('Error al procesar archivo', err.message || 'Error con el archivo seleccionado');
    } finally {
      setIsProcessingFile(false);
    }
  };

  const onSubmit = async (data: any) => {
    setIsLoading(true);
    try {
      const measurementsJson: Record<string, any> = {
        colorHex: selectedColorHex,
        imageUrl: variantImage.trim() || undefined,
      };

      if (isEditing && variantToEdit?.id) {
        await apiClient.patch(`/catalog/variants/${variantToEdit.id}`, {
          size: data.size?.trim(),
          color: data.color?.trim(),
          price: Number(data.price),
          cost: Number(data.cost),
          measurementsJson,
        });
        toast.success('Variante actualizada', `Variante "${data.color} - Talla ${data.size}" actualizada con éxito`);
      } else {
        await apiClient.post(`/catalog/products/${productId}/variants`, {
          sku: data.sku.toUpperCase().trim(),
          size: data.size?.trim(),
          color: data.color?.trim(),
          price: Number(data.price),
          cost: Number(data.cost),
          measurementsJson,
        });
        toast.success('Variante creada', `Variante con código "${data.sku.toUpperCase()}" registrada para ${productName}`);
      }

      reset();
      onOpenChange(false);
      onSuccess();
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Error al guardar la variante';
      toast.error(isEditing ? 'Error al actualizar variante' : 'Error al crear variante', msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title={isEditing ? `Editar Variante: ${variantToEdit?.color} (Talla ${variantToEdit?.size})` : `Agregar Variante a: ${productName}`}
      description="Configura la combinación de talla, colorway, fotografía y precios para esta prenda"
      className="max-w-2xl"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Fila 1: Código y Color en 2 columnas */}
        <div className="grid sm:grid-cols-2 gap-4">
          {/* Código y Sugerencia */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-semibold text-foreground">Código de Prenda / Identificador *</label>
              {!isEditing && (
                <button
                  type="button"
                  onClick={() =>
                    setValue('sku', generateSkuSuggestion(productName, currentColor, currentSize))
                  }
                  className="text-[11px] text-primary hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <Sparkles className="h-3 w-3" />
                  <span>Sugerir</span>
                </button>
              )}
            </div>
            <Input
              placeholder="Ej. VEST-ROJ-M-101"
              required
              disabled={isEditing}
              {...register('sku')}
            />
          </div>

          {/* Color / Tonalidad */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-semibold text-foreground">Color / Tonalidad *</label>
              <div className="flex items-center gap-1.5">
                <span
                  className="w-3.5 h-3.5 rounded-full border border-border shadow-xs inline-block"
                  style={{ backgroundColor: selectedColorHex }}
                />
                <span className="text-[10px] font-mono text-muted-foreground">{selectedColorHex}</span>
              </div>
            </div>

            <div className="flex gap-2">
              <Input
                placeholder="Ej. Azul Celeste"
                required
                className="flex-1"
                {...register('color')}
              />
              <input
                type="color"
                value={selectedColorHex}
                onChange={(e) => setSelectedColorHex(e.target.value)}
                className="w-10 h-9 p-0.5 rounded-lg border border-input cursor-pointer bg-background"
                title="Seleccionar color personalizado"
              />
            </div>
          </div>
        </div>

        {/* Muestras rápidas de color (Swatches) */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-muted-foreground">Paleta rápida de colores:</span>
            <span className="text-[10px] text-muted-foreground font-mono">{currentColor || 'Personalizado'}</span>
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
            {COLOR_PRESETS.map((preset) => (
              <button
                key={preset.name}
                type="button"
                onClick={() => {
                  setSelectedColorHex(preset.hex);
                  setValue('color', preset.name);
                }}
                className={`w-6 h-6 rounded-full border transition-all cursor-pointer ${
                  selectedColorHex === preset.hex ? 'ring-2 ring-primary ring-offset-2 scale-110' : 'hover:scale-105'
                }`}
                style={{ backgroundColor: preset.hex }}
                title={preset.name}
              />
            ))}
          </div>
        </div>

        {/* Talla con Botones Rápidos */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-foreground">Talla de la Prenda *</label>
            <span className="text-[11px] font-bold text-primary">Talla elegida: {currentSize}</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {STANDARD_SIZES.map((sz) => (
              <button
                key={sz}
                type="button"
                onClick={() => setValue('size', sz)}
                className={`px-3 py-1 text-xs font-semibold rounded-lg border transition-all cursor-pointer ${
                  currentSize === sz
                    ? 'bg-primary text-primary-foreground border-primary shadow-xs scale-105'
                    : 'bg-muted/40 hover:bg-muted text-muted-foreground hover:text-foreground'
                }`}
              >
                {sz}
              </button>
            ))}
          </div>
          <Input placeholder="O escribe una talla personalizada" className="mt-1 text-xs" {...register('size')} />
        </div>

        {/* Subida / Imagen específica del Colorway (como en Nike/Adidas/Shopify) */}
        <div className="space-y-3 p-4 rounded-xl border bg-muted/15">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-primary/10 text-primary">
                <ImageIcon className="h-4 w-4" />
              </div>
              <div>
                <span className="text-xs font-bold text-foreground">
                  Fotografía de este Colorway / Variante
                </span>
                <p className="text-[10px] text-muted-foreground">
                  {variantImage
                    ? 'Foto asignada exclusivamente a esta variante'
                    : 'Opcional: Si no asignas una, la variante heredará la foto de portada de la prenda'}
                </p>
              </div>
            </div>
            {variantImage ? (
              <Badge variant="default" className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 text-[10px] h-5">
                <Check className="h-3 w-3 mr-1" />
                Foto Asignada
              </Badge>
            ) : (
              <Badge variant="secondary" className="text-[10px] h-5">
                Hereda Portada
              </Badge>
            )}
          </div>

          {/* Estado A: Ya tiene foto asignada -> Vista Previa Destacada */}
          {variantImage ? (
            <div className="flex items-center gap-4 p-3 rounded-xl bg-background border shadow-2xs">
              <div className="relative group shrink-0">
                <img
                  src={variantImage}
                  alt="Foto del Colorway"
                  className="w-20 h-20 object-cover rounded-xl border shadow-xs"
                />
                <span
                  className="absolute bottom-1 right-1 text-[9px] font-bold px-1.5 py-0.5 rounded shadow-xs text-white"
                  style={{ backgroundColor: selectedColorHex }}
                >
                  {currentColor}
                </span>
              </div>
              <div className="flex-1 space-y-1.5 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-7 text-xs gap-1.5 cursor-pointer"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Upload className="h-3.5 w-3.5" />
                    <span>Cambiar Foto</span>
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-7 text-xs text-destructive hover:bg-destructive/10 cursor-pointer gap-1"
                    onClick={() => setVariantImage('')}
                  >
                    <Trash2 className="h-3 w-3" />
                    <span>Quitar</span>
                  </Button>
                </div>
                <p className="text-[11px] text-muted-foreground leading-tight">
                  Esta foto se activará en la tienda cuando el cliente elija el color <strong>{currentColor}</strong> en talla <strong>{currentSize}</strong>.
                </p>
              </div>
            </div>
          ) : (
            /* Estado B: No tiene foto asignada -> Selector desde PC + Galería Existente + URL */
            <div className="space-y-3">
              {/* Opción 1: Subir directamente desde la computadora */}
              <div
                onClick={() => fileInputRef.current?.click()}
                className="p-4 rounded-xl border-2 border-dashed border-border hover:border-primary hover:bg-primary/5 transition-all cursor-pointer flex flex-col items-center justify-center text-center gap-1.5 bg-background/60 group"
              >
                <div className="p-2.5 rounded-full bg-primary/10 text-primary group-hover:scale-110 transition-transform">
                  <Upload className="h-5 w-5" />
                </div>
                <div>
                  <span className="text-xs font-semibold text-foreground group-hover:text-primary transition-colors block">
                    Subir foto de esta variante desde tu computadora
                  </span>
                  <span className="text-[11px] text-muted-foreground">
                    Haz clic aquí para seleccionar archivo (JPG, PNG, WebP)
                  </span>
                </div>
              </div>

              {/* Opción 2: Elegir de las fotos ya existentes de la prenda (estilo Shopify/Amazon) */}
              {productImages && productImages.length > 0 && (
                <div className="space-y-1.5 pt-1">
                  <span className="text-[11px] font-medium text-muted-foreground block">
                    O selecciona una foto ya subida a la galería de {productName}:
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {productImages.map((img) => (
                      <button
                        key={img.id}
                        type="button"
                        onClick={() => {
                          setVariantImage(img.imageUrl);
                          toast.success('Foto asignada', 'Se asignó la foto de la galería a esta variante');
                        }}
                        className="relative rounded-xl border-2 border-border hover:border-primary overflow-hidden w-12 h-12 group transition-all cursor-pointer shadow-2xs hover:scale-105 bg-background"
                        title="Asignar esta foto a la variante"
                      >
                        <img src={img.imageUrl} alt="Prenda" className="w-full h-full object-cover" />
                        {img.isCover && (
                          <span className="absolute top-0 right-0 bg-amber-500 text-white text-[8px] px-1 rounded-bl font-bold">
                            ★
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Opción 3: Pegar URL directa */}
              <div className="space-y-1 pt-1">
                <Input
                  placeholder="O pegar URL directa de imagen externa (opcional)..."
                  value={variantImage}
                  onChange={(e) => setVariantImage(e.target.value)}
                  className="text-xs h-8"
                />
              </div>
            </div>
          )}

          {/* Input de archivo oculto compartido */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
          />

          {isProcessingFile && (
            <p className="text-[11px] text-primary animate-pulse font-medium text-center">
              Optimizando y preparando fotografía seleccionada...
            </p>
          )}
        </div>

        {/* Precios y Margen Dinámico */}
        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Precio de Venta (BOB) *"
            type="number"
            step="0.01"
            min="0"
            required
            {...register('price')}
          />
          <Input
            label="Costo Unitario (BOB) *"
            type="number"
            step="0.01"
            min="0"
            required
            {...register('cost')}
          />
        </div>

        {/* Resumen de Margen Bruto */}
        <div className="flex items-center justify-between p-2.5 rounded-xl bg-primary/5 border border-primary/20 text-xs">
          <div className="flex items-center gap-1.5 text-foreground font-medium">
            <TrendingUp className="h-4 w-4 text-emerald-600" />
            <span>Margen Bruto Unitario:</span>
            <span className="font-bold text-foreground font-mono">
              {formatCurrency(marginAmount)}
            </span>
          </div>
          <Badge
            variant="default"
            className={`font-mono font-bold ${
              Number(marginPercent) >= 40
                ? 'bg-emerald-600'
                : Number(marginPercent) > 0
                ? 'bg-primary'
                : 'bg-destructive'
            }`}
          >
            {marginPercent}% margen
          </Badge>
        </div>

        {/* Footer con botones sticky al fondo */}
        <div className="sticky -bottom-5 -mx-5 px-5 py-3.5 bg-background/95 backdrop-blur-md border-t flex justify-end gap-2 shrink-0 z-10">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button type="submit" isLoading={isLoading} disabled={isProcessingFile} className="shadow-xs">
            {isEditing ? 'Guardar Cambios' : 'Crear Variante'}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
