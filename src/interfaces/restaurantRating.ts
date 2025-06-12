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
  restaurants: Restaurant[];
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
  restaurant: {
    id: string;
    name: string;
    description?: string;
    image?: string;
    imageProfile?: string;
    logo?: string;
    cuisineType?: string[];
    priceRange?: string;
    address?: string;
    username?: string;
  };
  rating: number;
  totalReviews: number;
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