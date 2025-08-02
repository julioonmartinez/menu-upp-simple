// src/stores/anonymousCategoryStore.ts

import { writable, derived, type Writable, type Readable } from 'svelte/store';
import { 
  
  type ApiResult,
  type AnonymousCategoryCreateRequest,
  type AnonymousCategory,
  type AnonymousCategoriesResponse
} from '../interfaces/anonymousRestaurant.ts';
// import type { AnonymousCategory } from '../interfaces/anonymousRestaurant';
import { anonymousCategoryService } from '../services/anonymousCategoryService.ts';

// Types para el estado de categorías anónimas
export interface AnonymousCategoriesState {
  // Categorías anónimas en cache
  allAnonymousCategories: AnonymousCategory[];
  currentAnonymousCategory: AnonymousCategory | null;
  
  // Estados de carga
  isLoading: boolean;
  isLoadingAll: boolean;
  isLoadingCurrent: boolean;
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
  };
  
  // Device ID
  deviceId: string | null;
}

// Types para resultados de acciones
export interface CreateAnonymousCategoryResult {
  success: boolean;
  category?: AnonymousCategory;
  error?: string;
}

export interface UpdateAnonymousCategoryResult {
  success: boolean;
  category?: AnonymousCategory;
  error?: string;
}

export interface DeleteAnonymousCategoryResult {
  success: boolean;
  message?: string;
  error?: string;
}

/**
 * Estado inicial del store
 */
const initialState: AnonymousCategoriesState = {
  allAnonymousCategories: [],
  currentAnonymousCategory: null,
  isLoading: false,
  isLoadingAll: false,
  isLoadingCurrent: false,
  isCreating: false,
  isUpdating: false,
  isDeleting: false,
  error: null,
  createError: null,
  updateError: null,
  deleteError: null,
  lastUpdated: {
    all: null,
    current: null
  },
  deviceId: null
};

/**
 * Store para manejar categorías anónimas
 */
class AnonymousCategoryStore {
  private store: Writable<AnonymousCategoriesState>;
  
  // Exponer el subscribe del store
  public readonly subscribe: Writable<AnonymousCategoriesState>['subscribe'];
  
  // Stores derivados para estados de carga
  public readonly isLoading: Readable<boolean>;
  public readonly isLoadingAll: Readable<boolean>;
  public readonly isLoadingCurrent: Readable<boolean>;
  public readonly isCreating: Readable<boolean>;
  public readonly isUpdating: Readable<boolean>;
  public readonly isDeleting: Readable<boolean>;
  
  // Stores derivados para errores
  public readonly error: Readable<string | null>;
  public readonly createError: Readable<string | null>;
  public readonly updateError: Readable<string | null>;
  public readonly deleteError: Readable<string | null>;
  
  // Stores derivados para datos
  public readonly allAnonymousCategories: Readable<AnonymousCategory[]>;
  public readonly currentAnonymousCategory: Readable<AnonymousCategory | null>;
  public readonly deviceId: Readable<string | null>;
  
  // Stores derivados para utilidades
  public readonly categoriesCount: Readable<number>;
  public readonly sortedCategories: Readable<AnonymousCategory[]>;
  public readonly categoriesByOrder: Readable<AnonymousCategory[]>;

  constructor() {
    this.store = writable(initialState);
    this.subscribe = this.store.subscribe;

    // Stores derivados para estados de carga
    this.isLoading = derived(this.store, ($state) => $state.isLoading);
    this.isLoadingAll = derived(this.store, ($state) => $state.isLoadingAll);
    this.isLoadingCurrent = derived(this.store, ($state) => $state.isLoadingCurrent);
    this.isCreating = derived(this.store, ($state) => $state.isCreating);
    this.isUpdating = derived(this.store, ($state) => $state.isUpdating);
    this.isDeleting = derived(this.store, ($state) => $state.isDeleting);

    // Stores derivados para errores
    this.error = derived(this.store, ($state) => $state.error);
    this.createError = derived(this.store, ($state) => $state.createError);
    this.updateError = derived(this.store, ($state) => $state.updateError);
    this.deleteError = derived(this.store, ($state) => $state.deleteError);

    // Stores derivados para datos
    this.allAnonymousCategories = derived(this.store, ($state) => $state.allAnonymousCategories);
    this.currentAnonymousCategory = derived(this.store, ($state) => $state.currentAnonymousCategory);
    this.deviceId = derived(this.store, ($state) => $state.deviceId);

    // Stores derivados para utilidades
    this.categoriesCount = derived(this.store, ($state) => $state.allAnonymousCategories.length);
    this.sortedCategories = derived(this.store, ($state) => 
      anonymousCategoryService.utils.sortCategoriesByOrder($state.allAnonymousCategories)
    );
    this.categoriesByOrder = derived(this.store, ($state) => 
      [...$state.allAnonymousCategories].sort((a, b) => (a.order || 0) - (b.order || 0))
    );
  }

  /**
   * Carga todas las categorías anónimas del dispositivo actual
   */
  async loadAllAnonymousCategories(forceReload: boolean = false): Promise<ApiResult<AnonymousCategory[]>> {
    try {
      const state = this.getCurrentState();
      
      // Verificar cache si no se fuerza recarga
      if (!forceReload && state.allAnonymousCategories.length > 0 && state.lastUpdated.all) {
        const cacheAge = Date.now() - state.lastUpdated.all.getTime();
        if (cacheAge < 5 * 60 * 1000) { // 5 minutos
          console.log('📦 Usando cache de categorías anónimas');
          return {
            success: true,
            data: state.allAnonymousCategories
          };
        }
      }

      this.setLoadingAll(true);
      this.clearError();

      const result = await anonymousCategoryService.getAnonymousCategoriesByDevice();

      if (result.success) {
        this.store.update(state => ({
          ...state,
          allAnonymousCategories: result.data!.categories,
          lastUpdated: {
            ...state.lastUpdated,
            all: new Date()
          }
        }));
      } else {
        this.setError(result.error || 'Error cargando categorías anónimas');
      }

      this.setLoadingAll(false);
      return result! as unknown as ApiResult<AnonymousCategory[]>;
    } catch (error) {
      this.setLoadingAll(false);
      this.setError(error instanceof Error ? error.message : 'Error desconocido');
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido'
      };
    }
  }

  /**
   * Crea una nueva categoría anónima
   */
  async createAnonymousCategory(categoryData: AnonymousCategoryCreateRequest): Promise<CreateAnonymousCategoryResult> {
    try {
      this.setCreating(true);
      this.clearCreateError();

      const result = await anonymousCategoryService.createAnonymousCategory(categoryData);

      if (result.success) {
        // Agregar la nueva categoría al cache
        this.store.update(state => ({
          ...state,
          allAnonymousCategories: [...state.allAnonymousCategories, result.data!],
          currentAnonymousCategory: result.data!
        }));
      } else {
        this.setCreateError(result.error || 'Error creando categoría anónima');
      }

      this.setCreating(false);
      return {
        success: result.success,
        category: result.data,
        error: result.error
      };
    } catch (error) {
      this.setCreating(false);
      this.setCreateError(error instanceof Error ? error.message : 'Error desconocido');
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido'
      };
    }
  }

  /**
   * Obtiene una categoría anónima por su ID
   */
  async getAnonymousCategory(categoryId: string): Promise<ApiResult<AnonymousCategory>> {
    try {
      this.setLoadingCurrent(true);
      this.clearError();

      const result = await anonymousCategoryService.getAnonymousCategory(categoryId);

      if (result.success) {
        this.store.update(state => ({
          ...state,
          currentAnonymousCategory: result.data!,
          lastUpdated: {
            ...state.lastUpdated,
            current: new Date()
          }
        }));
      } else {
        this.setError(result.error || 'Error obteniendo categoría anónima');
      }

      this.setLoadingCurrent(false);
      return result;
    } catch (error) {
      this.setLoadingCurrent(false);
      this.setError(error instanceof Error ? error.message : 'Error desconocido');
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido'
      };
    }
  }

  /**
   * Actualiza una categoría anónima
   */
  async updateAnonymousCategory(
    categoryId: string,
    categoryData: AnonymousCategoryCreateRequest
  ): Promise<UpdateAnonymousCategoryResult> {
    try {
      this.setUpdating(true);
      this.clearUpdateError();

      const result = await anonymousCategoryService.updateAnonymousCategory(categoryId, categoryData);

      if (result.success) {
        // Actualizar la categoría en el cache
        this.store.update(state => ({
          ...state,
          allAnonymousCategories: state.allAnonymousCategories.map(c => 
            c.id === categoryId ? result.data! : c
          ),
          currentAnonymousCategory: state.currentAnonymousCategory?.id === categoryId 
            ? result.data! 
            : state.currentAnonymousCategory
        }));
      } else {
        this.setUpdateError(result.error || 'Error actualizando categoría anónima');
      }

      this.setUpdating(false);
      return {
        success: result.success,
        category: result.data,
        error: result.error
      };
    } catch (error) {
      this.setUpdating(false);
      this.setUpdateError(error instanceof Error ? error.message : 'Error desconocido');
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido'
      };
    }
  }

  /**
   * Elimina una categoría anónima
   */
  async deleteAnonymousCategory(categoryId: string): Promise<DeleteAnonymousCategoryResult> {
    try {
      this.setDeleting(true);
      this.clearDeleteError();

      const result = await anonymousCategoryService.deleteAnonymousCategory(categoryId);

      if (result.success) {
        // Remover la categoría del cache
        this.store.update(state => ({
          ...state,
          allAnonymousCategories: state.allAnonymousCategories.filter(c => c.id !== categoryId),
          currentAnonymousCategory: state.currentAnonymousCategory?.id === categoryId 
            ? null 
            : state.currentAnonymousCategory
        }));
      } else {
        this.setDeleteError(result.error || 'Error eliminando categoría anónima');
      }

      this.setDeleting(false);
      return {
        success: result.success,
        message: result.data?.message,
        error: result.error
      };
    } catch (error) {
      this.setDeleting(false);
      this.setDeleteError(error instanceof Error ? error.message : 'Error desconocido');
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido'
      };
    }
  }

  // Métodos privados para actualizar estados
  private setLoadingAll(isLoading: boolean): void {
    this.store.update(state => ({ ...state, isLoadingAll: isLoading }));
  }

  private setLoadingCurrent(isLoading: boolean): void {
    this.store.update(state => ({ ...state, isLoadingCurrent: isLoading }));
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

  private setCurrentAnonymousCategory(category: AnonymousCategory | null): void {
    this.store.update(state => ({ ...state, currentAnonymousCategory: category }));
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

  // Métodos públicos para limpiar datos
  clearCache(): void {
    this.store.update(state => ({
      ...state,
      allAnonymousCategories: [],
      currentAnonymousCategory: null,
      lastUpdated: {
        all: null,
        current: null
      }
    }));
  }

  clearAllErrors(): void {
    this.store.update(state => ({
      ...state,
      error: null,
      createError: null,
      updateError: null,
      deleteError: null
    }));
  }

  // Métodos públicos para obtener estado actual
  getCurrentState(): AnonymousCategoriesState {
    let state: AnonymousCategoriesState;
    this.store.subscribe(s => state = s)();
    return state!;
  }

  getIsLoading(): boolean {
    let isLoading: boolean;
    this.isLoading.subscribe(i => isLoading = i)();
    return isLoading!;
  }

  getError(): string | null {
    let error: string | null;
    this.error.subscribe(e => error = e)();
    return error!;
  }

  getAllAnonymousCategories(): AnonymousCategory[] {
    let categories: AnonymousCategory[];
    this.allAnonymousCategories.subscribe(c => categories = c)();
    return categories!;
  }

  getCurrentAnonymousCategory(): AnonymousCategory | null {
    let category: AnonymousCategory | null;
    this.currentAnonymousCategory.subscribe(c => category = c)();
    return category!;
  }

  // Stores derivados para utilidades
  getAnonymousCategoryById(categoryId: string): Readable<AnonymousCategory | null> {
    return derived(this.allAnonymousCategories, (categories) => 
      categories.find(c => c.id === categoryId) || null
    );
  }

  getAnonymousCategoriesCount(): Readable<number> {
    return derived(this.allAnonymousCategories, (categories) => categories.length);
  }

  getNextAvailableOrder(): Readable<number> {
    return derived(this.allAnonymousCategories, (categories) => 
      anonymousCategoryService.utils.getNextAvailableOrder(categories)
    );
  }

  getCategoriesByOrder(): Readable<AnonymousCategory[]> {
    return derived(this.allAnonymousCategories, (categories) => 
      anonymousCategoryService.utils.sortCategoriesByOrder(categories)
    );
  }
}

// Crear y exportar una instancia única del store
export const anonymousCategoryStore = new AnonymousCategoryStore();

// Hook para usar el store en componentes
export function useAnonymousCategories() {
  return {
    // Estados de carga
    isLoading: anonymousCategoryStore.isLoading,
    isLoadingAll: anonymousCategoryStore.isLoadingAll,
    isLoadingCurrent: anonymousCategoryStore.isLoadingCurrent,
    isCreating: anonymousCategoryStore.isCreating,
    isUpdating: anonymousCategoryStore.isUpdating,
    isDeleting: anonymousCategoryStore.isDeleting,
    
    // Errores
    error: anonymousCategoryStore.error,
    createError: anonymousCategoryStore.createError,
    updateError: anonymousCategoryStore.updateError,
    deleteError: anonymousCategoryStore.deleteError,
    
    // Datos
    allAnonymousCategories: anonymousCategoryStore.allAnonymousCategories,
    currentAnonymousCategory: anonymousCategoryStore.currentAnonymousCategory,
    deviceId: anonymousCategoryStore.deviceId,
    
    // Utilidades
    categoriesCount: anonymousCategoryStore.categoriesCount,
    sortedCategories: anonymousCategoryStore.sortedCategories,
    categoriesByOrder: anonymousCategoryStore.categoriesByOrder,
    
    // Métodos
    loadAllAnonymousCategories: anonymousCategoryStore.loadAllAnonymousCategories.bind(anonymousCategoryStore),
    createAnonymousCategory: anonymousCategoryStore.createAnonymousCategory.bind(anonymousCategoryStore),
    getAnonymousCategory: anonymousCategoryStore.getAnonymousCategory.bind(anonymousCategoryStore),
    updateAnonymousCategory: anonymousCategoryStore.updateAnonymousCategory.bind(anonymousCategoryStore),
    deleteAnonymousCategory: anonymousCategoryStore.deleteAnonymousCategory.bind(anonymousCategoryStore),
    clearCache: anonymousCategoryStore.clearCache.bind(anonymousCategoryStore),
    clearAllErrors: anonymousCategoryStore.clearAllErrors.bind(anonymousCategoryStore),
    
    // Stores derivados
    getAnonymousCategoryById: anonymousCategoryStore.getAnonymousCategoryById.bind(anonymousCategoryStore),
    getAnonymousCategoriesCount: anonymousCategoryStore.getAnonymousCategoriesCount.bind(anonymousCategoryStore),
    getNextAvailableOrder: anonymousCategoryStore.getNextAvailableOrder.bind(anonymousCategoryStore),
    getCategoriesByOrder: anonymousCategoryStore.getCategoriesByOrder.bind(anonymousCategoryStore)
  };
}

export default anonymousCategoryStore; 