// src/services/anonymousCategoryService.ts

import type {
  ApiResult,
  ApiError,
  AnonymousCategory,
  AnonymousCategoryCreateRequest,
  AnonymousCategoriesResponse
} from '../interfaces/anonymousRestaurant';
import { getDeviceId } from './deviceIdService';

const API_BASE_URL = import.meta.env.PUBLIC_API_URL || 'http://localhost:8000';

/**
 * Servicio para manejar todas las operaciones de categorías anónimas
 * No requiere autenticación, usa device_id para identificar al creador
 */
class AnonymousCategoryService {
  
  /**
   * Crea una nueva categoría anónima
   */
  async createAnonymousCategory(categoryData: AnonymousCategoryCreateRequest): Promise<ApiResult<AnonymousCategory>> {
    try {
      console.log('🚀 Iniciando createAnonymousCategory');
      
      // Obtener device_id
      const deviceId = getDeviceId();
      console.log('📱 Device ID:', deviceId);
      
      // Validar datos mínimos
      const validation = this.validateCategoryData(categoryData);
      if (!validation.isValid) {
        return {
          success: false,
          error: `Datos inválidos: ${validation.errors.join(', ')}`
        };
      }

      const response = await fetch(`${API_BASE_URL}/api/anonymous-categories/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Device-ID': deviceId
        },
        body: JSON.stringify(categoryData)
      });

      console.log('📡 Response status:', response.status);

      if (!response.ok) {
        const errorData: ApiError = await response.json();
        return {
          success: false,
          error: errorData.detail || 'Error creando categoría anónima'
        };
      }

      const data: AnonymousCategory = await response.json();
      console.log('✅ Categoría anónima creada exitosamente:', data);
      
      return {
        success: true,
        data
      };
    } catch (error) {
      console.error('💥 Error creando categoría anónima:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido creando categoría anónima'
      };
    }
  }

  /**
   * Obtiene todas las categorías anónimas del dispositivo actual
   */
  async getAnonymousCategoriesByDevice(): Promise<ApiResult<AnonymousCategoriesResponse>> {
    try {
      const deviceId = getDeviceId();
      console.log('📱 Obteniendo categorías anónimas para device:', deviceId);
      
      const response = await fetch(`${API_BASE_URL}/api/anonymous-categories/device/${deviceId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorData: ApiError = await response.json();
        return {
          success: false,
          error: errorData.detail || 'Error obteniendo categorías anónimas'
        };
      }

      const data: AnonymousCategoriesResponse = await response.json();
      return {
        success: true,
        data
      };
    } catch (error) {
      console.error('Error obteniendo categorías anónimas:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido obteniendo categorías anónimas'
      };
    }
  }

  /**
   * Obtiene una categoría anónima por su ID
   */
  async getAnonymousCategory(categoryId: string): Promise<ApiResult<AnonymousCategory>> {
    try {
      console.log('🔍 Obteniendo categoría anónima con ID:', categoryId);
      
      const response = await fetch(`${API_BASE_URL}/api/anonymous-categories/${categoryId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorData: ApiError = await response.json();
        return {
          success: false,
          error: errorData.detail || 'Error obteniendo categoría anónima'
        };
      }

      const data: AnonymousCategory = await response.json();
      return {
        success: true,
        data
      };
    } catch (error) {
      console.error('Error obteniendo categoría anónima:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido obteniendo categoría anónima'
      };
    }
  }

  /**
   * Actualiza una categoría anónima
   */
  async updateAnonymousCategory(
    categoryId: string,
    categoryData: AnonymousCategoryCreateRequest
  ): Promise<ApiResult<AnonymousCategory>> {
    try {
      console.log('🔄 Actualizando categoría anónima con ID:', categoryId);
      
      // Obtener device_id
      const deviceId = getDeviceId();
      
      // Validar datos
      const validation = this.validateCategoryData(categoryData);
      if (!validation.isValid) {
        return {
          success: false,
          error: `Datos inválidos: ${validation.errors.join(', ')}`
        };
      }

      const response = await fetch(`${API_BASE_URL}/api/anonymous-categories/${categoryId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'X-Device-ID': deviceId
        },
        body: JSON.stringify(categoryData)
      });

      if (!response.ok) {
        const errorData: ApiError = await response.json();
        return {
          success: false,
          error: errorData.detail || 'Error actualizando categoría anónima'
        };
      }

      const data: AnonymousCategory = await response.json();
      return {
        success: true,
        data
      };
    } catch (error) {
      console.error('Error actualizando categoría anónima:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido actualizando categoría anónima'
      };
    }
  }

  /**
   * Elimina una categoría anónima
   */
  async deleteAnonymousCategory(categoryId: string): Promise<ApiResult<{ message: string }>> {
    try {
      console.log('🗑️ Eliminando categoría anónima con ID:', categoryId);
      
      // Obtener device_id
      const deviceId = getDeviceId();

      const response = await fetch(`${API_BASE_URL}/api/anonymous-categories/${categoryId}`, {
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
          error: errorData.detail || 'Error eliminando categoría anónima'
        };
      }

      const data = await response.json();
      return {
        success: true,
        data
      };
    } catch (error) {
      console.error('Error eliminando categoría anónima:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido eliminando categoría anónima'
      };
    }
  }

  /**
   * Valida los datos de la categoría anónima
   */
  private validateCategoryData(data: AnonymousCategoryCreateRequest): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    // Validar nombre (requerido)
    if (!data.name || data.name.trim().length === 0) {
      errors.push('El nombre de la categoría es requerido');
    } else if (data.name.trim().length < 2) {
      errors.push('El nombre debe tener al menos 2 caracteres');
    } else if (data.name.trim().length > 50) {
      errors.push('El nombre no puede exceder 50 caracteres');
    }
    
    // Validar descripción (opcional)
    if (data.description && data.description.length > 200) {
      errors.push('La descripción no puede exceder 200 caracteres');
    }

    // Validar orden (opcional)
    if (data.order !== undefined && (data.order < 0 || data.order > 1000)) {
      errors.push('El orden debe estar entre 0 y 1000');
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Utilidades para trabajar con categorías anónimas
   */
  utils = {
    /**
     * Verifica si una categoría pertenece al dispositivo actual
     */
    belongsToCurrentDevice: (category: AnonymousCategory): boolean => {
      const deviceId = getDeviceId();
      return category.device_id === deviceId;
    },

    /**
     * Ordena categorías por el campo order
     */
    sortCategoriesByOrder: (categories: AnonymousCategory[]): AnonymousCategory[] => {
      return [...categories].sort((a, b) => {
        const orderA = a.order || 0;
        const orderB = b.order || 0;
        return orderA - orderB;
      });
    },

    /**
     * Obtiene la siguiente posición disponible para una nueva categoría
     */
    getNextAvailableOrder: (categories: AnonymousCategory[]): number => {
      if (categories.length === 0) return 1;
      
      const maxOrder = Math.max(...categories.map(c => c.order || 0));
      return maxOrder + 1;
    },

    /**
     * Formatea el nombre de la categoría
     */
    formatCategoryName: (name: string): string => {
      return name.trim().replace(/\s+/g, ' '); // Normalizar espacios
    },

    /**
     * Verifica si una categoría está vacía (sin platillos)
     */
    isCategoryEmpty: (category: AnonymousCategory): boolean => {
      // Esta función necesitaría acceso a los platillos de la categoría
      // Por ahora retornamos false como placeholder
      return false;
    },

    /**
     * Genera un nombre sugerido para una nueva categoría
     */
    generateSuggestedName: (baseName: string, existingNames: string[]): string => {
      let suggestedName = baseName;
      let counter = 1;
      
      while (existingNames.includes(suggestedName)) {
        suggestedName = `${baseName} ${counter}`;
        counter++;
      }
      
      return suggestedName;
    }
  };
}

// Exportar una instancia única del servicio
export const anonymousCategoryService = new AnonymousCategoryService();
export default anonymousCategoryService; 