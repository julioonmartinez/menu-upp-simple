// src/stores/dishStore.ts
import { writable, derived, get } from 'svelte/store';
import { 
  getDeviceId, 
  createAnonymousDishRating,
  createAnonymousDishComment,
  canUserRateDish,
  saveLocalDishRating,
  getUserLocalDishRating 
} from '../services/apiDishService';
import type { 
  DishRatingCreate,
  DishCommentCreate, 
  DishSearchResponse, 
  DishSearchFilters,
  DishWithRatings,
  DishRanking
} from '../interfaces/dishRating';

// === TIPOS PARA EL STORE ===
interface LocalDishRating {
  dishId: string;
  deviceId: string;
  rating: number;
  timestamp: string;
}

interface LocalDishComment {
  dishId: string;
  deviceId: string;
  comment: string;
  rating?: number;
  timestamp: string;
}

interface DishRatingState {
  deviceId: string;
  ratingsInProgress: Record<string, boolean>;
  commentsInProgress: Record<string, boolean>;
  userRatings: Record<string, number>;
  userComments: Record<string, string>;
  localRatings: LocalDishRating[];
  localComments: LocalDishComment[];
  lastError: string | null;
  initialized: boolean;
}

interface DishSearchState {
  results: DishSearchResponse | null;
  topRated: DishRanking[];
  mostCommented: DishRanking[];
  loading: boolean;
  error: string | null;
  filters: DishSearchFilters;
  currentPage: number;
}

// === DETECCIÓN DE BROWSER PARA ASTRO ===
const isBrowser = typeof window !== 'undefined';

// === STORES PRINCIPALES ===

// Store para el estado de valoraciones y comentarios de dishes
function createDishRatingStore() {
  const initialState: DishRatingState = {
    deviceId: '',
    ratingsInProgress: {},
    commentsInProgress: {},
    userRatings: {},
    userComments: {},
    localRatings: [],
    localComments: [],
    lastError: null,
    initialized: false
  };

  const { subscribe, set, update } = writable(initialState);

  return {
    subscribe,
    
    // Inicializar el store (solo en browser)
    init: () => {
      if (isBrowser) {
        try {
          const deviceId = getDeviceId();
          const localRatings = getStoredLocalDishRatings();
          const localComments = getStoredLocalDishComments();
          
          update(state => ({
            ...state,
            deviceId,
            localRatings,
            localComments,
            initialized: true
          }));
          
        } catch (error) {
          update(state => ({ ...state, initialized: true }));
        }
      }
    },

    // Iniciar proceso de valoración
    startRating: (dishId: string) => {
      update(state => ({
        ...state,
        ratingsInProgress: {
          ...state.ratingsInProgress,
          [dishId]: true
        },
        lastError: null
      }));
    },

    // Finalizar proceso de valoración (éxito)
    completeRating: (dishId: string, rating: number) => {
      update(state => {
        const newLocalRating: LocalDishRating = {
          dishId,
          deviceId: state.deviceId,
          rating,
          timestamp: new Date().toISOString()
        };

        const updatedLocalRatings = [
          ...state.localRatings.filter(r => 
            !(r.dishId === dishId && r.deviceId === state.deviceId)
          ),
          newLocalRating
        ];

        // Guardar en localStorage (solo en browser)
        if (isBrowser) {
          saveLocalDishRatings(updatedLocalRatings);
        }

        return {
          ...state,
          ratingsInProgress: {
            ...state.ratingsInProgress,
            [dishId]: false
          },
          userRatings: {
            ...state.userRatings,
            [dishId]: rating
          },
          localRatings: updatedLocalRatings,
          lastError: null
        };
      });
    },

    // Finalizar proceso de valoración (error)
    failRating: (dishId: string, error: string) => {
      update(state => ({
        ...state,
        ratingsInProgress: {
          ...state.ratingsInProgress,
          [dishId]: false
        },
        lastError: error
      }));
    },

    // Iniciar proceso de comentario
    startComment: (dishId: string) => {
      update(state => ({
        ...state,
        commentsInProgress: {
          ...state.commentsInProgress,
          [dishId]: true
        },
        lastError: null
      }));
    },

    // Finalizar proceso de comentario (éxito)
    completeComment: (dishId: string, comment: string, rating?: number) => {
      update(state => {
        const newLocalComment: LocalDishComment = {
          dishId,
          deviceId: state.deviceId,
          comment,
          rating,
          timestamp: new Date().toISOString()
        };

        const updatedLocalComments = [
          ...state.localComments.filter(c => 
            !(c.dishId === dishId && c.deviceId === state.deviceId)
          ),
          newLocalComment
        ];

        // Guardar en localStorage
        if (isBrowser) {
          saveLocalDishComments(updatedLocalComments);
        }

        // Actualizar rating si se proporcionó
        const updatedRatings = rating ? {
          ...state.userRatings,
          [dishId]: rating
        } : state.userRatings;

        return {
          ...state,
          commentsInProgress: {
            ...state.commentsInProgress,
            [dishId]: false
          },
          userComments: {
            ...state.userComments,
            [dishId]: comment
          },
          userRatings: updatedRatings,
          localComments: updatedLocalComments,
          lastError: null
        };
      });
    },

    // Finalizar proceso de comentario (error)
    failComment: (dishId: string, error: string) => {
      update(state => ({
        ...state,
        commentsInProgress: {
          ...state.commentsInProgress,
          [dishId]: false
        },
        lastError: error
      }));
    },

    // Verificar si el usuario ya valoró un platillo
    hasUserRated: (dishId: string) => {
      const state = get({ subscribe });
      return state.localRatings.some(rating => 
        rating.dishId === dishId && rating.deviceId === state.deviceId
      );
    },

    // Obtener la valoración del usuario para un platillo
    getUserRating: (dishId: string) => {
      const state = get({ subscribe });
      const rating = state.localRatings.find(r => 
        r.dishId === dishId && r.deviceId === state.deviceId
      );
      return rating?.rating || 0;
    },

    // Verificar si el usuario ya comentó un platillo
    hasUserCommented: (dishId: string) => {
      const state = get({ subscribe });
      return state.localComments.some(comment => 
        comment.dishId === dishId && comment.deviceId === state.deviceId
      );
    },

    // Obtener el comentario del usuario para un platillo
    getUserComment: (dishId: string) => {
      const state = get({ subscribe });
      const comment = state.localComments.find(c => 
        c.dishId === dishId && c.deviceId === state.deviceId
      );
      return comment?.comment || '';
    },

    // Limpiar errores
    clearError: () => {
      update(state => ({ ...state, lastError: null }));
    },

    // Limpiar todos los datos (útil para testing)
    reset: () => {
      if (isBrowser) {
        try {
          localStorage.removeItem('local_dish_ratings');
          localStorage.removeItem('local_dish_comments');
          localStorage.removeItem('anonymous_device_id');
        } catch (error) {
          console.warn('Could not clear localStorage:', error);
        }
      }
      set({ ...initialState, initialized: isBrowser });
    }
  };
}

// Store para el estado de búsquedas de dishes
function createDishSearchStore() {
  const initialState: DishSearchState = {
    results: null,
    topRated: [],
    mostCommented: [],
    loading: false,
    error: null,
    filters: {},
    currentPage: 1
  };

  const { subscribe, set, update } = writable(initialState);

  return {
    subscribe,

    // Iniciar búsqueda
    startSearch: (filters: DishSearchFilters, page: number = 1) => {
      update(state => ({
        ...state,
        loading: true,
        error: null,
        filters,
        currentPage: page
      }));
    },

    // Completar búsqueda exitosa
    completeSearch: (results: DishSearchResponse) => {
      update(state => ({
        ...state,
        loading: false,
        results,
        error: null
      }));
    },

    // Búsqueda fallida
    failSearch: (error: string) => {
      update(state => ({
        ...state,
        loading: false,
        error,
        results: null
      }));
    },

    // Cargar top rated dishes
    loadTopRated: (dishes: DishRanking[]) => {
      update(state => ({
        ...state,
        topRated: dishes
      }));
    },

    // Cargar most commented dishes
    loadMostCommented: (dishes: DishRanking[]) => {
      update(state => ({
        ...state,
        mostCommented: dishes
      }));
    },

    // Actualizar estadísticas de un platillo después de valoración
    updateDishStats: (dishId: string, newRating: number) => {
      update(state => {
        if (!state.results) return state;

        const updatedDishes = state.results.dishes.map(dish => {
          if (dish.id === dishId && dish.analytics) {
            const currentCount = dish.analytics.totalRatings || 0;
            const currentAvg = dish.rating || 0;
            const newCount = currentCount + 1;
            const newAvg = ((currentAvg * currentCount) + newRating) / newCount;

            return {
              ...dish,
              rating: newAvg,
              analytics: {
                ...dish.analytics,
                totalRatings: newCount,
                averageRating: newAvg
              }
            };
          }
          return dish;
        });

        return {
          ...state,
          results: {
            ...state.results,
            dishes: updatedDishes
          }
        };
      });
    },

    // Limpiar resultados
    clear: () => {
      set(initialState);
    }
  };
}

// === INSTANCIAS DE LOS STORES ===
export const dishRatingStore = createDishRatingStore();
export const dishSearchStore = createDishSearchStore();

// === STORES DERIVADOS ===

// Device ID reactivo
export const dishDeviceId = derived(
  dishRatingStore,
  $dishRatingStore => $dishRatingStore.deviceId
);

// Estado de inicialización
export const isDishRatingInitialized = derived(
  dishRatingStore,
  $dishRatingStore => $dishRatingStore.initialized
);

// Estado de carga de valoraciones
export const isDishRatingInProgress = derived(
  dishRatingStore,
  $dishRatingStore => (dishId: string) => $dishRatingStore.ratingsInProgress[dishId] || false
);

// Estado de carga de comentarios
export const isDishCommentInProgress = derived(
  dishRatingStore,
  $dishRatingStore => (dishId: string) => $dishRatingStore.commentsInProgress[dishId] || false
);

// Verificar si hay búsquedas en curso
export const isDishSearching = derived(
  dishSearchStore,
  $dishSearchStore => $dishSearchStore.loading
);

// Obtener resultados de búsqueda
export const dishSearchResults = derived(
  dishSearchStore,
  $dishSearchStore => $dishSearchStore.results
);

// Verificar si hay resultados
export const hasDishSearchResults = derived(
  dishSearchStore,
  $dishSearchStore => $dishSearchStore.results && $dishSearchStore.results.dishes.length > 0
);

// Obtener top rated dishes
export const topRatedDishes = derived(
  dishSearchStore,
  $dishSearchStore => $dishSearchStore.topRated
);

// Obtener most commented dishes
export const mostCommentedDishes = derived(
  dishSearchStore,
  $dishSearchStore => $dishSearchStore.mostCommented
);

// === ACCIONES PRINCIPALES ===

/**
 * Acción para valorar un platillo de forma anónima
 */
export async function rateDishAnonymously(
  dishId: string, 
  rating: number
): Promise<boolean> {
  try {
    // Verificar inicialización
    const ratingState = get(dishRatingStore);
    if (!ratingState.initialized) {
      dishRatingStore.init();
      // Esperar un tick para que se complete la inicialización
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    const state = get(dishRatingStore);
    
    if (state.ratingsInProgress[dishId]) {
      throw new Error('Valoración en progreso');
    }

    if (!state.deviceId) {
      throw new Error('Device ID no disponible');
    }

    // Verificar si puede valorar
    const canRate = await canUserRateDish(dishId, undefined, state.deviceId);
    if (!canRate.canRate) {
      throw new Error(canRate.reason || 'No puedes valorar este platillo');
    }

    // Iniciar proceso
    dishRatingStore.startRating(dishId);

    // Crear valoración
    const ratingData: DishRatingCreate = {
      rating,
      anonymous: true
    };

    await createAnonymousDishRating(dishId, ratingData, state.deviceId);

    // Completar proceso
    dishRatingStore.completeRating(dishId, rating);
    
    // Actualizar estadísticas en búsqueda si existe
    dishSearchStore.updateDishStats(dishId, rating);

    return true;

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
    dishRatingStore.failRating(dishId, errorMessage);
    return false;
  }
}

/**
 * Acción para comentar un platillo de forma anónima
 */
export async function commentDishAnonymously(
  dishId: string, 
  comment: string,
  rating?: number
): Promise<boolean> {
  try {
    // Verificar inicialización
    const ratingState = get(dishRatingStore);
    if (!ratingState.initialized) {
      dishRatingStore.init();
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    const state = get(dishRatingStore);
    
    if (state.commentsInProgress[dishId]) {
      throw new Error('Comentario en progreso');
    }

    if (!state.deviceId) {
      throw new Error('Device ID no disponible');
    }

    // Iniciar proceso
    dishRatingStore.startComment(dishId);

    // Crear comentario
    const commentData: DishCommentCreate = {
      comment,
      rating
    };

    await createAnonymousDishComment(dishId, commentData, state.deviceId);

    // Completar proceso
    dishRatingStore.completeComment(dishId, comment, rating);
    
    // Actualizar estadísticas en búsqueda si se proporcionó rating
    if (rating) {
      dishSearchStore.updateDishStats(dishId, rating);
    }

    return true;

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
    dishRatingStore.failComment(dishId, errorMessage);
    return false;
  }
}

/**
 * Verificar si un usuario puede valorar un platillo
 */
export function canUserRateThisDish(dishId: string): boolean {
  const state = get(dishRatingStore);
  return !state.localRatings.some(rating => 
    rating.dishId === dishId && rating.deviceId === state.deviceId
  );
}

/**
 * Obtener la valoración del usuario para un platillo
 */
export function getUserRatingForDish(dishId: string): number {
  return dishRatingStore.getUserRating(dishId);
}

/**
 * Verificar si un usuario puede comentar un platillo
 */
export function canUserCommentThisDish(dishId: string): boolean {
  const state = get(dishRatingStore);
  return !state.localComments.some(comment => 
    comment.dishId === dishId && comment.deviceId === state.deviceId
  );
}

/**
 * Obtener el comentario del usuario para un platillo
 */
export function getUserCommentForDish(dishId: string): string {
  return dishRatingStore.getUserComment(dishId);
}

// === FUNCIONES HELPER PARA LOCALSTORAGE ===

function getStoredLocalDishRatings(): LocalDishRating[] {
  if (!isBrowser) return [];
  
  try {
    const stored = localStorage.getItem('local_dish_ratings');
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.warn('⚠️ Error reading local dish ratings:', error);
    return [];
  }
}

function saveLocalDishRatings(ratings: LocalDishRating[]): void {
  if (!isBrowser) return;
  
  try {
    // Mantener solo las últimas 100 valoraciones
    const recentRatings = ratings.slice(-100);
    localStorage.setItem('local_dish_ratings', JSON.stringify(recentRatings));
  } catch (error) {
    console.warn('⚠️ Error saving local dish ratings:', error);
  }
}

function getStoredLocalDishComments(): LocalDishComment[] {
  if (!isBrowser) return [];
  
  try {
    const stored = localStorage.getItem('local_dish_comments');
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.warn('⚠️ Error reading local dish comments:', error);
    return [];
  }
}

function saveLocalDishComments(comments: LocalDishComment[]): void {
  if (!isBrowser) return;
  
  try {
    // Mantener solo los últimos 100 comentarios
    const recentComments = comments.slice(-100);
    localStorage.setItem('local_dish_comments', JSON.stringify(recentComments));
  } catch (error) {
    console.warn('⚠️ Error saving local dish comments:', error);
  }
}

// === EXPORTS ADICIONALES PARA TESTING ===
export const dishTestUtils = {
  resetStores: () => {
    dishRatingStore.reset();
    dishSearchStore.clear();
  },
  getStoreState: () => ({
    rating: get(dishRatingStore),
    search: get(dishSearchStore)
  }),
  forceInit: () => {
    dishRatingStore.init();
  }
};