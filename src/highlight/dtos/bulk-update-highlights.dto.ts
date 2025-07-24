// src/highlight/dtos/bulk-update-highlights.dto.ts
import { IsArray, IsBoolean, IsNumber, IsOptional, IsString, ValidateNested } from 'class-validator';
import { Transform, Type } from 'class-transformer';

export class HighlightData {
  @IsString()
  id: string;

  @IsString()
  name: string;

  @Transform(({ value }) => Number(value))
  @IsNumber()
  price: number;

  @IsString()
  image: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class BulkUpdateHighlightsDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => HighlightData)
  highlights: HighlightData[];
}