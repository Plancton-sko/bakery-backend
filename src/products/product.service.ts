// src/product/product.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Product } from './entities/product.entity';
import { CreateProductDto } from './dtos/create-product.dto';
import { UpdateProductDto } from './dtos/update-product.dto';

// Importações para o Minio e conversão de imagens
import * as Minio from 'minio';
import { ProductImage, ProductImageFormat, ProductImageSize } from './entities/product-image.entity';
import { ImageProcessingService, ImageSizeConfig } from 'src/common/services/image-processing.service';
import { ImageFormat } from 'src/gallery/entities/image-variant.entity';

@Injectable()
export class ProductService {
  private minioClient: Minio.Client;

  private readonly sizeConfigs: Record<string, ImageSizeConfig> = {
    thumbnail: { width: 150, height: 150, quality: 75, fit: 'cover' },
    small: { width: 400, height: 400, quality: 85, fit: 'inside' },
    medium: { width: 800, height: 800, quality: 90, fit: 'inside' },
    large: { width: 1200, height: 1200, quality: 90, fit: 'inside' },
    original: { width: null, height: null, quality: 95, fit: 'inside' },
  };

  constructor(
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
    @InjectRepository(ProductImage)
    private readonly productImageRepository: Repository<ProductImage>,
    private readonly imageProcessor: ImageProcessingService,
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

  async findAll(): Promise<Product[]> {
    return await this.productRepository.find();
  }

  async findOne(id: string): Promise<Product> {
    const product = await this.productRepository.findOne({ where: { id } });
    if (!product) throw new NotFoundException(`Product with ID ${id} not found`);
    return product;
  }

  /**
   * Método consolidado para criar produto (sempre com imagem)
   */
  async create(
    createProductDto: CreateProductDto,
    file: Express.Multer.File,
    convertToAvif: boolean = true
  ): Promise<Product> {
    // Valida se o arquivo foi enviado
    if (!file) {
      throw new Error('Imagem é obrigatória para criar um produto');
    }

    // Primeiro cria o produto sem imagem
    const newProduct = this.productRepository.create(createProductDto);
    const savedProduct = await this.productRepository.save(newProduct);

    // Depois adiciona a imagem ao produto criado
    const productWithImage = await this.processAndUploadImage(savedProduct, file, convertToAvif);

    return productWithImage;
  }

  async update(id: string, updateProductDto: UpdateProductDto): Promise<Product> {
    await this.productRepository.update(id, updateProductDto);
    const updatedProduct = await this.findOne(id);
    return updatedProduct;
  }

  async remove(id: string): Promise<void> {
    const result = await this.productRepository.delete(id);
    if (result.affected === 0)
      throw new NotFoundException(`Product with ID ${id} not found`);
  }

  /**
   * Método para processar e fazer upload da imagem
   */
  private async processAndUploadImage(
    product: Product,
    file: Express.Multer.File,
    convertToAvif: boolean
  ): Promise<Product> {
    const bucket = process.env.MINIO_BUCKET_NAME || 'products';

    // Gera variantes apenas em AVIF
    const variants = await this.imageProcessor.generateVariants(
      file.buffer,
      [ImageFormat.AVIF], // AVIF somente
      this.sizeConfigs
    );

    const savedImages: ProductImage[] = [];

    for (const variant of variants) {
      const objectName = `${product.id}/${variant.sizeKey}-${Date.now()}.avif`;

      // Upload para MinIO
      await this.minioClient.putObject(
        bucket,
        objectName,
        variant.data,
        variant.data.length,
        {
          'Content-Type': variant.contentType,
        }
      );

      const imageUrl = `${process.env.MINIO_PUBLIC_URL}/${bucket}/${objectName}`;

      const productImage = this.productImageRepository.create({
        product,
        format: ProductImageFormat.AVIF,
        size: variant.sizeKey as ProductImageSize,
        url: imageUrl,
        width: variant.width,
        height: variant.height,
        fileSize: variant.fileSize,
        quality: variant.quality,
      });

      savedImages.push(productImage);
    }

    // Salva todas as variantes no banco
    await this.productImageRepository.save(savedImages);

    // Define a imagem principal como a variante "medium"
    const medium = savedImages.find(v => v.size === ProductImageSize.MEDIUM);
    if (medium) {
      product.image = medium.url;
    }

    return await this.productRepository.save(product);
  }

  /**
   * Método para fazer upload de imagem em produto existente
   */
  async uploadImage(
    id: string,
    file: Express.Multer.File,
    convertToAvif: boolean
  ): Promise<Product> {
    const product = await this.productRepository.findOne({
      where: { id },
      relations: ['images'],
    });

    if (!product) throw new NotFoundException(`Produto com ID ${id} não encontrado`);

    return await this.processAndUploadImage(product, file, convertToAvif);
  }
}