import { Module } from '@nestjs/common';
import { ReportsController } from './controllers/reports.controller.js';
import { ReportsService } from './services/reports.service.js';
import { PassportModule } from '@nestjs/passport';
import { AiClientModule } from '../ai-client/ai-client.module.js';
import { AuthModule } from '../auth/auth.module.js';

@Module({
  imports: [PassportModule, AuthModule, AiClientModule],
  controllers: [ReportsController],
  providers: [ReportsService],
  exports: [ReportsService],
})
export class ReportsModule {}
