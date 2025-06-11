import { writable, derived, get } from 'svelte/store';
import { 
  getDeviceId, 
  createAnonymousRestaurantRating, 
  canUserRateRestaurant 
} from '../services/apiRatingService';
import type { 
  RestaurantRatingCreate, 
  RestaurantSearchResponse, 
  RestaurantSearchFilters 
} from '../interfaces/restaurantRating';

// === TIPOS PARA EL STORE ===
interface LocalRating {
  restaurantId: string;
  deviceId: string;
  rating: number;
  timestamp: string;
}

interface RatingState {
  deviceId: string;
  ratingsInProgress: Record<string, boolean>;
  userRatings: Record<string, number>;
  localRatings: LocalRating[];
  lastError: string | null;
  initialized: boolean;
}

interface SearchState {
  results: RestaurantSearchResponse | null;
  loading: boolean;
  error: string | null;
  filters: RestaurantSearchFilters;
  currentPage: number;
}

// === DETECCIÓN DE BROWSER PARA ASTRO ===
const isBrowser = typeof window !== 'undefined';

// === STORES PRINCIPALES ===

// Store para el estado de valoraciones
function createRatingStore() {
  const initialState: RatingState = {
    deviceId: '',
    ratingsInProgress: {},
    userRatings: {},
    localRatings: [],
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
          const localRatings = getStoredLocalRatings();
          
          update(state => ({
            ...state,
            deviceId,
            localRatings,
            initialized: true
          }));
          
          console.log('🔑 Rating store initialized with device ID:', deviceId.substring(0, 10) + '...');
        } catch (error) {
          console.error('❌ Error initializing rating store:', error);
          update(state => ({ ...state, initialized: true }));
        }
      }
    },

    // Iniciar proceso de valoración
    startRating: (restaurantId: string) => {
      update(state => ({
        ...state,
        ratingsInProgress: {
          ...state.ratingsInProgress,
          [restaurantId]: true
        },
        lastError: null
      }));
    },

    // Finalizar proceso de valoración (éxito)
    completeRating: (restaurantId: string, rating: number) => {
      update(state => {
        const newLocalRating: LocalRating = {
          restaurantId,
          deviceId: state.deviceId,
          rating,
          timestamp: new Date().toISOString()
        };

        const updatedLocalRatings = [
          ...state.localRatings.filter(r => 
            !(r.restaurantId === restaurantId && r.deviceId === state.deviceId)
          ),
          newLocalRating
        ];

        // Guardar en localStorage (solo en browser)
        if (isBrowser) {
          saveLocalRatings(updatedLocalRatings);
        }

        return {
          ...state,
          ratingsInProgress: {
            ...state.ratingsInProgress,
            [restaurantId]: false
          },
          userRatings: {
            ...state.userRatings,
            [restaurantId]: rating
          },
          localRatings: updatedLocalRatings,
          lastError: null
        };
      });
    },

    // Finalizar proceso de valoración (error)
    failRating: (restaurantId: string, error: string) => {
      update(state => ({
        ...state,
        ratingsInProgress: {
          ...state.ratingsInProgress,
          [restaurantId]: false
        },
        lastError: error
      }));
    },

    // Verificar si el usuario ya valoró un restaurante
    hasUserRated: (restaurantId: string) => {
      const state = get({ subscribe });
      return state.localRatings.some(rating => 
        rating.restaurantId === restaurantId && rating.deviceId === state.deviceId
      );
    },

    // Obtener la valoración del usuario para un restaurante
    getUserRating: (restaurantId: string) => {
      const state = get({ subscribe });
      const rating = state.localRatings.find(r => 
        r.restaurantId === restaurantId && r.deviceId === state.deviceId
      );
      return rating?.rating || 0;
    },

    // Limpiar errores
    clearError: () => {
      update(state => ({ ...state, lastError: null }));
    },

    // Limpiar todos los datos (útil para testing)
    reset: () => {
      if (isBrowser) {
        try {
          localStorage.removeItem('local_ratings');
          localStorage.removeItem('anonymous_device_id');
        } catch (error) {
          console.warn('Could not clear localStorage:', error);
        }
      }
      set({ ...initialState, initialized: isBrowser });
    }
  };
}

// Store para el estado de búsquedas
function createSearchStore() {
  const initialState: SearchState = {
    results: null,
    loading: false,
    error: null,
    filters: {},
    currentPage: 1
  };

  const { subscribe, set, update } = writable(initialState);

  return {
    subscribe,

    // Iniciar búsqueda
    startSearch: (filters: RestaurantSearchFilters, page: number = 1) => {
      update(state => ({
        ...state,
        loading: true,
        error: null,
        filters,
        currentPage: page
      }));
    },

    // Completar búsqueda exitosa
    completeSearch: (results: RestaurantSearchResponse) => {
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

    // Actualizar estadísticas de un restaurante después de valoración
    updateRestaurantStats: (restaurantId: string, newRating: number) => {
      update(state => {
        if (!state.results) return state;

        const updatedRestaurants = state.results.restaurants.map(restaurant => {
          if (restaurant.id === restaurantId && restaurant.analytics) {
            const currentCount = restaurant.analytics.reviewsCount || 0;
            const currentAvg = restaurant.analytics.averageRating || 0;
            const newCount = currentCount + 1;
            const newAvg = ((currentAvg * currentCount) + newRating) / newCount;

            return {
              ...restaurant,
              analytics: {
                ...restaurant.analytics,
                reviewsCount: newCount,
                averageRating: newAvg
              }
            };
          }
          return restaurant;
        });

        return {
          ...state,
          results: {
            ...state.results,
            restaurants: updatedRestaurants
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
export const ratingStore = createRatingStore();
export const searchStore = createSearchStore();

// === STORES DERIVADOS ===

// Device ID reactivo
export const deviceId = derived(
  ratingStore,
  $ratingStore => $ratingStore.deviceId
);

// Estado de inicialización
export const isInitialized = derived(
  ratingStore,
  $ratingStore => $ratingStore.initialized
);

// Estado de carga de valoraciones
export const isRatingInProgress = derived(
  ratingStore,
  $ratingStore => (restaurantId: string) => $ratingStore.ratingsInProgress[restaurantId] || false
);

// Verificar si hay búsquedas en curso
export const isSearching = derived(
  searchStore,
  $searchStore => $searchStore.loading
);

// Obtener resultados de búsqueda
export const searchResults = derived(
  searchStore,
  $searchStore => $searchStore.results
);

// Verificar si hay resultados
export const hasSearchResults = derived(
  searchStore,
  $searchStore => $searchStore.results && $searchStore.results.restaurants.length > 0
);

// === ACCIONES PRINCIPALES ===

/**
 * Acción para valorar un restaurante de forma anónima
 */
export async function rateRestaurantAnonymously(
  restaurantId: string, 
  rating: number
): Promise<boolean> {
  try {
    // Verificar inicialización
    const ratingState = get(ratingStore);
    if (!ratingState.initialized) {
      ratingStore.init();
      // Esperar un tick para que se complete la inicialización
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    const state = get(ratingStore);
    
    if (state.ratingsInProgress[restaurantId]) {
      throw new Error('Valoración en progreso');
    }

    if (!state.deviceId) {
      throw new Error('Device ID no disponible');
    }

    // Verificar si puede valorar
    const canRate = await canUserRateRestaurant(restaurantId, undefined, state.deviceId);
    if (!canRate.canRate) {
      throw new Error(canRate.reason || 'No puedes valorar este restaurante');
    }

    // Iniciar proceso
    ratingStore.startRating(restaurantId);

    // Crear valoración
    const ratingData: RestaurantRatingCreate = {
      rating,
      comment: '',
      anonymous: true
    };

    await createAnonymousRestaurantRating(restaurantId, ratingData, state.deviceId);

    // Completar proceso
    ratingStore.completeRating(restaurantId, rating);
    
    // Actualizar estadísticas en búsqueda si existe
    searchStore.updateRestaurantStats(restaurantId, rating);

    return true;

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
    ratingStore.failRating(restaurantId, errorMessage);
    return false;
  }
}

/**
 * Verificar si un usuario puede valorar un restaurante
 */
export function canUserRate(restaurantId: string): boolean {
  const state = get(ratingStore);
  return !state.localRatings.some(rating => 
    rating.restaurantId === restaurantId && rating.deviceId === state.deviceId
  );
}

/**
 * Obtener la valoración del usuario para un restaurante
 */
export function getUserRatingForRestaurant(restaurantId: string): number {
  return ratingStore.getUserRating(restaurantId);
}

// === FUNCIONES HELPER PARA LOCALSTORAGE ===

function getStoredLocalRatings(): LocalRating[] {
  if (!isBrowser) return [];
  
  try {
    const stored = localStorage.getItem('local_ratings');
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.warn('⚠️ Error reading local ratings:', error);
    return [];
  }
}

function saveLocalRatings(ratings: LocalRating[]): void {
  if (!isBrowser) return;
  
  try {
    // Mantener solo las últimas 100 valoraciones
    const recentRatings = ratings.slice(-100);
    localStorage.setItem('local_ratings', JSON.stringify(recentRatings));
  } catch (error) {
    console.warn('⚠️ Error saving local ratings:', error);
  }
}

// === INICIALIZACIÓN AUTOMÁTICA ===
// En Astro, inicializamos cuando el componente se monta, no automáticamente

// === EXPORTS ADICIONALES PARA TESTING ===
export const testUtils = {
  resetStores: () => {
    ratingStore.reset();
    searchStore.clear();
  },
  getStoreState: () => ({
    rating: get(ratingStore),
    search: get(searchStore)
  }),
  forceInit: () => {
    ratingStore.init();
  }
};