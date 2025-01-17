import { Exclude } from 'class-transformer';

export class UserOutputDto {
  id: number;
  username: string;
  email: string;

  @Exclude()
  password: string; // Exclui a senha da resposta
}
