import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  Modal,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  ActivityIndicator,
  Image,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Button } from '@/shared/ui/Button';
import { formatCurrency } from '@/shared/lib/utils';
import { apiClient } from '@/shared/api/api-client';
import { ENV } from '@/shared/config/env';

export interface Branch {
  id: string;
  name: string;
  address: string;
  city?: { name: string };
}

interface CartCheckoutModalProps {
  visible: boolean;
  branches: Branch[];
  selectedBranchId: string;
  onSelectBranchId: (id: string) => void;
  selectedMethod: 'QR' | 'CARD' | 'RESERVE';
  onSelectMethod: (method: 'QR' | 'CARD' | 'RESERVE') => void;
  finalTotal: number;
  isProcessing: boolean;
  onClose: () => void;
  onConfirm: (paymentRef?: { type: 'STRIPE' | 'QR'; ref: string }) => void;
}

// ─── Componente de formulario de tarjeta ───────────────────────────────────────
function CardPaymentForm({
  amount,
  onSuccess,
  onError,
}: {
  amount: number;
  onSuccess: (paymentIntentId: string) => void;
  onError: (msg: string) => void;
}) {
  const [cardNumber, setCardNumber] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvv, setCvv] = useState('');
  const [name, setName] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [paymentIntentId, setPaymentIntentId] = useState<string | null>(null);
  const [loadingIntent, setLoadingIntent] = useState(true);

  // Crear PaymentIntent al montar
  useEffect(() => {
    if (amount <= 0) return;
    setLoadingIntent(true);
    apiClient
      .post<{ clientSecret: string; paymentIntentId: string }>(
        '/payments/create-payment-intent',
        { amount, items: [] },
      )
      .then((res: any) => {
        setClientSecret(res.clientSecret);
        setPaymentIntentId(res.paymentIntentId);
      })
      .catch(() => onError('No se pudo inicializar el pago. Intenta nuevamente.'))
      .finally(() => setLoadingIntent(false));
  }, [amount]);

  // Formatear número de tarjeta con espacios cada 4 dígitos
  const handleCardNumber = (text: string) => {
    const cleaned = text.replace(/\D/g, '').substring(0, 16);
    const formatted = cleaned.match(/.{1,4}/g)?.join(' ') || cleaned;
    setCardNumber(formatted);
  };

  // Formatear expiración MM/AA
  const handleExpiry = (text: string) => {
    const cleaned = text.replace(/\D/g, '').substring(0, 4);
    if (cleaned.length >= 3) {
      setExpiry(`${cleaned.substring(0, 2)}/${cleaned.substring(2)}`);
    } else {
      setExpiry(cleaned);
    }
  };

  const handlePay = useCallback(async () => {
    if (!clientSecret) {
      onError('PaymentIntent no disponible. Reinicia el modal.');
      return;
    }

    const rawCard = cardNumber.replace(/\s/g, '');
    if (rawCard.length !== 16) {
      Alert.alert('Tarjeta inválida', 'Ingresa los 16 dígitos de tu tarjeta.');
      return;
    }
    const [expMonth, expYear] = expiry.split('/');
    if (!expMonth || !expYear || expMonth.length !== 2 || expYear.length !== 2) {
      Alert.alert('Fecha inválida', 'Ingresa la fecha en formato MM/AA.');
      return;
    }
    if (cvv.length < 3) {
      Alert.alert('CVV inválido', 'El CVV debe tener al menos 3 dígitos.');
      return;
    }

    setIsProcessing(true);
    try {
      // Paso 1: Tokenizar tarjeta directamente con la API Stripe (sin librería nativa)
      const tokenRes = await fetch('https://api.stripe.com/v1/tokens', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${ENV.STRIPE_PUBLISHABLE_KEY}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: [
          `card[number]=${rawCard}`,
          `card[exp_month]=${expMonth}`,
          `card[exp_year]=${expYear}`,
          `card[cvc]=${cvv}`,
          name ? `card[name]=${encodeURIComponent(name)}` : '',
        ]
          .filter(Boolean)
          .join('&'),
      });

      const tokenData = await tokenRes.json();
      if (tokenData.error) {
        onError(tokenData.error.message || 'Tarjeta rechazada. Verifica los datos.');
        return;
      }

      // Paso 2: Confirmar el PaymentIntent con el token
      const confirmRes = await fetch(
        `https://api.stripe.com/v1/payment_intents/${paymentIntentId}/confirm`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${ENV.STRIPE_PUBLISHABLE_KEY}`,
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: `payment_method_data[type]=card&payment_method_data[card][token]=${tokenData.id}`,
        },
      );

      const confirmData = await confirmRes.json();
      if (confirmData.error) {
        onError(confirmData.error.message || 'El pago fue rechazado.');
        return;
      }

      if (confirmData.status === 'succeeded') {
        onSuccess(confirmData.id);
      } else {
        onError(`Estado inesperado: ${confirmData.status}. Contacta soporte.`);
      }
    } catch (err: any) {
      onError(err.message || 'Error de conexión al procesar el pago.');
    } finally {
      setIsProcessing(false);
    }
  }, [clientSecret, paymentIntentId, cardNumber, expiry, cvv, name, onSuccess, onError]);

  if (loadingIntent) {
    return (
      <View style={styles.loadingBox}>
        <ActivityIndicator size="small" color="#4f46e5" />
        <Text style={styles.loadingText}>Inicializando pago seguro...</Text>
      </View>
    );
  }

  return (
    <View style={styles.cardFormBox}>
      {/* Nombre en tarjeta */}
      <View style={styles.cardInputRow}>
        <Ionicons name="person-outline" size={16} color="#64748b" />
        <TextInput
          style={styles.cardTextInput}
          placeholder="Nombre en la tarjeta"
          placeholderTextColor="#94a3b8"
          value={name}
          onChangeText={setName}
          autoCapitalize="words"
        />
      </View>

      {/* Número de tarjeta */}
      <View style={styles.cardInputRow}>
        <Ionicons name="card-outline" size={16} color="#64748b" />
        <TextInput
          style={styles.cardTextInput}
          placeholder="1234 5678 9012 3456"
          placeholderTextColor="#94a3b8"
          keyboardType="numeric"
          value={cardNumber}
          onChangeText={handleCardNumber}
          maxLength={19}
        />
      </View>

      {/* Expiración + CVV */}
      <View style={styles.cardDualRow}>
        <View style={[styles.cardInputRow, { flex: 1 }]}>
          <Ionicons name="calendar-outline" size={14} color="#64748b" />
          <TextInput
            style={[styles.cardTextInput, { marginLeft: 6 }]}
            placeholder="MM/AA"
            placeholderTextColor="#94a3b8"
            keyboardType="numeric"
            value={expiry}
            onChangeText={handleExpiry}
            maxLength={5}
          />
        </View>
        <View style={[styles.cardInputRow, { flex: 1 }]}>
          <Ionicons name="lock-closed-outline" size={14} color="#64748b" />
          <TextInput
            style={[styles.cardTextInput, { marginLeft: 6 }]}
            placeholder="CVV"
            placeholderTextColor="#94a3b8"
            keyboardType="numeric"
            secureTextEntry
            value={cvv}
            onChangeText={(t) => setCvv(t.replace(/\D/g, '').substring(0, 4))}
            maxLength={4}
          />
        </View>
      </View>

      <View style={styles.securityRow}>
        <Ionicons name="lock-closed" size={12} color="#059669" />
        <Text style={styles.securityText}>Pago procesado con Stripe · Encriptación SSL 256-bit</Text>
      </View>

      {/* Botón pagar */}
      <Button
        title={isProcessing ? 'Procesando...' : `Pagar ${formatCurrency(amount)}`}
        onPress={handlePay}
        loading={isProcessing}
        disabled={!clientSecret || isProcessing}
      />
    </View>
  );
}

// ─── Componente de pago QR ─────────────────────────────────────────────────────
function QrPaymentPanel({
  amount,
  onConfirm,
}: {
  amount: number;
  onConfirm: (ref: string) => void;
}) {
  const [qrData, setQrData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [timeLeft, setTimeLeft] = useState(15 * 60);
  const [isExpired, setIsExpired] = useState(false);

  const generateQr = async () => {
    setIsLoading(true);
    setIsExpired(false);
    setTimeLeft(15 * 60);
    try {
      const res = await apiClient.post<any>('/payments/create-qr', {
        amount,
        currency: 'BOB',
        description: 'Pago FashionStore Boutique',
      });
      setQrData(res);
    } catch {
      Alert.alert('Error', 'No se pudo generar el QR. Intenta nuevamente.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    generateQr();
  }, [amount]);

  useEffect(() => {
    if (!qrData || isExpired) return;
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setIsExpired(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [qrData, isExpired]);

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;

  if (isLoading) {
    return (
      <View style={styles.loadingBox}>
        <ActivityIndicator size="small" color="#4f46e5" />
        <Text style={styles.loadingText}>Generando código QR...</Text>
      </View>
    );
  }

  if (isExpired) {
    return (
      <View style={styles.qrPreviewBox}>
        <Ionicons name="time-outline" size={48} color="#ef4444" />
        <Text style={[styles.qrAmountText, { color: '#ef4444', fontSize: 14 }]}>
          QR Expirado
        </Text>
        <TouchableOpacity
          onPress={generateQr}
          style={styles.refreshBtn}
        >
          <Ionicons name="refresh-outline" size={16} color="#4f46e5" />
          <Text style={styles.refreshBtnText}>Generar Nuevo QR</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const qrString = qrData?.qrString || `fashionstore|${amount}|BOB`;
  const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(qrString)}`;

  return (
    <View style={styles.qrPreviewBox}>
      {/* Imagen QR */}
      <View style={styles.qrImageWrapper}>
        <Image
          source={{ uri: qrImageUrl }}
          style={styles.qrImage}
          resizeMode="contain"
        />
      </View>

      <Text style={styles.qrAmountText}>{formatCurrency(amount)}</Text>
      <Text style={styles.qrHint}>
        Ref: {qrData?.transactionRef?.substring(0, 14)}
      </Text>

      {/* Contador */}
      <View
        style={[
          styles.timerBadge,
          timeLeft < 120 && styles.timerBadgeUrgent,
        ]}
      >
        <Ionicons
          name="time-outline"
          size={12}
          color={timeLeft < 120 ? '#ef4444' : '#64748b'}
        />
        <Text
          style={[
            styles.timerText,
            timeLeft < 120 && { color: '#ef4444' },
          ]}
        >
          {minutes}:{String(seconds).padStart(2, '0')}
        </Text>
      </View>

      <Text style={styles.qrInstructions}>
        Abre tu app bancaria → "Pagar con QR" → escanea el código
      </Text>

      <Button
        title={`Ya Pagué con QR`}
        onPress={() => onConfirm(qrData?.transactionRef || `QR-${Date.now()}`)}
        style={{ marginTop: 8, width: '100%' }}
      />
    </View>
  );
}

// ─── Modal principal de checkout ───────────────────────────────────────────────
export const CartCheckoutModal: React.FC<CartCheckoutModalProps> = ({
  visible,
  branches,
  selectedBranchId,
  onSelectBranchId,
  selectedMethod,
  onSelectMethod,
  finalTotal,
  isProcessing,
  onClose,
  onConfirm,
}) => {
  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          {/* Header */}
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Opciones de Checkout</Text>
            <TouchableOpacity onPress={onClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Ionicons name="close" size={22} color="#0f172a" />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
            {/* Selector de Sucursal */}
            <View style={styles.modalBranchSection}>
              <Text style={styles.modalSectionLabel}>Sucursal para Retiro o Probador:</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.branchChipsScroll}
              >
                {branches.map((b) => {
                  const isSelected = selectedBranchId === b.id;
                  return (
                    <TouchableOpacity
                      key={b.id}
                      style={[styles.branchChip, isSelected && styles.branchChipActive]}
                      onPress={() => onSelectBranchId(b.id)}
                    >
                      <Ionicons
                        name="storefront-outline"
                        size={13}
                        color={isSelected ? '#ffffff' : '#0f172a'}
                      />
                      <Text
                        style={[styles.branchChipText, isSelected && styles.branchChipTextActive]}
                      >
                        {b.name}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>

            {/* Opciones de método */}
            <View style={styles.methodsList}>
              {/* QR */}
              <TouchableOpacity
                style={[styles.methodCard, selectedMethod === 'QR' && styles.methodCardActive]}
                onPress={() => onSelectMethod('QR')}
              >
                <View style={styles.methodIconBox}>
                  <Ionicons name="qr-code-outline" size={22} color="#0f172a" />
                </View>
                <View style={styles.methodInfo}>
                  <Text style={styles.methodName}>Pago Móvil QR</Text>
                  <Text style={styles.methodDesc}>Interoperable con cualquier app bancaria</Text>
                </View>
                {selectedMethod === 'QR' && (
                  <Ionicons name="checkmark-circle" size={20} color="#059669" />
                )}
              </TouchableOpacity>

              {/* Tarjeta */}
              <TouchableOpacity
                style={[styles.methodCard, selectedMethod === 'CARD' && styles.methodCardActive]}
                onPress={() => onSelectMethod('CARD')}
              >
                <View style={styles.methodIconBox}>
                  <Ionicons name="card-outline" size={22} color="#0f172a" />
                </View>
                <View style={styles.methodInfo}>
                  <Text style={styles.methodName}>Tarjeta Débito / Crédito</Text>
                  <Text style={styles.methodDesc}>Stripe · Visa, Mastercard</Text>
                </View>
                {selectedMethod === 'CARD' && (
                  <Ionicons name="checkmark-circle" size={20} color="#059669" />
                )}
              </TouchableOpacity>

              {/* Reserva en tienda */}
              <TouchableOpacity
                style={[styles.methodCard, selectedMethod === 'RESERVE' && styles.methodCardActive]}
                onPress={() => onSelectMethod('RESERVE')}
              >
                <View style={styles.methodIconBox}>
                  <Ionicons name="storefront-outline" size={22} color="#0f172a" />
                </View>
                <View style={styles.methodInfo}>
                  <Text style={styles.methodName}>Reservar para Probar en Tienda</Text>
                  <Text style={styles.methodDesc}>Te las apartamos 48 hrs · Pagas en caja</Text>
                </View>
                {selectedMethod === 'RESERVE' && (
                  <Ionicons name="checkmark-circle" size={20} color="#059669" />
                )}
              </TouchableOpacity>
            </View>

            {/* Panel de QR (en-app, sin redirección) */}
            {selectedMethod === 'QR' && (
              <QrPaymentPanel
                amount={finalTotal}
                onConfirm={(ref) => onConfirm({ type: 'QR', ref })}
              />
            )}

            {/* Formulario de tarjeta Stripe (en-app, sin WebView, sin redirección) */}
            {selectedMethod === 'CARD' && (
              <CardPaymentForm
                amount={finalTotal}
                onSuccess={(paymentIntentId) =>
                  onConfirm({ type: 'STRIPE', ref: paymentIntentId })
                }
                onError={(msg) => Alert.alert('Error de pago', msg)}
              />
            )}

            {/* Info de reserva en tienda */}
            {selectedMethod === 'RESERVE' && (
              <View style={styles.reserveInfoBox}>
                <Ionicons name="shield-checkmark-outline" size={20} color="#0284c7" />
                <View style={{ flex: 1 }}>
                  <Text style={styles.reserveInfoTitle}>Retención por 48 horas en tienda</Text>
                  <Text style={styles.reserveInfoDesc}>
                    Tus prendas se apartarán en el probador. No requieres pagar por adelantado.
                  </Text>
                </View>
              </View>
            )}

            {/* Botón de reserva (solo para RESERVE) */}
            {selectedMethod === 'RESERVE' && (
              <Button
                title={isProcessing ? 'Procesando...' : 'Confirmar Reserva en Tienda'}
                onPress={() => onConfirm()}
                loading={isProcessing}
                style={{ marginTop: 6, marginBottom: 8 }}
              />
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    maxHeight: '92%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0f172a',
  },
  modalBranchSection: {
    marginBottom: 16,
  },
  modalSectionLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
    marginBottom: 8,
  },
  branchChipsScroll: {
    gap: 8,
    paddingRight: 8,
  },
  branchChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: '#f1f5f9',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    gap: 6,
  },
  branchChipActive: {
    backgroundColor: '#0f172a',
    borderColor: '#0f172a',
  },
  branchChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#334155',
  },
  branchChipTextActive: {
    color: '#ffffff',
  },
  methodsList: {
    gap: 10,
    marginBottom: 16,
  },
  methodCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    backgroundColor: '#f8fafc',
  },
  methodCardActive: {
    borderColor: '#4f46e5',
    backgroundColor: '#eef2ff',
  },
  methodIconBox: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  methodInfo: {
    flex: 1,
    marginLeft: 12,
  },
  methodName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0f172a',
  },
  methodDesc: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 2,
  },
  // QR
  qrPreviewBox: {
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    gap: 8,
  },
  qrImageWrapper: {
    padding: 8,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  qrImage: {
    width: 160,
    height: 160,
  },
  qrAmountText: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0f172a',
  },
  qrHint: {
    fontSize: 10,
    color: '#64748b',
    textAlign: 'center',
    fontFamily: 'monospace',
  },
  qrInstructions: {
    fontSize: 11,
    color: '#475569',
    textAlign: 'center',
    marginTop: 4,
  },
  timerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    backgroundColor: '#f1f5f9',
  },
  timerBadgeUrgent: {
    backgroundColor: '#fef2f2',
  },
  timerText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748b',
    fontFamily: 'monospace',
  },
  refreshBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#4f46e5',
    marginTop: 8,
  },
  refreshBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#4f46e5',
  },
  // Card form
  cardFormBox: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 14,
    padding: 14,
    gap: 10,
    marginBottom: 16,
  },
  cardInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 44,
    gap: 8,
  },
  cardDualRow: {
    flexDirection: 'row',
    gap: 8,
  },
  cardTextInput: {
    flex: 1,
    fontSize: 13,
    color: '#0f172a',
    fontWeight: '500',
  },
  securityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  securityText: {
    fontSize: 10,
    color: '#059669',
    fontWeight: '500',
  },
  // Reserva
  reserveInfoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#f0f9ff',
    borderWidth: 1,
    borderColor: '#bae6fd',
    borderRadius: 14,
    padding: 14,
    gap: 12,
    marginBottom: 12,
  },
  reserveInfoTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0369a1',
  },
  reserveInfoDesc: {
    fontSize: 11,
    color: '#0284c7',
    marginTop: 4,
    lineHeight: 16,
  },
  // Loading
  loadingBox: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    gap: 8,
  },
  loadingText: {
    fontSize: 12,
    color: '#64748b',
  },
});
