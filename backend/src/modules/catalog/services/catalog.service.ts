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
  ProcessArImageDto,
  HybridFittingDto,
} from '../dto/catalog.dto.js';
import { ImageProcessingService } from './image-processing.service.js';
import { HybridFittingService } from './hybrid-fitting.service.js';

@Injectable()
export class CatalogService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly imageProcessing: ImageProcessingService,
    private readonly hybridFitting: HybridFittingService,
  ) {}

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
          season: {
            select: { id: true, name: true },
          },
          collection: {
            select: { id: true, name: true },
          },
          supplier: {
            select: { id: true, name: true },
          },
          images: {
            orderBy: [{ isCover: 'desc' }, { sortOrder: 'asc' }],
            take: 12,
            select: { id: true, imageUrl: true, isCover: true, sortOrder: true },
          },
          variants: {
            where: { isActive: true },
            select: {
              id: true,
              sku: true,
              size: true,
              color: true,
              price: true,
              wholesalePrice: true,
              wholesaleMinUnits: true,
              cost: true,
              measurementsJson: true,
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
        categoryId: product.categoryId,
        category: product.category,
        seasonId: product.seasonId,
        season: product.season,
        collectionId: product.collectionId,
        collection: product.collection,
        supplierId: product.supplierId,
        supplier: product.supplier,
        coverImage,
        arImageUrl: (product as any).arImageUrl ?? null,
        images: product.images,
        priceRange: { min: minP, max: maxP },
        availableStock: totalStock,
        variantsCount: product.variants.length,
        variants: product.variants.map((v) => ({
          id: v.id,
          sku: v.sku,
          size: v.size,
          color: v.color,
          price: Number(v.price),
          wholesalePrice: v.wholesalePrice ? Number(v.wholesalePrice) : null,
          wholesaleMinUnits: v.wholesaleMinUnits ?? 6,
          cost: Number(v.cost),
          measurementsJson: v.measurementsJson,
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
    if (!dto.categoryId) {
      let defaultCat = await this.prisma.category.findFirst();
      if (!defaultCat) {
        defaultCat = await this.prisma.category.create({
          data: { name: 'General', slug: 'general' },
        });
      }
      dto.categoryId = defaultCat.id;
    } else {
      const category = await this.prisma.category.findUnique({
        where: { id: dto.categoryId },
      });
      if (!category) {
        throw new NotFoundException(`Categoría con ID ${dto.categoryId} no encontrada`);
      }
    }

    const newProductId = await this.prisma.$transaction(async (tx) => {
      // 1. Crear producto maestro
      const product = await tx.product.create({
        data: {
          name: dto.name.trim(),
          description: dto.description?.trim() || null,
          brand: dto.brand?.trim() || 'FashionStore',
          categoryId: dto.categoryId,
          seasonId: dto.seasonId?.trim() || null,
          collectionId: dto.collectionId?.trim() || null,
          supplierId: dto.supplierId?.trim() || null,
          isActive: true,
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

      return product.id;
    });

    return this.findById(newProductId);
  }

  async updateProduct(id: string, dto: UpdateProductDto) {
    const existing = await this.prisma.product.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException(`Producto con ID ${id} no encontrado`);
    }

    return this.prisma.product.update({
      where: { id },
      data: {
        name: dto.name !== undefined ? dto.name.trim() : undefined,
        description: dto.description !== undefined ? dto.description?.trim() || null : undefined,
        brand: dto.brand !== undefined ? dto.brand?.trim() || 'FashionStore' : undefined,
        categoryId: dto.categoryId !== undefined ? dto.categoryId || undefined : undefined,
        seasonId: dto.seasonId !== undefined ? (dto.seasonId ? dto.seasonId : null) : undefined,
        collectionId: dto.collectionId !== undefined ? (dto.collectionId ? dto.collectionId : null) : undefined,
        supplierId: dto.supplierId !== undefined ? (dto.supplierId ? dto.supplierId : null) : undefined,
        isActive: dto.isActive,
      },
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
        wholesalePrice: dto.wholesalePrice !== undefined ? new Prisma.Decimal(dto.wholesalePrice) : null,
        wholesaleMinUnits: dto.wholesaleMinUnits !== undefined ? dto.wholesaleMinUnits : 6,
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
        wholesalePrice:
          dto.wholesalePrice !== undefined
            ? dto.wholesalePrice !== null
              ? new Prisma.Decimal(dto.wholesalePrice)
              : null
            : undefined,
        wholesaleMinUnits: dto.wholesaleMinUnits !== undefined ? dto.wholesaleMinUnits : undefined,
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

  async deleteImage(productId: string, imageId: string) {
    const image = await this.prisma.productImage.findFirst({
      where: { id: imageId, productId },
    });
    if (!image) {
      throw new NotFoundException(`Imagen no encontrada para este producto`);
    }

    await this.prisma.productImage.delete({
      where: { id: imageId },
    });

    // Si era la de portada, asignar portada a la primera que quede
    if (image.isCover) {
      const nextCover = await this.prisma.productImage.findFirst({
        where: { productId },
        orderBy: { sortOrder: 'asc' },
      });
      if (nextCover) {
        await this.prisma.productImage.update({
          where: { id: nextCover.id },
          data: { isCover: true },
        });
      }
    }

    return this.prisma.productImage.findMany({
      where: { productId },
      orderBy: [{ isCover: 'desc' }, { sortOrder: 'asc' }],
    });
  }

  async setCoverImage(productId: string, imageId: string) {
    const image = await this.prisma.productImage.findFirst({
      where: { id: imageId, productId },
    });
    if (!image) {
      throw new NotFoundException(`Imagen no encontrada para este producto`);
    }

    await this.prisma.$transaction([
      this.prisma.productImage.updateMany({
        where: { productId },
        data: { isCover: false },
      }),
      this.prisma.productImage.update({
        where: { id: imageId },
        data: { isCover: true },
      }),
    ]);

    return this.prisma.productImage.findMany({
      where: { productId },
      orderBy: [{ isCover: 'desc' }, { sortOrder: 'asc' }],
    });
  }

  // --- Probador Virtual AR & Aislamiento de Fondo WebP ---

  async processAndSetArImage(productId: string, dto?: ProcessArImageDto) {
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
      include: { images: true },
    });
    if (!product) {
      throw new NotFoundException(`Producto con ID ${productId} no encontrado`);
    }

    const sourceImage =
      dto?.imageUrl ||
      product.images.find((img) => img.isCover)?.imageUrl ||
      product.images[0]?.imageUrl;

    if (!sourceImage) {
      throw new BadRequestException('El producto no tiene ninguna fotografía oficial para procesar el recorte');
    }

    const result = await this.imageProcessing.processAndRemoveBackground(productId, sourceImage);

    // Persistir textura AR transparente (WebP con canal alfa) en la prenda
    const updated = await this.prisma.product.update({
      where: { id: productId },
      data: { arImageUrl: result.arImageUrl },
      include: {
        images: true,
        variants: true,
      },
    });

    return {
      message: 'Fondo de prenda procesado y aislado exitosamente en WebP transparente para AR',
      arImageUrl: updated.arImageUrl,
      format: result.format,
      modelUsed: result.modelUsed,
      sizeReductionPercent: result.sizeReductionPercent,
      productId: updated.id,
      productName: updated.name,
    };
  }

  async setArImage(productId: string, arImageUrl: string) {
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
    });
    if (!product) {
      throw new NotFoundException(`Producto con ID ${productId} no encontrado`);
    }

    return this.prisma.product.update({
      where: { id: productId },
      data: { arImageUrl },
      include: { images: true, variants: true },
    });
  }

  async removeArImage(productId: string) {
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
    });
    if (!product) {
      throw new NotFoundException(`Producto con ID ${productId} no encontrado`);
    }

    return this.prisma.product.update({
      where: { id: productId },
      data: { arImageUrl: null },
      include: { images: true, variants: true },
    });
  }

  // --- Estrategia Híbrida Inteligente de Tallas en 3 Pasos (Nike Fit / ASOS / Zalando) ---

  async estimateHybridSize(productId: string, dto: HybridFittingDto) {
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
      include: {
        variants: {
          where: { isActive: true },
          select: { id: true, size: true, measurementsJson: true },
        },
      },
    });

    if (!product) {
      throw new NotFoundException(`Producto con ID ${productId} no encontrado`);
    }

    return this.hybridFitting.calculateHybridFit({
      productId,
      heightCm: dto.heightCm,
      weightKg: dto.weightKg,
      fitPreference: dto.fitPreference,
      deviceTiltDeg: dto.deviceTiltDeg,
      shoulderSpanPixels: dto.shoulderSpanPixels,
      fullBodyHeightPixels: dto.fullBodyHeightPixels,
      landmarks: dto.landmarks,
      fabricStretch: dto.fabricStretch,
      productVariants: product.variants,
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

  async createCategory(dto: { name: string; slug?: string }) {
    const slug = (dto.slug || dto.name)
      .toLowerCase()
      .trim()
      .replace(/\s+/g, '-')
      .replace(/[^\w-]+/g, '');

    return this.prisma.category.create({
      data: {
        name: dto.name.trim(),
        slug,
      },
    });
  }

  async updateCategory(id: string, dto: { name?: string; slug?: string }) {
    const existing = await this.prisma.category.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException(`Categoría con ID ${id} no encontrada`);
    }

    let slug: string | undefined = dto.slug;
    if (dto.name && !slug) {
      slug = dto.name
        .toLowerCase()
        .trim()
        .replace(/\s+/g, '-')
        .replace(/[^\w-]+/g, '');
    }

    return this.prisma.category.update({
      where: { id },
      data: {
        name: dto.name ? dto.name.trim() : undefined,
        slug,
      },
    });
  }

  async getSeasons() {
    return this.prisma.season.findMany({
      include: {
        _count: {
          select: { products: { where: { isActive: true } } },
        },
      },
      orderBy: { startDate: 'desc' },
    });
  }

  async createSeason(dto: { name: string; startDate?: string; endDate?: string }) {
    return this.prisma.season.create({
      data: {
        name: dto.name.trim(),
        startDate: dto.startDate ? new Date(dto.startDate) : null,
        endDate: dto.endDate ? new Date(dto.endDate) : null,
      },
    });
  }

  async updateSeason(id: string, dto: { name?: string; startDate?: string; endDate?: string }) {
    const existing = await this.prisma.season.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException(`Temporada con ID ${id} no encontrada`);
    }

    return this.prisma.season.update({
      where: { id },
      data: {
        name: dto.name ? dto.name.trim() : undefined,
        startDate: dto.startDate !== undefined ? (dto.startDate ? new Date(dto.startDate) : null) : undefined,
        endDate: dto.endDate !== undefined ? (dto.endDate ? new Date(dto.endDate) : null) : undefined,
      },
    });
  }

  async getCollections() {
    return this.prisma.collection.findMany({
      include: {
        _count: {
          select: { products: { where: { isActive: true } } },
        },
      },
      orderBy: { name: 'asc' },
    });
  }

  async createCollection(dto: { name: string; description?: string }) {
    return this.prisma.collection.create({
      data: {
        name: dto.name.trim(),
        description: dto.description?.trim() || null,
      },
    });
  }

  async updateCollection(id: string, dto: { name?: string; description?: string }) {
    const existing = await this.prisma.collection.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException(`Colección con ID ${id} no encontrada`);
    }

    return this.prisma.collection.update({
      where: { id },
      data: {
        name: dto.name ? dto.name.trim() : undefined,
        description: dto.description !== undefined ? dto.description.trim() || null : undefined,
      },
    });
  }

  async getSuppliers() {
    return this.prisma.supplier.findMany({
      include: {
        _count: {
          select: { products: { where: { isActive: true } } },
        },
      },
      orderBy: { name: 'asc' },
    });
  }

  async createSupplier(dto: { name: string; contactEmail?: string; phone?: string; address?: string }) {
    return this.prisma.supplier.create({
      data: {
        name: dto.name.trim(),
        contactEmail: dto.contactEmail?.trim() || null,
        phone: dto.phone?.trim() || null,
        address: dto.address?.trim() || null,
      },
    });
  }

  async updateSupplier(id: string, dto: { name?: string; contactEmail?: string; phone?: string; address?: string }) {
    const existing = await this.prisma.supplier.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException(`Proveedor con ID ${id} no encontrado`);
    }

    return this.prisma.supplier.update({
      where: { id },
      data: {
        name: dto.name ? dto.name.trim() : undefined,
        contactEmail: dto.contactEmail !== undefined ? dto.contactEmail.trim() || null : undefined,
        phone: dto.phone !== undefined ? dto.phone.trim() || null : undefined,
        address: dto.address !== undefined ? dto.address.trim() || null : undefined,
      },
    });
  }

  async deleteCategory(id: string) {
    const category = await this.prisma.category.findUnique({
      where: { id },
      include: {
        _count: {
          select: { products: { where: { isActive: true } } },
        },
      },
    });
    if (!category) {
      throw new NotFoundException(`Categoría con ID ${id} no encontrada`);
    }
    if (category._count.products > 0) {
      throw new BadRequestException(
        `No se puede eliminar la categoría "${category.name}" porque tiene ${category._count.products} prenda(s) activa(s) asignada(s).`,
      );
    }
    await this.prisma.category.delete({ where: { id } });
    return { message: `Categoría "${category.name}" eliminada exitosamente` };
  }

  async deleteSeason(id: string) {
    const season = await this.prisma.season.findUnique({
      where: { id },
      include: {
        _count: {
          select: { products: { where: { isActive: true } } },
        },
      },
    });
    if (!season) {
      throw new NotFoundException(`Temporada con ID ${id} no encontrada`);
    }
    if (season._count.products > 0) {
      throw new BadRequestException(
        `No se puede eliminar la temporada "${season.name}" porque tiene ${season._count.products} prenda(s) activa(s) asignada(s).`,
      );
    }
    await this.prisma.season.delete({ where: { id } });
    return { message: `Temporada "${season.name}" eliminada exitosamente` };
  }

  async deleteCollection(id: string) {
    const collection = await this.prisma.collection.findUnique({
      where: { id },
      include: {
        _count: {
          select: { products: { where: { isActive: true } } },
        },
      },
    });
    if (!collection) {
      throw new NotFoundException(`Colección con ID ${id} no encontrada`);
    }
    if (collection._count.products > 0) {
      throw new BadRequestException(
        `No se puede eliminar la colección "${collection.name}" porque tiene ${collection._count.products} prenda(s) activa(s) asignada(s).`,
      );
    }
    await this.prisma.collection.delete({ where: { id } });
    return { message: `Colección "${collection.name}" eliminada exitosamente` };
  }

  async deleteSupplier(id: string) {
    const supplier = await this.prisma.supplier.findUnique({
      where: { id },
      include: {
        _count: {
          select: { products: { where: { isActive: true } } },
        },
      },
    });
    if (!supplier) {
      throw new NotFoundException(`Proveedor con ID ${id} no encontrado`);
    }
    if (supplier._count.products > 0) {
      throw new BadRequestException(
        `No se puede eliminar el proveedor "${supplier.name}" porque tiene ${supplier._count.products} prenda(s) activa(s) asignada(s).`,
      );
    }
    await this.prisma.supplier.delete({ where: { id } });
    return { message: `Proveedor "${supplier.name}" eliminado exitosamente` };
  }

  async deleteProduct(id: string) {
    const product = await this.prisma.product.findUnique({ where: { id } });
    if (!product) {
      throw new NotFoundException(`Producto con ID ${id} no encontrado`);
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.productVariant.updateMany({
        where: { productId: id },
        data: { isActive: false },
      });
      await tx.product.update({
        where: { id },
        data: { isActive: false },
      });
    });

    return { message: `Prenda / Producto "${product.name}" dado de baja exitosamente (Baja Lógica)` };
  }

  async deleteVariant(id: string) {
    const variant = await this.prisma.productVariant.findUnique({ where: { id } });
    if (!variant) {
      throw new NotFoundException(`Variante con ID ${id} no encontrada`);
    }

    await this.prisma.productVariant.update({
      where: { id },
      data: { isActive: false },
    });

    return { message: `Variante SKU "${variant.sku}" dada de baja exitosamente (Baja Lógica)` };
  }
}

