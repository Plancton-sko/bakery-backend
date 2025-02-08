// src/user/user.module.ts
import { Module } from '@nestjs/common';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './user.entity';
import { JwtModule } from '@nestjs/jwt';

@Module({
  imports: [
    TypeOrmModule.forFeature([User]),
    JwtModule.register({
      secret: process.env.JWT_SECRET ,
      signOptions: { expiresIn: '1h' },
    }),],
  providers: [UserService],
  controllers: [UserController],
  exports: [UserService]  
})
export class UserModule { }
