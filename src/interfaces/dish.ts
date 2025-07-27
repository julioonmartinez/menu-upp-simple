import type { Promotion } from "../types/Promotion";


// src/interfaces/dish.ts

// ✅ Interface principal para platillos - actualizada para coincidir con el backend
export interface Dish {
  id?: string;
  name: string;
  description: string;
  price: number;
  categoryId: string;
  restaurantId?: string;
  position: number;
  // Imagen - soporta tanto URL simple como datos complejos
  image?: string;
  image_data?: ImageData;
  
  // Ratings y estadísticas
  rating: number;
  reviewsCount?: number;
  favorites: number;
  
  // Estados y opciones
  inStock?: boolean;
  options?: DishOption[];
  discount?: number;
  
  // Información nutricional
  nutritionalInfo?: NutritionalInfo;
  
  // Campos para uso del cliente
  userRating?: number;
  userFav?: boolean;
  quantity?: number;
  
  // Vinculación con platillo base (sistema avanzado)
  platillo_base?: PlatilloBaseReference;
  platillo_base_info?: PlatilloBaseInfo;
}

// ✅ Opciones personalizables para un platillo
export interface DishOption {
  id?: string | number; // Identificador único opcional
  name: string;
  price: number;
  description?: string;
  selected?: boolean;
}

// ✅ Información nutricional
export interface NutritionalInfo {
  calories?: number;
  protein?: number;
  carbs?: number;
  fat?: number;
  allergens?: string[];
}

// ✅ Datos de imagen (Cloudinary)
export interface ImageData {
  url: string;
  public_id?: string;
  width?: number;
  height?: number;
  format?: string;
}

// ✅ Referencia a platillo base (sistema de vinculación)
export interface PlatilloBaseReference {
  platillo_base_id: string;
  es_variacion_unica: boolean;
  variacion_descripcion?: string;
  ingredientes_adicionales: string[];
  ingredientes_removidos: string[];
  vinculado_por?: string;
  fecha_vinculacion?: Date;
  confianza_vinculacion: number;
}

// ✅ Información enriquecida del platillo base
export interface PlatilloBaseInfo {
  id: string;
  nombre: string;
  categoria_principal: string;
  subcategoria?: string;
  tipo_cocina?: string;
  tags?: string[];
  rating_promedio_global?: number;
  num_restaurantes?: number;
  estadisticas?: {
    num_restaurantes_activos: number;
    rating_promedio_global: number;
    total_platillos_vinculados: number;
  };
}

// ✅ Modelo para crear platillos
export interface DishCreate {
  name: string;
  description: string;
  price: number;
  categoryId: string;
  restaurantId?: string;
  image?: string;
  inStock?: boolean;
  options?: DishOption[];
  discount?: number;
  nutritionalInfo?: NutritionalInfo;
}

// ✅ Modelo para actualizar platillos
export interface DishUpdate {
  name?: string;
  description?: string;
  price?: number;
  image?: string;
  image_data?: ImageData;
  categoryId?: string;
  inStock?: boolean;
  options?: DishOption[];
  discount?: number;
  nutritionalInfo?: NutritionalInfo;
}

// ✅ Filtros para búsqueda avanzada
export interface DishSearchFilters {
  search?: string;
  restaurantId?: string;
  categoryId?: string;
  minRating?: number;
  maxRating?: number;
  sortBy?: 'rating' | 'comments' | 'price' | 'name';
  sortOrder?: 1 | -1;
}

// ✅ Estadísticas de rating de un platillo
export interface DishRatingStats {
  averageRating: number;
  totalRatings: number;
  totalComments: number;
  registeredRatings: number;
  anonymousRatings: number;
  ratingDistribution: { [key: string]: number };
}

// ✅ Comentario de platillo
export interface DishComment {
  id: string;
  dishId: string;
  userId?: string;
  userName?: string;
  comment: string;
  rating?: number;
  timestamp: Date;
  anonymous: boolean;
}

// ✅ Solicitud para crear comentario
export interface DishCommentCreate {
  comment: string;
  rating?: number;
}

// ✅ Solicitud para valorar platillo
export interface RatingCreate {
  rating: number;
  comment?: string;
}

// ✅ Respuesta de valoración
export interface RatingResponse {
  id: string;
  dishId: string;
  rating: number;
  comment?: string;
  anonymous: boolean;
  timestamp: string;
  message: string;
}

// ✅ Solicitud de vinculación con platillo base
export interface DishVinculacionRequest {
  platillo_base_id: string;
  es_variacion_unica: boolean;
  variacion_descripcion?: string;
  ingredientes_adicionales: string[];
  ingredientes_removidos: string[];
  confianza: number;
}

// ✅ Sugerencias de vinculación
export interface SugerenciasVinculacion {
  platillo_base_id: string;
  nombre: string;
  categoria_principal: string;
  similitud_score: number;
  razon_sugerencia: string;
  ingredientes_coincidentes: string[];
}

// ✅ Platillo con información completa del platillo base
export interface DishConPlatilloBase extends Dish {
  platillo_base_info?: PlatilloBaseInfo;
}

// ✅ Respuesta de paginación para platillos
export interface DishPaginationResponse {
  dishes: Dish[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    total_pages: number;
    has_next: boolean;
    has_prev: boolean;
  };
}

// ✅ Parámetros de paginación
export interface DishPaginationParams {
  limit?: number;
  page?: number;
  sort_by?: string;
  sort_order?: 1 | -1;
  search?: string;
}

// ✅ Respuesta de favoritos
export interface FavoriteToggleResponse {
  id: string;
  favorites: number;
  userFav: boolean;
  message: string;
}

// ✅ Platillo extendido con información del restaurante
export interface DishWithRestaurantInfo extends Dish {
  restaurant_info?: {
    id: string;
    name: string;
    username: string;
    address?: string;
    image?: string;
  };
}

// ✅ Estados de carga para componentes
export interface DishLoadingState {
  isLoading: boolean;
  isCreating: boolean;
  isUpdating: boolean;
  isDeleting: boolean;
  isRating: boolean;
  isTogglingFavorite: boolean;
  isUploadingImage: boolean;
}

// ✅ Estados de error para componentes
export interface DishErrorState {
  error: string | null;
  createError: string | null;
  updateError: string | null;
  deleteError: string | null;
  ratingError: string | null;
  favoriteError: string | null;
  imageError: string | null;
}

// ✅ Configuración para visualización de platillos
export interface DishDisplayConfig {
  showRating: boolean;
  showFavorites: boolean;
  showPrice: boolean;
  showDescription: boolean;
  showImage: boolean;
  showAvailability: boolean;
  showDiscount: boolean;
  imageSize: 'small' | 'medium' | 'large';
  layout: 'card' | 'list' | 'grid';
}

// ✅ Utilidades para validación
export interface DishValidation {
  isValid: boolean;
  errors: string[];
  warnings?: string[];
}

// ✅ Métricas de rendimiento del platillo
export interface DishMetrics {
  views: number;
  orders: number;
  conversionRate: number;
  avgOrderValue: number;
  popularityScore: number;
  trendingScore: number;
}

// ✅ Configuración de precios
export interface PricingConfig {
  currency: string;
  locale: string;
  showDecimals: boolean;
  showCurrency: boolean;
}

// ✅ Export de tipos para facilitar importación
export type DishStatus = 'draft' | 'active' | 'inactive' | 'out_of_stock';
export type DishCategory = 'appetizer' | 'main' | 'dessert' | 'beverage' | 'side' | 'special';
export type SortOrder = 'asc' | 'desc';
export type DishSortField = 'name' | 'price' | 'rating' | 'created_at' | 'updated_at' | 'popularity';

// ✅ Constantes útiles
export const DISH_CONSTANTS = {
  MAX_NAME_LENGTH: 200,
  MAX_DESCRIPTION_LENGTH: 1000,
  MIN_DESCRIPTION_LENGTH: 10,
  MAX_PRICE: 10000,
  MIN_PRICE: 0,
  MAX_DISCOUNT: 100,
  MIN_DISCOUNT: 0,
  MAX_RATING: 5,
  MIN_RATING: 0,
  DEFAULT_PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 100,
  MAX_IMAGE_SIZE_MB: 5,
  SUPPORTED_IMAGE_TYPES: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
  CACHE_DURATION_MS: 5 * 60 * 1000, // 5 minutos
  DEFAULT_CURRENCY: 'MXN',
  DEFAULT_LOCALE: 'es-MX'
} as const;

// ✅ Helper types para el store
export type DishStoreAction = 
  | 'LOAD_ALL'
  | 'LOAD_ONE'
  | 'CREATE'
  | 'UPDATE'
  | 'DELETE'
  | 'RATE'
  | 'TOGGLE_FAVORITE'
  | 'UPLOAD_IMAGE'
  | 'SEARCH';

export type DishStoreState = 
  | 'idle'
  | 'loading'
  | 'success'
  | 'error';

// ✅ Events para comunicación entre componentes
export interface DishEvent {
  type: DishStoreAction;
  payload?: any;
  timestamp: Date;
}

// ✅ Configuración del componente de platillo
export interface DishComponentConfig {
  editable: boolean;
  deletable: boolean;
  ratable: boolean;
  favoritable: boolean;
  showActions: boolean;
  showStats: boolean;
  compact: boolean;
  theme: 'light' | 'dark' | 'auto';
}

// ✅ Export por defecto para facilitar importación


// Interfaz para elementos en el carrito
export interface CartItem extends Dish {
    type: 'dish'
    quantity: number,
    item:Dish,
    selectedOptions?: DishOption[],
    totalPrice: number,  // Precio calculado con cantidad y opciones
}

// Interfaz para ofertas en el carrito
export interface PromotionCartItem {
    type: 'promo',
    id?: string;
    promotionId: string;         // ID de la promoción base
    title: string;               // Título de la promoción
    promo: Promotion;
    quantity: number;            // Cantidad de esta promoción en el carrito
    originalPrice: number;       // Precio original sin descuento
    discount: number;            // Monto del descuento aplicado
    totalPrice: number;          // Precio final con descuento
    notes?: string;              // Notas o personalizaciones adicionales
}

// Modificar la interfaz del carrito para manejar tanto platos como ofertas
export interface ShoppingCart {
    id?:string,
    items: CartItem[];             // Platos individuales
    promotions: PromotionCartItem[]; // Ofertas
    totalItems: number;           // Total de elementos (platos + ofertas)
    subtotal: number;             // Subtotal sin impuestos
    taxes: number;                  // Impuestos aplicables
    code?: string,                //código de descuento
    discount: number;             // Descuento total aplicado
    total: number;                // Total a pagar
    userId?: string;              // ID del usuario para persistencia
    createdAt?: Date;              // Fecha de creación
    updatedAt?: Date;              // Última actualización
}

// export default Dish;
