// src/interfaces/anonymousRestaurant.ts

import type { Restaurant } from './restaurant';

// Tipos para resultados de API
export interface ApiResult<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface ApiError {
  detail: string;
  status?: number;
}

// Interface para crear restaurante anónimo
export interface AnonymousRestaurantCreateRequest {
  name: string;
  description?: string;
  address?: string;
  phone?: string;
  email?: string;
  website?: string;
  schedule?: string;
  primaryColor?: string;
  secondaryColor?: string;
  textColor?: string;
  fontFamily?: string;
  features?: string[];
  cuisineType?: string[];
  paymentMethods?: string[];
  priceRange?: "low" | "medium" | "high" | "premium";
  showRatings?: boolean;
  allowReviews?: boolean;
  allowOrders?: boolean;
  active?: boolean;
  planType?: string;
  // Hero slides
  heroSlides?: Array<{
    title: string;
    subtitle: string;
    alt?: string;
  }>;
}

// Interface para restaurante anónimo completo
export interface AnonymousRestaurant extends Omit<Restaurant, 'ownerId'> {
  device_id: string;
  claim_code: string;
  expires_at: string;
  is_claimed: boolean;
  claimed_by?: string;
  claimed_at?: string;
  days_remaining: number;
}

// Interface para reclamar restaurante
export interface RestaurantClaimRequest {
  claim_code: string;
  email: string;
  password: string;
  name: string;
}

// Interface para respuesta de reclamación
export interface RestaurantClaimResponse {
  user: {
    id: string;
    email: string;
    name: string;
    role: string;
    plan_type: string;
  };
  restaurant: Restaurant;
  message: string;
  access_token?: string;
}

// Interface para respuesta de restaurante anónimo
export interface AnonymousRestaurantResponse {
  restaurant: AnonymousRestaurant;
  days_remaining: number;
  can_claim: boolean;
  claim_url: string;
}

// Interface para estadísticas de limpieza
export interface CleanupStats {
  total_anonymous: number;
  claimed_anonymous: number;
  expired_anonymous: number;
  active_anonymous: number;
}

// Interface para categoría anónima
export interface AnonymousCategory {
  id: string;
  name: string;
  description?: string;
  device_id: string;
  order?: number;
  createdAt: string;
  updatedAt: string;
}

// Interface para crear categoría anónima
export interface AnonymousCategoryCreateRequest {
  name: string;
  description?: string;
  order?: number;
}

// Interface para platillo anónimo
export interface AnonymousDish {
  id: string;
  name: string;
  description?: string;
  price: number;
  categoryId: string;
  device_id: string;
  rating: number;
  reviewsCount: number;
  favorites: number;
  image?: string;
  inStock?: boolean;
  createdAt: string;
  updatedAt: string;
}

// Interface para crear platillo anónimo
export interface AnonymousDishCreateRequest {
  name: string;
  description?: string;
  price: number;
  categoryId: string;
  inStock?: boolean;
}

// Interface para actualizar platillo anónimo
export interface AnonymousDishUpdateRequest {
  name?: string;
  description?: string;
  price?: number;
  categoryId?: string;
  inStock?: boolean;
}

// Interface para respuesta de categorías anónimas
export interface AnonymousCategoriesResponse {
  success: boolean;
  categories: AnonymousCategory[];
  total_count: number;
}

// Interface para respuesta de platillos anónimos
export interface AnonymousDishesResponse {
  success: boolean;
  dishes: AnonymousDish[];
  total_count: number;
  page: number;
  limit: number;
  total_pages: number;
}

// Interface para respuesta de restaurantes anónimos por device
export interface AnonymousRestaurantsByDeviceResponse {
  success: boolean;
  restaurants: AnonymousRestaurant[];
  total_count: number;
  active_count: number;
}

// Interface para crear restaurante anónimo con imágenes
export interface AnonymousRestaurantCreateWithImagesRequest extends AnonymousRestaurantCreateRequest {
  images?: {
    image?: File;
    logo?: File;
    profile_image?: File;
    cover_image?: File;
    text_image?: File;
    qr_code?: File;
    hero_slides?: File[];
  };
}

// Interface para respuesta de creación de restaurante anónimo
export interface AnonymousRestaurantCreateResponse {
  success: boolean;
  message: string;
  restaurant: AnonymousRestaurant;
  claim_code: string;
  expires_at: string;
  days_remaining: number;
  claim_url: string;
}

// Interface para respuesta de consulta por claim code
export interface AnonymousRestaurantByClaimCodeResponse {
  success: boolean;
  restaurant?: AnonymousRestaurant;
  can_claim?: boolean;
  days_remaining?: number;
  claim_url?: string;
  message?: string;
} 