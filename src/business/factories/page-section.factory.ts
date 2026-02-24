// === src/business/factories/page-section.factory.ts ===
import { BadRequestException, Injectable } from '@nestjs/common';
import { PageSection } from '../entities/page-section.entity';
import { HeroSliderSection } from '../entities/hero-slider-section.entity';
import { ContactSection } from '../entities/contact-section.entity';
import { AboutUsSection } from '../entities/about-us-section.entity';
import { OurProductSection } from '../entities/our-product-section.entity';
import { MapSection } from '../entities/map-section.entity';
import { HotDealsSection } from '../entities/hot-deals-section.entity';


@Injectable()
export class PageSectionFactory {
  private readonly sectionMap = new Map<string, new () => PageSection>([
    ['hero', HeroSliderSection],
    ['contact', ContactSection],
    ['about', AboutUsSection],
    ['products', OurProductSection],
    ['map', MapSection],
    ['hotdeals', HotDealsSection],
  ]);

  create(type: string): PageSection {
    const SectionClass = this.sectionMap.get(type);
    if (!SectionClass) {
      throw new BadRequestException(
        `Unsupported section type: ${type}`
      );
    }
    return new SectionClass();
  }

  //   #TODO:  Criar entidade de sectionMap para armazenar nos banco de dados se eu quiser persistencia em armazenamentop não em RAM
  register(type: string, section: new () => PageSection) {
    this.sectionMap.set(type, section);
  }
}