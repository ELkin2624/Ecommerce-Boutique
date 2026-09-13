import { Warehouse, Store, Plus } from 'lucide-react';
import type { LocationType } from '@/shared/types/api';
import type { EnrichedLocation } from '../../model/types';
import { Card } from '@/shared/ui/Card';
import { Button } from '@/shared/ui/Button';
import { Badge } from '@/shared/ui/Badge';
import { Table, TableHeader, TableBody, TableRow, TableHead } from '@/shared/ui/Table';
import { LocationTableRow } from './LocationTableRow';
import { LocationCard } from './LocationCard';

interface LocationsTableProps {
  type: LocationType;
  locations: EnrichedLocation[];
  isLoading: boolean;
  onAddNew: () => void;
  onEdit: (loc: EnrichedLocation) => void;
  onDelete: (loc: EnrichedLocation) => void;
  onUnassign?: (loc: EnrichedLocation) => void;
  isUnassigning?: boolean;
}

export function LocationsTable({
  type,
  locations,
  isLoading,
  onAddNew,
  onEdit,
  onDelete,
  onUnassign,
  isUnassigning,
}: LocationsTableProps) {
  const isWarehouse = type === 'WAREHOUSE';
  const title = isWarehouse ? 'Almacenes y Depósitos Físicos' : 'Puntos de Venta (Piso / POS)';
  const description = isWarehouse
    ? 'Espacios interiores para recepción de pedidos, resguardo de cajas y sobrestock de mercadería.'
    : 'Mostradores comerciales y pisos de venta donde se exhiben prendas y atienden cajeros del POS.';

  if (isLoading) {
    return (
      <Card className="shadow-sm">
        <div className="py-16 text-center text-sm text-muted-foreground animate-pulse">
          Cargando {isWarehouse ? 'almacenes' : 'puntos de venta'}...
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-3.5 rounded-xl border bg-card/60 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <div
            className={`p-2.5 rounded-xl ${
              isWarehouse
                ? 'bg-amber-100 dark:bg-amber-950/40 text-amber-600 border border-amber-200 dark:border-amber-800/40'
                : 'bg-emerald-100 dark:bg-emerald-950/40 text-emerald-600 border border-emerald-200 dark:border-emerald-800/40'
            }`}
          >
            {isWarehouse ? <Warehouse className="h-5 w-5" /> : <Store className="h-5 w-5" />}
          </div>
          <div>
            <h2 className="text-sm font-bold text-foreground flex items-center gap-2">
              <span>{title}</span>
              <Badge variant="outline" className="text-[10px] font-mono">
                {locations.length} {locations.length === 1 ? 'ubicación' : 'ubicaciones'}
              </Badge>
            </h2>
            <p className="text-xs text-muted-foreground">{description}</p>
          </div>
        </div>

        <Button onClick={onAddNew} size="sm" className="gap-1.5 self-start sm:self-auto shadow-sm">
          <Plus className="h-4 w-4" />
          <span>{isWarehouse ? 'Nuevo Almacén' : 'Nuevo Punto POS'}</span>
        </Button>
      </div>

      {locations.length === 0 ? (
        <Card className="shadow-sm">
          <div className="py-16 text-center text-sm text-muted-foreground px-4">
            {isWarehouse ? (
              <Warehouse className="h-10 w-10 text-muted-foreground/40 mx-auto mb-3" />
            ) : (
              <Store className="h-10 w-10 text-muted-foreground/40 mx-auto mb-3" />
            )}
            <p className="font-semibold text-foreground">
              No se encontraron {isWarehouse ? 'almacenes' : 'puntos de venta'}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Prueba cambiando la ciudad o sucursal seleccionada en los filtros.
            </p>
          </div>
        </Card>
      ) : (
        <>
          {/* DESKTOP VIEW */}
          <div className="hidden md:block">
            <Card className="shadow-sm overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/40 hover:bg-muted/40">
                    <TableHead className="w-[280px]">
                      {isWarehouse ? 'Nombre del Almacén' : 'Piso de Venta / Mostrador'}
                    </TableHead>
                    <TableHead>{isWarehouse ? 'Sucursal Base y Vinculadas' : 'Sucursal Asignada'}</TableHead>
                    <TableHead>Ciudad</TableHead>
                    <TableHead>Existencias Registradas</TableHead>
                    <TableHead className="text-right">Inventario</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {locations.map((loc) => (
                    <LocationTableRow
                      key={loc.id}
                      location={loc}
                      type={type}
                      onEdit={onEdit}
                      onDelete={onDelete}
                      onUnassign={onUnassign}
                      isUnassigning={isUnassigning}
                    />
                  ))}
                </TableBody>
              </Table>
            </Card>
          </div>

          {/* MOBILE VIEW */}
          <div className="grid gap-3 sm:grid-cols-2 md:hidden">
            {locations.map((loc) => (
              <LocationCard
                key={loc.id}
                location={loc}
                type={type}
                onEdit={onEdit}
                onDelete={onDelete}
                onUnassign={onUnassign}
                isUnassigning={isUnassigning}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
