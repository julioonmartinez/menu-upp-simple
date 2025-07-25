// src/services/restaurantService.ts

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

// ✅ ACTUALIZADO: Estructura más completa para crear restaurante
export interface RestaurantCreateRequest {
  name: string;
  username?: string;
  description?: string;
  address?: string;
  phone?: string;
  email?: string;
  website?: string;
  schedule?: string;
  primaryColor?: string;
  secondaryColor?: string;
  textColor?: string;
  fontFamily?: string;
  features?: string[];
  cuisineType?: string[];
  paymentMethods?: string[];
  priceRange?: "low" | "medium" | "high" | "premium";
  showRatings?: boolean;
  allowReviews?: boolean;
  allowOrders?: boolean;
  active?: boolean;
  planType?: string;
  // ✅ NUEVO: Soporte para hero slides
  heroSlides?: Array<{
    title: string;
    subtitle: string;
    alt?: string;
  }>;
}

export interface RestaurantUpdateRequest {
  name?: string;
  username?: string;
  description?: string;
  address?: string;
  phone?: string;
  email?: string;
  website?: string;
  schedule?: string;
  primaryColor?: string;
  secondaryColor?: string;
  textColor?: string;
  fontFamily?: string;
  features?: string[];
  cuisineType?: string[];
  paymentMethods?: string[];
  priceRange?: "low" | "medium" | "high" | "premium";
  showRatings?: boolean;
  allowReviews?: boolean;
  allowOrders?: boolean;
  active?: boolean;
  customDomain?: string;
  qrCode?: string;
}

export type RestaurantResponse = Restaurant;

export interface UsernameCheckResponse {
  available: boolean;
  message: string;
}

export interface ImageUploadResponse {
  id: string;
  name: string;
  username?: string;
  description?: string;
  image?: string;
  logo?: string;
  imageProfile?: string;
  imageCover?: string;
  imageText?: string;
  qrCode?: string;
  [key: string]: any;
}

// ✅ NUEVO: Interface para crear con imágenes
export interface RestaurantCreateWithImagesRequest extends RestaurantCreateRequest {
  images?: {
    image?: File;
    logo?: File;
    profileImage?: File; // <-- CAMBIO
    coverImage?: File;   // <-- CAMBIO
    textImage?: File;    // <-- CAMBIO
    qrCode?: File;
    heroSlides?: File[];
  };
}

const API_BASE_URL = import.meta.env.PUBLIC_API_URL || 'http://localhost:8000';

/**
 * Servicio para manejar todas las operaciones CRUD de restaurantes
 * Solo usuarios autenticados pueden crear/editar restaurantes
 */
class RestaurantService {
  
  /**
   * Obtiene todos los restaurantes
   */
  async getAllRestaurants(activeOnly: boolean = true): Promise<ApiResult<Restaurant[]>> {
    try {
      const params = new URLSearchParams({
        active_only: activeOnly.toString()
      });

      const response = await fetch(
        `${API_BASE_URL}/restaurants/?${params}`,
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
          error: errorData.detail || 'Error obteniendo restaurantes'
        };
      }

      const data: Restaurant[] = await response.json();
      return {
        success: true,
        data
      };
    } catch (error) {
      console.error('Error obteniendo restaurantes:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido obteniendo restaurantes'
      };
    }
  }

  /**
   * Obtiene un restaurante específico por ID
   */
  async getRestaurant(restaurantId: string): Promise<ApiResult<Restaurant>> {
    try {
      const response = await fetch(
        `${API_BASE_URL}/restaurants/${restaurantId}`,
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
          error: errorData.detail || 'Error obteniendo restaurante'
        };
      }

      const data: Restaurant = await response.json();
      return {
        success: true,
        data
      };
    } catch (error) {
      console.error('Error obteniendo restaurante:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido obteniendo restaurante'
      };
    }
  }

  /**
   * Obtiene un restaurante por username
   */
  async getRestaurantByUsername(username: string): Promise<ApiResult<Restaurant>> {
    try {
      const response = await fetch(
        `${API_BASE_URL}/restaurants/username/${username}`,
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
          error: errorData.detail || 'Error obteniendo restaurante por username'
        };
      }

      const data: Restaurant = await response.json();
      return {
        success: true,
        data
      };
    } catch (error) {
      console.error('Error obteniendo restaurante por username:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido obteniendo restaurante'
      };
    }
  }

  /**
   * ✅ NUEVO: Función de debug para FormData
   */
  private debugFormData(formData: FormData, label: string = 'FormData'): void {
    console.group(`🔍 Debug ${label}`);
    
    // Verificar si FormData tiene entradas
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
        // Si es restaurant_data, también mostrar el JSON parseado
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
   * ✅ NUEVO: Verificación de datos antes de enviar
   */
  private validateFormDataBeforeSend(formData: FormData): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    // Verificar que restaurant_data existe
    const restaurantData = formData.get('restaurant_data');
    if (!restaurantData) {
      errors.push('restaurant_data is missing from FormData');
    } else if (typeof restaurantData !== 'string') {
      errors.push('restaurant_data is not a string');
    } else {
      // Verificar que es JSON válido
      try {
        const parsed = JSON.parse(restaurantData);
        if (!parsed.name) {
          errors.push('restaurant_data.name is required');
        }
      } catch (e) {
        if (e instanceof Error) {
          errors.push(`restaurant_data is not valid JSON: ${e.message}`);
        } else {
          errors.push('restaurant_data is not valid JSON: Unknown error');
        }
      }
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * ✅ ACTUALIZADO: Crea un nuevo restaurante (requiere autenticación)
   */
  async createRestaurant(restaurantData: RestaurantCreateRequest): Promise<ApiResult<RestaurantResponse>> {
    try {
      console.log('🚀 Iniciando createRestaurant');
      
      const isAuthenticated = await this.checkAuthentication();
      
      if (!isAuthenticated) {
        return {
          success: false,
          error: 'Debes estar autenticado para crear restaurantes'
        };
      }

      // Validar datos mínimos
      const validation = this.validateRestaurantData(restaurantData);
      if (!validation.isValid) {
        return {
          success: false,
          error: `Datos inválidos: ${validation.errors.join(', ')}`
        };
      }

      // ✅ CORRECCIÓN: Crear FormData correctamente
      console.log('📦 Creando FormData...');
      const formData = new FormData();
      
      // ✅ IMPORTANTE: Agregar valores por defecto que el backend espera
      const completeRestaurantData = {
        name: restaurantData.name,
        username: restaurantData.username,
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

      // ✅ CRUCIAL: Verificar que los datos estén completos antes de stringify
      console.log('📤 Datos a enviar:', completeRestaurantData);
      
      const restaurantDataString = JSON.stringify(completeRestaurantData);
      console.log('🔗 JSON stringified:', restaurantDataString);
      
      // ✅ IMPORTANTE: Verificar que el string no sea undefined o null
      if (!restaurantDataString || restaurantDataString === 'null' || restaurantDataString === 'undefined') {
        console.error('❌ Error: restaurant_data string is invalid');
        return {
          success: false,
          error: 'Error serializing restaurant data'
        };
      }
      
      formData.append('restaurant_data', restaurantDataString);
      
      // ✅ VALIDACIÓN: Verificar FormData antes de enviar
      const formValidation = this.validateFormDataBeforeSend(formData);
      if (!formValidation.isValid) {
        console.error('❌ FormData validation failed:', formValidation.errors);
        return {
          success: false,
          error: `FormData validation failed: ${formValidation.errors.join(', ')}`
        };
      }
      
      // ✅ DEBUG: Mostrar datos que se envían
      this.debugFormData(formData, 'Create Restaurant');

      // ✅ CORRECCIÓN: Usar authenticatedFetch que maneja automáticamente el token
      console.log('🌐 Sending request to /restaurants/');
      const response = await this.makeAuthenticatedRequest('/restaurants/', {
        method: 'POST',
        body: formData
      });

      console.log('📡 Response status:', response.status);
      console.log('📡 Response headers:', Object.fromEntries(response.headers.entries()));

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Error response text:', errorText);
        
        let errorData: ApiError;
        try {
          errorData = JSON.parse(errorText);
        } catch (e) {
          errorData = { detail: `HTTP ${response.status}: ${errorText}` };
        }
        
        console.error('❌ Error del servidor:', errorData);
        return {
          success: false,
          error: errorData.detail || 'Error creando restaurante'
        };
      }

      const data: RestaurantResponse = await response.json();
      console.log('✅ Restaurante creado exitosamente:', data);
      return {
        success: true,
        data
      };
    } catch (error) {
      console.error('💥 Error creando restaurante:', error);
      
      // Más detalles del error
      if (error instanceof Error) {
        console.error('💥 Error name:', error.name);
        console.error('💥 Error message:', error.message);
        console.error('💥 Error stack:', error.stack);
      }
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido creando restaurante'
      };
    }
  }

  /**
   * ✅ NUEVO: Crea un restaurante con imágenes
   */
  async createRestaurantWithImages(
    restaurantData: RestaurantCreateRequest,
    images?: {
      image?: File;
      logo?: File;
      profileImage?: File; // <-- CAMBIO
      coverImage?: File;   // <-- CAMBIO
      textImage?: File;    // <-- CAMBIO
      qrCode?: File;
      heroSlides?: File[];
    }
  ): Promise<ApiResult<RestaurantResponse>> {
    try {
      const isAuthenticated = await this.checkAuthentication();
      
      if (!isAuthenticated) {
        return {
          success: false,
          error: 'Debes estar autenticado para crear restaurantes'
        };
      }

      // Validar datos mínimos
      const validation = this.validateRestaurantData(restaurantData);
      if (!validation.isValid) {
        return {
          success: false,
          error: `Datos inválidos: ${validation.errors.join(', ')}`
        };
      }

      // Crear FormData con datos del restaurante
      const formData = new FormData();
      
      const completeRestaurantData = {
        name: restaurantData.name,
        username: restaurantData.username,
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

      formData.append('restaurant_data', JSON.stringify(completeRestaurantData));

      if (images) {
        if (images.image) formData.append('image', images.image);
        if (images.logo) formData.append('logo', images.logo);
        if (images.profileImage) formData.append('profile_image', images.profileImage); // <-- CAMBIO
        if (images.coverImage) formData.append('cover_image', images.coverImage);       // <-- CAMBIO
        if (images.textImage) formData.append('text_image', images.textImage);          // <-- CAMBIO
        if (images.qrCode) formData.append('qr_code', images.qrCode);
      
        // Hero slides
        if (images.heroSlides && images.heroSlides.length > 0) {
          if (images.heroSlides.length > 5) {
            return {
              success: false,
              error: 'Máximo 5 imágenes permitidas para el hero slider'
            };
          }
          images.heroSlides.forEach((file) => {
            formData.append('hero_slides', file);
          });
        }
      }

      // ✅ CORRECCIÓN: Usar makeAuthenticatedRequest que maneja automáticamente el token
      const response = await this.makeAuthenticatedRequest('/restaurants/', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        const errorData: ApiError = await response.json();
        console.error('Error del servidor:', errorData);
        return {
          success: false,
          error: errorData.detail || 'Error creando restaurante'
        };
      }

      const data: RestaurantResponse = await response.json();
      return {
        success: true,
        data
      };
    } catch (error) {
      console.error('Error creando restaurante con imágenes:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido creando restaurante'
      };
    }
  }

  /**
   * ✅ ACTUALIZADO: Actualiza un restaurante existente (requiere autenticación)
   */
  async updateRestaurant(
    restaurantId: string, 
    restaurantData: RestaurantUpdateRequest
  ): Promise<ApiResult<RestaurantResponse>> {
    try {
      const isAuthenticated = await this.checkAuthentication();
      
      if (!isAuthenticated) {
        return {
          success: false,
          error: 'Debes estar autenticado para actualizar restaurantes'
        };
      }

      // Crear FormData para enviar al backend
      const formData = new FormData();
      formData.append('restaurant_data', JSON.stringify(restaurantData));

      const response = await this.makeAuthenticatedRequest(`/restaurants/${restaurantId}`, {
        method: 'PUT',
        body: formData
      });

      if (!response.ok) {
        const errorData: ApiError = await response.json();
        return {
          success: false,
          error: errorData.detail || 'Error actualizando restaurante'
        };
      }

      const data: RestaurantResponse = await response.json();
      return {
        success: true,
        data
      };
    } catch (error) {
      console.error('Error actualizando restaurante:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido actualizando restaurante'
      };
    }
  }

  /**
   * Elimina un restaurante (requiere autenticación)
   */
  async deleteRestaurant(restaurantId: string): Promise<ApiResult<{ message: string }>> {
    try {
      const isAuthenticated = await this.checkAuthentication();
      
      if (!isAuthenticated) {
        return {
          success: false,
          error: 'Debes estar autenticado para eliminar restaurantes'
        };
      }

      const response = await this.makeAuthenticatedRequest(`/restaurants/${restaurantId}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        const errorData: ApiError = await response.json();
        return {
          success: false,
          error: errorData.detail || 'Error eliminando restaurante'
        };
      }

      const data = await response.json();
      return {
        success: true,
        data
      };
    } catch (error) {
      console.error('Error eliminando restaurante:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido eliminando restaurante'
      };
    }
  }

  /**
   * Verifica la disponibilidad de un username
   */
  async checkUsernameAvailability(username: string): Promise<ApiResult<UsernameCheckResponse>> {
    try {
      const response = await fetch(
        `${API_BASE_URL}/restaurants/check-username/${username}`,
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
          error: errorData.detail || 'Error verificando username'
        };
      }

      const data: UsernameCheckResponse = await response.json();
      return {
        success: true,
        data
      };
    } catch (error) {
      console.error('Error verificando username:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido verificando username'
      };
    }
  }

  /**
   * ✅ ACTUALIZADO: Sube una imagen para un restaurante
   */
  async uploadRestaurantImage(
    restaurantId: string,
    imageFile: File,
    imageType: 'image' | 'logo' | 'imageProfile' | 'imageCover' | 'imageText' | 'qrCode' = 'image'
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
      formData.append('file', imageFile);

      const params = new URLSearchParams({
        image_type: imageType
      });

      const response = await this.makeAuthenticatedRequest(
        `/restaurants/${restaurantId}/image?${params}`,
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
   * Elimina una imagen de un restaurante
   */
  async deleteRestaurantImage(
    restaurantId: string,
    imageType: 'image' | 'logo' | 'imageProfile' | 'imageCover' | 'imageText' | 'qrCode'
  ): Promise<ApiResult<ImageUploadResponse>> {
    try {
      const isAuthenticated = await this.checkAuthentication();
      if (!isAuthenticated) {
        return { success: false, error: 'Debes estar autenticado para eliminar imágenes' };
      }

      const params = new URLSearchParams({ image_type: imageType });
      const response = await this.makeAuthenticatedRequest(
        `/restaurants/${restaurantId}/image?${params}`,
        { method: 'DELETE' }
      );

      if (!response.ok) {
        const errorData: ApiError = await response.json();
        return { success: false, error: errorData.detail || 'Error eliminando imagen' };
      }

      const data: ImageUploadResponse = await response.json();
      return { success: true, data };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido eliminando imagen'
      };
    }
  }

  /**
   * Obtiene los restaurantes del usuario actual
   */
  async getUserRestaurants(): Promise<ApiResult<Restaurant[]>> {
    try {
      const isAuthenticated = await this.checkAuthentication();
      
      if (!isAuthenticated) {
        return {
          success: false,
          error: 'Debes estar autenticado para ver tus restaurantes'
        };
      }

      // Obtener todos los restaurantes y filtrar por usuario en el frontend
      const allRestaurantsResult = await this.getAllRestaurants(false);
      
      if (!allRestaurantsResult.success) {
        return allRestaurantsResult;
      }

      const { authService } = await import('./authService.ts');
      const currentUser = (await authService.getCurrentUser()).data;
      
      if (!currentUser) {
        return {
          success: false,
          error: 'Usuario no encontrado'
        };
      }

      const userRestaurants = allRestaurantsResult.data?.filter(
        restaurant => restaurant.ownerId === currentUser.id
      ) || [];

      return {
        success: true,
        data: userRestaurants
      };
    } catch (error) {
      console.error('Error obteniendo restaurantes del usuario:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido obteniendo restaurantes'
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
   * ✅ ACTUALIZADO: Realiza una petición autenticada
   */
  private async makeAuthenticatedRequest(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<Response> {
    const { authService } = await import('./authService.ts');
    
    // ✅ CORRECCIÓN: El authService.authenticatedFetch ya maneja la URL base
    // Solo necesitamos pasar el endpoint relativo
    return authService.authenticatedFetch(endpoint, options);
  }

  /**
   * ✅ ACTUALIZADO: Valida los datos del restaurante
   */
  private validateRestaurantData(data: RestaurantCreateRequest): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    // Validar nombre (requerido)
    if (!data.name || data.name.trim().length === 0) {
      errors.push('El nombre del restaurante es requerido');
    } else if (data.name.trim().length < 2) {
      errors.push('El nombre debe tener al menos 2 caracteres');
    } else if (data.name.trim().length > 100) {
      errors.push('El nombre no puede exceder 100 caracteres');
    }
    
    // Validar username (opcional pero con formato)
    if (data.username) {
      const usernameRegex = /^[a-zA-Z0-9_]+$/;
      if (!usernameRegex.test(data.username)) {
        errors.push('El username solo puede contener letras, números y guiones bajos');
      } else if (data.username.length < 3) {
        errors.push('El username debe tener al menos 3 caracteres');
      } else if (data.username.length > 50) {
        errors.push('El username no puede exceder 50 caracteres');
      }
    }
    
    // Validar descripción (opcional)
    if (data.description && data.description.length > 500) {
      errors.push('La descripción no puede exceder 500 caracteres');
    }

    // ✅ NUEVO: Validar hero slides
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
   * ✅ NUEVO: Función de test para debugging
   */
  async testFormDataSubmission(): Promise<void> {
    console.group('🧪 Testing FormData submission');
    
    try {
      // Crear FormData de prueba
      const testData = {
        name: "Test Restaurant",
        description: "Test description"
      };
      
      const formData = new FormData();
      formData.append('restaurant_data', JSON.stringify(testData));
      
      console.log('📦 Test FormData created');
      this.debugFormData(formData, 'Test FormData');
      
      // Verificar autenticación
      const { authService } = await import('./authService.ts');
      const token = authService.getTokenFromCookie();
      console.log('🔑 Token present:', !!token);
      console.log('🔑 Token length:', token?.length || 0);
      
      // Test de headers
      const testHeaders = new Headers();
      testHeaders.append('Authorization', `Bearer ${token}`);
      console.log('📋 Headers:', Object.fromEntries(testHeaders.entries()));
      
      // Test de fetch directo
      console.log('🌐 Testing direct fetch...');
      const response = await fetch(`${API_BASE_URL}/restaurants/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
          // NO agregamos Content-Type para FormData
        },
        body: formData
      });
      
      console.log('📡 Direct fetch response status:', response.status);
      console.log('📡 Direct fetch response headers:', Object.fromEntries(response.headers.entries()));
      
      const responseText = await response.text();
      console.log('📄 Direct fetch response text:', responseText);
      
    } catch (error) {
      console.error('❌ Test failed:', error);
    }
    
    console.groupEnd();
  }

  /**
   * Utilidades para trabajar con restaurantes
   */
  utils = {
    /**
     * Genera un username sugerido basado en el nombre
     */
    generateSuggestedUsername: (name: string): string => {
      return name
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, '') // Remover caracteres especiales
        .replace(/\s+/g, '_') // Reemplazar espacios con guiones bajos
        .substring(0, 30); // Limitar longitud
    },

    /**
     * Valida si un string es un username válido
     */
    isValidUsername: (username: string): boolean => {
      const usernameRegex = /^[a-zA-Z0-9_]{3,50}$/;
      return usernameRegex.test(username);
    },

    /**
     * Formatea el nombre del restaurante
     */
    formatRestaurantName: (name: string): string => {
      return name.trim().replace(/\s+/g, ' '); // Normalizar espacios
    },

    /**
     * Verifica si el usuario puede editar un restaurante
     */
    canEditRestaurant: (restaurant: Restaurant, currentUserId?: string): boolean => {
      if (!currentUserId) return false;
      return restaurant.ownerId === currentUserId;
    },

    /**
     * Obtiene la URL pública del restaurante
     */
    getRestaurantPublicUrl: (restaurant: Restaurant): string => {
      const baseUrl = window.location.origin;
      return restaurant.username 
        ? `${baseUrl}/restaurant/${restaurant.username}`
        : `${baseUrl}/restaurant/${restaurant.id}`;
    },

    /**
     * Verifica si un restaurante está completo (tiene información básica)
     */
    isRestaurantComplete: (restaurant: Restaurant): boolean => {
      return !!(
        restaurant.name &&
        restaurant.description &&
        (restaurant.address || restaurant.phone || restaurant.email)
      );
    },

    /**
     * ✅ NUEVO: Test de debugging
     */
    testFormData: async (): Promise<void> => {
      const service = new RestaurantService();
      await service.testFormDataSubmission();
    }
  };
}

// Exportar una instancia única del servicio
export const restaurantService = new RestaurantService();
export default restaurantService;