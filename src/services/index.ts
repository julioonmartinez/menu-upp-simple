// src/services/index.ts
// ✅ Archivo de índice para facilitar las importaciones

import type { Dish } from '../interfaces/dish.ts';
import type { Category } from './categoryService.ts';
import { DISH_SORT_FIELDS, isValidSortField } from './dishService.ts';
import type { DishSortField } from './dishService.ts';

// ==============================================
// SERVICIOS
// ==============================================

// Servicio de platillos
export { 
  dishService,
  default as DishService,
  
  // Sistema de ordenamiento
  DISH_SORT_FIELDS,
  isValidSortField
} from './dishService.ts';

// Servicio de categorías
export { 
  categoryService,
  default as CategoryService 
} from './categoryService.ts';

// Re-exportar tipos de servicios para facilitar importación
export type {
  // Dish Service Types
  ApiResult,
  DishCreateRequest,
  DishUpdateRequest,
  DishWithImagesRequest,
  DishSearchFilters,
  DishPaginationParams,
  DishPaginationResponse,
  RatingRequest,
  RatingResponse,
  CommentCreateRequest,
  DishStatsResponse,
  ImageUploadResponse,
  DishResponse,
  FavoriteToggleResponse,
  
  // Sistema de ordenamiento
  DishSortField,
} from './dishService.ts';

export type {
  Category,
  ApiError,
  // Category Service Types
  CategoryCreateRequest,
  CategoryUpdateRequest,
  CategoryResponse,
} from './categoryService.ts';

// ==============================================
// STORES
// ==============================================

// Store de platillos
export { 
  dishStore,
  default as DishStore,
  
  // Stores derivados individuales
  dishesLoading,
  dishesLoadingAll,
  dishesLoadingCurrent,
  dishesCreating,
  dishesUpdating,
  dishesDeleting,
  dishesRating,
  dishesTogglingFavorite,
  dishesUploadingImage,
  dishesSearching,
  dishesError,
  dishesCreateError,
  dishesUpdateError,
  dishesDeleteError,
  dishesRatingError,
  dishesFavoriteError,
  dishesImageError,
  dishesSearchError,
  allDishes,
  currentDish,
  topRatedDishes,
  mostCommentedDishes,
  dishSearchResults,
  dishPagination,
  currentDishStats,
  dishesIsAuthenticated,
  
  // Hook personalizado
  useDishes
} from '../stores/dishStore20.ts';

// Store de categorías
export { 
  categoryStore,
  default as CategoryStore,
  
  // Stores derivados individuales
  categoriesLoading,
  categoriesLoadingAll,
  categoriesLoadingCurrent,
  categoriesLoadingByRestaurant,
  categoriesCreating,
  categoriesUpdating,
  categoriesDeleting,
  categoriesError,
  categoriesCreateError,
  categoriesUpdateError,
  categoriesDeleteError,
  allCategories,
  currentCategory,
  categoriesIsAuthenticated,
  
  // Hook personalizado
  useCategories
} from '../stores/categoryStore.ts';

// Re-exportar tipos de stores
export type {
  // Dish Store Types
  DishesState,
  CreateDishResult,
  UpdateDishResult,
  DeleteDishResult,
  RateDishResult,
  FavoriteResult,
  UploadImageResult,
  SearchResult
} from '../stores/dishStore20.ts';

export type {
  // Category Store Types
  CategoriesState,
  CreateCategoryResult,
  UpdateCategoryResult,
  DeleteCategoryResult
} from '../stores/categoryStore.ts';

// ==============================================
// INTERFACES
// ==============================================

// Interfaces de platillos
export type {
  Dish,
  DishOption,
  NutritionalInfo,
  ImageData,
  PlatilloBaseReference,
  PlatilloBaseInfo,
  DishCreate,
  DishUpdate,
  DishSearchFilters as DishFilters,
  DishRatingStats,
  DishComment,
  DishCommentCreate,
  RatingCreate,
  DishVinculacionRequest,
  SugerenciasVinculacion,
  DishConPlatilloBase,
  DishWithRestaurantInfo,
  DishLoadingState,
  DishErrorState,
  DishDisplayConfig,
  DishValidation,
  DishMetrics,
  PricingConfig,
  DishComponentConfig,
  DishEvent
} from '../interfaces/dish.ts';

// Interfaces de categorías
export type {
  Category as CategoryInterface,
  CategoryCreate,
  CategoryUpdate,
  CategoryWithRestaurantInfo,
  CategoryWithStats,
  CategorySearchFilters,
  CategoryLoadingState,
  CategoryErrorState,
  CategoryDisplayConfig,
  CategoryValidation,
  CategoryStats,
  CategoryGroup,
  CategorySelectOption,
  CategoryChange,
  CategorySortConfig,
  CategoryPaginationParams,
  CategoryPaginationResponse,
  CategoryCache,
  CategoryMetrics,
  CategoryComponentConfig,
  CategoryEvent,
  CategoryTemplate,
  CategoryImportConfig,
  CategoryExportConfig,
  CategoryValidationRules,
  CategoryPermissions,
  CategoryAnalytics,
  CategoryUtils,
  CategoryFormConfig,
  CategoryFormState
} from '../interfaces/category.ts';

// Constantes útiles
export { DISH_CONSTANTS } from '../interfaces/dish.ts';
export { CATEGORY_CONSTANTS } from '../interfaces/category.ts';

// Tipos auxiliares
export type {
  DishStatus,
  DishCategory,
  SortOrder,
  DishStoreAction,
  DishStoreState,
  
} from '../interfaces/dish.ts';

export type {
    CategoryStatus,
  CategoryType,
  CategorySortField,
  CategoryStoreAction,
  CategoryStoreState
} from '../interfaces/category.ts'

// ==============================================
// UTILIDADES Y HELPERS
// ==============================================

/**
 * ✅ Funciones de utilidad para trabajar con platillos
 */
export const dishUtils = {
  /**
   * Formatea el precio de un platillo
   */
  formatPrice: (price: number, currency: string = 'MXN'): string => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency
    }).format(price);
  },

  /**
   * Calcula el precio con descuento
   */
  calculateDiscountedPrice: (price: number, discount?: number): number => {
    if (!discount || discount <= 0) return price;
    return price * (1 - discount / 100);
  },

  /**
   * Genera estrellas para el rating
   */
  generateStars: (rating: number): string => {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);
    
    return '★'.repeat(fullStars) + 
           (hasHalfStar ? '☆' : '') + 
           '☆'.repeat(emptyStars);
  },

  /**
   * Verifica si un platillo está disponible
   */
  isInStock: (dish: { inStock?: boolean }): boolean => {
    return dish.inStock !== false;
  },

  /**
   * Calcula el total con opciones seleccionadas
   */
  calculateTotalWithOptions: (dish: Dish): number => {
    let total = dish.price;
    
    if (dish.options) {
      total += dish.options
        .filter(option => option.selected)
        .reduce((sum, option) => sum + option.price, 0);
    }
    
    if (dish.discount && dish.discount > 0) {
      total = dishUtils.calculateDiscountedPrice(total, dish.discount);
    }
    
    return total;
  },

  /**
   * Valida una imagen
   */
  validateImage: (file: File): { isValid: boolean; error?: string } => {
    const maxSize = 5 * 1024 * 1024; // 5MB
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    
    if (file.size > maxSize) {
      return { isValid: false, error: 'El archivo debe ser menor a 5MB' };
    }
    
    if (!allowedTypes.includes(file.type)) {
      return { isValid: false, error: 'Solo se permiten archivos JPG, PNG o WEBP' };
    }
    
    return { isValid: true };
  },

  /**
   * Trunca texto
   */
  truncateText: (text: string, maxLength: number): string => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength).trim() + '...';
  },

  /**
   * Ordena platillos por campo específico
   */
  sortDishes: (
    dishes: Dish[], 
    sortField: DishSortField = 'name', 
    sortOrder: 1 | -1 = 1
  ): Dish[] => {
    return [...dishes].sort((a, b) => {
      let aValue: any;
      let bValue: any;

      switch (sortField) {
        case 'name':
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
          break;
        case 'price':
          aValue = a.price;
          bValue = b.price;
          break;
        case 'rating':
          aValue = a.rating || 0;
          bValue = b.rating || 0;
          break;
        case 'favorites':
          aValue = a.favorites || 0;
          bValue = b.favorites || 0;
          break;
        case 'reviewsCount':
          aValue = a.reviewsCount || 0;
          bValue = b.reviewsCount || 0;
          break;
        default:
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
      }

      if (aValue < bValue) return -1 * sortOrder;
      if (aValue > bValue) return 1 * sortOrder;
      return 0;
    });
  },

  /**
   * Obtiene el label de un campo de ordenamiento
   */
  getSortFieldLabel: (field: DishSortField): string => {
    const sortField = DISH_SORT_FIELDS.find(option => option.value === field);
    return sortField ? sortField.label : 'Nombre';
  },

  /**
   * Valida si un campo de ordenamiento es válido
   */
  validateSortField: (field: string): field is DishSortField => {
    return isValidSortField(field);
  },

  /**
   * Genera opciones de ordenamiento para select
   */
  generateSortOptions: (): Array<{ value: DishSortField; label: string }> => {
    return [...DISH_SORT_FIELDS];
  }
};

/**
 * ✅ Funciones de utilidad para trabajar con categorías
 */
export const categoryUtils = {
  /**
   * Formatea el nombre de una categoría
   */
  formatName: (name: string): string => {
    return name.trim().replace(/\s+/g, ' ');
  },

  /**
   * Genera un slug para la categoría
   */
  generateSlug: (name: string): string => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .replace(/\s+/g, '-')
      .substring(0, 50);
  },

  /**
   * Verifica si un nombre es único
   */
  isNameUnique: (
    categories: Category[], 
    name: string, 
    excludeId?: string,
    restaurantId?: string
  ): boolean => {
    const normalizedName = name.trim().toLowerCase();
    
    return !categories.some(category => {
      if (excludeId && category.id === excludeId) return false;
      if (restaurantId && category.restaurantId !== restaurantId) return false;
      
      return category.name.trim().toLowerCase() === normalizedName;
    });
  },

  /**
   * Ordena categorías
   */
  sortCategories: (categories: Category[], ascending: boolean = true): Category[] => {
    return [...categories].sort((a, b) => {
      const comparison = a.name.localeCompare(b.name, 'es', { sensitivity: 'base' });
      return ascending ? comparison : -comparison;
    });
  },

  /**
   * Filtra categorías por búsqueda
   */
  filterBySearch: (categories: Category[], searchTerm: string): Category[] => {
    if (!searchTerm.trim()) return categories;
    
    const term = searchTerm.toLowerCase().trim();
    return categories.filter(category =>
      category.name.toLowerCase().includes(term) ||
      (category.description && category.description.toLowerCase().includes(term))
    );
  },

  /**
   * Agrupa categorías por restaurante
   */
  groupByRestaurant: (categories: Category[]): { [restaurantId: string]: Category[] } => {
    return categories.reduce((groups, category) => {
      const restaurantId = category.restaurantId || 'general';
      if (!groups[restaurantId]) {
        groups[restaurantId] = [];
      }
      groups[restaurantId].push(category);
      return groups;
    }, {} as { [restaurantId: string]: Category[] });
  },

  /**
   * Genera opciones para select
   */
  generateSelectOptions: (
    categories: Category[], 
    includeEmpty: boolean = true
  ): Array<{ value: string; label: string }> => {
    const options = categories.map(category => ({
      value: category.id || '',
      label: category.name
    }));

    if (includeEmpty) {
      options.unshift({ value: '', label: 'Seleccionar categoría' });
    }

    return options;
  }
};

// ==============================================
// CONFIGURACIÓN Y CONSTANTES
// ==============================================

/**
 * ✅ Configuración por defecto para platillos
 */
export const DEFAULT_DISH_CONFIG = {
  display: {
    showRating: true,
    showFavorites: true,
    showPrice: true,
    showDescription: true,
    showImage: true,
    showAvailability: true,
    showDiscount: true,
    imageSize: 'medium' as const,
    layout: 'card' as const
  },
  validation: {
    minNameLength: 2,
    maxNameLength: 200,
    minDescriptionLength: 10,
    maxDescriptionLength: 1000,
    minPrice: 0,
    maxPrice: 10000,
    maxDiscount: 100
  },
  pagination: {
    defaultPageSize: 20,
    maxPageSize: 100
  },
  sorting: {
    defaultField: 'name' as DishSortField,
    defaultOrder: 1 as 1 | -1,
    availableFields: DISH_SORT_FIELDS
  },
  cache: {
    duration: 5 * 60 * 1000 // 5 minutos
  }
};

/**
 * ✅ Configuración por defecto para categorías
 */
export const DEFAULT_CATEGORY_CONFIG = {
  display: {
    showDescription: true,
    showDishCount: true,
    showRestaurantInfo: false,
    showActions: true,
    layout: 'card' as const,
    maxDescriptionLength: 100
  },
  validation: {
    minNameLength: 2,
    maxNameLength: 100,
    maxDescriptionLength: 500
  },
  cache: {
    duration: 5 * 60 * 1000 // 5 minutos
  }
};

/**
 * ✅ Mensajes de error comunes
 */
export const ERROR_MESSAGES = {
  // Autenticación
  NOT_AUTHENTICATED: 'Debes estar autenticado para realizar esta acción',
  INSUFFICIENT_PERMISSIONS: 'No tienes permisos para realizar esta acción',
  
  // Platillos
  DISH_NOT_FOUND: 'Platillo no encontrado',
  DISH_NAME_REQUIRED: 'El nombre del platillo es requerido',
  DISH_DESCRIPTION_REQUIRED: 'La descripción del platillo es requerida',
  DISH_PRICE_REQUIRED: 'El precio del platillo es requerido',
  DISH_CATEGORY_REQUIRED: 'La categoría del platillo es requerida',
  DISH_IMAGE_TOO_LARGE: 'La imagen es demasiado grande (máximo 5MB)',
  DISH_IMAGE_INVALID_TYPE: 'Tipo de imagen no válido (solo JPG, PNG, WEBP)',
  
  // Categorías
  CATEGORY_NOT_FOUND: 'Categoría no encontrada',
  CATEGORY_NAME_REQUIRED: 'El nombre de la categoría es requerido',
  CATEGORY_NAME_EXISTS: 'Ya existe una categoría con ese nombre',
  CATEGORY_HAS_DISHES: 'No se puede eliminar la categoría porque tiene platillos asociados',
  
  // Genéricos
  NETWORK_ERROR: 'Error de conexión. Verifica tu conexión a internet',
  SERVER_ERROR: 'Error del servidor. Inténtalo más tarde',
  UNKNOWN_ERROR: 'Error desconocido'
} as const;

/**
 * ✅ Estados de carga comunes
 */
export const LOADING_STATES = {
  IDLE: 'idle',
  LOADING: 'loading',
  SUCCESS: 'success',
  ERROR: 'error'
} as const;

/**
 * ✅ Constantes de ordenamiento
 */
export const SORT_CONSTANTS = {
  ORDER: {
    ASCENDING: 1,
    DESCENDING: -1
  },
  FIELD_LABELS: {
    name: 'Nombre',
    price: 'Precio',
    rating: 'Valoración',
    favorites: 'Favoritos',
    reviewsCount: 'N° de reseñas'
  },
  ORDER_LABELS: {
    1: 'Ascendente',
    '-1': 'Descendente'
  }
} as const;

// ==============================================
// EXPORT POR DEFECTO
// ==============================================

/**
 * ✅ Export por defecto con los servicios principales
 */
export default {
//   // Servicios
//   dishService,
//   categoryService,
  
//   // Stores
//   dishStore,
//   categoryStore,
  
//   // Hooks
//   useDishes,
//   useCategories,
  
//   // Utilidades
//   dishUtils,
//   categoryUtils,
  
//   // Configuración
//   DEFAULT_DISH_CONFIG,
//   DEFAULT_CATEGORY_CONFIG,
//   ERROR_MESSAGES,
//   LOADING_STATES
};