// src/utils/restaurantUtils.ts

import type { Restaurant } from '../interfaces/restaurant.ts';
import { restaurantService } from '../services/restaurantService.ts';

/**
 * Utilidades para trabajar con restaurantes
 */

/**
 * Validador de archivos de imagen
 */
export interface ImageValidationResult {
  isValid: boolean;
  error?: string;
  warnings?: string[];
}

export function validateImageFile(file: File): ImageValidationResult {
  const result: ImageValidationResult = { isValid: true, warnings: [] };
  
  // Verificar que sea un archivo de imagen
  if (!file.type.startsWith('image/')) {
    result.isValid = false;
    result.error = 'El archivo debe ser una imagen';
    return result;
  }
  
  // Verificar tamaño (5MB máximo)
  const maxSize = 5 * 1024 * 1024; // 5MB
  if (file.size > maxSize) {
    result.isValid = false;
    result.error = 'El archivo es muy grande. Máximo 5MB permitido';
    return result;
  }
  
  // Verificar formatos recomendados
  const recommendedFormats = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  if (!recommendedFormats.includes(file.type.toLowerCase())) {
    result.warnings?.push('Se recomienda usar formatos JPEG, PNG o WebP para mejor compatibilidad');
  }
  
  // Advertencias sobre tamaño óptimo
  const optimalSize = 2 * 1024 * 1024; // 2MB
  if (file.size > optimalSize) {
    result.warnings?.push('Para mejor rendimiento, se recomienda un tamaño menor a 2MB');
  }
  
  return result;
}

/**
 * Genera un slug único a partir del nombre del restaurante
 */
export function generateRestaurantSlug(name: string, existingRestaurants: Restaurant[] = []): string {
  let baseSlug = name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remover acentos
    .replace(/[^a-z0-9\s-]/g, '') // Solo letras, números, espacios y guiones
    .replace(/\s+/g, '-') // Reemplazar espacios con guiones
    .replace(/-+/g, '-') // Remover guiones duplicados
    .replace(/^-|-$/g, ''); // Remover guiones al inicio y final
  
  // Limitar longitud
  baseSlug = baseSlug.substring(0, 50);
  
  // Verificar unicidad
  let slug = baseSlug;
  let counter = 1;
  
  while (existingRestaurants.some(r => r.username === slug)) {
    slug = `${baseSlug}-${counter}`;
    counter++;
  }
  
  return slug;
}

/**
 * Formateador de información de contacto
 */
export class ContactFormatter {
  static formatPhone(phone: string): string {
    // Remover caracteres no numéricos
    const cleaned = phone.replace(/\D/g, '');
    
    // Formatear según la longitud
    if (cleaned.length === 10) {
      // Formato nacional: (XXX) XXX-XXXX
      return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
    } else if (cleaned.length === 11 && cleaned.startsWith('1')) {
      // Formato internacional US: +1 (XXX) XXX-XXXX
      return `+1 (${cleaned.slice(1, 4)}) ${cleaned.slice(4, 7)}-${cleaned.slice(7)}`;
    } else if (cleaned.length >= 10) {
      // Formato internacional genérico
      const countryCode = cleaned.slice(0, cleaned.length - 10);
      const localNumber = cleaned.slice(-10);
      return `+${countryCode} (${localNumber.slice(0, 3)}) ${localNumber.slice(3, 6)}-${localNumber.slice(6)}`;
    }
    
    return phone; // Devolver original si no se puede formatear
  }
  
  static formatEmail(email: string): string {
    return email.toLowerCase().trim();
  }
  
  static formatWebsite(website: string): string {
    let formatted = website.trim().toLowerCase();
    
    // Agregar protocolo si no existe
    if (!formatted.startsWith('http://') && !formatted.startsWith('https://')) {
      formatted = `https://${formatted}`;
    }
    
    return formatted;
  }
}

/**
 * Analizador de completitud del restaurante
 */
export interface CompletenessAnalysis {
  score: number; // 0-100
  completedFields: string[];
  missingFields: string[];
  recommendations: string[];
  category: 'basic' | 'good' | 'excellent';
}

/**
 * Helper para verificar si un campo tiene valor
 */
function hasValue(value: any): boolean {
  if (value === null || value === undefined) return false;
  if (typeof value === 'string') return value.trim().length > 0;
  if (Array.isArray(value)) return value.length > 0;
  if (typeof value === 'object') return Object.keys(value).length > 0;
  return true;
}

/**
 * Helper para verificar si las redes sociales tienen contenido
 */
function hasSocialLinks(socialLinks: Restaurant['socialLinks']): boolean {
  if (!socialLinks) return false;
  return Object.values(socialLinks).some(link => link && link.trim().length > 0);
}

export function analyzeRestaurantCompleteness(restaurant: Restaurant): CompletenessAnalysis {
  const analysis: CompletenessAnalysis = {
    score: 0,
    completedFields: [],
    missingFields: [],
    recommendations: [],
    category: 'basic'
  };
  
  // Campos esenciales con tipado correcto (peso: 10 puntos cada uno)
  const essentialFields = [
    { 
      key: 'name' as keyof Restaurant, 
      label: 'Nombre del restaurante',
      check: () => hasValue(restaurant.name)
    },
    { 
      key: 'description' as keyof Restaurant, 
      label: 'Descripción',
      check: () => hasValue(restaurant.description)
    },
    { 
      key: 'address' as keyof Restaurant, 
      label: 'Dirección',
      check: () => hasValue(restaurant.address)
    },
    { 
      key: 'phone' as keyof Restaurant, 
      label: 'Teléfono',
      check: () => hasValue(restaurant.phone)
    }
  ];
  
  // Campos importantes (peso: 5 puntos cada uno)
  const importantFields = [
    { 
      key: 'email' as keyof Restaurant, 
      label: 'Email de contacto',
      check: () => hasValue(restaurant.email)
    },
    { 
      key: 'logo' as keyof Restaurant, 
      label: 'Logo',
      check: () => hasValue(restaurant.logo)
    },
    { 
      key: 'imageProfile' as keyof Restaurant, 
      label: 'Imagen de perfil',
      check: () => hasValue(restaurant.imageProfile)
    },
    { 
      key: 'schedule' as keyof Restaurant, 
      label: 'Horarios',
      check: () => hasValue(restaurant.schedule) || hasValue(restaurant.businessHours)
    },
    { 
      key: 'cuisineType' as keyof Restaurant, 
      label: 'Tipo de cocina',
      check: () => Array.isArray(restaurant.cuisineType) && restaurant.cuisineType.length > 0
    },
    { 
      key: 'priceRange' as keyof Restaurant, 
      label: 'Rango de precios',
      check: () => hasValue(restaurant.priceRange)
    }
  ];
  
  // Campos opcionales (peso: 2 puntos cada uno)
  const optionalFields = [
    { 
      key: 'website' as keyof Restaurant, 
      label: 'Sitio web',
      check: () => hasValue(restaurant.website)
    },
    { 
      key: 'imageCover' as keyof Restaurant, 
      label: 'Imagen de portada',
      check: () => hasValue(restaurant.imageCover)
    },
    { 
      key: 'socialLinks' as keyof Restaurant, 
      label: 'Redes sociales',
      check: () => hasSocialLinks(restaurant.socialLinks)
    },
    { 
      key: 'features' as keyof Restaurant, 
      label: 'Características',
      check: () => Array.isArray(restaurant.features) && restaurant.features.length > 0
    },
    { 
      key: 'paymentMethods' as keyof Restaurant, 
      label: 'Métodos de pago',
      check: () => Array.isArray(restaurant.paymentMethods) && restaurant.paymentMethods.length > 0
    }
  ];
  
  // Verificar campos esenciales
  essentialFields.forEach(field => {
    if (field.check()) {
      analysis.completedFields.push(field.label);
      analysis.score += 10;
    } else {
      analysis.missingFields.push(field.label);
      analysis.recommendations.push(`Agregar ${field.label.toLowerCase()}`);
    }
  });
  
  // Verificar campos importantes
  importantFields.forEach(field => {
    if (field.check()) {
      analysis.completedFields.push(field.label);
      analysis.score += 5;
    } else {
      analysis.missingFields.push(field.label);
      analysis.recommendations.push(`Configurar ${field.label.toLowerCase()}`);
    }
  });
  
  // Verificar campos opcionales
  optionalFields.forEach(field => {
    if (field.check()) {
      analysis.completedFields.push(field.label);
      analysis.score += 2;
    }
  });
  
  // Determinar categoría
  if (analysis.score >= 80) {
    analysis.category = 'excellent';
  } else if (analysis.score >= 50) {
    analysis.category = 'good';
  } else {
    analysis.category = 'basic';
  }
  
  // Limitar score a 100
  analysis.score = Math.min(analysis.score, 100);
  
  return analysis;
}

/**
 * Generador de URLs para compartir
 */
export class ShareUrlGenerator {
  static getQRCodeUrl(restaurant: Restaurant, size: number = 300): string {
    const restaurantUrl = restaurantService.utils.getRestaurantPublicUrl(restaurant);
    const encodedUrl = encodeURIComponent(restaurantUrl);
    return `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodedUrl}`;
  }
  
  static getSocialShareUrls(restaurant: Restaurant) {
    const restaurantUrl = restaurantService.utils.getRestaurantPublicUrl(restaurant);
    const encodedUrl = encodeURIComponent(restaurantUrl);
    const encodedTitle = encodeURIComponent(`Visita ${restaurant.name || 'este restaurante'} - Menú Digital`);
    const encodedDescription = encodeURIComponent(
      restaurant.description || `Descubre el menú de ${restaurant.name || 'este restaurante'}`
    );
    
    return {
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
      twitter: `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}`,
      whatsapp: `https://wa.me/?text=${encodedTitle}%20${encodedUrl}`,
      telegram: `https://t.me/share/url?url=${encodedUrl}&text=${encodedTitle}`,
      linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`,
      email: `mailto:?subject=${encodedTitle}&body=${encodedDescription}%0A%0A${encodedUrl}`
    };
  }
}

/**
 * Utilidades para horarios de negocio
 */
export class BusinessHoursUtils {
  static formatSchedule(businessHours: Restaurant['businessHours']): string {
    if (!businessHours) return '';
    
    const days = [
      { key: 'monday' as const, name: 'Lunes' },
      { key: 'tuesday' as const, name: 'Martes' },
      { key: 'wednesday' as const, name: 'Miércoles' },
      { key: 'thursday' as const, name: 'Jueves' },
      { key: 'friday' as const, name: 'Viernes' },
      { key: 'saturday' as const, name: 'Sábado' },
      { key: 'sunday' as const, name: 'Domingo' }
    ];
    
    const schedule: string[] = [];
    
    days.forEach(day => {
      const daySchedule = businessHours[day.key];
      if (daySchedule) {
        if (daySchedule.closed) {
          schedule.push(`${day.name}: Cerrado`);
        } else if (daySchedule.open && daySchedule.close) {
          schedule.push(`${day.name}: ${daySchedule.open} - ${daySchedule.close}`);
        }
      }
    });
    
    return schedule.join('\n');
  }
  
  static isOpenNow(businessHours: Restaurant['businessHours']): boolean {
    if (!businessHours) return false;
    
    const now = new Date();
    const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'] as const;
    const currentDay = dayNames[now.getDay()];
    const currentTime = now.getHours() * 60 + now.getMinutes();
    
    const daySchedule = businessHours[currentDay];
    if (!daySchedule || daySchedule.closed || !daySchedule.open || !daySchedule.close) {
      return false;
    }
    
    const [openHour, openMinute] = daySchedule.open.split(':').map(Number);
    const [closeHour, closeMinute] = daySchedule.close.split(':').map(Number);
    
    const openTime = openHour * 60 + openMinute;
    const closeTime = closeHour * 60 + closeMinute;
    
    // Manejar horarios que cruzan medianoche
    if (closeTime < openTime) {
      return currentTime >= openTime || currentTime <= closeTime;
    }
    
    return currentTime >= openTime && currentTime <= closeTime;
  }
  
  static getNextOpenTime(businessHours: Restaurant['businessHours']): string | null {
    if (!businessHours) return null;
    
    const now = new Date();
    const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'] as const;
    
    // Buscar en los próximos 7 días
    for (let i = 0; i < 7; i++) {
      const checkDate = new Date(now);
      checkDate.setDate(checkDate.getDate() + i);
      
      const dayName = dayNames[checkDate.getDay()];
      const daySchedule = businessHours[dayName];
      
      if (daySchedule && !daySchedule.closed && daySchedule.open) {
        if (i === 0) {
          // Hoy - verificar si ya pasó la hora de apertura
          const [openHour, openMinute] = daySchedule.open.split(':').map(Number);
          const openTime = openHour * 60 + openMinute;
          const currentTime = now.getHours() * 60 + now.getMinutes();
          
          if (currentTime < openTime) {
            return `Hoy a las ${daySchedule.open}`;
          }
        } else {
          const dayNameSpanish = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
          return `${dayNameSpanish[checkDate.getDay()]} a las ${daySchedule.open}`;
        }
      }
    }
    
    return null;
  }
}

/**
 * Calculadora de estadísticas
 */
export class RestaurantStatsCalculator {
  static calculateGrowthRate(current: number, previous: number): number {
    if (previous === 0) return current > 0 ? 100 : 0;
    return ((current - previous) / previous) * 100;
  }
  
  static formatGrowthRate(rate: number): string {
    const formatted = Math.abs(rate).toFixed(1);
    const direction = rate >= 0 ? '↗' : '↘';
    const sign = rate >= 0 ? '+' : '-';
    return `${direction} ${sign}${formatted}%`;
  }
  
  static calculateAverageRating(ratings: number[]): number {
    if (ratings.length === 0) return 0;
    const sum = ratings.reduce((acc, rating) => acc + rating, 0);
    return Math.round((sum / ratings.length) * 10) / 10;
  }
  
  static generateStatsInsights(analytics: Restaurant['analytics']): string[] {
    const insights: string[] = [];
    
    if (!analytics) return insights;
    
    // Insights sobre rating
    if (analytics.averageRating && analytics.averageRating > 0) {
      if (analytics.averageRating >= 4.5) {
        insights.push('¡Excelente! Tu calificación está por encima de 4.5 estrellas');
      } else if (analytics.averageRating >= 4.0) {
        insights.push('Buena calificación. Considera mejorar algunos aspectos para llegar a 4.5+');
      } else if (analytics.averageRating >= 3.0) {
        insights.push('Tu calificación necesita mejoras. Revisa los comentarios de los clientes');
      } else {
        insights.push('Calificación baja. Es importante atender los problemas mencionados por los clientes');
      }
    }
    
    // Insights sobre reviews
    if (analytics.reviewsCount && analytics.reviewsCount > 0) {
      if (analytics.reviewsCount < 5) {
        insights.push('Considera pedir a más clientes que dejen reseñas para mejorar tu visibilidad');
      } else if (analytics.reviewsCount >= 50) {
        insights.push('¡Gran cantidad de reseñas! Esto ayuda mucho a la confianza de nuevos clientes');
      }
    } else {
      insights.push('Aún no tienes reseñas. Anima a tus clientes a dejar comentarios');
    }
    
    // Insights sobre favoritos
    if (analytics.favoritesCount && analytics.favoritesCount > 0) {
      if (analytics.favoritesCount >= 100) {
        insights.push('¡Muchos clientes te han agregado a favoritos! Eso es excelente');
      } else if (analytics.favoritesCount >= 25) {
        insights.push('Buen número de clientes te tienen como favorito');
      }
    }
    
    return insights;
  }
}

/**
 * Helper para manejar errores de la API
 */
export class ApiErrorHandler {
  static getErrorMessage(error: any): string {
    if (typeof error === 'string') return error;
    
    if (error?.detail) return error.detail;
    if (error?.message) return error.message;
    if (error?.error) return error.error;
    
    // Errores de red
    if (error?.name === 'NetworkError' || error?.code === 'NETWORK_ERROR') {
      return 'Error de conexión. Verifica tu conexión a internet';
    }
    
    // Errores de timeout
    if (error?.name === 'TimeoutError' || error?.code === 'TIMEOUT') {
      return 'La operación tardó demasiado. Intenta de nuevo';
    }
    
    // Errores de autenticación
    if (error?.status === 401 || error?.code === 'UNAUTHORIZED') {
      return 'Tu sesión ha expirado. Por favor, inicia sesión nuevamente';
    }
    
    // Errores de permisos
    if (error?.status === 403 || error?.code === 'FORBIDDEN') {
      return 'No tienes permisos para realizar esta acción';
    }
    
    // Errores de validación
    if (error?.status === 400 || error?.code === 'VALIDATION_ERROR') {
      return 'Los datos proporcionados no son válidos';
    }
    
    // Errores del servidor
    if (error?.status >= 500 || error?.code === 'SERVER_ERROR') {
      return 'Error del servidor. Intenta de nuevo más tarde';
    }
    
    return 'Ha ocurrido un error inesperado';
  }
  
  static isRetriableError(error: any): boolean {
    const retriableCodes = ['NETWORK_ERROR', 'TIMEOUT', 'SERVER_ERROR'];
    const retriableStatuses = [408, 429, 500, 502, 503, 504];
    
    return (
      retriableCodes.includes(error?.code) ||
      retriableStatuses.includes(error?.status) ||
      error?.name === 'NetworkError' ||
      error?.name === 'TimeoutError'
    );
  }
}

/**
 * Utilidades adicionales específicas para Restaurant
 */
export class RestaurantHelpers {
  /**
   * Verifica si un restaurante está completo básicamente
   */
  static isBasicallyComplete(restaurant: Restaurant): boolean {
    return !!(
      restaurant.name && 
      restaurant.description && 
      (restaurant.address || restaurant.phone || restaurant.email)
    );
  }
  
  /**
   * Obtiene la URL pública del restaurante
   */
  static getPublicUrl(restaurant: Restaurant, baseUrl: string = ''): string {
    const base = baseUrl || (typeof window !== 'undefined' ? window.location.origin : '');
    return restaurant.username 
      ? `${base}/restaurant/${restaurant.username}`
      : `${base}/restaurant/${restaurant.id}`;
  }
  
  /**
   * Verifica si el usuario puede editar el restaurante
   */
  static canEdit(restaurant: Restaurant, currentUserId?: string): boolean {
    if (!currentUserId) return false;
    return restaurant.ownerId === currentUserId;
  }
  
  /**
   * Formatea el precio range para mostrar
   */
  static formatPriceRange(priceRange?: Restaurant['priceRange']): string {
    const ranges = {
      low: '$ Económico',
      medium: '$$ Moderado', 
      high: '$$$ Alto',
      premium: '$$$$ Premium'
    };
    return priceRange ? ranges[priceRange] : 'No especificado';
  }
  
  /**
   * Obtiene las iniciales del nombre del restaurante
   */
  static getInitials(name?: string): string {
    if (!name) return 'R';
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .slice(0, 2)
      .join('')
      .toUpperCase();
  }
  
  /**
   * Verifica si el restaurante está activo
   */
  static isActive(restaurant: Restaurant): boolean {
    return restaurant.active !== false; // Por defecto true si no se especifica
  }
}

/**
 * Exportar todas las utilidades
 */
export const restaurantUtils = {
  validateImageFile,
  generateRestaurantSlug,
  ContactFormatter,
  analyzeRestaurantCompleteness,
  ShareUrlGenerator,
  BusinessHoursUtils,
  RestaurantStatsCalculator,
  ApiErrorHandler,
  RestaurantHelpers
};

export default restaurantUtils;