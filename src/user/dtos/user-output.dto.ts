// src/user/dtos/user-output.dto.ts
import { Expose, Exclude } from 'class-transformer';

export class UserOutputDto  {
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

  @Exclude()
  password: string; // Senha excluída da resposta
}
