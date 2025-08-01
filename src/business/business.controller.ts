// src/business/business.controller.ts
import {
  Controller,
  Post,
  Param,
  Body,
  Get,
  Patch,
  Delete,
} from '@nestjs/common';
import { BusinessService } from './business.service';
import { CreateBusinessDto } from './dtos/create-business.dto';
import { UpdateBusinessDto } from './dtos/update-business.dto';
import { CreatePageSectionDto } from './dtos/sections/create-section.dto';

@Controller('businesses')
export class BusinessController {
  constructor(private readonly businessService: BusinessService) {}

  @Post()
  create(@Body() dto: CreateBusinessDto) {
    return this.businessService.create(dto);
  }

  @Get()
  findAll() {
    return this.businessService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.businessService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateBusinessDto) {
    return this.businessService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.businessService.remove(id);
  }

  @Post(':id/sections')
  addSection(
    @Param('id') businessId: string,
    @Body() body: CreatePageSectionDto
  ) {
    return this.businessService.addSectionToBusiness(businessId, body);
  }
}
