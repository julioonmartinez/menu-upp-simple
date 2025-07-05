import { derived, writable, type Readable } from 'svelte/store';
import { favoritesStore } from './favoritesStore';
import dishRatingStore from './dishRatingStore';
import { authStore } from './authStore';

/**
 * Store unificado para manejar favoritos tanto para usuarios autenticados como anónimos
 */
class UnifiedFavoritesStore {
  /**
   * Verifica si un platillo está en favoritos (funciona para ambos tipos de usuario)
   */
  isDishFavorite(dishId: string | number): Readable<boolean> {
    return derived(
      [authStore.isAuthenticated, favoritesStore, dishRatingStore.favoriteDishes],
      ([isAuthenticated, favoritesState, authenticatedFavorites]) => {
        if (isAuthenticated) {
          // Usuario autenticado: verificar en dishRatingStore
          return authenticatedFavorites.some(fav => fav.id === dishId);
        } else {
          // Usuario anónimo: verificar en favoritesStore
          return favoritesState.favorites.some(fav => fav.id === dishId);
        }
      }
    );
  }

  /**
   * Verifica si se está alternando el favorito de un platillo
   */
  isTogglingFavorite(dishId: string | number): Readable<boolean> {
    return derived(
      [authStore.isAuthenticated, dishRatingStore.isTogglingFavorite(dishId as string)],
      ([isAuthenticated, isToggling]) => {
        if (isAuthenticated) {
          // Usuario autenticado: usar dishRatingStore
          return isToggling;
        } else {
          // Usuario anónimo: no hay estado de carga en favoritesStore
          return false;
        }
      }
    );
  }

  /**
   * Alterna el estado de favorito de un platillo
   */
  async toggleFavorite(dishId: string | number): Promise<void> {
    const isAuthenticated = authStore.getIsAuthenticated();
    
    if (isAuthenticated) {
      // Usuario autenticado: usar dishRatingStore
      await dishRatingStore.toggleFavorite(dishId as string);
    } else {
      // Usuario anónimo: usar favoritesStore
      await favoritesStore.toggleFavorite(dishId);
    }
  }

  /**
   * Carga los favoritos del usuario actual
   */
  async loadFavorites(): Promise<void> {
    const isAuthenticated = authStore.getIsAuthenticated();
    
    if (isAuthenticated) {
      // Usuario autenticado: cargar desde dishRatingStore
      await dishRatingStore.loadFavoriteDishes();
    } else {
      // Usuario anónimo: los favoritos ya están cargados en favoritesStore
      // No necesitamos hacer nada adicional
    }
  }

  /**
   * Obtiene la lista de favoritos del usuario actual
   */
  getFavoriteDishes(): Readable<any[]> {
    return derived(
      [authStore.isAuthenticated, favoritesStore, dishRatingStore.favoriteDishes],
      ([isAuthenticated, favoritesState, authenticatedFavorites]) => {
        if (isAuthenticated) {
          // Usuario autenticado: usar dishRatingStore
          return authenticatedFavorites;
        } else {
          // Usuario anónimo: usar favoritesStore
          return favoritesState.favorites;
        }
      }
    );
  }

  /**
   * Obtiene el conteo de favoritos
   */
  getFavoriteCount(): Readable<number> {
    return derived(
      this.getFavoriteDishes(),
      (favorites) => favorites.length
    );
  }

  /**
   * Verifica si hay errores en los favoritos
   */
  getFavoritesError(): Readable<string | null> {
    return derived(
      [authStore.isAuthenticated, dishRatingStore.favoritesError],
      ([isAuthenticated, error]) => {
        if (isAuthenticated) {
          // Usuario autenticado: usar dishRatingStore
          return error;
        } else {
          // Usuario anónimo: no hay manejo de errores en favoritesStore
          return null;
        }
      }
    );
  }

  /**
   * Verifica si se están cargando los favoritos
   */
  isLoadingFavorites(): Readable<boolean> {
    return derived(
      [authStore.isAuthenticated, dishRatingStore.isLoadingFavorites],
      ([isAuthenticated, isLoading]) => {
        if (isAuthenticated) {
          // Usuario autenticado: usar dishRatingStore
          return isLoading;
        } else {
          // Usuario anónimo: no hay estado de carga en favoritesStore
          return false;
        }
      }
    );
  }
}

// Crear y exportar la instancia única
export const unifiedFavoritesStore = new UnifiedFavoritesStore();

// Exports individuales para compatibilidad
export const isDishFavorite = (dishId: string | number) => unifiedFavoritesStore.isDishFavorite(dishId);
export const isTogglingFavorite = (dishId: string | number) => unifiedFavoritesStore.isTogglingFavorite(dishId);
export const toggleFavorite = (dishId: string | number) => unifiedFavoritesStore.toggleFavorite(dishId);
export const loadFavorites = () => unifiedFavoritesStore.loadFavorites();
export const favoriteDishes = unifiedFavoritesStore.getFavoriteDishes();
export const favoriteCount = unifiedFavoritesStore.getFavoriteCount();
export const favoritesError = unifiedFavoritesStore.getFavoritesError();
export const isLoadingFavorites = unifiedFavoritesStore.isLoadingFavorites();

// Default export
export default unifiedFavoritesStore; 