import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import {
  Prisma,
  OrderType,
  PaymentMethod,
  OrderStatus,
  PaymentStatus,
} from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service.js';
import { CheckoutDto, QueryOrdersDto } from '../dto/orders.dto.js';

@Injectable()
export class OrdersService {
  constructor(private readonly prisma: PrismaService) {}

  async checkout(userId: string, dto: CheckoutDto) {
    // 1. Verificación de idempotencia: Prevenir doble cargo si el cliente presiona pagar varias veces
    if (dto.idempotencyKey) {
      const existingOrder = await this.prisma.order.findUnique({
        where: { idempotencyKey: dto.idempotencyKey },
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
          payments: true,
          branch: { select: { id: true, name: true } },
        },
      });

      if (existingOrder) {
        return {
          ...existingOrder,
          total: Number(existingOrder.total),
          idempotentReplay: true,
        };
      }
    }

    // 2. Validación de combinaciones de tipo de orden y método de pago
    if (dto.type === OrderType.ONLINE) {
      if (dto.paymentMethod === PaymentMethod.CASH) {
        throw new BadRequestException(
          'El método de pago CASH (efectivo) no está permitido para compras ONLINE',
        );
      }
    } else if (dto.type === OrderType.IN_STORE) {
      if (dto.paymentMethod === PaymentMethod.GATEWAY) {
        throw new BadRequestException(
          'El método GATEWAY solo es válido para compras de la tienda digital ONLINE',
        );
      }
    }

    // 3. Reglas de estados de orden y pago según canal
    let orderStatus: OrderStatus = OrderStatus.PENDING;
    let paymentStatus: PaymentStatus = PaymentStatus.PENDING;

    if (dto.type === OrderType.IN_STORE) {
      orderStatus = OrderStatus.PAID;
      paymentStatus = PaymentStatus.SUCCESS;
    } else {
      // ONLINE
      orderStatus = OrderStatus.PENDING;
      paymentStatus = PaymentStatus.PENDING;
    }

    // 4. Obtener ubicación SALES_FLOOR de la sucursal seleccionada
    const salesFloor = await this.prisma.inventoryLocation.findFirst({
      where: {
        branchId: dto.branchId,
        type: 'SALES_FLOOR',
      },
    });

    if (!salesFloor) {
      throw new NotFoundException(
        `No se encontró ubicación de piso de venta para la sucursal seleccionada`,
      );
    }

    return this.prisma.$transaction(async (tx) => {
      let itemsToProcess: { variantId: string; quantity: number }[] = [];
      let isFromReservation = false;

      // CASO A: Venta generada a partir de una reserva en probador (COMPLETED)
      if (dto.fromReservationId) {
        isFromReservation = true;
        const claim = await tx.reservation.updateMany({
          where: {
            id: dto.fromReservationId,
            status: { in: ['PENDING', 'CONFIRMED', 'PREPARED', 'READY'] },
          },
          data: { status: 'COMPLETED' },
        });

        if (claim.count !== 1) {
          throw new BadRequestException(
            'La reserva indicada no está activa o ya fue finalizada',
          );
        }

        const reservation = await tx.reservation.findUniqueOrThrow({
          where: { id: dto.fromReservationId },
          include: { items: true },
        });

        itemsToProcess = reservation.items.map((i) => ({
          variantId: i.variantId,
          quantity: i.quantity,
        }));
      } else if (dto.items && dto.items.length > 0) {
        // CASO B1: Ítems enviados directamente en la petición (ej. venta en mostrador)
        itemsToProcess = dto.items;
      } else {
        // CASO B2: Venta desde el Carrito del usuario
        const cart = await tx.cart.findUnique({
          where: { userId },
          include: { items: true },
        });

        if (!cart || cart.items.length === 0) {
          throw new BadRequestException(
            'El carrito se encuentra vacío y no se enviaron prendas para checkout',
          );
        }

        itemsToProcess = cart.items.map((i) => ({
          variantId: i.variantId,
          quantity: i.quantity,
        }));
      }

      if (itemsToProcess.length === 0) {
        throw new BadRequestException(
          'No hay prendas para procesar en el checkout',
        );
      }

      // 5. Cero consultas N+1: Traer todas las variantes en una sola consulta agrupada
      const variantIds = itemsToProcess.map((i) => i.variantId);
      const variants = await tx.productVariant.findMany({
        where: { id: { in: variantIds }, isActive: true },
      });

      const variantMap = new Map(variants.map((v) => [v.id, v]));

      // 6. Si NO proviene de reserva, validar y decrementar stock físicamente con protección de concurrencia
      if (!isFromReservation) {
        for (const item of itemsToProcess) {
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
              `Stock insuficiente para la variante con ID ${item.variantId} en piso de venta`,
            );
          }

          await tx.inventoryMovement.create({
            data: {
              variantId: item.variantId,
              fromLocationId: salesFloor.id,
              quantity: item.quantity,
              type: 'SALE',
              reason: `Venta directa (${dto.type})`,
              userId,
            },
          });
        }
      } else {
        // Consistencia de Kardex: El stock ya fue retenido en RESERVATION_HOLD.
        // Registramos el movimiento inmutable SALE para auditoría de Kardex sin decrementar stock numérico dos veces.
        for (const item of itemsToProcess) {
          await tx.inventoryMovement.create({
            data: {
              variantId: item.variantId,
              fromLocationId: salesFloor.id,
              quantity: item.quantity,
              type: 'SALE',
              reason: `Venta completada desde reserva probador ${dto.fromReservationId}`,
              userId,
            },
          });
        }
      }

      // 7. Calcular total usando los precios unitarios registrados en la base de datos
      let total = new Prisma.Decimal(0);
      const orderItemsData = itemsToProcess.map((item) => {
        const variant = variantMap.get(item.variantId);
        if (!variant) {
          throw new NotFoundException(
            `Variante con ID ${item.variantId} no encontrada o inactiva`,
          );
        }

        const itemTotal = variant.price.mul(item.quantity);
        total = total.add(itemTotal);

        return {
          variantId: item.variantId,
          quantity: item.quantity,
          unitPrice: variant.price,
        };
      });

      // 8. Crear la Orden y el Pago atómicamente
      const order = await tx.order.create({
        data: {
          userId,
          branchId: dto.branchId,
          type: dto.type,
          status: orderStatus,
          total,
          idempotencyKey: dto.idempotencyKey,
          items: {
            createMany: {
              data: orderItemsData,
            },
          },
          payments: {
            create: {
              method: dto.paymentMethod,
              status: paymentStatus,
              amount: total,
              transactionRef:
                dto.idempotencyKey ?? `TX-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
            },
          },
        },
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
          payments: true,
          branch: { select: { id: true, name: true } },
        },
      });

      // 9. Si la compra provino del carrito, vaciarlo
      if (!dto.fromReservationId && (!dto.items || dto.items.length === 0)) {
        await tx.cartItem.deleteMany({
          where: { cart: { userId } },
        });
      }

      return {
        ...order,
        total: Number(order.total),
        items: order.items.map((it) => ({
          id: it.id,
          variantId: it.variantId,
          sku: it.variant.sku,
          productName: it.variant.product.name,
          size: it.variant.size,
          color: it.variant.color,
          quantity: it.quantity,
          unitPrice: Number(it.unitPrice),
        })),
        payments: order.payments.map((p) => ({
          id: p.id,
          method: p.method,
          status: p.status,
          amount: Number(p.amount),
          transactionRef: p.transactionRef,
        })),
      };
    });
  }

  async getUserOrders(userId: string) {
    const orders = await this.prisma.order.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: {
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
        payments: true,
      },
    });

    return orders.map((o) => ({
      id: o.id,
      type: o.type,
      status: o.status,
      total: Number(o.total),
      branchName: o.branch.name,
      createdAt: o.createdAt,
      items: o.items.map((it) => ({
        variantId: it.variantId,
        sku: it.variant.sku,
        productName: it.variant.product.name,
        size: it.variant.size,
        color: it.variant.color,
        quantity: it.quantity,
        unitPrice: Number(it.unitPrice),
      })),
      payments: o.payments.map((p) => ({
        method: p.method,
        status: p.status,
        amount: Number(p.amount),
        transactionRef: p.transactionRef,
      })),
    }));
  }

  async getOrders(query: QueryOrdersDto) {
    const { userId, branchId, status, type, page = 1, limit = 20 } = query;

    const pageNum = Math.max(1, Number(page) || 1);
    const limitNum = Math.max(1, Math.min(100, Number(limit) || 20));

    const where: Prisma.OrderWhereInput = {};
    if (userId) where.userId = userId;
    if (branchId) where.branchId = branchId;
    if (status) where.status = status;
    if (type) where.type = type;

    const [total, orders] = await Promise.all([
      this.prisma.order.count({ where }),
      this.prisma.order.findMany({
        where,
        skip: (pageNum - 1) * limitNum,
        take: limitNum,
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: { firstName: true, lastName: true, email: true },
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
          payments: true,
        },
      }),
    ]);

    return {
      items: orders.map((o) => ({
        id: o.id,
        client: o.user ? `${o.user.firstName} ${o.user.lastName}` : 'Venta Mostrador',
        email: o.user?.email ?? '',
        type: o.type,
        status: o.status,
        total: Number(o.total),
        branchName: o.branch?.name ?? 'Sucursal',
        createdAt: o.createdAt,
        itemsCount: o.items?.length ?? 0,
        paymentStatus: o.payments?.[0]?.status ?? null,
        paymentMethod: o.payments?.[0]?.method ?? null,
      })),
      meta: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum) || 1,
      },
    };
  }

  async getOrderById(id: string, userId: string, isStaff: boolean = false) {
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: {
        user: { select: { firstName: true, lastName: true, email: true } },
        branch: { select: { id: true, name: true, address: true } },
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
        payments: true,
      },
    });

    if (!order) {
      throw new NotFoundException(`Pedido con ID ${id} no encontrado`);
    }

    if (!isStaff && order.userId !== userId) {
      throw new NotFoundException(`Pedido no encontrado o acceso no autorizado`);
    }

    return {
      ...order,
      total: Number(order.total),
      items: order.items.map((it) => ({
        id: it.id,
        variantId: it.variantId,
        sku: it.variant.sku,
        productName: it.variant.product.name,
        size: it.variant.size,
        color: it.variant.color,
        quantity: it.quantity,
        unitPrice: Number(it.unitPrice),
      })),
      payments: order.payments.map((p) => ({
        id: p.id,
        method: p.method,
        status: p.status,
        amount: Number(p.amount),
        transactionRef: p.transactionRef,
      })),
    };
  }
}
