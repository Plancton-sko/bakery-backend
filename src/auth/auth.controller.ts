// src/auth/auth.controller.ts
import { Controller, Get, InternalServerErrorException, Post, Request, Res, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { UserOutputDto } from 'src/user/dtos/user-output.dto';
import { plainToInstance } from 'class-transformer';
import { LoginResponseDto } from './dtos/login-response.dto';
import { LocalAuthGuard } from './guards/local-auth.guard';
import { Throttle } from '@nestjs/throttler';
import { EnhancedNativeLogger } from 'src/common/logger/nest-logger.service';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService, 
    private readonly logger: EnhancedNativeLogger
  ) { }



  @Post('login')
  @UseGuards(LocalAuthGuard)
  @Throttle({ default: { limit: 3, ttl: 60000 } })
  async login(@Request() req, @Res() res) {
    await new Promise<void>((resolve, reject) => {
      req.logIn(req.user, (err) => {
        if (err) return reject(err);
        resolve();
      });
    });
    return res.json({
      message: 'Login successful',
      user: plainToInstance(UserOutputDto, req.user),
      // csrfToken: req.csrfToken(), // Envia o token CSRF
    });
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
