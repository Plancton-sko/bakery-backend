// src/slides/slides.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Slide } from './entities/slide.entity';
import { CreateSlideDto } from './dtos/create-slide.dto';
import { UpdateSlideDto } from './dtos/update-slide.dto';


@Injectable()
export class SlidesService {
  constructor(
    @InjectRepository(Slide)
    private slidesRepository: Repository<Slide>,
  ) {}

  async create(createSlideDto: CreateSlideDto): Promise<Slide> {
    const slide = this.slidesRepository.create(createSlideDto);
    return await this.slidesRepository.save(slide);
  }

  async findAll(): Promise<Slide[]> {
    return await this.slidesRepository.find({
      order: {
        order: 'ASC',
      },
    });
  }

  async findOne(id: string): Promise<Slide> {
    const slide = await this.slidesRepository.findOne({ where: { id } });
    if (!slide) {
      throw new NotFoundException(`Slide com ID ${id} não encontrado`);
    }
    return slide;
  }

  async update(id: string, updateSlideDto: UpdateSlideDto): Promise<Slide> {
    const slide = await this.findOne(id);
    
    // Se estamos atualizando apenas a ordem, não precisamos atualizar todos os campos
    if (Object.keys(updateSlideDto).length === 1 && 'order' in updateSlideDto) {
      slide.order = updateSlideDto.order;
    } else {
      // Caso contrário, atualizamos todos os campos fornecidos
      Object.assign(slide, updateSlideDto);
    }
    
    return await this.slidesRepository.save(slide);
  }

  async remove(id: string): Promise<void> {
    const result = await this.slidesRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Slide com ID ${id} não encontrado`);
    }
  }
}