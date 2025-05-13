// src/product/dto/create-product.dto.ts
import { IsString, IsNumber, IsNotEmpty, IsUrl, IsBase64, IsOptional } from 'class-validator';

export class CreateProductDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsNumber({maxDecimalPlaces: 2})
  @IsNotEmpty()
  price: number;

  @IsString()
  @IsNotEmpty()
  category: string;

  @IsString()
  @IsOptional()
  image: string;

  @IsString()
  @IsNotEmpty()
  description: string;
}
