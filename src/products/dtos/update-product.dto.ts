// src/product/dto/update-product.dto.ts
import { IsNumber, IsOptional, IsString, IsUrl } from "class-validator";

export class UpdateProductDto {
    @IsString()
    @IsOptional()
    name: string;
  
    @IsNumber({maxDecimalPlaces: 2})
    @IsOptional()
    price: number;
  
    @IsString()
    @IsOptional()
    category: string;
  
    @IsUrl()
    @IsOptional()
    image: string;
  
    @IsString()
    @IsOptional()
    description: string;
  }