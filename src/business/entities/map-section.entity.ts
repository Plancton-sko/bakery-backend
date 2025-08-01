// === src/business/entities/map-section.entity.ts ===
import { ChildEntity, Column } from 'typeorm';
import { PageSection } from './page-section.entity';

@ChildEntity('map')
export class MapSection extends PageSection {
  @Column('jsonb')
  content: {
    latitude: number;
    longitude: number;
    zoom: number;
    address: string;
  };
}
