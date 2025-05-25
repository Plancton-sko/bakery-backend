// src/slides/slides.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Slide } from './entities/slide.entity';
import { CreateSlideDto } from './dtos/create-slide.dto';
import { UpdateSlideDto } from './dtos/update-slide.dto';

// Importações para o Minio e conversão de imagens
import * as Minio from 'minio';
import sharp from 'sharp';

@Injectable()
export class SlidesService {
  private minioClient: Minio.Client;

  constructor(
    @InjectRepository(Slide)
    private slidesRepository: Repository<Slide>,
  ) {
    // Inicializa o cliente do Minio com as variáveis de ambiente
    this.minioClient = new Minio.Client({
      endPoint: process.env.MINIO_ENDPOINT,
      port: Number(process.env.MINIO_PORT) || 9000,
      useSSL: process.env.MINIO_USE_SSL === 'true',
      accessKey: process.env.MINIO_ACCESS_KEY,
      secretKey: process.env.MINIO_SECRET_KEY,
    });
  }

  async create(createSlideDto: CreateSlideDto): Promise<Slide> {
    const slide = this.slidesRepository.create(createSlideDto);
    return await this.slidesRepository.save(slide);
  }

  async findAll(): Promise<Slide[]> {
    return await this.slidesRepository.find({
      order: {
        order: 'ASC',
      },
    });
  }

  async findOne(id: string): Promise<Slide> {
    const slide = await this.slidesRepository.findOne({ where: { id } });
    if (!slide) {
      throw new NotFoundException(`Slide com ID ${id} não encontrado`);
    }
    return slide;
  }

  async update(id: string, updateSlideDto: UpdateSlideDto): Promise<Slide> {
    const slide = await this.findOne(id);
    
    // Se estamos atualizando apenas a ordem, não precisamos atualizar todos os campos
    if (Object.keys(updateSlideDto).length === 1 && 'order' in updateSlideDto) {
      slide.order = updateSlideDto.order;
    } else {
      // Caso contrário, atualizamos todos os campos fornecidos
      Object.assign(slide, updateSlideDto);
    }
    
    return await this.slidesRepository.save(slide);
  }

  async remove(id: string): Promise<void> {
    const result = await this.slidesRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Slide com ID ${id} não encontrado`);
    }
  }

  private async uploadImageToMinio(
    fileBuffer: Buffer,
    fileName: string,
    convertToAvif: boolean,
  ): Promise<string> {
    // Define valores padrão
    let bufferToUpload = fileBuffer;
    let contentType = 'image/jpeg';

    // Caso o usuário deseje converter para AVIF
    if (convertToAvif) {
      bufferToUpload = await sharp(fileBuffer)
        .toFormat('avif', { quality: 50 })
        .toBuffer();
      contentType = 'image/avif';
    }

    // Define o bucket (se não existir, você pode criar ou garantir que ele já existe)
    const bucket = process.env.MINIO_BUCKET_NAME || 'images';

    try {
      await this.minioClient.putObject(bucket, fileName, bufferToUpload, bufferToUpload.length, {
        'Content-Type': contentType,
      });
      // Cria a URL pública baseada em uma variável de ambiente ou padrão de URL
      const imageUrl = `${process.env.MINIO_URL}/${bucket}/${fileName}`;
      return imageUrl;
    } catch (err: any) {
      throw new Error(`Erro ao fazer upload da imagem para o Minio: ${err.message}`);
    }
  }

  async uploadImage(
    id: string,
    file: Express.Multer.File,
    convertToAvif: boolean = false,
  ): Promise<Slide> {
    const slide = await this.slidesRepository.findOne({ where: { id } });
    if (!slide)
      throw new NotFoundException(`Slide com ID ${id} não encontrado`);

    // Define o nome do arquivo: composto pelo id do slide e timestamp
    const extension = convertToAvif
      ? 'avif'
      : file.mimetype.split('/')[1]; // extrai a extensão com base no mimetype
    const fileName = `slide-${id}-${Date.now()}.${extension}`;

    // Realiza o upload para o Minio
    const imageUrl = await this.uploadImageToMinio(file.buffer, fileName, convertToAvif);
    slide.image = imageUrl;
    return await this.slidesRepository.save(slide);
  }
}