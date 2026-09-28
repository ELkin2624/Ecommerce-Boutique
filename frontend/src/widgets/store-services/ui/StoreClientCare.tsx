import { Truck, Camera, ShieldCheck } from 'lucide-react';

export function StoreClientCare() {
  return (
    <section className="max-w-7xl mx-auto px-6 sm:px-12 border-t border-border/40 pt-14">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-left">
        <div className="space-y-2.5">
          <span className="text-[11px] font-mono font-bold text-muted-foreground uppercase tracking-widest">
            [ 01 · COBERTURA NACIONAL ]
          </span>
          <div className="flex items-center gap-2 text-foreground font-medium text-sm tracking-wider uppercase font-serif">
            <Truck className="h-4 w-4 text-foreground" />
            <span>Envíos Asegurados a Todo el País</span>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Despachos rápidos y seguros a Santa Cruz, La Paz, Cochabamba y todas las ciudades con guía de rastreo digital.
          </p>
        </div>

        <div className="space-y-2.5">
          <span className="text-[11px] font-mono font-bold text-muted-foreground uppercase tracking-widest">
            [ 02 · TECNOLOGÍA EN VIVO ]
          </span>
          <div className="flex items-center gap-2 text-foreground font-medium text-sm tracking-wider uppercase font-serif">
            <Camera className="h-4 w-4 text-foreground" />
            <span>Probador Virtual AR 3D</span>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Visualiza cómo te queda cada prenda en tiempo real directamente desde tu cámara antes de realizar la compra.
          </p>
        </div>

        <div className="space-y-2.5">
          <span className="text-[11px] font-mono font-bold text-muted-foreground uppercase tracking-widest">
            [ 03 · GARANTÍA BOUTIQUE ]
          </span>
          <div className="flex items-center gap-2 text-foreground font-medium text-sm tracking-wider uppercase font-serif">
            <ShieldCheck className="h-4 w-4 text-foreground" />
            <span>Pago Seguro & Cambio de Talla</span>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Pagos instantáneos con QR Simple bancario y garantía total de cambio de talla en 7 días sin costo adicional.
          </p>
        </div>
      </div>
    </section>
  );
}
