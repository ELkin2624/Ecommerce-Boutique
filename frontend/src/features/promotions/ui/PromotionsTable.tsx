import { useState } from 'react';
import {
  Calendar,
  Copy,
  Check,
  Edit2,
  Trash2,
  Power,
  Tag,
} from 'lucide-react';
import type { Promotion } from '../model/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/shared/ui/Card';
import { Button } from '@/shared/ui/Button';
import { Badge } from '@/shared/ui/Badge';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/shared/ui/Table';
import { Can } from '@/shared/lib/rbac/Can';
import { formatCurrency } from '@/shared/lib/utils';
import { toast } from '@/shared/ui/Toast';

interface PromotionsTableProps {
  promotions: Promotion[];
  isLoading: boolean;
  onEdit: (promo: Promotion) => void;
  onToggleStatus: (promo: Promotion) => void;
  onDelete: (promo: Promotion) => void;
  isStatusPending?: boolean;
}

export function PromotionsTable({
  promotions,
  isLoading,
  onEdit,
  onToggleStatus,
  onDelete,
  isStatusPending = false,
}: PromotionsTableProps) {
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const handleCopy = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    toast.info('Código copiado', `Cupón "${code}" copiado al portapapeles`);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const now = new Date();

  return (
    <Card className="shadow-xs border-border/80">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Tag className="h-4 w-4 text-primary" />
          <span>Listado de Campañas Comerciales ({promotions.length})</span>
        </CardTitle>
        <CardDescription className="text-xs">
          Descuentos aplicables en ventas presenciales en caja (POS) y canal e-commerce web/móvil
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="py-16 text-center space-y-2">
            <div className="animate-spin rounded-full h-7 w-7 border-2 border-primary border-t-transparent mx-auto" />
            <p className="text-xs text-muted-foreground">Cargando promociones y cupones...</p>
          </div>
        ) : promotions.length === 0 ? (
          <div className="py-16 text-center space-y-2">
            <Tag className="h-9 w-9 text-muted-foreground/40 mx-auto" />
            <p className="text-sm font-semibold text-foreground">No se encontraron promociones</p>
            <p className="text-xs text-muted-foreground max-w-sm mx-auto">
              No hay campañas que coincidan con los criterios de búsqueda actuales.
            </p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre / Campaña</TableHead>
                <TableHead>Código Cupón</TableHead>
                <TableHead>Descuento</TableHead>
                <TableHead>Compra Mínima</TableHead>
                <TableHead>Vigencia</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {promotions.map((promo) => {
                const isExpired = new Date(promo.endDate) < now;
                const isUpcoming = new Date(promo.startDate) > now;

                return (
                  <TableRow key={promo.id}>
                    {/* Nombre y descripción */}
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-bold text-sm text-foreground">{promo.name}</span>
                        <span className="text-xs text-muted-foreground line-clamp-1">
                          {promo.description || 'Sin condiciones específicas'}
                        </span>
                      </div>
                    </TableCell>

                    {/* Código con botón de copia rápida */}
                    <TableCell>
                      <button
                        type="button"
                        onClick={() => handleCopy(promo.code)}
                        className="flex items-center gap-1.5 font-mono text-xs font-bold bg-muted/60 hover:bg-muted px-2 py-1 rounded-md border border-border transition-colors text-primary cursor-pointer"
                        title="Clic para copiar cupón"
                      >
                        <span>{promo.code}</span>
                        {copiedCode === promo.code ? (
                          <Check className="h-3 w-3 text-emerald-600" />
                        ) : (
                          <Copy className="h-3 w-3 opacity-60" />
                        )}
                      </button>
                    </TableCell>

                    {/* Descuento */}
                    <TableCell>
                      <Badge
                        variant="secondary"
                        className="font-bold text-xs text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border-emerald-500/20"
                      >
                        {Number(promo.discountPercent)}% OFF
                      </Badge>
                    </TableCell>

                    {/* Compra mínima */}
                    <TableCell className="text-xs text-muted-foreground font-medium">
                      {promo.minPurchaseAmount
                        ? formatCurrency(Number(promo.minPurchaseAmount))
                        : 'Sin requisito'}
                    </TableCell>

                    {/* Rango de fechas */}
                    <TableCell className="text-xs text-muted-foreground">
                      <div className="flex items-center gap-1.5 font-medium">
                        <Calendar className="h-3.5 w-3.5 text-muted-foreground/70" />
                        <span>
                          {new Date(promo.startDate).toLocaleDateString('es-BO', {
                            day: 'numeric',
                            month: 'short',
                          })}{' '}
                          -{' '}
                          {new Date(promo.endDate).toLocaleDateString('es-BO', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </span>
                      </div>
                    </TableCell>

                    {/* Estado */}
                    <TableCell>
                      {isExpired ? (
                        <Badge variant="destructive" className="text-[10px]">
                          Expirada
                        </Badge>
                      ) : isUpcoming ? (
                        <Badge variant="warning" className="text-[10px]">
                          Próxima
                        </Badge>
                      ) : promo.isActive ? (
                        <Badge variant="success" className="text-[10px]">
                          Activa
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="text-[10px]">
                          Pausada
                        </Badge>
                      )}
                    </TableCell>

                    {/* Acciones */}
                    <TableCell className="text-right space-x-1 whitespace-nowrap">
                      <Can permission="PRODUCT:UPDATE">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 text-xs p-1.5"
                          disabled={isStatusPending}
                          title={promo.isActive ? 'Pausar promoción' : 'Activar promoción'}
                          onClick={() => onToggleStatus(promo)}
                        >
                          <Power
                            className={`h-3.5 w-3.5 ${
                              promo.isActive ? 'text-emerald-600' : 'text-muted-foreground'
                            }`}
                          />
                        </Button>
                      </Can>

                      <Can permission="PRODUCT:UPDATE">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 text-xs p-1.5"
                          title="Editar"
                          onClick={() => onEdit(promo)}
                        >
                          <Edit2 className="h-3.5 w-3.5 text-muted-foreground hover:text-foreground" />
                        </Button>
                      </Can>

                      <Can permission="PRODUCT:DELETE">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 text-xs p-1.5 text-rose-600 hover:text-rose-700 hover:bg-rose-500/10"
                          title="Eliminar"
                          onClick={() => onDelete(promo)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </Can>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
