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

  const handleConfirmOrder = async () => {
    if (!selectedBranchId) {
      toast.error('Sucursal requerida', 'Por favor selecciona la sucursal de retiro o despacho.');
      return;
    }

    setIsProcessing(true);
    try {
      const idempotencyKey = crypto.randomUUID();

      const payload = {
        branchId: selectedBranchId,
        type: 'ONLINE' as const,
        paymentMethod: paymentMethod === 'CARD' ? 'GATEWAY' : paymentMethod,
        idempotencyKey,
        items: items.map((item) => ({
          variantId: item.variantId,
          quantity: item.quantity,
        })),
      };

      const response = await apiClient.post('/orders/checkout', payload);
      setCompletedOrder(response.data);
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
          Completa tus datos de entrega y método de pago para confirmar tu orden
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

          <CheckoutPaymentSection
            paymentMethod={paymentMethod}
            onSelectPaymentMethod={setPaymentMethod}
          />
        </div>

        {/* Resumen Lateral */}
        <div className="lg:col-span-4">
          <CheckoutOrderSummary
            items={items}
            subtotal={subtotal}
            isProcessing={isProcessing}
            onConfirmOrder={handleConfirmOrder}
          />
        </div>
      </div>
    </div>
  );
}
