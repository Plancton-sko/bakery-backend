// src/auth/auth.service.ts 
import { Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UserOutputSecureDto } from '../user/dtos/user-output-secure.dto';
import { UserService } from '../user/user.service';
import { plainToInstance } from 'class-transformer';

@Injectable()
export class AuthService {
  constructor(private readonly userService: UserService) {}

  async validateUser(email: string, password: string) {
    console.log("Authservice: O email é: ", email, "\nA senha é: ", password);
    const user = await this.userService.findOneByEmailSecure(email);
    if (!user || !(await bcrypt.compare(password, user.password))) {
      console.log();
      throw new UnauthorizedException('Invalid credentials');
    }
    return user;
  }


}