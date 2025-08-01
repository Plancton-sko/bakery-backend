// src/business/business.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Business } from './entities/business.entity';
import { PageSection } from './entities/page-section.entity';
import { HeroSliderSection } from './entities/hero-slider-section.entity';
import { ContactSection } from './entities/contact-section.entity';
import { BusinessService } from './business.service';
import { BusinessController } from './business.controller';
import { PageSectionFactory } from './factories/page-section.factory';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Business,
      PageSection,
      HeroSliderSection,
      ContactSection,
    ]),
  ],
  controllers: [BusinessController],
  providers: [BusinessService, PageSectionFactory],
})
export class BusinessModule {}
