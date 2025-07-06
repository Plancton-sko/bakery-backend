// src/highlight/highlight.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HighlightService } from './highlight.service';
import { HighlightController } from './highlight.controller';
import { Highlight } from './entities/highlight.entity';
import { Product } from 'src/products/entities/product.entity';
import { ImageProcessingService } from 'src/common/services/image-processing.service';
import { ProductController } from 'src/products/product.controller';
import { ProductService } from 'src/products/product.service';
import { ProductImage } from 'src/products/entities/product-image.entity';


@Module({
  imports: [
    TypeOrmModule.forFeature([Product, ProductImage]),
  ],
  controllers: [ProductController],
  providers: [ProductService, ImageProcessingService],
  exports: [ProductService],
})
export class ProductModule {}