import { useState } from 'react';
import { Tag, Plus } from 'lucide-react';
import { Button } from '@/shared/ui/Button';
import { Can } from '@/shared/lib/rbac/Can';
import { ConfirmDeleteDialog } from '@/shared/ui/ConfirmDeleteDialog';
import {
  type Promotion,
  usePromotionsData,
  usePromotionMutations,
  PromotionsStatsCards,
  PromotionsFilters,
  PromotionsTable,
  PromotionFormDialog,
} from '@/features/promotions';

export function PromotionsPage() {
  // Filtros de búsqueda
  const [searchTerm, setSearchTerm] = useState('');
  const [onlyActive, setOnlyActive] = useState(false);

  // Modales
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [promotionToEdit, setPromotionToEdit] = useState<Promotion | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Promotion | null>(null);

  // Capa de Datos (Hooks del feature)
  const { filteredPromotions, stats, isLoading, refetch } = usePromotionsData({
    searchTerm,
    onlyActive,
  });

  // Capa de Mutaciones (Hooks del feature)
  const { toggleStatusMutation, deleteMutation } = usePromotionMutations();

  const handleOpenCreate = () => {
    setPromotionToEdit(null);
    setIsDialogOpen(true);
  };

  const handleOpenEdit = (promo: Promotion) => {
    setPromotionToEdit(promo);
    setIsDialogOpen(true);
  };

  const handleToggleStatus = (promo: Promotion) => {
    toggleStatusMutation.mutate({
      id: promo.id,
      isActive: !promo.isActive,
    });
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    await deleteMutation.mutateAsync(deleteTarget.id);
    setDeleteTarget(null);
  };

  return (
    <div className="space-y-6">
      {/* Encabezado de Página */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Tag className="h-6 w-6 text-primary" />
            <span>Gestión de Promociones & Cupones</span>
          </h1>
          <p className="text-xs text-muted-foreground">
            Administración de campañas comerciales, temporadas promocionales y cupones de descuento
          </p>
        </div>

        <Can permission="PRODUCT:CREATE">
          <Button onClick={handleOpenCreate} className="gap-2 shadow-xs" size="sm">
            <Plus className="h-4 w-4" />
            <span>Nueva Promoción</span>
          </Button>
        </Can>
      </div>

      {/* Tarjetas KPI de Resumen */}
      <PromotionsStatsCards stats={stats} />

      {/* Barra de Filtros y Búsqueda */}
      <PromotionsFilters
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        onlyActive={onlyActive}
        onToggleOnlyActive={() => setOnlyActive(!onlyActive)}
        filteredCount={filteredPromotions.length}
      />

      {/* Tabla de Promociones */}
      <PromotionsTable
        promotions={filteredPromotions}
        isLoading={isLoading}
        onEdit={handleOpenEdit}
        onToggleStatus={handleToggleStatus}
        onDelete={(promo) => setDeleteTarget(promo)}
        isStatusPending={toggleStatusMutation.isPending}
      />

      {/* Diálogo Crear / Editar Promoción */}
      {isDialogOpen && (
        <PromotionFormDialog
          open={isDialogOpen}
          onOpenChange={setIsDialogOpen}
          promotionToEdit={promotionToEdit}
          onSuccess={() => refetch()}
        />
      )}

      {/* Diálogo de Confirmación de Eliminación */}
      <ConfirmDeleteDialog
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleConfirmDelete}
        title="Eliminar Promoción"
        itemName={deleteTarget?.name}
        description="Esta acción retirará la campaña y su cupón de descuento. No podrá ser utilizado nuevamente en caja ni en compras web."
        isPending={deleteMutation.isPending}
      />
    </div>
  );
}
