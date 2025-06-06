// src/gallery/types/api.ts

import type { GalleryImage, GallerySearchParams, ImageUploadData } from './gallery';

/**
 * Resposta padrão da API
 */
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  timestamp: string;
}

/**
 * Resposta paginada
 */
export interface PaginatedResponse<T> {
  items: T[];
  pagination: {
    page: number;
    limit?: number;
    total?: number;
    totalPages: number;
    hasNext?: boolean;
    hasPrev?: boolean;
  };
}

/**
 * Endpoints da API de galeria
 */
export interface GalleryApiEndpoints {
  // GET /gallery - Listar imagens
  getImages: {
    params: GallerySearchParams;
    response: ApiResponse<PaginatedResponse<GalleryImage>>;
  };
  
  // POST /gallery/upload - Upload de imagem
  uploadImage: {
    body: FormData; // File + ImageUploadData
    response: ApiResponse<GalleryImage>;
  };
  
  // GET /gallery/:id - Buscar imagem específica
  getImage: {
    params: { id: string };
    response: ApiResponse<GalleryImage>;
  };
  
  // PUT /gallery/:id - Atualizar imagem
  updateImage: {
    params: { id: string };
    body: Partial<Omit<GalleryImage, 'id' | 'variants' | 'createdAt'>>;
    response: ApiResponse<GalleryImage>;
  };
  
  // DELETE /gallery/:id - Deletar imagem
  deleteImage: {
    params: { id: string };
    response: ApiResponse<{ deleted: boolean }>;
  };
  
  // GET /gallery/tags - Listar todas as tags
  getTags: {
    response: ApiResponse<string[]>;
  };
  
  // GET /gallery/stats - Estatísticas da galeria
  getStats: {
    response: ApiResponse<{
      totalImages: number;
      totalSize: number;
      formats: Record<string, number>;
      tags: Record<string, number>;
    }>;
  };
}

/**
 * Configuração do cliente da API
 */
export interface ApiClientConfig {
  baseUrl: string;
  timeout?: number;
  credentials?: RequestCredentials;
  headers?: Record<string, string>;
  retryAttempts?: number;
  retryDelay?: number;
}

/**
 * Estado de requisição
 */
export interface RequestState<T = any> {
  data: T | null;
  loading: boolean;
  error: string | null;
  lastFetch?: Date;
}

/**
 * Hook para gerenciar estado de requisições
 */
export interface UseApiState<T> extends RequestState<T> {
  refetch: () => Promise<void>;
  reset: () => void;
}

/**
 * Opções para requisições
 */
export interface RequestOptions {
  skipCache?: boolean;
  timeout?: number;
  signal?: AbortSignal;
  onProgress?: (progress: number) => void;
}

/**
 * Erro da API
 */
export interface ApiError extends Error {
  status?: number;
  code?: string;
  details?: any;
}