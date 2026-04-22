import { IsInt } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class MoveDto {
  @ApiProperty({ example: 7, description: 'Posição destino no tabuleiro (0–72)' })
  @IsInt()
  targetPosition: number;
}
