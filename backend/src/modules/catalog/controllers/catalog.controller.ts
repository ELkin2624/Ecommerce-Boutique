import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { CatalogService } from '../services/catalog.service.js';
import {
  CreateProductDto,
  UpdateProductDto,
  CreateProductVariantDto,
  UpdateProductVariantDto,
  QueryProductsDto,
  CreateProductImageDto,
} from '../dto/catalog.dto.js';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard.js';
import { PermissionsGuard } from '../../../common/guards/permissions.guard.js';
import { Permissions } from '../../../common/decorators/permissions.decorator.js';

@Controller('catalog')
export class CatalogController {
  constructor(private readonly catalogService: CatalogService) {}

  @Get('products')
  async getProducts(@Query() query: QueryProductsDto) {
    return this.catalogService.findAll(query);
  }

  @Get('products/:id')
  async getProduct(
    @Param('id') id: string,
    @Query('branchId') branchId?: string,
  ) {
    return this.catalogService.findById(id, branchId);
  }

  @Get('categories')
  async getCategories() {
    return this.catalogService.getCategories();
  }

  @Get('seasons')
  async getSeasons() {
    return this.catalogService.getSeasons();
  }

  @Post('products')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('PRODUCT:CREATE')
  async createProduct(@Body() dto: CreateProductDto, @Request() req: any) {
    return this.catalogService.createProduct(dto, req.user.id);
  }

  @Patch('products/:id')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('PRODUCT:UPDATE')
  async updateProduct(
    @Param('id') id: string,
    @Body() dto: UpdateProductDto,
  ) {
    return this.catalogService.updateProduct(id, dto);
  }

  @Post('products/:id/variants')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('PRODUCT:CREATE')
  async addVariant(
    @Param('id') id: string,
    @Body() dto: CreateProductVariantDto,
  ) {
    return this.catalogService.addVariant(id, dto);
  }

  @Patch('variants/:id')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('PRODUCT:UPDATE')
  async updateVariant(
    @Param('id') id: string,
    @Body() dto: UpdateProductVariantDto,
  ) {
    return this.catalogService.updateVariant(id, dto);
  }

  @Post('products/:id/images')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('PRODUCT:UPDATE')
  async addImages(
    @Param('id') id: string,
    @Body() images: CreateProductImageDto[],
  ) {
    return this.catalogService.addImages(id, images);
  }
}
