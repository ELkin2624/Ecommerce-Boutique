import {
  Injectable,
  BadRequestException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service.js';
import {
  QueryStockDto,
  TransferStockDto,
  AdjustStockDto,
  QueryMovementsDto,
} from '../dto/inventory.dto.js';

@Injectable()
export class InventoryService {
  constructor(private readonly prisma: PrismaService) {}

  async getStock(query: QueryStockDto) {
    const {
      branchId,
      locationId,
      variantId,
      variantIds,
      lowStockOnly,
      page = 1,
      limit = 20,
    } = query;

    const where: Prisma.InventoryStockWhereInput = {};

    if (locationId) {
      where.locationId = locationId;
    } else if (branchId) {
      where.location = { branchId };
    }

    if (variantId) {
      where.variantId = variantId;
    } else if (variantIds && variantIds.length > 0) {
      where.variantId = { in: variantIds };
    }

    if (lowStockOnly) {
      // Stock menor o igual al stock mínimo
      // Nota: En Prisma, comparaciones entre dos columnas directas en where usan filter en memoria o raw query
      // Hacemos el take y filtramos o traemos stock bajo de forma limpia
    }

    const [total, stocks] = await Promise.all([
      this.prisma.inventoryStock.count({ where }),
      this.prisma.inventoryStock.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        include: {
          location: {
            include: {
              branch: {
                select: { id: true, name: true, city: true },
              },
            },
          },
          variant: {
            select: {
              id: true,
              sku: true,
              size: true,
              color: true,
              price: true,
              product: {
                select: { id: true, name: true },
              },
            },
          },
        },
        orderBy: [{ location: { branchId: 'asc' } }, { variantId: 'asc' }],
      }),
    ]);

    const items = stocks.map((s) => ({
      id: s.id,
      variantId: s.variantId,
      productName: s.variant.product.name,
      sku: s.variant.sku,
      size: s.variant.size,
      color: s.variant.color,
      price: Number(s.variant.price),
      locationId: s.locationId,
      locationName: s.location.name,
      locationType: s.location.type,
      branchId: s.location.branchId,
      branchName: s.location.branch.name,
      cityName: s.location.branch.city.name,
      quantity: s.quantity,
      minStock: s.minStock,
      isLowStock: s.quantity <= s.minStock,
    }));

    const filteredItems = lowStockOnly
      ? items.filter((item) => item.isLowStock)
      : items;

    return {
      items: filteredItems,
      meta: {
        total: lowStockOnly ? filteredItems.length : total,
        page,
        limit,
        totalPages: Math.ceil(
          (lowStockOnly ? filteredItems.length : total) / limit,
        ),
      },
    };
  }

  async transferStock(dto: TransferStockDto, userId: string) {
    if (dto.fromLocationId === dto.toLocationId) {
      throw new BadRequestException(
        'La ubicación de origen y destino no pueden ser iguales',
      );
    }

    return this.prisma.$transaction(async (tx) => {
      // 1. Decremento atómico condicional con protección contra condición de carrera
      const updatedSource = await tx.inventoryStock.updateMany({
        where: {
          variantId: dto.variantId,
          locationId: dto.fromLocationId,
          quantity: { gte: dto.quantity },
        },
        data: {
          quantity: { decrement: dto.quantity },
        },
      });

      if (updatedSource.count === 0) {
        throw new BadRequestException(
          `Stock insuficiente en la ubicación de origen para la variante solicitada`,
        );
      }

      // 2. Incremento / creación en ubicación destino
      await tx.inventoryStock.upsert({
        where: {
          variantId_locationId: {
            variantId: dto.variantId,
            locationId: dto.toLocationId,
          },
        },
        create: {
          variantId: dto.variantId,
          locationId: dto.toLocationId,
          quantity: dto.quantity,
        },
        update: {
          quantity: { increment: dto.quantity },
        },
      });

      // 3. Registro inmutable de movimiento en Kardex
      const movement = await tx.inventoryMovement.create({
        data: {
          variantId: dto.variantId,
          fromLocationId: dto.fromLocationId,
          toLocationId: dto.toLocationId,
          quantity: dto.quantity,
          type: 'TRANSFER',
          reason: dto.reason ?? 'Transferencia entre ubicaciones',
          userId,
        },
      });

      return {
        success: true,
        message: 'Transferencia realizada con éxito',
        movementId: movement.id,
        variantId: dto.variantId,
        quantityTransferred: dto.quantity,
      };
    });
  }

  async adjustStock(dto: AdjustStockDto, userId: string) {
    return this.prisma.$transaction(async (tx) => {
      // 1. Buscar o crear stock actual
      const currentStock = await tx.inventoryStock.upsert({
        where: {
          variantId_locationId: {
            variantId: dto.variantId,
            locationId: dto.locationId,
          },
        },
        create: {
          variantId: dto.variantId,
          locationId: dto.locationId,
          quantity: dto.newQuantity,
        },
        update: {
          quantity: dto.newQuantity,
        },
      });

      // 2. Registrar movimiento inmutable de ajuste
      const movement = await tx.inventoryMovement.create({
        data: {
          variantId: dto.variantId,
          toLocationId: dto.locationId,
          quantity: dto.newQuantity,
          type: 'ADJUSTMENT',
          reason: dto.reason,
          userId,
        },
      });

      return {
        success: true,
        message: 'Ajuste de inventario registrado',
        currentQuantity: currentStock.quantity,
        movementId: movement.id,
      };
    });
  }

  async getMovements(query: QueryMovementsDto) {
    const { variantId, type, locationId, page = 1, limit = 20 } = query;

    const where: Prisma.InventoryMovementWhereInput = {};
    if (variantId) where.variantId = variantId;
    if (type) where.type = type;
    if (locationId) {
      where.OR = [
        { fromLocationId: locationId },
        { toLocationId: locationId },
      ];
    }

    const [total, movements] = await Promise.all([
      this.prisma.inventoryMovement.count({ where }),
      this.prisma.inventoryMovement.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          variant: {
            select: {
              sku: true,
              size: true,
              color: true,
              product: { select: { name: true } },
            },
          },
          fromLocation: { select: { name: true, type: true } },
          toLocation: { select: { name: true, type: true } },
          user: { select: { firstName: true, lastName: true, email: true } },
        },
      }),
    ]);

    return {
      items: movements.map((m) => ({
        id: m.id,
        variantId: m.variantId,
        productName: m.variant.product.name,
        sku: m.variant.sku,
        size: m.variant.size,
        color: m.variant.color,
        fromLocation: m.fromLocation?.name ?? null,
        toLocation: m.toLocation?.name ?? null,
        quantity: m.quantity,
        type: m.type,
        reason: m.reason,
        performedBy: `${m.user.firstName} ${m.user.lastName}`,
        createdAt: m.createdAt,
      })),
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getLocations(branchId?: string) {
    return this.prisma.inventoryLocation.findMany({
      where: branchId ? { branchId } : {},
      include: {
        branch: { select: { id: true, name: true, city: true } },
      },
      orderBy: [{ branchId: 'asc' }, { type: 'asc' }],
    });
  }
}
