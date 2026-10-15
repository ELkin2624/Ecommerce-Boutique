import {
  Injectable,
  ConflictException,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';
import * as argon2 from 'argon2';

export interface CreateTenantDto {
  name: string;
  slug: string;
  plan: 'STARTER' | 'PRO' | 'ENTERPRISE';
  ownerName: string;
  ownerEmail: string;
  password: string;
  phone?: string;
  primaryColor?: string;
  category?: string;
}

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

  async createTenant(dto: CreateTenantDto) {
    const cleanSlug = dto.slug
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9-]/g, '')
      .replace(/-+/g, '-');

    if (!cleanSlug) {
      throw new ConflictException('El identificador / slug no es válido.');
    }

    // 1. Check uniqueness in public.tenants
    const existing = await this.prisma.publicClient.tenant.findFirst({
      where: {
        OR: [{ slug: cleanSlug }, { ownerEmail: dto.ownerEmail.toLowerCase() }],
      },
    });

    if (existing) {
      if (existing.slug === cleanSlug) {
        throw new ConflictException(
          `El subdominio o slug "${cleanSlug}" ya está en uso. Por favor elige otro.`,
        );
      }
      throw new ConflictException(
        `Ya existe una tienda registrada con el correo ${dto.ownerEmail}.`,
      );
    }

    const schemaName = `tenant_${cleanSlug.replace(/-/g, '_')}`;

    this.logger.log(
      `Iniciando aprovisionamiento de nuevo inquilino: "${dto.name}" (Esquema: ${schemaName})`,
    );

    const client = this.prisma.publicClient;

    try {
      // 2. Create PostgreSQL Schema
      await client.$executeRawUnsafe(
        `CREATE SCHEMA IF NOT EXISTS "${schemaName}";`,
      );

      // 3. Clone table structures
      for (const table of TABLES_IN_ORDER) {
        await client.$executeRawUnsafe(
          `CREATE TABLE IF NOT EXISTS "${schemaName}"."${table}" (LIKE public."${table}" INCLUDING ALL);`,
        );
      }

      // 4. Apply Foreign Keys within tenant schema
      const fks = (await client.$queryRawUnsafe(`
        SELECT
          tc.table_name, 
          kcu.column_name, 
          ccu.table_name AS foreign_table_name,
          ccu.column_name AS foreign_column_name,
          rc.delete_rule,
          rc.update_rule,
          tc.constraint_name
        FROM information_schema.table_constraints AS tc 
        JOIN information_schema.key_column_usage AS kcu
          ON tc.constraint_name = kcu.constraint_name
          AND tc.table_schema = kcu.table_schema
        JOIN information_schema.constraint_column_usage AS ccu
          ON ccu.constraint_name = tc.constraint_name
          AND ccu.table_schema = tc.table_schema
        JOIN information_schema.referential_constraints AS rc
          ON rc.constraint_name = tc.constraint_name
        WHERE tc.constraint_type = 'FOREIGN KEY' 
          AND tc.table_schema = 'public';
      `)) as any[];

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
          // ignore if already present
        }
      }

      // 5. Seed base security (Roles & Permissions from public)
      await client.$executeRawUnsafe(`INSERT INTO "${schemaName}".roles SELECT * FROM public.roles ON CONFLICT DO NOTHING;`);
      await client.$executeRawUnsafe(`INSERT INTO "${schemaName}".permissions SELECT * FROM public.permissions ON CONFLICT DO NOTHING;`);
      await client.$executeRawUnsafe(`INSERT INTO "${schemaName}".role_permissions SELECT * FROM public.role_permissions ON CONFLICT DO NOTHING;`);
      await client.$executeRawUnsafe(`INSERT INTO "${schemaName}".cities SELECT * FROM public.cities ON CONFLICT DO NOTHING;`);


      // 6. Create Owner User (Role: ADMIN)
      const passwordHash = await argon2.hash(dto.password);
      const [firstName, ...lastNames] = dto.ownerName.trim().split(' ');
      const lastName = lastNames.join(' ') || 'Admin';

      const userRes = (await client.$queryRawUnsafe(`
        INSERT INTO "${schemaName}".users (id, email, password_hash, first_name, last_name, phone, is_active, preferences, created_at, updated_at)
        VALUES (gen_random_uuid(), '${dto.ownerEmail.toLowerCase()}', '${passwordHash}', '${firstName}', '${lastName}', ${dto.phone ? `'${dto.phone}'` : 'NULL'}, true, '{"onboarded": true}'::jsonb, NOW(), NOW())
        RETURNING id;
      `)) as any[];

      const ownerId = userRes[0]?.id;

      // Assign ADMIN role
      const adminRole = (await client.$queryRawUnsafe(`
        SELECT id FROM "${schemaName}".roles WHERE name = 'ADMIN' LIMIT 1;
      `)) as any[];

      if (adminRole[0]?.id && ownerId) {
        await client.$executeRawUnsafe(`
          INSERT INTO "${schemaName}".user_roles (user_id, role_id)
          VALUES ('${ownerId}', '${adminRole[0].id}')
          ON CONFLICT DO NOTHING;
        `);
      }

      // 7. Create default branch and sales floor / warehouse
      const defaultCity = (await client.$queryRawUnsafe(`
        SELECT id FROM "${schemaName}".cities LIMIT 1;
      `)) as any[];

      const cityId = defaultCity[0]?.id;
      let branchId: string | undefined;

      if (cityId) {
        const branchRes = (await client.$queryRawUnsafe(`
          INSERT INTO "${schemaName}".branches (id, city_id, name, address, phone, is_active, created_at)
          VALUES (gen_random_uuid(), '${cityId}', 'Casa Matriz - ${dto.name}', 'Av. Principal #100', ${dto.phone ? `'${dto.phone}'` : 'NULL'}, true, NOW())
          RETURNING id;
        `)) as any[];
        branchId = branchRes[0]?.id;

        if (branchId) {
          // Inventory locations
          const locRes = (await client.$queryRawUnsafe(`
            INSERT INTO "${schemaName}".inventory_locations (id, branch_id, name, type, is_active)
            VALUES 
              (gen_random_uuid(), '${branchId}', 'Piso de Venta', 'SALES_FLOOR', true),
              (gen_random_uuid(), '${branchId}', 'Almacén Central', 'WAREHOUSE', true)
            RETURNING id;
          `)) as any[];

          const salesFloorLocationId = locRes[0]?.id;

          // 8. Seed Starter Catalog so store is ready to demonstrate!
          await this.seedStarterCatalog(schemaName, salesFloorLocationId);
        }
      }

      // 9. Save Tenant in central public.tenants
      const newTenant = await client.tenant.create({
        data: {
          name: dto.name,
          slug: cleanSlug,
          schemaName: schemaName,
          plan: dto.plan || 'STARTER',
          status: 'ACTIVE',
          ownerName: dto.ownerName,
          ownerEmail: dto.ownerEmail.toLowerCase(),
          phone: dto.phone,
          primaryColor: dto.primaryColor || '#ec4899',
          settings: {
            category: dto.category || 'Moda Femenina & Boutiques',
            onboardingCompleted: true,
            maxBranches: dto.plan === 'ENTERPRISE' ? 999 : dto.plan === 'PRO' ? 5 : 1,
            maxProducts: dto.plan === 'ENTERPRISE' ? 99999 : dto.plan === 'PRO' ? 5000 : 500,
          },
        },
      });

      this.logger.log(
        `Inquilino "${newTenant.name}" creado y aprovisionado exitosamente en esquema "${schemaName}".`,
      );

      return {
        tenant: newTenant,
        schemaName,
        adminEmail: dto.ownerEmail,
        message: `Tienda "${dto.name}" creada con éxito en su propio esquema PostgreSQL aislado.`,
      };
    } catch (error: any) {
      this.logger.error(
        `Fallo al aprovisionar esquema para ${cleanSlug}: ${error.message}`,
        error.stack,
      );
      throw new InternalServerErrorException(
        `Error al crear la infraestructura multi-tenant: ${error.message}`,
      );
    }
  }

  private async seedStarterCatalog(schemaName: string, locationId?: string) {
    const client = this.prisma.publicClient;

    try {
      // Category
      const catRes = (await client.$queryRawUnsafe(`
        INSERT INTO "${schemaName}".categories (id, name, slug)
        VALUES 
          (gen_random_uuid(), 'Vestidos de Temporada', 'vestidos-temporada'),
          (gen_random_uuid(), 'Blusas y Tops Elegantes', 'blusas-tops'),
          (gen_random_uuid(), 'Pantalones y Faldas', 'pantalones-faldas')
        RETURNING id;
      `)) as any[];

      const catId = catRes[0]?.id;

      // Sample Product
      if (catId) {
        const prodRes = (await client.$queryRawUnsafe(`
          INSERT INTO "${schemaName}".products (id, name, description, brand, category_id, is_active, created_at, updated_at)
          VALUES (
            gen_random_uuid(),
            'Vestido Midi Seda Champagne',
            'Vestido midi confeccionado en satén de seda fluida. Escote drapeado con caída natural.',
            'Signature Boutique',
            '${catId}',
            true,
            NOW(),
            NOW()
          )
          RETURNING id;
        `)) as any[];

        const prodId = prodRes[0]?.id;

        if (prodId) {
          // Variants
          const varRes = (await client.$queryRawUnsafe(`
            INSERT INTO "${schemaName}".product_variants (id, product_id, sku, size, color, price, cost, is_active, created_at, updated_at)
            VALUES 
              (gen_random_uuid(), '${prodId}', 'VMS-CHAMP-S', 'S', 'Champagne', 189.00, 65.00, true, NOW(), NOW()),
              (gen_random_uuid(), '${prodId}', 'VMS-CHAMP-M', 'M', 'Champagne', 189.00, 65.00, true, NOW(), NOW())
            RETURNING id;
          `)) as any[];

          // Stock if location exists
          if (locationId && varRes.length > 0) {
            for (const v of varRes) {
              await client.$executeRawUnsafe(`
                INSERT INTO "${schemaName}".inventory_stocks (id, variant_id, location_id, quantity, min_stock, updated_at)
                VALUES (gen_random_uuid(), '${v.id}', '${locationId}', 12, 3, NOW());
              `);
            }
          }
        }
      }
    } catch (e: any) {
      this.logger.warn(`No se pudieron sembrar productos de muestra: ${e.message}`);
    }
  }
}
