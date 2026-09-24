import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import type { Product } from '../types';
import { formatCurrency } from '@/shared/lib/utils';
import { Badge } from '@/shared/ui/Badge';
import { ProductImage } from '@/shared/ui/ProductImage';
import { matchGarmentForProduct } from '@/features/virtual-try-on/garment/utils/garmentMatcher';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - 44) / 2;

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  const coverUri =
    product.coverImage ||
    product.images?.[0]?.imageUrl ||
    product.variants?.[0]?.measurementsJson?.image;

  const defaultVariant = product.variants?.[0];
  const price = defaultVariant ? defaultVariant.price : product.priceRange?.min || 0;
  const wholesalePrice = defaultVariant?.wholesalePrice;
  const minUnits = defaultVariant?.wholesaleMinUnits || 6;
  const totalStock =
    (product as any).availableStock !== undefined
      ? (product as any).availableStock
      : product.variants?.reduce(
          (acc, v) => acc + (v.stocks?.reduce((sAcc, s) => sAcc + s.quantity, 0) || 0),
          0,
        ) || 0;

  // Extraer colores únicos
  const uniqueColors = Array.from(
    new Set(
      product.variants
        ?.map((v) => v.measurementsJson?.colorHex)
        .filter((hex): hex is string => Boolean(hex)),
    ),
  ).slice(0, 4);

  return (
    <TouchableOpacity
      style={styles.card}
      className="bg-white rounded-2xl border border-slate-100 overflow-hidden mb-3.5 shadow-sm"
      activeOpacity={0.88}
      onPress={() => router.push(`/product/${product.id}` as any)}
    >
      {/* Contenedor de Imagen */}
      <View style={styles.imageContainer} className="w-full bg-slate-50 relative">
        <ProductImage
          uri={coverUri}
          style={styles.image}
          resizeMode="cover"
          productName={product.name}
        />
        {/* Botón flotante Probar en Probador Virtual AR */}
        <TouchableOpacity
          style={styles.tryOnButton}
          onPress={(e) => {
            e.stopPropagation();
            router.push({
              pathname: '/virtual-try-on',
              params: { garmentId: product.id },
            } as any);
          }}
          activeOpacity={0.82}
        >
          <Ionicons name="sparkles" size={11} color="#ffffff" />
          <Text style={styles.tryOnButtonText}>Probar</Text>
        </TouchableOpacity>

        {totalStock === 0 && (
          <View style={styles.outOfStockBadge} className="absolute top-2 left-2 bg-slate-900/85 px-2 py-0.5 rounded-md">
            <Text style={styles.outOfStockText} className="text-red-400 text-[9px] font-black tracking-wider">AGOTADO</Text>
          </View>
        )}
        {totalStock > 0 && totalStock <= 3 && (
          <View style={styles.lowStockBadge} className="absolute top-2 left-2 bg-amber-500 px-1.5 py-0.5 rounded-md">
            <Text style={styles.lowStockText} className="text-white text-[8px] font-black tracking-wider">¡ÚLTIMAS {totalStock} UDS!</Text>
          </View>
        )}
        {wholesalePrice && totalStock > 0 && (
          <View style={styles.wholesaleBadge} className="absolute bottom-2 left-2 bg-emerald-600 px-1.5 py-0.5 rounded-md">
            <Text style={styles.wholesaleBadgeText} className="text-white text-[8px] font-black tracking-wider">VENTA MAYORISTA</Text>
          </View>
        )}
      </View>

      {/* Contenido de texto */}
      <View style={styles.content} className="p-2.5">
        <Text style={styles.brand} className="text-[9px] font-extrabold text-slate-400 tracking-wider mb-0.5" numberOfLines={1}>
          {product.brand?.toUpperCase() || 'BOUTIQUE'}
        </Text>

        <Text style={styles.name} className="text-[13px] font-bold text-slate-900 leading-[17px] min-h-[34px]" numberOfLines={2}>
          {product.name}
        </Text>

        {/* Color swatches previews */}
        {uniqueColors.length > 0 && (
          <View style={styles.colorsRow} className="flex-row items-center gap-1 my-1.5">
            {uniqueColors.map((hex, idx) => (
              <View
                key={`${hex}-${idx}`}
                style={[styles.colorDot, { backgroundColor: hex }]}
                className="w-2.5 h-2.5 rounded-full border border-black/10"
              />
            ))}
            {product.variants?.length > 4 && (
              <Text style={styles.moreColorsText} className="text-[9px] text-slate-400 font-semibold">
                +{product.variants.length - 4}
              </Text>
            )}
          </View>
        )}

        {/* Precio menor */}
        <View style={styles.priceContainer} className="flex-row items-baseline mt-0.5">
          <Text style={styles.price} className="text-sm font-black text-slate-900">{formatCurrency(price)}</Text>
        </View>

        {/* Precio por mayor si está habilitado */}
        {wholesalePrice && (
          <View style={styles.wholesaleRow} className="flex-row items-center gap-1 mt-1">
            <Ionicons name="pricetag" size={11} color="#059669" />
            <Text style={styles.wholesaleText} className="text-[10px] font-bold text-emerald-600">
              Mayor: {formatCurrency(wholesalePrice)} (≥{minUnits}u)
            </Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    width: CARD_WIDTH,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    overflow: 'hidden',
    marginBottom: 14,
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1.5,
  },
  imageContainer: {
    width: '100%',
    height: CARD_WIDTH * 1.25,
    backgroundColor: '#f8fafc',
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  tryOnButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#0f172a',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 7,
    paddingVertical: 3.5,
    borderRadius: 7,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.25,
    shadowRadius: 2,
    elevation: 3,
    zIndex: 10,
  },
  tryOnButtonText: {
    color: '#ffffff',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  wholesaleBadge: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    backgroundColor: '#059669',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 6,
  },
  wholesaleBadgeText: {
    color: '#ffffff',
    fontSize: 8,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  outOfStockBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  outOfStockText: {
    color: '#f87171',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  lowStockBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: '#f59e0b',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 6,
  },
  lowStockText: {
    color: '#ffffff',
    fontSize: 8,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  content: {
    padding: 10,
  },
  brand: {
    fontSize: 9,
    fontWeight: '800',
    color: '#94a3b8',
    letterSpacing: 0.8,
    marginBottom: 2,
  },
  name: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0f172a',
    lineHeight: 17,
    minHeight: 34,
  },
  colorsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginVertical: 6,
  },
  colorDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)',
  },
  moreColorsText: {
    fontSize: 9,
    color: '#94a3b8',
    fontWeight: '600',
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginTop: 2,
  },
  price: {
    fontSize: 14,
    fontWeight: '900',
    color: '#0f172a',
  },
  wholesaleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  wholesaleText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#059669',
  },
});
