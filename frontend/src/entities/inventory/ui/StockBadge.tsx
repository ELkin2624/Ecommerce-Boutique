import { Badge } from '@/shared/ui/Badge';

interface StockBadgeProps {
  quantity: number;
  minStock?: number;
}

export function StockBadge({ quantity, minStock = 5 }: StockBadgeProps) {
  if (quantity <= 0) {
    return (
      <Badge variant="destructive" className="font-bold">
        Agotado (0)
      </Badge>
    );
  }

  if (quantity <= minStock) {
    return (
      <Badge variant="warning" className="font-semibold">
        Crítico ({quantity})
      </Badge>
    );
  }

  return (
    <Badge variant="success" className="font-semibold">
      {quantity} unid.
    </Badge>
  );
}
