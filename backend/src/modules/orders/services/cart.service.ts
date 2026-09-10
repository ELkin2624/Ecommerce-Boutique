import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service.js';
import { AddToCartDto, UpdateCartItemDto } from '../dto/cart.dto.js';

@Injectable()
export class CartService {
  constructor(private readonly prisma: PrismaService) {}

  private async getOrCreateCart(userId: string) {
    let cart = await this.prisma.cart.findUnique({
      where: { userId },
    });

    if (!cart) {
      cart = await this.prisma.cart.create({
        data: { userId },
      });
    }

    return cart;
  }

  async getCart(userId: string) {
    const cart = await this.getOrCreateCart(userId);

    const fullCart = await this.prisma.cart.findUnique({
      where: { id: cart.id },
      include: {
        items: {
          include: {
            variant: {
              include: {
                product: {
                  include: {
                    images: {
                      where: { isCover: true },
                      take: 1,
                    },
                  },
                },
                stocks: {
                  select: { quantity: true },
                },
              },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!fullCart) {
      return { items: [], total: 0, itemsCount: 0 };
    }

    let total = 0;
    const items = fullCart.items.map((item) => {
      const price = Number(item.variant.price);
      const subtotal = price * item.quantity;
      total += subtotal;

      const totalStock = item.variant.stocks.reduce(
        (sum, s) => sum + s.quantity,
        0,
      );

      return {
        id: item.id,
        variantId: item.variantId,
        productId: item.variant.productId,
        productName: item.variant.product.name,
        coverImage: item.variant.product.images[0]?.imageUrl ?? null,
        sku: item.variant.sku,
        size: item.variant.size,
        color: item.variant.color,
        unitPrice: price,
        quantity: item.quantity,
        subtotal,
        availableStock: totalStock,
      };
    });

    return {
      cartId: fullCart.id,
      items,
      total,
      itemsCount: items.reduce((acc, it) => acc + it.quantity, 0),
    };
  }

  async addItem(userId: string, dto: AddToCartDto) {
    const variant = await this.prisma.productVariant.findUnique({
      where: { id: dto.variantId },
    });

    if (!variant || !variant.isActive) {
      throw new NotFoundException(
        `Prenda/variante ${dto.variantId} no encontrada o no disponible`,
      );
    }

    const cart = await this.getOrCreateCart(userId);

    await this.prisma.cartItem.upsert({
      where: {
        cartId_variantId: {
          cartId: cart.id,
          variantId: dto.variantId,
        },
      },
      create: {
        cartId: cart.id,
        variantId: dto.variantId,
        quantity: dto.quantity,
      },
      update: {
        quantity: { increment: dto.quantity },
      },
    });

    return this.getCart(userId);
  }

  async updateItem(userId: string, variantId: string, dto: UpdateCartItemDto) {
    const cart = await this.prisma.cart.findUnique({
      where: { userId },
    });

    if (!cart) {
      throw new NotFoundException('Carrito no encontrado');
    }

    const item = await this.prisma.cartItem.findUnique({
      where: {
        cartId_variantId: {
          cartId: cart.id,
          variantId,
        },
      },
    });

    if (!item) {
      throw new NotFoundException('La prenda no se encuentra en el carrito');
    }

    await this.prisma.cartItem.update({
      where: { id: item.id },
      data: { quantity: dto.quantity },
    });

    return this.getCart(userId);
  }

  async removeItem(userId: string, variantId: string) {
    const cart = await this.prisma.cart.findUnique({
      where: { userId },
    });

    if (cart) {
      await this.prisma.cartItem.deleteMany({
        where: {
          cartId: cart.id,
          variantId,
        },
      });
    }

    return this.getCart(userId);
  }

  async clearCart(userId: string) {
    const cart = await this.prisma.cart.findUnique({
      where: { userId },
    });

    if (cart) {
      await this.prisma.cartItem.deleteMany({
        where: { cartId: cart.id },
      });
    }

    return { success: true, message: 'Carrito vaciado' };
  }
}
