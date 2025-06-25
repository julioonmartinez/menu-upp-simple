// src/config/linkTreeConfig.ts

import type { LinkType, LinkTreeTheme, ButtonStyle } from '../interfaces/links.ts';

/**
 * Configuración central para el sistema LinkTree
 */

// ===== LÍMITES Y RESTRICCIONES =====

export const LINKTREE_LIMITS = {
  // Límites de contenido
  MAX_LINKS_PER_TREE: 50,
  MAX_TITLE_LENGTH: 100,
  MAX_DESCRIPTION_LENGTH: 500,
  MAX_LINK_TITLE_LENGTH: 100,
  MAX_LINK_DESCRIPTION_LENGTH: 200,
  MAX_CUSTOM_CSS_LENGTH: 10000,
  MAX_SLUG_LENGTH: 50,
  MIN_SLUG_LENGTH: 3,

  // Límites de archivos
  MAX_IMAGE_SIZE: 5 * 1024 * 1024, // 5MB
  MAX_HERO_SLIDES: 5,
  ACCEPTED_IMAGE_TYPES: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'],

  // Límites de analíticas
  ANALYTICS_RETENTION_DAYS: 365,
  MAX_ANALYTICS_EXPORTS_PER_DAY: 10,

  // Rate limiting
  MAX_VISITS_PER_IP_PER_HOUR: 1000,
  MAX_CLICKS_PER_IP_PER_HOUR: 500
} as const;

// ===== ICONOS DISPONIBLES =====

export const AVAILABLE_ICONS = {
  // Redes sociales
  social: [
    'instagram', 'facebook', 'twitter', 'tiktok', 'youtube', 'linkedin',
    'pinterest', 'snapchat', 'discord', 'twitch', 'reddit', 'github',
    'dribbble', 'behance', 'medium', 'substack', 'clubhouse', 'telegram',
    'whatsapp', 'signal', 'viber', 'wechat', 'skype', 'zoom'
  ],
  
  // Música y entretenimiento
  music: [
    'spotify', 'apple-music', 'youtube-music', 'soundcloud', 'bandcamp',
    'deezer', 'tidal', 'amazon-music', 'pandora', 'audible', 'podcast'
  ],
  
  // Negocios y trabajo
  business: [
    'email', 'phone', 'website', 'calendar', 'location', 'briefcase',
    'credit-card', 'dollar-sign', 'shopping-bag', 'store', 'truck',
    'clipboard', 'file-text', 'download', 'upload', 'share'
  ],
  
  // Comida y restaurantes
  food: [
    'menu', 'utensils', 'coffee', 'pizza', 'wine', 'beer', 'cake',
    'ice-cream', 'food-truck', 'chef-hat', 'plate', 'restaurant'
  ],
  
  // Tecnología
  tech: [
    'smartphone', 'laptop', 'tablet', 'desktop', 'headphones', 'camera',
    'video', 'tv', 'gaming', 'code', 'database', 'server', 'cloud'
  ],
  
  // Salud y fitness
  health: [
    'heart', 'activity', 'dumbbell', 'running', 'bike', 'swimming',
    'yoga', 'meditation', 'medical', 'pill', 'stethoscope', 'thermometer'
  ],
  
  // Educación
  education: [
    'book', 'graduation-cap', 'school', 'pencil', 'calculator', 'globe',
    'microscope', 'beaker', 'atom', 'library', 'presentation', 'award'
  ],
  
  // Transporte
  transport: [
    'car', 'bus', 'train', 'plane', 'ship', 'bicycle', 'motorcycle',
    'taxi', 'uber', 'lyft', 'gas-station', 'parking'
  ],
  
  // Genéricos
  generic: [
    'link', 'external-link', 'arrow-right', 'arrow-up-right', 'plus',
    'star', 'heart-filled', 'bookmark', 'tag', 'flag', 'bell', 'gift',
    'home', 'user', 'users', 'settings', 'help', 'info', 'check',
    'x', 'eye', 'eye-off', 'edit', 'trash', 'copy', 'refresh'
  ]
} as const;

// ===== PLANTILLAS DE LINKTREE =====

export const LINKTREE_TEMPLATES = {
  // Plantilla para restaurantes
  restaurant: {
    title: 'Mi Restaurante',
    description: 'Descubre nuestro menú y haz tu reserva',
    theme: 'light' as LinkTreeTheme,
    backgroundColor: '#ffffff',
    textColor: '#1f2937',
    linksBackgroundColor: '#f9fafb',
    linksColor: '#374151',
    buttonStyle: 'rounded' as ButtonStyle,
    suggestedLinks: [
      { title: 'Ver Menú', type: 'menu' as LinkType, icon: 'menu' },
      { title: 'Hacer Reserva', type: 'contact' as LinkType, icon: 'calendar' },
      { title: 'Ubicación', type: 'contact' as LinkType, icon: 'location' },
      { title: 'Instagram', type: 'social' as LinkType, icon: 'instagram' },
      { title: 'WhatsApp', type: 'contact' as LinkType, icon: 'whatsapp' },
      { title: 'Delivery', type: 'store' as LinkType, icon: 'truck' }
    ]
  },
  
  // Plantilla para negocios
  business: {
    title: 'Mi Negocio',
    description: 'Conecta conmigo profesionalmente',
    theme: 'light' as LinkTreeTheme,
    backgroundColor: '#f8fafc',
    textColor: '#1e293b',
    linksBackgroundColor: '#ffffff',
    linksColor: '#334155',
    buttonStyle: 'square' as ButtonStyle,
    suggestedLinks: [
      { title: 'Sitio Web', type: 'website' as LinkType, icon: 'website' },
      { title: 'Email', type: 'contact' as LinkType, icon: 'email' },
      { title: 'LinkedIn', type: 'social' as LinkType, icon: 'linkedin' },
      { title: 'Portafolio', type: 'website' as LinkType, icon: 'briefcase' },
      { title: 'Calendario', type: 'contact' as LinkType, icon: 'calendar' }
    ]
  },
  
  // Plantilla para influencers
  influencer: {
    title: 'Sígueme',
    description: 'Todos mis enlaces en un solo lugar',
    theme: 'custom' as LinkTreeTheme,
    backgroundColor: '#fbbf24',
    textColor: '#ffffff',
    linksBackgroundColor: '#f59e0b',
    linksColor: '#ffffff',
    buttonStyle: 'pill' as ButtonStyle,
    suggestedLinks: [
      { title: 'Instagram', type: 'social' as LinkType, icon: 'instagram' },
      { title: 'TikTok', type: 'social' as LinkType, icon: 'tiktok' },
      { title: 'YouTube', type: 'social' as LinkType, icon: 'youtube' },
      { title: 'Twitter', type: 'social' as LinkType, icon: 'twitter' },
      { title: 'Mi Tienda', type: 'store' as LinkType, icon: 'shopping-bag' },
      { title: 'Podcast', type: 'custom' as LinkType, icon: 'podcast' }
    ]
  },
  
  // Plantilla para músicos
  musician: {
    title: 'Mi Música',
    description: 'Escucha mis últimos lanzamientos',
    theme: 'dark' as LinkTreeTheme,
    backgroundColor: '#111827',
    textColor: '#f9fafb',
    linksBackgroundColor: '#374151',
    linksColor: '#f3f4f6',
    buttonStyle: 'rounded' as ButtonStyle,
    suggestedLinks: [
      { title: 'Spotify', type: 'custom' as LinkType, icon: 'spotify' },
      { title: 'Apple Music', type: 'custom' as LinkType, icon: 'apple-music' },
      { title: 'YouTube Music', type: 'custom' as LinkType, icon: 'youtube-music' },
      { title: 'SoundCloud', type: 'custom' as LinkType, icon: 'soundcloud' },
      { title: 'Instagram', type: 'social' as LinkType, icon: 'instagram' },
      { title: 'Conciertos', type: 'website' as LinkType, icon: 'calendar' }
    ]
  }
} as const;

// ===== COLORES PREDEFINIDOS =====

export const COLOR_PALETTES = {
  modern: {
    name: 'Moderno',
    colors: ['#3b82f6', '#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#ef4444']
  },
  warm: {
    name: 'Cálido',
    colors: ['#dc2626', '#ea580c', '#d97706', '#ca8a04', '#65a30d', '#16a34a']
  },
  cool: {
    name: 'Frío',
    colors: ['#1e40af', '#1d4ed8', '#2563eb', '#3b82f6', '#0ea5e9', '#06b6d4']
  },
  pastel: {
    name: 'Pastel',
    colors: ['#fbbf24', '#fb7185', '#a78bfa', '#34d399', '#60a5fa', '#f472b6']
  },
  dark: {
    name: 'Oscuro',
    colors: ['#1f2937', '#374151', '#4b5563', '#6b7280', '#9ca3af', '#d1d5db']
  },
  vibrant: {
    name: 'Vibrante',
    colors: ['#ff0080', '#00ff80', '#8000ff', '#ff8000', '#0080ff', '#80ff00']
  }
} as const;

// ===== CONFIGURACIÓN DE ANALYTICS =====

export const ANALYTICS_CONFIG = {
  // Eventos que se trackean
  events: {
    PAGE_VIEW: 'page_view',
    LINK_CLICK: 'link_click',
    SHARE: 'share',
    CUSTOM_CSS_USED: 'custom_css_used',
    THEME_CHANGED: 'theme_changed'
  },
  
  // Métricas calculadas
  metrics: {
    CLICK_THROUGH_RATE: 'ctr',
    BOUNCE_RATE: 'bounce_rate',
    AVERAGE_TIME_ON_PAGE: 'avg_time',
    TOP_PERFORMING_LINKS: 'top_links',
    TRAFFIC_SOURCES: 'traffic_sources'
  },
  
  // Configuración de retención
  retention: {
    RAW_EVENTS: 30, // días
    DAILY_AGGREGATES: 365, // días
    MONTHLY_AGGREGATES: 1825 // días (5 años)
  }
} as const;

// ===== CONFIGURACIÓN DE SEO =====

export const SEO_CONFIG = {
  // Metadatos por defecto
  defaults: {
    title: 'LinkTree',
    description: 'Página de enlaces personalizada',
    image: '/og-image.jpg',
    siteName: 'LinkTree'
  },
  
  // Configuración de Open Graph
  openGraph: {
    type: 'website',
    locale: 'es_ES',
    siteName: 'LinkTree'
  },
  
  // Configuración de Twitter Cards
  twitter: {
    card: 'summary_large_image',
    site: '@linktree'
  },
  
  // Datos estructurados
  structuredData: {
    organization: {
      '@type': 'Organization',
      name: 'LinkTree',
      url: 'https://tu-dominio.com'
    }
  }
} as const;

// ===== CONFIGURACIÓN DE PWA =====

export const PWA_CONFIG = {
  // Configuración del manifest
  manifest: {
    name: 'LinkTree',
    shortName: 'LinkTree',
    description: 'Gestiona tus enlaces en un solo lugar',
    themeColor: '#3b82f6',
    backgroundColor: '#ffffff',
    display: 'standalone',
    orientation: 'portrait',
    scope: '/',
    startUrl: '/',
    icons: [
      {
        src: '/icons/icon-72x72.png',
        sizes: '72x72',
        type: 'image/png'
      },
      {
        src: '/icons/icon-96x96.png',
        sizes: '96x96',
        type: 'image/png'
      },
      {
        src: '/icons/icon-128x128.png',
        sizes: '128x128',
        type: 'image/png'
      },
      {
        src: '/icons/icon-144x144.png',
        sizes: '144x144',
        type: 'image/png'
      },
      {
        src: '/icons/icon-152x152.png',
        sizes: '152x152',
        type: 'image/png'
      },
      {
        src: '/icons/icon-192x192.png',
        sizes: '192x192',
        type: 'image/png'
      },
      {
        src: '/icons/icon-384x384.png',
        sizes: '384x384',
        type: 'image/png'
      },
      {
        src: '/icons/icon-512x512.png',
        sizes: '512x512',
        type: 'image/png'
      }
    ]
  },
  
  // Configuración del service worker
  serviceWorker: {
    scope: '/',
    updateOnReload: true,
    cacheStrategies: {
      pages: 'NetworkFirst',
      images: 'CacheFirst',
      api: 'NetworkFirst',
      fonts: 'CacheFirst'
    }
  }
} as const;

// ===== CONFIGURACIÓN DE EXPORTACIÓN =====

export const EXPORT_CONFIG = {
  formats: {
    JSON: 'json',
    CSV: 'csv',
    PDF: 'pdf',
    QR_CODE: 'qr'
  },
  
  limits: {
    MAX_EXPORTS_PER_HOUR: 10,
    MAX_EXPORT_SIZE: 10 * 1024 * 1024 // 10MB
  }
} as const;

// ===== CONFIGURACIÓN DE NOTIFICACIONES =====

export const NOTIFICATION_CONFIG = {
  types: {
    SUCCESS: 'success',
    ERROR: 'error',
    WARNING: 'warning',
    INFO: 'info'
  },
  
  durations: {
    SHORT: 3000,
    MEDIUM: 5000,
    LONG: 8000,
    PERSISTENT: 0
  },
  
  positions: {
    TOP_RIGHT: 'top-right',
    TOP_LEFT: 'top-left',
    BOTTOM_RIGHT: 'bottom-right',
    BOTTOM_LEFT: 'bottom-left',
    CENTER: 'center'
  }
} as const;

// ===== FUNCIONES DE VALIDACIÓN =====

/**
 * Valida si un icono está disponible
 */
export function isValidIcon(icon: string): boolean {
  return Object.values(AVAILABLE_ICONS).some(category => 
    (category as readonly string[]).includes(icon)
  );
}

/**
 * Obtiene iconos por categoría
 */
export function getIconsByCategory(category: keyof typeof AVAILABLE_ICONS): readonly string[] {
  return AVAILABLE_ICONS[category];
}

/**
 * Obtiene todos los iconos disponibles
 */
export function getAllAvailableIcons(): string[] {
  return Object.values(AVAILABLE_ICONS).flat();
}

/**
 * Valida el tamaño de archivo
 */
export function validateFileSize(file: File): boolean {
  return file.size <= LINKTREE_LIMITS.MAX_IMAGE_SIZE;
}

/**
 * Valida el tipo de archivo
 */
export function validateFileType(file: File): boolean {
  return LINKTREE_LIMITS.ACCEPTED_IMAGE_TYPES.includes(
    file.type as typeof LINKTREE_LIMITS.ACCEPTED_IMAGE_TYPES[number]
  );
}

/**
 * Obtiene plantilla por tipo
 */
export function getTemplate(type: keyof typeof LINKTREE_TEMPLATES) {
  return LINKTREE_TEMPLATES[type];
}

/**
 * Obtiene paleta de colores
 */
export function getColorPalette(name: keyof typeof COLOR_PALETTES) {
  return COLOR_PALETTES[name];
}

// ===== CONFIGURACIÓN POR ENTORNO =====

export const ENV_CONFIG = {
  development: {
    apiUrl: 'http://localhost:8000',
    enableDebug: true,
    enableMockData: true,
    cacheEnabled: false
  },
  
  staging: {
    apiUrl: 'https://staging-api.tu-dominio.com',
    enableDebug: true,
    enableMockData: false,
    cacheEnabled: true
  },
  
  production: {
    apiUrl: 'https://api.tu-dominio.com',
    enableDebug: false,
    enableMockData: false,
    cacheEnabled: true
  }
} as const;

/**
 * Obtiene configuración por entorno
 */
export function getEnvConfig() {
  const env = import.meta.env.MODE || 'development';
  return ENV_CONFIG[env as keyof typeof ENV_CONFIG] || ENV_CONFIG.development;
}

// ===== EXPORTACIONES PRINCIPALES =====

export default {
  LIMITS: LINKTREE_LIMITS,
  ICONS: AVAILABLE_ICONS,
  TEMPLATES: LINKTREE_TEMPLATES,
  COLORS: COLOR_PALETTES,
  ANALYTICS: ANALYTICS_CONFIG,
  SEO: SEO_CONFIG,
  PWA: PWA_CONFIG,
  EXPORT: EXPORT_CONFIG,
  NOTIFICATIONS: NOTIFICATION_CONFIG,
  ENV: ENV_CONFIG,
  
  // Funciones utilitarias
  utils: {
    isValidIcon,
    getIconsByCategory,
    getAllAvailableIcons,
    validateFileSize,
    validateFileType,
    getTemplate,
    getColorPalette,
    getEnvConfig
  }
} as const;