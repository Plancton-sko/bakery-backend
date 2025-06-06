// src/slides/slides.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SlidesService } from './slides.service';
import { SlidesController } from './slides.controller';
import { Slide } from './entities/slide.entity';
import { Image } from '../gallery/entities/image.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Slide, Image])],
  controllers: [SlidesController],
  providers: [SlidesService],
})
export class SlidesModule {}