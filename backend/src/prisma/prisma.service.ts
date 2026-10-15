import {
  Injectable,
  OnModuleInit,
  OnModuleDestroy,
  Logger,
} from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { TenantConnectionManager } from './tenant-connection-manager.js';
import { TenantContext } from '../common/multitenancy/tenant-context.js';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(PrismaService.name);

  get tenant(): any {
    return Reflect.get(this, 'tenant', this);
  }

  constructor(private readonly connectionManager: TenantConnectionManager) {
    super();

    // Wrap with Proxy to transparently route database queries
    // to the active tenant schema based on TenantContext
    return new Proxy(this, {
      get(target: PrismaService, prop: string | symbol, receiver: any) {
        if (prop === 'publicClient') {
          return target;
        }

        // SaaS/Central models always query the public schema
        if (prop === 'tenant') {
          const val = Reflect.get(target, prop, target);
          return typeof val === 'function' ? (val as any).bind(target) : val;
        }

        // Methods that must stay bound to PrismaService itself
        if (
          prop === 'onModuleInit' ||
          prop === 'onModuleDestroy' ||
          prop === 'connectionManager' ||
          prop === 'logger'
        ) {
          const val = Reflect.get(target, prop, target);
          return typeof val === 'function' ? val.bind(target) : val;
        }

        // Check if a tenant schema is currently active in request context
        const schema = TenantContext.getSchema();
        if (schema && schema !== 'public') {
          const tenantClient = target.connectionManager.getClientForSchema(schema);
          const val = Reflect.get(tenantClient, prop, tenantClient);
          return typeof val === 'function' ? val.bind(tenantClient) : val;
        }

        // Default: use public schema client
        const val = Reflect.get(target, prop, receiver);
        return typeof val === 'function' ? val.bind(target) : val;
      },
    });
  }

  get publicClient(): PrismaClient & { tenant: any } {
    return this as any;
  }

  async onModuleInit() {
    const maxRetries = 5;
    const retryDelay = 2000;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        await this.$connect();
        this.logger.log('Conexión con PostgreSQL (Esquema central public) establecida exitosamente.');
        return;
      } catch (error: any) {
        if (attempt === maxRetries) {
          this.logger.error(
            `No se pudo conectar a PostgreSQL tras ${maxRetries} intentos: ${error.message}`,
          );
          throw error;
        }
        this.logger.warn(
          `Intento ${attempt}/${maxRetries} fallido al conectar a PostgreSQL. Reintentando en ${retryDelay / 1000}s...`,
        );
        await new Promise((resolve) => setTimeout(resolve, retryDelay));
      }
    }
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
