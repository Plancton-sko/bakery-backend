// src/product/product.controller.ts
import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  Put,
  Query,
  ParseFilePipe,
  MaxFileSizeValidator,
  FileTypeValidator,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ProductService } from './product.service';
import { CreateProductDto } from './dtos/create-product.dto';
import { UpdateProductDto } from './dtos/update-product.dto';
import { Product } from './entities/product.entity';
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

  /**
   * Endpoint consolidado para criar produto (sempre com imagem)
   */
  @Post()
  @UseGuards(AuthenticatedGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @UseInterceptors(FileInterceptor('file'))
  @Public()
  async create(
    @Body() body: any, // Usamos any aqui pois os dados vêm do multipart
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 10 * 1024 * 1024 }), // 10MB
          new FileTypeValidator({ fileType: /^image\/(jpeg|png|gif|webp|avif)$/ }),
        ],
      }),
    ) file: Express.Multer.File,
    @Query('convertToAvif') convertToAvif: string = 'true',
  ): Promise<Product> {
    // Converte manualmente os dados do body para o DTO
    const createProductDto: CreateProductDto = {
      name: body.name,
      price: parseFloat(body.price),
      category: body.category,
      description: body.description,
      image: body.image, // opcional
    };

    const shouldConvert = convertToAvif === 'true';
    return this.productService.create(createProductDto, file, shouldConvert);
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
   * Endpoint para upload de imagens do produto existente.
   */
  @Post(':id/upload')
  @UseGuards(AuthenticatedGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @UseInterceptors(FileInterceptor('file'))
  async uploadProductImage(
    @Param('id') id: string,
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 10 * 1024 * 1024 }),
          new FileTypeValidator({ fileType: /^image\/(jpeg|png|gif|webp|avif)$/ }),
        ],
      }),
    ) file: Express.Multer.File,
    @Query('convertToAvif') convertToAvif: string = 'true',
  ): Promise<Product> {
    const shouldConvert = convertToAvif === 'true';
    return this.productService.uploadImage(id, file, shouldConvert);
  }
}