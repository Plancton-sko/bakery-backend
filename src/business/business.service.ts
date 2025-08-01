// src/business/business.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Business } from './entities/business.entity';
import { PageSection } from './entities/page-section.entity';
import { PageSectionFactory } from './factories/page-section.factory';
import { CreateBusinessDto } from './dtos/create-business.dto';
import { UpdateBusinessDto } from './dtos/update-business.dto';
import { CreatePageSectionDto } from './dtos/sections/create-section.dto';

@Injectable()
export class BusinessService {
    constructor(
        @InjectRepository(Business)
        private readonly businessRepo: Repository<Business>,

        @InjectRepository(PageSection)
        private readonly sectionRepo: Repository<PageSection>,

        private readonly pageSectionFactory: PageSectionFactory
    ) { }

    async create(dto: CreateBusinessDto): Promise<Business> {
        const business = this.businessRepo.create(dto);
        return this.businessRepo.save(business);
    }

    async findAll(): Promise<Business[]> {
        return this.businessRepo.find();
    }


    async findOne(id: string): Promise<Business> {
        const business = await this.businessRepo.findOne({ where: { id } });
        if (!business) throw new NotFoundException('Business not found');
        return business;
    }

    async update(id: string, dto: UpdateBusinessDto): Promise<Business> {
        const business = await this.findOne(id);
        Object.assign(business, dto);
        return this.businessRepo.save(business);
    }

    async remove(id: string): Promise<void> {
        const business = await this.findOne(id);
        await this.businessRepo.remove(business);
    }

    async addSectionToBusiness(businessId: string, data: CreatePageSectionDto): Promise<PageSection> {
        const business = await this.findOne(businessId);
        const section = this.pageSectionFactory.create(data.type);

        Object.assign(section, {
            ...data,
            business,
        });

        return this.sectionRepo.save(section);
    }
}
