import { useParams, Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import {
  useProductDetail,
  ProductDetailGallery,
  ProductDetailInfo,
  ProductDetailFittingModal,
  ProductDetailPerks,
} from '@/features/product-detail';

export function ProductDetailPage() {
  const { id } = useParams<{ id: string }>();
  const {
    product,
    isLoading,
    selectedImage,
    setSelectedImage,
    selectedVariant,
    setSelectedVariant,
    quantity,
    setQuantity,
    handleAddToCart,
    isFittingModalOpen,
    setIsFittingModalOpen,
    heightCm,
    setHeightCm,
    weightKg,
    setWeightKg,
    fitPreference,
    setFitPreference,
    fittingResult,
    isCalculatingFit,
    handleEstimateFit,
  } = useProductDetail(id);

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-6 sm:px-12 py-12 animate-pulse space-y-8">
        <div className="h-4 w-32 bg-muted rounded" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          <div className="aspect-[3/4] bg-muted" />
          <div className="space-y-6">
            <div className="h-8 bg-muted w-3/4" />
            <div className="h-6 bg-muted w-1/4" />
            <div className="h-24 bg-muted" />
          </div>
        </div>
      </div>
    );
  }

  if (!product) return null;

  return (
    <div className="max-w-7xl mx-auto px-6 sm:px-12 py-10 space-y-10 selection:bg-foreground selection:text-background">
      {/* Volver a la Colección */}
      <Link
        to="/"
        className="inline-flex items-center gap-2 text-[11px] font-mono uppercase tracking-[0.2em] text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        <span>Volver a la Colección</span>
      </Link>

      {/* Grid Principal Editorial */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16">
        {/* Galería Fotográfica */}
        <ProductDetailGallery
          product={product}
          selectedImage={selectedImage}
          onSelectImage={setSelectedImage}
        />

        {/* Panel de Compra y Selección */}
        <div className="space-y-8">
          <ProductDetailInfo
            product={product}
            selectedVariant={selectedVariant}
            onSelectVariant={setSelectedVariant}
            quantity={quantity}
            onQuantityChange={setQuantity}
            onAddToCart={handleAddToCart}
            onOpenFittingModal={() => setIsFittingModalOpen(true)}
          />

          {/* Compromisos & Garantías Boutique */}
          <ProductDetailPerks />
        </div>
      </div>

      {/* Modal Inteligente de Medición / IA Fit */}
      <ProductDetailFittingModal
        isOpen={isFittingModalOpen}
        onClose={() => setIsFittingModalOpen(false)}
        heightCm={heightCm}
        onHeightChange={setHeightCm}
        weightKg={weightKg}
        onWeightChange={setWeightKg}
        fitPreference={fitPreference}
        onFitPreferenceChange={setFitPreference}
        isCalculating={isCalculatingFit}
        fittingResult={fittingResult}
        onCalculate={handleEstimateFit}
      />
    </div>
  );
}
