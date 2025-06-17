import type { Restaurant } from '../interfaces';
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
  RestaurantCommentUpdate,
  RestaurantCommentsResponse,  
  RestaurantFavoriteResponse,
  UserRestaurantFavoritesResponse,
  RestaurantFavoriteStatusResponse,
  AnonymousRestaurantFavoritesResponse,
  CombinedFavoritesResponse,
  PopularRestaurantsResponse,
  FavoritesStatsResponse
} from '../interfaces/restaurantRating';
import { debugApiConfiguration, fetchRestaurantByUsername } from './apiService';

//services/apiRatingService.ts
const getBaseUrl = () => {
  const apiUrl = import.meta.env.PUBLIC_API_URL;
  const isDev = import.meta.env.DEV;
  
  if (isDev && !apiUrl) {
    return 'http://localhost:8000/api';
  }
  
  if (!isDev && !apiUrl) {
    throw new Error('PUBLIC_API_URL is required in production');
  }
  
  return apiUrl;
};

// CONFIGURACIÓN ESTÁNDAR DE HEADERS para todas las peticiones
const getStandardHeaders = () => ({
  'Content-Type': 'application/json',
  'Accept': 'application/json',
  // Agregar headers adicionales que podrían ayudar con CORS
  'X-Requested-With': 'XMLHttpRequest',
});
// Función helper para headers con autenticación
const getAuthHeaders = (token?: string) => ({
  ...getStandardHeaders(),
  ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
});

// Función helper para headers anónimos
const getAnonymousHeaders = (deviceId?: string) => ({
  ...getStandardHeaders(),
  ...(deviceId ? { 'X-Device-Id': deviceId } : {}),
});

// Función helper mejorada para fetch con configuración estándar
async function fetchWithStandardConfig(url: string, options: RequestInit & { timeout?: number } = {}) {
  const { timeout = 10000, ...fetchOptions } = options;
  
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);
  
  try {
    const response = await fetch(url, {
      method: 'GET', // Explícitamente GET
      headers: getStandardHeaders(),
      mode: 'cors', // Explícitamente CORS
      credentials: 'omit', // No enviar cookies
      ...fetchOptions,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
}

/**
 * Obtiene las valoraciones de un restaurante específico
 */
export async function fetchRestaurantRatings(
  restaurantId: string,
  page: number = 1,
  limit: number = 10,
  includeAnonymous: boolean = true
): Promise<RestaurantRatingsResponse> {
  const baseUrl = getBaseUrl();
  const url = `${baseUrl}/restaurants/${restaurantId}/ratings?page=${page}&limit=${limit}&include_anonymous=${includeAnonymous}`;
  
  console.log('🔍 Fetching restaurant ratings:', { restaurantId, page, limit, includeAnonymous });
  
  try {
    const response = await fetchWithStandardConfig(url, {
      timeout: 10000,
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Error response:', {
        status: response.status,
        statusText: response.statusText,
        url,
        errorBody: errorText
      });
      throw new Error(`Error fetching restaurant ratings: ${response.status} ${errorText}`);
    }
    
    const data = await response.json();
    
    if (!data || !Array.isArray(data.ratings)) {
      console.error('❌ Invalid ratings data structure:', data);
      throw new Error('Invalid ratings data format');
    }
    
    console.log('✅ Successfully fetched restaurant ratings:', data.ratings.length);
    return data;
    
  } catch (error) {
    console.error('❌ Error fetching restaurant ratings:', error);
    throw error;
  }
}

/**
 * Crea una valoración para un restaurante (usuario autenticado)
 */
export async function createRestaurantRating(
  restaurantId: string,
  ratingData: RestaurantRatingCreate,
  token: string
): Promise<RestaurantRating> {
  const baseUrl = getBaseUrl();
  const url = `${baseUrl}/restaurants/${restaurantId}/ratings`;
  
  console.log('⭐ Creating restaurant rating:', { restaurantId, rating: ratingData.rating });
  
  try {
    const response = await fetchWithStandardConfig(url, {
      method: 'POST',
      headers: getAuthHeaders(token),
      body: JSON.stringify(ratingData),
      timeout: 8000,
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Error creating rating:', {
        status: response.status,
        statusText: response.statusText,
        errorBody: errorText
      });
      throw new Error(`Error creating rating: ${response.status} ${errorText}`);
    }
    
    const data = await response.json();
    console.log('✅ Successfully created restaurant rating');
    return data;
    
  } catch (error) {
    console.error('❌ Error creating restaurant rating:', error);
    throw error;
  }
}

/**
 * Crea una valoración anónima para un restaurante
 */
export async function createAnonymousRestaurantRating(
  restaurantId: string,
  ratingData: RestaurantRatingCreate,
  deviceId: string
): Promise<RestaurantRating> {
  const baseUrl = getBaseUrl();
  const url = `${baseUrl}/anonymous/restaurants/${restaurantId}/rate`;
  
  console.log('⭐ Creating anonymous restaurant rating:', { restaurantId, rating: ratingData.rating, deviceId });
  
  try {
    // Validación adicional para Svelte
    if (!restaurantId || !deviceId) {
      throw new Error('Restaurant ID and Device ID are required');
    }
    
    if (ratingData.rating < 1 || ratingData.rating > 5) {
      throw new Error('Rating must be between 1 and 5');
    }

    const response = await fetchWithStandardConfig(url, {
      method: 'POST',
      headers: getAnonymousHeaders(deviceId),
      body: JSON.stringify({
        ...ratingData,
        anonymous: true // Asegurar que sea anónimo
      }),
      timeout: 8000,
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Error creating anonymous rating:', {
        status: response.status,
        statusText: response.statusText,
        errorBody: errorText
      });
      
      // Manejo específico de errores para mejor UX
      if (response.status === 429) {
        throw new Error('Has alcanzado el límite de valoraciones. Inténtalo más tarde.');
      } else if (response.status === 409) {
        throw new Error('Ya has valorado este restaurante desde este dispositivo.');
      } else if (response.status === 400) {
        throw new Error('Datos de valoración inválidos.');
      }
      
      throw new Error(`Error creating anonymous rating: ${response.status} ${errorText}`);
    }
    
    const data = await response.json();
    console.log('✅ Successfully created anonymous restaurant rating');
    return data;
    
  } catch (error) {
    console.error('❌ Error creating anonymous restaurant rating:', error);
    throw error;
  }
}

/**
 * Actualiza una valoración existente de restaurante
 */
export async function updateRestaurantRating(
  ratingId: string,
  ratingData: RestaurantRatingUpdate,
  token: string
): Promise<RestaurantRating> {
  const baseUrl = getBaseUrl();
  const url = `${baseUrl}/restaurants/ratings/${ratingId}`;
  
  console.log('✏️ Updating restaurant rating:', { ratingId, updates: ratingData });
  
  try {
    const response = await fetchWithStandardConfig(url, {
      method: 'PUT',
      headers: getAuthHeaders(token),
      body: JSON.stringify(ratingData),
      timeout: 8000,
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Error updating rating:', {
        status: response.status,
        statusText: response.statusText,
        errorBody: errorText
      });
      throw new Error(`Error updating rating: ${response.status} ${errorText}`);
    }
    
    const data = await response.json();
    console.log('✅ Successfully updated restaurant rating');
    return data;
    
  } catch (error) {
    console.error('❌ Error updating restaurant rating:', error);
    throw error;
  }
}

/**
 * Elimina una valoración de restaurante
 */
export async function deleteRestaurantRating(
  ratingId: string,
  token: string
): Promise<{ message: string }> {
  const baseUrl = getBaseUrl();
  const url = `${baseUrl}/restaurants/ratings/${ratingId}`;
  
  console.log('🗑️ Deleting restaurant rating:', { ratingId });
  
  try {
    const response = await fetchWithStandardConfig(url, {
      method: 'DELETE',
      headers: getAuthHeaders(token),
      timeout: 8000,
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Error deleting rating:', {
        status: response.status,
        statusText: response.statusText,
        errorBody: errorText
      });
      throw new Error(`Error deleting rating: ${response.status} ${errorText}`);
    }
    
    const data = await response.json();
    console.log('✅ Successfully deleted restaurant rating');
    return data;
    
  } catch (error) {
    console.error('❌ Error deleting restaurant rating:', error);
    throw error;
  }
}

/**
 * Obtiene estadísticas detalladas de valoraciones de un restaurante
 */
export async function fetchRestaurantRatingStats(restaurantId: string): Promise<RestaurantRatingStats> {
  const baseUrl = getBaseUrl();
  const url = `${baseUrl}/restaurants/${restaurantId}/rating-stats`;
  
  console.log('📈 Fetching restaurant rating stats:', { restaurantId });
  
  try {
    const response = await fetchWithStandardConfig(url, {
      timeout: 8000,
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Error fetching rating stats:', {
        status: response.status,
        statusText: response.statusText,
        errorBody: errorText
      });
      throw new Error(`Error fetching rating stats: ${response.status} ${errorText}`);
    }
    
    const data = await response.json();
    console.log('✅ Successfully fetched restaurant rating stats');
    return data;
    
  } catch (error) {
    console.error('❌ Error fetching restaurant rating stats:', error);
    throw error;
  }
}

/**
 * Búsqueda avanzada de restaurantes con filtros
 */
export async function searchRestaurants(
  filters: RestaurantSearchFilters,
  page: number = 1,
  limit: number = 20
): Promise<RestaurantSearchResponse> {
  const baseUrl = getBaseUrl();
  const url = `${baseUrl}/restaurants/search?page=${page}&limit=${limit}`;
  
  console.log('🔍 Searching restaurants with filters:', { filters, page, limit });
  
  try {
    const response = await fetchWithStandardConfig(url, {
      method: 'POST',
      headers: getStandardHeaders(),
      body: JSON.stringify(filters),
      timeout: 12000,
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Error searching restaurants:', {
        status: response.status,
        statusText: response.statusText,
        errorBody: errorText
      });
      throw new Error(`Error searching restaurants: ${response.status} ${errorText}`);
    }
    
    const data = await response.json();
    
    if (!data || !Array.isArray(data.restaurants)) {
      console.error('❌ Invalid search results data structure:', data);
      throw new Error('Invalid search results data format');
    }
    
    console.log('✅ Successfully searched restaurants:', data.restaurants.length);
    return data;
    
  } catch (error) {
    console.error('❌ Error searching restaurants:', error);
    throw error;
  }
}

/**
 * Obtiene el ranking de restaurantes mejor valorados
 */
export async function fetchTopRatedRestaurants(
  limit: number = 10,
  minReviews: number = 1
): Promise<RestaurantRanking[]> {
  const baseUrl = getBaseUrl();
  const url = `${baseUrl}/restaurants/top-rated?limit=${limit}&min_reviews=${minReviews}`;
  
  console.log('🏆 Fetching top rated restaurants:', { limit, minReviews } , );
  
  try {
    const response = await fetchWithStandardConfig(url, {
      timeout: 10000,
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Error fetching top rated restaurants:', {
        status: response.status,
        statusText: response.statusText,
        errorBody: errorText
      });
      throw new Error(`Error fetching top rated restaurants: ${response.status} ${errorText}`);
    }
    
    const data = await response.json();
    
    
    if (!Array.isArray(data)) {
      console.error('❌ Invalid top rated restaurants data structure:', data);
      throw new Error('Invalid top rated restaurants data format');
    }
    
    console.log('✅ Successfully fetched top rated restaurants:', data);
    return data;
    
  } catch (error) {
    console.error('❌ Error fetching top rated restaurants:', error);
    throw error;
  }
}

/**
 * Obtiene restaurantes destacados para mostrar en homepage
 */
export async function fetchFeaturedRestaurants(limit: number = 6): Promise<FeaturedRestaurantsResponse> {
  const baseUrl = getBaseUrl();
  const url = `${baseUrl}/restaurants/featured?limit=${limit}`;
  
  console.log('⭐ Fetching featured restaurants:', { limit });
  
  try {
    const response = await fetchWithStandardConfig(url, {
      timeout: 10000,
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Error fetching featured restaurants:', {
        status: response.status,
        statusText: response.statusText,
        errorBody: errorText
      });
      throw new Error(`Error fetching featured restaurants: ${response.status} ${errorText}`);
    }
    
    const data = await response.json();
    
    if (!data || !Array.isArray(data.featured_restaurants)) {
      console.error('❌ Invalid featured restaurants data structure:', data);
      throw new Error('Invalid featured restaurants data format');
    }
    
    console.log('✅ Successfully fetched featured restaurants:', data.featured_restaurants.length);
    return data;
    
  } catch (error) {
    console.error('❌ Error fetching featured restaurants:', error);
    throw error;
  }
}

/**
 * Función helper para obtener el ID del dispositivo para usuarios anónimos
 */
export function getDeviceId(): string {
  // Verificar si estamos en el browser
  if (typeof window === 'undefined') {
    return `server_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  try {
    // Verificar si ya existe un device ID en localStorage
    let deviceId = localStorage.getItem('anonymous_device_id');
    
    if (!deviceId) {
      // Generar nuevo device ID más robusto
      const timestamp = Date.now();
      const randomPart = Math.random().toString(36).substr(2, 12);
      const browserFingerprint = generateBrowserFingerprint();
      
      deviceId = `device_${timestamp}_${randomPart}_${browserFingerprint}`;
      localStorage.setItem('anonymous_device_id', deviceId);
      localStorage.setItem('device_created_at', new Date().toISOString());
      console.log('🔑 Generated new device ID');
    }
    
    return deviceId;
  } catch (error) {
    console.warn('⚠️ Error accessing localStorage, using session device ID:', error);
    // Fallback para navegadores que no soportan localStorage
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

/**
 * Genera un fingerprint básico del navegador (NUEVA FUNCIÓN)
 */
function generateBrowserFingerprint(): string {
  if (typeof window === 'undefined') return 'server';
  
  try {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.textBaseline = 'top';
      ctx.font = '14px Arial';
      ctx.fillText('Device fingerprint', 2, 2);
    }
    
    const fingerprint = [
      navigator.userAgent.slice(0, 20),
      navigator.language,
      screen.width + 'x' + screen.height,
      new Date().getTimezoneOffset(),
      canvas.toDataURL().slice(0, 20)
    ].join('|');
    
    // Hash simple del fingerprint
    return btoa(fingerprint).slice(0, 8);
  } catch (error) {
    return Math.random().toString(36).substr(2, 8);
  }
}

/**
 * Función helper para verificar si el usuario puede valorar un restaurante
 */
export async function canUserRateRestaurant(
  restaurantId: string,
  token?: string,
  deviceId?: string
): Promise<{ canRate: boolean; reason?: string }> {
  try {
    // Obtener valoraciones existentes del usuario/dispositivo
    const ratings = await fetchRestaurantRatings(restaurantId, 1, 100, true);
    
    if (token) {
      // Usuario autenticado: verificar si ya valoró
      const userRating = ratings.ratings.find(r => r.userId && !r.anonymous);
      if (userRating) {
        return { canRate: false, reason: 'Ya has valorado este restaurante' };
      }
    } else if (deviceId) {
      // Usuario anónimo: verificar localmente primero
      const localRatings = getLocalRatings();
      const hasRatedLocally = localRatings.some(rating => 
        rating.restaurantId === restaurantId && rating.deviceId === deviceId
      );
      
      if (hasRatedLocally) {
        return { 
          canRate: false, 
          reason: 'Ya has valorado este restaurante desde este dispositivo' 
        };
      }
      
      return { canRate: true };
    } else {
      return { canRate: false, reason: 'Se requiere autenticación o device ID' };
    }
    
    return { canRate: true };
    
  } catch (error) {
    console.warn('⚠️ Error checking if user can rate:', error);
    // Si hay error, permitir intento (el backend validará)
    return { canRate: true };
  }
}

/**
 * NUEVAS FUNCIONES HELPER PARA SVELTE
 */

/**
 * Interface para valoraciones locales
 */
interface LocalRating {
  restaurantId: string;
  deviceId: string;
  rating: number;
  timestamp: string;
}

/**
 * Obtiene las valoraciones guardadas localmente (NUEVA FUNCIÓN)
 */
export function getLocalRatings(): LocalRating[] {
  if (typeof window === 'undefined') return [];
  
  try {
    const stored = localStorage.getItem('local_ratings');
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.warn('⚠️ Error reading local ratings:', error);
    return [];
  }
}

/**
 * Guarda una valoración localmente (NUEVA FUNCIÓN)
 */
export function saveLocalRating(rating: LocalRating): void {
  if (typeof window === 'undefined') return;
  
  try {
    const localRatings = getLocalRatings();
    
    // Remover valoración anterior del mismo restaurante y dispositivo
    const filteredRatings = localRatings.filter(r => 
      !(r.restaurantId === rating.restaurantId && r.deviceId === rating.deviceId)
    );
    
    filteredRatings.push(rating);
    
    // Mantener solo las últimas 100 valoraciones
    const recentRatings = filteredRatings.slice(-100);
    
    localStorage.setItem('local_ratings', JSON.stringify(recentRatings));
  } catch (error) {
    console.warn('⚠️ Error saving local rating:', error);
  }
}

/**
 * Verifica si el usuario ya valoró un restaurante localmente (NUEVA FUNCIÓN)
 */
export function hasUserRatedLocally(restaurantId: string, deviceId: string): boolean {
  const localRatings = getLocalRatings();
  return localRatings.some(rating => 
    rating.restaurantId === restaurantId && rating.deviceId === deviceId
  );
}

/**
 * Obtiene la valoración local del usuario para un restaurante (NUEVA FUNCIÓN)
 */
export function getUserLocalRating(restaurantId: string, deviceId: string): number {
  const localRatings = getLocalRatings();
  const rating = localRatings.find(r => 
    r.restaurantId === restaurantId && r.deviceId === deviceId
  );
  return rating?.rating || 0;
}

/**
 * Limpia todos los datos del dispositivo (NUEVA FUNCIÓN)
 */
export function clearDeviceData(): void {
  if (typeof window === 'undefined') return;
  
  try {
    localStorage.removeItem('anonymous_device_id');
    localStorage.removeItem('device_created_at');
    localStorage.removeItem('local_ratings');
    console.log('🧹 Device data cleared');
  } catch (error) {
    console.warn('⚠️ Error clearing device data:', error);
  }
}

/**
 * Función helper para obtener un restaurante con sus estadísticas de valoración
 */
export async function fetchRestaurantWithRatings(username: string) {
  console.log('🔍 Fetching restaurant with ratings:', username);
  
  try {
    const [restaurantResult] = await Promise.allSettled([
      fetchRestaurantByUsername(username),
      // No podemos obtener stats sin el ID, lo haremos después
    ]);
    
    if (restaurantResult.status === 'rejected') {
      throw new Error(`Restaurant not found: ${restaurantResult.reason}`);
    }
    
    const restaurant = restaurantResult.value;
    
    // Ahora obtenemos las estadísticas con el ID del restaurante
    try {
      const stats = await fetchRestaurantRatingStats(restaurant.id!);
      return {
        restaurant: {
          ...restaurant,
          ratingStats: stats
        },
        stats
      };
    } catch (statsError) {
      console.warn('⚠️ Could not fetch rating stats:', statsError);
      return {
        restaurant,
        stats: null
      };
    }
    
  } catch (error) {
    console.error('❌ Error fetching restaurant with ratings:', error);
    throw error;
  }
}

// ===== FUNCIÓN PARA DEBUG DE CONFIGURACIÓN =====
/**
 * Actualizar el debugRestaurantRatingsApi para incluir comentarios
 */
export function debugRestaurantRatingsApi() {
  return {
    ...debugApiConfiguration(),
    features: {
      restaurantRatings: true,
      anonymousRatings: true,
      restaurantComments: true, // NUEVO
      anonymousComments: true,  // NUEVO
      ratingStats: true,
      restaurantSearch: true,
      topRatedRestaurants: true,
      featuredRestaurants: true,
      localTracking: true,
      deviceFingerprinting: true
    },
    endpoints: {
      ratings: `${getBaseUrl()}/restaurants/{id}/ratings`,
      createRating: `${getBaseUrl()}/restaurants/{id}/ratings`,
      anonymousRating: `${getBaseUrl()}/anonymous/restaurants/{id}/rate`,
      comments: `${getBaseUrl()}/restaurants/{id}/comments`, // NUEVO
      createComment: `${getBaseUrl()}/restaurants/{id}/comments`, // NUEVO
      anonymousComment: `${getBaseUrl()}/anonymous/restaurants/{id}/comments`, // NUEVO
      stats: `${getBaseUrl()}/restaurants/{id}/rating-stats`,
      search: `${getBaseUrl()}/restaurants/search`,
      topRated: `${getBaseUrl()}/restaurants/top-rated`,
      featured: `${getBaseUrl()}/restaurants/featured`
    },
    deviceInfo: {
      deviceId: getDeviceId(),
      hasLocalStorage: typeof localStorage !== 'undefined',
      localRatingsCount: getLocalRatings().length
    }
  };
}

/**
 * Obtiene los comentarios de un restaurante específico
 */
export async function fetchRestaurantComments(
  restaurantId: string,
  page: number = 1,
  limit: number = 20,
  includeAnonymous: boolean = true
): Promise<RestaurantCommentsResponse> {
  const baseUrl = getBaseUrl();
  const url = `${baseUrl}/restaurants/${restaurantId}/comments?page=${page}&limit=${limit}&include_anonymous=${includeAnonymous}`;
  
  console.log('💬 Fetching restaurant comments:', { restaurantId, page, limit, includeAnonymous });
  
  try {
    const response = await fetchWithStandardConfig(url, {
      timeout: 10000,
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Error response:', {
        status: response.status,
        statusText: response.statusText,
        url,
        errorBody: errorText
      });
      throw new Error(`Error fetching restaurant comments: ${response.status} ${errorText}`);
    }
    
    const data = await response.json();
    
    if (!data || !Array.isArray(data.comments)) {
      console.error('❌ Invalid comments data structure:', data);
      throw new Error('Invalid comments data format');
    }
    
    console.log('✅ Successfully fetched restaurant comments:', data.comments.length);
    return data;
    
  } catch (error) {
    console.error('❌ Error fetching restaurant comments:', error);
    throw error;
  }
}

/**
 * Crea un comentario para un restaurante (usuario autenticado)
 */
export async function createRestaurantComment(
  restaurantId: string,
  commentData: RestaurantCommentCreate,
  token: string
): Promise<RestaurantComment> {
  const baseUrl = getBaseUrl();
  const url = `${baseUrl}/restaurants/${restaurantId}/comments`;
  
  console.log('💬 Creating restaurant comment:', { restaurantId, hasRating: !!commentData.rating });
  
  try {
    const response = await fetchWithStandardConfig(url, {
      method: 'POST',
      headers: getAuthHeaders(token),
      body: JSON.stringify(commentData),
      timeout: 8000,
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Error creating comment:', {
        status: response.status,
        statusText: response.statusText,
        errorBody: errorText
      });
      throw new Error(`Error creating comment: ${response.status} ${errorText}`);
    }
    
    const data = await response.json();
    console.log('✅ Successfully created restaurant comment');
    return data;
    
  } catch (error) {
    console.error('❌ Error creating restaurant comment:', error);
    throw error;
  }
}

/**
 * Crea un comentario anónimo para un restaurante
 */
export async function createAnonymousRestaurantComment(
  restaurantId: string,
  commentData: RestaurantCommentCreate,
  deviceId: string
): Promise<RestaurantComment> {
  const baseUrl = getBaseUrl();
  const url = `${baseUrl}/anonymous/restaurants/${restaurantId}/comments`;
  
  console.log('💬 Creating anonymous restaurant comment:', { restaurantId, hasRating: !!commentData.rating, deviceId });
  
  try {
    // Validación adicional para Svelte
    if (!restaurantId || !deviceId) {
      throw new Error('Restaurant ID and Device ID are required');
    }
    
    if (!commentData.comment || commentData.comment.trim().length < 3) {
      throw new Error('Comment must be at least 3 characters long');
    }
    
    if (commentData.rating !== undefined && (commentData.rating < 1 || commentData.rating > 5)) {
      throw new Error('Rating must be between 1 and 5');
    }

    const response = await fetchWithStandardConfig(url, {
      method: 'POST',
      headers: getAnonymousHeaders(deviceId),
      body: JSON.stringify(commentData),
      timeout: 8000,
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Error creating anonymous comment:', {
        status: response.status,
        statusText: response.statusText,
        errorBody: errorText
      });
      
      // Manejo específico de errores para mejor UX
      if (response.status === 429) {
        throw new Error('Has alcanzado el límite de comentarios. Inténtalo más tarde.');
      } else if (response.status === 400) {
        throw new Error('Datos de comentario inválidos.');
      }
      
      throw new Error(`Error creating anonymous comment: ${response.status} ${errorText}`);
    }
    
    const data = await response.json();
    console.log('✅ Successfully created anonymous restaurant comment');
    return data;
    
  } catch (error) {
    console.error('❌ Error creating anonymous restaurant comment:', error);
    throw error;
  }
}
/**
 * ==========================================
 * FAVORITOS DE RESTAURANTES - USUARIOS AUTENTICADOS
 * ==========================================
 */

/**
 * Obtiene todos los restaurantes favoritos del usuario actual
 */
export async function fetchUserRestaurantFavorites(
  token: string,
  page: number = 1,
  limit: number = 20
): Promise<UserRestaurantFavoritesResponse> {
  const baseUrl = getBaseUrl();
  const url = `${baseUrl}/restaurant-favorites/?page=${page}&limit=${limit}`;
  
  console.log('❤️ Fetching user restaurant favorites:', { page, limit });
  
  try {
    const response = await fetchWithStandardConfig(url, {
      headers: getAuthHeaders(token),
      timeout: 10000,
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Error fetching user favorites:', {
        status: response.status,
        statusText: response.statusText,
        errorBody: errorText
      });
      throw new Error(`Error fetching user favorites: ${response.status} ${errorText}`);
    }
    
    const data = await response.json();
    
    if (!data || !Array.isArray(data.restaurants)) {
      console.error('❌ Invalid favorites data structure:', data);
      throw new Error('Invalid favorites data format');
    }
    
    console.log('✅ Successfully fetched user restaurant favorites:', data.restaurants.length);
    return data;
    
  } catch (error) {
    console.error('❌ Error fetching user restaurant favorites:', error);
    throw error;
  }
}

/**
 * Alterna el estado de favorito de un restaurante (toggle)
 */
export async function toggleRestaurantFavorite(
  restaurantId: string,
  token: string
): Promise<RestaurantFavoriteResponse> {
  const baseUrl = getBaseUrl();
  const url = `${baseUrl}/restaurants/${restaurantId}/favorite`;
  
  console.log('❤️ Toggling restaurant favorite:', { restaurantId });
  
  try {
    const response = await fetchWithStandardConfig(url, {
      method: 'POST',
      headers: getAuthHeaders(token),
      timeout: 8000,
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Error toggling favorite:', {
        status: response.status,
        statusText: response.statusText,
        errorBody: errorText
      });
      throw new Error(`Error toggling favorite: ${response.status} ${errorText}`);
    }
    
    const data = await response.json();
    console.log('✅ Successfully toggled restaurant favorite:', data.action);
    return data;
    
  } catch (error) {
    console.error('❌ Error toggling restaurant favorite:', error);
    throw error;
  }
}

/**
 * Añade un restaurante a favoritos
 */
export async function addRestaurantToFavorites(
  restaurantId: string,
  token: string
): Promise<RestaurantFavoriteResponse> {
  const baseUrl = getBaseUrl();
  const url = `${baseUrl}/restaurant-favorites/restaurant/${restaurantId}`;
  
  console.log('➕ Adding restaurant to favorites:', { restaurantId });
  
  try {
    const response = await fetchWithStandardConfig(url, {
      method: 'POST',
      headers: getAuthHeaders(token),
      timeout: 8000,
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Error adding to favorites:', {
        status: response.status,
        statusText: response.statusText,
        errorBody: errorText
      });
      throw new Error(`Error adding to favorites: ${response.status} ${errorText}`);
    }
    
    const data = await response.json();
    console.log('✅ Successfully added restaurant to favorites');
    return data;
    
  } catch (error) {
    console.error('❌ Error adding restaurant to favorites:', error);
    throw error;
  }
}

/**
 * Quita un restaurante de favoritos
 */
export async function removeRestaurantFromFavorites(
  restaurantId: string,
  token: string
): Promise<RestaurantFavoriteResponse> {
  const baseUrl = getBaseUrl();
  const url = `${baseUrl}/restaurant-favorites/restaurant/${restaurantId}`;
  
  console.log('➖ Removing restaurant from favorites:', { restaurantId });
  
  try {
    const response = await fetchWithStandardConfig(url, {
      method: 'DELETE',
      headers: getAuthHeaders(token),
      timeout: 8000,
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Error removing from favorites:', {
        status: response.status,
        statusText: response.statusText,
        errorBody: errorText
      });
      throw new Error(`Error removing from favorites: ${response.status} ${errorText}`);
    }
    
    const data = await response.json();
    console.log('✅ Successfully removed restaurant from favorites');
    return data;
    
  } catch (error) {
    console.error('❌ Error removing restaurant from favorites:', error);
    throw error;
  }
}

/**
 * Verifica si un restaurante está en favoritos del usuario
 */
export async function checkRestaurantFavoriteStatus(
  restaurantId: string,
  token: string
): Promise<RestaurantFavoriteStatusResponse> {
  const baseUrl = getBaseUrl();
  const url = `${baseUrl}/restaurants/${restaurantId}/favorite-status`;
  
  console.log('🔍 Checking restaurant favorite status:', { restaurantId });
  
  try {
    const response = await fetchWithStandardConfig(url, {
      headers: getAuthHeaders(token),
      timeout: 5000,
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Error checking favorite status:', {
        status: response.status,
        statusText: response.statusText,
        errorBody: errorText
      });
      throw new Error(`Error checking favorite status: ${response.status} ${errorText}`);
    }
    
    const data = await response.json();
    console.log('✅ Successfully checked restaurant favorite status:', data.isFavorite);
    return data;
    
  } catch (error) {
    console.error('❌ Error checking restaurant favorite status:', error);
    throw error;
  }
}

/**
 * Obtiene el contador de favoritos del usuario
 */
export async function getUserFavoritesCount(token: string): Promise<{ userId: string; totalFavoriteRestaurants: number }> {
  const baseUrl = getBaseUrl();
  const url = `${baseUrl}/restaurant-favorites/count`;
  
  console.log('📊 Getting user favorites count');
  
  try {
    const response = await fetchWithStandardConfig(url, {
      headers: getAuthHeaders(token),
      timeout: 5000,
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Error getting favorites count:', {
        status: response.status,
        statusText: response.statusText,
        errorBody: errorText
      });
      throw new Error(`Error getting favorites count: ${response.status} ${errorText}`);
    }
    
    const data = await response.json();
    console.log('✅ Successfully got user favorites count:', data.totalFavoriteRestaurants);
    return data;
    
  } catch (error) {
    console.error('❌ Error getting user favorites count:', error);
    throw error;
  }
}

/**
 * ==========================================
 * FAVORITOS DE RESTAURANTES - USUARIOS ANÓNIMOS
 * ==========================================
 */

/**
 * Obtiene todos los restaurantes favoritos de un usuario anónimo
 */
export async function fetchAnonymousRestaurantFavorites(
  deviceId: string,
  page: number = 1,
  limit: number = 20
): Promise<AnonymousRestaurantFavoritesResponse> {
  const baseUrl = getBaseUrl();
  const url = `${baseUrl}/restaurant-favorites/anonymous?page=${page}&limit=${limit}`;
  
  console.log('❤️ Fetching anonymous restaurant favorites:', { deviceId, page, limit });
  
  try {
    const response = await fetchWithStandardConfig(url, {
      headers: getAnonymousHeaders(deviceId),
      timeout: 10000,
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Error fetching anonymous favorites:', {
        status: response.status,
        statusText: response.statusText,
        errorBody: errorText
      });
      throw new Error(`Error fetching anonymous favorites: ${response.status} ${errorText}`);
    }
    
    const data = await response.json();
    
    if (!data || !Array.isArray(data.restaurants)) {
      console.error('❌ Invalid anonymous favorites data structure:', data);
      throw new Error('Invalid anonymous favorites data format');
    }
    
    console.log('✅ Successfully fetched anonymous restaurant favorites:', data.restaurants.length);
    return data;
    
  } catch (error) {
    console.error('❌ Error fetching anonymous restaurant favorites:', error);
    throw error;
  }
}

/**
 * Alterna el estado de favorito de un restaurante para usuario anónimo
 */
export async function toggleAnonymousRestaurantFavorite(
  restaurantId: string,
  deviceId: string,
  action: 'add' | 'remove' | 'toggle' = 'toggle'
): Promise<RestaurantFavoriteResponse> {
  const baseUrl = getBaseUrl();
  const url = `${baseUrl}/restaurants/${restaurantId}/favorite-anonymous?action=${action}`;
  
  console.log('❤️ Toggling anonymous restaurant favorite:', { restaurantId, deviceId, action });
  
  try {
    // Validación adicional
    if (!restaurantId || !deviceId) {
      throw new Error('Restaurant ID and Device ID are required');
    }

    const response = await fetchWithStandardConfig(url, {
      method: 'POST',
      headers: getAnonymousHeaders(deviceId),
      timeout: 8000,
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Error toggling anonymous favorite:', {
        status: response.status,
        statusText: response.statusText,
        errorBody: errorText
      });
      throw new Error(`Error toggling anonymous favorite: ${response.status} ${errorText}`);
    }
    
    const data = await response.json();
    
    // Guardar localmente para tracking
    if (data.action === 'added') {
      saveLocalRestaurantFavorite({
        restaurantId,
        deviceId,
        timestamp: new Date().toISOString()
      });
    } else if (data.action === 'removed') {
      removeLocalRestaurantFavorite(restaurantId, deviceId);
    }
    
    console.log('✅ Successfully toggled anonymous restaurant favorite:', data.action);
    return data;
    
  } catch (error) {
    console.error('❌ Error toggling anonymous restaurant favorite:', error);
    throw error;
  }
}

/**
 * Verifica si un restaurante está en favoritos anónimos
 */
export async function checkAnonymousRestaurantFavoriteStatus(
  restaurantId: string,
  deviceId: string
): Promise<RestaurantFavoriteStatusResponse> {
  const baseUrl = getBaseUrl();
  const url = `${baseUrl}/restaurants/${restaurantId}/favorite-status-anonymous`;
  
  console.log('🔍 Checking anonymous restaurant favorite status:', { restaurantId, deviceId });
  
  try {
    const response = await fetchWithStandardConfig(url, {
      headers: getAnonymousHeaders(deviceId),
      timeout: 5000,
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Error checking anonymous favorite status:', {
        status: response.status,
        statusText: response.statusText,
        errorBody: errorText
      });
      throw new Error(`Error checking anonymous favorite status: ${response.status} ${errorText}`);
    }
    
    const data = await response.json();
    console.log('✅ Successfully checked anonymous restaurant favorite status:', data.isFavorite);
    return data;
    
  } catch (error) {
    console.error('❌ Error checking anonymous restaurant favorite status:', error);
    throw error;
  }
}

/**
 * Obtiene favoritos combinados (platillos + restaurantes) para usuario anónimo
 */
export async function fetchCombinedAnonymousFavorites(
  deviceId: string,
  limitDishes: number = 10,
  limitRestaurants: number = 10
): Promise<CombinedFavoritesResponse> {
  const baseUrl = getBaseUrl();
  const url = `${baseUrl}/anonymous/favorites/combined?limit_dishes=${limitDishes}&limit_restaurants=${limitRestaurants}`;
  
  console.log('🔗 Fetching combined anonymous favorites:', { deviceId, limitDishes, limitRestaurants });
  
  try {
    const response = await fetchWithStandardConfig(url, {
      headers: getAnonymousHeaders(deviceId),
      timeout: 10000,
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Error fetching combined favorites:', {
        status: response.status,
        statusText: response.statusText,
        errorBody: errorText
      });
      throw new Error(`Error fetching combined favorites: ${response.status} ${errorText}`);
    }
    
    const data = await response.json();
    
    if (!data || !Array.isArray(data.dishes) || !Array.isArray(data.restaurants)) {
      console.error('❌ Invalid combined favorites data structure:', data);
      throw new Error('Invalid combined favorites data format');
    }
    
    console.log('✅ Successfully fetched combined anonymous favorites:', data.counts);
    return data;
    
  } catch (error) {
    console.error('❌ Error fetching combined anonymous favorites:', error);
    throw error;
  }
}

/**
 * ==========================================
 * ENDPOINTS PÚBLICOS Y ESTADÍSTICAS
 * ==========================================
 */

/**
 * Obtiene los restaurantes más populares por número de favoritos
 */
export async function fetchPopularRestaurantsByFavorites(
  limit: number = 10
): Promise<PopularRestaurantsResponse> {
  const baseUrl = getBaseUrl();
  const url = `${baseUrl}/restaurants/popular/by-favorites?limit=${limit}`;
  
  console.log('🏆 Fetching popular restaurants by favorites:', { limit });
  
  try {
    const response = await fetchWithStandardConfig(url, {
      timeout: 10000,
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Error fetching popular restaurants:', {
        status: response.status,
        statusText: response.statusText,
        errorBody: errorText
      });
      throw new Error(`Error fetching popular restaurants: ${response.status} ${errorText}`);
    }
    
    const data = await response.json();
    
    if (!data || !Array.isArray(data.popular_restaurants)) {
      console.error('❌ Invalid popular restaurants data structure:', data);
      throw new Error('Invalid popular restaurants data format');
    }
    
    console.log('✅ Successfully fetched popular restaurants by favorites:', data.popular_restaurants.length);
    return data;
    
  } catch (error) {
    console.error('❌ Error fetching popular restaurants by favorites:', error);
    throw error;
  }
}

/**
 * Obtiene estadísticas generales del sistema de favoritos
 */
export async function fetchRestaurantFavoritesStats(): Promise<FavoritesStatsResponse> {
  const baseUrl = getBaseUrl();
  const url = `${baseUrl}/restaurant-favorites/stats`;
  
  console.log('📊 Fetching restaurant favorites stats');
  
  try {
    const response = await fetchWithStandardConfig(url, {
      timeout: 8000,
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Error fetching favorites stats:', {
        status: response.status,
        statusText: response.statusText,
        errorBody: errorText
      });
      throw new Error(`Error fetching favorites stats: ${response.status} ${errorText}`);
    }
    
    const data = await response.json();
    console.log('✅ Successfully fetched restaurant favorites stats');
    return data;
    
  } catch (error) {
    console.error('❌ Error fetching restaurant favorites stats:', error);
    throw error;
  }
}

/**
 * Obtiene el contador total de favoritos de un restaurante
 */
export async function fetchRestaurantFavoritesCount(
  restaurantId: string
): Promise<{ restaurantId: string; restaurantName: string; favoritesCount: number; analytics: any }> {
  const baseUrl = getBaseUrl();
  const url = `${baseUrl}/restaurants/${restaurantId}/favorites-count`;
  
  console.log('📊 Fetching restaurant favorites count:', { restaurantId });
  
  try {
    const response = await fetchWithStandardConfig(url, {
      timeout: 5000,
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Error fetching favorites count:', {
        status: response.status,
        statusText: response.statusText,
        errorBody: errorText
      });
      throw new Error(`Error fetching favorites count: ${response.status} ${errorText}`);
    }
    
    const data = await response.json();
    console.log('✅ Successfully fetched restaurant favorites count:', data.favoritesCount);
    return data;
    
  } catch (error) {
    console.error('❌ Error fetching restaurant favorites count:', error);
    throw error;
  }
}

/**
 * ==========================================
 * FUNCIONES HELPER PARA LOCAL STORAGE
 * ==========================================
 */

/**
 * Interface para favoritos locales de restaurantes
 */
interface LocalRestaurantFavorite {
  restaurantId: string;
  deviceId: string;
  timestamp: string;
}

/**
 * Obtiene los favoritos de restaurantes guardados localmente
 */
export function getLocalRestaurantFavorites(): LocalRestaurantFavorite[] {
  if (typeof window === 'undefined') return [];
  
  try {
    const stored = localStorage.getItem('local_restaurant_favorites');
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.warn('⚠️ Error reading local restaurant favorites:', error);
    return [];
  }
}

/**
 * Guarda un favorito de restaurante localmente
 */
export function saveLocalRestaurantFavorite(favorite: LocalRestaurantFavorite): void {
  if (typeof window === 'undefined') return;
  
  try {
    const localFavorites = getLocalRestaurantFavorites();
    
    // Remover favorito anterior del mismo restaurante y dispositivo
    const filteredFavorites = localFavorites.filter(f => 
      !(f.restaurantId === favorite.restaurantId && f.deviceId === favorite.deviceId)
    );
    
    filteredFavorites.push(favorite);
    
    // Mantener solo los últimos 100 favoritos
    const recentFavorites = filteredFavorites.slice(-100);
    
    localStorage.setItem('local_restaurant_favorites', JSON.stringify(recentFavorites));
    console.log('💾 Saved local restaurant favorite');
  } catch (error) {
    console.warn('⚠️ Error saving local restaurant favorite:', error);
  }
}

/**
 * Remueve un favorito de restaurante localmente
 */
export function removeLocalRestaurantFavorite(restaurantId: string, deviceId: string): void {
  if (typeof window === 'undefined') return;
  
  try {
    const localFavorites = getLocalRestaurantFavorites();
    const filteredFavorites = localFavorites.filter(f => 
      !(f.restaurantId === restaurantId && f.deviceId === deviceId)
    );
    
    localStorage.setItem('local_restaurant_favorites', JSON.stringify(filteredFavorites));
    console.log('💾 Removed local restaurant favorite');
  } catch (error) {
    console.warn('⚠️ Error removing local restaurant favorite:', error);
  }
}

/**
 * Verifica si un restaurante está en favoritos localmente
 */
export function hasRestaurantFavoriteLocally(restaurantId: string, deviceId: string): boolean {
  const localFavorites = getLocalRestaurantFavorites();
  return localFavorites.some(favorite => 
    favorite.restaurantId === restaurantId && favorite.deviceId === deviceId
  );
}

/**
 * Obtiene todos los favoritos locales combinados (platillos + restaurantes)
 */
export function getAllLocalFavorites(deviceId: string) {
  return {
    dishes: getLocalRatings().filter(r => r.deviceId === deviceId), // Reutilizar función existente
    restaurants: getLocalRestaurantFavorites().filter(f => f.deviceId === deviceId),
    deviceId,
    timestamp: new Date().toISOString()
  };
}

/**
 * Limpia todos los favoritos locales de restaurantes
 */
export function clearLocalRestaurantFavorites(): void {
  if (typeof window === 'undefined') return;
  
  try {
    localStorage.removeItem('local_restaurant_favorites');
    console.log('🧹 Local restaurant favorites cleared');
  } catch (error) {
    console.warn('⚠️ Error clearing local restaurant favorites:', error);
  }
}

/**
 * ==========================================
 * FUNCIONES HELPER MEJORADAS
 * ==========================================
 */

/**
 * Función helper para obtener un restaurante con su estado de favorito
 */
export async function fetchRestaurantWithFavoriteStatus(
  restaurantId: string,
  token?: string,
  deviceId?: string
): Promise<Restaurant & { userFav: boolean; favoritesCount: number }> {
  console.log('🔍 Fetching restaurant with favorite status:', { restaurantId, hasToken: !!token, hasDeviceId: !!deviceId });
  
  try {
    // Obtener restaurante y estado de favorito en paralelo
    const [restaurantResult, statusResult, countResult] = await Promise.allSettled([
      fetchRestaurantByUsername ? fetchRestaurantByUsername(restaurantId) : Promise.reject('fetchRestaurantByUsername not available'),
      token 
        ? checkRestaurantFavoriteStatus(restaurantId, token)
        : deviceId 
          ? checkAnonymousRestaurantFavoriteStatus(restaurantId, deviceId)
          : Promise.resolve({ isFavorite: false }),
      fetchRestaurantFavoritesCount(restaurantId)
    ]);
    
    if (restaurantResult.status === 'rejected') {
      throw new Error(`Restaurant not found: ${restaurantResult.reason}`);
    }
    
    const restaurant = restaurantResult.value;
    const favoriteStatus = statusResult.status === 'fulfilled' ? statusResult.value : { isFavorite: false };
    const favoriteCount = countResult.status === 'fulfilled' ? countResult.value : { favoritesCount: 0 };
    
    return {
      ...restaurant,
      userFav: favoriteStatus.isFavorite,
      favoritesCount: favoriteCount.favoritesCount
    };
    
  } catch (error) {
    console.error('❌ Error fetching restaurant with favorite status:', error);
    throw error;
  }
}

/**
 * Función helper para verificar múltiples restaurantes favoritos de una vez
 */
export async function checkMultipleRestaurantFavorites(
  restaurantIds: string[],
  token?: string,
  deviceId?: string
): Promise<Record<string, boolean>> {
  console.log('🔍 Checking multiple restaurant favorites:', { count: restaurantIds.length });
  
  if (!token && !deviceId) {
    // Sin autenticación, devolver todos como false
    return restaurantIds.reduce((acc, id) => {
      acc[id] = false;
      return acc;
    }, {} as Record<string, boolean>);
  }
  
  try {
    // Si hay muchos restaurantes, verificar localmente primero
    if (restaurantIds.length > 10 && deviceId) {
      const localResults: Record<string, boolean> = {};
      restaurantIds.forEach(id => {
        localResults[id] = hasRestaurantFavoriteLocally(id, deviceId);
      });
      return localResults;
    }
    
    // Para pocos restaurantes, hacer llamadas individuales
    const promises = restaurantIds.map(id => 
      token 
        ? checkRestaurantFavoriteStatus(id, token).catch(() => ({ isFavorite: false }))
        : deviceId
          ? checkAnonymousRestaurantFavoriteStatus(id, deviceId).catch(() => ({ isFavorite: false }))
          : Promise.resolve({ isFavorite: false })
    );
    
    const results = await Promise.all(promises);
    
    return restaurantIds.reduce((acc, id, index) => {
      acc[id] = results[index].isFavorite;
      return acc;
    }, {} as Record<string, boolean>);
    
  } catch (error) {
    console.error('❌ Error checking multiple restaurant favorites:', error);
    // En caso de error, devolver todos como false
    return restaurantIds.reduce((acc, id) => {
      acc[id] = false;
      return acc;
    }, {} as Record<string, boolean>);
  }
}

/**
 * Función para sincronizar favoritos locales con el servidor (para cuando el usuario se autentica)
 */
export async function syncLocalRestaurantFavoritesToServer(
  token: string,
  deviceId: string
): Promise<{ synced: number; errors: number }> {
  console.log('🔄 Syncing local restaurant favorites to server');
  
  try {
    const localFavorites = getLocalRestaurantFavorites().filter(f => f.deviceId === deviceId);
    
    if (localFavorites.length === 0) {
      console.log('📭 No local favorites to sync');
      return { synced: 0, errors: 0 };
    }
    
    let syncedCount = 0;
    let errorCount = 0;
    
    // Sincronizar cada favorito
    for (const favorite of localFavorites) {
      try {
        await addRestaurantToFavorites(favorite.restaurantId, token);
        syncedCount++;
      } catch (error) {
        console.warn(`⚠️ Error syncing favorite ${favorite.restaurantId}:`, error);
        errorCount++;
      }
    }
    
    // Limpiar favoritos locales después de sincronizar
    if (syncedCount > 0) {
      clearLocalRestaurantFavorites();
    }
    
    console.log(`✅ Sync completed: ${syncedCount} synced, ${errorCount} errors`);
    return { synced: syncedCount, errors: errorCount };
    
  } catch (error) {
    console.error('❌ Error syncing local favorites to server:', error);
    return { synced: 0, errors: 1 };
  }
}


