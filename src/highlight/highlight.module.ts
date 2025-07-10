// src/highlight/highlight.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HighlightService } from './highlight.service';
import { HighlightController } from './highlight.controller';
import { Highlight } from './entities/highlight.entity';
import { Product } from 'src/products/entities/product.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Highlight, Product])],
  controllers: [HighlightController],
  providers: [HighlightService],
  exports: [HighlightService],
})
export class HighlightModule {}
