// src/highlight/highlight.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Highlight } from './entities/highlight.entity';
import { CreateHighlightDto } from './dtos/create-highlight.dto';
import { UpdateHighlightDto } from './dtos/update-highlight.dto';
import { BulkUpdateHighlightsDto } from './dtos/bulk-update-highlights.dto';
import { Product } from 'src/products/entities/product.entity';

@Injectable()
export class HighlightService {
  constructor(
    @InjectRepository(Highlight)
    private highlightRepository: Repository<Highlight>,
    @InjectRepository(Product)
    private productRepository: Repository<Product>,
  ) {}

  async findAll(): Promise<any[]> {
    const highlights = await this.highlightRepository.find({
      relations: ['product'],
      order: { order: 'ASC', createdAt: 'DESC' },
    });

    return highlights.map(highlight => ({
      id: highlight.product.id,
      name: highlight.product.name,
      price: highlight.product.price,
      image: highlight.product.image,
      description: highlight.product.description,
      isActive: highlight.isActive,
      order: highlight.order,
    }));
  }

  async findOne(id: string): Promise<Highlight> {
    const highlight = await this.highlightRepository.findOne({
      where: { id },
      relations: ['product'],
    });

    if (!highlight) {
      throw new NotFoundException(`Highlight with ID ${id} not found`);
    }

    return highlight;
  }

  async create(createHighlightDto: CreateHighlightDto): Promise<Highlight> {
    // Verificar se o produto existe
    const product = await this.productRepository.findOne({
      where: { id: createHighlightDto.productId },
    });

    if (!product) {
      throw new NotFoundException(`Product with ID ${createHighlightDto.productId} not found`);
    }

    // Verificar se já existe um highlight para este produto
    const existingHighlight = await this.highlightRepository.findOne({
      where: { productId: createHighlightDto.productId },
    });

    if (existingHighlight) {
      throw new Error('Product already has a highlight');
    }

    const highlight = this.highlightRepository.create(createHighlightDto);
    return this.highlightRepository.save(highlight);
  }

  async update(id: string, updateHighlightDto: UpdateHighlightDto): Promise<Highlight> {
    const highlight = await this.findOne(id);
    
    if (updateHighlightDto.productId) {
      const product = await this.productRepository.findOne({
        where: { id: updateHighlightDto.productId },
      });

      if (!product) {
        throw new NotFoundException(`Product with ID ${updateHighlightDto.productId} not found`);
      }
    }

    Object.assign(highlight, updateHighlightDto);
    return this.highlightRepository.save(highlight);
  }

  async remove(id: string): Promise<void> {
    // Primeiro, encontrar o highlight pelo productId
    const highlight = await this.highlightRepository.findOne({
      where: { productId: id },
    });

    if (!highlight) {
      throw new NotFoundException(`Highlight for product ID ${id} not found`);
    }

    await this.highlightRepository.remove(highlight);
  }

  async bulkUpdate(bulkUpdateDto: BulkUpdateHighlightsDto): Promise<any[]> {
    // Remover todos os highlights existentes
    await this.highlightRepository.clear();

    // Criar novos highlights
    const newHighlights = [];
    for (let i = 0; i < bulkUpdateDto.highlights.length; i++) {
      const highlightData = bulkUpdateDto.highlights[i];
      
      // Verificar se o produto existe
      const product = await this.productRepository.findOne({
        where: { id: highlightData.id },
      });

      if (product) {
        const highlight = this.highlightRepository.create({
          productId: highlightData.id,
          isActive: true,
          order: i,
        });
        
        const saved = await this.highlightRepository.save(highlight);
        newHighlights.push(saved);
      }
    }

    return this.findAll();
  }
}
