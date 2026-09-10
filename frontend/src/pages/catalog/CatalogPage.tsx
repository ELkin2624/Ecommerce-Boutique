import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Plus, Shirt, ChevronDown, ChevronRight, Tag } from 'lucide-react';
import { apiClient } from '@/shared/api/axios-client';
import { queryKeys } from '@/shared/api/query-keys';
import type { Product } from '@/shared/types/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/Card';
import { Button } from '@/shared/ui/Button';
import { Badge } from '@/shared/ui/Badge';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/shared/ui/Table';
import { Can } from '@/shared/lib/rbac/Can';
import { ProductFormDialog } from '@/features/catalog/ui/ProductFormDialog';
import { VariantFormDialog } from '@/features/catalog/ui/VariantFormDialog';
import { formatCurrency } from '@/shared/lib/utils';

export function CatalogPage() {
  const [expandedProductIds, setExpandedProductIds] = useState<Set<string>>(new Set());
  const [isProductDialogOpen, setIsProductDialogOpen] = useState(false);
  const [selectedProductForVariant, setSelectedProductForVariant] = useState<{ id: string; name: string } | null>(null);

  // Consultar productos
  const { data: productsData, isLoading, refetch } = useQuery<{ items: Product[]; meta: any }>({
    queryKey: queryKeys.catalog.products(),
    queryFn: async () => {
      const res = await apiClient.get('/catalog/products', { params: { limit: 50 } });
      return res.data;
    },
  });

  // Consultar categorías y temporadas
  const { data: categories = [] } = useQuery<Array<{ id: string; name: string }>>({
    queryKey: queryKeys.catalog.categories,
    queryFn: async () => {
      const res = await apiClient.get('/catalog/categories');
      return res.data;
    },
  });

  const { data: seasons = [] } = useQuery<Array<{ id: string; name: string }>>({
    queryKey: queryKeys.catalog.seasons,
    queryFn: async () => {
      const res = await apiClient.get('/catalog/seasons');
      return res.data;
    },
  });

  const toggleExpand = (id: string) => {
    setExpandedProductIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const products: Product[] = Array.isArray(productsData) ? productsData : (productsData?.items as Product[]) || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Catálogo de Prendas</h1>
          <p className="text-xs text-muted-foreground">
            Gestión de productos, colecciones y definición de variantes SKU
          </p>
        </div>
        <Can permission="PRODUCT:CREATE">
          <Button onClick={() => setIsProductDialogOpen(true)} className="gap-2 shadow-sm">
            <Plus className="h-4 w-4" />
            <span>Nuevo Producto</span>
          </Button>
        </Can>
      </div>

      {/* Main Table */}
      <Card className="shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Shirt className="h-4 w-4 text-primary" />
            <span>Prendas Registradas ({products.length})</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="py-12 text-center text-sm text-muted-foreground">
              Cargando catálogo...
            </div>
          ) : products.length === 0 ? (
            <div className="py-12 text-center text-sm text-muted-foreground">
              No hay prendas registradas en el catálogo.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10"></TableHead>
                  <TableHead>Nombre / Modelo</TableHead>
                  <TableHead>Categoría</TableHead>
                  <TableHead>Temporada</TableHead>
                  <TableHead>Variantes</TableHead>
                  <TableHead>Rango de Precios</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {products.map((product) => {
                  const isExpanded = expandedProductIds.has(product.id);
                  const variants = product.variants || [];
                  const minPrice = variants.length > 0 ? Math.min(...variants.map((v) => Number(v.price))) : 0;
                  const maxPrice = variants.length > 0 ? Math.max(...variants.map((v) => Number(v.price))) : 0;

                  return (
                    <React.Fragment key={product.id}>
                      <TableRow className="cursor-pointer hover:bg-muted/40" onClick={() => toggleExpand(product.id)}>
                        <TableCell className="p-2">
                          <button
                            type="button"
                            className="p-1 rounded hover:bg-accent text-muted-foreground"
                          >
                            {isExpanded ? (
                              <ChevronDown className="h-4 w-4 text-primary" />
                            ) : (
                              <ChevronRight className="h-4 w-4" />
                            )}
                          </button>
                        </TableCell>
                        <TableCell className="font-semibold text-foreground">
                          {product.name}
                          <span className="block text-[11px] font-normal text-muted-foreground">
                            {product.brand}
                          </span>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary" className="gap-1">
                            <Tag className="h-3 w-3" />
                            <span>{product.category?.name || 'General'}</span>
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {product.season?.name || 'Permanente'}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{variants.length} SKUs</Badge>
                        </TableCell>
                        <TableCell className="text-sm font-medium">
                          {variants.length > 0
                            ? minPrice === maxPrice
                              ? formatCurrency(minPrice)
                              : `${formatCurrency(minPrice)} - ${formatCurrency(maxPrice)}`
                            : 'Sin variantes'}
                        </TableCell>
                        <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                          <Can permission="PRODUCT:CREATE">
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-7 text-xs gap-1"
                              onClick={() => setSelectedProductForVariant({ id: product.id, name: product.name })}
                            >
                              <Plus className="h-3 w-3" />
                              <span>Variante</span>
                            </Button>
                          </Can>
                        </TableCell>
                      </TableRow>

                      {/* Sub-table: Product Variants */}
                      {isExpanded && (
                        <TableRow className="bg-muted/20 hover:bg-muted/20">
                          <TableCell colSpan={7} className="p-4 pl-12">
                            <div className="rounded-md border border-border/80 bg-background p-3 shadow-inner">
                              <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">
                                Variantes Disponibles ({variants.length})
                              </h4>
                              {variants.length === 0 ? (
                                <p className="text-xs text-muted-foreground italic">
                                  No se han registrado variantes para este modelo aún.
                                </p>
                              ) : (
                                <Table>
                                  <TableHeader>
                                    <TableRow className="bg-muted/30">
                                      <TableHead className="text-xs">SKU</TableHead>
                                      <TableHead className="text-xs">Talla</TableHead>
                                      <TableHead className="text-xs">Color</TableHead>
                                      <TableHead className="text-xs">Precio Venta</TableHead>
                                      <TableHead className="text-xs">Costo</TableHead>
                                    </TableRow>
                                  </TableHeader>
                                  <TableBody>
                                    {variants.map((v) => (
                                      <TableRow key={v.id}>
                                        <TableCell className="font-mono text-xs font-bold text-primary">
                                          {v.sku}
                                        </TableCell>
                                        <TableCell className="text-xs font-semibold">{v.size}</TableCell>
                                        <TableCell className="text-xs">{v.color}</TableCell>
                                        <TableCell className="text-xs font-bold text-emerald-600">
                                          {formatCurrency(v.price)}
                                        </TableCell>
                                        <TableCell className="text-xs text-muted-foreground">
                                          {formatCurrency(v.cost)}
                                        </TableCell>
                                      </TableRow>
                                    ))}
                                  </TableBody>
                                </Table>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      )}
                    </React.Fragment>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Dialogs */}
      <ProductFormDialog
        open={isProductDialogOpen}
        onOpenChange={setIsProductDialogOpen}
        categories={categories}
        seasons={seasons}
        onSuccess={() => refetch()}
      />

      {selectedProductForVariant && (
        <VariantFormDialog
          open={Boolean(selectedProductForVariant)}
          onOpenChange={(open) => !open && setSelectedProductForVariant(null)}
          productId={selectedProductForVariant.id}
          productName={selectedProductForVariant.name}
          onSuccess={() => refetch()}
        />
      )}
    </div>
  );
}
