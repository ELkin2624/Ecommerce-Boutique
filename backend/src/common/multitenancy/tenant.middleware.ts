import { Injectable, NestMiddleware, NotFoundException, Logger } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { PrismaService } from '../../prisma/prisma.service.js';
import { TenantContext } from './tenant-context.js';

@Injectable()
export class TenantMiddleware implements NestMiddleware {
  private readonly logger = new Logger(TenantMiddleware.name);

  constructor(private readonly prisma: PrismaService) {}

  async use(req: Request, res: Response, next: NextFunction) {
    // 1. Extract tenant identifier from headers, query params, or subdomain
    const tenantHeader =
      (req.headers['x-tenant-slug'] as string) ||
      (req.headers['x-tenant-id'] as string) ||
      (req.headers['tenant'] as string);

    const tenantQuery =
      (req.query.tenant as string) || (req.query.tenant_slug as string);

    // Extract subdomain if present (e.g. 'boutique-elegance.fashionstore.app')
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

    // 2. If route is for SaaS platform management or swagger/uploads, tenant context is optional
    const isSaasRoute =
      req.originalUrl.includes('/api/v1/saas') ||
      req.originalUrl.includes('/api/docs') ||
      req.originalUrl.includes('/uploads');

    if (!tenantIdentifier) {
      if (isSaasRoute) {
        return next();
      }

      // Default fallback tenant for backwards compatibility
      const defaultTenant = await this.prisma.tenant.findFirst({
        where: { slug: 'boutique-elegance' },
      });

      if (defaultTenant) {
        return TenantContext.run(
          {
            tenantId: defaultTenant.id,
            tenantSlug: defaultTenant.slug,
            schemaName: defaultTenant.schemaName,
            tenantName: defaultTenant.name,
            plan: defaultTenant.plan,
          },
          () => {
            (req as any).tenant = defaultTenant;
            res.setHeader('X-Tenant-Slug', defaultTenant.slug);
            res.setHeader('X-Tenant-Schema', defaultTenant.schemaName);
            next();
          },
        );
      }

      return next();
    }

    // 3. Find tenant in central public.tenants table
    const cleanId = tenantIdentifier.toLowerCase().trim();
    const isUuid =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
        tenantIdentifier.trim(),
      );

    const tenant = await this.prisma.tenant.findFirst({
      where: isUuid
        ? { OR: [{ id: tenantIdentifier.trim() }, { slug: cleanId }] }
        : { slug: cleanId },
    });

    if (!tenant) {
      throw new NotFoundException(
        `La tienda o inquilino "${tenantIdentifier}" no existe o fue suspendida.`,
      );
    }

    // 4. Run request within TenantContext
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
