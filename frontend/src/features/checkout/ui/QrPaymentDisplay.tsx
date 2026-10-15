import { useState, useEffect } from 'react';
import { QrCode, RefreshCw, CheckCircle2, Clock } from 'lucide-react';
import { apiClient } from '@/shared/api/axios-client';
import { Button } from '@/shared/ui/Button';
import { formatPrice } from '@/entities/product';

// Librería liviana para generar QR SVG sin dependencias externas
// Usamos un canvas + una API de QR embebida (URL pública de la API QR de Google para demo)
// En producción puedes instalar 'qrcode.react' o 'react-qr-code'

interface QrPaymentProps {
  amount: number;
  onPaymentConfirmed: (transactionRef: string) => void;
  onPaymentError: (message: string) => void;
}

interface QrData {
  transactionRef: string;
  amount: number;
  currency: string;
  description: string;
  expiresAt: string;
  qrData: string;
  qrString: string;
}

export function QrPaymentDisplay({
  amount,
  onPaymentConfirmed,
  onPaymentError,
}: QrPaymentProps) {
  const [qrData, setQrData] = useState<QrData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isConfirming, setIsConfirming] = useState(false);
  const [timeLeft, setTimeLeft] = useState(15 * 60); // 15 minutos en segundos
  const [isExpired, setIsExpired] = useState(false);

  const generateQr = async () => {
    setIsLoading(true);
    setIsExpired(false);
    setTimeLeft(15 * 60);
    try {
      const res = await apiClient.post<QrData>('/payments/create-qr', {
        amount,
        currency: 'BOB',
        description: 'Pago FashionStore Boutique',
      });
      setQrData(res.data);
    } catch {
      onPaymentError('No se pudo generar el código QR. Intenta nuevamente.');
    } finally {
      setIsLoading(false);
    }
  };

  // Generar QR al montar
  useEffect(() => {
    generateQr();
  }, [amount]);

  // Contador regresivo
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

  // Simular confirmación QR (en producción sería polling o webhook)
  const handleConfirmQr = async () => {
    if (!qrData) return;
    setIsConfirming(true);
    try {
      // En producción: el banco llama al webhook del backend
      // Para demo: el usuario confirma manualmente que escaneó el QR
      onPaymentConfirmed(qrData.transactionRef);
    } catch {
      onPaymentError('No se pudo confirmar el pago QR.');
    } finally {
      setIsConfirming(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-8 gap-3">
        <div className="h-8 w-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
        <p className="text-xs text-muted-foreground">Generando código QR...</p>
      </div>
    );
  }

  if (isExpired) {
    return (
      <div className="flex flex-col items-center gap-4 py-6">
        <div className="h-16 w-16 rounded-2xl bg-destructive/10 flex items-center justify-center">
          <Clock className="h-8 w-8 text-destructive" />
        </div>
        <div className="text-center space-y-1">
          <p className="font-semibold text-sm text-foreground">QR Expirado</p>
          <p className="text-xs text-muted-foreground">El código QR caducó. Genera uno nuevo.</p>
        </div>
        <Button onClick={generateQr} variant="outline" className="gap-2">
          <RefreshCw className="h-4 w-4" />
          Generar Nuevo QR
        </Button>
      </div>
    );
  }

  // URL de imagen QR usando API pública (sin instalar dependencias extra)
  const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(qrData?.qrString || '')}`;

  return (
    <div className="space-y-4">
      {/* QR Visual */}
      <div className="flex flex-col items-center gap-3 p-5 rounded-2xl border border-border bg-card shadow-sm">
        <div className="p-3 bg-white rounded-xl border border-border shadow-sm">
          <img
            src={qrImageUrl}
            alt="Código QR de pago"
            className="h-[180px] w-[180px] block"
            onError={(e) => {
              // Fallback si la API QR no está disponible
              (e.target as HTMLImageElement).style.display = 'none';
            }}
          />
          {/* Fallback icon */}
          <div className="hidden h-[180px] w-[180px] items-center justify-center">
            <QrCode className="h-24 w-24 text-foreground" />
          </div>
        </div>

        <div className="text-center space-y-1">
          <p className="font-extrabold text-xl text-foreground">{formatPrice(amount)}</p>
          <p className="text-[11px] font-mono text-muted-foreground">
            Ref: {qrData?.transactionRef}
          </p>
        </div>

        {/* Contador */}
        <div className={`flex items-center gap-1.5 text-xs font-mono font-bold px-3 py-1.5 rounded-full ${
          timeLeft < 120 ? 'bg-destructive/10 text-destructive' : 'bg-muted text-muted-foreground'
        }`}>
          <Clock className="h-3.5 w-3.5" />
          Expira en {minutes}:{String(seconds).padStart(2, '0')}
        </div>
      </div>

      {/* Instrucciones */}
      <div className="space-y-2 text-xs text-muted-foreground">
        <p className="font-semibold text-foreground">¿Cómo pagar?</p>
        <ol className="space-y-1 list-decimal list-inside">
          <li>Abre tu app bancaria (Banca Móvil Bolivia, etc.)</li>
          <li>Selecciona "Pagar con QR" o "Escanear QR"</li>
          <li>Apunta la cámara al código de arriba</li>
          <li>Confirma el pago de <strong>{formatPrice(amount)}</strong></li>
          <li>Presiona el botón "Ya Pagué con QR" abajo</li>
        </ol>
      </div>

      <Button
        onClick={handleConfirmQr}
        isLoading={isConfirming}
        className="w-full h-12 font-bold tracking-wide rounded-xl gap-2"
      >
        <CheckCircle2 className="h-4 w-4" />
        Ya Pagué con QR
      </Button>
    </div>
  );
}
