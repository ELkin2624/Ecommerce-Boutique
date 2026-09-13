import { PrismaClient, LocationType, MovementType } from '@prisma/client';
import * as argon2 from 'argon2';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando Seed de desarrollo de FashionStore...');

  // 1. CREAR PERMISOS
  const permissionCodes = [
    { code: 'USER:READ', description: 'Ver usuarios' },
    { code: 'USER:CREATE', description: 'Crear usuarios' },
    { code: 'PRODUCT:READ', description: 'Consultar catálogo' },
    { code: 'PRODUCT:CREATE', description: 'Crear productos y variantes' },
    { code: 'PRODUCT:UPDATE', description: 'Actualizar productos y variantes' },
    { code: 'INVENTORY:VIEW', description: 'Ver stock y ubicaciones' },
    { code: 'INVENTORY:TRANSFER', description: 'Trasladar stock' },
    { code: 'RESERVATION:CREATE', description: 'Crear reservas de prendas' },
    { code: 'RESERVATION:VIEW', description: 'Ver reservas' },
    { code: 'RESERVATION:UPDATE_STATUS', description: 'Actualizar estado de reserva probador' },
    { code: 'PROMOTION:READ', description: 'Consultar promociones y descuentos' },
    { code: 'PROMOTION:CREATE', description: 'Crear promociones y cupones' },
    { code: 'PROMOTION:UPDATE', description: 'Actualizar promociones y cupones' },
    { code: 'ORDER:CREATE', description: 'Crear pedidos y ventas' },
    { code: 'ORDER:VIEW', description: 'Ver pedidos' },
    { code: 'REPORT:VIEW', description: 'Ver reportes' },
    { code: 'REPORT:GENERATE', description: 'Generar reportes con IA' },
  ];

  const permissionsMap: Record<string, string> = {};
  for (const p of permissionCodes) {
    const perm = await prisma.permission.upsert({
      where: { code: p.code },
      update: {},
      create: p,
    });
    permissionsMap[p.code] = perm.id;
  }
  console.log(`✅ ${permissionCodes.length} Permisos verificados/creados`);

  // 2. CREAR ROLES Y ASIGNAR PERMISOS
  const rolesData = [
    {
      name: 'ADMIN',
      description: 'Administrador del sistema con acceso total',
      permissions: Object.keys(permissionsMap),
    },
    {
      name: 'STORE_MANAGER',
      description: 'Encargado de sucursal con gestión de stock y reportes',
      permissions: [
        'PRODUCT:READ',
        'PRODUCT:CREATE',
        'PRODUCT:UPDATE',
        'INVENTORY:VIEW',
        'INVENTORY:TRANSFER',
        'RESERVATION:VIEW',
        'RESERVATION:UPDATE_STATUS',
        'PROMOTION:READ',
        'ORDER:VIEW',
        'REPORT:VIEW',
        'REPORT:GENERATE',
      ],
    },
    {
      name: 'CASHIER',
      description: 'Cajero / vendedor de piso',
      permissions: [
        'PRODUCT:READ',
        'INVENTORY:VIEW',
        'RESERVATION:VIEW',
        'ORDER:CREATE',
        'ORDER:VIEW',
      ],
    },
    {
      name: 'CLIENT',
      description: 'Cliente de la tienda física y digital',
      permissions: [
        'PRODUCT:READ',
        'RESERVATION:CREATE',
        'RESERVATION:VIEW',
        'ORDER:CREATE',
        'ORDER:VIEW',
      ],
    },
    {
      name: 'SUPPLIER',
      description: 'Proveedor externo de productos',
      permissions: [
        'PRODUCT:READ',
      ],
    },
  ];

  const rolesMap: Record<string, string> = {};
  for (const r of rolesData) {
    const role = await prisma.role.upsert({
      where: { name: r.name },
      update: { description: r.description },
      create: { name: r.name, description: r.description },
    });
    rolesMap[r.name] = role.id;

    // Asignar permisos al rol
    for (const permCode of r.permissions) {
      const permId = permissionsMap[permCode];
      if (permId) {
        await prisma.rolePermission.upsert({
          where: {
            roleId_permissionId: {
              roleId: role.id,
              permissionId: permId,
            },
          },
          update: {},
          create: {
            roleId: role.id,
            permissionId: permId,
          },
        });
      }
    }
  }
  console.log('✅ Roles y permisos mapeados con éxito');

  // 3. CREAR USUARIO ADMINISTRADOR
  const adminEmail = process.env.SEED_ADMIN_EMAIL || 'admin@fashionstore.com';
  const adminPassword = process.env.SEED_ADMIN_PASSWORD || 'Admin123!';
  const adminHash = await argon2.hash(adminPassword, {
    type: argon2.argon2id,
  });

  const adminUser = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {
      passwordHash: adminHash,
      isActive: true,
    },
    create: {
      email: adminEmail,
      passwordHash: adminHash,
      firstName: 'Administrador',
      lastName: 'FashionStore',
      phone: '+591 70000000',
      isActive: true,
    },
  });

  // Asignar rol ADMIN al usuario
  await prisma.userRole.upsert({
    where: {
      userId_roleId: {
        userId: adminUser.id,
        roleId: rolesMap['ADMIN'],
      },
    },
    update: {},
    create: {
      userId: adminUser.id,
      roleId: rolesMap['ADMIN'],
    },
  });
  console.log(`✅ Usuario Admin creado: ${adminEmail}`);

  // 3b. USUARIO CAJERO DE PRUEBA
  const cashierEmail = 'cajero@fashionstore.com';
  const cashierPassword = 'Cajero123!';
  const cashierHash = await argon2.hash(cashierPassword, { type: argon2.argon2id });

  const cashierUser = await prisma.user.upsert({
    where: { email: cashierEmail },
    update: { passwordHash: cashierHash, isActive: true },
    create: {
      email: cashierEmail,
      passwordHash: cashierHash,
      firstName: 'Juan',
      lastName: 'Cajero',
      phone: '+591 71111111',
      isActive: true,
    },
  });

  await prisma.userRole.upsert({
    where: { userId_roleId: { userId: cashierUser.id, roleId: rolesMap['CASHIER'] } },
    update: {},
    create: { userId: cashierUser.id, roleId: rolesMap['CASHIER'] },
  });
  console.log(`✅ Usuario Cajero creado: ${cashierEmail} / ${cashierPassword}`);

  // 3c. USUARIO ENCARGADO DE SUCURSAL DE PRUEBA
  const managerEmail = 'encargado@fashionstore.com';
  const managerPassword = 'Manager123!';
  const managerHash = await argon2.hash(managerPassword, { type: argon2.argon2id });

  const managerUser = await prisma.user.upsert({
    where: { email: managerEmail },
    update: { passwordHash: managerHash, isActive: true },
    create: {
      email: managerEmail,
      passwordHash: managerHash,
      firstName: 'María',
      lastName: 'Encargada',
      phone: '+591 72222222',
      isActive: true,
    },
  });

  await prisma.userRole.upsert({
    where: { userId_roleId: { userId: managerUser.id, roleId: rolesMap['STORE_MANAGER'] } },
    update: {},
    create: { userId: managerUser.id, roleId: rolesMap['STORE_MANAGER'] },
  });
  console.log(`✅ Usuario Encargado creado: ${managerEmail} / ${managerPassword}`);

  // 3d. USUARIO PROVEEDOR DE PRUEBA
  const supplierEmail = 'proveedor@textiles.com';
  const supplierPassword = 'Supplier123!';
  const supplierHash = await argon2.hash(supplierPassword, { type: argon2.argon2id });

  const supplierUser = await prisma.user.upsert({
    where: { email: supplierEmail },
    update: { passwordHash: supplierHash, isActive: true },
    create: {
      email: supplierEmail,
      passwordHash: supplierHash,
      firstName: 'Carlos',
      lastName: 'Proveedor',
      phone: '+591 73333333',
      isActive: true,
    },
  });

  if (rolesMap['SUPPLIER']) {
    await prisma.userRole.upsert({
      where: { userId_roleId: { userId: supplierUser.id, roleId: rolesMap['SUPPLIER'] } },
      update: {},
      create: { userId: supplierUser.id, roleId: rolesMap['SUPPLIER'] },
    });
  }
  console.log(`✅ Usuario Proveedor creado: ${supplierEmail} / ${supplierPassword}`);

  // 4. CIUDADES Y SUCURSALES
  const cityLP = await prisma.city.upsert({
    where: { name: 'La Paz' },
    update: {},
    create: { name: 'La Paz' },
  });

  const citySC = await prisma.city.upsert({
    where: { name: 'Santa Cruz' },
    update: {},
    create: { name: 'Santa Cruz' },
  });

  // Sucursal Central La Paz
  const branchLP = await prisma.branch.upsert({
    where: { id: '00000000-0000-0000-0000-000000000001' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000001',
      name: 'Sucursal Central La Paz',
      address: 'Av. 16 de Julio #1440, El Prado',
      phone: '+591 2 2441234',
      cityId: cityLP.id,
    },
  });

  const locLPWarehouse = await prisma.inventoryLocation.upsert({
    where: { id: '00000000-0000-0001-0001-000000000001' },
    update: {},
    create: {
      id: '00000000-0000-0001-0001-000000000001',
      branchId: branchLP.id,
      name: 'Almacén Principal LP',
      type: LocationType.WAREHOUSE,
    },
  });

  const locLPFloor = await prisma.inventoryLocation.upsert({
    where: { id: '00000000-0000-0001-0001-000000000002' },
    update: {},
    create: {
      id: '00000000-0000-0001-0001-000000000002',
      branchId: branchLP.id,
      name: 'Piso de Ventas LP',
      type: LocationType.SALES_FLOOR,
    },
  });

  // Sucursal Equipetrol Santa Cruz
  const branchSC = await prisma.branch.upsert({
    where: { id: '00000000-0000-0000-0000-000000000002' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000002',
      name: 'Sucursal Equipetrol Santa Cruz',
      address: 'Av. San Martín esq. Calle 5 Este',
      phone: '+591 3 3335678',
      cityId: citySC.id,
    },
  });

  const locSCFloor = await prisma.inventoryLocation.upsert({
    where: { id: '00000000-0000-0002-0001-000000000001' },
    update: {},
    create: {
      id: '00000000-0000-0002-0001-000000000001',
      branchId: branchSC.id,
      name: 'Piso de Ventas SC',
      type: LocationType.SALES_FLOOR,
    },
  });
  console.log('✅ Ciudades, Sucursales y Ubicaciones de inventario creadas');

  // 5. CATÁLOGO BASE
  const supplier = await prisma.supplier.upsert({
    where: { name: 'Textiles Andinos S.A.' },
    update: {},
    create: {
      name: 'Textiles Andinos S.A.',
      contactEmail: 'contacto@textilesandinos.com',
      phone: '+591 2 2810099',
      address: 'Zona Industrial El Alto',
    },
  });

  const season = await prisma.season.upsert({
    where: { id: '00000000-0000-0000-0000-000000000101' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000101',
      name: 'Verano 2026',
    },
  });

  const collection = await prisma.collection.upsert({
    where: { name: 'Colección Gala y Noche' },
    update: {},
    create: {
      name: 'Colección Gala y Noche',
      description: 'Prendas exclusivas de noche confeccionadas en seda y lino fino',
    },
  });

  const catDresses = await prisma.category.upsert({
    where: { slug: 'vestidos' },
    update: {},
    create: { name: 'Vestidos', slug: 'vestidos' },
  });

  const catShirts = await prisma.category.upsert({
    where: { slug: 'camisas' },
    update: {},
    create: { name: 'Camisas', slug: 'camisas' },
  });

  // Producto 1: Vestido Elegance
  const prodDress = await prisma.product.upsert({
    where: { id: '00000000-0000-0000-0000-000000000201' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000201',
      name: 'Vestido Gala Elegance',
      description: 'Vestido largo de fiesta corte sirena con espalda descubierta',
      brand: 'FashionStore Couture',
      categoryId: catDresses.id,
      seasonId: season.id,
      collectionId: collection.id,
      supplierId: supplier.id,
      images: {
        create: [
          {
            imageUrl: 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=800',
            isCover: true,
            sortOrder: 0,
          },
        ],
      },
    },
  });

  // Variantes del Vestido
  const varDressRedS = await prisma.productVariant.upsert({
    where: { sku: 'VEST-ELEG-ROJO-S' },
    update: {},
    create: {
      productId: prodDress.id,
      sku: 'VEST-ELEG-ROJO-S',
      size: 'S',
      color: 'Rojo Carmesí',
      price: 349.99,
      cost: 180.0,
      measurementsJson: { shoulders_cm: 38, bust_cm: 86, waist_cm: 66, hips_cm: 92 },
    },
  });

  const varDressRedM = await prisma.productVariant.upsert({
    where: { sku: 'VEST-ELEG-ROJO-M' },
    update: {},
    create: {
      productId: prodDress.id,
      sku: 'VEST-ELEG-ROJO-M',
      size: 'M',
      color: 'Rojo Carmesí',
      price: 349.99,
      cost: 180.0,
      measurementsJson: { shoulders_cm: 40, bust_cm: 90, waist_cm: 72, hips_cm: 96 },
    },
  });

  // Producto 2: Camisa Oxford
  const prodShirt = await prisma.product.upsert({
    where: { id: '00000000-0000-0000-0000-000000000202' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000202',
      name: 'Camisa Oxford Classic Fit',
      description: 'Camisa formal 100% algodón egipcio manga larga',
      brand: 'FashionStore Men',
      categoryId: catShirts.id,
      seasonId: season.id,
      supplierId: supplier.id,
      images: {
        create: [
          {
            imageUrl: 'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=800',
            isCover: true,
            sortOrder: 0,
          },
        ],
      },
    },
  });

  const varShirtBlueM = await prisma.productVariant.upsert({
    where: { sku: 'CAM-OX-AZUL-M' },
    update: {},
    create: {
      productId: prodShirt.id,
      sku: 'CAM-OX-AZUL-M',
      size: 'M',
      color: 'Azul Celeste',
      price: 189.5,
      cost: 90.0,
      measurementsJson: { shoulders_cm: 44, chest_cm: 100, waist_cm: 92, length_cm: 74 },
    },
  });

  // 6. STOCK INICIAL POR UBICACIÓN
  // Vestido Rojo M en Piso de Ventas La Paz (10 unidades)
  await prisma.inventoryStock.upsert({
    where: {
      variantId_locationId: {
        variantId: varDressRedM.id,
        locationId: locLPFloor.id,
      },
    },
    update: { quantity: 10 },
    create: {
      variantId: varDressRedM.id,
      locationId: locLPFloor.id,
      quantity: 10,
      minStock: 2,
    },
  });

  // Vestido Rojo S en Almacén La Paz (15 unidades)
  await prisma.inventoryStock.upsert({
    where: {
      variantId_locationId: {
        variantId: varDressRedS.id,
        locationId: locLPWarehouse.id,
      },
    },
    update: { quantity: 15 },
    create: {
      variantId: varDressRedS.id,
      locationId: locLPWarehouse.id,
      quantity: 15,
      minStock: 3,
    },
  });

  // Camisa Azul M en Piso de Ventas Santa Cruz (8 unidades)
  await prisma.inventoryStock.upsert({
    where: {
      variantId_locationId: {
        variantId: varShirtBlueM.id,
        locationId: locSCFloor.id,
      },
    },
    update: { quantity: 8 },
    create: {
      variantId: varShirtBlueM.id,
      locationId: locSCFloor.id,
      quantity: 8,
      minStock: 2,
    },
  });

  console.log('✅ Catálogo, Variantes y Stock de prueba inicializados');
  console.log('🎉 Seed completado exitosamente.');
}

main()
  .catch((e) => {
    console.error('❌ Error ejecutando seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
