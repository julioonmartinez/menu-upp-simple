// src/services/anonymousServices.ts

// Re-exportar todos los servicios anónimos para facilitar las importaciones
export { 
  anonymousRestaurantService, 
  default as AnonymousRestaurantService 
} from './anonymousRestaurantService';

export { 
  anonymousCategoryService, 
  default as AnonymousCategoryService 
} from './anonymousCategoryService';

export { 
  anonymousDishService, 
  default as AnonymousDishService 
} from './anonymousDishService';

// Re-exportar el servicio de device ID
export { 
  getDeviceId, 
  regenerateDeviceId, 
  clearDeviceId 
} from './deviceIdService';

// Re-exportar tipos para facilitar las importaciones
export type {
  AnonymousRestaurantCreateRequest,
  AnonymousRestaurant,
  RestaurantClaimRequest,
  RestaurantClaimResponse,
  AnonymousRestaurantResponse,
  AnonymousRestaurantCreateResponse,
  AnonymousRestaurantByClaimCodeResponse,
  AnonymousRestaurantsByDeviceResponse,
  AnonymousRestaurantCreateWithImagesRequest,
  AnonymousCategory,
  AnonymousCategoryCreateRequest,
  AnonymousCategoriesResponse,
  AnonymousDish,
  AnonymousDishCreateRequest,
  AnonymousDishUpdateRequest,
  AnonymousDishesResponse,
  CleanupStats
} from '../interfaces/anonymousRestaurant.ts';

/**
 * Clase utilitaria para manejar operaciones anónimas completas
 */
 class AnonymousServicesManager {
  /**
   * Crea un restaurante anónimo completo con categorías y platillos
   */
  static async createCompleteAnonymousRestaurant(
    restaurantData: any,
    categories: any[],
    dishes: any[],
    images?: any
  ) {
    const { anonymousRestaurantService } = await import('./anonymousRestaurantService');
    const { anonymousCategoryService } = await import('./anonymousCategoryService');
    const { anonymousDishService } = await import('./anonymousDishService');

    try {
      // 1. Crear restaurante
      const restaurantResult = await anonymousRestaurantService.createAnonymousRestaurant(
        restaurantData,
        images
      );

      if (!restaurantResult.success) {
        return restaurantResult;
      }

      const restaurant = restaurantResult.data!.restaurant;
      const createdCategories: any[] = [];
      const createdDishes: any[] = [];

      // 2. Crear categorías
      for (const categoryData of categories) {
        const categoryResult = await anonymousCategoryService.createAnonymousCategory(categoryData);
        if (categoryResult.success) {
          createdCategories.push(categoryResult.data);
        }
      }

      // 3. Crear platillos
      for (const dishData of dishes) {
        const dishResult = await anonymousDishService.createAnonymousDish(dishData);
        if (dishResult.success) {
          createdDishes.push(dishResult.data);
        }
      }

      return {
        success: true,
        data: {
          restaurant,
          categories: createdCategories,
          dishes: createdDishes,
          claim_code: restaurantResult.data!.claim_code,
          expires_at: restaurantResult.data!.expires_at,
          days_remaining: restaurantResult.data!.days_remaining
        }
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error creando restaurante completo'
      };
    }
  }

  /**
   * Obtiene todos los datos anónimos del dispositivo actual
   */
  static async getAllAnonymousData() {
    const { anonymousRestaurantService } = await import('./anonymousRestaurantService');
    const { anonymousCategoryService } = await import('./anonymousCategoryService');
    const { anonymousDishService } = await import('./anonymousDishService');

    try {
      const [restaurantsResult, categoriesResult, dishesResult] = await Promise.all([
        anonymousRestaurantService.getAnonymousRestaurantsByDevice(),
        anonymousCategoryService.getAnonymousCategoriesByDevice(),
        anonymousDishService.getAnonymousDishesByDevice()
      ]);

      return {
        success: true,
        data: {
          restaurants: restaurantsResult.success ? restaurantsResult.data!.restaurants : [],
          categories: categoriesResult.success ? categoriesResult.data!.categories : [],
          dishes: dishesResult.success ? dishesResult.data!.dishes : []
        }
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error obteniendo datos anónimos'
      };
    }
  }

  /**
   * Limpia todos los datos anónimos del dispositivo actual
   */
  static async clearAllAnonymousData() {
    const { anonymousRestaurantService } = await import('./anonymousRestaurantService');
    const { anonymousCategoryService } = await import('./anonymousCategoryService');
    const { anonymousDishService } = await import('./anonymousDishService');

    try {
      // Obtener todos los datos
      const dataResult = await this.getAllAnonymousData();
      
      if (!dataResult.success) {
        return dataResult;
      }

      const { restaurants, categories, dishes } = dataResult.data!;

      // Eliminar platillos
      for (const dish of dishes) {
        await anonymousDishService.deleteAnonymousDish(dish.id);
      }

      // Eliminar categorías
      for (const category of categories) {
        await anonymousCategoryService.deleteAnonymousCategory(category.id);
      }

      // Los restaurantes se eliminan automáticamente por expiración
      // o pueden ser reclamados

      return {
        success: true,
        data: {
          message: 'Datos anónimos eliminados exitosamente',
          deleted_dishes: dishes.length,
          deleted_categories: categories.length
        }
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error eliminando datos anónimos'
      };
    }
  }

  /**
   * Verifica si hay datos anónimos pendientes
   */
  static async hasPendingAnonymousData() {
    const { anonymousRestaurantService } = await import('./anonymousRestaurantService');
    
    try {
      const result = await anonymousRestaurantService.getAnonymousRestaurantsByDevice();
      
      if (result.success) {
        const activeRestaurants = result.data!.restaurants.filter(
          restaurant => restaurant.days_remaining > 0 && !restaurant.is_claimed
        );
        
        return activeRestaurants.length > 0;
      }
      
      return false;
    } catch (error) {
      console.error('Error verificando datos anónimos pendientes:', error);
      return false;
    }
  }

  /**
   * Obtiene estadísticas de datos anónimos
   */
  static async getAnonymousDataStats() {
    const { anonymousRestaurantService } = await import('./anonymousRestaurantService');
    const { anonymousCategoryService } = await import('./anonymousCategoryService');
    const { anonymousDishService } = await import('./anonymousDishService');

    try {
      const [restaurantsResult, categoriesResult, dishesResult] = await Promise.all([
        anonymousRestaurantService.getAnonymousRestaurantsByDevice(),
        anonymousCategoryService.getAnonymousCategoriesByDevice(),
        anonymousDishService.getAnonymousDishesByDevice()
      ]);

      const restaurants = restaurantsResult.success ? restaurantsResult.data!.restaurants : [];
      const categories = categoriesResult.success ? categoriesResult.data!.categories : [];
      const dishes = dishesResult.success ? dishesResult.data!.dishes : [];

      const activeRestaurants = restaurants.filter(r => r.days_remaining > 0 && !r.is_claimed);
      const expiredRestaurants = restaurants.filter(r => r.days_remaining <= 0);
      const claimedRestaurants = restaurants.filter(r => r.is_claimed);

      return {
        success: true,
        data: {
          total_restaurants: restaurants.length,
          active_restaurants: activeRestaurants.length,
          expired_restaurants: expiredRestaurants.length,
          claimed_restaurants: claimedRestaurants.length,
          total_categories: categories.length,
          total_dishes: dishes.length,
          average_dishes_per_category: categories.length > 0 ? dishes.length / categories.length : 0
        }
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error obteniendo estadísticas'
      };
    }
  }
}

// Exportar la clase utilitaria
export { AnonymousServicesManager }; 