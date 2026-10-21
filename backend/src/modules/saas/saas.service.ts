import {
  Injectable,
  Optional,
  NotFoundException,
  BadRequestException,
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as argon2 from 'argon2';
import * as crypto from 'crypto';
import { PrismaService } from '../../prisma/prisma.service.js';
import { TenantContext } from '../../common/multitenancy/tenant-context.js';
import {
  TenantProvisioningService,
  CreateTenantDto,
  PLAN_LIMITS,
} from './tenant-provisioning.service.js';
import { CreateMyTenantDto } from './dto/create-my-tenant.dto.js';
import { UpdateTenantProfileDto } from './dto/update-tenant-profile.dto.js';

export interface SaasPlan {
  id: string;
  name: string;
  tagline: string;
  monthlyPrice: number;
  annualPrice: number;
  popular?: boolean;
  limits: {
    maxStores: number;
    maxBranches: number | 'Ilimitadas';
    maxProducts: number | 'Ilimitados';
    maxUsers: number | 'Ilimitados';
    storage: string;
  };
  features: string[];
  cta: string;
}

@Injectable()
export class SaasService {
  private readonly jwt: JwtService;

  constructor(
    private readonly prisma: PrismaService,
    private readonly provisioningService: TenantProvisioningService,
    @Optional() private readonly jwtService?: JwtService,
    @Optional() private readonly configService?: ConfigService,
  ) {
    this.jwt = this.jwtService ?? new JwtService({});
  }

  getPlans(): SaasPlan[] {
    return [
      {
        id: 'STARTER',
        name: PLAN_LIMITS.STARTER.name,
        tagline: 'Para boutiques independientes y marcas emergentes de moda',
        monthlyPrice: 29,
        annualPrice: 24,
        popular: false,
        limits: {
          maxStores: PLAN_LIMITS.STARTER.maxStores,
          maxBranches: PLAN_LIMITS.STARTER.maxBranches,
          maxProducts: PLAN_LIMITS.STARTER.maxProducts,
          maxUsers: PLAN_LIMITS.STARTER.maxUsers,
          storage: PLAN_LIMITS.STARTER.storage,
        },
        features: [
          'Hasta 1 tienda independiente',
          '1 Sucursal física + Tienda Online',
          'Catálogo de hasta 500 prendas y variantes',
          'Punto de Venta (POS) en mostrador',
          'Modo Offline para POS con sincronización',
          'Cobro con Stripe, Tarjetas y QR',
          'Gestión básica de inventario',
          'Soporte estándar por email en 24h',
        ],
        cta: 'Empezar con Starter',
      },
      {
        id: 'PRO',
        name: PLAN_LIMITS.PRO.name,
        tagline: 'Para marcas en expansión, franquicias y boutiques de alto volumen',
        monthlyPrice: 79,
        annualPrice: 63,
        popular: true,
        limits: {
          maxStores: PLAN_LIMITS.PRO.maxStores,
          maxBranches: PLAN_LIMITS.PRO.maxBranches,
          maxProducts: 'Ilimitados',
          maxUsers: 'Ilimitados',
          storage: PLAN_LIMITS.PRO.storage,
        },
        features: [
          'Hasta 3 tiendas independientes bajo la misma cuenta',
          'Hasta 5 Sucursales y Almacenes centrales por tienda',
          'Productos y variantes ilimitadas',
          'Probador Físico Inteligente (Reserva web)',
          'Probador Virtual e IA Estilista de medidas',
          'Kardex y Traslados de stock entre sucursales',
          'Multi-caja y perfiles de usuarios ilimitados',
          'Módulo de promociones y cupones de temporada',
          'Soporte prioritario por WhatsApp & Chat',
        ],
        cta: 'Probar Gratis 14 Días',
      },
      {
        id: 'ENTERPRISE',
        name: PLAN_LIMITS.ENTERPRISE.name,
        tagline: 'Para cadenas departamentales, marcas globales y alta escala retail',
        monthlyPrice: 199,
        annualPrice: 159,
        popular: false,
        limits: {
          maxStores: PLAN_LIMITS.ENTERPRISE.maxStores,
          maxBranches: 'Ilimitadas',
          maxProducts: 'Ilimitados',
          maxUsers: 'Ilimitados',
          storage: PLAN_LIMITS.ENTERPRISE.storage,
        },
        features: [
          'Hasta 10 tiendas o marcas independientes',
          'Sucursales y Depósitos logísticos ilimitados',
          'Dominio web personalizado (ej. tu-marca.com)',
          'Reportes Inteligentes por Voz con IA (Whisper)',
          'Text-to-SQL Analytics con ReportIQ',
          'Esquema PostgreSQL aislado de alta disponibilidad',
          'SLA de 99.9% y respaldos automáticos diarios',
          'Onboarding asistido y capacitación al personal',
          'Gerente de cuenta técnico dedicado 24/7',
        ],
        cta: 'Contactar a Ventas',
      },
    ];
  }

  async registerTenant(dto: CreateTenantDto) {
    return this.provisioningService.createTenant(dto);
  }

  /**
   * Lista las tiendas autorizadas del usuario autenticado junto con el estado y cupo de su plan.
   */
  async getMyTenants(authUser: { id: string; email: string }) {
    if (!authUser?.id || !authUser?.email) {
      throw new UnauthorizedException('Sesión de usuario inválida.');
    }

    const normalizedEmail = authUser.email.toLowerCase().trim();
    const globalUser = await this.ensureGlobalUser(authUser.id, normalizedEmail);

    // Sincronizar membresías de tiendas cuyo ownerEmail coincida con el usuario global
    const ownedByEmail = await this.prisma.publicClient.tenant.findMany({
      where: {
        ownerEmail: { equals: normalizedEmail, mode: 'insensitive' },
        status: 'ACTIVE',
      },
    });

    for (const t of ownedByEmail) {
      await this.prisma.publicClient.tenantMembership.upsert({
        where: {
          tenantId_userId: {
            tenantId: t.id,
            userId: globalUser.id,
          },
        },
        update: {},
        create: {
          tenantId: t.id,
          userId: globalUser.id,
          role: 'OWNER',
        },
      });
    }

    const memberships = await this.prisma.publicClient.tenantMembership.findMany({
      where: {
        userId: globalUser.id,
        tenant: { status: 'ACTIVE' },
      },
      include: {
        tenant: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    const tenants = memberships.map((m: any) => ({
      ...this.formatTenantSummary(m.tenant),
      membershipRole: m.role,
    }));

    const quota = await this.provisioningService.getUserPlanAndStoreQuota(
      globalUser.id,
      globalUser.email,
    );

    return {
      user: {
        id: globalUser.id,
        email: globalUser.email,
        firstName: globalUser.firstName,
        lastName: globalUser.lastName,
      },
      tenantsCount: tenants.length,
      tenants,
      planQuota: {
        effectivePlan: quota.effectivePlan,
        planName: quota.planName,
        ownedCount: quota.ownedCount,
        maxStores: quota.maxStores,
        remainingStores: quota.remainingStores,
        canCreateMore: quota.canCreateMore,
        limits: quota.limits,
      },
    };
  }

  /**
   * Crea una nueva tienda desde el panel administrativo reutilizando la identidad global del usuario autenticado.
   * Valida límites del plan en backend y devuelve sesión lista para cambiar a la nueva tienda.
   */
  async createTenantForAuthenticatedUser(
    authUser: { id: string; email: string },
    dto: CreateMyTenantDto,
  ) {
    if (!authUser?.id || !authUser?.email) {
      throw new UnauthorizedException('Debes iniciar sesión para crear una nueva tienda.');
    }

    const normalizedEmail = authUser.email.toLowerCase().trim();
    const globalUser = await this.ensureGlobalUser(authUser.id, normalizedEmail);

    const created = await this.provisioningService.createTenant(
      {
        name: dto.name,
        slug: dto.slug,
        plan: dto.plan,
        ownerName: `${globalUser.firstName} ${globalUser.lastName}`.trim(),
        ownerEmail: globalUser.email,
        phone: dto.phone || globalUser.phone || undefined,
        primaryColor: dto.primaryColor,
        category: dto.category,
      },
      { authenticatedUserId: globalUser.id },
    );

    // Emitir sesión con alcance de la nueva tienda recién creada
    const session = await this.switchTenant(authUser, created.tenant.slug);
    const updatedQuota = await this.provisioningService.getUserPlanAndStoreQuota(
      globalUser.id,
      globalUser.email,
    );

    return {
      ...created,
      tenant: this.formatTenantSummary(created.tenant),
      session,
      planQuota: {
        effectivePlan: updatedQuota.effectivePlan,
        planName: updatedQuota.planName,
        ownedCount: updatedQuota.ownedCount,
        maxStores: updatedQuota.maxStores,
        remainingStores: updatedQuota.remainingStores,
        canCreateMore: updatedQuota.canCreateMore,
      },
    };
  }

  /**
   * Cambia el contexto activo del usuario autenticado a otra de sus tiendas autorizadas,
   * validando su membresía en public.tenant_memberships y emitiendo tokens para el esquema destino.
   */
  async switchTenant(authUser: { id: string; email: string }, targetSlug: string) {
    if (!authUser?.id || !authUser?.email) {
      throw new UnauthorizedException('Debes iniciar sesión para cambiar de tienda.');
    }

    const cleanSlug = targetSlug?.toLowerCase()?.trim();
    if (!cleanSlug) {
      throw new BadRequestException('Debe indicar el identificador (slug) de la tienda destino.');
    }

    const tenant = await this.prisma.publicClient.tenant.findUnique({
      where: { slug: cleanSlug },
    });

    if (!tenant) {
      throw new NotFoundException(`La tienda "${cleanSlug}" no existe.`);
    }

    if (tenant.status !== 'ACTIVE') {
      throw new ForbiddenException(
        `La tienda "${tenant.name}" no se encuentra activa (Estado: ${tenant.status}).`,
      );
    }

    const normalizedEmail = authUser.email.toLowerCase().trim();
    const globalUser = await this.ensureGlobalUser(authUser.id, normalizedEmail);

    // Verificar membresía activa sobre el tenant destino
    let membership = await this.prisma.publicClient.tenantMembership.findFirst({
      where: {
        tenantId: tenant.id,
        userId: globalUser.id,
      },
    });

    if (!membership && tenant.ownerEmail?.toLowerCase() === normalizedEmail) {
      membership = await this.prisma.publicClient.tenantMembership.create({
        data: {
          tenantId: tenant.id,
          userId: globalUser.id,
          role: 'OWNER',
        },
      });
    }

    if (!membership) {
      throw new ForbiddenException(
        `Acceso no autorizado: no tienes membresía ni permisos para administrar la tienda "${tenant.name}".`,
      );
    }

    // Ejecutar dentro del contexto del esquema destino para sincronizar usuario local y generar tokens
    return TenantContext.run(
      {
        tenantId: tenant.id,
        tenantSlug: tenant.slug,
        schemaName: tenant.schemaName,
        tenantName: tenant.name,
        plan: tenant.plan,
      },
      async () => {
        let localUser = await this.prisma.user.findUnique({
          where: { email: normalizedEmail },
          include: {
            roles: {
              include: {
                role: {
                  include: {
                    permissions: {
                      include: {
                        permission: true,
                      },
                    },
                  },
                },
              },
            },
          },
        });

        if (!localUser) {
          const roleName = membership.role === 'OWNER' ? 'ADMIN' : membership.role;
          const targetRole = await this.prisma.role.findFirst({
            where: { name: roleName },
          });

          localUser = await this.prisma.user.create({
            data: {
              id: globalUser.id,
              email: globalUser.email,
              passwordHash: globalUser.passwordHash,
              firstName: globalUser.firstName,
              lastName: globalUser.lastName,
              phone: globalUser.phone,
              isActive: true,
              roles: targetRole
                ? {
                    create: { roleId: targetRole.id },
                  }
                : undefined,
            },
            include: {
              roles: {
                include: {
                  role: {
                    include: {
                      permissions: {
                        include: {
                          permission: true,
                        },
                      },
                    },
                  },
                },
              },
            },
          });
        }

        const tokens = await this.generateTenantTokens(localUser.id, localUser.email);

        return {
          tenant: this.formatTenantSummary(tenant),
          user: this.sanitizeUser(localUser),
          ...tokens,
        };
      },
    );
  }

  /**
   * Comprueba si un subdominio (slug) está disponible para ser registrado.
   */
  async checkSlugAvailability(rawSlug: string) {
    const cleanSlug = rawSlug
      ?.toLowerCase()
      ?.trim()
      ?.normalize('NFD')
      ?.replace(/[\u0300-\u036f]/g, '')
      ?.replace(/[^a-z0-9-]/g, '')
      ?.replace(/-+/g, '-');

    if (!cleanSlug || cleanSlug.length < 3 || cleanSlug.length > 50) {
      return {
        available: false,
        slug: cleanSlug || '',
        reason: 'El subdominio debe tener entre 3 y 50 caracteres alfanuméricos o guiones.',
      };
    }

    const reserved = [
      'api',
      'admin',
      'saas',
      'public',
      'system',
      'auth',
      'dashboard',
      'store',
      'cart',
      'checkout',
      'login',
      'register',
      'health',
      'docs',
      'swagger',
    ];

    if (reserved.includes(cleanSlug)) {
      return {
        available: false,
        slug: cleanSlug,
        reason: `El subdominio "${cleanSlug}" está reservado por el sistema.`,
      };
    }

    const existing = await this.prisma.publicClient.tenant.findUnique({
      where: { slug: cleanSlug },
      select: { id: true },
    });

    if (existing) {
      return {
        available: false,
        slug: cleanSlug,
        reason: `El subdominio "${cleanSlug}.fashionstore.com" ya está en uso.`,
      };
    }

    return {
      available: true,
      slug: cleanSlug,
      domain: `${cleanSlug}.fashionstore.com`,
    };
  }

  async lookupUserTenants(email: string) {
    const normalizedEmail = email.toLowerCase().trim();

    const publicUserCount = await this.prisma.publicClient.user.count({
      where: { email: normalizedEmail },
    });

    const tenantCount = await this.prisma.publicClient.tenant.count({
      where: {
        ownerEmail: normalizedEmail,
        status: 'ACTIVE',
      },
    });

    const exists = publicUserCount > 0 || tenantCount > 0;

    return {
      exists,
      email: normalizedEmail,
    };
  }

  async verifyCredentials(dto: { email: string; password: string }) {
    const normalizedEmail = dto.email.toLowerCase().trim();
    if (!normalizedEmail || !dto.password) {
      throw new BadRequestException('El correo y la contraseña son requeridos.');
    }

    // 1. Validar usuario en plano global (public.users)
    let globalUser = await this.prisma.publicClient.user.findFirst({
      where: { email: normalizedEmail },
    });

    let passwordMatched = false;

    if (globalUser) {
      passwordMatched = await argon2.verify(globalUser.passwordHash, dto.password);
    } else {
      // Fallback de compatibilidad: buscar en esquemas de tiendas previas si aún no se sincronizó
      const ownedTenants = await this.prisma.publicClient.tenant.findMany({
        where: { ownerEmail: normalizedEmail, status: 'ACTIVE' },
      });
      for (const t of ownedTenants) {
        try {
          const schemaUsers: any[] = await this.prisma.$queryRawUnsafe(
            `SELECT id, email, password_hash, first_name, last_name, phone FROM "${t.schemaName}"."users" WHERE email = $1 LIMIT 1`,
            normalizedEmail,
          );
          if (schemaUsers.length > 0 && schemaUsers[0].password_hash) {
            const match = await argon2.verify(schemaUsers[0].password_hash, dto.password);
            if (match) {
              passwordMatched = true;
              // Auto-sincronizar a public.users
              globalUser = await this.prisma.publicClient.user.create({
                data: {
                  id: schemaUsers[0].id,
                  email: normalizedEmail,
                  passwordHash: schemaUsers[0].password_hash,
                  firstName: schemaUsers[0].first_name || 'Admin',
                  lastName: schemaUsers[0].last_name || 'Store',
                  phone: schemaUsers[0].phone,
                  isActive: true,
                },
              });
              break;
            }
          }
        } catch {
          // Continuar con siguiente esquema
        }
      }
    }

    if (!passwordMatched || !globalUser) {
      throw new UnauthorizedException('Contraseña incorrecta. Por favor verifica tus credenciales.');
    }

    // 2. Resolver tiendas donde el usuario tiene membresía activa
    const memberships = await this.prisma.publicClient.tenantMembership.findMany({
      where: {
        userId: globalUser.id,
        tenant: { status: 'ACTIVE' },
      },
      include: {
        tenant: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    let tenants = memberships.map((m: any) => m.tenant);

    // Si aún no tenía membresías formalizadas, buscar por ownerEmail y registrar membresía automáticamente
    if (tenants.length === 0) {
      const owned = await this.prisma.publicClient.tenant.findMany({
        where: { ownerEmail: normalizedEmail, status: 'ACTIVE' },
        orderBy: { createdAt: 'desc' },
      });
      for (const t of owned) {
        await this.prisma.$executeRawUnsafe(
          `INSERT INTO public.tenant_memberships (id, tenant_id, user_id, role, created_at, updated_at)
           VALUES (gen_random_uuid(), $1::uuid, $2, 'OWNER', NOW(), NOW())
           ON CONFLICT (tenant_id, user_id) DO NOTHING;`,
          t.id,
          globalUser.id,
        );
      }
      tenants = owned;
    }

    const quota = await this.provisioningService.getUserPlanAndStoreQuota(
      globalUser.id,
      globalUser.email,
    );

    return {
      verified: true,
      user: {
        id: globalUser.id,
        email: globalUser.email,
        firstName: globalUser.firstName,
        lastName: globalUser.lastName,
      },
      tenantsCount: tenants.length,
      tenants: tenants.map((t: any) => this.formatTenantSummary(t)),
      autoRedirectSlug: tenants.length === 1 ? tenants[0].slug : null,
      planQuota: {
        effectivePlan: quota.effectivePlan,
        planName: quota.planName,
        ownedCount: quota.ownedCount,
        maxStores: quota.maxStores,
        remainingStores: quota.remainingStores,
        canCreateMore: quota.canCreateMore,
      },
    };
  }

  async getAllTenants() {
    return this.prisma.publicClient.tenant.findMany({
      where: { status: 'ACTIVE' },
      select: {
        id: true,
        name: true,
        slug: true,
        plan: true,
        ownerName: true,
        primaryColor: true,
        logoUrl: true,
        settings: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getTenantBySlug(slug: string) {
    const tenant = await this.prisma.publicClient.tenant.findUnique({
      where: { slug: slug.toLowerCase() },
    });

    if (!tenant) {
      throw new NotFoundException(`La tienda "${slug}" no fue encontrada.`);
    }

    return this.formatTenantSummary(tenant);
  }

  /**
   * Actualiza el perfil comercial, logo, colores y configuración del storefront de una tienda.
   * Valida que el usuario autenticado sea el dueño o tenga membresía OWNER / ADMIN.
   */
  async updateTenantProfile(
    authUser: { id: string; email: string },
    slug: string,
    dto: UpdateTenantProfileDto,
  ) {
    if (!authUser?.id || !authUser?.email) {
      throw new UnauthorizedException('Debes iniciar sesión para actualizar la tienda.');
    }

    const cleanSlug = slug?.toLowerCase()?.trim();
    const tenant = await this.prisma.publicClient.tenant.findUnique({
      where: { slug: cleanSlug },
      include: {
        memberships: {
          where: { userId: authUser.id },
        },
      },
    });

    if (!tenant) {
      throw new NotFoundException(`La tienda "${cleanSlug}" no existe.`);
    }

    const normalizedEmail = authUser.email.toLowerCase().trim();
    const isOwnerByEmail = tenant.ownerEmail?.toLowerCase() === normalizedEmail;
    const hasAdminMembership = tenant.memberships?.some((m: any) =>
      ['OWNER', 'ADMIN'].includes(m.role?.toUpperCase()),
    );

    if (!isOwnerByEmail && !hasAdminMembership) {
      throw new ForbiddenException('No tienes permisos administrativos para configurar esta tienda.');
    }

    const existingSettings = (tenant.settings as any) || {};
    const updatedSettings = {
      ...existingSettings,
      ...(dto.category ? { category: dto.category } : {}),
      ...(dto.tagline !== undefined ? { tagline: dto.tagline } : {}),
      ...(dto.announcement !== undefined ? { announcement: dto.announcement } : {}),
      ...(dto.address !== undefined ? { address: dto.address } : {}),
      storefront: {
        ...(existingSettings.storefront || {}),
        ...(dto.hero ? { hero: { ...(existingSettings.storefront?.hero || {}), ...dto.hero } } : {}),
        ...(dto.contact ? { contact: { ...(existingSettings.storefront?.contact || {}), ...dto.contact } } : {}),
        ...(dto.announcement !== undefined ? { announcement: dto.announcement } : {}),
        ...(dto.tagline !== undefined ? { tagline: dto.tagline } : {}),
      },
    };

    const updated = await this.prisma.publicClient.tenant.update({
      where: { slug: cleanSlug },
      data: {
        ...(dto.name ? { name: dto.name.trim() } : {}),
        ...(dto.logoUrl !== undefined ? { logoUrl: dto.logoUrl } : {}),
        ...(dto.primaryColor ? { primaryColor: dto.primaryColor } : {}),
        ...(dto.phone !== undefined ? { phone: dto.phone } : {}),
        settings: updatedSettings,
      },
    });

    return this.formatTenantSummary(updated);
  }

  async getPlatformStats() {
    const totalTenants = await this.prisma.publicClient.tenant.count({
      where: { status: 'ACTIVE' },
    });

    return {
      totalStores: totalTenants,
      activePlans: {
        starter: await this.prisma.publicClient.tenant.count({
          where: { plan: 'STARTER' },
        }),
        pro: await this.prisma.publicClient.tenant.count({
          where: { plan: 'PRO' },
        }),
        enterprise: await this.prisma.publicClient.tenant.count({
          where: { plan: 'ENTERPRISE' },
        }),
      },
      uptime: '99.98%',
      multitenancyMode: 'Schema-Based (PostgreSQL isolated schemas per store)',
      version: '2.5.0-cloud',
    };
  }

  private formatTenantSummary(t: any) {
    return {
      id: t.id,
      name: t.name,
      slug: t.slug,
      schemaName: t.schemaName,
      plan: t.plan,
      status: t.status,
      ownerName: t.ownerName,
      ownerEmail: t.ownerEmail,
      phone: t.phone,
      primaryColor: t.primaryColor,
      logoUrl: t.logoUrl,
      settings: t.settings,
      domain: (t.settings as any)?.domain || `${t.slug}.fashionstore.com`,
      category: (t.settings as any)?.category || 'Comercio General',
      createdAt: t.createdAt,
    };
  }

  private async ensureGlobalUser(userId: string, normalizedEmail: string) {
    let globalUser = await this.prisma.publicClient.user.findUnique({
      where: { id: userId },
    });

    if (!globalUser) {
      globalUser = await this.prisma.publicClient.user.findUnique({
        where: { email: normalizedEmail },
      });
    }

    if (!globalUser) {
      // Buscar en los esquemas de tenants propiedad de este correo si procede de una cuenta previa
      const ownedTenants = await this.prisma.publicClient.tenant.findMany({
        where: {
          ownerEmail: { equals: normalizedEmail, mode: 'insensitive' },
          status: 'ACTIVE',
        },
      });
      for (const t of ownedTenants) {
        try {
          const schemaUsers: any[] = await this.prisma.$queryRawUnsafe(
            `SELECT id, email, password_hash, first_name, last_name, phone FROM "${t.schemaName}"."users" WHERE email = $1 LIMIT 1`,
            normalizedEmail,
          );
          if (schemaUsers.length > 0) {
            globalUser = await this.prisma.publicClient.user.create({
              data: {
                id: schemaUsers[0].id,
                email: normalizedEmail,
                passwordHash: schemaUsers[0].password_hash,
                firstName: schemaUsers[0].first_name || 'Admin',
                lastName: schemaUsers[0].last_name || 'Store',
                phone: schemaUsers[0].phone,
                isActive: true,
              },
            });
            break;
          }
        } catch {
          // Continuar
        }
      }
    }

    if (!globalUser) {
      throw new UnauthorizedException('El usuario global no existe o su sesión expiró.');
    }

    return globalUser;
  }

  private async generateTenantTokens(userId: string, email: string) {
    const accessSecret =
      this.configService?.get<string>(
        'JWT_ACCESS_SECRET',
        'supersecret_access_token_fashionstore_2026_dev_key',
      ) || 'supersecret_access_token_fashionstore_2026_dev_key';

    const refreshSecret =
      this.configService?.get<string>(
        'JWT_REFRESH_SECRET',
        'supersecret_refresh_token_fashionstore_2026_dev_key',
      ) || 'supersecret_refresh_token_fashionstore_2026_dev_key';

    const accessTokenExpiresIn =
      this.configService?.get<string>('JWT_ACCESS_EXPIRES_IN', '24h') || '24h';
    const refreshTokenExpiresIn =
      this.configService?.get<string>('JWT_REFRESH_EXPIRES_IN', '7d') || '7d';

    const [accessToken, refreshToken] = await Promise.all([
      this.jwt.signAsync(
        { sub: userId, email, jti: crypto.randomUUID() },
        {
          secret: accessSecret,
          expiresIn: accessTokenExpiresIn as any,
        },
      ),
      this.jwt.signAsync(
        { sub: userId, email, jti: crypto.randomUUID() },
        {
          secret: refreshSecret,
          expiresIn: refreshTokenExpiresIn as any,
        },
      ),
    ]);

    const tokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    await this.prisma.refreshToken.create({
      data: {
        userId,
        tokenHash,
        expiresAt,
      },
    });

    return {
      accessToken,
      refreshToken,
      tokenType: 'Bearer',
      expiresIn: accessTokenExpiresIn,
    };
  }

  private sanitizeUser(user: any) {
    const roles: string[] = [];
    const permissions = new Set<string>();

    if (user.roles) {
      for (const ur of user.roles) {
        if (ur.role) {
          roles.push(ur.role.name);
          if (ur.role.permissions) {
            for (const rp of ur.role.permissions) {
              if (rp.permission) {
                permissions.add(rp.permission.code);
              }
            }
          }
        }
      }
    }

    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      phone: user.phone,
      isActive: user.isActive,
      preferences: user.preferences || {},
      roles,
      permissions: Array.from(permissions),
      createdAt: user.createdAt,
    };
  }
}
