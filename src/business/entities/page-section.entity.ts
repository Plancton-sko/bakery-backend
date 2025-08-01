// === src/business/entities/page-section.entity.ts ===
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  TableInheritance,
} from 'typeorm';
import { Business } from './business.entity';

@Entity()
@TableInheritance({ column: { type: 'varchar', name: 'type' } })
export abstract class PageSection {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  type: string;

  @Column()
  title: string;

  @Column({ default: true })
  isActive: boolean;

  @Column()
  position: number;

  @Column({ nullable: true })
  preset?: string;

  @Column({ nullable: true })
  slug?: string;

  @Column('jsonb', { nullable: true })
  metadata?: Record<string, any>;

  @ManyToOne(() => Business, (business) => business.sections, { onDelete: 'CASCADE' })
  @JoinColumn()
  business: Business;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  updatedAt: Date;
}
