// src/stores/anonymousServicesStore.ts

import { writable, derived, type Writable, type Readable } from 'svelte/store';
import { 
  AnonymousServicesManager,
  type ApiResult,
  type AnonymousRestaurantCreateRequest,
  type AnonymousRestaurant,
  type AnonymousCategoryCreateRequest,
  type AnonymousCategory,
  type AnonymousDishCreateRequest,
  type AnonymousDish,
  type RestaurantClaimRequest,
  type RestaurantClaimResponse
} from '../services/anonymousServices';
import type { 
  AnonymousRestaurant, 
  AnonymousCategory, 
  AnonymousDish 
} from '../interfaces/anonymousRestaurant';

// Types para el estado unificado de servicios anónimos
export interface AnonymousServicesState {
  // Datos anónimos en cache
  restaurants: AnonymousRestaurant[];
  categories: AnonymousCategory[];
  dishes: AnonymousDish[];
  
  // Estados de carga
  isLoading: boolean;
  isLoadingAll: boolean;
  isCreatingRestaurant: boolean;
  isCreatingCategory: boolean;
  isCreatingDish: boolean;
  isClaiming: boolean;
  
  // Estados específicos
  isCreatingComplete: boolean;
  isClearingData: boolean;
  isGettingStats: boolean;
  
  // Errores
  error: string | null;
  createRestaurantError: string | null;
  createCategoryError: string | null;
  createDishError: string | null;
  claimError: string | null;
  clearDataError: string | null;
  statsError: string | null;
  
  // Cache metadata
  lastUpdated: {
    restaurants: Date | null;
    categories: Date | null;
    dishes: Date | null;
    all: Date | null;
  };
  
  // Device ID
  deviceId: string | null;
  
  // Estadísticas
  stats: {
    total_restaurants: number;
    active_restaurants: number;
    expired_restaurants: number;
    claimed_restaurants: number;
    total_categories: number;
    total_dishes: number;
    average_dishes_per_category: number;
  } | null;
}

// Types para resultados de acciones
export interface CreateCompleteRestaurantResult {
  success: boolean;
  data?: {
    restaurant: AnonymousRestaurant;
    categories: AnonymousCategory[];
    dishes: AnonymousDish[];
    claim_code: string;
    expires_at: string;
    days_remaining: number;
  };
  error?: string;
}

export interface GetAllAnonymousDataResult {
  success: boolean;
  data?: {
    restaurants: AnonymousRestaurant[];
    categories: AnonymousCategory[];
    dishes: AnonymousDish[];
  };
  error?: string;
}

export interface ClearAllAnonymousDataResult {
  success: boolean;
  data?: {
    message: string;
    deleted_dishes: number;
    deleted_categories: number;
  };
  error?: string;
}

export interface GetAnonymousDataStatsResult {
  success: boolean;
  data?: {
    total_restaurants: number;
    active_restaurants: number;
    expired_restaurants: number;
    claimed_restaurants: number;
    total_categories: number;
    total_dishes: number;
    average_dishes_per_category: number;
  };
  error?: string;
}

/**
 * Estado inicial del store
 */
const initialState: AnonymousServicesState = {
  restaurants: [],
  categories: [],
  dishes: [],
  isLoading: false,
  isLoadingAll: false,
  isCreatingRestaurant: false,
  isCreatingCategory: false,
  isCreatingDish: false,
  isClaiming: false,
  isCreatingComplete: false,
  isClearingData: false,
  isGettingStats: false,
  error: null,
  createRestaurantError: null,
  createCategoryError: null,
  createDishError: null,
  claimError: null,
  clearDataError: null,
  statsError: null,
  lastUpdated: {
    restaurants: null,
    categories: null,
    dishes: null,
    all: null
  },
  deviceId: null,
  stats: null
};

/**
 * Store unificado para manejar todos los servicios anónimos
 */
class AnonymousServicesStore {
  private store: Writable<AnonymousServicesState>;
  
  // Exponer el subscribe del store
  public readonly subscribe: Writable<AnonymousServicesState>['subscribe'];
  
  // Stores derivados para estados de carga
  public readonly isLoading: Readable<boolean>;
  public readonly isLoadingAll: Readable<boolean>;
  public readonly isCreatingRestaurant: Readable<boolean>;
  public readonly isCreatingCategory: Readable<boolean>;
  public readonly isCreatingDish: Readable<boolean>;
  public readonly isClaiming: Readable<boolean>;
  public readonly isCreatingComplete: Readable<boolean>;
  public readonly isClearingData: Readable<boolean>;
  public readonly isGettingStats: Readable<boolean>;
  
  // Stores derivados para errores
  public readonly error: Readable<string | null>;
  public readonly createRestaurantError: Readable<string | null>;
  public readonly createCategoryError: Readable<string | null>;
  public readonly createDishError: Readable<string | null>;
  public readonly claimError: Readable<string | null>;
  public readonly clearDataError: Readable<string | null>;
  public readonly statsError: Readable<string | null>;
  
  // Stores derivados para datos
  public readonly restaurants: Readable<AnonymousRestaurant[]>;
  public readonly categories: Readable<AnonymousCategory[]>;
  public readonly dishes: Readable<AnonymousDish[]>;
  public readonly deviceId: Readable<string | null>;
  public readonly stats: Readable<any>;
  
  // Stores derivados para utilidades
  public readonly activeRestaurants: Readable<AnonymousRestaurant[]>;
  public readonly expiredRestaurants: Readable<AnonymousRestaurant[]>;
  public readonly claimedRestaurants: Readable<AnonymousRestaurant[]>;
  public readonly sortedCategories: Readable<AnonymousCategory[]>;
  public readonly dishesInStock: Readable<AnonymousDish[]>;
  public readonly dishesOutOfStock: Readable<AnonymousDish[]>;
  public readonly averagePrice: Readable<number>;
  public readonly totalItems: Readable<number>;
  public readonly hasPendingData: Readable<boolean>;

  constructor() {
    this.store = writable(initialState);
    this.subscribe = this.store.subscribe;

    // Stores derivados para estados de carga
    this.isLoading = derived(this.store, ($state) => $state.isLoading);
    this.isLoadingAll = derived(this.store, ($state) => $state.isLoadingAll);
    this.isCreatingRestaurant = derived(this.store, ($state) => $state.isCreatingRestaurant);
    this.isCreatingCategory = derived(this.store, ($state) => $state.isCreatingCategory);
    this.isCreatingDish = derived(this.store, ($state) => $state.isCreatingDish);
    this.isClaiming = derived(this.store, ($state) => $state.isClaiming);
    this.isCreatingComplete = derived(this.store, ($state) => $state.isCreatingComplete);
    this.isClearingData = derived(this.store, ($state) => $state.isClearingData);
    this.isGettingStats = derived(this.store, ($state) => $state.isGettingStats);

    // Stores derivados para errores
    this.error = derived(this.store, ($state) => $state.error);
    this.createRestaurantError = derived(this.store, ($state) => $state.createRestaurantError);
    this.createCategoryError = derived(this.store, ($state) => $state.createCategoryError);
    this.createDishError = derived(this.store, ($state) => $state.createDishError);
    this.claimError = derived(this.store, ($state) => $state.claimError);
    this.clearDataError = derived(this.store, ($state) => $state.clearDataError);
    this.statsError = derived(this.store, ($state) => $state.statsError);

    // Stores derivados para datos
    this.restaurants = derived(this.store, ($state) => $state.restaurants);
    this.categories = derived(this.store, ($state) => $state.categories);
    this.dishes = derived(this.store, ($state) => $state.dishes);
    this.deviceId = derived(this.store, ($state) => $state.deviceId);
    this.stats = derived(this.store, ($state) => $state.stats);

    // Stores derivados para utilidades
    this.activeRestaurants = derived(this.store, ($state) => 
      $state.restaurants.filter(r => r.days_remaining > 0 && !r.is_claimed)
    );
    this.expiredRestaurants = derived(this.store, ($state) => 
      $state.restaurants.filter(r => r.days_remaining <= 0)
    );
    this.claimedRestaurants = derived(this.store, ($state) => 
      $state.restaurants.filter(r => r.is_claimed)
    );
    this.sortedCategories = derived(this.store, ($state) => 
      [...$state.categories].sort((a, b) => (a.order || 0) - (b.order || 0))
    );
    this.dishesInStock = derived(this.store, ($state) => 
      $state.dishes.filter(dish => dish.inStock !== false)
    );
    this.dishesOutOfStock = derived(this.store, ($state) => 
      $state.dishes.filter(dish => dish.inStock === false)
    );
    this.averagePrice = derived(this.store, ($state) => {
      if ($state.dishes.length === 0) return 0;
      const total = $state.dishes.reduce((sum, dish) => sum + dish.price, 0);
      return total / $state.dishes.length;
    });
    this.totalItems = derived(this.store, ($state) => 
      $state.restaurants.length + $state.categories.length + $state.dishes.length
    );
    this.hasPendingData = derived(this.store, ($state) => 
      $state.restaurants.some(r => r.days_remaining > 0 && !r.is_claimed)
    );
  }

  /**
   * Crea un restaurante anónimo completo con categorías y platillos
   */
  async createCompleteAnonymousRestaurant(
    restaurantData: AnonymousRestaurantCreateRequest,
    categories: AnonymousCategoryCreateRequest[],
    dishes: AnonymousDishCreateRequest[],
    images?: {
      image?: File;
      logo?: File;
      profile_image?: File;
      cover_image?: File;
      text_image?: File;
      qr_code?: File;
      hero_slides?: File[];
    }
  ): Promise<CreateCompleteRestaurantResult> {
    try {
      this.setCreatingComplete(true);
      this.clearCreateRestaurantError();

      const result = await AnonymousServicesManager.createCompleteAnonymousRestaurant(
        restaurantData,
        categories,
        dishes,
        images
      );

      if (result.success) {
        // Actualizar el cache con todos los datos creados
        this.store.update(state => ({
          ...state,
          restaurants: [...state.restaurants, result.data!.restaurant],
          categories: [...state.categories, ...result.data!.categories],
          dishes: [...state.dishes, ...result.data!.dishes],
          lastUpdated: {
            ...state.lastUpdated,
            all: new Date()
          }
        }));
      } else {
        this.setCreateRestaurantError(result.error || 'Error creando restaurante completo');
      }

      this.setCreatingComplete(false);
      return {
        success: result.success,
        data: result.data,
        error: result.error
      };
    } catch (error) {
      this.setCreatingComplete(false);
      this.setCreateRestaurantError(error instanceof Error ? error.message : 'Error desconocido');
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido'
      };
    }
  }

  /**
   * Obtiene todos los datos anónimos del dispositivo actual
   */
  async getAllAnonymousData(forceReload: boolean = false): Promise<GetAllAnonymousDataResult> {
    try {
      const state = this.getCurrentState();
      
      // Verificar cache si no se fuerza recarga
      if (!forceReload && state.totalItems > 0 && state.lastUpdated.all) {
        const cacheAge = Date.now() - state.lastUpdated.all.getTime();
        if (cacheAge < 5 * 60 * 1000) { // 5 minutos
          console.log('📦 Usando cache de datos anónimos');
          return {
            success: true,
            data: {
              restaurants: state.restaurants,
              categories: state.categories,
              dishes: state.dishes
            }
          };
        }
      }

      this.setLoadingAll(true);
      this.clearError();

      const result = await AnonymousServicesManager.getAllAnonymousData();

      if (result.success) {
        this.store.update(state => ({
          ...state,
          restaurants: result.data!.restaurants,
          categories: result.data!.categories,
          dishes: result.data!.dishes,
          lastUpdated: {
            ...state.lastUpdated,
            all: new Date()
          }
        }));
      } else {
        this.setError(result.error || 'Error obteniendo datos anónimos');
      }

      this.setLoadingAll(false);
      return result;
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
   * Limpia todos los datos anónimos del dispositivo actual
   */
  async clearAllAnonymousData(): Promise<ClearAllAnonymousDataResult> {
    try {
      this.setClearingData(true);
      this.clearClearDataError();

      const result = await AnonymousServicesManager.clearAllAnonymousData();

      if (result.success) {
        // Limpiar el cache
        this.store.update(state => ({
          ...state,
          restaurants: [],
          categories: [],
          dishes: [],
          lastUpdated: {
            restaurants: null,
            categories: null,
            dishes: null,
            all: null
          }
        }));
      } else {
        this.setClearDataError(result.error || 'Error limpiando datos anónimos');
      }

      this.setClearingData(false);
      return result;
    } catch (error) {
      this.setClearingData(false);
      this.setClearDataError(error instanceof Error ? error.message : 'Error desconocido');
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido'
      };
    }
  }

  /**
   * Obtiene estadísticas de datos anónimos
   */
  async getAnonymousDataStats(): Promise<GetAnonymousDataStatsResult> {
    try {
      this.setGettingStats(true);
      this.clearStatsError();

      const result = await AnonymousServicesManager.getAnonymousDataStats();

      if (result.success) {
        this.store.update(state => ({
          ...state,
          stats: result.data!
        }));
      } else {
        this.setStatsError(result.error || 'Error obteniendo estadísticas');
      }

      this.setGettingStats(false);
      return result;
    } catch (error) {
      this.setGettingStats(false);
      this.setStatsError(error instanceof Error ? error.message : 'Error desconocido');
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido'
      };
    }
  }

  /**
   * Verifica si hay datos anónimos pendientes
   */
  async hasPendingAnonymousData(): Promise<boolean> {
    try {
      return await AnonymousServicesManager.hasPendingAnonymousData();
    } catch (error) {
      console.error('Error verificando datos anónimos pendientes:', error);
      return false;
    }
  }

  // Métodos privados para actualizar estados
  private setLoadingAll(isLoading: boolean): void {
    this.store.update(state => ({ ...state, isLoadingAll: isLoading }));
  }

  private setCreatingRestaurant(isCreating: boolean): void {
    this.store.update(state => ({ ...state, isCreatingRestaurant: isCreating }));
  }

  private setCreatingCategory(isCreating: boolean): void {
    this.store.update(state => ({ ...state, isCreatingCategory: isCreating }));
  }

  private setCreatingDish(isCreating: boolean): void {
    this.store.update(state => ({ ...state, isCreatingDish: isCreating }));
  }

  private setClaiming(isClaiming: boolean): void {
    this.store.update(state => ({ ...state, isClaiming }));
  }

  private setCreatingComplete(isCreating: boolean): void {
    this.store.update(state => ({ ...state, isCreatingComplete: isCreating }));
  }

  private setClearingData(isClearing: boolean): void {
    this.store.update(state => ({ ...state, isClearingData: isClearing }));
  }

  private setGettingStats(isGetting: boolean): void {
    this.store.update(state => ({ ...state, isGettingStats: isGetting }));
  }

  private setError(error: string | null): void {
    this.store.update(state => ({ ...state, error }));
  }

  private setCreateRestaurantError(error: string | null): void {
    this.store.update(state => ({ ...state, createRestaurantError: error }));
  }

  private setCreateCategoryError(error: string | null): void {
    this.store.update(state => ({ ...state, createCategoryError: error }));
  }

  private setCreateDishError(error: string | null): void {
    this.store.update(state => ({ ...state, createDishError: error }));
  }

  private setClaimError(error: string | null): void {
    this.store.update(state => ({ ...state, claimError: error }));
  }

  private setClearDataError(error: string | null): void {
    this.store.update(state => ({ ...state, clearDataError: error }));
  }

  private setStatsError(error: string | null): void {
    this.store.update(state => ({ ...state, statsError: error }));
  }

  private clearError(): void {
    this.setError(null);
  }

  private clearCreateRestaurantError(): void {
    this.setCreateRestaurantError(null);
  }

  private clearCreateCategoryError(): void {
    this.setCreateCategoryError(null);
  }

  private clearCreateDishError(): void {
    this.setCreateDishError(null);
  }

  private clearClaimError(): void {
    this.setClaimError(null);
  }

  private clearClearDataError(): void {
    this.setClearDataError(null);
  }

  private clearStatsError(): void {
    this.setStatsError(null);
  }

  // Métodos públicos para limpiar datos
  clearCache(): void {
    this.store.update(state => ({
      ...state,
      restaurants: [],
      categories: [],
      dishes: [],
      lastUpdated: {
        restaurants: null,
        categories: null,
        dishes: null,
        all: null
      }
    }));
  }

  clearAllErrors(): void {
    this.store.update(state => ({
      ...state,
      error: null,
      createRestaurantError: null,
      createCategoryError: null,
      createDishError: null,
      claimError: null,
      clearDataError: null,
      statsError: null
    }));
  }

  // Métodos públicos para obtener estado actual
  getCurrentState(): AnonymousServicesState {
    let state: AnonymousServicesState;
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
    return error;
  }

  getRestaurants(): AnonymousRestaurant[] {
    let restaurants: AnonymousRestaurant[];
    this.restaurants.subscribe(r => restaurants = r)();
    return restaurants!;
  }

  getCategories(): AnonymousCategory[] {
    let categories: AnonymousCategory[];
    this.categories.subscribe(c => categories = c)();
    return categories!;
  }

  getDishes(): AnonymousDish[] {
    let dishes: AnonymousDish[];
    this.dishes.subscribe(d => dishes = d)();
    return dishes!;
  }

  // Stores derivados para utilidades
  getRestaurantById(restaurantId: string): Readable<AnonymousRestaurant | null> {
    return derived(this.restaurants, (restaurants) => 
      restaurants.find(r => r.id === restaurantId) || null
    );
  }

  getCategoryById(categoryId: string): Readable<AnonymousCategory | null> {
    return derived(this.categories, (categories) => 
      categories.find(c => c.id === categoryId) || null
    );
  }

  getDishById(dishId: string): Readable<AnonymousDish | null> {
    return derived(this.dishes, (dishes) => 
      dishes.find(d => d.id === dishId) || null
    );
  }

  getDishesByCategory(categoryId: string): Readable<AnonymousDish[]> {
    return derived(this.dishes, (dishes) => 
      dishes.filter(dish => dish.categoryId === categoryId)
    );
  }

  getRestaurantsCount(): Readable<number> {
    return derived(this.restaurants, (restaurants) => restaurants.length);
  }

  getCategoriesCount(): Readable<number> {
    return derived(this.categories, (categories) => categories.length);
  }

  getDishesCount(): Readable<number> {
    return derived(this.dishes, (dishes) => dishes.length);
  }
}

// Crear y exportar una instancia única del store
export const anonymousServicesStore = new AnonymousServicesStore();

// Hook para usar el store en componentes
export function useAnonymousServices() {
  return {
    // Estados de carga
    isLoading: anonymousServicesStore.isLoading,
    isLoadingAll: anonymousServicesStore.isLoadingAll,
    isCreatingRestaurant: anonymousServicesStore.isCreatingRestaurant,
    isCreatingCategory: anonymousServicesStore.isCreatingCategory,
    isCreatingDish: anonymousServicesStore.isCreatingDish,
    isClaiming: anonymousServicesStore.isClaiming,
    isCreatingComplete: anonymousServicesStore.isCreatingComplete,
    isClearingData: anonymousServicesStore.isClearingData,
    isGettingStats: anonymousServicesStore.isGettingStats,
    
    // Errores
    error: anonymousServicesStore.error,
    createRestaurantError: anonymousServicesStore.createRestaurantError,
    createCategoryError: anonymousServicesStore.createCategoryError,
    createDishError: anonymousServicesStore.createDishError,
    claimError: anonymousServicesStore.claimError,
    clearDataError: anonymousServicesStore.clearDataError,
    statsError: anonymousServicesStore.statsError,
    
    // Datos
    restaurants: anonymousServicesStore.restaurants,
    categories: anonymousServicesStore.categories,
    dishes: anonymousServicesStore.dishes,
    deviceId: anonymousServicesStore.deviceId,
    stats: anonymousServicesStore.stats,
    
    // Utilidades
    activeRestaurants: anonymousServicesStore.activeRestaurants,
    expiredRestaurants: anonymousServicesStore.expiredRestaurants,
    claimedRestaurants: anonymousServicesStore.claimedRestaurants,
    sortedCategories: anonymousServicesStore.sortedCategories,
    dishesInStock: anonymousServicesStore.dishesInStock,
    dishesOutOfStock: anonymousServicesStore.dishesOutOfStock,
    averagePrice: anonymousServicesStore.averagePrice,
    totalItems: anonymousServicesStore.totalItems,
    hasPendingData: anonymousServicesStore.hasPendingData,
    
    // Métodos
    createCompleteAnonymousRestaurant: anonymousServicesStore.createCompleteAnonymousRestaurant.bind(anonymousServicesStore),
    getAllAnonymousData: anonymousServicesStore.getAllAnonymousData.bind(anonymousServicesStore),
    clearAllAnonymousData: anonymousServicesStore.clearAllAnonymousData.bind(anonymousServicesStore),
    getAnonymousDataStats: anonymousServicesStore.getAnonymousDataStats.bind(anonymousServicesStore),
    hasPendingAnonymousData: anonymousServicesStore.hasPendingAnonymousData.bind(anonymousServicesStore),
    clearCache: anonymousServicesStore.clearCache.bind(anonymousServicesStore),
    clearAllErrors: anonymousServicesStore.clearAllErrors.bind(anonymousServicesStore),
    
    // Stores derivados
    getRestaurantById: anonymousServicesStore.getRestaurantById.bind(anonymousServicesStore),
    getCategoryById: anonymousServicesStore.getCategoryById.bind(anonymousServicesStore),
    getDishById: anonymousServicesStore.getDishById.bind(anonymousServicesStore),
    getDishesByCategory: anonymousServicesStore.getDishesByCategory.bind(anonymousServicesStore),
    getRestaurantsCount: anonymousServicesStore.getRestaurantsCount.bind(anonymousServicesStore),
    getCategoriesCount: anonymousServicesStore.getCategoriesCount.bind(anonymousServicesStore),
    getDishesCount: anonymousServicesStore.getDishesCount.bind(anonymousServicesStore)
  };
}

export default anonymousServicesStore; 