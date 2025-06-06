// src/gallery/gallery.controller.ts
import {
    Controller,
    Get,
    Post,
    Body,
    Param,
    Delete,
    Put,
    UseInterceptors,
    UploadedFile,
    UseGuards,
    Query,
    BadRequestException,
    Res,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Response } from 'express';
import { CreateImageDto } from './dtos/create-image.dto';
import { UpdateImageDto } from './dtos/update-image.dto';
import { ImageQueryDto } from './dtos/image-query.dto';
import { ImageResponseDto } from './dtos/image-response.dto';
import { AuthenticatedGuard } from 'src/auth/guards/authenticated.guard';
import { RolesGuard } from 'src/auth/guards/role.guard';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { Public } from 'src/auth/decorators/public.decorator';
import { UserRole } from 'src/user/user.entity';
import { GalleryService } from './gallery.service';
import { ApiResponse, PaginatedResponse } from './types/api';

@Controller('gallery')
export class GalleryController {
    constructor(private readonly galleryService: GalleryService) { }

    @Post('upload')
    @UseGuards(AuthenticatedGuard, RolesGuard)
    @Roles(UserRole.ADMIN)
    @UseInterceptors(FileInterceptor('file', {
        limits: {
            fileSize: 50 * 1024 * 1024, // 50MB
            files: 1
        },
        fileFilter: (req, file, callback) => {
            if (!file.mimetype.match(/\/(jpg|jpeg|png|gif|webp)$/)) {
                return callback(new BadRequestException('Apenas arquivos de imagem são permitidos'), false);
            }
            callback(null, true);
        },
    }))
    async uploadImage(
        @UploadedFile() file: Express.Multer.File,
        @Body() createImageDto: CreateImageDto,
    ): Promise<ImageResponseDto> {
        if (!file) {
            throw new BadRequestException('Nenhum arquivo foi enviado');
        }

        return this.galleryService.uploadImage(file, createImageDto);
    }

    @Get()
    @Public()
    async findAllSimple(
        @Query() queryDto: ImageQueryDto,
    ): Promise<ApiResponse<PaginatedResponse<ImageResponseDto>>> {
        const result = await this.galleryService.findAll(queryDto);

        const paginatedResponse: PaginatedResponse<ImageResponseDto> = {
            items: result.images,
            pagination: {
                page: result.page,
                limit: queryDto.limit || 20,
                total: result.total,
                totalPages: result.totalPages,
                hasNext: result.page < result.totalPages,
                hasPrev: result.page > 1,
            }
        };

        return {
            success: true,
            data: paginatedResponse,
            timestamp: new Date().toISOString(),
        };
    }

    @Get('search')
    @Public()
    async searchImages(@Query() queryDto: ImageQueryDto): Promise<{
        images: ImageResponseDto[];
        total: number;
        page: number;
        totalPages: number;
    }> {
        return this.galleryService.findAll(queryDto);
    }

    @Get('tags/:tags')
    @Public()
    async getImagesByTags(@Param('tags') tags: string): Promise<ImageResponseDto[]> {
        const tagArray = tags.split(',').map(tag => tag.trim());
        return this.galleryService.getImagesByTags(tagArray);
    }

    @Get(':id')
    @Public()
    async findOne(@Param('id') id: string): Promise<ImageResponseDto> {
        return this.galleryService.findOne(id);
    }

    @Put(':id')
    @UseGuards(AuthenticatedGuard, RolesGuard)
    @Roles(UserRole.ADMIN)
    async update(
        @Param('id') id: string,
        @Body() updateImageDto: UpdateImageDto,
    ): Promise<ImageResponseDto> {
        return this.galleryService.update(id, updateImageDto);
    }

    @Delete(':id')
    @UseGuards(AuthenticatedGuard, RolesGuard)
    @Roles(UserRole.ADMIN)
    async remove(@Param('id') id: string): Promise<{ message: string }> {
        await this.galleryService.remove(id);
        return { message: 'Imagem removida com sucesso' };
    }

    @Post(':id/regenerate-variants')
    @UseGuards(AuthenticatedGuard, RolesGuard)
    @Roles(UserRole.ADMIN)
    async regenerateVariants(@Param('id') id: string): Promise<{ message: string }> {
        // Implementar regeneração de variantes se necessário
        return { message: 'Funcionalidade em desenvolvimento' };
    }
}