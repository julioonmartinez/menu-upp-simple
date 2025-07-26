// src/services/linkTreeService.ts

import { type LinkTree, type Link, LinkType } from '../interfaces/links.ts';

// Types para resultados de API
export interface ApiResult<T> {
  success: boolean;
  data?: T;
  error?: string;
  errorType?: 'RESTAURANT_NOT_FOUND' | 'PERMISSION_DENIED' | 'NETWORK_ERROR' | 'UNKNOWN_ERROR' | 'LINKTREE_NOT_FOUND';
  restaurant?: {
    id: string;
    name: string;
    username: string;
  };
  message?: string;
}

// API Error interface
export interface ApiError {
  detail: string;
  status?: number;
}

// ===== INTERFACES PARA LINKTREE =====

export interface LinkTreeCreateRequest {
  restaurantId: string;
  title?: string;
  description?: string;
  backgroundColor?: string;
  linksBackgroundColor?: string;
  linksColor?: string;
  socialMediaBackgroundColor?: string;
  socialMediaTextColor?: string;
  textColor?: string;
  buttonStyle?: "rounded" | "square" | "pill";
  theme?: "light" | "dark" | "custom";
  customCss?: string;
  ctaBackgroundColor?: string;
  ctaTextColor?: string;
  isPublic?: boolean;
  customSlug?: string;
}

export interface LinkTreeUpdateRequest {
  title?: string;
  description?: string;
  backgroundColor?: string;
  linksBackgroundColor?: string;
  linksColor?: string;
  socialMediaBackgroundColor?: string;
  socialMediaTextColor?: string;
  textColor?: string;
  buttonStyle?: "rounded" | "square" | "pill";
  theme?: "light" | "dark" | "custom";
  customCss?: string;
  ctaBackgroundColor?: string;
  ctaTextColor?: string;
  isPublic?: boolean;
  customSlug?: string;
}

export type LinkTreeResponse = LinkTree;

// ===== INTERFACES PARA REORDENAMIENTO =====

export interface LinkReorderRequest {
  linkIds: string[];
}

export interface LinkReorderResponse {
  message: string;
  links: Link[];
}

export interface LinkNormalizeOrderResponse {
  message: string;
  links: Link[];
}

// ===== INTERFACES PARA LINKS =====

export interface LinkCreateRequest {
  title: string;
  url: string;
  icon?: string;
  description?: string;
  type: LinkType;
  order?: number;
  active?: boolean;
  customColor?: string;
}

export interface LinkUpdateRequest {
  title?: string;
  url?: string;
  icon?: string;
  description?: string;
  type?: LinkType;
  order?: number;
  active?: boolean;
  customColor?: string;
}

export type LinkResponse = Link;

// ===== INTERFACES PARA IMÁGENES =====

export interface ImageUploadResponse {
  id: string;
  profileImage?: any;
  coverImage?: any;
  textImage?: any;
  [key: string]: any;
}

// ===== INTERFACES PARA ANALYTICS =====

export interface LinkTreeAnalytics {
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
}

const API_BASE_URL = import.meta.env.PUBLIC_API_URL || 'http://localhost:8000';

/**
 * Servicio para manejar todas las operaciones CRUD de LinkTree y Links
 */
class LinkTreeService {

  // ===== MÉTODOS PARA LINKTREE =====

  /**
 * Obtiene el LinkTree de un restaurante por ID
 */
/**
 * Obtiene el LinkTree de un restaurante por ID
 */
async getLinkTreeByRestaurant(restaurantId: string): Promise<ApiResult<LinkTree | null>> {
  try {
    const response = await fetch(
      `${API_BASE_URL}/linktrees/restaurant/${restaurantId}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );

    // Leer el body una sola vez
    const responseData = await response.json();

    if (!response.ok) {
      // Distinguir entre diferentes tipos de error
      if (response.status === 404) {
        return {
          success: false,
          error: responseData.detail || 'Restaurante no encontrado',
          errorType: 'RESTAURANT_NOT_FOUND'
        };
      } else if (response.status === 403) {
        return {
          success: false,
          error: responseData.detail || 'No tienes permisos para ver este LinkTree',
          errorType: 'PERMISSION_DENIED'
        };
      } else {
        return {
          success: false,
          error: responseData.detail || 'Error obteniendo LinkTree del restaurante',
          errorType: 'UNKNOWN_ERROR'
        };
      }
    }
    
    // Verificar si el LinkTree existe
    if (!responseData.linkTree) {
      // No hay LinkTree, pero el restaurante existe
      return {
        success: true,
        data: null,
        restaurant: responseData.restaurant,
        message: responseData.message || 'No existe LinkTree para este restaurante'
      };
    }

    // LinkTree existe
    const linkTree: LinkTree = this.formatLinkTreeDates(responseData.linkTree);
    return {
      success: true,
      data: linkTree,
      restaurant: responseData.restaurant
    };
    
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error de red obteniendo LinkTree',
      errorType: 'NETWORK_ERROR'
    };
  }
}
  /**
   * Obtiene el LinkTree de un restaurante por username
   */
  async getLinkTreeByUsername(username: string): Promise<ApiResult<LinkTree>> {
    try {
      const response = await fetch(
        `${API_BASE_URL}/linktrees/restaurant/username/${username}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      if (!response.ok) {
        const errorData: ApiError = await response.json();
        return {
          success: false,
          error: errorData.detail || 'Error obteniendo LinkTree por username'
        };
      }

      const data: LinkTree = await response.json();
      return {
        success: true,
        data: this.formatLinkTreeDates(data)
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido obteniendo LinkTree'
      };
    }
  }

  /**
   * Obtiene el LinkTree por slug
   */
  async getLinkTreeBySlug(slug: string): Promise<ApiResult<LinkTree>> {
    try {
      const response = await fetch(
        `${API_BASE_URL}/linktrees/slug/${slug}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      if (!response.ok) {
        const errorData: ApiError = await response.json();
        return {
          success: false,
          error: errorData.detail || 'Error obteniendo LinkTree por slug'
        };
      }

      const data: LinkTree = await response.json();
      return {
        success: true,
        data: this.formatLinkTreeDates(data)
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido obteniendo LinkTree'
      };
    }
  }

  /**
   * Obtiene un LinkTree específico por ID (requiere autenticación)
   */
  async getLinkTree(linkTreeId: string): Promise<ApiResult<LinkTree>> {
    try {
      const isAuthenticated = await this.checkAuthentication();
      
      if (!isAuthenticated) {
        return {
          success: false,
          error: 'Debes estar autenticado para ver este LinkTree'
        };
      }

      const response = await this.makeAuthenticatedRequest(`/linktrees/${linkTreeId}`, {
        method: 'GET'
      });

      if (!response.ok) {
        const errorData: ApiError = await response.json();
        return {
          success: false,
          error: errorData.detail || 'Error obteniendo LinkTree'
        };
      }

      const data: LinkTree = await response.json();
      return {
        success: true,
        data: this.formatLinkTreeDates(data)
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido obteniendo LinkTree'
      };
    }
  }

  /**
   * Crea un nuevo LinkTree (requiere autenticación)
   */
  async createLinkTree(linkTreeData: LinkTreeCreateRequest): Promise<ApiResult<LinkTreeResponse>> {
    try {
      const isAuthenticated = await this.checkAuthentication();
      
      if (!isAuthenticated) {
        return {
          success: false,
          error: 'Debes estar autenticado para crear LinkTrees'
        };
      }

      // Validar datos mínimos
      const validation = this.validateLinkTreeData(linkTreeData);
      if (!validation.isValid) {
        return {
          success: false,
          error: `Datos inválidos: ${validation.errors.join(', ')}`
        };
      }

      const response = await this.makeAuthenticatedRequest('/linktrees/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(linkTreeData)
      });

      if (!response.ok) {
        const errorData: ApiError = await response.json();
        return {
          success: false,
          error: errorData.detail || 'Error creando LinkTree'
        };
      }

      const data: LinkTreeResponse = await response.json();
      return {
        success: true,
        data: this.formatLinkTreeDates(data)
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido creando LinkTree'
      };
    }
  }

  /**
   * Actualiza un LinkTree existente (requiere autenticación)
   */
  async updateLinkTree(
    linkTreeId: string, 
    linkTreeData: LinkTreeUpdateRequest
  ): Promise<ApiResult<LinkTreeResponse>> {
    try {
      const isAuthenticated = await this.checkAuthentication();
      
      if (!isAuthenticated) {
        return {
          success: false,
          error: 'Debes estar autenticado para actualizar LinkTrees'
        };
      }

      const response = await this.makeAuthenticatedRequest(`/linktrees/${linkTreeId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(linkTreeData)
      });

      if (!response.ok) {
        const errorData: ApiError = await response.json();
        return {
          success: false,
          error: errorData.detail || 'Error actualizando LinkTree'
        };
      }

      const data: LinkTreeResponse = await response.json();
      return {
        success: true,
        data: this.formatLinkTreeDates(data)
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido actualizando LinkTree'
      };
    }
  }

  /**
   * Elimina un LinkTree (requiere autenticación)
   */
  async deleteLinkTree(linkTreeId: string): Promise<ApiResult<{ message: string }>> {
    try {
      const isAuthenticated = await this.checkAuthentication();
      
      if (!isAuthenticated) {
        return {
          success: false,
          error: 'Debes estar autenticado para eliminar LinkTrees'
        };
      }

      const response = await this.makeAuthenticatedRequest(`/linktrees/${linkTreeId}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        const errorData: ApiError = await response.json();
        return {
          success: false,
          error: errorData.detail || 'Error eliminando LinkTree'
        };
      }

      const data = await response.json();
      return {
        success: true,
        data
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido eliminando LinkTree'
      };
    }
  }

  // ===== MÉTODOS PARA IMÁGENES =====

  /**
   * Sube imagen de perfil para un LinkTree
   */
  async uploadProfileImage(linkTreeId: string, file: File): Promise<ApiResult<ImageUploadResponse>> {
    return this.uploadImage(linkTreeId, file, 'profile-image');
  }

  /**
   * Sube imagen de cover para un LinkTree
   */
  async uploadCoverImage(linkTreeId: string, file: File): Promise<ApiResult<ImageUploadResponse>> {
    return this.uploadImage(linkTreeId, file, 'cover-image');
  }

  /**
   * Sube imagen de texto para un LinkTree
   */
  async uploadTextImage(linkTreeId: string, file: File): Promise<ApiResult<ImageUploadResponse>> {
    return this.uploadImage(linkTreeId, file, 'text-image');
  }

  /**
   * Método privado para subir imágenes
   */
  private async uploadImage(
    linkTreeId: string, 
    file: File, 
    imageType: string
  ): Promise<ApiResult<ImageUploadResponse>> {
    try {
      const isAuthenticated = await this.checkAuthentication();
      
      if (!isAuthenticated) {
        return {
          success: false,
          error: 'Debes estar autenticado para subir imágenes'
        };
      }

      const formData = new FormData();
      formData.append('file', file);

      const response = await this.makeAuthenticatedRequest(
        `/linktrees/${linkTreeId}/${imageType}`,
        {
          method: 'POST',
          body: formData
        }
      );

      if (!response.ok) {
        const errorData: ApiError = await response.json();
        return {
          success: false,
          error: errorData.detail || 'Error subiendo imagen'
        };
      }

      const data: ImageUploadResponse = await response.json();
      return {
        success: true,
        data
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido subiendo imagen'
      };
    }
  }

  // ===== MÉTODOS PARA LINKS =====

  /**
   * Obtiene todos los enlaces de un LinkTree
   */
  async getLinks(linkTreeId: string): Promise<ApiResult<Link[]>> {
    try {
      const response = await fetch(
        `${API_BASE_URL}/linktrees/${linkTreeId}/links`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      if (!response.ok) {
        const errorData: ApiError = await response.json();
        return {
          success: false,
          error: errorData.detail || 'Error obteniendo enlaces'
        };
      }

      const data: Link[] = await response.json();
      return {
        success: true,
        data: data.map(link => this.formatLinkDates(link))
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido obteniendo enlaces'
      };
    }
  }

  /**
   * Crea un nuevo enlace en un LinkTree (requiere autenticación)
   */
  async createLink(linkTreeId: string, linkData: LinkCreateRequest): Promise<ApiResult<LinkResponse>> {
    try {
      const isAuthenticated = await this.checkAuthentication();
      
      if (!isAuthenticated) {
        return {
          success: false,
          error: 'Debes estar autenticado para crear enlaces'
        };
      }

      // Validar datos mínimos
      const validation = this.validateLinkData(linkData);
      if (!validation.isValid) {
        return {
          success: false,
          error: `Datos inválidos: ${validation.errors.join(', ')}`
        };
      }

      const response = await this.makeAuthenticatedRequest(`/linktrees/${linkTreeId}/links`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(linkData)
      });

      if (!response.ok) {
        const errorData: ApiError = await response.json();
        return {
          success: false,
          error: errorData.detail || 'Error creando enlace'
        };
      }

      const data: LinkResponse = await response.json();
      return {
        success: true,
        data: this.formatLinkDates(data)
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido creando enlace'
      };
    }
  }

  /**
   * Actualiza un enlace existente (requiere autenticación)
   */
  async updateLink(
    linkTreeId: string, 
    linkId: string, 
    linkData: LinkUpdateRequest
  ): Promise<ApiResult<LinkResponse>> {
    try {
      const isAuthenticated = await this.checkAuthentication();
      
      if (!isAuthenticated) {
        return {
          success: false,
          error: 'Debes estar autenticado para actualizar enlaces'
        };
      }

      const response = await this.makeAuthenticatedRequest(
        `/linktrees/${linkTreeId}/links/${linkId}`, 
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(linkData)
        }
      );

      if (!response.ok) {
        const errorData: ApiError = await response.json();
        return {
          success: false,
          error: errorData.detail || 'Error actualizando enlace'
        };
      }

      const data: LinkResponse = await response.json();
      return {
        success: true,
        data: this.formatLinkDates(data)
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido actualizando enlace'
      };
    }
  }

  /**
   * Elimina un enlace (requiere autenticación)
   */
  async deleteLink(linkTreeId: string, linkId: string): Promise<ApiResult<{ message: string }>> {
    try {
      const isAuthenticated = await this.checkAuthentication();
      
      if (!isAuthenticated) {
        return {
          success: false,
          error: 'Debes estar autenticado para eliminar enlaces'
        };
      }

      const response = await this.makeAuthenticatedRequest(
        `/linktrees/${linkTreeId}/links/${linkId}`, 
        {
          method: 'DELETE'
        }
      );

      if (!response.ok) {
        const errorData: ApiError = await response.json();
        return {
          success: false,
          error: errorData.detail || 'Error eliminando enlace'
        };
      }

      const data = await response.json();
      return {
        success: true,
        data
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido eliminando enlace'
      };
    }
  }

  /**
   * Reordena los enlaces de un LinkTree (requiere autenticación)
   */
  async reorderLinks(
    linkTreeId: string, 
    linkIds: string[]
  ): Promise<ApiResult<LinkReorderResponse>> {
    try {
      const isAuthenticated = await this.checkAuthentication();
      
      if (!isAuthenticated) {
        return {
          success: false,
          error: 'Debes estar autenticado para reordenar enlaces'
        };
      }

      // Validar que se proporcionen IDs
      if (!linkIds || linkIds.length === 0) {
        return {
          success: false,
          error: 'Debes proporcionar al menos un ID de enlace'
        };
      }

      const response = await this.makeAuthenticatedRequest(
        `/linktrees/${linkTreeId}/links/reorder`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ linkIds })
        }
      );

      if (!response.ok) {
        const errorData: ApiError = await response.json();
        return {
          success: false,
          error: errorData.detail || 'Error reordenando enlaces'
        };
      }

      const data: LinkReorderResponse = await response.json();
      
      // Formatear fechas en los enlaces devueltos
      const formattedLinks = data.links.map(link => this.formatLinkDates(link));
      
      return {
        success: true,
        data: {
          ...data,
          links: formattedLinks
        }
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido reordenando enlaces'
      };
    }
  }
  /**
   * Normaliza el orden de los enlaces de un LinkTree (requiere autenticación)
   */
  async normalizeLinkOrder(linkTreeId: string): Promise<ApiResult<LinkNormalizeOrderResponse>> {
    try {
      const isAuthenticated = await this.checkAuthentication();
      
      if (!isAuthenticated) {
        return {
          success: false,
          error: 'Debes estar autenticado para normalizar el orden de enlaces'
        };
      }

      const response = await this.makeAuthenticatedRequest(
        `/linktrees/${linkTreeId}/links/normalize-order`,
        {
          method: 'POST'
        }
      );

      if (!response.ok) {
        const errorData: ApiError = await response.json();
        return {
          success: false,
          error: errorData.detail || 'Error normalizando orden de enlaces'
        };
      }

      const data: LinkNormalizeOrderResponse = await response.json();
      
      // Formatear fechas en los enlaces devueltos
      const formattedLinks = data.links.map(link => this.formatLinkDates(link));
      
      return {
        success: true,
        data: {
          ...data,
          links: formattedLinks
        }
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido normalizando orden de enlaces'
      };
    }
  }

  /**
   * Registra un clic en un enlace (no requiere autenticación)
   */
  async registerLinkClick(linkTreeId: string, linkId: string): Promise<ApiResult<{ message: string }>> {
    try {
      const response = await fetch(
        `${API_BASE_URL}/linktrees/${linkTreeId}/links/${linkId}/click`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      if (!response.ok) {
        const errorData: ApiError = await response.json();
        return {
          success: false,
          error: errorData.detail || 'Error registrando clic'
        };
      }

      const data = await response.json();
      return {
        success: true,
        data
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido registrando clic'
      };
    }
  }

  // ===== MÉTODOS PARA ANALYTICS =====

  /**
   * Obtiene analíticas de un LinkTree (requiere autenticación)
   */
  async getAnalytics(linkTreeId: string): Promise<ApiResult<LinkTreeAnalytics>> {
    try {
      const isAuthenticated = await this.checkAuthentication();
      
      if (!isAuthenticated) {
        return {
          success: false,
          error: 'Debes estar autenticado para ver analíticas'
        };
      }

      const response = await this.makeAuthenticatedRequest(`/linktrees/${linkTreeId}/analytics`, {
        method: 'GET'
      });

      if (!response.ok) {
        const errorData: ApiError = await response.json();
        return {
          success: false,
          error: errorData.detail || 'Error obteniendo analíticas'
        };
      }

      const data: LinkTreeAnalytics = await response.json();
      return {
        success: true,
        data
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido obteniendo analíticas'
      };
    }
  }

  // ===== MÉTODOS AUXILIARES =====

  /**
   * Verifica si el usuario está autenticado
   */
  private async checkAuthentication(): Promise<boolean> {
    try {
      const { authService } = await import('./authService.ts');
      return authService.isAuthenticated();
    } catch (error) {
      return false;
    }
  }

  /**
   * Realiza una petición autenticada
   */
  private async makeAuthenticatedRequest(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<Response> {
    const { authService } = await import('./authService.ts');
    return authService.authenticatedFetch(endpoint, options);
  }

  /**
   * Valida los datos del LinkTree
   */
  private validateLinkTreeData(data: LinkTreeCreateRequest): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    // Validar restaurantId (requerido)
    if (!data.restaurantId || data.restaurantId.trim().length === 0) {
      errors.push('El ID del restaurante es requerido');
    }
    
    // Validar customSlug (opcional pero con formato)
    if (data.customSlug) {
      const slugRegex = /^[a-zA-Z0-9_-]+$/;
      if (!slugRegex.test(data.customSlug)) {
        errors.push('El slug solo puede contener letras, números, guiones y guiones bajos');
      } else if (data.customSlug.length < 3) {
        errors.push('El slug debe tener al menos 3 caracteres');
      } else if (data.customSlug.length > 50) {
        errors.push('El slug no puede exceder 50 caracteres');
      }
    }
    
    // Validar título (opcional)
    if (data.title && data.title.length > 100) {
      errors.push('El título no puede exceder 100 caracteres');
    }
    
    // Validar descripción (opcional)
    if (data.description && data.description.length > 500) {
      errors.push('La descripción no puede exceder 500 caracteres');
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Valida los datos del Link
   */
  private validateLinkData(data: LinkCreateRequest): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    // Validar título (requerido)
    if (!data.title || data.title.trim().length === 0) {
      errors.push('El título del enlace es requerido');
    } else if (data.title.trim().length < 1) {
      errors.push('El título debe tener al menos 1 carácter');
    } else if (data.title.trim().length > 100) {
      errors.push('El título no puede exceder 100 caracteres');
    }
    
    // Validar URL (requerido)
    if (!data.url || data.url.trim().length === 0) {
      errors.push('La URL del enlace es requerida');
    } else {
      try {
        new URL(data.url);
      } catch {
        errors.push('La URL no tiene un formato válido');
      }
    }
    
    // Validar descripción (opcional)
    if (data.description && data.description.length > 200) {
      errors.push('La descripción no puede exceder 200 caracteres');
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Formatea las fechas del LinkTree
   */
  private formatLinkTreeDates(linkTree: any): LinkTree {
    if (linkTree.createdAt && typeof linkTree.createdAt === 'string') {
      linkTree.createdAt = new Date(linkTree.createdAt);
    }
    if (linkTree.updatedAt && typeof linkTree.updatedAt === 'string') {
      linkTree.updatedAt = new Date(linkTree.updatedAt);
    }
    
    // Formatear fechas en los links
    if (linkTree.links && Array.isArray(linkTree.links)) {
      linkTree.links = linkTree.links.map((link: any) => this.formatLinkDates(link));
    }
    
    return linkTree;
  }

  /**
   * Formatea las fechas del Link
   */
  private formatLinkDates(link: any): Link {
    if (link.analytics && link.analytics.lastClicked && typeof link.analytics.lastClicked === 'string') {
      link.analytics.lastClicked = new Date(link.analytics.lastClicked);
    }
    
    return link;
  }

  /**
   * Utilidades para trabajar con LinkTrees y Links
   */
  utils = {
    /**
     * Genera un slug sugerido basado en el título
     */
    generateSuggestedSlug: (title: string): string => {
      return title
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, '') // Remover caracteres especiales
        .replace(/\s+/g, '-') // Reemplazar espacios con guiones
        .substring(0, 30); // Limitar longitud
    },

    /**
     * Valida si un string es un slug válido
     */
    isValidSlug: (slug: string): boolean => {
      const slugRegex = /^[a-zA-Z0-9_-]{3,50}$/;
      return slugRegex.test(slug);
    },

    /**
     * Valida si una URL es válida
     */
    isValidUrl: (url: string): boolean => {
      try {
        new URL(url);
        return true;
      } catch {
        return false;
      }
    },

    /**
     * Obtiene la URL pública del LinkTree
     */
    getLinkTreePublicUrl: (linkTree: LinkTree): string => {
      const baseUrl = window.location.origin;
      return linkTree.customSlug 
        ? `${baseUrl}/links/${linkTree.customSlug}`
        : `${baseUrl}/links/${linkTree.id}`;
    },

    /**
     * Ordena los enlaces por el campo order
     */
    sortLinksByOrder: (links: Link[]): Link[] => {
      return [...links].sort((a, b) => a.order - b.order);
    },

    /**
     * Filtra enlaces activos
     */
    getActiveLinks: (links: Link[]): Link[] => {
      return links.filter(link => link.active);
    },

    /**
     * Agrupa enlaces por tipo
     */
    groupLinksByType: (links: Link[]): Record<LinkType, Link[]> => {
      const grouped = {} as Record<LinkType, Link[]>;
      
      // Inicializar todos los tipos
      Object.values(LinkType).forEach(type => {
        grouped[type] = [];
      });
      
      // Agrupar enlaces
      links.forEach(link => {
        if (grouped[link.type]) {
          grouped[link.type].push(link);
        }
      });
      
      return grouped;
    },

    /**
     * Formatea el número de clics para mostrar
     */
    formatClickCount: (count: number): string => {
      if (count < 1000) return count.toString();
      if (count < 1000000) return `${(count / 1000).toFixed(1)}K`;
      return `${(count / 1000000).toFixed(1)}M`;
    }
  };
}

// Exportar una instancia única del servicio
export const linkTreeService = new LinkTreeService();
export default linkTreeService;