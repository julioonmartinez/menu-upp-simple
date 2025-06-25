// src/interfaces/dishRating.ts

export interface DishRating {
  id: string;
  dishId: string;
  rating: number;
  comment?: string;
  timestamp: string;
  anonymous: boolean;
  userId?: string;
  deviceId?: string;
  user?: {
    id: string;
    name: string;
    email?: string;
  };
}

export interface DishRatingCreate {
  rating: number;
  comment?: string;
}

export interface DishRatingUpdate {
  rating?: number;
  comment?: string;
}

export interface DishComment {
  id: string;
  dishId: string;
  comment: string;
  rating?: number;
  timestamp: string;
  anonymous: boolean;
  userId?: string;
  deviceId?: string;
  isEdited?: boolean;
  editedAt?: string;
  user?: {
    id: string;
    name: string;
    email?: string;
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

export interface DishRatingsResponse {
  ratings: DishRating[];
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

export interface DishRatingStats {
  averageRating: number;
  totalRatings: number;
  totalComments: number;
  registeredRatings: number;
  anonymousRatings: number;
  ratingDistribution: Record<string, number>;
}

export interface DishSearchFilters {
  search?: string;
  restaurantId?: string;
  categoryId?: string;
  minRating?: number;
  maxRating?: number;
  sortBy?: 'rating' | 'comments' | 'price' | 'name' | 'favorites';
  sortOrder?: 1 | -1;
}

export interface DishSearchResponse {
  dishes: Dish[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    total_pages: number;
    has_next: boolean;
    has_prev: boolean;
  };
  filters_applied: DishSearchFilters;
}

export interface TopRatedDish {
  id: string;
  name: string;
  description?: string;
  price: number;
  image?: string;
  categoryId?: string;
  restaurantId?: string;
  rating: number;
  total_ratings: number;
  favorites: number;
  position: number;
  restaurant_info?: {
    id: string;
    name: string;
    username: string;
  };
}

export interface MostCommentedDish {
  id: string;
  name: string;
  description?: string;
  price: number;
  image?: string;
  rating: number;
  comment_count: number;
  favorites: number;
  position: number;
}

export interface FavoriteDish {
  id: string;
  name: string;
  description?: string;
  price: number;
  image?: string;
  categoryId?: string;
  restaurantId?: string;
  rating: number;
  favorites: number;
  userFav: boolean;
  favoritedAt: string;
  anonymous?: boolean;
  favoriteId?: string;
  restaurant_info?: {
    id: string;
    name: string;
    username: string;
  };
}

export interface FavoriteDishesResponse {
  dishes: FavoriteDish[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    total_pages: number;
    has_next: boolean;
    has_prev: boolean;
  };
  total_favorites: number;
  anonymous?: boolean;
}

export interface Dish {
  id: string;
  name: string;
  description?: string;
  price: number;
  image?: string;
  categoryId?: string;
  restaurantId?: string;
  rating: number;
  reviewsCount: number;
  commentsCount?: number;
  favorites: number;
  userFav?: boolean;
  userRating?: number;
  inStock: boolean;
}

export interface ToggleFavoriteResponse {
  id: string;
  favorites: number;
  userFav: boolean;
  message: string;
  action?: 'added' | 'removed';
}

export interface RateDishResponse {
  id: string;
  rating: number;
  reviewsCount: number;
  userRating: number;
  message: string;
}