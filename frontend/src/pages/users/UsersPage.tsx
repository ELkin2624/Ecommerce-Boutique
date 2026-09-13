import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Users, UserPlus } from 'lucide-react';
import { apiClient } from '@/shared/api/axios-client';
import { queryKeys } from '@/shared/api/query-keys';
import { useAuthStore } from '@/app/store/auth.store';
import type { UserListItem } from '@/shared/types/api';
import { Button } from '@/shared/ui/Button';
import { toast } from '@/shared/ui/Toast';

import { UserFormDialog } from '@/features/users/ui/UserFormDialog';
import { UserFilters } from '@/features/users/ui/UserFilters';
import { UsersTable } from '@/features/users/ui/UsersTable';
import { UserStatusDialog } from '@/features/users/ui/UserStatusDialog';

export function UsersPage() {
  const { user: currentLoggedUser } = useAuthStore();
  const queryClient = useQueryClient();

  const [roleFilter, setRoleFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL'); // 'ALL' | 'ACTIVE' | 'BANNED'
  const [searchTerm, setSearchTerm] = useState('');

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [userToEdit, setUserToEdit] = useState<UserListItem | null>(null);
  const [userToToggle, setUserToToggle] = useState<UserListItem | null>(null);

  // Consultar usuarios
  const { data: usersData, isLoading } = useQuery<{ items: UserListItem[]; meta: any }>({
    queryKey: queryKeys.users.list({ role: roleFilter, status: statusFilter }),
    queryFn: async () => {
      const params: any = { limit: 100 };
      if (roleFilter !== 'ALL') params.role = roleFilter;
      if (statusFilter === 'ACTIVE') params.isActive = true;
      if (statusFilter === 'BANNED') params.isActive = false;

      const res = await apiClient.get('/users', { params });
      return res.data;
    },
  });

  const allUsers: UserListItem[] = Array.isArray(usersData)
    ? usersData
    : usersData?.items || [];

  const filteredUsers = allUsers.filter((u) => {
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    const fullName = (u.fullName || `${u.firstName} ${u.lastName}`).toLowerCase();
    const email = u.email.toLowerCase();
    const phone = (u.phone || '').toLowerCase();
    return fullName.includes(term) || email.includes(term) || phone.includes(term);
  });

  // Mutación para activar / banear usuario
  const toggleStatusMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      const res = await apiClient.patch(`/users/${id}/status`, { isActive });
      return res.data;
    },
    onSuccess: (data) => {
      toast.success(
        data.isActive ? 'Usuario activado' : 'Usuario baneado/desactivado',
        data.message,
      );
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setUserToToggle(null);
    },
    onError: (err: any) => {
      toast.error(
        'Operación no permitida',
        err.response?.data?.message || 'No se pudo cambiar el estado del usuario',
      );
    },
  });

  const handleOpenCreate = () => {
    setUserToEdit(null);
    setIsDialogOpen(true);
  };

  const handleOpenEdit = (u: UserListItem) => {
    setUserToEdit(u);
    setIsDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Users className="h-6 w-6 text-primary" />
            <span>Gestión de Usuarios y Roles</span>
          </h1>
          <p className="text-xs text-muted-foreground">
            Control centralizado de accesos, roles de personal y políticas de baneo inmutable (Soft-Delete)
          </p>
        </div>

        <Button onClick={handleOpenCreate} className="gap-2 shadow-sm">
          <UserPlus className="h-4 w-4" />
          <span>Nuevo Usuario</span>
        </Button>
      </div>

      <UserFilters
        roleFilter={roleFilter}
        setRoleFilter={setRoleFilter}
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
      />

      <UsersTable
        users={filteredUsers}
        totalSystemUsers={allUsers.length}
        isLoading={isLoading}
        currentUserId={currentLoggedUser?.id}
        onEdit={handleOpenEdit}
        onToggleStatus={setUserToToggle}
      />

      <UserFormDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        userToEdit={userToEdit}
      />

      <UserStatusDialog
        userToToggle={userToToggle}
        onClose={() => setUserToToggle(null)}
        onConfirm={(id, isActive) => toggleStatusMutation.mutate({ id, isActive })}
        isPending={toggleStatusMutation.isPending}
      />
    </div>
  );
} 
