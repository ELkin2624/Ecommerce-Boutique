import { Sparkles } from 'lucide-react';
import type { Product } from '@/shared/types/api';
import { getProductCoverImage } from '@/entities/product';

interface ProductDetailGalleryProps {
  product: Product;
  selectedImage: string;
  onSelectImage: (imageUrl: string) => void;
}

export function ProductDetailGallery({
  product,
  selectedImage,
  onSelectImage,
}: ProductDetailGalleryProps) {
  // Combinar imágenes de la galería con la imagen principal
  const allImages = [
    ...(product.images || []),
    ...(product.coverImage
      ? [{ id: 'cover', imageUrl: product.coverImage, isCover: true, sortOrder: 0, productId: product.id }]
      : []),
  ];

  // Quitar duplicados por URL
  const uniqueImages = Array.from(new Map(allImages.map((img) => [img.imageUrl, img])).values());
  const activeImage = selectedImage || getProductCoverImage(product);

  return (
    <div className="space-y-4">
      {/* Vista Principal */}
      <div className="relative aspect-[3/4] w-full overflow-hidden rounded-none sm:rounded-sm border border-border/40 bg-muted/20">
        <img
          src={activeImage}
          alt={product.name}
          className="h-full w-full object-cover object-center transition-opacity duration-300"
          onError={(e) => {
            (e.target as HTMLImageElement).src =
              'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=800&q=80';
          }}
        />

        {/* Badge AR Couture */}
        {product.arImageUrl && (
          <div className="absolute top-4 right-4 bg-background/90 text-foreground border border-border/60 text-[10px] font-mono tracking-widest uppercase px-3 py-1 flex items-center gap-1.5 shadow-sm backdrop-blur-md">
            <Sparkles className="h-3.5 w-3.5 text-primary" />
            <span>AR 3D Experience</span>
          </div>
        )}
      </div>

      {/* Miniaturas de la Colección */}
      {uniqueImages.length > 1 && (
        <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-none">
          {uniqueImages.map((img, idx) => {
            const isSelected = activeImage === img.imageUrl;
            return (
              <button
                key={idx}
                type="button"
                onClick={() => onSelectImage(img.imageUrl)}
                className={`relative h-20 w-16 flex-shrink-0 overflow-hidden border transition-all ${
                  isSelected
                    ? 'border-foreground ring-1 ring-foreground'
                    : 'border-border/40 hover:border-foreground/50 opacity-70 hover:opacity-100'
                }`}
              >
                <img
                  src={img.imageUrl}
                  alt={`${product.name} preview ${idx + 1}`}
                  className="h-full w-full object-cover"
                />
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
