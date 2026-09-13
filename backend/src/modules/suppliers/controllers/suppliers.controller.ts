import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { SuppliersService } from '../services/suppliers.service.js';
import { CreateSupplierDto, UpdateSupplierDto, QuerySuppliersDto } from '../dto/suppliers.dto.js';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard.js';
import { PermissionsGuard } from '../../../common/guards/permissions.guard.js';
import { Permissions } from '../../../common/decorators/permissions.decorator.js';

@ApiTags('Suppliers')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('suppliers')
export class SuppliersController {
  constructor(private readonly suppliersService: SuppliersService) {}

  @Get()
  @Permissions('PRODUCT:READ')
  @ApiOperation({ summary: 'Listar proveedores con búsqueda opcional' })
  async findAll(@Query() query: QuerySuppliersDto) {
    return this.suppliersService.findAll(query);
  }

  @Get(':id')
  @Permissions('PRODUCT:READ')
  @ApiOperation({ summary: 'Obtener detalle de un proveedor con sus productos' })
  async findById(@Param('id') id: string) {
    return this.suppliersService.findById(id);
  }

  @Post()
  @Permissions('PRODUCT:CREATE')
  @ApiOperation({ summary: 'Crear nuevo proveedor' })
  async create(@Body() dto: CreateSupplierDto) {
    return this.suppliersService.create(dto);
  }

  @Patch(':id')
  @Permissions('PRODUCT:UPDATE')
  @ApiOperation({ summary: 'Actualizar datos de un proveedor' })
  async update(@Param('id') id: string, @Body() dto: UpdateSupplierDto) {
    return this.suppliersService.update(id, dto);
  }

  @Delete(':id')
  @Permissions('PRODUCT:CREATE')
  @ApiOperation({ summary: 'Eliminar proveedor (solo si no tiene productos asociados)' })
  async remove(@Param('id') id: string) {
    return this.suppliersService.remove(id);
  }
}
