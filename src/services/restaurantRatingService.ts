// src/services/restaurantRatingService.ts

import type { 
  RestaurantRating, 
  RestaurantRatingCreate, 
  RestaurantRatingUpdate, 
  RestaurantRatingStats,
  RestaurantRatingsResponse,
  RestaurantSearchFilters,
  RestaurantSearchResponse,
  RestaurantRanking,
  FeaturedRestaurantsResponse,
  RestaurantComment,
  RestaurantCommentCreate,
  RestaurantCommentsResponse
} from '../interfaces/restaurantRating.ts';
import type { Restaurant } from '../interfaces/restaurant.ts';

// Types para resultados de API
export interface ApiResult<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}

// API Error interface
export interface ApiError {
  detail: string;
  status?: number;
}

// Types específicos para respuestas de rating
export interface RatingActionResponse {
  id: string;
  restaurantId: string;
  rating: number;
  comment?: string;
  anonymous: boolean;
  timestamp: string;
  message?: string;
}

export interface DeviceIdInfo {
  deviceId: string;
  isNew: boolean;
}

const API_BASE_URL = import.meta.env.PUBLIC_API_URL || 'http://localhost:8000';

/**
 * Servicio para manejar todas las operaciones de ratings de restaurantes
 * Detecta automáticamente si el usuario está autenticado y usa endpoints correspondientes
 */
class RestaurantRatingService {
  private readonly DEVICE_ID_KEY = 'restaurant_device_id';
  private deviceId: string | null = null;

  /**
   * Inicializa el servicio y genera/recupera device_id para usuarios anónimos
   */
  constructor() {
    if (this.isBrowser()) {
      this.initializeDeviceId();
    }
  }

  /**
   * Obtiene todos los ratings de un restaurante
   */
  async getRestaurantRatings(
    restaurantId: string,
    limit: number = 10,
    page: number = 1,
    includeAnonymous: boolean = true
  ): Promise<ApiResult<RestaurantRatingsResponse>> {
    try {
      const params = new URLSearchParams({
        limit: limit.toString(),
        page: page.toString(),
        include_anonymous: includeAnonymous.toString()
      });

      const response = await fetch(
        `${API_BASE_URL}/restaurants/${restaurantId}/ratings?${params}`,
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
          error: errorData.detail || 'Error obteniendo ratings'
        };
      }

      const data: RestaurantRatingsResponse = await response.json();
      return {
        success: true,
        data
      };
    } catch (error) {
      console.error('Error obteniendo ratings:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido obteniendo ratings'
      };
    }
  }

  /**
   * Crea un rating para un restaurante (detecta automáticamente si es anónimo o autenticado)
   */
  async createRestaurantRating(
    restaurantId: string,
    ratingData: RestaurantRatingCreate
  ): Promise<ApiResult<RatingActionResponse>> {
    try {
      const isAuthenticated = await this.checkAuthentication();

      if (isAuthenticated) {
        // Usuario autenticado - usar endpoint registrado
        return this.createAuthenticatedRating(restaurantId, ratingData);
      } else {
        // Usuario anónimo - usar endpoint anónimo
        return this.createAnonymousRating(restaurantId, ratingData);
      }
    } catch (error) {
      console.error('Error creando rating:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido creando rating'
      };
    }
  }

  /**
   * Actualiza un rating existente (solo para usuarios autenticados)
   */
  async updateRestaurantRating(
    ratingId: string,
    ratingData: RestaurantRatingUpdate
  ): Promise<ApiResult<RatingActionResponse>> {
    try {
      const isAuthenticated = await this.checkAuthentication();
      
      if (!isAuthenticated) {
        return {
          success: false,
          error: 'Debes estar autenticado para actualizar ratings'
        };
      }

      const response = await this.makeAuthenticatedRequest(
        `/restaurants/ratings/${ratingId}`,
        {
          method: 'PUT',
          body: JSON.stringify(ratingData)
        }
      );

      if (!response.ok) {
        const errorData: ApiError = await response.json();
        return {
          success: false,
          error: errorData.detail || 'Error actualizando rating'
        };
      }

      const data: RatingActionResponse = await response.json();
      return {
        success: true,
        data
      };
    } catch (error) {
      console.error('Error actualizando rating:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido actualizando rating'
      };
    }
  }

  /**
   * Elimina un rating (solo para usuarios autenticados)
   */
  async deleteRestaurantRating(ratingId: string): Promise<ApiResult<{ message: string }>> {
    try {
      const isAuthenticated = await this.checkAuthentication();
      
      if (!isAuthenticated) {
        return {
          success: false,
          error: 'Debes estar autenticado para eliminar ratings'
        };
      }

      const response = await this.makeAuthenticatedRequest(
        `/restaurants/ratings/${ratingId}`,
        { method: 'DELETE' }
      );

      if (!response.ok) {
        const errorData: ApiError = await response.json();
        return {
          success: false,
          error: errorData.detail || 'Error eliminando rating'
        };
      }

      const data = await response.json();
      return {
        success: true,
        data
      };
    } catch (error) {
      console.error('Error eliminando rating:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido eliminando rating'
      };
    }
  }

  /**
   * Obtiene estadísticas de ratings de un restaurante
   */
  async getRestaurantRatingStats(restaurantId: string): Promise<ApiResult<RestaurantRatingStats>> {
    try {
      const response = await fetch(
        `${API_BASE_URL}/restaurants/${restaurantId}/rating-stats`,
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
          error: errorData.detail || 'Error obteniendo estadísticas'
        };
      }

      const data: RestaurantRatingStats = await response.json();
      return {
        success: true,
        data
      };
    } catch (error) {
      console.error('Error obteniendo estadísticas:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido obteniendo estadísticas'
      };
    }
  }

  /**
   * Busca restaurantes con filtros avanzados
   */
  async searchRestaurants(
    filters: RestaurantSearchFilters,
    limit: number = 20,
    page: number = 1
  ): Promise<ApiResult<RestaurantSearchResponse>> {
    try {
      const params = new URLSearchParams({
        limit: limit.toString(),
        page: page.toString()
      });

      const response = await fetch(
        `${API_BASE_URL}/restaurants/search?${params}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(filters)
        }
      );

      if (!response.ok) {
        const errorData: ApiError = await response.json();
        return {
          success: false,
          error: errorData.detail || 'Error en búsqueda'
        };
      }

      const data: RestaurantSearchResponse = await response.json();
      return {
        success: true,
        data
      };
    } catch (error) {
      console.error('Error en búsqueda:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido en búsqueda'
      };
    }
  }

  /**
   * Obtiene los restaurantes mejor valorados
   */
  async getTopRatedRestaurants(
    limit: number = 10,
    minReviews: number = 5
  ): Promise<ApiResult<RestaurantRanking[]>> {
    try {
      const params = new URLSearchParams({
        limit: limit.toString(),
        min_reviews: minReviews.toString()
      });

      const response = await fetch(
        `${API_BASE_URL}/restaurants/top-rated?${params}`,
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
          error: errorData.detail || 'Error obteniendo top restaurantes'
        };
      }

      const data: RestaurantRanking[] = await response.json();
      return {
        success: true,
        data
      };
    } catch (error) {
      console.error('Error obteniendo top restaurantes:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido obteniendo top restaurantes'
      };
    }
  }

  /**
   * Obtiene restaurantes destacados para homepage
   */
  async getFeaturedRestaurants(limit: number = 6): Promise<ApiResult<FeaturedRestaurantsResponse>> {
    try {
      const params = new URLSearchParams({
        limit: limit.toString()
      });

      const response = await fetch(
        `${API_BASE_URL}/restaurants/featured?${params}`,
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
          error: errorData.detail || 'Error obteniendo restaurantes destacados'
        };
      }

      const data: FeaturedRestaurantsResponse = await response.json();
      return {
        success: true,
        data
      };
    } catch (error) {
      console.error('Error obteniendo restaurantes destacados:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido obteniendo destacados'
      };
    }
  }

  /**
   * Crea un rating autenticado
   */
  private async createAuthenticatedRating(
    restaurantId: string,
    ratingData: RestaurantRatingCreate
  ): Promise<ApiResult<RatingActionResponse>> {
    const response = await this.makeAuthenticatedRequest(
      `/restaurants/${restaurantId}/ratings`,
      {
        method: 'POST',
        body: JSON.stringify(ratingData)
      }
    );

    if (!response.ok) {
      const errorData: ApiError = await response.json();
      return {
        success: false,
        error: errorData.detail || 'Error creando rating autenticado'
      };
    }

    const data: RatingActionResponse = await response.json();
    return {
      success: true,
      data
    };
  }

  /**
   * Crea un rating anónimo
   */
  private async createAnonymousRating(
    restaurantId: string,
    ratingData: RestaurantRatingCreate
  ): Promise<ApiResult<RatingActionResponse>> {
    const deviceId = this.getOrCreateDeviceId();

    const response = await fetch(
      `${API_BASE_URL}/anonymous/restaurants/${restaurantId}/rate`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Device-Id': deviceId
        },
        body: JSON.stringify({
          rating: ratingData.rating,
          comment: ratingData.comment
        })
      }
    );

    if (!response.ok) {
      const errorData: ApiError = await response.json();
      return {
        success: false,
        error: errorData.detail || 'Error creando rating anónimo'
      };
    }

    const data: RatingActionResponse = await response.json();
    return {
      success: true,
      data
    };
  }

  /**
   * Verifica si el usuario está autenticado
   */
  private async checkAuthentication(): Promise<boolean> {
    try {
      const { authService } = await import('./authService.ts');
      return authService.isAuthenticated();
    } catch (error) {
      console.error('Error verificando autenticación:', error);
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
   * Inicializa o recupera el device ID para usuarios anónimos
   */
  private initializeDeviceId(): void {
    const stored = localStorage.getItem(this.DEVICE_ID_KEY);
    if (stored) {
      this.deviceId = stored;
    } else {
      this.deviceId = this.generateDeviceId();
      localStorage.setItem(this.DEVICE_ID_KEY, this.deviceId);
    }
  }

  /**
   * Genera un nuevo device ID único
   */
  private generateDeviceId(): string {
    const timestamp = Date.now().toString(36);
    const randomStr = Math.random().toString(36).substring(2, 8);
    return `device_${timestamp}_${randomStr}`;
  }

  /**
   * Obtiene o crea un device ID
   */
  private getOrCreateDeviceId(): string {
    if (!this.deviceId && this.isBrowser()) {
      this.initializeDeviceId();
    }
    return this.deviceId || this.generateDeviceId();
  }

  /**
   * Obtiene información del device ID actual
   */
  // getDeviceIdInfo(): DeviceIdInfo {
  //   const deviceId = this.getOrCreateDeviceId();
  //   const isNew = !localStorage.getItem(this.DEVICE_ID_KEY);
    
  //   return {
  //     deviceId,
  //     isNew
  //   };
  // }

  /**
   * Limpia el device ID (útil para testing o reset)
   */
  clearDeviceId(): void {
    if (this.isBrowser()) {
      localStorage.removeItem(this.DEVICE_ID_KEY);
      this.deviceId = null;
    }
  }

  /**
   * Verifica si estamos en el navegador
   */
  private isBrowser(): boolean {
    return typeof window !== 'undefined';
  }

  /**
   * ===== FUNCIONES PARA COMENTARIOS =====
   */

  /**
   * Obtiene todos los comentarios de un restaurante
   */
  async getRestaurantComments(
    restaurantId: string,
    limit: number = 20,
    page: number = 1,
    includeAnonymous: boolean = true
  ): Promise<ApiResult<RestaurantCommentsResponse>> {
    try {
      const params = new URLSearchParams({
        limit: limit.toString(),
        page: page.toString(),
        include_anonymous: includeAnonymous.toString()
      });

      const response = await fetch(
        `${API_BASE_URL}/restaurants/${restaurantId}/comments?${params}`,
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
          error: errorData.detail || 'Error obteniendo comentarios'
        };
      }

      const data: RestaurantCommentsResponse = await response.json();
      return {
        success: true,
        data
      };
    } catch (error) {
      console.error('Error obteniendo comentarios:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido obteniendo comentarios'
      };
    }
  }

  /**
   * Crea un comentario para un restaurante (detecta automáticamente si es anónimo o autenticado)
   */
  async createRestaurantComment(
    restaurantId: string,
    commentData: RestaurantCommentCreate
  ): Promise<ApiResult<RestaurantComment>> {
    try {
      const isAuthenticated = await this.checkAuthentication();

      if (isAuthenticated) {
        // Usuario autenticado - usar endpoint registrado
        return this.createAuthenticatedComment(restaurantId, commentData);
      } else {
        // Usuario anónimo - usar endpoint anónimo
        return this.createAnonymousComment(restaurantId, commentData);
      }
    } catch (error) {
      console.error('Error creando comentario:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido creando comentario'
      };
    }
  }

  /**
   * Crea un comentario autenticado
   */
  private async createAuthenticatedComment(
    restaurantId: string,
    commentData: RestaurantCommentCreate
  ): Promise<ApiResult<RestaurantComment>> {
    const response = await this.makeAuthenticatedRequest(
      `/restaurants/${restaurantId}/comments`,
      {
        method: 'POST',
        body: JSON.stringify(commentData)
      }
    );

    if (!response.ok) {
      const errorData: ApiError = await response.json();
      return {
        success: false,
        error: errorData.detail || 'Error creando comentario autenticado'
      };
    }

    const data: RestaurantComment = await response.json();
    return {
      success: true,
      data
    };
  }

  /**
   * Crea un comentario anónimo
   */
  private async createAnonymousComment(
    restaurantId: string,
    commentData: RestaurantCommentCreate
  ): Promise<ApiResult<RestaurantComment>> {
    const deviceId = this.getOrCreateDeviceId();

    const response = await fetch(
      `${API_BASE_URL}/anonymous/restaurants/${restaurantId}/comments`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Device-Id': deviceId
        },
        body: JSON.stringify(commentData)
      }
    );

    if (!response.ok) {
      const errorData: ApiError = await response.json();
      return {
        success: false,
        error: errorData.detail || 'Error creando comentario anónimo'
      };
    }

    const data: RestaurantComment = await response.json();
    return {
      success: true,
      data
    };
  }

  /**
   * Utilidades para trabajar con ratings
   */
  utils = {
    /**
     * Calcula el promedio de ratings
     */
    calculateAverageRating: (ratings: RestaurantRating[]): number => {
      if (ratings.length === 0) return 0;
      const sum = ratings.reduce((acc, rating) => acc + rating.rating, 0);
      return Math.round((sum / ratings.length) * 10) / 10;
    },

    /**
     * Genera distribución de estrellas
     */
    generateRatingDistribution: (ratings: RestaurantRating[]): Record<string, number> => {
      const distribution = { '1': 0, '2': 0, '3': 0, '4': 0, '5': 0 };
      
      ratings.forEach(rating => {
        const star = Math.floor(rating.rating).toString() as '1' | '2' | '3' | '4' | '5';
        if (star in distribution) {
          distribution[star]++;
        }
      });

      return distribution;
    },

    /**
     * Filtra ratings por criterios
     */
    filterRatings: (
      ratings: RestaurantRating[],
      filters: {
        minRating?: number;
        maxRating?: number;
        anonymous?: boolean;
        hasComment?: boolean;
      }
    ): RestaurantRating[] => {
      return ratings.filter(rating => {
        if (filters.minRating && rating.rating < filters.minRating) return false;
        if (filters.maxRating && rating.rating > filters.maxRating) return false;
        if (filters.anonymous !== undefined && rating.anonymous !== filters.anonymous) return false;
        if (filters.hasComment !== undefined) {
          const hasComment = !!(rating.comment && rating.comment.trim());
          if (hasComment !== filters.hasComment) return false;
        }
        return true;
      });
    },

    /**
     * Ordena ratings por diferentes criterios
     */
    sortRatings: (
      ratings: RestaurantRating[],
      sortBy: 'timestamp' | 'rating' | 'comment',
      order: 'asc' | 'desc' = 'desc'
    ): RestaurantRating[] => {
      return [...ratings].sort((a, b) => {
        let comparison = 0;
        
        switch (sortBy) {
          case 'timestamp':
            comparison = new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime();
            break;
          case 'rating':
            comparison = a.rating - b.rating;
            break;
          case 'comment':
            const aHasComment = !!(a.comment && a.comment.trim());
            const bHasComment = !!(b.comment && b.comment.trim());
            comparison = aHasComment === bHasComment ? 0 : (aHasComment ? 1 : -1);
            break;
        }
        
        return order === 'desc' ? -comparison : comparison;
      });
    },

    /**
     * Encuentra el rating del usuario actual
     */
    findUserRating: (ratings: RestaurantRating[], userId?: string, deviceId?: string): RestaurantRating | undefined => {
      return ratings.find(rating => {
        if (userId && !rating.anonymous && rating.userId === userId) {
          return true;
        }
        if (deviceId && rating.anonymous && rating.deviceId === deviceId) {
          return true;
        }
        return false;
      });
    },

    /**
     * Valida los datos de un rating
     */
    validateRatingData: (data: RestaurantRatingCreate): { isValid: boolean; errors: string[] } => {
      const errors: string[] = [];
      
      if (!data.rating || data.rating < 1 || data.rating > 5) {
        errors.push('La valoración debe estar entre 1 y 5');
      }
      
      if (data.comment && data.comment.length > 500) {
        errors.push('El comentario no puede exceder 500 caracteres');
      }
      
      if (data.comment && data.comment.trim().length < 3) {
        errors.push('El comentario debe tener al menos 3 caracteres');
      }
      
      return {
        isValid: errors.length === 0,
        errors
      };
    }
  };
}

// Exportar una instancia única del servicio
export const restaurantRatingService = new RestaurantRatingService();
export default restaurantRatingService;