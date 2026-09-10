import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { ReservationsController } from './controllers/reservations.controller.js';
import { ReservationsService } from './services/reservations.service.js';
import { ReservationsCronService } from './services/reservations-cron.service.js';
import { PrismaModule } from '../../prisma/prisma.module.js';
import { AuthModule } from '../auth/auth.module.js';

@Module({
  imports: [PrismaModule, PassportModule, AuthModule],
  controllers: [ReservationsController],
  providers: [ReservationsService, ReservationsCronService],
  exports: [ReservationsService],
})
export class ReservationsModule {}
