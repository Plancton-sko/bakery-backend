// src/user/dtos/user-output-secure.dto.ts
import { Expose, Exclude } from 'class-transformer';

export class UserOutputSecureDto  {
  @Expose()
  id: string;

  @Expose()
  username: string;

  @Expose()
  email: string;

  @Expose()
  role: string;

  @Expose()
  isActive: boolean;

  @Expose()
  isDeleted: boolean;

  @Expose()
  lastLoginAt: Date | null;

  @Expose()
  lastUpdateAt: Date | null;

  @Expose()
  wasDeletedAt: Date | null;

  @Expose()
  lastActivityAt: Date | null;

  @Expose()
  password: string; // Senha exposta para metodos de autenticação
}
