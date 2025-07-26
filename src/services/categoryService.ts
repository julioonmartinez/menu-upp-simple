// src/services/categoryService.ts

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

// ✅ Interfaces para categorías
export interface Category {
  id?: string;
  name: string;
  description?: string;
  restaurantId?: string;
  order?: number;
}

export interface CategoryCreateRequest {
  name: string;
  description?: string;
  restaurantId?: string;
  order?: number;
}

export interface CategoryUpdateRequest {
  name?: string;
  description?: string;
  order?: number;
}

export interface CategoryReorderRequest {
  id: string;
  order: number;
}


export type CategoryResponse = Category;

const API_BASE_URL = import.meta.env.PUBLIC_API_URL || 'http://localhost:8000';

/**
 * Servicio para manejar todas las operaciones CRUD de categorías
 */
class CategoryService {

  /**
   * Obtiene todas las categorías
   */
  async getAllCategories(restaurantId?: string): Promise<ApiResult<Category[]>> {
    try {
      const searchParams = new URLSearchParams();
      
      if (restaurantId) {
        searchParams.append('restaurant_id', restaurantId);
      }

      const response = await fetch(
        `${API_BASE_URL}/categories/?${searchParams}`,
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
          error: errorData.detail || 'Error obteniendo categorías'
        };
      }

      const data: Category[] = await response.json();
      return {
        success: true,
        data
      };
    } catch (error) {
      console.error('Error obteniendo categorías:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido obteniendo categorías'
      };
    }
  }

  /**
   * Obtiene una categoría específica por ID
   */
  async getCategory(categoryId: string): Promise<ApiResult<Category>> {
    try {
      const response = await fetch(
        `${API_BASE_URL}/categories/${categoryId}`,
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
          error: errorData.detail || 'Error obteniendo categoría'
        };
      }

      const data: Category = await response.json();
      return {
        success: true,
        data
      };
    } catch (error) {
      console.error('Error obteniendo categoría:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido obteniendo categoría'
      };
    }
  }

  /**
   * Obtiene categorías por username del restaurante
   */
  async getCategoriesByRestaurantUsername(username: string): Promise<ApiResult<Category[]>> {
    try {
      const response = await fetch(
        `${API_BASE_URL}/categories/restaurant-username/${username}`,
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
          error: errorData.detail || 'Error obteniendo categorías del restaurante'
        };
      }

      const data: Category[] = await response.json();
      return {
        success: true,
        data
      };
    } catch (error) {
      console.error('Error obteniendo categorías por username:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido obteniendo categorías'
      };
    }
  }

  /**
   * Crea una nueva categoría (requiere autenticación)
   */
  async createCategory(categoryData: CategoryCreateRequest): Promise<ApiResult<CategoryResponse>> {
    try {
      const isAuthenticated = await this.checkAuthentication();
      
      if (!isAuthenticated) {
        return {
          success: false,
          error: 'Debes estar autenticado para crear categorías'
        };
      }

      // Validar datos mínimos
      const validation = this.validateCategoryData(categoryData);
      if (!validation.isValid) {
        return {
          success: false,
          error: `Datos inválidos: ${validation.errors.join(', ')}`
        };
      }

      const response = await this.makeAuthenticatedRequest('/categories/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(categoryData)
      });

      if (!response.ok) {
        const errorData: ApiError = await response.json();
        return {
          success: false,
          error: errorData.detail || 'Error creando categoría'
        };
      }

      const data: CategoryResponse = await response.json();
      return {
        success: true,
        data
      };
    } catch (error) {
      console.error('Error creando categoría:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido creando categoría'
      };
    }
  }

  /**
   * Actualiza una categoría existente (requiere autenticación)
   */
  async updateCategory(
    categoryId: string,
    categoryData: CategoryUpdateRequest
  ): Promise<ApiResult<CategoryResponse>> {
    try {
      const isAuthenticated = await this.checkAuthentication();
      
      if (!isAuthenticated) {
        return {
          success: false,
          error: 'Debes estar autenticado para actualizar categorías'
        };
      }

      // Validar que hay al menos un campo para actualizar
      if (!categoryData.name && !categoryData.description) {
        return {
          success: false,
          error: 'Debe proporcionarse al menos un campo para actualizar'
        };
      }

      const response = await this.makeAuthenticatedRequest(`/categories/${categoryId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(categoryData)
      });

      if (!response.ok) {
        const errorData: ApiError = await response.json();
        return {
          success: false,
          error: errorData.detail || 'Error actualizando categoría'
        };
      }

      const data: CategoryResponse = await response.json();
      return {
        success: true,
        data
      };
    } catch (error) {
      console.error('Error actualizando categoría:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido actualizando categoría'
      };
    }
  }

  /**
   * Elimina una categoría (requiere autenticación)
   */
  async deleteCategory(categoryId: string): Promise<ApiResult<{ message: string }>> {
    try {
      const isAuthenticated = await this.checkAuthentication();
      
      if (!isAuthenticated) {
        return {
          success: false,
          error: 'Debes estar autenticado para eliminar categorías'
        };
      }

      const response = await this.makeAuthenticatedRequest(`/categories/${categoryId}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        const errorData: ApiError = await response.json();
        return {
          success: false,
          error: errorData.detail || 'Error eliminando categoría'
        };
      }

      const data = await response.json();
      return {
        success: true,
        data
      };
    } catch (error) {
      console.error('Error eliminando categoría:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido eliminando categoría'
      };
    }
  }

  /**
   * Reordena una categoría específica (requiere autenticación)
   */
  async reorderCategory(
    categoryId: string, 
    newOrder: number
  ): Promise<ApiResult<CategoryResponse>> {
    try {
      const isAuthenticated = await this.checkAuthentication();
      
      if (!isAuthenticated) {
        return {
          success: false,
          error: 'Debes estar autenticado para reordenar categorías'
        };
      }

      // Validar que el nuevo orden sea positivo
      if (newOrder < 1) {
        return {
          success: false,
          error: 'El orden debe ser un número positivo'
        };
      }

      const response = await this.makeAuthenticatedRequest(`/categories/${categoryId}/reorder`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ new_order: newOrder })
      });

      if (!response.ok) {
        const errorData: ApiError = await response.json();
        return {
          success: false,
          error: errorData.detail || 'Error reordenando categoría'
        };
      }

      const data: CategoryResponse = await response.json();
      return {
        success: true,
        data
      };
    } catch (error) {
      console.error('Error reordenando categoría:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido reordenando categoría'
      };
    }
  }

  /**
   * Reordena múltiples categorías a la vez (requiere autenticación)
   */
  async reorderMultipleCategories(
    categoryOrders: CategoryReorderRequest[]
  ): Promise<ApiResult<{ message: string; categories: CategoryResponse[] }>> {
    try {
      const isAuthenticated = await this.checkAuthentication();
      
      if (!isAuthenticated) {
        return {
          success: false,
          error: 'Debes estar autenticado para reordenar categorías'
        };
      }

      // Validar que hay al menos una categoría para reordenar
      if (!categoryOrders || categoryOrders.length === 0) {
        return {
          success: false,
          error: 'Se requiere al menos una categoría para reordenar'
        };
      }

      // Validar que todos los elementos tengan id y order
      for (const item of categoryOrders) {
        if (!item.id || item.order === undefined || item.order < 1) {
          return {
            success: false,
            error: 'Cada elemento debe tener un ID válido y un orden positivo'
          };
        }
      }

      const response = await this.makeAuthenticatedRequest('/categories/reorder', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(categoryOrders)
      });

      if (!response.ok) {
        const errorData: ApiError = await response.json();
        return {
          success: false,
          error: errorData.detail || 'Error reordenando categorías'
        };
      }

      const data = await response.json();
      return {
        success: true,
        data
      };
    } catch (error) {
      console.error('Error reordenando categorías:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido reordenando categorías'
      };
    }
  }

  /**
   * Reordena categorías después de drag & drop
   */
  async reorderAfterDragDrop(
    categories: Category[],
    sourceIndex: number,
    destinationIndex: number
  ): Promise<ApiResult<{ message: string; categories: CategoryResponse[] }>> {
    try {
      // Crear una copia del array y mover el elemento
      const reorderedCategories = [...categories];
      const [movedItem] = reorderedCategories.splice(sourceIndex, 1);
      reorderedCategories.splice(destinationIndex, 0, movedItem);

      // Preparar datos para el endpoint de reordenamiento masivo
      const categoryOrders: CategoryReorderRequest[] = reorderedCategories.map((category, index) => ({
        id: category.id!,
        order: index + 1
      }));

      // Llamar al endpoint de reordenamiento masivo
      return await this.reorderMultipleCategories(categoryOrders);
    } catch (error) {
      console.error('Error en reordenamiento después de drag & drop:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido en reordenamiento'
      };
    }
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
   * Valida los datos de la categoría
   */
  private validateCategoryData(data: CategoryCreateRequest): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    // Validar nombre (requerido)
    if (!data.name || data.name.trim().length === 0) {
      errors.push('El nombre de la categoría es requerido');
    } else if (data.name.trim().length < 2) {
      errors.push('El nombre debe tener al menos 2 caracteres');
    } else if (data.name.trim().length > 100) {
      errors.push('El nombre no puede exceder 100 caracteres');
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
   * Utilidades para trabajar con categorías
   */
  utils = {
    /**
     * Formatea el nombre de la categoría
     */
    formatCategoryName: (name: string): string => {
      return name.trim().replace(/\s+/g, ' '); // Normalizar espacios
    },

    /**
     * Genera un ID sugerido basado en el nombre
     */
    generateSuggestedId: (name: string): string => {
      return name
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, '') // Remover caracteres especiales
        .replace(/\s+/g, '_') // Reemplazar espacios con guiones bajos
        .substring(0, 30); // Limitar longitud
    },

    /**
     * Verifica si una categoría está vacía (sin platillos)
     */
    isEmpty: (category: Category, dishCount: number = 0): boolean => {
      return dishCount === 0;
    },

    /**
     * Obtiene el texto de descripción truncado
     */
    getTruncatedDescription: (description?: string, maxLength: number = 50): string => {
      if (!description) return 'Sin descripción';
      
      if (description.length <= maxLength) return description;
      return description.substring(0, maxLength).trim() + '...';
    },

    /**
     * Agrupa categorías por restaurante
     */
    groupByRestaurant: (categories: Category[]): { [restaurantId: string]: Category[] } => {
      return categories.reduce((groups, category) => {
        const restaurantId = category.restaurantId || 'general';
        if (!groups[restaurantId]) {
          groups[restaurantId] = [];
        }
        groups[restaurantId].push(category);
        return groups;
      }, {} as { [restaurantId: string]: Category[] });
    },

    /**
     * Filtra categorías por término de búsqueda
     */
    filterBySearch: (categories: Category[], searchTerm: string): Category[] => {
      if (!searchTerm.trim()) return categories;
      
      const term = searchTerm.toLowerCase().trim();
      return categories.filter(category =>
        category.name.toLowerCase().includes(term) ||
        (category.description && category.description.toLowerCase().includes(term))
      );
    },

    /**
     * Ordena categorías por nombre
     */
    sortByName: (categories: Category[], ascending: boolean = true): Category[] => {
      return [...categories].sort((a, b) => {
        const comparison = a.name.localeCompare(b.name, 'es', { sensitivity: 'base' });
        return ascending ? comparison : -comparison;
      });
    },

    /**
     * Verifica si un nombre de categoría es único en un array
     */
    isNameUnique: (
      categories: Category[], 
      name: string, 
      excludeId?: string,
      restaurantId?: string
    ): boolean => {
      const normalizedName = name.trim().toLowerCase();
      
      return !categories.some(category => {
        if (excludeId && category.id === excludeId) return false;
        if (restaurantId && category.restaurantId !== restaurantId) return false;
        
        return category.name.trim().toLowerCase() === normalizedName;
      });
    },

    /**
     * Genera estadísticas de categorías
     */
    generateStats: (categories: Category[]): {
      total: number;
      byRestaurant: { [restaurantId: string]: number };
      withDescription: number;
      withoutDescription: number;
    } => {
      const stats = {
        total: categories.length,
        byRestaurant: {} as { [restaurantId: string]: number },
        withDescription: 0,
        withoutDescription: 0
      };

      categories.forEach(category => {
        // Contar por restaurante
        const restaurantId = category.restaurantId || 'general';
        stats.byRestaurant[restaurantId] = (stats.byRestaurant[restaurantId] || 0) + 1;

        // Contar con/sin descripción
        if (category.description && category.description.trim()) {
          stats.withDescription++;
        } else {
          stats.withoutDescription++;
        }
      });

      return stats;
    },

    /**
     * Valida si el usuario puede editar una categoría
     */
    canEditCategory: (category: Category, currentUserId?: string, userRole?: string): boolean => {
      if (!currentUserId) return false;
      if (userRole === 'admin') return true;
      
      // Aquí podrías agregar lógica adicional para verificar si el usuario
      // es propietario del restaurante al que pertenece la categoría
      return true; // Por ahora permite la edición si está autenticado
    },

    /**
     * Genera opciones para un select de categorías
     */
    generateSelectOptions: (
      categories: Category[], 
      includeEmpty: boolean = true,
      emptyLabel: string = 'Seleccionar categoría'
    ): Array<{ value: string; label: string }> => {
      const options = categories.map(category => ({
        value: category.id || '',
        label: category.name
      }));

      if (includeEmpty) {
        options.unshift({ value: '', label: emptyLabel });
      }

      return options;
    }
  };
}

// Exportar una instancia única del servicio
export const categoryService = new CategoryService();
export default categoryService;