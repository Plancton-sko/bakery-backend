// src/product/dto/create-product.dto.ts
import { Transform } from 'class-transformer';
import { IsString, IsNumber, IsNotEmpty, IsUrl, IsBase64, IsOptional, Min } from 'class-validator';

export class CreateProductDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @Transform(({ value }) => parseFloat(value))
  @IsNumber()
  @Min(0)
  price: number;

  @IsString()
  @IsNotEmpty()
  category: string;

  @IsString()
  @IsOptional()
  image?: string;

  @IsString()
  @IsNotEmpty()
  description: string;
}
