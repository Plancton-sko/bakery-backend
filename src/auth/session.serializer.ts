// src/auth/session.serializer.ts
import { Injectable } from '@nestjs/common';
import { PassportSerializer } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { UserService } from 'src/user/user.service';

@Injectable()
export class SessionSerializer extends PassportSerializer {
  constructor(private readonly userService: UserService) {
    super();
  }

  serializeUser(user: any, done: (err: Error, user: any) => void): any {
    // Armazena apenas o ID do usuário na session
    console.log("SessionSerializer: O usuario é este: ", user);
    done(null, user.id);
    
  }

  async deserializeUser(userId: string, done: (err: Error, user: any) => void): Promise<any> {
    const user = await this.userService.findOne(userId);
    if (!user) {
      return done(new Error('Usuário não encontrado'), null);
    }
    done(null, user);
  }
}
