// src/business/entities/hero-slider-section.entity.ts
import { ChildEntity, Column } from 'typeorm';
import { PageSection } from './page-section.entity';

@ChildEntity('hero')
export class HeroSliderSection extends PageSection {
  @Column('jsonb')
  content: {
    title: string;
    subtitle?: string;
    backgroundImage?: string;
    ctaText?: string;
    ctaLink?: string;
    overlayOpacity?: number;
    textAlignment: 'left' | 'center' | 'right';
  };
}