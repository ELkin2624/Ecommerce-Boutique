import {
  Controller, Get, Post, Patch, Delete, Param, Body, Query,
  UseGuards, Request,
} from '@nestjs/common';
import { CatalogService } from '../services/catalog.service.js';
import {
  CreateProductDto, UpdateProductDto, CreateProductVariantDto,
  UpdateProductVariantDto, QueryProductsDto, CreateProductImageDto,
  CreateCategoryDto, UpdateCategoryDto, CreateSeasonDto,
  UpdateSeasonDto, CreateCollectionDto, UpdateCollectionDto,
  CreateSupplierDto, UpdateSupplierDto,
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

  // --- CATEGORÍAS ---
  @Get('categories')
  async getCategories() {
    return this.catalogService.getCategories();
  }

  @Post('categories')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('PRODUCT:CREATE')
  async createCategory(@Body() dto: CreateCategoryDto) {
    return this.catalogService.createCategory(dto);
  }

  @Patch('categories/:id')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('PRODUCT:UPDATE')
  async updateCategory(@Param('id') id: string, @Body() dto: UpdateCategoryDto) {
    return this.catalogService.updateCategory(id, dto);
  }

  @Delete('categories/:id')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('PRODUCT:UPDATE')
  async deleteCategory(@Param('id') id: string) {
    return this.catalogService.deleteCategory(id);
  }

  // --- TEMPORADAS ---
  @Get('seasons')
  async getSeasons() {
    return this.catalogService.getSeasons();
  }

  @Post('seasons')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('PRODUCT:CREATE')
  async createSeason(@Body() dto: CreateSeasonDto) {
    return this.catalogService.createSeason(dto);
  }

  @Patch('seasons/:id')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('PRODUCT:UPDATE')
  async updateSeason(@Param('id') id: string, @Body() dto: UpdateSeasonDto) {
    return this.catalogService.updateSeason(id, dto);
  }

  @Delete('seasons/:id')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('PRODUCT:UPDATE')
  async deleteSeason(@Param('id') id: string) {
    return this.catalogService.deleteSeason(id);
  }

  // --- COLECCIONES ---
  @Get('collections')
  async getCollections() {
    return this.catalogService.getCollections();
  }

  @Post('collections')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('PRODUCT:CREATE')
  async createCollection(@Body() dto: CreateCollectionDto) {
    return this.catalogService.createCollection(dto);
  }

  @Patch('collections/:id')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('PRODUCT:UPDATE')
  async updateCollection(@Param('id') id: string, @Body() dto: UpdateCollectionDto) {
    return this.catalogService.updateCollection(id, dto);
  }

  @Delete('collections/:id')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('PRODUCT:UPDATE')
  async deleteCollection(@Param('id') id: string) {
    return this.catalogService.deleteCollection(id);
  }

  // --- PROVEEDORES ---
  @Get('suppliers')
  async getSuppliers() {
    return this.catalogService.getSuppliers();
  }

  @Post('suppliers')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('PRODUCT:CREATE')
  async createSupplier(@Body() dto: CreateSupplierDto) {
    return this.catalogService.createSupplier(dto);
  }

  @Patch('suppliers/:id')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('PRODUCT:UPDATE')
  async updateSupplier(@Param('id') id: string, @Body() dto: UpdateSupplierDto) {
    return this.catalogService.updateSupplier(id, dto);
  }

  @Delete('suppliers/:id')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('PRODUCT:UPDATE')
  async deleteSupplier(@Param('id') id: string) {
    return this.catalogService.deleteSupplier(id);
  }

  // --- PRODUCTOS ---
  @Post('products')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('PRODUCT:CREATE')
  async createProduct(@Body() dto: CreateProductDto, @Request() req: any) {
    return this.catalogService.createProduct(dto, req.user?.id || 'admin');
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

  @Delete('products/:id')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('PRODUCT:UPDATE')
  async deleteProduct(@Param('id') id: string) {
    return this.catalogService.deleteProduct(id);
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

  @Delete('variants/:id')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('PRODUCT:UPDATE')
  async deleteVariant(@Param('id') id: string) {
    return this.catalogService.deleteVariant(id);
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

  @Delete('products/:productId/images/:imageId')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('PRODUCT:UPDATE')
  async deleteImage(
    @Param('productId') productId: string,
    @Param('imageId') imageId: string,
  ) {
    return this.catalogService.deleteImage(productId, imageId);
  }

  @Patch('products/:productId/images/:imageId/cover')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('PRODUCT:UPDATE')
  async setCoverImage(
    @Param('productId') productId: string,
    @Param('imageId') imageId: string,
  ) {
    return this.catalogService.setCoverImage(productId, imageId);
  }
}
