
// src/services/apiService.ts - SOLUCIÓN CORS
import type { Category } from "../interfaces/categories";
import type { Dish } from "../interfaces/dish";
import type { Restaurant, LinkTree, } from '../interfaces';

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

// FUNCIÓN CORREGIDA: fetchDishesByUsernameAndCategory
export async function fetchDishesByUsernameAndCategory(
  username: string, 
  categoryId: string, 
  limit: number = 100
): Promise<{ dishes: Dish[] }> {
  const baseUrl = getBaseUrl();
  const url = `${baseUrl}/dishes/restaurant-username/${username}/category/${categoryId}?limit=${limit}`;
  
  console.log('🔍 Fetching dishes by category:', { username, categoryId, url });
  
  try {
    // USAR LA CONFIGURACIÓN ESTÁNDAR
    const response = await fetchWithStandardConfig(url, {
      timeout: 15000, // Aumentar timeout
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Error response:', {
        status: response.status,
        statusText: response.statusText,
        url,
        errorBody: errorText
      });
      throw new Error(`Error fetching dishes by category: ${response.status} ${errorText}`);
    }
    
    const data = await response.json();
    
    if (!data || !Array.isArray(data.dishes)) {
      console.error('❌ Invalid data structure:', data);
      throw new Error('Invalid dishes data format');
    }
    
    console.log('✅ Successfully fetched dishes by category:', data.dishes.length);
    return data;
    
  } catch (error) {
    console.error('❌ CORS/Network error fetching dishes by category:', error);
    
    // FALLBACK: Intentar obtener todos los platos y filtrar localmente
    console.log('🔄 Trying fallback: fetch all dishes and filter locally');
    try {
      const allDishesResponse = await fetchDishesByUsername(username, 500);
      const filteredDishes = allDishesResponse.dishes.filter(dish => 
        dish.categoryId === categoryId || 
        (dish as any).category_id === categoryId ||
        (dish as any).category === categoryId
      );
      
      console.log('✅ Fallback successful, filtered dishes:', filteredDishes.length);
      return { dishes: filteredDishes };
      
    } catch (fallbackError) {
      console.error('❌ Fallback also failed:', fallbackError);
      throw new Error(`Failed to fetch dishes for category ${categoryId}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}

// FUNCIÓN MEJORADA: fetchDishesByUsername (asegurar que use la misma config)
export async function fetchDishesByUsername(username: string, limit: number = 100): Promise<{ dishes: Dish[] }> {
  const baseUrl = getBaseUrl();
  const url = `${baseUrl}/dishes/restaurant-username/${username}?limit=${limit}`;
  
  console.log('🔍 Fetching all dishes for username:', username);
  
  try {
    const response = await fetchWithStandardConfig(url);
    
    if (!response.ok) {
      throw new Error(`Error fetching dishes: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    
    if (!data || !Array.isArray(data.dishes)) {
      console.error('❌ Invalid dishes data structure:', data);
      throw new Error('Invalid dishes data format - expected { dishes: Dish[] }');
    }
    
    return data;
  } catch (error) {
    console.error('❌ Error fetching dishes by username:', error);
    throw error;
  }
}

// FUNCIÓN MEJORADA: fetchRestaurantByUsername
export async function fetchRestaurantByUsername(username: string): Promise<Restaurant> {
  const baseUrl = getBaseUrl();
  const url = `${baseUrl}/restaurants/username/${username}`;
  
  const response = await fetchWithStandardConfig(url, {
    timeout: 8000,
  });
  
  if (!response.ok) {
    throw new Error(`Restaurant API Error: ${response.status}`);
  }
  
  return response.json();
}

// FUNCIÓN MEJORADA: fetchLinksByUsername
export async function fetchLinksByUsername(username: string): Promise<LinkTree> {
  const baseUrl = getBaseUrl();
  const url = `${baseUrl}/linktrees/slug/${username}`;
  
  const response = await fetchWithStandardConfig(url, {
    timeout: 8000,
  });
  
  if (!response.ok) {
    throw new Error(`Links API Error: ${response.status}`);
  }
  
  return response.json();
}

// FUNCIÓN MEJORADA: fetchCategoriesByUsername
export async function fetchCategoriesByUsername(username: string): Promise<Category[]> {
  const baseUrl = getBaseUrl();
  const url = `${baseUrl}/categories/restaurant-username/${username}`;
  
  console.log('🔍 Fetching categories for username:', username);
  
  try {
    const response = await fetchWithStandardConfig(url);
    
    if (!response.ok) {
      console.warn(`⚠️ Endpoint categories/restaurant-username/${username} falló, intentando fallback...`);
      
      // Primero obtener el restaurant para conseguir el ID
      const restaurant = await fetchRestaurantByUsername(username);
      if (restaurant && restaurant.id) {
        // Aquí implementarías fetchCategoriesById si existe
        console.warn('❌ No hay fallback disponible para categorías por ID');
        throw new Error(`Error fetching categories: ${response.status} ${response.statusText}`);
      }
      
      throw new Error(`Error fetching categories: ${response.status} ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('❌ Error fetching categories:', error);
    throw error;
  }
}

// RESTO DEL CÓDIGO PERMANECE IGUAL...
const shouldUseMockData = (): boolean => {
  const useMockData = import.meta.env.PUBLIC_USE_MOCK_DATA;
  const isDev = import.meta.env.DEV;
  
  if (isDev && useMockData === undefined) {
    return true;
  }
  
  return useMockData === 'true';
};

export async function fetchAllRestaurantDataByUsername(username: string) {
  console.log(`🚀 Iniciando carga de datos para restaurante: ${username}`);
  
  try {
    const [restaurantResult, categoriesResult, dishesResult] = await Promise.allSettled([
      fetchRestaurantByUsername(username),
      fetchCategoriesByUsername(username),
      fetchDishesByUsername(username)
    ]);
    
    const restaurant = restaurantResult.status === 'fulfilled' 
      ? restaurantResult.value 
      : null;
    
    const categories = categoriesResult.status === 'fulfilled' 
      ? categoriesResult.value 
      : [];
    
    const dishes = dishesResult.status === 'fulfilled' 
      ? dishesResult.value.dishes 
      : [];
    
    if (!restaurant) {
      throw new Error(`Restaurant not found: ${restaurantResult.status === 'rejected' ? restaurantResult.reason : 'Unknown error'}`);
    }
    
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

export async function fetchRestaurantProfile(username: string) {
  if (shouldUseMockData()) {
    const { getMockRestaurantProfile } = await import('../data/mockData');
    const mockData = getMockRestaurantProfile(username);
    return {
      restaurant: mockData.restaurant,
      linkTree: mockData.linkTree,
      dataSource: 'mock'
    };
  }
  
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

export async function checkApiHealth(): Promise<{ healthy: boolean; url: string; error?: string }> {
  try {
    const baseUrl = getBaseUrl();
    const response = await fetchWithStandardConfig(`${baseUrl}/health`, {
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

