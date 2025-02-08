// src/auth/auth.controller.ts
import { Controller, Get, InternalServerErrorException, Post, Request, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { UserOutputDto } from 'src/user/dtos/user-output.dto';
import { plainToInstance } from 'class-transformer';
import { LoginResponseDto } from './dtos/login-response.dto';
import { LocalAuthGuard } from './guards/local-auth.guard';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) { }


  @Post('login')
  @UseGuards(LocalAuthGuard)
  async login(@Request() req): Promise<LoginResponseDto> {
    return {
      message: 'Login successful',
      user: plainToInstance(UserOutputDto, req.user)
    };
  }

  @Post('logout')
  async logout(@Request() req) {
    req.logout((err) => {
      if (err) throw new InternalServerErrorException('Logout failed');
    });
    return { message: 'Logout successful' };
  }

  @Get('session')
  @UseGuards(LocalAuthGuard)
  getSession(@Request() req) {
    return plainToInstance(UserOutputDto, req.user);
  }
}
