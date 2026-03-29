import { IsIn } from 'class-validator';

export class AnswerDto {
  @IsIn(['a', 'b', 'c', 'd'])
  answerId: string;
}
