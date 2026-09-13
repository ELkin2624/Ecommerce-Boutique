import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Warehouse,
  Store,
  Building2,
  MapPin,
  Boxes,
  ExternalLink,
  Edit2,
  Trash2,
  Share2,
  ChevronDown,
} from 'lucide-react';
import type { LocationType } from '@/shared/types/api';
import type { EnrichedLocation } from '../../model/types';
import { Card, CardContent } from '@/shared/ui/Card';
import { Button } from '@/shared/ui/Button';
import { Badge } from '@/shared/ui/Badge';

interface LocationCardProps {
  location: EnrichedLocation;
  type: LocationType;
  onEdit: (loc: EnrichedLocation) => void;
  onDelete: (loc: EnrichedLocation) => void;
  onUnassign?: (loc: EnrichedLocation) => void;
  isUnassigning?: boolean;
}

export function LocationCard({
  location: loc,
  type,
  onEdit,
  onDelete,
  onUnassign,
  isUnassigning,
}: LocationCardProps) {
  const navigate = useNavigate();
  const isWarehouse = type === 'WAREHOUSE';
  const [showShared, setShowShared] = useState(false);
  const sharedCount = loc.sharedByBranches?.length || 0;

  return (
    <Card className="shadow-sm flex flex-col justify-between hover:border-primary/30 transition-all">
      <CardContent className="p-4 space-y-3">
        {/* Header */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2">
            <div
              className={`p-2 rounded-lg shrink-0 ${
                isWarehouse
                  ? 'bg-amber-50 text-amber-600 border border-amber-200 dark:bg-amber-950/30'
                  : 'bg-emerald-50 text-emerald-600 border border-emerald-200 dark:bg-emerald-950/30'
              }`}
            >
              {isWarehouse ? <Warehouse className="h-4 w-4" /> : <Store className="h-4 w-4" />}
            </div>
            <div>
              <div className="font-bold text-sm text-foreground flex items-center gap-1.5">
                <span>{loc.name}</span>
                {loc.isShared && (
                  <Badge variant="outline" className="text-[9px] h-4 px-1 bg-blue-50 text-blue-600 border-blue-200">
                    Compartido
                  </Badge>
                )}
              </div>
              <Badge variant="outline" className="text-[10px] mt-0.5">
                {isWarehouse ? 'Depósito Interno' : 'Piso de Venta'}
              </Badge>
            </div>
          </div>

          <Badge variant="outline" className="text-[10px] text-primary border-primary/40 font-semibold">
            {loc.branch.city?.name || 'Ciudad'}
          </Badge>
        </div>

        {/* Sede Base Info */}
        <div className="bg-muted/40 p-2.5 rounded-lg space-y-1 text-xs">
          <div className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider flex items-center justify-between">
            <span>{isWarehouse ? 'Sucursal Sede Base' : 'Sucursal Asignada'}</span>
          </div>
          <div className="font-bold text-foreground flex items-center gap-1.5">
            <Building2 className="h-3.5 w-3.5 text-primary shrink-0" />
            <span className="truncate">{loc.branch.name}</span>
          </div>
          <div className="text-muted-foreground text-[11px] flex items-center gap-1 truncate">
            <MapPin className="h-3 w-3 shrink-0" />
            <span>{loc.branch.address}</span>
          </div>
        </div>

        {/* Sucursales Compartidas para Almacén */}
        {isWarehouse && sharedCount > 0 && (
          <div className="space-y-1.5">
            <button
              type="button"
              onClick={() => setShowShared((p) => !p)}
              className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-md text-xs font-medium bg-blue-50/70 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-200/60 transition-all"
            >
              <div className="flex items-center gap-1.5">
                <Share2 className="h-3 w-3 text-blue-600" />
                <span>{sharedCount} {sharedCount === 1 ? 'sucursal vinculada' : 'sucursales vinculadas'}</span>
              </div>
              <ChevronDown className={`h-3 w-3 transition-transform ${showShared ? 'rotate-180' : ''}`} />
            </button>

            {showShared && (
              <div className="space-y-1 p-2 rounded-lg bg-blue-50/30 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/30 text-xs">
                {loc.sharedByBranches?.map((sb) => (
                  <div key={sb.id} className="flex items-center justify-between py-0.5 border-b border-blue-100/50 dark:border-blue-900/20 last:border-0">
                    <span className="font-medium text-foreground text-[11px]">{sb.name}</span>
                    <span className="text-[10px] text-muted-foreground">{sb.city?.name}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Footer & Existencias */}
        <div className="flex items-center justify-between pt-2 border-t text-xs">
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <Boxes className="h-3.5 w-3.5 text-primary" />
            <span className="font-semibold text-foreground">{loc.stocksCount}</span>
            <span>variantes</span>
          </div>

          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs gap-1 text-primary"
              onClick={() => navigate('/inventory')}
            >
              <span>Stock</span>
              <ExternalLink className="h-3 w-3" />
            </Button>
            {loc.isShared ? (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-xs text-muted-foreground hover:text-destructive"
                onClick={() => onUnassign?.(loc)}
                disabled={isUnassigning}
              >
                Remover
              </Button>
            ) : (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
                  onClick={() => onEdit(loc)}
                  title="Editar almacén y accesos"
                >
                  <Edit2 className="h-3.5 w-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
                  onClick={() => onDelete(loc)}
                  title="Desactivar"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
