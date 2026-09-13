import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Plus,
  Search,
  Truck,
  Mail,
  Phone,
  MapPin,
  Package,
  Pencil,
  Trash2,
} from 'lucide-react';
import { apiClient } from '@/shared/api/axios-client';
import { queryKeys } from '@/shared/api/query-keys';
import { STALE_TIMES } from '@/app/providers/QueryProvider';
import type { Supplier } from '@/shared/types/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/Card';
import { Button } from '@/shared/ui/Button';
import { Badge } from '@/shared/ui/Badge';
import { toast } from '@/shared/ui/Toast';
import { SupplierFormDialog } from '@/features/suppliers/ui/SupplierFormDialog';

export function SuppliersPage() {
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const { data: suppliers = [], isLoading } = useQuery<Supplier[]>({
    queryKey: queryKeys.suppliers.list(search || undefined),
    queryFn: async () => {
      const res = await apiClient.get('/suppliers', {
        params: search.trim() ? { search: search.trim() } : {},
      });
      return res.data;
    },
    staleTime: STALE_TIMES.SEMI,
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiClient.delete(`/suppliers/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.suppliers.list() });
      toast.success('Proveedor eliminado');
      setDeleteConfirmId(null);
    },
    onError: (e: any) => {
      toast.error(e?.message || 'No se puede eliminar: el proveedor tiene productos asociados');
      setDeleteConfirmId(null);
    },
  });

  const handleNew = () => {
    setEditingSupplier(null);
    setDialogOpen(true);
  };

  const handleEdit = (s: Supplier) => {
    setEditingSupplier(s);
    setDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Proveedores</h1>
          <p className="text-sm text-muted-foreground">
            Gestiona los proveedores de productos de la tienda
          </p>
        </div>
        <Button onClick={handleNew} id="btn-new-supplier">
          <Plus className="h-4 w-4 mr-2" />
          Nuevo Proveedor
        </Button>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar proveedor..."
          className="w-full rounded-md border border-input bg-background pl-9 pr-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
        />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Truck className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{suppliers.length}</p>
                <p className="text-xs text-muted-foreground">Total Proveedores</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                <Package className="h-5 w-5 text-emerald-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {suppliers.reduce((acc, s) => acc + (s.productsCount || 0), 0)}
                </p>
                <p className="text-xs text-muted-foreground">Productos Asociados</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Table / Cards */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Lista de Proveedores</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-10">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            </div>
          ) : suppliers.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-muted-foreground">
              <Truck className="h-10 w-10 mb-3 opacity-30" />
              <p className="text-sm">
                {search ? 'No se encontraron proveedores con ese criterio' : 'No hay proveedores registrados'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left">
                    <th className="pb-3 pr-4 font-medium text-muted-foreground">Proveedor</th>
                    <th className="pb-3 pr-4 font-medium text-muted-foreground">Contacto</th>
                    <th className="pb-3 pr-4 font-medium text-muted-foreground">Teléfono</th>
                    <th className="pb-3 pr-4 font-medium text-muted-foreground">Dirección</th>
                    <th className="pb-3 pr-4 font-medium text-muted-foreground">Productos</th>
                    <th className="pb-3 font-medium text-muted-foreground text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {suppliers.map((s) => (
                    <tr key={s.id} className="group hover:bg-muted/30 transition-colors">
                      <td className="py-3 pr-4">
                        <div className="flex items-center gap-2">
                          <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                            <Truck className="h-4 w-4 text-primary" />
                          </div>
                          <span className="font-medium">{s.name}</span>
                        </div>
                      </td>
                      <td className="py-3 pr-4">
                        {s.contactEmail ? (
                          <div className="flex items-center gap-1 text-muted-foreground">
                            <Mail className="h-3.5 w-3.5 shrink-0" />
                            <span className="truncate max-w-[160px]">{s.contactEmail}</span>
                          </div>
                        ) : (
                          <span className="text-muted-foreground text-xs">—</span>
                        )}
                      </td>
                      <td className="py-3 pr-4">
                        {s.phone ? (
                          <div className="flex items-center gap-1 text-muted-foreground">
                            <Phone className="h-3.5 w-3.5 shrink-0" />
                            <span>{s.phone}</span>
                          </div>
                        ) : (
                          <span className="text-muted-foreground text-xs">—</span>
                        )}
                      </td>
                      <td className="py-3 pr-4">
                        {s.address ? (
                          <div className="flex items-center gap-1 text-muted-foreground">
                            <MapPin className="h-3.5 w-3.5 shrink-0" />
                            <span className="truncate max-w-[150px]">{s.address}</span>
                          </div>
                        ) : (
                          <span className="text-muted-foreground text-xs">—</span>
                        )}
                      </td>
                      <td className="py-3 pr-4">
                        <Badge variant="secondary">
                          <Package className="h-3 w-3 mr-1" />
                          {s.productsCount} producto{s.productsCount !== 1 ? 's' : ''}
                        </Badge>
                      </td>
                      <td className="py-3">
                        <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleEdit(s)}
                            title="Editar proveedor"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          {deleteConfirmId === s.id ? (
                            <div className="flex items-center gap-1">
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => deleteMutation.mutate(s.id)}
                                disabled={deleteMutation.isPending}
                              >
                                Confirmar
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => setDeleteConfirmId(null)}
                              >
                                Cancelar
                              </Button>
                            </div>
                          ) : (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => setDeleteConfirmId(s.id)}
                              title="Eliminar proveedor"
                              className="text-destructive hover:text-destructive"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog */}
      <SupplierFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        supplier={editingSupplier}
      />
    </div>
  );
}
