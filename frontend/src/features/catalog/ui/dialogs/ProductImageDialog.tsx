import { useState, useRef } from 'react';
import { Upload, Star, Trash2, Image as ImageIcon, Check, Plus } from 'lucide-react';
import type { Product } from '@/shared/types/api';
import { Dialog } from '@/shared/ui/Dialog';
import { Button } from '@/shared/ui/Button';
import { Input } from '@/shared/ui/Input';
import { Badge } from '@/shared/ui/Badge';
import { toast } from '@/shared/ui/Toast';
import { fileToOptimizedDataUrl } from '@/shared/lib/image-utils';

interface ProductImageDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product: Product | null;
  onAddImage: (productId: string, images: Array<{ imageUrl: string; isCover?: boolean }>) => Promise<any>;
  onDeleteImage: (productId: string, imageId: string) => Promise<any>;
  onSetCoverImage: (productId: string, imageId: string) => Promise<any>;
}

export function ProductImageDialog({
  open,
  onOpenChange,
  product,
  onAddImage,
  onDeleteImage,
  onSetCoverImage,
}: ProductImageDialogProps) {
  const [imageUrl, setImageUrl] = useState('');
  const [isCover, setIsCover] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isProcessingFile, setIsProcessingFile] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!product) return null;

  const images = product.images || [];

  // Manejador del selector de archivos del sistema operativo
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsProcessingFile(true);
      const dataUrl = await fileToOptimizedDataUrl(file);
      setImageUrl(dataUrl);
      toast.success('Imagen cargada', 'La imagen seleccionada está lista para guardarse');
    } catch (err: any) {
      toast.error('Error al procesar archivo', err.message || 'El formato de archivo no es soportado');
    } finally {
      setIsProcessingFile(false);
    }
  };

  const handleSaveImage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!imageUrl.trim()) {
      toast.error('Campo requerido', 'Selecciona un archivo o ingresa una URL de imagen');
      return;
    }

    setIsSubmitting(true);
    try {
      await onAddImage(product.id, [
        {
          imageUrl: imageUrl.trim(),
          isCover: isCover || images.length === 0,
        },
      ]);
      setImageUrl('');
      setIsCover(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title={`Galería Multimedia: ${product.name}`}
      description="Gestiona las fotografías oficiales de la prenda. Puedes escoger imágenes desde tu dispositivo o ingresar una URL."
      className="max-w-2xl"
    >
      <div className="space-y-6">
        {/* Galería actual */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
              <ImageIcon className="h-4 w-4 text-primary" />
              <span>Fotos Registradas ({images.length})</span>
            </span>
            <span className="text-[11px] text-muted-foreground">
              La imagen marcada con estrella es la portada en tienda
            </span>
          </div>

          {images.length === 0 ? (
            <div className="text-center py-8 border border-dashed rounded-xl bg-muted/20 text-xs text-muted-foreground space-y-1">
              <ImageIcon className="h-8 w-8 mx-auto opacity-40 text-muted-foreground" />
              <p className="font-medium text-foreground">Aún no hay fotos de esta prenda</p>
              <p className="text-[11px]">Sube la primera foto desde tu computadora abajo</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {images.map((img) => (
                <div
                  key={img.id}
                  className={`group relative rounded-xl border overflow-hidden bg-muted/30 aspect-square shadow-2xs transition-all ${
                    img.isCover ? 'ring-2 ring-amber-500 border-amber-500' : 'hover:border-primary/50'
                  }`}
                >
                  <img
                    src={img.imageUrl}
                    alt={product.name}
                    className="w-full h-full object-cover object-center"
                  />

                  {/* Badge Portada */}
                  {img.isCover && (
                    <div className="absolute top-2 left-2 z-10">
                      <Badge className="bg-amber-500 text-white font-bold text-[10px] gap-1 px-1.5 py-0.5 shadow-sm border-none">
                        <Star className="h-3 w-3 fill-current" />
                        <span>Portada</span>
                      </Badge>
                    </div>
                  )}

                  {/* Capa de acciones hover */}
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2 p-2 text-white">
                    {!img.isCover && (
                      <Button
                        type="button"
                        size="sm"
                        variant="secondary"
                        className="h-7 text-[11px] gap-1 w-full bg-white/90 text-black hover:bg-white"
                        onClick={() => onSetCoverImage(product.id, img.id)}
                      >
                        <Star className="h-3 w-3 text-amber-600" />
                        <span>Hacer Portada</span>
                      </Button>
                    )}

                    <Button
                      type="button"
                      size="sm"
                      variant="destructive"
                      className="h-7 text-[11px] gap-1 w-full bg-red-600/90 hover:bg-red-600"
                      onClick={() => onDeleteImage(product.id, img.id)}
                    >
                      <Trash2 className="h-3 w-3" />
                      <span>Eliminar</span>
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Sección de subida / agregar imagen */}
        <form onSubmit={handleSaveImage} className="border-t pt-4 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
              <Plus className="h-4 w-4 text-primary" />
              <span>Añadir Nueva Fotografía</span>
            </span>
          </div>

          {/* Selector desde buscador de archivos del sistema */}
          <div className="grid sm:grid-cols-2 gap-3">
            <div
              onClick={() => fileInputRef.current?.click()}
              className="flex flex-col items-center justify-center p-4 border-2 border-dashed rounded-xl bg-muted/10 hover:bg-muted/30 hover:border-primary/60 transition-all cursor-pointer text-center group"
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />
              <div className="p-2 rounded-full bg-primary/10 text-primary group-hover:scale-110 transition-transform mb-2">
                <Upload className="h-5 w-5" />
              </div>
              <span className="text-xs font-bold text-foreground">
                Escoger desde tu equipo
              </span>
              <span className="text-[11px] text-muted-foreground mt-0.5">
                PNG, JPG, WEBP (se optimiza y guarda como URL)
              </span>
              {isProcessingFile && (
                <span className="text-[10px] text-primary font-semibold mt-1 animate-pulse">
                  Procesando archivo...
                </span>
              )}
            </div>

            {/* O ingreso directo de URL */}
            <div className="flex flex-col justify-between p-3 rounded-xl border bg-muted/5 space-y-2">
              <div>
                <label className="text-xs font-semibold text-foreground mb-1 block">
                  O pegar URL directa de imagen
                </label>
                <Input
                  placeholder="https://images.unsplash.com/..."
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  className="text-xs"
                />
              </div>

              <label className="flex items-center gap-2 text-xs text-foreground cursor-pointer pt-1">
                <input
                  type="checkbox"
                  checked={isCover}
                  onChange={(e) => setIsCover(e.target.checked)}
                  className="rounded border-input text-primary focus:ring-primary h-3.5 w-3.5"
                />
                <span>Establecer como Portada principal</span>
              </label>
            </div>
          </div>

          {/* Vista previa de la imagen cargada antes de guardar */}
          {imageUrl && (
            <div className="flex items-center gap-3 p-3 rounded-xl border bg-muted/20 animate-in fade-in-50">
              <img
                src={imageUrl}
                alt="Vista previa"
                className="w-14 h-14 object-cover rounded-lg border shadow-xs"
              />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-foreground truncate">
                  Vista Previa Lista para Guardar
                </p>
                <p className="text-[11px] text-muted-foreground truncate font-mono">
                  {imageUrl.startsWith('data:') ? 'Imagen local codificada (Data URL)' : imageUrl}
                </p>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="text-xs text-muted-foreground hover:text-foreground"
                onClick={() => {
                  setImageUrl('');
                  if (fileInputRef.current) fileInputRef.current.value = '';
                }}
              >
                Descartar
              </Button>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cerrar
            </Button>
            <Button
              type="submit"
              isLoading={isSubmitting}
              disabled={!imageUrl || isProcessingFile}
              className="gap-1.5 shadow-sm"
            >
              <Check className="h-4 w-4" />
              <span>Guardar Fotografía en BD</span>
            </Button>
          </div>
        </form>
      </div>
    </Dialog>
  );
}
