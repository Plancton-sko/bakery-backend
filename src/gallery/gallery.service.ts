// src/gallery/gallery.service.ts
import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Image } from './entities/image.entity';
import { ImageVariant, ImageFormat, ImageSize } from './entities/image-variant.entity';
import { CreateImageDto } from './dtos/create-image.dto';
import { UpdateImageDto } from './dtos/update-image.dto';
import { ImageQueryDto } from './dtos/image-query.dto';
import { ImageResponseDto } from './dtos/image-response.dto';

import * as Minio from 'minio';
import sharp from 'sharp';
import * as crypto from 'crypto';
import * as path from 'path';

interface ImageSizeConfig {
    width: number;
    height: number;
    quality: number;
    fit: 'cover' | 'inside' | 'outside' | 'contain' | 'fill';
    position?: string;
}

interface ProcessingOptions {
    generateWebp: boolean;
    generateAvif: boolean;
    generateThumbnails: boolean;
    preserveOriginal: boolean;
    optimizeForWeb: boolean;
    watermark?: {
        text?: string;
        image?: string;
        position: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'center';
        opacity: number;
    };
}

@Injectable()
export class GalleryService {
    private minioClient: Minio.Client;
    private readonly bucket: string;

    // Configurações otimizadas para diferentes tamanhos
    private readonly sizeConfigs: Record<ImageSize, ImageSizeConfig> = {
        [ImageSize.THUMBNAIL]: {
            width: 150,
            height: 150,
            quality: 75,
            fit: 'cover'
        },
        [ImageSize.SMALL]: {
            width: 400,
            height: 400,
            quality: 80,
            fit: 'inside'
        },
        [ImageSize.MEDIUM]: {
            width: 800,
            height: 800,
            quality: 85,
            fit: 'inside'
        },
        [ImageSize.LARGE]: {
            width: 1200,
            height: 1200,
            quality: 90,
            fit: 'inside'
        },
        [ImageSize.ORIGINAL]: {
            width: 0,
            height: 0,
            quality: 95,
            fit: 'inside'
        }
    };

    // Configurações responsivas para diferentes dispositivos
    private readonly responsiveSizes = [
        { breakpoint: 'mobile', width: 480, quality: 75 },
        { breakpoint: 'tablet', width: 768, quality: 80 },
        { breakpoint: 'desktop', width: 1200, quality: 85 },
        { breakpoint: 'xl', width: 1920, quality: 90 }
    ];

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

        this.initializeBucket();
    }

    private async initializeBucket(): Promise<void> {
        try {
            const bucketExists = await this.minioClient.bucketExists(this.bucket);
            if (!bucketExists) {
                await this.minioClient.makeBucket(this.bucket);

                // Configurar política pública para leitura
                const policy = {
                    Version: '2012-10-17',
                    Statement: [{
                        Effect: 'Allow',
                        Principal: { AWS: ['*'] },
                        Action: ['s3:GetBucketLocation', 's3:ListBucket'],
                        Resource: [`arn:aws:s3:::${this.bucket}`]
                    }, {
                        Effect: 'Allow',
                        Principal: { AWS: ['*'] },
                        Action: ['s3:GetObject'],
                        Resource: [`arn:aws:s3:::${this.bucket}/*`]
                    }]
                };

                await this.minioClient.setBucketPolicy(this.bucket, JSON.stringify(policy));
            }
        } catch (error) {
            console.error('Erro ao inicializar bucket:', error);
        }
    }

    async uploadImage(
        file: Express.Multer.File,
        createImageDto: CreateImageDto,
        options: Partial<ProcessingOptions> = {}
    ): Promise<ImageResponseDto> {
        // Configurações padrão
        const processingOptions: ProcessingOptions = {
            generateWebp: true,
            generateAvif: true,
            generateThumbnails: true,
            preserveOriginal: true,
            optimizeForWeb: true,
            ...options
        };

        // Validação do arquivo
        await this.validateImage(file);

        // Gera hash para verificar duplicatas
        const fileHash = crypto.createHash('sha256').update(file.buffer).digest('hex');

        // Verifica se imagem já existe
        const existingImage = await this.imageRepository.findOne({
            where: { hash: fileHash },
            relations: ['variants']
        });

        if (existingImage) {
            return this.mapToResponseDto(existingImage, existingImage.variants);
        }

        // Obtém metadados da imagem original
        const metadata = await this.getImageMetadata(file.buffer);

        // Detecta formato original
        const originalFormat = this.detectImageFormat(file.mimetype, metadata.format);

        // Cria registro da imagem
        const image = this.imageRepository.create({
            ...createImageDto,
            originalName: file.originalname,
            mimeType: file.mimetype,
            size: file.size,
            width: metadata.width,
            height: metadata.height,
            hash: fileHash,
            originalUrl: '',
        });

        const savedImage = await this.imageRepository.save(image);

        try {
            // Gera todas as variantes da imagem
            const variants = await this.generateOptimizedVariants(
                file.buffer,
                savedImage.id,
                metadata,
                processingOptions
            );

            // Salva a URL original
            const originalVariant = variants.find(v => v.size === ImageSize.ORIGINAL);
            if (originalVariant) {
                savedImage.originalUrl = originalVariant.url;
                await this.imageRepository.save(savedImage);
            }

            return this.mapToResponseDto(savedImage, variants);

        } catch (error) {
            // Cleanup em caso de erro
            await this.imageRepository.remove(savedImage);
            if (error instanceof Error) {
                throw new BadRequestException(`Erro ao processar imagem: ${error.message}`);
            }
            throw new BadRequestException('Erro ao processar imagem desconhecido');
        }
    }

    private async validateImage(file: Express.Multer.File): Promise<void> {
        // Validações básicas
        if (!file) {
            throw new BadRequestException('Nenhum arquivo foi enviado');
        }

        if (file.size > 50 * 1024 * 1024) { // 50MB
            throw new BadRequestException('Arquivo muito grande (máximo 50MB)');
        }

        // Validação de formato
        const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/avif', 'image/gif'];
        if (!allowedTypes.includes(file.mimetype)) {
            throw new BadRequestException('Formato de arquivo não suportado');
        }

        // Validação adicional com Sharp
        try {
            const metadata = await sharp(file.buffer).metadata();

            if (!metadata.width || !metadata.height) {
                throw new BadRequestException('Arquivo não contém dados de imagem válidos');
            }

            // Validar dimensões mínimas
            if (metadata.width < 50 || metadata.height < 50) {
                throw new BadRequestException('Imagem muito pequena (mínimo 50x50 pixels)');
            }

            // Validar dimensões máximas
            if (metadata.width > 10000 || metadata.height > 10000) {
                throw new BadRequestException('Imagem muito grande (máximo 10000x10000 pixels)');
            }

        } catch (error) {
            if (error instanceof BadRequestException) {
                throw error;
            }
            throw new BadRequestException('Arquivo corrompido ou formato inválido');
        }
    }

    private async getImageMetadata(buffer: Buffer): Promise<sharp.Metadata> {
        try {
            return await sharp(buffer).metadata();
        } catch (error) {
            throw new BadRequestException('Erro ao ler metadados da imagem');
        }
    }

    private detectImageFormat(mimeType: string, sharpFormat?: string): ImageFormat {
        if (mimeType.includes('avif') || sharpFormat === 'avif') return ImageFormat.AVIF;
        if (mimeType.includes('webp') || sharpFormat === 'webp') return ImageFormat.WEBP;
        if (mimeType.includes('png') || sharpFormat === 'png') return ImageFormat.PNG;
        return ImageFormat.JPEG; // padrão
    }

    private async generateOptimizedVariants(
        buffer: Buffer,
        imageId: string,
        metadata: sharp.Metadata,
        options: Partial<ProcessingOptions>
    ): Promise<ImageVariant[]> {
        const processingOptions: ProcessingOptions = {
            generateWebp: true,
            generateAvif: true,
            generateThumbnails: true,
            preserveOriginal: true,
            optimizeForWeb: true,
            ...options // sobrescreve com o que vier de fora
        };
        const variants: ImageVariant[] = [];
        const formats: ImageFormat[] = [ImageFormat.JPEG]; // sempre gerar JPEG como fallback

        // Adicionar formatos modernos se solicitado
        if (options.generateWebp) formats.push(ImageFormat.WEBP);
        if (options.generateAvif) formats.push(ImageFormat.AVIF);

        // Processar cada combinação de formato e tamanho
        for (const format of formats) {
            for (const [sizeKey, config] of Object.entries(this.sizeConfigs)) {
                const size = sizeKey as ImageSize;

                try {
                    const variant = await this.createOptimizedVariant(
                        buffer,
                        imageId,
                        format,
                        size,
                        config,
                        metadata,
                        processingOptions
                    );

                    if (variant) {
                        variants.push(variant);
                    }
                } catch (error) {
                    console.error(`Erro ao criar variante ${format}/${size}:`, error);
                    // Continua processamento mesmo com erro em uma variante
                }
            }
        }

        // Salvar todas as variantes no banco
        return await this.variantRepository.save(variants);
    }

    private async createOptimizedVariant(
        buffer: Buffer,
        imageId: string,
        format: ImageFormat,
        size: ImageSize,
        config: ImageSizeConfig,
        originalMetadata: sharp.Metadata,
        options: ProcessingOptions
    ): Promise<ImageVariant> {
        let sharpInstance = sharp(buffer);
        let processedBuffer: Buffer;
        let finalWidth = originalMetadata.width || 0;
        let finalHeight = originalMetadata.height || 0;

        // Aplicar processamento baseado no tamanho
        if (size !== ImageSize.ORIGINAL && config.width > 0 && config.height > 0) {
            // Redimensionar com configurações otimizadas
            sharpInstance = sharpInstance.resize(config.width, config.height, {
                fit: config.fit,
                withoutEnlargement: true,
                background: { r: 255, g: 255, b: 255, alpha: 0 }
            });
        }

        // Otimizações para web
        if (options.optimizeForWeb) {
            sharpInstance = sharpInstance
                .sharpen() // Aplicar nitidez sutil
                .normalize(); // Normalizar contraste
        }

        // Aplicar formato específico com otimizações
        switch (format) {
            case ImageFormat.AVIF:
                sharpInstance = sharpInstance.avif({
                    quality: config.quality,
                    effort: 6, // Máxima compressão
                    chromaSubsampling: '4:2:0'
                });
                break;

            case ImageFormat.WEBP:
                sharpInstance = sharpInstance.webp({
                    quality: config.quality,
                    effort: 6,
                    smartSubsample: true
                });
                break;

            case ImageFormat.JPEG:
                sharpInstance = sharpInstance.jpeg({
                    quality: config.quality,
                    progressive: true,
                    mozjpeg: true,
                    optimiseScans: true
                });
                break;

            case ImageFormat.PNG:
                sharpInstance = sharpInstance.png({
                    quality: config.quality,
                    compressionLevel: 9,
                    palette: true
                });
                break;
        }

        // Processar imagem
        processedBuffer = await sharpInstance.toBuffer();

        // Obter metadados finais
        const finalMetadata = await sharp(processedBuffer).metadata();
        finalWidth = finalMetadata.width || finalWidth;
        finalHeight = finalMetadata.height || finalHeight;

        // Gerar nome do arquivo único
        const timestamp = Date.now();
        const fileName = `${imageId}/${size}/${timestamp}.${format}`;

        // Upload para Minio
        const contentType = `image/${format}`;
        await this.minioClient.putObject(
            this.bucket,
            fileName,
            processedBuffer,
            processedBuffer.length,
            {
                'Content-Type': contentType,
                'Cache-Control': 'public, max-age=31536000', // 1 ano
                'ETag': crypto.createHash('md5').update(processedBuffer).digest('hex')
            }
        );

        const url = await this.getPublicUrl(fileName);

        return this.variantRepository.create({
            format,
            size,
            url,
            width: finalWidth,
            height: finalHeight,
            fileSize: processedBuffer.length,
            quality: config.quality,
            imageId,
        });
    }

    private async getPublicUrl(fileName: string): Promise<string> {
        if (process.env.MINIO_PUBLIC_URL) {
            return `${process.env.MINIO_PUBLIC_URL}/${this.bucket}/${fileName}`;
        }

        // Gerar URL pré-assinada com longa duração
        return await this.minioClient.presignedGetObject(
            this.bucket,
            fileName,
            24 * 60 * 60 * 365 // 1 ano
        );
    }

    // Método para regenerar variantes de uma imagem existente
    async regenerateVariants(
        id: string,
        options: Partial<ProcessingOptions> = {}
    ): Promise<ImageResponseDto> {
        const image = await this.imageRepository.findOne({
            where: { id },
            relations: ['variants']
        });

        if (!image) {
            throw new NotFoundException(`Imagem com ID ${id} não encontrada`);
        }

        // Encontrar variante original
        const originalVariant = image.variants.find(v => v.size === ImageSize.ORIGINAL);
        if (!originalVariant) {
            throw new BadRequestException('Variante original não encontrada');
        }

        try {
            // Baixar imagem original
            const response = await fetch(originalVariant.url);
            const buffer = Buffer.from(await response.arrayBuffer());
            const metadata = await this.getImageMetadata(buffer);

            // Remover variantes antigas (exceto original)
            const variantsToRemove = image.variants.filter(v => v.size !== ImageSize.ORIGINAL);
            for (const variant of variantsToRemove) {
                await this.removeVariantFile(variant);
            }
            await this.variantRepository.remove(variantsToRemove);

            // Gerar novas variantes
            const newVariants = await this.generateOptimizedVariants(
                buffer,
                id,
                metadata,
                { preserveOriginal: false, ...options }
            );

            // Manter variante original
            const allVariants = [originalVariant, ...newVariants];

            return this.mapToResponseDto(image, allVariants);

        } catch (error) {
            throw new BadRequestException(
                `Erro ao regenerar variantes: ${error instanceof Error ? error.message : String(error)}`
            );
        }
    }

    private async removeVariantFile(variant: ImageVariant): Promise<void> {
        try {
            const fileName = variant.url.split('/').pop();
            if (fileName) {
                await this.minioClient.removeObject(this.bucket, fileName);
            }
        } catch (error) {
            console.error(`Erro ao remover arquivo ${variant.url}:`, error);
        }
    }

    // Resto dos métodos permanecem iguais...
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
            await this.removeVariantFile(variant);
        }

        await this.imageRepository.remove(image);
    }

    async getImagesByTags(tags: string[]): Promise<ImageResponseDto[]> {
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