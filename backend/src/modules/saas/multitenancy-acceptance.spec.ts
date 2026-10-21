import { jest } from '@jest/globals';
import { Test, TestingModule } from '@nestjs/testing';
import {
  ConflictException,
  BadRequestException,
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PrismaModule } from '../../prisma/prisma.module.js';
import { PrismaService } from '../../prisma/prisma.service.js';
import { TenantProvisioningService } from './tenant-provisioning.service.js';
import { SaasService } from './saas.service.js';
import { BranchesService } from '../branches/services/branches.service.js';
import { TenantContext } from '../../common/multitenancy/tenant-context.js';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';

jest.setTimeout(45000);

describe('Auditoría y Verificación de Multitenancy SaaS (Pruebas Base + Pruebas A-G)', () => {
  let moduleRef: TestingModule;
  let prisma: PrismaService;
  let provisioningService: TenantProvisioningService;
  let saasService: SaasService;
  let branchesService: BranchesService;
  let jwtGuard: JwtAuthGuard;

  const testRunId = Date.now().toString().slice(-6);

  beforeAll(async () => {
    jest.setTimeout(45000);
    moduleRef = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({ isGlobal: true }),
        JwtModule.register({}),
        PrismaModule,
      ],
      providers: [
        TenantProvisioningService,
        SaasService,
        BranchesService,
        JwtAuthGuard,
      ],
    }).compile();

    prisma = moduleRef.get<PrismaService>(PrismaService);
    provisioningService = moduleRef.get<TenantProvisioningService>(
      TenantProvisioningService,
    );
    saasService = moduleRef.get<SaasService>(SaasService);
    branchesService = moduleRef.get<BranchesService>(BranchesService);
    jwtGuard = moduleRef.get<JwtAuthGuard>(JwtAuthGuard);
  });

  afterAll(async () => {
    await moduleRef.close();
  });

  // =========================================================================
  // PRUEBA B & PRUEBA 1. Creación de una tienda nueva completamente limpia
  // =========================================================================
  describe('Prueba B (y Prueba 1): Creación de una tienda nueva completamente limpia (0 sucursales, 0 almacenes, 0 POS, 0 ciudades)', () => {
    const slug = `tienda-limpia-${testRunId}`;
    const email = `owner-p1-${testRunId}@test.com`;

    it('debe registrar el usuario global, crear el tenant y su esquema con 0 sucursales, 0 almacenes, 0 POS, 0 departamentos/ciudades y 0 productos', async () => {
      const res = await provisioningService.createTenant({
        name: 'Tienda Test 100% Limpia',
        slug,
        plan: 'STARTER',
        ownerName: 'Comerciante Prueba Uno',
        ownerEmail: email,
        password: 'PasswordSeguro123!',
        phone: '+591 70001111',
      });

      expect(res.tenant).toBeDefined();
      expect(res.tenant.slug).toBe(slug);
      expect(res.tenant.status).toBe('ACTIVE');

      // 1. Verificar usuario global en public.users
      const globalUser = await prisma.publicClient.user.findUnique({
        where: { email },
      });
      expect(globalUser).toBeDefined();
      expect(globalUser?.email).toBe(email);

      // 2. Verificar membresía OWNER en public.tenant_memberships
      const membership = await prisma.publicClient.tenantMembership.findFirst({
        where: {
          tenantId: res.tenant.id,
          userId: globalUser!.id,
        },
      });
      expect(membership).toBeDefined();
      expect(membership?.role).toBe('OWNER');

      // 3. Verificar que el esquema PostgreSQL existe
      const schemaName = res.schemaName;
      const schemaExists: any[] = await prisma.$queryRawUnsafe(
        `SELECT schema_name FROM information_schema.schemata WHERE schema_name = $1`,
        schemaName,
      );
      expect(schemaExists.length).toBe(1);

      // 4. VERIFICACIÓN ESTRICTA DE APROVISIONAMIENTO LIMPIO (Problema 2):
      // 0 sucursales, 0 almacenes, 0 POS, 0 ciudades/departamentos, 0 productos, 0 variantes, 0 categorías, 0 órdenes, 0 stock
      const [
        branchesCount,
        warehousesCount,
        posCount,
        citiesCount,
        productsCount,
        variantsCount,
        categoriesCount,
        ordersCount,
        stocksCount,
        usersCount,
      ]: any[] = await Promise.all([
        prisma.$queryRawUnsafe(`SELECT count(*)::int as count FROM "${schemaName}".branches`),
        prisma.$queryRawUnsafe(
          `SELECT count(*)::int as count FROM "${schemaName}".inventory_locations WHERE type = 'WAREHOUSE'`,
        ),
        prisma.$queryRawUnsafe(
          `SELECT count(*)::int as count FROM "${schemaName}".inventory_locations WHERE type = 'SALES_FLOOR'`,
        ),
        prisma.$queryRawUnsafe(`SELECT count(*)::int as count FROM "${schemaName}".cities`),
        prisma.$queryRawUnsafe(`SELECT count(*)::int as count FROM "${schemaName}".products`),
        prisma.$queryRawUnsafe(`SELECT count(*)::int as count FROM "${schemaName}".product_variants`),
        prisma.$queryRawUnsafe(`SELECT count(*)::int as count FROM "${schemaName}".categories`),
        prisma.$queryRawUnsafe(`SELECT count(*)::int as count FROM "${schemaName}".orders`),
        prisma.$queryRawUnsafe(`SELECT count(*)::int as count FROM "${schemaName}".inventory_stocks`),
        prisma.$queryRawUnsafe(`SELECT count(*)::int as count FROM "${schemaName}".users`),
      ]);

      expect(branchesCount[0].count).toBe(0);
      expect(warehousesCount[0].count).toBe(0);
      expect(posCount[0].count).toBe(0);
      expect(citiesCount[0].count).toBe(0);
      expect(productsCount[0].count).toBe(0);
      expect(variantsCount[0].count).toBe(0);
      expect(categoriesCount[0].count).toBe(0);
      expect(ordersCount[0].count).toBe(0);
      expect(stocksCount[0].count).toBe(0);
      // Solo existe el usuario propietario (0 clientes precreados)
      expect(usersCount[0].count).toBe(1);
    });
  });

  // =========================================================================
  // PRUEBA A. Usuario con una sola tienda y opción de crear tienda desde el panel
  // =========================================================================
  describe('Prueba A: Usuario con una sola tienda entra directo y consulta su opción de crear nueva tienda en el panel', () => {
    const email = `single-pro-${testRunId}@test.com`;
    const slug1 = `single-pro-1-${testRunId}`;
    const slug2 = `single-pro-2-${testRunId}`;
    let authUser: { id: string; email: string };

    it('usuario con 1 tienda entra directamente a su tienda y desde el panel puede consultar sus tiendas y crear otra', async () => {
      await provisioningService.createTenant({
        name: 'Boutique Inicial Pro',
        slug: slug1,
        plan: 'PRO',
        ownerName: 'Ana Pro',
        ownerEmail: email,
        password: 'PasswordPro123!',
      });

      const loginCheck = await saasService.verifyCredentials({
        email,
        password: 'PasswordPro123!',
      });

      // Al tener 1 sola tienda, redirige directamente a ella
      expect(loginCheck.verified).toBe(true);
      expect(loginCheck.tenantsCount).toBe(1);
      expect(loginCheck.autoRedirectSlug).toBe(slug1);
      expect(loginCheck.planQuota.effectivePlan).toBe('PRO');
      expect(loginCheck.planQuota.maxStores).toBe(3);
      expect(loginCheck.planQuota.canCreateMore).toBe(true);

      authUser = { id: loginCheck.user.id, email: loginCheck.user.email };

      // Dentro del panel, consulta GET /saas/my-tenants
      const panelInfo = await saasService.getMyTenants(authUser);
      expect(panelInfo.tenantsCount).toBe(1);
      expect(panelInfo.planQuota.canCreateMore).toBe(true);
      expect(panelInfo.planQuota.remainingStores).toBe(2);

      // Desde el panel, usa la opción "Crear nueva tienda" (POST /saas/my-tenants) sin volver a registrarse
      const createdFromPanel = await saasService.createTenantForAuthenticatedUser(
        authUser,
        {
          name: 'Segunda Tienda Desde Panel',
          slug: slug2,
          category: 'Accesorios & Joyería',
          primaryColor: '#4F46E5',
        },
      );

      expect(createdFromPanel.tenant.slug).toBe(slug2);
      expect(createdFromPanel.session.accessToken).toBeDefined();
      expect(createdFromPanel.planQuota.ownedCount).toBe(2);
      expect(createdFromPanel.planQuota.maxStores).toBe(3);
    });
  });

  // =========================================================================
  // PRUEBA C. Creación manual de sucursal o almacén sin duplicados ni recursos ocultos
  // =========================================================================
  describe('Prueba C: Creación manual de sucursal y almacén en tienda recién creada', () => {
    const email = `manual-branch-${testRunId}@test.com`;
    const slugA = `manual-a-${testRunId}`;
    const slugB = `manual-b-${testRunId}`;
    let tenantA: any;
    let tenantB: any;

    beforeAll(async () => {
      const resA = await provisioningService.createTenant({
        name: 'Tienda Manual A',
        slug: slugA,
        plan: 'PRO',
        ownerName: 'Operador Manual',
        ownerEmail: email,
        password: 'Password123!',
      });
      tenantA = resA.tenant;

      const resB = await provisioningService.createTenant({
        name: 'Tienda Manual B',
        slug: slugB,
        plan: 'PRO',
        ownerName: 'Operador Manual',
        ownerEmail: email,
        password: 'Password123!',
      });
      tenantB = resB.tenant;
    });

    it('al crear manualmente 1 ciudad y 1 sucursal en Tienda A, solo existe lo creado explícitamente y Tienda B sigue en 0', async () => {
      await TenantContext.run(
        {
          tenantId: tenantA.id,
          tenantSlug: tenantA.slug,
          schemaName: tenantA.schemaName,
        },
        async () => {
          // Inicialmente 0 ciudades y 0 sucursales
          const initialBranches = await branchesService.findAll();
          const initialCities = await branchesService.getCities();
          expect(initialBranches.length).toBe(0);
          expect(initialCities.length).toBe(0);

          // 1. Crear explícitamente 1 ciudad
          const city = await branchesService.createCity({ name: 'Tarija' });
          expect(city.name).toBe('Tarija');

          // 2. Crear explícitamente 1 sucursal SIN ubicaciones automáticas
          const branch = await branchesService.create({
            name: 'Sucursal Central Tarija',
            address: 'Calle Madrid #450',
            cityId: city.id,
          });

          expect(branch.name).toBe('Sucursal Central Tarija');
          expect(branch.locations.length).toBe(0); // 0 almacenes y 0 POS creados implícitamente

          // 3. Crear explícitamente 1 almacén para esa sucursal
          const warehouse = await branchesService.addLocation(branch.id, {
            name: 'Depósito Norte',
            type: 'WAREHOUSE' as any,
          });
          expect(warehouse.type).toBe('WAREHOUSE');

          const afterBranches = await branchesService.findAll();
          expect(afterBranches.length).toBe(1);
          expect(afterBranches[0].locations.length).toBe(1);
          expect(afterBranches[0].locations[0].name).toBe('Depósito Norte');
        },
      );

      // Verificar que en Tienda B no apareció nada de Tienda A
      await TenantContext.run(
        {
          tenantId: tenantB.id,
          tenantSlug: tenantB.slug,
          schemaName: tenantB.schemaName,
        },
        async () => {
          const branchesB = await branchesService.findAll();
          const citiesB = await branchesService.getCities();
          expect(branchesB.length).toBe(0);
          expect(citiesB.length).toBe(0);
        },
      );
    });
  });

  // =========================================================================
  // PRUEBA D. Límite del plan alcanzado (UI / Panel / Endpoint directo / Concurrencia)
  // =========================================================================
  describe('Prueba D: Aplicación estricta de límites del plan al crear tiendas', () => {
    const starterEmail = `starter-limit-${testRunId}@test.com`;
    const starterSlug1 = `starter-1-${testRunId}`;
    const starterSlug2 = `starter-2-${testRunId}`;
    const starterSlug3 = `starter-3-${testRunId}`;
    let starterUser: any;

    it('usuario en plan STARTER (límite = 1 tienda) no puede crear una segunda tienda ni manipulando el campo plan en el payload', async () => {
      // 1. Crea su primera y única tienda permitida en STARTER
      const first = await provisioningService.createTenant({
        name: 'Mi Única Tienda Starter',
        slug: starterSlug1,
        plan: 'STARTER',
        ownerName: 'Starter User',
        ownerEmail: starterEmail,
        password: 'StarterPass123!',
      });
      expect(first.tenant.status).toBe('ACTIVE');

      starterUser = await prisma.publicClient.user.findUnique({
        where: { email: starterEmail },
      });
      expect(starterUser).toBeDefined();

      // 2. Intentar crear una 2da tienda desde el panel (createTenantForAuthenticatedUser)
      await expect(
        saasService.createTenantForAuthenticatedUser(
          { id: starterUser.id, email: starterUser.email },
          {
            name: 'Tienda Extra No Permitida',
            slug: starterSlug2,
            plan: 'ENTERPRISE', // Intento malicioso de enviar ENTERPRISE desde el cliente
          },
        ),
      ).rejects.toThrow(ForbiddenException);

      // 3. Intentar crear una 2da tienda directamente contra createTenant (endpoint de registro)
      await expect(
        provisioningService.createTenant({
          name: 'Tienda Extra Directa',
          slug: starterSlug3,
          plan: 'PRO', // Intento de escalar plan sin autorización
          ownerName: 'Starter User',
          ownerEmail: starterEmail,
          password: 'StarterPass123!',
        }),
      ).rejects.toThrow(ForbiddenException);

      // 4. Confirmar que NO se creó el esquema ni el registro de las tiendas rechazadas
      const rejectedTenant2 = await prisma.publicClient.tenant.findUnique({
        where: { slug: starterSlug2 },
      });
      const rejectedTenant3 = await prisma.publicClient.tenant.findUnique({
        where: { slug: starterSlug3 },
      });
      expect(rejectedTenant2).toBeNull();
      expect(rejectedTenant3).toBeNull();

      const rejectedSchema: any[] = await prisma.$queryRawUnsafe(
        `SELECT schema_name FROM information_schema.schemata WHERE schema_name = $1`,
        `tenant_${starterSlug2.replace(/-/g, '_')}`,
      );
      expect(rejectedSchema.length).toBe(0);
    });

    it('solicitudes concurrentes no pueden superar el límite del plan (exclusión mutua por propietario)', async () => {
      const raceEmail = `race-pro-${testRunId}@test.com`;
      // Crear 1ra tienda con PRO (límite = 3 tiendas)
      await provisioningService.createTenant({
        name: 'Pro Store 1',
        slug: `race-pro-1-${testRunId}`,
        plan: 'PRO',
        ownerName: 'Race Pro Owner',
        ownerEmail: raceEmail,
        password: 'RacePassword123!',
      });
      // Crear 2da tienda (quedan 2/3, solo 1 cupo disponible)
      await provisioningService.createTenant({
        name: 'Pro Store 2',
        slug: `race-pro-2-${testRunId}`,
        plan: 'PRO',
        ownerName: 'Race Pro Owner',
        ownerEmail: raceEmail,
        password: 'RacePassword123!',
      });

      // Lanzar 2 peticiones simultáneas para el último cupo disponible (3/3)
      const [r1, r2] = await Promise.allSettled([
        provisioningService.createTenant({
          name: 'Pro Store 3A',
          slug: `race-pro-3a-${testRunId}`,
          plan: 'PRO',
          ownerName: 'Race Pro Owner',
          ownerEmail: raceEmail,
          password: 'RacePassword123!',
        }),
        provisioningService.createTenant({
          name: 'Pro Store 3B',
          slug: `race-pro-3b-${testRunId}`,
          plan: 'PRO',
          ownerName: 'Race Pro Owner',
          ownerEmail: raceEmail,
          password: 'RacePassword123!',
        }),
      ]);

      const succeeded = [r1, r2].filter((r) => r.status === 'fulfilled');
      const failed = [r1, r2].filter((r) => r.status === 'rejected');

      expect(succeeded.length).toBe(1);
      expect(failed.length).toBe(1);

      const totalOwned = await prisma.publicClient.tenant.count({
        where: { ownerEmail: raceEmail, status: 'ACTIVE' },
      });
      expect(totalOwned).toBe(3);
    }, 90000);
  });

  // =========================================================================
  // PRUEBA E & PRUEBA F (y Prueba 2). Múltiples tiendas y aislamiento total
  // =========================================================================
  describe('Prueba E y Prueba F: Usuario con plan PRO crea tienda de ropa y tienda de zapatos con aislamiento estricto', () => {
    const ownerEmail = `multistore-${testRunId}@test.com`;
    const slugRopa = `ropa-${testRunId}`;
    const slugZapatos = `zapatos-${testRunId}`;
    let tenantRopa: any;
    let tenantZapatos: any;
    let globalUser: any;

    it('Prueba E: el mismo usuario global en plan PRO puede crear su segunda tienda desde el panel y alternar entre ambas', async () => {
      // Crear Tienda 1: Ropa
      const resRopa = await provisioningService.createTenant({
        name: 'Tienda de Ropa Elegante',
        slug: slugRopa,
        plan: 'PRO',
        ownerName: 'Empresario Multitienda',
        ownerEmail,
        password: 'PasswordMulti123!',
      });
      tenantRopa = resRopa.tenant;

      globalUser = await prisma.publicClient.user.findUnique({
        where: { email: ownerEmail },
      });
      expect(globalUser).toBeDefined();

      // Crear Tienda 2: Zapatos desde el panel usando la sesión autenticada del mismo usuario global
      const resZapatos = await saasService.createTenantForAuthenticatedUser(
        { id: globalUser.id, email: globalUser.email },
        {
          name: 'Marca de Zapatos Exclusivos',
          slug: slugZapatos,
          category: 'Calzado & Marroquinería',
        },
      );
      tenantZapatos = resZapatos.tenant;

      expect(tenantRopa.id).not.toBe(tenantZapatos.id);
      expect(tenantRopa.schemaName).not.toBe(tenantZapatos.schemaName);

      // Sigue existiendo un único usuario global para este correo
      const usersWithEmail = await prisma.publicClient.user.count({
        where: { email: ownerEmail },
      });
      expect(usersWithEmail).toBe(1);

      // Tiene membresía OWNER en ambas tiendas
      const memberships = await prisma.publicClient.tenantMembership.findMany({
        where: { userId: globalUser.id },
      });
      expect(memberships.length).toBe(2);

      // Puede cambiar de tienda activa desde el panel (switchTenant)
      const switchedToRopa = await saasService.switchTenant(
        { id: globalUser.id, email: globalUser.email },
        slugRopa,
      );
      expect(switchedToRopa.tenant.slug).toBe(slugRopa);
      expect(switchedToRopa.accessToken).toBeDefined();
    });

    it('Prueba F: al crear sucursal, almacén y producto en Tienda 1 (Ropa), Tienda 2 (Zapatos) sigue con 0 sucursales, 0 almacenes y 0 productos', async () => {
      // 1. En Tienda 1 (Ropa): crear ciudad, sucursal, almacén, categoría y producto
      await TenantContext.run(
        {
          tenantId: tenantRopa.id,
          tenantSlug: tenantRopa.slug,
          schemaName: tenantRopa.schemaName,
        },
        async () => {
          const city = await branchesService.createCity({ name: 'La Paz' });
          const branch = await branchesService.create({
            name: 'Sucursal Ropa Prado',
            address: 'Av. 16 de Julio #100',
            cityId: city.id,
          });
          await branchesService.addLocation(branch.id, {
            name: 'Almacén Central Ropa',
            type: 'WAREHOUSE' as any,
          });

          const cat = await prisma.category.create({
            data: { name: 'Vestidos de Gala', slug: 'vestidos-gala' },
          });
          await prisma.product.create({
            data: {
              name: 'Vestido Seda Rojo',
              categoryId: cat.id,
              isActive: true,
            },
          });
        },
      );

      // 2. Cambiar a Tienda 2 (Zapatos) y verificar que sigue con 0 sucursales, 0 almacenes, 0 ciudades y 0 productos
      await TenantContext.run(
        {
          tenantId: tenantZapatos.id,
          tenantSlug: tenantZapatos.slug,
          schemaName: tenantZapatos.schemaName,
        },
        async () => {
          const branchesZapatos = await branchesService.findAll();
          const citiesZapatos = await branchesService.getCities();
          const productsZapatos = await prisma.product.findMany();
          const categoriesZapatos = await prisma.category.findMany();

          expect(branchesZapatos.length).toBe(0);
          expect(citiesZapatos.length).toBe(0);
          expect(productsZapatos.length).toBe(0);
          expect(categoriesZapatos.length).toBe(0);
        },
      );
    });
  });

  // =========================================================================
  // PRUEBA G (y Prueba 3). Intento de acceso cruzado no autorizado
  // =========================================================================
  describe('Prueba G (y Prueba 3): Intento de acceso cruzado no autorizado a otro tenant', () => {
    const slugA = `store-a-${testRunId}`;
    const slugB = `store-b-${testRunId}`;
    let tenantA: any;
    let tenantB: any;
    let userA: any;

    beforeAll(async () => {
      const resA = await provisioningService.createTenant({
        name: 'Store A',
        slug: slugA,
        plan: 'STARTER',
        ownerName: 'User A',
        ownerEmail: `user-a-${testRunId}@test.com`,
        password: 'PasswordA123!',
      });
      tenantA = resA.tenant;

      const resB = await provisioningService.createTenant({
        name: 'Store B',
        slug: slugB,
        plan: 'STARTER',
        ownerName: 'User B',
        ownerEmail: `user-b-${testRunId}@test.com`,
        password: 'PasswordB123!',
      });
      tenantB = resB.tenant;

      userA = await prisma.publicClient.user.findUnique({
        where: { email: `user-a-${testRunId}@test.com` },
      });
    });

    it('debe rechazar con 403 Forbidden cuando User A intenta operar sobre Store B en JwtAuthGuard', async () => {
      const mockExecutionContext: any = {
        switchToHttp: () => ({
          getRequest: () => ({
            originalUrl: '/api/v1/branches',
            user: { id: userA.id, email: userA.email },
            tenant: tenantB, // Solicitando tenant B sin tener membresía
          }),
        }),
      };

      jest
        .spyOn(Object.getPrototypeOf(Object.getPrototypeOf(jwtGuard)), 'canActivate')
        .mockResolvedValue(true as any);

      await expect(jwtGuard.canActivate(mockExecutionContext)).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('debe rechazar con 403 Forbidden cuando User A intenta cambiar a Store B mediante switchTenant', async () => {
      await expect(
        saasService.switchTenant({ id: userA.id, email: userA.email }, slugB),
      ).rejects.toThrow(ForbiddenException);
    });

    it('debe permitir el acceso de User A a Store A legítimamente', async () => {
      const mockExecutionContext: any = {
        switchToHttp: () => ({
          getRequest: () => ({
            originalUrl: '/api/v1/branches',
            user: { id: userA.id, email: userA.email },
            tenant: tenantA,
          }),
        }),
      };

      jest
        .spyOn(Object.getPrototypeOf(Object.getPrototypeOf(jwtGuard)), 'canActivate')
        .mockResolvedValue(true as any);

      const can = await jwtGuard.canActivate(mockExecutionContext);
      expect(can).toBe(true);
    });
  });

  // =========================================================================
  // PRUEBA 4. Selección de tenant (0, 1 y varios)
  // =========================================================================
  describe('Prueba 4: Resolución y selección de tiendas según cantidad de tenants', () => {
    it('usuario con cero tiendas debe ser identificado correctamente', async () => {
      const email = `zero-tenants-${testRunId}@test.com`;
      const lookup = await saasService.lookupUserTenants(email);
      expect(lookup.exists).toBe(false);

      await prisma.publicClient.user.create({
        data: {
          email,
          passwordHash: 'dummyHash',
          firstName: 'Zero',
          lastName: 'Stores',
        },
      });

      const lookupAfter = await saasService.lookupUserTenants(email);
      expect(lookupAfter.exists).toBe(true);
    });

    it('usuario con 2+ tiendas debe retornar la lista de tiendas y autoRedirectSlug en null para Store Picker', async () => {
      const email = `multi-picker-${testRunId}@test.com`;
      await provisioningService.createTenant({
        name: 'Tienda Picker 1',
        slug: `picker-1-${testRunId}`,
        plan: 'PRO',
        ownerName: 'Multi Owner',
        ownerEmail: email,
        password: 'PickerPassword123!',
      });
      await provisioningService.createTenant({
        name: 'Tienda Picker 2',
        slug: `picker-2-${testRunId}`,
        plan: 'PRO',
        ownerName: 'Multi Owner',
        ownerEmail: email,
        password: 'PickerPassword123!',
      });

      const result = await saasService.verifyCredentials({
        email,
        password: 'PickerPassword123!',
      });

      expect(result.verified).toBe(true);
      expect(result.tenantsCount).toBe(2);
      expect(result.autoRedirectSlug).toBeNull();
      expect(result.tenants.length).toBe(2);
    }, 75000);
  });

  // =========================================================================
  // PRUEBA 5. Disponibilidad del dominio
  // =========================================================================
  describe('Prueba 5: Validación y reserva de subdominios', () => {
    it('debe rechazar subdominios reservados del sistema', async () => {
      await expect(
        provisioningService.createTenant({
          name: 'Admin Store',
          slug: 'admin',
          plan: 'STARTER',
          ownerName: 'Admin Guy',
          ownerEmail: `admin-slug-${testRunId}@test.com`,
          password: 'Password123!',
        }),
      ).rejects.toThrow(ConflictException);
    });

    it('debe rechazar subdominios inválidos o demasiado cortos', async () => {
      await expect(
        provisioningService.createTenant({
          name: 'Invalid Store',
          slug: 'a',
          plan: 'STARTER',
          ownerName: 'Invalid Guy',
          ownerEmail: `invalid-slug-${testRunId}@test.com`,
          password: 'Password123!',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('dos intentos simultáneos de reservar el mismo subdominio deben ser resueltos con exclusión mutua', async () => {
      const collisionSlug = `collision-${testRunId}`;
      const p1 = provisioningService.createTenant({
        name: 'Collision One',
        slug: collisionSlug,
        plan: 'STARTER',
        ownerName: 'User One',
        ownerEmail: `col1-${testRunId}@test.com`,
        password: 'Password123!',
      });
      const p2 = provisioningService.createTenant({
        name: 'Collision Two',
        slug: collisionSlug,
        plan: 'STARTER',
        ownerName: 'User Two',
        ownerEmail: `col2-${testRunId}@test.com`,
        password: 'Password123!',
      });

      const results = await Promise.allSettled([p1, p2]);
      const fulfilled = results.filter((r) => r.status === 'fulfilled');
      const rejected = results.filter((r) => r.status === 'rejected');

      expect(fulfilled.length).toBe(1);
      expect(rejected.length).toBe(1);
    });
  });

  // =========================================================================
  // PRUEBA 6. Errores de aprovisionamiento y resiliencia de estado
  // =========================================================================
  describe('Prueba 6: Errores de aprovisionamiento', () => {
    it('un fallo no debe marcar como ACTIVE un tenant incompleto', async () => {
      const failSlug = `fail-prov-${testRunId}`;

      const originalExecute = prisma.publicClient.$executeRawUnsafe;
      jest
        .spyOn(prisma.publicClient, '$executeRawUnsafe')
        .mockImplementation(async (query: any, ...args: any[]) => {
          if (typeof query === 'string' && query.includes('CREATE SCHEMA')) {
            throw new Error('Fallo simulado de disco o red durante CREATE SCHEMA');
          }
          return originalExecute.apply(prisma.publicClient, [query, ...args]);
        });

      await expect(
        provisioningService.createTenant({
          name: 'Tienda Fallida',
          slug: failSlug,
          plan: 'STARTER',
          ownerName: 'Fail Owner',
          ownerEmail: `fail-${testRunId}@test.com`,
          password: 'Password123!',
        }),
      ).rejects.toThrow();

      jest.restoreAllMocks();

      const tenantInDb = await prisma.publicClient.tenant.findUnique({
        where: { slug: failSlug },
      });
      if (tenantInDb) {
        expect(tenantInDb.status).toBe('FAILED');
      }
    });
  });

  // =========================================================================
  // PRUEBA 7. Migraciones consistentes en esquemas de tenants
  // =========================================================================
  describe('Prueba 7: Integridad de migraciones y esquemas', () => {
    it('las tablas clonadas en el esquema deben tener las columnas idénticas a public', async () => {
      const slug = `migr-check-${testRunId}`;
      const res = await provisioningService.createTenant({
        name: 'Migration Check',
        slug,
        plan: 'STARTER',
        ownerName: 'Migr Guy',
        ownerEmail: `migr-${testRunId}@test.com`,
        password: 'Password123!',
      });

      const schemaName = res.schemaName;

      const publicCols: any[] = await prisma.$queryRawUnsafe(`
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'products'
        ORDER BY column_name;
      `);

      const tenantCols: any[] = await prisma.$queryRawUnsafe(
        `
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_schema = $1 AND table_name = 'products'
        ORDER BY column_name;
      `,
        schemaName,
      );

      expect(tenantCols.length).toBe(publicCols.length);
      expect(tenantCols).toEqual(publicCols);
    });
  });

  // =========================================================================
  // PRUEBA 8. Autenticación, autorización y prevención de fuga de Connection Pool
  // =========================================================================
  describe('Prueba 8: Autenticación, autorización y seguridad de connection pool', () => {
    it('contraseña incorrecta debe ser rechazada inmediatamente sin revelar datos', async () => {
      const email = `auth-check-${testRunId}@test.com`;
      await provisioningService.createTenant({
        name: 'Auth Store',
        slug: `auth-store-${testRunId}`,
        plan: 'STARTER',
        ownerName: 'Auth Owner',
        ownerEmail: email,
        password: 'CorrectPassword123!',
      });

      await expect(
        saasService.verifyCredentials({
          email,
          password: 'WrongPassword!',
        }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('solicitudes alternadas entre tenants en la misma instancia no deben contaminar contexto (Connection Pool Safety)', async () => {
      const slugAlpha = `alpha-pool-${testRunId}`;
      const slugBeta = `beta-pool-${testRunId}`;

      const tAlpha = await provisioningService.createTenant({
        name: 'Alpha Pool',
        slug: slugAlpha,
        plan: 'PRO',
        ownerName: 'Owner Alpha',
        ownerEmail: `alpha-${testRunId}@test.com`,
        password: 'Password123!',
      });

      const tBeta = await provisioningService.createTenant({
        name: 'Beta Pool',
        slug: slugBeta,
        plan: 'PRO',
        ownerName: 'Owner Beta',
        ownerEmail: `beta-${testRunId}@test.com`,
        password: 'Password123!',
      });

      await prisma.$executeRawUnsafe(`
        INSERT INTO "${tAlpha.schemaName}".categories (id, name, slug)
        VALUES (gen_random_uuid(), 'Alpha Cat', 'alpha-cat');
      `);
      const catA: any[] = await prisma.$queryRawUnsafe(
        `SELECT id FROM "${tAlpha.schemaName}".categories LIMIT 1`,
      );
      await prisma.$executeRawUnsafe(`
        INSERT INTO "${tAlpha.schemaName}".products (id, name, category_id, is_active, created_at, updated_at)
        VALUES (gen_random_uuid(), 'Alpha Product Exclusive', '${catA[0].id}', true, NOW(), NOW());
      `);

      const iterations = 10;
      const tasks = [];

      for (let i = 0; i < iterations; i++) {
        const isAlpha = i % 2 === 0;
        const targetTenant = isAlpha ? tAlpha : tBeta;

        const task = TenantContext.run(
          {
            tenantId: targetTenant.tenant.id,
            tenantSlug: targetTenant.tenant.slug,
            schemaName: targetTenant.schemaName,
          },
          async () => {
            const count = await prisma.product.count();
            if (isAlpha) {
              expect(count).toBe(1);
            } else {
              expect(count).toBe(0);
            }
          },
        );
        tasks.push(task);
      }

      await Promise.all(tasks);
    }, 75000);
  });
});
