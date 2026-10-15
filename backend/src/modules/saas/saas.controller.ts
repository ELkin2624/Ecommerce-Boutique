import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  HttpStatus,
  HttpCode,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { SaasService } from './saas.service.js';
import { RegisterTenantDto } from './dto/register-tenant.dto.js';

@ApiTags('SaaS & Multi-Tenancy')
@Controller('saas')
export class SaasController {
  constructor(private readonly saasService: SaasService) {}

  @Get('plans')
  @ApiOperation({
    summary: 'Listar planes de suscripción SaaS (estilo Google / Shopify)',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Lista de planes Starter, Pro y Enterprise con precios y límites.',
  })
  getPlans() {
    return {
      statusCode: HttpStatus.OK,
      data: this.saasService.getPlans(),
    };
  }

  @Post('tenants/register')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Registrar nueva tienda y aprovisionar su esquema PostgreSQL dedicado',
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description:
      'Inquilino registrado y esquema PostgreSQL creado con tablas y catálogo base.',
  })
  async registerTenant(@Body() dto: RegisterTenantDto) {
    const result = await this.saasService.registerTenant(dto);
    return {
      statusCode: HttpStatus.CREATED,
      data: result,
    };
  }

  @Get('tenants')
  @ApiOperation({
    summary: 'Listar todas las tiendas activas para el selector de inquilinos',
  })
  async getAllTenants() {
    const tenants = await this.saasService.getAllTenants();
    return {
      statusCode: HttpStatus.OK,
      data: tenants,
    };
  }

  @Get('tenants/:slug')
  @ApiOperation({ summary: 'Obtener información y branding de una tienda por su slug' })
  async getTenantBySlug(@Param('slug') slug: string) {
    const tenant = await this.saasService.getTenantBySlug(slug);
    return {
      statusCode: HttpStatus.OK,
      data: tenant,
    };
  }

  @Get('stats')
  @ApiOperation({ summary: 'Obtener estadísticas globales de la plataforma SaaS' })
  async getPlatformStats() {
    const stats = await this.saasService.getPlatformStats();
    return {
      statusCode: HttpStatus.OK,
      data: stats,
    };
  }
}
