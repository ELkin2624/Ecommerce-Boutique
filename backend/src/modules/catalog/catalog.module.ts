import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { CatalogController } from './controllers/catalog.controller.js';
import { CatalogService } from './services/catalog.service.js';
import { ImageProcessingService } from './services/image-processing.service.js';
import { HybridFittingService } from './services/hybrid-fitting.service.js';
import { PrismaModule } from '../../prisma/prisma.module.js';
import { AuthModule } from '../auth/auth.module.js';
import { AiClientModule } from '../ai-client/ai-client.module.js';

@Module({
  imports: [PrismaModule, PassportModule, AuthModule, AiClientModule],
  controllers: [CatalogController],
  providers: [CatalogService, ImageProcessingService, HybridFittingService],
  exports: [CatalogService, ImageProcessingService, HybridFittingService],
})
export class CatalogModule {}
