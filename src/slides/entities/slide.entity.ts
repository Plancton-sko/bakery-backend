// src/slides/entities/slide.entity.ts
import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity('slides')
export class Slide {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  title: string;

  @Column({ nullable: true })
  subtitle: string;

  @Column()
  image: string;

  @Column({ nullable: true })
  buttonText: string;

  @Column({ nullable: true })
  buttonLink: string;

  @Column()
  order: number;
}