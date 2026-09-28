import { Building2, Truck } from 'lucide-react';
import type { Branch } from '@/shared/types/api';

interface CheckoutDeliverySectionProps {
  branches: Branch[];
  selectedBranchId: string;
  onSelectBranchId: (id: string) => void;
  deliveryType: 'PICKUP' | 'SHIPPING';
  onChangeDeliveryType: (type: 'PICKUP' | 'SHIPPING') => void;
  shippingAddress: string;
  onChangeShippingAddress: (addr: string) => void;
}

export function CheckoutDeliverySection({
  branches,
  selectedBranchId,
  onSelectBranchId,
  deliveryType,
  onChangeDeliveryType,
  shippingAddress,
  onChangeShippingAddress,
}: CheckoutDeliverySectionProps) {
  return (
    <div className="rounded-2xl border border-border bg-card p-6 shadow-sm space-y-4">
      <h3 className="text-base font-bold text-foreground">2. Sucursal y Modalidad</h3>

      <div className="grid grid-cols-2 gap-3">
        <button
          type="button"
          onClick={() => onChangeDeliveryType('PICKUP')}
          className={`p-4 rounded-xl border text-left transition-all ${
            deliveryType === 'PICKUP'
              ? 'border-primary bg-primary/10 text-primary ring-1 ring-primary'
              : 'border-border bg-background hover:bg-muted text-foreground'
          }`}
        >
          <Building2 className="h-5 w-5 mb-2" />
          <div className="font-semibold text-xs sm:text-sm">Retiro en Sucursal</div>
          <div className="text-[11px] opacity-70">Gratis · Retiro Express</div>
        </button>

        <button
          type="button"
          onClick={() => onChangeDeliveryType('SHIPPING')}
          className={`p-4 rounded-xl border text-left transition-all ${
            deliveryType === 'SHIPPING'
              ? 'border-primary bg-primary/10 text-primary ring-1 ring-primary'
              : 'border-border bg-background hover:bg-muted text-foreground'
          }`}
        >
          <Truck className="h-5 w-5 mb-2" />
          <div className="font-semibold text-xs sm:text-sm">Envío a Domicilio</div>
          <div className="text-[11px] opacity-70">Despacho asegurado</div>
        </button>
      </div>

      <div className="space-y-1.5 pt-2">
        <label className="text-xs font-semibold text-foreground">
          {deliveryType === 'PICKUP' ? 'Sucursal de Retiro' : 'Sucursal de Despacho'}
        </label>
        <select
          value={selectedBranchId}
          onChange={(e) => onSelectBranchId(e.target.value)}
          className="flex h-10 w-full rounded-lg border border-input bg-background px-3 py-1 text-xs font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:border-primary"
        >
          {branches.map((b) => (
            <option key={b.id} value={b.id}>
              {b.name} — {b.city?.name || 'Santa Cruz'} ({b.address || 'Central'})
            </option>
          ))}
        </select>
      </div>

      {deliveryType === 'SHIPPING' && (
        <div className="space-y-1.5 pt-2 animate-in fade-in-50 duration-200">
          <label className="text-xs font-semibold text-foreground">Dirección de Entrega</label>
          <input
            type="text"
            placeholder="Av. Principal, Edificio, Número de casa..."
            value={shippingAddress}
            onChange={(e) => onChangeShippingAddress(e.target.value)}
            className="flex h-10 w-full rounded-lg border border-input bg-background px-3 py-1 text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:border-primary"
          />
        </div>
      )}
    </div>
  );
}
