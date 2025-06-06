// src/gallery/dtos/image-response.dto.ts
export class ImageVariantResponseDto {
  id: string;
  format: string;
  size: string;
  url: string;
  width: number;
  height: number;
  fileSize: number;
  quality: number;
}

export class ImageResponseDto {
  id: string;
  originalName: string;
  title: string;
  alt?: string;
  description?: string;
  originalUrl: string;
  mimeType: string;
  size: number;
  width: number;
  height: number;
  hash: string;
  tags: string[];
  variants: ImageVariantResponseDto[];
  createdAt: Date;
  updatedAt: Date;
}