import { PrismaClient } from "@prisma/client";
import * as argon2 from "argon2";
const LocationType = {
  WAREHOUSE: "WAREHOUSE",
  SALES_FLOOR: "SALES_FLOOR"
};
const MovementType = {
  PURCHASE_RECEIPT: "PURCHASE_RECEIPT",
  TRANSFER: "TRANSFER",
  RESERVATION_HOLD: "RESERVATION_HOLD",
  RESERVATION_RELEASE: "RESERVATION_RELEASE",
  SALE: "SALE",
  RETURN: "RETURN",
  ADJUSTMENT: "ADJUSTMENT"
};
const OrderStatus = {
  PENDING: "PENDING",
  PAID: "PAID",
  DELIVERED: "DELIVERED",
  CANCELLED: "CANCELLED"
};
const OrderType = {
  ONLINE: "ONLINE",
  IN_STORE: "IN_STORE"
};
const PaymentMethod = {
  CASH: "CASH",
  CARD: "CARD",
  QR: "QR",
  GATEWAY: "GATEWAY"
};
const PaymentStatus = {
  PENDING: "PENDING",
  SUCCESS: "SUCCESS",
  FAILED: "FAILED"
};
const ReservationStatus = {
  PENDING: "PENDING",
  CONFIRMED: "CONFIRMED",
  PREPARED: "PREPARED",
  READY: "READY",
  COMPLETED: "COMPLETED",
  CANCELLED: "CANCELLED",
  EXPIRED: "EXPIRED"
};
const targetSchema = process.env.TARGET_SCHEMA || process.env.TENANT_SCHEMA || "public";
const baseDbUrl = process.env.DATABASE_URL || "postgresql://postgres:postgres@127.0.0.1:5435/fashionstore_db?schema=public";
const [baseUrl] = baseDbUrl.split("?");
const connectionUrl = `${baseUrl}?schema=${targetSchema}`;
console.log(`\u{1F50C} Conectando Prisma al esquema: "${targetSchema}"`);
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: connectionUrl
    }
  }
});
function daysAgo(days, hoursOffset = 0) {
  const d = /* @__PURE__ */ new Date();
  d.setDate(d.getDate() - days);
  d.setHours(d.getHours() + hoursOffset);
  return d;
}
function hoursFromNow(hours) {
  const d = /* @__PURE__ */ new Date();
  d.setHours(d.getHours() + hours);
  return d;
}
async function main() {
  console.log("\u{1F331} Iniciando Seed masivo y enriquecido de FashionStore...");
  const permissionCodes = [
    { code: "USER:READ", description: "Ver usuarios" },
    { code: "USER:CREATE", description: "Crear usuarios" },
    { code: "PRODUCT:READ", description: "Consultar cat\xE1logo" },
    { code: "PRODUCT:CREATE", description: "Crear productos y variantes" },
    { code: "PRODUCT:UPDATE", description: "Actualizar productos y variantes" },
    { code: "INVENTORY:VIEW", description: "Ver stock y ubicaciones" },
    { code: "INVENTORY:TRANSFER", description: "Trasladar stock" },
    { code: "RESERVATION:CREATE", description: "Crear reservas de prendas" },
    { code: "RESERVATION:VIEW", description: "Ver reservas" },
    { code: "RESERVATION:UPDATE_STATUS", description: "Actualizar estado de reserva probador" },
    { code: "PROMOTION:READ", description: "Consultar promociones y descuentos" },
    { code: "PROMOTION:CREATE", description: "Crear promociones y cupones" },
    { code: "PROMOTION:UPDATE", description: "Actualizar promociones y cupones" },
    { code: "ORDER:CREATE", description: "Crear pedidos y ventas" },
    { code: "ORDER:VIEW", description: "Ver pedidos" },
    { code: "REPORT:VIEW", description: "Ver reportes" },
    { code: "REPORT:GENERATE", description: "Generar reportes con IA" }
  ];
  const permissionsMap = {};
  for (const p of permissionCodes) {
    const perm = await prisma.permission.upsert({
      where: { code: p.code },
      update: {},
      create: p
    });
    permissionsMap[p.code] = perm.id;
  }
  console.log(`\u2705 ${permissionCodes.length} Permisos verificados/creados`);
  const rolesData = [
    {
      name: "ADMIN",
      description: "Administrador del sistema con acceso total",
      permissions: Object.keys(permissionsMap)
    },
    {
      name: "STORE_MANAGER",
      description: "Encargado de sucursal con gesti\xF3n de stock y reportes",
      permissions: [
        "PRODUCT:READ",
        "PRODUCT:CREATE",
        "PRODUCT:UPDATE",
        "INVENTORY:VIEW",
        "INVENTORY:TRANSFER",
        "RESERVATION:VIEW",
        "RESERVATION:UPDATE_STATUS",
        "PROMOTION:READ",
        "ORDER:VIEW",
        "REPORT:VIEW",
        "REPORT:GENERATE"
      ]
    },
    {
      name: "CASHIER",
      description: "Cajero / vendedor de piso",
      permissions: [
        "PRODUCT:READ",
        "INVENTORY:VIEW",
        "RESERVATION:VIEW",
        "ORDER:CREATE",
        "ORDER:VIEW"
      ]
    },
    {
      name: "CLIENT",
      description: "Cliente de la tienda f\xEDsica y digital",
      permissions: [
        "PRODUCT:READ",
        "RESERVATION:CREATE",
        "RESERVATION:VIEW",
        "ORDER:CREATE",
        "ORDER:VIEW"
      ]
    },
    {
      name: "SUPPLIER",
      description: "Proveedor externo de productos",
      permissions: ["PRODUCT:READ"]
    }
  ];
  const rolesMap = {};
  for (const r of rolesData) {
    const role = await prisma.role.upsert({
      where: { name: r.name },
      update: { description: r.description },
      create: { name: r.name, description: r.description }
    });
    rolesMap[r.name] = role.id;
    for (const permCode of r.permissions) {
      const permId = permissionsMap[permCode];
      if (permId) {
        await prisma.rolePermission.upsert({
          where: {
            roleId_permissionId: {
              roleId: role.id,
              permissionId: permId
            }
          },
          update: {},
          create: {
            roleId: role.id,
            permissionId: permId
          }
        });
      }
    }
  }
  console.log("\u2705 Roles y permisos mapeados con \xE9xito");
  const defaultPassword = "Password123!";
  const defaultHash = await argon2.hash(defaultPassword, { type: argon2.argon2id });
  const adminHash = await argon2.hash("Admin123!", { type: argon2.argon2id });
  const adminUser = await prisma.user.upsert({
    where: { email: "admin@fashionstore.com" },
    update: { passwordHash: adminHash, isActive: true },
    create: {
      email: "admin@fashionstore.com",
      passwordHash: adminHash,
      firstName: "Administrador",
      lastName: "FashionStore",
      phone: "+591 70000000",
      isActive: true
    }
  });
  await prisma.userRole.upsert({
    where: { userId_roleId: { userId: adminUser.id, roleId: rolesMap["ADMIN"] } },
    update: {},
    create: { userId: adminUser.id, roleId: rolesMap["ADMIN"] }
  });
  const managers = [
    { email: "encargado@fashionstore.com", first: "Mar\xEDa", last: "Encargada", phone: "+591 72222221" },
    { email: "gerente.sc@fashionstore.com", first: "Rodrigo", last: "Vaca", phone: "+591 72222222" },
    { email: "gerente.cbba@fashionstore.com", first: "Valeria", last: "Monta\xF1o", phone: "+591 72222223" }
  ];
  for (const m of managers) {
    const user = await prisma.user.upsert({
      where: { email: m.email },
      update: { passwordHash: defaultHash, isActive: true },
      create: {
        email: m.email,
        passwordHash: defaultHash,
        firstName: m.first,
        lastName: m.last,
        phone: m.phone,
        isActive: true
      }
    });
    await prisma.userRole.upsert({
      where: { userId_roleId: { userId: user.id, roleId: rolesMap["STORE_MANAGER"] } },
      update: {},
      create: { userId: user.id, roleId: rolesMap["STORE_MANAGER"] }
    });
  }
  const cashiers = [
    { email: "cajero@fashionstore.com", first: "Juan", last: "Cajero", phone: "+591 71111111" },
    { email: "cajero.sc@fashionstore.com", first: "Carlos", last: "Soliz", phone: "+591 71111112" },
    { email: "cajero.cbba@fashionstore.com", first: "Andrea", last: "Balderrama", phone: "+591 71111113" }
  ];
  for (const c of cashiers) {
    const user = await prisma.user.upsert({
      where: { email: c.email },
      update: { passwordHash: defaultHash, isActive: true },
      create: {
        email: c.email,
        passwordHash: defaultHash,
        firstName: c.first,
        lastName: c.last,
        phone: c.phone,
        isActive: true
      }
    });
    await prisma.userRole.upsert({
      where: { userId_roleId: { userId: user.id, roleId: rolesMap["CASHIER"] } },
      update: {},
      create: { userId: user.id, roleId: rolesMap["CASHIER"] }
    });
  }
  const suppliersUsers = [
    { email: "proveedor@textiles.com", first: "Carlos", last: "Andino", phone: "+591 73333331" },
    { email: "ventas@modabolivia.com", first: "Luc\xEDa", last: "Torrez", phone: "+591 73333332" },
    { email: "pedidos@alpacaart.com", first: "Fernando", last: "Mamani", phone: "+591 73333333" }
  ];
  for (const s of suppliersUsers) {
    const user = await prisma.user.upsert({
      where: { email: s.email },
      update: { passwordHash: defaultHash, isActive: true },
      create: {
        email: s.email,
        passwordHash: defaultHash,
        firstName: s.first,
        lastName: s.last,
        phone: s.phone,
        isActive: true
      }
    });
    await prisma.userRole.upsert({
      where: { userId_roleId: { userId: user.id, roleId: rolesMap["SUPPLIER"] } },
      update: {},
      create: { userId: user.id, roleId: rolesMap["SUPPLIER"] }
    });
  }
  const clientsData = [
    { email: "camila.flores@outlook.com", first: "Camila", last: "Flores", phone: "+591 76543201", isWholesaler: false },
    { email: "lucas.paredes@gmail.com", first: "Lucas", last: "Paredes", phone: "+591 76543202", isWholesaler: false },
    { email: "sofia.vargas@gmail.com", first: "Sof\xEDa", last: "Vargas", phone: "+591 76543203", isWholesaler: false },
    { email: "mateo.fernandez@yahoo.com", first: "Mateo", last: "Fern\xE1ndez", phone: "+591 76543204", isWholesaler: false },
    { email: "elena.quispe@gmail.com", first: "Elena", last: "Quispe", phone: "+591 76543205", isWholesaler: false },
    { email: "diego.torres@gmail.com", first: "Diego", last: "Torres", phone: "+591 76543206", isWholesaler: false },
    { email: "valeria.castro@gmail.com", first: "Valeria", last: "Castro", phone: "+591 76543207", isWholesaler: false },
    { email: "alejandro.guzman@gmail.com", first: "Alejandro", last: "Guzm\xE1n", phone: "+591 76543208", isWholesaler: false },
    { email: "claudia.navarro@gmail.com", first: "Claudia", last: "Navarro", phone: "+591 76543209", isWholesaler: false },
    { email: "gabriel.montes@gmail.com", first: "Gabriel", last: "Montes", phone: "+591 76543210", isWholesaler: false },
    { email: "natalia.ortega@gmail.com", first: "Natalia", last: "Ortega", phone: "+591 76543211", isWholesaler: false },
    { email: "andres.silva@gmail.com", first: "Andr\xE9s", last: "Silva", phone: "+591 76543212", isWholesaler: false },
    // Mayoristas (Wholesalers)
    { email: "isabella.morales@boutique.com", first: "Isabella", last: "Morales (Boutique Chic)", phone: "+591 76543213", isWholesaler: true },
    { email: "javier.rojas@distribuidora.com", first: "Javier", last: "Rojas (Distribuidora JR)", phone: "+591 76543214", isWholesaler: true },
    { email: "patricia.villarroel@boutique.com", first: "Patricia", last: "Villarroel (Glamour Store)", phone: "+591 76543215", isWholesaler: true }
  ];
  const clientUsers = [];
  for (const c of clientsData) {
    const user = await prisma.user.upsert({
      where: { email: c.email },
      update: { passwordHash: defaultHash, isActive: true, isWholesaler: c.isWholesaler },
      create: {
        email: c.email,
        passwordHash: defaultHash,
        firstName: c.first,
        lastName: c.last,
        phone: c.phone,
        isWholesaler: c.isWholesaler,
        isActive: true
      }
    });
    await prisma.userRole.upsert({
      where: { userId_roleId: { userId: user.id, roleId: rolesMap["CLIENT"] } },
      update: {},
      create: { userId: user.id, roleId: rolesMap["CLIENT"] }
    });
    clientUsers.push(user);
  }
  console.log(`\u2705 ${clientUsers.length} Clientes creados/actualizados`);
  const cityLP = await prisma.city.upsert({ where: { name: "La Paz" }, update: {}, create: { name: "La Paz" } });
  const citySC = await prisma.city.upsert({ where: { name: "Santa Cruz" }, update: {}, create: { name: "Santa Cruz" } });
  const cityCB = await prisma.city.upsert({ where: { name: "Cochabamba" }, update: {}, create: { name: "Cochabamba" } });
  const branchesData = [
    {
      id: "00000000-0000-0000-0000-000000000001",
      name: "Sucursal Central La Paz",
      address: "Av. 16 de Julio #1440, El Prado",
      phone: "+591 2 2441234",
      cityId: cityLP.id,
      locWarehouseId: "00000000-0000-0001-0001-000000000001",
      locFloorId: "00000000-0000-0001-0001-000000000002"
    },
    {
      id: "00000000-0000-0000-0000-000000000002",
      name: "Sucursal Equipetrol Santa Cruz",
      address: "Av. San Mart\xEDn esq. Calle 5 Este",
      phone: "+591 3 3335678",
      cityId: citySC.id,
      locWarehouseId: "00000000-0000-0002-0001-000000000001",
      locFloorId: "00000000-0000-0002-0001-000000000002"
    },
    {
      id: "00000000-0000-0000-0000-000000000003",
      name: "Sucursal Megacenter Calacoto",
      address: "Av. Rafael Pab\xF3n #100, Zona Sur, La Paz",
      phone: "+591 2 2779988",
      cityId: cityLP.id,
      locWarehouseId: "00000000-0000-0003-0001-000000000001",
      locFloorId: "00000000-0000-0003-0001-000000000002"
    },
    {
      id: "00000000-0000-0000-0000-000000000004",
      name: "Sucursal Ventura Mall Santa Cruz",
      address: "4to Anillo y Av. San Mart\xEDn, Santa Cruz",
      phone: "+591 3 3881122",
      cityId: citySC.id,
      locWarehouseId: "00000000-0000-0004-0001-000000000001",
      locFloorId: "00000000-0000-0004-0001-000000000002"
    },
    {
      id: "00000000-0000-0000-0000-000000000005",
      name: "Sucursal Hupermall Cochabamba",
      address: "Av. Pando #1143, Cochabamba",
      phone: "+591 4 4112233",
      cityId: cityCB.id,
      locWarehouseId: "00000000-0000-0005-0001-000000000001",
      locFloorId: "00000000-0000-0005-0001-000000000002"
    },
    {
      id: "00000000-0000-0000-0000-000000000006",
      name: "Sucursal Cine Center Cochabamba",
      address: "Av. Ram\xF3n Rivero #420, Cochabamba",
      phone: "+591 4 4556677",
      cityId: cityCB.id,
      locWarehouseId: "00000000-0000-0006-0001-000000000001",
      locFloorId: "00000000-0000-0006-0001-000000000002"
    }
  ];
  const branches = [];
  const locations = [];
  for (const b of branchesData) {
    const branch = await prisma.branch.upsert({
      where: { id: b.id },
      update: { name: b.name, address: b.address, phone: b.phone, cityId: b.cityId },
      create: {
        id: b.id,
        name: b.name,
        address: b.address,
        phone: b.phone,
        cityId: b.cityId
      }
    });
    branches.push(branch);
    const warehouse = await prisma.inventoryLocation.upsert({
      where: { id: b.locWarehouseId },
      update: { name: `Almac\xE9n - ${b.name}` },
      create: {
        id: b.locWarehouseId,
        branchId: branch.id,
        name: `Almac\xE9n - ${b.name}`,
        type: LocationType.WAREHOUSE
      }
    });
    const floor = await prisma.inventoryLocation.upsert({
      where: { id: b.locFloorId },
      update: { name: `Piso de Ventas - ${b.name}` },
      create: {
        id: b.locFloorId,
        branchId: branch.id,
        name: `Piso de Ventas - ${b.name}`,
        type: LocationType.SALES_FLOOR
      }
    });
    locations.push({ floor, warehouse, branch });
  }
  console.log(`\u2705 ${branches.length} Sucursales y ${locations.length * 2} Ubicaciones listas`);
  const suppliersData = [
    { name: "Textiles Andinos S.A.", email: "contacto@textilesandinos.com", phone: "+591 2 2810099", address: "Zona Industrial El Alto" },
    { name: "Moda & Confecciones Bolivia S.R.L.", email: "ventas@modabolivia.com", phone: "+591 3 3449900", address: "Parque Industrial Santa Cruz" },
    { name: "Alpaca & Lino Artesanal", email: "pedidos@alpacaart.com", phone: "+591 4 4891122", address: "Av. Blanco Galindo Km 5, CBBA" },
    { name: "EcoKnit Fabrics Corp.", email: "info@ecoknit.com", phone: "+591 2 2118833", address: "Calle 21 de Calacoto, LP" }
  ];
  const suppliersMap = {};
  for (const s of suppliersData) {
    const supp = await prisma.supplier.upsert({
      where: { name: s.name },
      update: { contactEmail: s.email, phone: s.phone, address: s.address },
      create: { name: s.name, contactEmail: s.email, phone: s.phone, address: s.address }
    });
    suppliersMap[s.name] = supp;
  }
  const seasonsData = [
    { id: "00000000-0000-0000-0000-000000000101", name: "Verano 2026", start: /* @__PURE__ */ new Date("2025-12-01"), end: /* @__PURE__ */ new Date("2026-03-31") },
    { id: "00000000-0000-0000-0000-000000000102", name: "Oto\xF1o - Invierno 2026", start: /* @__PURE__ */ new Date("2026-04-01"), end: /* @__PURE__ */ new Date("2026-08-31") },
    { id: "00000000-0000-0000-0000-000000000103", name: "Primavera 2026", start: /* @__PURE__ */ new Date("2026-09-01"), end: /* @__PURE__ */ new Date("2026-11-30") },
    { id: "00000000-0000-0000-0000-000000000104", name: "Colecci\xF3n Atemporal", start: null, end: null }
  ];
  const seasonsMap = {};
  for (const sea of seasonsData) {
    const s = await prisma.season.upsert({
      where: { id: sea.id },
      update: { name: sea.name, startDate: sea.start, endDate: sea.end },
      create: { id: sea.id, name: sea.name, startDate: sea.start, endDate: sea.end }
    });
    seasonsMap[sea.name] = s;
  }
  const collectionsData = [
    { name: "Colecci\xF3n Gala y Noche", desc: "Prendas exclusivas de noche confeccionadas en seda y lino fino" },
    { name: "L\xEDnea Urbana Casual", desc: "Dise\xF1os contempor\xE1neos vers\xE1tiles para el d\xEDa a d\xEDa en la ciudad" },
    { name: "Activewear Performance", desc: "Ropa deportiva de alto impacto con telas tecnol\xF3gicas transpirables" },
    { name: "Colecci\xF3n \xC9lite Ejecutiva", desc: "Sastrer\xEDa refinada, trajes y blazers de corte impecable" },
    { name: "Lino & Verano Bohemio", desc: "Prendas frescas de fibras naturales con estilo relajado y chic" },
    { name: "C\xE1psula Invierno Andino", desc: "Prendas abrigadas en alpaca boucl\xE9 y lana merino" }
  ];
  const collectionsMap = {};
  for (const c of collectionsData) {
    const col = await prisma.collection.upsert({
      where: { name: c.name },
      update: { description: c.desc },
      create: { name: c.name, description: c.desc }
    });
    collectionsMap[c.name] = col;
  }
  const categoriesData = [
    { name: "Vestidos", slug: "vestidos" },
    { name: "Camisas & Blusas", slug: "camisas" },
    { name: "Deportivo & Training", slug: "deportivo" },
    { name: "Chaquetas & Abrigos", slug: "chaquetas" },
    { name: "Pantalones & Jeans", slug: "pantalones" },
    { name: "Trajes & Sastrer\xEDa", slug: "sastreria" },
    { name: "Accesorios & Bolsos", slug: "accesorios" },
    { name: "Calzados & Zapatos", slug: "calzados" }
  ];
  const categoriesMap = {};
  for (const cat of categoriesData) {
    const c = await prisma.category.upsert({
      where: { slug: cat.slug },
      update: { name: cat.name },
      create: { name: cat.name, slug: cat.slug }
    });
    categoriesMap[cat.slug] = c;
  }
  console.log("\u2705 Categor\xEDas, Temporadas, Colecciones y Proveedores listos");
  const productsSeed = [
    {
      id: "00000000-0000-0000-0000-000000000201",
      name: "Vestido Gala Elegance",
      description: "Vestido largo de fiesta corte sirena con espalda descubierta y ca\xEDda fluida.",
      brand: "FashionStore Couture",
      categorySlug: "vestidos",
      seasonName: "Verano 2026",
      collectionName: "Colecci\xF3n Gala y Noche",
      supplierName: "Textiles Andinos S.A.",
      images: [
        { imageUrl: "https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=800", isCover: true, sortOrder: 0 },
        { imageUrl: "https://images.unsplash.com/photo-1566174053879-31528523f8ae?w=800", isCover: false, sortOrder: 1 }
      ],
      variants: [
        { sku: "VEST-ELEG-ROJO-XS", size: "XS", color: "Rojo Carmes\xED", price: 349.99, wholesalePrice: 280, wholesaleMinUnits: 4, cost: 180, measurements: { shoulders_cm: 36, bust_cm: 82, waist_cm: 62, hips_cm: 88 } },
        { sku: "VEST-ELEG-ROJO-S", size: "S", color: "Rojo Carmes\xED", price: 349.99, wholesalePrice: 280, wholesaleMinUnits: 4, cost: 180, measurements: { shoulders_cm: 38, bust_cm: 86, waist_cm: 66, hips_cm: 92 } },
        { sku: "VEST-ELEG-ROJO-M", size: "M", color: "Rojo Carmes\xED", price: 349.99, wholesalePrice: 280, wholesaleMinUnits: 4, cost: 180, measurements: { shoulders_cm: 40, bust_cm: 90, waist_cm: 72, hips_cm: 96 } },
        { sku: "VEST-ELEG-NEGRO-S", size: "S", color: "Negro Noche", price: 349.99, wholesalePrice: 280, wholesaleMinUnits: 4, cost: 180, measurements: { shoulders_cm: 38, bust_cm: 86, waist_cm: 66, hips_cm: 92 } },
        { sku: "VEST-ELEG-NEGRO-M", size: "M", color: "Negro Noche", price: 349.99, wholesalePrice: 280, wholesaleMinUnits: 4, cost: 180, measurements: { shoulders_cm: 40, bust_cm: 90, waist_cm: 72, hips_cm: 96 } },
        { sku: "VEST-ELEG-AZUL-L", size: "L", color: "Azul Zafiro", price: 349.99, wholesalePrice: 280, wholesaleMinUnits: 4, cost: 180, measurements: { shoulders_cm: 42, bust_cm: 96, waist_cm: 78, hips_cm: 102 } }
      ]
    },
    {
      id: "00000000-0000-0000-0000-000000000202",
      name: "Camisa Oxford Classic Fit",
      description: "Camisa formal 100% algod\xF3n egipcio manga larga con botones de n\xE1car.",
      brand: "FashionStore Men",
      categorySlug: "camisas",
      seasonName: "Colecci\xF3n Atemporal",
      collectionName: "Colecci\xF3n \xC9lite Ejecutiva",
      supplierName: "Moda & Confecciones Bolivia S.R.L.",
      images: [
        { imageUrl: "https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=800", isCover: true, sortOrder: 0 },
        { imageUrl: "https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=800", isCover: false, sortOrder: 1 }
      ],
      variants: [
        { sku: "CAM-OX-AZUL-S", size: "S", color: "Azul Celeste", price: 189.5, wholesalePrice: 140, wholesaleMinUnits: 6, cost: 90, measurements: { shoulders_cm: 42, chest_cm: 96, waist_cm: 88, length_cm: 72 } },
        { sku: "CAM-OX-AZUL-M", size: "M", color: "Azul Celeste", price: 189.5, wholesalePrice: 140, wholesaleMinUnits: 6, cost: 90, measurements: { shoulders_cm: 44, chest_cm: 100, waist_cm: 92, length_cm: 74 } },
        { sku: "CAM-OX-AZUL-L", size: "L", color: "Azul Celeste", price: 189.5, wholesalePrice: 140, wholesaleMinUnits: 6, cost: 90, measurements: { shoulders_cm: 46, chest_cm: 106, waist_cm: 98, length_cm: 76 } },
        { sku: "CAM-OX-BLANCO-M", size: "M", color: "Blanco Puro", price: 189.5, wholesalePrice: 140, wholesaleMinUnits: 6, cost: 90, measurements: { shoulders_cm: 44, chest_cm: 100, waist_cm: 92, length_cm: 74 } },
        { sku: "CAM-OX-BLANCO-L", size: "L", color: "Blanco Puro", price: 189.5, wholesalePrice: 140, wholesaleMinUnits: 6, cost: 90, measurements: { shoulders_cm: 46, chest_cm: 106, waist_cm: 98, length_cm: 76 } }
      ]
    },
    {
      id: "00000000-0000-0000-0000-000000000203",
      name: "Polera Dry-FIT Training Pro",
      description: "Polera deportiva transpirable de alto rendimiento con tecnolog\xEDa anti-sudor y costuras planas.",
      brand: "Nike Pro Training",
      categorySlug: "deportivo",
      seasonName: "Verano 2026",
      collectionName: "Activewear Performance",
      supplierName: "EcoKnit Fabrics Corp.",
      images: [
        { imageUrl: "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=800", isCover: true, sortOrder: 0 }
      ],
      variants: [
        { sku: "TEE-DF-NEGRO-S", size: "S", color: "Negro Mate", price: 179.99, wholesalePrice: 129.99, wholesaleMinUnits: 6, cost: 70, measurements: { chest_cm: 92, waist_cm: 80, length_cm: 70 } },
        { sku: "TEE-DF-NEGRO-M", size: "M", color: "Negro Mate", price: 179.99, wholesalePrice: 129.99, wholesaleMinUnits: 6, cost: 70, measurements: { chest_cm: 98, waist_cm: 84, length_cm: 72 } },
        { sku: "TEE-DF-NEGRO-L", size: "L", color: "Negro Mate", price: 179.99, wholesalePrice: 129.99, wholesaleMinUnits: 6, cost: 70, measurements: { chest_cm: 104, waist_cm: 90, length_cm: 75 } },
        { sku: "TEE-DF-AZUL-M", size: "M", color: "Azul Royal", price: 179.99, wholesalePrice: 129.99, wholesaleMinUnits: 6, cost: 70, measurements: { chest_cm: 98, waist_cm: 84, length_cm: 72 } }
      ]
    },
    {
      id: "00000000-0000-0000-0000-000000000204",
      name: "Sudadera Hoodie Streetwear Oversize",
      description: "Hoodie con capucha y bolsillo canguro afelpado en algod\xF3n peinado premium de 380 GSM.",
      brand: "Adidas Originals",
      categorySlug: "deportivo",
      seasonName: "Oto\xF1o - Invierno 2026",
      collectionName: "L\xEDnea Urbana Casual",
      supplierName: "Textiles Andinos S.A.",
      images: [
        { imageUrl: "https://images.unsplash.com/photo-1556905055-8f358a7a47b2?w=800", isCover: true, sortOrder: 0 }
      ],
      variants: [
        { sku: "HOD-OVER-GRIS-S", size: "S", color: "Gris Melange", price: 299.5, wholesalePrice: 220, wholesaleMinUnits: 6, cost: 130, measurements: { chest_cm: 102, waist_cm: 90, length_cm: 68 } },
        { sku: "HOD-OVER-GRIS-M", size: "M", color: "Gris Melange", price: 299.5, wholesalePrice: 220, wholesaleMinUnits: 6, cost: 130, measurements: { chest_cm: 108, waist_cm: 96, length_cm: 70 } },
        { sku: "HOD-OVER-GRIS-L", size: "L", color: "Gris Melange", price: 299.5, wholesalePrice: 220, wholesaleMinUnits: 6, cost: 130, measurements: { chest_cm: 114, waist_cm: 102, length_cm: 73 } },
        { sku: "HOD-OVER-NEGRO-M", size: "M", color: "Negro Carb\xF3n", price: 299.5, wholesalePrice: 220, wholesaleMinUnits: 6, cost: 130, measurements: { chest_cm: 108, waist_cm: 96, length_cm: 70 } },
        { sku: "HOD-OVER-TERRA-L", size: "L", color: "Terracota", price: 299.5, wholesalePrice: 220, wholesaleMinUnits: 6, cost: 130, measurements: { chest_cm: 114, waist_cm: 102, length_cm: 73 } }
      ]
    },
    {
      id: "00000000-0000-0000-0000-000000000205",
      name: "Calza Running Performance High-Waist",
      description: "Calza de compresi\xF3n con cintura alta moldeadora y bolsillo invisible para m\xF3vil.",
      brand: "Under Armour Sport",
      categorySlug: "deportivo",
      seasonName: "Verano 2026",
      collectionName: "Activewear Performance",
      supplierName: "EcoKnit Fabrics Corp.",
      images: [
        { imageUrl: "https://images.unsplash.com/photo-1506629082955-511b1aa562c8?w=800", isCover: true, sortOrder: 0 }
      ],
      variants: [
        { sku: "CAL-RUN-NEGRO-XS", size: "XS", color: "Negro Carb\xF3n", price: 219, wholesalePrice: 165, wholesaleMinUnits: 6, cost: 95, measurements: { waist_cm: 60, hips_cm: 86, length_cm: 90 } },
        { sku: "CAL-RUN-NEGRO-S", size: "S", color: "Negro Carb\xF3n", price: 219, wholesalePrice: 165, wholesaleMinUnits: 6, cost: 95, measurements: { waist_cm: 64, hips_cm: 90, length_cm: 92 } },
        { sku: "CAL-RUN-NEGRO-M", size: "M", color: "Negro Carb\xF3n", price: 219, wholesalePrice: 165, wholesaleMinUnits: 6, cost: 95, measurements: { waist_cm: 70, hips_cm: 96, length_cm: 94 } },
        { sku: "CAL-RUN-BORGO-S", size: "S", color: "Borgo\xF1a", price: 219, wholesalePrice: 165, wholesaleMinUnits: 6, cost: 95, measurements: { waist_cm: 64, hips_cm: 90, length_cm: 92 } }
      ]
    },
    {
      id: "00000000-0000-0000-0000-000000000206",
      name: "Short Training B\xE1sico Respirable",
      description: "Short ligero de secado r\xE1pido con malla interior antitranspirante y bolsillos laterales.",
      brand: "Boutique Sport",
      categorySlug: "deportivo",
      seasonName: "Verano 2026",
      collectionName: "Activewear Performance",
      supplierName: "Moda & Confecciones Bolivia S.R.L.",
      images: [],
      variants: [
        { sku: "SHO-BAS-AZUL-S", size: "S", color: "Azul Marino", price: 95, wholesalePrice: 70, wholesaleMinUnits: 6, cost: 40, measurements: { waist_cm: 74, hips_cm: 90, length_cm: 43 } },
        { sku: "SHO-BAS-AZUL-M", size: "M", color: "Azul Marino", price: 95, wholesalePrice: 70, wholesaleMinUnits: 6, cost: 40, measurements: { waist_cm: 80, hips_cm: 96, length_cm: 45 } },
        { sku: "SHO-BAS-NEGRO-M", size: "M", color: "Negro", price: 95, wholesalePrice: 70, wholesaleMinUnits: 6, cost: 40, measurements: { waist_cm: 80, hips_cm: 96, length_cm: 45 } }
      ]
    },
    {
      id: "00000000-0000-0000-0000-000000000207",
      name: "Chaqueta Cuero Biker Legend",
      description: "Chaqueta de cuero genuino estilo motociclista con cremalleras met\xE1licas YKK reforzadas.",
      brand: "Urban Leather Co.",
      categorySlug: "chaquetas",
      seasonName: "Oto\xF1o - Invierno 2026",
      collectionName: "L\xEDnea Urbana Casual",
      supplierName: "Moda & Confecciones Bolivia S.R.L.",
      images: [
        { imageUrl: "https://images.unsplash.com/photo-1520975916090-3105956dac38?w=800", isCover: true, sortOrder: 0 },
        { imageUrl: "https://images.unsplash.com/photo-1551028719-00167b16eac5?w=800", isCover: false, sortOrder: 1 }
      ],
      variants: [
        { sku: "CHQ-BIKER-NEGRO-S", size: "S", color: "Negro \xD3nix", price: 599, wholesalePrice: 450, wholesaleMinUnits: 4, cost: 310, measurements: { shoulders_cm: 44, chest_cm: 98, waist_cm: 88, length_cm: 65 } },
        { sku: "CHQ-BIKER-NEGRO-M", size: "M", color: "Negro \xD3nix", price: 599, wholesalePrice: 450, wholesaleMinUnits: 4, cost: 310, measurements: { shoulders_cm: 46, chest_cm: 104, waist_cm: 94, length_cm: 67 } },
        { sku: "CHQ-BIKER-NEGRO-L", size: "L", color: "Negro \xD3nix", price: 599, wholesalePrice: 450, wholesaleMinUnits: 4, cost: 310, measurements: { shoulders_cm: 48, chest_cm: 110, waist_cm: 100, length_cm: 69 } },
        { sku: "CHQ-BIKER-MARRON-M", size: "M", color: "Marr\xF3n Vintage", price: 599, wholesalePrice: 450, wholesaleMinUnits: 4, cost: 310, measurements: { shoulders_cm: 46, chest_cm: 104, waist_cm: 94, length_cm: 67 } }
      ]
    },
    {
      id: "00000000-0000-0000-0000-000000000208",
      name: "Blazer Ejecutivo Slim Fit",
      description: "Blazer estructurado en lana fr\xEDa con forro satinado y solapa de muesca moderna.",
      brand: "FashionStore Couture",
      categorySlug: "sastreria",
      seasonName: "Colecci\xF3n Atemporal",
      collectionName: "Colecci\xF3n \xC9lite Ejecutiva",
      supplierName: "Textiles Andinos S.A.",
      images: [
        { imageUrl: "https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=800", isCover: true, sortOrder: 0 }
      ],
      variants: [
        { sku: "BLZ-SLIM-AZUL-38", size: "38", color: "Azul Marino", price: 449, wholesalePrice: 350, wholesaleMinUnits: 4, cost: 220, measurements: { shoulders_cm: 44, chest_cm: 96, waist_cm: 86, length_cm: 72 } },
        { sku: "BLZ-SLIM-AZUL-40", size: "40", color: "Azul Marino", price: 449, wholesalePrice: 350, wholesaleMinUnits: 4, cost: 220, measurements: { shoulders_cm: 46, chest_cm: 102, waist_cm: 92, length_cm: 74 } },
        { sku: "BLZ-SLIM-GRIS-40", size: "40", color: "Gris Oxford", price: 449, wholesalePrice: 350, wholesaleMinUnits: 4, cost: 220, measurements: { shoulders_cm: 46, chest_cm: 102, waist_cm: 92, length_cm: 74 } },
        { sku: "BLZ-SLIM-NEGRO-42", size: "42", color: "Negro", price: 449, wholesalePrice: 350, wholesaleMinUnits: 4, cost: 220, measurements: { shoulders_cm: 48, chest_cm: 108, waist_cm: 98, length_cm: 76 } }
      ]
    },
    {
      id: "00000000-0000-0000-0000-000000000209",
      name: "Jean Denim Stretch Premium",
      description: "Pantal\xF3n vaquero corte slim con elastano para m\xE1xima flexibilidad y lavado artesanal.",
      brand: "Levi Denim Works",
      categorySlug: "pantalones",
      seasonName: "Colecci\xF3n Atemporal",
      collectionName: "L\xEDnea Urbana Casual",
      supplierName: "Moda & Confecciones Bolivia S.R.L.",
      images: [
        { imageUrl: "https://images.unsplash.com/photo-1542272604-780c96856592?w=800", isCover: true, sortOrder: 0 }
      ],
      variants: [
        { sku: "JEA-STR-AZUL-30", size: "30", color: "Azul \xCDndigo", price: 249, wholesalePrice: 180, wholesaleMinUnits: 6, cost: 110, measurements: { waist_cm: 76, hips_cm: 94, length_cm: 102 } },
        { sku: "JEA-STR-AZUL-32", size: "32", color: "Azul \xCDndigo", price: 249, wholesalePrice: 180, wholesaleMinUnits: 6, cost: 110, measurements: { waist_cm: 82, hips_cm: 100, length_cm: 104 } },
        { sku: "JEA-STR-AZUL-34", size: "34", color: "Azul \xCDndigo", price: 249, wholesalePrice: 180, wholesaleMinUnits: 6, cost: 110, measurements: { waist_cm: 88, hips_cm: 106, length_cm: 106 } },
        { sku: "JEA-STR-NEGRO-32", size: "32", color: "Negro", price: 249, wholesalePrice: 180, wholesaleMinUnits: 6, cost: 110, measurements: { waist_cm: 82, hips_cm: 100, length_cm: 104 } }
      ]
    },
    {
      id: "00000000-0000-0000-0000-000000000210",
      name: "Vestido Bohemio Floral Midi",
      description: "Vestido de corte midi con estampado bot\xE1nico, escote en V y falda con volantes.",
      brand: "Boho & Chic",
      categorySlug: "vestidos",
      seasonName: "Primavera 2026",
      collectionName: "Lino & Verano Bohemio",
      supplierName: "Alpaca & Lino Artesanal",
      images: [
        { imageUrl: "https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?w=800", isCover: true, sortOrder: 0 }
      ],
      variants: [
        { sku: "VEST-BOHO-VERDE-S", size: "S", color: "Verde Esmeralda", price: 269.5, wholesalePrice: 200, wholesaleMinUnits: 5, cost: 130, measurements: { shoulders_cm: 37, bust_cm: 88, waist_cm: 68, hips_cm: 94 } },
        { sku: "VEST-BOHO-VERDE-M", size: "M", color: "Verde Esmeralda", price: 269.5, wholesalePrice: 200, wholesaleMinUnits: 5, cost: 130, measurements: { shoulders_cm: 39, bust_cm: 92, waist_cm: 74, hips_cm: 100 } },
        { sku: "VEST-BOHO-ROSA-M", size: "M", color: "Rosa Pastel", price: 269.5, wholesalePrice: 200, wholesaleMinUnits: 5, cost: 130, measurements: { shoulders_cm: 39, bust_cm: 92, waist_cm: 74, hips_cm: 100 } }
      ]
    },
    {
      id: "00000000-0000-0000-0000-000000000211",
      name: "Abrigo Lana Merino Andino",
      description: "Abrigo largo 3/4 confeccionado en pa\xF1o de lana merino con botones de madera tallada.",
      brand: "Alpaca Couture",
      categorySlug: "chaquetas",
      seasonName: "Oto\xF1o - Invierno 2026",
      collectionName: "C\xE1psula Invierno Andino",
      supplierName: "Alpaca & Lino Artesanal",
      images: [
        { imageUrl: "https://images.unsplash.com/photo-1539533018447-63fcce2678e3?w=800", isCover: true, sortOrder: 0 }
      ],
      variants: [
        { sku: "ABR-LANA-CAMEL-S", size: "S", color: "Camel C\xE1lido", price: 680, wholesalePrice: 520, wholesaleMinUnits: 3, cost: 350, measurements: { shoulders_cm: 40, bust_cm: 92, waist_cm: 80, length_cm: 105 } },
        { sku: "ABR-LANA-CAMEL-M", size: "M", color: "Camel C\xE1lido", price: 680, wholesalePrice: 520, wholesaleMinUnits: 3, cost: 350, measurements: { shoulders_cm: 42, bust_cm: 98, waist_cm: 86, length_cm: 108 } },
        { sku: "ABR-LANA-GRIS-M", size: "M", color: "Gris Carb\xF3n", price: 680, wholesalePrice: 520, wholesaleMinUnits: 3, cost: 350, measurements: { shoulders_cm: 42, bust_cm: 98, waist_cm: 86, length_cm: 108 } }
      ]
    },
    {
      id: "00000000-0000-0000-0000-000000000212",
      name: "Pantal\xF3n Chino Casual Comfort",
      description: "Pantal\xF3n de gabardina de algod\xF3n suave con corte regular y bolsillos traseros de ojal.",
      brand: "FashionStore Men",
      categorySlug: "pantalones",
      seasonName: "Colecci\xF3n Atemporal",
      collectionName: "L\xEDnea Urbana Casual",
      supplierName: "Moda & Confecciones Bolivia S.R.L.",
      images: [
        { imageUrl: "https://images.unsplash.com/photo-1473966968600-fa801b869a1a?w=800", isCover: true, sortOrder: 0 }
      ],
      variants: [
        { sku: "CHI-COM-BEIGE-30", size: "30", color: "Beige Camel", price: 199, wholesalePrice: 145, wholesaleMinUnits: 6, cost: 95, measurements: { waist_cm: 78, hips_cm: 96, length_cm: 102 } },
        { sku: "CHI-COM-BEIGE-32", size: "32", color: "Beige Camel", price: 199, wholesalePrice: 145, wholesaleMinUnits: 6, cost: 95, measurements: { waist_cm: 84, hips_cm: 102, length_cm: 104 } },
        { sku: "CHI-COM-VERDE-32", size: "32", color: "Verde Militar", price: 199, wholesalePrice: 145, wholesaleMinUnits: 6, cost: 95, measurements: { waist_cm: 84, hips_cm: 102, length_cm: 104 } }
      ]
    },
    {
      id: "00000000-0000-0000-0000-000000000213",
      name: "Bolso Tote Bag Cuero Genuino",
      description: "Bolso espacioso de cuero vacuno curtido al vegetal con asas dobles y compartimento para laptop.",
      brand: "Boutique Leather",
      categorySlug: "accesorios",
      seasonName: "Colecci\xF3n Atemporal",
      collectionName: "L\xEDnea Urbana Casual",
      supplierName: "Moda & Confecciones Bolivia S.R.L.",
      images: [
        { imageUrl: "https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=800", isCover: true, sortOrder: 0 }
      ],
      variants: [
        { sku: "BOL-TOTE-CARAM-U", size: "\xDAnica", color: "Marr\xF3n Caramelo", price: 320, wholesalePrice: 240, wholesaleMinUnits: 4, cost: 160, measurements: { width_cm: 40, height_cm: 32, depth_cm: 14 } },
        { sku: "BOL-TOTE-NEGRO-U", size: "\xDAnica", color: "Negro Cl\xE1sico", price: 320, wholesalePrice: 240, wholesaleMinUnits: 4, cost: 160, measurements: { width_cm: 40, height_cm: 32, depth_cm: 14 } }
      ]
    },
    {
      id: "00000000-0000-0000-0000-000000000214",
      name: "Zapatillas Urban Sneaker Minimalist",
      description: "Zapatillas urbanas de cuero blanco con suela de caucho vulcanizado ergon\xF3mica y plantilla de memory foam.",
      brand: "Street Step",
      categorySlug: "calzados",
      seasonName: "Colecci\xF3n Atemporal",
      collectionName: "L\xEDnea Urbana Casual",
      supplierName: "EcoKnit Fabrics Corp.",
      images: [
        { imageUrl: "https://images.unsplash.com/photo-1549298916-b41d501d3772?w=800", isCover: true, sortOrder: 0 }
      ],
      variants: [
        { sku: "SNK-MIN-BLANCO-39", size: "39", color: "Blanco Puro", price: 389, wholesalePrice: 290, wholesaleMinUnits: 5, cost: 195, measurements: { foot_length_cm: 25 } },
        { sku: "SNK-MIN-BLANCO-40", size: "40", color: "Blanco Puro", price: 389, wholesalePrice: 290, wholesaleMinUnits: 5, cost: 195, measurements: { foot_length_cm: 25.5 } },
        { sku: "SNK-MIN-BLANCO-41", size: "41", color: "Blanco Puro", price: 389, wholesalePrice: 290, wholesaleMinUnits: 5, cost: 195, measurements: { foot_length_cm: 26.5 } },
        { sku: "SNK-MIN-BLANCO-42", size: "42", color: "Blanco Puro", price: 389, wholesalePrice: 290, wholesaleMinUnits: 5, cost: 195, measurements: { foot_length_cm: 27 } }
      ]
    },
    {
      id: "00000000-0000-0000-0000-000000000215",
      name: "Camisa Lino Casual Slim",
      description: "Camisa de puro lino lavado de tacto suave, cuello mao y mangas remangables.",
      brand: "Boho & Chic",
      categorySlug: "camisas",
      seasonName: "Verano 2026",
      collectionName: "Lino & Verano Bohemio",
      supplierName: "Alpaca & Lino Artesanal",
      images: [
        { imageUrl: "https://images.unsplash.com/photo-1589310243389-96a5483213a8?w=800", isCover: true, sortOrder: 0 }
      ],
      variants: [
        { sku: "CAM-LIN-BLANCO-S", size: "S", color: "Blanco Hueso", price: 219, wholesalePrice: 160, wholesaleMinUnits: 6, cost: 105, measurements: { shoulders_cm: 42, chest_cm: 98, waist_cm: 90, length_cm: 72 } },
        { sku: "CAM-LIN-BLANCO-M", size: "M", color: "Blanco Hueso", price: 219, wholesalePrice: 160, wholesaleMinUnits: 6, cost: 105, measurements: { shoulders_cm: 44, chest_cm: 104, waist_cm: 96, length_cm: 74 } },
        { sku: "CAM-LIN-BEIGE-M", size: "M", color: "Beige Arena", price: 219, wholesalePrice: 160, wholesaleMinUnits: 6, cost: 105, measurements: { shoulders_cm: 44, chest_cm: 104, waist_cm: 96, length_cm: 74 } },
        { sku: "CAM-LIN-VERDE-L", size: "L", color: "Verde Oliva", price: 219, wholesalePrice: 160, wholesaleMinUnits: 6, cost: 105, measurements: { shoulders_cm: 46, chest_cm: 110, waist_cm: 102, length_cm: 76 } }
      ]
    },
    {
      id: "00000000-0000-0000-0000-000000000216",
      name: "Traje Formal Dos Piezas Milano",
      description: "Traje completo con saco estructurado y pantal\xF3n de corte recto en lana virgen italiana.",
      brand: "FashionStore Couture",
      categorySlug: "sastreria",
      seasonName: "Colecci\xF3n Atemporal",
      collectionName: "Colecci\xF3n \xC9lite Ejecutiva",
      supplierName: "Textiles Andinos S.A.",
      images: [
        { imageUrl: "https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=800", isCover: true, sortOrder: 0 }
      ],
      variants: [
        { sku: "TRJ-MIL-GRIS-40", size: "40", color: "Gris Carb\xF3n", price: 890, wholesalePrice: 700, wholesaleMinUnits: 3, cost: 450, measurements: { shoulders_cm: 46, chest_cm: 102, waist_cm: 84, length_cm: 105 } },
        { sku: "TRJ-MIL-GRIS-42", size: "42", color: "Gris Carb\xF3n", price: 890, wholesalePrice: 700, wholesaleMinUnits: 3, cost: 450, measurements: { shoulders_cm: 48, chest_cm: 108, waist_cm: 90, length_cm: 107 } },
        { sku: "TRJ-MIL-AZUL-42", size: "42", color: "Azul Medianoche", price: 890, wholesalePrice: 700, wholesaleMinUnits: 3, cost: 450, measurements: { shoulders_cm: 48, chest_cm: 108, waist_cm: 90, length_cm: 107 } }
      ]
    }
  ];
  const allVariants = [];
  for (const prod of productsSeed) {
    const category = categoriesMap[prod.categorySlug];
    const season = seasonsMap[prod.seasonName];
    const collection = collectionsMap[prod.collectionName];
    const supplier = suppliersMap[prod.supplierName];
    const createdProduct = await prisma.product.upsert({
      where: { id: prod.id },
      update: {
        name: prod.name,
        description: prod.description,
        brand: prod.brand,
        categoryId: category.id,
        seasonId: season ? season.id : null,
        collectionId: collection ? collection.id : null,
        supplierId: supplier ? supplier.id : null
      },
      create: {
        id: prod.id,
        name: prod.name,
        description: prod.description,
        brand: prod.brand,
        categoryId: category.id,
        seasonId: season ? season.id : null,
        collectionId: collection ? collection.id : null,
        supplierId: supplier ? supplier.id : null
      }
    });
    if (prod.images && prod.images.length > 0) {
      await prisma.productImage.deleteMany({ where: { productId: createdProduct.id } });
      for (const img of prod.images) {
        await prisma.productImage.create({
          data: {
            productId: createdProduct.id,
            imageUrl: img.imageUrl,
            isCover: img.isCover,
            sortOrder: img.sortOrder
          }
        });
      }
    }
    for (const v of prod.variants) {
      const createdVariant = await prisma.productVariant.upsert({
        where: { sku: v.sku },
        update: {
          price: v.price,
          wholesalePrice: v.wholesalePrice,
          wholesaleMinUnits: v.wholesaleMinUnits,
          cost: v.cost,
          measurementsJson: v.measurements
        },
        create: {
          productId: createdProduct.id,
          sku: v.sku,
          size: v.size,
          color: v.color,
          price: v.price,
          wholesalePrice: v.wholesalePrice,
          wholesaleMinUnits: v.wholesaleMinUnits,
          cost: v.cost,
          measurementsJson: v.measurements
        }
      });
      allVariants.push(createdVariant);
    }
  }
  console.log(`\u2705 ${productsSeed.length} Productos y ${allVariants.length} Variantes inicializados`);
  let stockIndex = 0;
  for (const loc of locations) {
    for (const variant of allVariants) {
      stockIndex++;
      let floorQty = 8;
      let warehouseQty = 20;
      let minStock = 5;
      if (stockIndex % 9 === 0) {
        floorQty = Math.floor(Math.random() * 3) + 1;
        warehouseQty = 0;
        minStock = 5;
      } else if (stockIndex % 5 === 0) {
        floorQty = Math.floor(Math.random() * 6) + 6;
        warehouseQty = Math.floor(Math.random() * 10) + 10;
        minStock = 4;
      } else {
        floorQty = Math.floor(Math.random() * 12) + 10;
        warehouseQty = Math.floor(Math.random() * 25) + 20;
        minStock = 4;
      }
      await prisma.inventoryStock.upsert({
        where: {
          variantId_locationId: {
            variantId: variant.id,
            locationId: loc.floor.id
          }
        },
        update: { quantity: floorQty, minStock },
        create: {
          variantId: variant.id,
          locationId: loc.floor.id,
          quantity: floorQty,
          minStock
        }
      });
      await prisma.inventoryStock.upsert({
        where: {
          variantId_locationId: {
            variantId: variant.id,
            locationId: loc.warehouse.id
          }
        },
        update: { quantity: warehouseQty, minStock: minStock * 2 },
        create: {
          variantId: variant.id,
          locationId: loc.warehouse.id,
          quantity: warehouseQty,
          minStock: minStock * 2
        }
      });
    }
  }
  console.log("\u2705 Stock de inventario poblado en todas las sucursales con niveles realistas");
  const movementTypes = [
    MovementType.PURCHASE_RECEIPT,
    MovementType.TRANSFER,
    MovementType.SALE,
    MovementType.RESERVATION_HOLD,
    MovementType.RESERVATION_RELEASE,
    MovementType.ADJUSTMENT,
    MovementType.RETURN
  ];
  const movementsData = [];
  for (let i = 0; i < 45; i++) {
    const variant = allVariants[i % allVariants.length];
    const locObj = locations[i % locations.length];
    const mType = movementTypes[i % movementTypes.length];
    const daysOffset = Math.floor(Math.random() * 60) + 1;
    let fromLoc = null;
    let toLoc = null;
    let qty = Math.floor(Math.random() * 15) + 1;
    let reason = `Movimiento operativo programado #${i + 1}`;
    if (mType === MovementType.PURCHASE_RECEIPT) {
      toLoc = locObj.warehouse.id;
      qty = 30;
      reason = "Recepci\xF3n de pedido de compra de proveedor";
    } else if (mType === MovementType.TRANSFER) {
      fromLoc = locObj.warehouse.id;
      toLoc = locObj.floor.id;
      qty = 8;
      reason = "Reposici\xF3n diaria de almac\xE9n a piso de venta";
    } else if (mType === MovementType.SALE) {
      fromLoc = locObj.floor.id;
      qty = 2;
      reason = "Salida por ticket de venta en sucursal";
    } else if (mType === MovementType.RESERVATION_HOLD) {
      fromLoc = locObj.floor.id;
      qty = 1;
      reason = "Apartado f\xEDsico de prenda para probador";
    } else if (mType === MovementType.RESERVATION_RELEASE) {
      toLoc = locObj.floor.id;
      qty = 1;
      reason = "Reincorporaci\xF3n de prenda por expiraci\xF3n de reserva";
    } else if (mType === MovementType.ADJUSTMENT) {
      fromLoc = locObj.warehouse.id;
      qty = 1;
      reason = "Ajuste por recuento de inventario f\xEDsico";
    }
    movementsData.push({
      variantId: variant.id,
      fromLocationId: fromLoc,
      toLocationId: toLoc,
      quantity: qty,
      type: mType,
      reason,
      userId: adminUser.id,
      createdAt: daysAgo(daysOffset, i)
    });
  }
  for (const m of movementsData) {
    await prisma.inventoryMovement.create({ data: m });
  }
  console.log(`\u2705 ${movementsData.length} Movimientos de inventario registrados`);
  const reservationStatuses = [
    { status: ReservationStatus.PENDING, count: 5 },
    { status: ReservationStatus.CONFIRMED, count: 4 },
    { status: ReservationStatus.PREPARED, count: 3 },
    { status: ReservationStatus.READY, count: 3 },
    { status: ReservationStatus.COMPLETED, count: 12 },
    { status: ReservationStatus.CANCELLED, count: 4 },
    { status: ReservationStatus.EXPIRED, count: 4 }
  ];
  let resIndex = 0;
  for (const group of reservationStatuses) {
    for (let j = 0; j < group.count; j++) {
      resIndex++;
      const client = clientUsers[resIndex % clientUsers.length];
      const branch = branches[resIndex % branches.length];
      const daysBack = group.status === "COMPLETED" || group.status === "CANCELLED" || group.status === "EXPIRED" ? Math.floor(Math.random() * 45) + 1 : 0;
      const expiresAt = daysBack === 0 ? hoursFromNow(24 + j * 6) : daysAgo(daysBack - 1);
      const createdAt = daysAgo(daysBack, j * 2);
      const res = await prisma.reservation.create({
        data: {
          userId: client.id,
          branchId: branch.id,
          status: group.status,
          expiresAt,
          notes: `Reserva para probador - Solicitud cliente #${resIndex}`,
          createdAt,
          updatedAt: daysAgo(daysBack, j * 2 + 1)
        }
      });
      const numItems = resIndex % 3 + 1;
      for (let k = 0; k < numItems; k++) {
        const variant = allVariants[(resIndex * 3 + k) % allVariants.length];
        await prisma.reservationItem.create({
          data: {
            reservationId: res.id,
            variantId: variant.id,
            quantity: 1
          }
        });
      }
    }
  }
  console.log(`\u2705 ${resIndex} Reservas de probador registradas`);
  const paymentMethods = [PaymentMethod.QR, PaymentMethod.CARD, PaymentMethod.CASH, PaymentMethod.GATEWAY];
  const orderTypes = [OrderType.IN_STORE, OrderType.IN_STORE, OrderType.ONLINE];
  let totalOrdersCreated = 0;
  for (let i = 1; i <= 75; i++) {
    const client = clientUsers[i % clientUsers.length];
    const branch = branches[i % branches.length];
    const daysOffset = Math.floor(Math.random() * 85);
    const oType = orderTypes[i % orderTypes.length];
    const pMethod = oType === OrderType.ONLINE ? i % 2 === 0 ? PaymentMethod.QR : PaymentMethod.GATEWAY : paymentMethods[i % paymentMethods.length];
    let status = OrderStatus.PAID;
    if (i % 20 === 0) status = OrderStatus.PENDING;
    else if (i % 25 === 0) status = OrderStatus.CANCELLED;
    else if (oType === OrderType.ONLINE && daysOffset > 3) status = OrderStatus.DELIVERED;
    const createdAt = daysAgo(daysOffset, i % 12 * 2);
    const itemsCount = i % 3 + 1;
    let orderTotal = 0;
    const orderItemsToCreate = [];
    for (let k = 0; k < itemsCount; k++) {
      const variant = allVariants[(i * 2 + k) % allVariants.length];
      const isWholesale = client.isWholesaler && variant.wholesalePrice;
      const qty = isWholesale ? variant.wholesaleMinUnits || 6 : k === 0 && i % 4 === 0 ? 2 : 1;
      const unitPrice = isWholesale ? Number(variant.wholesalePrice) : Number(variant.price);
      orderTotal += unitPrice * qty;
      orderItemsToCreate.push({
        variantId: variant.id,
        quantity: qty,
        unitPrice
      });
    }
    const order = await prisma.order.create({
      data: {
        userId: client.id,
        branchId: branch.id,
        type: oType,
        status,
        total: Math.round(orderTotal * 100) / 100,
        createdAt,
        items: {
          create: orderItemsToCreate.map((it) => ({
            variantId: it.variantId,
            quantity: it.quantity,
            unitPrice: it.unitPrice
          }))
        }
      }
    });
    if (status === OrderStatus.PAID || status === OrderStatus.DELIVERED) {
      await prisma.payment.create({
        data: {
          orderId: order.id,
          method: pMethod,
          status: PaymentStatus.SUCCESS,
          amount: order.total,
          transactionRef: `TRX-${order.id.substring(0, 8).toUpperCase()}-${pMethod}`,
          createdAt
        }
      });
    } else if (status === OrderStatus.PENDING) {
      await prisma.payment.create({
        data: {
          orderId: order.id,
          method: pMethod,
          status: PaymentStatus.PENDING,
          amount: order.total,
          transactionRef: `PEND-${order.id.substring(0, 8).toUpperCase()}`,
          createdAt
        }
      });
    }
    totalOrdersCreated++;
  }
  console.log(`\u2705 ${totalOrdersCreated} \xD3rdenes y Ventas hist\xF3ricas generadas con items y pagos`);
  const promosData = [
    {
      name: "Descuento Temporada Verano",
      code: "VERANO2026",
      description: "15% de descuento en prendas de la colecci\xF3n de verano",
      discountPercent: 15,
      minPurchaseAmount: 200,
      startDate: /* @__PURE__ */ new Date("2026-01-01"),
      endDate: /* @__PURE__ */ new Date("2026-04-30"),
      isActive: true
    },
    {
      name: "Cup\xF3n Bienvenida Digital",
      code: "BIENVENIDA10",
      description: "10% de descuento en tu primera compra en l\xEDnea",
      discountPercent: 10,
      minPurchaseAmount: 100,
      startDate: /* @__PURE__ */ new Date("2026-01-01"),
      endDate: /* @__PURE__ */ new Date("2026-12-31"),
      isActive: true
    },
    {
      name: "Promoci\xF3n Gala & Noche",
      code: "GALA25",
      description: "25% de descuento en vestidos y sastrer\xEDa por compras mayores a 500 Bs",
      discountPercent: 25,
      minPurchaseAmount: 500,
      startDate: /* @__PURE__ */ new Date("2026-02-01"),
      endDate: /* @__PURE__ */ new Date("2026-06-30"),
      isActive: true
    },
    {
      name: "Descuento Mayorista VIP",
      code: "WHOLESALEVIP",
      description: "20% adicional en compras por volumen para boutiques asociadas",
      discountPercent: 20,
      minPurchaseAmount: 1500,
      startDate: /* @__PURE__ */ new Date("2026-01-01"),
      endDate: /* @__PURE__ */ new Date("2026-12-31"),
      isActive: true
    },
    {
      name: "Black Friday Anticipado",
      code: "BLACKFRIDAY",
      description: "30% en toda la tienda en fecha especial",
      discountPercent: 30,
      minPurchaseAmount: 300,
      startDate: /* @__PURE__ */ new Date("2025-11-20"),
      endDate: /* @__PURE__ */ new Date("2025-11-30"),
      isActive: false
    }
  ];
  for (const p of promosData) {
    await prisma.promotion.upsert({
      where: { code: p.code },
      update: p,
      create: p
    });
  }
  console.log(`\u2705 ${promosData.length} Promociones y cupones configurados`);
  console.log("\n\u{1F389} ============================================================");
  console.log("\u2728 SEED MASIVO COMPLETADO CON \xC9XITO \u2728");
  console.log("\u{1F4CA} La base de datos ahora contiene datos ricos y realistas:");
  console.log(`   - ${branches.length} Sucursales en 3 Ciudades (LP, SC, CBBA)`);
  console.log(`   - ${clientUsers.length} Clientes (Minoristas y Mayoristas)`);
  console.log(`   - ${productsSeed.length} Modelos de Prendas y ${allVariants.length} Variantes`);
  console.log(`   - Stock distribuido con alertas de stock cr\xEDtico`);
  console.log(`   - ${movementsData.length} Movimientos de inventario`);
  console.log(`   - ${resIndex} Reservas con m\xFAltiples estados`);
  console.log(`   - ${totalOrdersCreated} \xD3rdenes y Ventas con pagos asociados`);
  console.log(`   - ${promosData.length} Promociones`);
  console.log("============================================================\n");
}
main().catch((e) => {
  console.error("\u274C Error ejecutando seed:", e);
  process.exit(1);
}).finally(async () => {
  await prisma.$disconnect();
});
