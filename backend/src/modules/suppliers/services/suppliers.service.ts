import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service.js';
import { CreateSupplierDto, UpdateSupplierDto, QuerySuppliersDto } from '../dto/suppliers.dto.js';

@Injectable()
export class SuppliersService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: QuerySuppliersDto) {
    const where: Prisma.SupplierWhereInput = {};

    if (query.search && query.search.trim() !== '') {
      const q = query.search.trim();
      where.OR = [
        { name: { contains: q, mode: 'insensitive' } },
        { contactEmail: { contains: q, mode: 'insensitive' } },
        { phone: { contains: q, mode: 'insensitive' } },
        { address: { contains: q, mode: 'insensitive' } },
      ];
    }

    const suppliers = await this.prisma.supplier.findMany({
      where,
      orderBy: { name: 'asc' },
      include: {
        _count: {
          select: { products: true },
        },
      },
    });

    return suppliers.map((s) => ({
      id: s.id,
      name: s.name,
      contactEmail: s.contactEmail,
      phone: s.phone,
      address: s.address,
      productsCount: s._count.products,
    }));
  }

  async findById(id: string) {
    const supplier = await this.prisma.supplier.findUnique({
      where: { id },
      include: {
        products: {
          select: {
            id: true,
            name: true,
            brand: true,
            isActive: true,
            _count: { select: { variants: true } },
          },
        },
        _count: { select: { products: true } },
      },
    });

    if (!supplier) {
      throw new NotFoundException(`Proveedor con ID ${id} no encontrado`);
    }

    return {
      id: supplier.id,
      name: supplier.name,
      contactEmail: supplier.contactEmail,
      phone: supplier.phone,
      address: supplier.address,
      productsCount: supplier._count.products,
      products: supplier.products.map((p) => ({
        id: p.id,
        name: p.name,
        brand: p.brand,
        isActive: p.isActive,
        variantsCount: p._count.variants,
      })),
    };
  }

  async create(dto: CreateSupplierDto) {
    const existing = await this.prisma.supplier.findUnique({
      where: { name: dto.name },
    });

    if (existing) {
      throw new ConflictException(`Ya existe un proveedor con el nombre "${dto.name}"`);
    }

    const supplier = await this.prisma.supplier.create({
      data: {
        name: dto.name.trim(),
        contactEmail: dto.contactEmail?.trim() || null,
        phone: dto.phone?.trim() || null,
        address: dto.address?.trim() || null,
      },
    });

    return this.findById(supplier.id);
  }

  async update(id: string, dto: UpdateSupplierDto) {
    const existing = await this.prisma.supplier.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException(`Proveedor con ID ${id} no encontrado`);
    }

    if (dto.name && dto.name !== existing.name) {
      const nameConflict = await this.prisma.supplier.findUnique({
        where: { name: dto.name },
      });
      if (nameConflict) {
        throw new ConflictException(`Ya existe un proveedor con el nombre "${dto.name}"`);
      }
    }

    await this.prisma.supplier.update({
      where: { id },
      data: {
        ...(dto.name && { name: dto.name.trim() }),
        ...(dto.contactEmail !== undefined && { contactEmail: dto.contactEmail?.trim() || null }),
        ...(dto.phone !== undefined && { phone: dto.phone?.trim() || null }),
        ...(dto.address !== undefined && { address: dto.address?.trim() || null }),
      },
    });

    return this.findById(id);
  }

  async remove(id: string) {
    const existing = await this.prisma.supplier.findUnique({
      where: { id },
      include: { _count: { select: { products: true } } },
    });

    if (!existing) {
      throw new NotFoundException(`Proveedor con ID ${id} no encontrado`);
    }

    if (existing._count.products > 0) {
      throw new ConflictException(
        `No se puede eliminar el proveedor porque tiene ${existing._count.products} producto(s) asociado(s)`,
      );
    }

    await this.prisma.supplier.delete({ where: { id } });

    return { message: `Proveedor "${existing.name}" eliminado exitosamente` };
  }
}
