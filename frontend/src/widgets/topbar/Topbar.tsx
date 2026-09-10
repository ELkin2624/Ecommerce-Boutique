import { Sun, Moon, LogOut, User as UserIcon } from 'lucide-react';
import { useAuthStore } from '@/app/store/auth.store';
import { useUiStore } from '@/app/store/ui.store';
import { BranchSwitcher } from './BranchSwitcher';
import { apiClient } from '@/shared/api/axios-client';
import { Button } from '@/shared/ui/Button';
import { Badge } from '@/shared/ui/Badge';

export function Topbar() {
  const { user, clearSession } = useAuthStore();
  const { theme, toggleTheme } = useUiStore();

  const handleLogout = async () => {
    try {
      await apiClient.post('/auth/logout');
    } catch {
      // Ignorar errores en logout
    } finally {
      clearSession();
      window.location.href = '/login';
    }
  };

  return (
    <header className="h-16 border-b bg-card/80 backdrop-blur-sm px-6 flex items-center justify-between sticky top-0 z-20">
      {/* Left: Sucursal Switcher */}
      <div className="flex items-center gap-4">
        <BranchSwitcher />
      </div>

      {/* Right: Theme, User Profile & Logout */}
      <div className="flex items-center gap-4">
        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          className="p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
          title={theme === 'dark' ? 'Modo Claro' : 'Modo Oscuro'}
        >
          {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </button>

        {/* User Card */}
        {user && (
          <div className="flex items-center gap-3 pl-3 border-l">
            <div className="h-8 w-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs">
              <UserIcon className="h-4 w-4" />
            </div>
            <div className="flex flex-col text-left">
              <span className="text-xs font-semibold leading-tight">
                {user.firstName} {user.lastName}
              </span>
              <div className="flex items-center gap-1 mt-0.5">
                <Badge variant="outline" className="text-[10px] px-1.5 py-0 uppercase">
                  {user.roles?.[0] || 'CLIENT'}
                </Badge>
              </div>
            </div>
          </div>
        )}

        {/* Logout */}
        <Button
          variant="ghost"
          size="sm"
          onClick={handleLogout}
          className="text-muted-foreground hover:text-destructive gap-1.5"
          title="Cerrar Sesión"
        >
          <LogOut className="h-4 w-4" />
          <span className="hidden sm:inline text-xs">Salir</span>
        </Button>
      </div>
    </header>
  );
}
