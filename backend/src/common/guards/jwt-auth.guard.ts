import {
  Injectable,
  ExecutionContext,
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { PrismaService } from '../../prisma/prisma.service.js';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const parentCan = await super.canActivate(context);
    if (!parentCan) {
      return false;
    }

    const req = context.switchToHttp().getRequest();
    const user = req.user;
    const tenant = req.tenant;
    const isGlobalSaasRoute = req.originalUrl?.includes('/api/v1/saas');

    // Si la solicitud se dirige a un tenant específico (fuera de rutas globales SaaS), validar membresía o autorización
    if (!isGlobalSaasRoute && tenant && tenant.id && user && user.id) {
      // 1. Verificar membresía en public.tenant_memberships
      const membership = await this.prisma.publicClient.tenantMembership.findFirst({
        where: {
          tenantId: tenant.id,
          OR: [
            { userId: user.id },
            user.email ? { user: { email: user.email.toLowerCase() } } : {},
          ],
        },
      });

      if (!membership) {
        // 2. Verificar si es el propietario directo por email
        const isOwner =
          tenant.ownerEmail &&
          user.email &&
          tenant.ownerEmail.toLowerCase() === user.email.toLowerCase();

        if (!isOwner) {
          // 3. Verificar si existe como usuario dentro del esquema del tenant
          let existsInSchema = false;
          try {
            const schemaUsers: any[] = await this.prisma.$queryRawUnsafe(
              `SELECT id FROM "${tenant.schemaName}"."users" WHERE id = $1 OR email = $2 LIMIT 1`,
              user.id,
              user.email || '',
            );
            existsInSchema = schemaUsers.length > 0;
          } catch {
            existsInSchema = false;
          }

          if (!existsInSchema) {
            throw new ForbiddenException(
              `Acceso no autorizado: no tienes membresía ni permisos para operar en la tienda "${tenant.name}".`,
            );
          }
        }
      }
    }

    return true;
  }

  handleRequest(err: any, user: any, _info: any) {
    if (err || !user) {
      throw (
        err || new UnauthorizedException('Token inválido o no proporcionado')
      );
    }
    return user;
  }
}
