import {
  IsString,
  IsOptional,
  MaxLength,
  MinLength,
  IsObject,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateTenantProfileDto {
  @ApiProperty({ example: 'Zapatería Zapatin', required: false })
  @IsString()
  @IsOptional()
  @MinLength(2, { message: 'El nombre debe tener al menos 2 caracteres.' })
  @MaxLength(80)
  name?: string;

  @ApiProperty({ example: 'https://ejemplo.com/logo.png', required: false })
  @IsString()
  @IsOptional()
  logoUrl?: string;

  @ApiProperty({ example: '#1D8B94', required: false })
  @IsString()
  @IsOptional()
  @MaxLength(20)
  primaryColor?: string;

  @ApiProperty({ example: '+591 70012345', required: false })
  @IsString()
  @IsOptional()
  @MaxLength(30)
  phone?: string;

  @ApiProperty({ example: 'Calzado & Marroquinería', required: false })
  @IsString()
  @IsOptional()
  @MaxLength(60)
  category?: string;

  @ApiProperty({ example: 'Elegancia y confort para cada paso', required: false })
  @IsString()
  @IsOptional()
  @MaxLength(150)
  tagline?: string;

  @ApiProperty({ example: '¡Envíos gratis en compras mayores a Bs 200!', required: false })
  @IsString()
  @IsOptional()
  @MaxLength(200)
  announcement?: string;

  @ApiProperty({ example: 'Av. San Martín #450, Santa Cruz', required: false })
  @IsString()
  @IsOptional()
  @MaxLength(150)
  address?: string;

  @ApiProperty({ required: false })
  @IsObject()
  @IsOptional()
  hero?: {
    headlinePrefix?: string;
    headlineHighlight?: string;
    description?: string;
    bannerUrl?: string;
    primaryCtaText?: string;
  };

  @ApiProperty({ required: false })
  @IsObject()
  @IsOptional()
  contact?: {
    whatsapp?: string;
    email?: string;
    instagram?: string;
    address?: string;
  };
}
