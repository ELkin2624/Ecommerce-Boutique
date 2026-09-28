import { Link } from 'react-router-dom';
import { ShoppingBag } from 'lucide-react';
import { Button } from '@/shared/ui/Button';

export function CartEmptyState() {
  return (
    <div className="py-24 text-center space-y-6 border border-border/40 bg-muted/10">
      <div className="h-16 w-16 mx-auto flex items-center justify-center text-muted-foreground border border-border/60">
        <ShoppingBag className="h-7 w-7" />
      </div>

      <div className="space-y-2 max-w-sm mx-auto px-4">
        <h2 className="text-xl font-light font-serif uppercase tracking-wider text-foreground">
          Tu Bolsa está Vacía
        </h2>
        <p className="text-xs text-muted-foreground leading-relaxed">
          Aún no has seleccionado ninguna prenda. Explora nuestras colecciones exclusivas de temporada y descubre tu próximo estilo.
        </p>
      </div>

      <Link to="/" className="inline-block">
        <Button
          size="lg"
          className="rounded-none bg-foreground text-background hover:bg-foreground/90 font-mono uppercase tracking-[0.2em] text-xs font-bold px-8 shadow-none"
        >
          <span>Explorar Colección</span>
        </Button>
      </Link>
    </div>
  );
}
