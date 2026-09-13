import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsNumber,
  IsBoolean,
  IsDateString,
  Min,
  Max,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreatePromotionDto {
  @ApiProperty({ description: 'Nombre de la promoción', example: 'Descuento Primavera 2026' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ description: 'Código del cupón/promoción', example: 'PRIMAVERA25' })
  @IsString()
  @IsNotEmpty()
  code: string;

  @ApiPropertyOptional({ description: 'Descripción de la promoción', example: '25% de descuento en colección de temporada' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ description: 'Porcentaje de descuento (0 a 100)', example: 25.0 })
  @Type(() => Number)
  @IsNumber()
  @Min(0.01)
  @Max(100.0)
  discountPercent: number;

  @ApiPropertyOptional({ description: 'Monto mínimo de compra para aplicar', example: 100.0 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  minPurchaseAmount?: number;

  @ApiProperty({ description: 'Fecha de inicio (ISO)', example: '2026-09-01T00:00:00.000Z' })
  @IsDateString()
  startDate: string;

  @ApiProperty({ description: 'Fecha de finalización (ISO)', example: '2026-09-30T23:59:59.000Z' })
  @IsDateString()
  endDate: string;

  @ApiPropertyOptional({ description: 'Estado activo o pausado', default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class UpdatePromotionDto {
  @ApiPropertyOptional({ description: 'Nombre de la promoción' })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({ description: 'Código del cupón' })
  @IsString()
  @IsOptional()
  code?: string;

  @ApiPropertyOptional({ description: 'Descripción' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ description: 'Porcentaje de descuento' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0.01)
  @Max(100.0)
  discountPercent?: number;

  @ApiPropertyOptional({ description: 'Monto mínimo de compra' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  minPurchaseAmount?: number;

  @ApiPropertyOptional({ description: 'Fecha de inicio' })
  @IsDateString()
  @IsOptional()
  startDate?: string;

  @ApiPropertyOptional({ description: 'Fecha de finalización' })
  @IsDateString()
  @IsOptional()
  endDate?: string;

  @ApiPropertyOptional({ description: 'Estado activo' })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class TogglePromotionStatusDto {
  @ApiProperty({ description: 'Nuevo estado de activación' })
  @IsBoolean()
  isActive: boolean;
}

export class QueryPromotionsDto {
  @ApiPropertyOptional({ description: 'Filtrar solo activas' })
  @IsOptional()
  activeOnly?: boolean;

  @ApiPropertyOptional({ description: 'Búsqueda por nombre o código' })
  @IsOptional()
  @IsString()
  search?: string;
}
