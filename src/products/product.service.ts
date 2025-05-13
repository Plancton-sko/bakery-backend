// src/product/product.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Product } from './product.entity';
import { CreateProductDto } from './dtos/create-product.dto';
import { UpdateProductDto } from './dtos/update-product.dto';

// Importações para o Minio e conversão de imagens
import * as Minio from 'minio';
import sharp from 'sharp';

@Injectable()
export class ProductService {
  private minioClient: Minio.Client;

  constructor(
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
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

  async create(createProductDto: CreateProductDto): Promise<Product> {
    const newProduct = this.productRepository.create(createProductDto);
    return await this.productRepository.save(newProduct);
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
  ):Promise<Product> {
    const product = await this.productRepository.findOne({ where: { id } });
    if (!product)
      throw new NotFoundException(`Produto com ID ${id} não encontrado`);

    // Define o nome do arquivo: pode ser composto pelo id do produto e timestamp
    const extension = convertToAvif
      ? 'avif'
      : file.mimetype.split('/')[1]; // extrai a extensão com base no mimetype
    const fileName = `${id}-${Date.now()}.${extension}`;

    // Realiza o upload para o Minio
    const imageUrl = await this.uploadImageToMinio(file.buffer, fileName, convertToAvif);
    product.image = imageUrl;
    return await this.productRepository.save(product);
  }
}
