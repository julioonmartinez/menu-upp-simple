// src/interfaces/links.ts

import type { ImageData } from "./restaurant";

// ===== ENUMS =====

export enum LinkType {
  // // Enlaces Sociales
  SOCIAL = "social",
  INSTAGRAM = "instagram",
  FACEBOOK = "facebook",
  TWITTER = "twitter",
  YOUTUBE = "youtube",
  LINKEDIN = "linkedin",
  TIKTOK = "tiktok",
  WHATSAPP = "whatsapp",
  TELEGRAM = "telegram",
  DISCORD = "discord",
  TWITCH = "twitch",
  SPOTIFY = "spotify",
  PINTEREST = "pinterest",
  REDDIT = "reddit",
  SNAPCHAT = "snapchat",
  GITHUB = "github",
  
  // Enlaces de Negocio
  WEBSITE = "website",
  STORE = "store",
  MENU = "menu",
  PORTFOLIO = "portfolio",
  BLOG = "blog",
  NEWS = "news",
  PRESS = "press",
  CAREERS = "careers",
  ABOUT = "about",
  
  // Enlaces de Contacto
  CONTACT = "contact",
  EMAIL = "email",
  PHONE = "phone",
  LOCATION = "location",
  CALENDAR = "calendar",
  BOOKING = "booking",
  RESERVATION = "reservation",
  
  // Enlaces de Comercio
  SHOP = "shop",
  PRODUCTS = "products",
  SERVICES = "services",
  PRICING = "pricing",
  DONATION = "donation",
  PAYMENT = "payment",
  SUBSCRIPTION = "subscription",
  
  // Enlaces de Contenido
  GALLERY = "gallery",
  VIDEO = "video",
  PODCAST = "podcast",
  EBOOK = "ebook",
  DOWNLOAD = "download",
  RESOURCE = "resource",
  DOCUMENTATION = "documentation",
  
  // Enlaces de Utilidad
  FAQ = "faq",
  SUPPORT = "support",
  HELP = "help",
  FEEDBACK = "feedback",
  SURVEY = "survey",
  EVENT = "event",
  WEBINAR = "webinar",
  
  // Enlaces Personalizados
  CUSTOM = "custom",
  OTHER = "other"
  
}

// ===== INTERFACES PARA ANALYTICS =====

export interface LinkAnalytics {
  clicks: number;
  lastClicked?: Date | string;
}

export interface LinkTreeAnalyticsData {
  totalVisits: number;
  totalClicks: number;
  uniqueVisitors: number;
}

export interface LinkTreeAnalytics {
  views: {
    total: number;
    unique: number;
    daily: Array<{
      date: string;
      count: number;
    }>;
  };
  clicks: {
    total: number;
    byLink: Array<{
      linkId: string;
      linkTitle: string;
      count: number;
    }>;
    daily: Array<{
      date: string;
      count: number;
    }>;
  };
}

// ===== INTERFACES PARA LINKS =====

export interface Link {
  id?: string;
  title: string;
  url: string;
  icon?: string;
  description?: string;
  type: LinkType;
  order: number;
  active: boolean;
  customColor?: string;
  analytics?: LinkAnalytics;
}

// ===== INTERFACES PARA LINKTREE =====

export interface LinkTree {
  id?: string;
  restaurantId: string;
  title?: string;
  description?: string;
  
  // Imágenes
  profileImage?: ImageData;
  coverImage?: ImageData;
  textImage?: ImageData;
  
  // Personalización visual
  backgroundColor?: string;
  linksBackgroundColor?: string;
  linksColor?: string;
  socialMediaBackgroundColor?: string;
  socialMediaTextColor?: string;
  textColor?: string;
  buttonStyle?: "rounded" | "square" | "pill";
  theme?: "light" | "dark" | "custom";
  customCss?: string;
  ctaBackgroundColor?: string;
  ctaTextColor?: string;
  
  // Enlaces
  links: Link[];
  
  // Configuraciones
  isPublic: boolean;
  customSlug?: string;
  
  // Meta-información
  createdAt?: Date | string;
  updatedAt?: Date | string;
  
  // Analíticas
  analytics?: LinkTreeAnalyticsData;
}

// ===== INTERFACES PARA FORMULARIOS =====

export interface LinkTreeCreateData {
  restaurantId: string;
  title?: string;
  description?: string;
  backgroundColor?: string;
  linksBackgroundColor?: string;
  linksColor?: string;
  socialMediaBackgroundColor?: string;
  socialMediaTextColor?: string;
  textColor?: string;
  buttonStyle?: "rounded" | "square" | "pill";
  theme?: "light" | "dark" | "custom";
  customCss?: string;
  ctaBackgroundColor?: string;
  ctaTextColor?: string;
  isPublic?: boolean;
  customSlug?: string;
}

export interface LinkTreeUpdateData {
  title?: string;
  description?: string;
  backgroundColor?: string;
  linksBackgroundColor?: string;
  linksColor?: string;
  socialMediaBackgroundColor?: string;
  socialMediaTextColor?: string;
  textColor?: string;
  buttonStyle?: "rounded" | "square" | "pill";
  theme?: "light" | "dark" | "custom";
  customCss?: string;
  ctaBackgroundColor?: string;
  ctaTextColor?: string;
  isPublic?: boolean;
  customSlug?: string;
}

export interface LinkCreateData {
  title: string;
  url: string;
  icon?: string;
  description?: string;
  type: LinkType;
  order?: number;
  active?: boolean;
  customColor?: string;
}

export interface LinkUpdateData {
  title?: string;
  url?: string;
  icon?: string;
  description?: string;
  type?: LinkType;
  order?: number;
  active?: boolean;
  customColor?: string;
}

// ===== INTERFACES PARA VALIDACIÓN =====

export interface LinkTreeValidationResult {
  isValid: boolean;
  errors: string[];
}

export interface LinkValidationResult {
  isValid: boolean;
  errors: string[];
}

// ===== TIPOS DE UTILIDAD =====

export type LinkTreeTheme = "light" | "dark" | "custom";
export type ButtonStyle = "rounded" | "square" | "pill";

// ===== INTERFACES PARA COMPONENTES =====

export interface LinkTreeDisplayProps {
  linkTree: LinkTree;
  showAnalytics?: boolean;
  editable?: boolean;
  onLinkClick?: (link: Link) => void;
  onEdit?: (linkTree: LinkTree) => void;
}

export interface LinkDisplayProps {
  link: Link;
  editable?: boolean;
  onClick?: (link: Link) => void;
  onEdit?: (link: Link) => void;
  onDelete?: (link: Link) => void;
}

export interface LinkTreeFormProps {
  linkTree?: LinkTree;
  restaurantId?: string;
  onSubmit: (data: LinkTreeCreateData | LinkTreeUpdateData) => void;
  onCancel?: () => void;
  isLoading?: boolean;
  error?: string;
}

export interface LinkFormProps {
  link?: Link;
  linkTreeId: string;
  onSubmit: (data: LinkCreateData | LinkUpdateData) => void;
  onCancel?: () => void;
  isLoading?: boolean;
  error?: string;
}

// ===== CONSTANTES =====

export const LINK_TYPE_LABELS: Record<LinkType, string> = {
  // Enlaces Sociales
  [LinkType.SOCIAL]: "Redes Sociales",
  [LinkType.INSTAGRAM]: "Instagram",
  [LinkType.FACEBOOK]: "Facebook",
  [LinkType.TWITTER]: "Twitter",
  [LinkType.YOUTUBE]: "YouTube",
  [LinkType.LINKEDIN]: "LinkedIn",
  [LinkType.TIKTOK]: "TikTok",
  [LinkType.WHATSAPP]: "WhatsApp",
  [LinkType.TELEGRAM]: "Telegram",
  [LinkType.DISCORD]: "Discord",
  [LinkType.TWITCH]: "Twitch",
  [LinkType.SPOTIFY]: "Spotify",
  [LinkType.PINTEREST]: "Pinterest",
  [LinkType.REDDIT]: "Reddit",
  [LinkType.SNAPCHAT]: "Snapchat",
  [LinkType.GITHUB]: "GitHub",
  
  // Enlaces de Negocio
  [LinkType.WEBSITE]: "Sitio Web",
  [LinkType.STORE]: "Tienda",
  [LinkType.MENU]: "Menú",
  [LinkType.PORTFOLIO]: "Portafolio",
  [LinkType.BLOG]: "Blog",
  [LinkType.NEWS]: "Noticias",
  [LinkType.PRESS]: "Prensa",
  [LinkType.CAREERS]: "Carreras",
  [LinkType.ABOUT]: "Acerca de",
  
  // Enlaces de Contacto
  [LinkType.CONTACT]: "Contacto",
  [LinkType.EMAIL]: "Email",
  [LinkType.PHONE]: "Teléfono",
  [LinkType.LOCATION]: "Ubicación",
  [LinkType.CALENDAR]: "Calendario",
  [LinkType.BOOKING]: "Reserva",
  [LinkType.RESERVATION]: "Reservación",
  
  // Enlaces de Comercio
  [LinkType.SHOP]: "Tienda",
  [LinkType.PRODUCTS]: "Productos",
  [LinkType.SERVICES]: "Servicios",
  [LinkType.PRICING]: "Precios",
  [LinkType.DONATION]: "Donación",
  [LinkType.PAYMENT]: "Pago",
  [LinkType.SUBSCRIPTION]: "Suscripción",
  
  // Enlaces de Contenido
  [LinkType.GALLERY]: "Galería",
  [LinkType.VIDEO]: "Video",
  [LinkType.PODCAST]: "Podcast",
  [LinkType.EBOOK]: "E-Book",
  [LinkType.DOWNLOAD]: "Descarga",
  [LinkType.RESOURCE]: "Recurso",
  [LinkType.DOCUMENTATION]: "Documentación",
  
  // Enlaces de Utilidad
  [LinkType.FAQ]: "Preguntas Frecuentes",
  [LinkType.SUPPORT]: "Soporte",
  [LinkType.HELP]: "Ayuda",
  [LinkType.FEEDBACK]: "Comentarios",
  [LinkType.SURVEY]: "Encuesta",
  [LinkType.EVENT]: "Evento",
  [LinkType.WEBINAR]: "Webinar",
  
  // Enlaces Personalizados
  [LinkType.CUSTOM]: "Personalizado",
  [LinkType.OTHER]: "Otro"
};

export const LINK_TYPE_ICONS: Record<LinkType, string> = {
  // Enlaces Sociales
  [LinkType.SOCIAL]: "fa-solid fa-users",
  [LinkType.INSTAGRAM]: "fa-brands fa-instagram",
  [LinkType.FACEBOOK]: "fa-brands fa-facebook",
  [LinkType.TWITTER]: "fa-brands fa-twitter",
  [LinkType.YOUTUBE]: "fa-brands fa-youtube",
  [LinkType.LINKEDIN]: "fa-brands fa-linkedin",
  [LinkType.TIKTOK]: "fa-brands fa-tiktok",
  [LinkType.WHATSAPP]: "fa-brands fa-whatsapp",
  [LinkType.TELEGRAM]: "fa-brands fa-telegram",
  [LinkType.DISCORD]: "fa-brands fa-discord",
  [LinkType.TWITCH]: "fa-brands fa-twitch",
  [LinkType.SPOTIFY]: "fa-brands fa-spotify",
  [LinkType.PINTEREST]: "fa-brands fa-pinterest",
  [LinkType.REDDIT]: "fa-brands fa-reddit",
  [LinkType.SNAPCHAT]: "fa-brands fa-snapchat",
  [LinkType.GITHUB]: "fa-brands fa-github",
  
  // Enlaces de Negocio
  [LinkType.WEBSITE]: "fa-solid fa-globe",
  [LinkType.STORE]: "fa-solid fa-store",
  [LinkType.MENU]: "fa-solid fa-utensils",
  [LinkType.PORTFOLIO]: "fa-solid fa-briefcase",
  [LinkType.BLOG]: "fa-solid fa-blog",
  [LinkType.NEWS]: "fa-solid fa-newspaper",
  [LinkType.PRESS]: "fa-solid fa-microphone",
  [LinkType.CAREERS]: "fa-solid fa-briefcase",
  [LinkType.ABOUT]: "fa-solid fa-circle-info",
  
  // Enlaces de Contacto
  [LinkType.CONTACT]: "fa-solid fa-address-book",
  [LinkType.EMAIL]: "fa-solid fa-envelope",
  [LinkType.PHONE]: "fa-solid fa-phone",
  [LinkType.LOCATION]: "fa-solid fa-location-dot",
  [LinkType.CALENDAR]: "fa-solid fa-calendar",
  [LinkType.BOOKING]: "fa-solid fa-calendar-check",
  [LinkType.RESERVATION]: "fa-solid fa-calendar-plus",
  
  // Enlaces de Comercio
  [LinkType.SHOP]: "fa-solid fa-cart-shopping",
  [LinkType.PRODUCTS]: "fa-solid fa-box",
  [LinkType.SERVICES]: "fa-solid fa-gears",
  [LinkType.PRICING]: "fa-solid fa-tags",
  [LinkType.DONATION]: "fa-solid fa-heart",
  [LinkType.PAYMENT]: "fa-solid fa-credit-card",
  [LinkType.SUBSCRIPTION]: "fa-solid fa-arrows-rotate",
  
  // Enlaces de Contenido
  [LinkType.GALLERY]: "fa-solid fa-images",
  [LinkType.VIDEO]: "fa-solid fa-video",
  [LinkType.PODCAST]: "fa-solid fa-podcast",
  [LinkType.EBOOK]: "fa-solid fa-book",
  [LinkType.DOWNLOAD]: "fa-solid fa-download",
  [LinkType.RESOURCE]: "fa-solid fa-file-lines",
  [LinkType.DOCUMENTATION]: "fa-solid fa-file-code",
  
  // Enlaces de Utilidad
  [LinkType.FAQ]: "fa-solid fa-circle-question",
  [LinkType.SUPPORT]: "fa-solid fa-headset",
  [LinkType.HELP]: "fa-solid fa-circle-question",
  [LinkType.FEEDBACK]: "fa-solid fa-comment",
  [LinkType.SURVEY]: "fa-solid fa-clipboard-list",
  [LinkType.EVENT]: "fa-solid fa-calendar-day",
  [LinkType.WEBINAR]: "fa-solid fa-video",
  
  // Enlaces Personalizados
  [LinkType.CUSTOM]: "fa-solid fa-link",
  [LinkType.OTHER]: "fa-solid fa-ellipsis"
};

export const BUTTON_STYLE_LABELS: Record<ButtonStyle, string> = {
  "rounded": "Redondeado",
  "square": "Cuadrado",
  "pill": "Píldora"
};

export const THEME_LABELS: Record<LinkTreeTheme, string> = {
  "light": "Claro",
  "dark": "Oscuro",
  "custom": "Personalizado"
};

// ===== FUNCIONES DE UTILIDAD =====

/**
 * Valida si una URL es válida
 */
export function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

/**
 * Valida si un slug es válido
 */
export function isValidSlug(slug: string): boolean {
  const slugRegex = /^[a-zA-Z0-9_-]{3,50}$/;
  return slugRegex.test(slug);
}

/**
 * Genera un slug sugerido basado en el título
 */
export function generateSlugFromTitle(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '') // Remover caracteres especiales
    .replace(/\s+/g, '-') // Reemplazar espacios con guiones
    .substring(0, 30); // Limitar longitud
}

/**
 * Ordena los enlaces por el campo order
 */
export function sortLinksByOrder(links: Link[]): Link[] {
  return [...links].sort((a, b) => a.order - b.order);
}

/**
 * Filtra enlaces activos
 */
export function getActiveLinks(links: Link[]): Link[] {
  return links.filter(link => link.active);
}

/**
 * Agrupa enlaces por tipo
 */
export function groupLinksByType(links: Link[]): Record<LinkType, Link[]> {
  const grouped = {} as Record<LinkType, Link[]>;
  
  // Inicializar todos los tipos
  Object.values(LinkType).forEach(type => {
    grouped[type] = [];
  });
  
  // Agrupar enlaces
  links.forEach(link => {
    if (grouped[link.type]) {
      grouped[link.type].push(link);
    }
  });
  
  return grouped;
}

/**
 * Formatea el número de clics para mostrar
 */
export function formatClickCount(count: number): string {
  if (count < 1000) return count.toString();
  if (count < 1000000) return `${(count / 1000).toFixed(1)}K`;
  return `${(count / 1000000).toFixed(1)}M`;
}

/**
 * Obtiene la URL pública del LinkTree
 */
export function getLinkTreePublicUrl(linkTree: LinkTree, baseUrl?: string): string {
  const base = baseUrl || (typeof window !== 'undefined' ? window.location.origin : '');
  return linkTree.customSlug 
    ? `${base}/${linkTree.customSlug}`
    : `${base}/${linkTree.id}`;
}

/**
 * Valida los datos de un LinkTree
 */
export function validateLinkTreeData(data: LinkTreeCreateData | LinkTreeUpdateData): LinkTreeValidationResult {
  const errors: string[] = [];
  
  // Validar título (opcional)
  if ('title' in data && data.title && data.title.length > 100) {
    errors.push('El título no puede exceder 100 caracteres');
  }
  
  // Validar descripción (opcional)
  if ('description' in data && data.description && data.description.length > 500) {
    errors.push('La descripción no puede exceder 500 caracteres');
  }
  
  // Validar customSlug (opcional pero con formato)
  if ('customSlug' in data && data.customSlug) {
    if (!isValidSlug(data.customSlug)) {
      errors.push('El slug solo puede contener letras, números, guiones y guiones bajos');
    } else if (data.customSlug.length < 3) {
      errors.push('El slug debe tener al menos 3 caracteres');
    } else if (data.customSlug.length > 50) {
      errors.push('El slug no puede exceder 50 caracteres');
    }
  }
  
  // Validar restaurantId (solo para crear)
  if ('restaurantId' in data && !data.restaurantId) {
    errors.push('El ID del restaurante es requerido');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Valida los datos de un Link
 */
export function validateLinkData(data: LinkCreateData | LinkUpdateData): LinkValidationResult {
  const errors: string[] = [];
  
  // Validar título (requerido para crear, opcional para actualizar)
  if ('title' in data) {
    if (!data.title || data.title.trim().length === 0) {
      errors.push('El título del enlace es requerido');
    } else if (data.title.trim().length > 100) {
      errors.push('El título no puede exceder 100 caracteres');
    }
  }
  
  // Validar URL (requerida para crear, opcional para actualizar)
  if ('url' in data) {
    if (!data.url || data.url.trim().length === 0) {
      errors.push('La URL del enlace es requerida');
    } else if (!isValidUrl(data.url)) {
      errors.push('La URL no tiene un formato válido');
    }
  }
  
  // Validar descripción (opcional)
  if ('description' in data && data.description && data.description.length > 200) {
    errors.push('La descripción no puede exceder 200 caracteres');
  }
  
  // Validar order (opcional)
  if ('order' in data && data.order !== undefined && data.order < 0) {
    errors.push('El orden no puede ser negativo');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Convierte fechas string a Date objects
 */
export function parseLinkTreeDates(linkTree: any): LinkTree {
  if (linkTree.createdAt && typeof linkTree.createdAt === 'string') {
    linkTree.createdAt = new Date(linkTree.createdAt);
  }
  if (linkTree.updatedAt && typeof linkTree.updatedAt === 'string') {
    linkTree.updatedAt = new Date(linkTree.updatedAt);
  }
  
  // Formatear fechas en los links
  if (linkTree.links && Array.isArray(linkTree.links)) {
    linkTree.links = linkTree.links.map((link: any) => {
      if (link.analytics && link.analytics.lastClicked && typeof link.analytics.lastClicked === 'string') {
        link.analytics.lastClicked = new Date(link.analytics.lastClicked);
      }
      return link;
    });
  }
  
  return linkTree;
}

/**
 * Convierte Date objects a strings para serialización
 */
export function serializeLinkTreeDates(linkTree: LinkTree): any {
  const serialized = { ...linkTree };
  
  if (serialized.createdAt instanceof Date) {
    serialized.createdAt = serialized.createdAt.toISOString();
  }
  if (serialized.updatedAt instanceof Date) {
    serialized.updatedAt = serialized.updatedAt.toISOString();
  }
  
  // Serializar fechas en los links
  if (serialized.links && Array.isArray(serialized.links)) {
    serialized.links = serialized.links.map((link: Link) => {
      const serializedLink = { ...link };
      if (serializedLink.analytics && serializedLink.analytics.lastClicked instanceof Date) {
        serializedLink.analytics.lastClicked = serializedLink.analytics.lastClicked.toISOString();
      }
      return serializedLink;
    });
  }
  
  return serialized;
}