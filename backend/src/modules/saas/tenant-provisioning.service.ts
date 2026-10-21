import {
  Injectable,
  ConflictException,
  BadRequestException,
  UnauthorizedException,
  ForbiddenException,
  InternalServerErrorException,
  HttpException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';
import * as argon2 from 'argon2';

export type SaasPlanId = 'STARTER' | 'PRO' | 'ENTERPRISE';

export interface PlanLimitPolicy {
  id: SaasPlanId;
  name: string;
  maxStores: number;
  maxBranches: number;
  maxProducts: number;
  maxUsers: number;
  storage: string;
}

export const PLAN_LIMITS: Record<SaasPlanId, PlanLimitPolicy> = {
  STARTER: {
    id: 'STARTER',
    name: 'Starter Boutique',
    maxStores: 1,
    maxBranches: 1,
    maxProducts: 500,
    maxUsers: 2,
    storage: '5 GB',
  },
  PRO: {
    id: 'PRO',
    name: 'Pro Crecimiento',
    maxStores: 3,
    maxBranches: 5,
    maxProducts: 5000,
    maxUsers: 10,
    storage: '50 GB',
  },
  ENTERPRISE: {
    id: 'ENTERPRISE',
    name: 'Enterprise Omnichannel',
    maxStores: 10,
    maxBranches: 999,
    maxProducts: 999999,
    maxUsers: 999,
    storage: '500 GB',
  },
};

const PLAN_RANK: Record<SaasPlanId, number> = {
  STARTER: 1,
  PRO: 2,
  ENTERPRISE: 3,
};

export function normalizePlanId(plan?: string | null): SaasPlanId {
  const upper = (plan || 'STARTER').toUpperCase().trim();
  if (upper === 'PRO' || upper === 'ENTERPRISE' || upper === 'STARTER') {
    return upper;
  }
  return 'STARTER';
}

export interface CreateTenantDto {
  name: string;
  slug: string;
  plan?: 'STARTER' | 'PRO' | 'ENTERPRISE';
  ownerName: string;
  ownerEmail: string;
  password?: string;
  phone?: string;
  primaryColor?: string;
  category?: string;
}

export interface CreateTenantOptions {
  authenticatedUserId?: string;
}

const RESERVED_SLUGS = [
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

const TABLES_IN_ORDER = [
  'roles',
  'permissions',
  'role_permissions',
  'users',
  'user_roles',
  'refresh_tokens',
  'categories',
  'seasons',
  'collections',
  'suppliers',
  'products',
  'product_variants',
  'product_images',
  'cities',
  'branches',
  'inventory_locations',
  '_SharedWarehouses',
  'inventory_stocks',
  'inventory_movements',
  'reservations',
  'reservation_items',
  'carts',
  'cart_items',
  'orders',
  'order_items',
  'payments',
  'promotions',
];

@Injectable()
export class TenantProvisioningService {
  private readonly logger = new Logger(TenantProvisioningService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Consulta en base de datos las tiendas propias del usuario y determina su plan efectivo y cupo disponible.
   */
  async getUserPlanAndStoreQuota(
    userId: string,
    email: string,
    dbClient: any = this.prisma.publicClient,
  ) {
    const normalizedEmail = email.toLowerCase().trim();

    const ownedTenants = await dbClient.tenant.findMany({
      where: {
        status: { in: ['ACTIVE', 'PROVISIONING'] },
        OR: [
          { ownerEmail: { equals: normalizedEmail, mode: 'insensitive' } },
          {
            memberships: {
              some: {
                userId,
                role: 'OWNER',
              },
            },
          },
        ],
      },
      orderBy: { createdAt: 'asc' },
    });

    // Determinar plan autorizado según las tiendas activas del usuario en BD
    let effectivePlan: SaasPlanId = 'STARTER';
    if (ownedTenants.length > 0) {
      for (const t of ownedTenants) {
        const tPlan = normalizePlanId(t.plan);
        if (PLAN_RANK[tPlan] > PLAN_RANK[effectivePlan]) {
          effectivePlan = tPlan;
        }
      }
    }

    const policy = PLAN_LIMITS[effectivePlan];
    const ownedCount = ownedTenants.length;

    return {
      effectivePlan,
      planName: policy.name,
      ownedTenants,
      ownedCount,
      maxStores: policy.maxStores,
      remainingStores: Math.max(0, policy.maxStores - ownedCount),
      canCreateMore: ownedCount < policy.maxStores,
      limits: policy,
    };
  }

  async createTenant(dto: CreateTenantDto, options?: CreateTenantOptions) {
    // 1. Validar y normalizar el slug
    const cleanSlug = dto.slug
      ?.toLowerCase()
      ?.trim()
      ?.normalize('NFD')
      ?.replace(/[\u0300-\u036f]/g, '')
      ?.replace(/[^a-z0-9-]/g, '')
      ?.replace(/-+/g, '-');

    if (!cleanSlug || cleanSlug.length < 3 || cleanSlug.length > 50) {
      throw new BadRequestException(
        'El identificador / slug debe contener entre 3 y 50 caracteres alfanuméricos o guiones.',
      );
    }

    if (!dto.name || dto.name.trim().length < 2) {
      throw new BadRequestException(
        'El nombre comercial de la tienda debe tener al menos 2 caracteres.',
      );
    }

    if (RESERVED_SLUGS.includes(cleanSlug)) {
      throw new ConflictException(
        `El subdominio "${cleanSlug}" es un nombre reservado del sistema. Por favor elige otro.`,
      );
    }

    const client = this.prisma.publicClient;

    // 2. Generar y validar nombre de esquema PostgreSQL seguro
    const schemaName = `tenant_${cleanSlug.replace(/-/g, '_')}`;
    if (!/^tenant_[a-z0-9_]{3,60}$/.test(schemaName)) {
      throw new BadRequestException('El nombre de esquema generado no es seguro o válido.');
    }

    // 3. Resolver identidad global del usuario
    const normalizedEmail = dto.ownerEmail.toLowerCase().trim();
    let globalUser = options?.authenticatedUserId
      ? await client.user.findUnique({ where: { id: options.authenticatedUserId } })
      : await client.user.findUnique({ where: { email: normalizedEmail } });

    if (!globalUser && options?.authenticatedUserId) {
      globalUser = await client.user.findUnique({ where: { email: normalizedEmail } });
    }

    const [firstName, ...lastNames] = (dto.ownerName || 'Admin Store').trim().split(' ');
    const lastName = lastNames.join(' ') || 'Admin';

    if (globalUser) {
      // Si no viene de una sesión JWT autenticada, exigir verificación de contraseña de la cuenta existente
      if (!options?.authenticatedUserId) {
        if (!dto.password) {
          throw new UnauthorizedException(
            'Esta cuenta ya existe. Debes proporcionar tu contraseña o iniciar sesión para crear otra tienda.',
          );
        }
        const isMatch = await argon2.verify(globalUser.passwordHash, dto.password);
        if (!isMatch) {
          throw new UnauthorizedException(
            'La contraseña provista no coincide con la cuenta existente.',
          );
        }
      }
    } else {
      // Crear nuevo usuario global en el plano central public.users
      if (!dto.password || dto.password.length < 6) {
        throw new BadRequestException('La contraseña debe tener al menos 6 caracteres.');
      }
      const passwordHash = await argon2.hash(dto.password, { type: argon2.argon2id });

      const adminRole = await client.role.findUnique({ where: { name: 'ADMIN' } });

      globalUser = await client.user.create({
        data: {
          email: normalizedEmail,
          passwordHash,
          firstName,
          lastName,
          phone: dto.phone || null,
          isActive: true,
          roles: adminRole
            ? {
                create: { roleId: adminRole.id },
              }
            : undefined,
        },
      });
      this.logger.log(`Usuario global creado en public.users: ${globalUser.email}`);
    }

    // 4. Transacción atómica con bloqueo por usuario y por slug para verificar unicidad y límites del plan
    let newTenant: any;
    let assignedPlan: SaasPlanId;

    try {
      const reservation = await client.$transaction(async (tx) => {
        // Bloqueo transaccional exclusivo por propietario y por subdominio (previene condiciones de carrera)
        await tx.$executeRawUnsafe(
          `SELECT pg_advisory_xact_lock(hashtext($1));`,
          `owner:${globalUser!.email.toLowerCase()}`,
        );
        await tx.$executeRawUnsafe(
          `SELECT pg_advisory_xact_lock(hashtext($1));`,
          `slug:${cleanSlug}`,
        );

        // Verificar unicidad de slug dentro del bloqueo
        const existingSlug = await tx.tenant.findUnique({
          where: { slug: cleanSlug },
        });

        if (existingSlug) {
          throw new ConflictException(
            `El subdominio o slug "${cleanSlug}" ya está en uso. Por favor elige otro nombre para tu tienda.`,
          );
        }

        // Consultar tiendas propias actuales y cupo real según el plan en base de datos
        const quota = await this.getUserPlanAndStoreQuota(
          globalUser!.id,
          globalUser!.email,
          tx,
        );

        // Si el usuario ya posee al menos 1 tienda, su plan efectivo lo dicta la BD (no el parámetro del cliente)
        const effectivePlan: SaasPlanId =
          quota.ownedCount > 0 ? quota.effectivePlan : normalizePlanId(dto.plan);

        const planPolicy = PLAN_LIMITS[effectivePlan];

        if (quota.ownedCount >= planPolicy.maxStores) {
          throw new ForbiddenException(
            `Has alcanzado el límite máximo de tiendas permitidas por tu plan ${planPolicy.name} (${quota.ownedCount}/${planPolicy.maxStores} ${planPolicy.maxStores === 1 ? 'tienda' : 'tiendas'}). Actualiza tu plan para crear más tiendas.`,
          );
        }

        const createdTenant = await tx.tenant.create({
          data: {
            name: dto.name.trim(),
            slug: cleanSlug,
            schemaName: schemaName,
            plan: effectivePlan,
            status: 'PROVISIONING',
            ownerName: `${globalUser!.firstName} ${globalUser!.lastName}`,
            ownerEmail: globalUser!.email.toLowerCase(),
            phone: dto.phone || globalUser!.phone || null,
            primaryColor: dto.primaryColor || '#1D8B94',
            settings: {
              category: dto.category || 'Comercio General',
              onboardingCompleted: true,
              maxStores: planPolicy.maxStores,
              maxBranches: planPolicy.maxBranches,
              maxProducts: planPolicy.maxProducts,
              maxUsers: planPolicy.maxUsers,
            },
          },
        });

        // Registrar membresía OWNER en public.tenant_memberships dentro de la misma transacción
        await tx.tenantMembership.upsert({
          where: {
            tenantId_userId: {
              tenantId: createdTenant.id,
              userId: globalUser!.id,
            },
          },
          update: { role: 'OWNER' },
          create: {
            tenantId: createdTenant.id,
            userId: globalUser!.id,
            role: 'OWNER',
          },
        });

        return { createdTenant, effectivePlan };
      });

      newTenant = reservation.createdTenant;
      assignedPlan = reservation.effectivePlan;
    } catch (err) {
      if (err instanceof HttpException) {
        throw err;
      }
      throw new ConflictException(
        `No se pudo reservar el subdominio "${cleanSlug}": ${(err as any)?.message || 'Error de concurrencia'}`,
      );
    }

    this.logger.log(
      `Iniciando aprovisionamiento limpio de nuevo inquilino: "${dto.name}" (Slug: ${cleanSlug}, Esquema: ${schemaName}, Plan: ${assignedPlan})`,
    );

    try {
      // 5. Crear el esquema PostgreSQL aislado si aún no existe
      await client.$executeRawUnsafe(`CREATE SCHEMA IF NOT EXISTS "${schemaName}";`);

      // 5.1 Clonar tipos ENUM en el esquema del inquilino para compatibilidad nativa con Prisma Client (?schema=tenant_...)
      const enumDefinitions: Array<{ name: string; values: string[] }> = [
        { name: 'LocationType', values: ['WAREHOUSE', 'SALES_FLOOR'] },
        {
          name: 'MovementType',
          values: [
            'PURCHASE_RECEIPT',
            'TRANSFER',
            'RESERVATION_HOLD',
            'RESERVATION_RELEASE',
            'SALE',
            'RETURN',
            'ADJUSTMENT',
          ],
        },
        {
          name: 'ReservationStatus',
          values: [
            'PENDING',
            'CONFIRMED',
            'PREPARED',
            'READY',
            'COMPLETED',
            'CANCELLED',
            'EXPIRED',
          ],
        },
        { name: 'OrderType', values: ['ONLINE', 'IN_STORE'] },
        { name: 'OrderStatus', values: ['PENDING', 'PAID', 'DELIVERED', 'CANCELLED'] },
        { name: 'PaymentMethod', values: ['CASH', 'CARD', 'QR', 'GATEWAY'] },
        { name: 'PaymentStatus', values: ['PENDING', 'SUCCESS', 'FAILED'] },
      ];

      for (const enumDef of enumDefinitions) {
        const valuesLiteral = enumDef.values.map((v) => `'${v}'`).join(', ');
        await client.$executeRawUnsafe(`
          DO $$ BEGIN
            CREATE TYPE "${schemaName}"."${enumDef.name}" AS ENUM (${valuesLiteral});
          EXCEPTION
            WHEN duplicate_object THEN null;
          END $$;
        `);
      }

      // 6. Clonar estructuras de tablas (migraciones aplicadas en el tenant)
      for (const table of TABLES_IN_ORDER) {
        await client.$executeRawUnsafe(
          `CREATE TABLE IF NOT EXISTS "${schemaName}"."${table}" (LIKE public."${table}" INCLUDING ALL);`,
        );
      }

      // 6.1 Alinear columnas ENUM del esquema del tenant con sus tipos ENUM locales
      const enumColumns: Array<{
        table: string;
        column: string;
        enumName: string;
        defaultValue?: string;
      }> = [
        {
          table: 'inventory_locations',
          column: 'type',
          enumName: 'LocationType',
          defaultValue: 'SALES_FLOOR',
        },
        {
          table: 'inventory_movements',
          column: 'type',
          enumName: 'MovementType',
        },
        {
          table: 'reservations',
          column: 'status',
          enumName: 'ReservationStatus',
          defaultValue: 'PENDING',
        },
        {
          table: 'orders',
          column: 'type',
          enumName: 'OrderType',
          defaultValue: 'ONLINE',
        },
        {
          table: 'orders',
          column: 'status',
          enumName: 'OrderStatus',
          defaultValue: 'PENDING',
        },
        {
          table: 'payments',
          column: 'method',
          enumName: 'PaymentMethod',
        },
        {
          table: 'payments',
          column: 'status',
          enumName: 'PaymentStatus',
          defaultValue: 'PENDING',
        },
      ];

      for (const ec of enumColumns) {
        await client.$executeRawUnsafe(
          `ALTER TABLE "${schemaName}"."${ec.table}" ALTER COLUMN "${ec.column}" DROP DEFAULT;`,
        );
        await client.$executeRawUnsafe(
          `ALTER TABLE "${schemaName}"."${ec.table}" ALTER COLUMN "${ec.column}" TYPE "${schemaName}"."${ec.enumName}" USING ("${ec.column}"::text::"${schemaName}"."${ec.enumName}");`,
        );
        if (ec.defaultValue) {
          await client.$executeRawUnsafe(
            `ALTER TABLE "${schemaName}"."${ec.table}" ALTER COLUMN "${ec.column}" SET DEFAULT '${ec.defaultValue}'::"${schemaName}"."${ec.enumName}";`,
          );
        }
      }

      // 7. Aplicar Foreign Keys dentro del esquema del inquilino (consulta rápida vía pg_catalog)
      const fks = ((await client.$queryRawUnsafe(`
        SELECT
          rel.relname AS table_name,
          att.attname AS column_name,
          frel.relname AS foreign_table_name,
          fatt.attname AS foreign_column_name,
          CASE con.confdeltype
            WHEN 'a' THEN 'NO ACTION'
            WHEN 'r' THEN 'RESTRICT'
            WHEN 'c' THEN 'CASCADE'
            WHEN 'n' THEN 'SET NULL'
            WHEN 'd' THEN 'SET DEFAULT'
            ELSE 'NO ACTION'
          END AS delete_rule,
          CASE con.confupdtype
            WHEN 'a' THEN 'NO ACTION'
            WHEN 'r' THEN 'RESTRICT'
            WHEN 'c' THEN 'CASCADE'
            WHEN 'n' THEN 'SET NULL'
            WHEN 'd' THEN 'SET DEFAULT'
            ELSE 'NO ACTION'
          END AS update_rule,
          con.conname AS constraint_name
        FROM pg_catalog.pg_constraint con
        JOIN pg_catalog.pg_namespace nsp ON nsp.oid = con.connamespace
        JOIN pg_catalog.pg_class rel ON rel.oid = con.conrelid
        JOIN pg_catalog.pg_class frel ON frel.oid = con.confrelid
        JOIN pg_catalog.pg_attribute att ON att.attrelid = con.conrelid AND att.attnum = con.conkey[1]
        JOIN pg_catalog.pg_attribute fatt ON fatt.attrelid = con.confrelid AND fatt.attnum = con.confkey[1]
        WHERE con.contype = 'f'
          AND nsp.nspname = 'public'
          AND array_length(con.conkey, 1) = 1;
      `)) || []) as any[];

      for (const fk of fks) {
        try {
          const cName = `${fk.table_name}_${fk.column_name}_fkey`.substring(0, 60);
          await client.$executeRawUnsafe(`
            ALTER TABLE "${schemaName}"."${fk.table_name}"
            ADD CONSTRAINT "${cName}"
            FOREIGN KEY ("${fk.column_name}")
            REFERENCES "${schemaName}"."${fk.foreign_table_name}" ("${fk.foreign_column_name}")
            ON DELETE ${fk.delete_rule} ON UPDATE ${fk.update_rule};
          `);
        } catch {
          // Ya existe la restricción
        }
      }

      // 8. Sembrar únicamente RBAC de seguridad base (Roles y Permisos del sistema)
      // REGLA OBLIGATORIA: NO se pre-crean ciudades/departamentos, sucursales, almacenes,
      // pisos de venta (POS), categorías, productos, variantes, clientes ni pedidos.
      await client.$executeRawUnsafe(
        `INSERT INTO "${schemaName}".roles SELECT * FROM public.roles ON CONFLICT DO NOTHING;`,
      );
      await client.$executeRawUnsafe(
        `INSERT INTO "${schemaName}".permissions SELECT * FROM public.permissions ON CONFLICT DO NOTHING;`,
      );
      await client.$executeRawUnsafe(
        `INSERT INTO "${schemaName}".role_permissions SELECT * FROM public.role_permissions ON CONFLICT DO NOTHING;`,
      );

      // 9. Crear usuario administrador en el esquema del tenant con el mismo ID que el usuario global
      await client.$executeRawUnsafe(
        `INSERT INTO "${schemaName}".users (id, email, password_hash, first_name, last_name, phone, is_active, preferences, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, true, '{"onboarded": true}'::jsonb, NOW(), NOW())
         ON CONFLICT (id) DO UPDATE SET email = EXCLUDED.email;`,
        globalUser.id,
        globalUser.email,
        globalUser.passwordHash,
        globalUser.firstName,
        globalUser.lastName,
        globalUser.phone || null,
      );

      // Asignar rol ADMIN en el esquema del tenant
      const adminRole = (await client.$queryRawUnsafe(
        `SELECT id FROM "${schemaName}".roles WHERE name = 'ADMIN' LIMIT 1;`,
      )) as any[];

      if (adminRole[0]?.id) {
        await client.$executeRawUnsafe(
          `INSERT INTO "${schemaName}".user_roles (user_id, role_id)
           VALUES ($1, $2)
           ON CONFLICT DO NOTHING;`,
          globalUser.id,
          adminRole[0].id,
        );
      }

      // 10. Marcar el tenant como OPERATIVO (ACTIVE) únicamente tras completar exitosamente la inicialización
      newTenant = await client.tenant.update({
        where: { id: newTenant.id },
        data: { status: 'ACTIVE' },
      });

      this.logger.log(
        `Inquilino "${newTenant.name}" (${newTenant.slug}) aprovisionado 100% limpio (0 sucursales, 0 almacenes, 0 POS, 0 ciudades, 0 productos) y marcado como ACTIVE.`,
      );

      return {
        tenant: newTenant,
        schemaName,
        adminEmail: globalUser.email,
        message: `Tienda "${dto.name}" creada con éxito en su propio esquema PostgreSQL aislado y sin datos comerciales ni operativos precreados.`,
      };
    } catch (error: any) {
      this.logger.error(
        `Fallo al aprovisionar esquema para ${cleanSlug}: ${error.message}`,
        error.stack,
      );

      // Si falló el aprovisionamiento, marcar tenant como FAILED para no dejar estado operativo corrupto ni bloquear cupo
      if (newTenant?.id) {
        await client.tenant
          .update({
            where: { id: newTenant.id },
            data: { status: 'FAILED' },
          })
          .catch(() => {});
      }

      throw new InternalServerErrorException(
        `Error al crear la infraestructura multi-tenant: ${error.message}`,
      );
    }
  }
}
