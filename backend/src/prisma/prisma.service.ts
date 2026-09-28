import {
  Injectable,
  OnModuleInit,
  OnModuleDestroy,
  Logger,
} from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(PrismaService.name);

  async onModuleInit() {
    const maxRetries = 5;
    const retryDelay = 2000;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        await this.$connect();
        this.logger.log('Conexión con PostgreSQL establecida exitosamente.');
        return;
      } catch (error: any) {
        if (attempt === maxRetries) {
          this.logger.error(
            `No se pudo conectar a la base de datos tras ${maxRetries} intentos: ${error.message}`,
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

