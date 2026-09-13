import { Plus, Edit2, Trash2, Tag, Layers, TrendingUp } from 'lucide-react';
import type { Product, ProductVariant } from '@/shared/types/api';
import { Button } from '@/shared/ui/Button';
import { Badge } from '@/shared/ui/Badge';
import { Can } from '@/shared/lib/rbac/Can';
import { formatCurrency } from '@/shared/lib/utils';
import { ProductThumbnail } from './ProductThumbnail';

interface ProductVariantsListProps {
  product: Product;
  onAddVariant: (productId: string, productName: string) => void;
  onEditVariant: (productId: string, productName: string, variant: ProductVariant) => void;
  onDeleteVariant: (variantId: string, variantLabel: string) => void;
}

export function ProductVariantsList({
  product,
  onAddVariant,
  onEditVariant,
  onDeleteVariant,
}: ProductVariantsListProps) {
  const variants = product.variants || [];
  const variantsCount = variants.length;

  return (
    <div className="rounded-2xl border border-border/80 bg-background/95 p-5 shadow-xs space-y-4">
      {/* Encabezado del panel de variantes */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 rounded-lg bg-primary/10 text-primary">
            <Layers className="h-4 w-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold tracking-tight text-foreground">
                Variantes de Prenda (Tallas y Colores)
              </span>
              <Badge variant="outline" className="text-[10px] font-mono">
                {variantsCount} {variantsCount === 1 ? 'variante' : 'variantes'}
              </Badge>
            </div>
            <p className="text-[11px] text-muted-foreground">
              Cada variante representa una combinación única de talla, color y precio de inventario para {product.name}
            </p>
          </div>
        </div>

        <Can permission="PRODUCT:CREATE">
          <Button
            variant="outline"
            size="sm"
            className="h-8 text-xs gap-1.5 shadow-xs hover:bg-primary hover:text-primary-foreground transition-all"
            onClick={() => onAddVariant(product.id, product.name)}
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Agregar Variante / Color</span>
          </Button>
        </Can>
      </div>

      {variantsCount === 0 ? (
        <div className="text-center py-8 px-4 border border-dashed rounded-xl bg-muted/20 space-y-2">
          <Tag className="h-8 w-8 mx-auto text-muted-foreground/40" />
          <p className="text-xs font-medium text-foreground">Sin variantes configuradas</p>
          <p className="text-[11px] text-muted-foreground max-w-sm mx-auto">
            Esta prenda aún no tiene tallas o colores asignados. Agrega variantes con su precio y costo para activar la venta e inventario.
          </p>
          <Can permission="PRODUCT:CREATE">
            <Button
              size="sm"
              variant="outline"
              className="mt-2 text-xs gap-1"
              onClick={() => onAddVariant(product.id, product.name)}
            >
              <Plus className="h-3 w-3" />
              <span>Crear Primera Variante</span>
            </Button>
          </Can>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {variants.map((v) => {
            const price = Number(v.price || 0);
            const cost = Number(v.cost || 0);
            const marginAmount = price - cost;
            const marginPercent = price > 0 ? ((marginAmount / price) * 100).toFixed(0) : 0;
            const stock = v.stock ?? 0;

            // Datos visuales de la variante (estilo Nike / Adidas)
            const meta = (v.measurementsJson as any) || {};
            const variantImage = meta.imageUrl || product.coverImage;
            const colorHex = meta.colorHex;

            return (
              <div
                key={v.id}
                className="group relative flex flex-col justify-between p-3.5 rounded-xl border border-border/70 bg-card hover:border-primary/50 hover:shadow-md transition-all duration-200 space-y-3"
              >
                {/* Parte superior: Miniatura + SKU + Acciones */}
                <div className="flex items-start gap-3">
                  <div className="relative shrink-0">
                    <ProductThumbnail
                      src={variantImage}
                      alt={`${product.name} ${v.color} ${v.size}`}
                      size="md"
                    />
                    {meta.imageUrl && (
                      <span
                        className="absolute -bottom-1 -right-1 bg-primary text-primary-foreground text-[8px] font-bold px-1 rounded-full shadow-xs"
                        title="Foto exclusiva de este colorway"
                      >
                        ✓
                      </span>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <span className="font-mono text-xs font-bold text-primary tracking-tight truncate" title="Código de variante">
                        Cód: {v.sku}
                      </span>

                      {/* Botones de acción rápidos */}
                      <div className="flex items-center gap-0.5 opacity-80 group-hover:opacity-100 transition-opacity">
                        <Can permission="PRODUCT:UPDATE">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground"
                            title="Editar Variante"
                            onClick={() => onEditVariant(product.id, product.name, v)}
                          >
                            <Edit2 className="h-3 w-3" />
                          </Button>
                        </Can>

                        <Can permission="PRODUCT:UPDATE">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                            title="Eliminar Variante"
                            onClick={() =>
                              onDeleteVariant(v.id, `Variante (${v.color} - Talla ${v.size})`)
                            }
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </Can>
                      </div>
                    </div>

                    {/* Color y Talla */}
                    <div className="flex items-center gap-2 mt-1">
                      <div className="flex items-center gap-1.5">
                        {colorHex ? (
                          <span
                            className="w-3.5 h-3.5 rounded-full border border-black/20 dark:border-white/20 shadow-2xs inline-block shrink-0"
                            style={{ backgroundColor: colorHex }}
                            title={v.color}
                          />
                        ) : (
                          <span className="w-2.5 h-2.5 rounded-full bg-slate-400 inline-block shrink-0" />
                        )}
                        <span className="text-xs font-semibold text-foreground truncate">
                          {v.color}
                        </span>
                      </div>

                      <Badge variant="secondary" className="text-[10px] font-bold px-1.5 py-0 h-4.5">
                        Talla {v.size}
                      </Badge>
                    </div>
                  </div>
                </div>

                {/* Parte inferior: Precios, Margen y Stock */}
                <div className="pt-2 border-t border-border/50 flex items-center justify-between text-xs">
                  <div>
                    <div className="text-[10px] text-muted-foreground">Precio Venta</div>
                    <div className="font-bold text-foreground">
                      {formatCurrency(price)}
                    </div>
                  </div>

                  <div>
                    <div className="text-[10px] text-muted-foreground">Costo / Margen</div>
                    <div className="flex items-center gap-1 font-medium text-emerald-600 dark:text-emerald-400">
                      <TrendingUp className="h-3 w-3" />
                      <span>{marginPercent}%</span>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-[10px] text-muted-foreground">Disponibilidad</div>
                    {stock > 0 ? (
                      <span className="inline-flex items-center px-1.5 py-0.5 rounded-md text-[10px] font-bold bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20">
                        {stock} unids.
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-1.5 py-0.5 rounded-md text-[10px] font-medium bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20">
                        0 stock
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
