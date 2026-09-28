import { QrCode, CreditCard, ShieldCheck } from 'lucide-react';

interface CheckoutPaymentSectionProps {
  paymentMethod: 'QR' | 'CARD' | 'GATEWAY';
  onSelectPaymentMethod: (method: 'QR' | 'CARD' | 'GATEWAY') => void;
}

export function CheckoutPaymentSection({
  paymentMethod,
  onSelectPaymentMethod,
}: CheckoutPaymentSectionProps) {
  return (
    <div className="rounded-2xl border border-border bg-card p-6 shadow-sm space-y-4">
      <h3 className="text-base font-bold text-foreground">3. Método de Pago</h3>

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

        {/* Opción 2: Tarjeta / Pasarela */}
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
            <div className="text-[11px] opacity-70">Pasarela segura Visa y Mastercard</div>
          </div>
        </button>
      </div>

      <div className="p-3.5 rounded-xl bg-muted/40 border border-border flex items-center gap-2.5 text-xs text-muted-foreground">
        <ShieldCheck className="h-4 w-4 text-emerald-600 shrink-0" />
        <span>Tus pagos están protegidos con encriptación TLS de nivel bancario.</span>
      </div>
    </div>
  );
}
