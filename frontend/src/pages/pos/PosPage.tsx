import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
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
} from 'lucide-react';
import { apiClient } from '@/shared/api/axios-client';
import { queryKeys } from '@/shared/api/query-keys';
import { useAuthStore } from '@/app/store/auth.store';
import type { InventoryStock, PaymentMethod, Order } from '@/shared/types/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/Card';
import { Button } from '@/shared/ui/Button';
import { Badge } from '@/shared/ui/Badge';
import { ReceiptModal } from '@/features/pos/ui/ReceiptModal';
import { toast } from '@/shared/ui/Toast';
import { formatCurrency } from '@/shared/lib/utils';

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
  const [searchTerm, setSearchTerm] = useState('');
  const [barcodeInput, setBarcodeInput] = useState('');
  const [cart, setCart] = useState<PosCartItem[]>([]);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('CASH');
  const [isProcessing, setIsProcessing] = useState(false);
  const [completedOrder, setCompletedOrder] = useState<Order | null>(null);

  // Obtener stock disponible en el piso de venta de la sucursal activa
  const { data: rawStockData, refetch: refetchStock } = useQuery<any>({
    queryKey: queryKeys.inventory.stocks(activeBranchId || undefined),
    queryFn: async () => {
      const res = await apiClient.get('/inventory/stock', {
        params: activeBranchId ? { branchId: activeBranchId } : {},
      });
      return res.data;
    },
  });

  const stockItems: InventoryStock[] = Array.isArray(rawStockData)
    ? rawStockData
    : rawStockData?.items || [];

  // Filtrar productos disponibles con stock > 0
  const availableItems = stockItems.filter(
    (item) =>
      item.quantity > 0 &&
      (item.variant.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.variant.product.name.toLowerCase().includes(searchTerm.toLowerCase())),
  );

  const addToCart = (item: InventoryStock) => {
    setCart((prev) => {
      const existing = prev.find((i) => i.variantId === item.variantId);
      if (existing) {
        if (existing.quantity >= item.quantity) {
          toast.warning('Límite de stock', `Solo hay ${item.quantity} unidades disponibles`);
          return prev;
        }
        return prev.map((i) =>
          i.variantId === item.variantId ? { ...i, quantity: i.quantity + 1 } : i,
        );
      }
      return [
        ...prev,
        {
          variantId: item.variantId,
          sku: item.variant.sku,
          name: item.variant.product.name,
          size: item.variant.size,
          color: item.variant.color,
          price: Number(item.variant.price),
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

    const match = stockItems.find(
      (s) => s.variant.sku.toUpperCase() === barcodeInput.trim().toUpperCase(),
    );

    if (match) {
      if (match.quantity <= 0) {
        toast.error('Prenda agotada', `El SKU ${match.variant.sku} no tiene existencias`);
      } else {
        addToCart(match);
        toast.success('Prenda escaneada', `${match.variant.product.name} (${match.variant.sku})`);
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
    // Generar idempotencyKey única para prevenir doble cobro accidental
    const idempotencyKey = `POS-${activeBranchId}-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    try {
      const response = await apiClient.post('/orders/checkout', {
        branchId: activeBranchId,
        type: 'IN_STORE',
        paymentMethod,
        idempotencyKey,
        items: cart.map((i) => ({
          variantId: i.variantId,
          quantity: i.quantity,
        })),
      });

      toast.success('Venta Exitosa', `Cobro de ${formatCurrency(total)} registrado en caja`);
      setCompletedOrder(response.data);
      setCart([]);
      refetchStock();
    } catch (err: any) {
      toast.error('Error en checkout', err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Punto de Venta (Caja Mostrador)</h1>
          <p className="text-xs text-muted-foreground">
            Cobro rápido y decremento atómico de inventario en <span className="font-semibold text-foreground">{activeBranchName || 'General'}</span>
          </p>
        </div>
      </div>

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
              availableItems.map((item) => (
                <Card
                  key={item.id}
                  onClick={() => addToCart(item)}
                  className="cursor-pointer hover:border-primary/50 transition-all shadow-sm flex flex-col justify-between p-3.5 hover:shadow-md"
                >
                  <div>
                    <div className="flex justify-between items-start">
                      <span className="font-semibold text-sm line-clamp-1">
                        {item.variant.product.name}
                      </span>
                      <span className="font-bold text-sm text-emerald-600">
                        {formatCurrency(item.variant.price)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="outline" className="font-mono text-[10px]">
                        {item.variant.sku}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {item.variant.size} • {item.variant.color}
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
              ))
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
    </div>
  );
}
