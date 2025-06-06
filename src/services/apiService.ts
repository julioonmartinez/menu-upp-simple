// src/services/apiService.ts
import type { Restaurant, LinkTree } from '../interfaces';

const getBaseUrl = () => {
  const apiUrl = import.meta.env.PUBLIC_API_URL;
  if (!apiUrl) {
    console.warn('No se encontró PUBLIC_API_URL, usando fallback');
    return 'http://localhost:8000/api';
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
  const response = await fetch(`${baseUrl}/restaurants/username/${username}`);
  
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
  const response = await fetch(`${baseUrl}/linktrees/username/${username}`);
  
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
    const [restaurantData, linksData] = await Promise.all([
      fetchRestaurantByUsername(username),
      fetchLinksByUsername(username)
    ]);
    
    return {
      restaurant: restaurantData,
      linkTree: linksData
    };
  } catch (error) {
    console.error('Error fetching restaurant profile:', error);
    throw error;
  }
}