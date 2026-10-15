import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service.js';
import { TenantConnectionManager } from './tenant-connection-manager.js';

@Global()
@Module({
  providers: [TenantConnectionManager, PrismaService],
  exports: [TenantConnectionManager, PrismaService],
})
export class PrismaModule {}
