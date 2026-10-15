import { IsNumber, IsString, IsOptional, Min, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class CreatePaymentIntentDto {
  /** Monto en la moneda base (ej. 99.90 → se convierte a centavos internamente) */
  @IsNumber()
  @Min(1)
  amount!: number;

  /** Código ISO de moneda (por defecto 'usd' para pruebas Stripe) */
  @IsOptional()
  @IsString()
  currency?: string;

  /** Items del carrito para descripción del pago */
  @IsOptional()
  @IsArray()
  items?: { productName: string; quantity: number; unitPrice: number }[];
}

export class CreateQrPaymentDto {
  /** Monto total a pagar */
  @IsNumber()
  @Min(1)
  amount!: number;

  /** Código ISO de moneda */
  @IsOptional()
  @IsString()
  currency?: string;

  /** Descripción opcional del pago */
  @IsOptional()
  @IsString()
  description?: string;
}

export class ConfirmPaymentDto {
  /** PaymentIntent ID devuelto por Stripe */
  @IsString()
  paymentIntentId!: string;

  /** Order ID al que vincular el pago */
  @IsString()
  orderId!: string;
}
