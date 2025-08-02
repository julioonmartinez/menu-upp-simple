// src/stores/anonymousRestaurantStore.ts

import { writable, derived, type Writable, type Readable } from 'svelte/store';
import { 
   
  type ApiResult,
  type AnonymousRestaurantCreateRequest,
  
  type RestaurantClaimRequest,
  type RestaurantClaimResponse,
  type AnonymousRestaurantResponse,
  type AnonymousRestaurantCreateResponse,
  type AnonymousRestaurantByClaimCodeResponse,
  type AnonymousRestaurantsByDeviceResponse
} from '../interfaces/anonymousRestaurant.ts';
import type { AnonymousRestaurant } from '../interfaces/anonymousRestaurant.ts';
import { anonymousRestaurantService } from '../services/anonymousRestaurantService.ts';

// Types para el estado de restaurantes anónimos
export interface AnonymousRestaurantsState {
  // Restaurantes anónimos en cache
  allAnonymousRestaurants: AnonymousRestaurant[];
  currentAnonymousRestaurant: AnonymousRestaurant | null;
  restaurantByClaimCode: AnonymousRestaurant | null;
  
  // Estados de carga
  isLoading: boolean;
  isLoadingAll: boolean;
  isLoadingCurrent: boolean;
  isLoadingByClaimCode: boolean;
  isCreating: boolean;
  isClaiming: boolean;
  
  // Estados específicos
  isCheckingClaimCode: boolean;
  
  // Errores
  error: string | null;
  createError: string | null;
  claimError: string | null;
  claimCodeError: string | null;
  
  // Cache metadata
  lastUpdated: {
    all: Date | null;
    current: Date | null;
    claimCode: Date | null;
  };
  
  // Device ID
  deviceId: string | null;
}

// Types para resultados de acciones
export interface CreateAnonymousRestaurantResult {
  success: boolean;
  restaurant?: AnonymousRestaurantCreateResponse;
  error?: string;
}

export interface ClaimRestaurantResult {
  success: boolean;
  response?: RestaurantClaimResponse;
  error?: string;
}

export interface GetByClaimCodeResult {
  success: boolean;
  restaurant?: AnonymousRestaurantByClaimCodeResponse;
  error?: string;
}

/**
 * Estado inicial del store
 */
const initialState: AnonymousRestaurantsState = {
  allAnonymousRestaurants: [],
  currentAnonymousRestaurant: null,
  restaurantByClaimCode: null,
  isLoading: false,
  isLoadingAll: false,
  isLoadingCurrent: false,
  isLoadingByClaimCode: false,
  isCreating: false,
  isClaiming: false,
  isCheckingClaimCode: false,
  error: null,
  createError: null,
  claimError: null,
  claimCodeError: null,
  lastUpdated: {
    all: null,
    current: null,
    claimCode: null
  },
  deviceId: null
};

/**
 * Store para manejar restaurantes anónimos
 */
class AnonymousRestaurantStore {
  private store: Writable<AnonymousRestaurantsState>;
  
  // Exponer el subscribe del store
  public readonly subscribe: Writable<AnonymousRestaurantsState>['subscribe'];
  
  // Stores derivados para estados de carga
  public readonly isLoading: Readable<boolean>;
  public readonly isLoadingAll: Readable<boolean>;
  public readonly isLoadingCurrent: Readable<boolean>;
  public readonly isLoadingByClaimCode: Readable<boolean>;
  public readonly isCreating: Readable<boolean>;
  public readonly isClaiming: Readable<boolean>;
  public readonly isCheckingClaimCode: Readable<boolean>;
  
  // Stores derivados para errores
  public readonly error: Readable<string | null>;
  public readonly createError: Readable<string | null>;
  public readonly claimError: Readable<string | null>;
  public readonly claimCodeError: Readable<string | null>;
  
  // Stores derivados para datos
  public readonly allAnonymousRestaurants: Readable<AnonymousRestaurant[]>;
  public readonly currentAnonymousRestaurant: Readable<AnonymousRestaurant | null>;
  public readonly restaurantByClaimCode: Readable<AnonymousRestaurant | null>;
  public readonly deviceId: Readable<string | null>;
  
  // Stores derivados para utilidades
  public readonly activeRestaurants: Readable<AnonymousRestaurant[]>;
  public readonly expiredRestaurants: Readable<AnonymousRestaurant[]>;
  public readonly claimedRestaurants: Readable<AnonymousRestaurant[]>;
  public readonly restaurantsCount: Readable<number>;
  public readonly activeRestaurantsCount: Readable<number>;
  public readonly expiredRestaurantsCount: Readable<number>;
  public readonly claimedRestaurantsCount: Readable<number>;

  constructor() {
    this.store = writable(initialState);
    this.subscribe = this.store.subscribe;

    // Stores derivados para estados de carga
    this.isLoading = derived(this.store, ($state) => $state.isLoading);
    this.isLoadingAll = derived(this.store, ($state) => $state.isLoadingAll);
    this.isLoadingCurrent = derived(this.store, ($state) => $state.isLoadingCurrent);
    this.isLoadingByClaimCode = derived(this.store, ($state) => $state.isLoadingByClaimCode);
    this.isCreating = derived(this.store, ($state) => $state.isCreating);
    this.isClaiming = derived(this.store, ($state) => $state.isClaiming);
    this.isCheckingClaimCode = derived(this.store, ($state) => $state.isCheckingClaimCode);

    // Stores derivados para errores
    this.error = derived(this.store, ($state) => $state.error);
    this.createError = derived(this.store, ($state) => $state.createError);
    this.claimError = derived(this.store, ($state) => $state.claimError);
    this.claimCodeError = derived(this.store, ($state) => $state.claimCodeError);

    // Stores derivados para datos
    this.allAnonymousRestaurants = derived(this.store, ($state) => $state.allAnonymousRestaurants);
    this.currentAnonymousRestaurant = derived(this.store, ($state) => $state.currentAnonymousRestaurant);
    this.restaurantByClaimCode = derived(this.store, ($state) => $state.restaurantByClaimCode);
    this.deviceId = derived(this.store, ($state) => $state.deviceId);

    // Stores derivados para utilidades
    this.activeRestaurants = derived(this.store, ($state) => 
      $state.allAnonymousRestaurants.filter(r => r.days_remaining > 0 && !r.is_claimed)
    );
    this.expiredRestaurants = derived(this.store, ($state) => 
      $state.allAnonymousRestaurants.filter(r => r.days_remaining <= 0)
    );
    this.claimedRestaurants = derived(this.store, ($state) => 
      $state.allAnonymousRestaurants.filter(r => r.is_claimed)
    );
    this.restaurantsCount = derived(this.store, ($state) => $state.allAnonymousRestaurants.length);
    this.activeRestaurantsCount = derived(this.store, ($state) => 
      $state.allAnonymousRestaurants.filter(r => r.days_remaining > 0 && !r.is_claimed).length
    );
    this.expiredRestaurantsCount = derived(this.store, ($state) => 
      $state.allAnonymousRestaurants.filter(r => r.days_remaining <= 0).length
    );
    this.claimedRestaurantsCount = derived(this.store, ($state) => 
      $state.allAnonymousRestaurants.filter(r => r.is_claimed).length
    );
  }

  /**
   * Carga todos los restaurantes anónimos del dispositivo actual
   */
  async loadAllAnonymousRestaurants(forceReload: boolean = false): Promise<ApiResult<AnonymousRestaurant[]>> {
    try {
      const state = this.getCurrentState();
      
      // Verificar cache si no se fuerza recarga
      if (!forceReload && state.allAnonymousRestaurants.length > 0 && state.lastUpdated.all) {
        const cacheAge = Date.now() - state.lastUpdated.all.getTime();
        if (cacheAge < 5 * 60 * 1000) { // 5 minutos
          console.log('📦 Usando cache de restaurantes anónimos');
          return {
            success: true,
            data: state.allAnonymousRestaurants
          };
        }
      }

      this.setLoadingAll(true);
      this.clearError();

      const result = await anonymousRestaurantService.getAnonymousRestaurantsByDevice();

      if (result.success) {
        this.store.update(state => ({
          ...state,
          allAnonymousRestaurants: result.data!.restaurants,
          lastUpdated: {
            ...state.lastUpdated,
            all: new Date()
          }
        }));
      } else {
        this.setError(result.error || 'Error cargando restaurantes anónimos');
      }

      this.setLoadingAll(false);
      return result! as unknown as ApiResult<AnonymousRestaurant[]>;
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
  ): Promise<CreateAnonymousRestaurantResult> {
    try {
      this.setCreating(true);
      this.clearCreateError();

      const result = await anonymousRestaurantService.createAnonymousRestaurant(restaurantData, images);

      if (result.success) {
        // Agregar el nuevo restaurante al cache
        this.store.update(state => ({
          ...state,
          allAnonymousRestaurants: [...state.allAnonymousRestaurants, result.data!.restaurant],
          currentAnonymousRestaurant: result.data!.restaurant
        }));
      } else {
        this.setCreateError(result.error || 'Error creando restaurante anónimo');
      }

      this.setCreating(false);
      return {
        success: result.success,
        restaurant: result.data,
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
   * Obtiene un restaurante anónimo por código de reclamación
   */
  async getAnonymousRestaurantByClaimCode(claimCode: string): Promise<GetByClaimCodeResult> {
    try {
      this.setLoadingByClaimCode(true);
      this.clearClaimCodeError();

      const result = await anonymousRestaurantService.getAnonymousRestaurantByClaimCode(claimCode);

      if (result.success) {
        this.store.update(state => ({
          ...state,
          restaurantByClaimCode: result.data!.restaurant || null,
          lastUpdated: {
            ...state.lastUpdated,
            claimCode: new Date()
          }
        }));
      } else {
        this.setClaimCodeError(result.error || 'Error obteniendo restaurante por código de reclamación');
      }

      this.setLoadingByClaimCode(false);
      return {
        success: result.success,
        restaurant: result.data,
        error: result.error
      };
    } catch (error) {
      this.setLoadingByClaimCode(false);
      this.setClaimCodeError(error instanceof Error ? error.message : 'Error desconocido');
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido'
      };
    }
  }

  /**
   * Reclama un restaurante anónimo
   */
  async claimAnonymousRestaurant(claimRequest: RestaurantClaimRequest): Promise<ClaimRestaurantResult> {
    try {
      this.setClaiming(true);
      this.clearClaimError();

      const result = await anonymousRestaurantService.claimAnonymousRestaurant(claimRequest);

      if (result.success) {
        // Actualizar el restaurante en el cache si existe
        this.store.update(state => ({
          ...state,
          allAnonymousRestaurants: state.allAnonymousRestaurants.map(r => 
            r.claim_code === claimRequest.claim_code 
              ? { ...r, is_claimed: true, claimed_by: result.data!.user.id, claimed_at: new Date().toISOString() }
              : r
          ),
          restaurantByClaimCode: state.restaurantByClaimCode && 
            state.restaurantByClaimCode.claim_code === claimRequest.claim_code
              ? { ...state.restaurantByClaimCode, is_claimed: true, claimed_by: result.data!.user.id, claimed_at: new Date().toISOString() }
              : state.restaurantByClaimCode
        }));
      } else {
        this.setClaimError(result.error || 'Error reclamando restaurante');
      }

      this.setClaiming(false);
      return {
        success: result.success,
        response: result.data,
        error: result.error
      };
    } catch (error) {
      this.setClaiming(false);
      this.setClaimError(error instanceof Error ? error.message : 'Error desconocido');
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido'
      };
    }
  }

  /**
   * Obtiene estadísticas de limpieza (solo para admins)
   */
  async getCleanupStats(): Promise<ApiResult<any>> {
    try {
      const result = await anonymousRestaurantService.getCleanupStats();
      
      if (!result.success) {
        this.setError(result.error || 'Error obteniendo estadísticas de limpieza');
      }
      
      return result;
    } catch (error) {
      this.setError(error instanceof Error ? error.message : 'Error desconocido');
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido'
      };
    }
  }

  /**
   * Ejecuta limpieza manual (solo para admins)
   */
  async performManualCleanup(): Promise<ApiResult<any>> {
    try {
      const result = await anonymousRestaurantService.performManualCleanup();
      
      if (!result.success) {
        this.setError(result.error || 'Error ejecutando limpieza manual');
      }
      
      return result;
    } catch (error) {
      this.setError(error instanceof Error ? error.message : 'Error desconocido');
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

  private setLoadingByClaimCode(isLoading: boolean): void {
    this.store.update(state => ({ ...state, isLoadingByClaimCode: isLoading }));
  }

  private setCreating(isCreating: boolean): void {
    this.store.update(state => ({ ...state, isCreating }));
  }

  private setClaiming(isClaiming: boolean): void {
    this.store.update(state => ({ ...state, isClaiming }));
  }

  private setCurrentAnonymousRestaurant(restaurant: AnonymousRestaurant | null): void {
    this.store.update(state => ({ ...state, currentAnonymousRestaurant: restaurant }));
  }

  private setError(error: string | null): void {
    this.store.update(state => ({ ...state, error }));
  }

  private setCreateError(error: string | null): void {
    this.store.update(state => ({ ...state, createError: error }));
  }

  private setClaimError(error: string | null): void {
    this.store.update(state => ({ ...state, claimError: error }));
  }

  private setClaimCodeError(error: string | null): void {
    this.store.update(state => ({ ...state, claimCodeError: error }));
  }

  private clearError(): void {
    this.setError(null);
  }

  private clearCreateError(): void {
    this.setCreateError(null);
  }

  private clearClaimError(): void {
    this.setClaimError(null);
  }

  private clearClaimCodeError(): void {
    this.setClaimCodeError(null);
  }

  // Métodos públicos para limpiar datos
  clearCache(): void {
    this.store.update(state => ({
      ...state,
      allAnonymousRestaurants: [],
      currentAnonymousRestaurant: null,
      restaurantByClaimCode: null,
      lastUpdated: {
        all: null,
        current: null,
        claimCode: null
      }
    }));
  }

  clearAllErrors(): void {
    this.store.update(state => ({
      ...state,
      error: null,
      createError: null,
      claimError: null,
      claimCodeError: null
    }));
  }

  // Métodos públicos para obtener estado actual
  getCurrentState(): AnonymousRestaurantsState {
    let state: AnonymousRestaurantsState;
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

  getAllAnonymousRestaurants(): AnonymousRestaurant[] {
    let restaurants: AnonymousRestaurant[];
    this.allAnonymousRestaurants.subscribe(r => restaurants = r)();
    return restaurants!;
  }

  getCurrentAnonymousRestaurant(): AnonymousRestaurant | null {
    let restaurant: AnonymousRestaurant | null;
    this.currentAnonymousRestaurant.subscribe(r => restaurant = r)();
    return restaurant!;
  }

  getRestaurantByClaimCode(): AnonymousRestaurant | null {
    let restaurant: AnonymousRestaurant | null;
    this.restaurantByClaimCode.subscribe(r => restaurant = r)();
    return restaurant!;
  }

  // Stores derivados para utilidades
  getAnonymousRestaurantById(restaurantId: string): Readable<AnonymousRestaurant | null> {
    return derived(this.allAnonymousRestaurants, (restaurants) => 
      restaurants.find(r => r.id === restaurantId) || null
    );
  }

  getAnonymousRestaurantsCount(): Readable<number> {
    return derived(this.allAnonymousRestaurants, (restaurants) => restaurants.length);
  }

  getActiveAnonymousRestaurantsCount(): Readable<number> {
    return derived(this.allAnonymousRestaurants, (restaurants) => 
      restaurants.filter(r => r.days_remaining > 0 && !r.is_claimed).length
    );
  }

  getExpiredAnonymousRestaurantsCount(): Readable<number> {
    return derived(this.allAnonymousRestaurants, (restaurants) => 
      restaurants.filter(r => r.days_remaining <= 0).length
    );
  }

  getClaimedAnonymousRestaurantsCount(): Readable<number> {
    return derived(this.allAnonymousRestaurants, (restaurants) => 
      restaurants.filter(r => r.is_claimed).length
    );
  }
}

// Crear y exportar una instancia única del store
export const anonymousRestaurantStore = new AnonymousRestaurantStore();

// Hook para usar el store en componentes
export function useAnonymousRestaurants() {
  return {
    // Estados de carga
    isLoading: anonymousRestaurantStore.isLoading,
    isLoadingAll: anonymousRestaurantStore.isLoadingAll,
    isLoadingCurrent: anonymousRestaurantStore.isLoadingCurrent,
    isLoadingByClaimCode: anonymousRestaurantStore.isLoadingByClaimCode,
    isCreating: anonymousRestaurantStore.isCreating,
    isClaiming: anonymousRestaurantStore.isClaiming,
    isCheckingClaimCode: anonymousRestaurantStore.isCheckingClaimCode,
    
    // Errores
    error: anonymousRestaurantStore.error,
    createError: anonymousRestaurantStore.createError,
    claimError: anonymousRestaurantStore.claimError,
    claimCodeError: anonymousRestaurantStore.claimCodeError,
    
    // Datos
    allAnonymousRestaurants: anonymousRestaurantStore.allAnonymousRestaurants,
    currentAnonymousRestaurant: anonymousRestaurantStore.currentAnonymousRestaurant,
    restaurantByClaimCode: anonymousRestaurantStore.restaurantByClaimCode,
    deviceId: anonymousRestaurantStore.deviceId,
    
    // Utilidades
    activeRestaurants: anonymousRestaurantStore.activeRestaurants,
    expiredRestaurants: anonymousRestaurantStore.expiredRestaurants,
    claimedRestaurants: anonymousRestaurantStore.claimedRestaurants,
    restaurantsCount: anonymousRestaurantStore.restaurantsCount,
    activeRestaurantsCount: anonymousRestaurantStore.activeRestaurantsCount,
    expiredRestaurantsCount: anonymousRestaurantStore.expiredRestaurantsCount,
    claimedRestaurantsCount: anonymousRestaurantStore.claimedRestaurantsCount,
    
    // Métodos
    loadAllAnonymousRestaurants: anonymousRestaurantStore.loadAllAnonymousRestaurants.bind(anonymousRestaurantStore),
    createAnonymousRestaurant: anonymousRestaurantStore.createAnonymousRestaurant.bind(anonymousRestaurantStore),
    getAnonymousRestaurantByClaimCode: anonymousRestaurantStore.getAnonymousRestaurantByClaimCode.bind(anonymousRestaurantStore),
    claimAnonymousRestaurant: anonymousRestaurantStore.claimAnonymousRestaurant.bind(anonymousRestaurantStore),
    getCleanupStats: anonymousRestaurantStore.getCleanupStats.bind(anonymousRestaurantStore),
    performManualCleanup: anonymousRestaurantStore.performManualCleanup.bind(anonymousRestaurantStore),
    clearCache: anonymousRestaurantStore.clearCache.bind(anonymousRestaurantStore),
    clearAllErrors: anonymousRestaurantStore.clearAllErrors.bind(anonymousRestaurantStore),
    
    // Stores derivados
    getAnonymousRestaurantById: anonymousRestaurantStore.getAnonymousRestaurantById.bind(anonymousRestaurantStore),
    getAnonymousRestaurantsCount: anonymousRestaurantStore.getAnonymousRestaurantsCount.bind(anonymousRestaurantStore),
    getActiveAnonymousRestaurantsCount: anonymousRestaurantStore.getActiveAnonymousRestaurantsCount.bind(anonymousRestaurantStore),
    getExpiredAnonymousRestaurantsCount: anonymousRestaurantStore.getExpiredAnonymousRestaurantsCount.bind(anonymousRestaurantStore),
    getClaimedAnonymousRestaurantsCount: anonymousRestaurantStore.getClaimedAnonymousRestaurantsCount.bind(anonymousRestaurantStore)
  };
}

export default anonymousRestaurantStore; 