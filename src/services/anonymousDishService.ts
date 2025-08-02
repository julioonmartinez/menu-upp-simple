// src/services/anonymousDishService.ts

import type {
  ApiResult,
  ApiError,
  AnonymousDish,
  AnonymousDishCreateRequest,
  AnonymousDishUpdateRequest,
  AnonymousDishesResponse
} from '../interfaces/anonymousRestaurant';
import { getDeviceId } from './deviceIdService';

const API_BASE_URL = import.meta.env.PUBLIC_API_URL || 'http://localhost:8000';

/**
 * Servicio para manejar todas las operaciones de platillos anónimos
 * No requiere autenticación, usa device_id para identificar al creador
 */
class AnonymousDishService {
  
  /**
   * Crea un nuevo platillo anónimo
   */
  async createAnonymousDish(
    dishData: AnonymousDishCreateRequest,
    image?: File
  ): Promise<ApiResult<AnonymousDish>> {
    try {
      console.log('🚀 Iniciando createAnonymousDish');
      
      // Obtener device_id
      const deviceId = getDeviceId();
      console.log('📱 Device ID:', deviceId);
      
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
      
      // Preparar datos completos del platillo
      const completeDishData = {
        name: dishData.name,
        description: dishData.description || '',
        price: dishData.price,
        categoryId: dishData.categoryId,
        inStock: dishData.inStock ?? true
      };

      // Agregar datos del platillo
      formData.append('dish_data', JSON.stringify(completeDishData));
      
      // Agregar imagen si se proporciona
      if (image) {
        formData.append('image', image);
      }

      // Debug FormData
      this.debugFormData(formData, 'Create Anonymous Dish');

      // Realizar petición
      const response = await fetch(`${API_BASE_URL}/api/anonymous-dishes/`, {
        method: 'POST',
        headers: {
          'X-Device-ID': deviceId
        },
        body: formData
      });

      console.log('📡 Response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Error response text:', errorText);
        
        let errorData: ApiError;
        try {
          errorData = JSON.parse(errorText);
        } catch (e) {
          errorData = { detail: `HTTP ${response.status}: ${errorText}` };
        }
        
        return {
          success: false,
          error: errorData.detail || 'Error creando platillo anónimo'
        };
      }

      const data: AnonymousDish = await response.json();
      console.log('✅ Platillo anónimo creado exitosamente:', data);
      
      return {
        success: true,
        data
      };
    } catch (error) {
      console.error('💥 Error creando platillo anónimo:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido creando platillo anónimo'
      };
    }
  }

  /**
   * Obtiene todos los platillos anónimos del dispositivo actual
   */
  async getAnonymousDishesByDevice(params?: {
    categoryId?: string;
    limit?: number;
    page?: number;
    search?: string;
  }): Promise<ApiResult<AnonymousDishesResponse>> {
    try {
      const deviceId = getDeviceId();
      console.log('📱 Obteniendo platillos anónimos para device:', deviceId);
      
      // Construir URL con parámetros
      const url = new URL(`${API_BASE_URL}/api/anonymous-dishes/device/${deviceId}`);
      
      if (params?.categoryId) url.searchParams.append('category_id', params.categoryId);
      if (params?.limit) url.searchParams.append('limit', params.limit.toString());
      if (params?.page) url.searchParams.append('page', params.page.toString());
      if (params?.search) url.searchParams.append('search', params.search);
      
      const response = await fetch(url.toString(), {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorData: ApiError = await response.json();
        return {
          success: false,
          error: errorData.detail || 'Error obteniendo platillos anónimos'
        };
      }

      const data: AnonymousDishesResponse = await response.json();
      return {
        success: true,
        data
      };
    } catch (error) {
      console.error('Error obteniendo platillos anónimos:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido obteniendo platillos anónimos'
      };
    }
  }

  /**
   * Obtiene un platillo anónimo por su ID
   */
  async getAnonymousDish(dishId: string): Promise<ApiResult<AnonymousDish>> {
    try {
      console.log('🔍 Obteniendo platillo anónimo con ID:', dishId);
      
      const response = await fetch(`${API_BASE_URL}/api/anonymous-dishes/${dishId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorData: ApiError = await response.json();
        return {
          success: false,
          error: errorData.detail || 'Error obteniendo platillo anónimo'
        };
      }

      const data: AnonymousDish = await response.json();
      return {
        success: true,
        data
      };
    } catch (error) {
      console.error('Error obteniendo platillo anónimo:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido obteniendo platillo anónimo'
      };
    }
  }

  /**
   * Actualiza un platillo anónimo
   */
  async updateAnonymousDish(
    dishId: string,
    dishData: AnonymousDishUpdateRequest,
    image?: File
  ): Promise<ApiResult<AnonymousDish>> {
    try {
      console.log('🔄 Actualizando platillo anónimo con ID:', dishId);
      
      // Obtener device_id
      const deviceId = getDeviceId();
      
      // Validar datos
      const validation = this.validateDishUpdateData(dishData);
      if (!validation.isValid) {
        return {
          success: false,
          error: `Datos inválidos: ${validation.errors.join(', ')}`
        };
      }

      // Crear FormData
      const formData = new FormData();
      formData.append('dish_data', JSON.stringify(dishData));
      
      // Agregar imagen si se proporciona
      if (image) {
        formData.append('image', image);
      }

      const response = await fetch(`${API_BASE_URL}/api/anonymous-dishes/${dishId}`, {
        method: 'PUT',
        headers: {
          'X-Device-ID': deviceId
        },
        body: formData
      });

      if (!response.ok) {
        const errorData: ApiError = await response.json();
        return {
          success: false,
          error: errorData.detail || 'Error actualizando platillo anónimo'
        };
      }

      const data: AnonymousDish = await response.json();
      return {
        success: true,
        data
      };
    } catch (error) {
      console.error('Error actualizando platillo anónimo:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido actualizando platillo anónimo'
      };
    }
  }

  /**
   * Elimina un platillo anónimo
   */
  async deleteAnonymousDish(dishId: string): Promise<ApiResult<{ message: string }>> {
    try {
      console.log('🗑️ Eliminando platillo anónimo con ID:', dishId);
      
      // Obtener device_id
      const deviceId = getDeviceId();

      const response = await fetch(`${API_BASE_URL}/api/anonymous-dishes/${dishId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'X-Device-ID': deviceId
        }
      });

      if (!response.ok) {
        const errorData: ApiError = await response.json();
        return {
          success: false,
          error: errorData.detail || 'Error eliminando platillo anónimo'
        };
      }

      const data = await response.json();
      return {
        success: true,
        data
      };
    } catch (error) {
      console.error('Error eliminando platillo anónimo:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido eliminando platillo anónimo'
      };
    }
  }

  /**
   * Sube una imagen para un platillo anónimo
   */
  async uploadAnonymousDishImage(
    dishId: string,
    imageFile: File
  ): Promise<ApiResult<{ image_url: string }>> {
    try {
      console.log('📤 Subiendo imagen para platillo anónimo:', dishId);
      
      // Obtener device_id
      const deviceId = getDeviceId();

      const formData = new FormData();
      formData.append('file', imageFile);

      const response = await fetch(`${API_BASE_URL}/api/anonymous-dishes/${dishId}/image`, {
        method: 'POST',
        headers: {
          'X-Device-ID': deviceId
        },
        body: formData
      });

      if (!response.ok) {
        const errorData: ApiError = await response.json();
        return {
          success: false,
          error: errorData.detail || 'Error subiendo imagen'
        };
      }

      const data = await response.json();
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
   * Valida los datos del platillo anónimo
   */
  private validateDishData(data: AnonymousDishCreateRequest): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    // Validar nombre (requerido)
    if (!data.name || data.name.trim().length === 0) {
      errors.push('El nombre del platillo es requerido');
    } else if (data.name.trim().length < 2) {
      errors.push('El nombre debe tener al menos 2 caracteres');
    } else if (data.name.trim().length > 100) {
      errors.push('El nombre no puede exceder 100 caracteres');
    }
    
    // Validar precio (requerido)
    if (data.price === undefined || data.price === null) {
      errors.push('El precio es requerido');
    } else if (data.price < 0) {
      errors.push('El precio no puede ser negativo');
    } else if (data.price > 10000) {
      errors.push('El precio no puede exceder $10,000');
    }
    
    // Validar categoría (requerida)
    if (!data.categoryId || data.categoryId.trim().length === 0) {
      errors.push('La categoría es requerida');
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
   * Valida los datos de actualización del platillo anónimo
   */
  private validateDishUpdateData(data: AnonymousDishUpdateRequest): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    // Validar nombre (opcional en actualización)
    if (data.name !== undefined) {
      if (data.name.trim().length === 0) {
        errors.push('El nombre no puede estar vacío');
      } else if (data.name.trim().length < 2) {
        errors.push('El nombre debe tener al menos 2 caracteres');
      } else if (data.name.trim().length > 100) {
        errors.push('El nombre no puede exceder 100 caracteres');
      }
    }
    
    // Validar precio (opcional en actualización)
    if (data.price !== undefined) {
      if (data.price < 0) {
        errors.push('El precio no puede ser negativo');
      } else if (data.price > 10000) {
        errors.push('El precio no puede exceder $10,000');
      }
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
   * Debug FormData
   */
  private debugFormData(formData: FormData, label: string = 'FormData'): void {
    console.group(`🔍 Debug ${label}`);
    
    const entries = Array.from(formData.entries());
    console.log(`📊 Total de campos en FormData: ${entries.length}`);
    
    if (entries.length === 0) {
      console.error('⚠️ FormData está vacío!');
    }
    
    for (const [key, value] of entries) {
      if (value instanceof File) {
        console.log(`📁 ${key}:`, {
          name: value.name,
          size: value.size,
          type: value.type,
          lastModified: new Date(value.lastModified).toISOString()
        });
      } else {
        console.log(`📝 ${key}:`, value);
        if (key === 'dish_data' && typeof value === 'string') {
          try {
            const parsed = JSON.parse(value);
            console.log(`🔍 ${key} (parsed):`, parsed);
          } catch (e) {
            console.error(`❌ Error parsing ${key}:`, e);
          }
        }
      }
    }
    
    console.groupEnd();
  }

  /**
   * Utilidades para trabajar con platillos anónimos
   */
  utils = {
    /**
     * Verifica si un platillo pertenece al dispositivo actual
     */
    belongsToCurrentDevice: (dish: AnonymousDish): boolean => {
      const deviceId = getDeviceId();
      return dish.device_id === deviceId;
    },

    /**
     * Ordena platillos por precio
     */
    sortDishesByPrice: (dishes: AnonymousDish[], ascending: boolean = true): AnonymousDish[] => {
      return [...dishes].sort((a, b) => {
        return ascending ? a.price - b.price : b.price - a.price;
      });
    },

    /**
     * Ordena platillos por nombre
     */
    sortDishesByName: (dishes: AnonymousDish[], ascending: boolean = true): AnonymousDish[] => {
      return [...dishes].sort((a, b) => {
        const nameA = a.name.toLowerCase();
        const nameB = b.name.toLowerCase();
        return ascending ? nameA.localeCompare(nameB) : nameB.localeCompare(nameA);
      });
    },

    /**
     * Filtra platillos por categoría
     */
    filterDishesByCategory: (dishes: AnonymousDish[], categoryId: string): AnonymousDish[] => {
      return dishes.filter(dish => dish.categoryId === categoryId);
    },

    /**
     * Busca platillos por nombre o descripción
     */
    searchDishes: (dishes: AnonymousDish[], searchTerm: string): AnonymousDish[] => {
      const term = searchTerm.toLowerCase();
      return dishes.filter(dish => 
        dish.name.toLowerCase().includes(term) ||
        (dish.description && dish.description.toLowerCase().includes(term))
      );
    },

    /**
     * Formatea el precio para mostrar
     */
    formatPrice: (price: number): string => {
      return new Intl.NumberFormat('es-MX', {
        style: 'currency',
        currency: 'MXN'
      }).format(price);
    },

    /**
     * Verifica si un platillo está en stock
     */
    isInStock: (dish: AnonymousDish): boolean => {
      return dish.inStock ?? true;
    },

    /**
     * Obtiene platillos en oferta (con descuento)
     */
    getDishesOnSale: (dishes: AnonymousDish[]): AnonymousDish[] => {
      // Esta función necesitaría acceso al campo de descuento
      // Por ahora retornamos un array vacío como placeholder
      return [];
    },

    /**
     * Genera un nombre sugerido para un nuevo platillo
     */
    generateSuggestedName: (baseName: string, existingNames: string[]): string => {
      let suggestedName = baseName;
      let counter = 1;
      
      while (existingNames.includes(suggestedName)) {
        suggestedName = `${baseName} ${counter}`;
        counter++;
      }
      
      return suggestedName;
    },

    /**
     * Calcula el precio promedio de los platillos
     */
    calculateAveragePrice: (dishes: AnonymousDish[]): number => {
      if (dishes.length === 0) return 0;
      
      const total = dishes.reduce((sum, dish) => sum + dish.price, 0);
      return total / dishes.length;
    },

    /**
     * Obtiene el platillo más caro
     */
    getMostExpensiveDish: (dishes: AnonymousDish[]): AnonymousDish | null => {
      if (dishes.length === 0) return null;
      
      return dishes.reduce((max, dish) => dish.price > max.price ? dish : max);
    },

    /**
     * Obtiene el platillo más barato
     */
    getCheapestDish: (dishes: AnonymousDish[]): AnonymousDish | null => {
      if (dishes.length === 0) return null;
      
      return dishes.reduce((min, dish) => dish.price < min.price ? dish : min);
    }
  };
}

// Exportar una instancia única del servicio
export const anonymousDishService = new AnonymousDishService();
export default anonymousDishService; 