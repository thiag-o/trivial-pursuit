import { IsIn } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AnswerDto {
  @ApiProperty({ enum: ['a', 'b', 'c', 'd'], example: 'a', description: 'ID da alternativa escolhida' })
  @IsIn(['a', 'b', 'c', 'd'])
  answerId: string;
}
