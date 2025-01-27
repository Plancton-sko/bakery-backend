import { Controller, Post, Body, Request, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dtos/login.dto';
import { LoginResponseDto } from './dtos/login-response.dto';


@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) { }

  @Post('login')
  async login(@Body() body: LoginDto): Promise<LoginResponseDto> {
    const user = await this.authService.validateUser(body.email, body.password);
    const result = await this.authService.generateToken(user);
    return {
      message: 'Login was succeed',
      token: result,
      user: user,
    };
  }

  @Post('logout')
  async logout() {
    // Logout em JWT é apenas um mecanismo de revogação, que pode ser implementado via blacklist
    return { message: 'Logout feito com sucesso' };
  }
}
