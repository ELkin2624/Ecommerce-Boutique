import { useState } from 'react';
import { Search, Filter, ChevronDown } from 'lucide-react';
import { Card, CardContent } from '@/shared/ui/Card';

interface UserFiltersProps {
  roleFilter: string;
  setRoleFilter: (val: string) => void;
  statusFilter: string;
  setStatusFilter: (val: string) => void;
  searchTerm: string;
  setSearchTerm: (val: string) => void;
}

export function UserFilters({
  roleFilter,
  setRoleFilter,
  statusFilter,
  setStatusFilter,
  searchTerm,
  setSearchTerm,
}: UserFiltersProps) {
  const [isRoleDropdownOpen, setIsRoleDropdownOpen] = useState(false);

  return (
    <Card className="shadow-sm">
      <CardContent className="p-4 space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Custom Role Dropdown */}
          <div className="relative">
            <button
              onClick={() => setIsRoleDropdownOpen(!isRoleDropdownOpen)}
              className="flex items-center justify-between gap-2 h-9 px-3 w-44 rounded-md border border-input bg-background shadow-sm hover:bg-muted/50 transition-colors focus:outline-none focus:ring-1 focus:ring-primary"
            >
              <div className="flex items-center gap-2">
                <Filter className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-xs font-semibold text-foreground truncate">
                  {
                    [
                      { id: 'ALL', label: 'Todos los Roles' },
                      { id: 'ADMIN', label: 'Admins' },
                      { id: 'STORE_MANAGER', label: 'Encargados' },
                      { id: 'CASHIER', label: 'Cajeros' },
                      { id: 'CLIENT', label: 'Clientes' },
                    ].find((r) => r.id === roleFilter)?.label || 'Roles'
                  }
                </span>
              </div>
              <ChevronDown className={`h-3.5 w-3.5 text-muted-foreground transition-transform duration-200 ${isRoleDropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            {/* Dropdown Menu */}
            {isRoleDropdownOpen && (
              <>
                {/* Invisible overlay to close dropdown */}
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setIsRoleDropdownOpen(false)}
                ></div>
                
                <div className="absolute top-full left-0 mt-1.5 w-44 rounded-md border border-border bg-white dark:bg-slate-900 p-1 shadow-lg z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                  {[
                    { id: 'ALL', label: 'Todos los Roles' },
                    { id: 'ADMIN', label: 'Admins' },
                    { id: 'STORE_MANAGER', label: 'Encargados' },
                    { id: 'CASHIER', label: 'Cajeros' },
                    { id: 'CLIENT', label: 'Clientes' },
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => {
                        setRoleFilter(tab.id);
                        setIsRoleDropdownOpen(false);
                      }}
                      className={`flex w-full items-center px-2 py-1.5 text-xs font-medium rounded-sm transition-colors ${
                        roleFilter === tab.id
                          ? 'bg-primary/10 text-primary'
                          : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Status & Search */}
          <div className="flex items-center gap-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="h-8 rounded-md border border-input bg-background px-2.5 py-0 text-xs font-medium shadow-sm focus:outline-none focus:ring-1 focus:ring-primary"
            >
              <option value="ALL">Todos los estados</option>
              <option value="ACTIVE">Solo Activos</option>
              <option value="BANNED">Solo Baneados/Inactivos</option>
            </select>

            <div className="relative">
              <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-muted-foreground" />
              <input
                type="text"
                placeholder="Buscar por nombre, email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="h-8 w-44 sm:w-56 rounded-md border border-input bg-background pl-8 pr-2.5 text-xs shadow-sm focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
