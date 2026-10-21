import {
  IsString,
  IsNotEmpty,
  IsOptional,
  Matches,
  MinLength,
  MaxLength,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateMyTenantDto {
  @ApiProperty({ example: 'Zapatería Imperial' })
  @IsString()
  @IsNotEmpty({ message: 'El nombre comercial de la tienda es obligatorio.' })
  @MinLength(2, { message: 'El nombre de la tienda debe tener al menos 2 caracteres.' })
  @MaxLength(80)
  name: string;

  @ApiProperty({ example: 'zapateria-imperial' })
  @IsString()
  @IsNotEmpty({ message: 'El subdominio o identificador (slug) es obligatorio.' })
  @MinLength(3, { message: 'El subdominio debe tener al menos 3 caracteres.' })
  @MaxLength(50)
  @Matches(/^[a-z0-9-]+$/, {
    message: 'El slug solo puede contener letras minúsculas, números y guiones.',
  })
  slug: string;

  @ApiProperty({ example: 'Calzado & Marroquinería', required: false })
  @IsString()
  @IsOptional()
  category?: string;

  @ApiProperty({ example: '+591 70012345', required: false })
  @IsString()
  @IsOptional()
  phone?: string;

  @ApiProperty({ example: '#1D8B94', required: false })
  @IsString()
  @IsOptional()
  primaryColor?: string;

  @ApiProperty({ required: false, description: 'Ignorado si el usuario ya tiene un plan activo; solo aplica si no posee tiendas previas.' })
  @IsString()
  @IsOptional()
  plan?: 'STARTER' | 'PRO' | 'ENTERPRISE';
}

export class SwitchTenantDto {
  @ApiProperty({ example: 'zapateria-imperial' })
  @IsString()
  @IsNotEmpty({ message: 'Debe indicar el slug de la tienda a la que desea cambiar.' })
  slug: string;
}
