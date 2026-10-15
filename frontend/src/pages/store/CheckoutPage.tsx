import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { apiClient } from '@/shared/api/axios-client';
import type { Branch } from '@/shared/types/api';
import { useAuthStore } from '@/app/store/auth.store';
import { useCartStore } from '@/features/cart';
import { toast } from '@/shared/ui/Toast';
import {
  CheckoutAuthGuard,
  CheckoutEmpty,
  CheckoutSuccess,
  CheckoutCustomerInfo,
  CheckoutDeliverySection,
  CheckoutPaymentSection,
  CheckoutOrderSummary,
} from '@/features/checkout';

export function CheckoutPage() {
  const { user, isAuthenticated } = useAuthStore();
  const { items, clearCart, getSubtotal } = useCartStore();

  const [branches, setBranches] = useState<Branch[]>([]);
  const [selectedBranchId, setSelectedBranchId] = useState<string>('');
  const [deliveryType, setDeliveryType] = useState<'PICKUP' | 'SHIPPING'>('PICKUP');
  const [shippingAddress, setShippingAddress] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'QR' | 'CARD' | 'GATEWAY'>('QR');
  const [isProcessing, setIsProcessing] = useState(false);
  const [completedOrder, setCompletedOrder] = useState<any>(null);
  // Estado para guardar el pago completado (Stripe o QR) antes de hacer checkout
  const [pendingPaymentRef, setPendingPaymentRef] = useState<{
    type: 'STRIPE' | 'QR';
    ref: string;
  } | null>(null);

  const subtotal = getSubtotal();

  const fetchBranches = async () => {
    try {
      const response = await apiClient.get('/branches');
      const data: Branch[] = Array.isArray(response.data)
        ? response.data
        : response.data?.data || [];
      setBranches(data);
      if (data.length > 0) {
        setSelectedBranchId(data[0].id);
      }
    } catch (error) {
      console.error('Error al cargar sucursales:', error);
    }
  };

  useEffect(() => {
    fetchBranches();
  }, []);

  if (!isAuthenticated) {
    return <CheckoutAuthGuard />;
  }

  if (items.length === 0 && !completedOrder) {
    return <CheckoutEmpty />;
  }

  if (completedOrder) {
    return (
      <CheckoutSuccess
        user={user}
        completedOrder={completedOrder}
        paymentMethod={paymentMethod}
        subtotal={subtotal}
      />
    );
  }

  // Llamado cuando Stripe confirma el pago exitosamente (in-app)
  const handleStripePaymentSuccess = async (paymentIntentId: string) => {
    setPendingPaymentRef({ type: 'STRIPE', ref: paymentIntentId });
    toast.success('¡Tarjeta autorizada!', 'Confirmando tu orden...');
    await finalizeOrder('GATEWAY', paymentIntentId);
  };

  // Llamado cuando el usuario confirma que escaneó el QR
  const handleQrPaymentConfirmed = async (transactionRef: string) => {
    setPendingPaymentRef({ type: 'QR', ref: transactionRef });
    toast.success('¡QR Confirmado!', 'Finalizando tu orden...');
    await finalizeOrder('QR', transactionRef);
  };

  // Error de pago (Stripe o QR)
  const handlePaymentError = (message: string) => {
    toast.error('Error de pago', message);
  };

  // Crea la orden en el backend y (si aplica) confirma el pago
  const finalizeOrder = async (method: 'GATEWAY' | 'QR', paymentRef?: string) => {
    if (!selectedBranchId) {
      toast.error('Sucursal requerida', 'Selecciona la sucursal de retiro.');
      return;
    }

    setIsProcessing(true);
    try {
      const idempotencyKey = crypto.randomUUID();

      const payload = {
        branchId: selectedBranchId,
        type: 'ONLINE' as const,
        paymentMethod: method,
        idempotencyKey,
        items: items.map((item) => ({
          variantId: item.variantId,
          quantity: item.quantity,
        })),
      };

      const response = await apiClient.post('/orders/checkout', payload);
      const order = response.data;

      // Si hay referencia de pago, confirmarla en el backend
      if (paymentRef && order?.id) {
        try {
          if (method === 'GATEWAY') {
            await apiClient.post('/payments/confirm-stripe', {
              paymentIntentId: paymentRef,
              orderId: order.id,
            });
          } else if (method === 'QR') {
            await apiClient.post('/payments/confirm-qr', {
              transactionRef: paymentRef,
              orderId: order.id,
            });
          }
        } catch {
          // La orden ya fue creada; la confirmación de pago puede fallar sin bloquear
          console.warn('Advertencia: no se pudo actualizar estado de pago en BD');
        }
      }

      setCompletedOrder(order);
      clearCart();
      toast.success('¡Compra confirmada!', 'Tu orden ha sido registrada exitosamente.');
    } catch (err: any) {
      console.error('Error en checkout:', err);
      toast.error(
        'No pudimos procesar tu orden',
        err.response?.data?.message || err.message || 'Verifica la disponibilidad de las prendas e intenta nuevamente.',
      );
    } finally {
      setIsProcessing(false);
    }
  };

  // Items para Stripe metadata
  const stripeItems = items.map((i) => ({
    productName: i.productName,
    quantity: i.quantity,
    unitPrice: i.price,
  }));

  return (
    <div className="max-w-7xl mx-auto px-6 sm:px-12 py-10 space-y-10 selection:bg-foreground selection:text-background">
      {/* Header Editorial */}
      <div className="space-y-2 border-b border-border/40 pb-5">
        <Link
          to="/cart"
          className="inline-flex items-center gap-2 text-[11px] font-mono uppercase tracking-[0.2em] text-muted-foreground hover:text-foreground transition-colors mb-1"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Volver a la Bolsa</span>
        </Link>
        <span className="text-[10px] font-mono tracking-[0.25em] text-muted-foreground uppercase font-bold block">
          CHECKOUT SEGURO
        </span>
        <h1 className="text-2xl sm:text-4xl font-light font-serif uppercase tracking-tight text-foreground">
          Finalizar Compra
        </h1>
        <p className="text-xs font-mono text-muted-foreground">
          Completa tus datos de entrega y realiza el pago directamente en esta página
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14">
        {/* Formulario de Checkout */}
        <div className="lg:col-span-8 space-y-8">
          <CheckoutCustomerInfo user={user} />

          <CheckoutDeliverySection
            branches={branches}
            selectedBranchId={selectedBranchId}
            onSelectBranchId={setSelectedBranchId}
            deliveryType={deliveryType}
            onChangeDeliveryType={setDeliveryType}
            shippingAddress={shippingAddress}
            onChangeShippingAddress={setShippingAddress}
          />

          {/* Sección de pago: Stripe y QR embebidos en la página */}
          <CheckoutPaymentSection
            paymentMethod={paymentMethod}
            onSelectPaymentMethod={setPaymentMethod}
            amount={subtotal}
            items={stripeItems}
            onStripePaymentSuccess={handleStripePaymentSuccess}
            onQrPaymentConfirmed={handleQrPaymentConfirmed}
            onPaymentError={handlePaymentError}
          />
        </div>

        {/* Resumen Lateral */}
        <div className="lg:col-span-4">
          <CheckoutOrderSummary
            items={items}
            subtotal={subtotal}
            isProcessing={isProcessing}
            onConfirmOrder={() => {
              // El botón "Confirmar" solo se usa si aún no se inició el pago
              // (flujo manual de respaldo para edge-cases)
              if (!pendingPaymentRef) {
                toast.warning(
                  'Selecciona un método de pago',
                  'Completa el pago con QR o Tarjeta en el panel de la izquierda.',
                );
              }
            }}
          />
        </div>
      </div>
    </div>
  );
}
