import {
  IsString,
  IsOptional,
  IsArray,
  ValidateNested,
  IsNumber,
  Min,
  IsEnum,
  Max,
} from 'class-validator';
import { Type } from 'class-transformer';
import { OrderType, PaymentMethod, OrderStatus } from '@prisma/client';

export class OrderItemInputDto {
  @IsString()
  variantId!: string;

  @IsNumber()
  @Min(1)
  quantity!: number;
}

export class CheckoutDto {
  @IsString()
  branchId!: string;

  @IsEnum(OrderType)
  type!: OrderType; // ONLINE | IN_STORE

  @IsEnum(PaymentMethod)
  paymentMethod!: PaymentMethod; // CASH | CARD | QR | GATEWAY

  @IsOptional()
  @IsString()
  idempotencyKey?: string;

  @IsOptional()
  @IsString()
  fromReservationId?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OrderItemInputDto)
  items?: OrderItemInputDto[];
}

export class QueryOrdersDto {
  @IsOptional()
  @IsString()
  userId?: string;

  @IsOptional()
  @IsString()
  branchId?: string;

  @IsOptional()
  @IsEnum(OrderStatus)
  status?: OrderStatus;

  @IsOptional()
  @IsEnum(OrderType)
  type?: OrderType;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(100)
  limit: number = 20;
}
