// === src/business/entities/hot-deals-section.entity.ts ===
import { ChildEntity, Column } from 'typeorm';
import { PageSection } from './page-section.entity';

@ChildEntity('hotdeals')
export class HotDealsSection extends PageSection {
  @Column('jsonb')
  content: {
    title: string;
    subtitle?: string;
    productIds: string[];
  };
}
