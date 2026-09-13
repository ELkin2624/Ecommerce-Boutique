import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { BranchesController } from './controllers/branches.controller.js';
import { BranchesService } from './services/branches.service.js';
import { PrismaModule } from '../../prisma/prisma.module.js';
import { AuthModule } from '../auth/auth.module.js';

@Module({
  imports: [PrismaModule, PassportModule, AuthModule],
  controllers: [BranchesController],
  providers: [BranchesService],
  exports: [BranchesService],
})
export class BranchesModule {}
