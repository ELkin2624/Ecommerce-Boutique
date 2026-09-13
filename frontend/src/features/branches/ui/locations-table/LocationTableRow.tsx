import { useState, useRef, useEffect } from 'react';
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
  ChevronDown,
  Share2,
  ShieldCheck,
} from 'lucide-react';
import type { LocationType } from '@/shared/types/api';
import type { EnrichedLocation } from '../../model/types';
import { Button } from '@/shared/ui/Button';
import { Badge } from '@/shared/ui/Badge';
import { TableRow, TableCell } from '@/shared/ui/Table';

interface LocationTableRowProps {
  location: EnrichedLocation;
  type: LocationType;
  onEdit: (loc: EnrichedLocation) => void;
  onDelete: (loc: EnrichedLocation) => void;
  onUnassign?: (loc: EnrichedLocation) => void;
  isUnassigning?: boolean;
}

export function LocationTableRow({
  location: loc,
  type,
  onEdit,
  onDelete,
  onUnassign,
  isUnassigning,
}: LocationTableRowProps) {
  const navigate = useNavigate();
  const isWarehouse = type === 'WAREHOUSE';
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const sharedCount = loc.sharedByBranches?.length || 0;

  // Cerrar dropdown al hacer click afuera
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }
    if (isDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isDropdownOpen]);

  return (
    <TableRow className="hover:bg-muted/30 transition-colors">
      {/* Nombre y Tipo */}
      <TableCell>
        <div className="flex items-center gap-2.5">
          <div
            className={`p-2 rounded-xl shrink-0 ${
              isWarehouse
                ? 'bg-amber-50 text-amber-600 border border-amber-200 dark:bg-amber-950/30 dark:border-amber-800/40'
                : 'bg-emerald-50 text-emerald-600 border border-emerald-200 dark:bg-emerald-950/30 dark:border-emerald-800/40'
            }`}
          >
            {isWarehouse ? <Warehouse className="h-4 w-4" /> : <Store className="h-4 w-4" />}
          </div>
          <div>
            <div className="font-bold text-sm text-foreground flex items-center gap-2">
              <span>{loc.name}</span>
              {loc.isShared && (
                <Badge variant="outline" className="text-[9px] h-4 px-1.5 bg-blue-50 text-blue-600 border-blue-200">
                  Compartido
                </Badge>
              )}
            </div>
            <span className="text-[11px] text-muted-foreground">
              {isWarehouse ? 'Depósito Interno' : 'Piso de Venta / Mostrador'}
            </span>
          </div>
        </div>
      </TableCell>

      {/* Sucursal(es) Asignadas / Vinculadas */}
      <TableCell>
        <div className="space-y-1 relative" ref={dropdownRef}>
          {/* Sucursal Base / Propietaria */}
          <div className="flex items-center gap-1.5">
            <Building2 className="h-3.5 w-3.5 text-primary shrink-0" />
            <span className="font-semibold text-xs text-foreground">{loc.branch.name}</span>
            {isWarehouse && (
              <Badge variant="outline" className="text-[9px] h-4 px-1.5 bg-primary/5 text-primary border-primary/20">
                Sede Base
              </Badge>
            )}
          </div>
          <div className="text-[11px] text-muted-foreground flex items-center gap-1 line-clamp-1">
            <MapPin className="h-3 w-3 shrink-0" />
            <span>{loc.branch.address}</span>
          </div>

          {/* Menú Desplegable para Sucursales Compartidas */}
          {isWarehouse && sharedCount > 0 && (
            <div className="pt-1">
              <button
                type="button"
                onClick={() => setIsDropdownOpen((prev) => !prev)}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium bg-blue-50 text-blue-700 border border-blue-200/80 hover:bg-blue-100 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800/60 transition-all shadow-2xs"
              >
                <Share2 className="h-3 w-3 text-blue-600 dark:text-blue-400" />
                <span>+{sharedCount} {sharedCount === 1 ? 'sucursal vinculada' : 'sucursales vinculadas'}</span>
                <ChevronDown className={`h-3 w-3 transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {/* Popover flotante con la lista de sucursales */}
              {isDropdownOpen && (
                <div className="absolute left-0 top-full mt-1 z-30 w-72 p-3 rounded-xl border border-border/80 bg-popover/95 text-popover-foreground shadow-xl backdrop-blur-md animate-in fade-in-50 zoom-in-95">
                  <div className="flex items-center justify-between pb-2 mb-2 border-b border-border/60">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-foreground">
                      <ShieldCheck className="h-3.5 w-3.5 text-blue-600" />
                      <span>Acceso a Inventario</span>
                    </div>
                    <span className="text-[10px] text-muted-foreground">
                      {sharedCount + 1} sucursales total
                    </span>
                  </div>

                  <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                    {/* Sede principal */}
                    <div className="p-1.5 rounded-lg bg-muted/40 border border-border/40">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-foreground">{loc.branch.name}</span>
                        <Badge variant="outline" className="text-[9px] h-3.5 px-1 bg-amber-50 text-amber-700 border-amber-200">
                          Propietaria
                        </Badge>
                      </div>
                      <p className="text-[10px] text-muted-foreground mt-0.5">{loc.branch.city?.name} • {loc.branch.address}</p>
                    </div>

                    {/* Sucursales compartidas */}
                    {loc.sharedByBranches?.map((sb) => (
                      <div key={sb.id} className="p-1.5 rounded-lg bg-blue-50/50 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900/40">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-medium text-foreground">{sb.name}</span>
                          <Badge variant="outline" className="text-[9px] h-3.5 px-1 bg-blue-50 text-blue-600 border-blue-200">
                            Compartida
                          </Badge>
                        </div>
                        <p className="text-[10px] text-muted-foreground mt-0.5">{sb.city?.name || 'Ciudad'} • {sb.address}</p>
                      </div>
                    ))}
                  </div>

                  <div className="pt-2 mt-2 border-t border-border/40 flex justify-end">
                    <button
                      type="button"
                      onClick={() => {
                        setIsDropdownOpen(false);
                        onEdit(loc);
                      }}
                      className="text-[11px] text-primary hover:underline font-medium"
                    >
                      Gestionar accesos...
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </TableCell>

      {/* Ciudad */}
      <TableCell>
        <Badge variant="outline" className="text-[11px] font-semibold text-primary border-primary/40 bg-primary/5">
          {loc.branch.city?.name || 'Sin Ciudad'}
        </Badge>
      </TableCell>

      {/* Existencias */}
      <TableCell>
        <div className="flex items-center gap-2">
          <Boxes className="h-4 w-4 text-muted-foreground" />
          <span className="text-xs font-semibold text-foreground">{loc.stocksCount}</span>
          <span className="text-xs text-muted-foreground">
            {loc.stocksCount === 1 ? 'ítem / variante' : 'ítems / variantes'}
          </span>
        </div>
      </TableCell>

      {/* Acciones */}
      <TableCell className="text-right">
        <div className="flex items-center justify-end gap-1">
          <Button
            variant="ghost"
            size="sm"
            className="h-8 text-xs gap-1.5 text-primary hover:text-primary hover:bg-primary/10"
            onClick={() => navigate('/inventory')}
            title="Consultar existencias en el inventario general"
          >
            <span>Stock</span>
            <ExternalLink className="h-3.5 w-3.5" />
          </Button>

          {loc.isShared ? (
            <Button
              variant="ghost"
              size="sm"
              className="h-8 text-xs text-muted-foreground hover:text-destructive hover:bg-destructive/10"
              onClick={() => onUnassign?.(loc)}
              disabled={isUnassigning}
              title="Remover acceso a este almacén compartido"
            >
              Remover
            </Button>
          ) : (
            <>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
                onClick={() => onEdit(loc)}
                title="Editar almacén y gestionar sucursales vinculadas"
              >
                <Edit2 className="h-3.5 w-3.5" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                onClick={() => onDelete(loc)}
                title="Desactivar ubicación (Baja Lógica)"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </>
          )}
        </div>
      </TableCell>
    </TableRow>
  );
}
