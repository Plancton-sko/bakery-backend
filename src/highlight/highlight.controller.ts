// src/highlight/highlight.controller.ts
import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
} from '@nestjs/common';
import { HighlightService } from './highlight.service';
import { CreateHighlightDto } from './dtos/create-highlight.dto';
import { UpdateHighlightDto } from './dtos/update-highlight.dto';
import { BulkUpdateHighlightsDto } from './dtos/bulk-update-highlights.dto';
import { Public } from '../auth/decorators/public.decorator';
import { AuthenticatedGuard } from '../auth/guards/authenticated.guard';
import { RolesGuard } from '../auth/guards/role.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../user/user.entity';

@Controller('highlights')
export class HighlightController {
  constructor(private readonly highlightService: HighlightService) {}

  @Get()
  @Public()
  async findAll() {
    return this.highlightService.findAll();
  }

  @Get(':id')
  @Public()
  async findOne(@Param('id') id: string) {
    return this.highlightService.findOne(id);
  }

  @Post()
  @UseGuards(AuthenticatedGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async bulkUpdate(@Body() bulkUpdateDto: BulkUpdateHighlightsDto) {
    return this.highlightService.bulkUpdate(bulkUpdateDto);
  }

  @Post('single')
  @UseGuards(AuthenticatedGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async create(@Body() createHighlightDto: CreateHighlightDto) {
    return this.highlightService.create(createHighlightDto);
  }

  @Patch(':id')
  @UseGuards(AuthenticatedGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async update(@Param('id') id: string, @Body() updateHighlightDto: UpdateHighlightDto) {
    return this.highlightService.update(id, updateHighlightDto);
  }

  @Delete(':id')
  @UseGuards(AuthenticatedGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async remove(@Param('id') id: string) {
    return this.highlightService.remove(id);
  }
}