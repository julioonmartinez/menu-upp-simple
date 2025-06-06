// src/interfaces/restaurant.ts
export interface ImageData {
  url: string;
  public_id?: string;
  width?: number;
  height?: number;
  format?: string;
}

export interface SocialLinks {
  facebook?: string;
  instagram?: string;
  twitter?: string;
  tiktok?: string;
  youtube?: string;
  linkedin?: string;
  whatsapp?: string;
  telegram?: string;
  pinterest?: string;
  snapchat?: string;
  other?: string;
}

export interface Restaurant {
  id?: string;
  name?: string;
  username?: string; // Slug único para la URL
  description?: string;
  isPremium?: boolean;
  
  // Contacto y ubicación
  address?: string;
  phone?: string;
  email?: string;
  website?: string;
  coordinates?: {
    latitude?: number;
    longitude?: number;
  };
  
  // Horarios
  schedule?: string;
  businessHours?: {
    monday?: { open?: string; close?: string; closed?: boolean };
    tuesday?: { open?: string; close?: string; closed?: boolean };
    wednesday?: { open?: string; close?: string; closed?: boolean };
    thursday?: { open?: string; close?: string; closed?: boolean };
    friday?: { open?: string; close?: string; closed?: boolean };
    saturday?: { open?: string; close?: string; closed?: boolean };
    sunday?: { open?: string; close?: string; closed?: boolean };
  };
  
  // Identidad visual
  logo?: string;
  imageProfile?: string;
  imageCover?: string;
  image?: string;
  primaryColor?: string;
  secondaryColor?: string;
  fontFamily?: string;
  imageText?: string;
  imageText_data?: ImageData;
  
  // Redes sociales
  socialLinks?: SocialLinks;
  
  // Características
  features?: string[];
  cuisineType?: string[];
  paymentMethods?: string[];
  priceRange?: "low" | "medium" | "high" | "premium";
  
  // Configuraciones técnicas
  qrCode?: string;
  customDomain?: string;
  showRatings?: boolean;
  allowReviews?: boolean;
  allowOrders?: boolean;
  
  // Meta-información
  ownerId?: string;
  active?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
  planType?: "free" | "basic" | "premium" | "enterprise";
  
  // Analíticas
  analytics?: {
    visitsCount?: number;
    ordersCount?: number;
    favoritesCount?: number;
    reviewsCount?: number;
    averageRating?: number;
  };
}

