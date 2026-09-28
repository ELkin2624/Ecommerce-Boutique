import { Link, useLocation } from 'react-router-dom';
import { Lock } from 'lucide-react';
import { ClientLoginForm, ClientRegisterForm } from '@/features/client-auth';
import { BRAND_CONFIG } from '@/shared/config/brand.config';
import { AppLogo } from '@/shared/ui/AppLogo';

export function ClientAuthPage() {
  const location = useLocation();
  const isRegister = location.pathname.includes('register');
  const redirectTo = (location.state as any)?.from?.pathname || '/';

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md space-y-6">
        {/* Branding */}
        <div className="flex flex-col items-center text-center space-y-2">
          <AppLogo size="lg" showText={false} />
          <h1 className="text-2xl sm:text-3xl font-bold font-serif text-foreground">
            {BRAND_CONFIG.name}
          </h1>
          <p className="text-xs text-muted-foreground max-w-xs">
            {BRAND_CONFIG.storeTagline}
          </p>
        </div>

        {/* Card de Autenticación */}
        <div className="rounded-3xl border border-border/80 bg-card/95 p-6 sm:p-8 shadow-xl backdrop-blur-xl space-y-5">
          {!isRegister ? (
            /* Vista Iniciar Sesión */
            <div className="space-y-4 animate-in fade-in-50 duration-200">
              <div className="space-y-1">
                <h2 className="text-lg font-bold text-foreground">Iniciar Sesión</h2>
                <p className="text-xs text-muted-foreground">
                  Ingresa tu correo y contraseña para acceder a tus pedidos y bolsa de compras.
                </p>
              </div>

              <ClientLoginForm redirectTo={redirectTo} />

              <div className="pt-2 text-center text-xs text-muted-foreground border-t border-border/40">
                <span>¿Aún no tienes una cuenta? </span>
                <Link
                  to="/register"
                  className="font-bold text-foreground hover:underline ml-1"
                >
                  Registrarse
                </Link>
              </div>
            </div>
          ) : (
            /* Vista Registro */
            <div className="space-y-4 animate-in fade-in-50 duration-200">
              <div className="space-y-1">
                <h2 className="text-lg font-bold text-foreground">Crear Cuenta</h2>
                <p className="text-xs text-muted-foreground">
                  Completa tus datos para comprar con mayor rapidez y rastrear tus prendas.
                </p>
              </div>

              <ClientRegisterForm redirectTo={redirectTo} />

              <div className="pt-2 text-center text-xs text-muted-foreground border-t border-border/40">
                <span>¿Ya tienes una cuenta? </span>
                <Link
                  to="/login"
                  className="font-bold text-foreground hover:underline ml-1"
                >
                  Iniciar Sesión
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* Acceso para Empleados */}
        <div className="text-center pt-2">
          <Link
            to="/admin/login"
            className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors"
          >
            <Lock className="h-3.5 w-3.5" />
            <span>¿Eres personal o cajero de la boutique? Inicia sesión aquí</span>
          </Link>
        </div>
      </div>
    </div>
  );
}

