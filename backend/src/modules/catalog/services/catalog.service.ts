import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service.js';
import {
  CreateProductDto,
  UpdateProductDto,
  CreateProductVariantDto,
  UpdateProductVariantDto,
  QueryProductsDto,
  CreateProductImageDto,
} from '../dto/catalog.dto.js';

@Injectable()
export class CatalogService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: QueryProductsDto) {
    const {
      page = 1,
      limit = 12,
      search,
      categoryId,
      seasonId,
      minPrice,
      maxPrice,
      size,
      color,
      branchId,
      inStockOnly,
      sort = 'newest',
    } = query;

    const where: Prisma.ProductWhereInput = {
      isActive: true,
    };

    if (search && search.trim() !== '') {
      where.OR = [
        { name: { contains: search.trim(), mode: 'insensitive' } },
        { description: { contains: search.trim(), mode: 'insensitive' } },
      ];
    }

    if (categoryId) where.categoryId = categoryId;
    if (seasonId) where.seasonId = seasonId;

    // Filtros sobre variantes (modelo real relacional)
    const variantWhere: Prisma.ProductVariantWhereInput = {
      isActive: true,
    };

    if (size) variantWhere.size = size;
    if (color) variantWhere.color = color;

    if (minPrice !== undefined || maxPrice !== undefined) {
      variantWhere.price = {};
      if (minPrice !== undefined) variantWhere.price.gte = minPrice;
      if (maxPrice !== undefined) variantWhere.price.lte = maxPrice;
    }

    if (inStockOnly) {
      if (branchId) {
        variantWhere.stocks = {
          some: {
            location: { branchId },
            quantity: { gt: 0 },
          },
        };
      } else {
        variantWhere.stocks = {
          some: {
            quantity: { gt: 0 },
          },
        };
      }
    }

    const hasVariantFilters =
      size !== undefined ||
      color !== undefined ||
      minPrice !== undefined ||
      maxPrice !== undefined ||
      inStockOnly === true;

    if (hasVariantFilters) {
      where.variants = { some: variantWhere };
    }

    // Ordenamiento
    let orderBy: Prisma.ProductOrderByWithRelationInput = { createdAt: 'desc' };
    if (sort === 'newest') {
      orderBy = { createdAt: 'desc' };
    }

    // Consulta paralela y optimizada: cero N+1
    const [total, products] = await Promise.all([
      this.prisma.product.count({ where }),
      this.prisma.product.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy,
        include: {
          category: {
            select: { id: true, name: true, slug: true },
          },
          images: {
            orderBy: [{ isCover: 'desc' }, { sortOrder: 'asc' }],
            take: 2,
            select: { id: true, imageUrl: true, isCover: true },
          },
          variants: {
            where: { isActive: true },
            select: {
              id: true,
              sku: true,
              size: true,
              color: true,
              price: true,
              stocks: branchId
                ? {
                    where: { location: { branchId } },
                    select: { quantity: true, locationId: true },
                  }
                : {
                    select: { quantity: true, locationId: true },
                  },
            },
          },
        },
      }),
    ]);

    // Resumen en memoria eficiente sin consultas adicionales
    const items = products.map((product) => {
      const prices = product.variants.map((v) => Number(v.price));
      const minP = prices.length > 0 ? Math.min(...prices) : 0;
      const maxP = prices.length > 0 ? Math.max(...prices) : 0;
      const totalStock = product.variants.reduce((acc, v) => {
        const stockSum = v.stocks.reduce((sAcc, s) => sAcc + s.quantity, 0);
        return acc + stockSum;
      }, 0);

      const coverImage =
        product.images.find((img) => img.isCover)?.imageUrl ??
        product.images[0]?.imageUrl ??
        null;

      return {
        id: product.id,
        name: product.name,
        description: product.description,
        brand: product.brand,
        category: product.category,
        coverImage,
        priceRange: { min: minP, max: maxP },
        availableStock: totalStock,
        variantsCount: product.variants.length,
        variants: product.variants.map((v) => ({
          id: v.id,
          sku: v.sku,
          size: v.size,
          color: v.color,
          price: Number(v.price),
          stock: v.stocks.reduce((sAcc, s) => sAcc + s.quantity, 0),
        })),
      };
    });

    // Ordenamiento por precio si fue solicitado
    if (sort === 'price_asc') {
      items.sort((a, b) => a.priceRange.min - b.priceRange.min);
    } else if (sort === 'price_desc') {
      items.sort((a, b) => b.priceRange.max - a.priceRange.max);
    }

    return {
      items,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findById(id: string, branchId?: string) {
    const product = await this.prisma.product.findUnique({
      where: { id },
      include: {
        category: true,
        season: true,
        collection: true,
        supplier: {
          select: { id: true, name: true },
        },
        images: {
          orderBy: [{ isCover: 'desc' }, { sortOrder: 'asc' }],
        },
        variants: {
          where: { isActive: true },
          include: {
            stocks: {
              include: {
                location: {
                  include: {
                    branch: {
                      select: { id: true, name: true, city: true },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!product || !product.isActive) {
      throw new NotFoundException(`Producto con ID ${id} no encontrado`);
    }

    return {
      ...product,
      variants: product.variants.map((v) => ({
        ...v,
        price: Number(v.price),
        cost: Number(v.cost),
        stocks: v.stocks
          .filter((s) => (branchId ? s.location.branchId === branchId : true))
          .map((s) => ({
            id: s.id,
            locationId: s.locationId,
            locationName: s.location.name,
            locationType: s.location.type,
            branchId: s.location.branchId,
            branchName: s.location.branch.name,
            cityName: s.location.branch.city.name,
            quantity: s.quantity,
            minStock: s.minStock,
          })),
      })),
    };
  }

  async createProduct(dto: CreateProductDto, userId: string) {
    return this.prisma.$transaction(async (tx) => {
      // 1. Crear producto maestro
      const product = await tx.product.create({
        data: {
          name: dto.name,
          description: dto.description,
          brand: dto.brand ?? 'FashionStore',
          categoryId: dto.categoryId,
          seasonId: dto.seasonId,
          collectionId: dto.collectionId,
          supplierId: dto.supplierId,
        },
      });

      // 2. Crear imágenes si existen
      if (dto.images && dto.images.length > 0) {
        await tx.productImage.createMany({
          data: dto.images.map((img, idx) => ({
            productId: product.id,
            imageUrl: img.imageUrl,
            isCover: img.isCover ?? idx === 0,
            sortOrder: img.sortOrder ?? idx,
          })),
        });
      }

      // 3. Crear variantes y stock inicial
      if (dto.variants && dto.variants.length > 0) {
        for (const variantDto of dto.variants) {
          const variant = await tx.productVariant.create({
            data: {
              productId: product.id,
              sku: variantDto.sku,
              size: variantDto.size,
              color: variantDto.color,
              price: new Prisma.Decimal(variantDto.price),
              cost: new Prisma.Decimal(variantDto.cost),
              measurementsJson: variantDto.measurementsJson ?? Prisma.JsonNull,
            },
          });

          if (variantDto.initialStock && variantDto.initialStock.length > 0) {
            for (const stockDto of variantDto.initialStock) {
              if (stockDto.quantity > 0) {
                await tx.inventoryStock.upsert({
                  where: {
                    variantId_locationId: {
                      variantId: variant.id,
                      locationId: stockDto.locationId,
                    },
                  },
                  create: {
                    variantId: variant.id,
                    locationId: stockDto.locationId,
                    quantity: stockDto.quantity,
                  },
                  update: {
                    quantity: { increment: stockDto.quantity },
                  },
                });

                await tx.inventoryMovement.create({
                  data: {
                    variantId: variant.id,
                    toLocationId: stockDto.locationId,
                    quantity: stockDto.quantity,
                    type: 'PURCHASE_RECEIPT',
                    reason: 'Ingreso inicial al crear variante',
                    userId,
                  },
                });
              }
            }
          }
        }
      }

      return this.findById(product.id);
    });
  }

  async updateProduct(id: string, dto: UpdateProductDto) {
    const existing = await this.prisma.product.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException(`Producto con ID ${id} no encontrado`);
    }

    return this.prisma.product.update({
      where: { id },
      data: dto,
    });
  }

  async addVariant(productId: string, dto: CreateProductVariantDto) {
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
    });
    if (!product) {
      throw new NotFoundException(`Producto con ID ${productId} no encontrado`);
    }

    const existingSku = await this.prisma.productVariant.findUnique({
      where: { sku: dto.sku },
    });
    if (existingSku) {
      throw new BadRequestException(`El SKU ${dto.sku} ya está registrado`);
    }

    return this.prisma.productVariant.create({
      data: {
        productId,
        sku: dto.sku,
        size: dto.size,
        color: dto.color,
        price: new Prisma.Decimal(dto.price),
        cost: new Prisma.Decimal(dto.cost),
        measurementsJson: dto.measurementsJson ?? Prisma.JsonNull,
      },
    });
  }

  async updateVariant(variantId: string, dto: UpdateProductVariantDto) {
    const existing = await this.prisma.productVariant.findUnique({
      where: { id: variantId },
    });
    if (!existing) {
      throw new NotFoundException(`Variante con ID ${variantId} no encontrada`);
    }

    return this.prisma.productVariant.update({
      where: { id: variantId },
      data: {
        size: dto.size,
        color: dto.color,
        price: dto.price !== undefined ? new Prisma.Decimal(dto.price) : undefined,
        cost: dto.cost !== undefined ? new Prisma.Decimal(dto.cost) : undefined,
        measurementsJson: dto.measurementsJson,
        isActive: dto.isActive,
      },
    });
  }

  async addImages(productId: string, images: CreateProductImageDto[]) {
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
    });
    if (!product) {
      throw new NotFoundException(`Producto con ID ${productId} no encontrado`);
    }

    await this.prisma.productImage.createMany({
      data: images.map((img) => ({
        productId,
        imageUrl: img.imageUrl,
        isCover: img.isCover ?? false,
        sortOrder: img.sortOrder ?? 0,
      })),
    });

    return this.prisma.productImage.findMany({
      where: { productId },
      orderBy: [{ isCover: 'desc' }, { sortOrder: 'asc' }],
    });
  }

  async getCategories() {
    return this.prisma.category.findMany({
      include: {
        _count: {
          select: { products: { where: { isActive: true } } },
        },
      },
      orderBy: { name: 'asc' },
    });
  }

  async getSeasons() {
    return this.prisma.season.findMany({
      orderBy: { startDate: 'desc' },
    });
  }
}
