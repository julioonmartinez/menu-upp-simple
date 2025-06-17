import type { Restaurant } from "./restaurant";

// src/interfaces/restaurantRating.ts
export interface RestaurantRating {
  id: string;
  restaurantId: string;
  userId?: string;
  deviceId?: string;
  rating: number;
  comment?: string;
  timestamp: string;
  anonymous: boolean;
}
export type RestaurantSearchResult = Restaurant;

export interface RestaurantRatingCreate {
  rating: number;
  comment?: string;
  anonymous?: boolean
}

export interface RestaurantRatingUpdate {
  rating?: number;
  comment?: string;
}

export interface RestaurantRatingStats {
  averageRating: number;
  totalReviews: number;
  registeredReviews: number;
  anonymousReviews: number;
  ratingDistribution: Record<string, number>;
}

export interface RestaurantRatingsResponse {
  ratings: RestaurantRating[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    total_pages: number;
    has_next: boolean;
    has_prev: boolean;
  };
  stats: {
    total_registered: number;
    total_anonymous: number;
  };
}

export interface RestaurantSearchFilters {
  search?: string;
  minRating?: number;
  maxRating?: number;
  cuisineType?: string;
  priceRange?: string;
  features?: string[];
  sortBy?: string;
  sortOrder?: number;
}

export interface RestaurantSearchResponse {
  restaurants: RestaurantSearchResult[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    total_pages: number;
    has_next: boolean;
    has_prev: boolean;
  };
  filters_applied: Partial<RestaurantSearchFilters>;
}

export interface RestaurantRanking {
  position: number;
  restaurant: Restaurant;
  rating: number;
  totalReviews: number;
  analytics?: {
    averageRating?: number;
    reviewsCount?: number;
    visitsCount?: number;
    ordersCount?: number;
    favoritesCount?: number;
    commentsCount?: number; // NUEVO
  };
  
}

export interface FeaturedRestaurant {
  id: string;
  name: string;
  description: string;
  image?: string;
  rating: number;
  totalReviews: number;
  cuisineType: string[];
  priceRange?: string;
  username?: string;
  address?: string;
  position: number;
}

export interface FeaturedRestaurantsResponse {
  featured_restaurants: FeaturedRestaurant[];
  total_count: number;
}

// Agregar a tu interfaz Restaurant existente:
export interface RestaurantWithRatings extends Restaurant {
  analytics?: {
    averageRating?: number;
    reviewsCount?: number;
    visitsCount?: number;
    ordersCount?: number;
    favoritesCount?: number;
    commentsCount?: number; // NUEVO
  };
}

export interface RestaurantComment {
  id: string;
  restaurantId: string;
  userId?: string;
  deviceId?: string;
  comment: string;
  rating?: number;
  timestamp: string;
  anonymous: boolean;
  isEdited?: boolean;
  editedAt?: string;
}

export interface RestaurantCommentCreate {
  comment: string;
  rating?: number;
}

export interface RestaurantCommentUpdate {
  comment?: string;
  rating?: number;
}

export interface RestaurantCommentsResponse {
  comments: RestaurantComment[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    total_pages: number;
    has_next: boolean;
    has_prev: boolean;
  };
  stats: {
    total_registered: number;
    total_anonymous: number;
  };
}

/**
 * Evento de toast/notificación
 */
export interface ToastEvent {
  message: string;
  type: 'success' | 'error' | 'info';
}

/**
 * Evento de cambio de página
 */
export interface PageChangeEvent {
  page: number;
}

/**
 * Evento de búsqueda
 */
export interface SearchEvent {
  filters: RestaurantSearchFilters;
  page?: number;
}

export interface RestaurantFavorite {
  id: string;
  restaurantId: string;
  userId: string;
  timestamp: string;
  restaurant?: Restaurant; // Datos básicos del restaurante
}

export interface RestaurantFavoriteResponse {
  id: string;
  name: string;
  favoritesCount: number;
  userFav: boolean;
  message: string;
  action: 'added' | 'removed';
}

export interface UserRestaurantFavoritesResponse {
  restaurants: Restaurant[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    total_pages: number;
    has_next: boolean;
    has_prev: boolean;
  };
  total_favorites: number;
}

export interface AnonymousRestaurantFavoritesResponse extends UserRestaurantFavoritesResponse {
  anonymous: boolean;
}

export interface PopularRestaurantsResponse {
  popular_restaurants: Restaurant[];
  total_count: number;
  ranking_by: string;
  includes_anonymous: boolean;
}

export interface RestaurantFavoriteStatusResponse {
  restaurantId: string;
  isFavorite: boolean;
  authenticated?: boolean;
  anonymous?: boolean;
  userId?: string;
  deviceId?: string;
}

export interface CombinedFavoritesResponse {
  dishes: any[]; // Array de platillos favoritos
  restaurants: Restaurant[];
  deviceId: string;
  anonymous: boolean;
  counts: {
    dishes: number;
    restaurants: number;
    total: number;
  };
}

export interface FavoritesStatsResponse {
  total_favorites: {
    registered: number;
    anonymous: number;
    total: number;
  };
  top_restaurants: Restaurant[];
  most_active_users: any[] | string;
  generated_at: string;
}