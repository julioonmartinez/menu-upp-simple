// src/interfaces/links.ts

import type { ImageData } from "./restaurant";

// ===== ENUMS =====

export enum LinkType {
  SOCIAL = "social",
  MENU = "menu",
  CONTACT = "contact",
  WEBSITE = "website",
  STORE = "store",
  CUSTOM = "custom"
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
  [LinkType.SOCIAL]: "Redes Sociales",
  [LinkType.MENU]: "Menú",
  [LinkType.CONTACT]: "Contacto",
  [LinkType.WEBSITE]: "Sitio Web",
  [LinkType.STORE]: "Tienda",
  [LinkType.CUSTOM]: "Personalizado"
};

export const LINK_TYPE_ICONS: Record<LinkType, string> = {
  [LinkType.SOCIAL]: "users",
  [LinkType.MENU]: "menu",
  [LinkType.CONTACT]: "phone",
  [LinkType.WEBSITE]: "globe",
  [LinkType.STORE]: "shopping-bag",
  [LinkType.CUSTOM]: "link"
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
    ? `${base}/links/${linkTree.customSlug}`
    : `${base}/links/${linkTree.id}`;
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