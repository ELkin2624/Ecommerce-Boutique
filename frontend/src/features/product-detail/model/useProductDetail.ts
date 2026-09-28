import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiClient } from '@/shared/api/axios-client';
import type { Product, ProductVariant } from '@/shared/types/api';
import { getProductCoverImage } from '@/entities/product';
import { useCartStore } from '@/features/cart';
import { toast } from '@/shared/ui/Toast';

export type FitPreference = 'SLIM' | 'REGULAR' | 'OVERSIZE';

export interface FittingResult {
  recommendedSize?: string;
  explanation?: string;
  confidence?: number;
}

export function useProductDetail(productId?: string) {
  const navigate = useNavigate();
  const { addItem } = useCartStore();

  const [product, setProduct] = useState<Product | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState<string>('');
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null);
  const [quantity, setQuantity] = useState(1);

  // Modal de recomendador de talla con IA
  const [isFittingModalOpen, setIsFittingModalOpen] = useState(false);
  const [heightCm, setHeightCm] = useState(165);
  const [weightKg, setWeightKg] = useState(60);
  const [fitPreference, setFitPreference] = useState<FitPreference>('REGULAR');
  const [fittingResult, setFittingResult] = useState<FittingResult | null>(null);
  const [isCalculatingFit, setIsCalculatingFit] = useState(false);

  const fetchProductDetail = useCallback(async (id: string) => {
    setIsLoading(true);
    try {
      const response = await apiClient.get(`/catalog/products/${id}`);
      const data: Product = response.data;
      setProduct(data);

      const cover = getProductCoverImage(data);
      setSelectedImage(cover);

      // Variante inicial seleccionada (primera activa con stock disponible)
      const initialVariant =
        data.variants?.find((v) => v.isActive && (v.stock === undefined || v.stock > 0)) ||
        data.variants?.[0] ||
        null;
      setSelectedVariant(initialVariant);
    } catch (error) {
      console.error('Error al cargar detalle de producto:', error);
      toast.error('Prenda no disponible', 'No pudimos encontrar la prenda solicitada.');
      navigate('/');
    } finally {
      setIsLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    if (productId) {
      fetchProductDetail(productId);
    }
  }, [productId, fetchProductDetail]);

  const handleAddToCart = () => {
    if (!product || !selectedVariant) {
      toast.error('Selección requerida', 'Por favor selecciona una talla y color.');
      return;
    }

    addItem({
      variantId: selectedVariant.id,
      productId: product.id,
      productName: product.name,
      brand: product.brand || 'Boutique Kitty',
      sku: selectedVariant.sku,
      size: selectedVariant.size,
      color: selectedVariant.color,
      price: Number(selectedVariant.price),
      imageUrl: selectedImage || getProductCoverImage(product),
      quantity,
      maxStock: selectedVariant.stock,
    });

    toast.success(
      'Prenda agregada a tu bolsa',
      `${product.name} - Talla ${selectedVariant.size} (${selectedVariant.color})`,
    );
  };

  const handleEstimateFit = async () => {
    if (!product) return;
    setIsCalculatingFit(true);
    try {
      const response = await apiClient.post(`/catalog/products/${product.id}/hybrid-fitting`, {
        heightCm,
        weightKg,
        fitPreference,
      });
      setFittingResult(response.data);

      // Si sugiere una talla, sincronizar automáticamente la variante correspondiente
      if (response.data?.recommendedSize) {
        const matchingVariant = product.variants?.find(
          (v) => v.size.toUpperCase() === response.data.recommendedSize.toUpperCase(),
        );
        if (matchingVariant) {
          setSelectedVariant(matchingVariant);
        }
      }
    } catch (error) {
      console.error('Error al calcular recomendación de talla:', error);
      toast.error('Error al calcular talla', 'Inténtalo nuevamente en unos instantes.');
    } finally {
      setIsCalculatingFit(false);
    }
  };

  return {
    product,
    isLoading,
    selectedImage,
    setSelectedImage,
    selectedVariant,
    setSelectedVariant,
    quantity,
    setQuantity,
    handleAddToCart,
    // AI Fitting
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
  };
}
