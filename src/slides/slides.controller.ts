// src/slides/slides.controller.ts
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
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { SlidesService } from './slides.service';
import { CreateSlideDto } from './dtos/create-slide.dto';
import { UpdateSlideDto } from './dtos/update-slide.dto';
import { LocalAuthGuard } from 'src/auth/guards/local-auth.guard';


@Controller('slides')
export class SlidesController {
  constructor(private readonly slidesService: SlidesService) { }

  @Post()
  @UseGuards(LocalAuthGuard)
  create(@Body() createSlideDto: CreateSlideDto) {
    return this.slidesService.create(createSlideDto);
  }

  @Get()
  findAll() {
    return this.slidesService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.slidesService.findOne(id);
  }

  @Put(':id')
  @UseGuards(LocalAuthGuard)
  update(@Param('id') id: string, @Body() updateSlideDto: UpdateSlideDto) {
    return this.slidesService.update(id, updateSlideDto);
  }

  @Delete(':id')
  @UseGuards(LocalAuthGuard)
  remove(@Param('id') id: string) {
    return this.slidesService.remove(id);
  }

  @Post(':id/upload')
  @UseGuards(LocalAuthGuard)
  @UseInterceptors(FileInterceptor('file'))
  uploadImage(
    @Param('id') id: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.slidesService.uploadImage(id, file);
  }
}