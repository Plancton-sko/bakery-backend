// src/auth/dtos/login-response.dto.ts
export class LoginResponseDto {
  message: string;
  user: {
    id: string;
    email: string;
    role: string;
    isActive: boolean;
  };
}