// src/stores/dishRatingStore.ts
import { writable, derived, type Writable, type Readable } from 'svelte/store';
import { 
  dishRatingService, 
  type ApiResult,
  type RatingActionResponse
} from '../services/dishRatingService.ts';
import type { 
  DishRating, 
  DishRatingCreate, 
  DishRatingUpdate, 
  DishRatingStats,
  DishRatingsResponse,
  DishComment,
  DishCommentCreate,
  DishCommentUpdate,
  DishCommentsResponse,
  DishSearchFilters,
  DishSearchResponse,
  TopRatedDish,
  MostCommentedDish,
  FavoriteDish,
  FavoriteDishesResponse,
  ToggleFavoriteResponse
} from '../interfaces/dishRating20.ts';
import { authStore } from './authStore.ts';
import { getDeviceId } from '../services/deviceIdService.ts';

// Types para el estado de ratings de platillos
export interface DishRatingsState {
  // Ratings por platillo (cache)
  dishRatings: Record<string, DishRating[]>;
  
  // Comentarios por platillo (cache)
  dishComments: Record<string, DishComment[]>;
  
  // Estadísticas por platillo (cache)
  dishStats: Record<string, DishRatingStats>;
  
  // Estados de carga por platillo
  loadingStates: Record<string, boolean>;
  commentsLoadingStates: Record<string, boolean>;
  statsLoadingStates: Record<string, boolean>;
  
  // Platillos favoritos del usuario
  favoriteDishes: FavoriteDish[];
  
  // Top rated y most commented dishes
  topRatedDishes: TopRatedDish[];
  mostCommentedDishes: MostCommentedDish[];
  
  // Resultados de búsqueda
  searchResults: DishSearchResponse | null;
  
  // Estados generales
  isLoading: boolean;
  isLoadingTop: boolean;
  isLoadingMostCommented: boolean;
  isLoadingSearch: boolean;
  isLoadingFavorites: boolean;
  isCreatingComment: Record<string, boolean>;
  isCreatingRating: Record<string, boolean>;
  isTogglingFavorite: Record<string, boolean>;
  error: string | null;
  commentsError: string | null;
  favoritesError: string | null;
  
  // Paginación por platillo (ratings)
  paginationData: Record<string, {
    page: number;
    limit: number;
    total: number;
    total_pages: number;
    has_next: boolean;
    has_prev: boolean;
  }>;
  
  // Paginación de comentarios por platillo
  commentsPaginationData: Record<string, {
    page: number;
    limit: number;
    total: number;
    total_pages: number;
    has_next: boolean;
    has_prev: boolean;
  }>;
  
  // Paginación de favoritos
  favoritesPagination: {
    page: number;
    limit: number;
    total: number;
    total_pages: number;
    has_next: boolean;
    has_prev: boolean;
  } | null;
  
  // Cache del usuario actual y device ID
  currentUserId: string | null;
  deviceId: string | null;
  isAuthenticated: boolean;
  
  // Timestamp de última actualización por platillo
  lastUpdated: Record<string, Date>;
  commentsLastUpdated: Record<string, Date>;
  favoritesLastUpdated: Date | null;
}

// Types para resultados de acciones
export interface CreateRatingResult {
  success: boolean;
  rating?: RatingActionResponse;
  error?: string;
}

export interface CreateCommentResult {
  success: boolean;
  comment?: DishComment;
  error?: string;
}

export interface LoadCommentsResult {
  success: boolean;
  data?: DishCommentsResponse;
  error?: string;
}

export interface LoadRatingsResult {
  success: boolean;
  data?: DishRatingsResponse;
  error?: string;
}

export interface UpdateRatingResult {
  success: boolean;
  rating?: RatingActionResponse;
  error?: string;
}

export interface DeleteRatingResult {
  success: boolean;
  message?: string;
  error?: string;
}

export interface ToggleFavoriteResult {
  success: boolean;
  data?: ToggleFavoriteResponse;
  error?: string;
}

/**
 * Estado inicial de ratings de platillos
 */
const initialState: DishRatingsState = {
  dishRatings: {},
  dishComments: {},
  dishStats: {},
  loadingStates: {},
  commentsLoadingStates: {},
  statsLoadingStates: {},
  favoriteDishes: [],
  topRatedDishes: [],
  mostCommentedDishes: [],
  searchResults: null,
  isLoading: false,
  isLoadingTop: false,
  isLoadingMostCommented: false,
  isLoadingSearch: false,
  isLoadingFavorites: false,
  isCreatingComment: {},
  isCreatingRating: {},
  isTogglingFavorite: {},
  error: null,
  commentsError: null,
  favoritesError: null,
  paginationData: {},
  commentsPaginationData: {},
  favoritesPagination: null,
  currentUserId: null,
  deviceId: null,
  isAuthenticated: false,
  lastUpdated: {},
  commentsLastUpdated: {},
  favoritesLastUpdated: null
};

/**
 * Clase para manejar el estado de ratings, comentarios y favoritos de platillos
 */
class DishRatingStore {
  private store: Writable<DishRatingsState>;
  
  // Stores derivados públicos
  public readonly subscribe: Writable<DishRatingsState>['subscribe'];
  public readonly isLoading: Readable<boolean>;
  public readonly isLoadingTop: Readable<boolean>;
  public readonly isLoadingMostCommented: Readable<boolean>;
  public readonly isLoadingSearch: Readable<boolean>;
  public readonly isLoadingFavorites: Readable<boolean>;
  public readonly error: Readable<string | null>;
  public readonly commentsError: Readable<string | null>;
  public readonly favoritesError: Readable<string | null>;
  public readonly topRatedDishes: Readable<TopRatedDish[]>;
  public readonly mostCommentedDishes: Readable<MostCommentedDish[]>;
  public readonly favoriteDishes: Readable<FavoriteDish[]>;
  public readonly searchResults: Readable<DishSearchResponse | null>;
  public readonly deviceId: Readable<string | null>;
  public readonly isAuthenticated: Readable<boolean>;

  constructor() {
    this.store = writable<DishRatingsState>(initialState);
    this.subscribe = this.store.subscribe;

    // Stores derivados
    this.isLoading = derived(this.store, $state => $state.isLoading);
    this.isLoadingTop = derived(this.store, $state => $state.isLoadingTop);
    this.isLoadingMostCommented = derived(this.store, $state => $state.isLoadingMostCommented);
    this.isLoadingSearch = derived(this.store, $state => $state.isLoadingSearch);
    this.isLoadingFavorites = derived(this.store, $state => $state.isLoadingFavorites);
    this.error = derived(this.store, $state => $state.error);
    this.commentsError = derived(this.store, $state => $state.commentsError);
    this.favoritesError = derived(this.store, $state => $state.favoritesError);
    this.topRatedDishes = derived(this.store, $state => $state.topRatedDishes);
    this.mostCommentedDishes = derived(this.store, $state => $state.mostCommentedDishes);
    this.favoriteDishes = derived(this.store, $state => $state.favoriteDishes);
    this.searchResults = derived(this.store, $state => $state.searchResults);
    this.deviceId = derived(this.store, $state => $state.deviceId);
    this.isAuthenticated = derived(this.store, $state => $state.isAuthenticated);

    // Inicializar device ID
    this.initializeDeviceId();

    // Reaccionar a cambios de autenticación
    authStore.isAuthenticated.subscribe(isAuthenticated => {
      const currentState = this.getCurrentState();
      
      this.store.update(state => ({
        ...state,
        isAuthenticated,
        currentUserId: isAuthenticated ? authStore.getCurrentUser()?.id || null : null
      }));

      // Si cambió el estado de autenticación, limpiar cache de ratings del usuario
      if (currentState.isAuthenticated !== isAuthenticated) {
        this.clearUserSpecificCache();
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
   * ===== RATINGS =====
   */

  /**
   * Obtiene los ratings de un platillo específico
   */
  async loadDishRatings(
    dishId: string,
    limit: number = 10,
    page: number = 1,
    includeAnonymous: boolean = true,
    forceReload: boolean = false
  ): Promise<LoadRatingsResult> {
    // Verificar cache si no es forzado
    if (!forceReload && page === 1) {
      const cached = this.getDishRatingsFromCache(dishId);
      if (cached.length > 0) {
        return {
          success: true,
          data: {
            ratings: cached,
            pagination: this.getCurrentState().paginationData[dishId] || {
              page: 1,
              limit,
              total: cached.length,
              total_pages: 1,
              has_next: false,
              has_prev: false
            },
            stats: {
              total_registered: cached.filter(r => !r.anonymous).length,
              total_anonymous: cached.filter(r => r.anonymous).length
            }
          }
        };
      }
    }

    this.setDishLoading(dishId, true);
    this.clearError();

    try {
      const result = await dishRatingService.getDishRatings(
        dishId, limit, page, includeAnonymous
      );

      if (result.success && result.data) {
        this.store.update(state => ({
          ...state,
          dishRatings: {
            ...state.dishRatings,
            [dishId]: page === 1 
              ? result.data!.ratings 
              : [...(state.dishRatings[dishId] || []), ...result.data!.ratings]
          },
          paginationData: {
            ...state.paginationData,
            [dishId]: result.data!.pagination
          },
          loadingStates: {
            ...state.loadingStates,
            [dishId]: false
          },
          lastUpdated: {
            ...state.lastUpdated,
            [dishId]: new Date()
          },
          error: null
        }));

        return {
          success: true,
          data: result.data
        };
      } else {
        this.setDishLoading(dishId, false);
        this.setError(result.error || 'Error cargando ratings');
        
        return {
          success: false,
          error: result.error || 'Error cargando ratings'
        };
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido cargando ratings';
      this.setDishLoading(dishId, false);
      this.setError(errorMessage);
      
      return {
        success: false,
        error: errorMessage
      };
    }
  }

  /**
   * Carga más ratings para un platillo (paginación)
   */
  async loadMoreRatings(dishId: string): Promise<LoadRatingsResult> {
    const currentState = this.getCurrentState();
    const pagination = currentState.paginationData[dishId];
    
    if (!pagination?.has_next) {
      return {
        success: false,
        error: 'No hay más ratings para cargar'
      };
    }

    return this.loadDishRatings(
      dishId,
      pagination.limit,
      pagination.page + 1,
      true,
      false
    );
  }

  /**
   * Crea un nuevo rating (detecta automáticamente si es anónimo o autenticado)
   */
  async createRating(
    dishId: string,
    ratingData: DishRatingCreate
  ): Promise<CreateRatingResult> {
    this.setCreatingRating(dishId, true);
    this.clearError();

    try {
      const result = await dishRatingService.createDishRating(
        dishId, ratingData
      );

      if (result.success && result.data) {
        // Actualizar cache local
        this.store.update(state => {
          const currentRatings = state.dishRatings[dishId] || [];
          const newRating: DishRating = {
            id: result.data!.id,
            dishId: result.data!.dishId,
            rating: result.data!.rating,
            comment: result.data!.comment,
            timestamp: result.data!.timestamp,
            anonymous: result.data!.anonymous,
            userId: state.isAuthenticated ? (state.currentUserId ?? undefined) : undefined,
            deviceId: !state.isAuthenticated ? (state.deviceId ?? undefined) : undefined
          };

          return {
            ...state,
            dishRatings: {
              ...state.dishRatings,
              [dishId]: [newRating, ...currentRatings]
            },
            isCreatingRating: {
              ...state.isCreatingRating,
              [dishId]: false
            },
            error: null,
            lastUpdated: {
              ...state.lastUpdated,
              [dishId]: new Date()
            }
          };
        });

        // Recargar estadísticas
        this.loadDishStats(dishId, true);

        return {
          success: true,
          rating: result.data
        };
      } else {
        this.setCreatingRating(dishId, false);
        this.setError(result.error || 'Error creando rating');
        
        return {
          success: false,
          error: result.error || 'Error creando rating'
        };
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido creando rating';
      this.setCreatingRating(dishId, false);
      this.setError(errorMessage);
      
      return {
        success: false,
        error: errorMessage
      };
    }
  }

  /**
   * Actualiza un rating existente
   */
  async updateRating(
    ratingId: string,
    ratingData: DishRatingUpdate
  ): Promise<UpdateRatingResult> {
    this.setLoading(true);
    this.clearError();

    try {
      const result = await dishRatingService.updateDishRating(
        ratingId, ratingData
      );

      if (result.success && result.data) {
        // Actualizar cache local
        this.store.update(state => {
          const updatedDishRatings = { ...state.dishRatings };
          
          Object.keys(updatedDishRatings).forEach(dishId => {
            updatedDishRatings[dishId] = updatedDishRatings[dishId].map(rating => 
              rating.id === ratingId 
                ? {
                    ...rating,
                    rating: result.data!.rating,
                    comment: result.data!.comment,
                    timestamp: result.data!.timestamp
                  }
                : rating
            );
          });

          return {
            ...state,
            dishRatings: updatedDishRatings,
            isLoading: false,
            error: null
          };
        });

        // Recargar estadísticas del platillo afectado
        const dishId = result.data.dishId;
        this.loadDishStats(dishId, true);

        return {
          success: true,
          rating: result.data
        };
      } else {
        this.setLoading(false);
        this.setError(result.error || 'Error actualizando rating');
        
        return {
          success: false,
          error: result.error || 'Error actualizando rating'
        };
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido actualizando rating';
      this.setLoading(false);
      this.setError(errorMessage);
      
      return {
        success: false,
        error: errorMessage
      };
    }
  }

  /**
   * Elimina un rating
   */
  async deleteRating(ratingId: string): Promise<DeleteRatingResult> {
    this.setLoading(true);
    this.clearError();

    try {
      // Encontrar el dishId del rating antes de eliminarlo
      let targetDishId: string | null = null;
      const currentState = this.getCurrentState();
      
      Object.entries(currentState.dishRatings).forEach(([dishId, ratings]) => {
        if (ratings.some(r => r.id === ratingId)) {
          targetDishId = dishId;
        }
      });

      const result = await dishRatingService.deleteDishRating(ratingId);

      if (result.success) {
        // Actualizar cache local
        this.store.update(state => {
          const updatedDishRatings = { ...state.dishRatings };
          
          Object.keys(updatedDishRatings).forEach(dishId => {
            updatedDishRatings[dishId] = updatedDishRatings[dishId].filter(
              rating => rating.id !== ratingId
            );
          });

          return {
            ...state,
            dishRatings: updatedDishRatings,
            isLoading: false,
            error: null
          };
        });

        // Recargar estadísticas si sabemos qué platillo
        if (targetDishId) {
          this.loadDishStats(targetDishId, true);
        }

        return {
          success: true,
          message: result.data?.message || 'Rating eliminado correctamente'
        };
      } else {
        this.setLoading(false);
        this.setError(result.error || 'Error eliminando rating');
        
        return {
          success: false,
          error: result.error || 'Error eliminando rating'
        };
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido eliminando rating';
      this.setLoading(false);
      this.setError(errorMessage);
      
      return {
        success: false,
        error: errorMessage
      };
    }
  }

  /**
   * ===== COMENTARIOS =====
   */

  /**
   * Carga los comentarios de un platillo específico
   */
  async loadDishComments(
    dishId: string,
    limit: number = 20,
    page: number = 1,
    includeAnonymous: boolean = true,
    sortBy: string = 'timestamp',
    sortOrder: number = -1,
    forceReload: boolean = false
  ): Promise<LoadCommentsResult> {
    // Verificar cache si no es forzado
    if (!forceReload && page === 1) {
      const cached = this.getDishCommentsFromCache(dishId);
      if (cached.length > 0) {
        return {
          success: true,
          data: {
            comments: cached,
            pagination: this.getCurrentState().commentsPaginationData[dishId] || {
              page: 1,
              limit,
              total: cached.length,
              total_pages: 1,
              has_next: false,
              has_prev: false
            },
            stats: {
              total_registered: cached.filter(c => !c.anonymous).length,
              total_anonymous: cached.filter(c => c.anonymous).length
            }
          }
        };
      }
    }

    this.setCommentsLoading(dishId, true);
    this.clearCommentsError();

    try {
      const result = await dishRatingService.getDishComments(
        dishId, limit, page, includeAnonymous, sortBy, sortOrder
      );

      if (result.success && result.data) {
        this.store.update(state => ({
          ...state,
          dishComments: {
            ...state.dishComments,
            [dishId]: page === 1 
              ? result.data!.comments 
              : [...(state.dishComments[dishId] || []), ...result.data!.comments]
          },
          commentsPaginationData: {
            ...state.commentsPaginationData,
            [dishId]: result.data!.pagination
          },
          commentsLoadingStates: {
            ...state.commentsLoadingStates,
            [dishId]: false
          },
          commentsLastUpdated: {
            ...state.commentsLastUpdated,
            [dishId]: new Date()
          },
          commentsError: null
        }));

        return {
          success: true,
          data: result.data
        };
      } else {
        this.setCommentsLoading(dishId, false);
        this.setCommentsError(result.error || 'Error cargando comentarios');
        
        return {
          success: false,
          error: result.error || 'Error cargando comentarios'
        };
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido cargando comentarios';
      this.setCommentsLoading(dishId, false);
      this.setCommentsError(errorMessage);
      
      return {
        success: false,
        error: errorMessage
      };
    }
  }

  /**
   * Carga más comentarios para un platillo (paginación)
   */
  async loadMoreComments(dishId: string): Promise<LoadCommentsResult> {
    const currentState = this.getCurrentState();
    const pagination = currentState.commentsPaginationData[dishId];
    
    if (!pagination?.has_next) {
      return {
        success: false,
        error: 'No hay más comentarios para cargar'
      };
    }

    return this.loadDishComments(
      dishId,
      pagination.limit,
      pagination.page + 1,
      true,
      'timestamp',
      -1,
      false
    );
  }

  /**
   * Crea un nuevo comentario (detecta automáticamente si es anónimo o autenticado)
   */
  async createComment(
    dishId: string,
    commentData: DishCommentCreate
  ): Promise<CreateCommentResult> {
    this.setCreatingComment(dishId, true);
    this.clearCommentsError();

    try {
      const result = await dishRatingService.createDishComment(
        dishId, commentData
      );

      if (result.success && result.data) {
        // Actualizar cache local
        this.store.update(state => {
          const currentComments = state.dishComments[dishId] || [];
          
          return {
            ...state,
            dishComments: {
              ...state.dishComments,
              [dishId]: [result.data!, ...currentComments]
            },
            isCreatingComment: {
              ...state.isCreatingComment,
              [dishId]: false
            },
            commentsError: null,
            commentsLastUpdated: {
              ...state.commentsLastUpdated,
              [dishId]: new Date()
            }
          };
        });

        return {
          success: true,
          comment: result.data
        };
      } else {
        this.setCreatingComment(dishId, false);
        this.setCommentsError(result.error || 'Error creando comentario');
        
        return {
          success: false,
          error: result.error || 'Error creando comentario'
        };
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido creando comentario';
      this.setCreatingComment(dishId, false);
      this.setCommentsError(errorMessage);
      
      return {
        success: false,
        error: errorMessage
      };
    }
  }

  /**
   * ===== FAVORITOS =====
   */

  /**
   * Alterna el estado de favorito de un platillo
   */
  async toggleFavorite(
    dishId: string,
    action: 'add' | 'remove' | 'toggle' = 'toggle'
  ): Promise<ToggleFavoriteResult> {
    this.setTogglingFavorite(dishId, true);
    this.clearFavoritesError();

    try {
      const result = await dishRatingService.toggleDishFavorite(dishId, action);

      if (result.success && result.data) {
        // Actualizar cache local
        this.store.update(state => {
          let updatedFavorites = [...state.favoriteDishes];
          
          if (result.data!.userFav) {
            // Agregar a favoritos si no existe
            const existingIndex = updatedFavorites.findIndex(f => f.id === dishId);
            if (existingIndex === -1) {
              // Crear objeto de favorito básico (se actualizará cuando se recarguen los favoritos)
              const newFavorite: FavoriteDish = {
                id: dishId,
                name: 'Platillo',
                price: 0,
                rating: 0,
                favorites: result.data!.favorites,
                userFav: true,
                favoritedAt: new Date().toISOString(),
                anonymous: !state.isAuthenticated
              };
              updatedFavorites.unshift(newFavorite);
            }
          } else {
            // Quitar de favoritos
            updatedFavorites = updatedFavorites.filter(f => f.id !== dishId);
          }

          return {
            ...state,
            favoriteDishes: updatedFavorites,
            isTogglingFavorite: {
              ...state.isTogglingFavorite,
              [dishId]: false
            },
            favoritesError: null,
            favoritesLastUpdated: new Date()
          };
        });

        return {
          success: true,
          data: result.data
        };
      } else {
        this.setTogglingFavorite(dishId, false);
        this.setFavoritesError(result.error || 'Error alternando favorito');
        
        return {
          success: false,
          error: result.error || 'Error alternando favorito'
        };
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido alternando favorito';
      this.setTogglingFavorite(dishId, false);
      this.setFavoritesError(errorMessage);
      
      return {
        success: false,
        error: errorMessage
      };
    }
  }

  /**
   * Carga los platillos favoritos del usuario
   */
  async loadFavoriteDishes(
    limit: number = 20,
    page: number = 1,
    forceReload: boolean = false
  ): Promise<ApiResult<FavoriteDishesResponse>> {
    // Verificar cache si no es forzado y es la primera página
    if (!forceReload && page === 1 && this.getCurrentState().favoriteDishes.length > 0) {
      const favorites = this.getCurrentState().favoriteDishes;
      return {
        success: true,
        data: {
          dishes: favorites,
          pagination: this.getCurrentState().favoritesPagination || {
            page: 1,
            limit,
            total: favorites.length,
            total_pages: 1,
            has_next: false,
            has_prev: false
          },
          total_favorites: favorites.length
        }
      };
    }

    this.setLoadingFavorites(true);
    this.clearFavoritesError();

    try {
      const result = await dishRatingService.getFavoriteDishes(limit, page);

      if (result.success && result.data) {
        this.store.update(state => ({
          ...state,
          favoriteDishes: page === 1 
            ? result.data!.dishes 
            : [...state.favoriteDishes, ...result.data!.dishes],
          favoritesPagination: result.data!.pagination,
          isLoadingFavorites: false,
          favoritesError: null,
          favoritesLastUpdated: new Date()
        }));

        return result;
      } else {
        this.setLoadingFavorites(false);
        this.setFavoritesError(result.error || 'Error cargando favoritos');
        
        return result;
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido cargando favoritos';
      this.setLoadingFavorites(false);
      this.setFavoritesError(errorMessage);
      
      return {
        success: false,
        error: errorMessage
      };
    }
  }

  /**
   * ===== ESTADÍSTICAS Y BÚSQUEDAS =====
   */

  /**
   * Carga las estadísticas de un platillo
   */
  async loadDishStats(
    dishId: string, 
    forceReload: boolean = false
  ): Promise<ApiResult<DishRatingStats>> {
    // Verificar cache si no es forzado
    if (!forceReload) {
      const cached = this.getCurrentState().dishStats[dishId];
      if (cached) {
        return {
          success: true,
          data: cached
        };
      }
    }

    this.setStatsLoading(dishId, true);

    try {
      const result = await dishRatingService.getDishStats(dishId);

      if (result.success && result.data) {
        this.store.update(state => ({
          ...state,
          dishStats: {
            ...state.dishStats,
            [dishId]: result.data!
          },
          statsLoadingStates: {
            ...state.statsLoadingStates,
            [dishId]: false
          }
        }));
      } else {
        this.setStatsLoading(dishId, false);
      }

      return result;
    } catch (error) {
      this.setStatsLoading(dishId, false);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error cargando estadísticas'
      };
    }
  }

  /**
   * Carga los platillos mejor valorados
   */
  async loadTopRatedDishes(
    limit: number = 10,
    minRatings: number = 3,
    restaurantId?: string,
    categoryId?: string
  ): Promise<ApiResult<TopRatedDish[]>> {
    this.setLoadingTop(true);

    try {
      const result = await dishRatingService.getTopRatedDishes(limit, minRatings, restaurantId, categoryId);

      if (result.success && result.data) {
        this.store.update(state => ({
          ...state,
          topRatedDishes: result.data!,
          isLoadingTop: false
        }));
      } else {
        this.setLoadingTop(false);
      }

      return result;
    } catch (error) {
      this.setLoadingTop(false);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error cargando top platillos'
      };
    }
  }

  /**
   * Carga los platillos más comentados
   */
  async loadMostCommentedDishes(
    limit: number = 10,
    minComments: number = 2,
    restaurantId?: string
  ): Promise<ApiResult<MostCommentedDish[]>> {
    this.setLoadingMostCommented(true);

    try {
      const result = await dishRatingService.getMostCommentedDishes(limit, minComments, restaurantId);

      if (result.success && result.data) {
        this.store.update(state => ({
          ...state,
          mostCommentedDishes: result.data!,
          isLoadingMostCommented: false
        }));
      } else {
        this.setLoadingMostCommented(false);
      }

      return result;
    } catch (error) {
      this.setLoadingMostCommented(false);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error cargando platillos más comentados'
      };
    }
  }

  /**
   * Busca platillos con filtros avanzados
   */
  async searchDishes(
    filters: DishSearchFilters,
    limit: number = 20,
    page: number = 1
  ): Promise<ApiResult<DishSearchResponse>> {
    this.setLoadingSearch(true);
    this.clearError();

    try {
      const result = await dishRatingService.searchDishes(filters, limit, page);

      if (result.success && result.data) {
        this.store.update(state => ({
          ...state,
          searchResults: result.data!,
          isLoadingSearch: false,
          error: null
        }));
      } else {
        this.setLoadingSearch(false);
        this.setError(result.error || 'Error en búsqueda');
      }

      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido en búsqueda';
      this.setLoadingSearch(false);
      this.setError(errorMessage);
      
      return {
        success: false,
        error: errorMessage
      };
    }
  }

  /**
   * ===== MÉTODOS DE ACCESO A DATOS =====
   */

  /**
   * Obtiene los ratings de un platillo desde el cache
   */
  getDishRatings(dishId: string): Readable<DishRating[]> {
    return derived(this.store, $state => 
      $state.dishRatings[dishId] || []
    );
  }

  /**
   * Obtiene los comentarios de un platillo desde el cache
   */
  getDishComments(dishId: string): Readable<DishComment[]> {
    return derived(this.store, $state => 
      $state.dishComments[dishId] || []
    );
  }

  /**
   * Obtiene las estadísticas de un platillo desde el cache
   */
  getDishStats(dishId: string): Readable<DishRatingStats | null> {
    return derived(this.store, $state => 
      $state.dishStats[dishId] || null
    );
  }

  /**
   * Verifica si un platillo está cargando ratings
   */
  isDishLoading(dishId: string): Readable<boolean> {
    return derived(this.store, $state => 
      $state.loadingStates[dishId] || false
    );
  }

  /**
   * Verifica si un platillo está cargando comentarios
   */
  isDishCommentsLoading(dishId: string): Readable<boolean> {
    return derived(this.store, $state => 
      $state.commentsLoadingStates[dishId] || false
    );
  }

  /**
   * Verifica si un platillo está cargando estadísticas
   */
  isDishStatsLoading(dishId: string): Readable<boolean> {
    return derived(this.store, $state => 
      $state.statsLoadingStates[dishId] || false
    );
  }

  /**
   * Verifica si se está creando un comentario para un platillo
   */
  isCreatingComment(dishId: string): Readable<boolean> {
    return derived(this.store, $state => 
      $state.isCreatingComment[dishId] || false
    );
  }

  /**
   * Verifica si se está creando un rating para un platillo
   */
  isCreatingRating(dishId: string): Readable<boolean> {
    return derived(this.store, $state => 
      $state.isCreatingRating[dishId] || false
    );
  }

  /**
   * Verifica si se está alternando favorito para un platillo
   */
  isTogglingFavorite(dishId: string): Readable<boolean> {
    return derived(this.store, $state => 
      $state.isTogglingFavorite[dishId] || false
    );
  }

  /**
   * Obtiene la paginación de ratings de un platillo
   */
  getDishRatingsPagination(dishId: string): Readable<DishRatingsState['paginationData'][string] | null> {
    return derived(this.store, $state => 
      $state.paginationData[dishId] || null
    );
  }

  /**
   * Obtiene la paginación de comentarios de un platillo
   */
  getDishCommentsPagination(dishId: string): Readable<DishRatingsState['commentsPaginationData'][string] | null> {
    return derived(this.store, $state => 
      $state.commentsPaginationData[dishId] || null
    );
  }

  /**
   * Busca el rating del usuario actual para un platillo
   */
  getUserRatingForDish(dishId: string): Readable<DishRating | null> {
    return derived(this.store, $state => {
      const ratings = $state.dishRatings[dishId] || [];
      const userId = $state.currentUserId;
      const deviceId = $state.deviceId;
      
      return dishRatingService.utils.findUserRating(ratings, userId || undefined, deviceId || undefined) || null;
    });
  }

  /**
   * Busca el comentario del usuario actual para un platillo
   */
  getUserCommentForDish(dishId: string): Readable<DishComment | null> {
    return derived(this.store, $state => {
      const comments = $state.dishComments[dishId] || [];
      const userId = $state.currentUserId;
      const deviceId = $state.deviceId;
      
      return dishRatingService.utils.findUserComment(comments, userId || undefined, deviceId || undefined) || null;
    });
  }

  /**
   * Verifica si un platillo está en favoritos del usuario
   */
  isDishFavorite(dishId: string): Readable<boolean> {
    return derived(this.store, $state => {
      return $state.favoriteDishes.some(fav => fav.id === dishId);
    });
  }

  /**
   * ===== MÉTODOS PRIVADOS =====
   */

  private getDishRatingsFromCache(dishId: string): DishRating[] {
    return this.getCurrentState().dishRatings[dishId] || [];
  }

  private getDishCommentsFromCache(dishId: string): DishComment[] {
    return this.getCurrentState().dishComments[dishId] || [];
  }

  private initializeDeviceId(): void {
    const deviceInfo = getDeviceId();
    this.store.update(state => ({
      ...state,
      deviceId: deviceInfo
    }));
  }

  private clearUserSpecificCache(): void {
    // Limpiar cache que podría contener datos específicos del usuario
    this.store.update(state => ({
      ...state,
      dishRatings: {},
      dishComments: {},
      dishStats: {},
      favoriteDishes: [],
      lastUpdated: {},
      commentsLastUpdated: {},
      favoritesLastUpdated: null
    }));
  }

  private setLoading(isLoading: boolean): void {
    this.store.update(state => ({ ...state, isLoading }));
  }

  private setLoadingTop(isLoadingTop: boolean): void {
    this.store.update(state => ({ ...state, isLoadingTop }));
  }

  private setLoadingMostCommented(isLoadingMostCommented: boolean): void {
    this.store.update(state => ({ ...state, isLoadingMostCommented }));
  }

  private setLoadingSearch(isLoadingSearch: boolean): void {
    this.store.update(state => ({ ...state, isLoadingSearch }));
  }

  private setLoadingFavorites(isLoadingFavorites: boolean): void {
    this.store.update(state => ({ ...state, isLoadingFavorites }));
  }

  private setDishLoading(dishId: string, isLoading: boolean): void {
    this.store.update(state => ({
      ...state,
      loadingStates: {
        ...state.loadingStates,
        [dishId]: isLoading
      }
    }));
  }

  private setCommentsLoading(dishId: string, isLoading: boolean): void {
    this.store.update(state => ({
      ...state,
      commentsLoadingStates: {
        ...state.commentsLoadingStates,
        [dishId]: isLoading
      }
    }));
  }

  private setStatsLoading(dishId: string, isLoading: boolean): void {
    this.store.update(state => ({
      ...state,
      statsLoadingStates: {
        ...state.statsLoadingStates,
        [dishId]: isLoading
      }
    }));
  }

  private setCreatingComment(dishId: string, isCreating: boolean): void {
    this.store.update(state => ({
      ...state,
      isCreatingComment: {
        ...state.isCreatingComment,
        [dishId]: isCreating
      }
    }));
  }

  private setCreatingRating(dishId: string, isCreating: boolean): void {
    this.store.update(state => ({
      ...state,
      isCreatingRating: {
        ...state.isCreatingRating,
        [dishId]: isCreating
      }
    }));
  }

  private setTogglingFavorite(dishId: string, isToggling: boolean): void {
    this.store.update(state => ({
      ...state,
      isTogglingFavorite: {
        ...state.isTogglingFavorite,
        [dishId]: isToggling
      }
    }));
  }

  private setError(error: string | null): void {
    this.store.update(state => ({ ...state, error }));
  }

  private setCommentsError(error: string | null): void {
    this.store.update(state => ({ ...state, commentsError: error }));
  }

  private setFavoritesError(error: string | null): void {
    this.store.update(state => ({ ...state, favoritesError: error }));
  }

  private clearError(): void {
    this.setError(null);
  }

  private clearCommentsError(): void {
    this.setCommentsError(null);
  }

  private clearFavoritesError(): void {
    this.setFavoritesError(null);
  }

  /**
   * Limpia todo el cache
   */
  clearCache(): void {
    this.store.update(state => ({
      ...state,
      dishRatings: {},
      dishComments: {},
      dishStats: {},
      favoriteDishes: [],
      topRatedDishes: [],
      mostCommentedDishes: [],
      loadingStates: {},
      commentsLoadingStates: {},
      statsLoadingStates: {},
      paginationData: {},
      commentsPaginationData: {},
      favoritesPagination: null,
      lastUpdated: {},
      commentsLastUpdated: {},
      favoritesLastUpdated: null,
      searchResults: null,
      isCreatingComment: {},
      isCreatingRating: {},
      isTogglingFavorite: {}
    }));
  }

  /**
   * Obtiene el estado actual (para uso en funciones)
   */
  getCurrentState(): DishRatingsState {
    let currentState: DishRatingsState;
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

  getTopRatedDishes(): TopRatedDish[] {
    return this.getCurrentState().topRatedDishes;
  }

  getMostCommentedDishes(): MostCommentedDish[] {
    return this.getCurrentState().mostCommentedDishes;
  }

  getFavoriteDishes(): FavoriteDish[] {
    return this.getCurrentState().favoriteDishes;
  }
}

/**
 * Instancia única del store de ratings de platillos
 */
export const dishRatingStore = new DishRatingStore();

// Exports individuales para compatibilidad
export const dishRatingsLoading = dishRatingStore.isLoading;
export const dishRatingsLoadingTop = dishRatingStore.isLoadingTop;
export const dishRatingsLoadingMostCommented = dishRatingStore.isLoadingMostCommented;
export const dishRatingsLoadingSearch = dishRatingStore.isLoadingSearch;
export const dishRatingsLoadingFavorites = dishRatingStore.isLoadingFavorites;
export const dishRatingsError = dishRatingStore.error;
export const dishCommentsError = dishRatingStore.commentsError;
export const dishFavoritesError = dishRatingStore.favoritesError;
export const topRatedDishes = dishRatingStore.topRatedDishes;
export const mostCommentedDishes = dishRatingStore.mostCommentedDishes;
export const favoriteDishes = dishRatingStore.favoriteDishes;
export const dishSearchResults = dishRatingStore.searchResults;
export const dishRatingsDeviceId = dishRatingStore.deviceId;
export const dishRatingsIsAuthenticated = dishRatingStore.isAuthenticated;

/**
 * Hook personalizado para usar en componentes Svelte
 */
export function useDishRatings(dishId?: string) {
  const state = dishRatingStore.getCurrentState();

  return {
    // Estado general
    isLoading: state.isLoading,
    isLoadingTop: state.isLoadingTop,
    isLoadingMostCommented: state.isLoadingMostCommented,
    isLoadingSearch: state.isLoadingSearch,
    isLoadingFavorites: state.isLoadingFavorites,
    error: state.error,
    commentsError: state.commentsError,
    favoritesError: state.favoritesError,
    topRatedDishes: state.topRatedDishes,
    mostCommentedDishes: state.mostCommentedDishes,
    favoriteDishes: state.favoriteDishes,
    searchResults: state.searchResults,
    isAuthenticated: state.isAuthenticated,
    deviceId: state.deviceId,

    // Estado específico del platillo (si se proporciona ID)
    dishRatings: dishId ? state.dishRatings[dishId] || [] : [],
    dishComments: dishId ? state.dishComments[dishId] || [] : [],
    dishStats: dishId ? state.dishStats[dishId] || null : null,
    isDishLoading: dishId ? state.loadingStates[dishId] || false : false,
    isCommentsLoading: dishId ? state.commentsLoadingStates[dishId] || false : false,
    isStatsLoading: dishId ? state.statsLoadingStates[dishId] || false : false,
    isCreatingComment: dishId ? state.isCreatingComment[dishId] || false : false,
    isCreatingRating: dishId ? state.isCreatingRating[dishId] || false : false,
    isTogglingFavorite: dishId ? state.isTogglingFavorite[dishId] || false : false,
    ratingssPagination: dishId ? state.paginationData[dishId] || null : null,
    commentsPagination: dishId ? state.commentsPaginationData[dishId] || null : null,

    // Métodos
    loadRatings: dishRatingStore.loadDishRatings.bind(dishRatingStore),
    loadMoreRatings: dishRatingStore.loadMoreRatings.bind(dishRatingStore),
    createRating: dishRatingStore.createRating.bind(dishRatingStore),
    updateRating: dishRatingStore.updateRating.bind(dishRatingStore),
    deleteRating: dishRatingStore.deleteRating.bind(dishRatingStore),
    
    // Métodos de comentarios
    loadComments: dishRatingStore.loadDishComments.bind(dishRatingStore),
    loadMoreComments: dishRatingStore.loadMoreComments.bind(dishRatingStore),
    createComment: dishRatingStore.createComment.bind(dishRatingStore),
    
    // Métodos de favoritos
    toggleFavorite: dishRatingStore.toggleFavorite.bind(dishRatingStore),
    loadFavorites: dishRatingStore.loadFavoriteDishes.bind(dishRatingStore),
    
    // Métodos de estadísticas y búsquedas
    loadStats: dishRatingStore.loadDishStats.bind(dishRatingStore),
    loadTopRated: dishRatingStore.loadTopRatedDishes.bind(dishRatingStore),
    loadMostCommented: dishRatingStore.loadMostCommentedDishes.bind(dishRatingStore),
    searchDishes: dishRatingStore.searchDishes.bind(dishRatingStore),
    
    // Otros métodos
    clearCache: dishRatingStore.clearCache.bind(dishRatingStore),

    // Stores reactivos (para uso en componentes)
    getDishRatings: dishId ? dishRatingStore.getDishRatings(dishId) : null,
    getDishComments: dishId ? dishRatingStore.getDishComments(dishId) : null,
    getDishStats: dishId ? dishRatingStore.getDishStats(dishId) : null,
    getUserRating: dishId ? dishRatingStore.getUserRatingForDish(dishId) : null,
    getUserComment: dishId ? dishRatingStore.getUserCommentForDish(dishId) : null,
    isDishFavorite: dishId ? dishRatingStore.isDishFavorite(dishId) : null,
    isDishLoadingStore: dishId ? dishRatingStore.isDishLoading(dishId) : null,
    isCommentsLoadingStore: dishId ? dishRatingStore.isDishCommentsLoading(dishId) : null,
    isStatsLoadingStore: dishId ? dishRatingStore.isDishStatsLoading(dishId) : null,
    isCreatingCommentStore: dishId ? dishRatingStore.isCreatingComment(dishId) : null,
    isCreatingRatingStore: dishId ? dishRatingStore.isCreatingRating(dishId) : null,
    isTogglingFavoriteStore: dishId ? dishRatingStore.isTogglingFavorite(dishId) : null
  };
}

// Default export
export default dishRatingStore;