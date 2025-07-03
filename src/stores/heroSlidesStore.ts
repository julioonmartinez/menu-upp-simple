import { writable, derived, type Writable, type Readable } from 'svelte/store';
import { 
  heroSlidesService, 
  type ApiResult,
  type HeroSlideCreateRequest,
  type HeroSlideUpdateRequest,
  type HeroSlideResponse,
  type HeroSlidesResponse,
  type HeroSlidesUploadInfo,
  type BulkUploadResult
} from '../services/heroSlidesService.ts';
import { authStore } from './authStore.ts';

// Types para el estado de hero slides
export interface HeroSlidesState {
  // Datos de slides
  slides: HeroSlideResponse[];
  uploadInfo: HeroSlidesUploadInfo | null;
  
  // Estados de carga
  isLoading: boolean;
  isLoadingSlides: boolean;
  isLoadingUploadInfo: boolean;
  isAdding: boolean;
  isUpdating: boolean;
  isDeleting: boolean;
  isReordering: boolean;
  isBulkUploading: boolean;
  
  // Errores
  error: string | null;
  addError: string | null;
  updateError: string | null;
  deleteError: string | null;
  reorderError: string | null;
  bulkUploadError: string | null;
  
  // Cache metadata
  lastUpdated: {
    slides: Date | null;
    uploadInfo: Date | null;
  };
  
  // Restaurante actual
  currentRestaurantId: string | null;
  isAuthenticated: boolean;
}

// Types para resultados de acciones
export interface AddHeroSlideResult {
  success: boolean;
  slide?: HeroSlideResponse;
  error?: string;
}

export interface UpdateHeroSlideResult {
  success: boolean;
  slide?: HeroSlideResponse;
  error?: string;
}

export interface DeleteHeroSlideResult {
  success: boolean;
  message?: string;
  error?: string;
}

export interface ReorderHeroSlidesResult {
  success: boolean;
  slides?: HeroSlideResponse[];
  error?: string;
}

export interface BulkUploadHeroSlidesResult {
  success: boolean;
  result?: BulkUploadResult;
  error?: string;
}

/**
 * Estado inicial del store
 */
const initialState: HeroSlidesState = {
  slides: [],
  uploadInfo: null,
  isLoading: false,
  isLoadingSlides: false,
  isLoadingUploadInfo: false,
  isAdding: false,
  isUpdating: false,
  isDeleting: false,
  isReordering: false,
  isBulkUploading: false,
  error: null,
  addError: null,
  updateError: null,
  deleteError: null,
  reorderError: null,
  bulkUploadError: null,
  lastUpdated: {
    slides: null,
    uploadInfo: null
  },
  currentRestaurantId: null,
  isAuthenticated: false
};

/**
 * Clase para manejar el estado de hero slides
 */
class HeroSlidesStore {
  private store: Writable<HeroSlidesState>;
  
  // Stores derivados públicos
  public readonly subscribe: Writable<HeroSlidesState>['subscribe'];
  public readonly isLoading: Readable<boolean>;
  public readonly isLoadingSlides: Readable<boolean>;
  public readonly isLoadingUploadInfo: Readable<boolean>;
  public readonly isAdding: Readable<boolean>;
  public readonly isUpdating: Readable<boolean>;
  public readonly isDeleting: Readable<boolean>;
  public readonly isReordering: Readable<boolean>;
  public readonly isBulkUploading: Readable<boolean>;
  public readonly error: Readable<string | null>;
  public readonly addError: Readable<string | null>;
  public readonly updateError: Readable<string | null>;
  public readonly deleteError: Readable<string | null>;
  public readonly reorderError: Readable<string | null>;
  public readonly bulkUploadError: Readable<string | null>;
  public readonly slides: Readable<HeroSlideResponse[]>;
  public readonly uploadInfo: Readable<HeroSlidesUploadInfo | null>;
  public readonly isAuthenticated: Readable<boolean>;

  constructor() {
    this.store = writable<HeroSlidesState>(initialState);
    this.subscribe = this.store.subscribe;

    // Stores derivados
    this.isLoading = derived(this.store, $state => $state.isLoading);
    this.isLoadingSlides = derived(this.store, $state => $state.isLoadingSlides);
    this.isLoadingUploadInfo = derived(this.store, $state => $state.isLoadingUploadInfo);
    this.isAdding = derived(this.store, $state => $state.isAdding);
    this.isUpdating = derived(this.store, $state => $state.isUpdating);
    this.isDeleting = derived(this.store, $state => $state.isDeleting);
    this.isReordering = derived(this.store, $state => $state.isReordering);
    this.isBulkUploading = derived(this.store, $state => $state.isBulkUploading);
    this.error = derived(this.store, $state => $state.error);
    this.addError = derived(this.store, $state => $state.addError);
    this.updateError = derived(this.store, $state => $state.updateError);
    this.deleteError = derived(this.store, $state => $state.deleteError);
    this.reorderError = derived(this.store, $state => $state.reorderError);
    this.bulkUploadError = derived(this.store, $state => $state.bulkUploadError);
    this.slides = derived(this.store, $state => $state.slides);
    this.uploadInfo = derived(this.store, $state => $state.uploadInfo);
    this.isAuthenticated = derived(this.store, $state => $state.isAuthenticated);

    // Reaccionar a cambios de autenticación
    authStore.isAuthenticated.subscribe(isAuthenticated => {
      console.log('🔧 Auth state changed in heroSlidesStore:', isAuthenticated);
      this.store.update(state => ({
        ...state,
        isAuthenticated
      }));

      // Si el usuario se desautentica, limpiar datos
      if (!isAuthenticated) {
        console.log('🔧 User logged out, clearing data');
        this.clearData();
      }
    });
  }

  /**
   * Carga los hero slides de un restaurante
   */
  async loadHeroSlides(restaurantId: string, forceReload: boolean = false): Promise<ApiResult<HeroSlideResponse[]>> {
    const currentState = this.getCurrentState();
    
    // Verificar cache si no es forzado
    if (!forceReload && currentState.slides.length > 0 && currentState.lastUpdated.slides) {
      const timeDiff = Date.now() - currentState.lastUpdated.slides.getTime();
      if (timeDiff < 2 * 60 * 1000) { // 2 minutos de cache
        return {
          success: true,
          data: currentState.slides
        };
      }
    }

    this.setLoadingSlides(true);
    this.clearError();

    try {
      const result = await heroSlidesService.getHeroSlides(restaurantId);

      if (result.success && result.data) {
        this.store.update(state => ({
          ...state,
          slides: result.data!.slides,
          currentRestaurantId: restaurantId,
          isLoadingSlides: false,
          lastUpdated: {
            ...state.lastUpdated,
            slides: new Date()
          },
          error: null
        }));

        return {
          success: true,
          data: result.data.slides
        };
      } else {
        this.setLoadingSlides(false);
        this.setError(result.error || 'Error cargando hero slides');
        
        return {
          success: false,
          error: result.error || 'Error cargando hero slides'
        };
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido cargando hero slides';
      this.setLoadingSlides(false);
      this.setError(errorMessage);
      
      return {
        success: false,
        error: errorMessage
      };
    }
  }

  /**
   * Carga un hero slide específico por posición
   */
  async loadHeroSlideByPosition(restaurantId: string, position: number): Promise<ApiResult<HeroSlideResponse>> {
    this.setLoadingSlides(true);
    this.clearError();

    try {
      const result = await heroSlidesService.getHeroSlideByPosition(restaurantId, position);

      if (result.success && result.data) {
        this.setLoadingSlides(false);
        return {
          success: true,
          data: result.data
        };
      } else {
        this.setLoadingSlides(false);
        this.setError(result.error || 'Error cargando hero slide');
        
        return {
          success: false,
          error: result.error || 'Error cargando hero slide'
        };
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido cargando hero slide';
      this.setLoadingSlides(false);
      this.setError(errorMessage);
      
      return {
        success: false,
        error: errorMessage
      };
    }
  }

  /**
   * Carga la información de upload para hero slides
   */
  async loadUploadInfo(restaurantId: string, forceReload: boolean = false): Promise<ApiResult<HeroSlidesUploadInfo>> {
    const currentState = this.getCurrentState();
    
    // Verificar cache si no es forzado
    if (!forceReload && currentState.uploadInfo && currentState.lastUpdated.uploadInfo) {
      const timeDiff = Date.now() - currentState.lastUpdated.uploadInfo.getTime();
      if (timeDiff < 5 * 60 * 1000) { // 5 minutos de cache
        return {
          success: true,
          data: currentState.uploadInfo
        };
      }
    }

    this.setLoadingUploadInfo(true);
    this.clearError();

    try {
      const result = await heroSlidesService.getHeroSlidesUploadInfo(restaurantId);

      if (result.success && result.data) {
        this.store.update(state => ({
          ...state,
          uploadInfo: result.data!,
          isLoadingUploadInfo: false,
          lastUpdated: {
            ...state.lastUpdated,
            uploadInfo: new Date()
          },
          error: null
        }));

        return {
          success: true,
          data: result.data
        };
      } else {
        this.setLoadingUploadInfo(false);
        this.setError(result.error || 'Error cargando información de upload');
        
        return {
          success: false,
          error: result.error || 'Error cargando información de upload'
        };
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido cargando información de upload';
      this.setLoadingUploadInfo(false);
      this.setError(errorMessage);
      
      return {
        success: false,
        error: errorMessage
      };
    }
  }

  /**
   * Agrega un nuevo hero slide
   */
  async addHeroSlide(
    restaurantId: string,
    slideData: HeroSlideCreateRequest,
    imageFile: File
  ): Promise<AddHeroSlideResult> {
    if (!this.getCurrentState().isAuthenticated) {
      return {
        success: false,
        error: 'Debes estar autenticado para agregar hero slides'
      };
    }

    this.setAdding(true);
    this.clearAddError();

    try {
      const result = await heroSlidesService.addHeroSlide(restaurantId, slideData, imageFile);

      if (result.success && result.data) {
        // Actualizar cache local
        this.store.update(state => ({
          ...state,
          slides: [...state.slides, result.data!],
          isAdding: false,
          addError: null,
          lastUpdated: {
            ...state.lastUpdated,
            slides: new Date()
          }
        }));

        return {
          success: true,
          slide: result.data
        };
      } else {
        this.setAdding(false);
        this.setAddError(result.error || 'Error agregando hero slide');
        
        return {
          success: false,
          error: result.error || 'Error agregando hero slide'
        };
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido agregando hero slide';
      this.setAdding(false);
      this.setAddError(errorMessage);
      
      return {
        success: false,
        error: errorMessage
      };
    }
  }

  /**
   * Actualiza un hero slide existente por posición
   */
  async updateHeroSlide(
    restaurantId: string,
    slidePosition: number,
    slideData: HeroSlideUpdateRequest,
    imageFile?: File
  ): Promise<UpdateHeroSlideResult> {
    console.log('🔧 updateHeroSlide called with:', { restaurantId, slidePosition, slideData, imageFile });
    
    const currentState = this.getCurrentState();
    console.log('🔧 Current auth state:', currentState.isAuthenticated);
    
    if (!currentState.isAuthenticated) {
      console.error('❌ User not authenticated');
      return {
        success: false,
        error: 'Debes estar autenticado para actualizar hero slides'
      };
    }

    this.setUpdating(true);
    this.clearUpdateError();

    try {
      console.log('🔧 Calling heroSlidesService.updateHeroSlide...');
      const result = await heroSlidesService.updateHeroSlide(restaurantId, slidePosition, slideData, imageFile);

      console.log('🔧 Service result:', result);

      if (result.success && result.data) {
        // Actualizar cache local
        this.store.update(state => ({
          ...state,
          slides: state.slides.map((slide) => 
            slide.position === slidePosition ? result.data! : slide
          ),
          isUpdating: false,
          updateError: null,
          lastUpdated: {
            ...state.lastUpdated,
            slides: new Date()
          }
        }));

        return {
          success: true,
          slide: result.data
        };
      } else {
        this.setUpdating(false);
        this.setUpdateError(result.error || 'Error actualizando hero slide');
        
        return {
          success: false,
          error: result.error || 'Error actualizando hero slide'
        };
      }
    } catch (error) {
      console.error('❌ Error in updateHeroSlide:', error);
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido actualizando hero slide';
      this.setUpdating(false);
      this.setUpdateError(errorMessage);
      
      return {
        success: false,
        error: errorMessage
      };
    }
  }

  /**
   * Elimina un hero slide por posición
   */
  async deleteHeroSlide(restaurantId: string, slidePosition: number): Promise<DeleteHeroSlideResult> {
    if (!this.getCurrentState().isAuthenticated) {
      return {
        success: false,
        error: 'Debes estar autenticado para eliminar hero slides'
      };
    }

    this.setDeleting(true);
    this.clearDeleteError();

    try {
      const result = await heroSlidesService.deleteHeroSlide(restaurantId, slidePosition);

      if (result.success) {
        // Actualizar cache local
        this.store.update(state => ({
          ...state,
          slides: state.slides.filter((slide) => slide.position !== slidePosition),
          isDeleting: false,
          deleteError: null,
          lastUpdated: {
            ...state.lastUpdated,
            slides: new Date()
          }
        }));

        return {
          success: true,
          message: result.data?.message || 'Hero slide eliminado correctamente'
        };
      } else {
        this.setDeleting(false);
        this.setDeleteError(result.error || 'Error eliminando hero slide');
        
        return {
          success: false,
          error: result.error || 'Error eliminando hero slide'
        };
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido eliminando hero slide';
      this.setDeleting(false);
      this.setDeleteError(errorMessage);
      
      return {
        success: false,
        error: errorMessage
      };
    }
  }

  /**
   * Reordena los hero slides por posiciones
   */
  async reorderHeroSlides(restaurantId: string, newPositions: number[]): Promise<ReorderHeroSlidesResult> {
    if (!this.getCurrentState().isAuthenticated) {
      return {
        success: false,
        error: 'Debes estar autenticado para reordenar hero slides'
      };
    }

    this.setReordering(true);
    this.clearReorderError();

    try {
      const result = await heroSlidesService.reorderHeroSlides(restaurantId, newPositions);

      if (result.success && result.data) {
        // Verificar que los datos sean válidos antes de actualizar
        if (result.data.slides && Array.isArray(result.data.slides)) {
          // Actualizar cache local
          this.store.update(state => ({
            ...state,
            slides: result.data!.slides,
            isReordering: false,
            reorderError: null,
            lastUpdated: {
              ...state.lastUpdated,
              slides: new Date()
            }
          }));

          return {
            success: true,
            slides: result.data.slides
          };
        } else {
          console.error('Datos de slides inválidos recibidos del servidor:', result.data);
          this.setReordering(false);
          this.setReorderError('Datos de slides inválidos recibidos del servidor');
          
          return {
            success: false,
            error: 'Datos de slides inválidos recibidos del servidor'
          };
        }
      } else {
        this.setReordering(false);
        this.setReorderError(result.error || 'Error reordenando hero slides');
        
        return {
          success: false,
          error: result.error || 'Error reordenando hero slides'
        };
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido reordenando hero slides';
      console.error('Error en reorderHeroSlides:', error);
      this.setReordering(false);
      this.setReorderError(errorMessage);
      
      return {
        success: false,
        error: errorMessage
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
  ): Promise<BulkUploadHeroSlidesResult> {
    if (!this.getCurrentState().isAuthenticated) {
      return {
        success: false,
        error: 'Debes estar autenticado para agregar hero slides'
      };
    }

    this.setBulkUploading(true);
    this.clearBulkUploadError();

    try {
      const result = await heroSlidesService.addMultipleHeroSlides(restaurantId, slidesData, imageFiles);

      if (result.success && result.data) {
        // Recargar slides después del bulk upload
        await this.loadHeroSlides(restaurantId, true);

        this.setBulkUploading(false);
        this.clearBulkUploadError();

        return {
          success: true,
          result: result.data
        };
      } else {
        this.setBulkUploading(false);
        this.setBulkUploadError(result.error || 'Error agregando múltiples hero slides');
        
        return {
          success: false,
          error: result.error || 'Error agregando múltiples hero slides'
        };
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido agregando múltiples hero slides';
      this.setBulkUploading(false);
      this.setBulkUploadError(errorMessage);
      
      return {
        success: false,
        error: errorMessage
      };
    }
  }

  /**
   * Métodos de utilidad privados
   */
  private setLoadingSlides(isLoading: boolean): void {
    this.store.update(state => ({ ...state, isLoadingSlides: isLoading }));
  }

  private setLoadingUploadInfo(isLoading: boolean): void {
    this.store.update(state => ({ ...state, isLoadingUploadInfo: isLoading }));
  }

  private setAdding(isAdding: boolean): void {
    this.store.update(state => ({ ...state, isAdding }));
  }

  private setUpdating(isUpdating: boolean): void {
    this.store.update(state => ({ ...state, isUpdating }));
  }

  private setDeleting(isDeleting: boolean): void {
    this.store.update(state => ({ ...state, isDeleting }));
  }

  private setReordering(isReordering: boolean): void {
    this.store.update(state => ({ ...state, isReordering }));
  }

  private setBulkUploading(isBulkUploading: boolean): void {
    this.store.update(state => ({ ...state, isBulkUploading }));
  }

  private setError(error: string | null): void {
    this.store.update(state => ({ ...state, error }));
  }

  private setAddError(error: string | null): void {
    this.store.update(state => ({ ...state, addError: error }));
  }

  private setUpdateError(error: string | null): void {
    this.store.update(state => ({ ...state, updateError: error }));
  }

  private setDeleteError(error: string | null): void {
    this.store.update(state => ({ ...state, deleteError: error }));
  }

  private setReorderError(error: string | null): void {
    this.store.update(state => ({ ...state, reorderError: error }));
  }

  private setBulkUploadError(error: string | null): void {
    this.store.update(state => ({ ...state, bulkUploadError: error }));
  }

  private clearError(): void {
    this.setError(null);
  }

  private clearAddError(): void {
    this.setAddError(null);
  }

  private clearUpdateError(): void {
    this.setUpdateError(null);
  }

  private clearDeleteError(): void {
    this.setDeleteError(null);
  }

  private clearReorderError(): void {
    this.setReorderError(null);
  }

  private clearBulkUploadError(): void {
    this.setBulkUploadError(null);
  }

  /**
   * Limpia los datos del store
   */
  private clearData(): void {
    this.store.update(state => ({
      ...state,
      slides: [],
      uploadInfo: null,
      lastUpdated: {
        slides: null,
        uploadInfo: null
      }
    }));
  }

  /**
   * Limpia todo el cache
   */
  clearCache(): void {
    this.store.update(state => ({
      ...state,
      slides: [],
      uploadInfo: null,
      lastUpdated: {
        slides: null,
        uploadInfo: null
      }
    }));
  }

  /**
   * Limpia todos los errores
   */
  clearAllErrors(): void {
    this.store.update(state => ({
      ...state,
      error: null,
      addError: null,
      updateError: null,
      deleteError: null,
      reorderError: null,
      bulkUploadError: null
    }));
  }

  /**
   * Obtiene el estado actual (para uso en funciones)
   */
  getCurrentState(): HeroSlidesState {
    let currentState: HeroSlidesState;
    this.store.subscribe(state => {
      currentState = state;
    })();
    return currentState!;
  }

  /**
   * Stores derivados para casos específicos
   */
  getSlidesCount(): Readable<number> {
    return derived(this.store, $state => $state.slides.length);
  }

  getCanAddMore(): Readable<boolean> {
    return derived(this.store, $state => {
      if (!$state.uploadInfo) return false;
      return $state.uploadInfo.availableSlots > 0;
    });
  }

  getAvailableSlots(): Readable<number> {
    return derived(this.store, $state => {
      if (!$state.uploadInfo) return 0;
      return $state.uploadInfo.availableSlots;
    });
  }

  /**
   * Obtiene slides ordenados por posición
   */
  getSlidesOrderedByPosition(): Readable<HeroSlideResponse[]> {
    return derived(this.store, $state => {
      console.log('🔧 getSlidesOrderedByPosition called, state.slides:', $state.slides);
      
      // Asegurar que slides sea un array válido
      if (!$state.slides || !Array.isArray($state.slides)) {
        console.warn('🔧 slides is not a valid array, returning empty array');
        return [];
      }
      
      const orderedSlides = [...$state.slides].sort((a, b) => a.position - b.position);
      console.log('🔧 Ordered slides:', orderedSlides);
      return orderedSlides;
    });
  }

  /**
   * Obtiene un slide específico por posición
   */
  getSlideByPosition(position: number): Readable<HeroSlideResponse | undefined> {
    return derived(this.store, $state => 
      $state.slides.find(slide => slide.position === position)
    );
  }

  /**
   * Utilidades para compatibilidad con el sistema anterior
   */
  utils = {
    /**
     * Convierte posición a índice para compatibilidad
     */
    positionToIndex: (position: number): number => {
      return position; // En el nuevo sistema, posición e índice son lo mismo
    },

    /**
     * Convierte índice a posición para compatibilidad
     */
    indexToPosition: (index: number): number => {
      return index; // En el nuevo sistema, índice y posición son lo mismo
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

/**
 * Instancia única del store de hero slides
 */
export const heroSlidesStore = new HeroSlidesStore();

// Exports individuales para compatibilidad
export const heroSlidesLoading = heroSlidesStore.isLoading;
export const heroSlidesLoadingSlides = heroSlidesStore.isLoadingSlides;
export const heroSlidesLoadingUploadInfo = heroSlidesStore.isLoadingUploadInfo;
export const heroSlidesAdding = heroSlidesStore.isAdding;
export const heroSlidesUpdating = heroSlidesStore.isUpdating;
export const heroSlidesDeleting = heroSlidesStore.isDeleting;
export const heroSlidesReordering = heroSlidesStore.isReordering;
export const heroSlidesBulkUploading = heroSlidesStore.isBulkUploading;
export const heroSlidesError = heroSlidesStore.error;
export const heroSlidesAddError = heroSlidesStore.addError;
export const heroSlidesUpdateError = heroSlidesStore.updateError;
export const heroSlidesDeleteError = heroSlidesStore.deleteError;
export const heroSlidesReorderError = heroSlidesStore.reorderError;
export const heroSlidesBulkUploadError = heroSlidesStore.bulkUploadError;
export const heroSlides = heroSlidesStore.slides;
export const heroSlidesUploadInfo = heroSlidesStore.uploadInfo;
export const heroSlidesIsAuthenticated = heroSlidesStore.isAuthenticated;

/**
 * Hook personalizado para usar en componentes Svelte
 */
export function useHeroSlides() {
  return {
    // Estado general
    slides: heroSlidesStore.slides,
    uploadInfo: heroSlidesStore.uploadInfo,
    isLoading: heroSlidesStore.isLoading,
    isLoadingSlides: heroSlidesStore.isLoadingSlides,
    isLoadingUploadInfo: heroSlidesStore.isLoadingUploadInfo,
    isAdding: heroSlidesStore.isAdding,
    isUpdating: heroSlidesStore.isUpdating,
    isDeleting: heroSlidesStore.isDeleting,
    isReordering: heroSlidesStore.isReordering,
    isBulkUploading: heroSlidesStore.isBulkUploading,
    
    // Errores como stores reactivos
    error: heroSlidesStore.error,
    addError: heroSlidesStore.addError,
    updateError: heroSlidesStore.updateError,
    deleteError: heroSlidesStore.deleteError,
    reorderError: heroSlidesStore.reorderError,
    bulkUploadError: heroSlidesStore.bulkUploadError,
    
    // Otros stores
    isAuthenticated: heroSlidesStore.isAuthenticated,
    slidesCount: heroSlidesStore.getSlidesCount(),
    canAddMore: heroSlidesStore.getCanAddMore(),
    availableSlots: heroSlidesStore.getAvailableSlots(),
    slidesOrderedByPosition: heroSlidesStore.getSlidesOrderedByPosition(),
    
    // Métodos
    loadHeroSlides: heroSlidesStore.loadHeroSlides.bind(heroSlidesStore),
    loadHeroSlideByPosition: heroSlidesStore.loadHeroSlideByPosition.bind(heroSlidesStore),
    loadUploadInfo: heroSlidesStore.loadUploadInfo.bind(heroSlidesStore),
    addHeroSlide: heroSlidesStore.addHeroSlide.bind(heroSlidesStore),
    updateHeroSlide: heroSlidesStore.updateHeroSlide.bind(heroSlidesStore),
    deleteHeroSlide: heroSlidesStore.deleteHeroSlide.bind(heroSlidesStore),
    reorderHeroSlides: heroSlidesStore.reorderHeroSlides.bind(heroSlidesStore),
    addMultipleHeroSlides: heroSlidesStore.addMultipleHeroSlides.bind(heroSlidesStore),
    clearCache: heroSlidesStore.clearCache.bind(heroSlidesStore),
    clearAllErrors: heroSlidesStore.clearAllErrors.bind(heroSlidesStore),
    
    // Utilidades
    utils: heroSlidesStore.utils
  };
}

// Default export
export default heroSlidesStore; 