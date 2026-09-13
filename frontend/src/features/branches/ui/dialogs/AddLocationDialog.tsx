import React, { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { X, Store, Warehouse, Building2 } from 'lucide-react';
import { apiClient } from '@/shared/api/axios-client';
import { queryKeys } from '@/shared/api/query-keys';
import type { LocationType, Branch } from '@/shared/types/api';
import { Button } from '@/shared/ui/Button';
import { toast } from '@/shared/ui/Toast';

interface AddLocationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  branchTarget?: Branch | null;
  branches?: Branch[];
  defaultType?: LocationType;
}

export function AddLocationDialog({
  open,
  onOpenChange,
  branchTarget,
  branches = [],
  defaultType = 'WAREHOUSE',
}: AddLocationDialogProps) {
  const queryClient = useQueryClient();
  const isWarehouse = defaultType === 'WAREHOUSE';

  const [selectedBranchId, setSelectedBranchId] = useState<string>('');
  const [name, setName] = useState('');

  useEffect(() => {
    if (open) {
      setName('');
      if (branchTarget) {
        setSelectedBranchId(branchTarget.id);
      } else if (branches.length > 0) {
        setSelectedBranchId(branches[0].id);
      } else {
        setSelectedBranchId('');
      }
    }
  }, [open, branchTarget, branches]);

  const addMutation = useMutation({
    mutationFn: async () => {
      const res = await apiClient.post(`/branches/${selectedBranchId}/locations`, {
        name: name.trim(),
        type: defaultType,
      });
      return res.data;
    },
    onSuccess: () => {
      toast.success(
        isWarehouse ? 'Almacén registrado' : 'Punto POS registrado',
        `Se agregó "${name.trim()}" correctamente.`,
      );
      queryClient.invalidateQueries({ queryKey: queryKeys.branches.all });
      onOpenChange(false);
    },
    onError: (err: any) => {
      toast.error('Error al crear ubicación', err.response?.data?.message || 'Verifica los datos');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error('Nombre requerido', 'Ingresa un nombre para la ubicación.');
      return;
    }
    if (!selectedBranchId) {
      toast.error('Sucursal requerida', 'Selecciona la sucursal de destino.');
      return;
    }
    addMutation.mutate();
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-md p-4">
      <div className="relative w-full max-w-md max-h-[90vh] flex flex-col rounded-2xl border border-border bg-card text-card-foreground shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-start justify-between p-5 pb-3 border-b shrink-0">
          <div className="flex items-center gap-2.5">
            <div className={`p-2 rounded-lg shrink-0 ${isWarehouse ? 'bg-amber-100 text-amber-600 dark:bg-amber-950/40' : 'bg-emerald-100 text-emerald-600 dark:bg-emerald-950/40'}`}>
              {isWarehouse ? <Warehouse className="h-5 w-5" /> : <Store className="h-5 w-5" />}
            </div>
            <div>
              <h3 className="text-base font-bold leading-tight">
                {isWarehouse ? 'Nuevo Almacén / Depósito' : 'Nuevo Punto de Venta (POS)'}
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                {isWarehouse ? 'Registra una bodega física de reposición' : 'Registra un mostrador comercial o caja de cobro'}
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
                Nombre de {isWarehouse ? 'Almacén' : 'Punto POS'} *
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={isWarehouse ? 'Ej: Almacén Principal, Bodega B' : 'Ej: Mostrador Principal, Caja 2'}
                className="h-9 w-full rounded-md border border-input bg-background px-3 text-xs shadow-sm focus:ring-1 focus:ring-primary"
                autoFocus
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-foreground flex items-center gap-1.5 mb-1">
                <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
                <span>Sucursal Asignada *</span>
              </label>
              {branchTarget ? (
                <div className="h-9 px-3 rounded-md bg-muted/50 border flex items-center text-xs font-medium">
                  {branchTarget.name} ({branchTarget.city?.name || 'Ciudad'})
                </div>
              ) : (
                <select
                  value={selectedBranchId}
                  onChange={(e) => setSelectedBranchId(e.target.value)}
                  required
                  className="h-9 w-full rounded-md border border-input bg-background px-3 text-xs font-medium shadow-sm focus:ring-1 focus:ring-primary"
                >
                  {branches.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name} ({b.city?.name || 'Ciudad'})
                    </option>
                  ))}
                </select>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="p-4 pt-3 border-t bg-muted/20 flex justify-end gap-2 shrink-0">
            <Button type="button" variant="outline" size="sm" disabled={addMutation.isPending} onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" size="sm" disabled={addMutation.isPending}>
              {addMutation.isPending ? 'Guardando...' : 'Crear Ubicación'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
