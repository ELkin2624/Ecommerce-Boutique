import { Truck, RotateCcw, ShieldCheck } from 'lucide-react';

export function ProductDetailPerks() {
  return (
    <div className="pt-6 border-t border-border/40 grid grid-cols-3 gap-4 text-center">
      <div className="space-y-1">
        <Truck className="h-4 w-4 mx-auto text-foreground" />
        <p className="text-[10px] font-mono uppercase tracking-wider font-bold text-foreground">
          Envío Seguro
        </p>
        <p className="text-[10px] text-muted-foreground">Cobertura nacional</p>
      </div>

      <div className="space-y-1">
        <RotateCcw className="h-4 w-4 mx-auto text-foreground" />
        <p className="text-[10px] font-mono uppercase tracking-wider font-bold text-foreground">
          Garantía Cambios
        </p>
        <p className="text-[10px] text-muted-foreground">Hasta 7 días</p>
      </div>

      <div className="space-y-1">
        <ShieldCheck className="h-4 w-4 mx-auto text-foreground" />
        <p className="text-[10px] font-mono uppercase tracking-wider font-bold text-foreground">
          Confección Genuina
        </p>
        <p className="text-[10px] text-muted-foreground">100% Calidad</p>
      </div>
    </div>
  );
}
