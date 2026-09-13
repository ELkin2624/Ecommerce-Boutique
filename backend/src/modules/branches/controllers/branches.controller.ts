import {
  Controller, Get, Post, Patch, Delete, Param, Body, UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { BranchesService } from '../services/branches.service.js';
import {
  CreateBranchDto, UpdateBranchDto, CreateLocationDto, UpdateLocationDto, CreateCityDto, UpdateCityDto, AssignWarehouseDto,
} from '../dto/branches.dto.js';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard.js';
import { PermissionsGuard } from '../../../common/guards/permissions.guard.js';
import { Permissions } from '../../../common/decorators/permissions.decorator.js';

@ApiTags('Branches')
@Controller('branches')
export class BranchesController {
  constructor(private readonly branchesService: BranchesService) {}

  @Get()
  @ApiOperation({ summary: 'Listar todas las sucursales con sus ciudades y ubicaciones' })
  async findAll() {
    return this.branchesService.findAll();
  }

  @Get('cities')
  @ApiOperation({ summary: 'Listar todas las ciudades registradas' })
  async getCities() {
    return this.branchesService.getCities();
  }

  @Post('cities')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('USER:CREATE')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Crear nueva ciudad' })
  async createCity(@Body() dto: CreateCityDto) {
    return this.branchesService.createCity(dto);
  }

  @Patch('cities/:id')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('USER:CREATE')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Actualizar nombre de ciudad' })
  async updateCity(@Param('id') id: string, @Body() dto: UpdateCityDto) {
    return this.branchesService.updateCity(id, dto);
  }

  @Delete('cities/:id')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('USER:CREATE')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Eliminar ciudad si no tiene sucursales' })
  async deleteCity(@Param('id') id: string) {
    return this.branchesService.deleteCity(id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener detalle de sucursal con ubicaciones e inventario' })
  async findById(@Param('id') id: string) {
    return this.branchesService.findById(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('USER:CREATE')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Crear nueva sucursal con almacén y piso de venta' })
  async create(@Body() dto: CreateBranchDto) {
    return this.branchesService.create(dto);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('USER:CREATE')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Actualizar datos de una sucursal' })
  async update(@Param('id') id: string, @Body() dto: UpdateBranchDto) {
    return this.branchesService.update(id, dto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('USER:CREATE')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Eliminar una sucursal (si no tiene órdenes o reservas)' })
  async delete(@Param('id') id: string) {
    return this.branchesService.delete(id);
  }

  @Post(':id/locations')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('USER:CREATE')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Agregar ubicación física a una sucursal (Almacén o Piso de venta)' })
  async addLocation(
    @Param('id') id: string,
    @Body() dto: CreateLocationDto,
  ) {
    return this.branchesService.addLocation(id, dto);
  }

  @Post(':id/warehouses')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('USER:CREATE')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Asignar almacén existente a una sucursal' })
  async assignWarehouse(
    @Param('id') id: string,
    @Body() dto: AssignWarehouseDto,
  ) {
    return this.branchesService.assignWarehouse(id, dto.warehouseId);
  }

  @Delete(':id/warehouses/:warehouseId')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('USER:CREATE')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Remover el acceso de una sucursal a un almacén compartido' })
  async unassignWarehouse(
    @Param('id') id: string,
    @Param('warehouseId') warehouseId: string,
  ) {
    return this.branchesService.unassignWarehouse(id, warehouseId);
  }

  @Patch('locations/:locationId')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('USER:CREATE')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Actualizar ubicación física (nombre, reasignar sucursal o tipo)' })
  async updateLocation(
    @Param('locationId') locationId: string,
    @Body() dto: UpdateLocationDto,
  ) {
    return this.branchesService.updateLocation(locationId, dto);
  }

  @Delete('locations/:locationId')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('USER:CREATE')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Eliminar ubicación física (si no tiene stock activo ni movimientos)' })
  async deleteLocation(@Param('locationId') locationId: string) {
    return this.branchesService.deleteLocation(locationId);
  }
}
