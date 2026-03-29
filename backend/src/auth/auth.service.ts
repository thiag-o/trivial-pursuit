import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {
  constructor(private readonly jwtService: JwtService) {}

  login(nickname: string): { token: string } {
    const token = this.jwtService.sign({ nickname });
    return { token };
  }
}
