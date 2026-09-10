import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useNavigate, useLocation } from 'react-router-dom';
import { Lock, Mail } from 'lucide-react';
import { apiClient } from '@/shared/api/axios-client';
import { useAuthStore } from '@/app/store/auth.store';
import { Button } from '@/shared/ui/Button';
import { toast } from '@/shared/ui/Toast';

const loginSchema = z.object({
  email: z.string().email('Ingrese un correo electrónico válido'),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
});

type LoginFormData = z.infer<typeof loginSchema>;

export function LoginForm() {
  const navigate = useNavigate();
  const location = useLocation();
  const { setSession } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: 'admin@fashionstore.com',
      password: '',
    },
  });

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true);
    try {
      const response = await apiClient.post('/auth/login', data);
      const { user, accessToken, refreshToken } = response.data;

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

      toast.success('Sesión iniciada', `Bienvenido(a), ${user.firstName}`);

      const from = (location.state as any)?.from?.pathname || '/dashboard';
      navigate(from, { replace: true });
    } catch (err: any) {
      toast.error('Error de autenticación', err.message || 'Credenciales inválidas');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-1">
        <label className="text-xs font-semibold text-muted-foreground">Correo Electrónico</label>
        <div className="relative">
          <Mail className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <input
            type="email"
            placeholder="usuario@fashionstore.com"
            className="flex h-9 w-full rounded-md border border-input bg-background pl-9 pr-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            {...register('email')}
          />
        </div>
        {errors.email && <p className="text-xs text-destructive font-medium">{errors.email.message}</p>}
      </div>

      <div className="space-y-1">
        <label className="text-xs font-semibold text-muted-foreground">Contraseña</label>
        <div className="relative">
          <Lock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <input
            type="password"
            placeholder="••••••••"
            className="flex h-9 w-full rounded-md border border-input bg-background pl-9 pr-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            {...register('password')}
          />
        </div>
        {errors.password && <p className="text-xs text-destructive font-medium">{errors.password.message}</p>}
      </div>

      <Button type="submit" className="w-full mt-2" isLoading={isLoading}>
        Ingresar al Panel
      </Button>
    </form>
  );
}
