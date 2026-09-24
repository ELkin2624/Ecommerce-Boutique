import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { OrdersService } from '../services/orders.service.js';
import { CheckoutDto, QueryOrdersDto } from '../dto/orders.dto.js';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard.js';
import { PermissionsGuard } from '../../../common/guards/permissions.guard.js';
import { Permissions } from '../../../common/decorators/permissions.decorator.js';

@Controller('orders')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post('checkout')
  @Permissions('ORDER:CREATE')
  async checkout(@Body() dto: CheckoutDto, @Request() req: any) {
    return this.ordersService.checkout(req.user.id, dto);
  }

  @Post('sync-batch')
  @Permissions('ORDER:CREATE')
  async syncBatch(@Body() dtos: CheckoutDto[], @Request() req: any) {
    return this.ordersService.syncBatch(req.user.id, dtos);
  }

  @Get('my')
  async getMyOrders(@Request() req: any) {
    return this.ordersService.getUserOrders(req.user.id);
  }

  @Get()
  @Permissions('ORDER:VIEW')
  async getOrders(@Query() query: QueryOrdersDto) {
    return this.ordersService.getOrders(query);
  }

  @Get(':id')
  async getOrderById(@Param('id') id: string, @Request() req: any) {
    const isStaff =
      req.user.roles?.includes('ADMIN') ||
      req.user.roles?.includes('STORE_MANAGER') ||
      req.user.roles?.includes('CASHIER');
    return this.ordersService.getOrderById(id, req.user.id, isStaff);
  }
}
