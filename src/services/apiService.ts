// src/services/apiService.ts
import type { Category } from "../interfaces/categories";
import type { Dish } from "../interfaces/dish";
import type { Restaurant, LinkTree } from '../interfaces';

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

// Función helper para logging detallado
const logApiCall = (method: string, url: string, response?: Response, error?: Error) => {
  if (import.meta.env.DEV) {
    if (error) {
      console.error(`❌ API ${method} Failed:`, {
        url,
        error: error.message,
        stack: error.stack
      });
    } else if (response) {
      // console.log(`✅ API ${method} Success:`, {
      //   url,
      //   status: response.status,
      //   statusText: response.statusText
      // });
    } else {
      // console.log(`📡 API ${method} Call:`, { url });
    }
  }
};

// Función helper para manejar respuestas de API
const handleApiResponse = async (response: Response, context: string) => {
  logApiCall('RESPONSE', response.url, response);
  
  if (!response.ok) {
    const errorText = await response.text();
    console.error(`❌ ${context} Error Details:`, {
      status: response.status,
      statusText: response.statusText,
      url: response.url,
      errorBody: errorText
    });
    throw new Error(`Error in ${context}: ${response.status} ${response.statusText}${errorText ? ` - ${errorText}` : ''}`);
  }
  
  try {
    const data = await response.json();
    // console.log(`📦 ${context} Data:`, data);
    return data;
  } catch (parseError) {
    console.error(`❌ Error parsing JSON for ${context}:`, parseError);
    const errorMessage = (parseError instanceof Error) ? parseError.message : String(parseError);
    throw new Error(`Error parsing response for ${context}: ${errorMessage}`);
  }
};


/**
 * Verifica si debemos usar mock data
 */
const shouldUseMockData = (): boolean => {
  const useMockData = import.meta.env.PUBLIC_USE_MOCK_DATA;
  const isDev = import.meta.env.DEV;
  
  if (isDev && useMockData === undefined) {
    return true;
  }
  
  return useMockData === 'true';
};

/**
 * Wrapper para fetch con timeout
 */
async function fetchWithTimeout(url: string, options: RequestInit & { timeout?: number } = {}) {
  const { timeout = 10000, ...fetchOptions } = options;
  
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);
  
  try {
    const response = await fetch(url, {
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
 * Obtiene la información de un restaurante por username desde API
 */
export async function fetchRestaurantByUsername(username: string): Promise<Restaurant> {
  const baseUrl = getBaseUrl();
  const url = `${baseUrl}/restaurants/username/${username}`;
  
  const response = await fetchWithTimeout(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    timeout: 8000,
  });
  
  if (!response.ok) {
    throw new Error(`Restaurant API Error: ${response.status}`);
  }
  
  return response.json();
}

/**
 * Obtiene la información de los links por username desde API
 */
export async function fetchLinksByUsername(username: string): Promise<LinkTree> {
  const baseUrl = getBaseUrl();
  const url = `${baseUrl}/linktrees/slug/${username}`;
  
  const response = await fetchWithTimeout(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    timeout: 8000,
  });
  
  if (!response.ok) {
    throw new Error(`Links API Error: ${response.status}`);
  }
  
  return response.json();
}

/**
 * Obtiene las categorías de un restaurante por username con fallback
 */
export async function fetchCategoriesByUsername(username: string): Promise<Category[]> {
  const baseUrl = getBaseUrl();
  const url = `${baseUrl}/categories/restaurant-username/${username}`;
  
  logApiCall('GET', url);
  
  try {
    const response = await fetch(url);
    
    // Si el endpoint específico falla, intentar con el restaurantId
    if (!response.ok) {
      console.warn(`⚠️ Endpoint categories/restaurant-username/${username} falló, intentando fallback...`);
      
      // Primero obtener el restaurant para conseguir el ID
      const restaurant = await fetchRestaurantByUsername(username);
      if (restaurant && restaurant.id) {
        return await fetchCategories(restaurant.id);
      }
      
      // Si el fallback también falla, lanzar el error original
      throw new Error(`Error fetching categories: ${response.status} ${response.statusText}`);
    }
    
    return await handleApiResponse(response, 'fetchCategoriesByUsername');
  } catch (error) {
    logApiCall('GET', url, undefined, error as Error);
    throw error;
  }
}
/**
 * Obtiene los platos de un restaurante por username
 */
export async function fetchDishesByUsername(username: string, limit: number = 100): Promise<{ dishes: Dish[] }> {
  const baseUrl = getBaseUrl();
  const url = `${baseUrl}/dishes/restaurant-username/${username}?limit=${limit}`;
  
  logApiCall('GET', url);
  
  try {
    const response = await fetch(url);
    const data = await handleApiResponse(response, 'fetchDishesByUsername');
    
    // Validación de estructura de datos
    if (!data || !Array.isArray(data.dishes)) {
      console.error('❌ Invalid dishes data structure:', data);
      throw new Error('Invalid dishes data format - expected { dishes: Dish[] }');
    }
    
    return data;
  } catch (error) {
    logApiCall('GET', url, undefined, error as Error);
    throw error;
  }
}

/**
 * Obtiene los platos de una categoría específica por username del restaurante
 * @param username Username del restaurante
 * @param categoryId ID de la categoría
 * @param limit Límite de resultados (opcional)
 * @returns Lista de platos de la categoría
 */
export async function fetchDishesByUsernameAndCategory(
  username: string, 
  categoryId: string, 
  limit: number = 100
): Promise<{ dishes: Dish[] }> {
  const baseUrl = getBaseUrl();
  const response = await fetch(`${baseUrl}/dishes/restaurant-username/${username}/category/${categoryId}?limit=${limit}`);
  
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Error fetching dishes by category: ${response.status} ${errorText}`);
  }
  
  const data = await response.json();
  
  if (!data || !Array.isArray(data.dishes)) {
    throw new Error('Invalid dishes data format');
  }
  
  return data;
}

/**
 * Obtiene todos los datos del restaurante por username con manejo robusto de errores
 */
export async function fetchAllRestaurantDataByUsername(username: string) {
  // console.log(`🚀 Iniciando carga de datos para restaurante: ${username}`);
  
  try {
    // Ejecutar llamadas en paralelo con manejo individual de errores
    const [restaurantResult, categoriesResult, dishesResult] = await Promise.allSettled([
      fetchRestaurantByUsername(username),
      fetchCategoriesByUsername(username),
      fetchDishesByUsername(username)
    ]);
    
    // Procesar resultados
    const restaurant = restaurantResult.status === 'fulfilled' 
      ? restaurantResult.value 
      : null;
    
    const categories = categoriesResult.status === 'fulfilled' 
      ? categoriesResult.value 
      : [];
    
    const dishes = dishesResult.status === 'fulfilled' 
      ? dishesResult.value.dishes 
      : [];
    
    // Log de resultados
    // console.log(`📊 Resultados de carga:`, {
    //   restaurant: restaurant ? '✅ Cargado' : '❌ Error',
    //   categories: categoriesResult.status === 'fulfilled' ? `✅ ${categories.length} categorías` : `❌ ${categoriesResult.reason}`,
    //   dishes: dishesResult.status === 'fulfilled' ? `✅ ${dishes.length} platillos` : `❌ ${dishesResult.reason}`
    // });
    
    // Si el restaurante no se pudo cargar, es un error crítico
    if (!restaurant) {
      throw new Error(`Restaurant not found: ${restaurantResult.status === 'rejected' ? restaurantResult.reason : 'Unknown error'}`);
    }
    
    // Log de warnings para errores no críticos
    if (categoriesResult.status === 'rejected') {
      console.warn('⚠️ No se pudieron cargar las categorías:', categoriesResult.reason);
    }
    
    if (dishesResult.status === 'rejected') {
      console.warn('⚠️ No se pudieron cargar los platillos:', dishesResult.reason);
    }
    
    return {
      restaurant,
      categories,
      dishes
    };
  } catch (error) {
    console.error('❌ Error crítico en fetchAllRestaurantDataByUsername:', error);
    throw error;
  }
}

/**
 * Obtiene todos los datos del perfil
 */
export async function fetchRestaurantProfile(username: string) {
  // Verificar si debemos usar mock data
  if (shouldUseMockData()) {
    const { getMockRestaurantProfile } = await import('../data/mockData');
    const mockData = getMockRestaurantProfile(username);
    return {
      restaurant: mockData.restaurant,
      linkTree: mockData.linkTree,
      dataSource: 'mock'
    };
  }
  
  // Usar API real
  const [restaurantData, linksData] = await Promise.all([
    fetchRestaurantByUsername(username),
    fetchLinksByUsername(username)
  ]);
  
  return {
    restaurant: restaurantData,
    linkTree: linksData,
    dataSource: 'api'
  };
}

/**
 * Verifica si la API está disponible (para debug)
 */
export async function checkApiHealth(): Promise<{ healthy: boolean; url: string; error?: string }> {
  try {
    const baseUrl = getBaseUrl();
    const response = await fetchWithTimeout(`${baseUrl}/health`, {
      method: 'GET',
      timeout: 5000,
    });
    
    return {
      healthy: response.ok,
      url: baseUrl,
      error: response.ok ? undefined : `HTTP ${response.status}`
    };
  } catch (error) {
    return {
      healthy: false,
      url: getBaseUrl(),
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Función de debug (para página de debug)
 */
export function debugApiConfiguration() {
  return {
    environment: import.meta.env.MODE,
    isDev: import.meta.env.DEV,
    apiUrl: import.meta.env.PUBLIC_API_URL,
    useMockData: import.meta.env.PUBLIC_USE_MOCK_DATA,
    shouldUseMock: shouldUseMockData(),
    resolvedBaseUrl: (() => {
      try {
        return getBaseUrl();
      } catch (e) {
        return `Error: ${e instanceof Error ? e.message : 'Unknown'}`;
      }
    })(),
    timestamp: new Date().toISOString()
  };
}

function fetchCategories(id: string): Category[] | PromiseLike<Category[]> {
  throw new Error("Function not implemented.");
}
