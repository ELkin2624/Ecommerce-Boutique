import { Link } from 'react-router-dom';
import { ShieldCheck, ArrowLeft } from 'lucide-react';
import { LoginForm } from '@/features/auth/ui/LoginForm';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/shared/ui/Card';
import { Toaster } from '@/shared/ui/Toast';
import { AppLogo } from '@/shared/ui/AppLogo';
import { BRAND_CONFIG } from '@/shared/config/brand.config';

export function LoginPage() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-muted/40 p-4 relative">
      {/* Botón Volver a Tienda */}
      <Link
        to="/"
        className="absolute top-6 left-6 inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        <span>Ir a la Tienda de Clientes</span>
      </Link>

      <div className="w-full max-w-md space-y-6">
        {/* Header Branding */}
        <div className="flex flex-col items-center text-center space-y-2">
          <AppLogo
            size="xl"
            showText={true}
            layout="vertical"
            subtitle={BRAND_CONFIG.tagline}
            withContainer={true}
          />
        </div>

        {/* Login Card */}
        <Card className="shadow-xl border-border/80">
          <CardHeader className="space-y-1 text-center">
            <CardTitle className="text-lg">Acceso de Empleados & POS</CardTitle>
            <CardDescription className="text-xs">
              Ingrese sus credenciales de administrador o cajero autorizado
            </CardDescription>
          </CardHeader>
          <CardContent>
            <LoginForm />
          </CardContent>
        </Card>

        {/* Security Notice */}
        <div className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
          <ShieldCheck className="h-4 w-4 text-emerald-600" />
          <span>Autenticación RBAC y rotación de tokens activa</span>
        </div>
      </div>
      <Toaster />
    </div>
  );
}
