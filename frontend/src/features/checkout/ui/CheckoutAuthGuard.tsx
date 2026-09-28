import { Link } from 'react-router-dom';
import { Lock } from 'lucide-react';
import { Button } from '@/shared/ui/Button';

export function CheckoutAuthGuard() {
  return (
    <div className="max-w-xl mx-auto px-4 py-16 text-center space-y-6">
      <div className="h-16 w-16 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto">
        <Lock className="h-8 w-8" />
      </div>
      <div className="space-y-2">
        <h2 className="text-2xl font-bold font-serif text-foreground">
          Inicia sesión para completar tu compra
        </h2>
        <p className="text-xs sm:text-sm text-muted-foreground">
          Necesitas una cuenta de cliente para poder asociar tu pedido y brindarte seguimiento en tiempo real.
        </p>
      </div>
      <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
        <Link to="/login" state={{ from: { pathname: '/checkout' } }}>
          <Button size="lg" className="w-full sm:w-auto font-semibold">
            Iniciar Sesión / Registrarme
          </Button>
        </Link>
        <Link to="/cart">
          <Button variant="outline" size="lg" className="w-full sm:w-auto">
            Volver a la Bolsa
          </Button>
        </Link>
      </div>
    </div>
  );
}
