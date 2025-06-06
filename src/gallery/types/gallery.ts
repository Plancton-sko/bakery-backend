// src/gallery/types/gallery.ts

/**
 * Formato de imagem suportado
 */
export type ImageFormat = 'jpeg' | 'jpg' | 'png' | 'webp' | 'avif';

/**
 * Tamanhos de imagem disponíveis
 */
export type ImageSize = 'thumbnail' | 'small' | 'medium' | 'large' | 'original';

/**
 * Qualidade de imagem
 */
export type ImageQuality = 'low' | 'medium' | 'high' | 'original';

/**
 * Variante de uma imagem (diferentes formatos/tamanhos)
 */
export interface ImageVariant {
  id: string;
  format: ImageFormat;
  size: ImageSize;
  url: string;
  width: number;
  height: number;
  fileSize: number;
  quality: ImageQuality;
}

/**
 * Imagem principal da galeria
 */
export interface GalleryImage {
  id: string;
  title: string;
  alt?: string;
  description?: string;
  tags: string[];
  variants: ImageVariant[];
  createdAt: string;
  updatedAt?: string;
  uploadedBy?: string;
  isPublic?: boolean;
}

/**
 * Parâmetros de busca/filtro
 */
export interface GallerySearchParams {
  page?: number;
  limit?: number;
  search?: string;
  tags?: string[];
  sortBy?: 'createdAt' | 'title' | 'updatedAt';
  sortOrder?: 'asc' | 'desc';
  format?: ImageFormat;
  size?: ImageSize;
}

/**
 * Resposta da API da galeria
 */
export interface GalleryResponse {
  images: GalleryImage[];
  totalCount: number;
  totalPages: number;
  currentPage: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

/**
 * Dados para upload de imagem
 */
export interface ImageUploadData {
  file: File;
  title: string;
  alt?: string;
  description?: string;
  tags?: string[];
  isPublic?: boolean;
}

/**
 * Configurações de processamento de imagem
 */
export interface ImageProcessingOptions {
  formats?: ImageFormat[];
  sizes?: ImageSize[];
  quality?: ImageQuality;
  optimize?: boolean;
  generateThumbnail?: boolean;
}

/**
 * Estado de upload
 */
export interface UploadState {
  isUploading: boolean;
  progress: number;
  error?: string;
  success?: boolean;
}

/**
 * Estatísticas da galeria
 */
export interface GalleryStats {
  totalImages: number;
  totalSize: number;
  formatBreakdown: Record<ImageFormat, number>;
  tagsCount: Record<string, number>;
  uploadsByMonth: Array<{
    month: string;
    count: number;
  }>;
}

/**
 * Configurações da galeria
 */
export interface GalleryConfig {
  allowedFormats: ImageFormat[];
  maxFileSize: number;
  maxImagesPerPage: number;
  enablePublicGallery: boolean;
  requireAuth: boolean;
  autoGenerateVariants: boolean;
  defaultImageQuality: ImageQuality;
}

/**
 * Props do componente de galeria
 */
export interface GalleryProps {
  onSelectImage: (image: GalleryImage | GalleryImage[]) => void;
  showUpload?: boolean;
  allowMultiSelect?: boolean;
  maxSelections?: number;
  filterByTags?: string[];
  showStats?: boolean;
  readOnly?: boolean;
  compactView?: boolean;
}

/**
 * Estado interno da galeria
 */
export interface GalleryState {
  images: GalleryImage[];
  loading: boolean;
  error: string | null;
  currentPage: number;
  totalPages: number;
  searchTerm: string;
  selectedTags: string[];
  allTags: string[];
  selectedImages: Set<string>;
  showUploadModal: boolean;
  uploadState: UploadState;
}

/**
 * Eventos da galeria
 */
export interface GalleryEvents {
  'image-selected': GalleryImage;
  'images-selected': GalleryImage[];
  'image-uploaded': GalleryImage;
  'image-deleted': string;
  'search-changed': string;
  'filter-changed': string[];
  'page-changed': number;
}

/**
 * Utilitários para trabalhar com imagens
 */
export interface ImageUtils {
  getBestVariant: (variants: ImageVariant[], size?: ImageSize, format?: ImageFormat) => ImageVariant | undefined;
  generateSrcSet: (variants: ImageVariant[], format: ImageFormat) => string;
  formatFileSize: (bytes: number) => string;
  getImageDimensions: (file: File) => Promise<{ width: number; height: number }>;
  validateImageFile: (file: File) => { valid: boolean; error?: string };
}

/**
 * Contexto da galeria (para providers)
 */
export interface GalleryContext {
  config: GalleryConfig;
  stats: GalleryStats;
  utils: ImageUtils;
  refreshGallery: () => Promise<void>;
  uploadImage: (data: ImageUploadData) => Promise<GalleryImage>;
  deleteImage: (id: string) => Promise<void>;
  updateImage: (id: string, data: Partial<GalleryImage>) => Promise<GalleryImage>;
}