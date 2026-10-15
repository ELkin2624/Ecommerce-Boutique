import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class TenantConnectionManager implements OnModuleDestroy {
  private readonly logger = new Logger(TenantConnectionManager.name);
  private readonly clients = new Map<string, PrismaClient>();
  private readonly baseDbUrl: string;

  constructor() {
    this.baseDbUrl =
      process.env.DATABASE_URL ||
      'postgresql://postgres:postgres@127.0.0.1:5435/fashionstore_db?schema=public';
  }

  getClientForSchema(schemaName: string): PrismaClient {
    // Return cached client if available
    if (this.clients.has(schemaName)) {
      return this.clients.get(schemaName)!;
    }

    const tenantDbUrl = this.buildUrlForSchema(schemaName);
    this.logger.log(`Inicializando PrismaClient para esquema de inquilino: "${schemaName}"`);

    const client = new PrismaClient({
      datasources: {
        db: {
          url: tenantDbUrl,
        },
      },
    });

    this.clients.set(schemaName, client);
    return client;
  }

  hasClient(schemaName: string): boolean {
    return this.clients.has(schemaName);
  }

  private buildUrlForSchema(schemaName: string): string {
    try {
      const parsed = new URL(this.baseDbUrl);
      parsed.searchParams.set('schema', schemaName);
      return parsed.toString();
    } catch {
      const [base] = this.baseDbUrl.split('?');
      return `${base}?schema=${schemaName}`;
    }
  }

  async onModuleDestroy() {
    this.logger.log('Cerrando conexiones de esquemas de inquilinos...');
    const disconnects = Array.from(this.clients.entries()).map(
      async ([schema, client]) => {
        try {
          await client.$disconnect();
          this.logger.debug(`Conexión cerrada para esquema: ${schema}`);
        } catch (err: any) {
          this.logger.error(
            `Error al desconectar esquema ${schema}: ${err.message}`,
          );
        }
      },
    );
    await Promise.all(disconnects);
    this.clients.clear();
  }
}
