// src/stores/anonymousStores.ts

// Re-exportar todos los stores anónimos para facilitar las importaciones
export { 
  anonymousRestaurantStore, 
  useAnonymousRestaurants,
  default as AnonymousRestaurantStore 
} from './anonymousRestaurantStore';

export { 
  anonymousCategoryStore, 
  useAnonymousCategories,
  default as AnonymousCategoryStore 
} from './anonymousCategoryStore';

export { 
  anonymousDishStore, 
  useAnonymousDishes,
  default as AnonymousDishStore 
} from './anonymousDishStore';

export { 
  anonymousServicesStore, 
  useAnonymousServices,
  default as AnonymousServicesStore 
} from './anonymousServicesStore';

// Re-exportar tipos para facilitar las importaciones
export type {
  AnonymousRestaurantsState,
  CreateAnonymousRestaurantResult,
  ClaimRestaurantResult,
  GetByClaimCodeResult
} from './anonymousRestaurantStore';

export type {
  AnonymousCategoriesState,
  CreateAnonymousCategoryResult,
  UpdateAnonymousCategoryResult,
  DeleteAnonymousCategoryResult
} from './anonymousCategoryStore';

export type {
  AnonymousDishesState,
  CreateAnonymousDishResult,
  UpdateAnonymousDishResult,
  DeleteAnonymousDishResult,
  UploadImageResult
} from './anonymousDishStore';

export type {
  AnonymousServicesState,
  CreateCompleteRestaurantResult,
  GetAllAnonymousDataResult,
  ClearAllAnonymousDataResult,
  GetAnonymousDataStatsResult
} from './anonymousServicesStore';

/**
 * Clase utilitaria para manejar todos los stores anónimos
 */
class AnonymousStoresManager {
  /**
   * Inicializa todos los stores anónimos cargando datos
   */
  static async initializeAllStores() {
    const { anonymousRestaurantStore } = await import('./anonymousRestaurantStore');
    const { anonymousCategoryStore } = await import('./anonymousCategoryStore');
    const { anonymousDishStore } = await import('./anonymousDishStore');
    const { anonymousServicesStore } = await import('./anonymousServicesStore');

    try {
      // Cargar todos los datos en paralelo
      const [restaurantsResult, categoriesResult, dishesResult, servicesResult] = await Promise.all([
        anonymousRestaurantStore.loadAllAnonymousRestaurants(),
        anonymousCategoryStore.loadAllAnonymousCategories(),
        anonymousDishStore.loadAllAnonymousDishes(),
        anonymousServicesStore.getAllAnonymousData()
      ]);

      return {
        success: true,
        results: {
          restaurants: restaurantsResult,
          categories: categoriesResult,
          dishes: dishesResult,
          services: servicesResult
        }
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error inicializando stores anónimos'
      };
    }
  }

  /**
   * Limpia todos los stores anónimos
   */
  static async clearAllStores() {
    const { anonymousRestaurantStore } = await import('./anonymousRestaurantStore');
    const { anonymousCategoryStore } = await import('./anonymousCategoryStore');
    const { anonymousDishStore } = await import('./anonymousDishStore');
    const { anonymousServicesStore } = await import('./anonymousServicesStore');

    try {
      // Limpiar todos los stores en paralelo
      await Promise.all([
        anonymousRestaurantStore.clearCache(),
        anonymousCategoryStore.clearCache(),
        anonymousDishStore.clearCache(),
        anonymousServicesStore.clearCache()
      ]);

      return {
        success: true,
        message: 'Todos los stores anónimos han sido limpiados'
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error limpiando stores anónimos'
      };
    }
  }

  /**
   * Obtiene el estado actual de todos los stores
   */
  static async getAllStoresState() {
    const { anonymousRestaurantStore } = await import('./anonymousRestaurantStore');
    const { anonymousCategoryStore } = await import('./anonymousCategoryStore');
    const { anonymousDishStore } = await import('./anonymousDishStore');
    const { anonymousServicesStore } = await import('./anonymousServicesStore');

    try {
      return {
        success: true,
        data: {
          restaurants: anonymousRestaurantStore.getCurrentState(),
          categories: anonymousCategoryStore.getCurrentState(),
          dishes: anonymousDishStore.getCurrentState(),
          services: anonymousServicesStore.getCurrentState()
        }
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error obteniendo estado de stores'
      };
    }
  }

  /**
   * Verifica si hay datos en algún store
   */
  static async hasDataInAnyStore() {
    const { anonymousRestaurantStore } = await import('./anonymousRestaurantStore');
    const { anonymousCategoryStore } = await import('./anonymousCategoryStore');
    const { anonymousDishStore } = await import('./anonymousDishStore');
    const { anonymousServicesStore } = await import('./anonymousServicesStore');

    try {
      const restaurantState = anonymousRestaurantStore.getCurrentState();
      const categoryState = anonymousCategoryStore.getCurrentState();
      const dishState = anonymousDishStore.getCurrentState();
      const servicesState = anonymousServicesStore.getCurrentState();

      return {
        success: true,
        hasData: {
          restaurants: restaurantState.allAnonymousRestaurants.length > 0,
          categories: categoryState.allAnonymousCategories.length > 0,
          dishes: dishState.allAnonymousDishes.length > 0,
          services: servicesState.restaurants.length > 0 || 
                   servicesState.categories.length > 0 || 
                   servicesState.dishes.length > 0
        },
        counts: {
          restaurants: restaurantState.allAnonymousRestaurants.length,
          categories: categoryState.allAnonymousCategories.length,
          dishes: dishState.allAnonymousDishes.length,
          totalServices: servicesState.restaurants.length + 
                        servicesState.categories.length + 
                        servicesState.dishes.length
        }
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error verificando datos en stores'
      };
    }
  }

  /**
   * Sincroniza todos los stores con los datos del servidor
   */
  static async syncAllStores(forceReload: boolean = false) {
    const { anonymousRestaurantStore } = await import('./anonymousRestaurantStore');
    const { anonymousCategoryStore } = await import('./anonymousCategoryStore');
    const { anonymousDishStore } = await import('./anonymousDishStore');
    const { anonymousServicesStore } = await import('./anonymousServicesStore');

    try {
      // Sincronizar todos los stores en paralelo
      const [restaurantsResult, categoriesResult, dishesResult, servicesResult] = await Promise.all([
        anonymousRestaurantStore.loadAllAnonymousRestaurants(forceReload),
        anonymousCategoryStore.loadAllAnonymousCategories(forceReload),
        anonymousDishStore.loadAllAnonymousDishes(undefined, forceReload),
        anonymousServicesStore.getAllAnonymousData(forceReload)
      ]);

      return {
        success: true,
        results: {
          restaurants: restaurantsResult,
          categories: categoriesResult,
          dishes: dishesResult,
          services: servicesResult
        }
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error sincronizando stores'
      };
    }
  }
}

// Exportar la clase utilitaria
export { AnonymousStoresManager };

// Hook unificado para usar todos los stores anónimos
export function useAllAnonymousStores() {
  // Importar dinámicamente las funciones para evitar dependencias circulares
  const { useAnonymousRestaurants } = require('./anonymousRestaurantStore');
  const { useAnonymousCategories } = require('./anonymousCategoryStore');
  const { useAnonymousDishes } = require('./anonymousDishStore');
  const { useAnonymousServices } = require('./anonymousServicesStore');

  return {
    // Stores individuales
    restaurants: useAnonymousRestaurants(),
    categories: useAnonymousCategories(),
    dishes: useAnonymousDishes(),
    services: useAnonymousServices(),
    
    // Métodos del manager
    initializeAllStores: AnonymousStoresManager.initializeAllStores,
    clearAllStores: AnonymousStoresManager.clearAllStores,
    getAllStoresState: AnonymousStoresManager.getAllStoresState,
    hasDataInAnyStore: AnonymousStoresManager.hasDataInAnyStore,
    syncAllStores: AnonymousStoresManager.syncAllStores
  };
} 