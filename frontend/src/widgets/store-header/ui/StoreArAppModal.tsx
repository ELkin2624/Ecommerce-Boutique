import { Sparkles, X, CheckCircle2, Camera, Smartphone, Download } from 'lucide-react';

interface StoreArAppModalProps {
  onClose: () => void;
}

export function StoreArAppModal({ onClose }: StoreArAppModalProps) {
  return (
    <div className="fixed inset-0 z-40 flex items-start justify-center pt-20 sm:pt-24 px-4">
      <div
        className="fixed inset-0 bg-background/60 backdrop-blur-md transition-opacity duration-300"
        onClick={onClose}
      />

      <div className="relative w-full max-w-xl rounded-3xl border border-border/80 bg-card/95 p-6 sm:p-8 shadow-2xl backdrop-blur-xl z-50 animate-in fade-in-50 zoom-in-95 duration-200 space-y-5">
        <div className="flex items-center justify-between pb-3 border-b border-border/60">
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold tracking-tight text-foreground">
                Probador Virtual AR & App Móvil
              </h3>
              <p className="text-xs text-muted-foreground">
                Tecnología de ajuste 3D en tiempo real
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Breve Explicación */}
        <div className="space-y-3 text-xs text-muted-foreground leading-relaxed">
          <p>
            Prueba nuestras prendas con <strong className="text-foreground">Realidad Aumentada</strong> directamente desde la cámara de tu móvil o laptop. Visualiza la caída, el largo y la silueta antes de comprar.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
            <div className="p-3 rounded-2xl bg-muted/40 border border-border/40 space-y-1">
              <div className="flex items-center gap-1.5 font-bold text-foreground">
                <CheckCircle2 className="h-3.5 w-3.5 text-primary" />
                <span>Detección Corporal en Vivo</span>
              </div>
              <p className="text-[11px]">Calcula tu talla recomendada según tu estatura y postura.</p>
            </div>

            <div className="p-3 rounded-2xl bg-muted/40 border border-border/40 space-y-1">
              <div className="flex items-center gap-1.5 font-bold text-foreground">
                <CheckCircle2 className="h-3.5 w-3.5 text-primary" />
                <span>Probador Físico Conectado</span>
              </div>
              <p className="text-[11px]">Reserva prendas en probador para retiro express en sucursal.</p>
            </div>
          </div>
        </div>

        {/* Acciones: Descargar App o Probar en Web */}
        <div className="pt-2 flex flex-col sm:flex-row gap-2.5">
          <a
            href="#probador-ar"
            onClick={onClose}
            className="flex-1 h-11 px-4 rounded-full bg-primary text-primary-foreground font-bold text-xs flex items-center justify-center gap-2 shadow-md hover:bg-primary/90 transition-all"
          >
            <Camera className="h-4 w-4" />
            <span>Probar en Web Ahora</span>
          </a>

          <button
            type="button"
            onClick={() => {
              alert('App Móvil Boutique Kitty disponible para Android en tienda oficial.');
              onClose();
            }}
            className="flex-1 h-11 px-4 rounded-full border border-border bg-muted/60 hover:bg-muted text-foreground font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            <Smartphone className="h-4 w-4 text-primary" />
            <span>Descargar Nuestra App</span>
            <Download className="h-3.5 w-3.5 opacity-60" />
          </button>
        </div>
      </div>
    </div>
  );
}
