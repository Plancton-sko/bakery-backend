// scr/auth/dtos/login-response.dto.ts
import { Expose } from 'class-transformer';
import { UserOutputDto } from 'src/user/dtos/user-output.dto';

export class LoginResponseDto {
  @Expose()
  message: string;

  @Expose()
  token: string;

  @Expose()
  user: UserOutputDto;
}
