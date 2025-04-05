// src/product/product.controller.ts
import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { ProductService } from './product.service';
import { CreateProductDto } from './dtos/create-product.dto';
import { UpdateProductDto } from './dtos/update-product.dto';
import { Product } from './product.entity';
import { Public } from 'src/auth/decorators/public.decorator';
import { RolesGuard } from 'src/auth/guards/role.guard';
import { AuthenticatedGuard } from 'src/auth/guards/authenticated.guard';
import { UserRole } from 'src/user/user.entity';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { UploadImageDto } from './dtos/upload-image.dto';

@Controller('products')
export class ProductController {
    constructor(private readonly productService: ProductService) { }

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

    @Patch(':id')
    @UseGuards(AuthenticatedGuard, RolesGuard)
    @Roles(UserRole.ADMIN)
    async update(@Param('id') id: string, @Body() updateProductDto: UpdateProductDto): Promise<Product> {
        return this.productService.update(id, updateProductDto);
    }

    @Delete(':id')
    @UseGuards(AuthenticatedGuard, RolesGuard)
    @Roles(UserRole.ADMIN)
    async remove(@Param('id') id: string): Promise<void> {
        return this.productService.remove(id);
    }

    @Post(':id/upload-image')
    @UseGuards(AuthenticatedGuard, RolesGuard)
    @Roles(UserRole.ADMIN)
    async uploadImage(@Param('id') id: string, @Body() uploadImageDto: UploadImageDto): Promise<Product> {
        return this.productService.uploadImage(id, uploadImageDto.image);
    }
}
