// src/stores/categoryStore.ts

import { writable, derived, type Writable, type Readable } from 'svelte/store';
import { 
  categoryService, 
  type ApiResult,
  type CategoryCreateRequest,
  type CategoryUpdateRequest,
  type CategoryResponse,
  type Category
} from '../services/categoryService.ts';
import { authStore } from './authStore.ts';

// Types para el estado de categorías
export interface CategoriesState {
  // Categorías en cache
  allCategories: Category[];
  currentCategory: Category | null;
  categoriesByRestaurant: { [restaurantId: string]: Category[] };
  
  // Estados de carga
  isLoading: boolean;
  isLoadingAll: boolean;
  isLoadingCurrent: boolean;
  isLoadingByRestaurant: boolean;
  isCreating: boolean;
  isUpdating: boolean;
  isDeleting: boolean;
  
  // Errores
  error: string | null;
  createError: string | null;
  updateError: string | null;
  deleteError: string | null;
  
  // Cache metadata
  lastUpdated: {
    all: Date | null;
    current: Date | null;
    byRestaurant: { [restaurantId: string]: Date };
  };
  
  // Filtros activos
  activeFilters: {
    restaurantId?: string;
    search?: string;
  };
  
  // Usuario actual
  currentUserId: string | null;
  isAuthenticated: boolean;
}

// Types para resultados de acciones
export interface CreateCategoryResult {
  success: boolean;
  category?: CategoryResponse;
  error?: string;
}

export interface UpdateCategoryResult {
  success: boolean;
  category?: CategoryResponse;
  error?: string;
}

export interface DeleteCategoryResult {
  success: boolean;
  message?: string;
  error?: string;
}

/**
 * Estado inicial del store
 */
const initialState: CategoriesState = {
  allCategories: [],
  currentCategory: null,
  categoriesByRestaurant: {},
  isLoading: false,
  isLoadingAll: false,
  isLoadingCurrent: false,
  isLoadingByRestaurant: false,
  isCreating: false,
  isUpdating: false,
  isDeleting: false,
  error: null,
  createError: null,
  updateError: null,
  deleteError: null,
  lastUpdated: {
    all: null,
    current: null,
    byRestaurant: {}
  },
  activeFilters: {},
  currentUserId: null,
  isAuthenticated: false
};

/**
 * Clase para manejar el estado de categorías
 */
class CategoryStore {
  private store: Writable<CategoriesState>;
  
  // Stores derivados públicos
  public readonly subscribe: Writable<CategoriesState>['subscribe'];
  public readonly isLoading: Readable<boolean>;
  public readonly isLoadingAll: Readable<boolean>;
  public readonly isLoadingCurrent: Readable<boolean>;
  public readonly isLoadingByRestaurant: Readable<boolean>;
  public readonly isCreating: Readable<boolean>;
  public readonly isUpdating: Readable<boolean>;
  public readonly isDeleting: Readable<boolean>;
  public readonly error: Readable<string | null>;
  public readonly createError: Readable<string | null>;
  public readonly updateError: Readable<string | null>;
  public readonly deleteError: Readable<string | null>;
  public readonly allCategories: Readable<Category[]>;
  public readonly currentCategory: Readable<Category | null>;
  public readonly isAuthenticated: Readable<boolean>;

  constructor() {
    this.store = writable<CategoriesState>(initialState);
    this.subscribe = this.store.subscribe;

    // Stores derivados
    this.isLoading = derived(this.store, $state => $state.isLoading);
    this.isLoadingAll = derived(this.store, $state => $state.isLoadingAll);
    this.isLoadingCurrent = derived(this.store, $state => $state.isLoadingCurrent);
    this.isLoadingByRestaurant = derived(this.store, $state => $state.isLoadingByRestaurant);
    this.isCreating = derived(this.store, $state => $state.isCreating);
    this.isUpdating = derived(this.store, $state => $state.isUpdating);
    this.isDeleting = derived(this.store, $state => $state.isDeleting);
    this.error = derived(this.store, $state => $state.error);
    this.createError = derived(this.store, $state => $state.createError);
    this.updateError = derived(this.store, $state => $state.updateError);
    this.deleteError = derived(this.store, $state => $state.deleteError);
    this.allCategories = derived(this.store, $state => $state.allCategories);
    this.currentCategory = derived(this.store, $state => $state.currentCategory);
    this.isAuthenticated = derived(this.store, $state => $state.isAuthenticated);

    // Reaccionar a cambios de autenticación
    authStore.isAuthenticated.subscribe(isAuthenticated => {
      this.store.update(state => ({
        ...state,
        isAuthenticated,
        currentUserId: isAuthenticated ? authStore.getCurrentUser()?.id || null : null
      }));

      // Si el usuario se desautentica, mantener las categorías pero limpiar filtros
      if (!isAuthenticated) {
        this.clearUserFilters();
      }
    });

    // Reaccionar a cambios de usuario
    authStore.user.subscribe(user => {
      this.store.update(state => ({
        ...state,
        currentUserId: user?.id || null
      }));
    });
  }

  /**
   * Carga todas las categorías
   */
  async loadAllCategories(restaurantId?: string, forceReload: boolean = false): Promise<ApiResult<Category[]>> {
    const currentState = this.getCurrentState();
    
    // Verificar cache si no es forzado
    if (!forceReload && currentState.allCategories.length > 0 && currentState.lastUpdated.all) {
      const timeDiff = Date.now() - currentState.lastUpdated.all.getTime();
      if (timeDiff < 5 * 60 * 1000) { // 5 minutos de cache
        // Filtrar por restaurante si se especifica
        const filteredCategories = restaurantId 
          ? currentState.allCategories.filter(c => c.restaurantId === restaurantId)
          : currentState.allCategories;
        
        return {
          success: true,
          data: filteredCategories
        };
      }
    }

    this.setLoadingAll(true);
    this.clearError();

    try {
      const result = await categoryService.getAllCategories(restaurantId);

      if (result.success && result.data) {
        this.store.update(state => ({
          ...state,
          allCategories: result.data!,
          isLoadingAll: false,
          lastUpdated: {
            ...state.lastUpdated,
            all: new Date()
          },
          error: null,
          activeFilters: {
            ...state.activeFilters,
            restaurantId
          }
        }));

        return result;
      } else {
        this.setLoadingAll(false);
        this.setError(result.error || 'Error cargando categorías');
        return result;
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido cargando categorías';
      this.setLoadingAll(false);
      this.setError(errorMessage);
      
      return {
        success: false,
        error: errorMessage
      };
    }
  }

  /**
   * Obtiene una categoría específica por ID
   */
  async loadCategory(categoryId: string, forceReload: boolean = false): Promise<ApiResult<Category>> {
    // Verificar cache si no es forzado
    if (!forceReload) {
      const currentState = this.getCurrentState();
      const cached = currentState.allCategories.find(c => c.id === categoryId);
      
      if (cached) {
        this.setCurrentCategory(cached);
        return {
          success: true,
          data: cached
        };
      }
    }

    this.setLoadingCurrent(true);
    this.clearError();

    try {
      const result = await categoryService.getCategory(categoryId);

      if (result.success && result.data) {
        this.setCurrentCategory(result.data);
        this.setLoadingCurrent(false);

        return result;
      } else {
        this.setLoadingCurrent(false);
        this.setError(result.error || 'Error cargando categoría');
        return result;
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido cargando categoría';
      this.setLoadingCurrent(false);
      this.setError(errorMessage);
      
      return {
        success: false,
        error: errorMessage
      };
    }
  }

  /**
   * Carga categorías por username del restaurante
   */
  async loadCategoriesByRestaurantUsername(username: string, forceReload: boolean = false): Promise<ApiResult<Category[]>> {
    const currentState = this.getCurrentState();
    
    // Verificar cache si no es forzado
    if (!forceReload && currentState.categoriesByRestaurant[username] && currentState.lastUpdated.byRestaurant[username]) {
      const timeDiff = Date.now() - currentState.lastUpdated.byRestaurant[username].getTime();
      if (timeDiff < 5 * 60 * 1000) { // 5 minutos de cache
        return {
          success: true,
          data: currentState.categoriesByRestaurant[username]
        };
      }
    }

    this.setLoadingByRestaurant(true);
    this.clearError();

    try {
      const result = await categoryService.getCategoriesByRestaurantUsername(username);

      if (result.success && result.data) {
        this.store.update(state => ({
          ...state,
          categoriesByRestaurant: {
            ...state.categoriesByRestaurant,
            [username]: result.data!
          },
          isLoadingByRestaurant: false,
          lastUpdated: {
            ...state.lastUpdated,
            byRestaurant: {
              ...state.lastUpdated.byRestaurant,
              [username]: new Date()
            }
          },
          error: null
        }));

        return result;
      } else {
        this.setLoadingByRestaurant(false);
        this.setError(result.error || 'Error cargando categorías del restaurante');
        return result;
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido cargando categorías';
      this.setLoadingByRestaurant(false);
      this.setError(errorMessage);
      
      return {
        success: false,
        error: errorMessage
      };
    }
  }

  /**
   * Crea una nueva categoría
   */
  async createCategory(categoryData: CategoryCreateRequest): Promise<CreateCategoryResult> {
    if (!this.getCurrentState().isAuthenticated) {
      return {
        success: false,
        error: 'Debes estar autenticado para crear categorías'
      };
    }

    this.setCreating(true);
    this.clearCreateError();

    try {
      const result = await categoryService.createCategory(categoryData);

      if (result.success && result.data) {
        // Actualizar cache local
        this.store.update(state => ({
          ...state,
          allCategories: [result.data!, ...state.allCategories],
          currentCategory: result.data!,
          isCreating: false,
          createError: null,
          lastUpdated: {
            ...state.lastUpdated,
            all: new Date()
          }
        }));

        // Si tiene restaurantId, actualizar también el cache por restaurante
        if (result.data.restaurantId) {
          this.updateRestaurantCache(result.data.restaurantId, result.data, 'add');
        }

        return {
          success: true,
          category: result.data
        };
      } else {
        this.setCreating(false);
        this.setCreateError(result.error || 'Error creando categoría');
        
        return {
          success: false,
          error: result.error || 'Error creando categoría'
        };
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido creando categoría';
      this.setCreating(false);
      this.setCreateError(errorMessage);
      
      return {
        success: false,
        error: errorMessage
      };
    }
  }

  /**
   * Actualiza una categoría existente
   */
  async updateCategory(
    categoryId: string,
    categoryData: CategoryUpdateRequest
  ): Promise<UpdateCategoryResult> {
    if (!this.getCurrentState().isAuthenticated) {
      return {
        success: false,
        error: 'Debes estar autenticado para actualizar categorías'
      };
    }

    this.setUpdating(true);
    this.clearUpdateError();

    try {
      const result = await categoryService.updateCategory(categoryId, categoryData);

      if (result.success && result.data) {
        // Actualizar cache local
        this.store.update(state => {
          const updateCategoryInArray = (categories: Category[]) =>
            categories.map(c => c.id === categoryId ? result.data! : c);

          return {
            ...state,
            allCategories: updateCategoryInArray(state.allCategories),
            currentCategory: state.currentCategory?.id === categoryId ? result.data! : state.currentCategory,
            isUpdating: false,
            updateError: null,
            lastUpdated: {
              ...state.lastUpdated,
              all: new Date(),
              current: new Date()
            }
          };
        });

        // Actualizar cache por restaurante si aplica
        if (result.data.restaurantId) {
          this.updateRestaurantCache(result.data.restaurantId, result.data, 'update');
        }

        return {
          success: true,
          category: result.data
        };
      } else {
        this.setUpdating(false);
        this.setUpdateError(result.error || 'Error actualizando categoría');
        
        return {
          success: false,
          error: result.error || 'Error actualizando categoría'
        };
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido actualizando categoría';
      this.setUpdating(false);
      this.setUpdateError(errorMessage);
      
      return {
        success: false,
        error: errorMessage
      };
    }
  }

  /**
   * Elimina una categoría
   */
  async deleteCategory(categoryId: string): Promise<DeleteCategoryResult> {
    if (!this.getCurrentState().isAuthenticated) {
      return {
        success: false,
        error: 'Debes estar autenticado para eliminar categorías'
      };
    }

    this.setDeleting(true);
    this.clearDeleteError();

    try {
      // Obtener la categoría antes de eliminarla para actualizar el cache por restaurante
      const categoryToDelete = this.getCurrentState().allCategories.find(c => c.id === categoryId);
      
      const result = await categoryService.deleteCategory(categoryId);

      if (result.success) {
        // Actualizar cache local
        this.store.update(state => {
          const filterCategories = (categories: Category[]) =>
            categories.filter(c => c.id !== categoryId);

          return {
            ...state,
            allCategories: filterCategories(state.allCategories),
            currentCategory: state.currentCategory?.id === categoryId ? null : state.currentCategory,
            isDeleting: false,
            deleteError: null,
            lastUpdated: {
              ...state.lastUpdated,
              all: new Date()
            }
          };
        });

        // Actualizar cache por restaurante si aplica
        if (categoryToDelete?.restaurantId) {
          this.updateRestaurantCache(categoryToDelete.restaurantId, categoryToDelete, 'remove');
        }

        return {
          success: true,
          message: result.data?.message || 'Categoría eliminada correctamente'
        };
      } else {
        this.setDeleting(false);
        this.setDeleteError(result.error || 'Error eliminando categoría');
        
        return {
          success: false,
          error: result.error || 'Error eliminando categoría'
        };
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido eliminando categoría';
      this.setDeleting(false);
      this.setDeleteError(errorMessage);
      
      return {
        success: false,
        error: errorMessage
      };
    }
  }

  /**
   * Actualiza el cache por restaurante
   */
  private updateRestaurantCache(restaurantId: string, category: Category, action: 'add' | 'update' | 'remove'): void {
    // Necesitaríamos el username del restaurante para actualizar el cache
    // Por ahora, simplemente invalidamos el cache para forzar recarga
    this.store.update(state => {
      const newByRestaurant = { ...state.lastUpdated.byRestaurant };
      
      // Encontrar claves que correspondan a este restaurante e invalidar
      Object.keys(state.categoriesByRestaurant).forEach(key => {
        const categories = state.categoriesByRestaurant[key];
        if (categories.some(c => c.restaurantId === restaurantId)) {
          delete newByRestaurant[key];
        }
      });

      return {
        ...state,
        lastUpdated: {
          ...state.lastUpdated,
          byRestaurant: newByRestaurant
        }
      };
    });
  }

  /**
   * Búsqueda local de categorías
   */
  searchCategories(searchTerm: string, restaurantId?: string): Category[] {
    const currentState = this.getCurrentState();
    let categories = currentState.allCategories;

    // Filtrar por restaurante si se especifica
    if (restaurantId) {
      categories = categories.filter(c => c.restaurantId === restaurantId);
    }

    // Filtrar por término de búsqueda
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase().trim();
      categories = categories.filter(category =>
        category.name.toLowerCase().includes(term) ||
        (category.description && category.description.toLowerCase().includes(term))
      );
    }

    return categories;
  }

  /**
   * Obtiene categorías agrupadas por restaurante
   */
  getCategoriesGroupedByRestaurant(): { [restaurantId: string]: Category[] } {
    const currentState = this.getCurrentState();
    return categoryService.utils.groupByRestaurant(currentState.allCategories);
  }

  /**
   * Verifica si un nombre de categoría es único
   */
  isNameUnique(name: string, excludeId?: string, restaurantId?: string): boolean {
    const currentState = this.getCurrentState();
    return categoryService.utils.isNameUnique(currentState.allCategories, name, excludeId, restaurantId);
  }

  /**
   * Genera estadísticas de categorías
   */
  getStats(): {
    total: number;
    byRestaurant: { [restaurantId: string]: number };
    withDescription: number;
    withoutDescription: number;
  } {
    const currentState = this.getCurrentState();
    return categoryService.utils.generateStats(currentState.allCategories);
  }

  /**
   * Métodos de utilidad privados
   */
  private setLoadingAll(isLoading: boolean): void {
    this.store.update(state => ({ ...state, isLoadingAll: isLoading }));
  }

  private setLoadingCurrent(isLoading: boolean): void {
    this.store.update(state => ({ ...state, isLoadingCurrent: isLoading }));
  }

  private setLoadingByRestaurant(isLoading: boolean): void {
    this.store.update(state => ({ ...state, isLoadingByRestaurant: isLoading }));
  }

  private setCreating(isCreating: boolean): void {
    this.store.update(state => ({ ...state, isCreating }));
  }

  private setUpdating(isUpdating: boolean): void {
    this.store.update(state => ({ ...state, isUpdating }));
  }

  private setDeleting(isDeleting: boolean): void {
    this.store.update(state => ({ ...state, isDeleting }));
  }

  private setCurrentCategory(category: Category | null): void {
    this.store.update(state => ({ 
      ...state, 
      currentCategory: category,
      lastUpdated: {
        ...state.lastUpdated,
        current: new Date()
      }
    }));
  }

  private setError(error: string | null): void {
    this.store.update(state => ({ ...state, error }));
  }

  private setCreateError(error: string | null): void {
    this.store.update(state => ({ ...state, createError: error }));
  }

  private setUpdateError(error: string | null): void {
    this.store.update(state => ({ ...state, updateError: error }));
  }

  private setDeleteError(error: string | null): void {
    this.store.update(state => ({ ...state, deleteError: error }));
  }

  private clearError(): void {
    this.setError(null);
  }

  private clearCreateError(): void {
    this.setCreateError(null);
  }

  private clearUpdateError(): void {
    this.setUpdateError(null);
  }

  private clearDeleteError(): void {
    this.setDeleteError(null);
  }

  /**
   * Limpia los filtros del usuario
   */
  private clearUserFilters(): void {
    this.store.update(state => ({
      ...state,
      activeFilters: {}
    }));
  }

  /**
   * Limpia todo el cache
   */
  clearCache(): void {
    this.store.update(state => ({
      ...state,
      allCategories: [],
      currentCategory: null,
      categoriesByRestaurant: {},
      lastUpdated: {
        all: null,
        current: null,
        byRestaurant: {}
      }
    }));
  }

  /**
   * Limpia todos los errores
   */
  clearAllErrors(): void {
    this.store.update(state => ({
      ...state,
      error: null,
      createError: null,
      updateError: null,
      deleteError: null
    }));
  }

  /**
   * Obtiene el estado actual (para uso en funciones)
   */
  getCurrentState(): CategoriesState {
    let currentState: CategoriesState;
    this.store.subscribe(state => {
      currentState = state;
    })();
    return currentState!;
  }

  /**
   * Métodos helper para obtener valores sincrónicamente
   */
  getIsLoading(): boolean {
    return this.getCurrentState().isLoading;
  }

  getError(): string | null {
    return this.getCurrentState().error;
  }

  getAllCategories(): Category[] {
    return this.getCurrentState().allCategories;
  }

  getCurrentCategory(): Category | null {
    return this.getCurrentState().currentCategory;
  }

  getCategoriesByRestaurant(restaurantId: string): Category[] {
    return this.getCurrentState().allCategories.filter(c => c.restaurantId === restaurantId);
  }

  /**
   * Stores derivados para casos específicos
   */
  getCategoryById(categoryId: string): Readable<Category | null> {
    return derived(this.store, $state => 
      $state.allCategories.find(c => c.id === categoryId) || null
    );
  }

  getCategoriesByRestaurantId(restaurantId: string): Readable<Category[]> {
    return derived(this.store, $state => 
      $state.allCategories.filter(c => c.restaurantId === restaurantId)
    );
  }

  getCategoriesWithDescription(): Readable<Category[]> {
    return derived(this.store, $state => 
      $state.allCategories.filter(c => c.description && c.description.trim())
    );
  }

  getCategoriesCount(): Readable<number> {
    return derived(this.store, $state => $state.allCategories.length);
  }

  getCategoriesCountByRestaurant(restaurantId: string): Readable<number> {
    return derived(this.store, $state => 
      $state.allCategories.filter(c => c.restaurantId === restaurantId).length
    );
  }

  /**
   * Store derivado para opciones de select
   */
  getCategorySelectOptions(restaurantId?: string, includeEmpty: boolean = true): Readable<Array<{ value: string; label: string }>> {
    return derived(this.store, $state => {
      let categories = $state.allCategories;
      
      if (restaurantId) {
        categories = categories.filter(c => c.restaurantId === restaurantId);
      }
      
      return categoryService.utils.generateSelectOptions(categories, includeEmpty);
    });
  }
}

/**
 * Instancia única del store de categorías
 */
export const categoryStore = new CategoryStore();

// Exports individuales para compatibilidad
export const categoriesLoading = categoryStore.isLoading;
export const categoriesLoadingAll = categoryStore.isLoadingAll;
export const categoriesLoadingCurrent = categoryStore.isLoadingCurrent;
export const categoriesLoadingByRestaurant = categoryStore.isLoadingByRestaurant;
export const categoriesCreating = categoryStore.isCreating;
export const categoriesUpdating = categoryStore.isUpdating;
export const categoriesDeleting = categoryStore.isDeleting;
export const categoriesError = categoryStore.error;
export const categoriesCreateError = categoryStore.createError;
export const categoriesUpdateError = categoryStore.updateError;
export const categoriesDeleteError = categoryStore.deleteError;
export const allCategories = categoryStore.allCategories;
export const currentCategory = categoryStore.currentCategory;
export const categoriesIsAuthenticated = categoryStore.isAuthenticated;

/**
 * Hook personalizado para usar en componentes Svelte
 */
export function useCategories() {
  const state = categoryStore.getCurrentState();

  return {
    // Estado general
    isLoading: state.isLoading,
    isLoadingAll: state.isLoadingAll,
    isLoadingCurrent: state.isLoadingCurrent,
    isLoadingByRestaurant: state.isLoadingByRestaurant,
    isCreating: state.isCreating,
    isUpdating: state.isUpdating,
    isDeleting: state.isDeleting,
    
    // Errores
    error: state.error,
    createError: state.createError,
    updateError: state.updateError,
    deleteError: state.deleteError,
    
    // Datos
    allCategories: state.allCategories,
    currentCategory: state.currentCategory,
    categoriesByRestaurant: state.categoriesByRestaurant,
    isAuthenticated: state.isAuthenticated,
    
    // Métodos
    loadAllCategories: categoryStore.loadAllCategories.bind(categoryStore),
    loadCategory: categoryStore.loadCategory.bind(categoryStore),
    loadCategoriesByRestaurantUsername: categoryStore.loadCategoriesByRestaurantUsername.bind(categoryStore),
    createCategory: categoryStore.createCategory.bind(categoryStore),
    updateCategory: categoryStore.updateCategory.bind(categoryStore),
    deleteCategory: categoryStore.deleteCategory.bind(categoryStore),
    searchCategories: categoryStore.searchCategories.bind(categoryStore),
    getCategoriesGroupedByRestaurant: categoryStore.getCategoriesGroupedByRestaurant.bind(categoryStore),
    isNameUnique: categoryStore.isNameUnique.bind(categoryStore),
    getStats: categoryStore.getStats.bind(categoryStore),
    clearCache: categoryStore.clearCache.bind(categoryStore),
    clearAllErrors: categoryStore.clearAllErrors.bind(categoryStore),
    
    // Stores reactivos (para uso en componentes)
    allCategoriesStore: categoryStore.allCategories,
    currentCategoryStore: categoryStore.currentCategory,
    isLoadingStore: categoryStore.isLoading,
    errorStore: categoryStore.error
  };
}

// Default export
export default categoryStore;