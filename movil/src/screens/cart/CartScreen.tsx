import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, StatusBar, Alert, StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Header } from '@/shared/ui/Header';
import { Button } from '@/shared/ui/Button';
import { formatCurrency } from '@/shared/lib/utils';
import { useCartStore } from '@/features/cart/model/useCartStore';
import { apiClient } from '@/shared/api/api-client';
import { useAuth } from '@/features/auth/hooks/use-auth';
import { CartItemList } from '@/widgets/cart/CartItemList';
import { CartSummary } from '@/widgets/cart/CartSummary';
import { CartCheckoutModal, Branch } from '@/widgets/cart/CartCheckoutModal';

export const CartScreen: React.FC = () => {
  const {
    items,
    totalCount,
    subtotalRegular,
    subtotal,
    wholesaleSavings,
    promoDiscount,
    finalTotal,
    activePromotion,
    updateQuantity,
    removeItem,
    clearCart,
    applyPromotion,
  } = useCartStore();

  const { isAuthenticated } = useAuth();

  const [couponCode, setCouponCode] = useState('');
  const [branches, setBranches] = useState<Branch[]>([]);
  const [selectedBranchId, setSelectedBranchId] = useState('');
  const [paymentModalVisible, setPaymentModalVisible] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState<'QR' | 'CARD' | 'RESERVE'>('QR');
  const [isProcessing, setIsProcessing] = useState(false);

  // Cargar sucursales reales de la base de datos
  useEffect(() => {
    apiClient
      .get<Branch[]>('/branches')
      .then((data) => {
        if (data && data.length > 0) {
          setBranches(data);
          setSelectedBranchId(data[0].id);
        }
      })
      .catch(() => {});
  }, []);

  // Iniciar checkout con validaciones de autenticación y stock
  const handleInitiateCheckout = () => {
    if (!isAuthenticated) {
      Alert.alert(
        'Inicia sesión',
        'Necesitas iniciar sesión para completar tu compra o hacer una reserva.',
        [
          { text: 'Cancelar', style: 'cancel' },
          { text: 'Iniciar Sesión', onPress: () => router.push('/(auth)/login' as any) },
        ]
      );
      return;
    }

    // Validación empresarial de stock: verificar si alguna prenda no tiene stock suficiente
    const outOfStockItems = items.filter(
      (it) => it.availableStock !== undefined && it.availableStock !== null && it.quantity > it.availableStock
    );

    if (outOfStockItems.length > 0) {
      const names = outOfStockItems.map((it) => `• ${it.productName} (${it.size})`).join('\n');
      Alert.alert(
        'Ajuste de Stock Requerido',
        `Las siguientes prendas superan el stock disponible en tienda:\n\n${names}\n\nPor favor reduce la cantidad para continuar.`,
        [{ text: 'Entendido' }]
      );
      return;
    }

    setPaymentModalVisible(true);
  };

  // Intentar aplicar código de cupón
  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return;
    try {
      const promos = await apiClient.get<any[]>('/promotions', { activeOnly: true });
      const found = promos.find(
        (p) => p.code.toUpperCase() === couponCode.trim().toUpperCase()
      );
      if (found) {
        applyPromotion(found);
        Alert.alert('¡Cupón Aplicado!', `Descuento de ${found.discountPercent}% otorgado.`);
      } else {
        Alert.alert('Cupón no válido', 'El código ingresado no existe o expiró.');
      }
    } catch {
      Alert.alert('Error', 'No se pudo validar el cupón en este momento.');
    }
  };

  // Procesar orden / reserva
  const handleProcessOrder = async () => {
    if (!selectedBranchId) {
      Alert.alert('Selecciona una sucursal', 'Por favor selecciona la sucursal de entrega o retiro.');
      return;
    }

    try {
      setIsProcessing(true);

      // Si es reserva para probarse en tienda
      if (selectedMethod === 'RESERVE') {
        const payload = {
          branchId: selectedBranchId,
          items: items.map((it) => ({
            variantId: it.variantId,
            quantity: it.quantity,
          })),
          notes: 'Reserva para probador físico desde Bolsa de Compras',
        };

        const res = await apiClient.post<any>('/reservations', payload);
        const branchName =
          branches.find((b) => b.id === selectedBranchId)?.name || 'la Sucursal';

        await clearCart(isAuthenticated);
        setPaymentModalVisible(false);

        Alert.alert(
          '¡Prendas Reservadas en Tienda!',
          `Tus ${totalCount} prendas fueron reservadas con éxito en ${branchName}.\n\nCódigo de reserva: ${res?.id?.substring(0, 8) || 'Confirmada'}.\nTienes 48 horas para probártelas en tienda.`,
          [
            {
              text: 'Ver en Mis Reservas',
              onPress: () => router.push('/profile' as any),
            },
            { text: 'Aceptar' },
          ]
        );
        return;
      }

      // Si es compra digital (QR o Tarjeta)
      const payload = {
        branchId: selectedBranchId,
        type: 'ONLINE',
        paymentMethod: selectedMethod === 'QR' ? 'QR' : 'CARD',
        idempotencyKey: `mobile-${Date.now()}-${Math.random().toString(36).substring(7)}`,
        items: items.map((it) => ({
          variantId: it.variantId,
          quantity: it.quantity,
        })),
      };

      const order = await apiClient.post<any>('/orders/checkout', payload);

      await clearCart(isAuthenticated);
      setPaymentModalVisible(false);

      Alert.alert(
        '¡Pago Confirmado con Éxito!',
        `Tu pedido por un total de ${formatCurrency(finalTotal)} fue registrado exitosamente.\n\nCódigo de orden: ${order?.id?.substring(0, 8) || 'Generado'}.\nMétodo: ${
          selectedMethod === 'QR' ? 'Pago Móvil QR Simple' : 'Tarjeta de Crédito / Débito'
        }. Recibirás un correo con el comprobante digital.`,
        [
          {
            text: 'Ver en Mis Compras',
            onPress: () => router.push('/profile' as any),
          },
          { text: 'Aceptar' },
        ]
      );
    } catch (err: any) {
      Alert.alert('Error en checkout', err.message || 'No se pudo completar la operación');
    } finally {
      setIsProcessing(false);
    }
  };

  if (items.length === 0) {
    return (
      <SafeAreaView style={styles.safeArea} className="flex-1 bg-white">
        <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
        <Header title="BOLSA DE COMPRAS" subtitle="0 prendas" />
        <View style={styles.emptyContainer} className="flex-1 items-center justify-center p-6 -mt-10">
          <Ionicons name="bag-handle-outline" size={64} color="#cbd5e1" />
          <Text style={styles.emptyTitle} className="text-slate-900 font-bold text-lg mt-4 mb-2">
            Tu bolsa está vacía
          </Text>
          <Text style={styles.emptySubtitle} className="text-slate-500 text-sm text-center leading-relaxed max-w-[280px]">
            Explora las novedades o usa el Probador Virtual para encontrar prendas a tu medida.
          </Text>
          <Button
            title="Explorar Catálogo"
            onPress={() => router.push('/catalog' as any)}
            style={{ marginTop: 20 }}
          />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} className="flex-1 bg-slate-50">
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      <Header title="BOLSA DE COMPRAS" subtitle={`${totalCount} prendas`} />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <CartItemList
          items={items}
          wholesaleSavings={wholesaleSavings}
          onUpdateQuantity={(id, q) => updateQuantity(id, q, isAuthenticated)}
          onRemoveItem={(id) => removeItem(id, isAuthenticated)}
        />

        <CartSummary
          subtotalRegular={subtotalRegular}
          wholesaleSavings={wholesaleSavings}
          promoDiscount={promoDiscount}
          finalTotal={finalTotal}
          activePromotion={activePromotion}
          couponCode={couponCode}
          onCouponCodeChange={setCouponCode}
          onApplyCoupon={handleApplyCoupon}
          onInitiateCheckout={handleInitiateCheckout}
        />
      </ScrollView>

      <CartCheckoutModal
        visible={paymentModalVisible}
        branches={branches}
        selectedBranchId={selectedBranchId}
        onSelectBranchId={setSelectedBranchId}
        selectedMethod={selectedMethod}
        onSelectMethod={setSelectedMethod}
        finalTotal={finalTotal}
        isProcessing={isProcessing}
        onClose={() => setPaymentModalVisible(false)}
        onConfirm={handleProcessOrder}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    marginTop: -40,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0f172a',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 20,
    maxWidth: 280,
  },
});
