// src/stores/restaurantFavoritesStore.ts
import { writable, derived, type Writable, type Readable } from 'svelte/store';
import { 
  restaurantFavoritesService, 
//   type Restaurant, 
  type FavoritesResponse, 
  type FavoriteToggleResponse,
  type ApiResult 
} from '../services/restaurantFavoritesService.ts';
import { authStore } from './authStore.ts';
import type { Restaurant } from '../interfaces/restaurant.ts';

// Types para el estado de favoritos
export interface FavoritesState {
  favorites: Restaurant[];
  popularRestaurants: Restaurant[];
  favoritesCount: number;
  isLoading: boolean;
  isLoadingPopular: boolean;
  error: string | null;
  pagination: {
    total: number;
    page: number;
    limit: number;
    total_pages: number;
    has_next: boolean;
    has_prev: boolean;
  } | null;
  lastUpdated: Date | null;
  // Cache para verificaciones rápidas
  favoriteStatusCache: Record<string, boolean>;
}

// Types para resultados de acciones
export interface ToggleFavoriteResult {
  success: boolean;
  restaurant?: FavoriteToggleResponse;
  error?: string;
}

export interface LoadFavoritesResult {
  success: boolean;
  data?: FavoritesResponse;
  error?: string;
}

/**
 * Estado inicial de favoritos
 */
const initialState: FavoritesState = {
  favorites: [],
  popularRestaurants: [],
  favoritesCount: 0,
  isLoading: false,
  isLoadingPopular: false,
  error: null,
  pagination: null,
  lastUpdated: null,
  favoriteStatusCache: {}
};

/**
 * Clase para manejar el estado de favoritos de restaurantes
 */
class RestaurantFavoritesStore {
  private store: Writable<FavoritesState>;
  
  // Stores derivados públicos
  public readonly subscribe: Writable<FavoritesState>['subscribe'];
  public readonly favorites: Readable<Restaurant[]>;
  public readonly popularRestaurants: Readable<Restaurant[]>;
  public readonly favoritesCount: Readable<number>;
  public readonly isLoading: Readable<boolean>;
  public readonly isLoadingPopular: Readable<boolean>;
  public readonly error: Readable<string | null>;
  public readonly pagination: Readable<FavoritesState['pagination']>;
  public readonly hasFavorites: Readable<boolean>;
  public readonly favoriteIds: Readable<string[]>;

  constructor() {
    this.store = writable<FavoritesState>(initialState);
    this.subscribe = this.store.subscribe;

    // Stores derivados
    this.favorites = derived(this.store, $state => $state.favorites);
    this.popularRestaurants = derived(this.store, $state => $state.popularRestaurants);
    this.favoritesCount = derived(this.store, $state => $state.favoritesCount);
    this.isLoading = derived(this.store, $state => $state.isLoading);
    this.isLoadingPopular = derived(this.store, $state => $state.isLoadingPopular);
    this.error = derived(this.store, $state => $state.error);
    this.pagination = derived(this.store, $state => $state.pagination);
    
    // Stores derivados útiles
    this.hasFavorites = derived(this.store, $state => $state.favorites.length > 0);
    this.favoriteIds = derived(this.store, $state => $state.favorites.map(fav => fav.id!));

    // Reaccionar a cambios de autenticación
    authStore.isAuthenticated.subscribe(isAuthenticated => {
      if (isAuthenticated) {
        // Cargar favoritos cuando el usuario se autentica
        this.loadUserFavorites();
      } else {
        // Limpiar favoritos cuando el usuario cierra sesión
        this.clearFavorites();
      }
    });
  }

  /**
   * Carga los favoritos del usuario actual
   */
  async loadUserFavorites(
    limit: number = 20, 
    page: number = 1,
    silent: boolean = false
  ): Promise<LoadFavoritesResult> {
    if (!authStore.getIsAuthenticated()) {
      return {
        success: false,
        error: 'Usuario no autenticado'
      };
    }

    if (!silent) {
      this.setLoading(true);
    }
    this.clearError();

    try {
      const result = await restaurantFavoritesService.getUserFavorites(limit, page);

      if (result.success && result.data) {
        this.store.update(state => ({
          ...state,
          favorites: page === 1 ? result.data!.restaurants : [...state.favorites, ...result.data!.restaurants],
          favoritesCount: result.data!.total_favorites,
          pagination: result.data!.pagination,
          isLoading: false,
          error: null,
          lastUpdated: new Date(),
          // Actualizar cache de estado de favoritos
          favoriteStatusCache: {
            ...state.favoriteStatusCache,
            ...result.data!.restaurants.reduce((acc, restaurant) => {
              if (restaurant.id) acc[restaurant.id] = true;
              return acc;
            }, {} as Record<string, boolean>)
          }
        }));

        return {
          success: true,
          data: result.data
        };
      } else {
        this.store.update(state => ({
          ...state,
          isLoading: false,
          error: result.error || 'Error cargando favoritos'
        }));

        return {
          success: false,
          error: result.error || 'Error cargando favoritos'
        };
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido cargando favoritos';
      
      this.store.update(state => ({
        ...state,
        isLoading: false,
        error: errorMessage
      }));

      return {
        success: false,
        error: errorMessage
      };
    }
  }

  /**
   * Carga más favoritos (paginación)
   */
  async loadMoreFavorites(): Promise<LoadFavoritesResult> {
    const currentState = this.getCurrentState();
    
    if (!currentState.pagination?.has_next) {
      return {
        success: false,
        error: 'No hay más favoritos para cargar'
      };
    }

    return this.loadUserFavorites(
      currentState.pagination.limit,
      currentState.pagination.page + 1,
      true
    );
  }

  /**
   * Recarga los favoritos desde la primera página
   */
  async refreshFavorites(): Promise<LoadFavoritesResult> {
    return this.loadUserFavorites(20, 1);
  }

  /**
   * Alterna el estado de favorito de un restaurante
   */
  async toggleFavorite(restaurantId: string): Promise<ToggleFavoriteResult> {
    if (!authStore.getIsAuthenticated()) {
      return {
        success: false,
        error: 'Usuario no autenticado'
      };
    }

    try {
      const result = await restaurantFavoritesService.toggleFavorite(restaurantId);

      if (result.success && result.data) {
        this.store.update(state => {
          const newFavorites = result.data!.userFav
            ? [...state.favorites] // Si se añadió, necesitamos recargar para obtener detalles completos
            : state.favorites.filter(fav => fav.id !== restaurantId);

          return {
            ...state,
            favorites: newFavorites,
            favoritesCount: result.data!.userFav 
              ? state.favoritesCount + 1 
              : Math.max(0, state.favoritesCount - 1),
            favoriteStatusCache: {
              ...state.favoriteStatusCache,
              [restaurantId]: result.data!.userFav
            },
            lastUpdated: new Date()
          };
        });

        // Si se añadió a favoritos, recargar la lista para obtener detalles completos
        if (result.data.userFav) {
          this.loadUserFavorites(20, 1, true);
        }

        return {
          success: true,
          restaurant: result.data
        };
      } else {
        return {
          success: false,
          error: result.error || 'Error alternando favorito'
        };
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido alternando favorito'
      };
    }
  }

  /**
   * Añade un restaurante a favoritos
   */
  async addToFavorites(restaurantId: string): Promise<ToggleFavoriteResult> {
    // Verificar si ya está en favoritos
    if (this.isRestaurantFavorited(restaurantId)) {
      return {
        success: true,
        restaurant: {
          id: restaurantId,
          name: '',
          favoritesCount: 0,
          userFav: true,
          message: 'Restaurante ya estaba en favoritos',
          action: 'added'
        }
      };
    }

    return this.toggleFavorite(restaurantId);
  }

  /**
   * Quita un restaurante de favoritos
   */
  async removeFromFavorites(restaurantId: string): Promise<ToggleFavoriteResult> {
    if (!authStore.getIsAuthenticated()) {
      return {
        success: false,
        error: 'Usuario no autenticado'
      };
    }

    try {
      const result = await restaurantFavoritesService.removeFromFavorites(restaurantId);

      if (result.success && result.data) {
        this.store.update(state => ({
          ...state,
          favorites: state.favorites.filter(fav => fav.id !== restaurantId),
          favoritesCount: Math.max(0, state.favoritesCount - 1),
          favoriteStatusCache: {
            ...state.favoriteStatusCache,
            [restaurantId]: false
          },
          lastUpdated: new Date()
        }));

        return {
          success: true,
          restaurant: result.data
        };
      } else {
        return {
          success: false,
          error: result.error || 'Error quitando de favoritos'
        };
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido quitando de favoritos'
      };
    }
  }

  /**
   * Verifica si un restaurante está en favoritos (usando cache)
   */
  isRestaurantFavorited(restaurantId: string): boolean {
    const state = this.getCurrentState();
    
    // Verificar en cache primero
    if (restaurantId in state.favoriteStatusCache) {
      return state.favoriteStatusCache[restaurantId];
    }
    
    // Verificar en la lista de favoritos
    return state.favorites.some(fav => fav.id === restaurantId);
  }

  /**
   * Busca un restaurante en la lista de favoritos
   */
  findFavoriteRestaurant(restaurantId: string): Restaurant | undefined {
    const state = this.getCurrentState();
    return state.favorites.find(fav => fav.id === restaurantId);
  }

  /**
   * Carga los restaurantes populares
   */
  async loadPopularRestaurants(limit: number = 10): Promise<ApiResult<Restaurant[]>> {
    this.setLoadingPopular(true);

    try {
      const result = await restaurantFavoritesService.getPopularRestaurants(limit);

      if (result.success && result.data) {
        this.store.update(state => ({
          ...state,
          popularRestaurants: result.data!,
          isLoadingPopular: false
        }));

        return {
          success: true,
          data: result.data
        };
      } else {
        this.store.update(state => ({
          ...state,
          isLoadingPopular: false
        }));

        return {
          success: false,
          error: result.error || 'Error cargando restaurantes populares'
        };
      }
    } catch (error) {
      this.store.update(state => ({
        ...state,
        isLoadingPopular: false
      }));

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido cargando populares'
      };
    }
  }

  /**
   * Verifica el estado de favorito para múltiples restaurantes
   */
  async checkMultipleFavorites(restaurantIds: string[]): Promise<void> {
    if (!authStore.getIsAuthenticated()) return;

    try {
      const result = await restaurantFavoritesService.checkMultipleFavorites(restaurantIds);
      
      if (result.success && result.data) {
        this.store.update(state => ({
          ...state,
          favoriteStatusCache: {
            ...state.favoriteStatusCache,
            ...result.data!
          }
        }));
      }
    } catch (error) {
      console.error('Error verificando múltiples favoritos:', error);
    }
  }

  /**
   * Filtra favoritos por criterios
   */
  filterFavorites(filters: {
    cuisine?: string;
    priceRange?: string;
    search?: string;
  }): Readable<Restaurant[]> {
    return derived(this.favorites, $favorites => 
      restaurantFavoritesService.utils.filterRestaurants($favorites, filters)
    );
  }

  /**
   * Obtiene favoritos ordenados por fecha
   */
  get favoritesByDate(): Readable<Restaurant[]> {
    return derived(this.favorites, $favorites => 
      restaurantFavoritesService.utils.sortByFavoritedDate($favorites)
    );
  }

  /**
   * Limpia todos los favoritos (útil al cerrar sesión)
   */
  clearFavorites(): void {
    this.store.set(initialState);
  }

  /**
   * Limpia el error del store
   */
  clearError(): void {
    this.store.update(state => ({
      ...state,
      error: null
    }));
  }

  /**
   * Establece el estado de carga principal
   */
  setLoading(isLoading: boolean): void {
    this.store.update(state => ({
      ...state,
      isLoading
    }));
  }

  /**
   * Establece el estado de carga de populares
   */
  setLoadingPopular(isLoadingPopular: boolean): void {
    this.store.update(state => ({
      ...state,
      isLoadingPopular
    }));
  }

  /**
   * Obtiene el estado actual (para uso en funciones)
   */
  getCurrentState(): FavoritesState {
    let currentState: FavoritesState;
    this.store.subscribe(state => {
      currentState = state;
    })();
    return currentState!;
  }

  /**
   * Métodos helper para obtener valores sincrónicamente
   */
  getFavorites(): Restaurant[] {
    return this.getCurrentState().favorites;
  }

  getFavoritesCount(): number {
    return this.getCurrentState().favoritesCount;
  }

  getIsLoading(): boolean {
    return this.getCurrentState().isLoading;
  }

  getError(): string | null {
    return this.getCurrentState().error;
  }
}

/**
 * Instancia única del store de favoritos de restaurantes
 */
export const restaurantFavoritesStore = new RestaurantFavoritesStore();

// Exports individuales para compatibilidad
export const favorites = restaurantFavoritesStore.favorites;
export const popularRestaurants = restaurantFavoritesStore.popularRestaurants;
export const favoritesCount = restaurantFavoritesStore.favoritesCount;
export const favoritesLoading = restaurantFavoritesStore.isLoading;
export const favoritesError = restaurantFavoritesStore.error;
export const favoritesPagination = restaurantFavoritesStore.pagination;
export const hasFavorites = restaurantFavoritesStore.hasFavorites;
export const favoriteIds = restaurantFavoritesStore.favoriteIds;
/**
 * Hook personalizado para usar en componentes Svelte - VERSIÓN CORREGIDA
 */
export function useRestaurantFavorites() {
  // Devolver stores reactivos en lugar de valores estáticos
  return {
    // Stores reactivos (estos SÍ son reactivos)
    favorites: restaurantFavoritesStore.favorites,
    popularRestaurants: restaurantFavoritesStore.popularRestaurants,
    favoritesCount: restaurantFavoritesStore.favoritesCount,
    isLoading: restaurantFavoritesStore.isLoading,
    isLoadingPopular: restaurantFavoritesStore.isLoadingPopular,
    error: restaurantFavoritesStore.error,
    pagination: restaurantFavoritesStore.pagination,
    hasFavorites: restaurantFavoritesStore.hasFavorites,
    favoriteIds: restaurantFavoritesStore.favoriteIds,

    // Métodos (estos no cambian)
    loadFavorites: restaurantFavoritesStore.loadUserFavorites.bind(restaurantFavoritesStore),
    loadMoreFavorites: restaurantFavoritesStore.loadMoreFavorites.bind(restaurantFavoritesStore),
    refreshFavorites: restaurantFavoritesStore.refreshFavorites.bind(restaurantFavoritesStore),
    toggleFavorite: restaurantFavoritesStore.toggleFavorite.bind(restaurantFavoritesStore),
    addToFavorites: restaurantFavoritesStore.addToFavorites.bind(restaurantFavoritesStore),
    removeFromFavorites: restaurantFavoritesStore.removeFromFavorites.bind(restaurantFavoritesStore),
    isRestaurantFavorited: restaurantFavoritesStore.isRestaurantFavorited.bind(restaurantFavoritesStore),
    findFavoriteRestaurant: restaurantFavoritesStore.findFavoriteRestaurant.bind(restaurantFavoritesStore),
    loadPopularRestaurants: restaurantFavoritesStore.loadPopularRestaurants.bind(restaurantFavoritesStore),
    checkMultipleFavorites: restaurantFavoritesStore.checkMultipleFavorites.bind(restaurantFavoritesStore),
    clearError: restaurantFavoritesStore.clearError.bind(restaurantFavoritesStore),
    
    // Stores derivados útiles
    filterFavorites: restaurantFavoritesStore.filterFavorites.bind(restaurantFavoritesStore),
    favoritesByDate: restaurantFavoritesStore.favoritesByDate
  };
}

// Default export
export default restaurantFavoritesStore;