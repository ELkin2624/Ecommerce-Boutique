import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useNavigate, useLocation } from 'react-router-dom';
import { User, Mail, Lock, Phone } from 'lucide-react';
import { clientAuthApi } from '../api/clientAuthApi';
import { useAuthStore } from '@/app/store/auth.store';
import { Button } from '@/shared/ui/Button';
import { toast } from '@/shared/ui/Toast';

const clientRegisterSchema = z.object({
  firstName: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  lastName: z.string().min(2, 'El apellido debe tener al menos 2 caracteres'),
  email: z.string().email('Por favor ingresa un correo electrónico válido'),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
  phone: z.string().optional(),
});

type ClientRegisterFormData = z.infer<typeof clientRegisterSchema>;

interface ClientRegisterFormProps {
  onSuccess?: () => void;
  redirectTo?: string;
}

export function ClientRegisterForm({ onSuccess, redirectTo }: ClientRegisterFormProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { setSession } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ClientRegisterFormData>({
    resolver: zodResolver(clientRegisterSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      password: '',
      phone: '',
    },
  });

  const onSubmit = async (data: ClientRegisterFormData) => {
    setIsLoading(true);
    try {
      const response = await clientAuthApi.register({
        firstName: data.firstName.trim(),
        lastName: data.lastName.trim(),
        email: data.email.trim(),
        password: data.password,
        phone: data.phone?.trim() || undefined,
      });

      const { user, accessToken, refreshToken } = response;

      setSession({
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          phone: user.phone,
          isActive: user.isActive,
          roles: user.roles || ['CLIENT'],
          permissions: user.permissions || [],
        },
        accessToken,
        refreshToken,
      });

      toast.success('¡Cuenta creada con éxito!', `Bienvenido(a) a Boutique Kitty, ${user.firstName}.`);

      if (onSuccess) {
        onSuccess();
      } else {
        const dest = redirectTo || (location.state as any)?.from?.pathname || '/';
        navigate(dest, { replace: true });
      }
    } catch (err: any) {
      toast.error(
        'No pudimos crear tu cuenta',
        err.response?.data?.message || err.message || 'Verifica los datos e inténtalo de nuevo',
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-3.5">
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-foreground">Nombre</label>
          <div className="relative">
            <User className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="María"
              className="flex h-10 w-full rounded-lg border border-input bg-background pl-9 pr-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:border-primary"
              {...register('firstName')}
            />
          </div>
          {errors.firstName && (
            <p className="text-xs text-destructive font-medium">{errors.firstName.message}</p>
          )}
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-foreground">Apellido</label>
          <div className="relative">
            <User className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Gómez"
              className="flex h-10 w-full rounded-lg border border-input bg-background pl-9 pr-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:border-primary"
              {...register('lastName')}
            />
          </div>
          {errors.lastName && (
            <p className="text-xs text-destructive font-medium">{errors.lastName.message}</p>
          )}
        </div>
      </div>

      <div className="space-y-1.5">
        <label className="text-xs font-semibold text-foreground">Correo Electrónico</label>
        <div className="relative">
          <Mail className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <input
            type="email"
            placeholder="maria@ejemplo.com"
            className="flex h-10 w-full rounded-lg border border-input bg-background pl-9 pr-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:border-primary"
            {...register('email')}
          />
        </div>
        {errors.email && (
          <p className="text-xs text-destructive font-medium">{errors.email.message}</p>
        )}
      </div>

      <div className="space-y-1.5">
        <label className="text-xs font-semibold text-foreground">Teléfono / WhatsApp (Opcional)</label>
        <div className="relative">
          <Phone className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <input
            type="tel"
            placeholder="+591 70000000"
            className="flex h-10 w-full rounded-lg border border-input bg-background pl-9 pr-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:border-primary"
            {...register('phone')}
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <label className="text-xs font-semibold text-foreground">Contraseña</label>
        <div className="relative">
          <Lock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <input
            type="password"
            placeholder="Mínimo 6 caracteres"
            className="flex h-10 w-full rounded-lg border border-input bg-background pl-9 pr-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:border-primary"
            {...register('password')}
          />
        </div>
        {errors.password && (
          <p className="text-xs text-destructive font-medium">{errors.password.message}</p>
        )}
      </div>

      <Button type="submit" className="w-full h-10 mt-2 font-medium" isLoading={isLoading}>
        Crear Mi Cuenta
      </Button>
    </form>
  );
}
