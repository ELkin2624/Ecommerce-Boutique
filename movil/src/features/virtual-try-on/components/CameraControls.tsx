/**
 * Camera Controls & Virtual Try-On HUD
 * FashionStore Virtual Try-On - Catalog & Cart Integration
 *
 * Implements the complete premium AR interface:
 * - Floating Header (Back, [ACTIVO], SEGUIMIENTO PRECISO, Switch Camera)
 * - Top-Right Garment Card (Product Preview, Name, Price, Add to Cart with live sync)
 * - Right-Side Garment Selector Rail (Catalog, Cart, and Preset switcher)
 * - Bottom Action Dock (Mi Carrito, Catálogo, Tops, Abrigos, Todos, Controls)
 */

import React, { useState, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
  ToastAndroid,
  Platform,
  Alert,
  type ImageSourcePropType,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import type { CameraPosition } from '../types/camera.types';
import type { VirtualGarment } from '../garment/types/garment.types';
import { AVAILABLE_GARMENTS } from '../garment/data/garmentAssets';
import {
  resolveCartItemToGarment,
  resolveProductToGarment,
} from '../garment/utils/garmentMatcher';
import { useCartStore } from '@/features/cart/model/useCartStore';
import type { Product } from '@/entities/product/types';
import type { PoseStatus } from '../pose/types/pose.types';

export type DockTab = 'CART' | 'CATALOG' | 'TOP' | 'OUTERWEAR' | 'ALL';

interface CameraControlsProps {
  position: CameraPosition;
  isActive: boolean;
  poseStatus?: PoseStatus;
  currentFps?: number;
  showSkeleton: boolean;
  showGarment: boolean;
  showCoordinateDebug?: boolean;
  selectedGarment: VirtualGarment;
  onSelectGarment: (id: string) => void;
  onTogglePosition: () => void;
  onToggleActive: () => void;
  onToggleSkeleton: () => void;
  onToggleGarment: () => void;
  onToggleCoordinateDebug?: () => void;
  onClose: () => void;
  catalogProducts?: readonly Product[];
}

export const CameraControls: React.FC<CameraControlsProps> = ({
  position,
  isActive,
  poseStatus = 'ready',
  selectedGarment,
  onSelectGarment,
  showSkeleton,
  showGarment,
  showCoordinateDebug = false,
  onTogglePosition,
  onToggleActive,
  onToggleSkeleton,
  onToggleGarment,
  onToggleCoordinateDebug,
  onClose,
  catalogProducts = [],
}) => {
  const { items: cartItems, addItem: addToCart } = useCartStore();

  // Initial active tab inferred from selected garment
  const initialTab = useMemo<DockTab>(() => {
    if (selectedGarment.isFromCart) return 'CART';
    if (selectedGarment.isFromCatalog) return 'CATALOG';
    if (cartItems.length > 0) return 'CART';
    if (catalogProducts.length > 0) return 'CATALOG';
    return 'TOP';
  }, [selectedGarment, cartItems.length, catalogProducts.length]);

  const [activeTab, setActiveTab] = useState<DockTab>(initialTab);
  const [addedToCart, setAddedToCart] = useState<boolean>(false);

  // If selected garment changes to cart or catalog from navigation, sync active tab
  useEffect(() => {
    if (selectedGarment.isFromCart) {
      setActiveTab('CART');
    } else if (selectedGarment.isFromCatalog) {
      setActiveTab('CATALOG');
    }
  }, [selectedGarment.id, selectedGarment.isFromCart, selectedGarment.isFromCatalog]);

  const isInCart = useMemo(() => {
    if (selectedGarment.isFromCart) return true;
    return cartItems.some(
      (it) =>
        it.productId === selectedGarment.productId ||
        it.variantId === selectedGarment.variantId ||
        it.productId === selectedGarment.id
    );
  }, [selectedGarment, cartItems]);

  const handleAddToCart = async () => {
    if (isInCart) {
      const msg = `¡${selectedGarment.name} ya está en tu carrito!`;
      if (Platform.OS === 'android') {
        ToastAndroid.show(msg, ToastAndroid.SHORT);
      } else {
        Alert.alert('Carrito', msg);
      }
      return;
    }

    try {
      const priceClean =
        parseFloat(selectedGarment.price.replace(/[^0-9.]/g, '')) || 49.99;

      await addToCart({
        variantId: selectedGarment.variantId || `var-${selectedGarment.id}`,
        productId: selectedGarment.productId || selectedGarment.id,
        productName: selectedGarment.name,
        size: 'M',
        color: 'Único',
        image:
          selectedGarment.previewUri ||
          'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=500',
        price: priceClean,
        quantity: 1,
      });

      setAddedToCart(true);
      const msg = `¡${selectedGarment.name} agregado a tu carrito!`;
      if (Platform.OS === 'android') {
        ToastAndroid.show(msg, ToastAndroid.SHORT);
      } else {
        Alert.alert('Carrito', msg);
      }
      setTimeout(() => setAddedToCart(false), 2500);
    } catch (err) {
      console.warn('[CameraControls] Error agregando al carrito:', err);
    }
  };

  const getStatusLabel = () => {
    if (!isActive) return 'CAPTURA PAUSADA';
    if (poseStatus === 'loading-model') return 'CARGANDO IA...';
    if (poseStatus === 'no-pose') return 'BUSCANDO CUERPO';
    if (poseStatus === 'low-confidence') return 'AJUSTANDO POSICIÓN';
    return 'SEGUIMIENTO PRECISO';
  };

  // Garments to display on the quick-select rail depending on active tab
  const displayedGarments: readonly VirtualGarment[] = useMemo(() => {
    switch (activeTab) {
      case 'CART':
        return cartItems.map((it) => resolveCartItemToGarment(it));
      case 'CATALOG':
        if (catalogProducts && catalogProducts.length > 0) {
          return catalogProducts.map((p) => resolveProductToGarment(p));
        }
        return AVAILABLE_GARMENTS;
      case 'TOP':
        return AVAILABLE_GARMENTS.filter((g) => g.category === 'TOP');
      case 'OUTERWEAR':
        return AVAILABLE_GARMENTS.filter((g) => g.category === 'OUTERWEAR');
      case 'ALL':
      default:
        return AVAILABLE_GARMENTS;
    }
  }, [activeTab, cartItems, catalogProducts]);

  const handleSelectTab = (tab: DockTab) => {
    setActiveTab(tab);
    // If switching tabs and current garment is not in that list, auto-select first item
    if (tab === 'CART' && cartItems.length > 0) {
      const first = resolveCartItemToGarment(cartItems[0]);
      onSelectGarment(first.id);
    } else if (tab === 'CATALOG' && catalogProducts.length > 0) {
      const first = resolveProductToGarment(catalogProducts[0]);
      onSelectGarment(first.id);
    } else if (tab === 'TOP') {
      const tops = AVAILABLE_GARMENTS.filter((g) => g.category === 'TOP');
      if (tops.length > 0 && selectedGarment.category !== 'TOP') {
        onSelectGarment(tops[0].id);
      }
    } else if (tab === 'OUTERWEAR') {
      const out = AVAILABLE_GARMENTS.filter((g) => g.category === 'OUTERWEAR');
      if (out.length > 0 && selectedGarment.category !== 'OUTERWEAR') {
        onSelectGarment(out[0].id);
      }
    }
  };

  return (
    <SafeAreaView style={styles.overlay} pointerEvents="box-none">
      {/* ── 1. Top Bar Header ────────────────────────────────────────────── */}
      <View style={styles.topBar} pointerEvents="box-none">
        {/* Back Button */}
        <TouchableOpacity
          onPress={onClose}
          style={styles.circleBtn}
          activeOpacity={0.8}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <Ionicons name="chevron-back" size={24} color="#ffffff" />
        </TouchableOpacity>

        {/* Status Badges */}
        <View style={styles.headerCenter}>
          <View
            style={[
              styles.statusBadge,
              isActive ? styles.statusBadgeActive : styles.statusBadgePaused,
            ]}
          >
            <View
              style={[
                styles.statusDot,
                isActive ? styles.statusDotActive : styles.statusDotPaused,
              ]}
            />
            <Text style={styles.statusText}>
              {isActive ? '[ACTIVO]' : '[PAUSADO]'}
            </Text>
          </View>

          {/* Precision Tracking Sub-Badge */}
          {isActive && (
            <View style={styles.trackingSubBadge}>
              <View style={styles.trackingDot} />
              <Text style={styles.trackingText}>{getStatusLabel()}</Text>
            </View>
          )}
        </View>

        {/* Switch Camera Button */}
        <TouchableOpacity
          onPress={onTogglePosition}
          style={styles.circleBtn}
          activeOpacity={0.8}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <Ionicons name="camera-reverse-outline" size={22} color="#ffffff" />
        </TouchableOpacity>
      </View>

      {/* ── 2. Top-Right Garment Card ─────────────────────────────────────── */}
      <View style={styles.topRightCardWrap} pointerEvents="box-none">
        <View style={styles.productCard}>
          <View style={styles.productImageWrap}>
            {selectedGarment.previewUri ? (
              <Image
                source={{ uri: selectedGarment.previewUri }}
                style={styles.productImage}
                resizeMode="cover"
              />
            ) : (
              <Image
                source={selectedGarment.imageSource as ImageSourcePropType}
                style={styles.productImage}
                resizeMode="contain"
              />
            )}
          </View>

          <Text style={styles.productName} numberOfLines={2}>
            {selectedGarment.name}
          </Text>
          <Text style={styles.productPrice}>{selectedGarment.price}</Text>

          <TouchableOpacity
            style={[
              styles.cartButton,
              (isInCart || addedToCart) && styles.cartButtonSuccess,
            ]}
            onPress={handleAddToCart}
            activeOpacity={0.85}
          >
            <Ionicons
              name={isInCart ? 'checkmark-circle' : addedToCart ? 'checkmark' : 'bag-add-outline'}
              size={14}
              color={isInCart || addedToCart ? '#ffffff' : '#0f172a'}
            />
            <Text
              style={[
                styles.cartButtonText,
                (isInCart || addedToCart) && styles.cartButtonTextSuccess,
              ]}
            >
              {isInCart ? 'En Carrito ✓' : addedToCart ? '¡Agregado!' : 'Añadir al carrito'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* ── 3. Right-Side Garment Selector Rail ───────────────────────────── */}
      <View style={styles.rightRailWrap} pointerEvents="box-none">
        {activeTab === 'CART' && cartItems.length === 0 ? (
          <View style={styles.emptyCartCard}>
            <Ionicons name="bag-outline" size={20} color="#94a3b8" />
            <Text style={styles.emptyCartTitle}>Carrito vacío</Text>
            <Text style={styles.emptyCartSubtitle}>
              Agrega prendas en la boutique para probarlas aquí
            </Text>
          </View>
        ) : (
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.railContent}
            bounces={false}
          >
            {displayedGarments.map((item) => {
              const isSelected =
                item.id === selectedGarment.id ||
                (!!item.productId && item.productId === selectedGarment.productId);

              return (
                <TouchableOpacity
                  key={item.id}
                  onPress={() => onSelectGarment(item.id)}
                  style={[
                    styles.railItem,
                    isSelected && styles.railItemSelected,
                  ]}
                  activeOpacity={0.8}
                >
                  {item.previewUri ? (
                    <Image
                      source={{ uri: item.previewUri }}
                      style={styles.railImage}
                      resizeMode="cover"
                    />
                  ) : (
                    <Image
                      source={item.imageSource as ImageSourcePropType}
                      style={styles.railImage}
                      resizeMode="contain"
                    />
                  )}
                  {item.isFromCart && (
                    <View style={styles.railItemCartBadge}>
                      <Ionicons name="bag" size={7} color="#ffffff" />
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        )}
      </View>

      {/* ── 4. Bottom Controls & Action Bar ───────────────────────────────── */}
      <View style={styles.bottomBar} pointerEvents="box-none">
        {/* Mode / Category Tag */}
        <View style={styles.modeTagWrap}>
          <View style={styles.modeTag}>
            <Text style={styles.modeTagText}>
              {activeTab === 'CART'
                ? `Mi Carrito (${cartItems.length})`
                : activeTab === 'CATALOG'
                ? `Catálogo Boutique (${catalogProducts.length})`
                : activeTab === 'TOP'
                ? 'Colección: Tops'
                : activeTab === 'OUTERWEAR'
                ? 'Colección: Abrigos'
                : 'Modelos AR'}
            </Text>
            <Text style={styles.modeTagTextAccent}> • Probador AR</Text>
          </View>
        </View>

        {/* Main Floating Dock */}
        <View style={styles.dockContainer}>
          {/* Category Switcher Tabs */}
          <View style={styles.categoryDock}>
            {/* Tab 1: Mi Carrito */}
            <TouchableOpacity
              style={[
                styles.categoryTab,
                activeTab === 'CART' && styles.categoryTabActive,
              ]}
              onPress={() => handleSelectTab('CART')}
              activeOpacity={0.8}
            >
              <Ionicons
                name="bag-handle-outline"
                size={20}
                color={activeTab === 'CART' ? '#38bdf8' : '#94a3b8'}
              />
              {cartItems.length > 0 && (
                <View style={styles.cartBadge}>
                  <Text style={styles.cartBadgeText}>{cartItems.length}</Text>
                </View>
              )}
            </TouchableOpacity>

            {/* Tab 2: Catálogo */}
            <TouchableOpacity
              style={[
                styles.categoryTab,
                activeTab === 'CATALOG' && styles.categoryTabActive,
              ]}
              onPress={() => handleSelectTab('CATALOG')}
              activeOpacity={0.8}
            >
              <Ionicons
                name="grid-outline"
                size={20}
                color={activeTab === 'CATALOG' ? '#38bdf8' : '#94a3b8'}
              />
            </TouchableOpacity>

            {/* Tab 3: Tops */}
            <TouchableOpacity
              style={[
                styles.categoryTab,
                activeTab === 'TOP' && styles.categoryTabActive,
              ]}
              onPress={() => handleSelectTab('TOP')}
              activeOpacity={0.8}
            >
              <Ionicons
                name="shirt-outline"
                size={20}
                color={activeTab === 'TOP' ? '#38bdf8' : '#94a3b8'}
              />
            </TouchableOpacity>

            {/* Tab 4: Abrigos */}
            <TouchableOpacity
              style={[
                styles.categoryTab,
                activeTab === 'OUTERWEAR' && styles.categoryTabActive,
              ]}
              onPress={() => handleSelectTab('OUTERWEAR')}
              activeOpacity={0.8}
            >
              <Ionicons
                name="color-wand-outline"
                size={20}
                color={activeTab === 'OUTERWEAR' ? '#38bdf8' : '#94a3b8'}
              />
            </TouchableOpacity>

            {/* Tab 5: Todos los Presets */}
            <TouchableOpacity
              style={[
                styles.categoryTab,
                activeTab === 'ALL' && styles.categoryTabActive,
              ]}
              onPress={() => handleSelectTab('ALL')}
              activeOpacity={0.8}
            >
              <Ionicons
                name="sparkles-outline"
                size={20}
                color={activeTab === 'ALL' ? '#38bdf8' : '#94a3b8'}
              />
            </TouchableOpacity>
          </View>

          {/* Action Buttons Column */}
          <View style={styles.actionColumn}>
            {/* Pause / Resume Button */}
            <TouchableOpacity
              onPress={onToggleActive}
              style={[
                styles.pillButton,
                isActive ? styles.pillButtonDefault : styles.pillButtonResume,
              ]}
              activeOpacity={0.85}
            >
              <Ionicons
                name={isActive ? 'pause' : 'play'}
                size={13}
                color="#ffffff"
              />
              <Text style={styles.pillButtonText}>
                {isActive ? 'Pausar' : 'Reanudar'}
              </Text>
            </TouchableOpacity>

            {/* Toggle Skeleton Button */}
            <TouchableOpacity
              onPress={onToggleSkeleton}
              style={[
                styles.pillButton,
                showSkeleton ? styles.pillButtonDefault : styles.pillButtonInactive,
              ]}
              activeOpacity={0.85}
            >
              <Text style={styles.pillButtonText}>
                {showSkeleton ? 'Ocultar Esqueleto' : 'Ver Esqueleto'}
              </Text>
            </TouchableOpacity>

            {/* Toggle Garment Button */}
            <TouchableOpacity
              onPress={onToggleGarment}
              style={[
                styles.pillButton,
                showGarment ? styles.pillButtonDefault : styles.pillButtonInactive,
              ]}
              activeOpacity={0.85}
            >
              <Text style={styles.pillButtonText}>
                {showGarment ? 'Prenda: ON' : 'Prenda: OFF'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'space-between',
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 8,
    zIndex: 10,
  },
  circleBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCenter: {
    alignItems: 'center',
    gap: 4,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 5,
    borderRadius: 20,
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  statusBadgeActive: {
    borderColor: 'rgba(74, 222, 128, 0.5)',
  },
  statusBadgePaused: {
    borderColor: 'rgba(248, 113, 113, 0.5)',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusDotActive: {
    backgroundColor: '#4ade80',
  },
  statusDotPaused: {
    backgroundColor: '#f87171',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '900',
    color: '#ffffff',
    letterSpacing: 0.8,
  },
  trackingSubBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 2,
    borderRadius: 12,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
  },
  trackingDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#34d399',
  },
  trackingText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#34d399',
    letterSpacing: 0.5,
  },

  // ── Top-Right Garment Card ──────────────────────────────────────
  topRightCardWrap: {
    position: 'absolute',
    top: 72,
    right: 16,
    zIndex: 9,
  },
  productCard: {
    width: 146,
    backgroundColor: 'rgba(15, 23, 42, 0.9)',
    borderRadius: 16,
    padding: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 6,
  },
  productImageWrap: {
    width: 86,
    height: 86,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
    overflow: 'hidden',
  },
  productImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
  },
  productName: {
    fontSize: 11,
    fontWeight: '700',
    color: '#ffffff',
    textAlign: 'center',
    lineHeight: 14,
    marginBottom: 2,
  },
  productPrice: {
    fontSize: 12,
    fontWeight: '900',
    color: '#38bdf8',
    marginBottom: 8,
  },
  cartButton: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    backgroundColor: '#ffffff',
    paddingVertical: 6,
    borderRadius: 14,
  },
  cartButtonSuccess: {
    backgroundColor: '#059669',
  },
  cartButtonText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#0f172a',
  },
  cartButtonTextSuccess: {
    color: '#ffffff',
  },

  // ── Right-Side Garment Selector Rail ───────────────────────────
  rightRailWrap: {
    position: 'absolute',
    top: 255,
    right: 16,
    zIndex: 9,
    maxHeight: 280,
  },
  railContent: {
    gap: 8,
  },
  railItem: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 3,
    overflow: 'hidden',
  },
  railItemSelected: {
    borderColor: '#38bdf8',
    backgroundColor: 'rgba(56, 189, 248, 0.25)',
    shadowColor: '#38bdf8',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.7,
    shadowRadius: 6,
    elevation: 4,
  },
  railImage: {
    width: 40,
    height: 40,
    borderRadius: 8,
  },
  railItemCartBadge: {
    position: 'absolute',
    top: 2,
    right: 2,
    backgroundColor: '#0284c7',
    borderRadius: 6,
    width: 12,
    height: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyCartCard: {
    width: 124,
    backgroundColor: 'rgba(15, 23, 42, 0.9)',
    borderRadius: 14,
    padding: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    alignItems: 'center',
    gap: 4,
  },
  emptyCartTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: '#ffffff',
    textAlign: 'center',
  },
  emptyCartSubtitle: {
    fontSize: 9,
    color: '#94a3b8',
    textAlign: 'center',
    lineHeight: 12,
  },

  // ── Bottom Dock ────────────────────────────────────────────────
  bottomBar: {
    paddingHorizontal: 16,
    paddingBottom: 24,
    zIndex: 10,
  },
  modeTagWrap: {
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  modeTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
  },
  modeTagText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#ffffff',
  },
  modeTagTextAccent: {
    fontSize: 11,
    fontWeight: '900',
    color: '#34d399',
  },
  dockContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  categoryDock: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(15, 23, 42, 0.88)',
    borderRadius: 24,
    paddingHorizontal: 6,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    gap: 3,
  },
  categoryTab: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  categoryTabActive: {
    backgroundColor: 'rgba(56, 189, 248, 0.22)',
  },
  cartBadge: {
    position: 'absolute',
    top: 2,
    right: 2,
    backgroundColor: '#ef4444',
    borderRadius: 7,
    minWidth: 14,
    height: 14,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 2,
  },
  cartBadgeText: {
    fontSize: 8,
    fontWeight: '900',
    color: '#ffffff',
  },
  actionColumn: {
    flex: 1,
    gap: 6,
  },
  pillButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 14,
    borderWidth: 1,
  },
  pillButtonDefault: {
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  pillButtonResume: {
    backgroundColor: '#0284c7',
    borderColor: '#38bdf8',
  },
  pillButtonInactive: {
    backgroundColor: 'rgba(15, 23, 42, 0.5)',
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  pillButtonText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#ffffff',
  },
});
