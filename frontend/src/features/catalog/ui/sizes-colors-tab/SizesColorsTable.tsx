import { Palette, Ruler } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/shared/ui/Card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/shared/ui/Table';
import { Badge } from '@/shared/ui/Badge';
import { COLOR_PRESETS, SIZES_GUIDE } from '../../model/catalog-constants';

export function SizesColorsTable() {
  return (
    <div className="space-y-6">
      {/* Guía de Tallas Estándar */}
      <Card className="shadow-xs border-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Ruler className="h-4 w-4 text-primary" />
            <span>Guía Oficial de Tallas y Medidas Anatómicas</span>
          </CardTitle>
          <CardDescription className="text-xs">
            Tabla de referencia estándar utilizada por el módulo de IA (MediaPipe / Fitting) para sugerencia de tallas
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-xl border overflow-hidden shadow-xs">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/40 text-xs">
                  <TableHead>Talla</TableHead>
                  <TableHead>Categoría de Prenda</TableHead>
                  <TableHead>Contorno Pecho / Busto</TableHead>
                  <TableHead>Contorno Cintura</TableHead>
                  <TableHead>Contorno Cadera</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {SIZES_GUIDE.map((row) => (
                  <TableRow key={`${row.size}-${row.category}`} className="hover:bg-muted/30 transition-colors">
                    <TableCell>
                      <Badge variant="secondary" className="font-bold text-xs font-mono">
                        {row.size}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs text-foreground font-medium">
                      {row.category}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground font-mono">
                      {row.chest}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground font-mono">
                      {row.waist}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground font-mono">
                      {row.hips}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Paleta de Colores de Temporada */}
      <Card className="shadow-xs border-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Palette className="h-4 w-4 text-primary" />
            <span>Carta de Colores y Swatches E-Commerce</span>
          </CardTitle>
          <CardDescription className="text-xs">
            Paleta cromática oficial disponible para variantes de catálogo (estilo Nike / Adidas)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-3">
            {COLOR_PRESETS.map((color) => (
              <div
                key={color.name}
                className="flex items-center gap-2.5 p-2.5 rounded-xl border bg-card hover:border-primary/50 transition-colors shadow-2xs"
              >
                <div
                  className="w-7 h-7 rounded-full border border-black/15 dark:border-white/20 shadow-xs shrink-0"
                  style={{ backgroundColor: color.hex }}
                />
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-semibold text-foreground truncate">{color.name}</div>
                  <div className="text-[10px] font-mono text-muted-foreground">{color.hex}</div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
