// src/highlight/dtos/create-highlight.dto.ts
import { IsString, IsOptional, IsBoolean, IsNumber } from 'class-validator';

export class CreateHighlightDto {
  @IsString()
  productId: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsNumber()
  order?: number;
}