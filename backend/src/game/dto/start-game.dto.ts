import { IsInt, IsOptional, Max, Min } from 'class-validator';

export class StartGameDto {
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(5)
  opponents?: number = 3;
}
