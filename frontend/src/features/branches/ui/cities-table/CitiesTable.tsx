import { MapPin, Building2, Plus, Edit2, Trash2 } from 'lucide-react';
import type { City } from '@/shared/types/api';
import { Card, CardContent } from '@/shared/ui/Card';
import { Button } from '@/shared/ui/Button';
import { Badge } from '@/shared/ui/Badge';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/shared/ui/Table';

interface CitiesTableProps {
  cities: City[];
  isLoading: boolean;
  onAddNew: () => void;
  onEdit: (city: City) => void;
  onDelete: (city: City) => void;
  onViewBranchesForCity?: (cityName: string) => void;
}

export function CitiesTable({
  cities,
  isLoading,
  onAddNew,
  onEdit,
  onDelete,
  onViewBranchesForCity,
}: CitiesTableProps) {
  if (isLoading) {
    return (
      <Card className="shadow-sm">
        <div className="py-16 text-center text-sm text-muted-foreground animate-pulse">
          Cargando listado de ciudades...
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-3.5 rounded-xl border bg-card/60 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-primary/10 text-primary border border-primary/20">
            <MapPin className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-foreground flex items-center gap-2">
              <span>Ciudades y Regiones</span>
              <Badge variant="outline" className="text-[10px] font-mono">
                {cities.length} {cities.length === 1 ? 'ciudad' : 'ciudades'}
              </Badge>
            </h2>
            <p className="text-xs text-muted-foreground">
              Zonas geográficas donde operan las sucursales, almacenes y puntos de venta de la empresa
            </p>
          </div>
        </div>

        <Button onClick={onAddNew} size="sm" className="gap-1.5 self-start sm:self-auto shadow-sm">
          <Plus className="h-4 w-4" />
          <span>Nueva Ciudad</span>
        </Button>
      </div>

      {cities.length === 0 ? (
        <Card className="shadow-sm">
          <div className="py-16 text-center text-sm text-muted-foreground px-4">
            <MapPin className="h-10 w-10 text-muted-foreground/40 mx-auto mb-3" />
            <p className="font-semibold text-foreground">No se encontraron ciudades</p>
            <p className="text-xs text-muted-foreground mt-1">
              Registra una nueva ciudad para comenzar a asignar sucursales.
            </p>
          </div>
        </Card>
      ) : (
        <>
          {/* DESKTOP TABLE */}
          <div className="hidden md:block">
            <Card className="shadow-sm overflow-hidden border border-border/80">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/40 hover:bg-muted/40">
                    <TableHead className="w-[250px]">Nombre de la Ciudad</TableHead>
                    <TableHead>Sucursales en esta Ciudad</TableHead>
                    <TableHead className="w-[180px]">Total Sucursales</TableHead>
                    <TableHead className="text-right pr-4 w-[120px]">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {cities.map((city) => {
                    const activeBranches = city.branches || [];
                    const count = city._count?.branches ?? activeBranches.length;

                    return (
                      <TableRow key={city.id} className="hover:bg-muted/30 transition-colors group">
                        {/* Ciudad */}
                        <TableCell>
                          <div className="flex items-center gap-2.5">
                            <div className="p-2 rounded-xl bg-primary/10 text-primary border border-primary/20 shrink-0 group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                              <MapPin className="h-4 w-4" />
                            </div>
                            <div>
                              <span className="font-bold text-sm text-foreground">{city.name}</span>
                              <div className="text-[10px] text-muted-foreground font-mono">
                                ID: {city.id.slice(0, 8)}
                              </div>
                            </div>
                          </div>
                        </TableCell>

                        {/* Sucursales asociadas */}
                        <TableCell>
                          {activeBranches.length > 0 ? (
                            <div className="flex flex-wrap gap-1.5 items-center">
                              {activeBranches.map((b) => (
                                <Badge
                                  key={b.id}
                                  variant="outline"
                                  className="text-[11px] font-medium bg-muted/50 border-border/70 flex items-center gap-1"
                                >
                                  <Building2 className="h-3 w-3 text-primary" />
                                  <span>{b.name}</span>
                                </Badge>
                              ))}
                            </div>
                          ) : (
                            <span className="text-xs text-muted-foreground/60 italic">
                              Sin sucursales asignadas
                            </span>
                          )}
                        </TableCell>

                        {/* Total */}
                        <TableCell>
                          <button
                            type="button"
                            onClick={() => onViewBranchesForCity?.(city.name)}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold text-primary bg-primary/5 border border-primary/20 hover:bg-primary/10 transition-colors"
                            title="Filtrar sucursales de esta ciudad"
                          >
                            <Building2 className="h-3.5 w-3.5" />
                            <span>{count} {count === 1 ? 'sucursal' : 'sucursales'}</span>
                          </button>
                        </TableCell>

                        {/* Acciones */}
                        <TableCell className="text-right pr-4">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              type="button"
                              onClick={() => onEdit(city)}
                              className="h-8 w-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors shadow-2xs"
                              title="Editar nombre de la ciudad"
                            >
                              <Edit2 className="h-3.5 w-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => onDelete(city)}
                              className="h-8 w-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors shadow-2xs"
                              title={
                                count > 0
                                  ? 'No se puede eliminar porque tiene sucursales activas'
                                  : 'Eliminar ciudad'
                              }
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </Card>
          </div>

          {/* MOBILE CARDS */}
          <div className="grid gap-3 sm:grid-cols-2 md:hidden">
            {cities.map((city) => {
              const activeBranches = city.branches || [];
              const count = city._count?.branches ?? activeBranches.length;

              return (
                <Card key={city.id} className="shadow-sm flex flex-col justify-between">
                  <CardContent className="p-4 space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <div className="p-2 rounded-xl bg-primary/10 text-primary border border-primary/20 shrink-0">
                          <MapPin className="h-4 w-4" />
                        </div>
                        <div>
                          <div className="font-bold text-base text-foreground">{city.name}</div>
                          <Badge variant="outline" className="text-[10px] mt-0.5">
                            {count} {count === 1 ? 'sucursal' : 'sucursales'}
                          </Badge>
                        </div>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => onEdit(city)}
                          className="h-7 w-7 rounded-md flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted"
                          title="Editar"
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => onDelete(city)}
                          className="h-7 w-7 rounded-md flex items-center justify-center text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                          title="Eliminar"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>

                    {activeBranches.length > 0 && (
                      <div className="bg-muted/40 p-2.5 rounded-lg space-y-1.5 text-xs">
                        <div className="text-[10px] text-muted-foreground font-semibold uppercase">
                          Sucursales en {city.name}
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {activeBranches.map((b) => (
                            <span
                              key={b.id}
                              className="text-[11px] px-2 py-0.5 rounded bg-background border text-foreground"
                            >
                              {b.name}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
