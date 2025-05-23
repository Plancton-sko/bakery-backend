// src/user/dtos/create-user.dto.ts
import { IsString, IsEmail, IsEnum, IsOptional, MinLength, MaxLength, IsBoolean } from 'class-validator';
import { UserRole } from '../user.entity';

export class CreateUserDto {
  @IsString()
  @MinLength(3)
  @MaxLength(20)
  username: string;

  @IsEmail()
  email: string;

  @IsString()
  @MinLength(8)
  password: string;

  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole = UserRole.USER; // Opcional, com padrão definido na entidade

  @IsOptional()
  @IsBoolean()
  isActive?: boolean; // Permitido configurar, mas padrão é `true`
}
