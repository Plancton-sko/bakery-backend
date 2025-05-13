// src/auth/auth.module.ts
import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { UserModule } from '../user/user.module';
import { SessionSerializer } from './session.serializer';
import { AuthenticatedGuard } from './guards/authenticated.guard';
import { LocalStrategy } from './strategies/local.strategy';
import { EnhancedNativeLogger } from 'src/common/logger/nest-logger.service';

@Module({
  imports: [
    UserModule,
    PassportModule.register({ session: true }), // Enable session support
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    LocalStrategy,
    SessionSerializer,
    AuthenticatedGuard,
    EnhancedNativeLogger
  ],
  exports: [AuthService],
})
export class AuthModule { }
