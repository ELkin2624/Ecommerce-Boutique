import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { InventoryService } from '../services/inventory.service.js';
import {
  QueryStockDto,
  TransferStockDto,
  AdjustStockDto,
  CreateMovementDto,
  QueryMovementsDto,
} from '../dto/inventory.dto.js';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard.js';
import { PermissionsGuard } from '../../../common/guards/permissions.guard.js';
import { Permissions } from '../../../common/decorators/permissions.decorator.js';

@Controller('inventory')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  @Get('stock')
  @Permissions('INVENTORY:VIEW')
  async getStock(@Query() query: QueryStockDto) {
    return this.inventoryService.getStock(query);
  }

  @Get('movements')
  @Permissions('INVENTORY:VIEW')
  async getMovements(@Query() query: QueryMovementsDto) {
    return this.inventoryService.getMovements(query);
  }

  @Get('locations')
  @Permissions('INVENTORY:VIEW')
  async getLocations(@Query('branchId') branchId?: string) {
    return this.inventoryService.getLocations(branchId);
  }

  @Post('transfer')
  @Permissions('INVENTORY:TRANSFER')
  async transferStock(@Body() dto: TransferStockDto, @Request() req: any) {
    return this.inventoryService.transferStock(dto, req.user.id);
  }

  @Post('adjust')
  @Permissions('INVENTORY:TRANSFER')
  async adjustStock(@Body() dto: AdjustStockDto, @Request() req: any) {
    return this.inventoryService.adjustStock(dto, req.user.id);
  }

  @Post('movements')
  @Permissions('INVENTORY:TRANSFER')
  async createMovement(@Body() dto: CreateMovementDto, @Request() req: any) {
    return this.inventoryService.createMovement(dto, req.user.id);
  }
}
