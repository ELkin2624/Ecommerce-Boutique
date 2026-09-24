import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity, StatusBar,
  ActivityIndicator, Alert, Modal, TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Header } from '@/shared/ui/Header';
import { Button } from '@/shared/ui/Button';
import { Badge } from '@/shared/ui/Badge';
import { formatCurrency } from '@/shared/lib/utils';
import { apiClient } from '@/shared/api/api-client';
import { useCartStore } from '@/features/cart/model/useCartStore';
import { useAuth } from '@/features/auth/hooks/use-auth';
import { ProductImage } from '@/shared/ui/ProductImage';
import { matchGarmentForProduct } from '@/features/virtual-try-on/garment/utils/garmentMatcher';
import type { Product, ProductVariant } from '@/entities/product/types';

interface BranchLocation {
  id: string;
  name: string;
  type: string;
}

interface Branch {
  id: string;
  name: string;
  address: string;
  phone?: string;
  city?: { id: string; name: string };
  locations?: BranchLocation[];
}

interface ProductDetailScreenProps {
  id: string;
}

export const ProductDetailScreen: React.FC<ProductDetailScreenProps> = ({ id }) => {
  const [product, setProduct] = useState<Product | null>(null);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null);
  const [selectedImage, setSelectedImage] = useState<string>('');

  // Modal de reserva en tienda (probador)
  const [reserveModalVisible, setReserveModalVisible] = useState(false);
  const [selectedBranchId, setSelectedBranchId] = useState<string>('');
  const [reservationNotes, setReservationNotes] = useState<string>('');
  const [isSubmittingReservation, setIsSubmittingReservation] = useState(false);

  const { totalCount, addItem } = useCartStore();
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    async function loadData() {
      if (!id) return;
      try {
        setLoading(true);
        const [productData, branchesData] = await Promise.all([
          apiClient.get<Product>(`/catalog/products/${id}`),
          apiClient.get<Branch[]>('/branches').catch(() => []),
        ]);

        setProduct(productData);
        setBranches(branchesData);

        if (branchesData.length > 0) {
          setSelectedBranchId(branchesData[0].id);
        }

        if (productData.variants && productData.variants.length > 0) {
          const first = productData.variants[0];
          setSelectedVariant(first);
          const firstImgUri =
            first.measurementsJson?.image ||
            productData.coverImage ||
            productData.images?.[0]?.imageUrl ||
            '';
          setSelectedImage(firstImgUri);
        } else {
          const fallbackUri =
            productData.coverImage || productData.images?.[0]?.imageUrl || '';
          setSelectedImage(fallbackUri);
        }
      } catch {
        Alert.alert('Error', 'No se pudo cargar la información de la prenda');
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [id]);

  // Al cambiar colorway, actualizar variante y foto
  const handleSelectVariant = (variant: ProductVariant) => {
    setSelectedVariant(variant);
    if (variant.measurementsJson?.image) {
      setSelectedImage(variant.measurementsJson.image);
    }
  };

  // Stock total de la variante seleccionada
  const selectedVariantStock =
    selectedVariant?.stocks?.reduce((acc, s) => acc + (s.quantity || 0), 0) ?? 0;

  // Disponibilidad de la variante por sucursal
  const getBranchStock = (branchId: string): number => {
    if (!selectedVariant || !selectedVariant.stocks) return 0;
    return selectedVariant.stocks
      .filter((s) => s.branchId === branchId)
      .reduce((acc, s) => acc + (s.quantity || 0), 0);
  };

  const handleAddToCart = () => {
    if (!product || !selectedVariant) return;

    if (selectedVariantStock <= 0) {
      Alert.alert('Agotado', 'Esta talla y color no cuenta con stock disponible en este momento.');
      return;
    }

    addItem(
      {
        variantId: selectedVariant.id,
        productId: product.id,
        productName: product.name,
        size: selectedVariant.size,
        color: selectedVariant.color,
        image: selectedImage,
        price: selectedVariant.price,
        wholesalePrice: selectedVariant.wholesalePrice,
        wholesaleMinUnits: selectedVariant.wholesaleMinUnits,
        quantity: 1,
        availableStock: selectedVariantStock,
      },
      isAuthenticated
    );

    Alert.alert(
      '¡Prenda Agregada!',
      `${product.name} (Talla ${selectedVariant.size} • ${selectedVariant.color}) añadida a tu bolsa.`,
      [
        { text: 'Seguir mirando' },
        { text: 'Ir a la Bolsa', onPress: () => router.push('/cart' as any) },
      ]
    );
  };

  // Abrir modal de reserva
  const handleOpenReserveModal = () => {
    if (!isAuthenticated) {
      Alert.alert(
        'Inicia Sesión Requerido',
        'Debes iniciar sesión para apartar tus prendas en tienda física.',
        [
          { text: 'Cancelar', style: 'cancel' },
          { text: 'Iniciar Sesión', onPress: () => router.push('/(auth)/login' as any) },
        ]
      );
      return;
    }

    if (!selectedVariant || selectedVariantStock <= 0) {
      Alert.alert('Sin Stock', 'No hay unidades disponibles para reservar en esta talla.');
      return;
    }

    setReserveModalVisible(true);
  };

  // Confirmar reserva en base de datos real
  const handleConfirmReservation = async () => {
    if (!selectedVariant || !selectedBranchId) return;

    const stockInChosenBranch = getBranchStock(selectedBranchId);
    if (stockInChosenBranch <= 0) {
      Alert.alert(
        'Sin stock en esta sucursal',
        'La sucursal seleccionada no tiene stock físico disponible para esta talla. Por favor elige otra sucursal.'
      );
      return;
    }

    try {
      setIsSubmittingReservation(true);
      const payload = {
        branchId: selectedBranchId,
        items: [
          {
            variantId: selectedVariant.id,
            quantity: 1,
          },
        ],
        notes: reservationNotes.trim() || 'Reserva desde App Móvil para probador físico',
      };

      const result = await apiClient.post<any>('/reservations', payload);

      setReserveModalVisible(false);
      setReservationNotes('');

      const branchName =
        branches.find((b) => b.id === selectedBranchId)?.name || 'la sucursal seleccionada';

      Alert.alert(
        '¡Prenda Apartada con Éxito!',
        `Tu reserva (${result.id || 'Confirmada'}) fue registrada en ${branchName}.\n\nTienes 48 horas para acercarte al probador de la tienda y probarte la prenda.`,
        [
          {
            text: 'Ver en Mis Reservas',
            onPress: () => router.push('/profile' as any),
          },
          { text: 'Continuar Comprando' },
        ]
      );
    } catch (err: any) {
      Alert.alert('Error al reservar', err.message || 'No se pudo registrar la reserva.');
    } finally {
      setIsSubmittingReservation(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea} className="flex-1 bg-white">
        <Header showBack />
        <View style={styles.centerContainer} className="flex-1 items-center justify-center p-6">
          <ActivityIndicator size="large" color="#0f172a" />
          <Text style={styles.loadingText} className="text-slate-500 font-semibold text-xs mt-3">
            Cargando prenda exclusiva...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!product) {
    return (
      <SafeAreaView style={styles.safeArea} className="flex-1 bg-white">
        <Header showBack />
        <View style={styles.centerContainer} className="flex-1 items-center justify-center p-6">
          <Ionicons name="alert-circle-outline" size={48} color="#ef4444" />
          <Text style={styles.errorText} className="text-rose-500 font-bold text-base mt-2.5">
            No se encontró la prenda
          </Text>
          <Button
            title="Volver al Catálogo"
            onPress={() => router.back()}
            style={{ marginTop: 16 }}
          />
        </View>
      </SafeAreaView>
    );
  }

  const wholesaleActive = Boolean(selectedVariant?.wholesalePrice);
  const minWholesaleUnits = selectedVariant?.wholesaleMinUnits || 6;

  // Galería de imágenes únicas sin repetición ni strings vacíos
  const galleryImages = Array.from(
    new Set(
      [
        product.coverImage,
        ...(product.images?.map((img) => img.imageUrl) || []),
        selectedVariant?.measurementsJson?.image,
      ].filter((url): url is string => Boolean(url && url.trim().length > 0))
    )
  );

  return (
    <SafeAreaView style={styles.safeArea} className="flex-1 bg-white">
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      <Header showBack cartCount={totalCount} />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Imagen Principal Hero estilo Nike / Adidas */}
        <View style={styles.heroImageContainer} className="w-full h-96 bg-slate-50 relative">
          <ProductImage
            uri={selectedImage}
            style={styles.heroImage}
            resizeMode="cover"
            productName={product.name}
            iconSize={48}
          />

          {/* Badges Flotantes sobre la Imagen */}
          <View style={styles.imageOverlayBadges} className="absolute top-3.5 left-3.5 right-3.5 flex-row justify-between items-center">
            {selectedVariantStock === 0 ? (
              <View style={styles.stockStatusBadgeSoldOut} className="bg-slate-900/90 px-2.5 py-1 rounded-md">
                <Text style={styles.stockStatusText} className="text-white text-[10px] font-black tracking-wider">
                  AGOTADO
                </Text>
              </View>
            ) : selectedVariantStock <= 3 ? (
              <View style={styles.stockStatusBadgeLow} className="bg-orange-600 flex-row items-center gap-1 px-2.5 py-1 rounded-md">
                <Ionicons name="flame" size={12} color="#ffffff" />
                <Text style={styles.stockStatusText} className="text-white text-[10px] font-black tracking-wider">
                  ¡ÚLTIMAS {selectedVariantStock} UDS!
                </Text>
              </View>
            ) : (
              <View style={styles.stockStatusBadgeInStock} className="bg-emerald-600 flex-row items-center gap-1 px-2.5 py-1 rounded-md">
                <Ionicons name="checkmark-circle" size={12} color="#ffffff" />
                <Text style={styles.stockStatusText} className="text-white text-[10px] font-black tracking-wider">
                  EN STOCK
                </Text>
              </View>
            )}

            {product.season && (
              <View style={styles.seasonBadge} className="bg-white/90 px-2.5 py-1 rounded-md">
                <Text style={styles.seasonBadgeText} className="text-slate-900 text-[10px] font-black tracking-wider">
                  {product.season.name.toUpperCase()}
                </Text>
              </View>
            )}
          </View>

          {/* Botón flotante Probar en AR en el Hero */}
          <TouchableOpacity
            style={styles.heroTryOnButton}
            onPress={() => {
              router.push({
                pathname: '/virtual-try-on',
                params: { garmentId: product.id },
              } as any);
            }}
            activeOpacity={0.85}
          >
            <Ionicons name="sparkles" size={15} color="#ffffff" />
            <Text style={styles.heroTryOnButtonText}>Probar en AR</Text>
          </TouchableOpacity>

          {/* Carrusel de Miniaturas si hay más de 1 foto */}
          {galleryImages.length > 1 && (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.thumbnailCarousel}
              contentContainerStyle={styles.thumbnailContent}
            >
              {galleryImages.map((imgUrl, index) => {
                const isActive = selectedImage === imgUrl;
                return (
                  <TouchableOpacity
                    key={`thumb-${index}`}
                    onPress={() => setSelectedImage(imgUrl)}
                    style={[styles.thumbBtn, isActive && styles.thumbBtnActive]}
                  >
                    <ProductImage
                      uri={imgUrl}
                      style={styles.thumbMini}
                      resizeMode="cover"
                      showText={false}
                      iconSize={16}
                    />
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          )}
        </View>

        {/* Información Principal de la Prenda */}
        <View style={styles.detailsContainer} className="p-4">
          <View style={styles.brandRow} className="flex-row justify-between items-center">
            <Text style={styles.brandText} className="text-slate-500 font-black text-xs tracking-widest">
              {product.brand?.toUpperCase() || 'BOUTIQUE MODA'}
            </Text>
            {product.category && <Badge label={product.category.name} variant="secondary" />}
          </View>

          <Text style={styles.productName} className="text-slate-900 font-black text-2xl mt-1.5 tracking-tight">
            {product.name}
          </Text>

          {/* Tarjeta de Precios Estilo Retail Moderno */}
          <View style={styles.pricingCard} className="flex-row items-center justify-between bg-slate-50 rounded-2xl p-4 border border-slate-200 mt-4">
            <View>
              <Text style={styles.priceLabel} className="text-slate-500 font-bold text-[10px] tracking-wider">
                PRECIO REGULAR
              </Text>
              <Text style={styles.priceValue} className="text-slate-900 font-black text-2xl mt-0.5">
                {formatCurrency(selectedVariant?.price || 0)}
              </Text>
            </View>

            {wholesaleActive && (
              <View style={styles.wholesaleBox} className="items-end">
                <View style={styles.wholesaleTagRow} className="flex-row items-center gap-1">
                  <Ionicons name="pricetag" size={12} color="#059669" />
                  <Text style={styles.wholesaleTagText} className="text-emerald-600 font-black text-[10px] tracking-wider">
                    PRECIO MAYORISTA
                  </Text>
                </View>
                <Text style={styles.wholesalePriceValue} className="text-emerald-600 font-black text-lg mt-0.5">
                  {formatCurrency(selectedVariant!.wholesalePrice!)}
                </Text>
                <Text style={styles.wholesaleUnitsHint} className="text-slate-500 text-[10px] mt-0.5">
                  A partir de {minWholesaleUnits} prendas
                </Text>
              </View>
            )}
          </View>

          {/* Selector de Colores (Colorway Swatches) */}
          <View style={styles.section} className="mt-5">
            <Text style={styles.sectionTitle} className="text-slate-900 font-black text-xs tracking-wider">
              COLOR: <Text style={styles.selectedValue} className="text-slate-500 font-semibold">{selectedVariant?.color || 'Único'}</Text>
            </Text>
            <View style={styles.colorsRow} className="flex-row flex-wrap gap-2 mt-2.5">
              {product.variants?.map((v) => {
                const isSelected = selectedVariant?.id === v.id;
                const hex = v.measurementsJson?.colorHex || '#0f172a';
                return (
                  <TouchableOpacity
                    key={v.id}
                    onPress={() => handleSelectVariant(v)}
                    style={[styles.colorOption, isSelected && styles.colorOptionActive]}
                    className={`flex-row items-center gap-2 rounded-full py-1.5 px-3.5 border ${
                      isSelected ? 'border-slate-900 bg-white' : 'border-slate-200 bg-slate-50'
                    }`}
                  >
                    <View style={[styles.colorCircle, { backgroundColor: hex }]} className="w-4 h-4 rounded-full border border-black/15" />
                    <Text
                      style={[styles.colorName, isSelected && styles.colorNameActive]}
                      className={`text-xs ${isSelected ? 'text-slate-900 font-extrabold' : 'text-slate-500 font-semibold'}`}
                    >
                      {v.color}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Selector de Tallas Estilo Nike / Adidas */}
          <View style={styles.section} className="mt-5">
            <View style={styles.sizeHeaderRow} className="flex-row justify-between items-center">
              <Text style={styles.sectionTitle} className="text-slate-900 font-black text-xs tracking-wider">
                SELECCIONA TU TALLA:{' '}
                <Text style={styles.selectedValue} className="text-slate-500 font-semibold">{selectedVariant?.size}</Text>
              </Text>
              <TouchableOpacity
                onPress={() => {
                  router.push({
                    pathname: '/virtual-try-on',
                    params: { garmentId: product.id },
                  } as any);
                }}
                style={styles.fittingLink}
                className="flex-row items-center gap-1 bg-slate-900 px-2.5 py-1.5 rounded-md"
              >
                <Ionicons name="sparkles" size={13} color="#38bdf8" />
                <Text style={styles.fittingLinkText} className="text-white font-extrabold text-[11px]">
                  Probar en Probador AR
                </Text>
              </TouchableOpacity>
            </View>

            <View style={styles.sizesRow} className="flex-row flex-wrap gap-2.5 mt-2.5">
              {product.variants?.map((v) => {
                const isSelected = selectedVariant?.id === v.id;
                const variantStock =
                  v.stocks?.reduce((acc, s) => acc + (s.quantity || 0), 0) ?? 0;
                const isOutOfStock = variantStock === 0;

                return (
                  <TouchableOpacity
                    key={v.id}
                    onPress={() => handleSelectVariant(v)}
                    style={[
                      styles.sizeBox,
                      isSelected && styles.sizeBoxActive,
                      isOutOfStock && styles.sizeBoxOutOfStock,
                    ]}
                  >
                    <Text
                      style={[
                        styles.sizeText,
                        isSelected && styles.sizeTextActive,
                        isOutOfStock && styles.sizeTextOutOfStock,
                      ]}
                    >
                      {v.size}
                    </Text>
                    {isOutOfStock && <View style={styles.sizeSlash} />}
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Disponibilidad Real por Sucursal Física (BD) */}
          <View style={styles.branchSection} className="mt-6 bg-slate-50 rounded-2xl p-4 border border-slate-200">
            <View style={styles.branchHeaderRow} className="flex-row items-center gap-2">
              <Ionicons name="storefront-outline" size={18} color="#0f172a" />
              <Text style={styles.branchSectionTitle} className="text-slate-900 font-black text-xs tracking-wider">
                Disponibilidad en Tiendas Físicas
              </Text>
            </View>
            <Text style={styles.branchSectionSubtitle} className="text-slate-500 text-xs mt-1 mb-3">
              Inventario en tiempo real para talla {selectedVariant?.size}:
            </Text>

            <View style={styles.branchList} className="gap-2.5">
              {branches.map((b) => {
                const stockQty = getBranchStock(b.id);
                return (
                  <View key={b.id} style={styles.branchRow} className="flex-row justify-between items-center py-2 border-b border-slate-200/60">
                    <View style={styles.branchInfo} className="flex-1 pr-2.5">
                      <Text style={styles.branchNameText} className="text-slate-900 font-bold text-xs">{b.name}</Text>
                      <Text style={styles.branchAddressText} className="text-slate-500 text-[10px] mt-0.5">
                        {b.address} {b.city ? `• ${b.city.name}` : ''}
                      </Text>
                    </View>
                    {stockQty > 0 ? (
                      <View style={styles.stockAvailableBadge} className="flex-row items-center gap-1 bg-emerald-50 px-2 py-1 rounded-md">
                        <Ionicons name="checkmark-circle" size={13} color="#059669" />
                        <Text style={styles.stockAvailableText} className="text-emerald-700 font-extrabold text-[10px]">
                          {stockQty} en tienda
                        </Text>
                      </View>
                    ) : (
                      <View style={styles.stockEmptyBadge} className="bg-slate-100 px-2 py-1 rounded-md">
                        <Text style={styles.stockEmptyText} className="text-slate-400 font-bold text-[10px]">
                          Agotado aquí
                        </Text>
                      </View>
                    )}
                  </View>
                );
              })}
            </View>
          </View>

          {/* Descripción del Producto */}
          {product.description ? (
            <View style={styles.section} className="mt-5">
              <Text style={styles.sectionTitle} className="text-slate-900 font-black text-xs tracking-wider">
                DETALLES DEL PRODUCTO
              </Text>
              <Text style={styles.descriptionText} className="text-slate-600 text-xs leading-5 mt-2">
                {product.description}
              </Text>
            </View>
          ) : null}

          {/* Garantía y Beneficios Estilo Retail Premium */}
          <View style={styles.benefitsCard} className="mt-5 bg-white rounded-xl p-3.5 border border-slate-100 gap-2.5">
            <View style={styles.benefitItem} className="flex-row items-center gap-2.5">
              <Ionicons name="shield-checkmark-outline" size={18} color="#0f172a" />
              <Text style={styles.benefitText} className="text-slate-700 font-semibold text-xs">
                Garantía de confección original
              </Text>
            </View>
            <View style={styles.benefitItem} className="flex-row items-center gap-2.5">
              <Ionicons name="time-outline" size={18} color="#0f172a" />
              <Text style={styles.benefitText} className="text-slate-700 font-semibold text-xs">
                48 horas de reserva para probador
              </Text>
            </View>
            <View style={styles.benefitItem} className="flex-row items-center gap-2.5">
              <Ionicons name="repeat-outline" size={18} color="#0f172a" />
              <Text style={styles.benefitText} className="text-slate-700 font-semibold text-xs">
                Cambios inmediatos en sucursal
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Barra Inferior Fija de Doble Acción (Estilo Nike / Adidas) */}
      <View style={styles.bottomBar} className="absolute bottom-0 left-0 right-0 flex-row items-center gap-3 px-4 py-3.5 bg-white border-t border-slate-100 shadow-lg">
        <TouchableOpacity
          style={[styles.reserveBtn, selectedVariantStock === 0 && styles.btnDisabled]}
          onPress={handleOpenReserveModal}
          disabled={selectedVariantStock === 0}
          activeOpacity={0.8}
        >
          <Ionicons name="bookmark-outline" size={18} color="#0f172a" />
          <Text style={styles.reserveBtnText}>Reservar en Tienda</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.addToBagBtn, selectedVariantStock === 0 && styles.btnDisabled]}
          onPress={handleAddToCart}
          disabled={selectedVariantStock === 0}
          activeOpacity={0.85}
        >
          <Ionicons name="bag-handle-outline" size={18} color="#ffffff" />
          <Text style={styles.addToBagBtnText}>
            {selectedVariantStock === 0 ? 'Agotado' : 'Añadir a la Bolsa'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* MODAL DE RESERVA EN TIENDA FÍSICA (PROBADOR) */}
      <Modal
        visible={reserveModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setReserveModalVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalContainer}>
            {/* Cabecera del modal */}
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>Apartar para Probador</Text>
                <Text style={styles.modalSubtitle}>Pruébatelo en tienda antes de pagar</Text>
              </View>
              <TouchableOpacity
                onPress={() => setReserveModalVisible(false)}
                style={styles.modalCloseBtn}
              >
                <Ionicons name="close" size={20} color="#0f172a" />
              </TouchableOpacity>
            </View>

            {/* Resumen de la prenda a reservar */}
            <View style={styles.modalProductSummary}>
              <ProductImage
                uri={selectedImage}
                style={styles.modalProductImage}
                showText={false}
                iconSize={20}
              />
              <View style={styles.modalProductInfo}>
                <Text style={styles.modalProductName} numberOfLines={1}>
                  {product.name}
                </Text>
                <Text style={styles.modalProductSpecs}>
                  Talla: <Text style={styles.boldText}>{selectedVariant?.size}</Text> • Color:{' '}
                  <Text style={styles.boldText}>{selectedVariant?.color}</Text>
                </Text>
                <Text style={styles.modalProductPrice}>
                  {formatCurrency(selectedVariant?.price || 0)}
                </Text>
              </View>
            </View>

            {/* Selector de Sucursal Física */}
            <Text style={styles.modalFieldLabel}>Selecciona la Sucursal para Retiro:</Text>
            <ScrollView style={styles.branchSelectorScroll}>
              {branches.map((b) => {
                const stockQty = getBranchStock(b.id);
                const isSelected = selectedBranchId === b.id;
                const isEnabled = stockQty > 0;

                return (
                  <TouchableOpacity
                    key={b.id}
                    disabled={!isEnabled}
                    style={[
                      styles.modalBranchOption,
                      isSelected && styles.modalBranchOptionSelected,
                      !isEnabled && styles.modalBranchOptionDisabled,
                    ]}
                    onPress={() => setSelectedBranchId(b.id)}
                  >
                    <View style={styles.modalBranchLeft}>
                      <Ionicons
                        name={isSelected ? 'radio-button-on' : 'radio-button-off'}
                        size={18}
                        color={isSelected ? '#0f172a' : isEnabled ? '#94a3b8' : '#cbd5e1'}
                      />
                      <View>
                        <Text
                          style={[
                            styles.modalBranchName,
                            !isEnabled && styles.modalBranchNameDisabled,
                          ]}
                        >
                          {b.name}
                        </Text>
                        <Text style={styles.modalBranchAddress}>{b.address}</Text>
                      </View>
                    </View>
                    <Badge
                      label={isEnabled ? `${stockQty} disponibles` : 'Sin stock'}
                      variant={isEnabled ? 'success' : 'destructive'}
                    />
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            {/* Indicación de Política */}
            <View style={styles.policyBox}>
              <Ionicons name="information-circle-outline" size={18} color="#0284c7" />
              <Text style={styles.policyText}>
                Tus prendas se apartarán inmediatamente por <Text style={styles.boldText}>48 horas</Text>.
                No pagarás nada hasta que te las pruebes en la tienda.
              </Text>
            </View>

            {/* Notas adicionales */}
            <Text style={styles.modalFieldLabel}>Nota para el personal (opcional):</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Ej: Llego hoy a las 18:00 hrs"
              placeholderTextColor="#94a3b8"
              value={reservationNotes}
              onChangeText={setReservationNotes}
            />

            {/* Botón de Confirmación */}
            <TouchableOpacity
              style={[styles.confirmReserveBtn, isSubmittingReservation && styles.btnDisabled]}
              onPress={handleConfirmReservation}
              disabled={isSubmittingReservation}
            >
              {isSubmittingReservation ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <>
                  <Ionicons name="checkmark-circle-outline" size={18} color="#ffffff" />
                  <Text style={styles.confirmReserveBtnText}>Confirmar y Apartar Prenda</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  scrollContent: {
    paddingBottom: 100,
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  loadingText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748b',
    marginTop: 12,
  },
  errorText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ef4444',
    marginTop: 10,
  },
  heroImageContainer: {
    width: '100%',
    height: 400,
    backgroundColor: '#f8fafc',
    position: 'relative',
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  heroTryOnButton: {
    position: 'absolute',
    bottom: 16,
    right: 16,
    backgroundColor: '#0f172a',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
    zIndex: 10,
  },
  heroTryOnButtonText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.4,
  },
  imageOverlayBadges: {
    position: 'absolute',
    top: 14,
    left: 14,
    right: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  stockStatusBadgeSoldOut: {
    backgroundColor: 'rgba(15, 23, 42, 0.9)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  stockStatusBadgeLow: {
    backgroundColor: '#ea580c',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  stockStatusBadgeInStock: {
    backgroundColor: '#059669',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  stockStatusText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  seasonBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  seasonBadgeText: {
    color: '#0f172a',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.8,
  },
  thumbnailCarousel: {
    position: 'absolute',
    bottom: 12,
    left: 12,
    right: 12,
  },
  thumbnailContent: {
    gap: 8,
  },
  thumbBtn: {
    width: 52,
    height: 52,
    borderRadius: 10,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.9)',
    backgroundColor: '#ffffff',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  thumbBtnActive: {
    borderColor: '#0f172a',
    transform: [{ scale: 1.05 }],
  },
  thumbMini: {
    width: '100%',
    height: '100%',
  },
  detailsContainer: {
    padding: 18,
  },
  brandRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  brandText: {
    fontSize: 12,
    fontWeight: '900',
    color: '#64748b',
    letterSpacing: 1.5,
  },
  productName: {
    fontSize: 22,
    fontWeight: '900',
    color: '#0f172a',
    marginTop: 6,
    letterSpacing: -0.5,
  },
  pricingCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#f8fafc',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginTop: 16,
  },
  priceLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#64748b',
    letterSpacing: 0.5,
  },
  priceValue: {
    fontSize: 24,
    fontWeight: '900',
    color: '#0f172a',
    marginTop: 2,
  },
  wholesaleBox: {
    alignItems: 'flex-end',
  },
  wholesaleTagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  wholesaleTagText: {
    fontSize: 9,
    fontWeight: '900',
    color: '#059669',
    letterSpacing: 0.5,
  },
  wholesalePriceValue: {
    fontSize: 18,
    fontWeight: '900',
    color: '#059669',
    marginTop: 2,
  },
  wholesaleUnitsHint: {
    fontSize: 9,
    color: '#64748b',
    marginTop: 1,
  },
  section: {
    marginTop: 20,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '900',
    color: '#0f172a',
    letterSpacing: 0.8,
  },
  selectedValue: {
    fontWeight: '600',
    color: '#64748b',
  },
  colorsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 10,
  },
  colorOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#f8fafc',
    borderRadius: 99,
    paddingVertical: 7,
    paddingHorizontal: 14,
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
  },
  colorOptionActive: {
    borderColor: '#0f172a',
    backgroundColor: '#ffffff',
  },
  colorCircle: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.15)',
  },
  colorName: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748b',
  },
  colorNameActive: {
    color: '#0f172a',
    fontWeight: '800',
  },
  sizeHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  fittingLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#e0e7ff',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  fittingLinkText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#4338ca',
  },
  sizesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 10,
  },
  sizeBox: {
    width: 54,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#f8fafc',
    borderWidth: 1.5,
    borderColor: '#cbd5e1',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  sizeBoxActive: {
    borderColor: '#0f172a',
    backgroundColor: '#0f172a',
  },
  sizeBoxOutOfStock: {
    backgroundColor: '#f1f5f9',
    borderColor: '#e2e8f0',
    opacity: 0.6,
  },
  sizeText: {
    fontSize: 14,
    fontWeight: '900',
    color: '#0f172a',
  },
  sizeTextActive: {
    color: '#ffffff',
  },
  sizeTextOutOfStock: {
    color: '#94a3b8',
    textDecorationLine: 'line-through',
  },
  sizeSlash: {
    position: 'absolute',
    width: '80%',
    height: 1,
    backgroundColor: '#94a3b8',
    transform: [{ rotate: '-45deg' }],
  },
  branchSection: {
    marginTop: 24,
    backgroundColor: '#f8fafc',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  branchHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  branchSectionTitle: {
    fontSize: 13,
    fontWeight: '900',
    color: '#0f172a',
    letterSpacing: 0.5,
  },
  branchSectionSubtitle: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 4,
    marginBottom: 12,
  },
  branchList: {
    gap: 10,
  },
  branchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#edf2f7',
  },
  branchInfo: {
    flex: 1,
    paddingRight: 10,
  },
  branchNameText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0f172a',
  },
  branchAddressText: {
    fontSize: 10,
    color: '#64748b',
    marginTop: 1,
  },
  stockAvailableBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#ecfdf5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  stockAvailableText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#059669',
  },
  stockEmptyBadge: {
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  stockEmptyText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#94a3b8',
  },
  descriptionText: {
    fontSize: 13,
    color: '#475569',
    lineHeight: 20,
    marginTop: 8,
  },
  benefitsCard: {
    marginTop: 20,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    gap: 10,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  benefitText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#334155',
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 8,
  },
  reserveBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#f1f5f9',
    borderWidth: 1.5,
    borderColor: '#cbd5e1',
  },
  reserveBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0f172a',
  },
  addToBagBtn: {
    flex: 1.2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#0f172a',
  },
  addToBagBtnText: {
    fontSize: 13,
    fontWeight: '900',
    color: '#ffffff',
    letterSpacing: 0.5,
  },
  btnDisabled: {
    opacity: 0.5,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    maxHeight: '85%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#0f172a',
  },
  modalSubtitle: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
  },
  modalCloseBtn: {
    padding: 6,
    borderRadius: 20,
    backgroundColor: '#f1f5f9',
  },
  modalProductSummary: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#f8fafc',
    borderRadius: 14,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  modalProductImage: {
    width: 56,
    height: 56,
    borderRadius: 10,
  },
  modalProductInfo: {
    flex: 1,
  },
  modalProductName: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0f172a',
  },
  modalProductSpecs: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 2,
  },
  boldText: {
    fontWeight: '800',
    color: '#0f172a',
  },
  modalProductPrice: {
    fontSize: 13,
    fontWeight: '900',
    color: '#0f172a',
    marginTop: 2,
  },
  modalFieldLabel: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 8,
  },
  branchSelectorScroll: {
    maxHeight: 160,
    marginBottom: 12,
  },
  modalBranchOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    marginBottom: 8,
  },
  modalBranchOptionSelected: {
    borderColor: '#0f172a',
    backgroundColor: '#f8fafc',
  },
  modalBranchOptionDisabled: {
    opacity: 0.5,
    borderColor: '#f1f5f9',
  },
  modalBranchLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  modalBranchName: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0f172a',
  },
  modalBranchNameDisabled: {
    color: '#94a3b8',
  },
  modalBranchAddress: {
    fontSize: 10,
    color: '#64748b',
    marginTop: 1,
  },
  policyBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#f0f9ff',
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#bae6fd',
    marginBottom: 14,
  },
  policyText: {
    fontSize: 11,
    color: '#0369a1',
    flex: 1,
    lineHeight: 15,
  },
  modalInput: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 12,
    color: '#0f172a',
    marginBottom: 16,
  },
  confirmReserveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#0f172a',
    borderRadius: 14,
    height: 48,
  },
  confirmReserveBtnText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
});
