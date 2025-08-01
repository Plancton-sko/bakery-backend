// src/business/dto/sections/create-section.dto.ts
import { CreateContactSectionDto } from './contact-section.dto';
import { CreateHeroSliderSectionDto } from './hero-slider-section.dto';


export type CreatePageSectionDto =
  | CreateHeroSliderSectionDto
  | CreateContactSectionDto;
