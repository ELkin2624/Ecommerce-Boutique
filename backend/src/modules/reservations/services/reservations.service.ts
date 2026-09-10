import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { Prisma, ReservationStatus } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service.js';
import {
  CreateReservationDto,
  UpdateReservationStatusDto,
  QueryReservationsDto,
} from '../dto/reservations.dto.js';

@Injectable()
export class ReservationsService {
  constructor(private readonly prisma: PrismaService) {}

  async createReservation(userId: string, dto: CreateReservationDto) {
    if (!dto.items || dto.items.length === 0) {
      throw new BadRequestException(
        'La reserva debe incluir al menos una prenda',
      );
    }

    // 1. Obtener la ubicación SALES_FLOOR de la sucursal elegida
    const salesFloor = await this.prisma.inventoryLocation.findFirst({
      where: {
        branchId: dto.branchId,
        type: 'SALES_FLOOR',
      },
    });

    if (!salesFloor) {
      throw new NotFoundException(
        `No se encontró piso de venta (SALES_FLOOR) para la sucursal seleccionada`,
      );
    }

    return this.prisma.$transaction(async (tx) => {
      // 2. Consulta agrupada de stock (Cero consultas de lectura individuales en iteraciones)
      const variantIds = dto.items.map((i) => i.variantId);
      const stocks = await tx.inventoryStock.findMany({
        where: {
          variantId: { in: variantIds },
          locationId: salesFloor.id,
        },
        include: {
          variant: { select: { id: true, sku: true } },
        },
      });

      // 3. Validación en memoria de disponibilidad de stock
      const stockMap = new Map(stocks.map((s) => [s.variantId, s.quantity]));
      for (const item of dto.items) {
        const available = stockMap.get(item.variantId) ?? 0;
        if (available < item.quantity) {
          throw new BadRequestException(
            `Stock insuficiente en tienda física para la variante con ID ${item.variantId} (disponible: ${available}, solicitado: ${item.quantity})`,
          );
        }
      }

      // 4. Decremento atómico y registro inmutable RESERVATION_HOLD
      for (const item of dto.items) {
        const updated = await tx.inventoryStock.updateMany({
          where: {
            variantId: item.variantId,
            locationId: salesFloor.id,
            quantity: { gte: item.quantity },
          },
          data: {
            quantity: { decrement: item.quantity },
          },
        });

        if (updated.count === 0) {
          throw new BadRequestException(
            `Conflicto de concurrencia: el stock de la variante ${item.variantId} cambió durante la operación`,
          );
        }

        await tx.inventoryMovement.create({
          data: {
            variantId: item.variantId,
            fromLocationId: salesFloor.id,
            quantity: item.quantity,
            type: 'RESERVATION_HOLD',
            reason: `Retención para probador físico en sucursal`,
            userId,
          },
        });
      }

      // 5. Semántica limpia de expiración: retención de 48 horas desde la creación
      const expiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000);

      // 6. Crear la Reserva con sus ítems en lote
      const reservation = await tx.reservation.create({
        data: {
          userId,
          branchId: dto.branchId,
          status: 'PENDING',
          expiresAt,
          notes: dto.notes,
          items: {
            createMany: {
              data: dto.items.map((i) => ({
                variantId: i.variantId,
                quantity: i.quantity,
              })),
            },
          },
        },
        include: {
          items: {
            include: {
              variant: {
                select: {
                  id: true,
                  sku: true,
                  size: true,
                  color: true,
                  price: true,
                  product: { select: { name: true } },
                },
              },
            },
          },
          branch: { select: { id: true, name: true, address: true } },
        },
      });

      return {
        ...reservation,
        items: reservation.items.map((it) => ({
          id: it.id,
          variantId: it.variantId,
          sku: it.variant.sku,
          productName: it.variant.product.name,
          size: it.variant.size,
          color: it.variant.color,
          price: Number(it.variant.price),
          quantity: it.quantity,
        })),
      };
    });
  }

  async cancelReservation(
    reservationId: string,
    userId: string,
    isAdminOrStaff: boolean = false,
  ) {
    return this.prisma.$transaction(async (tx) => {
      // Regla de oro: Claim atómico condicional para evitar doble cancelación o colisión con cron
      const activeStatuses: ReservationStatus[] = [
        'PENDING',
        'CONFIRMED',
        'PREPARED',
        'READY',
      ];

      const whereClause: Prisma.ReservationWhereInput = {
        id: reservationId,
        status: { in: activeStatuses },
      };

      if (!isAdminOrStaff) {
        whereClause.userId = userId;
      }

      const claim = await tx.reservation.updateMany({
        where: whereClause,
        data: { status: 'CANCELLED' },
      });

      if (claim.count !== 1) {
        throw new BadRequestException(
          'La reserva no se puede cancelar porque ya fue cancelada, completada, expirada o no pertenece al usuario',
        );
      }

      // Solo si count === 1 procedemos a liberar el stock
      const reservation = await tx.reservation.findUniqueOrThrow({
        where: { id: reservationId },
        include: {
          items: true,
          branch: {
            include: {
              locations: { where: { type: 'SALES_FLOOR' } },
            },
          },
        },
      });

      const salesFloor = reservation.branch.locations[0];
      if (salesFloor) {
        for (const item of reservation.items) {
          await tx.inventoryStock.upsert({
            where: {
              variantId_locationId: {
                variantId: item.variantId,
                locationId: salesFloor.id,
              },
            },
            create: {
              variantId: item.variantId,
              locationId: salesFloor.id,
              quantity: item.quantity,
            },
            update: {
              quantity: { increment: item.quantity },
            },
          });

          await tx.inventoryMovement.create({
            data: {
              variantId: item.variantId,
              toLocationId: salesFloor.id,
              quantity: item.quantity,
              type: 'RESERVATION_RELEASE',
              reason: `Liberación por cancelación de reserva ${reservationId}`,
              userId,
            },
          });
        }
      }

      return {
        success: true,
        message: 'Reserva cancelada y stock liberado en piso de venta',
        reservationId,
      };
    });
  }

  async updateStatus(
    reservationId: string,
    dto: UpdateReservationStatusDto,
    staffUserId: string,
  ) {
    if (dto.status === 'CANCELLED') {
      return this.cancelReservation(reservationId, staffUserId, true);
    }

    return this.prisma.$transaction(async (tx) => {
      const activeStatuses: ReservationStatus[] = [
        'PENDING',
        'CONFIRMED',
        'PREPARED',
        'READY',
      ];

      const claim = await tx.reservation.updateMany({
        where: {
          id: reservationId,
          status: { in: activeStatuses },
        },
        data: {
          status: dto.status,
          notes: dto.notes,
        },
      });

      if (claim.count !== 1) {
        throw new BadRequestException(
          `No se pudo actualizar el estado a ${dto.status}. La reserva no está activa o ya fue finalizada`,
        );
      }

      return tx.reservation.findUnique({
        where: { id: reservationId },
        include: {
          items: {
            include: {
              variant: {
                select: {
                  sku: true,
                  size: true,
                  color: true,
                  product: { select: { name: true } },
                },
              },
            },
          },
          branch: { select: { id: true, name: true } },
        },
      });
    });
  }

  async getUserReservations(userId: string) {
    const reservations = await this.prisma.reservation.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: {
        branch: { select: { id: true, name: true, address: true } },
        items: {
          include: {
            variant: {
              select: {
                id: true,
                sku: true,
                size: true,
                color: true,
                price: true,
                product: { select: { id: true, name: true } },
              },
            },
          },
        },
      },
    });

    return reservations.map((r) => ({
      id: r.id,
      status: r.status,
      branchName: r.branch.name,
      branchAddress: r.branch.address,
      expiresAt: r.expiresAt,
      createdAt: r.createdAt,
      items: r.items.map((it) => ({
        variantId: it.variantId,
        productName: it.variant.product.name,
        sku: it.variant.sku,
        size: it.variant.size,
        color: it.variant.color,
        price: Number(it.variant.price),
        quantity: it.quantity,
      })),
    }));
  }

  async getBranchReservations(query: QueryReservationsDto) {
    const { branchId, status, page = 1, limit = 20 } = query;

    const where: Prisma.ReservationWhereInput = {};
    if (branchId) where.branchId = branchId;
    if (status) where.status = status;

    const [total, reservations] = await Promise.all([
      this.prisma.reservation.count({ where }),
      this.prisma.reservation.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: [{ status: 'asc' }, { createdAt: 'desc' }],
        include: {
          user: {
            select: { firstName: true, lastName: true, email: true, phone: true },
          },
          branch: { select: { id: true, name: true } },
          items: {
            include: {
              variant: {
                select: {
                  sku: true,
                  size: true,
                  color: true,
                  product: { select: { name: true } },
                },
              },
            },
          },
        },
      }),
    ]);

    return {
      items: reservations.map((r) => ({
        id: r.id,
        client: `${r.user.firstName} ${r.user.lastName}`,
        email: r.user.email,
        phone: r.user.phone,
        branchName: r.branch.name,
        status: r.status,
        expiresAt: r.expiresAt,
        createdAt: r.createdAt,
        itemsCount: r.items.length,
        items: r.items.map((it) => ({
          sku: it.variant.sku,
          productName: it.variant.product.name,
          size: it.variant.size,
          color: it.variant.color,
          quantity: it.quantity,
        })),
      })),
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
}
