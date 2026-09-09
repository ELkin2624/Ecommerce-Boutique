---
title: Modelo de Datos Empresarial con Prisma ORM
aliases: [Modelo de Datos, Prisma, Esquema, DB]
tags: [prisma, postgresql, database, ddd, inventory, variants]
created: 2026-09-09
---

# 🗄️ 02. MODELO DE DATOS EMPRESARIAL CON PRISMA ORM

> Enlace principal: [[00_INDEX_CEREBRO]] | Arquitectura: [[01_ARQUITECTURA_Y_REGLAS]]

---

## 1. Principios del Modelo de Dominio en Moda

El error más común en e-commerce de ropa es modelar `Product -> Stock`. En una tienda de moda profesional se modela obligatoriamente:
- **Producto Genérico**: Define el concepto (`Vestido Elegance`, descripción, categoría, temporada, marca).
- **Variante de Producto (`ProductVariant`)**: Define la entidad comercial física vendible (`Vestido Elegance - Rojo / M`), con su propio SKU, precio, costo y código de barra.
- **Stock por Ubicación**: El stock no pertenece a la "sucursal" genérica, sino a una **Ubicación Física** (`Almacén Central`, `Piso de Venta Sucursal Centro`).

---

## 2. Diagrama Entidad-Relación Conceptual

```text
┌─────────────────┐       1:N       ┌─────────────────────┐
│     Product     ├────────────────►│   ProductVariant    │
│ (Nombre, Marca, │                 │ (SKU, Talla, Color, │
│  Categoría)     │                 │  Precio, Costo)     │
└────────┬────────┘                 └──────────┬──────────┘
         │ 1:N                                 │ 1:N
         ▼                                     ▼
┌─────────────────┐                 ┌─────────────────────┐
│  ProductImage   │                 │   InventoryStock    │
└─────────────────┘                 │ (quantity, min)     │
                                    └──────────▲──────────┘
                                               │ N:1
┌─────────────────┐       1:N       ┌──────────┴──────────┐
│     Branch      ├────────────────►│  InventoryLocation  │
│ (Sucursal Física│                 │ (Almacén vs         │
│  por Ciudad)    │                 │  Piso de Ventas)    │
└─────────────────┘                 └─────────────────────┘
```

---

## 3. Esquema Prisma Declarativo (`schema.prisma`)

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

// ==========================================
// 1. SEGURIDAD Y RBAC
// ==========================================

model User {
  id           String         @id @default(uuid())
  email        String         @unique
  passwordHash String         @map("password_hash")
  firstName    String         @map("first_name")
  lastName     String         @map("last_name")
  phone        String?
  isActive     Boolean        @default(true) @map("is_active")
  createdAt    DateTime       @default(now()) @map("created_at")
  updatedAt    DateTime       @updatedAt @map("updated_at")

  roles        UserRole[]
  reservations Reservation[]
  orders       Order[]
  movements    InventoryMovement[]

  @@map("users")
}

model Role {
  id          String           @id @default(uuid())
  name        String           @unique // ADMIN, MANAGER, CASHIER, CLIENT
  description String?
  users       UserRole[]
  permissions RolePermission[]

  @@map("roles")
}

model Permission {
  id          String           @id @default(uuid())
  code        String           @unique // RESOURCE:ACTION (ej. INVENTORY:TRANSFER)
  description String?
  roles       RolePermission[]

  @@map("permissions")
}

model UserRole {
  userId String @map("user_id")
  roleId String @map("role_id")
  user   User   @relation(fields: [userId], references: [id], onDelete: Cascade)
  role   Role   @relation(fields: [roleId], references: [id], onDelete: Cascade)

  @@id([userId, roleId])
  @@map("user_roles")
}

model RolePermission {
  roleId       String     @map("role_id")
  permissionId String     @map("permission_id")
  role         Role       @relation(fields: [roleId], references: [id], onDelete: Cascade)
  permission   Permission @relation(fields: [permissionId], references: [id], onDelete: Cascade)

  @@id([roleId, permissionId])
  @@map("role_permissions")
}

// ==========================================
// 2. CATÁLOGO Y VARIANTES
// ==========================================

model Category {
  id        String    @id @default(uuid())
  name      String    @unique
  slug      String    @unique
  products  Product[]

  @@map("categories")
}

model Season {
  id        String    @id @default(uuid())
  name      String    // Verano 2026, Invierno 2026
  startDate DateTime? @map("start_date")
  endDate   DateTime? @map("end_date")
  products  Product[]

  @@map("seasons")
}

model Product {
  id          String           @id @default(uuid())
  name        String
  description String?
  brand       String           @default("FashionStore")
  categoryId  String           @map("category_id")
  seasonId    String?          @map("season_id")
  isActive    Boolean          @default(true) @map("is_active")
  createdAt   DateTime         @default(now()) @map("created_at")

  category    Category         @relation(fields: [categoryId], references: [id])
  season      Season?          @relation(fields: [seasonId], references: [id])
  variants    ProductVariant[]
  images      ProductImage[]

  @@map("products")
}

model ProductVariant {
  id               String            @id @default(uuid())
  productId        String            @map("product_id")
  sku              String            @unique
  size             String            // XS, S, M, L, XL, 38, 40
  color            String            // Rojo, Negro, Azul Marino
  price            Decimal           @db.Decimal(10, 2)
  cost             Decimal           @db.Decimal(10, 2)
  measurementsJson Json?             @map("measurements_json") // Hombros, cintura, etc. para IA
  isActive         Boolean           @default(true) @map("is_active")

  product          Product           @relation(fields: [productId], references: [id], onDelete: Cascade)
  stocks           InventoryStock[]
  reservationItems ReservationItem[]
  orderItems       OrderItem[]
  movements        InventoryMovement[]

  @@map("product_variants")
}

model ProductImage {
  id        String   @id @default(uuid())
  productId String   @map("product_id")
  imageUrl  String   @map("image_url")
  isCover   Boolean  @default(false) @map("is_cover")
  sortOrder Int      @default(0) @map("sort_order")

  product   Product  @relation(fields: [productId], references: [id], onDelete: Cascade)

  @@map("product_images")
}

// ==========================================
// 3. SUCURSALES, ALMACENES E INVENTARIO
// ==========================================

model Branch {
  id           String              @id @default(uuid())
  name         String              // Sucursal Central, Sucursal Norte
  city         String
  address      String
  phone        String?
  locations    InventoryLocation[]
  reservations Reservation[]
  orders       Order[]

  @@map("branches")
}

enum LocationType {
  WAREHOUSE    // Depósito interno
  SALES_FLOOR  // Piso de venta / Tienda física
}

model InventoryLocation {
  id        String           @id @default(uuid())
  branchId  String           @map("branch_id")
  name      String           // Ej: Almacén Principal, Mostrador
  type      LocationType     @default(SALES_FLOOR)

  branch    Branch           @relation(fields: [branchId], references: [id], onDelete: Cascade)
  stocks    InventoryStock[]
  movementsFrom InventoryMovement[] @relation("FromLocation")
  movementsTo   InventoryMovement[] @relation("ToLocation")

  @@map("inventory_locations")
}

model InventoryStock {
  id         String            @id @default(uuid())
  variantId  String            @map("variant_id")
  locationId String            @map("location_id")
  quantity   Int               @default(0)
  minStock   Int               @default(5) @map("min_stock")
  updatedAt  DateTime          @updatedAt @map("updated_at")

  variant    ProductVariant    @relation(fields: [variantId], references: [id], onDelete: Cascade)
  location   InventoryLocation @relation(fields: [locationId], references: [id], onDelete: Cascade)

  @@unique([variantId, locationId])
  @@map("inventory_stocks")
}

enum MovementType {
  PURCHASE_RECEIPT     // Ingreso por compra a proveedor
  TRANSFER             // Traslado entre sucursales/ubicaciones
  RESERVATION_HOLD     // Retención temporal por reserva
  RESERVATION_RELEASE  // Liberación por reserva expirada/cancelada
  SALE                 // Salida por venta realizada
  RETURN               // Reingreso por devolución
  ADJUSTMENT           // Ajuste por inventario físico / merma
}

model InventoryMovement {
  id             String             @id @default(uuid())
  variantId      String             @map("variant_id")
  fromLocationId String?            @map("from_location_id")
  toLocationId   String?            @map("to_location_id")
  quantity       Int
  type           MovementType
  reason         String?
  userId         String             @map("user_id")
  createdAt      DateTime           @default(now()) @map("created_at")

  variant        ProductVariant     @relation(fields: [variantId], references: [id])
  fromLocation   InventoryLocation? @relation("FromLocation", fields: [fromLocationId], references: [id])
  toLocation     InventoryLocation? @relation("ToLocation", fields: [toLocationId], references: [id])
  user           User               @relation(fields: [userId], references: [id])

  @@map("inventory_movements")
}

// ==========================================
// 4. RESERVAS (PROBADOR FÍSICO)
// ==========================================

enum ReservationStatus {
  PENDING    // Solicitada desde la web/móvil
  CONFIRMED  // Confirmada por la tienda
  PREPARED   // Prendas separadas físicamente en probador
  READY      // Cliente notificado, listo para probar
  COMPLETED  // Cliente asistió y compró (o parte)
  CANCELLED  // Cliente canceló
  EXPIRED    // Expiró el tiempo de tolerancia (stock liberado)
}

model Reservation {
  id         String            @id @default(uuid())
  userId     String            @map("user_id")
  branchId   String            @map("branch_id")
  status     ReservationStatus @default(PENDING)
  expiresAt  DateTime          @map("expires_at")
  notes      String?
  createdAt  DateTime          @default(now()) @map("created_at")
  updatedAt  DateTime          @updatedAt @map("updated_at")

  user       User              @relation(fields: [userId], references: [id])
  branch     Branch            @relation(fields: [branchId], references: [id])
  items      ReservationItem[]

  @@map("reservations")
}

model ReservationItem {
  id            String         @id @default(uuid())
  reservationId String         @map("reservation_id")
  variantId     String         @map("variant_id")
  quantity      Int            @default(1)

  reservation   Reservation    @relation(fields: [reservationId], references: [id], onDelete: Cascade)
  variant       ProductVariant @relation(fields: [variantId], references: [id])

  @@map("reservation_items")
}

// ==========================================
// 5. VENTAS, PEDIDOS Y PAGOS
// ==========================================

enum OrderType {
  ONLINE     // Pedido por Web o App
  IN_STORE   // Venta física en sucursal (POS)
}

enum OrderStatus {
  PENDING
  PAID
  DELIVERED
  CANCELLED
}

model Order {
  id         String      @id @default(uuid())
  userId     String      @map("user_id")
  branchId   String      @map("branch_id")
  type       OrderType   @default(ONLINE)
  status     OrderStatus @default(PENDING)
  total      Decimal     @db.Decimal(10, 2)
  createdAt  DateTime    @default(now()) @map("created_at")

  user       User        @relation(fields: [userId], references: [id])
  branch     Branch      @relation(fields: [branchId], references: [id])
  items      OrderItem[]
  payments   Payment[]

  @@map("orders")
}

model OrderItem {
  id        String         @id @default(uuid())
  orderId   String         @map("order_id")
  variantId String         @map("variant_id")
  quantity  Int
  unitPrice Decimal        @map("unit_price") @db.Decimal(10, 2)

  order     Order          @relation(fields: [orderId], references: [id], onDelete: Cascade)
  variant   ProductVariant @relation(fields: [variantId], references: [id])

  @@map("order_items")
}

enum PaymentMethod {
  CASH
  CARD
  QR
  GATEWAY
}

enum PaymentStatus {
  PENDING
  SUCCESS
  FAILED
}

model Payment {
  id             String        @id @default(uuid())
  orderId        String        @map("order_id")
  method         PaymentMethod
  status         PaymentStatus @default(PENDING)
  amount         Decimal       @db.Decimal(10, 2)
  transactionRef String?       @map("transaction_ref")
  createdAt      DateTime      @default(now()) @map("created_at")

  order          Order         @relation(fields: [orderId], references: [id])

  @@map("payments")
}
```

---

## 4. Próximos Enlaces en el Grafo
- Continuar hacia el corazón del parcial: [[03_IA_MOTOR_PARCIAL]].
- Ver el plan de ejecución por fases: [[04_ROADMAP_FASES]].
