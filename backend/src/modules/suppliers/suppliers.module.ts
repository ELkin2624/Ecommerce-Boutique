import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { SuppliersController } from './controllers/suppliers.controller.js';
import { SuppliersService } from './services/suppliers.service.js';
import { PrismaModule } from '../../prisma/prisma.module.js';
import { AuthModule } from '../auth/auth.module.js';

@Module({
  imports: [PrismaModule, PassportModule, AuthModule],
  controllers: [SuppliersController],
  providers: [SuppliersService],
  exports: [SuppliersService],
})
export class SuppliersModule {}
