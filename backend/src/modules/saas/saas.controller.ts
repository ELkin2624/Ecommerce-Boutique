import {
  Controller, Get, Post, Patch, Body, Param, Req, UseGuards,
  HttpStatus, HttpCode, BadRequestException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { SaasService } from './saas.service.js';
import { RegisterTenantDto } from './dto/register-tenant.dto.js';
import { CreateMyTenantDto, SwitchTenantDto } from './dto/create-my-tenant.dto.js';
import { UpdateTenantProfileDto } from './dto/update-tenant-profile.dto.js';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';

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
      'Inquilino registrado y esquema PostgreSQL creado sin datos comerciales previos.',
  })
  async registerTenant(@Body() dto: RegisterTenantDto) {
    const result = await this.saasService.registerTenant(dto);
    return {
      statusCode: HttpStatus.CREATED,
      data: result,
    };
  }

  @Get('my-tenants')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Listar tiendas autorizadas del usuario autenticado y cupo de su plan',
  })
  async getMyTenants(@Req() req: any) {
    const result = await this.saasService.getMyTenants(req.user);
    return {
      statusCode: HttpStatus.OK,
      data: result,
    };
  }

  @Post('my-tenants')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Crear una nueva tienda desde el panel reutilizando el usuario global autenticado',
  })
  async createMyTenant(@Req() req: any, @Body() dto: CreateMyTenantDto) {
    const result = await this.saasService.createTenantForAuthenticatedUser(
      req.user,
      dto,
    );
    return {
      statusCode: HttpStatus.CREATED,
      data: result,
    };
  }

  @Post('switch-tenant')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Cambiar de tienda activa validando membresía y emitiendo sesión del nuevo esquema',
  })
  async switchTenant(@Req() req: any, @Body() dto: SwitchTenantDto) {
    const result = await this.saasService.switchTenant(req.user, dto.slug);
    return {
      statusCode: HttpStatus.OK,
      data: result,
    };
  }

  @Get('domains/check/:slug')
  @ApiOperation({
    summary: 'Verificar disponibilidad de subdominio (slug) antes de crear una tienda',
  })
  async checkDomainAvailability(@Param('slug') slug: string) {
    const result = await this.saasService.checkSlugAvailability(slug);
    return {
      statusCode: HttpStatus.OK,
      data: result,
    };
  }

  @Post('auth/lookup')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Verificar si un email existe o es nuevo comerciante (Shopify-Style Lookup)',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Retorna si el usuario existe (sin revelar tiendas hasta validar contraseña).',
  })
  async lookupUser(@Body('email') email: string) {
    if (!email || typeof email !== 'string') {
      throw new BadRequestException('El correo electrónico es requerido.');
    }
    const result = await this.saasService.lookupUserTenants(email);
    return {
      statusCode: HttpStatus.OK,
      data: result,
    };
  }

  @Post('auth/verify-login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Verificar contraseña central del usuario y retornar sus tiendas autorizadas',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Credenciales válidas. Retorna las tiendas autorizadas para el Store Picker.',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Contraseña incorrecta.',
  })
  async verifyLogin(
    @Body('email') email: string,
    @Body('password') password: string,
  ) {
    const result = await this.saasService.verifyCredentials({ email, password });
    return {
      statusCode: HttpStatus.OK,
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

  @Patch('tenants/:slug/profile')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Actualizar perfil comercial, branding y configuración de tienda (Store Settings)',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Perfil de la tienda actualizado con éxito.',
  })
  async updateTenantProfile(
    @Req() req: any,
    @Param('slug') slug: string,
    @Body() dto: UpdateTenantProfileDto,
  ) {
    const updated = await this.saasService.updateTenantProfile(req.user, slug, dto);
    return {
      statusCode: HttpStatus.OK,
      data: updated,
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
