// src/gallery/entities/image.entity.ts
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { ImageVariant } from './image-variant.entity';

@Entity('images')
export class Image {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  originalName: string;

  @Column()
  title: string;

  @Column({ nullable: true })
  alt: string;

  @Column({ nullable: true })
  description: string;

  @Column()
  originalUrl: string;

  @Column()
  mimeType: string;

  @Column('bigint')
  size: number;

  @Column()
  width: number;

  @Column()
  height: number;

  @Column({ unique: true })
  hash: string; // Para evitar duplicatas

  @Column('simple-array', { nullable: true })
  tags: string[];

  @OneToMany(() => ImageVariant, variant => variant.image, { cascade: true })
  variants: ImageVariant[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}