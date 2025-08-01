// src/business/dto/sections/base-section.dto.ts
import { IsString, IsBoolean, IsOptional, IsNumber } from 'class-validator';

export class BaseSectionDto {
  @IsString()
  title: string;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean = true;

  @IsNumber()
  order: number;
}
