import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { UsersService } from '../services/users.service.js';
import {
  CreateUserDto,
  UpdateUserDto,
  ToggleUserStatusDto,
  QueryUsersDto,
} from '../dto/users.dto.js';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard.js';
import { PermissionsGuard } from '../../../common/guards/permissions.guard.js';
import { Permissions } from '../../../common/decorators/permissions.decorator.js';

@ApiTags('Users')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @Permissions('USER:READ')
  @ApiOperation({ summary: 'Listar usuarios con filtros por rol, estado y búsqueda' })
  async findAll(@Query() query: QueryUsersDto) {
    return this.usersService.findAll(query);
  }

  @Get('roles')
  @Permissions('USER:READ')
  @ApiOperation({ summary: 'Obtener todos los roles y permisos del sistema' })
  async getRoles() {
    return this.usersService.getRoles();
  }

  @Get(':id')
  @Permissions('USER:READ')
  @ApiOperation({ summary: 'Obtener detalle de un usuario' })
  async findById(@Param('id') id: string) {
    return this.usersService.findById(id);
  }

  @Post()
  @Permissions('USER:CREATE')
  @ApiOperation({ summary: 'Crear nuevo usuario (Cajero, Encargado, Cliente, etc.)' })
  async create(@Body() dto: CreateUserDto) {
    return this.usersService.create(dto);
  }

  @Patch(':id')
  @Permissions('USER:CREATE')
  @ApiOperation({ summary: 'Actualizar datos y roles de usuario' })
  async update(@Param('id') id: string, @Body() dto: UpdateUserDto) {
    return this.usersService.update(id, dto);
  }

  @Patch(':id/status')
  @Permissions('USER:CREATE')
  @ApiOperation({ summary: 'Activar o Banear/Desactivar usuario (Soft-delete inmutable)' })
  async toggleStatus(
    @Param('id') id: string,
    @Body() dto: ToggleUserStatusDto,
    @Request() req: any,
  ) {
    return this.usersService.toggleStatus(id, dto, req.user.id);
  }
}
