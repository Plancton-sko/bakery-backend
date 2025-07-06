// src/product/entities/product-image.entity.ts
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
import { Product } from './product.entity';

export enum ProductImageFormat {
  JPEG = 'jpeg',
  PNG = 'png',
  WEBP = 'webp',
  AVIF = 'avif'
}
export enum ProductImageSize {
  THUMBNAIL = 'thumbnail',
  SMALL = 'small',
  MEDIUM = 'medium',
  LARGE = 'large',
  ORIGINAL = 'original'
}

@Entity('product_images')
export class ProductImage {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'enum', enum: ProductImageFormat })
  format: ProductImageFormat;

  @Column({ type: 'enum', enum: ProductImageSize })
  size: ProductImageSize;

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

  @ManyToOne(() => Product, product => product.image, { onDelete: 'CASCADE' })
  product: Product;

  @Column()
  productId: string;
}
