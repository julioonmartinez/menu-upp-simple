import type { HeroSlide } from '../interfaces/restaurant.ts';

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

// Types específicos para hero slides - Actualizados según el backend
export interface HeroSlideCreateRequest {
  title: string;
  subtitle: string;
  alt?: string;
  position?: number; // Opcional, se asigna automáticamente si no se especifica
}

export interface HeroSlideUpdateRequest {
  title?: string;
  subtitle?: string;
  alt?: string;
  position?: number; // Nueva posición del slide
}

export interface HeroSlideResponse {
  position: number; // Cambiado de 'index' a 'position'
  imageUrl: string;
  title: string;
  subtitle: string;
  alt?: string;
  image_data?: {
    url: string;
    public_id?: string;
    width?: number;
    height?: number;
    format?: string;
  };
}

export interface HeroSlidesResponse {
  restaurantId: string;
  slides: HeroSlideResponse[];
  totalSlides: number;
  maxSlides: number;
  canAddMore: boolean;
}

export interface HeroSlidesUploadInfo {
  restaurantId: string;
  currentSlidesCount: number;
  availableSlots: number;
  maxSlides: number;
  recommendations: {
    imageFormat: string;
    imageSize: string;
    aspectRatio: string;
    maxFileSize: string;
  };
  restrictions: {
    maxSlides: number;
    maxFileSize: number;
    allowedFormats: string[];
  };
}

export interface BulkUploadResult {
  message: string;
  results: Array<{
    position: number; // Cambiado de 'index' a 'position'
    title: string;
    success: boolean;
    error?: string;
  }>;
  restaurant: any;
  summary: {
    total_processed: number;
    successful: number;
    failed: number;
    final_slides_count: number;
  };
}

export interface ReorderRequest {
  new_positions: number[]; // Cambiado de 'new_order' a 'new_positions'
}

const API_BASE_URL = import.meta.env.PUBLIC_API_URL || 'http://localhost:8000';

/**
 * Servicio para manejar todas las operaciones de hero slides
 * Solo usuarios autenticados pueden crear/editar hero slides
 */
class HeroSlidesService {
  
  /**
   * Obtiene todos los hero slides de un restaurante
   */
  async getHeroSlides(restaurantId: string): Promise<ApiResult<HeroSlidesResponse>> {
    try {
      const response = await fetch(
        `${API_BASE_URL}/restaurants/${restaurantId}/hero-slides`,
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
          error: errorData.detail || 'Error obteniendo hero slides'
        };
      }

      const data: HeroSlidesResponse = await response.json();
      
      try {
        const heroSlidesResponse = this.utils.handleBackendResponse(data, restaurantId);
        return {
          success: true,
          data: heroSlidesResponse
        };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Error procesando respuesta del servidor'
        };
      }
    } catch (error) {
      console.error('Error obteniendo hero slides:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido obteniendo hero slides'
      };
    }
  }

  /**
   * Obtiene un hero slide específico por posición
   */
  async getHeroSlideByPosition(restaurantId: string, position: number): Promise<ApiResult<HeroSlideResponse>> {
    try {
      const response = await fetch(
        `${API_BASE_URL}/restaurants/${restaurantId}/hero-slides/${position}`,
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
          error: errorData.detail || 'Error obteniendo hero slide'
        };
      }

      const data: HeroSlideResponse = await response.json();
      return {
        success: true,
        data
      };
    } catch (error) {
      console.error('Error obteniendo hero slide:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido obteniendo hero slide'
      };
    }
  }

  /**
   * Obtiene información de upload para hero slides
   */
  async getHeroSlidesUploadInfo(restaurantId: string): Promise<ApiResult<HeroSlidesUploadInfo>> {
    try {
      const endpoint = `${API_BASE_URL}/restaurants/${restaurantId}/hero-slides/info`;
      const response = await fetch(endpoint, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });
  
      if (!response.ok) {
        const errorData: ApiError = await response.json();
        return { success: false, error: errorData.detail || 'Error obteniendo información de upload' };
      }
  
      const data = await response.json();
  
      // Mapeo correcto
      const uploadInfo: HeroSlidesUploadInfo = {
        restaurantId: data.restaurant_id,
        currentSlidesCount: data.current_slides,
        availableSlots: data.slots_available,
        maxSlides: data.max_slides,
        recommendations: {
          imageFormat: data.upload_recommendations?.supported_formats?.join(', ') || '',
          imageSize: data.upload_recommendations?.recommended_dimensions || '',
          aspectRatio: data.upload_recommendations?.aspect_ratio || '',
          maxFileSize: data.upload_recommendations?.max_file_size || ''
        },
        restrictions: {
          maxSlides: data.max_slides,
          maxFileSize: 5 * 1024 * 1024,
          allowedFormats: data.upload_recommendations?.supported_formats || []
        }
      };
  
      return { success: true, data: uploadInfo };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Error desconocido obteniendo información' };
    }
  }

  /**
   * Agrega un nuevo hero slide
   */
  async addHeroSlide(
    restaurantId: string,
    slideData: HeroSlideCreateRequest,
    imageFile: File
  ): Promise<ApiResult<HeroSlideResponse>> {
    try {
      const isAuthenticated = await this.checkAuthentication();
      
      if (!isAuthenticated) {
        return {
          success: false,
          error: 'Debes estar autenticado para agregar hero slides'
        };
      }

      const formData = new FormData();
      formData.append('slide_data', JSON.stringify(slideData));
      formData.append('image', imageFile);

      const response = await this.makeAuthenticatedRequest(
        `/restaurants/${restaurantId}/hero-slides`,
        {
          method: 'POST',
          body: formData
        }
      );

      if (!response.ok) {
        const errorData: ApiError = await response.json();
        return {
          success: false,
          error: errorData.detail || 'Error agregando hero slide'
        };
      }

      const data: HeroSlideResponse = await response.json();
      
      try {
        // Para addHeroSlide, necesitamos encontrar la posición del nuevo slide
        // Si el backend devuelve un restaurante completo, buscamos el slide más reciente
        const heroSlideResponse = this.utils.handleAddSlideResponse(data, restaurantId, slideData);
        return {
          success: true,
          data: heroSlideResponse
        };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Error procesando respuesta del servidor'
        };
      }
    } catch (error) {
      console.error('Error agregando hero slide:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido agregando hero slide'
      };
    }
  }

  /**
   * Actualiza un hero slide existente por posición
   */
  async updateHeroSlide(
    restaurantId: string,
    slidePosition: number, // Cambiado de slideIndex a slidePosition
    slideData: HeroSlideUpdateRequest,
    imageFile?: File
  ): Promise<ApiResult<HeroSlideResponse>> {
    try {
      const isAuthenticated = await this.checkAuthentication();
      
      if (!isAuthenticated) {
        return {
          success: false,
          error: 'Debes estar autenticado para actualizar hero slides'
        };
      }

      const formData = new FormData();
      formData.append('slide_data', JSON.stringify(slideData));
      if (imageFile) {
        formData.append('image', imageFile);
      }

      const response = await this.makeAuthenticatedRequest(
        `/restaurants/${restaurantId}/hero-slides/${slidePosition}`,
        {
          method: 'PUT',
          body: formData
        }
      );

      if (!response.ok) {
        const errorData: ApiError = await response.json();
        return {
          success: false,
          error: errorData.detail || 'Error actualizando hero slide'
        };
      }

      const data: HeroSlideResponse = await response.json();
      
      try {
        const heroSlideResponse = this.utils.handleUpdateSlideResponse(data, restaurantId, slidePosition);
        return {
          success: true,
          data: heroSlideResponse
        };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Error procesando respuesta del servidor'
        };
      }
    } catch (error) {
      console.error('Error actualizando hero slide:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido actualizando hero slide'
      };
    }
  }

  /**
   * Elimina un hero slide por posición
   */
  async deleteHeroSlide(
    restaurantId: string,
    slidePosition: number // Cambiado de slideIndex a slidePosition
  ): Promise<ApiResult<{ message: string }>> {
    try {
      const isAuthenticated = await this.checkAuthentication();
      
      if (!isAuthenticated) {
        return {
          success: false,
          error: 'Debes estar autenticado para eliminar hero slides'
        };
      }

      const response = await this.makeAuthenticatedRequest(
        `/restaurants/${restaurantId}/hero-slides/${slidePosition}`,
        {
          method: 'DELETE'
        }
      );

      if (!response.ok) {
        const errorData: ApiError = await response.json();
        return {
          success: false,
          error: errorData.detail || 'Error eliminando hero slide'
        };
      }

      const data = await response.json();
      
      try {
        const deleteResponse = this.utils.handleDeleteSlideResponse(data);
        return {
          success: true,
          data: deleteResponse
        };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Error procesando respuesta del servidor'
        };
      }
    } catch (error) {
      console.error('Error eliminando hero slide:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido eliminando hero slide'
      };
    }
  }

  /**
   * Reordena los hero slides por posiciones
   */
  async reorderHeroSlides(
    restaurantId: string,
    newPositions: number[] // Cambiado de newOrder a newPositions
  ): Promise<ApiResult<HeroSlidesResponse>> {
    try {
      const isAuthenticated = await this.checkAuthentication();
      
      if (!isAuthenticated) {
        return {
          success: false,
          error: 'Debes estar autenticado para reordenar hero slides'
        };
      }

      const endpoint = `/restaurants/${restaurantId}/hero-slides/reorder`;
      const body = JSON.stringify(newPositions);
      
      console.log('Reorder request:', {
        endpoint,
        method: 'PUT',
        body,
        newPositions
      });

      const response = await this.makeAuthenticatedRequest(
        endpoint,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json'
          },
          body: body
        }
      );

      console.log('Reorder response status:', response.status);
      console.log('Reorder response url:', response.url);

      if (!response.ok) {
        const errorData: ApiError = await response.json();
        console.error('Reorder error response:', errorData);
        return {
          success: false,
          error: errorData.detail || 'Error reordenando hero slides'
        };
      }

      const data: HeroSlidesResponse = await response.json();
      
      try {
        const heroSlidesResponse = this.utils.handleBackendResponse(data, restaurantId);
        return {
          success: true,
          data: heroSlidesResponse
        };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Error procesando respuesta del servidor'
        };
      }
    } catch (error) {
      console.error('Error reordenando hero slides:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido reordenando hero slides'
      };
    }
  }

  /**
   * Agrega múltiples hero slides de una vez
   */
  async addMultipleHeroSlides(
    restaurantId: string,
    slidesData: HeroSlideCreateRequest[],
    imageFiles: File[]
  ): Promise<ApiResult<BulkUploadResult>> {
    try {
      const isAuthenticated = await this.checkAuthentication();
      
      if (!isAuthenticated) {
        return {
          success: false,
          error: 'Debes estar autenticado para agregar hero slides'
        };
      }

      if (slidesData.length !== imageFiles.length) {
        return {
          success: false,
          error: 'La cantidad de slides debe coincidir con la cantidad de imágenes'
        };
      }

      const formData = new FormData();
      formData.append('slides_data', JSON.stringify(slidesData));
      
      imageFiles.forEach((file, index) => {
        formData.append('images', file);
      });

      const response = await this.makeAuthenticatedRequest(
        `/restaurants/${restaurantId}/hero-slides/bulk`,
        {
          method: 'POST',
          body: formData
        }
      );

      if (!response.ok) {
        const errorData: ApiError = await response.json();
        return {
          success: false,
          error: errorData.detail || 'Error agregando múltiples hero slides'
        };
      }

      const data: BulkUploadResult = await response.json();
      return {
        success: true,
        data
      };
    } catch (error) {
      console.error('Error agregando múltiples hero slides:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido agregando múltiples hero slides'
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
   * Utilidades para trabajar con hero slides
   */
  utils = {
    /**
     * Convierte un restaurante completo a HeroSlidesResponse
     */
    convertRestaurantToHeroSlidesResponse: (restaurant: any, restaurantId: string): HeroSlidesResponse => {
      const heroSlides = restaurant.heroSlides || [];
      
      return {
        restaurantId: restaurant.id || restaurantId,
        slides: heroSlides.map((slide: any) => ({
          position: slide.position,
          imageUrl: slide.imageUrl,
          title: slide.title,
          subtitle: slide.subtitle,
          alt: slide.alt,
          image_data: slide.image_data
        })),
        totalSlides: heroSlides.length,
        maxSlides: 5,
        canAddMore: heroSlides.length < 5
      };
    },

    /**
     * Verifica si los datos son un restaurante completo y extrae el mensaje de confirmación (para deleteHeroSlide)
     */
    handleDeleteSlideResponse: (data: any): { message: string } => {
      // Verificar si recibimos un restaurante completo en lugar de un mensaje simple
      if (data && typeof data === 'object' && 'name' in data && 'heroSlides' in data) {
        console.warn('Backend devolvió un restaurante completo después de eliminar slide...');
        
        // Si es un restaurante completo, devolver un mensaje de confirmación
        return {
          message: 'Slide eliminado exitosamente'
        };
      }
      
      // Verificar que los datos tengan la estructura esperada
      if (!data || typeof data !== 'object' || !('message' in data)) {
        console.error('Datos de respuesta inválidos para eliminación:', data);
        throw new Error('Formato de respuesta inválido del servidor para eliminación');
      }
      
      return data;
    },

    /**
     * Verifica si los datos son un restaurante completo y extrae el slide más reciente (para addHeroSlide)
     */
    handleAddSlideResponse: (data: any, restaurantId: string, slideData: HeroSlideCreateRequest): HeroSlideResponse => {
      // Verificar si recibimos un restaurante completo en lugar de HeroSlideResponse
      if (data && typeof data === 'object' && 'name' in data && 'heroSlides' in data) {
        console.warn('Backend devolvió un restaurante completo, extrayendo slide más reciente...');
        
        const restaurant = data as any;
        const heroSlides = restaurant.heroSlides || [];
        
        // Si se especificó una posición, buscar por esa posición
        if (slideData.position !== undefined) {
          const newSlide = heroSlides.find((slide: any) => slide.position === slideData.position);
          if (newSlide) {
            const heroSlideResponse: HeroSlideResponse = {
              position: newSlide.position,
              imageUrl: newSlide.imageUrl,
              title: newSlide.title,
              subtitle: newSlide.subtitle,
              alt: newSlide.alt,
              image_data: newSlide.image_data
            };
            console.log('Nuevo slide extraído del restaurante:', heroSlideResponse);
            return heroSlideResponse;
          }
        }
        
        // Si no se encontró por posición específica, tomar el último slide (más reciente)
        if (heroSlides.length > 0) {
          const lastSlide = heroSlides[heroSlides.length - 1];
          const heroSlideResponse: HeroSlideResponse = {
            position: lastSlide.position,
            imageUrl: lastSlide.imageUrl,
            title: lastSlide.title,
            subtitle: lastSlide.subtitle,
            alt: lastSlide.alt,
            image_data: lastSlide.image_data
          };
          console.log('Último slide extraído del restaurante:', heroSlideResponse);
          return heroSlideResponse;
        }
        
        console.error('No se encontró ningún slide en el restaurante');
        throw new Error('No se encontró ningún slide en el restaurante');
      }
      
      // Verificar que los datos tengan la estructura esperada de HeroSlideResponse
      if (!data || typeof data !== 'object' || !('position' in data) || !('imageUrl' in data)) {
        console.error('Datos de respuesta inválidos para slide individual:', data);
        throw new Error('Formato de respuesta inválido del servidor para slide individual');
      }
      
      return data;
    },

    /**
     * Verifica si los datos son un restaurante completo y extrae el slide específico
     */
    handleUpdateSlideResponse: (data: any, restaurantId: string, slidePosition: number): HeroSlideResponse => {
      // Verificar si recibimos un restaurante completo en lugar de HeroSlideResponse
      if (data && typeof data === 'object' && 'name' in data && 'heroSlides' in data) {
        console.warn('Backend devolvió un restaurante completo, extrayendo slide específico...');
        
        const restaurant = data as any;
        const heroSlides = restaurant.heroSlides || [];
        
        // Buscar el slide específico por posición
        const updatedSlide = heroSlides.find((slide: any) => slide.position === slidePosition);
        
        if (!updatedSlide) {
          console.error(`No se encontró el slide en posición ${slidePosition}`);
          throw new Error(`No se encontró el slide en posición ${slidePosition}`);
        }
        
        const heroSlideResponse: HeroSlideResponse = {
          position: updatedSlide.position,
          imageUrl: updatedSlide.imageUrl,
          title: updatedSlide.title,
          subtitle: updatedSlide.subtitle,
          alt: updatedSlide.alt,
          image_data: updatedSlide.image_data
        };
        
        console.log('Slide extraído del restaurante:', heroSlideResponse);
        return heroSlideResponse;
      }
      
      // Verificar que los datos tengan la estructura esperada de HeroSlideResponse
      if (!data || typeof data !== 'object' || !('position' in data) || !('imageUrl' in data)) {
        console.error('Datos de respuesta inválidos para slide individual:', data);
        throw new Error('Formato de respuesta inválido del servidor para slide individual');
      }
      
      return data;
    },

    /**
     * Verifica si los datos son un restaurante completo y los convierte si es necesario
     */
    handleBackendResponse: (data: any, restaurantId: string): HeroSlidesResponse => {
      // Verificar si recibimos un restaurante completo en lugar de HeroSlidesResponse
      if (data && typeof data === 'object' && 'name' in data && 'heroSlides' in data) {
        console.warn('Backend devolvió un restaurante completo, extrayendo hero slides...');
        
        const heroSlidesResponse = heroSlidesService.utils.convertRestaurantToHeroSlidesResponse(data, restaurantId);
        console.log('Hero slides extraídos del restaurante:', heroSlidesResponse);
        
        return heroSlidesResponse;
      }
      
      // Verificar que los datos tengan la estructura esperada de HeroSlidesResponse
      if (!data || !Array.isArray(data.slides)) {
        console.error('Datos de respuesta inválidos:', data);
        throw new Error('Formato de respuesta inválido del servidor');
      }
      
      return data;
    },

    /**
     * Valida los datos de un hero slide
     */
    validateHeroSlideData: (data: HeroSlideCreateRequest): { isValid: boolean; errors: string[] } => {
      const errors: string[] = [];
      
      if (!data.title || data.title.trim().length === 0) {
        errors.push('El título es requerido');
      } else if (data.title.trim().length > 100) {
        errors.push('El título no puede exceder 100 caracteres');
      }
      
      if (!data.subtitle || data.subtitle.trim().length === 0) {
        errors.push('El subtítulo es requerido');
      } else if (data.subtitle.trim().length > 200) {
        errors.push('El subtítulo no puede exceder 200 caracteres');
      }
      
      if (data.alt && data.alt.length > 150) {
        errors.push('El texto alternativo no puede exceder 150 caracteres');
      }
      
      if (data.position !== undefined && (data.position < 0 || data.position > 4)) {
        errors.push('La posición debe estar entre 0 y 4');
      }
      
      return {
        isValid: errors.length === 0,
        errors
      };
    },

    /**
     * Valida un archivo de imagen
     */
    validateImageFile: (file: File): { isValid: boolean; errors: string[] } => {
      const errors: string[] = [];
      
      // Verificar tipo de archivo
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
      if (!allowedTypes.includes(file.type)) {
        errors.push('Solo se permiten archivos JPG, PNG y WebP');
      }
      
      // Verificar tamaño (máximo 5MB)
      const maxSize = 5 * 1024 * 1024; // 5MB
      if (file.size > maxSize) {
        errors.push('El archivo no puede exceder 5MB');
      }
      
      return {
        isValid: errors.length === 0,
        errors
      };
    },

    /**
     * Genera un preview de imagen
     */
    generateImagePreview: (file: File): Promise<string> => {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target?.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
    },

    /**
     * Verifica si se puede agregar más slides
     */
    canAddMoreSlides: (currentCount: number, maxCount: number = 5): boolean => {
      return currentCount < maxCount;
    },

    /**
     * Obtiene la siguiente posición disponible
     */
    getNextAvailablePosition: (slides: HeroSlideResponse[]): number => {
      const positions = slides.map(slide => slide.position).sort((a, b) => a - b);
      for (let i = 0; i < 5; i++) {
        if (!positions.includes(i)) {
          return i;
        }
      }
      return -1; // No hay posiciones disponibles
    }
  };
}

// Exportar una instancia única del servicio
export const heroSlidesService = new HeroSlidesService();
export default heroSlidesService; 