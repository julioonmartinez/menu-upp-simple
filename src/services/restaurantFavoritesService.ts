// src/services/restaurantFavoritesService.ts

import type { Restaurant } from '../interfaces/restaurant.ts';

// Types
// export interface Restaurant {
//   id: string;
//   name: string;
//   description?: string;
//   address?: string;
//   phone?: string;
//   email?: string;
//   website?: string;
//   cuisine?: string;
//   priceRange?: string;
//   image?: string;
//   active?: boolean;
//   ownerId?: string;
//   analytics?: {
//     favoritesCount?: number;
//     averageRating?: number;
//     reviewCount?: number;
//   };
//   createdAt?: string;
//   updatedAt?: string;
//   // Campos específicos de favoritos
//   userFav?: boolean;
//   favoriteId?: string;
//   favoritedAt?: string;
//   position?: number; // Para restaurantes populares
// }

export interface FavoritesResponse {
  restaurants: Restaurant[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    total_pages: number;
    has_next: boolean;
    has_prev: boolean;
  };
  total_favorites: number;
}

export interface FavoriteToggleResponse {
  id: string;
  name: string;
  favoritesCount: number;
  userFav: boolean;
  message: string;
  action: 'added' | 'removed';
}

export interface FavoriteCheckResponse {
  restaurantId: string;
  isFavorite: boolean;
  userId: string;
}

export interface FavoritesCountResponse {
  userId: string;
  totalFavoriteRestaurants: number;
}

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

const API_BASE_URL = import.meta.env.PUBLIC_API_URL || 'http://localhost:8000';

/**
 * Servicio para manejar todas las operaciones de favoritos de restaurantes
 */
class RestaurantFavoritesService {
  
  /**
   * Obtiene todos los restaurantes favoritos del usuario autenticado
   */
  async getUserFavorites(
    limit: number = 20, 
    page: number = 1
  ): Promise<ApiResult<FavoritesResponse>> {
    try {
      const params = new URLSearchParams({
        limit: limit.toString(),
        page: page.toString()
      });

      const response = await this.makeAuthenticatedRequest(
        `/restaurant-favorites/?${params}`
      );

      if (!response.ok) {
        const errorData: ApiError = await response.json();
        return {
          success: false,
          error: errorData.detail || 'Error obteniendo favoritos'
        };
      }

      const data: FavoritesResponse = await response.json();
      return {
        success: true,
        data
      };
    } catch (error) {
      console.error('Error obteniendo favoritos:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido obteniendo favoritos'
      };
    }
  }

  /**
   * Alterna el estado de favorito de un restaurante
   */
  async toggleFavorite(restaurantId: string): Promise<ApiResult<FavoriteToggleResponse>> {
    try {
      const response = await this.makeAuthenticatedRequest(
        `/restaurant-favorites/restaurant/${restaurantId}`,
        { method: 'POST' }
      );

      if (!response.ok) {
        const errorData: ApiError = await response.json();
        return {
          success: false,
          error: errorData.detail || 'Error alternando favorito'
        };
      }

      const data: FavoriteToggleResponse = await response.json();
      return {
        success: true,
        data
      };
    } catch (error) {
      console.error('Error alternando favorito:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido alternando favorito'
      };
    }
  }

  /**
   * Añade un restaurante a favoritos
   */
  async addToFavorites(restaurantId: string): Promise<ApiResult<FavoriteToggleResponse>> {
    // En el backend, el POST hace toggle, así que primero verificamos si ya está
    const checkResult = await this.checkIsFavorite(restaurantId);
    if (checkResult.success && checkResult.data?.isFavorite) {
      return {
        success: true,
        data: {
          id: restaurantId,
          name: '',
          favoritesCount: 0,
          userFav: true,
          message: 'Restaurante ya estaba en favoritos',
          action: 'added'
        }
      };
    }

    return this.toggleFavorite(restaurantId);
  }

  /**
   * Quita un restaurante de favoritos
   */
  async removeFromFavorites(restaurantId: string): Promise<ApiResult<FavoriteToggleResponse>> {
    try {
      const response = await this.makeAuthenticatedRequest(
        `/restaurant-favorites/restaurant/${restaurantId}`,
        { method: 'DELETE' }
      );

      if (!response.ok) {
        const errorData: ApiError = await response.json();
        return {
          success: false,
          error: errorData.detail || 'Error quitando de favoritos'
        };
      }

      const data: FavoriteToggleResponse = await response.json();
      return {
        success: true,
        data
      };
    } catch (error) {
      console.error('Error quitando de favoritos:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido quitando de favoritos'
      };
    }
  }

  /**
   * Verifica si un restaurante está en favoritos
   */
  async checkIsFavorite(restaurantId: string): Promise<ApiResult<FavoriteCheckResponse>> {
    try {
      const response = await this.makeAuthenticatedRequest(
        `/restaurant-favorites/check/${restaurantId}`
      );

      if (!response.ok) {
        const errorData: ApiError = await response.json();
        return {
          success: false,
          error: errorData.detail || 'Error verificando favorito'
        };
      }

      const data: FavoriteCheckResponse = await response.json();
      return {
        success: true,
        data
      };
    } catch (error) {
      console.error('Error verificando favorito:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido verificando favorito'
      };
    }
  }

  /**
   * Obtiene el número total de favoritos del usuario
   */
  async getFavoritesCount(): Promise<ApiResult<FavoritesCountResponse>> {
    try {
      const response = await this.makeAuthenticatedRequest(
        '/restaurant-favorites/count'
      );

      if (!response.ok) {
        const errorData: ApiError = await response.json();
        return {
          success: false,
          error: errorData.detail || 'Error obteniendo contador de favoritos'
        };
      }

      const data: FavoritesCountResponse = await response.json();
      return {
        success: true,
        data
      };
    } catch (error) {
      console.error('Error obteniendo contador de favoritos:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido obteniendo contador'
      };
    }
  }

  /**
   * Obtiene los restaurantes más populares por favoritos
   */
  async getPopularRestaurants(limit: number = 10): Promise<ApiResult<Restaurant[]>> {
    try {
      const params = new URLSearchParams({
        limit: limit.toString()
      });

      // Este endpoint no requiere autenticación
      const response = await fetch(
        `${API_BASE_URL}/restaurant-favorites/popular?${params}`,
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
          error: errorData.detail || 'Error obteniendo restaurantes populares'
        };
      }

      const data: Restaurant[] = await response.json();
      return {
        success: true,
        data
      };
    } catch (error) {
      console.error('Error obteniendo restaurantes populares:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido obteniendo populares'
      };
    }
  }

  /**
   * Verifica múltiples restaurantes si están en favoritos
   */
  async checkMultipleFavorites(restaurantIds: string[]): Promise<ApiResult<Record<string, boolean>>> {
    try {
      const checks = await Promise.allSettled(
        restaurantIds.map(id => this.checkIsFavorite(id))
      );

      const result: Record<string, boolean> = {};
      
      checks.forEach((check, index) => {
        if (check.status === 'fulfilled' && check.value.success) {
          result[restaurantIds[index]] = check.value.data!.isFavorite;
        } else {
          result[restaurantIds[index]] = false;
        }
      });

      return {
        success: true,
        data: result
      };
    } catch (error) {
      console.error('Error verificando múltiples favoritos:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error verificando favoritos'
      };
    }
  }

  /**
   * Obtiene todos los favoritos (sin paginación) para uso interno
   */
  async getAllUserFavorites(): Promise<ApiResult<Restaurant[]>> {
    const allFavorites: Restaurant[] = [];
    let page = 1;
    let hasNext = true;

    try {
      while (hasNext) {
        const result = await this.getUserFavorites(100, page);
        
        if (!result.success) {
          return {
            success: false,
            error: result.error
          };
        }

        if (result.data) {
          allFavorites.push(...result.data.restaurants);
          hasNext = result.data.pagination.has_next;
          page++;
        } else {
          hasNext = false;
        }
      }

      return {
        success: true,
        data: allFavorites
      };
    } catch (error) {
      console.error('Error obteniendo todos los favoritos:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error obteniendo todos los favoritos'
      };
    }
  }

  /**
   * Realiza una petición autenticada usando el authService
   */
  private async makeAuthenticatedRequest(
    endpoint: string, 
    options: RequestInit = {}
  ): Promise<Response> {
    // Importar authService dinámicamente para evitar dependencias circulares
    const { authService } = await import('./authService.ts');
    return authService.authenticatedFetch(endpoint, options);
  }

  /**
   * Utilidades para trabajar con favoritos
   */
  utils = {
    /**
     * Verifica si un restaurante está en la lista de favoritos
     */
    isRestaurantFavorited: (restaurantId: string, favorites: Restaurant[]): boolean => {
      return favorites.some(fav => fav.id === restaurantId);
    },

    /**
     * Busca un restaurante en la lista de favoritos
     */
    findFavoriteRestaurant: (restaurantId: string, favorites: Restaurant[]): Restaurant | undefined => {
      return favorites.find(fav => fav.id === restaurantId);
    },

    /**
     * Ordena restaurantes por fecha de favorito (más recientes primero)
     */
    sortByFavoritedDate: (restaurants: Restaurant[]): Restaurant[] => {
      return [...restaurants].sort((a, b) => {
        if (!a.createdAt || !b.createdAt) return 0;
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
    },

    /**
     * Filtra restaurantes por criterios
     */
    filterRestaurants: (
      restaurants: Restaurant[], 
      filters: {
        cuisine?: string;
        priceRange?: string;
        search?: string;
      }
    ): Restaurant[] => {
      return restaurants.filter(restaurant => {
        if (
          filters.cuisine &&
          (!restaurant.cuisineType || restaurant.cuisineType.length === 0 || restaurant.cuisineType[0] !== filters.cuisine)
        ) {
          return false;
        }
        
        if (filters.priceRange && restaurant.priceRange !== filters.priceRange) {
          return false;
        }
        
        if (filters.search) {
          const searchTerm = filters.search.toLowerCase();
          return restaurant.name?.toLowerCase().includes(searchTerm) ||
                 restaurant.description?.toLowerCase().includes(searchTerm) ||
                 restaurant.cuisineType?.[0]?.toLowerCase().includes(searchTerm);
        }
        
        return true;
      });
    }
  };
}

// Exportar una instancia única del servicio
export const restaurantFavoritesService = new RestaurantFavoritesService();
export default restaurantFavoritesService;