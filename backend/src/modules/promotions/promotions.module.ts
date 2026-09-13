import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { PromotionsController } from './controllers/promotions.controller.js';
import { PromotionsService } from './services/promotions.service.js';
import { PrismaModule } from '../../prisma/prisma.module.js';
import { AuthModule } from '../auth/auth.module.js';

@Module({
  imports: [PrismaModule, PassportModule, AuthModule],
  controllers: [PromotionsController],
  providers: [PromotionsService],
  exports: [PromotionsService],
})
export class PromotionsModule {}
