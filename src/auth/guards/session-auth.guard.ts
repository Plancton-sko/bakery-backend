// src/auth/guards/session-auth.guard.ts
import { Injectable, ExecutionContext } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class SessionAuthGuard extends AuthGuard('session') {
  async canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest();
    if (request.isAuthenticated()) return true;
    
    const result = await super.canActivate(context);
    await super.logIn(request);
    return result as boolean;
  }
}