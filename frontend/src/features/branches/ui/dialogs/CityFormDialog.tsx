import React, { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { X, MapPin, Plus, Save } from 'lucide-react';
import { apiClient } from '@/shared/api/axios-client';
import { queryKeys } from '@/shared/api/query-keys';
import type { City } from '@/shared/types/api';
import { Button } from '@/shared/ui/Button';
import { toast } from '@/shared/ui/Toast';

interface CityFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  cityToEdit: City | null;
}

export function CityFormDialog({ open, onOpenChange, cityToEdit }: CityFormDialogProps) {
  const queryClient = useQueryClient();
  const isEditing = Boolean(cityToEdit);
  const [name, setName] = useState('');

  useEffect(() => {
    if (open) {
      setName(cityToEdit?.name || '');
    }
  }, [open, cityToEdit]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const trimmed = name.trim();
      if (isEditing && cityToEdit) {
        return (await apiClient.patch(`/branches/cities/${cityToEdit.id}`, { name: trimmed })).data;
      }
      return (await apiClient.post('/branches/cities', { name: trimmed })).data;
    },
    onSuccess: (data) => {
      toast.success(
        isEditing ? 'Ciudad actualizada' : 'Ciudad registrada',
        isEditing
          ? `El nombre fue modificado a "${data.name}".`
          : `La ciudad "${data.name}" fue creada exitosamente.`
      );
      queryClient.invalidateQueries({ queryKey: queryKeys.branches.cities });
      queryClient.invalidateQueries({ queryKey: queryKeys.branches.all });
      onOpenChange(false);
    },
    onError: (err: any) => {
      toast.error('Error al guardar ciudad', err.response?.data?.message || 'Verifica los datos ingresados.');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error('Nombre requerido', 'Ingresa el nombre de la ciudad.');
      return;
    }
    saveMutation.mutate();
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-md p-4 animate-in fade-in-50">
      <div className="relative w-full max-w-md flex flex-col rounded-2xl border border-border bg-card text-card-foreground shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-start justify-between p-5 pb-4 border-b shrink-0 bg-muted/10">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-primary/10 text-primary border border-primary/20 shrink-0">
              <MapPin className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold leading-tight">
                {isEditing ? 'Editar Ciudad' : 'Nueva Ciudad'}
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                {isEditing
                  ? 'Modifica el nombre de la ciudad en el sistema'
                  : 'Registra una nueva ciudad para ubicar sucursales'}
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

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex flex-col flex-1">
          <div className="p-5 space-y-4">
            <div>
              <label className="text-xs font-semibold text-foreground mb-1 block">
                Nombre de la Ciudad *
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ej: Santa Cruz, La Paz, Cochabamba, Tarija"
                className="h-9 w-full rounded-md border border-input bg-background px-3 text-xs shadow-sm focus:ring-1 focus:ring-primary focus:outline-hidden"
                autoFocus
              />
              <p className="text-[11px] text-muted-foreground mt-1">
                Este nombre aparecerá en los filtros y direcciones de sucursales.
              </p>
            </div>
          </div>

          {/* Footer */}
          <div className="p-4 border-t bg-muted/20 flex justify-end gap-2 shrink-0">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={saveMutation.isPending}
              onClick={() => onOpenChange(false)}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={saveMutation.isPending || !name.trim()}
              className="gap-1.5 shadow-sm"
            >
              {isEditing ? <Save className="h-3.5 w-3.5" /> : <Plus className="h-3.5 w-3.5" />}
              <span>{saveMutation.isPending ? 'Guardando...' : isEditing ? 'Guardar Cambios' : 'Registrar Ciudad'}</span>
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
