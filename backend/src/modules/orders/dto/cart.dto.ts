import { IsString, IsNumber, Min } from 'class-validator';

export class AddToCartDto {
  @IsString()
  variantId!: string;

  @IsNumber()
  @Min(1)
  quantity: number = 1;
}

export class UpdateCartItemDto {
  @IsNumber()
  @Min(1)
  quantity!: number;
}
