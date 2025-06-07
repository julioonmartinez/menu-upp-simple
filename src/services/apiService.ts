// src/services/apiService.ts
import type { Restaurant, LinkTree } from '../interfaces';

const getBaseUrl = () => {
  const apiUrl = import.meta.env.PUBLIC_API_URL;
  if (!apiUrl) {
    console.warn('No se encontró PUBLIC_API_URL, usando fallback');
    return import.meta.env.DEV ? 'http://localhost:8000' : 'https://menuapp-api.onrender.com';
  }
  
  console.log(`Usando API: ${apiUrl} (${import.meta.env.MODE})`);
  return apiUrl;
};

/**
 * Obtiene la información de un restaurante por username
 * @param username Username del restaurante
 * @returns Datos del restaurante
 */
export async function fetchRestaurantByUsername(username: string): Promise<Restaurant> {
  const baseUrl = getBaseUrl();
  const url = `${baseUrl}/restaurants/username/${username}`;
  
  console.log(`Fetching restaurant: ${url}`);
  
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    },
    // Timeout para evitar esperas largas
    signal: AbortSignal.timeout(10000) // 10 segundos
  });
  
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Error fetching restaurant data: ${response.status} ${errorText}`);
  }
  
  return response.json();
}

/**
 * Obtiene la información de los links de un restaurante por username
 * @param username Username del restaurante
 * @returns Datos del linktree
 */
export async function fetchLinksByUsername(username: string): Promise<LinkTree> {
  const baseUrl = getBaseUrl();
  const url = `${baseUrl}/linktrees/slug/${username}`;
  
  console.log(`Fetching links: ${url}`);
  
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    },
    signal: AbortSignal.timeout(10000) // 10 segundos
  });
  
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Error fetching links data: ${response.status} ${errorText}`);
  }
  
  return response.json();
}

/**
 * Obtiene todos los datos del perfil del restaurante
 * @param username Username del restaurante
 * @returns Objeto con información del restaurante y sus links
 */
export async function fetchRestaurantProfile(username: string) {
  try {
    console.log(`Fetching profile for: ${username}`);
    
    // Hacer peticiones en paralelo para mejor performance
    const [restaurantData, linksData] = await Promise.all([
      fetchRestaurantByUsername(username),
      fetchLinksByUsername(username)
    ]);
    
    console.log(`Successfully fetched profile for: ${username}`);
    
    return {
      restaurant: restaurantData,
      linkTree: linksData
    };
  } catch (error) {
    console.error(`Error fetching restaurant profile for ${username}:`, error);
    throw error;
  }
}

/**
 * Verifica si la API está disponible
 * @returns Promise<boolean>
 */
export async function checkApiHealth(): Promise<boolean> {
  try {
    const baseUrl = getBaseUrl();
    const response = await fetch(`${baseUrl}/health`, {
      method: 'GET',
      signal: AbortSignal.timeout(5000) // 5 segundos para health check
    });
    
    return response.ok;
  } catch (error) {
    console.warn('API health check failed:', error);
    return false;
  }
}

/**
 * Obtiene la información de un restaurante (método original mantenido para compatibilidad)
 * @param restaurantId ID del restaurante
 * @returns Datos del restaurante
 */
export async function fetchRestaurantData(restaurantId: string): Promise<Restaurant> {
  const baseUrl = getBaseUrl();
  const response = await fetch(`${baseUrl}/restaurants/${restaurantId}`);
  
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Error fetching restaurant data: ${response.status} ${errorText}`);
  }
  
  return response.json();
}

/**
 * Obtiene la información de los links de un restaurante (método original mantenido para compatibilidad)
 * @param restaurantId ID del restaurante
 * @returns Datos del linktree
 */
export async function fetchLinksData(restaurantId: string): Promise<LinkTree> {
  const baseUrl = getBaseUrl();
  const response = await fetch(`${baseUrl}/linktrees/restaurant/${restaurantId}`);
  
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Error fetching restaurant data: ${response.status} ${errorText}`);
  }
  
  return response.json();
}