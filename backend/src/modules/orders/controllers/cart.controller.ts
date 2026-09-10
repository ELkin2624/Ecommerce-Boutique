import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import { CartService } from '../services/cart.service.js';
import { AddToCartDto, UpdateCartItemDto } from '../dto/cart.dto.js';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard.js';

@Controller('cart')
@UseGuards(JwtAuthGuard)
export class CartController {
  constructor(private readonly cartService: CartService) {}

  @Get()
  async getCart(@Request() req: any) {
    return this.cartService.getCart(req.user.id);
  }

  @Post('items')
  async addItem(@Body() dto: AddToCartDto, @Request() req: any) {
    return this.cartService.addItem(req.user.id, dto);
  }

  @Patch('items/:variantId')
  async updateItem(
    @Param('variantId') variantId: string,
    @Body() dto: UpdateCartItemDto,
    @Request() req: any,
  ) {
    return this.cartService.updateItem(req.user.id, variantId, dto);
  }

  @Delete('items/:variantId')
  async removeItem(
    @Param('variantId') variantId: string,
    @Request() req: any,
  ) {
    return this.cartService.removeItem(req.user.id, variantId);
  }

  @Delete()
  async clearCart(@Request() req: any) {
    return this.cartService.clearCart(req.user.id);
  }
}
