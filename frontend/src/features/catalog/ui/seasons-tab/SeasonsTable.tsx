import { Plus, Calendar, Edit2, Trash2 } from 'lucide-react';
import type { Season } from '@/shared/types/api';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/shared/ui/Card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/shared/ui/Table';
import { Button } from '@/shared/ui/Button';
import { Badge } from '@/shared/ui/Badge';
import { Can } from '@/shared/lib/rbac/Can';
import { formatDate } from '@/shared/lib/utils';

interface SeasonsTableProps {
  seasons: Season[];
  isLoading: boolean;
  onNewSeason: () => void;
  onEditSeason: (season: Season) => void;
  onDeleteSeason: (season: Season) => void;
}

export function SeasonsTable({
  seasons,
  isLoading,
  onNewSeason,
  onEditSeason,
  onDeleteSeason,
}: SeasonsTableProps) {
  return (
    <Card className="shadow-xs border-border">
      <CardHeader className="pb-3">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <CardTitle className="text-base flex items-center gap-2">
              <Calendar className="h-4 w-4 text-primary" />
              <span>Temporadas de Moda</span>
            </CardTitle>
            <CardDescription className="text-xs">
              Ciclos estacionales de diseño textil (Primavera-Verano, Otoño-Invierno, Cápsulas)
            </CardDescription>
          </div>
          <Can permission="PRODUCT:CREATE">
            <Button onClick={onNewSeason} size="sm" className="gap-1.5 shadow-xs">
              <Plus className="h-4 w-4" />
              <span>Nueva Temporada</span>
            </Button>
          </Can>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="py-8 text-center text-xs text-muted-foreground animate-pulse">
            Cargando temporadas...
          </div>
        ) : seasons.length === 0 ? (
          <div className="py-8 text-center text-xs text-muted-foreground border rounded-xl bg-muted/20">
            No hay temporadas registradas. ¡Crea una temporada para agrupar prendas!
          </div>
        ) : (
          <div className="rounded-xl border overflow-hidden shadow-xs">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/40 text-xs">
                  <TableHead>Nombre</TableHead>
                  <TableHead>Fecha Inicio</TableHead>
                  <TableHead>Fecha Fin</TableHead>
                  <TableHead>Prendas</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {seasons.map((season) => {
                  const count = season._count?.products ?? 0;
                  return (
                    <TableRow key={season.id} className="hover:bg-muted/30 transition-colors">
                      <TableCell className="font-semibold text-xs text-foreground">
                        {season.name}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {season.startDate ? formatDate(season.startDate) : 'No definida'}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {season.endDate ? formatDate(season.endDate) : 'No definida'}
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
                              title="Editar Temporada"
                              onClick={() => onEditSeason(season)}
                            >
                              <Edit2 className="h-3.5 w-3.5" />
                            </Button>
                          </Can>
                          <Can permission="PRODUCT:UPDATE">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                              title="Eliminar Temporada"
                              onClick={() => onDeleteSeason(season)}
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
