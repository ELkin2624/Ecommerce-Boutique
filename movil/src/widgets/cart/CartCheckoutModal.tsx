import React from 'react';
import {
  View, Text, Modal, ScrollView, TouchableOpacity, TextInput, StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Button } from '@/shared/ui/Button';
import { formatCurrency } from '@/shared/lib/utils';

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
  onConfirm: () => void;
}

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
      <View style={styles.modalOverlay} className="flex-1 bg-black/50 justify-end">
        <View
          style={styles.modalContent}
          className="bg-white rounded-t-3xl p-6 border-t border-slate-100 max-h-[88%]"
        >
          <View style={styles.modalHeader} className="flex-row justify-between items-center mb-4">
            <Text style={styles.modalTitle} className="text-slate-900 font-bold text-lg">
              Opciones de Checkout
            </Text>
            <TouchableOpacity onPress={onClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Ionicons name="close" size={22} color="#0f172a" />
            </TouchableOpacity>
          </View>

          {/* Selector de Sucursal Física Real de la Base de Datos */}
          <View style={styles.modalBranchSection} className="mb-4">
            <Text style={styles.modalSectionLabel} className="text-slate-700 font-semibold text-xs mb-2">
              Sucursal para Retiro o Probador:
            </Text>
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
                    style={[
                      styles.branchChip,
                      isSelected && styles.branchChipActive,
                    ]}
                    className={`flex-row items-center px-3 py-2 rounded-xl border mr-2 ${
                      isSelected
                        ? 'bg-slate-900 border-slate-900'
                        : 'bg-slate-50 border-slate-200'
                    }`}
                    onPress={() => onSelectBranchId(b.id)}
                  >
                    <Ionicons
                      name="storefront-outline"
                      size={13}
                      color={isSelected ? '#ffffff' : '#0f172a'}
                    />
                    <Text
                      style={[
                        styles.branchChipText,
                        isSelected && styles.branchChipTextActive,
                      ]}
                      className={`text-xs font-semibold ml-1.5 ${
                        isSelected ? 'text-white' : 'text-slate-800'
                      }`}
                    >
                      {b.name}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>

          {/* Opciones de método */}
          <View style={styles.methodsList} className="gap-2.5 mb-4">
            {/* Opción 1: QR Simple */}
            <TouchableOpacity
              style={[styles.methodCard, selectedMethod === 'QR' && styles.methodCardActive]}
              className={`flex-row items-center p-3.5 rounded-2xl border ${
                selectedMethod === 'QR'
                  ? 'border-indigo-600 bg-indigo-50/30'
                  : 'border-slate-100 bg-slate-50'
              }`}
              onPress={() => onSelectMethod('QR')}
            >
              <View style={styles.methodIconBox} className="w-10 h-10 rounded-xl bg-white items-center justify-center border border-slate-200">
                <Ionicons name="qr-code-outline" size={22} color="#0f172a" />
              </View>
              <View style={styles.methodInfo} className="flex-1 ml-3">
                <Text style={styles.methodName} className="text-slate-900 font-bold text-sm">
                  Pago Móvil QR Simple
                </Text>
                <Text style={styles.methodDesc} className="text-slate-500 text-xs mt-0.5">
                  Interoperable con cualquier app bancaria
                </Text>
              </View>
              {selectedMethod === 'QR' && (
                <Ionicons name="checkmark-circle" size={20} color="#059669" />
              )}
            </TouchableOpacity>

            {/* Opción 2: Tarjeta */}
            <TouchableOpacity
              style={[styles.methodCard, selectedMethod === 'CARD' && styles.methodCardActive]}
              className={`flex-row items-center p-3.5 rounded-2xl border ${
                selectedMethod === 'CARD'
                  ? 'border-indigo-600 bg-indigo-50/30'
                  : 'border-slate-100 bg-slate-50'
              }`}
              onPress={() => onSelectMethod('CARD')}
            >
              <View style={styles.methodIconBox} className="w-10 h-10 rounded-xl bg-white items-center justify-center border border-slate-200">
                <Ionicons name="card-outline" size={22} color="#0f172a" />
              </View>
              <View style={styles.methodInfo} className="flex-1 ml-3">
                <Text style={styles.methodName} className="text-slate-900 font-bold text-sm">
                  Tarjeta de Débito / Crédito
                </Text>
                <Text style={styles.methodDesc} className="text-slate-500 text-xs mt-0.5">
                  Visa, Mastercard o pasarela en línea
                </Text>
              </View>
              {selectedMethod === 'CARD' && (
                <Ionicons name="checkmark-circle" size={20} color="#059669" />
              )}
            </TouchableOpacity>

            {/* Opción 3: Reserva para probar en tienda */}
            <TouchableOpacity
              style={[
                styles.methodCard,
                selectedMethod === 'RESERVE' && styles.methodCardActive,
              ]}
              className={`flex-row items-center p-3.5 rounded-2xl border ${
                selectedMethod === 'RESERVE'
                  ? 'border-indigo-600 bg-indigo-50/30'
                  : 'border-slate-100 bg-slate-50'
              }`}
              onPress={() => onSelectMethod('RESERVE')}
            >
              <View style={styles.methodIconBox} className="w-10 h-10 rounded-xl bg-white items-center justify-center border border-slate-200">
                <Ionicons name="storefront-outline" size={22} color="#0f172a" />
              </View>
              <View style={styles.methodInfo} className="flex-1 ml-3">
                <Text style={styles.methodName} className="text-slate-900 font-bold text-sm">
                  Reservar para Probar en Tienda
                </Text>
                <Text style={styles.methodDesc} className="text-slate-500 text-xs mt-0.5">
                  Te las apartamos 48 hrs en probador y pagas en caja
                </Text>
              </View>
              {selectedMethod === 'RESERVE' && (
                <Ionicons name="checkmark-circle" size={20} color="#059669" />
              )}
            </TouchableOpacity>
          </View>

          {/* Vista previa de QR */}
          {selectedMethod === 'QR' && (
            <View
              style={styles.qrPreviewBox}
              className="items-center bg-slate-50 border border-slate-200 rounded-2xl p-4 mb-4"
            >
              <Ionicons name="qr-code" size={84} color="#0f172a" />
              <Text style={styles.qrAmountText} className="text-slate-900 font-black text-lg mt-2">
                {formatCurrency(finalTotal)}
              </Text>
              <Text style={styles.qrHint} className="text-slate-500 text-xs text-center mt-1">
                Generado para FashionStore Boutique • Vigencia 15 min
              </Text>
            </View>
          )}

          {/* Vista previa de Formulario de Tarjeta */}
          {selectedMethod === 'CARD' && (
            <View
              style={styles.cardFormBox}
              className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5 gap-2.5 mb-4"
            >
              <View
                style={styles.cardInputRow}
                className="flex-row items-center bg-white border border-slate-200 rounded-xl px-3 h-11"
              >
                <Ionicons name="card-outline" size={16} color="#64748b" />
                <TextInput
                  style={styles.cardTextInput}
                  className="flex-1 ml-2 text-slate-800 text-xs font-semibold"
                  placeholder="Número de Tarjeta (16 dígitos)"
                  placeholderTextColor="#94a3b8"
                  keyboardType="numeric"
                  defaultValue="•••• •••• •••• 4242"
                />
              </View>
              <View style={styles.cardDualRow} className="flex-row gap-2">
                <TextInput
                  style={[styles.cardTextInput, { flex: 1 }]}
                  className="bg-white border border-slate-200 rounded-xl px-3 h-11 text-slate-800 text-xs font-semibold"
                  placeholder="MM/AA"
                  placeholderTextColor="#94a3b8"
                  defaultValue="12/28"
                />
                <TextInput
                  style={[styles.cardTextInput, { flex: 1 }]}
                  className="bg-white border border-slate-200 rounded-xl px-3 h-11 text-slate-800 text-xs font-semibold"
                  placeholder="CVV"
                  placeholderTextColor="#94a3b8"
                  secureTextEntry
                  defaultValue="888"
                />
              </View>
              <View style={styles.securityRow} className="flex-row items-center justify-center mt-1">
                <Ionicons name="lock-closed" size={12} color="#059669" />
                <Text style={styles.securityText} className="text-emerald-700 text-[11px] font-medium ml-1">
                  Encriptación SSL 256-bit certificada
                </Text>
              </View>
            </View>
          )}

          {/* Vista de Reserva para Probador */}
          {selectedMethod === 'RESERVE' && (
            <View
              style={styles.reserveInfoBox}
              className="flex-row items-center bg-sky-50 border border-sky-200 rounded-2xl p-3.5 gap-3 mb-4"
            >
              <Ionicons name="shield-checkmark-outline" size={20} color="#0284c7" />
              <View style={{ flex: 1 }}>
                <Text style={styles.reserveInfoTitle} className="text-sky-900 font-bold text-xs">
                  Retención por 48 horas en tienda
                </Text>
                <Text style={styles.reserveInfoDesc} className="text-sky-700 text-[11px] mt-0.5">
                  Tus prendas se apartarán en el probador de la sucursal seleccionada. No requieres pagar por adelantado.
                </Text>
              </View>
            </View>
          )}

          <Button
            title={
              isProcessing
                ? 'Procesando...'
                : selectedMethod === 'RESERVE'
                ? 'Confirmar Reserva en Tienda'
                : `Confirmar Pago (${formatCurrency(finalTotal)})`
            }
            onPress={onConfirm}
            loading={isProcessing}
            style={{ marginTop: 6 }}
          />
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
    maxHeight: '88%',
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
  qrPreviewBox: {
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  qrAmountText: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0f172a',
    marginTop: 8,
  },
  qrHint: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 4,
    textAlign: 'center',
  },
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
    height: 42,
  },
  cardDualRow: {
    flexDirection: 'row',
    gap: 8,
  },
  cardTextInput: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 42,
    fontSize: 12,
    color: '#0f172a',
    fontWeight: '500',
  },
  securityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    marginTop: 2,
  },
  securityText: {
    fontSize: 11,
    color: '#059669',
    fontWeight: '500',
  },
  reserveInfoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f9ff',
    borderWidth: 1,
    borderColor: '#bae6fd',
    borderRadius: 14,
    padding: 14,
    gap: 12,
    marginBottom: 16,
  },
  reserveInfoTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0369a1',
  },
  reserveInfoDesc: {
    fontSize: 11,
    color: '#0284c7',
    marginTop: 2,
  },
});
