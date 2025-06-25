// src/services/dishRatingService.ts

import type { 
  DishRating,
  DishRatingCreate,
  DishRatingUpdate,
  DishRatingsResponse,
  DishComment,
  DishCommentCreate,
  DishCommentUpdate,
  DishCommentsResponse,
  DishRatingStats,
  DishSearchFilters,
  DishSearchResponse,
  TopRatedDish,
  MostCommentedDish,
  FavoriteDish,
  FavoriteDishesResponse,
  Dish,
  ToggleFavoriteResponse,
  RateDishResponse
} from '../interfaces/dishRating20.ts';

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
  dishId: string;
  rating: number;
  comment?: string;
  anonymous: boolean;
  timestamp: string;
  message?: string;
}

const API_BASE_URL = import.meta.env.PUBLIC_API_URL || 'http://localhost:8000';

/**
 * Servicio para manejar todas las operaciones de ratings, comentarios y favoritos de platillos
 * Detecta automáticamente si el usuario está autenticado y usa endpoints correspondientes
 */
class DishRatingService {
  private readonly DEVICE_ID_KEY = 'dish_device_id';
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
   * ===== RATINGS =====
   */

  /**
   * Obtiene todos los ratings de un platillo
   */
  async getDishRatings(
    dishId: string,
    limit: number = 10,
    page: number = 1,
    includeAnonymous: boolean = true
  ): Promise<ApiResult<DishRatingsResponse>> {
    try {
      const params = new URLSearchParams({
        limit: limit.toString(),
        page: page.toString(),
        include_anonymous: includeAnonymous.toString()
      });

      const response = await fetch(
        `${API_BASE_URL}/dishes/${dishId}/ratings?${params}`,
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

      const data: DishRatingsResponse = await response.json();
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
   * Crea un rating para un platillo (detecta automáticamente si es anónimo o autenticado)
   */
  async createDishRating(
    dishId: string,
    ratingData: DishRatingCreate
  ): Promise<ApiResult<RatingActionResponse>> {
    try {
      const isAuthenticated = await this.checkAuthentication();

      if (isAuthenticated) {
        // Usuario autenticado - usar endpoint registrado
        return this.createAuthenticatedRating(dishId, ratingData);
      } else {
        // Usuario anónimo - usar endpoint anónimo
        return this.createAnonymousRating(dishId, ratingData);
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
  async updateDishRating(
    ratingId: string,
    ratingData: DishRatingUpdate
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
        `/dishes/ratings/${ratingId}`,
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
  async deleteDishRating(ratingId: string): Promise<ApiResult<{ message: string }>> {
    try {
      const isAuthenticated = await this.checkAuthentication();
      
      if (!isAuthenticated) {
        return {
          success: false,
          error: 'Debes estar autenticado para eliminar ratings'
        };
      }

      const response = await this.makeAuthenticatedRequest(
        `/dishes/ratings/${ratingId}`,
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
   * ===== COMENTARIOS =====
   */

  /**
   * Obtiene todos los comentarios de un platillo
   */
  async getDishComments(
    dishId: string,
    limit: number = 20,
    page: number = 1,
    includeAnonymous: boolean = true,
    sortBy: string = 'timestamp',
    sortOrder: number = -1
  ): Promise<ApiResult<DishCommentsResponse>> {
    try {
      const params = new URLSearchParams({
        limit: limit.toString(),
        page: page.toString(),
        include_anonymous: includeAnonymous.toString(),
        sort_by: sortBy,
        sort_order: sortOrder.toString()
      });

      const response = await fetch(
        `${API_BASE_URL}/dishes/${dishId}/comments?${params}`,
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

      const data: DishCommentsResponse = await response.json();
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
   * Crea un comentario para un platillo (detecta automáticamente si es anónimo o autenticado)
   */
  async createDishComment(
    dishId: string,
    commentData: DishCommentCreate
  ): Promise<ApiResult<DishComment>> {
    try {
      const isAuthenticated = await this.checkAuthentication();

      if (isAuthenticated) {
        // Usuario autenticado - usar endpoint registrado
        return this.createAuthenticatedComment(dishId, commentData);
      } else {
        // Usuario anónimo - usar endpoint anónimo
        return this.createAnonymousComment(dishId, commentData);
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
   * Actualiza un comentario existente (solo para usuarios autenticados)
   */
  async updateDishComment(
    commentId: string,
    commentData: DishCommentUpdate
  ): Promise<ApiResult<DishComment>> {
    try {
      const isAuthenticated = await this.checkAuthentication();
      
      if (!isAuthenticated) {
        return {
          success: false,
          error: 'Debes estar autenticado para actualizar comentarios'
        };
      }

      const response = await this.makeAuthenticatedRequest(
        `/dishes/comments/${commentId}`,
        {
          method: 'PUT',
          body: JSON.stringify(commentData)
        }
      );

      if (!response.ok) {
        const errorData: ApiError = await response.json();
        return {
          success: false,
          error: errorData.detail || 'Error actualizando comentario'
        };
      }

      const data: DishComment = await response.json();
      return {
        success: true,
        data
      };
    } catch (error) {
      console.error('Error actualizando comentario:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido actualizando comentario'
      };
    }
  }

  /**
   * Elimina un comentario (solo para usuarios autenticados)
   */
  async deleteDishComment(commentId: string): Promise<ApiResult<{ message: string }>> {
    try {
      const isAuthenticated = await this.checkAuthentication();
      
      if (!isAuthenticated) {
        return {
          success: false,
          error: 'Debes estar autenticado para eliminar comentarios'
        };
      }

      const response = await this.makeAuthenticatedRequest(
        `/dishes/comments/${commentId}`,
        { method: 'DELETE' }
      );

      if (!response.ok) {
        const errorData: ApiError = await response.json();
        return {
          success: false,
          error: errorData.detail || 'Error eliminando comentario'
        };
      }

      const data = await response.json();
      return {
        success: true,
        data
      };
    } catch (error) {
      console.error('Error eliminando comentario:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido eliminando comentario'
      };
    }
  }

  /**
   * ===== FAVORITOS =====
   */

  /**
   * Alterna el estado de favorito de un platillo (detecta automáticamente si es anónimo o autenticado)
   */
  async toggleDishFavorite(
    dishId: string,
    action: 'add' | 'remove' | 'toggle' = 'toggle'
  ): Promise<ApiResult<ToggleFavoriteResponse>> {
    try {
      const isAuthenticated = await this.checkAuthentication();

      if (isAuthenticated) {
        // Usuario autenticado - usar endpoint registrado
        return this.toggleAuthenticatedFavorite(dishId);
      } else {
        // Usuario anónimo - usar endpoint anónimo
        return this.toggleAnonymousFavorite(dishId, action);
      }
    } catch (error) {
      console.error('Error alternando favorito:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido alternando favorito'
      };
    }
  }

  /**
   * Obtiene los platillos favoritos del usuario
   */
  async getFavoriteDishes(
    limit: number = 20,
    page: number = 1
  ): Promise<ApiResult<FavoriteDishesResponse>> {
    try {
      const isAuthenticated = await this.checkAuthentication();

      if (isAuthenticated) {
        // Usuario autenticado - usar endpoint registrado
        return this.getAuthenticatedFavorites(limit, page);
      } else {
        // Usuario anónimo - usar endpoint anónimo
        return this.getAnonymousFavorites(limit, page);
      }
    } catch (error) {
      console.error('Error obteniendo favoritos:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido obteniendo favoritos'
      };
    }
  }

  /**
   * ===== ESTADÍSTICAS Y BÚSQUEDAS =====
   */

  /**
   * Obtiene estadísticas de ratings de un platillo
   */
  async getDishStats(dishId: string): Promise<ApiResult<DishRatingStats>> {
    try {
      const response = await fetch(
        `${API_BASE_URL}/dishes/${dishId}/stats`,
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

      const data: DishRatingStats = await response.json();
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
   * Obtiene los platillos mejor valorados
   */
  async getTopRatedDishes(
    limit: number = 10,
    minRatings: number = 3,
    restaurantId?: string,
    categoryId?: string
  ): Promise<ApiResult<TopRatedDish[]>> {
    try {
      const params = new URLSearchParams({
        limit: limit.toString(),
        min_ratings: minRatings.toString()
      });

      if (restaurantId) params.append('restaurant_id', restaurantId);
      if (categoryId) params.append('category_id', categoryId);

      const response = await fetch(
        `${API_BASE_URL}/dishes/top-rated?${params}`,
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
          error: errorData.detail || 'Error obteniendo top platillos'
        };
      }

      const data: TopRatedDish[] = await response.json();
      return {
        success: true,
        data
      };
    } catch (error) {
      console.error('Error obteniendo top platillos:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido obteniendo top platillos'
      };
    }
  }

  /**
   * Obtiene los platillos más comentados
   */
  async getMostCommentedDishes(
    limit: number = 10,
    minComments: number = 2,
    restaurantId?: string
  ): Promise<ApiResult<MostCommentedDish[]>> {
    try {
      const params = new URLSearchParams({
        limit: limit.toString(),
        min_comments: minComments.toString()
      });

      if (restaurantId) params.append('restaurant_id', restaurantId);

      const response = await fetch(
        `${API_BASE_URL}/dishes/most-commented?${params}`,
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
          error: errorData.detail || 'Error obteniendo platillos más comentados'
        };
      }

      const data: MostCommentedDish[] = await response.json();
      return {
        success: true,
        data
      };
    } catch (error) {
      console.error('Error obteniendo platillos más comentados:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido obteniendo platillos más comentados'
      };
    }
  }

  /**
   * Búsqueda avanzada de platillos
   */
  async searchDishes(
    filters: DishSearchFilters,
    limit: number = 20,
    page: number = 1
  ): Promise<ApiResult<DishSearchResponse>> {
    try {
      const params = new URLSearchParams({
        limit: limit.toString(),
        page: page.toString()
      });

      const response = await fetch(
        `${API_BASE_URL}/dishes/search-advanced?${params}`,
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

      const data: DishSearchResponse = await response.json();
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
   * ===== MÉTODOS PRIVADOS =====
   */

  /**
 * Crea un rating autenticado (con comentario opcional)
 */
private async createAuthenticatedRating(
  dishId: string,
  ratingData: DishRatingCreate
): Promise<ApiResult<RatingActionResponse>> {
  const response = await this.makeAuthenticatedRequest(
    `/dishes/${dishId}/rate`,
    {
      method: 'POST',
      body: JSON.stringify({
        rating: ratingData.rating,
        comment: ratingData.comment || null  // Enviar null si no hay comentario
      })
    }
  );

  if (!response.ok) {
    const errorData: ApiError = await response.json();
    return {
      success: false,
      error: errorData.detail || 'Error creando rating autenticado'
    };
  }

  const data = await response.json();
  
  // Extraer la información del rating creado de la respuesta
  const ratingCreated = data.rating_created || {
    id: data.id,
    dishId,
    rating: ratingData.rating,
    comment: ratingData.comment,
    anonymous: false,
    timestamp: new Date().toISOString(),
    message: 'Rating creado correctamente'
  };

  return {
    success: true,
    data: ratingCreated
  };
}

  /**
   * Crea un rating anónimo
   */
  private async createAnonymousRating(
    dishId: string,
    ratingData: DishRatingCreate
  ): Promise<ApiResult<RatingActionResponse>> {
    const deviceId = this.getOrCreateDeviceId();

    const response = await fetch(
      `${API_BASE_URL}/anonymous/ratings/dish/${dishId}`,
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
   * Crea un comentario autenticado
   */
  private async createAuthenticatedComment(
    dishId: string,
    commentData: DishCommentCreate
  ): Promise<ApiResult<DishComment>> {
    const response = await this.makeAuthenticatedRequest(
      `/dishes/${dishId}/comments`,
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

    const data: DishComment = await response.json();
    return {
      success: true,
      data
    };
  }

  /**
   * Crea un comentario anónimo
   */
  private async createAnonymousComment(
    dishId: string,
    commentData: DishCommentCreate
  ): Promise<ApiResult<DishComment>> {
    const deviceId = this.getOrCreateDeviceId();

    const response = await fetch(
      `${API_BASE_URL}/anonymous/dishes/${dishId}/comments`,
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

    const data: DishComment = await response.json();
    return {
      success: true,
      data
    };
  }

  /**
   * Alterna favorito autenticado
   */
  private async toggleAuthenticatedFavorite(
    dishId: string
  ): Promise<ApiResult<ToggleFavoriteResponse>> {
    const response = await this.makeAuthenticatedRequest(
      `/dishes/${dishId}/favorite`,
      { method: 'POST' }
    );

    if (!response.ok) {
      const errorData: ApiError = await response.json();
      return {
        success: false,
        error: errorData.detail || 'Error alternando favorito autenticado'
      };
    }

    const data: ToggleFavoriteResponse = await response.json();
    return {
      success: true,
      data
    };
  }

  /**
   * Alterna favorito anónimo
   */
  private async toggleAnonymousFavorite(
    dishId: string,
    action: 'add' | 'remove' | 'toggle' = 'toggle'
  ): Promise<ApiResult<ToggleFavoriteResponse>> {
    const deviceId = this.getOrCreateDeviceId();

    const response = await fetch(
      `${API_BASE_URL}/anonymous/favorites/dish/${dishId}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Device-Id': deviceId
        },
        body: JSON.stringify({ action })
      }
    );

    if (!response.ok) {
      const errorData: ApiError = await response.json();
      return {
        success: false,
        error: errorData.detail || 'Error alternando favorito anónimo'
      };
    }

    const data: ToggleFavoriteResponse = await response.json();
    return {
      success: true,
      data
    };
  }

  /**
   * Obtiene favoritos autenticados
   */
  private async getAuthenticatedFavorites(
    limit: number,
    page: number
  ): Promise<ApiResult<FavoriteDishesResponse>> {
    const params = new URLSearchParams({
      limit: limit.toString(),
      page: page.toString()
    });

    const response = await this.makeAuthenticatedRequest(
      `/favorites?${params}`,
      { method: 'GET' }
    );

    if (!response.ok) {
      const errorData: ApiError = await response.json();
      return {
        success: false,
        error: errorData.detail || 'Error obteniendo favoritos autenticados'
      };
    }

    const data: FavoriteDishesResponse = await response.json();
    return {
      success: true,
      data
    };
  }

  /**
   * Obtiene favoritos anónimos
   */
  private async getAnonymousFavorites(
    limit: number,
    page: number
  ): Promise<ApiResult<FavoriteDishesResponse>> {
    const deviceId = this.getOrCreateDeviceId();
    
    const params = new URLSearchParams({
      limit: limit.toString(),
      page: page.toString()
    });

    const response = await fetch(
      `${API_BASE_URL}/anonymous/favorites/dishes?${params}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'X-Device-Id': deviceId
        }
      }
    );

    if (!response.ok) {
      const errorData: ApiError = await response.json();
      return {
        success: false,
        error: errorData.detail || 'Error obteniendo favoritos anónimos'
      };
    }

    const data: FavoriteDishesResponse = await response.json();
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
    return `dish_device_${timestamp}_${randomStr}`;
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
   * Utilidades para trabajar con ratings y comentarios
   */
  utils = {
    /**
     * Calcula el promedio de ratings
     */
    calculateAverageRating: (ratings: DishRating[]): number => {
      if (ratings.length === 0) return 0;
      const sum = ratings.reduce((acc, rating) => acc + rating.rating, 0);
      return Math.round((sum / ratings.length) * 10) / 10;
    },

    /**
     * Genera distribución de estrellas
     */
    generateRatingDistribution: (ratings: DishRating[]): Record<string, number> => {
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
      ratings: DishRating[],
      filters: {
        minRating?: number;
        maxRating?: number;
        anonymous?: boolean;
        hasComment?: boolean;
      }
    ): DishRating[] => {
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
      ratings: DishRating[],
      sortBy: 'timestamp' | 'rating' | 'comment',
      order: 'asc' | 'desc' = 'desc'
    ): DishRating[] => {
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
    findUserRating: (ratings: DishRating[], userId?: string, deviceId?: string): DishRating | undefined => {
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
     * Encuentra el comentario del usuario actual
     */
    findUserComment: (comments: DishComment[], userId?: string, deviceId?: string): DishComment | undefined => {
      return comments.find(comment => {
        if (userId && !comment.anonymous && comment.userId === userId) {
          return true;
        }
        if (deviceId && comment.anonymous && comment.deviceId === deviceId) {
          return true;
        }
        return false;
      });
    },

    /**
     * Valida los datos de un rating
     */
    validateRatingData: (data: DishRatingCreate): { isValid: boolean; errors: string[] } => {
      const errors: string[] = [];
      
      if (!data.rating || data.rating < 1 || data.rating > 5) {
        errors.push('La valoración debe estar entre 1 y 5');
      }
      
      if (data.comment && data.comment.length > 500) {
        errors.push('El comentario no puede exceder 500 caracteres');
      }
      
      return {
        isValid: errors.length === 0,
        errors
      };
    },

    /**
     * Valida los datos de un comentario
     */
    validateCommentData: (data: DishCommentCreate): { isValid: boolean; errors: string[] } => {
      const errors: string[] = [];
      
      if (!data.comment || data.comment.trim().length < 3) {
        errors.push('El comentario debe tener al menos 3 caracteres');
      }
      
      if (data.comment && data.comment.length > 500) {
        errors.push('El comentario no puede exceder 500 caracteres');
      }
      
      if (data.rating && (data.rating < 1 || data.rating > 5)) {
        errors.push('La valoración debe estar entre 1 y 5');
      }
      
      return {
        isValid: errors.length === 0,
        errors
      };
    }
  };
}

// Exportar una instancia única del servicio
export const dishRatingService = new DishRatingService();
export default dishRatingService;