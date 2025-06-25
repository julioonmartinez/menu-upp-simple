// src/types/api.ts

/**
 * Tipos para respuestas de API del sistema LinkTree
 */

// ===== TIPOS BASE =====

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  statusCode?: number;
  timestamp?: string;
}

export interface PaginatedResponse<T = any> {
  success: boolean;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
  error?: string;
}

export interface ApiError {
  detail: string;
  code?: string;
  field?: string;
  status?: number;
}

// ===== TIPOS PARA LINKTREE =====

export interface LinkTreeCreateResponse extends ApiResponse {
  data?: {
    id: string;
    restaurantId: string;
    title?: string;
    description?: string;
    customSlug?: string;
    isPublic: boolean;
    links: any[];
    createdAt: string;
    updatedAt: string;
  };
}

export interface LinkTreeUpdateResponse extends ApiResponse {
  data?: {
    id: string;
    restaurantId: string;
    title?: string;
    description?: string;
    customSlug?: string;
    isPublic: boolean;
    profileImage?: any;
    coverImage?: any;
    textImage?: any;
    backgroundColor?: string;
    textColor?: string;
    linksBackgroundColor?: string;
    linksColor?: string;
    buttonStyle?: string;
    theme?: string;
    customCss?: string;
    links: any[];
    analytics?: any;
    createdAt: string;
    updatedAt: string;
  };
}

export interface LinkTreeDeleteResponse extends ApiResponse {
  data?: {
    message: string;
  };
}

export interface LinkTreeListResponse extends PaginatedResponse {
  data: Array<{
    id: string;
    restaurantId: string;
    title?: string;
    description?: string;
    customSlug?: string;
    isPublic: boolean;
    linksCount: number;
    analytics?: {
      totalVisits: number;
      totalClicks: number;
    };
    createdAt: string;
    updatedAt: string;
  }>;
}

// ===== TIPOS PARA LINKS =====

export interface LinkCreateResponse extends ApiResponse {
  data?: {
    id: string;
    title: string;
    url: string;
    icon?: string;
    description?: string;
    type: string;
    order: number;
    active: boolean;
    customColor?: string;
    analytics?: {
      clicks: number;
      lastClicked?: string;
    };
  };
}

export interface LinkUpdateResponse extends ApiResponse {
  data?: {
    id: string;
    title: string;
    url: string;
    icon?: string;
    description?: string;
    type: string;
    order: number;
    active: boolean;
    customColor?: string;
    analytics?: {
      clicks: number;
      lastClicked?: string;
    };
  };
}

export interface LinkDeleteResponse extends ApiResponse {
  data?: {
    message: string;
  };
}

export interface LinkClickResponse extends ApiResponse {
  data?: {
    message: string;
    linkId: string;
    newClickCount: number;
  };
}

export interface LinkListResponse extends ApiResponse {
  data?: Array<{
    id: string;
    title: string;
    url: string;
    icon?: string;
    description?: string;
    type: string;
    order: number;
    active: boolean;
    customColor?: string;
    analytics?: {
      clicks: number;
      lastClicked?: string;
    };
  }>;
}

// ===== TIPOS PARA ANALYTICS =====

export interface AnalyticsResponse extends ApiResponse {
  data?: {
    views: {
      total: number;
      unique: number;
      daily: Array<{
        date: string;
        count: number;
      }>;
    };
    clicks: {
      total: number;
      byLink: Array<{
        linkId: string;
        linkTitle: string;
        count: number;
      }>;
      daily: Array<{
        date: string;
        count: number;
      }>;
    };
  };
}

export interface AnalyticsSummaryResponse extends ApiResponse {
  data?: {
    totalViews: number;
    totalClicks: number;
    uniqueVisitors: number;
    clickThroughRate: number;
    topLink: {
      id: string;
      title: string;
      clicks: number;
    };
    growth: {
      views: number;
      clicks: number;
      period: string;
    };
  };
}

// ===== TIPOS PARA IMÁGENES =====

export interface ImageUploadResponse extends ApiResponse {
  data?: {
    id: string;
    url: string;
    publicId: string;
    width?: number;
    height?: number;
    format?: string;
    size?: number;
    uploadedAt: string;
  };
}

export interface ImageDeleteResponse extends ApiResponse {
  data?: {
    message: string;
    publicId: string;
  };
}

// ===== TIPOS PARA VALIDACIÓN =====

export interface ValidationResponse extends ApiResponse {
  data?: {
    isValid: boolean;
    errors: string[];
    warnings: string[];
  };
}

export interface SlugCheckResponse extends ApiResponse {
  data?: {
    available: boolean;
    slug: string;
    suggestions?: string[];
  };
}

// ===== TIPOS PARA EXPORTACIÓN =====

export interface ExportResponse extends ApiResponse {
  data?: {
    downloadUrl: string;
    format: 'json' | 'csv' | 'pdf';
    filename: string;
    size: number;
    expiresAt: string;
  };
}

// ===== TIPOS PARA ESTADÍSTICAS =====

export interface StatsResponse extends ApiResponse {
  data?: {
    totalLinkTrees: number;
    totalLinks: number;
    totalViews: number;
    totalClicks: number;
    activeUsers: number;
    topPerformers: Array<{
      id: string;
      title: string;
      views: number;
      clicks: number;
    }>;
  };
}

// ===== TIPOS PARA WEBHOOKS =====

export interface WebhookEvent {
  id: string;
  type: 'linktree.created' | 'linktree.updated' | 'linktree.deleted' | 
        'link.created' | 'link.updated' | 'link.deleted' | 'link.clicked' |
        'analytics.daily' | 'analytics.weekly' | 'analytics.monthly';
  timestamp: string;
  data: any;
  linkTreeId?: string;
  restaurantId?: string;
  userId?: string;
}

export interface WebhookResponse extends ApiResponse {
  data?: {
    eventId: string;
    processed: boolean;
    processingTime: number;
  };
}

// ===== TIPOS PARA BÚSQUEDA =====

export interface SearchResponse extends PaginatedResponse {
  data: Array<{
    id: string;
    type: 'linktree' | 'link';
    title: string;
    description?: string;
    url?: string;
    relevance: number;
    highlight?: {
      title?: string;
      description?: string;
    };
  }>;
  facets?: {
    types: Array<{
      value: string;
      count: number;
    }>;
    categories: Array<{
      value: string;
      count: number;
    }>;
  };
}

// ===== TIPOS PARA BATCH OPERATIONS =====

export interface BatchRequest<T = any> {
  operations: Array<{
    action: 'create' | 'update' | 'delete';
    id?: string;
    data?: T;
  }>;
}

export interface BatchResponse extends ApiResponse {
  data?: {
    processed: number;
    successful: number;
    failed: number;
    results: Array<{
      index: number;
      success: boolean;
      id?: string;
      error?: string;
    }>;
  };
}

// ===== TIPOS PARA RATE LIMITING =====

export interface RateLimitInfo {
  limit: number;
  remaining: number;
  reset: number;
  retryAfter?: number;
}

export interface RateLimitResponse extends ApiResponse {
  rateLimit: RateLimitInfo;
}

// ===== TIPOS PARA HEALTH CHECK =====

export interface HealthCheckResponse {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  version: string;
  services: {
    database: 'up' | 'down';
    cache: 'up' | 'down';
    storage: 'up' | 'down';
    analytics: 'up' | 'down';
  };
  metrics?: {
    uptime: number;
    responseTime: number;
    memoryUsage: number;
    cpuUsage: number;
  };
}

// ===== TIPOS PARA CONFIGURACIÓN =====

export interface ConfigResponse extends ApiResponse {
  data?: {
    features: {
      analytics: boolean;
      customDomains: boolean;
      advancedCustomization: boolean;
      exportData: boolean;
      apiAccess: boolean;
    };
    limits: {
      maxLinksPerTree: number;
      maxImageSize: number;
      maxCustomCssLength: number;
      analyticsRetention: number;
    };
    themes: string[];
    icons: string[];
    integrations: string[];
  };
}

// ===== HELPERS PARA TIPOS =====

/**
 * Tipo helper para extraer el tipo de data de una respuesta
 */
export type ExtractApiData<T> = T extends ApiResponse<infer U> ? U : never;

/**
 * Tipo helper para respuestas con paginación
 */
export type PaginatedData<T> = T extends PaginatedResponse<infer U> ? U : never;

/**
 * Tipo helper para crear respuestas de error
 */
export type ErrorResponse = Omit<ApiResponse, 'data'> & {
  success: false;
  error: string;
};

/**
 * Tipo helper para crear respuestas de éxito
 */
export type SuccessResponse<T> = Omit<ApiResponse<T>, 'error'> & {
  success: true;
  data: T;
};

// ===== GUARDS DE TIPO =====

/**
 * Guard para verificar si una respuesta es exitosa
 */
export function isSuccessResponse<T>(response: ApiResponse<T>): response is SuccessResponse<T> {
  return response.success && response.data !== undefined;
}

/**
 * Guard para verificar si una respuesta es de error
 */
export function isErrorResponse(response: ApiResponse): response is ErrorResponse {
  return !response.success && response.error !== undefined;
}

/**
 * Guard para verificar si una respuesta tiene paginación
 */
export function isPaginatedResponse<T>(response: any): response is PaginatedResponse<T> {
  return response && typeof response === 'object' && 'pagination' in response;
}

// ===== CONSTANTES DE HTTP STATUS =====

export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  METHOD_NOT_ALLOWED: 405,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500,
  BAD_GATEWAY: 502,
  SERVICE_UNAVAILABLE: 503,
  GATEWAY_TIMEOUT: 504
} as const;

export type HttpStatus = typeof HTTP_STATUS[keyof typeof HTTP_STATUS];

// ===== TIPOS PARA MIDDLEWARE =====

export interface ApiContext {
  request: Request;
  params: Record<string, string>;
  query: Record<string, string>;
  headers: Record<string, string>;
  user?: {
    id: string;
    email: string;
    role: string;
  };
}

export interface ApiHandler<T = any> {
  (context: ApiContext): Promise<ApiResponse<T>>;
}

// ===== TIPOS PARA CACHE =====

export interface CacheConfig {
  key: string;
  ttl: number; // Time to live in seconds
  tags?: string[];
  version?: string;
}

export interface CacheResponse<T> {
  data: T;
  cachedAt: string;
  expiresAt: string;
  hit: boolean;
}

// ===== EXPORTACIONES =====

export default {
//   // Responses
//   ApiResponse,
//   PaginatedResponse,
//   ApiError,
  
//   // LinkTree
//   LinkTreeCreateResponse,
//   LinkTreeUpdateResponse,
//   LinkTreeDeleteResponse,
//   LinkTreeListResponse,
  
//   // Links
//   LinkCreateResponse,
//   LinkUpdateResponse,
//   LinkDeleteResponse,
//   LinkClickResponse,
//   LinkListResponse,
  
//   // Analytics
//   AnalyticsResponse,
//   AnalyticsSummaryResponse,
  
//   // Images
//   ImageUploadResponse,
//   ImageDeleteResponse,
  
//   // Validation
//   ValidationResponse,
//   SlugCheckResponse,
  
//   // Export
//   ExportResponse,
  
//   // Stats
//   StatsResponse,
  
//   // Webhooks
//   WebhookEvent,
//   WebhookResponse,
  
//   // Search
//   SearchResponse,
  
//   // Batch
//   BatchRequest,
//   BatchResponse,
  
//   // Health
//   HealthCheckResponse,
  
//   // Config
//   ConfigResponse,
  
//   // Guards
//   isSuccessResponse,
//   isErrorResponse,
//   isPaginatedResponse,
  
//   // Constants
//   HTTP_STATUS
};