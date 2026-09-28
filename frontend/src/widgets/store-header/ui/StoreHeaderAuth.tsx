import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  ShoppingBag, User as UserIcon, LogOut, Package, LayoutDashboard,
} from 'lucide-react';
import { useAuthStore } from '@/app/store/auth.store';
import { useCartStore } from '@/features/cart';

export function StoreHeaderAuth() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAuthenticated, isStaff, clearSession } = useAuthStore();
  const { toggleDrawer, getItemCount } = useCartStore();
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);

  const itemCount = getItemCount();
  const isLoginPage = location.pathname === '/login';
  const isRegisterPage = location.pathname === '/register';

  const handleLogout = () => {
    clearSession();
    setIsUserDropdownOpen(false);
    navigate('/');
  };

  return (
    <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
      {/* Botón Carrito: SOLO EL ICONO con badge numérico */}
      <button
        onClick={toggleDrawer}
        className="relative h-11 w-11 rounded-full bg-card/85 hover:bg-card border border-border/80 backdrop-blur-xl flex items-center justify-center text-foreground shadow-sm transition-all active:scale-95 cursor-pointer"
        title="Bolsa de Compras"
        aria-label="Ver Bolsa de Compras"
      >
        <ShoppingBag className="h-4 w-4 text-foreground" />
        {itemCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-[10px] font-bold h-5 min-w-5 px-1 rounded-full flex items-center justify-center shadow-md animate-in zoom-in-50">
            {itemCount}
          </span>
        )}
      </button>

      {/* Estado de Autenticación */}
      {isAuthenticated && user ? (
        /* Usuario Logueado: Avatar con Dropdown */
        <div className="relative">
          <button
            onClick={() => setIsUserDropdownOpen(!isUserDropdownOpen)}
            className="h-11 px-3 rounded-full bg-card/85 hover:bg-card border border-border/80 backdrop-blur-xl flex items-center gap-2 text-xs font-bold text-foreground shadow-sm cursor-pointer"
          >
            <div className="h-7 w-7 rounded-full bg-primary/10 text-primary flex items-center justify-center font-mono uppercase">
              {user.firstName[0]}
            </div>
            <span className="hidden sm:inline max-w-[80px] truncate">{user.firstName}</span>
          </button>

          {isUserDropdownOpen && (
            <div
              className="absolute right-0 mt-2 w-52 rounded-2xl border border-border bg-card p-2 shadow-2xl animate-in fade-in-50 zoom-in-95 z-50 backdrop-blur-xl"
              onClick={() => setIsUserDropdownOpen(false)}
            >
              <div className="px-3 py-2 border-b border-border/60">
                <p className="text-xs font-bold text-foreground truncate">
                  {user.firstName} {user.lastName}
                </p>
                <p className="text-[10px] font-mono text-muted-foreground truncate">
                  {user.email}
                </p>
              </div>

              <div className="py-1 space-y-0.5">
                {isStaff() && (
                  <Link
                    to="/dashboard"
                    className="flex items-center gap-2 px-3 py-2 text-xs font-medium text-primary hover:bg-primary/10 rounded-xl transition-colors"
                  >
                    <LayoutDashboard className="h-3.5 w-3.5" />
                    Panel Administrativo
                  </Link>
                )}
                <Link
                  to="/orders"
                  className="flex items-center gap-2 px-3 py-2 text-xs font-medium text-foreground hover:bg-muted rounded-xl transition-colors"
                >
                  <Package className="h-3.5 w-3.5 text-muted-foreground" />
                  Mis Pedidos
                </Link>
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-destructive hover:bg-destructive/10 rounded-xl transition-colors cursor-pointer"
                >
                  <LogOut className="h-3.5 w-3.5" />
                  Cerrar Sesión
                </button>
              </div>
            </div>
          )}
        </div>
      ) : (
        /* Usuario NO Logueado: Iniciar Sesión o Registrarse */
        <div className="flex items-center gap-1.5">
          <Link
            to="/login"
            className={`h-11 px-3.5 sm:px-4 rounded-full backdrop-blur-xl flex items-center gap-1.5 text-xs font-semibold shadow-sm transition-all whitespace-nowrap ${
              isLoginPage
                ? 'bg-foreground text-background font-bold'
                : 'bg-card/85 hover:bg-card border border-border/80 text-foreground hover:border-foreground/40'
            }`}
          >
            <UserIcon className="h-3.5 w-3.5 opacity-80" />
            <span>Iniciar Sesión</span>
          </Link>

          <Link
            to="/register"
            className={`hidden sm:inline-flex h-11 px-4 rounded-full items-center justify-center text-xs font-bold shadow-sm transition-all whitespace-nowrap ${
              isRegisterPage
                ? 'bg-foreground text-background ring-2 ring-foreground/20'
                : !isLoginPage
                ? 'bg-foreground text-background hover:bg-foreground/90'
                : 'bg-card/85 hover:bg-card border border-border/80 text-foreground hover:border-foreground/40'
            }`}
          >
            Registrarse
          </Link>
        </div>
      )}
    </div>
  );
}
