// src/stores/dishStore20.ts

import { writable, derived, type Writable, type Readable } from 'svelte/store';
import { 
  dishService, 
  type ApiResult,
  type DishCreateRequest,
  type DishUpdateRequest,
  type DishResponse,
  type DishPaginationResponse,
  type DishPaginationParams,
  type DishSearchFilters,
  type RatingRequest,
  type RatingResponse,
  type FavoriteToggleResponse,
  type ImageUploadResponse,
  type DishStatsResponse,
  type DishPositionUpdate,
  type PositionUpdateResponse,
  type BulkPositionUpdateResponse
} from '../services/dishService.ts';
import type { Dish } from '../interfaces/dish.ts';
import { authStore } from './authStore.ts';

// Types para el estado de platillos
export interface DishesState {
  // Platillos en cache
  allDishes: Dish[];
  currentDish: Dish | null;
  topRatedDishes: Dish[];
  mostCommentedDishes: Dish[];
  searchResults: Dish[];
  
  // Paginación
  pagination: {
    total: number;
    page: number;
    limit: number;
    total_pages: number;
    has_next: boolean;
    has_prev: boolean;
  } | null;
  
  // Estados de carga
  isLoading: boolean;
  isLoadingAll: boolean;
  isLoadingCurrent: boolean;
  isLoadingTopRated: boolean;
  isLoadingMostCommented: boolean;
  isSearching: boolean;
  isCreating: boolean;
  isUpdating: boolean;
  isDeleting: boolean;
  isRating: boolean;
  isTogglingFavorite: boolean;
  isUploadingImage: boolean;
  isLoadingStats: boolean;
  isReorderingDishes: boolean;
  
  // Errores
  error: string | null;
  createError: string | null;
  updateError: string | null;
  deleteError: string | null;
  ratingError: string | null;
  favoriteError: string | null;
  imageError: string | null;
  searchError: string | null;
  statsError: string | null;
  reorderError: string | null;
  
  // Cache metadata
  lastUpdated: {
    all: Date | null;
    current: Date | null;
    topRated: Date | null;
    mostCommented: Date | null;
    search: Date | null;
  };
  
  // Filtros activos
  activeFilters: {
    categoryId?: string;
    restaurantId?: string;
    search?: string;
    sort_by?: string;
    sort_order?: 1 | -1;
  };
  
  // Estadísticas del platillo actual
  currentDishStats: DishStatsResponse | null;
  
  // Usuario actual
  currentUserId: string | null;
  isAuthenticated: boolean;
}

// Types para resultados de acciones
export interface CreateDishResult {
  success: boolean;
  dish?: DishResponse;
  error?: string;
}

export interface UpdateDishResult {
  success: boolean;
  dish?: DishResponse;
  error?: string;
}

export interface DeleteDishResult {
  success: boolean;
  message?: string;
  error?: string;
}

export interface RateDishResult {
  success: boolean;
  rating?: RatingResponse;
  error?: string;
}

export interface FavoriteResult {
  success: boolean;
  favorite?: FavoriteToggleResponse;
  error?: string;
}

export interface UploadImageResult {
  success: boolean;
  dish?: ImageUploadResponse;
  error?: string;
}

export interface SearchResult {
  success: boolean;
  dishes?: Dish[];
  pagination?: any;
  error?: string;
}

export interface ReorderDishesResult {
  success: boolean;
  message?: string;
  error?: string;
}

/**
 * Estado inicial del store
 */
const initialState: DishesState = {
  allDishes: [],
  currentDish: null,
  topRatedDishes: [],
  mostCommentedDishes: [],
  searchResults: [],
  pagination: null,
  isLoading: false,
  isLoadingAll: false,
  isLoadingCurrent: false,
  isLoadingTopRated: false,
  isLoadingMostCommented: false,
  isSearching: false,
  isCreating: false,
  isUpdating: false,
  isDeleting: false,
  isRating: false,
  isTogglingFavorite: false,
  isUploadingImage: false,
  isLoadingStats: false,
  error: null,
  createError: null,
  updateError: null,
  deleteError: null,
  ratingError: null,
  favoriteError: null,
  imageError: null,
  searchError: null,
  statsError: null,
  lastUpdated: {
    all: null,
    current: null,
    topRated: null,
    mostCommented: null,
    search: null
  },
  activeFilters: {},
  currentDishStats: null,
  currentUserId: null,
  isAuthenticated: false
};

/**
 * Clase para manejar el estado de platillos
 */
class DishStore {
  private store: Writable<DishesState>;
  
  // Stores derivados públicos
  public readonly subscribe: Writable<DishesState>['subscribe'];
  public readonly isLoading: Readable<boolean>;
  public readonly isLoadingAll: Readable<boolean>;
  public readonly isLoadingCurrent: Readable<boolean>;
  public readonly isCreating: Readable<boolean>;
  public readonly isUpdating: Readable<boolean>;
  public readonly isDeleting: Readable<boolean>;
  public readonly isRating: Readable<boolean>;
  public readonly isTogglingFavorite: Readable<boolean>;
  public readonly isUploadingImage: Readable<boolean>;
  public readonly isSearching: Readable<boolean>;
  public readonly isReorderingDishes: Readable<boolean>;
  public readonly error: Readable<string | null>;
  public readonly createError: Readable<string | null>;
  public readonly updateError: Readable<string | null>;
  public readonly deleteError: Readable<string | null>;
  public readonly ratingError: Readable<string | null>;
  public readonly favoriteError: Readable<string | null>;
  public readonly imageError: Readable<string | null>;
  public readonly searchError: Readable<string | null>;
  public readonly allDishes: Readable<Dish[]>;
  public readonly currentDish: Readable<Dish | null>;
  public readonly topRatedDishes: Readable<Dish[]>;
  public readonly mostCommentedDishes: Readable<Dish[]>;
  public readonly searchResults: Readable<Dish[]>;
  public readonly pagination: Readable<any>;
  public readonly currentDishStats: Readable<DishStatsResponse | null>;
  public readonly isAuthenticated: Readable<boolean>;

  constructor() {
    this.store = writable<DishesState>(initialState);
    this.subscribe = this.store.subscribe;

    // Stores derivados
    this.isLoading = derived(this.store, $state => $state.isLoading);
    this.isLoadingAll = derived(this.store, $state => $state.isLoadingAll);
    this.isLoadingCurrent = derived(this.store, $state => $state.isLoadingCurrent);
    this.isCreating = derived(this.store, $state => $state.isCreating);
    this.isUpdating = derived(this.store, $state => $state.isUpdating);
    this.isDeleting = derived(this.store, $state => $state.isDeleting);
    this.isRating = derived(this.store, $state => $state.isRating);
    this.isTogglingFavorite = derived(this.store, $state => $state.isTogglingFavorite);
    this.isUploadingImage = derived(this.store, $state => $state.isUploadingImage);
    this.isSearching = derived(this.store, $state => $state.isSearching);
    this.isReorderingDishes = derived(this.store, $state => $state.isReorderingDishes);
    this.error = derived(this.store, $state => $state.error);
    this.createError = derived(this.store, $state => $state.createError);
    this.updateError = derived(this.store, $state => $state.updateError);
    this.deleteError = derived(this.store, $state => $state.deleteError);
    this.ratingError = derived(this.store, $state => $state.ratingError);
    this.favoriteError = derived(this.store, $state => $state.favoriteError);
    this.imageError = derived(this.store, $state => $state.imageError);
    this.searchError = derived(this.store, $state => $state.searchError);
    this.reorderError = derived(this.store, $state => $state.reorderError);
    this.allDishes = derived(this.store, $state => $state.allDishes);
    this.currentDish = derived(this.store, $state => $state.currentDish);
    this.topRatedDishes = derived(this.store, $state => $state.topRatedDishes);
    this.mostCommentedDishes = derived(this.store, $state => $state.mostCommentedDishes);
    this.searchResults = derived(this.store, $state => $state.searchResults);
    this.pagination = derived(this.store, $state => $state.pagination);
    this.currentDishStats = derived(this.store, $state => $state.currentDishStats);
    this.isAuthenticated = derived(this.store, $state => $state.isAuthenticated);

    // Reaccionar a cambios de autenticación
    authStore.isAuthenticated.subscribe(isAuthenticated => {
      this.store.update(state => ({
        ...state,
        isAuthenticated,
        currentUserId: isAuthenticated ? authStore.getCurrentUser()?.id || null : null
      }));
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
   * Carga todos los platillos
   */
  async loadAllDishes(params: DishPaginationParams = {}, forceReload: boolean = false): Promise<ApiResult<DishPaginationResponse>> {
    const currentState = this.getCurrentState();
    
    // Verificar cache si no es forzado
    if (!forceReload && currentState.allDishes.length > 0 && currentState.lastUpdated.all) {
      const timeDiff = Date.now() - currentState.lastUpdated.all.getTime();
      if (timeDiff < 3 * 60 * 1000) { // 3 minutos de cache
        return {
          success: true,
          data: {
            dishes: currentState.allDishes,
            pagination: currentState.pagination!
          }
        };
      }
    }

    this.setLoadingAll(true);
    this.clearError();

    try {
      const result = await dishService.getAllDishes(params);

      if (result.success && result.data) {
        this.store.update(state => ({
          ...state,
          allDishes: result.data!.dishes,
          pagination: result.data!.pagination,
          isLoadingAll: false,
          lastUpdated: {
            ...state.lastUpdated,
            all: new Date()
          },
          error: null,
          activeFilters: {
            search: params.search,
            sort_by: params.sort_by,
            sort_order: params.sort_order
          }
        }));

        return result;
      } else {
        this.setLoadingAll(false);
        this.setError(result.error || 'Error cargando platillos');
        return result;
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido cargando platillos';
      this.setLoadingAll(false);
      this.setError(errorMessage);
      
      return {
        success: false,
        error: errorMessage
      };
    }
  }

  /**
   * Carga platillos filtrados
   */
  async loadDishesByFilters(
    categoryId?: string,
    restaurantId?: string,
    params: DishPaginationParams = {}
  ): Promise<ApiResult<DishPaginationResponse>> {
    this.setLoadingAll(true);
    this.clearError();

    try {
      const result = await dishService.getDishesByFilters(categoryId, restaurantId, params);

      if (result.success && result.data) {
        this.store.update(state => ({
          ...state,
          allDishes: result.data!.dishes,
          pagination: result.data!.pagination,
          isLoadingAll: false,
          lastUpdated: {
            ...state.lastUpdated,
            all: new Date()
          },
          error: null,
          activeFilters: {
            categoryId,
            restaurantId,
            search: params.search,
            sort_by: params.sort_by,
            sort_order: params.sort_order
          }
        }));

        return result;
      } else {
        this.setLoadingAll(false);
        this.setError(result.error || 'Error cargando platillos filtrados');
        return result;
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido cargando platillos';
      this.setLoadingAll(false);
      this.setError(errorMessage);
      
      return {
        success: false,
        error: errorMessage
      };
    }
  }

  /**
   * Obtiene un platillo específico por ID
   */
  async loadDish(dishId: string, forceReload: boolean = false): Promise<ApiResult<Dish>> {
    // Verificar cache si no es forzado
    if (!forceReload) {
      const currentState = this.getCurrentState();
      const cached = currentState.allDishes.find(d => d.id === dishId);
      
      if (cached) {
        this.setCurrentDish(cached);
        return {
          success: true,
          data: cached
        };
      }
    }

    this.setLoadingCurrent(true);
    this.clearError();

    try {
      const result = await dishService.getDish(dishId);

      if (result.success && result.data) {
        this.setCurrentDish(result.data);
        this.setLoadingCurrent(false);

        return result;
      } else {
        this.setLoadingCurrent(false);
        this.setError(result.error || 'Error cargando platillo');
        return result;
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido cargando platillo';
      this.setLoadingCurrent(false);
      this.setError(errorMessage);
      
      return {
        success: false,
        error: errorMessage
      };
    }
  }

  /**
   * Carga platillos por username del restaurante
   */
  async loadDishesByRestaurantUsername(
    username: string,
    params: DishPaginationParams = {}
  ): Promise<ApiResult<DishPaginationResponse>> {
    this.setLoadingAll(true);
    this.clearError();

    try {
      const result = await dishService.getDishesByRestaurantUsername(username, params);

      if (result.success && result.data) {
        this.store.update(state => ({
          ...state,
          allDishes: result.data!.dishes,
          pagination: result.data!.pagination,
          isLoadingAll: false,
          lastUpdated: {
            ...state.lastUpdated,
            all: new Date()
          },
          error: null,
          activeFilters: {
            ...state.activeFilters,
            search: params.search,
            sort_by: params.sort_by,
            sort_order: params.sort_order
          }
        }));

        return result;
      } else {
        this.setLoadingAll(false);
        this.setError(result.error || 'Error cargando platillos del restaurante');
        return result;
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido cargando platillos';
      this.setLoadingAll(false);
      this.setError(errorMessage);
      
      return {
        success: false,
        error: errorMessage
      };
    }
  }

  /**
   * Carga platillos por username del restaurante y categoría
   */
  async loadDishesByRestaurantUsernameAndCategory(
    username: string,
    categoryId: string,
    params: DishPaginationParams = {}
  ): Promise<ApiResult<DishPaginationResponse>> {
    this.setLoadingAll(true);
    this.clearError();

    try {
      const result = await dishService.getDishesByRestaurantUsernameAndCategory(username, categoryId, params);

      if (result.success && result.data) {
        this.store.update(state => ({
          ...state,
          allDishes: result.data!.dishes,
          pagination: result.data!.pagination,
          isLoadingAll: false,
          lastUpdated: {
            ...state.lastUpdated,
            all: new Date()
          },
          error: null,
          activeFilters: {
            categoryId,
            search: params.search,
            sort_by: params.sort_by,
            sort_order: params.sort_order
          }
        }));

        return result;
      } else {
        this.setLoadingAll(false);
        this.setError(result.error || 'Error cargando platillos de la categoría');
        return result;
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido cargando platillos';
      this.setLoadingAll(false);
      this.setError(errorMessage);
      
      return {
        success: false,
        error: errorMessage
      };
    }
  }

  /**
   * Crea un nuevo platillo
   */
  async createDish(dishData: DishCreateRequest, image?: File): Promise<CreateDishResult> {
    if (!this.getCurrentState().isAuthenticated) {
      return {
        success: false,
        error: 'Debes estar autenticado para crear platillos'
      };
    }

    this.setCreating(true);
    this.clearCreateError();

    try {
      const result = await dishService.createDish(dishData, image);

      if (result.success && result.data) {
        // Actualizar cache local
        this.store.update(state => ({
          ...state,
          allDishes: [result.data!, ...state.allDishes],
          currentDish: result.data!,
          isCreating: false,
          createError: null,
          lastUpdated: {
            ...state.lastUpdated,
            all: new Date()
          }
        }));

        return {
          success: true,
          dish: result.data
        };
      } else {
        this.setCreating(false);
        this.setCreateError(result.error || 'Error creando platillo');
        
        return {
          success: false,
          error: result.error || 'Error creando platillo'
        };
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido creando platillo';
      this.setCreating(false);
      this.setCreateError(errorMessage);
      
      return {
        success: false,
        error: errorMessage
      };
    }
  }

  /**
   * Actualiza un platillo existente
   */
  async updateDish(
    dishId: string,
    dishData: DishUpdateRequest,
    image?: File
  ): Promise<UpdateDishResult> {
    if (!this.getCurrentState().isAuthenticated) {
      return {
        success: false,
        error: 'Debes estar autenticado para actualizar platillos'
      };
    }

    this.setUpdating(true);
    this.clearUpdateError();

    try {
      const result = await dishService.updateDish(dishId, dishData, image);

      if (result.success && result.data) {
        // Actualizar cache local
        this.store.update(state => {
          const updateDishInArray = (dishes: Dish[]) =>
            dishes.map(d => d.id === dishId ? result.data! : d);

          return {
            ...state,
            allDishes: updateDishInArray(state.allDishes),
            searchResults: updateDishInArray(state.searchResults),
            topRatedDishes: updateDishInArray(state.topRatedDishes),
            mostCommentedDishes: updateDishInArray(state.mostCommentedDishes),
            currentDish: state.currentDish?.id === dishId ? result.data! : state.currentDish,
            isUpdating: false,
            updateError: null,
            lastUpdated: {
              ...state.lastUpdated,
              all: new Date(),
              current: new Date()
            }
          };
        });

        return {
          success: true,
          dish: result.data
        };
      } else {
        this.setUpdating(false);
        this.setUpdateError(result.error || 'Error actualizando platillo');
        
        return {
          success: false,
          error: result.error || 'Error actualizando platillo'
        };
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido actualizando platillo';
      this.setUpdating(false);
      this.setUpdateError(errorMessage);
      
      return {
        success: false,
        error: errorMessage
      };
    }
  }

  /**
   * Elimina un platillo
   */
  async deleteDish(dishId: string): Promise<DeleteDishResult> {
    if (!this.getCurrentState().isAuthenticated) {
      return {
        success: false,
        error: 'Debes estar autenticado para eliminar platillos'
      };
    }

    this.setDeleting(true);
    this.clearDeleteError();

    try {
      const result = await dishService.deleteDish(dishId);

      if (result.success) {
        // Actualizar cache local
        this.store.update(state => {
          const filterDishes = (dishes: Dish[]) =>
            dishes.filter(d => d.id !== dishId);

          return {
            ...state,
            allDishes: filterDishes(state.allDishes),
            searchResults: filterDishes(state.searchResults),
            topRatedDishes: filterDishes(state.topRatedDishes),
            mostCommentedDishes: filterDishes(state.mostCommentedDishes),
            currentDish: state.currentDish?.id === dishId ? null : state.currentDish,
            isDeleting: false,
            deleteError: null,
            lastUpdated: {
              ...state.lastUpdated,
              all: new Date()
            }
          };
        });

        return {
          success: true,
          message: result.data?.message || 'Platillo eliminado correctamente'
        };
      } else {
        this.setDeleting(false);
        this.setDeleteError(result.error || 'Error eliminando platillo');
        
        return {
          success: false,
          error: result.error || 'Error eliminando platillo'
        };
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido eliminando platillo';
      this.setDeleting(false);
      this.setDeleteError(errorMessage);
      
      return {
        success: false,
        error: errorMessage
      };
    }
  }

  /**
   * Valora un platillo
   */
  async rateDish(dishId: string, ratingData: RatingRequest): Promise<RateDishResult> {
    this.setRating(true);
    this.clearRatingError();

    try {
      const result = await dishService.rateDish(dishId, ratingData);

      if (result.success && result.data) {
        // Actualizar platillo en cache si existe
        this.store.update(state => {
          const updateDishRating = (dishes: Dish[]) =>
            dishes.map(d => {
              if (d.id === dishId) {
                return {
                  ...d,
                  rating: result.data!.rating || d.rating,
                  reviewsCount: (d.reviewsCount || 0) + 1
                };
              }
              return d;
            });

          return {
            ...state,
            allDishes: updateDishRating(state.allDishes),
            searchResults: updateDishRating(state.searchResults),
            topRatedDishes: updateDishRating(state.topRatedDishes),
            mostCommentedDishes: updateDishRating(state.mostCommentedDishes),
            currentDish: state.currentDish?.id === dishId 
              ? {
                  ...state.currentDish,
                  rating: result.data!.rating || state.currentDish.rating,
                  reviewsCount: (state.currentDish.reviewsCount || 0) + 1
                }
              : state.currentDish,
            isRating: false,
            ratingError: null
          };
        });

        return {
          success: true,
          rating: result.data
        };
      } else {
        this.setRating(false);
        this.setRatingError(result.error || 'Error valorando platillo');
        
        return {
          success: false,
          error: result.error || 'Error valorando platillo'
        };
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido valorando platillo';
      this.setRating(false);
      this.setRatingError(errorMessage);
      
      return {
        success: false,
        error: errorMessage
      };
    }
  }

  /**
   * Alterna el estado de favorito de un platillo
   */
  async toggleFavorite(dishId: string): Promise<FavoriteResult> {
    if (!this.getCurrentState().isAuthenticated) {
      return {
        success: false,
        error: 'Debes estar autenticado para marcar favoritos'
      };
    }

    this.setTogglingFavorite(true);
    this.clearFavoriteError();

    try {
      const result = await dishService.toggleFavorite(dishId);

      if (result.success && result.data) {
        // Actualizar platillo en cache
        this.store.update(state => {
          const updateDishFavorite = (dishes: Dish[]) =>
            dishes.map(d => {
              if (d.id === dishId) {
                return {
                  ...d,
                  favorites: result.data!.favorites,
                  userFav: result.data!.userFav
                };
              }
              return d;
            });

          return {
            ...state,
            allDishes: updateDishFavorite(state.allDishes),
            searchResults: updateDishFavorite(state.searchResults),
            topRatedDishes: updateDishFavorite(state.topRatedDishes),
            mostCommentedDishes: updateDishFavorite(state.mostCommentedDishes),
            currentDish: state.currentDish?.id === dishId 
              ? {
                  ...state.currentDish,
                  favorites: result.data!.favorites,
                  userFav: result.data!.userFav
                }
              : state.currentDish,
            isTogglingFavorite: false,
            favoriteError: null
          };
        });

        return {
          success: true,
          favorite: result.data
        };
      } else {
        this.setTogglingFavorite(false);
        this.setFavoriteError(result.error || 'Error alternando favorito');
        
        return {
          success: false,
          error: result.error || 'Error alternando favorito'
        };
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido alternando favorito';
      this.setTogglingFavorite(false);
      this.setFavoriteError(errorMessage);
      
      return {
        success: false,
        error: errorMessage
      };
    }
  }

  /**
   * Sube una imagen para un platillo
   */
  async uploadDishImage(dishId: string, imageFile: File): Promise<UploadImageResult> {
    if (!this.getCurrentState().isAuthenticated) {
      return {
        success: false,
        error: 'Debes estar autenticado para subir imágenes'
      };
    }

    this.setUploadingImage(true);
    this.clearImageError();

    try {
      const result = await dishService.uploadDishImage(dishId, imageFile);

      if (result.success && result.data) {
        // Actualizar cache local
        this.store.update(state => {
          const updateDishInArray = (dishes: Dish[]) =>
            dishes.map(d => d.id === dishId ? { ...d, ...result.data! } : d);

          return {
            ...state,
            allDishes: updateDishInArray(state.allDishes),
            searchResults: updateDishInArray(state.searchResults),
            topRatedDishes: updateDishInArray(state.topRatedDishes),
            mostCommentedDishes: updateDishInArray(state.mostCommentedDishes),
            currentDish: state.currentDish?.id === dishId 
              ? { ...state.currentDish, ...result.data! } 
              : state.currentDish,
            isUploadingImage: false,
            imageError: null
          };
        });

        return {
          success: true,
          dish: result.data
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
   * Carga platillos mejor valorados
   */
  async loadTopRatedDishes(
    limit: number = 10,
    minRatings: number = 3,
    restaurantId?: string,
    categoryId?: string,
    forceReload: boolean = false
  ): Promise<ApiResult<Dish[]>> {
    const currentState = this.getCurrentState();
    
    // Verificar cache si no es forzado
    if (!forceReload && currentState.topRatedDishes.length > 0 && currentState.lastUpdated.topRated) {
      const timeDiff = Date.now() - currentState.lastUpdated.topRated.getTime();
      if (timeDiff < 5 * 60 * 1000) { // 5 minutos de cache
        return {
          success: true,
          data: currentState.topRatedDishes
        };
      }
    }

    this.setLoadingTopRated(true);
    this.clearError();

    try {
      const result = await dishService.getTopRatedDishes(limit, minRatings, restaurantId, categoryId);

      if (result.success && result.data) {
        this.store.update(state => ({
          ...state,
          topRatedDishes: result.data!,
          isLoadingTopRated: false,
          lastUpdated: {
            ...state.lastUpdated,
            topRated: new Date()
          },
          error: null
        }));

        return result;
      } else {
        this.setLoadingTopRated(false);
        this.setError(result.error || 'Error cargando platillos mejor valorados');
        return result;
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido cargando platillos';
      this.setLoadingTopRated(false);
      this.setError(errorMessage);
      
      return {
        success: false,
        error: errorMessage
      };
    }
  }

  /**
   * Carga platillos más comentados
   */
  async loadMostCommentedDishes(
    limit: number = 10,
    minComments: number = 2,
    restaurantId?: string,
    forceReload: boolean = false
  ): Promise<ApiResult<Dish[]>> {
    const currentState = this.getCurrentState();
    
    // Verificar cache si no es forzado
    if (!forceReload && currentState.mostCommentedDishes.length > 0 && currentState.lastUpdated.mostCommented) {
      const timeDiff = Date.now() - currentState.lastUpdated.mostCommented.getTime();
      if (timeDiff < 5 * 60 * 1000) { // 5 minutos de cache
        return {
          success: true,
          data: currentState.mostCommentedDishes
        };
      }
    }

    this.setLoadingMostCommented(true);
    this.clearError();

    try {
      const result = await dishService.getMostCommentedDishes(limit, minComments, restaurantId);

      if (result.success && result.data) {
        this.store.update(state => ({
          ...state,
          mostCommentedDishes: result.data!,
          isLoadingMostCommented: false,
          lastUpdated: {
            ...state.lastUpdated,
            mostCommented: new Date()
          },
          error: null
        }));

        return result;
      } else {
        this.setLoadingMostCommented(false);
        this.setError(result.error || 'Error cargando platillos más comentados');
        return result;
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido cargando platillos';
      this.setLoadingMostCommented(false);
      this.setError(errorMessage);
      
      return {
        success: false,
        error: errorMessage
      };
    }
  }

  /**
   * Búsqueda avanzada de platillos
   */
  async searchDishes(
    filters: DishSearchFilters,
    limit: number = 20,
    page: number = 1
  ): Promise<SearchResult> {
    this.setSearching(true);
    this.clearSearchError();

    try {
      const result = await dishService.searchDishesAdvanced(filters, limit, page);

      if (result.success && result.data) {
        this.store.update(state => ({
          ...state,
          searchResults: result.data!.dishes,
          pagination: result.data!.pagination,
          isSearching: false,
          lastUpdated: {
            ...state.lastUpdated,
            search: new Date()
          },
          searchError: null
        }));

        return {
          success: true,
          dishes: result.data.dishes,
          pagination: result.data.pagination
        };
      } else {
        this.setSearching(false);
        this.setSearchError(result.error || 'Error en búsqueda');
        
        return {
          success: false,
          error: result.error || 'Error en búsqueda'
        };
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido en búsqueda';
      this.setSearching(false);
      this.setSearchError(errorMessage);
      
      return {
        success: false,
        error: errorMessage
      };
    }
  }

  /**
   * Carga estadísticas de un platillo
   */
  async loadDishStats(dishId: string): Promise<ApiResult<DishStatsResponse>> {
    this.setLoadingStats(true);
    this.clearStatsError();

    try {
      const result = await dishService.getDishStats(dishId);

      if (result.success && result.data) {
        this.store.update(state => ({
          ...state,
          currentDishStats: result.data!,
          isLoadingStats: false,
          statsError: null
        }));

        return result;
      } else {
        this.setLoadingStats(false);
        this.setStatsError(result.error || 'Error cargando estadísticas');
        return result;
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido cargando estadísticas';
      this.setLoadingStats(false);
      this.setStatsError(errorMessage);
      
      return {
        success: false,
        error: errorMessage
      };
    }
  }

  /**
   * Reordena platillos por drag & drop
   */
  async reorderDishes(
    originalDishes: Dish[],
    draggedIndex: number,
    targetIndex: number,
    categoryId?: string
  ): Promise<ReorderDishesResult> {
    this.setReorderingDishes(true);
    this.clearReorderError();

    // Crear nueva lista con el elemento movido
    const reorderedDishes = [...originalDishes];
    const [draggedDish] = reorderedDishes.splice(draggedIndex, 1);
    reorderedDishes.splice(targetIndex, 0, draggedDish);

    // Actualizar posiciones optimistamente INMEDIATAMENTE
    const updatedDishes = reorderedDishes.map((dish, index) => ({
      ...dish,
      position: index + 1
    }));

    // Guardar el estado original para poder revertir en caso de error
    const originalState = this.getCurrentState();
    const originalDishesState = [...originalState.allDishes];

    // Actualizar el store optimistamente INMEDIATAMENTE
    this.store.update(state => ({
      ...state,
      allDishes: state.allDishes.map(dish => {
        const updatedDish = updatedDishes.find(d => d.id === dish.id);
        return updatedDish ? { ...dish, position: updatedDish.position } : dish;
      })
    }));

    try {
      // Actualizar posiciones en el backend
      const positionUpdates: DishPositionUpdate[] = updatedDishes.map((dish) => ({
        dish_id: dish.id!,
        new_position: dish.position
      }));

      // Llamar al servicio para actualizar posiciones
      const result = await dishService.updateDishPositionsBulk(positionUpdates);

      if (result.success) {
        return {
          success: true,
          message: 'Platillos reordenados correctamente'
        };
      } else {
        // REVERTIR cambios optimistas en caso de error
        this.store.update(state => ({
          ...state,
          allDishes: originalDishesState
        }));
        
        this.setReorderError(result.error || 'Error reordenando platillos');
        return {
          success: false,
          error: result.error || 'Error reordenando platillos'
        };
      }
    } catch (error) {
      // REVERTIR cambios optimistas en caso de excepción
      this.store.update(state => ({
        ...state,
        allDishes: originalDishesState
      }));
      
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      this.setReorderError(errorMessage);
      return {
        success: false,
        error: errorMessage
      };
    } finally {
      this.setReorderingDishes(false);
    }
  }

  /**
   * Actualiza la posición de un platillo individual
   */
  async updateDishPosition(dishId: string, newPosition: number): Promise<ReorderDishesResult> {
    this.setReorderingDishes(true);
    this.clearReorderError();

    // Guardar el estado original para poder revertir en caso de error
    const originalState = this.getCurrentState();
    const originalDish = originalState.allDishes.find(dish => dish.id === dishId);
    const originalPosition = originalDish?.position;

    // Actualizar el store optimistamente INMEDIATAMENTE
    this.store.update(state => ({
      ...state,
      allDishes: state.allDishes.map(dish => 
        dish.id === dishId ? { ...dish, position: newPosition } : dish
      )
    }));

    try {
      const result = await dishService.updateDishPosition(dishId, newPosition);

      if (result.success) {
        return {
          success: true,
          message: 'Posición actualizada correctamente'
        };
      } else {
        // REVERTIR cambios optimistas en caso de error
        this.store.update(state => ({
          ...state,
          allDishes: state.allDishes.map(dish => 
            dish.id === dishId ? { ...dish, position: originalPosition } : dish
          )
        }));
        
        this.setReorderError(result.error || 'Error actualizando posición');
        return {
          success: false,
          error: result.error || 'Error actualizando posición'
        };
      }
    } catch (error) {
      // REVERTIR cambios optimistas en caso de excepción
      this.store.update(state => ({
        ...state,
        allDishes: state.allDishes.map(dish => 
          dish.id === dishId ? { ...dish, position: originalPosition } : dish
        )
      }));
      
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      this.setReorderError(errorMessage);
      return {
        success: false,
        error: errorMessage
      };
    } finally {
      this.setReorderingDishes(false);
    }
  }

  /**
   * Métodos de utilidad privados
   */
  private setLoadingAll(isLoading: boolean): void {
    this.store.update(state => ({ ...state, isLoadingAll: isLoading }));
  }

  private setLoadingCurrent(isLoading: boolean): void {
    this.store.update(state => ({ ...state, isLoadingCurrent: isLoading }));
  }

  private setLoadingTopRated(isLoading: boolean): void {
    this.store.update(state => ({ ...state, isLoadingTopRated: isLoading }));
  }

  private setLoadingMostCommented(isLoading: boolean): void {
    this.store.update(state => ({ ...state, isLoadingMostCommented: isLoading }));
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

  private setRating(isRating: boolean): void {
    this.store.update(state => ({ ...state, isRating }));
  }

  private setTogglingFavorite(isToggling: boolean): void {
    this.store.update(state => ({ ...state, isTogglingFavorite: isToggling }));
  }

  private setUploadingImage(isUploading: boolean): void {
    this.store.update(state => ({ ...state, isUploadingImage: isUploading }));
  }

  private setSearching(isSearching: boolean): void {
    this.store.update(state => ({ ...state, isSearching }));
  }

  private setLoadingStats(isLoading: boolean): void {
    this.store.update(state => ({ ...state, isLoadingStats: isLoading }));
  }

  private setReorderingDishes(isReordering: boolean): void {
    this.store.update(state => ({ ...state, isReorderingDishes: isReordering }));
  }

  private setCurrentDish(dish: Dish | null): void {
    this.store.update(state => ({ 
      ...state, 
      currentDish: dish,
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

  private setRatingError(error: string | null): void {
    this.store.update(state => ({ ...state, ratingError: error }));
  }

  private setFavoriteError(error: string | null): void {
    this.store.update(state => ({ ...state, favoriteError: error }));
  }

  private setImageError(error: string | null): void {
    this.store.update(state => ({ ...state, imageError: error }));
  }

  private setSearchError(error: string | null): void {
    this.store.update(state => ({ ...state, searchError: error }));
  }

  private setStatsError(error: string | null): void {
    this.store.update(state => ({ ...state, statsError: error }));
  }

  private setReorderError(error: string | null): void {
    this.store.update(state => ({ ...state, reorderError: error }));
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

  private clearRatingError(): void {
    this.setRatingError(null);
  }

  private clearFavoriteError(): void {
    this.setFavoriteError(null);
  }

  private clearImageError(): void {
    this.setImageError(null);
  }

  private clearSearchError(): void {
    this.setSearchError(null);
  }

  private clearStatsError(): void {
    this.setStatsError(null);
  }

  private clearReorderError(): void {
    this.setReorderError(null);
  }

  /**
   * Limpia todo el cache
   */
  clearCache(): void {
    this.store.update(state => ({
      ...state,
      allDishes: [],
      currentDish: null,
      topRatedDishes: [],
      mostCommentedDishes: [],
      searchResults: [],
      pagination: null,
      currentDishStats: null,
      lastUpdated: {
        all: null,
        current: null,
        topRated: null,
        mostCommented: null,
        search: null
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
      ratingError: null,
      favoriteError: null,
      imageError: null,
      searchError: null,
      statsError: null,
      reorderError: null
    }));
  }

  /**
   * Obtiene el estado actual (para uso en funciones)
   */
  getCurrentState(): DishesState {
    let currentState: DishesState;
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

  getAllDishes(): Dish[] {
    return this.getCurrentState().allDishes;
  }

  getCurrentDish(): Dish | null {
    return this.getCurrentState().currentDish;
  }

  /**
   * Stores derivados para casos específicos
   */
  getDishById(dishId: string): Readable<Dish | null> {
    return derived(this.store, $state => 
      $state.allDishes.find(d => d.id === dishId) ||
      $state.searchResults.find(d => d.id === dishId) ||
      null
    );
  }

  getDishesByCategory(categoryId: string): Readable<Dish[]> {
    return derived(this.store, $state => 
      $state.allDishes.filter(d => d.categoryId === categoryId)
    );
  }

  getFavoriteDishes(): Readable<Dish[]> {
    return derived(this.store, $state => 
      $state.allDishes.filter(d => d.userFav === true)
    );
  }

  getDishesCount(): Readable<number> {
    return derived(this.store, $state => $state.allDishes.length);
  }
}

/**
 * Instancia única del store de platillos
 */
export const dishStore = new DishStore();

// Exports individuales para compatibilidad
export const dishesLoading = dishStore.isLoading;
export const dishesLoadingAll = dishStore.isLoadingAll;
export const dishesLoadingCurrent = dishStore.isLoadingCurrent;
export const dishesCreating = dishStore.isCreating;
export const dishesUpdating = dishStore.isUpdating;
export const dishesDeleting = dishStore.isDeleting;
export const dishesRating = dishStore.isRating;
export const dishesTogglingFavorite = dishStore.isTogglingFavorite;
export const dishesUploadingImage = dishStore.isUploadingImage;
export const dishesSearching = dishStore.isSearching;
export const dishesReorderingDishes = dishStore.isReorderingDishes;
export const dishesError = dishStore.error;
export const dishesCreateError = dishStore.createError;
export const dishesUpdateError = dishStore.updateError;
export const dishesDeleteError = dishStore.deleteError;
export const dishesRatingError = dishStore.ratingError;
export const dishesFavoriteError = dishStore.favoriteError;
export const dishesImageError = dishStore.imageError;
export const dishesSearchError = dishStore.searchError;
export const dishesReorderError = dishStore.reorderError;
export const allDishes = dishStore.allDishes;
export const currentDish = dishStore.currentDish;
export const topRatedDishes = dishStore.topRatedDishes;
export const mostCommentedDishes = dishStore.mostCommentedDishes;
export const dishSearchResults = dishStore.searchResults;
export const dishPagination = dishStore.pagination;
export const currentDishStats = dishStore.currentDishStats;
export const dishesIsAuthenticated = dishStore.isAuthenticated;

/**
 * Hook personalizado para usar en componentes Svelte
 */
export function useDishes() {
  const state = dishStore.getCurrentState();

  return {
    // Estado general
    isLoading: state.isLoading,
    isLoadingAll: state.isLoadingAll,
    isLoadingCurrent: state.isLoadingCurrent,
    isCreating: state.isCreating,
    isUpdating: state.isUpdating,
    isDeleting: state.isDeleting,
    isRating: state.isRating,
    isTogglingFavorite: state.isTogglingFavorite,
    isUploadingImage: state.isUploadingImage,
    isSearching: state.isSearching,
    isReorderingDishes: state.isReorderingDishes,
    
    // Errores
    error: state.error,
    createError: state.createError,
    updateError: state.updateError,
    deleteError: state.deleteError,
    ratingError: state.ratingError,
    favoriteError: state.favoriteError,
    imageError: state.imageError,
    searchError: state.searchError,
    reorderError: state.reorderError,
    
    // Datos
    allDishes: state.allDishes,
    currentDish: state.currentDish,
    topRatedDishes: state.topRatedDishes,
    mostCommentedDishes: state.mostCommentedDishes,
    searchResults: state.searchResults,
    pagination: state.pagination,
    currentDishStats: state.currentDishStats,
    isAuthenticated: state.isAuthenticated,
    
    // Métodos
    loadAllDishes: dishStore.loadAllDishes.bind(dishStore),
    loadDishesByFilters: dishStore.loadDishesByFilters.bind(dishStore),
    loadDish: dishStore.loadDish.bind(dishStore),
    loadDishesByRestaurantUsername: dishStore.loadDishesByRestaurantUsername.bind(dishStore),
    loadDishesByRestaurantUsernameAndCategory: dishStore.loadDishesByRestaurantUsernameAndCategory.bind(dishStore),
    createDish: dishStore.createDish.bind(dishStore),
    updateDish: dishStore.updateDish.bind(dishStore),
    deleteDish: dishStore.deleteDish.bind(dishStore),
    rateDish: dishStore.rateDish.bind(dishStore),
    toggleFavorite: dishStore.toggleFavorite.bind(dishStore),
    uploadDishImage: dishStore.uploadDishImage.bind(dishStore),
    loadTopRatedDishes: dishStore.loadTopRatedDishes.bind(dishStore),
    loadMostCommentedDishes: dishStore.loadMostCommentedDishes.bind(dishStore),
    searchDishes: dishStore.searchDishes.bind(dishStore),
    loadDishStats: dishStore.loadDishStats.bind(dishStore),
    reorderDishes: dishStore.reorderDishes.bind(dishStore),
    updateDishPosition: dishStore.updateDishPosition.bind(dishStore),
    clearCache: dishStore.clearCache.bind(dishStore),
    clearAllErrors: dishStore.clearAllErrors.bind(dishStore),
    
    // Stores reactivos (para uso en componentes)
    allDishesStore: dishStore.allDishes,
    currentDishStore: dishStore.currentDish,
    isLoadingStore: dishStore.isLoading,
    errorStore: dishStore.error
  };
}

// Default export
export default dishStore;