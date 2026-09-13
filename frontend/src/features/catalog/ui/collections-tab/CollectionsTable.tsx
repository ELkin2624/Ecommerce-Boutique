import { Plus, Layers, Edit2, Trash2 } from 'lucide-react';
import type { Collection } from '@/shared/types/api';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/shared/ui/Card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/shared/ui/Table';
import { Button } from '@/shared/ui/Button';
import { Badge } from '@/shared/ui/Badge';
import { Can } from '@/shared/lib/rbac/Can';

interface CollectionsTableProps {
  collections: Collection[];
  isLoading: boolean;
  onNewCollection: () => void;
  onEditCollection: (col: Collection) => void;
  onDeleteCollection: (col: Collection) => void;
}

export function CollectionsTable({
  collections,
  isLoading,
  onNewCollection,
  onEditCollection,
  onDeleteCollection,
}: CollectionsTableProps) {
  return (
    <Card className="shadow-xs border-border">
      <CardHeader className="pb-3">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <CardTitle className="text-base flex items-center gap-2">
              <Layers className="h-4 w-4 text-primary" />
              <span>Colecciones Temáticas</span>
            </CardTitle>
            <CardDescription className="text-xs">
              Líneas exclusivas de prendas con una narrativa o concepto visual unificado
            </CardDescription>
          </div>
          <Can permission="PRODUCT:CREATE">
            <Button onClick={onNewCollection} size="sm" className="gap-1.5 shadow-xs">
              <Plus className="h-4 w-4" />
              <span>Nueva Colección</span>
            </Button>
          </Can>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="py-8 text-center text-xs text-muted-foreground animate-pulse">
            Cargando colecciones...
          </div>
        ) : collections.length === 0 ? (
          <div className="py-8 text-center text-xs text-muted-foreground border rounded-xl bg-muted/20">
            No hay colecciones registradas. ¡Crea una colección para tus prendas!
          </div>
        ) : (
          <div className="rounded-xl border overflow-hidden shadow-xs">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/40 text-xs">
                  <TableHead>Nombre</TableHead>
                  <TableHead>Descripción</TableHead>
                  <TableHead>Prendas</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {collections.map((col) => {
                  const count = col._count?.products ?? 0;
                  return (
                    <TableRow key={col.id} className="hover:bg-muted/30 transition-colors">
                      <TableCell className="font-semibold text-xs text-foreground">
                        {col.name}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground line-clamp-1">
                        {col.description || 'Sin descripción'}
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
                              title="Editar Colección"
                              onClick={() => onEditCollection(col)}
                            >
                              <Edit2 className="h-3.5 w-3.5" />
                            </Button>
                          </Can>
                          <Can permission="PRODUCT:UPDATE">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                              title="Eliminar Colección"
                              onClick={() => onDeleteCollection(col)}
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
