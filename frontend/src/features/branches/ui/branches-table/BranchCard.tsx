import { useState } from 'react';
import {
  MapPin,
  Phone,
  Edit2,
  Plus,
  Store,
  Warehouse,
  ShoppingBag,
  CalendarCheck,
  Trash2,
  Share2,
  Building2,
  ChevronDown,
} from 'lucide-react';
import type { Branch } from '@/shared/types/api';
import { Card, CardContent } from '@/shared/ui/Card';
import { Button } from '@/shared/ui/Button';
import { Badge } from '@/shared/ui/Badge';

interface BranchCardProps {
  branch: Branch;
  onEdit: (b: Branch) => void;
  onDelete: (b: Branch) => void;
  onAddLocation: (b: Branch, type?: 'WAREHOUSE' | 'SALES_FLOOR') => void;
  onAssignWarehouse: (b: Branch) => void;
  onViewLocations?: (branchId: string, type: 'WAREHOUSE' | 'SALES_FLOOR') => void;
}

export function BranchCard({
  branch: b,
  onEdit,
  onDelete,
  onAddLocation,
  onAssignWarehouse,
  onViewLocations,
}: BranchCardProps) {
  const [showAddMenu, setShowAddMenu] = useState(false);

  const salesFloorCount = b.locations?.filter((l) => l.type === 'SALES_FLOOR').length ?? 0;
  const warehouseCount =
    (b.locations?.filter((l) => l.type === 'WAREHOUSE').length ?? 0) + (b.sharedWarehouses?.length ?? 0);

  return (
    <Card className="shadow-sm flex flex-col justify-between hover:border-primary/30 transition-all">
      <CardContent className="p-4 space-y-3">
        {/* Header */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-primary/10 text-primary border border-primary/20 shrink-0">
              <Building2 className="h-4 w-4" />
            </div>
            <div>
              <div className="font-bold text-base text-foreground leading-tight">{b.name}</div>
              <Badge variant="outline" className="text-[10px] font-semibold text-primary mt-0.5">
                {b.city?.name || 'Sin Ciudad'}
              </Badge>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => onEdit(b)}
              className="h-7 w-7 rounded-md flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              title="Editar"
            >
              <Edit2 className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={() => onDelete(b)}
              className="h-7 w-7 rounded-md flex items-center justify-center text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
              title="Dar de baja"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        {/* Dirección Separada */}
        <div className="bg-muted/40 p-2.5 rounded-lg space-y-1 text-xs">
          <div className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">
            Dirección Física
          </div>
          <div className="text-foreground text-[11px] flex items-center gap-1.5">
            <MapPin className="h-3.5 w-3.5 text-primary shrink-0" />
            <span>{b.address}</span>
          </div>
          {b.phone && (
            <div className="text-muted-foreground text-[11px] flex items-center gap-1.5 pt-0.5 font-mono">
              <Phone className="h-3 w-3 text-muted-foreground/70" />
              <span>{b.phone}</span>
            </div>
          )}
        </div>

        {/* Accesos a Ubicaciones */}
        <div className="flex items-center gap-2 pt-1 text-xs">
          <button
            type="button"
            onClick={() => onViewLocations?.(b.id, 'SALES_FLOOR')}
            className="flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 border border-emerald-200/80 text-xs font-semibold hover:bg-emerald-100 transition-colors"
          >
            <Store className="h-3.5 w-3.5" />
            <span>{salesFloorCount} POS</span>
          </button>

          <button
            type="button"
            onClick={() => onViewLocations?.(b.id, 'WAREHOUSE')}
            className="flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg bg-amber-50 dark:bg-amber-950/40 text-amber-700 border border-amber-200/80 text-xs font-semibold hover:bg-amber-100 transition-colors"
          >
            <Warehouse className="h-3.5 w-3.5" />
            <span>{warehouseCount} Almacenes</span>
          </button>
        </div>

        {/* Menú de Agregar Ubicación (Expandible) */}
        {showAddMenu && (
          <div className="p-2 rounded-lg bg-muted/50 border border-border/70 space-y-1.5 text-xs animate-in fade-in-50">
            <div className="text-[10px] font-bold text-muted-foreground uppercase px-1">Opciones de Ubicación</div>
            <button
              type="button"
              onClick={() => {
                setShowAddMenu(false);
                onAddLocation(b, 'SALES_FLOOR');
              }}
              className="w-full flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-emerald-50 text-foreground hover:text-emerald-700 transition-colors text-left"
            >
              <Store className="h-3.5 w-3.5 text-emerald-600" />
              <span>Nuevo Punto de Venta POS</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setShowAddMenu(false);
                onAddLocation(b, 'WAREHOUSE');
              }}
              className="w-full flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-amber-50 text-foreground hover:text-amber-700 transition-colors text-left"
            >
              <Warehouse className="h-3.5 w-3.5 text-amber-600" />
              <span>Nuevo Almacén Propio</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setShowAddMenu(false);
                onAssignWarehouse(b);
              }}
              className="w-full flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-blue-50 text-foreground hover:text-blue-700 transition-colors text-left"
            >
              <Share2 className="h-3.5 w-3.5 text-blue-600" />
              <span>Compartir Almacén Existente</span>
            </button>
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between pt-2 border-t text-xs">
          <div className="flex items-center gap-2.5 text-xs text-muted-foreground">
            <span className="flex items-center gap-1" title="Reservas">
              <CalendarCheck className="h-3 w-3 text-primary" />
              <span>{b._count?.reservations ?? 0}</span>
            </span>
            <span className="flex items-center gap-1" title="Ventas">
              <ShoppingBag className="h-3 w-3 text-emerald-600" />
              <span>{b._count?.orders ?? 0}</span>
            </span>
          </div>

          <Button
            variant="outline"
            size="sm"
            className="h-7 text-xs gap-1 font-semibold text-primary border-primary/30 hover:bg-primary/10"
            onClick={() => setShowAddMenu((p) => !p)}
          >
            <Plus className="h-3 w-3" />
            <span>Agregar</span>
            <ChevronDown className={`h-3 w-3 transition-transform ${showAddMenu ? 'rotate-180' : ''}`} />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
