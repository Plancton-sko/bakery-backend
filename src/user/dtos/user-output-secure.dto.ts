// src/user/dtos/user-output-secure.dto.ts
import { Expose } from 'class-transformer';

export class UserOutputSecureDto {
  @Expose()
  id: string;
  
  @Expose()
  username: string;
  
  @Expose()
  email: string;
  
  @Expose()
  password: string;
  
  @Expose()
  role: string;
  
  @Expose()
  isActive: boolean;
}