import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { PrismaModule } from './prisma/prisma.module.js';
import { AuthModule } from './modules/auth/auth.module.js';
import { UsersModule } from './modules/users/users.module.js';
import { BranchesModule } from './modules/branches/branches.module.js';
import { AiClientModule } from './modules/ai-client/ai-client.module.js';
import { ReportsModule } from './modules/reports/reports.module.js';
import { CatalogModule } from './modules/catalog/catalog.module.js';
import { InventoryModule } from './modules/inventory/inventory.module.js';
import { ReservationsModule } from './modules/reservations/reservations.module.js';
import { OrdersModule } from './modules/orders/orders.module.js';
import { PromotionsModule } from './modules/promotions/promotions.module.js';
import { SuppliersModule } from './modules/suppliers/suppliers.module.js';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    ScheduleModule.forRoot(),
    PrismaModule,
    AuthModule,
    UsersModule,
    BranchesModule,
    AiClientModule,
    ReportsModule,
    CatalogModule,
    InventoryModule,
    ReservationsModule,
    OrdersModule,
    PromotionsModule,
    SuppliersModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
