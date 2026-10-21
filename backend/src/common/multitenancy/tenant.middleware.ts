import {
  Injectable,
  NestMiddleware,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { PrismaService } from '../../prisma/prisma.service.js';
import { TenantContext } from './tenant-context.js';

@Injectable()
export class TenantMiddleware implements NestMiddleware {
  private readonly logger = new Logger(TenantMiddleware.name);

  constructor(private readonly prisma: PrismaService) {}

  async use(req: Request, res: Response, next: NextFunction) {
    // 1. Extraer identificador de inquilino desde headers, query params o subdominio
    const tenantHeader =
      (req.headers['x-tenant-slug'] as string) ||
      (req.headers['x-tenant-id'] as string) ||
      (req.headers['tenant'] as string);

    const tenantQuery =
      (req.query.tenant as string) || (req.query.tenant_slug as string);

    // Extraer subdominio si existe (ej. 'tienda-pepe.fashionstore.app')
    let tenantSubdomain: string | undefined;
    const host = req.headers.host || '';
    const hostParts = host.split('.');
    if (
      hostParts.length > 2 &&
      hostParts[0] !== 'www' &&
      hostParts[0] !== 'api' &&
      hostParts[0] !== 'localhost'
    ) {
      tenantSubdomain = hostParts[0];
    }

    const tenantIdentifier = tenantHeader || tenantQuery || tenantSubdomain;

    // 2. Rutas globales de la plataforma SaaS donde el contexto de tienda es opcional
    const isGlobalRoute =
      req.originalUrl.includes('/api/v1/saas') ||
      req.originalUrl.includes('/api/docs') ||
      req.originalUrl.includes('/uploads') ||
      req.originalUrl === '/' ||
      req.originalUrl === '';

    if (!tenantIdentifier) {
      if (isGlobalRoute) {
        return next();
      }

      // Regla obligatoria: No se admite fallback silencioso a boutique-elegance ni a public
      throw new BadRequestException(
        'Debe especificar la tienda para acceder a este recurso (header X-Tenant-Slug o subdominio).',
      );
    }

    // 3. Buscar tienda en tabla central public.tenants
    const cleanId = tenantIdentifier.toLowerCase().trim();
    const isUuid =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
        tenantIdentifier.trim(),
      );

    const tenant = await this.prisma.publicClient.tenant.findFirst({
      where: isUuid
        ? { OR: [{ id: tenantIdentifier.trim() }, { slug: cleanId }] }
        : { slug: cleanId },
    });

    if (!tenant) {
      throw new NotFoundException(
        `La tienda o inquilino "${tenantIdentifier}" no existe.`,
      );
    }

    if (tenant.status !== 'ACTIVE') {
      throw new ForbiddenException(
        `La tienda "${tenant.name}" no está activa (Estado actual: ${tenant.status}).`,
      );
    }

    // 4. Ejecutar la solicitud dentro de TenantContext
    return TenantContext.run(
      {
        tenantId: tenant.id,
        tenantSlug: tenant.slug,
        schemaName: tenant.schemaName,
        tenantName: tenant.name,
        plan: tenant.plan,
      },
      () => {
        (req as any).tenant = tenant;
        res.setHeader('X-Tenant-Slug', tenant.slug);
        res.setHeader('X-Tenant-Schema', tenant.schemaName);
        next();
      },
    );
  }
}
