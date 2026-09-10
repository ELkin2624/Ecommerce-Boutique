import { Printer, Store } from 'lucide-react';
import { Dialog } from '@/shared/ui/Dialog';
import { Button } from '@/shared/ui/Button';
import { formatCurrency, formatDate } from '@/shared/lib/utils';
import type { Order } from '@/shared/types/api';

interface ReceiptModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  order: Order | null;
}

export function ReceiptModal({ open, onOpenChange, order }: ReceiptModalProps) {
  if (!order) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title="Comprobante de Venta (POS)"
      description="Ticket de venta generado e inventario descontado con éxito"
    >
      <div className="space-y-4">
        {/* Printable Ticket Area */}
        <div className="border border-dashed p-6 rounded-lg bg-card text-foreground space-y-4 text-xs font-mono">
          <div className="text-center space-y-1 border-b pb-3">
            <div className="flex justify-center mb-1">
              <Store className="h-6 w-6 text-primary" />
            </div>
            <h3 className="font-bold text-sm uppercase tracking-wider">FASHIONSTORE S.R.L.</h3>
            <p className="text-muted-foreground">{order.branchName || order.branch?.name || 'Sucursal Principal'}</p>
            <p className="text-muted-foreground">NIT: 1029384756 • Factura POS</p>
          </div>

          <div className="space-y-1">
            <p><span className="font-bold">N° Pedido:</span> {order.id}</p>
            <p><span className="font-bold">Fecha:</span> {formatDate(order.createdAt)}</p>
            <p><span className="font-bold">Canal:</span> {order.type} (Presencial)</p>
            <p><span className="font-bold">Pago:</span> {order.payments?.[0]?.method || 'CASH'}</p>
          </div>

          {/* Items Table */}
          <table className="w-full border-t border-b py-2 text-left">
            <thead>
              <tr className="border-b">
                <th className="py-1">Cant.</th>
                <th className="py-1">Detalle</th>
                <th className="py-1 text-right">P. Unit</th>
                <th className="py-1 text-right">Subtotal</th>
              </tr>
            </thead>
            <tbody>
              {order.items?.map((it) => (
                <tr key={it.id || it.variantId} className="border-b border-muted/50">
                  <td className="py-1">{it.quantity}x</td>
                  <td className="py-1 truncate max-w-[120px]">{it.productName || it.sku}</td>
                  <td className="py-1 text-right">{formatCurrency(it.unitPrice)}</td>
                  <td className="py-1 text-right">{formatCurrency(it.unitPrice * it.quantity)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Total */}
          <div className="flex justify-between items-center text-sm font-bold pt-1">
            <span>TOTAL PAGADO:</span>
            <span className="text-base text-emerald-600">{formatCurrency(order.total)}</span>
          </div>

          <div className="text-center text-[10px] text-muted-foreground pt-3 border-t">
            ¡Gracias por su compra en FashionStore!
            <br />
            Este documento acredita su compra en caja física.
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-2 pt-2 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cerrar
          </Button>
          <Button onClick={handlePrint} className="gap-2">
            <Printer className="h-4 w-4" />
            <span>Imprimir Ticket</span>
          </Button>
        </div>
      </div>
    </Dialog>
  );
}
