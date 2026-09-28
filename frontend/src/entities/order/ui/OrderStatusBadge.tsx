import { Badge } from '@/shared/ui/Badge';
import type { OrderStatus, PaymentStatus } from '@/shared/types/api';

interface OrderStatusBadgeProps {
  status: OrderStatus | string;
}

export function OrderStatusBadge({ status }: OrderStatusBadgeProps) {
  switch (status) {
    case 'PAID':
    case 'DELIVERED':
      return <Badge variant="success">Completado</Badge>;
    case 'PENDING':
      return <Badge variant="warning">Pendiente</Badge>;
    case 'CANCELLED':
      return <Badge variant="destructive">Cancelado</Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
}

export function PaymentStatusBadge({ status }: { status: PaymentStatus | string }) {
  switch (status) {
    case 'SUCCESS':
      return <Badge variant="success">Pagado</Badge>;
    case 'PENDING':
      return <Badge variant="warning">Por Pagar</Badge>;
    case 'FAILED':
      return <Badge variant="destructive">Fallido</Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
}
