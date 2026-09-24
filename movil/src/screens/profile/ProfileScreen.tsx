import React, { useState, useEffect, useCallback } from 'react';
import { 
  View, Text, ScrollView, StyleSheet, TouchableOpacity, StatusBar,
  RefreshControl, ActivityIndicator, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Header } from '@/shared/ui/Header';
import { Badge } from '@/shared/ui/Badge';
import { formatCurrency } from '@/shared/lib/utils';
import { useCartStore } from '@/features/cart/model/useCartStore';
import { RequireAuth } from '@/features/auth/ui/require-auth';
import { useAuth } from '@/features/auth/hooks/use-auth';
import { apiClient } from '@/shared/api/api-client';

interface ReservationItem {
  id: string;
  quantity: number;
  variant?: {
    sku: string;
    size: string;
    color: string;
    product?: { name: string };
  };
}

interface MyReservation {
  id: string;
  status: 'PENDING' | 'CONFIRMED' | 'PREPARED' | 'READY' | 'COMPLETED' | 'CANCELLED';
  expiresAt: string;
  notes?: string;
  createdAt: string;
  branch: {
    id: string;
    name: string;
    address: string;
  };
  items: ReservationItem[];
}

interface OrderItem {
  id: string;
  productName: string;
  size: string;
  color: string;
  quantity: number;
  unitPrice: number;
}

interface MyOrder {
  id: string;
  type: string;
  status: 'PENDING' | 'PAID' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED';
  total: number;
  branchName: string;
  createdAt: string;
  itemsCount: number;
  paymentStatus: string;
  paymentMethod: string;
  items?: OrderItem[];
}

export const ProfileScreen: React.FC = () => {
  const { totalCount } = useCartStore();
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState<'reservations' | 'orders'>('reservations');

  const [reservations, setReservations] = useState<MyReservation[]>([]);
  const [orders, setOrders] = useState<MyOrder[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Consulta de datos reales a la base de datos (NestJS API)
  const fetchUserData = useCallback(async () => {
    try {
      setLoading(true);
      const [resData, ordersData] = await Promise.all([
        apiClient.get<MyReservation[]>('/reservations/my').catch(() => []),
        apiClient.get<any>('/orders/my').catch(() => []),
      ]);

      setReservations(Array.isArray(resData) ? resData : []);
      const resolvedOrders = Array.isArray(ordersData)
        ? ordersData
        : ordersData?.items || [];
      setOrders(resolvedOrders);
    } catch {
      // Manejo silencioso en background
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    if (user) {
      fetchUserData();
    }
  }, [user, fetchUserData]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchUserData();
  };

  // Cancelar reserva en vivo en base de datos
  const handleCancelReservation = (reservationId: string) => {
    Alert.alert(
      '¿Cancelar Reserva?',
      'Se liberará el stock reservado en la sucursal física para que otros clientes puedan adquirirlo.',
      [
        { text: 'No, conservar', style: 'cancel' },
        {
          text: 'Sí, cancelar',
          style: 'destructive',
          onPress: async () => {
            try {
              await apiClient.patch(`/reservations/${reservationId}/cancel`, {});
              Alert.alert('Reserva Cancelada', 'Tu reserva ha sido cancelada con éxito.');
              fetchUserData();
            } catch (err: any) {
              Alert.alert('Error', err.message || 'No se pudo cancelar la reserva.');
            }
          },
        },
      ]
    );
  };

  const getReservationBadge = (status: MyReservation['status']) => {
    switch (status) {
      case 'PREPARED':
        return <Badge label="¡En Probador!" variant="success" />;
      case 'CONFIRMED':
      case 'READY':
        return <Badge label="Lista para Retiro" variant="success" />;
      case 'PENDING':
        return <Badge label="Apartada (Pendiente)" variant="warning" />;
      case 'COMPLETED':
        return <Badge label="Completada" variant="secondary" />;
      case 'CANCELLED':
        return <Badge label="Cancelada" variant="destructive" />;
      default:
        return <Badge label={status} variant="secondary" />;
    }
  };

  const getOrderBadge = (status: MyOrder['status']) => {
    switch (status) {
      case 'PAID':
      case 'DELIVERED':
        return <Badge label="Pagado" variant="success" />;
      case 'PENDING':
        return <Badge label="Pendiente de Pago" variant="warning" />;
      case 'SHIPPED':
        return <Badge label="En Preparación" variant="primary" />;
      case 'CANCELLED':
        return <Badge label="Cancelado" variant="destructive" />;
      default:
        return <Badge label={status} variant="secondary" />;
    }
  };

  return (
    <RequireAuth fallbackMessage="Inicia sesión para ver tus reservas de probador y tus compras.">
      <SafeAreaView style={styles.safeArea} className="flex-1 bg-white">
        <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
        <Header title="MI CUENTA" subtitle="Boutique Club" cartCount={totalCount} />

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#0f172a']} />
          }
        >
          {/* Tarjeta de Perfil de Usuario */}
          <View style={styles.userCard} className="flex-row items-center bg-slate-50 rounded-2xl p-4 border border-slate-200 mb-4">
            <View style={styles.avatar} className="w-13 h-13 rounded-full bg-slate-900 items-center justify-center">
              <Text style={styles.avatarText} className="text-white text-lg font-black">
                {user?.firstName?.[0]}
                {user?.lastName?.[0]}
              </Text>
            </View>
            <View style={styles.userInfo} className="flex-1 ml-3.5">
              <Text style={styles.userName} className="text-slate-900 font-black text-base">
                {user?.firstName} {user?.lastName}
              </Text>
              <Text style={styles.userEmail} className="text-slate-500 text-xs mt-0.5">{user?.email}</Text>
              <View style={styles.roleRow} className="mt-1.5 flex-row">
                <Badge
                  label={user?.isWholesaler ? 'Mayorista Exclusivo' : 'Cliente Estándar'}
                  variant={user?.isWholesaler ? 'success' : 'secondary'}
                />
              </View>
            </View>
            <TouchableOpacity onPress={logout} style={styles.logoutBtn} className="p-2 rounded-xl bg-red-100">
              <Ionicons name="log-out-outline" size={22} color="#dc2626" />
            </TouchableOpacity>
          </View>

          {/* Selector de Pestañas: Reservas de Probador vs Mis Compras */}
          <View style={styles.tabToggle} className="flex-row bg-slate-100 rounded-2xl p-1 mb-4">
            <TouchableOpacity
              style={[styles.tabBtn, activeTab === 'reservations' && styles.tabBtnActive]}
              className={`flex-1 flex-row items-center justify-center gap-1.5 py-2.5 rounded-xl ${
                activeTab === 'reservations' ? 'bg-slate-900 shadow-sm' : ''
              }`}
              onPress={() => setActiveTab('reservations')}
            >
              <Ionicons
                name="bookmark-outline"
                size={16}
                color={activeTab === 'reservations' ? '#ffffff' : '#64748b'}
              />
              <Text style={[styles.tabText, activeTab === 'reservations' && styles.tabTextActive]} className={`text-xs font-bold ${activeTab === 'reservations' ? 'text-white font-black' : 'text-slate-500'}`}>
                Reservas ({reservations.length})
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.tabBtn, activeTab === 'orders' && styles.tabBtnActive]}
              className={`flex-1 flex-row items-center justify-center gap-1.5 py-2.5 rounded-xl ${
                activeTab === 'orders' ? 'bg-slate-900 shadow-sm' : ''
              }`}
              onPress={() => setActiveTab('orders')}
            >
              <Ionicons
                name="bag-check-outline"
                size={16}
                color={activeTab === 'orders' ? '#ffffff' : '#64748b'}
              />
              <Text style={[styles.tabText, activeTab === 'orders' && styles.tabTextActive]} className={`text-xs font-bold ${activeTab === 'orders' ? 'text-white font-black' : 'text-slate-500'}`}>
                Mis Compras ({orders.length})
              </Text>
            </TouchableOpacity>
          </View>

          {loading && !refreshing && (
            <View style={styles.centerLoading} className="flex-row items-center justify-center gap-2 my-3">
              <ActivityIndicator size="small" color="#0f172a" />
              <Text style={styles.loadingText} className="text-slate-500 text-xs">Sincronizando con la tienda...</Text>
            </View>
          )}

          {/* CONTENIDO PESTAÑA: RESERVAS EN TIENDA */}
          {activeTab === 'reservations' && (
            <View style={styles.section} className="gap-3">
              {reservations.length === 0 && !loading ? (
                <View style={styles.emptyCard} className="bg-slate-50 rounded-2xl p-8 items-center border border-slate-200">
                  <Ionicons name="bookmark-outline" size={44} color="#cbd5e1" />
                  <Text style={styles.emptyTitle} className="text-slate-900 font-extrabold text-base mt-2.5">Sin reservas activas</Text>
                  <Text style={styles.emptySubtitle} className="text-slate-500 text-xs text-center mt-1.5 leading-4">
                    Puedes apartar prendas desde el detalle de producto para probártelas en cualquiera
                    de nuestras sucursales.
                  </Text>
                </View>
              ) : (
                reservations.map((res) => {
                  const isActive =
                    res.status === 'PENDING' ||
                    res.status === 'CONFIRMED' ||
                    res.status === 'PREPARED' ||
                    res.status === 'READY';

                  const expiresDate = new Date(res.expiresAt);
                  const isExpired = expiresDate.getTime() < Date.now();

                  return (
                    <View key={res.id} style={styles.card} className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm gap-2.5">
                      {/* Encabezado con código y estado */}
                      <View style={styles.cardHeader} className="flex-row justify-between items-center border-b border-slate-100 pb-2">
                        <View style={styles.idRow} className="flex-row items-center gap-1.5">
                          <Ionicons name="bookmark" size={16} color="#0f172a" />
                          <Text style={styles.idText} className="text-slate-900 font-black text-xs tracking-wider">RES-{res.id.substring(0, 8).toUpperCase()}</Text>
                        </View>
                        {getReservationBadge(res.status)}
                      </View>

                      {/* Información de Sucursal */}
                      <View style={styles.branchInfoBox} className="flex-row items-center gap-2 bg-slate-50 p-2.5 rounded-xl">
                        <Ionicons name="storefront-outline" size={16} color="#059669" />
                        <View style={{ flex: 1 }}>
                          <Text style={styles.branchName} className="text-slate-900 font-extrabold text-xs">
                            {(res as any).branchName || res.branch?.name || 'Sucursal'}
                          </Text>
                          <Text style={styles.branchAddress} className="text-slate-500 text-[11px] mt-0.5">
                            {(res as any).branchAddress || res.branch?.address || 'Dirección de la tienda'}
                          </Text>
                        </View>
                      </View>

                      {/* Lista de prendas reservadas */}
                      <View style={styles.itemsBox} className="bg-slate-50 p-2.5 rounded-xl gap-1">
                        <Text style={styles.itemsBoxTitle} className="text-slate-500 font-extrabold text-[11px] mb-0.5 tracking-wider">
                          Prendas apartadas ({res.items?.length || 0}):
                        </Text>
                        {res.items?.map((it: any, idx) => {
                          const pName = it.productName || it.variant?.product?.name || 'Prenda';
                          const pSize = it.size || it.variant?.size || '';
                          const pColor = it.color || it.variant?.color || '';
                          return (
                            <View key={it.id || idx} style={styles.itemRow} className="flex-row items-center gap-1.5">
                              <Text style={styles.itemDot} className="text-slate-900 font-black">•</Text>
                              <Text style={styles.itemTitle} className="flex-1 text-xs text-slate-900 font-semibold" numberOfLines={1}>
                                {pName} {pSize ? `(Talla ${pSize}${pColor ? `, Color ${pColor}` : ''})` : ''}
                              </Text>
                              <Text style={styles.itemQty} className="text-emerald-700 font-extrabold text-[11px]">x{it.quantity}</Text>
                            </View>
                          );
                        })}
                      </View>

                      {/* Vencimiento */}
                      <View style={styles.expiryRow} className="flex-row items-center gap-1.5">
                        <Ionicons name="time-outline" size={14} color="#64748b" />
                        <Text style={styles.expiryText} className="text-slate-500 font-semibold text-xs">
                          {isExpired
                            ? 'Venció el '
                            : 'Vigente hasta el '}{' '}
                          {expiresDate.toLocaleDateString('es-BO', {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </Text>
                      </View>

                      {/* Alerta de prendas en probador */}
                      {res.status === 'PREPARED' && (
                        <View style={styles.preparedAlert} className="flex-row items-center gap-2 bg-emerald-50 p-2.5 rounded-xl border border-emerald-200">
                          <Ionicons name="checkmark-circle" size={16} color="#059669" />
                          <Text style={styles.preparedAlertText} className="text-emerald-800 font-bold text-xs flex-1">
                            Tus prendas ya fueron apartadas en el probador físico. Acércate con este código.
                          </Text>
                        </View>
                      )}

                      {/* Botón para cancelar si la reserva está activa */}
                      {isActive && (
                        <TouchableOpacity
                          style={styles.cancelBtn}
                          className="flex-row items-center justify-center gap-1.5 py-2 rounded-xl border border-red-200 bg-red-50 mt-1"
                          onPress={() => handleCancelReservation(res.id)}
                        >
                          <Ionicons name="close-circle-outline" size={16} color="#ef4444" />
                          <Text style={styles.cancelBtnText} className="text-xs font-bold text-red-500">Cancelar Reserva</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  );
                })
              )}
            </View>
          )}

          {/* CONTENIDO PESTAÑA: MIS COMPRAS */}
          {activeTab === 'orders' && (
            <View style={styles.section} className="gap-3">
              {orders.length === 0 && !loading ? (
                <View style={styles.emptyCard} className="bg-slate-50 rounded-2xl p-8 items-center border border-slate-200">
                  <Ionicons name="bag-check-outline" size={44} color="#cbd5e1" />
                  <Text style={styles.emptyTitle} className="text-slate-900 font-extrabold text-base mt-2.5">Sin compras registradas</Text>
                  <Text style={styles.emptySubtitle} className="text-slate-500 text-xs text-center mt-1.5 leading-4">
                    Tus pedidos realizados con QR Simple o Tarjeta aparecerán aquí con su comprobante.
                  </Text>
                </View>
              ) : (
                orders.map((ord) => {
                  const createdDate = new Date(ord.createdAt);
                  return (
                    <View key={ord.id} style={styles.card} className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm gap-2.5">
                      <View style={styles.cardHeader} className="flex-row justify-between items-center border-b border-slate-100 pb-2">
                        <View style={styles.idRow} className="flex-row items-center gap-1.5">
                          <Ionicons name="receipt-outline" size={16} color="#0f172a" />
                          <Text style={styles.idText} className="text-slate-900 font-black text-xs tracking-wider">ORD-{ord.id.substring(0, 8).toUpperCase()}</Text>
                        </View>
                        {getOrderBadge(ord.status)}
                      </View>

                      <View style={styles.orderTotalRow} className="flex-row justify-between items-baseline">
                        <Text style={styles.orderTotalLabel} className="text-slate-500 font-bold text-xs">Total Pagado:</Text>
                        <Text style={styles.orderTotalValue} className="text-slate-900 font-black text-lg">{formatCurrency(ord.total)}</Text>
                      </View>

                      <View style={styles.orderMetaRow} className="flex-row justify-between items-center">
                        <Text style={styles.orderMetaText} className="text-slate-500 text-xs">
                          {createdDate.toLocaleDateString('es-BO', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                          })}{' '}
                          • {ord.paymentMethod === 'QR' ? 'Pago Móvil QR' : 'Tarjeta Débito/Crédito'}
                        </Text>
                        <Text style={styles.orderBranchTag} className="text-slate-900 font-bold text-[10px] bg-slate-100 px-2 py-0.5 rounded">
                          {ord.branchName}
                        </Text>
                      </View>

                      {/* Desglose de ítems de la compra */}
                      {ord.items && ord.items.length > 0 && (
                        <View style={styles.orderItemsList} className="border-t border-slate-100 pt-2 gap-1">
                          {ord.items.map((it) => (
                            <View key={it.id} style={styles.orderItemLine} className="flex-row justify-between">
                              <Text style={styles.orderItemName} className="text-slate-600 text-xs flex-1 pr-2" numberOfLines={1}>
                                {it.productName} ({it.size} • {it.color})
                              </Text>
                              <Text style={styles.orderItemPrice} className="text-slate-900 font-bold text-xs">
                                {it.quantity}x {formatCurrency(it.unitPrice)}
                              </Text>
                            </View>
                          ))}
                        </View>
                      )}
                    </View>
                  );
                })
              )}
            </View>
          )}

          {/* Soporte y Asistencia */}
          <View style={styles.supportCard} className="flex-row items-center bg-slate-50 rounded-2xl p-3.5 border border-slate-200 mt-5 gap-3">
            <Ionicons name="chatbubbles-outline" size={24} color="#0f172a" />
            <View style={styles.supportText} className="flex-1">
              <Text style={styles.supportTitle} className="text-slate-900 font-extrabold text-xs">Atención al Cliente Boutique</Text>
              <Text style={styles.supportDesc} className="text-slate-500 text-[11px] mt-0.5 leading-4">
                ¿Dudas con tu reserva o pedido? Escríbenos a soporte@boutiquemoda.com o comunícate con tu sucursal.
              </Text>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    </RequireAuth>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 80,
  },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 16,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#0f172a',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '900',
  },
  userInfo: {
    flex: 1,
    marginLeft: 14,
  },
  userName: {
    fontSize: 16,
    fontWeight: '900',
    color: '#0f172a',
  },
  userEmail: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
  },
  roleRow: {
    marginTop: 6,
    flexDirection: 'row',
  },
  logoutBtn: {
    padding: 8,
    borderRadius: 10,
    backgroundColor: '#fee2e2',
  },
  tabToggle: {
    flexDirection: 'row',
    backgroundColor: '#f1f5f9',
    borderRadius: 14,
    padding: 4,
    marginBottom: 16,
  },
  tabBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 10,
  },
  tabBtnActive: {
    backgroundColor: '#0f172a',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  tabText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#64748b',
  },
  tabTextActive: {
    color: '#ffffff',
    fontWeight: '900',
  },
  centerLoading: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginVertical: 12,
  },
  loadingText: {
    fontSize: 12,
    color: '#64748b',
  },
  section: {
    gap: 12,
  },
  emptyCard: {
    backgroundColor: '#f8fafc',
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0f172a',
    marginTop: 10,
  },
  emptySubtitle: {
    fontSize: 12,
    color: '#64748b',
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 18,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
    gap: 10,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    paddingBottom: 8,
  },
  idRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  idText: {
    fontSize: 13,
    fontWeight: '900',
    color: '#0f172a',
    letterSpacing: 0.5,
  },
  branchInfoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#f8fafc',
    padding: 10,
    borderRadius: 10,
  },
  branchName: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0f172a',
  },
  branchAddress: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 1,
  },
  itemsBox: {
    backgroundColor: '#f8fafc',
    padding: 10,
    borderRadius: 10,
    gap: 4,
  },
  itemsBoxTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: '#64748b',
    marginBottom: 2,
    letterSpacing: 0.5,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  itemDot: {
    color: '#0f172a',
    fontWeight: '900',
  },
  itemTitle: {
    flex: 1,
    fontSize: 12,
    color: '#0f172a',
    fontWeight: '600',
  },
  itemQty: {
    fontSize: 11,
    fontWeight: '800',
    color: '#059669',
  },
  expiryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  expiryText: {
    fontSize: 11,
    color: '#64748b',
    fontWeight: '600',
  },
  preparedAlert: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#ecfdf5',
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#a7f3d0',
  },
  preparedAlertText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#065f46',
    flex: 1,
  },
  cancelBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#fca5a5',
    backgroundColor: '#fff1f2',
    marginTop: 4,
  },
  cancelBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#ef4444',
  },
  orderTotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
  },
  orderTotalLabel: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '700',
  },
  orderTotalValue: {
    fontSize: 18,
    fontWeight: '900',
    color: '#0f172a',
  },
  orderMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  orderMetaText: {
    fontSize: 11,
    color: '#64748b',
  },
  orderBranchTag: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0f172a',
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  orderItemsList: {
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    paddingTop: 8,
    gap: 4,
  },
  orderItemLine: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  orderItemName: {
    fontSize: 11,
    color: '#475569',
    flex: 1,
    paddingRight: 8,
  },
  orderItemPrice: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0f172a',
  },
  supportCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginTop: 20,
    gap: 12,
  },
  supportText: {
    flex: 1,
  },
  supportTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0f172a',
  },
  supportDesc: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 2,
    lineHeight: 15,
  },
});
