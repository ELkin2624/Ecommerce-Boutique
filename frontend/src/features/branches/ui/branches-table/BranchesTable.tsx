import { Building2 } from 'lucide-react';
import type { Branch } from '@/shared/types/api';
import { Card } from '@/shared/ui/Card';
import { Table, TableHeader, TableBody, TableRow, TableHead } from '@/shared/ui/Table';
import { BranchTableRow } from './BranchTableRow';
import { BranchCard } from './BranchCard';

interface BranchesTableProps {
  branches: Branch[];
  isLoading: boolean;
  onEdit: (branch: Branch) => void;
  onDelete: (branch: Branch) => void;
  onAddLocation: (branch: Branch, type?: 'WAREHOUSE' | 'SALES_FLOOR') => void;
  onAssignWarehouse: (branch: Branch) => void;
  onViewLocations?: (branchId: string, type: 'WAREHOUSE' | 'SALES_FLOOR') => void;
}

export function BranchesTable({
  branches,
  isLoading,
  onEdit,
  onDelete,
  onAddLocation,
  onAssignWarehouse,
  onViewLocations,
}: BranchesTableProps) {
  if (isLoading) {
    return (
      <Card className="shadow-sm">
        <div className="py-16 text-center text-sm text-muted-foreground animate-pulse">
          Cargando listado de sucursales...
        </div>
      </Card>
    );
  }

  if (branches.length === 0) {
    return (
      <Card className="shadow-sm">
        <div className="py-16 text-center text-sm text-muted-foreground px-4">
          <Building2 className="h-10 w-10 text-muted-foreground/50 mx-auto mb-3" />
          <p className="font-semibold text-foreground">No se encontraron sucursales</p>
          <p className="text-xs text-muted-foreground mt-1">
            Prueba ajustando los filtros de búsqueda o registra una nueva sucursal.
          </p>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* DESKTOP TABLE */}
      <div className="hidden md:block">
        <Card className="shadow-sm overflow-hidden border border-border/80">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/40 hover:bg-muted/40">
                <TableHead className="w-[200px]">Nombre de Sucursal</TableHead>
                <TableHead className="w-[230px]">Dirección Física</TableHead>
                <TableHead className="w-[110px]">Ciudad</TableHead>
                <TableHead className="w-[120px]">Teléfono</TableHead>
                <TableHead className="w-[120px]">Puntos POS</TableHead>
                <TableHead className="w-[130px]">Almacenes</TableHead>
                <TableHead className="w-[120px]">Actividad</TableHead>
                <TableHead className="text-right pr-4">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {branches.map((b) => (
                <BranchTableRow
                  key={b.id}
                  branch={b}
                  onEdit={onEdit}
                  onDelete={onDelete}
                  onAddLocation={onAddLocation}
                  onAssignWarehouse={onAssignWarehouse}
                  onViewLocations={onViewLocations}
                />
              ))}
            </TableBody>
          </Table>
        </Card>
      </div>

      {/* MOBILE CARDS */}
      <div className="grid gap-3 sm:grid-cols-2 md:hidden">
        {branches.map((b) => (
          <BranchCard
            key={b.id}
            branch={b}
            onEdit={onEdit}
            onDelete={onDelete}
            onAddLocation={onAddLocation}
            onAssignWarehouse={onAssignWarehouse}
            onViewLocations={onViewLocations}
          />
        ))}
      </div>
    </div>
  );
}
