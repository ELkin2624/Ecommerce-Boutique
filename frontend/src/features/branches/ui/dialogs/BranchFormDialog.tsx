import React, { useState, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { X, Building2, Save, Store, Warehouse } from 'lucide-react';
import { apiClient } from '@/shared/api/axios-client';
import { queryKeys } from '@/shared/api/query-keys';
import { STALE_TIMES } from '@/app/providers/QueryProvider';
import type { Branch, City, CreateBranchPayload, UpdateBranchPayload, LocationType } from '@/shared/types/api';
import { Button } from '@/shared/ui/Button';
import { toast } from '@/shared/ui/Toast';

interface BranchFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  branchToEdit?: Branch | null;
}

export function BranchFormDialog({ open, onOpenChange, branchToEdit }: BranchFormDialogProps) {
  const queryClient = useQueryClient();
  const isEditing = Boolean(branchToEdit);

  const [formData, setFormData] = useState({
    name: '',
    address: '',
    phone: '',
    cityId: '',
    newCityName: '',
  });

  const [isCreatingCity, setIsCreatingCity] = useState(false);
  const [createSalesFloor, setCreateSalesFloor] = useState(true);
  const [createWarehouse, setCreateWarehouse] = useState(true);

  const { data: cities = [] } = useQuery<City[]>({
    queryKey: queryKeys.branches.cities,
    queryFn: async () => (await apiClient.get('/branches/cities')).data,
    enabled: open,
    staleTime: STALE_TIMES.STATIC,
  });

  useEffect(() => {
    if (branchToEdit) {
      setFormData({
        name: branchToEdit.name || '',
        address: branchToEdit.address || '',
        phone: branchToEdit.phone || '',
        cityId: branchToEdit.cityId || '',
        newCityName: '',
      });
      setIsCreatingCity(false);
    } else {
      setFormData({ name: '', address: '', phone: '', cityId: '', newCityName: '' });
      setIsCreatingCity(false);
      setCreateSalesFloor(true);
      setCreateWarehouse(true);
    }
  }, [branchToEdit, open]);

  useEffect(() => {
    if (!branchToEdit && cities.length > 0) {
      setFormData((prev) => (prev.cityId ? prev : { ...prev, cityId: cities[0].id }));
    }
  }, [cities, branchToEdit]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      let targetCityId = formData.cityId;
      if (isCreatingCity) {
        if (!formData.newCityName.trim()) throw new Error('Escribe el nombre de la nueva ciudad');
        const cityRes = await apiClient.post('/branches/cities', { name: formData.newCityName.trim() });
        targetCityId = cityRes.data.id;
        queryClient.invalidateQueries({ queryKey: queryKeys.branches.cities });
      }

      if (isEditing && branchToEdit) {
        const payload: UpdateBranchPayload = {
          name: formData.name.trim(),
          address: formData.address.trim(),
          phone: formData.phone.trim() || undefined,
          cityId: targetCityId,
        };
        return (await apiClient.patch(`/branches/${branchToEdit.id}`, payload)).data;
      }

      const initialLocations: { name: string; type: LocationType }[] = [];
      if (createSalesFloor) initialLocations.push({ name: `Piso de Ventas ${formData.name.trim()}`, type: 'SALES_FLOOR' });
      if (createWarehouse) initialLocations.push({ name: `Almacén Principal ${formData.name.trim()}`, type: 'WAREHOUSE' });

      const payload: CreateBranchPayload = {
        name: formData.name.trim(),
        address: formData.address.trim(),
        phone: formData.phone.trim() || undefined,
        cityId: targetCityId,
        locations: initialLocations.length > 0 ? initialLocations : undefined,
      };
      return (await apiClient.post('/branches', payload)).data;
    },
    onSuccess: () => {
      toast.success(isEditing ? 'Sucursal actualizada' : 'Sucursal creada', 'Operación completada exitosamente');
      queryClient.invalidateQueries({ queryKey: queryKeys.branches.all });
      onOpenChange(false);
    },
    onError: (err: any) => {
      toast.error('Error al guardar', err.response?.data?.message || err.message || 'Verifica los datos');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.address.trim()) {
      toast.error('Campos obligatorios', 'Por favor ingresa nombre y dirección');
      return;
    }
    saveMutation.mutate();
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-md p-4">
      <div className="relative w-full max-w-lg max-h-[90vh] flex flex-col rounded-2xl border border-border bg-card text-card-foreground shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-5 pb-3 border-b shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
              {isEditing ? <Save className="h-5 w-5" /> : <Building2 className="h-5 w-5" />}
            </div>
            <div>
              <h2 className="text-base font-bold text-foreground">{isEditing ? 'Editar Sucursal' : 'Nueva Sucursal'}</h2>
              <p className="text-xs text-muted-foreground">{isEditing ? 'Actualiza los datos de la sucursal' : 'Registra una nueva sede comercial'}</p>
            </div>
          </div>
          <button type="button" onClick={() => onOpenChange(false)} className="text-muted-foreground hover:text-foreground p-1 rounded-md">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
          <div className="overflow-y-auto flex-1 p-5 space-y-4">
            <div>
              <label className="text-xs font-semibold text-foreground">Nombre de Sucursal *</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="mt-1 flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-xs shadow-sm focus:ring-1 focus:ring-primary"
                placeholder="Ej. Sucursal Centro"
                autoFocus
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-foreground">Dirección *</label>
              <input
                type="text"
                required
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                className="mt-1 flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-xs shadow-sm focus:ring-1 focus:ring-primary"
                placeholder="Ej. Av. Montenegro #1234"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-foreground">Teléfono</label>
                <input
                  type="text"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="mt-1 flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-xs shadow-sm focus:ring-1 focus:ring-primary"
                  placeholder="+591 2 2770000"
                />
              </div>

              <div>
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-foreground">Ciudad *</label>
                  <button type="button" onClick={() => setIsCreatingCity(!isCreatingCity)} className="text-[10px] text-primary hover:underline">
                    {isCreatingCity ? 'Seleccionar existente' : '+ Nueva Ciudad'}
                  </button>
                </div>
                {isCreatingCity ? (
                  <input
                    type="text"
                    required
                    value={formData.newCityName}
                    onChange={(e) => setFormData({ ...formData, newCityName: e.target.value })}
                    className="mt-1 flex h-9 w-full rounded-md border border-primary bg-background px-3 py-1 text-xs shadow-sm focus:ring-1 focus:ring-primary"
                    placeholder="Nombre de la ciudad"
                  />
                ) : (
                  <select
                    required
                    value={formData.cityId}
                    onChange={(e) => setFormData({ ...formData, cityId: e.target.value })}
                    className="mt-1 flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-xs shadow-sm focus:ring-1 focus:ring-primary"
                  >
                    <option value="">Selecciona ciudad</option>
                    {cities.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                )}
              </div>
            </div>

            {!isEditing && (
              <div className="rounded-xl border bg-muted/30 p-3.5 space-y-2">
                <p className="text-xs font-bold text-foreground">Ubicaciones iniciales automáticas:</p>
                <label className="flex items-center gap-2.5 p-2 rounded-lg border border-border bg-background cursor-pointer hover:bg-muted/40">
                  <input
                    type="checkbox"
                    checked={createSalesFloor}
                    onChange={(e) => setCreateSalesFloor(e.target.checked)}
                    className="h-4 w-4 rounded text-primary focus:ring-primary"
                  />
                  <Store className="h-4 w-4 text-emerald-600" />
                  <span className="text-xs font-semibold text-foreground">Piso de Venta (Mostrador POS)</span>
                </label>

                <label className="flex items-center gap-2.5 p-2 rounded-lg border border-border bg-background cursor-pointer hover:bg-muted/40">
                  <input
                    type="checkbox"
                    checked={createWarehouse}
                    onChange={(e) => setCreateWarehouse(e.target.checked)}
                    className="h-4 w-4 rounded text-primary focus:ring-primary"
                  />
                  <Warehouse className="h-4 w-4 text-amber-600" />
                  <span className="text-xs font-semibold text-foreground">Almacén Principal interno</span>
                </label>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-4 pt-3 border-t bg-muted/20 flex justify-end gap-2 shrink-0">
            <Button type="button" variant="outline" size="sm" disabled={saveMutation.isPending} onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" size="sm" disabled={saveMutation.isPending}>
              {saveMutation.isPending ? 'Guardando...' : isEditing ? 'Guardar Cambios' : 'Crear Sucursal'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
