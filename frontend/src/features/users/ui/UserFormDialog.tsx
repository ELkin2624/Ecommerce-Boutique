import React, { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { X, UserPlus, Save, Shield } from 'lucide-react';
import { apiClient } from '@/shared/api/axios-client';
import type { UserListItem, CreateUserPayload, UpdateUserPayload } from '@/shared/types/api';
import { Button } from '@/shared/ui/Button';
import { toast } from '@/shared/ui/Toast';

interface UserFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userToEdit?: UserListItem | null;
}

const AVAILABLE_ROLES = [
  { name: 'ADMIN', label: 'Administrador', description: 'Acceso total a la configuración y finanzas' },
  { name: 'STORE_MANAGER', label: 'Encargado de Sucursal', description: 'Gestión de inventario y probadores' },
  { name: 'CASHIER', label: 'Cajero / Piso', description: 'Punto de venta físico y cobro' },
  { name: 'CLIENT', label: 'Cliente', description: 'Compras web/móvil y reservas de probador' },
];

export function UserFormDialog({ open, onOpenChange, userToEdit }: UserFormDialogProps) {
  const queryClient = useQueryClient();
  const isEditing = Boolean(userToEdit);

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
    roles: ['CLIENT'],
  });

  useEffect(() => {
    if (userToEdit) {
      setFormData({
        firstName: userToEdit.firstName || '',
        lastName: userToEdit.lastName || '',
        email: userToEdit.email || '',
        phone: userToEdit.phone || '',
        password: '',
        roles: userToEdit.roles?.length ? userToEdit.roles : ['CLIENT'],
      });
    } else {
      setFormData({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        password: '',
        roles: ['CLIENT'],
      });
    }
  }, [userToEdit, open]);

  const toggleRole = (roleName: string) => {
    setFormData((prev) => {
      const exists = prev.roles.includes(roleName);
      if (exists) {
        // Al menos debe tener un rol
        if (prev.roles.length === 1) {
          toast.warning('Rol requerido', 'El usuario debe tener al menos un rol asignado');
          return prev;
        }
        return { ...prev, roles: prev.roles.filter((r) => r !== roleName) };
      }
      return { ...prev, roles: [...prev.roles, roleName] };
    });
  };

  const createMutation = useMutation({
    mutationFn: async (payload: CreateUserPayload) => {
      const res = await apiClient.post('/users', payload);
      return res.data;
    },
    onSuccess: () => {
      toast.success('Usuario creado', 'El nuevo usuario ha sido registrado exitosamente');
      queryClient.invalidateQueries({ queryKey: ['users'] });
      onOpenChange(false);
    },
    onError: (err: any) => {
      toast.error('Error al crear usuario', err.response?.data?.message || 'Verifica los datos');
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, payload }: { id: string; payload: UpdateUserPayload }) => {
      const res = await apiClient.patch(`/users/${id}`, payload);
      return res.data;
    },
    onSuccess: () => {
      toast.success('Usuario actualizado', 'Los datos del usuario han sido actualizados');
      queryClient.invalidateQueries({ queryKey: ['users'] });
      onOpenChange(false);
    },
    onError: (err: any) => {
      toast.error('Error al actualizar', err.response?.data?.message || 'Verifica los datos');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.firstName.trim() || !formData.lastName.trim()) {
      toast.error('Campos obligatorios', 'Por favor ingresa nombre y apellido');
      return;
    }

    if (!isEditing && (!formData.email.trim() || !formData.password.trim())) {
      toast.error('Campos obligatorios', 'Email y contraseña son obligatorios para nuevos usuarios');
      return;
    }

    if (isEditing && userToEdit) {
      updateMutation.mutate({
        id: userToEdit.id,
        payload: {
          firstName: formData.firstName,
          lastName: formData.lastName,
          phone: formData.phone || undefined,
          password: formData.password.trim() ? formData.password : undefined,
          roleNames: formData.roles,
        },
      });
    } else {
      createMutation.mutate({
        email: formData.email.trim(),
        password: formData.password,
        firstName: formData.firstName,
        lastName: formData.lastName,
        phone: formData.phone || undefined,
        roleNames: formData.roles,
      });
    }
  };

  if (!open) return null;

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-md p-4 overflow-y-auto">
      <div className="relative w-full max-w-lg rounded-2xl border border-border bg-white dark:bg-slate-900 text-foreground p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        <button
          onClick={() => onOpenChange(false)}
          className="absolute right-4 top-4 rounded-md p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="flex items-center gap-2 pb-4 border-b">
          <div className="h-9 w-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
            {isEditing ? <Save className="h-5 w-5" /> : <UserPlus className="h-5 w-5" />}
          </div>
          <div>
            <h2 className="text-lg font-bold">
              {isEditing ? 'Editar Usuario' : 'Nuevo Usuario'}
            </h2>
            <p className="text-xs text-muted-foreground">
              {isEditing ? 'Modifica los datos y asignación de roles' : 'Registra un cliente, cajero, encargado o administrador'}
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-foreground">Nombre *</label>
              <input
                type="text"
                required
                value={formData.firstName}
                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                className="mt-1 flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-xs shadow-sm focus:outline-none focus:ring-1 focus:ring-primary"
                placeholder="Ej. Carlos"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-foreground">Apellido *</label>
              <input
                type="text"
                required
                value={formData.lastName}
                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                className="mt-1 flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-xs shadow-sm focus:outline-none focus:ring-1 focus:ring-primary"
                placeholder="Ej. Mamani"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-foreground">Correo Electrónico *</label>
              <input
                type="email"
                required
                disabled={isEditing}
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="mt-1 flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-xs shadow-sm focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-60 disabled:cursor-not-allowed"
                placeholder="ejemplo@fashionstore.com"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-foreground">Teléfono</label>
              <input
                type="text"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="mt-1 flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-xs shadow-sm focus:outline-none focus:ring-1 focus:ring-primary"
                placeholder="+591 70000000"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-foreground">
              {isEditing ? 'Nueva Contraseña (dejar en blanco para conservar actual)' : 'Contraseña Inicial *'}
            </label>
            <input
              type="password"
              required={!isEditing}
              minLength={6}
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              className="mt-1 flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-xs shadow-sm focus:outline-none focus:ring-1 focus:ring-primary"
              placeholder={isEditing ? '••••••••' : 'Mínimo 6 caracteres'}
            />
          </div>

          {/* Asignación de Roles */}
          <div>
            <label className="text-xs font-semibold text-foreground flex items-center gap-1.5 mb-2">
              <Shield className="h-3.5 w-3.5 text-primary" />
              <span>Roles y Privilegios *</span>
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {AVAILABLE_ROLES.map((role) => {
                const isSelected = formData.roles.includes(role.name);
                return (
                  <div
                    key={role.name}
                    onClick={() => toggleRole(role.name)}
                    className={`cursor-pointer rounded-lg border p-2.5 transition-all text-left flex items-start gap-2.5 ${
                      isSelected
                        ? 'border-primary bg-primary/5 text-foreground'
                        : 'border-input bg-card text-muted-foreground hover:border-primary/40'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => {}}
                      className="mt-0.5 rounded border-primary text-primary focus:ring-primary"
                    />
                    <div className="flex-1">
                      <div className="text-xs font-bold leading-tight">{role.label}</div>
                      <div className="text-[10px] text-muted-foreground leading-tight mt-0.5">
                        {role.description}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t mt-4">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={isPending}
              onClick={() => onOpenChange(false)}
            >
              Cancelar
            </Button>
            <Button type="submit" size="sm" disabled={isPending}>
              {isPending ? 'Guardando...' : isEditing ? 'Actualizar Usuario' : 'Crear Usuario'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
