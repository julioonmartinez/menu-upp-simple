import type { Dish, DishOption } from '../interfaces/dish.ts';

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

// ✅ Enum para campos de ordenamiento (actualizado con position)
export type DishSortField = 'name' | 'price' | 'rating' | 'favorites' | 'reviewsCount' | 'position';

// ✅ Array para usar en selects/dropdowns (actualizado con position)
export const DISH_SORT_FIELDS: { value: DishSortField; label: string }[] = [
  { value: 'name', label: 'Nombre' },
  { value: 'price', label: 'Precio' },
  { value: 'rating', label: 'Valoración' },
  { value: 'favorites', label: 'Favoritos' },
  { value: 'reviewsCount', label: 'N° de reseñas' },
  { value: 'position', label: 'Posición personalizada' }
];

// ✅ Helper para validar campos de ordenamiento
export function isValidSortField(field: string): field is DishSortField {
  return DISH_SORT_FIELDS.some(option => option.value === field);
}

// ✅ Nuevas interfaces para posicionamiento
export interface DishPositionUpdate {
  dish_id: string;
  new_position: number;
}

export interface DishPositionBulkUpdate {
  positions: DishPositionUpdate[];
}

export interface DishPositionInfo {
  dish_id: string;
  name: string;
  current_position?: number;
  category_id: string;
  restaurant_id: string;
}

export interface PositionUpdateResponse {
  message: string;
  dish_id: string;
  new_position?: number;
  position?: number | null;
}

export interface BulkPositionUpdateResponse {
  message: string;
  updated_count: number;
}

export interface ResetPositionsResponse {
  message: string;
  modified_count: number;
}

// ✅ Interfaces para el servicio de dishes (actualizadas con position)
export interface DishCreateRequest {
  name: string;
  description: string;
  price: number;
  categoryId: string;
  restaurantId?: string;
  position?: number; // ✅ Nuevo campo de posición
  image?: string;
  inStock?: boolean;
  options?: DishOption[];
  discount?: number;
  nutritionalInfo?: {
    calories?: number;
    protein?: number;
    carbs?: number;
    fat?: number;
    allergens?: string[];
  };
}

export interface DishUpdateRequest {
  name?: string;
  description?: string;
  price?: number;
  categoryId?: string;
  position?: number; // ✅ Nuevo campo de posición
  image?: string;
  inStock?: boolean;
  options?: DishOption[];
  discount?: number;
  nutritionalInfo?: {
    calories?: number;
    protein?: number;
    carbs?: number;
    fat?: number;
    allergens?: string[];
  };
}

export interface DishWithImagesRequest extends Omit<DishCreateRequest, 'image'> {
  image?: File;
}

export interface DishSearchFilters {
  search?: string;
  restaurantId?: string;
  categoryId?: string;
  minRating?: number;
  maxRating?: number;
  sortBy?: DishSortField;
  sortOrder?: 1 | -1;
}

export interface DishPaginationParams {
  limit?: number;
  page?: number;
  sort_by?: DishSortField;
  sort_order?: 1 | -1;
  search?: string;
}

export interface DishPaginationResponse {
  dishes: Dish[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    total_pages: number;
    has_next: boolean;
    has_prev: boolean;
  };
}

export interface RatingRequest {
  rating: number;
  comment?: string;
}

export interface RatingResponse {
  id: string;
  dishId: string;
  rating: number;
  comment?: string;
  anonymous: boolean;
  timestamp: string;
  message: string;
}

export interface CommentCreateRequest {
  comment: string;
  rating?: number;
}

export interface DishStatsResponse {
  averageRating: number;
  totalRatings: number;
  totalComments: number;
  registeredRatings: number;
  anonymousRatings: number;
  ratingDistribution: { [key: string]: number };
}

export interface ImageUploadResponse {
  id: string;
  name: string;
  description?: string;
  image?: string;
  image_data?: {
    url: string;
    public_id?: string;
    width?: number;
    height?: number;
    format?: string;
  };
  [key: string]: any;
}

export type DishResponse = Dish;
export type FavoriteToggleResponse = {
  id: string;
  favorites: number;
  userFav: boolean;
  message: string;
};

const API_BASE_URL = import.meta.env.PUBLIC_API_URL || 'http://localhost:8000';

/**
 * Servicio para manejar todas las operaciones CRUD de platillos
 */
class DishService {

  // ===== MÉTODOS EXISTENTES (sin cambios) =====

  /**
   * Obtiene todos los platillos con filtros y paginación
   */
  async getAllDishes(params: DishPaginationParams = {}): Promise<ApiResult<DishPaginationResponse>> {
    try {
      const searchParams = new URLSearchParams();
      
      if (params.limit) searchParams.append('limit', params.limit.toString());
      if (params.page) searchParams.append('page', params.page.toString());
      if (params.sort_by) searchParams.append('sort_by', params.sort_by);
      if (params.sort_order) searchParams.append('sort_order', params.sort_order.toString());
      if (params.search) searchParams.append('search', params.search);

      const response = await fetch(
        `${API_BASE_URL}/dishes/?${searchParams}`,
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
          error: errorData.detail || 'Error obteniendo platillos'
        };
      }

      const data: DishPaginationResponse = await response.json();
      return {
        success: true,
        data
      };
    } catch (error) {
      console.error('Error obteniendo platillos:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido obteniendo platillos'
      };
    }
  }

  /**
   * Obtiene platillos filtrados por categoría y/o restaurante
   */
  async getDishesByFilters(
    categoryId?: string,
    restaurantId?: string,
    params: DishPaginationParams = {}
  ): Promise<ApiResult<DishPaginationResponse>> {
    try {
      const searchParams = new URLSearchParams();
      
      if (categoryId) searchParams.append('category_id', categoryId);
      if (restaurantId) searchParams.append('restaurant_id', restaurantId);
      if (params.limit) searchParams.append('limit', params.limit.toString());
      if (params.page) searchParams.append('page', params.page.toString());
      if (params.sort_by) searchParams.append('sort_by', params.sort_by);
      if (params.sort_order) searchParams.append('sort_order', params.sort_order.toString());
      if (params.search) searchParams.append('search', params.search);

      const response = await fetch(
        `${API_BASE_URL}/dishes/?${searchParams}`,
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
          error: errorData.detail || 'Error obteniendo platillos'
        };
      }

      const data: DishPaginationResponse = await response.json();
      return {
        success: true,
        data
      };
    } catch (error) {
      console.error('Error obteniendo platillos filtrados:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido obteniendo platillos'
      };
    }
  }

  /**
   * Obtiene un platillo específico por ID
   */
  async getDish(dishId: string): Promise<ApiResult<Dish>> {
    try {
      const response = await fetch(
        `${API_BASE_URL}/dishes/${dishId}`,
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
          error: errorData.detail || 'Error obteniendo platillo'
        };
      }

      const data: Dish = await response.json();
      return {
        success: true,
        data
      };
    } catch (error) {
      console.error('Error obteniendo platillo:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido obteniendo platillo'
      };
    }
  }

  /**
   * Obtiene platillos por username del restaurante
   */
  async getDishesByRestaurantUsername(
    username: string,
    params: DishPaginationParams = {}
  ): Promise<ApiResult<DishPaginationResponse>> {
    try {
      const searchParams = new URLSearchParams();
      
      if (params.limit) searchParams.append('limit', params.limit.toString());
      if (params.page) searchParams.append('page', params.page.toString());
      if (params.sort_by) searchParams.append('sort_by', params.sort_by);
      if (params.sort_order) searchParams.append('sort_order', params.sort_order.toString());
      if (params.search) searchParams.append('search', params.search);

      const response = await fetch(
        `${API_BASE_URL}/dishes/restaurant-username/${username}?${searchParams}`,
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
          error: errorData.detail || 'Error obteniendo platillos del restaurante'
        };
      }

      const data: DishPaginationResponse = await response.json();
      return {
        success: true,
        data
      };
    } catch (error) {
      console.error('Error obteniendo platillos por username:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido obteniendo platillos'
      };
    }
  }

  /**
   * Obtiene platillos por username del restaurante y categoría
   */
  async getDishesByRestaurantUsernameAndCategory(
    username: string,
    categoryId: string,
    params: DishPaginationParams = {}
  ): Promise<ApiResult<DishPaginationResponse>> {
    try {
      const searchParams = new URLSearchParams();
      
      if (params.limit) searchParams.append('limit', params.limit.toString());
      if (params.page) searchParams.append('page', params.page.toString());
      if (params.sort_by) searchParams.append('sort_by', params.sort_by);
      if (params.sort_order) searchParams.append('sort_order', params.sort_order.toString());
      if (params.search) searchParams.append('search', params.search);

      const response = await fetch(
        `${API_BASE_URL}/dishes/restaurant-username/${username}/category/${categoryId}?${searchParams}`,
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
          error: errorData.detail || 'Error obteniendo platillos de la categoría'
        };
      }

      const data: DishPaginationResponse = await response.json();
      return {
        success: true,
        data
      };
    } catch (error) {
      console.error('Error obteniendo platillos por username y categoría:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido obteniendo platillos'
      };
    }
  }

  /**
   * Crea un nuevo platillo (requiere autenticación)
   */
  async createDish(dishData: DishCreateRequest, image?: File): Promise<ApiResult<DishResponse>> {
    try {
      const isAuthenticated = await this.checkAuthentication();
      
      if (!isAuthenticated) {
        return {
          success: false,
          error: 'Debes estar autenticado para crear platillos'
        };
      }

      // Validar datos mínimos
      const validation = this.validateDishData(dishData);
      if (!validation.isValid) {
        return {
          success: false,
          error: `Datos inválidos: ${validation.errors.join(', ')}`
        };
      }

      // Crear FormData
      const formData = new FormData();
      formData.append('dish_data', JSON.stringify(dishData));

      // Agregar imagen si existe
      if (image) {
        formData.append('image', image);
      }

      const response = await this.makeAuthenticatedRequest('/dishes/', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        const errorData: ApiError = await response.json();
        return {
          success: false,
          error: errorData.detail || 'Error creando platillo'
        };
      }

      const data: DishResponse = await response.json();
      return {
        success: true,
        data
      };
    } catch (error) {
      console.error('Error creando platillo:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido creando platillo'
      };
    }
  }

  /**
   * Actualiza un platillo existente (requiere autenticación)
   */
  async updateDish(
    dishId: string,
    dishData: DishUpdateRequest,
    image?: File
  ): Promise<ApiResult<DishResponse>> {
    try {
      const isAuthenticated = await this.checkAuthentication();
      
      if (!isAuthenticated) {
        return {
          success: false,
          error: 'Debes estar autenticado para actualizar platillos'
        };
      }

      // Crear FormData
      const formData = new FormData();
      formData.append('dish_data', JSON.stringify(dishData));

      // Agregar imagen si existe
      if (image) {
        formData.append('image', image);
      }

      const response = await this.makeAuthenticatedRequest(`/dishes/${dishId}`, {
        method: 'PUT',
        body: formData
      });

      if (!response.ok) {
        const errorData: ApiError = await response.json();
        return {
          success: false,
          error: errorData.detail || 'Error actualizando platillo'
        };
      }

      const data: DishResponse = await response.json();
      return {
        success: true,
        data
      };
    } catch (error) {
      console.error('Error actualizando platillo:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido actualizando platillo'
      };
    }
  }

  /**
   * Elimina un platillo (requiere autenticación)
   */
  async deleteDish(dishId: string): Promise<ApiResult<{ message: string }>> {
    try {
      const isAuthenticated = await this.checkAuthentication();
      
      if (!isAuthenticated) {
        return {
          success: false,
          error: 'Debes estar autenticado para eliminar platillos'
        };
      }

      const response = await this.makeAuthenticatedRequest(`/dishes/${dishId}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        const errorData: ApiError = await response.json();
        return {
          success: false,
          error: errorData.detail || 'Error eliminando platillo'
        };
      }

      const data = await response.json();
      return {
        success: true,
        data
      };
    } catch (error) {
      console.error('Error eliminando platillo:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido eliminando platillo'
      };
    }
  }

  /**
   * Valora un platillo
   */
  async rateDish(dishId: string, ratingData: RatingRequest): Promise<ApiResult<RatingResponse>> {
    try {
      const response = await fetch(
        `${API_BASE_URL}/dishes/${dishId}/rate`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(ratingData)
        }
      );

      if (!response.ok) {
        const errorData: ApiError = await response.json();
        return {
          success: false,
          error: errorData.detail || 'Error valorando platillo'
        };
      }

      const data: RatingResponse = await response.json();
      return {
        success: true,
        data
      };
    } catch (error) {
      console.error('Error valorando platillo:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido valorando platillo'
      };
    }
  }

  /**
   * Alterna el estado de favorito de un platillo (requiere autenticación)
   */
  async toggleFavorite(dishId: string): Promise<ApiResult<FavoriteToggleResponse>> {
    try {
      const isAuthenticated = await this.checkAuthentication();
      
      if (!isAuthenticated) {
        return {
          success: false,
          error: 'Debes estar autenticado para marcar favoritos'
        };
      }

      const response = await this.makeAuthenticatedRequest(`/dishes/${dishId}/favorite`, {
        method: 'POST'
      });

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
   * Sube una imagen para un platillo (requiere autenticación)
   */
  async uploadDishImage(dishId: string, imageFile: File): Promise<ApiResult<ImageUploadResponse>> {
    try {
      const isAuthenticated = await this.checkAuthentication();
      
      if (!isAuthenticated) {
        return {
          success: false,
          error: 'Debes estar autenticado para subir imágenes'
        };
      }

      const formData = new FormData();
      formData.append('file', imageFile);

      const response = await this.makeAuthenticatedRequest(
        `/dishes/${dishId}/image`,
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
      console.error('Error subiendo imagen:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido subiendo imagen'
      };
    }
  }

  /**
   * Obtiene platillos mejor valorados
   */
  async getTopRatedDishes(
    limit: number = 10,
    minRatings: number = 3,
    restaurantId?: string,
    categoryId?: string
  ): Promise<ApiResult<Dish[]>> {
    try {
      const searchParams = new URLSearchParams();
      
      searchParams.append('limit', limit.toString());
      searchParams.append('min_ratings', minRatings.toString());
      if (restaurantId) searchParams.append('restaurant_id', restaurantId);
      if (categoryId) searchParams.append('category_id', categoryId);

      const response = await fetch(
        `${API_BASE_URL}/dishes/top-rated?${searchParams}`,
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
          error: errorData.detail || 'Error obteniendo platillos mejor valorados'
        };
      }

      const data: Dish[] = await response.json();
      return {
        success: true,
        data
      };
    } catch (error) {
      console.error('Error obteniendo platillos mejor valorados:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido obteniendo platillos'
      };
    }
  }

  /**
   * Obtiene platillos más comentados
   */
  async getMostCommentedDishes(
    limit: number = 10,
    minComments: number = 2,
    restaurantId?: string
  ): Promise<ApiResult<Dish[]>> {
    try {
      const searchParams = new URLSearchParams();
      
      searchParams.append('limit', limit.toString());
      searchParams.append('min_comments', minComments.toString());
      if (restaurantId) searchParams.append('restaurant_id', restaurantId);

      const response = await fetch(
        `${API_BASE_URL}/dishes/most-commented?${searchParams}`,
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

      const data: Dish[] = await response.json();
      return {
        success: true,
        data
      };
    } catch (error) {
      console.error('Error obteniendo platillos más comentados:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido obteniendo platillos'
      };
    }
  }

  /**
   * Búsqueda avanzada de platillos
   */
  async searchDishesAdvanced(
    filters: DishSearchFilters,
    limit: number = 20,
    page: number = 1
  ): Promise<ApiResult<DishPaginationResponse>> {
    try {
      const searchParams = new URLSearchParams();
      searchParams.append('limit', limit.toString());
      searchParams.append('page', page.toString());

      const response = await fetch(
        `${API_BASE_URL}/dishes/search-advanced?${searchParams}`,
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
          error: errorData.detail || 'Error en búsqueda avanzada'
        };
      }

      const data: DishPaginationResponse = await response.json();
      return {
        success: true,
        data
      };
    } catch (error) {
      console.error('Error en búsqueda avanzada:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido en búsqueda'
      };
    }
  }

  /**
   * Obtiene estadísticas de un platillo
   */
  async getDishStats(dishId: string): Promise<ApiResult<DishStatsResponse>> {
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

      const data: DishStatsResponse = await response.json();
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

  // ===== NUEVOS MÉTODOS DE POSICIONAMIENTO =====

  /**
   * Actualiza la posición de un platillo específico (requiere autenticación)
   */
  async updateDishPosition(
    dishId: string,
    newPosition: number
  ): Promise<ApiResult<PositionUpdateResponse>> {
    try {
      const isAuthenticated = await this.checkAuthentication();
      
      if (!isAuthenticated) {
        return {
          success: false,
          error: 'Debes estar autenticado para cambiar posiciones'
        };
      }

      const positionData: DishPositionUpdate = {
        dish_id: dishId,
        new_position: newPosition
      };

      const response = await this.makeAuthenticatedRequest(`/dishes/${dishId}/position`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(positionData)
      });

      if (!response.ok) {
        const errorData: ApiError = await response.json();
        return {
          success: false,
          error: errorData.detail || 'Error actualizando posición'
        };
      }

      const data: PositionUpdateResponse = await response.json();
      return {
        success: true,
        data
      };
    } catch (error) {
      console.error('Error actualizando posición:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido actualizando posición'
      };
    }
  }

  /**
   * Actualiza múltiples posiciones de platillos (requiere autenticación)
   */
  async updateDishPositionsBulk(
    positions: DishPositionUpdate[]
  ): Promise<ApiResult<BulkPositionUpdateResponse>> {
    try {
      const isAuthenticated = await this.checkAuthentication();
      
      if (!isAuthenticated) {
        return {
          success: false,
          error: 'Debes estar autenticado para cambiar posiciones'
        };
      }

      const bulkData: DishPositionBulkUpdate = { positions };

      const response = await this.makeAuthenticatedRequest('/dishes/positions/bulk', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(bulkData)
      });

      if (!response.ok) {
        const errorData: ApiError = await response.json();
        return {
          success: false,
          error: errorData.detail || 'Error actualizando posiciones'
        };
      }

      const data: BulkPositionUpdateResponse = await response.json();
      return {
        success: true,
        data
      };
    } catch (error) {
      console.error('Error actualizando posiciones en lote:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido actualizando posiciones'
      };
    }
  }

  /**
   * Obtiene platillos con información de posiciones
   */
  async getDishesWithPositions(
    categoryId?: string,
    restaurantId?: string,
    includeUnpositioned: boolean = true
  ): Promise<ApiResult<Dish[]>> {
    try {
      const searchParams = new URLSearchParams();
      
      if (categoryId) searchParams.append('category_id', categoryId);
      if (restaurantId) searchParams.append('restaurant_id', restaurantId);
      searchParams.append('include_unpositioned', includeUnpositioned.toString());

      const response = await fetch(
        `${API_BASE_URL}/dishes/positions?${searchParams}`,
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
          error: errorData.detail || 'Error obteniendo platillos con posiciones'
        };
      }

      const data: Dish[] = await response.json();
      return {
        success: true,
        data
      };
    } catch (error) {
      console.error('Error obteniendo platillos con posiciones:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido obteniendo platillos'
      };
    }
  }

  /**
   * Resetea las posiciones de los platillos (requiere autenticación)
   */
  async resetDishPositions(
    categoryId?: string,
    restaurantId?: string
  ): Promise<ApiResult<ResetPositionsResponse>> {
    try {
      const isAuthenticated = await this.checkAuthentication();
      
      if (!isAuthenticated) {
        return {
          success: false,
          error: 'Debes estar autenticado para resetear posiciones'
        };
      }

      const searchParams = new URLSearchParams();
      if (categoryId) searchParams.append('category_id', categoryId);
      if (restaurantId) searchParams.append('restaurant_id', restaurantId);

      const response = await this.makeAuthenticatedRequest(
        `/dishes/positions/reset?${searchParams}`,
        {
          method: 'DELETE'
        }
      );

      if (!response.ok) {
        const errorData: ApiError = await response.json();
        return {
          success: false,
          error: errorData.detail || 'Error reseteando posiciones'
        };
      }

      const data: ResetPositionsResponse = await response.json();
      return {
        success: true,
        data
      };
    } catch (error) {
      console.error('Error reseteando posiciones:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido reseteando posiciones'
      };
    }
  }

  /**
   * Obtiene platillos ordenados por posición (método de conveniencia)
   */
  async getDishesOrderedByPosition(
    categoryId?: string,
    restaurantId?: string,
    params: DishPaginationParams = {}
  ): Promise<ApiResult<DishPaginationResponse>> {
    // Usar el método existente con ordenamiento por posición
    return this.getDishesByFilters(categoryId, restaurantId, {
      ...params,
      sort_by: 'position',
      sort_order: 1
    });
  }

  // ===== MÉTODOS PRIVADOS (sin cambios) =====

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
   * Valida los datos del platillo (actualizado con position)
   */
  private validateDishData(data: DishCreateRequest): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    // Validar nombre (requerido)
    if (!data.name || data.name.trim().length === 0) {
      errors.push('El nombre del platillo es requerido');
    } else if (data.name.trim().length < 2) {
      errors.push('El nombre debe tener al menos 2 caracteres');
    } else if (data.name.trim().length > 200) {
      errors.push('El nombre no puede exceder 200 caracteres');
    }
    
    // Validar descripción (opcional)
    if (data.description && data.description.trim().length > 0) {
      if (data.description.trim().length < 10) {
        errors.push('La descripción debe tener al menos 10 caracteres');
      } else if (data.description.trim().length > 1000) {
        errors.push('La descripción no puede exceder 1000 caracteres');
      }
    }
    
    // Validar precio (requerido)
    if (data.price === undefined || data.price === null) {
      errors.push('El precio del platillo es requerido');
    } else if (data.price < 0) {
      errors.push('El precio debe ser mayor o igual a 0');
    } else if (data.price > 10000) {
      errors.push('El precio no puede exceder $10,000');
    }
    
    // Validar categoría (requerida)
    if (!data.categoryId || data.categoryId.trim().length === 0) {
      errors.push('La categoría del platillo es requerida');
    }
    
    // ✅ Validar posición (opcional)
    if (data.position !== undefined && data.position !== null) {
      if (data.position < 0) {
        errors.push('La posición debe ser mayor o igual a 0');
      }
    }
    
    // Validar descuento (opcional)
    if (data.discount !== undefined && data.discount !== null) {
      if (data.discount < 0 || data.discount > 100) {
        errors.push('El descuento debe estar entre 0 y 100%');
      }
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Utilidades para trabajar con platillos (actualizadas con position)
   */
  utils = {
    /**
     * Formatea el precio del platillo
     */
    formatPrice: (price: number): string => {
      return new Intl.NumberFormat('es-MX', {
        style: 'currency',
        currency: 'MXN'
      }).format(price);
    },

    /**
     * Calcula el precio con descuento
     */
    calculateDiscountedPrice: (price: number, discount?: number): number => {
      if (!discount || discount <= 0) return price;
      return price * (1 - discount / 100);
    },

    /**
     * Genera estrellas de rating
     */
    generateStars: (rating: number): string => {
      const fullStars = Math.floor(rating);
      const hasHalfStar = rating % 1 >= 0.5;
      const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);
      
      return '★'.repeat(fullStars) + 
             (hasHalfStar ? '☆' : '') + 
             '☆'.repeat(emptyStars);
    },

    /**
     * Verifica si un platillo está en stock
     */
    isInStock: (dish: Dish): boolean => {
      return dish.inStock !== false; // Por defecto true si no está especificado
    },

    /**
     * Obtiene el texto de disponibilidad
     */
    getAvailabilityText: (dish: Dish): string => {
      return this.utils.isInStock(dish) ? 'Disponible' : 'No disponible';
    },

    /**
     * Calcula el total con opciones seleccionadas
     */
    calculateTotalWithOptions: (dish: Dish): number => {
      let total = dish.price;
      
      if (dish.options) {
        total += dish.options
          .filter(option => option.selected)
          .reduce((sum, option) => sum + option.price, 0);
      }
      
      if (dish.discount && dish.discount > 0) {
        total = this.utils.calculateDiscountedPrice(total, dish.discount);
      }
      
      return total;
    },

    /**
     * Valida el tamaño de imagen
     */
    validateImageSize: (file: File, maxSizeMB: number = 5): { isValid: boolean; error?: string } => {
      const maxSizeBytes = maxSizeMB * 1024 * 1024;
      
      if (file.size > maxSizeBytes) {
        return {
          isValid: false,
          error: `El archivo debe ser menor a ${maxSizeMB}MB`
        };
      }
      
      return { isValid: true };
    },

    /**
     * Valida el tipo de imagen
     */
    validateImageType: (file: File): { isValid: boolean; error?: string } => {
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
      
      if (!allowedTypes.includes(file.type)) {
        return {
          isValid: false,
          error: 'Solo se permiten archivos JPG, PNG o WEBP'
        };
      }
      
      return { isValid: true };
    },

    /**
     * Trunca texto con puntos suspensivos
     */
    truncateText: (text: string, maxLength: number): string => {
      if (text.length <= maxLength) return text;
      return text.substring(0, maxLength).trim() + '...';
    },

    // ✅ Nuevas utilidades para posicionamiento
    /**
     * Obtiene el texto de posición del platillo
     */
    getPositionText: (dish: Dish): string => {
      if (dish.position === undefined || dish.position === null) {
        return 'Sin posición asignada';
      }
      return `Posición ${dish.position}`;
    },

    /**
     * Verifica si un platillo tiene posición asignada
     */
    hasPosition: (dish: Dish): boolean => {
      return dish.position !== undefined && dish.position !== null && dish.position > 0;
    },

    /**
     * Obtiene la clase CSS para indicar posición
     */
    getPositionClass: (dish: Dish): string => {
      if (!this.utils.hasPosition(dish)) {
        return 'no-position';
      }
      if (dish.position === 1) {
        return 'position-first';
      }
      if (dish.position <= 3) {
        return 'position-top';
      }
      return 'position-normal';
    },

    /**
     * Formatea la posición para mostrar
     */
    formatPosition: (position: number): string => {
      if (position === 1) return '1er lugar';
      if (position === 2) return '2do lugar';
      if (position === 3) return '3er lugar';
      return `${position}° lugar`;
    }
  };
}

// Exportar una instancia única del servicio
export const dishService = new DishService();
export default dishService; 