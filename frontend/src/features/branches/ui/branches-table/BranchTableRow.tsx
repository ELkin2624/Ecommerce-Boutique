import { useState, useRef, useEffect } from 'react';
import {
  Building2, MapPin, Phone, Edit2, Plus, Store, Warehouse, ShoppingBag,
  CalendarCheck, Trash2, ChevronRight, ChevronDown, Share2,
} from 'lucide-react';
import type { Branch } from '@/shared/types/api';
import { Badge } from '@/shared/ui/Badge';
import { TableRow, TableCell } from '@/shared/ui/Table';

interface BranchTableRowProps {
  branch: Branch;
  onEdit: (b: Branch) => void;
  onDelete: (b: Branch) => void;
  onAddLocation: (b: Branch, type?: 'WAREHOUSE' | 'SALES_FLOOR') => void;
  onAssignWarehouse: (b: Branch) => void;
  onViewLocations?: (branchId: string, type: 'WAREHOUSE' | 'SALES_FLOOR') => void;
}

export function BranchTableRow({
  branch: b,
  onEdit,
  onDelete,
  onAddLocation,
  onAssignWarehouse,
  onViewLocations,
}: BranchTableRowProps) {
  const [isAddMenuOpen, setIsAddMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const salesFloorCount = b.locations?.filter((l) => l.type === 'SALES_FLOOR').length ?? 0;
  const warehouseCount =
    (b.locations?.filter((l) => l.type === 'WAREHOUSE').length ?? 0) + (b.sharedWarehouses?.length ?? 0);

  // Cerrar el menú de acciones al hacer clic fuera
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsAddMenuOpen(false);
      }
    }
    if (isAddMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isAddMenuOpen]);

  return (
    <TableRow className="hover:bg-muted/30 transition-colors group">
      {/* 1. Nombre de la Sucursal (Separado) */}
      <TableCell className="font-medium">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-primary/10 text-primary border border-primary/20 shrink-0 group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
            <Building2 className="h-4 w-4" />
          </div>
          <div>
            <div
              className="font-bold text-sm text-foreground hover:text-primary transition-colors cursor-pointer"
              onClick={() => onEdit(b)}
              title="Clic para editar sucursal"
            >
              {b.name}
            </div>
            <div className="text-[10px] text-muted-foreground/80 font-mono">
              Sede Operativa
            </div>
          </div>
        </div>
      </TableCell>

      {/* 2. Dirección Física (Columna Independiente) */}
      <TableCell>
        <div className="flex items-center gap-1.5 text-xs text-foreground/80 max-w-[230px]" title={b.address}>
          <MapPin className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
          <span className="truncate">{b.address}</span>
        </div>
      </TableCell>

      {/* 3. Ciudad */}
      <TableCell>
        <Badge
          variant="outline"
          className="text-[11px] font-semibold text-primary border-primary/30 bg-primary/5 px-2 py-0.5"
        >
          {b.city?.name || 'Sin Ciudad'}
        </Badge>
      </TableCell>

      {/* 4. Teléfono */}
      <TableCell>
        {b.phone ? (
          <div className="text-xs font-mono text-muted-foreground flex items-center gap-1.5">
            <Phone className="h-3 w-3 text-muted-foreground/70" />
            <span>{b.phone}</span>
          </div>
        ) : (
          <span className="text-xs text-muted-foreground/50 italic">—</span>
        )}
      </TableCell>

      {/* 5. Pisos de Venta (POS) */}
      <TableCell>
        <button
          type="button"
          onClick={() => onViewLocations?.(b.id, 'SALES_FLOOR')}
          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold text-emerald-700 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200/80 dark:border-emerald-800/50 hover:bg-emerald-100 hover:shadow-2xs transition-all"
          title="Filtrar y ver los mostradores POS de esta sucursal"
        >
          <Store className="h-3.5 w-3.5 text-emerald-600" />
          <span>{salesFloorCount} POS</span>
          <ChevronRight className="h-3 w-3 text-emerald-500 opacity-60" />
        </button>
      </TableCell>

      {/* 6. Almacenes */}
      <TableCell>
        <button
          type="button"
          onClick={() => onViewLocations?.(b.id, 'WAREHOUSE')}
          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold text-amber-700 bg-amber-50 dark:bg-amber-950/40 border border-amber-200/80 dark:border-amber-800/50 hover:bg-amber-100 hover:shadow-2xs transition-all"
          title="Filtrar y ver los almacenes asignados o compartidos"
        >
          <Warehouse className="h-3.5 w-3.5 text-amber-600" />
          <span>{warehouseCount} Almacenes</span>
          <ChevronRight className="h-3 w-3 text-amber-500 opacity-60" />
        </button>
      </TableCell>

      {/* 7. Actividad Comercial */}
      <TableCell>
        <div className="flex items-center gap-2.5 text-xs text-muted-foreground">
          <span className="flex items-center gap-1 bg-muted/40 px-1.5 py-0.5 rounded-md" title="Reservas">
            <CalendarCheck className="h-3 w-3 text-primary" />
            <span className="font-semibold text-foreground">{b._count?.reservations ?? 0}</span>
          </span>
          <span className="flex items-center gap-1 bg-muted/40 px-1.5 py-0.5 rounded-md" title="Ventas completadas">
            <ShoppingBag className="h-3 w-3 text-emerald-600" />
            <span className="font-semibold text-foreground">{b._count?.orders ?? 0}</span>
          </span>
        </div>
      </TableCell>

      {/* 8. Acciones Modernas y Estéticas */}
      <TableCell className="text-right pr-4">
        <div className="flex items-center justify-end gap-1.5">
          {/* Botón con Desplegable Flotante "+ Agregar" */}
          <div className="relative" ref={menuRef}>
            <button
              type="button"
              onClick={() => setIsAddMenuOpen((prev) => !prev)}
              className="inline-flex items-center gap-1.5 h-8 px-2.5 rounded-lg text-xs font-semibold bg-primary/10 hover:bg-primary/20 text-primary border border-primary/25 hover:border-primary/40 shadow-2xs transition-all"
              title="Opciones de adición para esta sucursal"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Agregar</span>
              <ChevronDown
                className={`h-3 w-3 opacity-70 transition-transform duration-200 ${
                  isAddMenuOpen ? 'rotate-180' : ''
                }`}
              />
            </button>

            {/* Menú Flotante Glassmorphism */}
            {isAddMenuOpen && (
              <div className="absolute right-0 top-full mt-1.5 z-40 w-56 p-1.5 rounded-xl border border-border/80 bg-popover/95 text-popover-foreground shadow-xl backdrop-blur-md animate-in fade-in-50 zoom-in-95">
                <div className="px-2 py-1 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                  Acciones para {b.name}
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setIsAddMenuOpen(false);
                    onAddLocation(b, 'SALES_FLOOR');
                  }}
                  className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-xs font-medium text-foreground hover:bg-emerald-50 hover:text-emerald-700 dark:hover:bg-emerald-950/40 transition-colors text-left"
                >
                  <div className="p-1 rounded-md bg-emerald-100 text-emerald-600 dark:bg-emerald-900/50">
                    <Store className="h-3.5 w-3.5" />
                  </div>
                  <div>
                    <div className="font-semibold leading-tight">Nuevo Punto POS</div>
                    <div className="text-[10px] text-muted-foreground">Piso de venta o mostrador</div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setIsAddMenuOpen(false);
                    onAddLocation(b, 'WAREHOUSE');
                  }}
                  className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-xs font-medium text-foreground hover:bg-amber-50 hover:text-amber-700 dark:hover:bg-amber-950/40 transition-colors text-left"
                >
                  <div className="p-1 rounded-md bg-amber-100 text-amber-600 dark:bg-amber-900/50">
                    <Warehouse className="h-3.5 w-3.5" />
                  </div>
                  <div>
                    <div className="font-semibold leading-tight">Nuevo Almacén</div>
                    <div className="text-[10px] text-muted-foreground">Depósito interno propio</div>
                  </div>
                </button>

                <div className="my-1 border-t border-border/50" />

                <button
                  type="button"
                  onClick={() => {
                    setIsAddMenuOpen(false);
                    onAssignWarehouse(b);
                  }}
                  className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-xs font-medium text-foreground hover:bg-blue-50 hover:text-blue-700 dark:hover:bg-blue-950/40 transition-colors text-left"
                >
                  <div className="p-1 rounded-md bg-blue-100 text-blue-600 dark:bg-blue-900/50">
                    <Share2 className="h-3.5 w-3.5" />
                  </div>
                  <div>
                    <div className="font-semibold leading-tight">Compartir Almacén</div>
                    <div className="text-[10px] text-muted-foreground">Vincular depósito de otra sede</div>
                  </div>
                </button>
              </div>
            )}
          </div>

          {/* Botón Editar */}
          <button
            type="button"
            onClick={() => onEdit(b)}
            className="h-8 w-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-primary hover:bg-primary/10 border border-transparent hover:border-primary/20 transition-all shadow-2xs"
            title="Editar datos de la sucursal"
          >
            <Edit2 className="h-3.5 w-3.5" />
          </button>

          {/* Botón Dar de Baja (Baja Lógica) */}
          <button
            type="button"
            onClick={() => onDelete(b)}
            className="h-8 w-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-destructive hover:bg-destructive/10 border border-transparent hover:border-destructive/20 transition-all shadow-2xs"
            title="Dar de baja sucursal (Baja Lógica)"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </TableCell>
    </TableRow>
  );
}
