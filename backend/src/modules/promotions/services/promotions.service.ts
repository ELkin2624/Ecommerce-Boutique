import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service.js';
import {
  CreatePromotionDto,
  UpdatePromotionDto,
  QueryPromotionsDto,
} from '../dto/promotions.dto.js';
import { Prisma } from '@prisma/client';

@Injectable()
export class PromotionsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: QueryPromotionsDto) {
    const { activeOnly, search } = query;
    const where: Prisma.PromotionWhereInput = {};

    if (activeOnly) {
      const now = new Date();
      where.isActive = true;
      where.startDate = { lte: now };
      where.endDate = { gte: now };
    }

    if (search && search.trim()) {
      const term = search.trim();
      where.OR = [
        { name: { contains: term, mode: 'insensitive' } },
        { code: { contains: term, mode: 'insensitive' } },
      ];
    }

    const promotions = await this.prisma.promotion.findMany({
      where,
      orderBy: [{ isActive: 'desc' }, { createdAt: 'desc' }],
    });

    return promotions.map((p) => ({
      ...p,
      discountPercent: Number(p.discountPercent),
      minPurchaseAmount: p.minPurchaseAmount ? Number(p.minPurchaseAmount) : null,
    }));
  }

  async findById(id: string) {
    const promotion = await this.prisma.promotion.findUnique({
      where: { id },
    });

    if (!promotion) {
      throw new NotFoundException(`Promoción con ID ${id} no encontrada`);
    }

    return {
      ...promotion,
      discountPercent: Number(promotion.discountPercent),
      minPurchaseAmount: promotion.minPurchaseAmount ? Number(promotion.minPurchaseAmount) : null,
    };
  }

  async findByCode(code: string) {
    const promotion = await this.prisma.promotion.findUnique({
      where: { code: code.toUpperCase() },
    });

    if (!promotion || !promotion.isActive) {
      throw new NotFoundException(`Cupón o código promocional no válido o expirado`);
    }

    const now = new Date();
    if (promotion.startDate > now || promotion.endDate < now) {
      throw new ConflictException(`La promoción ${code} se encuentra fuera de vigencia`);
    }

    return {
      ...promotion,
      discountPercent: Number(promotion.discountPercent),
      minPurchaseAmount: promotion.minPurchaseAmount ? Number(promotion.minPurchaseAmount) : null,
    };
  }

  async create(dto: CreatePromotionDto) {
    const codeUpper = dto.code.trim().toUpperCase();

    const existing = await this.prisma.promotion.findUnique({
      where: { code: codeUpper },
    });

    if (existing) {
      throw new ConflictException(`El código de promoción "${codeUpper}" ya está registrado`);
    }

    const created = await this.prisma.promotion.create({
      data: {
        name: dto.name.trim(),
        code: codeUpper,
        description: dto.description?.trim(),
        discountPercent: dto.discountPercent,
        minPurchaseAmount: dto.minPurchaseAmount ?? null,
        startDate: new Date(dto.startDate),
        endDate: new Date(dto.endDate),
        isActive: dto.isActive ?? true,
      },
    });

    return {
      ...created,
      discountPercent: Number(created.discountPercent),
      minPurchaseAmount: created.minPurchaseAmount ? Number(created.minPurchaseAmount) : null,
    };
  }

  async update(id: string, dto: UpdatePromotionDto) {
    await this.findById(id);

    if (dto.code) {
      const codeUpper = dto.code.trim().toUpperCase();
      const existing = await this.prisma.promotion.findFirst({
        where: { code: codeUpper, id: { not: id } },
      });
      if (existing) {
        throw new ConflictException(`El código de promoción "${codeUpper}" ya está en uso`);
      }
    }

    const updated = await this.prisma.promotion.update({
      where: { id },
      data: {
        ...(dto.name && { name: dto.name.trim() }),
        ...(dto.code && { code: dto.code.trim().toUpperCase() }),
        ...(dto.description !== undefined && { description: dto.description?.trim() }),
        ...(dto.discountPercent !== undefined && { discountPercent: dto.discountPercent }),
        ...(dto.minPurchaseAmount !== undefined && { minPurchaseAmount: dto.minPurchaseAmount }),
        ...(dto.startDate && { startDate: new Date(dto.startDate) }),
        ...(dto.endDate && { endDate: new Date(dto.endDate) }),
        ...(dto.isActive !== undefined && { isActive: dto.isActive }),
      },
    });

    return {
      ...updated,
      discountPercent: Number(updated.discountPercent),
      minPurchaseAmount: updated.minPurchaseAmount ? Number(updated.minPurchaseAmount) : null,
    };
  }

  async toggleStatus(id: string, isActive: boolean) {
    await this.findById(id);

    const updated = await this.prisma.promotion.update({
      where: { id },
      data: { isActive },
    });

    return {
      ...updated,
      discountPercent: Number(updated.discountPercent),
      minPurchaseAmount: updated.minPurchaseAmount ? Number(updated.minPurchaseAmount) : null,
      message: isActive ? 'Promoción activada' : 'Promoción pausada',
    };
  }

  async delete(id: string) {
    await this.findById(id);
    await this.prisma.promotion.delete({ where: { id } });
    return { success: true, message: 'Promoción eliminada exitosamente' };
  }
}
