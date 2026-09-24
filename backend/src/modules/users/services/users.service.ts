import {
  Injectable, NotFoundException, ConflictException, BadRequestException,
} from '@nestjs/common';
import * as argon2 from 'argon2';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service.js';
import {
  CreateUserDto,
  UpdateUserDto,
  ToggleUserStatusDto,
  QueryUsersDto,
} from '../dto/users.dto.js';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: QueryUsersDto) {
    const { search, role, isActive, page = 1, limit = 20 } = query;
    const pageNum = Math.max(1, Number(page) || 1);
    const limitNum = Math.max(1, Math.min(100, Number(limit) || 20));

    const where: Prisma.UserWhereInput = {};

    if (isActive !== undefined) {
      where.isActive = isActive;
    }

    if (search && search.trim() !== '') {
      const q = search.trim();
      where.OR = [
        { email: { contains: q, mode: 'insensitive' } },
        { firstName: { contains: q, mode: 'insensitive' } },
        { lastName: { contains: q, mode: 'insensitive' } },
        { phone: { contains: q, mode: 'insensitive' } },
      ];
    }

    if (role && role.trim() !== '' && role !== 'ALL') {
      where.roles = {
        some: {
          role: {
            name: { equals: role.trim().toUpperCase() },
          },
        },
      };
    }

    const [total, users] = await Promise.all([
      this.prisma.user.count({ where }),
      this.prisma.user.findMany({
        where,
        skip: (pageNum - 1) * limitNum,
        take: limitNum,
        orderBy: { createdAt: 'desc' },
        include: {
          roles: {
            include: {
              role: {
                select: { id: true, name: true, description: true },
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
      }),
    ]);

    return {
      items: users.map((u) => ({
        id: u.id,
        email: u.email,
        firstName: u.firstName,
        lastName: u.lastName,
        fullName: `${u.firstName} ${u.lastName}`,
        phone: u.phone,
        isActive: u.isActive,
        createdAt: u.createdAt,
        updatedAt: u.updatedAt,
        roles: u.roles.map((r) => r.role.name),
        rolesDetails: u.roles.map((r) => r.role),
        reservationsCount: u._count.reservations,
        ordersCount: u._count.orders,
      })),
      meta: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum) || 1,
      },
    };
  }

  async findById(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: {
        roles: {
          include: {
            role: {
              include: {
                permissions: {
                  include: {
                    permission: true,
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

    if (!user) {
      throw new NotFoundException(`Usuario con ID ${id} no encontrado`);
    }

    const permissions = new Set<string>();
    const roles: string[] = [];
    user.roles.forEach((ur) => {
      roles.push(ur.role.name);
      ur.role.permissions.forEach((rp) => {
        permissions.add(rp.permission.code);
      });
    });

    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      fullName: `${user.firstName} ${user.lastName}`,
      phone: user.phone,
      isActive: user.isActive,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      roles,
      rolesDetails: user.roles.map((r) => r.role),
      permissions: Array.from(permissions),
      reservationsCount: user._count.reservations,
      ordersCount: user._count.orders,
    };
  }

  async create(dto: CreateUserDto) {
    const email = dto.email.toLowerCase().trim();
    const existing = await this.prisma.user.findUnique({
      where: { email },
    });

    if (existing) {
      throw new ConflictException(`El correo electrónico ${email} ya está registrado`);
    }

    const passwordHash = await argon2.hash(dto.password, {
      type: argon2.argon2id,
    });

    const roleNames = dto.roleNames && dto.roleNames.length > 0
      ? dto.roleNames
      : ['CLIENT'];

    // Buscar roles existentes
    const roles = await this.prisma.role.findMany({
      where: { name: { in: roleNames } },
    });

    if (roles.length === 0) {
      throw new BadRequestException('Los roles especificados no existen en el sistema');
    }

    const user = await this.prisma.user.create({
      data: {
        email,
        passwordHash,
        firstName: dto.firstName.trim(),
        lastName: dto.lastName.trim(),
        phone: dto.phone?.trim() || null,
        isActive: true,
        roles: {
          create: roles.map((r) => ({
            roleId: r.id,
          })),
        },
      },
    });

    return this.findById(user.id);
  }

  async update(id: string, dto: UpdateUserDto) {
    const existing = await this.prisma.user.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException(`Usuario con ID ${id} no encontrado`);
    }

    const data: Prisma.UserUpdateInput = {};

    if (dto.firstName !== undefined) data.firstName = dto.firstName.trim();
    if (dto.lastName !== undefined) data.lastName = dto.lastName.trim();
    if (dto.phone !== undefined) data.phone = dto.phone.trim() || null;

    if (dto.password && dto.password.trim() !== '') {
      data.passwordHash = await argon2.hash(dto.password, {
        type: argon2.argon2id,
      });
    }

    if (dto.roleNames && dto.roleNames.length > 0) {
      const roles = await this.prisma.role.findMany({
        where: { name: { in: dto.roleNames } },
      });

      // Reemplazar roles
      await this.prisma.userRole.deleteMany({ where: { userId: id } });
      await this.prisma.userRole.createMany({
        data: roles.map((r) => ({
          userId: id,
          roleId: r.id,
        })),
      });
    }

    await this.prisma.user.update({
      where: { id },
      data,
    });

    return this.findById(id);
  }

  async toggleStatus(id: string, dto: ToggleUserStatusDto, currentAdminId: string) {
    if (id === currentAdminId && dto.isActive === false) {
      throw new BadRequestException('No puedes desactivar o banear tu propia cuenta de Administrador');
    }

    const existing = await this.prisma.user.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException(`Usuario con ID ${id} no encontrado`);
    }

    // Regla de negocio: Si se banea (desactiva), revocar todas sus sesiones activas
    if (!dto.isActive) {
      await this.prisma.refreshToken.updateMany({
        where: { userId: id },
        data: { isRevoked: true },
      });
    }

    const updated = await this.prisma.user.update({
      where: { id },
      data: { isActive: dto.isActive },
    });

    return {
      id: updated.id,
      email: updated.email,
      isActive: updated.isActive,
      message: updated.isActive
        ? 'Cuenta de usuario activada exitosamente'
        : 'Cuenta de usuario baneada/desactivada (sesiones revocadas)',
    };
  }

  async getRoles() {
    return this.prisma.role.findMany({
      include: {
        permissions: {
          include: {
            permission: true,
          },
        },
        _count: {
          select: { users: true },
        },
      },
      orderBy: { name: 'asc' },
    });
  }
}
