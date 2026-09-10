import { Controller, Post, Get, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { ReportsService } from '../services/reports.service.js';
import { QueryReportDto } from '../dto/query-report.dto.js';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard.js';
import { PermissionsGuard } from '../../../common/guards/permissions.guard.js';
import { Permissions } from '../../../common/decorators/permissions.decorator.js';
import { CurrentUser } from '../../../common/decorators/current-user.decorator.js';

@ApiTags('Reports')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Post('query')
  @Permissions('REPORT:GENERATE')
  @ApiOperation({
    summary: 'Generar reporte analítico mediante consulta en lenguaje natural (Texto)',
    description:
      'Envía la pregunta del usuario al microservicio de IA (FastAPI), extrae métricas y filtros, y ejecuta una consulta segura en PostgreSQL con Prisma.',
  })
  @ApiResponse({ status: 200, description: 'Reporte generado con métricas, gráficos y resumen ejecutivo' })
  @ApiResponse({ status: 403, description: 'Insufficient permissions (Requiere REPORT:GENERATE)' })
  async generateQueryReport(
    @Body() dto: QueryReportDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.reportsService.generateReport(dto.queryText, userId, 'STORE_MANAGER');
  }

  @Post('voice')
  @Permissions('REPORT:GENERATE')
  @ApiOperation({
    summary: 'Generar reporte analítico mediante transcripción de voz',
    description: 'Procesa la transcripción de audio recibida y la deriva al pipeline generativo unificado.',
  })
  @ApiResponse({ status: 200, description: 'Reporte por voz generado exitosamente' })
  async generateVoiceReport(
    @Body() dto: QueryReportDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.reportsService.generateReport(dto.queryText, userId, 'STORE_MANAGER');
  }

  @Get('dashboard')
  @Permissions('REPORT:VIEW')
  @ApiOperation({ summary: 'Obtener KPIs directos del Dashboard gerencial' })
  @ApiResponse({ status: 200, description: 'KPIs agregados de productos, sucursales y reservas' })
  async getDashboardKpis() {
    return this.reportsService.getDashboardKpis();
  }
}
