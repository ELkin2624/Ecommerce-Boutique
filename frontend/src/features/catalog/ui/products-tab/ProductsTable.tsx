import React from 'react';
import {
  ChevronDown,
  ChevronRight,
  Plus,
  Edit2,
  Trash2,
  Tag,
  Calendar,
  Layers,
  Camera,
} from 'lucide-react';
import type { Product, ProductVariant } from '@/shared/types/api';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/shared/ui/Table';
import { Button } from '@/shared/ui/Button';
import { Badge } from '@/shared/ui/Badge';
import { Can } from '@/shared/lib/rbac/Can';
import { ProductThumbnail } from './ProductThumbnail';
import { ProductVariantsList } from './ProductVariantsList';

interface ProductsTableProps {
  products: Product[];
  expandedProductIds: Set<string>;
  onToggleExpand: (productId: string) => void;
  onNewProduct: () => void;
  onEditProduct: (product: Product) => void;
  onDeleteProduct: (product: Product) => void;
  onOpenGallery: (product: Product) => void;
  onAddVariant: (productId: string, productName: string) => void;
  onEditVariant: (productId: string, productName: string, variant: ProductVariant) => void;
  onDeleteVariant: (variantId: string, label: string) => void;
}

export function ProductsTable({
  products,
  expandedProductIds,
  onToggleExpand,
  onEditProduct,
  onDeleteProduct,
  onOpenGallery,
  onAddVariant,
  onEditVariant,
  onDeleteVariant,
}: ProductsTableProps) {
  if (products.length === 0) {
    return (
      <div className="py-12 text-center text-sm text-muted-foreground border rounded-xl bg-muted/10">
        No se encontraron prendas con los filtros aplicados.
      </div>
    );
  }

  return (
    <div className="rounded-xl border overflow-hidden shadow-xs">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/40 text-xs">
            <TableHead className="w-10 text-center"></TableHead>
            <TableHead>Prenda / Modelo</TableHead>
            <TableHead>Categoría</TableHead>
            <TableHead>Temporada / Colección</TableHead>
            <TableHead>Variantes (Talla/Color)</TableHead>
            <TableHead>Galería Multimedia</TableHead>
            <TableHead className="text-right">Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {products.map((product) => {
            const isExpanded = expandedProductIds.has(product.id);
            const variants = product.variants || [];
            const variantsCount = variants.length;
            const totalStock =
              product.availableStock ?? variants.reduce((sum, v) => sum + (v.stock || 0), 0);
            const imagesCount = product.images?.length || 0;

            return (
              <React.Fragment key={product.id}>
                <TableRow
                  className={`hover:bg-muted/30 transition-colors ${
                    isExpanded ? 'bg-muted/15 border-b-0' : ''
                  }`}
                >
                  {/* Botón expandir variantes */}
                  <TableCell className="p-2 text-center">
                    <button
                      onClick={() => onToggleExpand(product.id)}
                      className="p-1 rounded-md hover:bg-accent text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                      title={isExpanded ? 'Contraer variantes' : 'Ver y gestionar variantes de la prenda'}
                    >
                      {isExpanded ? (
                        <ChevronDown className="h-4 w-4 text-primary font-bold" />
                      ) : (
                        <ChevronRight className="h-4 w-4" />
                      )}
                    </button>
                  </TableCell>

                  {/* Prenda: Foto + Nombre + Marca + Descripción */}
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div
                        className="cursor-pointer group relative"
                        onClick={() => onOpenGallery(product)}
                        title="Clic para gestionar fotos de la prenda"
                      >
                        <ProductThumbnail
                          src={product.coverImage}
                          alt={product.name}
                          size="md"
                          className="group-hover:ring-2 group-hover:ring-primary transition-all"
                        />
                        <div className="absolute inset-0 bg-black/40 rounded-xl opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white">
                          <Camera className="h-4 w-4" />
                        </div>
                      </div>

                      <div className="flex flex-col gap-0.5">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm text-foreground hover:text-primary transition-colors">
                            {product.name}
                          </span>
                          {product.brand && (
                            <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 font-normal">
                              {product.brand}
                            </Badge>
                          )}
                        </div>
                        <span className="text-xs text-muted-foreground line-clamp-1 max-w-[280px]">
                          {product.description || 'Sin descripción'}
                        </span>
                      </div>
                    </div>
                  </TableCell>

                  {/* Categoría */}
                  <TableCell>
                    <Badge variant="secondary" className="text-xs font-medium gap-1">
                      <Tag className="h-3 w-3 text-primary" />
                      {product.category?.name || 'General'}
                    </Badge>
                  </TableCell>

                  {/* Temporada & Colección */}
                  <TableCell>
                    <div className="flex flex-col gap-0.5 text-xs">
                      <span className="text-foreground font-medium flex items-center gap-1">
                        <Calendar className="h-3 w-3 text-muted-foreground" />
                        {product.season?.name || 'Permanente'}
                      </span>
                      {product.collection && (
                        <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                          <Layers className="h-3 w-3 text-muted-foreground" />
                          {product.collection.name}
                        </span>
                      )}
                    </div>
                  </TableCell>

                  {/* Variantes & Stock */}
                  <TableCell>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <Badge variant="outline" className="text-xs font-mono font-medium">
                        {variantsCount} {variantsCount === 1 ? 'variante' : 'variantes'}
                      </Badge>
                      {totalStock > 0 ? (
                        <Badge
                          variant="default"
                          className="text-[11px] bg-emerald-600/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20 font-medium"
                        >
                          {totalStock} en stock
                        </Badge>
                      ) : (
                        <Badge
                          variant="secondary"
                          className="text-[11px] text-amber-700 dark:text-amber-400 bg-amber-500/10 border border-amber-500/20"
                        >
                          Sin stock
                        </Badge>
                      )}
                    </div>
                  </TableCell>

                  {/* Galería Multimedia (Fotos) */}
                  <TableCell>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 text-xs gap-1.5 border-dashed hover:border-primary hover:bg-primary/5 transition-colors"
                      onClick={() => onOpenGallery(product)}
                    >
                      <Camera className="h-3.5 w-3.5 text-primary" />
                      <span>{imagesCount === 0 ? 'Sin fotos' : `${imagesCount} fotos`}</span>
                    </Button>
                  </TableCell>

                  {/* Acciones */}
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Can permission="PRODUCT:CREATE">
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-7 text-xs gap-1 shadow-xs hover:bg-primary hover:text-primary-foreground transition-all"
                          title="Agregar variante a este producto"
                          onClick={() => onAddVariant(product.id, product.name)}
                        >
                          <Plus className="h-3 w-3" />
                          <span>+ Variante</span>
                        </Button>
                      </Can>

                      <Can permission="PRODUCT:UPDATE">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
                          title="Editar Prenda"
                          onClick={() => onEditProduct(product)}
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                        </Button>
                      </Can>

                      <Can permission="PRODUCT:UPDATE">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                          title="Dar de baja prenda"
                          onClick={() => onDeleteProduct(product)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </Can>
                    </div>
                  </TableCell>
                </TableRow>

                {/* Subpanel expandible con el showcase de variantes estilo Nike / Adidas */}
                {isExpanded && (
                  <TableRow className="bg-muted/10 border-t-0">
                    <TableCell colSpan={7} className="p-4 pl-12">
                      <ProductVariantsList
                        product={product}
                        onAddVariant={onAddVariant}
                        onEditVariant={onEditVariant}
                        onDeleteVariant={onDeleteVariant}
                      />
                    </TableCell>
                  </TableRow>
                )}
              </React.Fragment>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
