import { Edit2, Ban, CheckCircle2, UserCheck, ShoppingBag, CalendarCheck } from 'lucide-react';
import type { UserListItem } from '@/shared/types/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/Card';
import { Button } from '@/shared/ui/Button';
import { Badge } from '@/shared/ui/Badge';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/shared/ui/Table';

interface UsersTableProps {
  users: UserListItem[];
  totalSystemUsers: number;
  isLoading: boolean;
  currentUserId?: string;
  onEdit: (user: UserListItem) => void;
  onToggleStatus: (user: UserListItem) => void;
}

export function UsersTable({
  users,
  totalSystemUsers,
  isLoading,
  currentUserId,
  onEdit,
  onToggleStatus,
}: UsersTableProps) {
  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'ADMIN':
        return 'destructive';
      case 'STORE_MANAGER':
        return 'default';
      case 'CASHIER':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'ADMIN':
        return 'Administrador';
      case 'STORE_MANAGER':
        return 'Encargado';
      case 'CASHIER':
        return 'Cajero';
      case 'CLIENT':
        return 'Cliente';
      default:
        return role;
    }
  };

  return (
    <Card className="shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center justify-between">
          <span>Usuarios Registrados ({users.length})</span>
          <span className="text-xs font-normal text-muted-foreground">
            Total sistema: {totalSystemUsers} cuentas
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="py-12 text-center text-sm text-muted-foreground">
            Cargando directorio de usuarios...
          </div>
        ) : users.length === 0 ? (
          <div className="py-12 text-center text-sm text-muted-foreground">
            No se encontraron usuarios para los filtros seleccionados.
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Usuario</TableHead>
                <TableHead>Contacto</TableHead>
                <TableHead>Roles Asignados</TableHead>
                <TableHead>Actividad</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((u) => {
                const isCurrentAdmin = u.id === currentUserId;
                return (
                  <TableRow key={u.id} className={!u.isActive ? 'bg-destructive/5 opacity-80' : undefined}>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-bold text-sm text-foreground flex items-center gap-1.5">
                          {u.fullName || `${u.firstName} ${u.lastName}`}
                          {isCurrentAdmin && (
                            <Badge variant="outline" className="text-[9px] text-primary border-primary">
                              Tú
                            </Badge>
                          )}
                        </span>
                        <span className="text-xs text-muted-foreground">{u.email}</span>
                      </div>
                    </TableCell>

                    <TableCell>
                      <div className="text-xs font-mono text-muted-foreground">
                        {u.phone || 'Sin teléfono'}
                      </div>
                    </TableCell>

                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {u.roles?.map((r) => (
                          <Badge
                            key={r}
                            variant={getRoleBadgeVariant(r) as any}
                            className="text-[10px] uppercase font-bold tracking-wider"
                          >
                            {getRoleLabel(r)}
                          </Badge>
                        ))}
                      </div>
                    </TableCell>

                    <TableCell>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1" title="Reservas realizadas">
                          <CalendarCheck className="h-3 w-3 text-primary" />
                          {u.reservationsCount ?? 0}
                        </span>
                        <span className="flex items-center gap-1" title="Pedidos / Compras">
                          <ShoppingBag className="h-3 w-3 text-emerald-600" />
                          {u.ordersCount ?? 0}
                        </span>
                      </div>
                    </TableCell>

                    <TableCell>
                      {u.isActive ? (
                        <Badge variant="success" className="text-[10px] gap-1">
                          <CheckCircle2 className="h-3 w-3" />
                          <span>Activo</span>
                        </Badge>
                      ) : (
                        <Badge variant="destructive" className="text-[10px] gap-1">
                          <Ban className="h-3 w-3" />
                          <span>Baneado / Inactivo</span>
                        </Badge>
                      )}
                    </TableCell>

                    <TableCell className="text-right space-x-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 text-xs gap-1"
                        onClick={() => onEdit(u)}
                      >
                        <Edit2 className="h-3.5 w-3.5" />
                        <span>Editar</span>
                      </Button>

                      {!isCurrentAdmin && (
                        <Button
                          variant={u.isActive ? 'outline' : 'secondary'}
                          size="sm"
                          className={`h-7 text-xs gap-1 ${
                            u.isActive
                              ? 'text-destructive hover:bg-destructive hover:text-destructive-foreground'
                              : 'text-emerald-600 hover:bg-emerald-600 hover:text-white'
                          }`}
                          onClick={() => onToggleStatus(u)}
                        >
                          {u.isActive ? (
                            <>
                              <Ban className="h-3.5 w-3.5" />
                              <span>Banear</span>
                            </>
                          ) : (
                            <>
                              <UserCheck className="h-3.5 w-3.5" />
                              <span>Activar</span>
                            </>
                          )}
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
