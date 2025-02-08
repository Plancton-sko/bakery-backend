// src/auth/strategies/local.strategy.ts
import { Strategy } from 'passport-local';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthService } from '../auth.service';

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy) {
  constructor(private authService: AuthService) {
    // Por padrão, o passport-local utiliza os campos "username" e "password"
    super({ usernameField: 'email' });
  }

  async validate(email: string, password: string): Promise<any> {
    console.log("Localstrategy: O email é: ", email, "\nA senha é: ", password);
    const user = await this.authService.validateUser(email, password);
    if (!user) {
      throw new UnauthorizedException('Credenciais inválidas');
    }
    return user;
  }
}
