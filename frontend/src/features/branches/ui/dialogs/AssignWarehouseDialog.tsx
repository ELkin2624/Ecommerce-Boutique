import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { X, Warehouse, Plus, Building2 } from 'lucide-react';
import { apiClient } from '@/shared/api/axios-client';
import { queryKeys } from '@/shared/api/query-keys';
import type { Branch } from '@/shared/types/api';
import type { EnrichedLocation } from '../../model/types';
import { Button } from '@/shared/ui/Button';
import { toast } from '@/shared/ui/Toast';

interface AssignWarehouseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  branch: Branch | null;
  availableWarehouses: EnrichedLocation[];
}

export function AssignWarehouseDialog({
  open,
  onOpenChange,
  branch,
  availableWarehouses = [],
}: AssignWarehouseDialogProps) {
  const queryClient = useQueryClient();
  const [selectedWarehouseId, setSelectedWarehouseId] = useState<string>('');

  // Almacenes que no pertenecen ya a esta sucursal ni están compartidos
  const assignableWarehouses = availableWarehouses.filter((w) => {
    if (w.branch.id === branch?.id) return false;
    const isAlreadyShared = branch?.sharedWarehouses?.some((sw) => sw.id === w.id);
    return !isAlreadyShared;
  });

  const assignMutation = useMutation({
    mutationFn: async (warehouseId: string) => {
      if (!branch) return;
      const res = await apiClient.post(`/branches/${branch.id}/warehouses`, { warehouseId });
      return res.data;
    },
    onSuccess: () => {
      toast.success('Almacén compartido', 'El almacén fue compartido exitosamente con esta sucursal.');
      queryClient.invalidateQueries({ queryKey: queryKeys.branches.all });
      setSelectedWarehouseId('');
      onOpenChange(false);
    },
    onError: (err: any) => {
      toast.error('Error al compartir almacén', err.response?.data?.message || 'No se pudo compartir el almacén');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedWarehouseId) {
      toast.error('Selecciona un almacén', 'Debes seleccionar un almacén del listado.');
      return;
    }
    assignMutation.mutate(selectedWarehouseId);
  };

  if (!open || !branch) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-md p-4">
      <div className="relative w-full max-w-md max-h-[90vh] flex flex-col rounded-2xl border border-border bg-card text-card-foreground shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-start justify-between p-5 pb-3 border-b shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-amber-100 dark:bg-amber-950/40 text-amber-600 shrink-0">
              <Warehouse className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold leading-tight flex items-center gap-1.5">
                <span>Compartir Almacén Existente</span>
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
                <Building2 className="h-3 w-3 text-primary" />
                <span>Para: {branch.name} ({branch.city?.name || 'Ciudad'})</span>
              </p>
            </div>
          </div>
          <button onClick={() => onOpenChange(false)} className="text-muted-foreground hover:text-foreground p-1 rounded-md">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
          <div className="overflow-y-auto flex-1 p-5 space-y-4">
            <div>
              <label className="text-xs font-semibold text-foreground mb-1 block">
                Selecciona el almacén a compartir con esta sucursal *
              </label>
              <select
                value={selectedWarehouseId}
                onChange={(e) => setSelectedWarehouseId(e.target.value)}
                required
                disabled={assignableWarehouses.length === 0}
                className="h-9 w-full rounded-md border border-input bg-background px-3 text-xs font-medium shadow-sm focus:ring-1 focus:ring-primary"
              >
                <option value="">
                  {assignableWarehouses.length === 0 ? 'No hay otros almacenes disponibles' : '-- Seleccionar almacén existente --'}
                </option>
                {assignableWarehouses.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.name} — Actual en: {w.branch.name} ({w.branch.city?.name || 'Ciudad'}) • {w.stocksCount} ítems
                  </option>
                ))}
              </select>
              <p className="text-[11px] text-muted-foreground mt-1.5">
                Al seleccionar este almacén, {branch.name} tendrá acceso a él y a su inventario.
              </p>
            </div>
          </div>

          {/* Footer */}
          <div className="p-4 pt-3 border-t bg-muted/20 flex justify-end gap-2 shrink-0">
            <Button type="button" variant="outline" size="sm" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={!selectedWarehouseId || assignMutation.isPending || assignableWarehouses.length === 0}
              className="gap-1.5"
            >
              <Plus className="h-4 w-4" />
              <span>{assignMutation.isPending ? 'Compartiendo...' : 'Compartir con Sucursal'}</span>
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
