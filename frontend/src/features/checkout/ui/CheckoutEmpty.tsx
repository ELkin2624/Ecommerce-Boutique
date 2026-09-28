import { Link } from 'react-router-dom';
import { ShoppingBag } from 'lucide-react';
import { Button } from '@/shared/ui/Button';

export function CheckoutEmpty() {
  return (
    <div className="max-w-md mx-auto px-4 py-16 text-center space-y-4">
      <ShoppingBag className="h-12 w-12 text-muted-foreground mx-auto" />
      <h3 className="font-bold text-lg">No hay prendas para pagar</h3>
      <p className="text-xs text-muted-foreground">Tu bolsa de compras está vacía actualmente.</p>
      <Link to="/">
        <Button variant="outline">Ir a la Tienda</Button>
      </Link>
    </div>
  );
}
