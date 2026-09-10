import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class QueryReportDto {
  @ApiProperty({
    description: 'Pregunta en lenguaje natural (escrita o por comando de voz)',
    example: '¿Cuáles son las prendas más vendidas en la sucursal Centro en el último mes?',
  })
  @IsString()
  @IsNotEmpty({ message: 'El texto de consulta es requerido' })
  queryText!: string;
}
