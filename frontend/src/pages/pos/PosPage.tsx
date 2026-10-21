import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Scan,
  Search,
  ShoppingCart,
  Trash2,
  Plus,
  Minus,
  CreditCard,
  Banknote,
  QrCode,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import { apiClient } from '@/shared/api/axios-client';
import { queryKeys } from '@/shared/api/query-keys';
import { useAuthStore } from '@/app/store/auth.store';
import type { InventoryStock, PaymentMethod, Order } from '@/shared/types/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/Card';
import { Button } from '@/shared/ui/Button';
import { Badge } from '@/shared/ui/Badge';
import { ReceiptModal, PosSyncModal } from '@/features/pos';
import { toast } from '@/shared/ui/Toast';
import { formatCurrency } from '@/shared/lib/utils';
import { offlineApi, offlineDb, OfflineBadge, useOfflineSync } from '@/shared/offline';


interface PosCartItem {
  variantId: string;
  sku: string;
  name: string;
  size: string;
  color: string;
  price: number;
  quantity: number;
  availableStock: number;
}

export function PosPage() {
  const { activeBranchId, activeBranchName } = useAuthStore();
  const queryClient = useQueryClient();
  const { failedCount } = useOfflineSync();
  const [searchTerm, setSearchTerm] = useState('');
  const [barcodeInput, setBarcodeInput] = useState('');
  const [cart, setCart] = useState<PosCartItem[]>([]);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('CASH');
  const [isProcessing, setIsProcessing] = useState(false);
  const [completedOrder, setCompletedOrder] = useState<Order | null>(null);
  const [isSyncModalOpen, setIsSyncModalOpen] = useState(false);

  // Obtener stock disponible en el piso de venta (con soporte offline mediante IndexedDB)
  const { data: rawStockData, refetch: refetchStock } = useQuery<any>({
    queryKey: queryKeys.inventory.stocks(activeBranchId || undefined),
    queryFn: async () => {
      const cacheKey = `pos_stock_${activeBranchId || 'all'}`;
      const { data } = await offlineApi.get(
        cacheKey,
        async () => {
          const res = await apiClient.get('/inventory/stock', {
            params: activeBranchId ? { branchId: activeBranchId } : {},
          });
          return res.data;
        },
        { ttl: 10 * 60 * 1000 },
      );
      return data;
    },
  });

  const stockItems: InventoryStock[] = Array.isArray(rawStockData)
    ? rawStockData
    : rawStockData?.items || [];

  // Filtrar productos disponibles con stock > 0
  const availableItems = stockItems.filter((item) => {
    if (!item || item.quantity <= 0) return false;
    const sku = (item.variant?.sku || (item as any).sku || '').toLowerCase();
    const name = (item.variant?.product?.name || (item as any).productName || '').toLowerCase();
    const term = searchTerm.toLowerCase();
    return sku.includes(term) || name.includes(term);
  });

  const addToCart = (item: InventoryStock) => {
    const variantId = item.variantId || item.variant?.id;
    const sku = item.variant?.sku || (item as any).sku || 'SKU-N/A';
    const name = item.variant?.product?.name || (item as any).productName || 'Prenda';
    const size = item.variant?.size || (item as any).size || '';
    const color = item.variant?.color || (item as any).color || '';
    const price = Number(item.variant?.price ?? (item as any).price ?? 0);

    setCart((prev) => {
      const existing = prev.find((i) => i.variantId === variantId);
      if (existing) {
        if (existing.quantity >= item.quantity) {
          toast.warning('Límite de stock', `Solo hay ${item.quantity} unidades disponibles`);
          return prev;
        }
        return prev.map((i) =>
          i.variantId === variantId ? { ...i, quantity: i.quantity + 1 } : i,
        );
      }
      return [
        ...prev,
        {
          variantId,
          sku,
          name,
          size,
          color,
          price,
          quantity: 1,
          availableStock: item.quantity,
        },
      ];
    });
  };

  const updateQuantity = (variantId: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((i) => {
          if (i.variantId === variantId) {
            const nextQty = i.quantity + delta;
            if (nextQty > i.availableStock) {
              toast.warning('Stock insuficiente', `Stock máximo disponible: ${i.availableStock}`);
              return i;
            }
            return { ...i, quantity: nextQty };
          }
          return i;
        })
        .filter((i) => i.quantity > 0),
    );
  };

  const removeFromCart = (variantId: string) => {
    setCart((prev) => prev.filter((i) => i.variantId !== variantId));
  };

  // Simulación de escáner de código de barras
  const handleBarcodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!barcodeInput.trim()) return;

    const querySku = barcodeInput.trim().toUpperCase();
    const match = stockItems.find((s) => {
      const sku = (s.variant?.sku || (s as any).sku || '').toUpperCase();
      return sku === querySku;
    });

    if (match) {
      if (match.quantity <= 0) {
        const sku = match.variant?.sku || (match as any).sku;
        toast.error('Prenda agotada', `El SKU ${sku} no tiene existencias`);
      } else {
        addToCart(match);
        const name = match.variant?.product?.name || (match as any).productName || 'Prenda';
        const sku = match.variant?.sku || (match as any).sku || '';
        toast.success('Prenda escaneada', `${name} (${sku})`);
      }
    } else {
      toast.error('SKU no encontrado', `No se encontró inventario con el código ${barcodeInput}`);
    }
    setBarcodeInput('');
  };

  const total = cart.reduce((acc, item) => acc + item.price * item.quantity, 0);

  const handleCheckout = async () => {
    if (cart.length === 0) {
      toast.warning('Ticket vacío', 'Agregue al menos una prenda antes de cobrar');
      return;
    }

    if (!activeBranchId) {
      toast.error('Error de sucursal', 'Debe seleccionar una sucursal activa');
      return;
    }

    setIsProcessing(true);
    const idempotencyKey =
      typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
        ? crypto.randomUUID()
        : `POS-${activeBranchId}-${Date.now()}-${Math.floor(Math.random() * 1000000)}`;

    const checkoutPayload = {
      branchId: activeBranchId,
      type: 'IN_STORE',
      paymentMethod,
      idempotencyKey,
      items: cart.map((i) => ({
        variantId: i.variantId,
        quantity: i.quantity,
      })),
    };

    // Estructura de recibo local optimista para operar offline sin pausas
    const localOrderReceipt: any = {
      id: `local_${Date.now()}`,
      orderNumber: `OFF-${Date.now().toString().slice(-6)}`,
      branchId: activeBranchId,
      status: 'PAID',
      paymentMethod,
      total,
      subtotal: total,
      tax: 0,
      createdAt: new Date().toISOString(),
      items: cart.map((i) => ({
        id: `item_${i.variantId}`,
        variantId: i.variantId,
        quantity: i.quantity,
        unitPrice: i.price,
        subtotal: i.price * i.quantity,
        variant: {
          id: i.variantId,
          sku: i.sku,
          size: i.size,
          color: i.color,
          product: { name: i.name },
        },
      })),
    };

    try {
      const result = await offlineApi.mutate({
        entity: 'order',
        action: 'CREATE',
        endpoint: '/orders/checkout',
        payload: checkoutPayload,
        optimisticSave: async () => {
          // 1. Guardar recibo en la base de datos local Dexie
          await offlineDb.orders.put({
            ...localOrderReceipt,
            isLocalOnly: true,
            offlinePendingSync: true,
          });

          // 2. Decrementar el stock localmente en kvCache para evitar vender el mismo ítem agotado
          const cacheKey = `pos_stock_${activeBranchId || 'all'}`;
          try {
            const cached = await offlineDb.kvCache.get(cacheKey);
            if (cached && cached.data) {
              const updatedData = Array.isArray(cached.data)
                ? cached.data.map((st: any) => {
                    const cItem = cart.find(
                      (c) => c.variantId === (st.variantId || st.variant?.id),
                    );
                    if (cItem) {
                      return {
                        ...st,
                        quantity: Math.max(0, (st.quantity || 0) - cItem.quantity),
                      };
                    }
                    return st;
                  })
                : cached.data;
              await offlineDb.kvCache.put({ ...cached, data: updatedData });
            }
          } catch (cacheErr) {
            console.warn('[POS] Error actualizando stock en kvCache:', cacheErr);
          }

          // 3. Actualizar la memoria de React Query de inmediato
          queryClient.setQueryData(
            queryKeys.inventory.stocks(activeBranchId || undefined),
            (old: any) => {
              if (!old) return old;
              if (Array.isArray(old)) {
                return old.map((st: any) => {
                  const cItem = cart.find(
                    (c) => c.variantId === (st.variantId || st.variant?.id),
                  );
                  if (cItem) {
                    return {
                      ...st,
                      quantity: Math.max(0, (st.quantity || 0) - cItem.quantity),
                    };
                  }
                  return st;
                });
              }
              if (old.items && Array.isArray(old.items)) {
                return {
                  ...old,
                  items: old.items.map((st: any) => {
                    const cItem = cart.find(
                      (c) => c.variantId === (st.variantId || st.variant?.id),
                    );
                    if (cItem) {
                      return {
                        ...st,
                        quantity: Math.max(0, (st.quantity || 0) - cItem.quantity),
                      };
                    }
                    return st;
                  }),
                };
              }
              return old;
            },
          );
        },
      });

      if (result.isOffline) {
        toast.info(
          'Venta Guardada Localmente (Offline)',
          `Cobro de ${formatCurrency(total)} guardado en IndexedDB. Se sincronizará automáticamente al conectar.`,
        );
        setCompletedOrder(localOrderReceipt);
      } else {
        toast.success('Venta Exitosa', `Cobro de ${formatCurrency(total)} registrado en caja`);
        setCompletedOrder(result.data);
      }

      setCart([]);
      refetchStock();
    } catch (err: any) {
      toast.error('Error en checkout', err.message || 'No se pudo procesar la venta');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header con Indicador Offline */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Punto de Venta (Caja Mostrador)</h1>
          <p className="text-xs text-muted-foreground">
            Cobro rápido y decremento atómico de inventario en <span className="font-semibold text-foreground">{activeBranchName || 'General'}</span>
          </p>
        </div>
        <div className="flex items-center gap-2">
          <OfflineBadge onClick={() => setIsSyncModalOpen(true)} />
        </div>
      </div>

      {/* Banner de alerta si ocurrieron conflictos ACID en sincronización */}
      {failedCount > 0 && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-xl border border-destructive/30 bg-destructive/10 text-destructive text-sm shadow-sm animate-in fade-in">
          <div className="flex items-center gap-2.5">
            <AlertTriangle className="h-5 w-5 shrink-0 text-destructive" />
            <div>
              <p className="font-semibold text-destructive">
                Atención: {failedCount} {failedCount === 1 ? 'venta offline fue rechazada' : 'ventas offline fueron rechazadas'} por el servidor (conflicto de inventario).
              </p>
              <p className="text-xs text-destructive/80">
                La prenda se vendió previamente en otro terminal o canal. El servidor mantuvo la integridad ACID.
              </p>
            </div>
          </div>
          <Button
            size="sm"
            variant="destructive"
            onClick={() => setIsSyncModalOpen(true)}
            className="shrink-0 text-xs font-bold"
          >
            Ver Conflictos
          </Button>
        </div>
      )}

      {/* POS Grid: Left catalog search / Right ticket */}
      <div className="grid gap-6 lg:grid-cols-12 items-start">
        {/* Left Column: Product Selection (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          {/* Barcode scanner bar */}
          <Card className="shadow-sm">
            <CardContent className="p-4">
              <form onSubmit={handleBarcodeSubmit} className="flex gap-2">
                <div className="relative flex-1">
                  <Scan className="absolute left-3 top-2.5 h-4 w-4 text-primary" />
                  <input
                    type="text"
                    placeholder="Escanear código de barras o ingresar SKU (Presione Enter)..."
                    value={barcodeInput}
                    onChange={(e) => setBarcodeInput(e.target.value)}
                    className="flex h-9 w-full rounded-md border border-input bg-background pl-9 pr-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring font-mono"
                    autoFocus
                  />
                </div>
                <Button type="submit" size="sm" variant="secondary">
                  Escanear
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Quick search input */}
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Buscar por nombre o modelo..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex h-9 w-full rounded-md border border-input bg-background pl-9 pr-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            />
          </div>

          {/* Available items cards grid */}
          <div className="grid gap-3 sm:grid-cols-2 max-h-[500px] overflow-y-auto pr-1">
            {availableItems.length === 0 ? (
              <div className="col-span-2 py-12 text-center text-sm text-muted-foreground">
                No se encontraron prendas con stock disponible para la búsqueda.
              </div>
            ) : (
              availableItems.map((item) => {
                const name = item.variant?.product?.name || (item as any).productName || 'Prenda';
                const sku = item.variant?.sku || (item as any).sku || 'SKU-N/A';
                const price = item.variant?.price ?? (item as any).price ?? 0;
                const size = item.variant?.size || (item as any).size || '';
                const color = item.variant?.color || (item as any).color || '';

                return (
                  <Card
                    key={item.id}
                    onClick={() => addToCart(item)}
                    className="cursor-pointer hover:border-primary/50 transition-all shadow-sm flex flex-col justify-between p-3.5 hover:shadow-md"
                  >
                    <div>
                      <div className="flex justify-between items-start">
                        <span className="font-semibold text-sm line-clamp-1">
                          {name}
                        </span>
                        <span className="font-bold text-sm text-emerald-600">
                          {formatCurrency(price)}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="outline" className="font-mono text-[10px]">
                          {sku}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {size} • {color}
                        </span>
                      </div>
                    </div>
                    <div className="flex justify-between items-center mt-3 pt-2 border-t text-xs">
                    <span className="text-muted-foreground">Disponible: {item.quantity} unid.</span>
                    <span className="text-primary font-semibold flex items-center gap-1">
                      <Plus className="h-3 w-3" /> Agregar
                    </span>
                  </div>
                </Card>
              );
            })
          )}
          </div>
        </div>

        {/* Right Column: Ticket / Checkout Summary (5 cols) */}
        <div className="lg:col-span-5">
          <Card className="shadow-md border-border">
            <CardHeader className="pb-3 border-b bg-muted/20">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <ShoppingCart className="h-4 w-4 text-primary" />
                  <span>Ticket Actual</span>
                </CardTitle>
                <Badge variant="secondary">{cart.length} prendas</Badge>
              </div>
            </CardHeader>
            <CardContent className="p-4 space-y-4">
              {/* Cart items list */}
              {cart.length === 0 ? (
                <div className="py-12 text-center text-sm text-muted-foreground">
                  El ticket se encuentra vacío.
                  <br />
                  Escanee o seleccione prendas a la izquierda.
                </div>
              ) : (
                <div className="divide-y max-h-[260px] overflow-y-auto space-y-2 pr-1">
                  {cart.map((item) => (
                    <div key={item.variantId} className="pt-2 flex items-center justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-xs truncate">{item.name}</p>
                        <p className="text-[11px] text-muted-foreground font-mono">
                          {item.sku} • {item.size} ({formatCurrency(item.price)})
                        </p>
                      </div>

                      {/* Quantity controls */}
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => updateQuantity(item.variantId, -1)}
                          className="h-6 w-6 rounded border flex items-center justify-center hover:bg-accent"
                        >
                          <Minus className="h-3 w-3" />
                        </button>
                        <span className="font-bold text-xs w-6 text-center">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.variantId, 1)}
                          className="h-6 w-6 rounded border flex items-center justify-center hover:bg-accent"
                        >
                          <Plus className="h-3 w-3" />
                        </button>
                        <button
                          onClick={() => removeFromCart(item.variantId)}
                          className="h-6 w-6 rounded text-destructive hover:bg-destructive/10 flex items-center justify-center ml-1"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>

                      <div className="text-right w-16 font-bold text-xs">
                        {formatCurrency(item.price * item.quantity)}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Totals & Payment Method */}
              <div className="border-t pt-4 space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal:</span>
                  <span>{formatCurrency(total)}</span>
                </div>
                <div className="flex justify-between text-base font-bold">
                  <span>TOTAL A COBRAR:</span>
                  <span className="text-xl text-emerald-600 font-extrabold">{formatCurrency(total)}</span>
                </div>

                {/* Payment Method Selector */}
                <div className="space-y-1 pt-2">
                  <label className="text-xs font-semibold text-muted-foreground">Método de Cobro</label>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => setPaymentMethod('CASH')}
                      className={`flex flex-col items-center justify-center p-2 rounded-md border text-xs font-semibold gap-1 transition-all ${
                        paymentMethod === 'CASH'
                          ? 'border-primary bg-primary/10 text-primary shadow-sm'
                          : 'border-input hover:bg-accent'
                      }`}
                    >
                      <Banknote className="h-4 w-4" />
                      <span>Efectivo</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setPaymentMethod('CARD')}
                      className={`flex flex-col items-center justify-center p-2 rounded-md border text-xs font-semibold gap-1 transition-all ${
                        paymentMethod === 'CARD'
                          ? 'border-primary bg-primary/10 text-primary shadow-sm'
                          : 'border-input hover:bg-accent'
                      }`}
                    >
                      <CreditCard className="h-4 w-4" />
                      <span>Tarjeta</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setPaymentMethod('QR')}
                      className={`flex flex-col items-center justify-center p-2 rounded-md border text-xs font-semibold gap-1 transition-all ${
                        paymentMethod === 'QR'
                          ? 'border-primary bg-primary/10 text-primary shadow-sm'
                          : 'border-input hover:bg-accent'
                      }`}
                    >
                      <QrCode className="h-4 w-4" />
                      <span>Pago QR</span>
                    </button>
                  </div>
                </div>

                {/* Confirm Sale Button */}
                <Button
                  onClick={handleCheckout}
                  disabled={cart.length === 0 || isProcessing}
                  isLoading={isProcessing}
                  className="w-full h-11 text-base font-bold shadow-md bg-emerald-600 hover:bg-emerald-700 text-white gap-2"
                >
                  <CheckCircle2 className="h-5 w-5" />
                  <span>Cobrar {formatCurrency(total)}</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Receipt Modal */}
      <ReceiptModal
        open={Boolean(completedOrder)}
        onOpenChange={(open) => !open && setCompletedOrder(null)}
        order={completedOrder}
      />

      {/* Sincronización Outbox & Gestión de Conflictos ACID Modal */}
      <PosSyncModal
        open={isSyncModalOpen}
        onOpenChange={setIsSyncModalOpen}
      />
    </div>
  );
}
