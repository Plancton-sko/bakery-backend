// src/gallery/gallery.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GalleryController } from './gallery.controller';
import { Image } from './entities/image.entity';
import { ImageVariant } from './entities/image-variant.entity';
import { GalleryService } from './gallery.service';

@Module({
    imports: [TypeOrmModule.forFeature([Image, ImageVariant])],
    controllers: [GalleryController],
    providers: [GalleryService],
    exports: [GalleryService],
})
export class GalleryModule { }

// src/gallery/utils/image-utils.ts
export class ImageUtils {
    /**
     * Gera um srcset para diferentes tamanhos de imagem
     */
    static generateSrcSet(variants: any[], format: string = 'avif'): string {
        const formatVariants = variants.filter(v => v.format === format);

        return formatVariants
            .map(variant => `${variant.url} ${variant.width}w`)
            .join(', ');
    }

    /**
     * Gera um picture element HTML otimizado
     */
    static generatePictureElement(
        variants: any[],
        alt: string,
        className?: string
    ): string {
        const avifVariants = variants.filter(v => v.format === 'avif');
        const webpVariants = variants.filter(v => v.format === 'webp');
        const jpegVariants = variants.filter(v => v.format === 'jpeg');

        const avifSrcSet = this.generateSrcSet(avifVariants, 'avif');
        const webpSrcSet = this.generateSrcSet(webpVariants, 'webp');
        const jpegSrcSet = this.generateSrcSet(jpegVariants, 'jpeg');

        const fallbackSrc = jpegVariants.find(v => v.size === 'medium')?.url ||
            jpegVariants[0]?.url || '';

        return `
      <picture${className ? ` class="${className}"` : ''}>
        ${avifSrcSet ? `<source srcset="${avifSrcSet}" type="image/avif">` : ''}
        ${webpSrcSet ? `<source srcset="${webpSrcSet}" type="image/webp">` : ''}
        ${jpegSrcSet ? `<source srcset="${jpegSrcSet}" type="image/jpeg">` : ''}
        <img src="${fallbackSrc}" alt="${alt}" loading="lazy">
      </picture>
    `.trim();
    }

    /**
     * Obtém a melhor variante para um tamanho específico
     */
    static getBestVariant(
        variants: any[],
        preferredSize: string = 'medium',
        preferredFormat: string = 'avif'
    ): any {
        // Primeiro tenta encontrar no formato preferido
        let variant = variants.find(v =>
            v.size === preferredSize && v.format === preferredFormat
        );

        // Se não encontrar, tenta outros formatos
        if (!variant) {
            variant = variants.find(v => v.size === preferredSize);
        }

        // Se ainda não encontrar, pega qualquer uma
        if (!variant) {
            variant = variants[0];
        }

        return variant;
    }
}