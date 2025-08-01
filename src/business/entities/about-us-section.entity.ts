// === src/business/entities/about-us-section.entity.ts ===
import { ChildEntity, Column } from 'typeorm';
import { PageSection } from './page-section.entity';

@ChildEntity('about')
export class AboutUsSection extends PageSection {
  @Column('jsonb')
  content: {
    title: string;
    subtitle?: string;
    description: string;
    imageUrl?: string;
  };
}