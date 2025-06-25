// src/interfaces/dishRating.ts
import type { Dish } from "./dish";

export interface DishRating {
  id: string;
  dishId: string;
  userId?: string;
  deviceId?: string;
  rating: number;
  comment?: string;
  timestamp: string;
  anonymous: boolean;
}

export interface DishRatingCreate {
  rating: number;
  comment?: string;
  anonymous?: boolean;
}

export interface DishRatingUpdate {
  rating?: number;
  comment?: string;
}

export interface DishComment {
  id: string;
  dishId: string;
  userId?: string;
  deviceId?: string;
  comment: string;
  rating?: number;
  timestamp: string;
  anonymous: boolean;
  isEdited?: boolean;
  editedAt?: string;
  user?: {
    id: string;
    name: string;
    email: string;
  };
}

export interface DishCommentCreate {
  comment: string;
  rating?: number;
}

export interface DishCommentUpdate {
  comment?: string;
  rating?: number;
}

export interface DishRatingStats {
  averageRating: number;
  totalRatings: number;
  totalComments: number;
  registeredRatings: number;
  anonymousRatings: number;
  ratingDistribution: Record<string, number>;
}

export interface DishCommentsResponse {
  comments: DishComment[];
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

export interface DishSearchFilters {
  search?: string;
  minRating?: number;
  maxRating?: number;
  categoryId?: string;
  restaurantId?: string;
  hasComments?: boolean;
  sortBy?: string;
  sortOrder?: number;
}

export interface DishSearchResponse {
  dishes: DishWithRatings[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    total_pages: number;
    has_next: boolean;
    has_prev: boolean;
  };
  filters_applied: Partial<DishSearchFilters>;
}

export interface DishRanking {
  position: number;
    id: string;
    name: string;
    description: string;
    price: number;
    image: string;
    categoryId: string;
    restaurantId?: string;
  rating: number;
  totalRatings: number;
  totalComments?: number;
  favorites:number,
}

export interface TopRatedDishesResponse {
  dishes: DishRanking[];
  total_count: number;
}

export interface MostCommentedDishesResponse {
  dishes: DishRanking[];
  total_count: number;
}

// Extender la interfaz Dish existente para incluir información de ratings
export interface DishWithRatings extends Dish {
  commentsCount?: number;
  lastCommentedAt?: string;
  userRating?: number;
  userComment?: string;
  hasUserRated?: boolean;
  analytics?: {
    averageRating?: number;
    totalRatings?: number;
    totalComments?: number;
    registeredRatings?: number;
    anonymousRatings?: number;
  };
}

