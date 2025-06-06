// src/gallery/gallery.service.ts
import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like } from 'typeorm';
import { Image } from './entities/image.entity';
import { ImageVariant, ImageFormat, ImageSize } from './entities/image-variant.entity';
import { CreateImageDto } from './dtos/create-image.dto';
import { UpdateImageDto } from './dtos/update-image.dto';
import { ImageQueryDto } from './dtos/image-query.dto';
import { ImageResponseDto } from './dtos/image-response.dto';

import * as Minio from 'minio';
import sharp from 'sharp';
import * as crypto from 'crypto';

interface ImageSizeConfig {
    width: number;
    height: number;
    quality: number;
}

@Injectable()
export class GalleryService {
    private minioClient: Minio.Client;
    private readonly bucket: string;

    // Configurações de tamanhos para diferentes dispositivos
    private readonly sizeConfigs: Record<ImageSize, ImageSizeConfig> = {
        [ImageSize.THUMBNAIL]: { width: 150, height: 150, quality: 80 },
        [ImageSize.SMALL]: { width: 300, height: 300, quality: 85 },
        [ImageSize.MEDIUM]: { width: 600, height: 600, quality: 90 },
        [ImageSize.LARGE]: { width: 1200, height: 1200, quality: 95 },
        [ImageSize.ORIGINAL]: { width: 0, height: 0, quality: 100 } // Mantém original
    };

    constructor(
        @InjectRepository(Image)
        private readonly imageRepository: Repository<Image>,
        @InjectRepository(ImageVariant)
        private readonly variantRepository: Repository<ImageVariant>,
    ) {
        this.bucket = process.env.MINIO_BUCKET_NAME || 'gallery';
        this.minioClient = new Minio.Client({
            endPoint: process.env.MINIO_ENDPOINT,
            port: Number(process.env.MINIO_PORT) || 9000,
            useSSL: process.env.MINIO_USE_SSL === 'true',
            accessKey: process.env.MINIO_ACCESS_KEY,
            secretKey: process.env.MINIO_SECRET_KEY,
        });
    }

    async uploadImage(
        file: Express.Multer.File,
        createImageDto: CreateImageDto,
    ): Promise<ImageResponseDto> {
        // Gera hash para verificar duplicatas
        const fileHash = crypto.createHash('md5').update(file.buffer).digest('hex');

        // Verifica se imagem já existe
        const existingImage = await this.imageRepository.findOne({
            where: { hash: fileHash },
            relations: ['variants']
        });

        if (existingImage) {
            throw new BadRequestException('Imagem já existe na galeria');
        }

        // Obtém metadados da imagem original
        const metadata = await sharp(file.buffer).metadata();

        // Cria registro da imagem
        const image = this.imageRepository.create({
            ...createImageDto,
            originalName: file.originalname,
            mimeType: file.mimetype,
            size: file.size,
            width: metadata.width,
            height: metadata.height,
            hash: fileHash,
            originalUrl: '', // Será preenchido após upload
        });

        const savedImage = await this.imageRepository.save(image);

        // Gera todas as variantes da imagem
        const variants = await this.generateImageVariants(file.buffer, savedImage.id, metadata);

        // Salva a URL original (usando a variante original)
        const originalVariant = variants.find(v => v.size === ImageSize.ORIGINAL);
        savedImage.originalUrl = originalVariant?.url || '';

        await this.imageRepository.save(savedImage);

        return this.mapToResponseDto(savedImage, variants);
    }

    private async generateImageVariants(
        buffer: Buffer,
        imageId: string,
        metadata: sharp.Metadata
    ): Promise<ImageVariant[]> {
        const variants: ImageVariant[] = [];
        const formats = [ImageFormat.AVIF, ImageFormat.WEBP, ImageFormat.JPEG];

        for (const format of formats) {
            for (const [sizeKey, config] of Object.entries(this.sizeConfigs)) {
                const size = sizeKey as ImageSize;

                try {
                    const variant = await this.createImageVariant(
                        buffer,
                        imageId,
                        format,
                        size,
                        config,
                        metadata
                    );
                    variants.push(variant);
                } catch (error) {
                    console.error(`Erro ao criar variante ${format}/${size}:`, error);
                }
            }
        }

        return await this.variantRepository.save(variants);
    }

    private async createImageVariant(
        buffer: Buffer,
        imageId: string,
        format: ImageFormat,
        size: ImageSize,
        config: ImageSizeConfig,
        originalMetadata: sharp.Metadata
    ): Promise<ImageVariant> {
        let processedBuffer = buffer;
        let width = originalMetadata.width;
        let height = originalMetadata.height;

        // Processa a imagem se não for original
        if (size !== ImageSize.ORIGINAL) {
            const sharpInstance = sharp(buffer);

            // Redimensiona mantendo proporção
            if (config.width > 0 && config.height > 0) {
                sharpInstance.resize(config.width, config.height, {
                    fit: 'inside',
                    withoutEnlargement: true
                });
            }

            // Aplica formato e qualidade
            switch (format) {
                case ImageFormat.AVIF:
                    sharpInstance.avif({ quality: config.quality });
                    break;
                case ImageFormat.WEBP:
                    sharpInstance.webp({ quality: config.quality });
                    break;
                case ImageFormat.JPEG:
                    sharpInstance.jpeg({ quality: config.quality });
                    break;
                case ImageFormat.PNG:
                    sharpInstance.png({ quality: config.quality });
                    break;
            }

            processedBuffer = await sharpInstance.toBuffer();
            const processedMetadata = await sharp(processedBuffer).metadata();
            width = processedMetadata.width;
            height = processedMetadata.height;
        } else {
            // Para original, apenas converte formato se necessário
            if (format !== ImageFormat.JPEG) {
                const sharpInstance = sharp(buffer);

                switch (format) {
                    case ImageFormat.AVIF:
                        sharpInstance.avif({ quality: config.quality });
                        break;
                    case ImageFormat.WEBP:
                        sharpInstance.webp({ quality: config.quality });
                        break;
                    case ImageFormat.PNG:
                        sharpInstance.png();
                        break;
                }

                processedBuffer = await sharpInstance.toBuffer();
            }
        }

        // Nome do arquivo
        const fileName = `${imageId}-${size}-${format}.${format}`;

        // Upload para Minio
        const contentType = `image/${format}`;
        await this.minioClient.putObject(
            this.bucket,
            fileName,
            processedBuffer,
            processedBuffer.length,
            { 'Content-Type': contentType }
        );

        const url = `${process.env.MINIO_URL}/${this.bucket}/${fileName}`;

        return this.variantRepository.create({
            format,
            size,
            url,
            width,
            height,
            fileSize: processedBuffer.length,
            quality: config.quality,
            imageId,
        });
    }

    async findAll(queryDto: ImageQueryDto): Promise<{
        images: ImageResponseDto[];
        total: number;
        page: number;
        totalPages: number;
    }> {
        const { page = 1, limit = 20, search, tags, format, size } = queryDto;

        const queryBuilder = this.imageRepository
            .createQueryBuilder('image')
            .leftJoinAndSelect('image.variants', 'variant')
            .orderBy('image.createdAt', 'DESC');

        // Filtros
        if (search) {
            queryBuilder.andWhere(
                '(image.title ILIKE :search OR image.description ILIKE :search OR image.originalName ILIKE :search)',
                { search: `%${search}%` }
            );
        }

        if (tags && tags.length > 0) {
            queryBuilder.andWhere('image.tags && :tags', { tags });
        }

        if (format) {
            queryBuilder.andWhere('variant.format = :format', { format });
        }

        if (size) {
            queryBuilder.andWhere('variant.size = :size', { size });
        }

        // Paginação
        const total = await queryBuilder.getCount();
        const totalPages = Math.ceil(total / limit);

        queryBuilder.skip((page - 1) * limit).take(limit);

        const images = await queryBuilder.getMany();

        return {
            images: images.map(img => this.mapToResponseDto(img, img.variants)),
            total,
            page,
            totalPages,
        };
    }

    async findOne(id: string): Promise<ImageResponseDto> {
        const image = await this.imageRepository.findOne({
            where: { id },
            relations: ['variants'],
        });

        if (!image) {
            throw new NotFoundException(`Imagem com ID ${id} não encontrada`);
        }

        return this.mapToResponseDto(image, image.variants);
    }

    async update(id: string, updateImageDto: UpdateImageDto): Promise<ImageResponseDto> {
        const image = await this.imageRepository.findOne({
            where: { id },
            relations: ['variants'],
        });

        if (!image) {
            throw new NotFoundException(`Imagem com ID ${id} não encontrada`);
        }

        Object.assign(image, updateImageDto);
        const updatedImage = await this.imageRepository.save(image);

        return this.mapToResponseDto(updatedImage, updatedImage.variants);
    }

    async remove(id: string): Promise<void> {
        const image = await this.imageRepository.findOne({
            where: { id },
            relations: ['variants'],
        });

        if (!image) {
            throw new NotFoundException(`Imagem com ID ${id} não encontrada`);
        }

        // Remove arquivos do Minio
        for (const variant of image.variants) {
            try {
                const fileName = variant.url.split('/').pop();
                await this.minioClient.removeObject(this.bucket, fileName);
            } catch (error) {
                console.error(`Erro ao remover arquivo ${variant.url}:`, error);
            }
        }

        await this.imageRepository.remove(image);
    }

    async getImagesByTags(tags: string[]): Promise<ImageResponseDto[]> {
        // Correção: Usando QueryBuilder ao invés de função no where
        const images = await this.imageRepository
            .createQueryBuilder('image')
            .leftJoinAndSelect('image.variants', 'variant')
            .where('image.tags && :tags', { tags })
            .orderBy('image.createdAt', 'DESC')
            .getMany();

        return images.map(img => this.mapToResponseDto(img, img.variants));
    }

    private mapToResponseDto(image: Image, variants: ImageVariant[]): ImageResponseDto {
        return {
            id: image.id,
            originalName: image.originalName,
            title: image.title,
            alt: image.alt,
            description: image.description,
            originalUrl: image.originalUrl,
            mimeType: image.mimeType,
            size: image.size,
            width: image.width,
            height: image.height,
            hash: image.hash,
            tags: image.tags || [],
            variants: variants.map(v => ({
                id: v.id,
                format: v.format,
                size: v.size,
                url: v.url,
                width: v.width,
                height: v.height,
                fileSize: v.fileSize,
                quality: v.quality,
            })),
            createdAt: image.createdAt,
            updatedAt: image.updatedAt,
        };
    }
}