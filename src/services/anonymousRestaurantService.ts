// src/services/anonymousRestaurantService.ts

import type {
  ApiResult,
  ApiError,
  AnonymousRestaurantCreateRequest,
  AnonymousRestaurant,
  RestaurantClaimRequest,
  RestaurantClaimResponse,
  AnonymousRestaurantResponse,
  AnonymousRestaurantCreateResponse,
  AnonymousRestaurantByClaimCodeResponse,
  AnonymousRestaurantsByDeviceResponse,
  AnonymousRestaurantCreateWithImagesRequest
} from '../interfaces/anonymousRestaurant';
import { getDeviceId } from './deviceIdService';

const API_BASE_URL = import.meta.env.PUBLIC_API_URL || 'http://localhost:8000';

/**
 * Servicio para manejar todas las operaciones de restaurantes anónimos
 * No requiere autenticación, usa device_id para identificar al creador
 */
class AnonymousRestaurantService {
  
  /**
   * Crea un nuevo restaurante anónimo
   */
  async createAnonymousRestaurant(
    restaurantData: AnonymousRestaurantCreateRequest,
    images?: {
      image?: File;
      logo?: File;
      profile_image?: File;
      cover_image?: File;
      text_image?: File;
      qr_code?: File;
      hero_slides?: File[];
    }
  ): Promise<ApiResult<AnonymousRestaurantCreateResponse>> {
    try {
      console.log('🚀 Iniciando createAnonymousRestaurant');
      
      // Obtener device_id
      const deviceId = getDeviceId();
      console.log('📱 Device ID:', deviceId);
      
      // Validar datos mínimos
      const validation = this.validateRestaurantData(restaurantData);
      if (!validation.isValid) {
        return {
          success: false,
          error: `Datos inválidos: ${validation.errors.join(', ')}`
        };
      }

      // Crear FormData
      const formData = new FormData();
      
      // Preparar datos completos del restaurante
      const completeRestaurantData = {
        name: restaurantData.name,
        description: restaurantData.description || '',
        address: restaurantData.address || '',
        phone: restaurantData.phone || '',
        email: restaurantData.email || '',
        website: restaurantData.website || '',
        schedule: restaurantData.schedule || '',
        primaryColor: restaurantData.primaryColor || '#FF5733',
        secondaryColor: restaurantData.secondaryColor || '#33FF57',
        textColor: restaurantData.textColor || '#000000',
        fontFamily: restaurantData.fontFamily || 'Roboto',
        features: restaurantData.features || [],
        cuisineType: restaurantData.cuisineType || [],
        paymentMethods: restaurantData.paymentMethods || ['efectivo'],
        priceRange: restaurantData.priceRange || 'medium',
        showRatings: restaurantData.showRatings ?? true,
        allowReviews: restaurantData.allowReviews ?? true,
        allowOrders: restaurantData.allowOrders ?? true,
        active: restaurantData.active ?? true,
        planType: restaurantData.planType || 'free',
        heroSlides: restaurantData.heroSlides || []
      };

      // Agregar datos del restaurante
      formData.append('restaurant_data', JSON.stringify(completeRestaurantData));
      
      // Agregar imágenes si se proporcionan
      if (images) {
        if (images.image) formData.append('image', images.image);
        if (images.logo) formData.append('logo', images.logo);
        if (images.profile_image) formData.append('profile_image', images.profile_image);
        if (images.cover_image) formData.append('cover_image', images.cover_image);
        if (images.text_image) formData.append('text_image', images.text_image);
        if (images.qr_code) formData.append('qr_code', images.qr_code);
        
        // Hero slides
        if (images.hero_slides && images.hero_slides.length > 0) {
          if (images.hero_slides.length > 5) {
            return {
              success: false,
              error: 'Máximo 5 imágenes permitidas para el hero slider'
            };
          }
          images.hero_slides.forEach((file) => {
            formData.append('hero_slides', file);
          });
        }
      }

      // Debug FormData
      this.debugFormData(formData, 'Create Anonymous Restaurant');

      // Realizar petición
      const response = await fetch(`${API_BASE_URL}/api/anonymous-restaurants/`, {
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
          error: errorData.detail || 'Error creando restaurante anónimo'
        };
      }

      const data: AnonymousRestaurantCreateResponse = await response.json();
      console.log('✅ Restaurante anónimo creado exitosamente:', data);
      
      return {
        success: true,
        data
      };
    } catch (error) {
      console.error('💥 Error creando restaurante anónimo:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido creando restaurante anónimo'
      };
    }
  }

  /**
   * Obtiene un restaurante anónimo por su código de reclamación
   */
  async getAnonymousRestaurantByClaimCode(claimCode: string): Promise<ApiResult<AnonymousRestaurantByClaimCodeResponse>> {
    try {
      console.log('🔍 Consultando restaurante anónimo con claim code:', claimCode);
      
      const response = await fetch(`${API_BASE_URL}/api/anonymous-restaurants/claim/${claimCode}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorData: ApiError = await response.json();
        return {
          success: false,
          error: errorData.detail || 'Error obteniendo restaurante anónimo'
        };
      }

      const data: AnonymousRestaurantByClaimCodeResponse = await response.json();
      return {
        success: true,
        data
      };
    } catch (error) {
      console.error('Error obteniendo restaurante anónimo:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido obteniendo restaurante anónimo'
      };
    }
  }

  /**
   * Obtiene todos los restaurantes anónimos del dispositivo actual
   */
  async getAnonymousRestaurantsByDevice(): Promise<ApiResult<AnonymousRestaurantsByDeviceResponse>> {
    try {
      const deviceId = getDeviceId();
      console.log('📱 Obteniendo restaurantes anónimos para device:', deviceId);
      
      const response = await fetch(`${API_BASE_URL}/api/anonymous-restaurants/device/${deviceId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorData: ApiError = await response.json();
        return {
          success: false,
          error: errorData.detail || 'Error obteniendo restaurantes anónimos'
        };
      }

      const data: AnonymousRestaurantsByDeviceResponse = await response.json();
      return {
        success: true,
        data
      };
    } catch (error) {
      console.error('Error obteniendo restaurantes anónimos:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido obteniendo restaurantes anónimos'
      };
    }
  }

  /**
   * Reclama un restaurante anónimo
   */
  async claimAnonymousRestaurant(claimRequest: RestaurantClaimRequest): Promise<ApiResult<RestaurantClaimResponse>> {
    try {
      console.log('🎯 Reclamando restaurante con código:', claimRequest.claim_code);
      
      const response = await fetch(`${API_BASE_URL}/api/anonymous-restaurants/claim`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(claimRequest)
      });

      if (!response.ok) {
        const errorData: ApiError = await response.json();
        return {
          success: false,
          error: errorData.detail || 'Error reclamando restaurante'
        };
      }

      const data: RestaurantClaimResponse = await response.json();
      return {
        success: true,
        data
      };
    } catch (error) {
      console.error('Error reclamando restaurante:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido reclamando restaurante'
      };
    }
  }

  /**
   * Obtiene estadísticas de limpieza (solo para admins)
   */
  async getCleanupStats(): Promise<ApiResult<any>> {
    try {
      // Verificar autenticación para este endpoint
      const { authService } = await import('./authService');
      if (!authService.isAuthenticated()) {
        return {
          success: false,
          error: 'Debes estar autenticado para ver estadísticas de limpieza'
        };
      }

      const response = await fetch(`${API_BASE_URL}/api/anonymous-restaurants/stats`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authService.getTokenFromCookie()}`
        }
      });

      if (!response.ok) {
        const errorData: ApiError = await response.json();
        return {
          success: false,
          error: errorData.detail || 'Error obteniendo estadísticas'
        };
      }

      const data = await response.json();
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
   * Ejecuta limpieza manual (solo para admins)
   */
  async performManualCleanup(): Promise<ApiResult<any>> {
    try {
      // Verificar autenticación para este endpoint
      const { authService } = await import('./authService');
      if (!authService.isAuthenticated()) {
        return {
          success: false,
          error: 'Debes estar autenticado para ejecutar limpieza manual'
        };
      }

      const response = await fetch(`${API_BASE_URL}/api/anonymous-restaurants/cleanup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authService.getTokenFromCookie()}`
        }
      });

      if (!response.ok) {
        const errorData: ApiError = await response.json();
        return {
          success: false,
          error: errorData.detail || 'Error ejecutando limpieza manual'
        };
      }

      const data = await response.json();
      return {
        success: true,
        data
      };
    } catch (error) {
      console.error('Error ejecutando limpieza manual:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido ejecutando limpieza manual'
      };
    }
  }

  /**
   * Valida los datos del restaurante anónimo
   */
  private validateRestaurantData(data: AnonymousRestaurantCreateRequest): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    // Validar nombre (requerido)
    if (!data.name || data.name.trim().length === 0) {
      errors.push('El nombre del restaurante es requerido');
    } else if (data.name.trim().length < 2) {
      errors.push('El nombre debe tener al menos 2 caracteres');
    } else if (data.name.trim().length > 100) {
      errors.push('El nombre no puede exceder 100 caracteres');
    }
    
    // Validar descripción (opcional)
    if (data.description && data.description.length > 500) {
      errors.push('La descripción no puede exceder 500 caracteres');
    }

    // Validar hero slides
    if (data.heroSlides) {
      if (data.heroSlides.length > 5) {
        errors.push('Máximo 5 slides permitidos para el hero carousel');
      }

      data.heroSlides.forEach((slide, index) => {
        if (!slide.title || slide.title.trim().length === 0) {
          errors.push(`El título del slide ${index + 1} es requerido`);
        }
        if (!slide.subtitle || slide.subtitle.trim().length === 0) {
          errors.push(`El subtítulo del slide ${index + 1} es requerido`);
        }
        if (slide.title && slide.title.length > 100) {
          errors.push(`El título del slide ${index + 1} no puede exceder 100 caracteres`);
        }
        if (slide.subtitle && slide.subtitle.length > 200) {
          errors.push(`El subtítulo del slide ${index + 1} no puede exceder 200 caracteres`);
        }
      });
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
        if (key === 'restaurant_data' && typeof value === 'string') {
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
   * Utilidades para trabajar con restaurantes anónimos
   */
  utils = {
    /**
     * Genera un código de reclamación de ejemplo
     */
    generateExampleClaimCode: (): string => {
      const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
      return Array.from({ length: 12 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
    },

    /**
     * Calcula días restantes hasta expiración
     */
    calculateDaysRemaining: (expiresAt: string): number => {
      const now = new Date();
      const expiration = new Date(expiresAt);
      const diffTime = expiration.getTime() - now.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return Math.max(0, diffDays);
    },

    /**
     * Verifica si un restaurante anónimo puede ser reclamado
     */
    canClaimRestaurant: (restaurant: AnonymousRestaurant): boolean => {
      return !restaurant.is_claimed && restaurant.days_remaining > 0;
    },

    /**
     * Obtiene la URL de reclamación
     */
    getClaimUrl: (claimCode: string): string => {
      const baseUrl = window.location.origin;
      return `${baseUrl}/claim/${claimCode}`;
    },

    /**
     * Formatea la fecha de expiración
     */
    formatExpirationDate: (expiresAt: string): string => {
      return new Date(expiresAt).toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    },

    /**
     * Verifica si un restaurante anónimo está expirado
     */
    isExpired: (restaurant: AnonymousRestaurant): boolean => {
      return restaurant.days_remaining <= 0;
    },

    /**
     * Obtiene el estado del restaurante anónimo
     */
    getRestaurantStatus: (restaurant: AnonymousRestaurant): 'active' | 'expired' | 'claimed' => {
      if (restaurant.is_claimed) return 'claimed';
      if (restaurant.days_remaining <= 0) return 'expired';
      return 'active';
    },

    /**
     * Guarda el código de reclamación en localStorage
     */
    saveClaimCode: (claimCode: string): void => {
      if (typeof window !== 'undefined') {
        localStorage.setItem('anonymous_claim_code', claimCode);
        localStorage.setItem('anonymous_claim_date', new Date().toISOString());
      }
    },

    /**
     * Obtiene el código de reclamación guardado
     */
    getSavedClaimCode: (): string | null => {
      if (typeof window !== 'undefined') {
        return localStorage.getItem('anonymous_claim_code');
      }
      return null;
    },

    /**
     * Limpia el código de reclamación guardado
     */
    clearSavedClaimCode: (): void => {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('anonymous_claim_code');
        localStorage.removeItem('anonymous_claim_date');
      }
    },

    /**
     * Verifica si hay un restaurante pendiente de reclamación
     */
    hasPendingRestaurant: (): boolean => {
      // return this.getSavedClaimCode() !== null;
      return   this.utils.getSavedClaimCode() !== null;
    }
  };
}

// Exportar una instancia única del servicio
export const anonymousRestaurantService = new AnonymousRestaurantService();
export default anonymousRestaurantService; 