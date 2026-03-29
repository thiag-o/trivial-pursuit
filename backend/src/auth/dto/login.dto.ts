import { IsNotEmpty, IsString, Matches, MaxLength } from 'class-validator';

export class LoginDto {
  @IsNotEmpty()
  @IsString()
  @MaxLength(30)
  @Matches(/\S/, { message: 'nickname must not be only whitespace' })
  nickname: string;
}
