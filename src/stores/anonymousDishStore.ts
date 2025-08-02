// src/stores/anonymousDishStore.ts

import { writable, derived, type Writable, type Readable } from 'svelte/store';
import { 
   
  type ApiResult,
  type AnonymousDishCreateRequest,
  type AnonymousDishUpdateRequest,
  type AnonymousDish,
  type AnonymousDishesResponse
} from '../interfaces/anonymousRestaurant';
// import type { AnonymousDish } from '../interfaces/anonymousRestaurant';
import { anonymousDishService } from '../services/anonymousDishService.ts';

// Types para el estado de platillos anónimos
export interface AnonymousDishesState {
  // Platillos anónimos en cache
  allAnonymousDishes: AnonymousDish[];
  currentAnonymousDish: AnonymousDish | null;
  
  // Estados de carga
  isLoading: boolean;
  isLoadingAll: boolean;
  isLoadingCurrent: boolean;
  isCreating: boolean;
  isUpdating: boolean;
  isDeleting: boolean;
  isUploadingImage: boolean;
  
  // Filtros y paginación
  currentFilters: {
    categoryId?: string;
    search?: string;
    limit?: number;
    page?: number;
  };
  
  // Errores
  error: string | null;
  createError: string | null;
  updateError: string | null;
  deleteError: string | null;
  imageError: string | null;
  
  // Cache metadata
  lastUpdated: {
    all: Date | null;
    current: Date | null;
  };
  
  // Device ID
  deviceId: string | null;
}

// Types para resultados de acciones
export interface CreateAnonymousDishResult {
  success: boolean;
  dish?: AnonymousDish;
  error?: string;
}

export interface UpdateAnonymousDishResult {
  success: boolean;
  dish?: AnonymousDish;
  error?: string;
}

export interface DeleteAnonymousDishResult {
  success: boolean;
  message?: string;
  error?: string;
}

export interface UploadImageResult {
  success: boolean;
  imageUrl?: string;
  error?: string;
}

/**
 * Estado inicial del store
 */
const initialState: AnonymousDishesState = {
  allAnonymousDishes: [],
  currentAnonymousDish: null,
  isLoading: false,
  isLoadingAll: false,
  isLoadingCurrent: false,
  isCreating: false,
  isUpdating: false,
  isDeleting: false,
  isUploadingImage: false,
  currentFilters: {},
  error: null,
  createError: null,
  updateError: null,
  deleteError: null,
  imageError: null,
  lastUpdated: {
    all: null,
    current: null
  },
  deviceId: null
};

/**
 * Store para manejar platillos anónimos
 */
class AnonymousDishStore {
  private store: Writable<AnonymousDishesState>;
  
  // Exponer el subscribe del store
  public readonly subscribe: Writable<AnonymousDishesState>['subscribe'];
  
  // Stores derivados para estados de carga
  public readonly isLoading: Readable<boolean>;
  public readonly isLoadingAll: Readable<boolean>;
  public readonly isLoadingCurrent: Readable<boolean>;
  public readonly isCreating: Readable<boolean>;
  public readonly isUpdating: Readable<boolean>;
  public readonly isDeleting: Readable<boolean>;
  public readonly isUploadingImage: Readable<boolean>;
  
  // Stores derivados para errores
  public readonly error: Readable<string | null>;
  public readonly createError: Readable<string | null>;
  public readonly updateError: Readable<string | null>;
  public readonly deleteError: Readable<string | null>;
  public readonly imageError: Readable<string | null>;
  
  // Stores derivados para datos
  public readonly allAnonymousDishes: Readable<AnonymousDish[]>;
  public readonly currentAnonymousDish: Readable<AnonymousDish | null>;
  public readonly deviceId: Readable<string | null>;
  
  // Stores derivados para utilidades
  public readonly dishesCount: Readable<number>;
  public readonly dishesByPrice: Readable<AnonymousDish[]>;
  public readonly dishesByName: Readable<AnonymousDish[]>;
  public readonly dishesInStock: Readable<AnonymousDish[]>;
  public readonly dishesOutOfStock: Readable<AnonymousDish[]>;
  public readonly averagePrice: Readable<number>;
  public readonly mostExpensiveDish: Readable<AnonymousDish | null>;
  public readonly cheapestDish: Readable<AnonymousDish | null>;

  constructor() {
    this.store = writable(initialState);
    this.subscribe = this.store.subscribe;

    // Stores derivados para estados de carga
    this.isLoading = derived(this.store, ($state) => $state.isLoading);
    this.isLoadingAll = derived(this.store, ($state) => $state.isLoadingAll);
    this.isLoadingCurrent = derived(this.store, ($state) => $state.isLoadingCurrent);
    this.isCreating = derived(this.store, ($state) => $state.isCreating);
    this.isUpdating = derived(this.store, ($state) => $state.isUpdating);
    this.isDeleting = derived(this.store, ($state) => $state.isDeleting);
    this.isUploadingImage = derived(this.store, ($state) => $state.isUploadingImage);

    // Stores derivados para errores
    this.error = derived(this.store, ($state) => $state.error);
    this.createError = derived(this.store, ($state) => $state.createError);
    this.updateError = derived(this.store, ($state) => $state.updateError);
    this.deleteError = derived(this.store, ($state) => $state.deleteError);
    this.imageError = derived(this.store, ($state) => $state.imageError);

    // Stores derivados para datos
    this.allAnonymousDishes = derived(this.store, ($state) => $state.allAnonymousDishes);
    this.currentAnonymousDish = derived(this.store, ($state) => $state.currentAnonymousDish);
    this.deviceId = derived(this.store, ($state) => $state.deviceId);

    // Stores derivados para utilidades
    this.dishesCount = derived(this.store, ($state) => $state.allAnonymousDishes.length);
    this.dishesByPrice = derived(this.store, ($state) => 
      anonymousDishService.utils.sortDishesByPrice($state.allAnonymousDishes, true)
    );
    this.dishesByName = derived(this.store, ($state) => 
      anonymousDishService.utils.sortDishesByName($state.allAnonymousDishes, true)
    );
    this.dishesInStock = derived(this.store, ($state) => 
      $state.allAnonymousDishes.filter(dish => anonymousDishService.utils.isInStock(dish))
    );
    this.dishesOutOfStock = derived(this.store, ($state) => 
      $state.allAnonymousDishes.filter(dish => !anonymousDishService.utils.isInStock(dish))
    );
    this.averagePrice = derived(this.store, ($state) => 
      anonymousDishService.utils.calculateAveragePrice($state.allAnonymousDishes)
    );
    this.mostExpensiveDish = derived(this.store, ($state) => 
      anonymousDishService.utils.getMostExpensiveDish($state.allAnonymousDishes)
    );
    this.cheapestDish = derived(this.store, ($state) => 
      anonymousDishService.utils.getCheapestDish($state.allAnonymousDishes)
    );
  }

  /**
   * Carga todos los platillos anónimos del dispositivo actual
   */
  async loadAllAnonymousDishes(
    params?: {
      categoryId?: string;
      limit?: number;
      page?: number;
      search?: string;
    },
    forceReload: boolean = false
  ): Promise<ApiResult<AnonymousDish[]>> {
    try {
      const state = this.getCurrentState();
      
      // Verificar cache si no se fuerza recarga
      if (!forceReload && state.allAnonymousDishes.length > 0 && state.lastUpdated.all) {
        const cacheAge = Date.now() - state.lastUpdated.all.getTime();
        if (cacheAge < 5 * 60 * 1000) { // 5 minutos
          console.log('📦 Usando cache de platillos anónimos');
          return {
            success: true,
            data: state.allAnonymousDishes
          };
        }
      }

      this.setLoadingAll(true);
      this.clearError();

      const result = await anonymousDishService.getAnonymousDishesByDevice(params);

      if (result.success) {
        this.store.update(state => ({
          ...state,
          allAnonymousDishes: result.data!.dishes,
          currentFilters: params || {},
          lastUpdated: {
            ...state.lastUpdated,
            all: new Date()
          }
        }));
      } else {
        this.setError(result.error || 'Error cargando platillos anónimos');
      }

      this.setLoadingAll(false);
      return result! as unknown as ApiResult<AnonymousDish[]>;
    } catch (error) {
      this.setLoadingAll(false);
      this.setError(error instanceof Error ? error.message : 'Error desconocido');
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido'
      };
    }
  }

  /**
   * Crea un nuevo platillo anónimo
   */
  async createAnonymousDish(
    dishData: AnonymousDishCreateRequest,
    image?: File
  ): Promise<CreateAnonymousDishResult> {
    try {
      this.setCreating(true);
      this.clearCreateError();

      const result = await anonymousDishService.createAnonymousDish(dishData, image);

      if (result.success) {
        // Agregar el nuevo platillo al cache
        this.store.update(state => ({
          ...state,
          allAnonymousDishes: [...state.allAnonymousDishes, result.data!],
          currentAnonymousDish: result.data!
        }));
      } else {
        this.setCreateError(result.error || 'Error creando platillo anónimo');
      }

      this.setCreating(false);
      return {
        success: result.success,
        dish: result.data,
        error: result.error
      };
    } catch (error) {
      this.setCreating(false);
      this.setCreateError(error instanceof Error ? error.message : 'Error desconocido');
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido'
      };
    }
  }

  /**
   * Obtiene un platillo anónimo por su ID
   */
  async getAnonymousDish(dishId: string): Promise<ApiResult<AnonymousDish>> {
    try {
      this.setLoadingCurrent(true);
      this.clearError();

      const result = await anonymousDishService.getAnonymousDish(dishId);

      if (result.success) {
        this.store.update(state => ({
          ...state,
          currentAnonymousDish: result.data!,
          lastUpdated: {
            ...state.lastUpdated,
            current: new Date()
          }
        }));
      } else {
        this.setError(result.error || 'Error obteniendo platillo anónimo');
      }

      this.setLoadingCurrent(false);
      return result;
    } catch (error) {
      this.setLoadingCurrent(false);
      this.setError(error instanceof Error ? error.message : 'Error desconocido');
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido'
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
  ): Promise<UpdateAnonymousDishResult> {
    try {
      this.setUpdating(true);
      this.clearUpdateError();

      const result = await anonymousDishService.updateAnonymousDish(dishId, dishData, image);

      if (result.success) {
        // Actualizar el platillo en el cache
        this.store.update(state => ({
          ...state,
          allAnonymousDishes: state.allAnonymousDishes.map(d => 
            d.id === dishId ? result.data! : d
          ),
          currentAnonymousDish: state.currentAnonymousDish?.id === dishId 
            ? result.data! 
            : state.currentAnonymousDish
        }));
      } else {
        this.setUpdateError(result.error || 'Error actualizando platillo anónimo');
      }

      this.setUpdating(false);
      return {
        success: result.success,
        dish: result.data,
        error: result.error
      };
    } catch (error) {
      this.setUpdating(false);
      this.setUpdateError(error instanceof Error ? error.message : 'Error desconocido');
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido'
      };
    }
  }

  /**
   * Elimina un platillo anónimo
   */
  async deleteAnonymousDish(dishId: string): Promise<DeleteAnonymousDishResult> {
    try {
      this.setDeleting(true);
      this.clearDeleteError();

      const result = await anonymousDishService.deleteAnonymousDish(dishId);

      if (result.success) {
        // Remover el platillo del cache
        this.store.update(state => ({
          ...state,
          allAnonymousDishes: state.allAnonymousDishes.filter(d => d.id !== dishId),
          currentAnonymousDish: state.currentAnonymousDish?.id === dishId 
            ? null 
            : state.currentAnonymousDish
        }));
      } else {
        this.setDeleteError(result.error || 'Error eliminando platillo anónimo');
      }

      this.setDeleting(false);
      return {
        success: result.success,
        message: result.data?.message,
        error: result.error
      };
    } catch (error) {
      this.setDeleting(false);
      this.setDeleteError(error instanceof Error ? error.message : 'Error desconocido');
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido'
      };
    }
  }

  /**
   * Sube una imagen para un platillo anónimo
   */
  async uploadAnonymousDishImage(
    dishId: string,
    imageFile: File
  ): Promise<UploadImageResult> {
    try {
      this.setUploadingImage(true);
      this.clearImageError();

      const result = await anonymousDishService.uploadAnonymousDishImage(dishId, imageFile);

      if (result.success) {
        // Actualizar el platillo en el cache con la nueva imagen
        this.store.update(state => ({
          ...state,
          allAnonymousDishes: state.allAnonymousDishes.map(d => 
            d.id === dishId ? { ...d, image: result.data!.image_url } : d
          ),
          currentAnonymousDish: state.currentAnonymousDish?.id === dishId 
            ? { ...state.currentAnonymousDish, image: result.data!.image_url }
            : state.currentAnonymousDish
        }));
      } else {
        this.setImageError(result.error || 'Error subiendo imagen');
      }

      this.setUploadingImage(false);
      return {
        success: result.success,
        imageUrl: result.data?.image_url,
        error: result.error
      };
    } catch (error) {
      this.setUploadingImage(false);
      this.setImageError(error instanceof Error ? error.message : 'Error desconocido');
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido'
      };
    }
  }

  // Métodos privados para actualizar estados
  private setLoadingAll(isLoading: boolean): void {
    this.store.update(state => ({ ...state, isLoadingAll: isLoading }));
  }

  private setLoadingCurrent(isLoading: boolean): void {
    this.store.update(state => ({ ...state, isLoadingCurrent: isLoading }));
  }

  private setCreating(isCreating: boolean): void {
    this.store.update(state => ({ ...state, isCreating }));
  }

  private setUpdating(isUpdating: boolean): void {
    this.store.update(state => ({ ...state, isUpdating }));
  }

  private setDeleting(isDeleting: boolean): void {
    this.store.update(state => ({ ...state, isDeleting }));
  }

  private setUploadingImage(isUploading: boolean): void {
    this.store.update(state => ({ ...state, isUploadingImage: isUploading }));
  }

  private setCurrentAnonymousDish(dish: AnonymousDish | null): void {
    this.store.update(state => ({ ...state, currentAnonymousDish: dish }));
  }

  private setError(error: string | null): void {
    this.store.update(state => ({ ...state, error }));
  }

  private setCreateError(error: string | null): void {
    this.store.update(state => ({ ...state, createError: error }));
  }

  private setUpdateError(error: string | null): void {
    this.store.update(state => ({ ...state, updateError: error }));
  }

  private setDeleteError(error: string | null): void {
    this.store.update(state => ({ ...state, deleteError: error }));
  }

  private setImageError(error: string | null): void {
    this.store.update(state => ({ ...state, imageError: error }));
  }

  private clearError(): void {
    this.setError(null);
  }

  private clearCreateError(): void {
    this.setCreateError(null);
  }

  private clearUpdateError(): void {
    this.setUpdateError(null);
  }

  private clearDeleteError(): void {
    this.setDeleteError(null);
  }

  private clearImageError(): void {
    this.setImageError(null);
  }

  // Métodos públicos para limpiar datos
  clearCache(): void {
    this.store.update(state => ({
      ...state,
      allAnonymousDishes: [],
      currentAnonymousDish: null,
      lastUpdated: {
        all: null,
        current: null
      }
    }));
  }

  clearAllErrors(): void {
    this.store.update(state => ({
      ...state,
      error: null,
      createError: null,
      updateError: null,
      deleteError: null,
      imageError: null
    }));
  }

  // Métodos públicos para obtener estado actual
  getCurrentState(): AnonymousDishesState {
    let state: AnonymousDishesState;
    this.store.subscribe(s => state = s)();
    return state!;
  }

  getIsLoading(): boolean {
    let isLoading: boolean;
    this.isLoading.subscribe(i => isLoading = i)();
    return isLoading!;
  }

  getError(): string | null {
    let error: string | null;
    this.error.subscribe(e => error = e)();
    return error!;
  }

  getAllAnonymousDishes(): AnonymousDish[] {
    let dishes: AnonymousDish[];
    this.allAnonymousDishes.subscribe(d => dishes = d)();
    return dishes!;
  }

  getCurrentAnonymousDish(): AnonymousDish | null {
    let dish: AnonymousDish | null;
    this.currentAnonymousDish.subscribe(d => dish = d)();
    return dish!;
  }

  // Stores derivados para utilidades
  getAnonymousDishById(dishId: string): Readable<AnonymousDish | null> {
    return derived(this.allAnonymousDishes, (dishes) => 
      dishes.find(d => d.id === dishId) || null
    );
  }

  getAnonymousDishesCount(): Readable<number> {
    return derived(this.allAnonymousDishes, (dishes) => dishes.length);
  }

  getDishesByCategory(categoryId: string): Readable<AnonymousDish[]> {
    return derived(this.allAnonymousDishes, (dishes) => 
      anonymousDishService.utils.filterDishesByCategory(dishes, categoryId)
    );
  }

  searchDishes(searchTerm: string): Readable<AnonymousDish[]> {
    return derived(this.allAnonymousDishes, (dishes) => 
      anonymousDishService.utils.searchDishes(dishes, searchTerm)
    );
  }

  getDishesByPriceRange(minPrice: number, maxPrice: number): Readable<AnonymousDish[]> {
    return derived(this.allAnonymousDishes, (dishes) => 
      dishes.filter(dish => dish.price >= minPrice && dish.price <= maxPrice)
    );
  }

  getDishesOnSale(): Readable<AnonymousDish[]> {
    return derived(this.allAnonymousDishes, (dishes) => 
      anonymousDishService.utils.getDishesOnSale(dishes)
    );
  }
}

// Crear y exportar una instancia única del store
export const anonymousDishStore = new AnonymousDishStore();

// Hook para usar el store en componentes
export function useAnonymousDishes() {
  return {
    // Estados de carga
    isLoading: anonymousDishStore.isLoading,
    isLoadingAll: anonymousDishStore.isLoadingAll,
    isLoadingCurrent: anonymousDishStore.isLoadingCurrent,
    isCreating: anonymousDishStore.isCreating,
    isUpdating: anonymousDishStore.isUpdating,
    isDeleting: anonymousDishStore.isDeleting,
    isUploadingImage: anonymousDishStore.isUploadingImage,
    
    // Errores
    error: anonymousDishStore.error,
    createError: anonymousDishStore.createError,
    updateError: anonymousDishStore.updateError,
    deleteError: anonymousDishStore.deleteError,
    imageError: anonymousDishStore.imageError,
    
    // Datos
    allAnonymousDishes: anonymousDishStore.allAnonymousDishes,
    currentAnonymousDish: anonymousDishStore.currentAnonymousDish,
    deviceId: anonymousDishStore.deviceId,
    
    // Utilidades
    dishesCount: anonymousDishStore.dishesCount,
    dishesByPrice: anonymousDishStore.dishesByPrice,
    dishesByName: anonymousDishStore.dishesByName,
    dishesInStock: anonymousDishStore.dishesInStock,
    dishesOutOfStock: anonymousDishStore.dishesOutOfStock,
    averagePrice: anonymousDishStore.averagePrice,
    mostExpensiveDish: anonymousDishStore.mostExpensiveDish,
    cheapestDish: anonymousDishStore.cheapestDish,
    
    // Métodos
    loadAllAnonymousDishes: anonymousDishStore.loadAllAnonymousDishes.bind(anonymousDishStore),
    createAnonymousDish: anonymousDishStore.createAnonymousDish.bind(anonymousDishStore),
    getAnonymousDish: anonymousDishStore.getAnonymousDish.bind(anonymousDishStore),
    updateAnonymousDish: anonymousDishStore.updateAnonymousDish.bind(anonymousDishStore),
    deleteAnonymousDish: anonymousDishStore.deleteAnonymousDish.bind(anonymousDishStore),
    uploadAnonymousDishImage: anonymousDishStore.uploadAnonymousDishImage.bind(anonymousDishStore),
    clearCache: anonymousDishStore.clearCache.bind(anonymousDishStore),
    clearAllErrors: anonymousDishStore.clearAllErrors.bind(anonymousDishStore),
    
    // Stores derivados
    getAnonymousDishById: anonymousDishStore.getAnonymousDishById.bind(anonymousDishStore),
    getAnonymousDishesCount: anonymousDishStore.getAnonymousDishesCount.bind(anonymousDishStore),
    getDishesByCategory: anonymousDishStore.getDishesByCategory.bind(anonymousDishStore),
    searchDishes: anonymousDishStore.searchDishes.bind(anonymousDishStore),
    getDishesByPriceRange: anonymousDishStore.getDishesByPriceRange.bind(anonymousDishStore),
    getDishesOnSale: anonymousDishStore.getDishesOnSale.bind(anonymousDishStore)
  };
}

export default anonymousDishStore; 