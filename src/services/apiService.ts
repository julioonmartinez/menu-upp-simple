// src/services/apiService.ts
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