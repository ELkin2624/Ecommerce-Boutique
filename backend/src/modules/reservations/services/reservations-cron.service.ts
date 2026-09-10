import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { ReservationStatus } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service.js';

@Injectable()
export class ReservationsCronService {
  private readonly logger = new Logger(ReservationsCronService.name);

  constructor(private readonly prisma: PrismaService) {}

  @Cron(CronExpression.EVERY_MINUTE)
  async handleExpiredReservations() {
    const now = new Date();
    const activeStatuses: ReservationStatus[] = [
      'PENDING',
      'CONFIRMED',
      'PREPARED',
      'READY',
    ];

    // 1. Buscar candidatos a expiración con proyección controlada
    const candidates = await this.prisma.reservation.findMany({
      where: {
        status: { in: activeStatuses },
        expiresAt: { lt: now },
      },
      select: {
        id: true,
        userId: true,
        branchId: true,
        items: {
          select: {
            variantId: true,
            quantity: true,
          },
        },
        branch: {
          select: {
            locations: {
              where: { type: 'SALES_FLOOR' },
              select: { id: true },
            },
          },
        },
      },
      take: 50, // Proceso por lotes controlado
    });

    if (candidates.length === 0) {
      return;
    }

    this.logger.log(
      `Procesando ${candidates.length} reservas potencialmente vencidas...`,
    );

    let releasedCount = 0;

    for (const res of candidates) {
      const salesFloor = res.branch.locations[0];
      if (!salesFloor) {
        this.logger.warn(
          `Reserva ${res.id} no tiene ubicación SALES_FLOOR configurada en sucursal ${res.branchId}`,
        );
        continue;
      }

      try {
        await this.prisma.$transaction(async (tx) => {
          // 2. Claim atómico condicional: Garantiza que si 2 instancias de NestJS corren el cron,
          // o si el usuario cancela en el mismo milisegundo, solo UNA gana el claim.
          const claim = await tx.reservation.updateMany({
            where: {
              id: res.id,
              status: { in: activeStatuses },
              expiresAt: { lt: now },
            },
            data: {
              status: 'EXPIRED',
            },
          });

          // Regla crítica: NUNCA liberar stock si el updateMany no afectó exactamente una fila
          if (claim.count !== 1) {
            return;
          }

          // 3. Liberación segura de stock al piso de venta
          for (const item of res.items) {
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
                reason: `Liberación automática por expiración de reserva ${res.id}`,
                userId: res.userId,
              },
            });
          }

          releasedCount++;
        });
      } catch (err: any) {
        this.logger.error(
          `Error liberando reserva vencida ${res.id}: ${err.message}`,
          err.stack,
        );
      }
    }

    if (releasedCount > 0) {
      this.logger.log(
        `✅ ${releasedCount} reservas expiradas y stock restaurado en piso de venta`,
      );
    }
  }
}
