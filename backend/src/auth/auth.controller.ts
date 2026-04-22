import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { Public } from './decorators';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Obter token JWT', description: 'Rota pública. Informe um nickname para receber o Bearer token usado nas demais rotas.' })
  @ApiResponse({ status: 201, description: 'Token gerado com sucesso', schema: { example: { token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' } } })
  @ApiResponse({ status: 400, description: 'Nickname inválido ou ausente' })
  login(@Body() dto: LoginDto): { token: string } {
    return this.authService.login(dto.nickname);
  }
}
