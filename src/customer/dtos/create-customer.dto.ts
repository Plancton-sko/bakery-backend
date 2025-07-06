//src/customes/dtos/create-customer.dto.ts
import { IsNotEmpty, IsEmail, IsString, IsOptional } from 'class-validator';

export class CreateCustomerDto {
  @IsNotEmpty()
  @IsString()
  firstName: string;

  @IsNotEmpty()
  @IsString()
  lastName: string;

  @IsNotEmpty()
  @IsEmail()
  email: string;

  @IsNotEmpty()
  @IsString()
  address: string;

  @IsOptional()
  @IsString()
  phone?: string;
}