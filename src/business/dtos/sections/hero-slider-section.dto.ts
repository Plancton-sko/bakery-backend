// src/business/dto/sections/hero-slider-section.dto.ts
import { IsString, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { BaseSectionDto } from './base-section.dto';

class HeroContentDto {
  @IsString() title: string;
  @IsString() subtitle?: string;
  @IsString() backgroundImage?: string;
  @IsString() ctaText?: string;
  @IsString() ctaLink?: string;
  @IsString() textAlignment: 'left' | 'center' | 'right';
}

export class CreateHeroSliderSectionDto extends BaseSectionDto {
  @IsString()
  type: 'hero';

  @ValidateNested()
  @Type(() => HeroContentDto)
  content: HeroContentDto;
}
