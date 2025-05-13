// src/product/product.controller.ts
import {
    Controller,
    Get,
    Post,
    Body,
    Patch,
    Param,
    Delete,
    UseGuards,
    UseInterceptors,
    UploadedFile,
    Put,
  } from '@nestjs/common';
  import { FileInterceptor } from '@nestjs/platform-express';
  import { ProductService } from './product.service';
  import { CreateProductDto } from './dtos/create-product.dto';
  import { UpdateProductDto } from './dtos/update-product.dto';
  import { Product } from './product.entity';
  import { Public } from 'src/auth/decorators/public.decorator';
  import { RolesGuard } from 'src/auth/guards/role.guard';
  import { AuthenticatedGuard } from 'src/auth/guards/authenticated.guard';
  import { UserRole } from 'src/user/user.entity';
  import { Roles } from 'src/auth/decorators/roles.decorator';
  
  @Controller('products')
  export class ProductController {
    constructor(private readonly productService: ProductService) {}
  
    @Get()
    @Public()
    async findAll(): Promise<Product[]> {
      return this.productService.findAll();
    }
  
    @Get(':id')
    @Public()
    async findOne(@Param('id') id: string): Promise<Product> {
      return this.productService.findOne(id);
    }
  
    @Post()
    @UseGuards(AuthenticatedGuard, RolesGuard)
    @Roles(UserRole.ADMIN)
    async create(@Body() createProductDto: CreateProductDto): Promise<Product> {
      return this.productService.create(createProductDto);
    }
  
    @Put(':id')
    @UseGuards(AuthenticatedGuard, RolesGuard)
    @Roles(UserRole.ADMIN)
    async update(
      @Param('id') id: string,
      @Body() updateProductDto: UpdateProductDto,
    ): Promise<Product> {
      return this.productService.update(id, updateProductDto);
    }
  
    @Delete(':id')
    @UseGuards(AuthenticatedGuard, RolesGuard)
    @Roles(UserRole.ADMIN)
    async remove(@Param('id') id: string): Promise<void> {
      return this.productService.remove(id);
    }
  
    /**
     * Endpoint para upload de imagens do produto.
     * O arquivo deve ser enviado com o campo 'file' no FormData.
     * Opcionalmente, você pode decidir converter a imagem para AVIF.
     */
    @Post(':id/upload')
    @UseInterceptors(FileInterceptor('file'))
    async uploadProductImage(
      @Param('id') id: string,
      @UploadedFile() file: Express.Multer.File,
      // Se desejar receber um parâmetro de conversão, pode vir via query ou body
    ): Promise<Product> {
      // Aqui você pode definir uma lógica para decidir se deve converter para AVIF.
      // Por exemplo, converter se o mimetype for image/jpeg ou image/png:
      const convertToAvif =
        file.mimetype === 'image/jpeg' || file.mimetype === 'image/png';
      return this.productService.uploadImage(id, file, convertToAvif);
    }
  }
  