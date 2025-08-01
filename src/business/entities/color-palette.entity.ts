// src/business/entities/color-palette.entity.ts
import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity()
export class ColorPalette {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  primaryColor: string;

  @Column()
  secondaryColor: string;

  @Column()
  backgroundColor: string;

  @Column()
  textColor: string;
}
