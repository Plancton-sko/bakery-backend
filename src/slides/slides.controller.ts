// src/slides/slides.controller.ts
import { Controller, Get, Post, Body, Put, Param, Delete, UseGuards } from '@nestjs/common';
import { SlidesService } from './slides.service';
import { RolesGuard } from 'src/auth/guards/role.guard';
import { AuthenticatedGuard } from 'src/auth/guards/authenticated.guard';
import { CreateSlideDto } from './dtos/create-slide.dto';
import { UpdateSlideDto } from './dtos/update-slide.dto';

@Controller('slides')
export class SlidesController {
  constructor(private readonly slidesService: SlidesService) {}

  @Post()
  @UseGuards(AuthenticatedGuard, RolesGuard)
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
  @UseGuards(AuthenticatedGuard, RolesGuard)
  update(@Param('id') id: string, @Body() updateSlideDto: UpdateSlideDto) {
    return this.slidesService.update(id, updateSlideDto);
  }

  @Delete(':id')
  @UseGuards(AuthenticatedGuard, RolesGuard)
  remove(@Param('id') id: string) {
    return this.slidesService.remove(id);
  }
}
