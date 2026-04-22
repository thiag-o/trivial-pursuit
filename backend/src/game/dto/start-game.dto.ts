import { IsInt, IsOptional, Max, Min } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class StartGameDto {
  @ApiPropertyOptional({ example: 3, minimum: 1, maximum: 5, default: 3, description: 'Número de bots (1–5)' })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(5)
  opponents?: number = 3;
}
