import { useEffect, useState, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { Upload, Image as ImageIcon } from 'lucide-react';
import { apiClient } from '@/shared/api/axios-client';
import { Dialog } from '@/shared/ui/Dialog';
import { Button } from '@/shared/ui/Button';
import { Input } from '@/shared/ui/Input';
import { Select } from '@/shared/ui/Select';
import { toast } from '@/shared/ui/Toast';
import { fileToOptimizedDataUrl } from '@/shared/lib/image-utils';

interface ProductFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  categories: Array<{ id: string; name: string }>;
  seasons?: Array<{ id: string; name: string }>;
  collections?: Array<{ id: string; name: string }>;
  suppliers?: Array<{ id: string; name: string }>;
  productToEdit?: any | null;
  onSuccess: () => void;
}

export function ProductFormDialog({
  open,
  onOpenChange,
  categories,
  seasons = [],
  collections = [],
  suppliers = [],
  productToEdit = null,
  onSuccess,
}: ProductFormDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [coverImageUrl, setCoverImageUrl] = useState('');
  const [isProcessingFile, setIsProcessingFile] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isEditing = Boolean(productToEdit);

  const { register, handleSubmit, reset } = useForm({
    defaultValues: {
      name: '',
      brand: 'FashionStore',
      description: '',
      categoryId: categories[0]?.id || '',
      seasonId: '',
      collectionId: '',
      supplierId: '',
    },
  });

  useEffect(() => {
    if (open) {
      if (productToEdit) {
        reset({
          name: productToEdit.name || '',
          brand: productToEdit.brand || 'FashionStore',
          description: productToEdit.description || '',
          categoryId:
            productToEdit.categoryId || productToEdit.category?.id || categories[0]?.id || '',
          seasonId: productToEdit.seasonId || productToEdit.season?.id || '',
          collectionId: productToEdit.collectionId || productToEdit.collection?.id || '',
          supplierId: productToEdit.supplierId || productToEdit.supplier?.id || '',
        });
        setCoverImageUrl(productToEdit.coverImage || '');
      } else {
        reset({
          name: '',
          brand: 'FashionStore',
          description: '',
          categoryId: categories[0]?.id || '',
          seasonId: '',
          collectionId: '',
          supplierId: '',
        });
        setCoverImageUrl('');
      }
    }
  }, [open, productToEdit, categories, reset]);

  // Manejo de archivo local
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsProcessingFile(true);
      const dataUrl = await fileToOptimizedDataUrl(file);
      setCoverImageUrl(dataUrl);
      toast.success('Foto cargada', 'La imagen de portada está lista');
    } catch (err: any) {
      toast.error('Error al procesar archivo', err.message || 'Error con el archivo');
    } finally {
      setIsProcessingFile(false);
    }
  };

  const onSubmit = async (data: any) => {
    setIsLoading(true);
    try {
      const payload: any = {
        name: data.name?.trim(),
        brand: data.brand?.trim() || 'FashionStore',
        description: data.description?.trim() || undefined,
        categoryId: data.categoryId || undefined,
        seasonId: data.seasonId ? data.seasonId : null,
        collectionId: data.collectionId ? data.collectionId : null,
        supplierId: data.supplierId ? data.supplierId : null,
      };

      if (isEditing && productToEdit?.id) {
        await apiClient.patch(`/catalog/products/${productToEdit.id}`, payload);
        // Si se seleccionó una nueva foto y es distinta a la anterior
        if (coverImageUrl && coverImageUrl !== productToEdit.coverImage) {
          await apiClient.post(`/catalog/products/${productToEdit.id}/images`, [
            { imageUrl: coverImageUrl, isCover: true },
          ]);
        }
        toast.success('Prenda actualizada', `El modelo "${data.name}" fue actualizado con éxito`);
      } else {
        // En creación de producto, si hay foto se envía en images
        if (coverImageUrl) {
          payload.images = [{ imageUrl: coverImageUrl, isCover: true, sortOrder: 0 }];
        }
        await apiClient.post('/catalog/products', payload);
        toast.success('Prenda creada', `El modelo "${data.name}" fue registrado exitosamente`);
      }

      reset();
      onOpenChange(false);
      onSuccess();
    } catch (err: any) {
      const errorMsg =
        err.response?.data?.message || err.message || 'Error al procesar la solicitud';
      toast.error(isEditing ? 'Error al actualizar prenda' : 'Error al crear prenda', errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title={isEditing ? `Editar Prenda: ${productToEdit?.name}` : 'Nueva Prenda / Modelo'}
      description={
        isEditing
          ? 'Modifique los datos base, clasificación y foto principal de esta prenda'
          : 'Registre un nuevo modelo base en el catálogo omnicanal'
      }
      className="max-w-xl"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Input
          label="Nombre de la Prenda / Modelo *"
          placeholder="Ej. Vestido Seda Floral Gala"
          required
          {...register('name')}
        />

        <div className="grid grid-cols-2 gap-3">
          <Input label="Marca" placeholder="FashionStore" {...register('brand')} />
          <Select
            label="Categoría *"
            options={categories.map((c) => ({ value: c.id, label: c.name }))}
            {...register('categoryId')}
          />
        </div>

        <Input
          label="Descripción y Composición"
          placeholder="Detalles de diseño, composición textil (100% Algodón, Seda)..."
          {...register('description')}
        />

        {/* Foto de Portada Principal con Explorador de Archivos */}
        <div className="space-y-2 p-3 rounded-xl border bg-muted/15">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
              <ImageIcon className="h-4 w-4 text-primary" />
              <span>Fotografía de Portada (Opcional)</span>
            </span>
            <span className="text-[10px] text-muted-foreground">
              Puedes gestionarla en la galería después
            </span>
          </div>

          <div className="flex items-center gap-3">
            {coverImageUrl ? (
              <div className="relative group">
                <img
                  src={coverImageUrl}
                  alt="Portada"
                  className="w-14 h-14 object-cover rounded-xl border shadow-xs"
                />
                <button
                  type="button"
                  onClick={() => setCoverImageUrl('')}
                  className="absolute -top-1 -right-1 bg-destructive text-white rounded-full w-4 h-4 text-[10px] flex items-center justify-center cursor-pointer shadow-xs"
                  title="Quitar foto"
                >
                  ×
                </button>
              </div>
            ) : (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="w-14 h-14 rounded-xl border-2 border-dashed flex flex-col items-center justify-center text-muted-foreground hover:border-primary hover:text-primary cursor-pointer transition-colors bg-background"
                title="Escoger foto de tu computadora"
              >
                <Upload className="h-4 w-4" />
                <span className="text-[9px] font-semibold mt-0.5">Subir</span>
              </div>
            )}

            <div className="flex-1 space-y-1">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />
              <Input
                placeholder="O pegar URL de imagen de portada..."
                value={coverImageUrl}
                onChange={(e) => setCoverImageUrl(e.target.value)}
                className="text-xs"
              />
              {isProcessingFile && (
                <p className="text-[10px] text-primary animate-pulse font-medium">
                  Procesando fotografía...
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Select
            label="Temporada"
            options={[
              { value: '', label: 'Permanente / Sin Temporada' },
              ...seasons.map((s) => ({ value: s.id, label: s.name })),
            ]}
            {...register('seasonId')}
          />
          <Select
            label="Colección"
            options={[
              { value: '', label: 'General / Sin Colección' },
              ...collections.map((col) => ({ value: col.id, label: col.name })),
            ]}
            {...register('collectionId')}
          />
        </div>

        {suppliers.length > 0 && (
          <Select
            label="Proveedor Principal"
            options={[
              { value: '', label: 'Sin Asignar' },
              ...suppliers.map((sup) => ({ value: sup.id, label: sup.name })),
            ]}
            {...register('supplierId')}
          />
        )}

        <div className="sticky -bottom-5 -mx-5 px-5 py-3.5 bg-background/95 backdrop-blur-md border-t flex justify-end gap-2 shrink-0 z-10">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button type="submit" isLoading={isLoading} disabled={isProcessingFile} className="shadow-xs">
            {isEditing ? 'Guardar Cambios' : 'Crear Prenda'}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
