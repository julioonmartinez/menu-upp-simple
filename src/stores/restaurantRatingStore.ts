// src/stores/restaurantRatingStore.ts
import { writable, derived, type Writable, type Readable } from 'svelte/store';
import { 
  restaurantRatingService, 
  type ApiResult,
  type RatingActionResponse,
  type DeviceIdInfo
} from '../services/restaurantRatingService.ts';
import type { 
  RestaurantRating, 
  RestaurantRatingCreate, 
  RestaurantRatingUpdate, 
  RestaurantRatingStats,
  RestaurantRatingsResponse,
  RestaurantSearchFilters,
  RestaurantSearchResponse,
  RestaurantRanking,
  FeaturedRestaurantsResponse,
  RestaurantComment,
  RestaurantCommentCreate,
  RestaurantCommentsResponse
} from '../interfaces/restaurantRating.ts';
import { authStore } from './authStore.ts';
import { getDeviceId } from '../services/deviceIdService.ts';

// Types para el estado de ratings
export interface RatingsState {
  // Ratings por restaurante (cache)
  restaurantRatings: Record<string, RestaurantRating[]>;
  
  // Comentarios por restaurante (cache)
  restaurantComments: Record<string, RestaurantComment[]>;
  
  // Estadísticas por restaurante (cache)
  restaurantStats: Record<string, RestaurantRatingStats>;
  
  // Estados de carga por restaurante
  loadingStates: Record<string, boolean>;
  commentsLoadingStates: Record<string, boolean>;
  
  // Top rated y featured restaurants
  topRatedRestaurants: RestaurantRanking[];
  featuredRestaurants: FeaturedRestaurantsResponse | null;
  
  // Resultados de búsqueda
  searchResults: RestaurantSearchResponse | null;
  
  // Estados generales
  isLoading: boolean;
  isLoadingTop: boolean;
  isLoadingFeatured: boolean;
  isLoadingSearch: boolean;
  isCreatingComment: Record<string, boolean>;
  error: string | null;
  commentsError: string | null;
  
  // Paginación por restaurante
  paginationData: Record<string, {
    page: number;
    limit: number;
    total: number;
    total_pages: number;
    has_next: boolean;
    has_prev: boolean;
  }>;
  
  // Paginación de comentarios por restaurante
  commentsPaginationData: Record<string, {
    page: number;
    limit: number;
    total: number;
    total_pages: number;
    has_next: boolean;
    has_prev: boolean;
  }>;
  
  // Cache del usuario actual y device ID
  currentUserId: string | null;
  deviceId: string | null;
  isAuthenticated: boolean;
  
  // Timestamp de última actualización por restaurante
  lastUpdated: Record<string, Date>;
  commentsLastUpdated: Record<string, Date>;
}

// Types para resultados de acciones
export interface CreateRatingResult {
  success: boolean;
  rating?: RatingActionResponse;
  error?: string;
}

export interface CreateCommentResult {
  success: boolean;
  comment?: RestaurantComment;
  error?: string;
}

export interface LoadCommentsResult {
  success: boolean;
  data?: RestaurantCommentsResponse;
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

export interface LoadRatingsResult {
  success: boolean;
  data?: RestaurantRatingsResponse;
  error?: string;
}

/**
 * Estado inicial de ratings
 */
const initialState: RatingsState = {
  restaurantRatings: {},
  restaurantComments: {},
  restaurantStats: {},
  loadingStates: {},
  commentsLoadingStates: {},
  topRatedRestaurants: [],
  featuredRestaurants: null,
  searchResults: null,
  isLoading: false,
  isLoadingTop: false,
  isLoadingFeatured: false,
  isLoadingSearch: false,
  isCreatingComment: {},
  error: null,
  commentsError: null,
  paginationData: {},
  commentsPaginationData: {},
  currentUserId: null,
  deviceId: null,
  isAuthenticated: false,
  lastUpdated: {},
  commentsLastUpdated: {}
};

/**
 * Clase para manejar el estado de ratings de restaurantes
 */
class RestaurantRatingStore {
  private store: Writable<RatingsState>;
  
  // Stores derivados públicos
  public readonly subscribe: Writable<RatingsState>['subscribe'];
  public readonly isLoading: Readable<boolean>;
  public readonly isLoadingTop: Readable<boolean>;
  public readonly isLoadingFeatured: Readable<boolean>;
  public readonly isLoadingSearch: Readable<boolean>;
  public readonly error: Readable<string | null>;
  public readonly commentsError: Readable<string | null>;
  public readonly topRatedRestaurants: Readable<RestaurantRanking[]>;
  public readonly featuredRestaurants: Readable<FeaturedRestaurantsResponse | null>;
  public readonly searchResults: Readable<RestaurantSearchResponse | null>;
  public readonly deviceId: Readable<string | null>;
  public readonly isAuthenticated: Readable<boolean>;

  constructor() {
    this.store = writable<RatingsState>(initialState);
    this.subscribe = this.store.subscribe;

    // Stores derivados
    this.isLoading = derived(this.store, $state => $state.isLoading);
    this.isLoadingTop = derived(this.store, $state => $state.isLoadingTop);
    this.isLoadingFeatured = derived(this.store, $state => $state.isLoadingFeatured);
    this.isLoadingSearch = derived(this.store, $state => $state.isLoadingSearch);
    this.error = derived(this.store, $state => $state.error);
    this.commentsError = derived(this.store, $state => $state.commentsError);
    this.topRatedRestaurants = derived(this.store, $state => $state.topRatedRestaurants);
    this.featuredRestaurants = derived(this.store, $state => $state.featuredRestaurants);
    this.searchResults = derived(this.store, $state => $state.searchResults);
    this.deviceId = derived(this.store, $state => $state.deviceId);
    this.isAuthenticated = derived(this.store, $state => $state.isAuthenticated);

    // Inicializar device ID
    this.initializeDeviceId();

    // Reaccionar a cambios de autenticación
   authStore.isAuthenticated.subscribe(isAuthenticated => {
  const currentState = this.getCurrentState(); // Obtener estado actual primero
  
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
   * Obtiene los ratings de un restaurante específico
   */
  async loadRestaurantRatings(
    restaurantId: string,
    limit: number = 10,
    page: number = 1,
    includeAnonymous: boolean = true,
    forceReload: boolean = false
  ): Promise<LoadRatingsResult> {
    // Verificar cache si no es forzado
    if (!forceReload && page === 1) {
      const cached = this.getRestaurantRatingsFromCache(restaurantId);
      if (cached.length > 0) {
        return {
          success: true,
          data: {
            ratings: cached,
            pagination: this.getCurrentState().paginationData[restaurantId] || {
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

    this.setRestaurantLoading(restaurantId, true);
    this.clearError();

    try {
      const result = await restaurantRatingService.getRestaurantRatings(
        restaurantId, limit, page, includeAnonymous
      );

      if (result.success && result.data) {
        this.store.update(state => ({
          ...state,
          restaurantRatings: {
            ...state.restaurantRatings,
            [restaurantId]: page === 1 
              ? result.data!.ratings 
              : [...(state.restaurantRatings[restaurantId] || []), ...result.data!.ratings]
          },
          paginationData: {
            ...state.paginationData,
            [restaurantId]: result.data!.pagination
          },
          loadingStates: {
            ...state.loadingStates,
            [restaurantId]: false
          },
          lastUpdated: {
            ...state.lastUpdated,
            [restaurantId]: new Date()
          },
          error: null
        }));

        return {
          success: true,
          data: result.data
        };
      } else {
        this.setRestaurantLoading(restaurantId, false);
        this.setError(result.error || 'Error cargando ratings');
        
        return {
          success: false,
          error: result.error || 'Error cargando ratings'
        };
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido cargando ratings';
      this.setRestaurantLoading(restaurantId, false);
      this.setError(errorMessage);
      
      return {
        success: false,
        error: errorMessage
      };
    }
  }

  /**
   * Carga más ratings para un restaurante (paginación)
   */
  async loadMoreRatings(restaurantId: string): Promise<LoadRatingsResult> {
    const currentState = this.getCurrentState();
    const pagination = currentState.paginationData[restaurantId];
    
    if (!pagination?.has_next) {
      return {
        success: false,
        error: 'No hay más ratings para cargar'
      };
    }

    return this.loadRestaurantRatings(
      restaurantId,
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
    restaurantId: string,
    ratingData: RestaurantRatingCreate
  ): Promise<CreateRatingResult> {
    this.setLoading(true);
    this.clearError();

    try {
      const result = await restaurantRatingService.createRestaurantRating(
        restaurantId, ratingData
      );

      if (result.success && result.data) {
        // Actualizar cache local
        this.store.update(state => {
          const currentRatings = state.restaurantRatings[restaurantId] || [];
          const newRating: RestaurantRating = {
            id: result.data!.id,
            restaurantId: result.data!.restaurantId,
            rating: result.data!.rating,
            comment: result.data!.comment,
            timestamp: result.data!.timestamp,
            anonymous: result.data!.anonymous,
            userId: state.isAuthenticated ? (state.currentUserId ?? undefined) : undefined,
            deviceId: !state.isAuthenticated ? (state.deviceId ?? undefined) : undefined
          };

          return {
            ...state,
            restaurantRatings: {
              ...state.restaurantRatings,
              [restaurantId]: [newRating, ...currentRatings]
            },
            isLoading: false,
            error: null,
            lastUpdated: {
              ...state.lastUpdated,
              [restaurantId]: new Date()
            }
          };
        });

        // Recargar estadísticas
        this.loadRestaurantStats(restaurantId, true);

        return {
          success: true,
          rating: result.data
        };
      } else {
        this.setLoading(false);
        this.setError(result.error || 'Error creando rating');
        
        return {
          success: false,
          error: result.error || 'Error creando rating'
        };
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido creando rating';
      this.setLoading(false);
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
    ratingData: RestaurantRatingUpdate
  ): Promise<UpdateRatingResult> {
    this.setLoading(true);
    this.clearError();

    try {
      const result = await restaurantRatingService.updateRestaurantRating(
        ratingId, ratingData
      );

      if (result.success && result.data) {
        // Actualizar cache local
        this.store.update(state => {
          const updatedRestaurantRatings = { ...state.restaurantRatings };
          
          Object.keys(updatedRestaurantRatings).forEach(restaurantId => {
            updatedRestaurantRatings[restaurantId] = updatedRestaurantRatings[restaurantId].map(rating => 
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
            restaurantRatings: updatedRestaurantRatings,
            isLoading: false,
            error: null
          };
        });

        // Recargar estadísticas del restaurante afectado
        const restaurantId = result.data.restaurantId;
        this.loadRestaurantStats(restaurantId, true);

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
      // Encontrar el restaurantId del rating antes de eliminarlo
      let targetRestaurantId: string | null = null;
      const currentState = this.getCurrentState();
      
      Object.entries(currentState.restaurantRatings).forEach(([restaurantId, ratings]) => {
        if (ratings.some(r => r.id === ratingId)) {
          targetRestaurantId = restaurantId;
        }
      });

      const result = await restaurantRatingService.deleteRestaurantRating(ratingId);

      if (result.success) {
        // Actualizar cache local
        this.store.update(state => {
          const updatedRestaurantRatings = { ...state.restaurantRatings };
          
          Object.keys(updatedRestaurantRatings).forEach(restaurantId => {
            updatedRestaurantRatings[restaurantId] = updatedRestaurantRatings[restaurantId].filter(
              rating => rating.id !== ratingId
            );
          });

          return {
            ...state,
            restaurantRatings: updatedRestaurantRatings,
            isLoading: false,
            error: null
          };
        });

        // Recargar estadísticas si sabemos qué restaurante
        if (targetRestaurantId) {
          this.loadRestaurantStats(targetRestaurantId, true);
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
   * Carga las estadísticas de un restaurante
   */
  async loadRestaurantStats(
    restaurantId: string, 
    forceReload: boolean = false
  ): Promise<ApiResult<RestaurantRatingStats>> {
    // Verificar cache si no es forzado
    if (!forceReload) {
      const cached = this.getCurrentState().restaurantStats[restaurantId];
      if (cached) {
        return {
          success: true,
          data: cached
        };
      }
    }

    try {
      const result = await restaurantRatingService.getRestaurantRatingStats(restaurantId);

      if (result.success && result.data) {
        this.store.update(state => ({
          ...state,
          restaurantStats: {
            ...state.restaurantStats,
            [restaurantId]: result.data!
          }
        }));
      }

      return result;
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error cargando estadísticas'
      };
    }
  }

  /**
   * Busca restaurantes con filtros
   */
  async searchRestaurants(
    filters: RestaurantSearchFilters,
    limit: number = 20,
    page: number = 1
  ): Promise<ApiResult<RestaurantSearchResponse>> {
    this.setLoadingSearch(true);
    this.clearError();

    try {
      const result = await restaurantRatingService.searchRestaurants(filters, limit, page);

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
   * Carga los restaurantes mejor valorados
   */
  async loadTopRatedRestaurants(
    limit: number = 10,
    minReviews: number = 5
  ): Promise<ApiResult<RestaurantRanking[]>> {
    this.setLoadingTop(true);

    try {
      const result = await restaurantRatingService.getTopRatedRestaurants(limit, minReviews);

      if (result.success && result.data) {
        this.store.update(state => ({
          ...state,
          topRatedRestaurants: result.data!,
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
        error: error instanceof Error ? error.message : 'Error cargando top restaurantes'
      };
    }
  }

  /**
   * ===== FUNCIONES PARA COMENTARIOS =====
   */

  /**
   * Carga los comentarios de un restaurante específico
   */
  async loadRestaurantComments(
    restaurantId: string,
    limit: number = 20,
    page: number = 1,
    includeAnonymous: boolean = true,
    forceReload: boolean = false
  ): Promise<LoadCommentsResult> {
    // Verificar cache si no es forzado
    if (!forceReload && page === 1) {
      const cached = this.getRestaurantCommentsFromCache(restaurantId);
      if (cached.length > 0) {
        return {
          success: true,
          data: {
            comments: cached,
            pagination: this.getCurrentState().commentsPaginationData[restaurantId] || {
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

    this.setCommentsLoading(restaurantId, true);
    this.clearCommentsError();

    try {
      const result = await restaurantRatingService.getRestaurantComments(
        restaurantId, limit, page, includeAnonymous
      );

      if (result.success && result.data) {
        this.store.update(state => ({
          ...state,
          restaurantComments: {
            ...state.restaurantComments,
            [restaurantId]: page === 1 
              ? result.data!.comments 
              : [...(state.restaurantComments[restaurantId] || []), ...result.data!.comments]
          },
          commentsPaginationData: {
            ...state.commentsPaginationData,
            [restaurantId]: result.data!.pagination
          },
          commentsLoadingStates: {
            ...state.commentsLoadingStates,
            [restaurantId]: false
          },
          commentsLastUpdated: {
            ...state.commentsLastUpdated,
            [restaurantId]: new Date()
          },
          commentsError: null
        }));

        return {
          success: true,
          data: result.data
        };
      } else {
        this.setCommentsLoading(restaurantId, false);
        this.setCommentsError(result.error || 'Error cargando comentarios');
        
        return {
          success: false,
          error: result.error || 'Error cargando comentarios'
        };
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido cargando comentarios';
      this.setCommentsLoading(restaurantId, false);
      this.setCommentsError(errorMessage);
      
      return {
        success: false,
        error: errorMessage
      };
    }
  }

  /**
   * Carga más comentarios para un restaurante (paginación)
   */
  async loadMoreComments(restaurantId: string): Promise<LoadCommentsResult> {
    const currentState = this.getCurrentState();
    const pagination = currentState.commentsPaginationData[restaurantId];
    
    if (!pagination?.has_next) {
      return {
        success: false,
        error: 'No hay más comentarios para cargar'
      };
    }

    return this.loadRestaurantComments(
      restaurantId,
      pagination.limit,
      pagination.page + 1,
      true,
      false
    );
  }

  /**
   * Crea un nuevo comentario (detecta automáticamente si es anónimo o autenticado)
   */
  async createComment(
    restaurantId: string,
    commentData: RestaurantCommentCreate
  ): Promise<CreateCommentResult> {
    this.setCreatingComment(restaurantId, true);
    this.clearCommentsError();

    try {
      const result = await restaurantRatingService.createRestaurantComment(
        restaurantId, commentData
      );

      if (result.success && result.data) {
        // Actualizar cache local
        this.store.update(state => {
          const currentComments = state.restaurantComments[restaurantId] || [];
          
          return {
            ...state,
            restaurantComments: {
              ...state.restaurantComments,
              [restaurantId]: [result.data!, ...currentComments]
            },
            isCreatingComment: {
              ...state.isCreatingComment,
              [restaurantId]: false
            },
            commentsError: null,
            commentsLastUpdated: {
              ...state.commentsLastUpdated,
              [restaurantId]: new Date()
            }
          };
        });

        return {
          success: true,
          comment: result.data
        };
      } else {
        this.setCreatingComment(restaurantId, false);
        this.setCommentsError(result.error || 'Error creando comentario');
        
        return {
          success: false,
          error: result.error || 'Error creando comentario'
        };
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido creando comentario';
      this.setCreatingComment(restaurantId, false);
      this.setCommentsError(errorMessage);
      
      return {
        success: false,
        error: errorMessage
      };
    }
  }

  /**
   * Obtiene los comentarios de un restaurante desde el cache
   */
  getRestaurantComments(restaurantId: string): Readable<RestaurantComment[]> {
    return derived(this.store, $state => 
      $state.restaurantComments[restaurantId] || []
    );
  }

  /**
   * Verifica si un restaurante está cargando comentarios
   */
  isRestaurantCommentsLoading(restaurantId: string): Readable<boolean> {
    return derived(this.store, $state => 
      $state.commentsLoadingStates[restaurantId] || false
    );
  }

  /**
   * Verifica si se está creando un comentario para un restaurante
   */
  isCreatingComment(restaurantId: string): Readable<boolean> {
    return derived(this.store, $state => 
      $state.isCreatingComment[restaurantId] || false
    );
  }

  /**
   * Obtiene la paginación de comentarios de un restaurante
   */
  getCommentsPagination(restaurantId: string): Readable<RatingsState['commentsPaginationData'][string] | null> {
    return derived(this.store, $state => 
      $state.commentsPaginationData[restaurantId] || null
    );
  }

  /**
   * Carga los restaurantes destacados
   */
  async loadFeaturedRestaurants(limit: number = 6): Promise<ApiResult<FeaturedRestaurantsResponse>> {
    this.setLoadingFeatured(true);

    try {
      const result = await restaurantRatingService.getFeaturedRestaurants(limit);

      if (result.success && result.data) {
        this.store.update(state => ({
          ...state,
          featuredRestaurants: result.data!,
          isLoadingFeatured: false
        }));
      } else {
        this.setLoadingFeatured(false);
      }

      return result;
    } catch (error) {
      this.setLoadingFeatured(false);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error cargando restaurantes destacados'
      };
    }
  }

  /**
   * Obtiene los ratings de un restaurante desde el cache
   */
  getRestaurantRatings(restaurantId: string): Readable<RestaurantRating[]> {
    return derived(this.store, $state => 
      $state.restaurantRatings[restaurantId] || []
    );
  }

  /**
   * Obtiene las estadísticas de un restaurante desde el cache
   */
  getRestaurantStats(restaurantId: string): Readable<RestaurantRatingStats | null> {
    return derived(this.store, $state => 
      $state.restaurantStats[restaurantId] || null
    );
  }

  /**
   * Verifica si un restaurante está cargando
   */
  isRestaurantLoading(restaurantId: string): Readable<boolean> {
    return derived(this.store, $state => 
      $state.loadingStates[restaurantId] || false
    );
  }

  /**
   * Obtiene la paginación de un restaurante
   */
  getRestaurantPagination(restaurantId: string): Readable<RatingsState['paginationData'][string] | null> {
    return derived(this.store, $state => 
      $state.paginationData[restaurantId] || null
    );
  }

  /**
   * Busca el rating del usuario actual para un restaurante
   */
  getUserRatingForRestaurant(restaurantId: string): Readable<RestaurantRating | null> {
    return derived(this.store, $state => {
      const ratings = $state.restaurantRatings[restaurantId] || [];
      const userId = $state.currentUserId;
      const deviceId = $state.deviceId;
      
      return restaurantRatingService.utils.findUserRating(ratings, userId || undefined, deviceId || undefined) || null;
    });
  }

  /**
   * Filtra ratings de un restaurante por criterios
   */
  getFilteredRestaurantRatings(
    restaurantId: string,
    filters: {
      minRating?: number;
      maxRating?: number;
      anonymous?: boolean;
      hasComment?: boolean;
    }
  ): Readable<RestaurantRating[]> {
    return derived(this.store, $state => {
      const ratings = $state.restaurantRatings[restaurantId] || [];
      return restaurantRatingService.utils.filterRatings(ratings, filters);
    });
  }

  /**
   * Obtiene ratings ordenados de un restaurante
   */
  getSortedRestaurantRatings(
    restaurantId: string,
    sortBy: 'timestamp' | 'rating' | 'comment' = 'timestamp',
    order: 'asc' | 'desc' = 'desc'
  ): Readable<RestaurantRating[]> {
    return derived(this.store, $state => {
      const ratings = $state.restaurantRatings[restaurantId] || [];
      return restaurantRatingService.utils.sortRatings(ratings, sortBy, order);
    });
  }

  /**
   * Métodos de utilidad privados
   */
  private getRestaurantRatingsFromCache(restaurantId: string): RestaurantRating[] {
    return this.getCurrentState().restaurantRatings[restaurantId] || [];
  }

  private getRestaurantCommentsFromCache(restaurantId: string): RestaurantComment[] {
    return this.getCurrentState().restaurantComments[restaurantId] || [];
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
      restaurantRatings: {},
      restaurantComments: {},
      restaurantStats: {},
      lastUpdated: {},
      commentsLastUpdated: {}
    }));
  }

  private setLoading(isLoading: boolean): void {
    this.store.update(state => ({ ...state, isLoading }));
  }

  private setLoadingTop(isLoadingTop: boolean): void {
    this.store.update(state => ({ ...state, isLoadingTop }));
  }

  private setLoadingFeatured(isLoadingFeatured: boolean): void {
    this.store.update(state => ({ ...state, isLoadingFeatured }));
  }

  private setLoadingSearch(isLoadingSearch: boolean): void {
    this.store.update(state => ({ ...state, isLoadingSearch }));
  }

  private setRestaurantLoading(restaurantId: string, isLoading: boolean): void {
    this.store.update(state => ({
      ...state,
      loadingStates: {
        ...state.loadingStates,
        [restaurantId]: isLoading
      }
    }));
  }

  private setCommentsLoading(restaurantId: string, isLoading: boolean): void {
    this.store.update(state => ({
      ...state,
      commentsLoadingStates: {
        ...state.commentsLoadingStates,
        [restaurantId]: isLoading
      }
    }));
  }

  private setCreatingComment(restaurantId: string, isCreating: boolean): void {
    this.store.update(state => ({
      ...state,
      isCreatingComment: {
        ...state.isCreatingComment,
        [restaurantId]: isCreating
      }
    }));
  }

  private setError(error: string | null): void {
    this.store.update(state => ({ ...state, error }));
  }

  private setCommentsError(error: string | null): void {
    this.store.update(state => ({ ...state, commentsError: error }));
  }

  private clearError(): void {
    this.setError(null);
  }

  private clearCommentsError(): void {
    this.setCommentsError(null);
  }

  /**
   * Limpia todo el cache
   */
  clearCache(): void {
    this.store.update(state => ({
      ...state,
      restaurantRatings: {},
      restaurantComments: {},
      restaurantStats: {},
      loadingStates: {},
      commentsLoadingStates: {},
      paginationData: {},
      commentsPaginationData: {},
      lastUpdated: {},
      commentsLastUpdated: {},
      searchResults: null,
      isCreatingComment: {}
    }));
  }

  /**
   * Obtiene el estado actual (para uso en funciones)
   */
  getCurrentState(): RatingsState {
    let currentState: RatingsState;
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

  getTopRatedRestaurants(): RestaurantRanking[] {
    return this.getCurrentState().topRatedRestaurants;
  }

  getFeaturedRestaurants(): FeaturedRestaurantsResponse | null {
    return this.getCurrentState().featuredRestaurants;
  }
}

/**
 * Instancia única del store de ratings de restaurantes
 */
export const restaurantRatingStore = new RestaurantRatingStore();

// Exports individuales para compatibilidad
export const ratingsLoading = restaurantRatingStore.isLoading;
export const ratingsLoadingTop = restaurantRatingStore.isLoadingTop;
export const ratingsLoadingFeatured = restaurantRatingStore.isLoadingFeatured;
export const ratingsLoadingSearch = restaurantRatingStore.isLoadingSearch;
export const ratingsError = restaurantRatingStore.error;
export const commentsError = restaurantRatingStore.commentsError;
export const topRatedRestaurants = restaurantRatingStore.topRatedRestaurants;
export const featuredRestaurants = restaurantRatingStore.featuredRestaurants;
export const searchResults = restaurantRatingStore.searchResults;
export const ratingsDeviceId = restaurantRatingStore.deviceId;
export const ratingsIsAuthenticated = restaurantRatingStore.isAuthenticated;

/**
 * Hook personalizado para usar en componentes Svelte
 */
export function useRestaurantRatings(restaurantId?: string) {
  const state = restaurantRatingStore.getCurrentState();

  return {
    // Estado general
    isLoading: state.isLoading,
    isLoadingTop: state.isLoadingTop,
    isLoadingFeatured: state.isLoadingFeatured,
    isLoadingSearch: state.isLoadingSearch,
    error: state.error,
    commentsError: state.commentsError,
    topRatedRestaurants: state.topRatedRestaurants,
    featuredRestaurants: state.featuredRestaurants,
    searchResults: state.searchResults,
    isAuthenticated: state.isAuthenticated,
    deviceId: state.deviceId,

    // Estado específico del restaurante (si se proporciona ID)
    restaurantRatings: restaurantId ? state.restaurantRatings[restaurantId] || [] : [],
    restaurantComments: restaurantId ? state.restaurantComments[restaurantId] || [] : [],
    restaurantStats: restaurantId ? state.restaurantStats[restaurantId] || null : null,
    isRestaurantLoading: restaurantId ? state.loadingStates[restaurantId] || false : false,
    isCommentsLoading: restaurantId ? state.commentsLoadingStates[restaurantId] || false : false,
    isCreatingComment: restaurantId ? state.isCreatingComment[restaurantId] || false : false,
    restaurantPagination: restaurantId ? state.paginationData[restaurantId] || null : null,
    commentsPagination: restaurantId ? state.commentsPaginationData[restaurantId] || null : null,

    // Métodos
    loadRatings: restaurantRatingStore.loadRestaurantRatings.bind(restaurantRatingStore),
    loadMoreRatings: restaurantRatingStore.loadMoreRatings.bind(restaurantRatingStore),
    createRating: restaurantRatingStore.createRating.bind(restaurantRatingStore),
    updateRating: restaurantRatingStore.updateRating.bind(restaurantRatingStore),
    deleteRating: restaurantRatingStore.deleteRating.bind(restaurantRatingStore),
    loadStats: restaurantRatingStore.loadRestaurantStats.bind(restaurantRatingStore),
    
    // Métodos de comentarios
    loadComments: restaurantRatingStore.loadRestaurantComments.bind(restaurantRatingStore),
    loadMoreComments: restaurantRatingStore.loadMoreComments.bind(restaurantRatingStore),
    createComment: restaurantRatingStore.createComment.bind(restaurantRatingStore),
    
    // Otros métodos
    searchRestaurants: restaurantRatingStore.searchRestaurants.bind(restaurantRatingStore),
    loadTopRated: restaurantRatingStore.loadTopRatedRestaurants.bind(restaurantRatingStore),
    loadFeatured: restaurantRatingStore.loadFeaturedRestaurants.bind(restaurantRatingStore),
    clearCache: restaurantRatingStore.clearCache.bind(restaurantRatingStore),

    // Stores reactivos (para uso en componentes)
    getRestaurantRatings: restaurantId ? restaurantRatingStore.getRestaurantRatings(restaurantId) : null,
    getRestaurantComments: restaurantId ? restaurantRatingStore.getRestaurantComments(restaurantId) : null,
    getRestaurantStats: restaurantId ? restaurantRatingStore.getRestaurantStats(restaurantId) : null,
    getUserRating: restaurantId ? restaurantRatingStore.getUserRatingForRestaurant(restaurantId) : null,
    isRestaurantLoadingStore: restaurantId ? restaurantRatingStore.isRestaurantLoading(restaurantId) : null,
    isCommentsLoadingStore: restaurantId ? restaurantRatingStore.isRestaurantCommentsLoading(restaurantId) : null,
    isCreatingCommentStore: restaurantId ? restaurantRatingStore.isCreatingComment(restaurantId) : null
  };
}

// Default export
export default restaurantRatingStore;