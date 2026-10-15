import { QrCode, CreditCard, ShieldCheck } from 'lucide-react';
import { StripeCardForm } from './StripeCardForm';
import { QrPaymentDisplay } from './QrPaymentDisplay';

interface CheckoutPaymentSectionProps {
  paymentMethod: 'QR' | 'CARD' | 'GATEWAY';
  onSelectPaymentMethod: (method: 'QR' | 'CARD' | 'GATEWAY') => void;
  /** Monto a cobrar (necesario para crear el PaymentIntent / QR) */
  amount: number;
  /** Items del carrito para Stripe metadata */
  items: { productName: string; quantity: number; unitPrice: number }[];
  /** Callback cuando Stripe confirma el pago exitosamente */
  onStripePaymentSuccess: (paymentIntentId: string) => void;
  /** Callback cuando el usuario confirma el QR escaneado */
  onQrPaymentConfirmed: (transactionRef: string) => void;
  /** Callback cuando hay error en el pago */
  onPaymentError: (message: string) => void;
}

export function CheckoutPaymentSection({
  paymentMethod,
  onSelectPaymentMethod,
  amount,
  items,
  onStripePaymentSuccess,
  onQrPaymentConfirmed,
  onPaymentError,
}: CheckoutPaymentSectionProps) {
  return (
    <div className="rounded-2xl border border-border bg-card p-6 shadow-sm space-y-4">
      <h3 className="text-base font-bold text-foreground">3. Método de Pago</h3>

      {/* Selector de método */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* Opción 1: QR Simple */}
        <button
          type="button"
          onClick={() => onSelectPaymentMethod('QR')}
          className={`p-4 rounded-xl border text-left transition-all cursor-pointer flex items-start gap-3 ${
            paymentMethod === 'QR'
              ? 'border-primary bg-primary/10 text-primary ring-1 ring-primary'
              : 'border-border bg-background hover:bg-muted text-foreground'
          }`}
        >
          <div className="p-2 rounded-lg bg-card border border-border text-primary shrink-0">
            <QrCode className="h-6 w-6" />
          </div>
          <div>
            <div className="font-bold text-xs sm:text-sm">QR Simple Bancario</div>
            <div className="text-[11px] opacity-70">
              Transferencia instantánea desde cualquier banco
            </div>
          </div>
        </button>

        {/* Opción 2: Tarjeta / Stripe */}
        <button
          type="button"
          onClick={() => onSelectPaymentMethod('CARD')}
          className={`p-4 rounded-xl border text-left transition-all cursor-pointer flex items-start gap-3 ${
            paymentMethod === 'CARD'
              ? 'border-primary bg-primary/10 text-primary ring-1 ring-primary'
              : 'border-border bg-background hover:bg-muted text-foreground'
          }`}
        >
          <div className="p-2 rounded-lg bg-card border border-border text-primary shrink-0">
            <CreditCard className="h-6 w-6" />
          </div>
          <div>
            <div className="font-bold text-xs sm:text-sm">Tarjeta Débito / Crédito</div>
            <div className="text-[11px] opacity-70">Pasarela Stripe · Visa y Mastercard</div>
          </div>
        </button>
      </div>

      {/* Panel de pago QR — se muestra en la página sin redirección */}
      {paymentMethod === 'QR' && amount > 0 && (
        <div className="mt-2">
          <QrPaymentDisplay
            amount={amount}
            onPaymentConfirmed={onQrPaymentConfirmed}
            onPaymentError={onPaymentError}
          />
        </div>
      )}

      {/* Panel de tarjeta Stripe — embebido directamente en la página */}
      {paymentMethod === 'CARD' && amount > 0 && (
        <div className="mt-2">
          <StripeCardForm
            amount={amount}
            items={items}
            onPaymentSuccess={onStripePaymentSuccess}
            onPaymentError={onPaymentError}
          />
        </div>
      )}

      <div className="p-3.5 rounded-xl bg-muted/40 border border-border flex items-center gap-2.5 text-xs text-muted-foreground">
        <ShieldCheck className="h-4 w-4 text-emerald-600 shrink-0" />
        <span>Tus pagos están protegidos con encriptación TLS de nivel bancario.</span>
      </div>
    </div>
  );
}
