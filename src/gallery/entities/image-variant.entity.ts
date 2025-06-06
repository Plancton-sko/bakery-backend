// src/gallery/entities/image-variant.entity.ts
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';  
import { Image } from './image.entity';

export enum ImageFormat {
  JPEG = 'jpeg',
  PNG = 'png',
  WEBP = 'webp',
  AVIF = 'avif'
}

export enum ImageSize {
  THUMBNAIL = 'thumbnail', // 150x150
  SMALL = 'small',         // 300x300
  MEDIUM = 'medium',       // 600x600
  LARGE = 'large',         // 1200x1200
  ORIGINAL = 'original'    // Tamanho original
}

@Entity('image_variants')
export class ImageVariant {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    type: 'enum',
    enum: ImageFormat
  })
  format: ImageFormat;

  @Column({
    type: 'enum', 
    enum: ImageSize
  })
  size: ImageSize;

  @Column()
  url: string;

  @Column()
  width: number;

  @Column()
  height: number;

  @Column('bigint')
  fileSize: number;

  @Column()
  quality: number;

  @ManyToOne(() => Image, image => image.variants, { onDelete: 'CASCADE' })
  image: Image;

  @Column()
  imageId: string;
}