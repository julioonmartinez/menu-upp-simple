// src/stores/restaurantStore.ts

import { writable, derived, type Writable, type Readable } from 'svelte/store';
import { 
  restaurantService, 
  type ApiResult,
  type RestaurantCreateRequest,
  type RestaurantUpdateRequest,
  type RestaurantResponse,
  type UsernameCheckResponse,
  type ImageUploadResponse
} from '../services/restaurantService.ts';
import type { Restaurant } from '../interfaces/restaurant.ts';
import { authStore } from './authStore.ts';

// Types para el estado de restaurantes
export interface RestaurantsState {
  // Restaurantes en cache
  allRestaurants: Restaurant[];
  userRestaurants: Restaurant[];
  currentRestaurant: Restaurant | null;
  
  // Estados de carga
  isLoading: boolean;
  isLoadingAll: boolean;
  isLoadingUser: boolean;
  isLoadingCurrent: boolean;
  isCreating: boolean;
  isUpdating: boolean;
  isDeleting: boolean;
  isUploadingImage: boolean;
  
  // Estados específicos
  isCheckingUsername: boolean;
  usernameAvailability: { [username: string]: boolean };
  
  // Errores
  error: string | null;
  createError: string | null;
  updateError: string | null;
  deleteError: string | null;
  usernameError: string | null;
  imageError: string | null;
  
  // Cache metadata
  lastUpdated: {
    all: Date | null;
    user: Date | null;
    current: Date | null;
  };
  
  // Usuario actual
  currentUserId: string | null;
  isAuthenticated: boolean;
}

// Types para resultados de acciones
export interface CreateRestaurantResult {
  success: boolean;
  restaurant?: RestaurantResponse;
  error?: string;
}

export interface UpdateRestaurantResult {
  success: boolean;
  restaurant?: RestaurantResponse;
  error?: string;
}

export interface DeleteRestaurantResult {
  success: boolean;
  message?: string;
  error?: string;
}

export interface UploadImageResult {
  success: boolean;
  restaurant?: ImageUploadResponse;
  error?: string;
}

export interface UsernameCheckResult {
  success: boolean;
  available?: boolean;
  message?: string;
  error?: string;
}

/**
 * Estado inicial del store
 */
const initialState: RestaurantsState = {
  allRestaurants: [],
  userRestaurants: [],
  currentRestaurant: null,
  isLoading: false,
  isLoadingAll: false,
  isLoadingUser: false,
  isLoadingCurrent: false,
  isCreating: false,
  isUpdating: false,
  isDeleting: false,
  isUploadingImage: false,
  isCheckingUsername: false,
  usernameAvailability: {},
  error: null,
  createError: null,
  updateError: null,
  deleteError: null,
  usernameError: null,
  imageError: null,
  lastUpdated: {
    all: null,
    user: null,
    current: null
  },
  currentUserId: null,
  isAuthenticated: false
};

/**
 * Clase para manejar el estado de restaurantes
 */
class RestaurantStore {
  private store: Writable<RestaurantsState>;
  
  // Stores derivados públicos
  public readonly subscribe: Writable<RestaurantsState>['subscribe'];
  public readonly isLoading: Readable<boolean>;
  public readonly isLoadingAll: Readable<boolean>;
  public readonly isLoadingUser: Readable<boolean>;
  public readonly isCreating: Readable<boolean>;
  public readonly isUpdating: Readable<boolean>;
  public readonly isDeleting: Readable<boolean>;
  public readonly isUploadingImage: Readable<boolean>;
  public readonly isCheckingUsername: Readable<boolean>;
  public readonly error: Readable<string | null>;
  public readonly createError: Readable<string | null>;
  public readonly updateError: Readable<string | null>;
  public readonly deleteError: Readable<string | null>;
  public readonly usernameError: Readable<string | null>;
  public readonly imageError: Readable<string | null>;
  public readonly allRestaurants: Readable<Restaurant[]>;
  public readonly userRestaurants: Readable<Restaurant[]>;
  public readonly currentRestaurant: Readable<Restaurant | null>;
  public readonly isAuthenticated: Readable<boolean>;

  constructor() {
    this.store = writable<RestaurantsState>(initialState);
    this.subscribe = this.store.subscribe;

    // Stores derivados
    this.isLoading = derived(this.store, $state => $state.isLoading);
    this.isLoadingAll = derived(this.store, $state => $state.isLoadingAll);
    this.isLoadingUser = derived(this.store, $state => $state.isLoadingUser);
    this.isCreating = derived(this.store, $state => $state.isCreating);
    this.isUpdating = derived(this.store, $state => $state.isUpdating);
    this.isDeleting = derived(this.store, $state => $state.isDeleting);
    this.isUploadingImage = derived(this.store, $state => $state.isUploadingImage);
    this.isCheckingUsername = derived(this.store, $state => $state.isCheckingUsername);
    this.error = derived(this.store, $state => $state.error);
    this.createError = derived(this.store, $state => $state.createError);
    this.updateError = derived(this.store, $state => $state.updateError);
    this.deleteError = derived(this.store, $state => $state.deleteError);
    this.usernameError = derived(this.store, $state => $state.usernameError);
    this.imageError = derived(this.store, $state => $state.imageError);
    this.allRestaurants = derived(this.store, $state => $state.allRestaurants);
    this.userRestaurants = derived(this.store, $state => $state.userRestaurants);
    this.currentRestaurant = derived(this.store, $state => $state.currentRestaurant);
    this.isAuthenticated = derived(this.store, $state => $state.isAuthenticated);

    // Reaccionar a cambios de autenticación
    authStore.isAuthenticated.subscribe(isAuthenticated => {
      this.store.update(state => ({
        ...state,
        isAuthenticated,
        currentUserId: isAuthenticated ? authStore.getCurrentUser()?.id || null : null
      }));

      // Si el usuario se desautentica, limpiar restaurantes del usuario
      if (!isAuthenticated) {
        this.clearUserData();
      }
    });

    // Reaccionar a cambios de usuario
    authStore.user.subscribe(user => {
      this.store.update(state => ({
        ...state,
        currentUserId: user?.id || null
      }));
    });
  }

  /**
   * Carga todos los restaurantes
   */
  async loadAllRestaurants(forceReload: boolean = false): Promise<ApiResult<Restaurant[]>> {
    const currentState = this.getCurrentState();
    
    // Verificar cache si no es forzado
    if (!forceReload && currentState.allRestaurants.length > 0 && currentState.lastUpdated.all) {
      const timeDiff = Date.now() - currentState.lastUpdated.all.getTime();
      if (timeDiff < 5 * 60 * 1000) { // 5 minutos de cache
        return {
          success: true,
          data: currentState.allRestaurants
        };
      }
    }

    this.setLoadingAll(true);
    this.clearError();

    try {
      const result = await restaurantService.getAllRestaurants(true);

      if (result.success && result.data) {
        this.store.update(state => ({
          ...state,
          allRestaurants: result.data!,
          isLoadingAll: false,
          lastUpdated: {
            ...state.lastUpdated,
            all: new Date()
          },
          error: null
        }));

        return {
          success: true,
          data: result.data
        };
      } else {
        this.setLoadingAll(false);
        this.setError(result.error || 'Error cargando restaurantes');
        
        return {
          success: false,
          error: result.error || 'Error cargando restaurantes'
        };
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido cargando restaurantes';
      this.setLoadingAll(false);
      this.setError(errorMessage);
      
      return {
        success: false,
        error: errorMessage
      };
    }
  }

  /**
   * Carga los restaurantes del usuario actual
   */
  async loadUserRestaurants(forceReload: boolean = false): Promise<ApiResult<Restaurant[]>> {
    const currentState = this.getCurrentState();
    
    if (!currentState.isAuthenticated) {
      return {
        success: false,
        error: 'Usuario no autenticado'
      };
    }

    // Verificar cache si no es forzado
    if (!forceReload && currentState.userRestaurants.length > 0 && currentState.lastUpdated.user) {
      const timeDiff = Date.now() - currentState.lastUpdated.user.getTime();
      if (timeDiff < 2 * 60 * 1000) { // 2 minutos de cache para datos del usuario
        return {
          success: true,
          data: currentState.userRestaurants
        };
      }
    }

    this.setLoadingUser(true);
    this.clearError();

    try {
      const result = await restaurantService.getUserRestaurants();

      if (result.success && result.data) {
        this.store.update(state => ({
          ...state,
          userRestaurants: result.data!,
          isLoadingUser: false,
          lastUpdated: {
            ...state.lastUpdated,
            user: new Date()
          },
          error: null
        }));

        return {
          success: true,
          data: result.data
        };
      } else {
        this.setLoadingUser(false);
        this.setError(result.error || 'Error cargando tus restaurantes');
        
        return {
          success: false,
          error: result.error || 'Error cargando tus restaurantes'
        };
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido cargando tus restaurantes';
      this.setLoadingUser(false);
      this.setError(errorMessage);
      
      return {
        success: false,
        error: errorMessage
      };
    }
  }

  /**
   * Obtiene un restaurante específico por ID
   */
  async loadRestaurant(restaurantId: string, forceReload: boolean = false): Promise<ApiResult<Restaurant>> {
    // Verificar cache si no es forzado
    if (!forceReload) {
      const currentState = this.getCurrentState();
      const cached = currentState.allRestaurants.find(r => r.id === restaurantId) ||
                    currentState.userRestaurants.find(r => r.id === restaurantId);
      
      if (cached) {
        this.setCurrentRestaurant(cached);
        return {
          success: true,
          data: cached
        };
      }
    }

    this.setLoadingCurrent(true);
    this.clearError();

    try {
      const result = await restaurantService.getRestaurant(restaurantId);

      if (result.success && result.data) {
        this.setCurrentRestaurant(result.data);
        this.setLoadingCurrent(false);

        return {
          success: true,
          data: result.data
        };
      } else {
        this.setLoadingCurrent(false);
        this.setError(result.error || 'Error cargando restaurante');
        
        return {
          success: false,
          error: result.error || 'Error cargando restaurante'
        };
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido cargando restaurante';
      this.setLoadingCurrent(false);
      this.setError(errorMessage);
      
      return {
        success: false,
        error: errorMessage
      };
    }
  }

  /**
   * Obtiene un restaurante por username
   */
  async loadRestaurantByUsername(username: string): Promise<ApiResult<Restaurant>> {
    this.setLoadingCurrent(true);
    this.clearError();

    try {
      const result = await restaurantService.getRestaurantByUsername(username);

      if (result.success && result.data) {
        this.setCurrentRestaurant(result.data);
        this.setLoadingCurrent(false);

        return {
          success: true,
          data: result.data
        };
      } else {
        this.setLoadingCurrent(false);
        this.setError(result.error || 'Error cargando restaurante');
        
        return {
          success: false,
          error: result.error || 'Error cargando restaurante'
        };
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido cargando restaurante';
      this.setLoadingCurrent(false);
      this.setError(errorMessage);
      
      return {
        success: false,
        error: errorMessage
      };
    }
  }

  /**
   * Crea un nuevo restaurante
   */
  async createRestaurant(restaurantData: RestaurantCreateRequest): Promise<CreateRestaurantResult> {
    if (!this.getCurrentState().isAuthenticated) {
      return {
        success: false,
        error: 'Debes estar autenticado para crear restaurantes'
      };
    }

    this.setCreating(true);
    this.clearCreateError();

    try {
      const result = await restaurantService.createRestaurant(restaurantData);

      if (result.success && result.data) {
        // Actualizar cache local
        this.store.update(state => ({
          ...state,
          userRestaurants: [result.data!, ...state.userRestaurants],
          allRestaurants: [result.data!, ...state.allRestaurants],
          currentRestaurant: result.data!,
          isCreating: false,
          createError: null,
          lastUpdated: {
            ...state.lastUpdated,
            user: new Date()
          }
        }));

        return {
          success: true,
          restaurant: result.data
        };
      } else {
        this.setCreating(false);
        this.setCreateError(result.error || 'Error creando restaurante');
        
        return {
          success: false,
          error: result.error || 'Error creando restaurante'
        };
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido creando restaurante';
      this.setCreating(false);
      this.setCreateError(errorMessage);
      
      return {
        success: false,
        error: errorMessage
      };
    }
  }

  /**
   * Actualiza un restaurante existente
   */
  async updateRestaurant(
    restaurantId: string,
    restaurantData: RestaurantUpdateRequest
  ): Promise<UpdateRestaurantResult> {
    if (!this.getCurrentState().isAuthenticated) {
      return {
        success: false,
        error: 'Debes estar autenticado para actualizar restaurantes'
      };
    }

    this.setUpdating(true);
    this.clearUpdateError();

    try {
      const result = await restaurantService.updateRestaurant(restaurantId, restaurantData);

      if (result.success && result.data) {
        // Actualizar cache local
        this.store.update(state => {
          const updateRestaurantInArray = (restaurants: Restaurant[]) =>
            restaurants.map(r => r.id === restaurantId ? result.data! : r);

          return {
            ...state,
            userRestaurants: updateRestaurantInArray(state.userRestaurants),
            allRestaurants: updateRestaurantInArray(state.allRestaurants),
            currentRestaurant: state.currentRestaurant?.id === restaurantId ? result.data! : state.currentRestaurant,
            isUpdating: false,
            updateError: null,
            lastUpdated: {
              ...state.lastUpdated,
              user: new Date(),
              current: new Date()
            }
          };
        });

        return {
          success: true,
          restaurant: result.data
        };
      } else {
        this.setUpdating(false);
        this.setUpdateError(result.error || 'Error actualizando restaurante');
        
        return {
          success: false,
          error: result.error || 'Error actualizando restaurante'
        };
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido actualizando restaurante';
      this.setUpdating(false);
      this.setUpdateError(errorMessage);
      
      return {
        success: false,
        error: errorMessage
      };
    }
  }

  /**
   * Elimina un restaurante
   */
  async deleteRestaurant(restaurantId: string): Promise<DeleteRestaurantResult> {
    if (!this.getCurrentState().isAuthenticated) {
      return {
        success: false,
        error: 'Debes estar autenticado para eliminar restaurantes'
      };
    }

    this.setDeleting(true);
    this.clearDeleteError();

    try {
      const result = await restaurantService.deleteRestaurant(restaurantId);

      if (result.success) {
        // Actualizar cache local
        this.store.update(state => {
          const filterRestaurants = (restaurants: Restaurant[]) =>
            restaurants.filter(r => r.id !== restaurantId);

          return {
            ...state,
            userRestaurants: filterRestaurants(state.userRestaurants),
            allRestaurants: filterRestaurants(state.allRestaurants),
            currentRestaurant: state.currentRestaurant?.id === restaurantId ? null : state.currentRestaurant,
            isDeleting: false,
            deleteError: null,
            lastUpdated: {
              ...state.lastUpdated,
              user: new Date()
            }
          };
        });

        return {
          success: true,
          message: result.data?.message || 'Restaurante eliminado correctamente'
        };
      } else {
        this.setDeleting(false);
        this.setDeleteError(result.error || 'Error eliminando restaurante');
        
        return {
          success: false,
          error: result.error || 'Error eliminando restaurante'
        };
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido eliminando restaurante';
      this.setDeleting(false);
      this.setDeleteError(errorMessage);
      
      return {
        success: false,
        error: errorMessage
      };
    }
  }

  /**
   * Verifica la disponibilidad de un username
   */
  async checkUsernameAvailability(username: string): Promise<UsernameCheckResult> {
    // Verificar cache
    const currentState = this.getCurrentState();
    if (username in currentState.usernameAvailability) {
      return {
        success: true,
        available: currentState.usernameAvailability[username],
        message: currentState.usernameAvailability[username] 
          ? `Username '${username}' está disponible` 
          : `Username '${username}' no está disponible`
      };
    }

    this.setCheckingUsername(true);
    this.clearUsernameError();

    try {
      const result = await restaurantService.checkUsernameAvailability(username);

      if (result.success && result.data) {
        // Actualizar cache
        this.store.update(state => ({
          ...state,
          usernameAvailability: {
            ...state.usernameAvailability,
            [username]: result.data!.available
          },
          isCheckingUsername: false,
          usernameError: null
        }));

        return {
          success: true,
          available: result.data.available,
          message: result.data.message
        };
      } else {
        this.setCheckingUsername(false);
        this.setUsernameError(result.error || 'Error verificando username');
        
        return {
          success: false,
          error: result.error || 'Error verificando username'
        };
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido verificando username';
      this.setCheckingUsername(false);
      this.setUsernameError(errorMessage);
      
      return {
        success: false,
        error: errorMessage
      };
    }
  }

  /**
   * Sube una imagen para un restaurante
   */
  async uploadRestaurantImage(
    restaurantId: string,
    imageFile: File,
    imageType: 'image' | 'logo' | 'imageProfile' | 'imageCover' | 'imageText' | 'qrCode' = 'image'
  ): Promise<UploadImageResult> {
    if (!this.getCurrentState().isAuthenticated) {
      return {
        success: false,
        error: 'Debes estar autenticado para subir imágenes'
      };
    }

    this.setUploadingImage(true);
    this.clearImageError();

    try {
      const result = await restaurantService.uploadRestaurantImage(restaurantId, imageFile, imageType);

      if (result.success && result.data) {
        // Actualizar cache local
        this.store.update(state => {
          const updateRestaurantInArray = (restaurants: Restaurant[]) =>
            restaurants.map(r => r.id === restaurantId ? { ...r, ...result.data! } : r);

          return {
            ...state,
            userRestaurants: updateRestaurantInArray(state.userRestaurants),
            allRestaurants: updateRestaurantInArray(state.allRestaurants),
            currentRestaurant: state.currentRestaurant?.id === restaurantId 
              ? { ...state.currentRestaurant, ...result.data! } 
              : state.currentRestaurant,
            isUploadingImage: false,
            imageError: null
          };
        });

        return {
          success: true,
          restaurant: result.data
        };
      } else {
        this.setUploadingImage(false);
        this.setImageError(result.error || 'Error subiendo imagen');
        
        return {
          success: false,
          error: result.error || 'Error subiendo imagen'
        };
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido subiendo imagen';
      this.setUploadingImage(false);
      this.setImageError(errorMessage);
      
      return {
        success: false,
        error: errorMessage
      };
    }
  }

  /**
   * Elimina una imagen de un restaurante
   */
  async deleteRestaurantImage(
    restaurantId: string,
    imageType: 'image' | 'logo' | 'imageProfile' | 'imageCover' | 'imageText' | 'qrCode'
  ): Promise<UploadImageResult> {
    if (!this.getCurrentState().isAuthenticated) {
      return { success: false, error: 'Debes estar autenticado para eliminar imágenes' };
    }

    this.setUploadingImage(true);
    this.clearImageError();

    try {
      const result = await restaurantService.deleteRestaurantImage(restaurantId, imageType);

      if (result.success && result.data) {
        // Actualizar el restaurante en el store (eliminar la imagen)
        this.store.update(state => {
          const updateRestaurantInArray = (restaurants: Restaurant[]) =>
            restaurants.map(r =>
              r.id === restaurantId ? { ...r, ...result.data! } : r
            );

          return {
            ...state,
            userRestaurants: updateRestaurantInArray(state.userRestaurants),
            allRestaurants: updateRestaurantInArray(state.allRestaurants),
            currentRestaurant: state.currentRestaurant?.id === restaurantId
              ? { ...state.currentRestaurant, ...result.data! }
              : state.currentRestaurant,
            isUploadingImage: false,
            imageError: null
          };
        });

        return { success: true, restaurant: result.data };
      } else {
        this.setUploadingImage(false);
        this.setImageError(result.error || 'Error eliminando imagen');
        return { success: false, error: result.error || 'Error eliminando imagen' };
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido eliminando imagen';
      this.setUploadingImage(false);
      this.setImageError(errorMessage);
      return { success: false, error: errorMessage };
    }
  }

  /**
   * Métodos de utilidad privados
   */
  private setLoadingAll(isLoading: boolean): void {
    this.store.update(state => ({ ...state, isLoadingAll: isLoading }));
  }

  private setLoadingUser(isLoading: boolean): void {
    this.store.update(state => ({ ...state, isLoadingUser: isLoading }));
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

  private setCheckingUsername(isChecking: boolean): void {
    this.store.update(state => ({ ...state, isCheckingUsername: isChecking }));
  }

  private setCurrentRestaurant(restaurant: Restaurant | null): void {
    this.store.update(state => ({ 
      ...state, 
      currentRestaurant: restaurant,
      lastUpdated: {
        ...state.lastUpdated,
        current: new Date()
      }
    }));
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

  private setUsernameError(error: string | null): void {
    this.store.update(state => ({ ...state, usernameError: error }));
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

  private clearUsernameError(): void {
    this.setUsernameError(null);
  }

  private clearImageError(): void {
    this.setImageError(null);
  }

  /**
   * Limpia los datos del usuario
   */
  private clearUserData(): void {
    this.store.update(state => ({
      ...state,
      userRestaurants: [],
      lastUpdated: {
        ...state.lastUpdated,
        user: null
      }
    }));
  }

  /**
   * Limpia todo el cache
   */
  clearCache(): void {
    this.store.update(state => ({
      ...state,
      allRestaurants: [],
      userRestaurants: [],
      currentRestaurant: null,
      usernameAvailability: {},
      lastUpdated: {
        all: null,
        user: null,
        current: null
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
      createError: null,
      updateError: null,
      deleteError: null,
      usernameError: null,
      imageError: null
    }));
  }

  /**
   * Obtiene el estado actual (para uso en funciones)
   */
  getCurrentState(): RestaurantsState {
    let currentState: RestaurantsState;
    this.store.subscribe(state => {
      currentState = state;
    })();
    return currentState!;
  }

  /**
   * Métodos helper para obtener valores sincrónicamente
   */
  getIsLoading(): boolean {
    return this.getCurrentState().isLoading;
  }

  getError(): string | null {
    return this.getCurrentState().error;
  }

  getAllRestaurants(): Restaurant[] {
    return this.getCurrentState().allRestaurants;
  }

  getUserRestaurants(): Restaurant[] {
    return this.getCurrentState().userRestaurants;
  }

  getCurrentRestaurant(): Restaurant | null {
    return this.getCurrentState().currentRestaurant;
  }

  /**
   * Stores derivados para casos específicos
   */
  getRestaurantById(restaurantId: string): Readable<Restaurant | null> {
    return derived(this.store, $state => 
      $state.allRestaurants.find(r => r.id === restaurantId) ||
      $state.userRestaurants.find(r => r.id === restaurantId) ||
      null
    );
  }

  getIsUsernameAvailable(username: string): Readable<boolean | null> {
    return derived(this.store, $state => 
      $state.usernameAvailability[username] ?? null
    );
  }

  getUserRestaurantsCount(): Readable<number> {
    return derived(this.store, $state => $state.userRestaurants.length);
  }
}

/**
 * Instancia única del store de restaurantes
 */
export const restaurantStore = new RestaurantStore();

// Exports individuales para compatibilidad
export const restaurantsLoading = restaurantStore.isLoading;
export const restaurantsLoadingAll = restaurantStore.isLoadingAll;
export const restaurantsLoadingUser = restaurantStore.isLoadingUser;
export const restaurantsCreating = restaurantStore.isCreating;
export const restaurantsUpdating = restaurantStore.isUpdating;
export const restaurantsDeleting = restaurantStore.isDeleting;
export const restaurantsUploadingImage = restaurantStore.isUploadingImage;
export const restaurantsCheckingUsername = restaurantStore.isCheckingUsername;
export const restaurantsError = restaurantStore.error;
export const restaurantsCreateError = restaurantStore.createError;
export const restaurantsUpdateError = restaurantStore.updateError;
export const restaurantsDeleteError = restaurantStore.deleteError;
export const restaurantsUsernameError = restaurantStore.usernameError;
export const restaurantsImageError = restaurantStore.imageError;
export const allRestaurants = restaurantStore.allRestaurants;
export const userRestaurants = restaurantStore.userRestaurants;
export const currentRestaurant = restaurantStore.currentRestaurant;
export const restaurantsIsAuthenticated = restaurantStore.isAuthenticated;

/**
 * Hook personalizado para usar en componentes Svelte
 */
export function useRestaurants() {
  // const state = restaurantStore.getCurrentState();

  return {
    // Estado general
   // Stores reactivos (estos SÍ son reactivos)
    allRestaurants: restaurantStore.allRestaurants,
    userRestaurants: restaurantStore.userRestaurants,
    currentRestaurant: restaurantStore.currentRestaurant,
    isLoading: restaurantStore.isLoading,
    isLoadingAll: restaurantStore.isLoadingAll,
    isLoadingUser: restaurantStore.isLoadingUser,
    isCreating: restaurantStore.isCreating,
    isUpdating: restaurantStore.isUpdating,
    isDeleting: restaurantStore.isDeleting,
    isUploadingImage: restaurantStore.isUploadingImage,
    isCheckingUsername: restaurantStore.isCheckingUsername,
    
    // Errores como stores reactivos
    error: restaurantStore.error,
    createError: restaurantStore.createError,
    updateError: restaurantStore.updateError,
    deleteError: restaurantStore.deleteError,
    usernameError: restaurantStore.usernameError,
    imageError: restaurantStore.imageError,
    
    // Otros stores
    isAuthenticated: restaurantStore.isAuthenticated,
    
    // Métodos
    loadAllRestaurants: restaurantStore.loadAllRestaurants.bind(restaurantStore),
    loadUserRestaurants: restaurantStore.loadUserRestaurants.bind(restaurantStore),
    loadRestaurant: restaurantStore.loadRestaurant.bind(restaurantStore),
    loadRestaurantByUsername: restaurantStore.loadRestaurantByUsername.bind(restaurantStore),
    createRestaurant: restaurantStore.createRestaurant.bind(restaurantStore),
    updateRestaurant: restaurantStore.updateRestaurant.bind(restaurantStore),
    deleteRestaurant: restaurantStore.deleteRestaurant.bind(restaurantStore),
    checkUsernameAvailability: restaurantStore.checkUsernameAvailability.bind(restaurantStore),
    uploadRestaurantImage: restaurantStore.uploadRestaurantImage.bind(restaurantStore),
    deleteRestaurantImage: restaurantStore.deleteRestaurantImage.bind(restaurantStore),
    clearCache: restaurantStore.clearCache.bind(restaurantStore),
    clearAllErrors: restaurantStore.clearAllErrors.bind(restaurantStore),
    
    // Stores reactivos (para uso en componentes)
    allRestaurantsStore: restaurantStore.allRestaurants,
    userRestaurantsStore: restaurantStore.userRestaurants,
    currentRestaurantStore: restaurantStore.currentRestaurant,
    isLoadingStore: restaurantStore.isLoading,
    errorStore: restaurantStore.error
  };
}

// Default export
export default restaurantStore;