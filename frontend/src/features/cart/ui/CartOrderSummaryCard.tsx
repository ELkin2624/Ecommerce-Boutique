import { useNavigate } from 'react-router-dom';
import { ArrowRight, ShieldCheck, Truck } from 'lucide-react';
import { formatPrice } from '@/entities/product';
import { Button } from '@/shared/ui/Button';

interface CartOrderSummaryCardProps {
  subtotal: number;
  itemCount: number;
}

export function CartOrderSummaryCard({
  subtotal,
  itemCount,
}: CartOrderSummaryCardProps) {
  const navigate = useNavigate();

  return (
    <div className="border border-border/40 bg-card p-6 space-y-6 sticky top-24">
      <div className="border-b border-border/40 pb-4">
        <span className="text-[10px] font-mono tracking-[0.25em] text-muted-foreground uppercase font-bold">
          COMPRA EXCLUSIVA
        </span>
        <h3 className="text-lg font-light font-serif uppercase tracking-tight text-foreground">
          Resumen del Pedido
        </h3>
      </div>

      <div className="space-y-3.5 text-xs font-mono">
        <div className="flex justify-between text-muted-foreground">
          <span className="uppercase tracking-wider">Prendas ({itemCount})</span>
          <span className="font-bold text-foreground">{formatPrice(subtotal)}</span>
        </div>

        <div className="flex justify-between text-muted-foreground">
          <span className="flex items-center gap-1.5 uppercase tracking-wider">
            <Truck className="h-3.5 w-3.5" /> Entrega
          </span>
          <span className="text-foreground">Calculado en checkout</span>
        </div>

        <div className="pt-4 border-t border-border/40 flex justify-between items-baseline">
          <span className="font-bold text-xs uppercase tracking-widest text-foreground">
            Total Estimado
          </span>
          <span className="font-light text-2xl text-foreground font-serif tracking-tight">
            {formatPrice(subtotal)}
          </span>
        </div>
      </div>

      <Button
        size="lg"
        onClick={() => navigate('/checkout')}
        className="w-full h-12 rounded-none bg-foreground text-background hover:bg-foreground/90 font-mono uppercase tracking-[0.2em] text-xs font-bold gap-2 shadow-none transition-all"
      >
        <span>Proceder al Pago</span>
        <ArrowRight className="h-4 w-4" />
      </Button>

      <div className="pt-2 flex items-center justify-center gap-1.5 text-[10px] font-mono uppercase tracking-wider text-muted-foreground text-center">
        <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
        <span>Garantía & Autenticidad Kitty</span>
      </div>
    </div>
  );
}
