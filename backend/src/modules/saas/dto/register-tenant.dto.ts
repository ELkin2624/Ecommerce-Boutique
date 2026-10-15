import {
  IsString,
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsIn,
  MinLength,
  Matches,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RegisterTenantDto {
  @ApiProperty({ example: 'Boutique Magnolia' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 'boutique-magnolia' })
  @IsString()
  @IsNotEmpty()
  @Matches(/^[a-z0-9-]+$/, {
    message: 'El slug solo puede contener letras minúsculas, números y guiones.',
  })
  slug: string;

  @ApiProperty({ example: 'PRO', enum: ['STARTER', 'PRO', 'ENTERPRISE'] })
  @IsIn(['STARTER', 'PRO', 'ENTERPRISE'])
  plan: 'STARTER' | 'PRO' | 'ENTERPRISE';

  @ApiProperty({ example: 'Mariana Silva' })
  @IsString()
  @IsNotEmpty()
  ownerName: string;

  @ApiProperty({ example: 'mariana@magnolia.com' })
  @IsEmail()
  @IsNotEmpty()
  ownerEmail: string;

  @ApiProperty({ example: 'ContrasenaSegura123!' })
  @IsString()
  @MinLength(6)
  password: string;

  @ApiProperty({ example: '+591 78912345', required: false })
  @IsString()
  @IsOptional()
  phone?: string;

  @ApiProperty({ example: '#ec4899', required: false })
  @IsString()
  @IsOptional()
  primaryColor?: string;

  @ApiProperty({ example: 'Alta Costura & Noche', required: false })
  @IsString()
  @IsOptional()
  category?: string;
}
