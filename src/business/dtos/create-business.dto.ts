// src/business/dtos/create-business.dto.ts
import { IsString, IsOptional, IsObject, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateBusinessDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  logoUrl?: string;

  @IsOptional()
  @IsString()
  faviconUrl?: string;

  @IsOptional()
  @IsObject()
  colorPalette?: {
    primaryColor: string;
    secondaryColor: string;
    backgroundColor: string;
    textColor: string;
  };

  @IsOptional()
  @IsObject()
  globalConfig?: {
    layoutMode?: 'boxed' | 'full';
    fontFamily?: string;
    darkMode?: boolean;
  };
}
