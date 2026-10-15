import { Module } from '@nestjs/common';
import { SaasController } from './saas.controller.js';
import { SaasService } from './saas.service.js';
import { TenantProvisioningService } from './tenant-provisioning.service.js';

@Module({
  controllers: [SaasController],
  providers: [SaasService, TenantProvisioningService],
  exports: [SaasService, TenantProvisioningService],
})
export class SaasModule {}
