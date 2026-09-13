import {
  IsString,
  IsOptional,
  IsEnum,
  IsArray,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { LocationType } from '@prisma/client';

export class CreateCityDto {
  @IsString()
  name!: string;
}

export class UpdateCityDto {
  @IsString()
  name!: string;
}

export class CreateLocationDto {
  @IsString()
  name!: string;

  @IsEnum(LocationType)
  type!: LocationType; // WAREHOUSE | SALES_FLOOR
}

export class CreateBranchDto {
  @IsString()
  name!: string;

  @IsString()
  address!: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsString()
  cityId!: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateLocationDto)
  locations?: CreateLocationDto[];

  @IsOptional()
  @IsString()
  warehouseId?: string;
}

export class UpdateBranchDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  cityId?: string;
}

export class UpdateLocationDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  branchId?: string;

  @IsOptional()
  @IsEnum(LocationType)
  type?: LocationType;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  sharedBranchIds?: string[];
}

export class AssignWarehouseDto {
  @IsString()
  warehouseId!: string;
}
