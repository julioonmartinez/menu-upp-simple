// src/services/apiDishService.ts
import type { 
  DishRating, 
  DishRatingCreate, 
  DishRatingUpdate,
  DishRatingStats,
  DishCommentsResponse,
  DishSearchFilters,
  DishSearchResponse,
  DishRanking,
  TopRatedDishesResponse,
  MostCommentedDishesResponse,
  DishComment,
  DishCommentCreate,
  DishWithRatings
} from '../interfaces/dishRating';
import { debugApiConfiguration } from './apiService';

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

// CONFIGURACIÓN ESTÁNDAR DE HEADERS
const getStandardHeaders = () => ({
  'Content-Type': 'application/json',
  'Accept': 'application/json',
  'X-Requested-With': 'XMLHttpRequest',
});

// Headers con autenticación
const getAuthHeaders = (token?: string) => ({
  ...getStandardHeaders(),
  ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
});

// Headers anónimos
const getAnonymousHeaders = (deviceId?: string) => ({
  ...getStandardHeaders(),
  ...(deviceId ? { 'X-Device-Id': deviceId } : {}),
});

// Función helper para fetch con configuración estándar
async function fetchWithStandardConfig(url: string, options: RequestInit & { timeout?: number } = {}) {
  const { timeout = 10000, ...fetchOptions } = options;
  
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);
  
  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: getStandardHeaders(),
      mode: 'cors',
      credentials: 'omit',
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
 * Obtiene las valoraciones de un platillo específico
 */
export async function fetchDishRatings(
  dishId: string,
  page: number = 1,
  limit: number = 10,
  includeAnonymous: boolean = true
): Promise<DishCommentsResponse> {
  const baseUrl = getBaseUrl();
  const url = `${baseUrl}/dishes/${dishId}/comments?page=${page}&limit=${limit}&include_anonymous=${includeAnonymous}`;
  
  console.log('🔍 Fetching dish comments:', { dishId, page, limit, includeAnonymous });
  
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
      throw new Error(`Error fetching dish comments: ${response.status} ${errorText}`);
    }
    
    const data = await response.json();
    
    if (!data || !Array.isArray(data.comments)) {
      console.error('❌ Invalid comments data structure:', data);
      throw new Error('Invalid comments data format');
    }
    
    console.log('✅ Successfully fetched dish comments:', data.comments.length);
    return data;
    
  } catch (error) {
    console.error('❌ Error fetching dish comments:', error);
    throw error;
  }
}

/**
 * Crea una valoración para un platillo (usuario autenticado)
 */
export async function createDishRating(
  dishId: string,
  ratingData: DishRatingCreate,
  token: string
): Promise<DishRating> {
  const baseUrl = getBaseUrl();
  const url = `${baseUrl}/dishes/${dishId}/rate`;
  
  console.log('⭐ Creating dish rating:', { dishId, rating: ratingData.rating });
  
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
    console.log('✅ Successfully created dish rating');
    return data;
    
  } catch (error) {
    console.error('❌ Error creating dish rating:', error);
    throw error;
  }
}

/**
 * Crea una valoración anónima para un platillo
 */
export async function createAnonymousDishRating(
  dishId: string,
  ratingData: DishRatingCreate,
  deviceId: string
): Promise<DishRating> {
  const baseUrl = getBaseUrl();
  const url = `${baseUrl}/anonymous/ratings/dish/${dishId}`;
  
  console.log('⭐ Creating anonymous dish rating:', { dishId, rating: ratingData.rating, deviceId });
  
  try {
    if (!dishId || !deviceId) {
      throw new Error('Dish ID and Device ID are required');
    }
    
    if (ratingData.rating < 1 || ratingData.rating > 5) {
      throw new Error('Rating must be between 1 and 5');
    }

    const response = await fetchWithStandardConfig(url, {
      method: 'POST',
      headers: getAnonymousHeaders(deviceId),
      body: JSON.stringify({
        ...ratingData,
        anonymous: true
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
      
      if (response.status === 429) {
        throw new Error('Has alcanzado el límite de valoraciones. Inténtalo más tarde.');
      } else if (response.status === 409) {
        throw new Error('Ya has valorado este platillo desde este dispositivo.');
      } else if (response.status === 400) {
        throw new Error('Datos de valoración inválidos.');
      }
      
      throw new Error(`Error creating anonymous rating: ${response.status} ${errorText}`);
    }
    
    const data = await response.json();
    console.log('✅ Successfully created anonymous dish rating');
    return data;
    
  } catch (error) {
    console.error('❌ Error creating anonymous dish rating:', error);
    throw error;
  }
}

/**
 * Crea un comentario anónimo para un platillo
 */
export async function createAnonymousDishComment(
  dishId: string,
  commentData: DishCommentCreate,
  deviceId: string
): Promise<DishComment> {
  const baseUrl = getBaseUrl();
  const url = `${baseUrl}/anonymous/dishes/${dishId}/comments`;
  
  console.log('💬 Creating anonymous dish comment:', { dishId, deviceId });
  
  try {
    if (!dishId || !deviceId) {
      throw new Error('Dish ID and Device ID are required');
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
      
      if (response.status === 429) {
        throw new Error('Has alcanzado el límite de comentarios. Inténtalo más tarde.');
      } else if (response.status === 400) {
        throw new Error('Datos de comentario inválidos.');
      }
      
      throw new Error(`Error creating anonymous comment: ${response.status} ${errorText}`);
    }
    
    const data = await response.json();
    console.log('✅ Successfully created anonymous dish comment');
    return data;
    
  } catch (error) {
    console.error('❌ Error creating anonymous dish comment:', error);
    throw error;
  }
}

/**
 * Obtiene estadísticas detalladas de valoraciones de un platillo
 */
export async function fetchDishRatingStats(dishId: string): Promise<DishRatingStats> {
  const baseUrl = getBaseUrl();
  const url = `${baseUrl}/dishes/${dishId}/stats`;
  
  console.log('📈 Fetching dish rating stats:', { dishId });
  
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
    console.log('✅ Successfully fetched dish rating stats');
    return data;
    
  } catch (error) {
    console.error('❌ Error fetching dish rating stats:', error);
    throw error;
  }
}

/**
 * Búsqueda avanzada de platillos con filtros
 */
export async function searchDishes(
  filters: DishSearchFilters,
  page: number = 1,
  limit: number = 20
): Promise<DishSearchResponse> {
  const baseUrl = getBaseUrl();
  const url = `${baseUrl}/dishes/search-advanced?page=${page}&limit=${limit}`;
  
  console.log('🔍 Searching dishes with filters:', { filters, page, limit });
  console.log('📍 Search URL:', url);
  console.log('📦 Request body:', JSON.stringify(filters, null, 2));
  
  try {
    const response = await fetchWithStandardConfig(url, {
      method: 'POST',
      headers: getStandardHeaders(),
      body: JSON.stringify(filters),
      timeout: 12000,
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Error searching dishes:', {
        status: response.status,
        statusText: response.statusText,
        url,
        requestBody: filters,
        errorBody: errorText
      });
      throw new Error(`Error searching dishes: ${response.status} ${errorText}`);
    }
    
    const data = await response.json();
    
    if (!data || !Array.isArray(data.dishes)) {
      console.error('❌ Invalid search results data structure:', data);
      throw new Error('Invalid search results data format');
    }
    
    console.log('✅ Successfully searched dishes:', data.dishes.length);
    return data;
    
  } catch (error) {
    console.error('❌ Error searching dishes:', error);
    throw error;
  }
}

/**
 * Obtiene el ranking de platillos mejor valorados
 */
export async function fetchTopRatedDishes(
  limit: number = 10,
  minRatings: number = 3,
  restaurantId?: string,
  categoryId?: string
): Promise<DishRanking[]> {
  const baseUrl = getBaseUrl();
  
  // Construir URL con validación de parámetros
  const params = new URLSearchParams();
  
  // Validar y agregar parámetros
  if (limit < 1 || limit > 50) {
    console.warn('⚠️ Limit fuera de rango, usando valor por defecto');
    limit = 10;
  }
  params.set('limit', limit.toString());
  
  if (minRatings < 1) {
    console.warn('⚠️ MinRatings debe ser mayor a 0, usando valor por defecto');
    minRatings = 3;
  }
  params.set('min_ratings', minRatings.toString()); // ⚠️ CORRECCIÓN: usar min_ratings en lugar de minRatings
  
  if (restaurantId && restaurantId.trim()) {
    params.set('restaurant_id', restaurantId.trim());
  }
  
  if (categoryId && categoryId.trim()) {
    params.set('category_id', categoryId.trim());
  }
  
  const url = `${baseUrl}/dishes/top-rated?${params.toString()}`;
  
  console.log('🏆 Fetching top rated dishes:', { 
    limit, 
    minRatings, 
    restaurantId, 
    categoryId,
    finalUrl: url 
  });
  
  try {
    const response = await fetchWithStandardConfig(url, {
      method: 'GET',
      timeout: 10000,
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Error fetching top rated dishes:', {
        status: response.status,
        statusText: response.statusText,
        url,
        errorBody: errorText,
        requestParams: { limit, minRatings, restaurantId, categoryId }
      });
      
      // Mensajes de error más específicos
      if (response.status === 400) {
        throw new Error(`Parámetros inválidos: ${errorText}`);
      } else if (response.status === 500) {
        throw new Error(`Error del servidor: ${errorText}`);
      } else {
        throw new Error(`Error fetching top rated dishes: ${response.status} ${errorText}`);
      }
    }
    
    const data = await response.json();
    
    if (!Array.isArray(data)) {
      console.error('❌ Invalid top rated dishes data structure:', data);
      console.error('❌ Expected array, got:', typeof data);
      throw new Error('Invalid top rated dishes data format - expected array');
    }
    
    // Validar estructura de datos
    const validatedData = data.filter(item => {
      const isValid = item && 
        typeof item === 'object' && 
        item.id && 
        item.name && 
        typeof item.rating === 'number';
      
      if (!isValid) {
        console.warn('⚠️ Invalid dish item filtered out:', item);
      }
      
      return isValid;
    });
    
    console.log('✅ Successfully fetched top rated dishes:', {
      totalReceived: data.length,
      validItems: validatedData.length,
      filtered: data.length - validatedData.length
    });
    
    return validatedData;
    
  } catch (error) {
    console.error('❌ Error fetching top rated dishes:', error);
    
    // Re-throw con contexto adicional
    if (error instanceof Error) {
      throw new Error(`Error cargando platillos mejor valorados: ${error.message}`);
    } else {
      throw new Error('Error desconocido cargando platillos mejor valorados');
    }
  }
}

/**
 * Obtiene los platillos más comentados
 */
export async function fetchMostCommentedDishes(
  limit: number = 10,
  minComments: number = 2,
  restaurantId?: string
): Promise<DishRanking[]> {
  const baseUrl = getBaseUrl();
  let url = `${baseUrl}/dishes/most-commented?limit=${limit}&min_comments=${minComments}`;
  
  if (restaurantId) url += `&restaurant_id=${restaurantId}`;
  
  console.log('💬 Fetching most commented dishes:', { limit, minComments, restaurantId });
  
  try {
    const response = await fetchWithStandardConfig(url, {
      timeout: 10000,
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Error fetching most commented dishes:', {
        status: response.status,
        statusText: response.statusText,
        errorBody: errorText
      });
      throw new Error(`Error fetching most commented dishes: ${response.status} ${errorText}`);
    }
    
    const data = await response.json();
    
    if (!Array.isArray(data)) {
      console.error('❌ Invalid most commented dishes data structure:', data);
      throw new Error('Invalid most commented dishes data format');
    }
    
    console.log('✅ Successfully fetched most commented dishes:', data.length);
    return data;
    
  } catch (error) {
    console.error('❌ Error fetching most commented dishes:', error);
    throw error;
  }
}

/**
 * Función helper para obtener el ID del dispositivo para usuarios anónimos
 */
export function getDeviceId(): string {
  if (typeof window === 'undefined') {
    return `server_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  try {
    let deviceId = localStorage.getItem('anonymous_device_id');
    
    if (!deviceId) {
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
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

/**
 * Genera un fingerprint básico del navegador
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
    
    return btoa(fingerprint).slice(0, 8);
  } catch (error) {
    return Math.random().toString(36).substr(2, 8);
  }
}

/**
 * Función helper para verificar si el usuario puede valorar un platillo
 */
export async function canUserRateDish(
  dishId: string,
  token?: string,
  deviceId?: string
): Promise<{ canRate: boolean; reason?: string }> {
  try {
    if (token) {
      // Usuario autenticado: verificar si ya valoró
      // Aquí podrías hacer una consulta específica si tienes el endpoint
      return { canRate: true };
    } else if (deviceId) {
      // Usuario anónimo: verificar localmente
      const localRatings = getLocalDishRatings();
      const hasRatedLocally = localRatings.some(rating => 
        rating.dishId === dishId && rating.deviceId === deviceId
      );
      
      if (hasRatedLocally) {
        return { 
          canRate: false, 
          reason: 'Ya has valorado este platillo desde este dispositivo' 
        };
      }
      
      return { canRate: true };
    } else {
      return { canRate: false, reason: 'Se requiere autenticación o device ID' };
    }
    
  } catch (error) {
    console.warn('⚠️ Error checking if user can rate:', error);
    return { canRate: true };
  }
}

/**
 * Interface para valoraciones locales
 */
interface LocalDishRating {
  dishId: string;
  deviceId: string;
  rating: number;
  timestamp: string;
}

/**
 * Obtiene las valoraciones guardadas localmente
 */
export function getLocalDishRatings(): LocalDishRating[] {
  if (typeof window === 'undefined') return [];
  
  try {
    const stored = localStorage.getItem('local_dish_ratings');
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.warn('⚠️ Error reading local dish ratings:', error);
    return [];
  }
}

/**
 * Guarda una valoración localmente
 */
export function saveLocalDishRating(rating: LocalDishRating): void {
  if (typeof window === 'undefined') return;
  
  try {
    const localRatings = getLocalDishRatings();
    
    const filteredRatings = localRatings.filter(r => 
      !(r.dishId === rating.dishId && r.deviceId === rating.deviceId)
    );
    
    filteredRatings.push(rating);
    
    const recentRatings = filteredRatings.slice(-100);
    
    localStorage.setItem('local_dish_ratings', JSON.stringify(recentRatings));
  } catch (error) {
    console.warn('⚠️ Error saving local dish rating:', error);
  }
}

/**
 * Verifica si el usuario ya valoró un platillo localmente
 */
export function hasUserRatedDishLocally(dishId: string, deviceId: string): boolean {
  const localRatings = getLocalDishRatings();
  return localRatings.some(rating => 
    rating.dishId === dishId && rating.deviceId === deviceId
  );
}

/**
 * Obtiene la valoración local del usuario para un platillo
 */
export function getUserLocalDishRating(dishId: string, deviceId: string): number {
  const localRatings = getLocalDishRatings();
  const rating = localRatings.find(r => 
    r.dishId === dishId && r.deviceId === deviceId
  );
  return rating?.rating || 0;
}

/**
 * Limpia todos los datos del dispositivo
 */
export function clearDishDeviceData(): void {
  if (typeof window === 'undefined') return;
  
  try {
    localStorage.removeItem('anonymous_device_id');
    localStorage.removeItem('device_created_at');
    localStorage.removeItem('local_dish_ratings');
    console.log('🧹 Dish device data cleared');
  } catch (error) {
    console.warn('⚠️ Error clearing dish device data:', error);
  }
}

/**
 * Función helper para obtener un platillo con sus estadísticas de valoración
 */
export async function fetchDishWithRatings(dishId: string): Promise<{ dish: DishWithRatings; stats: DishRatingStats | null }> {
  console.log('🔍 Fetching dish with ratings:', dishId);
  
  try {
    const baseUrl = getBaseUrl();
    const dishUrl = `${baseUrl}/dishes/${dishId}`;
    
    const dishResponse = await fetchWithStandardConfig(dishUrl);
    
    if (!dishResponse.ok) {
      throw new Error(`Dish not found: ${dishResponse.statusText}`);
    }
    
    const dish = await dishResponse.json();
    
    // Obtener las estadísticas con el ID del platillo
    try {
      const stats = await fetchDishRatingStats(dishId);
      return {
        dish: {
          ...dish,
          ratingStats: stats
        },
        stats
      };
    } catch (statsError) {
      console.warn('⚠️ Could not fetch rating stats:', statsError);
      return {
        dish,
        stats: null
      };
    }
    
  } catch (error) {
    console.error('❌ Error fetching dish with ratings:', error);
    throw error;
  }
}

// ===== FUNCIÓN PARA DEBUG DE CONFIGURACIÓN =====
export function debugDishRatingsApi() {
  return {
    ...debugApiConfiguration(),
    features: {
      dishRatings: true,
      anonymousRatings: true,
      dishComments: true,
      ratingStats: true,
      dishSearch: true,
      topRatedDishes: true,
      mostCommentedDishes: true,
      localTracking: true,
      deviceFingerprinting: true
    },
    endpoints: {
      comments: `${getBaseUrl()}/dishes/{id}/comments`,
      createRating: `${getBaseUrl()}/dishes/{id}/rate`,
      anonymousRating: `${getBaseUrl()}/anonymous/ratings/dish/{id}`,
      anonymousComment: `${getBaseUrl()}/anonymous/dishes/{id}/comments`,
      stats: `${getBaseUrl()}/dishes/{id}/stats`,
      search: `${getBaseUrl()}/dishes/search-advanced`,
      topRated: `${getBaseUrl()}/dishes/top-rated`,
      mostCommented: `${getBaseUrl()}/dishes/most-commented`
    },
    deviceInfo: {
      deviceId: getDeviceId(),
      hasLocalStorage: typeof localStorage !== 'undefined',
      localRatingsCount: getLocalDishRatings().length
    }
  };
}
/**
 * Función de debug para verificar la URL y parámetros
 */
export function debugTopRatedDishesUrl(
  limit: number = 10,
  minRatings: number = 3,
  restaurantId?: string,
  categoryId?: string
): string {
  const baseUrl = getBaseUrl();
  const params = new URLSearchParams();
  
  params.set('limit', limit.toString());
  params.set('min_ratings', minRatings.toString());
  
  if (restaurantId?.trim()) {
    params.set('restaurant_id', restaurantId.trim());
  }
  
  if (categoryId?.trim()) {
    params.set('category_id', categoryId.trim());
  }
  
  const finalUrl = `${baseUrl}/dishes/top-rated?${params.toString()}`;
  
  console.log('🔍 Debug URL construcción:', {
    baseUrl,
    params: Object.fromEntries(params.entries()),
    finalUrl
  });
  
  return finalUrl;
}