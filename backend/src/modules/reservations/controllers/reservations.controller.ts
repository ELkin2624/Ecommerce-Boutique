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
import { ReservationsService } from '../services/reservations.service.js';
import {
  CreateReservationDto,
  UpdateReservationStatusDto,
  QueryReservationsDto,
} from '../dto/reservations.dto.js';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard.js';
import { PermissionsGuard } from '../../../common/guards/permissions.guard.js';
import { Permissions } from '../../../common/decorators/permissions.decorator.js';

@Controller('reservations')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class ReservationsController {
  constructor(private readonly reservationsService: ReservationsService) {}

  @Post()
  @Permissions('RESERVATION:CREATE')
  async createReservation(
    @Body() dto: CreateReservationDto,
    @Request() req: any,
  ) {
    return this.reservationsService.createReservation(req.user.id, dto);
  }

  @Get('my')
  async getMyReservations(@Request() req: any) {
    return this.reservationsService.getUserReservations(req.user.id);
  }

  @Get()
  @Permissions('RESERVATION:VIEW')
  async getBranchReservations(@Query() query: QueryReservationsDto) {
    return this.reservationsService.getBranchReservations(query);
  }

  @Patch(':id/cancel')
  async cancelReservation(@Param('id') id: string, @Request() req: any) {
    // Si el usuario tiene rol ADMIN o STORE_MANAGER puede cancelar cualquier reserva, si no solo la suya
    const isStaff =
      req.user.roles?.includes('ADMIN') ||
      req.user.roles?.includes('STORE_MANAGER');
    return this.reservationsService.cancelReservation(id, req.user.id, isStaff);
  }

  @Patch(':id/status')
  @Permissions('RESERVATION:VIEW')
  async updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateReservationStatusDto,
    @Request() req: any,
  ) {
    return this.reservationsService.updateStatus(id, dto, req.user.id);
  }
}
