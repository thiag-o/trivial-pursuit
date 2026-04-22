import { IsInt, IsOptional, Max, Min } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class RollDiceDto {
  @ApiPropertyOptional({ example: 4, description: 'Valor fixo do dado (1–6). Apenas para testes.' })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(6)
  value?: number;
}
