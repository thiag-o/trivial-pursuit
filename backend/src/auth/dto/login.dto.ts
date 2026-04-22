import { IsNotEmpty, IsString, Matches, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty({ example: 'Thiago', maxLength: 30 })
  @IsNotEmpty()
  @IsString()
  @MaxLength(30)
  @Matches(/\S/, { message: 'nickname must not be only whitespace' })
  nickname!: string;
}
