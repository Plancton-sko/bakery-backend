// src/product/dto/upload-image.dto.ts
import { IsString } from 'class-validator';

export class UploadImageDto {
  @IsString()
  id: string; // ID do produto ao qual a imagem pertence

  @IsString()
  image: string; // Base64 da imagem
}
