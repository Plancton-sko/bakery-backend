// src/common/common.module.ts
import { Module } from '@nestjs/common';
import { ImageProcessingService } from './services/image-processing.service';

@Module({
  providers: [ImageProcessingService],
  exports: [ImageProcessingService],
})
export class CommonModule {}
