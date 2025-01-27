//src/auth/auth.service.ts
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { plainToInstance } from 'class-transformer';
import { UserOutputDto } from 'src/user/dtos/user-output.dto';
import { UserService } from 'src/user/user.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UserService,
    private readonly jwtService: JwtService,
  ) { }

  async validateUser(email: string, password: string): Promise<UserOutputDto> {
    const user = await this.usersService.findOneByEmailSecure(email);

    console.log('Usuário encontrado:', user); // Verifique se o usuário tem um password válido

    if (!user || !user.password) {
      throw new UnauthorizedException('Usuário não encontrado ou sem senha');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Credenciais inválidas');
    }

    return plainToInstance(UserOutputDto, user);
  }

  async generateToken(user: UserOutputDto): Promise<string> {
    const payload = { id: user.id, email: user.email, role: user.role };
    return this.jwtService.sign(payload);
  }
}
