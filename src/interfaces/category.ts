// src/interfaces/category.ts

// ✅ Interface principal para categorías - coincide con el backend
export interface Category {
  id?: string;
  name: string;
  description?: string;
  restaurantId?: string;
  order?: number;
}

// ✅ Modelo para crear categorías
export interface CategoryCreate {
  name: string;
  description?: string;
  restaurantId?: string;
}

// ✅ Modelo para actualizar categorías
export interface CategoryUpdate {
  name?: string;
  description?: string;
}

// ✅ Categoría con información adicional del restaurante
export interface CategoryWithRestaurantInfo extends Category {
  restaurant_info?: {
    id: string;
    name: string;
    username: string;
    address?: string;
    image?: string;
  };
}

// ✅ Categoría con estadísticas de platillos
export interface CategoryWithStats extends Category {
  dishCount: number;
  avgDishPrice: number;
  avgDishRating: number;
  totalDishRatings: number;
  popularDishes: string[]; // IDs de platillos más populares
}

// ✅ Filtros para búsqueda de categorías
export interface CategorySearchFilters {
  search?: string;
  restaurantId?: string;
  hasDescription?: boolean;
  sortBy?: 'name' | 'dishCount' | 'created_at';
  sortOrder?: 'asc' | 'desc';
}

// ✅ Estados de carga para componentes
export interface CategoryLoadingState {
  isLoading: boolean;
  isCreating: boolean;
  isUpdating: boolean;
  isDeleting: boolean;
  isLoadingStats: boolean;
}

// ✅ Estados de error para componentes
export interface CategoryErrorState {
  error: string | null;
  createError: string | null;
  updateError: string | null;
  deleteError: string | null;
  statsError: string | null;
}

// ✅ Configuración para visualización de categorías
export interface CategoryDisplayConfig {
  showDescription: boolean;
  showDishCount: boolean;
  showRestaurantInfo: boolean;
  showActions: boolean;
  layout: 'card' | 'list' | 'grid' | 'select';
  imageSize: 'small' | 'medium' | 'large';
  maxDescriptionLength: number;
}

// ✅ Validación de categorías
export interface CategoryValidation {
  isValid: boolean;
  errors: string[];
  warnings?: string[];
}

// ✅ Estadísticas de categorías
export interface CategoryStats {
  total: number;
  byRestaurant: { [restaurantId: string]: number };
  withDescription: number;
  withoutDescription: number;
  avgDishesPerCategory: number;
  mostPopularCategories: Category[];
}

// ✅ Agrupación de categorías por restaurante
export interface CategoryGroup {
  restaurantId: string;
  restaurantName?: string;
  categories: Category[];
  totalDishes: number;
}

// ✅ Opciones para select de categorías
export interface CategorySelectOption {
  value: string;
  label: string;
  description?: string;
  disabled?: boolean;
  group?: string;
}

// ✅ Historial de cambios de categoría
export interface CategoryChange {
  id: string;
  categoryId: string;
  action: 'created' | 'updated' | 'deleted';
  changes: Partial<Category>;
  userId: string;
  userName: string;
  timestamp: Date;
  reason?: string;
}

// ✅ Configuración de ordenamiento
export interface CategorySortConfig {
  field: 'name' | 'description' | 'dishCount' | 'created_at' | 'updated_at';
  direction: 'asc' | 'desc';
  nullsLast: boolean;
}

// ✅ Parámetros de paginación para categorías
export interface CategoryPaginationParams {
  page?: number;
  limit?: number;
  search?: string;
  restaurantId?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

// ✅ Respuesta de paginación para categorías
export interface CategoryPaginationResponse {
  categories: Category[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    total_pages: number;
    has_next: boolean;
    has_prev: boolean;
  };
}

// ✅ Cache de categorías
export interface CategoryCache {
  allCategories: Category[];
  byRestaurant: { [restaurantId: string]: Category[] };
  byId: { [categoryId: string]: Category };
  lastUpdated: Date;
  ttl: number; // Time to live en millisegundos
}

// ✅ Métricas de categorías
export interface CategoryMetrics {
  categoryId: string;
  views: number;
  dishViews: number;
  orders: number;
  revenue: number;
  popularityScore: number;
  trendinessScore: number;
  conversionRate: number;
}

// ✅ Configuración del componente de categoría
export interface CategoryComponentConfig {
  editable: boolean;
  deletable: boolean;
  showDishCount: boolean;
  showStats: boolean;
  allowReorder: boolean;
  showDescription: boolean;
  compact: boolean;
  theme: 'light' | 'dark' | 'auto';
}

// ✅ Evento de categoría para comunicación entre componentes
export interface CategoryEvent {
  type: 'CREATED' | 'UPDATED' | 'DELETED' | 'SELECTED' | 'REORDERED';
  category: Category;
  payload?: any;
  timestamp: Date;
}

// ✅ Plantilla de categoría
export interface CategoryTemplate {
  id: string;
  name: string;
  description: string;
  icon?: string;
  color?: string;
  tags: string[];
  isDefault: boolean;
  restaurantTypes: string[]; // Tipos de restaurante donde aplica
}

// ✅ Configuración de importación/exportación
export interface CategoryImportConfig {
  format: 'json' | 'csv' | 'xlsx';
  includeDescription: boolean;
  overwriteExisting: boolean;
  validateNames: boolean;
  defaultRestaurantId?: string;
}

export interface CategoryExportConfig {
  format: 'json' | 'csv' | 'xlsx';
  includeStats: boolean;
  includeRestaurantInfo: boolean;
  includeDescription: boolean;
  dateRange?: {
    start: Date;
    end: Date;
  };
}

// ✅ Reglas de validación personalizadas
export interface CategoryValidationRules {
  minNameLength: number;
  maxNameLength: number;
  maxDescriptionLength: number;
  allowDuplicateNames: boolean;
  requiredFields: (keyof Category)[];
  customValidators?: ((category: Category) => string[])[];
}

// ✅ Configuración de permisos
export interface CategoryPermissions {
  canCreate: boolean;
  canUpdate: boolean;
  canDelete: boolean;
  canView: boolean;
  canManageAll: boolean; // Para administradores
  restrictToOwnRestaurant: boolean;
}

// ✅ Analíticas de categorías
export interface CategoryAnalytics {
  categoryId: string;
  period: 'day' | 'week' | 'month' | 'year';
  metrics: {
    views: number;
    uniqueViews: number;
    dishClicks: number;
    orders: number;
    revenue: number;
    conversionRate: number;
    avgTimeSpent: number;
    bounceRate: number;
  };
  trends: {
    viewsChange: number;
    ordersChange: number;
    revenueChange: number;
  };
  topDishes: Array<{
    dishId: string;
    dishName: string;
    views: number;
    orders: number;
  }>;
}

// ✅ Tipos auxiliares
export type CategoryStatus = 'active' | 'inactive' | 'archived';
export type CategoryType = 'food' | 'beverage' | 'special' | 'promotion';
export type CategorySortField = 'name' | 'description' | 'dishCount' | 'created_at' | 'updated_at';

// ✅ Constantes útiles
export const CATEGORY_CONSTANTS = {
  MAX_NAME_LENGTH: 100,
  MIN_NAME_LENGTH: 2,
  MAX_DESCRIPTION_LENGTH: 500,
  DEFAULT_PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 100,
  CACHE_DURATION_MS: 5 * 60 * 1000, // 5 minutos
  MAX_CATEGORIES_PER_RESTAURANT: 50,
  DEFAULT_SORT_FIELD: 'name' as CategorySortField,
  DEFAULT_SORT_ORDER: 'asc' as const
} as const;

// ✅ Helper types para el store
export type CategoryStoreAction = 
  | 'LOAD_ALL'
  | 'LOAD_ONE'
  | 'LOAD_BY_RESTAURANT'
  | 'CREATE'
  | 'UPDATE'
  | 'DELETE'
  | 'SEARCH'
  | 'CLEAR_CACHE';

export type CategoryStoreState = 
  | 'idle'
  | 'loading'
  | 'success'
  | 'error';

// ✅ Utilidades para trabajar con categorías
export interface CategoryUtils {
  formatName: (name: string) => string;
  generateSlug: (name: string) => string;
  validateUniqueness: (categories: Category[], name: string, excludeId?: string) => boolean;
  sortCategories: (categories: Category[], config: CategorySortConfig) => Category[];
  filterCategories: (categories: Category[], filters: CategorySearchFilters) => Category[];
  groupByRestaurant: (categories: Category[]) => CategoryGroup[];
  generateSelectOptions: (categories: Category[], includeEmpty?: boolean) => CategorySelectOption[];
  calculateStats: (categories: Category[]) => CategoryStats;
  exportToCSV: (categories: Category[], config: CategoryExportConfig) => string;
  importFromCSV: (csvData: string, config: CategoryImportConfig) => Category[];
}

// ✅ Configuración del formulario de categoría
export interface CategoryFormConfig {
  showDescription: boolean;
  descriptionRequired: boolean;
  showRestaurantSelector: boolean;
  allowTemplateSelection: boolean;
  validationRules: CategoryValidationRules;
  autoSave: boolean;
  confirmOnDelete: boolean;
}

// ✅ Estado del formulario
export interface CategoryFormState {
  data: Partial<Category>;
  errors: { [field: string]: string };
  touched: { [field: string]: boolean };
  isValid: boolean;
  isDirty: boolean;
  isSubmitting: boolean;
}

