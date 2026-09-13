import React, { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { X } from 'lucide-react';
import { apiClient } from '@/shared/api/axios-client';
import { queryKeys } from '@/shared/api/query-keys';
import type { Supplier, CreateSupplierPayload, UpdateSupplierPayload } from '@/shared/types/api';
import { Button } from '@/shared/ui/Button';
import { Dialog } from '@/shared/ui/Dialog';
import { toast } from '@/shared/ui/Toast';

interface SupplierFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  supplier?: Supplier | null;
}

export function SupplierFormDialog({ open, onOpenChange, supplier }: SupplierFormDialogProps) {
  const qc = useQueryClient();
  const isEditing = !!supplier;

  const [form, setForm] = useState({
    name: '',
    contactEmail: '',
    phone: '',
    address: '',
  });

  useEffect(() => {
    if (supplier) {
      setForm({
        name: supplier.name || '',
        contactEmail: supplier.contactEmail || '',
        phone: supplier.phone || '',
        address: supplier.address || '',
      });
    } else {
      setForm({ name: '', contactEmail: '', phone: '', address: '' });
    }
  }, [supplier, open]);

  const createMutation = useMutation({
    mutationFn: (data: CreateSupplierPayload) => apiClient.post('/suppliers', data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.suppliers.list() });
      toast.success('Proveedor creado exitosamente');
      onOpenChange(false);
    },
    onError: (e: any) => {
      toast.error(e?.message || 'Error al crear proveedor');
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: UpdateSupplierPayload) => apiClient.patch(`/suppliers/${supplier!.id}`, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.suppliers.list() });
      toast.success('Proveedor actualizado exitosamente');
      onOpenChange(false);
    },
    onError: (e: any) => {
      toast.error(e?.message || 'Error al actualizar proveedor');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) {
      toast.error('El nombre del proveedor es obligatorio');
      return;
    }
    const payload = {
      name: form.name.trim(),
      contactEmail: form.contactEmail.trim() || undefined,
      phone: form.phone.trim() || undefined,
      address: form.address.trim() || undefined,
    };
    if (isEditing) {
      updateMutation.mutate(payload);
    } else {
      createMutation.mutate(payload as CreateSupplierPayload);
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title={isEditing ? 'Editar Proveedor' : 'Nuevo Proveedor'}
      description={isEditing ? `Editando: ${supplier?.name}` : 'Registra un nuevo proveedor de productos'}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Nombre */}
        <div className="space-y-1.5">
          <label className="text-sm font-medium">Nombre del Proveedor *</label>
          <input
            type="text"
            value={form.name}
            onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
            placeholder="Ej. Textiles Andinos S.A."
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            required
          />
        </div>

        {/* Email */}
        <div className="space-y-1.5">
          <label className="text-sm font-medium">Email de Contacto</label>
          <input
            type="email"
            value={form.contactEmail}
            onChange={(e) => setForm((p) => ({ ...p, contactEmail: e.target.value }))}
            placeholder="contacto@proveedor.com"
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        {/* Teléfono */}
        <div className="space-y-1.5">
          <label className="text-sm font-medium">Teléfono</label>
          <input
            type="text"
            value={form.phone}
            onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))}
            placeholder="+591 2 2810099"
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        {/* Dirección */}
        <div className="space-y-1.5">
          <label className="text-sm font-medium">Dirección</label>
          <textarea
            value={form.address}
            onChange={(e) => setForm((p) => ({ ...p, address: e.target.value }))}
            placeholder="Zona Industrial El Alto, Av. ..."
            rows={2}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none"
          />
        </div>

        <div className="flex justify-end gap-2 pt-2 border-t">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isPending}>
            <X className="h-4 w-4 mr-1" />
            Cancelar
          </Button>
          <Button type="submit" disabled={isPending}>
            {isPending ? 'Guardando...' : isEditing ? 'Guardar Cambios' : 'Crear Proveedor'}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
