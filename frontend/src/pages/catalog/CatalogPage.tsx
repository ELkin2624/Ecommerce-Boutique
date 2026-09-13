import { useState } from 'react';
import { Plus, Shirt } from 'lucide-react';
import type { Product, ProductVariant } from '@/shared/types/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/shared/ui/Card';
import { Button } from '@/shared/ui/Button';
import { Can } from '@/shared/lib/rbac/Can';
import { ConfirmDeleteDialog } from '@/shared/ui/ConfirmDeleteDialog';
import {
  type CatalogTab,
  type MasterEntityType,
  type DeleteTarget,
  useCatalogData, useProductMutations, CatalogSubNavigation, ProductsFilters,
  ProductsTable, CategoriesTable, SeasonsTable, CollectionsTable,
  SuppliersTable, SizesColorsTable, ProductFormDialog, VariantFormDialog,
  ProductImageDialog, MasterEntityDialog,
} from '@/features/catalog';

export function CatalogPage() {
  const [activeTab, setActiveTab] = useState<CatalogTab>('products');
  const [expandedProductIds, setExpandedProductIds] = useState<Set<string>>(new Set());

  // Filtros de Prendas
  const [productSearch, setProductSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [seasonFilter, setSeasonFilter] = useState('');

  // Modales de Prenda y Variante
  const [isProductDialogOpen, setIsProductDialogOpen] = useState(false);
  const [productToEdit, setProductToEdit] = useState<Product | null>(null);

  const [isVariantDialogOpen, setIsVariantDialogOpen] = useState(false);
  const [productForVariant, setProductForVariant] = useState<{ id: string; name: string } | null>(null);
  const [variantToEdit, setVariantToEdit] = useState<ProductVariant | null>(null);

  // Modal de Galería Multimedia (Fotos de Prenda)
  const [isGalleryOpen, setIsGalleryOpen] = useState(false);
  const [productForGallery, setProductForGallery] = useState<Product | null>(null);

  // Modal para Entidades Maestras (Categorías, Temporadas, Colecciones, Proveedores)
  const [masterModalType, setMasterModalType] = useState<MasterEntityType | null>(null);
  const [masterItemToEdit, setMasterItemToEdit] = useState<any | null>(null);

  // Estado para Confirmación de Eliminación
  const [deleteTarget, setDeleteTarget] = useState<DeleteTarget | null>(null);

  // Hook de Datos
  const {
    allProducts, filteredProducts, categories, seasons, collections,
    suppliers, isProductsLoading, isCategoriesLoading, isSeasonsLoading,
    isCollectionsLoading, isSuppliersLoading, refetchProducts, refetchAll,
  } = useCatalogData({
    productSearch,
    categoryFilter,
    seasonFilter,
  });

  // Hook de Mutaciones
  const {
    deleteMutation,
    saveMasterEntityMutation,
    addImagesMutation,
    deleteImageMutation,
    setCoverImageMutation,
    invalidateCatalog,
  } = useProductMutations();

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

  // Apertura de modal para nueva variante
  const handleOpenAddVariant = (productId: string, productName: string) => {
    setProductForVariant({ id: productId, name: productName });
    setVariantToEdit(null);
    setIsVariantDialogOpen(true);
  };

  // Apertura de modal para editar variante
  const handleOpenEditVariant = (
    productId: string,
    productName: string,
    variant: ProductVariant
  ) => {
    setProductForVariant({ id: productId, name: productName });
    setVariantToEdit(variant);
    setIsVariantDialogOpen(true);
  };

  // Apertura de modal de galería de imágenes
  const handleOpenGallery = (product: Product) => {
    setProductForGallery(product);
    setIsGalleryOpen(true);
  };

  // Apertura de modal para entidades maestras
  const handleOpenMasterModal = (type: MasterEntityType, item?: any) => {
    setMasterModalType(type);
    setMasterItemToEdit(item || null);
  };

  return (
    <div className="space-y-6">
      {/* 1. Header Principal */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Shirt className="h-6 w-6 text-primary" />
            <span>Catálogo y Gestión de Prendas</span>
          </h1>
          <p className="text-xs text-muted-foreground">
            Administración omnicanal de prendas de moda, variantes por talla/color, galerías de fotos y clasificación
          </p>
        </div>
      </div>

      {/* 2. SubNavegación por Pestañas */}
      <CatalogSubNavigation
        activeTab={activeTab}
        onChangeTab={setActiveTab}
        counts={{
          products: allProducts.length,
          categories: categories.length,
          seasons: seasons.length,
          collections: collections.length,
          suppliers: suppliers.length,
        }}
      />

      {/* 3. Contenido según pestaña activa */}
      {activeTab === 'products' && (
        <Card className="shadow-xs border-border">
          <CardHeader className="pb-3">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <CardTitle className="text-base flex items-center gap-2">
                  <Shirt className="h-4 w-4 text-primary" />
                  <span>
                    Prendas Registradas ({filteredProducts.length}
                    {filteredProducts.length !== allProducts.length ? ` de ${allProducts.length}` : ''})
                  </span>
                </CardTitle>
                <CardDescription className="text-xs">
                  Despliega cada prenda para gestionar sus variantes por talla, colorway, precio y stock
                </CardDescription>
              </div>

              <Can permission="PRODUCT:CREATE">
                <Button
                  onClick={() => {
                    setProductToEdit(null);
                    setIsProductDialogOpen(true);
                  }}
                  size="sm"
                  className="gap-1.5 shadow-xs"
                >
                  <Plus className="h-4 w-4" />
                  <span>Nueva Prenda</span>
                </Button>
              </Can>
            </div>

            {/* Barra de Filtros */}
            <ProductsFilters
              search={productSearch}
              onSearchChange={setProductSearch}
              categoryFilter={categoryFilter}
              onCategoryFilterChange={setCategoryFilter}
              seasonFilter={seasonFilter}
              onSeasonFilterChange={setSeasonFilter}
              categories={categories}
              seasons={seasons}
            />
          </CardHeader>

          <CardContent>
            {isProductsLoading ? (
              <div className="py-12 text-center text-xs text-muted-foreground animate-pulse">
                Cargando catálogo de prendas...
              </div>
            ) : (
              <ProductsTable
                products={filteredProducts}
                expandedProductIds={expandedProductIds}
                onToggleExpand={toggleExpand}
                onNewProduct={() => {
                  setProductToEdit(null);
                  setIsProductDialogOpen(true);
                }}
                onEditProduct={(p) => {
                  setProductToEdit(p);
                  setIsProductDialogOpen(true);
                }}
                onDeleteProduct={(p) =>
                  setDeleteTarget({ type: 'product', id: p.id, name: p.name })
                }
                onOpenGallery={handleOpenGallery}
                onAddVariant={handleOpenAddVariant}
                onEditVariant={handleOpenEditVariant}
                onDeleteVariant={(id, label) =>
                  setDeleteTarget({ type: 'variant', id, name: label })
                }
              />
            )}
          </CardContent>
        </Card>
      )}

      {activeTab === 'categories' && (
        <CategoriesTable
          categories={categories}
          isLoading={isCategoriesLoading}
          onNewCategory={() => handleOpenMasterModal('categories')}
          onEditCategory={(cat) => handleOpenMasterModal('categories', cat)}
          onDeleteCategory={(cat) =>
            setDeleteTarget({ type: 'category', id: cat.id, name: cat.name })
          }
        />
      )}

      {activeTab === 'seasons' && (
        <SeasonsTable
          seasons={seasons}
          isLoading={isSeasonsLoading}
          onNewSeason={() => handleOpenMasterModal('seasons')}
          onEditSeason={(s) => handleOpenMasterModal('seasons', s)}
          onDeleteSeason={(s) =>
            setDeleteTarget({ type: 'season', id: s.id, name: s.name })
          }
        />
      )}

      {activeTab === 'collections' && (
        <CollectionsTable
          collections={collections}
          isLoading={isCollectionsLoading}
          onNewCollection={() => handleOpenMasterModal('collections')}
          onEditCollection={(c) => handleOpenMasterModal('collections', c)}
          onDeleteCollection={(c) =>
            setDeleteTarget({ type: 'collection', id: c.id, name: c.name })
          }
        />
      )}

      {activeTab === 'suppliers' && (
        <SuppliersTable
          suppliers={suppliers}
          isLoading={isSuppliersLoading}
          onNewSupplier={() => handleOpenMasterModal('suppliers')}
          onEditSupplier={(sup) => handleOpenMasterModal('suppliers', sup)}
          onDeleteSupplier={(sup) =>
            setDeleteTarget({ type: 'supplier', id: sup.id, name: sup.name })
          }
        />
      )}

      {activeTab === 'sizes-colors' && <SizesColorsTable />}

      {/* --- DIÁLOGOS MODALES --- */}

      {/* 1. Modal de Prenda (Crear / Editar) */}
      <ProductFormDialog
        open={isProductDialogOpen}
        onOpenChange={setIsProductDialogOpen}
        categories={categories}
        seasons={seasons}
        collections={collections}
        suppliers={suppliers}
        productToEdit={productToEdit}
        onSuccess={() => {
          refetchAll();
          invalidateCatalog();
        }}
      />

      {/* 2. Modal de Variante / Colorway (Estilo Nike / Adidas) */}
      {productForVariant && (
        <VariantFormDialog
          open={isVariantDialogOpen}
          onOpenChange={setIsVariantDialogOpen}
          productId={productForVariant.id}
          productName={productForVariant.name}
          productImages={allProducts.find((p) => p.id === productForVariant.id)?.images || []}
          variantToEdit={variantToEdit}
          onSuccess={refetchProducts}
        />
      )}

      {/* 3. Modal de Galería Multimedia / Fotos (Estilo Nike / Adidas / AWS) */}
      <ProductImageDialog
        open={isGalleryOpen}
        onOpenChange={(open) => {
          setIsGalleryOpen(open);
          if (!open) setProductForGallery(null);
        }}
        product={
          productForGallery
            ? allProducts.find((p) => p.id === productForGallery.id) || productForGallery
            : null
        }
        onAddImage={async (productId, images) => {
          await addImagesMutation.mutateAsync({ productId, images });
          refetchProducts();
        }}
        onDeleteImage={async (productId, imageId) => {
          await deleteImageMutation.mutateAsync({ productId, imageId });
          refetchProducts();
        }}
        onSetCoverImage={async (productId, imageId) => {
          await setCoverImageMutation.mutateAsync({ productId, imageId });
          refetchProducts();
        }}
      />

      {/* 4. Modal para Entidades Maestras (Categoría, Temporada, Colección, Proveedor) */}
      <MasterEntityDialog
        open={Boolean(masterModalType)}
        onOpenChange={(open) => {
          if (!open) {
            setMasterModalType(null);
            setMasterItemToEdit(null);
          }
        }}
        type={masterModalType}
        editingItem={masterItemToEdit}
        onSubmit={async (payload) => {
          if (!masterModalType) return;
          await saveMasterEntityMutation.mutateAsync({
            type: masterModalType,
            id: masterItemToEdit?.id,
            payload,
          });
          refetchAll();
        }}
      />

      {/* 5. Diálogo de Confirmación para Eliminar */}
      <ConfirmDeleteDialog
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        title={
          deleteTarget?.type === 'product'
            ? '¿Dar de baja esta prenda?'
            : deleteTarget?.type === 'variant'
            ? '¿Eliminar variante de prenda?'
            : `¿Eliminar ${deleteTarget?.type}?`
        }
        description={
          deleteTarget?.type === 'product'
            ? 'Esta acción dará de baja lógica la prenda y todas sus variantes de catálogo asociadas.'
            : deleteTarget?.type === 'variant'
            ? 'Esta variante dejará de estar disponible en el inventario y tienda.'
            : 'Solo se puede eliminar si no tiene prendas activas asociadas.'
        }
        itemName={deleteTarget?.name}
        isPending={deleteMutation.isPending}
        onConfirm={async () => {
          if (deleteTarget) {
            await deleteMutation.mutateAsync(deleteTarget);
            refetchAll();
          }
        }}
      />
    </div>
  );
}
export default CatalogPage;
