import type { ImageData } from "./restaurant";

// src/interfaces/links.ts
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
  analytics?: {
    clicks: number;
    lastClicked?: Date;
  };
}

export enum LinkType {
  SOCIAL = "social",
  MENU = "menu",
  CONTACT = "contact",
  WEBSITE = "website",
  STORE = "store",
  CUSTOM = "custom"
}

export interface LinkTree {
  id?: string;
  restaurantId: string;
  title?: string;
  description?: string;
  
  // Personalización visual
  profileImage?: ImageData;
  coverImage?: ImageData;
  textImage?: ImageData;
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
  createdAt?: Date;
  updatedAt?: Date;
  
  // Analíticas
  analytics?: {
    totalVisits: number;
    totalClicks: number;
    uniqueVisitors: number;
  };
}

