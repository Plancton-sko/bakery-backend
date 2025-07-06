// src/common/services/image-processing.service.ts
import { Injectable } from '@nestjs/common';
import * as crypto from 'crypto';
import sharp from 'sharp';

export interface ImageSizeConfig {
  width: number | null;
  height: number | null;
  quality: number;
  fit?: keyof sharp.FitEnum;
}

export enum ImageFormat {
  JPEG = 'jpeg',
  PNG = 'png',
  WEBP = 'webp',
  AVIF = 'avif',
}

export class ImageProcessingService {
  async generateVariants(
  buffer: Buffer,
  formats: ImageFormat[],
  sizes: Record<string, ImageSizeConfig>
): Promise<
  {
    key: string;
    format: ImageFormat;
    sizeKey: string;
    data: Buffer;
    width: number;
    height: number;
    fileSize: number;
    contentType: string;
    quality: number;
  }[]
> {
  const variants = [];

  for (const format of formats) {
    for (const [sizeKey, config] of Object.entries(sizes)) {
      let pipeline = sharp(buffer);

      if (
        typeof config.width === 'number' &&
        typeof config.height === 'number' &&
        config.width > 0 &&
        config.height > 0
      ) {
        pipeline = pipeline.resize(config.width, config.height, {
          fit: config.fit,
          withoutEnlargement: true,
        });
      }

      switch (format) {
        case ImageFormat.AVIF:
          pipeline = pipeline.avif({ quality: config.quality });
          break;
        case ImageFormat.WEBP:
          pipeline = pipeline.webp({ quality: config.quality });
          break;
        case ImageFormat.JPEG:
          pipeline = pipeline.jpeg({ quality: config.quality });
          break;
        case ImageFormat.PNG:
          pipeline = pipeline.png({ quality: config.quality });
          break;
      }

      const resultBuffer = await pipeline.toBuffer();
      const metadata = await sharp(resultBuffer).metadata();

      variants.push({
        key: `${sizeKey}/${Date.now()}.${format}`,
        format,
        sizeKey,
        data: resultBuffer,
        width: metadata.width || 0,
        height: metadata.height || 0,
        fileSize: resultBuffer.length,
        contentType: `image/${format}`,
        quality: config.quality,
      });
    }
  }

  return variants;
}

  async getImageHash(buffer: Buffer): Promise<string> {
    return crypto.createHash('sha256').update(buffer).digest('hex');
  }
}
