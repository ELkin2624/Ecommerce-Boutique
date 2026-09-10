import React, { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { MapPin } from 'lucide-react';
import { apiClient } from '@/shared/api/axios-client';
import { queryKeys } from '@/shared/api/query-keys';
import { useAuthStore } from '@/app/store/auth.store';

interface LocationWithBranch {
  id: string;
  name: string;
  type: string;
  branch: {
    id: string;
    name: string;
    city?: { name: string };
  };
}

export function BranchSwitcher() {
  const { activeBranchId, activeBranchName, setActiveBranch, hasRole } = useAuthStore();
  const isAdmin = hasRole('ADMIN');

  const { data: locations = [] } = useQuery<LocationWithBranch[]>({
    queryKey: queryKeys.branches.locations(),
    queryFn: async () => {
      const res = await apiClient.get('/inventory/locations');
      return res.data;
    },
  });

  // Extraer sucursales únicas
  const branches = React.useMemo(() => {
    const map = new Map<string, { id: string; name: string }>();
    locations.forEach((loc) => {
      if (loc.branch && !map.has(loc.branch.id)) {
        map.set(loc.branch.id, { id: loc.branch.id, name: loc.branch.name });
      }
    });
    return Array.from(map.values());
  }, [locations]);

  // Si no hay sucursal seleccionada, seleccionar la primera por defecto
  useEffect(() => {
    if (branches.length > 0 && !activeBranchId) {
      setActiveBranch(branches[0].id, branches[0].name);
    }
  }, [branches, activeBranchId, setActiveBranch]);

  if (branches.length === 0) {
    return (
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground bg-muted/50 px-2.5 py-1.5 rounded-md border">
        <MapPin className="h-3.5 w-3.5" />
        <span>Cargando sucursales...</span>
      </div>
    );
  }

  // Si no es Admin, muestra sucursal fija asignada
  if (!isAdmin) {
    return (
      <div className="flex items-center gap-1.5 text-xs font-medium text-foreground bg-muted/60 px-3 py-1.5 rounded-md border">
        <MapPin className="h-3.5 w-3.5 text-primary" />
        <span>Sucursal: {activeBranchName || branches[0]?.name}</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <MapPin className="h-4 w-4 text-muted-foreground shrink-0" />
      <select
        value={activeBranchId || ''}
        onChange={(e) => {
          const selected = branches.find((b) => b.id === e.target.value);
          if (selected) {
            setActiveBranch(selected.id, selected.name);
          }
        }}
        className="h-8 rounded-md border border-input bg-background px-2 py-1 text-xs font-medium focus:outline-none focus:ring-1 focus:ring-ring"
      >
        {branches.map((b) => (
          <option key={b.id} value={b.id}>
            {b.name}
          </option>
        ))}
      </select>
    </div>
  );
}
