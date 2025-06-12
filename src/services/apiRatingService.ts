import type { 
  RestaurantRating, 
  RestaurantRatingCreate, 
  RestaurantRatingUpdate,
  RestaurantRatingStats,
  RestaurantRatingsResponse,
  RestaurantSearchFilters,
  RestaurantSearchResponse,
  RestaurantRanking,
  FeaturedRestaurantsResponse 
} from '../interfaces/restaurantRating';
import { debugApiConfiguration, fetchRestaurantByUsername } from './apiService';


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
  
  console.log('🏆 Fetching top rated restaurants:', { limit, minReviews });
  
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
    
    console.log('✅ Successfully fetched top rated restaurants:', data.length);
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
export function debugRestaurantRatingsApi() {
  return {
    ...debugApiConfiguration(),
    features: {
      restaurantRatings: true,
      anonymousRatings: true,
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

