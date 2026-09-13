import { Plus, Truck, Edit2, Trash2, Mail, Phone, MapPin } from 'lucide-react';
import type { Supplier } from '@/shared/types/api';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/shared/ui/Card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/shared/ui/Table';
import { Button } from '@/shared/ui/Button';
import { Badge } from '@/shared/ui/Badge';
import { Can } from '@/shared/lib/rbac/Can';

interface SuppliersTableProps {
  suppliers: Supplier[];
  isLoading: boolean;
  onNewSupplier: () => void;
  onEditSupplier: (sup: Supplier) => void;
  onDeleteSupplier: (sup: Supplier) => void;
}

export function SuppliersTable({
  suppliers,
  isLoading,
  onNewSupplier,
  onEditSupplier,
  onDeleteSupplier,
}: SuppliersTableProps) {
  return (
    <Card className="shadow-xs border-border">
      <CardHeader className="pb-3">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <CardTitle className="text-base flex items-center gap-2">
              <Truck className="h-4 w-4 text-primary" />
              <span>Proveedores Textiles y Fabricantes</span>
            </CardTitle>
            <CardDescription className="text-xs">
              Fabricantes y distribuidores mayoristas de confección para abastecimiento de prendas
            </CardDescription>
          </div>
          <Can permission="PRODUCT:CREATE">
            <Button onClick={onNewSupplier} size="sm" className="gap-1.5 shadow-xs">
              <Plus className="h-4 w-4" />
              <span>Nuevo Proveedor</span>
            </Button>
          </Can>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="py-8 text-center text-xs text-muted-foreground animate-pulse">
            Cargando proveedores...
          </div>
        ) : suppliers.length === 0 ? (
          <div className="py-8 text-center text-xs text-muted-foreground border rounded-xl bg-muted/20">
            No hay proveedores registrados. ¡Registra tus proveedores de confección!
          </div>
        ) : (
          <div className="rounded-xl border overflow-hidden shadow-xs">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/40 text-xs">
                  <TableHead>Proveedor</TableHead>
                  <TableHead>Contacto</TableHead>
                  <TableHead>Dirección</TableHead>
                  <TableHead>Prendas</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {suppliers.map((sup) => {
                  const count = sup._count?.products ?? 0;
                  return (
                    <TableRow key={sup.id} className="hover:bg-muted/30 transition-colors">
                      <TableCell className="font-semibold text-xs text-foreground">
                        {sup.name}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        <div className="flex flex-col gap-0.5">
                          {sup.contactEmail && (
                            <span className="flex items-center gap-1">
                              <Mail className="h-3 w-3 text-muted-foreground" />
                              {sup.contactEmail}
                            </span>
                          )}
                          {sup.phone && (
                            <span className="flex items-center gap-1">
                              <Phone className="h-3 w-3 text-muted-foreground" />
                              {sup.phone}
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {sup.address ? (
                          <span className="flex items-center gap-1 line-clamp-1">
                            <MapPin className="h-3 w-3 text-muted-foreground shrink-0" />
                            {sup.address}
                          </span>
                        ) : (
                          'No especificada'
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs font-mono font-medium">
                          {count} {count === 1 ? 'prenda' : 'prendas'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Can permission="PRODUCT:UPDATE">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
                              title="Editar Proveedor"
                              onClick={() => onEditSupplier(sup)}
                            >
                              <Edit2 className="h-3.5 w-3.5" />
                            </Button>
                          </Can>
                          <Can permission="PRODUCT:UPDATE">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                              title="Eliminar Proveedor"
                              onClick={() => onDeleteSupplier(sup)}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </Can>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
