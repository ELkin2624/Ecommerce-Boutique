import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { ProductImage } from '@/shared/ui/ProductImage';
import { formatCurrency } from '@/shared/lib/utils';
import type { CartItem } from '@/features/cart/model/cart.types';

interface CartItemListProps {
  items: CartItem[];
  wholesaleSavings: number;
  onUpdateQuantity: (variantId: string, quantity: number) => void;
  onRemoveItem: (variantId: string) => void;
}

export const CartItemList: React.FC<CartItemListProps> = ({
  items,
  wholesaleSavings,
  onUpdateQuantity,
  onRemoveItem,
}) => {
  return (
    <View className="mb-4">
      {/* Banner de Ahorro Mayorista si aplica */}
      {wholesaleSavings > 0 && (
        <View
          style={styles.wholesaleAlert}
          className="flex-row items-center bg-emerald-50 border border-emerald-200 rounded-xl p-3 mb-4"
        >
          <Ionicons name="pricetag" size={16} color="#059669" />
          <Text
            style={styles.wholesaleAlertText}
            className="text-emerald-700 font-semibold text-xs ml-2 flex-1"
          >
            ¡Descuento por mayor aplicado! Ahorraste {formatCurrency(wholesaleSavings)}
          </Text>
        </View>
      )}

      {/* Lista de Prendas en el Carrito */}
      <View style={styles.itemsList} className="gap-3">
        {items.map((item) => {
          const minUnits = item.wholesaleMinUnits || 6;
          const isWholesaleActive =
            item.wholesalePrice !== null &&
            item.wholesalePrice !== undefined &&
            item.quantity >= minUnits;

          const unitPrice = isWholesaleActive ? item.wholesalePrice! : item.price;
          const hasStockIssue =
            item.availableStock !== undefined &&
            item.availableStock !== null &&
            item.quantity > item.availableStock;

          return (
            <View
              key={item.variantId}
              style={styles.itemRow}
              className="flex-row bg-white rounded-2xl p-3.5 border border-slate-100 items-center shadow-sm"
            >
              <ProductImage
                uri={item.image}
                style={styles.itemImage}
                showText={false}
                iconSize={24}
              />

              <View style={styles.itemInfo} className="flex-1 ml-3.5">
                <Text
                  style={styles.itemTitle}
                  className="text-slate-900 font-semibold text-sm"
                  numberOfLines={1}
                >
                  {item.productName}
                </Text>

                <Text style={styles.itemSpecs} className="text-slate-500 text-xs mt-0.5">
                  Talla: <Text style={styles.bold}>{item.size}</Text> • Color:{' '}
                  <Text style={styles.bold}>{item.color}</Text>
                </Text>

                {/* Advertencia de stock si la cantidad supera el inventario disponible */}
                {hasStockIssue && (
                  <View className="flex-row items-center mt-1">
                    <Ionicons name="alert-circle" size={13} color="#e11d48" />
                    <Text className="text-rose-600 text-xs font-medium ml-1">
                      {item.availableStock === 0
                        ? 'Agotado temporalmente'
                        : `Solo quedan ${item.availableStock} disponibles`}
                    </Text>
                  </View>
                )}

                <View style={styles.itemPriceRow} className="flex-row items-center mt-2 flex-wrap gap-1.5">
                  <Text style={styles.itemPrice} className="text-slate-900 font-bold text-sm">
                    {formatCurrency(unitPrice * item.quantity)}
                  </Text>
                  {item.quantity > 1 && (
                    <Text style={styles.unitPriceDetail} className="text-slate-400 text-xs">
                      ({formatCurrency(unitPrice)} c/u)
                    </Text>
                  )}
                  {isWholesaleActive && (
                    <View
                      style={styles.wholesalePill}
                      className="bg-emerald-100 rounded-full px-2 py-0.5"
                    >
                      <Text
                        style={styles.wholesalePillText}
                        className="text-emerald-800 text-[10px] font-bold"
                      >
                        Tarifa Mayorista
                      </Text>
                    </View>
                  )}
                </View>

                {/* Selector de cantidad y acción rápida Probar en AR */}
                <View style={styles.qtyRow} className="flex-row items-center justify-between mt-3">
                  <View
                    style={styles.qtyControl}
                    className="flex-row items-center bg-slate-50 border border-slate-200 rounded-xl"
                  >
                    <TouchableOpacity
                      style={styles.qtyBtn}
                      onPress={() => onUpdateQuantity(item.variantId, item.quantity - 1)}
                      hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                      activeOpacity={0.7}
                    >
                      <Ionicons name="remove" size={18} color="#0f172a" />
                    </TouchableOpacity>

                    <Text style={styles.qtyValue} className="px-3 text-slate-900 font-bold text-sm">
                      {item.quantity}
                    </Text>

                    <TouchableOpacity
                      style={styles.qtyBtn}
                      onPress={() => onUpdateQuantity(item.variantId, item.quantity + 1)}
                      hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                      activeOpacity={0.7}
                    >
                      <Ionicons name="add" size={18} color="#0f172a" />
                    </TouchableOpacity>
                  </View>

                  <View style={styles.rightActionsRow}>
                    <TouchableOpacity
                      style={styles.tryOnCartBtn}
                      onPress={() => {
                        router.push({
                          pathname: '/virtual-try-on',
                          params: { garmentId: item.variantId || item.productId },
                        } as any);
                      }}
                      activeOpacity={0.8}
                    >
                      <Ionicons name="sparkles" size={12} color="#4f46e5" />
                      <Text style={styles.tryOnCartBtnText}>Probar AR</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      onPress={() => onRemoveItem(item.variantId)}
                      style={styles.trashBtn}
                      className="p-2 bg-rose-50 rounded-xl"
                      hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                      activeOpacity={0.7}
                    >
                      <Ionicons name="trash-outline" size={18} color="#ef4444" />
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            </View>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  wholesaleAlert: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ecfdf5',
    borderColor: '#a7f3d0',
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  wholesaleAlertText: {
    color: '#047857',
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 8,
    flex: 1,
  },
  itemsList: {
    gap: 12,
  },
  itemRow: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  itemImage: {
    width: 80,
    height: 96,
    borderRadius: 10,
    backgroundColor: '#f8fafc',
  },
  itemInfo: {
    flex: 1,
    marginLeft: 14,
  },
  itemTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0f172a',
  },
  itemSpecs: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
  },
  bold: {
    fontWeight: '700',
    color: '#334155',
  },
  itemPriceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    flexWrap: 'wrap',
    gap: 6,
  },
  itemPrice: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0f172a',
  },
  unitPriceDetail: {
    fontSize: 12,
    color: '#94a3b8',
  },
  wholesalePill: {
    backgroundColor: '#d1fae5',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  wholesalePillText: {
    color: '#065f46',
    fontSize: 10,
    fontWeight: '700',
  },
  qtyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 12,
  },
  qtyControl: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  qtyBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qtyValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0f172a',
    paddingHorizontal: 8,
    minWidth: 28,
    textAlign: 'center',
  },
  trashBtn: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#fef2f2',
  },
  rightActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  tryOnCartBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#eef2ff',
    paddingHorizontal: 9,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#c7d2fe',
  },
  tryOnCartBtnText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#4338ca',
  },
});
