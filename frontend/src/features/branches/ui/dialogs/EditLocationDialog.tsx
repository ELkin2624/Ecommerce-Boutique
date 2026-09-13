import React, { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { X, Warehouse, Store, Building2, Share2, Plus, Trash2 } from 'lucide-react';
import { apiClient } from '@/shared/api/axios-client';
import { queryKeys } from '@/shared/api/query-keys';
import type { Branch } from '@/shared/types/api';
import type { EnrichedLocation } from '../../model/types';
import { Button } from '@/shared/ui/Button';
import { Badge } from '@/shared/ui/Badge';
import { toast } from '@/shared/ui/Toast';

interface EditLocationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  location: EnrichedLocation | null;
  branches: Branch[];
}

export function EditLocationDialog({ open, onOpenChange, location, branches = [] }: EditLocationDialogProps) {
  const queryClient = useQueryClient();
  const isWarehouse = location?.type === 'WAREHOUSE';

  const [name, setName] = useState('');
  const [selectedBranchId, setSelectedBranchId] = useState('');
  const [sharedBranchIds, setSharedBranchIds] = useState<string[]>([]);
  const [branchToShareId, setBranchToShareId] = useState('');

  useEffect(() => {
    if (location && open) {
      setName(location.name);
      setSelectedBranchId(location.branch.id);
      // Cargar sucursales compartidas actuales
      const currentSharedIds = location.sharedByBranches?.map((sb) => sb.id) || [];
      setSharedBranchIds(currentSharedIds);
      setBranchToShareId('');
    }
  }, [location, open]);

  // Filtrar sucursales disponibles para compartir (que no sean la sede propietaria ni estén ya en la lista)
  const availableBranchesToShare = branches.filter(
    (b) => b.id !== selectedBranchId && !sharedBranchIds.includes(b.id)
  );

  const handleAddSharedBranch = () => {
    if (!branchToShareId) return;
    if (!sharedBranchIds.includes(branchToShareId)) {
      setSharedBranchIds([...sharedBranchIds, branchToShareId]);
      setBranchToShareId('');
    }
  };

  const handleRemoveSharedBranch = (idToRemove: string) => {
    setSharedBranchIds(sharedBranchIds.filter((id) => id !== idToRemove));
  };

  const updateMutation = useMutation({
    mutationFn: async () => {
      if (!location) return;
      return (
        await apiClient.patch(`/branches/locations/${location.id}`, {
          name: name.trim(),
          branchId: selectedBranchId,
          ...(isWarehouse ? { sharedBranchIds } : {}),
        })
      ).data;
    },
    onSuccess: () => {
      toast.success(
        'Ubicación actualizada',
        isWarehouse
          ? 'El nombre, sede base y sucursales compartidas han sido actualizados.'
          : 'Los datos y sucursal han sido guardados.'
      );
      queryClient.invalidateQueries({ queryKey: queryKeys.branches.all });
      onOpenChange(false);
    },
    onError: (err: any) => {
      toast.error('Error al actualizar', err.response?.data?.message || 'Verifica los datos');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!location) return;
    if (!name.trim()) {
      toast.error('Nombre requerido', 'Ingresa un nombre para la ubicación.');
      return;
    }
    if (!selectedBranchId) {
      toast.error('Sucursal requerida', 'Selecciona la sucursal sede principal.');
      return;
    }
    updateMutation.mutate();
  };

  if (!open || !location) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-md p-4 animate-in fade-in-50">
      <div className="relative w-full max-w-lg max-h-[90vh] flex flex-col rounded-2xl border border-border bg-card text-card-foreground shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-start justify-between p-5 pb-4 border-b shrink-0 bg-muted/10">
          <div className="flex items-center gap-3">
            <div
              className={`p-2.5 rounded-xl shrink-0 ${
                isWarehouse
                  ? 'bg-amber-100 text-amber-600 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/40'
                  : 'bg-emerald-100 text-emerald-600 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/40'
              }`}
            >
              {isWarehouse ? <Warehouse className="h-5 w-5" /> : <Store className="h-5 w-5" />}
            </div>
            <div>
              <h3 className="text-base font-bold leading-tight">
                {isWarehouse ? 'Editar Almacén y Accesos' : 'Editar Punto de Venta (POS)'}
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                {isWarehouse
                  ? 'Configura el nombre, la sede física base y las sucursales con acceso compartido'
                  : 'Modifica el nombre o reasigna la sucursal correspondiente'}
              </p>
            </div>
          </div>
          <button
            onClick={() => onOpenChange(false)}
            className="text-muted-foreground hover:text-foreground p-1.5 rounded-lg hover:bg-muted transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
          <div className="overflow-y-auto flex-1 p-5 space-y-4">
            {/* Nombre */}
            <div>
              <label className="text-xs font-semibold text-foreground mb-1 block">
                Nombre de {isWarehouse ? 'Almacén' : 'Punto POS'} *
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={isWarehouse ? 'Ej: Almacén Principal, Depósito Central' : 'Ej: Mostrador 1'}
                className="h-9 w-full rounded-md border border-input bg-background px-3 text-xs shadow-sm focus:ring-1 focus:ring-primary focus:outline-hidden"
                autoFocus
              />
            </div>

            {/* Sede Base Propietaria */}
            <div>
              <label className="text-xs font-semibold text-foreground flex items-center justify-between mb-1">
                <span className="flex items-center gap-1.5">
                  <Building2 className="h-3.5 w-3.5 text-primary" />
                  <span>{isWarehouse ? 'Sucursal Sede Base (Propietaria) *' : 'Sucursal Asignada *'}</span>
                </span>
                {isWarehouse && (
                  <span className="text-[10px] text-muted-foreground font-normal">
                    Ubicación física donde reside
                  </span>
                )}
              </label>
              <select
                value={selectedBranchId}
                onChange={(e) => {
                  const newBranchId = e.target.value;
                  setSelectedBranchId(newBranchId);
                  // Si la nueva sede estaba en las compartidas, la quitamos
                  setSharedBranchIds((prev) => prev.filter((id) => id !== newBranchId));
                }}
                required
                className="h-9 w-full rounded-md border border-input bg-background px-3 text-xs font-medium shadow-sm focus:ring-1 focus:ring-primary focus:outline-hidden"
              >
                {branches.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name} — {b.city?.name || 'Ciudad'} ({b.address})
                  </option>
                ))}
              </select>
            </div>

            {/* SECCIÓN M:N: SUCURSALES COMPARTIDAS (Solo Almacenes) */}
            {isWarehouse && (
              <div className="pt-2 border-t space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-foreground flex items-center gap-1.5">
                    <Share2 className="h-3.5 w-3.5 text-blue-600" />
                    <span>Sucursales con Acceso Compartido</span>
                  </label>
                  <Badge variant="outline" className="text-[10px] bg-blue-50 text-blue-700 border-blue-200">
                    {sharedBranchIds.length} {sharedBranchIds.length === 1 ? 'vinculada' : 'vinculadas'}
                  </Badge>
                </div>

                <p className="text-[11px] text-muted-foreground">
                  Las sucursales vinculadas podrán ver existencias, reservar y despachar inventario desde este almacén.
                </p>

                {/* Lista de Sucursales Compartidas Actuales */}
                {sharedBranchIds.length > 0 ? (
                  <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                    {sharedBranchIds.map((branchId) => {
                      const b = branches.find((item) => item.id === branchId);
                      if (!b) return null;
                      return (
                        <div
                          key={b.id}
                          className="flex items-center justify-between p-2 rounded-lg bg-blue-50/60 dark:bg-blue-950/30 border border-blue-200/70 dark:border-blue-900/50 text-xs"
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <Building2 className="h-3.5 w-3.5 text-blue-600 shrink-0" />
                            <div className="truncate">
                              <span className="font-semibold text-foreground">{b.name}</span>
                              <span className="text-[10px] text-muted-foreground ml-1.5">
                                ({b.city?.name || 'Ciudad'})
                              </span>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleRemoveSharedBranch(b.id)}
                            className="inline-flex items-center gap-1 text-[11px] font-medium text-destructive hover:text-destructive/80 hover:bg-destructive/10 px-2 py-0.5 rounded-md transition-colors"
                            title="Quitar acceso a esta sucursal"
                          >
                            <Trash2 className="h-3 w-3" />
                            <span>Quitar</span>
                          </button>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="p-3 rounded-lg border border-dashed text-center text-xs text-muted-foreground bg-muted/20">
                    Este almacén es de uso exclusivo de su sucursal base.
                  </div>
                )}

                {/* Agregar nueva sucursal con acceso */}
                {availableBranchesToShare.length > 0 && (
                  <div className="p-3 rounded-xl border bg-muted/30 space-y-2">
                    <label className="text-[11px] font-semibold text-foreground flex items-center gap-1">
                      <Plus className="h-3 w-3 text-primary" />
                      <span>Vincular otra sucursal:</span>
                    </label>
                    <div className="flex items-center gap-2">
                      <select
                        value={branchToShareId}
                        onChange={(e) => setBranchToShareId(e.target.value)}
                        className="h-8 flex-1 rounded-md border border-input bg-background px-2.5 text-xs font-medium shadow-2xs focus:ring-1 focus:ring-primary"
                      >
                        <option value="">-- Seleccionar sucursal --</option>
                        {availableBranchesToShare.map((b) => (
                          <option key={b.id} value={b.id}>
                            {b.name} ({b.city?.name || 'Ciudad'})
                          </option>
                        ))}
                      </select>
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        className="h-8 text-xs gap-1 shrink-0"
                        disabled={!branchToShareId}
                        onClick={handleAddSharedBranch}
                      >
                        <Plus className="h-3 w-3" />
                        <span>Vincular</span>
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-4 border-t bg-muted/20 flex justify-end gap-2 shrink-0">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={updateMutation.isPending}
              onClick={() => onOpenChange(false)}
            >
              Cancelar
            </Button>
            <Button type="submit" size="sm" disabled={updateMutation.isPending} className="shadow-sm">
              {updateMutation.isPending ? 'Guardando...' : 'Guardar Cambios'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
