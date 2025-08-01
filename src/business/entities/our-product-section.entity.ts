// === src/business/entities/our-product-section.entity.ts ===
import { ChildEntity, Column } from 'typeorm';
import { PageSection } from './page-section.entity';

@ChildEntity('products')
export class OurProductSection extends PageSection {
  @Column('jsonb')
  content: {
    headline: string;
    showCategories: boolean;
    showFilters: boolean;
  };
}