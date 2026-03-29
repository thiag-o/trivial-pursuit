import { IsInt } from 'class-validator';

export class MoveDto {
  @IsInt()
  targetPosition: number;
}
