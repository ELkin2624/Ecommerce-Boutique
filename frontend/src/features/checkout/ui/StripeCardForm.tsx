import { useState, useEffect, useCallback } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import {
  Elements,
  CardElement,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js';
import { ShieldCheck as _ShieldCheck, Lock, AlertCircle } from 'lucide-react';
import { apiClient } from '@/shared/api/axios-client';
import { Button } from '@/shared/ui/Button';

// Inicializar Stripe una sola vez fuera del componente
const stripePromise = loadStripe(
  import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || '',
);

const CARD_ELEMENT_OPTIONS = {
  style: {
    base: {
      fontSize: '14px',
      color: 'hsl(var(--foreground))',
      fontFamily: 'inherit',
      '::placeholder': {
        color: 'hsl(var(--muted-foreground))',
      },
      iconColor: 'hsl(var(--foreground))',
    },
    invalid: {
      color: 'hsl(var(--destructive))',
      iconColor: 'hsl(var(--destructive))',
    },
  },
  hidePostalCode: true,
};

interface StripeCardFormProps {
  amount: number;
  items: { productName: string; quantity: number; unitPrice: number }[];
  onPaymentSuccess: (paymentIntentId: string) => void;
  onPaymentError: (message: string) => void;
}

/** Formulario interno de Stripe que vive dentro del <Elements> provider */
function StripeCardFormInner({
  amount,
  items,
  onPaymentSuccess,
  onPaymentError,
}: StripeCardFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);
  const [cardError, setCardError] = useState<string | null>(null);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [paymentIntentId, setPaymentIntentId] = useState<string | null>(null);

  // Crear PaymentIntent cuando el componente monta
  useEffect(() => {
    if (amount <= 0) return;

    apiClient
      .post<{ clientSecret: string; paymentIntentId: string }>(
        '/payments/create-payment-intent',
        { amount, items },
      )
      .then((res) => {
        setClientSecret(res.data.clientSecret);
        setPaymentIntentId(res.data.paymentIntentId);
      })
      .catch(() => {
        onPaymentError('No se pudo inicializar el pago. Intenta nuevamente.');
      });
  }, [amount]);

  const handleSubmit = useCallback(async () => {
    if (!stripe || !elements || !clientSecret) return;

    const cardElement = elements.getElement(CardElement);
    if (!cardElement) return;

    setIsProcessing(true);
    setCardError(null);

    try {
      const { error, paymentIntent } = await stripe.confirmCardPayment(
        clientSecret,
        {
          payment_method: { card: cardElement },
        },
      );

      if (error) {
        setCardError(error.message || 'Error al procesar la tarjeta.');
        onPaymentError(error.message || 'Error de pago');
      } else if (paymentIntent?.status === 'succeeded') {
        onPaymentSuccess(paymentIntent.id);
      }
    } finally {
      setIsProcessing(false);
    }
  }, [stripe, elements, clientSecret, paymentIntentId, onPaymentSuccess, onPaymentError]);

  return (
    <div className="space-y-4">
      {/* Marco del formulario de tarjeta */}
      <div className="rounded-xl border border-border bg-background p-4 shadow-sm">
        <label className="text-[11px] font-mono uppercase tracking-wider text-muted-foreground block mb-3">
          Datos de Tarjeta
        </label>
        <div className="p-3 rounded-lg border border-border bg-card">
          <CardElement options={CARD_ELEMENT_OPTIONS} />
        </div>

        {cardError && (
          <div className="mt-2 flex items-center gap-2 text-destructive text-xs">
            <AlertCircle className="h-3.5 w-3.5 shrink-0" />
            <span>{cardError}</span>
          </div>
        )}
      </div>

      {/* Tarjetas de prueba */}
      <div className="p-3 rounded-lg bg-muted/50 border border-border text-[11px] text-muted-foreground space-y-1">
        <p className="font-semibold text-foreground">Tarjetas de prueba Stripe:</p>
        <p>✅ <span className="font-mono">4242 4242 4242 4242</span> — Visa (aprobada)</p>
        <p>❌ <span className="font-mono">4000 0000 0000 0002</span> — Rechazada</p>
        <p className="text-[10px]">Fecha: cualquiera futura · CVV: cualquiera</p>
      </div>

      <Button
        onClick={handleSubmit}
        disabled={!stripe || !clientSecret || isProcessing}
        isLoading={isProcessing}
        className="w-full h-12 font-bold tracking-wide rounded-xl gap-2"
      >
        <Lock className="h-4 w-4" />
        {isProcessing ? 'Procesando pago...' : `Pagar con Tarjeta`}
      </Button>
    </div>
  );
}

/** Wrapper que provee el contexto de Stripe */
export function StripeCardForm(props: StripeCardFormProps) {
  return (
    <Elements stripe={stripePromise}>
      <StripeCardFormInner {...props} />
    </Elements>
  );
}
