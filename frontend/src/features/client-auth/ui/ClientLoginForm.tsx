import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useNavigate, useLocation } from 'react-router-dom';
import { Lock, Mail } from 'lucide-react';
import { clientAuthApi } from '../api/clientAuthApi';
import { useAuthStore } from '@/app/store/auth.store';
import { Button } from '@/shared/ui/Button';
import { toast } from '@/shared/ui/Toast';

const clientLoginSchema = z.object({
  email: z.string().email('Por favor ingresa un correo electrónico válido'),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
});

type ClientLoginFormData = z.infer<typeof clientLoginSchema>;

interface ClientLoginFormProps {
  onSuccess?: () => void;
  redirectTo?: string;
}

export function ClientLoginForm({ onSuccess, redirectTo }: ClientLoginFormProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { setSession } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ClientLoginFormData>({
    resolver: zodResolver(clientLoginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = async (data: ClientLoginFormData) => {
    setIsLoading(true);
    try {
      const response = await clientAuthApi.login(data);
      const { user, accessToken, refreshToken } = response;

      setSession({
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          phone: user.phone,
          isActive: user.isActive,
          roles: user.roles || [],
          permissions: user.permissions || [],
        },
        accessToken,
        refreshToken,
      });

      toast.success('¡Bienvenido(a)!', `Hola ${user.firstName}, gusto en verte de nuevo.`);

      if (onSuccess) {
        onSuccess();
      } else {
        const dest = redirectTo || (location.state as any)?.from?.pathname || '/';
        navigate(dest, { replace: true });
      }
    } catch (err: any) {
      toast.error(
        'Error al iniciar sesión',
        err.response?.data?.message || err.message || 'Correo o contraseña incorrectos',
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-1.5">
        <label className="text-xs font-semibold text-foreground">Correo Electrónico</label>
        <div className="relative">
          <Mail className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <input
            type="email"
            placeholder="ejemplo@correo.com"
            className="flex h-10 w-full rounded-lg border border-input bg-background pl-9 pr-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:border-primary"
            {...register('email')}
          />
        </div>
        {errors.email && (
          <p className="text-xs text-destructive font-medium">{errors.email.message}</p>
        )}
      </div>

      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <label className="text-xs font-semibold text-foreground">Contraseña</label>
        </div>
        <div className="relative">
          <Lock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <input
            type="password"
            placeholder="••••••••"
            className="flex h-10 w-full rounded-lg border border-input bg-background pl-9 pr-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:border-primary"
            {...register('password')}
          />
        </div>
        {errors.password && (
          <p className="text-xs text-destructive font-medium">{errors.password.message}</p>
        )}
      </div>

      <Button type="submit" className="w-full h-10 font-medium" isLoading={isLoading}>
        Iniciar Sesión
      </Button>
    </form>
  );
}
