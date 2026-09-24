import React from 'react';
import { View, Text, TextInput, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Button } from '@/shared/ui/Button';
import { formatCurrency } from '@/shared/lib/utils';
import type { Promotion } from '@/entities/promotion/types';

interface CartSummaryProps {
  subtotalRegular: number;
  wholesaleSavings: number;
  promoDiscount: number;
  finalTotal: number;
  activePromotion: Promotion | null;
  couponCode: string;
  onCouponCodeChange: (code: string) => void;
  onApplyCoupon: () => void;
  onInitiateCheckout: () => void;
}

export const CartSummary: React.FC<CartSummaryProps> = ({
  subtotalRegular,
  wholesaleSavings,
  promoDiscount,
  finalTotal,
  activePromotion,
  couponCode,
  onCouponCodeChange,
  onApplyCoupon,
  onInitiateCheckout,
}) => {
  return (
    <View className="gap-4">
      {/* Tarjeta de Cupón Promocional */}
      <View
        style={styles.couponCard}
        className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm"
      >
        <Text style={styles.cardTitle} className="text-slate-900 font-bold text-sm mb-3">
          Cupón Promocional
        </Text>
        <View style={styles.couponInputRow} className="flex-row items-center gap-2">
          <TextInput
            style={styles.couponInput}
            className="flex-1 h-11 bg-slate-50 border border-slate-200 rounded-xl px-3 text-slate-800 font-semibold text-xs"
            placeholder="Ej. INVIERNO30"
            placeholderTextColor="#94a3b8"
            value={couponCode}
            onChangeText={(t) => onCouponCodeChange(t.toUpperCase())}
            autoCapitalize="characters"
          />
          <Button
            title="Aplicar"
            size="sm"
            variant="secondary"
            onPress={onApplyCoupon}
          />
        </View>

        {activePromotion && (
          <View
            style={styles.activePromoAlert}
            className="flex-row items-center bg-emerald-50 rounded-lg p-2 mt-2.5"
          >
            <Ionicons name="checkmark-circle" size={14} color="#059669" />
            <Text style={styles.activePromoText} className="text-emerald-700 text-xs font-semibold ml-1.5 flex-1">
              Cupón &ldquo;{activePromotion.code}&rdquo; aplicado ({activePromotion.discountPercent}% OFF)
            </Text>
          </View>
        )}
      </View>

      {/* Resumen de Compra */}
      <View
        style={styles.summaryCard}
        className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm"
      >
        <Text style={styles.cardTitle} className="text-slate-900 font-bold text-sm mb-3">
          Resumen del Pedido
        </Text>

        <View style={styles.summaryRow} className="flex-row justify-between py-1.5">
          <Text style={styles.summaryLabel} className="text-slate-500 text-sm">Subtotal regular</Text>
          <Text style={styles.summaryVal} className="text-slate-800 font-semibold text-sm">
            {formatCurrency(subtotalRegular)}
          </Text>
        </View>

        {wholesaleSavings > 0 && (
          <View style={styles.summaryRow} className="flex-row justify-between py-1.5">
            <Text style={[styles.summaryLabel, { color: '#059669' }]} className="text-emerald-600 text-sm font-medium">
              Ahorro venta por mayor
            </Text>
            <Text style={[styles.summaryVal, { color: '#059669' }]} className="text-emerald-600 font-bold text-sm">
              -{formatCurrency(wholesaleSavings)}
            </Text>
          </View>
        )}

        {promoDiscount > 0 && (
          <View style={styles.summaryRow} className="flex-row justify-between py-1.5">
            <Text style={[styles.summaryLabel, { color: '#4f46e5' }]} className="text-indigo-600 text-sm font-medium">
              Descuento cupón ({activePromotion?.code})
            </Text>
            <Text style={[styles.summaryVal, { color: '#4f46e5' }]} className="text-indigo-600 font-bold text-sm">
              -{formatCurrency(promoDiscount)}
            </Text>
          </View>
        )}

        <View
          style={styles.totalRow}
          className="flex-row justify-between items-center pt-3 mt-2 border-t border-slate-100"
        >
          <Text style={styles.totalLabel} className="text-slate-900 font-bold text-base">Total a Pagar</Text>
          <Text style={styles.totalVal} className="text-slate-900 font-black text-lg">
            {formatCurrency(finalTotal)}
          </Text>
        </View>
      </View>

      {/* Botón principal de checkout */}
      <Button
        title="Proceder al Pago / Reserva"
        size="lg"
        onPress={onInitiateCheckout}
        icon={<Ionicons name="card-outline" size={20} color="#ffffff" />}
        style={{ marginTop: 8 }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  couponCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 12,
  },
  couponInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  couponInput: {
    flex: 1,
    height: 44,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 10,
    paddingHorizontal: 12,
    fontSize: 13,
    fontWeight: '600',
    color: '#0f172a',
  },
  activePromoAlert: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ecfdf5',
    borderRadius: 8,
    padding: 8,
    marginTop: 10,
  },
  activePromoText: {
    fontSize: 12,
    color: '#047857',
    fontWeight: '600',
    marginLeft: 6,
    flex: 1,
  },
  summaryCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  summaryLabel: {
    fontSize: 13,
    color: '#64748b',
  },
  summaryVal: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1e293b',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    marginTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  totalLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0f172a',
  },
  totalVal: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0f172a',
  },
});
