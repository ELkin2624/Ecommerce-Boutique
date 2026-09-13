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
import { PromotionsService } from '../services/promotions.service.js';
import {
  CreatePromotionDto,
  UpdatePromotionDto,
  TogglePromotionStatusDto,
  QueryPromotionsDto,
} from '../dto/promotions.dto.js';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard.js';
import { PermissionsGuard } from '../../../common/guards/permissions.guard.js';
import { Permissions } from '../../../common/decorators/permissions.decorator.js';

@ApiTags('Promotions')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('promotions')
export class PromotionsController {
  constructor(private readonly promotionsService: PromotionsService) {}

  @Get()
  @Permissions('PROMOTION:READ')
  @ApiOperation({ summary: 'Listar todas las promociones y cupones de descuento' })
  async findAll(@Query() query: QueryPromotionsDto) {
    return this.promotionsService.findAll(query);
  }

  @Get('code/:code')
  @Permissions('PROMOTION:READ')
  @ApiOperation({ summary: 'Validar y obtener cupón por código' })
  async findByCode(@Param('code') code: string) {
    return this.promotionsService.findByCode(code);
  }

  @Get(':id')
  @Permissions('PROMOTION:READ')
  @ApiOperation({ summary: 'Obtener detalle de una promoción' })
  async findById(@Param('id') id: string) {
    return this.promotionsService.findById(id);
  }

  @Post()
  @Permissions('PROMOTION:CREATE')
  @ApiOperation({ summary: 'Crear nueva promoción o cupón de temporada' })
  async create(@Body() dto: CreatePromotionDto) {
    return this.promotionsService.create(dto);
  }

  @Patch(':id')
  @Permissions('PROMOTION:UPDATE')
  @ApiOperation({ summary: 'Actualizar datos de una promoción' })
  async update(@Param('id') id: string, @Body() dto: UpdatePromotionDto) {
    return this.promotionsService.update(id, dto);
  }

  @Patch(':id/status')
  @Permissions('PROMOTION:UPDATE')
  @ApiOperation({ summary: 'Activar o pausar una promoción' })
  async toggleStatus(
    @Param('id') id: string,
    @Body() dto: TogglePromotionStatusDto,
  ) {
    return this.promotionsService.toggleStatus(id, dto.isActive);
  }

  @Delete(':id')
  @Permissions('PROMOTION:CREATE')
  @ApiOperation({ summary: 'Eliminar una promoción' })
  async delete(@Param('id') id: string) {
    return this.promotionsService.delete(id);
  }
}
