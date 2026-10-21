import { jest } from '@jest/globals';
import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PrismaModule } from '../../prisma/prisma.module.js';
import { PrismaService } from '../../prisma/prisma.service.js';
import { OrdersService } from './services/orders.service.js';
import { TenantProvisioningService } from '../saas/tenant-provisioning.service.js';
import { TenantContext } from '../../common/multitenancy/tenant-context.js';
import { OrderType, PaymentMethod, OrderStatus } from '@prisma/client';

jest.setTimeout(60000);

describe('Offline-First, Idempotencia & Concurrencia ACID en Ventas POS (OrdersService)', () => {
  let moduleRef: TestingModule;
  let prisma: PrismaService;
  let ordersService: OrdersService;
  let provisioningService: TenantProvisioningService;

  const testRunId = Date.now().toString().slice(-6);
  const tenantSlug = `acid-offline-${testRunId}`;
  let schemaName: string;
  let tenantId: string;

  // Variables de datos de prueba dentro del tenant aislado
  let branchId: string;
  let salesFloorLocationId: string;
  let variantIdA: string;
  let variantIdB: string;
  let cashier1Id: string;
  let cashier2Id: string;

  beforeAll(async () => {
    moduleRef = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({ isGlobal: true }),
        JwtModule.register({}),
        PrismaModule,
      ],
      providers: [OrdersService, TenantProvisioningService],
    }).compile();

    prisma = moduleRef.get<PrismaService>(PrismaService);
    ordersService = moduleRef.get<OrdersService>(OrdersService);
    provisioningService = moduleRef.get<TenantProvisioningService>(
      TenantProvisioningService,
    );

    // 1. Aprovisionar un tenant limpio y aislado para la suite de pruebas
    const tenantRes = await provisioningService.createTenant({
      name: 'Tienda Test Concurrencia ACID',
      slug: tenantSlug,
      plan: 'PRO',
      ownerName: 'Admin POS Test',
      ownerEmail: `admin-pos-${testRunId}@test.com`,
      password: 'PasswordSeguro123!',
      phone: '+591 71234567',
    });

    tenantId = tenantRes.tenant.id;
    schemaName = tenantRes.schemaName;

    // 2. Configurar catálogo, sucursal e inventario base dentro del esquema aislado
    await TenantContext.run({ schema: schemaName, tenantId }, async () => {
      // Ciudad
      const city = await prisma.city.create({
        data: { name: `Ciudad ACID ${testRunId}` },
      });

      // Sucursal
      const branch = await prisma.branch.create({
        data: {
          name: `Sucursal Principal POS ${testRunId}`,
          cityId: city.id,
          address: 'Av. Comercio 123',
        },
      });
      branchId = branch.id;

      // Ubicación SALES_FLOOR requerida por OrdersService
      const salesFloor = await prisma.inventoryLocation.create({
        data: {
          name: 'Piso de Venta',
          type: 'SALES_FLOOR',
          branchId: branch.id,
        },
      });
      salesFloorLocationId = salesFloor.id;

      // Categoría
      const category = await prisma.category.create({
        data: {
          name: `Ropa Deportiva ${testRunId}`,
          slug: `ropa-deportiva-${testRunId}`,
        },
      });

      // Producto y 2 Variantes
      const product = await prisma.product.create({
        data: {
          name: 'Polera DryFit Pro',
          categoryId: category.id,
        },
      });

      const variantA = await prisma.productVariant.create({
        data: {
          productId: product.id,
          sku: `POLERA-DF-ROJO-M-${testRunId}`,
          size: 'M',
          color: 'Rojo',
          price: 120.0,
          cost: 60.0,
        },
      });
      variantIdA = variantA.id;

      const variantB = await prisma.productVariant.create({
        data: {
          productId: product.id,
          sku: `POLERA-DF-NEGRO-L-${testRunId}`,
          size: 'L',
          color: 'Negro',
          price: 140.0,
          cost: 70.0,
        },
      });
      variantIdB = variantB.id;

      // Usuarios Cajeros en el esquema del tenant
      const cashier1 = await prisma.user.create({
        data: {
          email: `cajero1-${testRunId}@pos.local`,
          firstName: 'Cajero',
          lastName: 'Terminal 1',
          passwordHash: '$argon2id$v=19$m=65536,t=3,p=4$dummyhashtestpassword',
        },
      });
      cashier1Id = cashier1.id;

      const cashier2 = await prisma.user.create({
        data: {
          email: `cajero2-${testRunId}@pos.local`,
          firstName: 'Cajero',
          lastName: 'Terminal 2',
          passwordHash: '$argon2id$v=19$m=65536,t=3,p=4$dummyhashtestpassword',
        },
      });
      cashier2Id = cashier2.id;
    });
  });

  afterAll(async () => {
    // Limpieza del esquema y tenant
    try {
      await prisma.$executeRawUnsafe(
        `DROP SCHEMA IF EXISTS "${schemaName}" CASCADE`,
      );
      await prisma.publicClient.tenantMembership.deleteMany({
        where: { tenantId },
      });
      await prisma.publicClient.tenant.deleteMany({
        where: { id: tenantId },
      });
    } catch (e) {
      // Ignorar errores de cleanup
    }
    await moduleRef.close();
  });

  // =========================================================================
  // CASO DE USO 1: Idempotencia (Reintentos de red / Click repetido / Replay)
  // =========================================================================
  describe('1. Idempotencia en Checkout (Prevención de cobros y decrementos duplicados)', () => {
    const idempotencyKey = `POS-IDEMP-TEST-${Date.now()}`;

    beforeAll(async () => {
      await TenantContext.run({ schema: schemaName, tenantId }, async () => {
        // Establecer stock inicial de Variante A = 10 unidades
        await prisma.inventoryStock.upsert({
          where: {
            variantId_locationId: {
              variantId: variantIdA,
              locationId: salesFloorLocationId,
            },
          },
          create: {
            variantId: variantIdA,
            locationId: salesFloorLocationId,
            quantity: 10,
          },
          update: {
            quantity: 10,
          },
        });
      });
    });

    it('la primera petición debe crear la orden y decrementar el stock exactamente una vez', async () => {
      await TenantContext.run({ schema: schemaName, tenantId }, async () => {
        const order = await ordersService.checkout(cashier1Id, {
          branchId,
          type: OrderType.IN_STORE,
          paymentMethod: PaymentMethod.CASH,
          idempotencyKey,
          items: [{ variantId: variantIdA, quantity: 2 }],
        });

        expect(order).toBeDefined();
        expect(order.status).toBe(OrderStatus.PAID);
        expect(order.total).toBe(240); // 2 * 120
        expect(order.idempotencyKey).toBe(idempotencyKey);

        // Verificar que el stock se decrementó de 10 a 8
        const stock = await prisma.inventoryStock.findUniqueOrThrow({
          where: {
            variantId_locationId: {
              variantId: variantIdA,
              locationId: salesFloorLocationId,
            },
          },
        });
        expect(stock.quantity).toBe(8);
      });
    });

    it('una segunda petición con la MISMA idempotencyKey debe responder con la orden existente (idempotentReplay: true) SIN volver a decrementar stock ni duplicar cobros', async () => {
      await TenantContext.run({ schema: schemaName, tenantId }, async () => {
        // Petición idéntica simulando reintento por caída temporal de conexión o doble tap en el POS
        const replayOrder = await ordersService.checkout(cashier1Id, {
          branchId,
          type: OrderType.IN_STORE,
          paymentMethod: PaymentMethod.CASH,
          idempotencyKey,
          items: [{ variantId: variantIdA, quantity: 2 }],
        });

        expect(replayOrder).toBeDefined();
        expect((replayOrder as any).idempotentReplay).toBe(true);
        expect(replayOrder.idempotencyKey).toBe(idempotencyKey);
        expect(replayOrder.total).toBe(240);

        // Comprobar que el stock permanece en 8 (NO se decrementó a 6)
        const stock = await prisma.inventoryStock.findUniqueOrThrow({
          where: {
            variantId_locationId: {
              variantId: variantIdA,
              locationId: salesFloorLocationId,
            },
          },
        });
        expect(stock.quantity).toBe(8);

        // Comprobar que en la base de datos existe solo 1 orden con esa clave
        const orderCount = await prisma.order.count({
          where: { idempotencyKey },
        });
        expect(orderCount).toBe(1);

        // Comprobar que solo existe 1 registro de pago asociado
        const payments = await prisma.payment.findMany({
          where: { order: { idempotencyKey } },
        });
        expect(payments.length).toBe(1);
      });
    });
  });

  // =========================================================================
  // CASO DE USO 2: Carrera de Concurrencia ACID con "1 Unidad de Stock Restante"
  // Dos terminales/cajas offline intentan vender la última prenda simultáneamente
  // =========================================================================
  describe('2. Concurrencia ACID ("1 Stock Restante"): Dos terminales intentan vender la última unidad', () => {
    beforeEach(async () => {
      await TenantContext.run({ schema: schemaName, tenantId }, async () => {
        // Configurar exactamente 1 unidad en stock para Variante B
        await prisma.inventoryStock.upsert({
          where: {
            variantId_locationId: {
              variantId: variantIdB,
              locationId: salesFloorLocationId,
            },
          },
          create: {
            variantId: variantIdB,
            locationId: salesFloorLocationId,
            quantity: 1,
          },
          update: {
            quantity: 1,
          },
        });
      });
    });

    it('exactamente 1 venta debe ser aceptada (PAID) y la otra debe ser rechazada atómicamente por falta de stock', async () => {
      await TenantContext.run({ schema: schemaName, tenantId }, async () => {
        const keyTerminal1 = `POS-RACE-TERM1-${Date.now()}`;
        const keyTerminal2 = `POS-RACE-TERM2-${Date.now()}`;

        // Disparo concurrente exacto simulando dos cajas sincronizando al mismo tiempo
        const [result1, result2] = await Promise.allSettled([
          ordersService.checkout(cashier1Id, {
            branchId,
            type: OrderType.IN_STORE,
            paymentMethod: PaymentMethod.CASH,
            idempotencyKey: keyTerminal1,
            items: [{ variantId: variantIdB, quantity: 1 }],
          }),
          ordersService.checkout(cashier2Id, {
            branchId,
            type: OrderType.IN_STORE,
            paymentMethod: PaymentMethod.QR,
            idempotencyKey: keyTerminal2,
            items: [{ variantId: variantIdB, quantity: 1 }],
          }),
        ]);

        const fulfilled = [result1, result2].filter(
          (r) => r.status === 'fulfilled',
        ) as PromiseFulfilledResult<any>[];
        const rejected = [result1, result2].filter(
          (r) => r.status === 'rejected',
        ) as PromiseRejectedResult[];

        // Regla de Negocio ACID:
        // 1. Exactamente una venta tuvo éxito
        expect(fulfilled.length).toBe(1);
        expect(fulfilled[0].value.status).toBe(OrderStatus.PAID);
        expect(fulfilled[0].value.total).toBe(140);

        // 2. Exactamente una venta fue rechazada por falta de stock (SERVER_WINS)
        expect(rejected.length).toBe(1);
        expect(rejected[0].reason).toBeInstanceOf(BadRequestException);
        expect(rejected[0].reason.message).toContain('Stock insuficiente');

        // 3. El stock resultante en la base de datos de la nube debe ser exactamente 0 (nunca -1)
        const finalStock = await prisma.inventoryStock.findUniqueOrThrow({
          where: {
            variantId_locationId: {
              variantId: variantIdB,
              locationId: salesFloorLocationId,
            },
          },
        });
        expect(finalStock.quantity).toBe(0);

        // 4. Se creó exactamente una orden y un movimiento de inventario SALE
        const createdOrders = await prisma.order.findMany({
          where: {
            idempotencyKey: { in: [keyTerminal1, keyTerminal2] },
          },
        });
        expect(createdOrders.length).toBe(1);
      });
    });
  });

  // =========================================================================
  // CASO DE USO 3: Rechazo con Stock 0 y Atomic Rollback en Cesta Múltiple
  // =========================================================================
  describe('3. Reversión Atómica (Rollback) cuando una prenda de la cesta no tiene stock', () => {
    it('si una cesta contiene una prenda con stock disponible (5 unid) y otra agotada (0 unid), la transacción completa debe abortarse y el stock disponible no debe tocarse', async () => {
      await TenantContext.run({ schema: schemaName, tenantId }, async () => {
        // Variante A tiene 5 unidades disponibles
        await prisma.inventoryStock.update({
          where: {
            variantId_locationId: {
              variantId: variantIdA,
              locationId: salesFloorLocationId,
            },
          },
          data: { quantity: 5 },
        });

        // Variante B tiene 0 unidades (agotada)
        await prisma.inventoryStock.update({
          where: {
            variantId_locationId: {
              variantId: variantIdB,
              locationId: salesFloorLocationId,
            },
          },
          data: { quantity: 0 },
        });

        const multiItemKey = `POS-ROLLBACK-TEST-${Date.now()}`;

        // Intentar comprar 1 de A y 1 de B
        await expect(
          ordersService.checkout(cashier1Id, {
            branchId,
            type: OrderType.IN_STORE,
            paymentMethod: PaymentMethod.CASH,
            idempotencyKey: multiItemKey,
            items: [
              { variantId: variantIdA, quantity: 1 },
              { variantId: variantIdB, quantity: 1 },
            ],
          }),
        ).rejects.toThrow(BadRequestException);

        // Verificar consistencia ACID: Variante A NO debe haberse decrementado (debe seguir en 5)
        const stockA = await prisma.inventoryStock.findUniqueOrThrow({
          where: {
            variantId_locationId: {
              variantId: variantIdA,
              locationId: salesFloorLocationId,
            },
          },
        });
        expect(stockA.quantity).toBe(5);

        // No debe existir ninguna orden registrada en BD para esta clave
        const order = await prisma.order.findUnique({
          where: { idempotencyKey: multiItemKey },
        });
        expect(order).toBeNull();
      });
    });
  });
});
