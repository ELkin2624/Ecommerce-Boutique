import { Store, ShieldCheck } from 'lucide-react';
import { LoginForm } from '@/features/auth/ui/LoginForm';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/shared/ui/Card';
import { Toaster } from '@/shared/ui/Toast';

export function LoginPage() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-muted/40 p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Header Branding */}
        <div className="flex flex-col items-center text-center space-y-2">
          <div className="h-12 w-12 rounded-xl bg-primary text-primary-foreground flex items-center justify-center shadow-lg">
            <Store className="h-6 w-6" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">FashionStore</h1>
          <p className="text-xs text-muted-foreground max-w-xs">
            Sistema Administrativo y Punto de Venta Omnicanal
          </p>
        </div>

        {/* Login Card */}
        <Card className="shadow-xl border-border/80">
          <CardHeader className="space-y-1 text-center">
            <CardTitle className="text-lg">Acceso de Empleados</CardTitle>
            <CardDescription className="text-xs">
              Ingrese sus credenciales corporativas autorizadas
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
