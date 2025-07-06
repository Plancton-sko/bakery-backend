// src/product/product.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Product } from './entities/product.entity';
import { ProductService } from './product.service';
import { ProductController } from './product.controller';
import { OrderItem } from 'src/orders/entities/order-item.entity';
import { Order, OrderStatus } from 'src/orders/entities/order.entity';
import { Customer } from 'src/customer/entities/customer.entity';
import { ProductImage } from './entities/product-image.entity';
import { ImageProcessingService } from 'src/common/services/image-processing.service';

@Module({
  imports: [TypeOrmModule.forFeature([Product, OrderItem, Order, Customer, ProductImage]), ImageProcessingService],
  controllers: [ProductController],
  providers: [ProductService, ImageProcessingService],
  exports: [ProductService],
})
export class ProductModule { }
