// src/gallery/gallery.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GalleryController } from './gallery.controller';
import { Image } from './entities/image.entity';
import { ImageVariant } from './entities/image-variant.entity';
import { GalleryService } from './gallery.service';

@Module({
    imports: [TypeOrmModule.forFeature([Image, ImageVariant])],
    controllers: [GalleryController],
    providers: [GalleryService],
    exports: [GalleryService],
})
export class GalleryModule { }
