// === src/business/entities/business.entity.ts ===
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { PageSection } from './page-section.entity';
import { User } from 'src/user/user.entity';

@Entity()
export class Business {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ nullable: true })
  logoUrl?: string;

  @Column({ nullable: true })
  faviconUrl?: string;


//   #TODO: Tirar JSON
  @Column({ type: 'jsonb', nullable: true })
  colorPalette?: {
    primaryColor: string;
    secondaryColor: string;
    backgroundColor: string;
    textColor: string;
  };

  //   #TODO: Tirar JSON
  @Column({ type: 'jsonb', nullable: true })
  globalConfig?: {
    layoutMode?: 'boxed' | 'full';
    fontFamily?: string;
    darkMode?: boolean;
  };

  @ManyToOne(() => User, { nullable: false })
  @JoinColumn()
  owner: User;

  @OneToMany(() => PageSection, (section) => section.business, {
    cascade: true,
    eager: true,
  })
  sections: PageSection[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}