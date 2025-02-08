// src/user/dtos/create-admin.dto.ts
import { IsEmail, IsString } from 'class-validator';

export class CreateAdminDto {
  @IsString()
  username: string;

  @IsEmail()
  email: string;

  @IsString()
  password: string;

  @IsString()
  adminSecret: string; // Chave secreta para criação de admin
}