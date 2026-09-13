import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service.js';
import {
  CreateBranchDto,
  UpdateBranchDto,
  CreateLocationDto,
  UpdateLocationDto,
  CreateCityDto,
  UpdateCityDto,
} from '../dto/branches.dto.js';

@Injectable()
export class BranchesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    return (this.prisma as any).branch.findMany({
      where: { isActive: true },
      include: {
        city: true,
        locations: {
          where: { isActive: true },
          include: {
            sharedByBranches: {
              where: { isActive: true },
              include: { city: true },
            },
            _count: {
              select: { stocks: true },
            },
          },
        },
        sharedWarehouses: {
          where: { isActive: true },
          include: {
            branch: { include: { city: true } },
            sharedByBranches: {
              where: { isActive: true },
              include: { city: true },
            },
            _count: {
              select: { stocks: true },
            },
          },
        },
        _count: {
          select: {
            reservations: true,
            orders: true,
          },
        },
      },
      orderBy: [{ city: { name: 'asc' } }, { name: 'asc' }],
    });
  }

  async findById(id: string) {
    const branch = await (this.prisma as any).branch.findUnique({
      where: { id },
      include: {
        city: true,
        locations: {
          where: { isActive: true },
          include: {
            sharedByBranches: {
              where: { isActive: true },
              include: { city: true },
            },
            stocks: {
              include: {
                variant: {
                  include: {
                    product: true,
                  },
                },
              },
            },
          },
        },
        sharedWarehouses: {
          where: { isActive: true },
          include: {
            branch: { include: { city: true } },
            sharedByBranches: {
              where: { isActive: true },
              include: { city: true },
            },
            stocks: {
              include: {
                variant: {
                  include: {
                    product: true,
                  },
                },
              },
            },
          },
        },
        _count: {
          select: {
            reservations: true,
            orders: true,
          },
        },
      },
    });

    if (!branch || !branch.isActive) {
      throw new NotFoundException(`Sucursal con ID ${id} no encontrada o inactiva`);
    }

    return branch;
  }

  async create(dto: CreateBranchDto) {
    const city = await this.prisma.city.findUnique({
      where: { id: dto.cityId },
    });
    if (!city) {
      throw new NotFoundException(`Ciudad con ID ${dto.cityId} no encontrada`);
    }

    const createdBranch = await this.prisma.$transaction(async (tx: any) => {
      const branch = await tx.branch.create({
        data: {
          name: dto.name.trim(),
          address: dto.address.trim(),
          phone: dto.phone?.trim() || null,
          cityId: dto.cityId,
          isActive: true,
        },
      });

      // Si seleccionó un almacén existente para asignarlo a esta nueva sucursal
      if (dto.warehouseId) {
        await tx.inventoryLocation.update({
          where: { id: dto.warehouseId },
          data: { branchId: branch.id },
        });

        // Crear solo piso de ventas inicial
        await tx.inventoryLocation.create({
          data: {
            branchId: branch.id,
            name: `Piso de Ventas ${dto.name.trim()}`,
            type: 'SALES_FLOOR',
            isActive: true,
          },
        });
      } else if (dto.locations && dto.locations.length > 0) {
        // Crear ubicaciones iniciales especificadas
        for (const loc of dto.locations) {
          await tx.inventoryLocation.create({
            data: {
              branchId: branch.id,
              name: loc.name.trim(),
              type: loc.type,
              isActive: true,
            },
          });
        }
      } else {
        // Por defecto: crear piso de ventas y almacén principal
        await tx.inventoryLocation.create({
          data: {
            branchId: branch.id,
            name: `Piso de Ventas ${dto.name.trim()}`,
            type: 'SALES_FLOOR',
            isActive: true,
          },
        });
        await tx.inventoryLocation.create({
          data: {
            branchId: branch.id,
            name: `Almacén Principal ${dto.name.trim()}`,
            type: 'WAREHOUSE',
            isActive: true,
          },
        });
      }

      return branch;
    });

    return this.findById(createdBranch.id);
  }

  async update(id: string, dto: UpdateBranchDto) {
    const existing = await this.prisma.branch.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException(`Sucursal con ID ${id} no encontrada`);
    }

    if (dto.cityId) {
      const city = await this.prisma.city.findUnique({
        where: { id: dto.cityId },
      });
      if (!city) {
        throw new NotFoundException(`Ciudad con ID ${dto.cityId} no encontrada`);
      }
    }

    return (this.prisma as any).branch.update({
      where: { id },
      data: {
        name: dto.name ? dto.name.trim() : undefined,
        address: dto.address ? dto.address.trim() : undefined,
        phone: dto.phone !== undefined ? dto.phone.trim() || null : undefined,
        cityId: dto.cityId,
      },
      include: {
        city: true,
        locations: true,
        sharedWarehouses: true,
      },
    });
  }

  async assignWarehouse(branchId: string, warehouseId: string) {
    const branch = await this.prisma.branch.findUnique({ where: { id: branchId } });
    if (!branch) {
      throw new NotFoundException(`Sucursal con ID ${branchId} no encontrada`);
    }

    const warehouse = await this.prisma.inventoryLocation.findUnique({
      where: { id: warehouseId },
    });
    if (!warehouse) {
      throw new NotFoundException(`Almacén con ID ${warehouseId} no encontrado`);
    }
    if (warehouse.type !== 'WAREHOUSE') {
      throw new BadRequestException('La ubicación a asignar debe ser de tipo almacén (WAREHOUSE)');
    }

    if (warehouse.branchId === branchId) {
      throw new BadRequestException('El almacén ya pertenece originalmente como sede a esta sucursal');
    }

    await (this.prisma as any).inventoryLocation.update({
      where: { id: warehouseId },
      data: {
        sharedByBranches: { connect: { id: branchId } },
      },
    });

    return this.findById(branchId);
  }

  async unassignWarehouse(branchId: string, warehouseId: string) {
    const branch = await this.prisma.branch.findUnique({ where: { id: branchId } });
    if (!branch) {
      throw new NotFoundException(`Sucursal con ID ${branchId} no encontrada`);
    }

    const warehouse = await this.prisma.inventoryLocation.findUnique({
      where: { id: warehouseId },
    });
    if (!warehouse) {
      throw new NotFoundException(`Almacén con ID ${warehouseId} no encontrado`);
    }

    await (this.prisma as any).inventoryLocation.update({
      where: { id: warehouseId },
      data: {
        sharedByBranches: { disconnect: { id: branchId } },
      },
    });

    return this.findById(branchId);
  }

  async addLocation(branchId: string, dto: CreateLocationDto) {
    const branch = await this.prisma.branch.findUnique({
      where: { id: branchId },
    });
    if (!branch) {
      throw new NotFoundException(`Sucursal con ID ${branchId} no encontrada`);
    }

    return (this.prisma as any).inventoryLocation.create({
      data: {
        branchId,
        name: dto.name.trim(),
        type: dto.type,
        isActive: true,
      },
      include: {
        branch: { include: { city: true } },
        sharedByBranches: { include: { city: true } },
      },
    });
  }

  async updateLocation(locationId: string, dto: UpdateLocationDto) {
    const location = await (this.prisma as any).inventoryLocation.findUnique({
      where: { id: locationId },
      include: { sharedByBranches: true },
    });
    if (!location) {
      throw new NotFoundException(`Ubicación con ID ${locationId} no encontrada`);
    }

    const targetBranchId = dto.branchId || location.branchId;
    if (dto.branchId) {
      const targetBranch = await this.prisma.branch.findUnique({
        where: { id: dto.branchId },
      });
      if (!targetBranch) {
        throw new NotFoundException(`Sucursal con ID ${dto.branchId} no encontrada`);
      }
    }

    const dataToUpdate: any = {
      name: dto.name ? dto.name.trim() : undefined,
      branchId: dto.branchId || undefined,
      type: dto.type || undefined,
    };

    if (dto.sharedBranchIds !== undefined) {
      // Filtrar la sucursal dueña para que no se autovincule como compartida
      const validSharedIds = dto.sharedBranchIds.filter((id) => id !== targetBranchId);
      dataToUpdate.sharedByBranches = {
        set: validSharedIds.map((id) => ({ id })),
      };
    }

    return (this.prisma as any).inventoryLocation.update({
      where: { id: locationId },
      data: dataToUpdate,
      include: {
        branch: { include: { city: true } },
        sharedByBranches: { include: { city: true } },
      },
    });
  }

  async deleteLocation(locationId: string) {
    const location = await (this.prisma as any).inventoryLocation.findUnique({
      where: { id: locationId },
      include: {
        stocks: true,
      },
    });

    if (!location) {
      throw new NotFoundException(`Ubicación con ID ${locationId} no encontrada`);
    }

    // Soft delete (baja lógica): Desactiva la ubicación y desvincula accesos compartidos
    await (this.prisma as any).inventoryLocation.update({
      where: { id: locationId },
      data: {
        isActive: false,
        sharedByBranches: { set: [] },
      },
    });

    return { message: `Ubicación "${location.name}" desactivada exitosamente (Baja Lógica)` };
  }

  async delete(id: string) {
    const branch = await this.prisma.branch.findUnique({
      where: { id },
    });

    if (!branch) {
      throw new NotFoundException(`Sucursal con ID ${id} no encontrada`);
    }

    // Soft delete (baja lógica): Desactiva la sucursal y todas sus ubicaciones propias
    await this.prisma.$transaction(async (tx: any) => {
      await tx.inventoryLocation.updateMany({
        where: { branchId: id },
        data: { isActive: false },
      });

      await tx.branch.update({
        where: { id },
        data: { isActive: false },
      });
    });

    return { message: `Sucursal "${branch.name}" dada de baja exitosamente (Baja Lógica)` };
  }

  async getCities() {
    return (this.prisma as any).city.findMany({
      include: {
        branches: {
          where: { isActive: true },
          select: {
            id: true,
            name: true,
            address: true,
            _count: {
              select: {
                locations: { where: { isActive: true } },
              },
            },
          },
        },
        _count: {
          select: { branches: true },
        },
      },
      orderBy: { name: 'asc' },
    });
  }

  async createCity(dto: CreateCityDto) {
    const name = dto.name.trim();
    const existing = await this.prisma.city.findFirst({
      where: { name: { equals: name, mode: 'insensitive' } },
    });

    if (existing) {
      throw new ConflictException(`La ciudad "${name}" ya está registrada`);
    }

    return this.prisma.city.create({
      data: { name },
    });
  }

  async updateCity(id: string, dto: UpdateCityDto) {
    const name = dto.name.trim();
    const city = await this.prisma.city.findUnique({ where: { id } });
    if (!city) {
      throw new NotFoundException(`Ciudad con ID ${id} no encontrada`);
    }

    const existing = await this.prisma.city.findFirst({
      where: { name: { equals: name, mode: 'insensitive' }, id: { not: id } },
    });
    if (existing) {
      throw new ConflictException(`Ya existe otra ciudad con el nombre "${name}"`);
    }

    return this.prisma.city.update({
      where: { id },
      data: { name },
    });
  }

  async deleteCity(id: string) {
    const city = await (this.prisma as any).city.findUnique({
      where: { id },
      include: {
        branches: {
          where: { isActive: true },
        },
      },
    });

    if (!city) {
      throw new NotFoundException(`Ciudad con ID ${id} no encontrada`);
    }

    if (city.branches && city.branches.length > 0) {
      throw new BadRequestException(
        `No se puede eliminar la ciudad "${city.name}" porque tiene ${city.branches.length} sucursal(es) activa(s) asociada(s). Reasigna o da de baja las sucursales primero.`,
      );
    }

    await this.prisma.city.delete({
      where: { id },
    });

    return { message: `Ciudad "${city.name}" eliminada exitosamente` };
  }
}
