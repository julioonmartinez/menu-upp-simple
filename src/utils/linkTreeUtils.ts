// src/utils/linkTreeUtils.ts

import type { 
  LinkTree, 
  Link, 
  LinkType,
  LinkTreeAnalytics,
  LinkTreeTheme,
  ButtonStyle 
} from '../interfaces/links.ts';

/**
 * Utilidades avanzadas para LinkTree
 */

// ===== URL Y NAVEGACIÓN =====

/**
 * Genera URLs para diferentes contextos de LinkTree
 */
export class LinkTreeUrlGenerator {
  private baseUrl: string;

  constructor(baseUrl?: string) {
    this.baseUrl = baseUrl || (typeof window !== 'undefined' ? window.location.origin : '');
  }

  /**
   * URL pública del LinkTree
   */
  getPublicUrl(linkTree: LinkTree): string {
    if (linkTree.customSlug) {
      return `${this.baseUrl}/links/${linkTree.customSlug}`;
    }
    return `${this.baseUrl}/links/${linkTree.id}`;
  }

  /**
   * URL de edición del LinkTree
   */
  getEditUrl(linkTree: LinkTree): string {
    return `${this.baseUrl}/dashboard/linktree/${linkTree.id}/edit`;
  }

  /**
   * URL del dashboard del LinkTree
   */
  getDashboardUrl(linkTree: LinkTree): string {
    return `${this.baseUrl}/dashboard/linktree/${linkTree.id}`;
  }

  /**
   * URL de analíticas del LinkTree
   */
  getAnalyticsUrl(linkTree: LinkTree): string {
    return `${this.baseUrl}/dashboard/linktree/${linkTree.id}/analytics`;
  }

  /**
   * URL para compartir en redes sociales
   */
  getSocialShareUrls(linkTree: LinkTree, message?: string) {
    const url = this.getPublicUrl(linkTree);
    const text = message || `Visita mi LinkTree: ${linkTree.title || 'Enlaces'}`;
    
    return {
      twitter: `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`,
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
      whatsapp: `https://wa.me/?text=${encodeURIComponent(`${text} ${url}`)}`,
      telegram: `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`,
      linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`,
      email: `mailto:?subject=${encodeURIComponent(text)}&body=${encodeURIComponent(`${text}\n\n${url}`)}`
    };
  }
}

// ===== ANALÍTICAS Y MÉTRICAS =====

/**
 * Calculadora de métricas de LinkTree
 */
export class LinkTreeMetrics {
  
  /**
   * Calcula la tasa de conversión de clics
   */
  static getClickThroughRate(analytics: LinkTreeAnalytics): number {
    if (analytics.views.total === 0) return 0;
    return (analytics.clicks.total / analytics.views.total) * 100;
  }

  /**
   * Obtiene el enlace más popular
   */
  static getMostPopularLink(analytics: LinkTreeAnalytics): { linkId: string; linkTitle: string; count: number } | null {
    if (analytics.clicks.byLink.length === 0) return null;
    
    return analytics.clicks.byLink.reduce((max, current) => 
      current.count > max.count ? current : max
    );
  }

  /**
   * Calcula el crecimiento de visitas
   */
  static getGrowthRate(current: number, previous: number): number {
    if (previous === 0) return current > 0 ? 100 : 0;
    return ((current - previous) / previous) * 100;
  }

  /**
   * Obtiene las estadísticas del período
   */
  static getPeriodStats(analytics: LinkTreeAnalytics, days: number = 7) {
    const now = new Date();
    const startDate = new Date(now.getTime() - (days * 24 * 60 * 60 * 1000));
    
    const periodViews = analytics.views.daily.filter(day => 
      new Date(day.date) >= startDate
    ).reduce((sum, day) => sum + day.count, 0);
    
    const periodClicks = analytics.clicks.daily.filter(day => 
      new Date(day.date) >= startDate
    ).reduce((sum, day) => sum + day.count, 0);
    
    return {
      views: periodViews,
      clicks: periodClicks,
      clickThroughRate: periodViews > 0 ? (periodClicks / periodViews) * 100 : 0,
      averageViewsPerDay: periodViews / days,
      averageClicksPerDay: periodClicks / days
    };
  }

  /**
   * Genera reporte de rendimiento
   */
  static generatePerformanceReport(analytics: LinkTreeAnalytics) {
    const last7Days = this.getPeriodStats(analytics, 7);
    const last30Days = this.getPeriodStats(analytics, 30);
    const mostPopular = this.getMostPopularLink(analytics);
    
    return {
      overall: {
        totalViews: analytics.views.total,
        totalClicks: analytics.clicks.total,
        uniqueVisitors: analytics.views.unique,
        clickThroughRate: this.getClickThroughRate(analytics)
      },
      last7Days,
      last30Days,
      topPerformer: mostPopular,
      trends: {
        viewsGrowth: this.getGrowthRate(last7Days.views, last30Days.views / 4.3), // Aproximación semanal
        clicksGrowth: this.getGrowthRate(last7Days.clicks, last30Days.clicks / 4.3)
      }
    };
  }
}

// ===== OPTIMIZACIÓN Y SEO =====

/**
 * Herramientas de optimización para LinkTree
 */
export class LinkTreeOptimizer {
  
  /**
   * Analiza la optimización del LinkTree
   */
  static analyzeOptimization(linkTree: LinkTree): {
    score: number;
    recommendations: string[];
    strengths: string[];
  } {
    const recommendations: string[] = [];
    const strengths: string[] = [];
    let score = 0;
    
    // Título (20 puntos)
    if (linkTree.title && linkTree.title.length > 0) {
      score += 20;
      strengths.push('Tiene título definido');
      
      if (linkTree.title.length >= 10 && linkTree.title.length <= 60) {
        score += 5;
        strengths.push('Título con longitud óptima');
      } else if (linkTree.title.length < 10) {
        recommendations.push('Considera un título más descriptivo (mínimo 10 caracteres)');
      } else {
        recommendations.push('El título es muy largo, considera reducirlo (máximo 60 caracteres)');
      }
    } else {
      recommendations.push('Agrega un título descriptivo a tu LinkTree');
    }
    
    // Descripción (15 puntos)
    if (linkTree.description && linkTree.description.length > 0) {
      score += 15;
      strengths.push('Tiene descripción');
      
      if (linkTree.description.length >= 20 && linkTree.description.length <= 150) {
        score += 5;
        strengths.push('Descripción con longitud óptima');
      }
    } else {
      recommendations.push('Agrega una descripción que explique qué encontrarán los visitantes');
    }
    
    // Imagen de perfil (10 puntos)
    if (linkTree.profileImage?.url) {
      score += 10;
      strengths.push('Tiene imagen de perfil');
    } else {
      recommendations.push('Agrega una imagen de perfil para mayor reconocimiento');
    }
    
    // Slug personalizado (10 puntos)
    if (linkTree.customSlug) {
      score += 10;
      strengths.push('Tiene slug personalizado');
    } else {
      recommendations.push('Crea un slug personalizado para una URL más memorable');
    }
    
    // Enlaces (40 puntos)
    const activeLinks = linkTree.links.filter(link => link.active);
    
    if (activeLinks.length >= 3) {
      score += 20;
      strengths.push(`Tiene ${activeLinks.length} enlaces activos`);
    } else if (activeLinks.length > 0) {
      score += 10;
      recommendations.push('Agrega más enlaces para ofrecer más opciones a tus visitantes');
    } else {
      recommendations.push('Agrega al menos 3 enlaces para comenzar');
    }
    
    // Diversidad de tipos de enlaces (10 puntos)
    const linkTypes = new Set(activeLinks.map(link => link.type));
    if (linkTypes.size >= 3) {
      score += 10;
      strengths.push('Variedad de tipos de enlaces');
    } else if (linkTypes.size >= 2) {
      score += 5;
    } else if (activeLinks.length > 0) {
      recommendations.push('Considera agregar diferentes tipos de enlaces (redes sociales, menú, contacto, etc.)');
    }
    
    // Descripciones en enlaces (10 puntos)
    const linksWithDescription = activeLinks.filter(link => link.description && link.description.length > 0);
    const descriptionRatio = activeLinks.length > 0 ? linksWithDescription.length / activeLinks.length : 0;
    
    if (descriptionRatio >= 0.8) {
      score += 10;
      strengths.push('La mayoría de enlaces tienen descripción');
    } else if (descriptionRatio >= 0.5) {
      score += 5;
    } else if (activeLinks.length > 0) {
      recommendations.push('Agrega descripciones a tus enlaces para mayor claridad');
    }
    
    return {
      score: Math.min(100, score),
      recommendations,
      strengths
    };
  }
  
  /**
   * Genera metadatos para SEO
   */
  static generateMetadata(linkTree: LinkTree) {
    const title = linkTree.title || 'Mi LinkTree';
    const description = linkTree.description || 'Encuentra todos mis enlaces importantes en un solo lugar';
    const url = new LinkTreeUrlGenerator().getPublicUrl(linkTree);
    
    return {
      title,
      description,
      openGraph: {
        title,
        description,
        url,
        type: 'website',
        image: linkTree.profileImage?.url || linkTree.coverImage?.url,
        siteName: 'LinkTree'
      },
      twitter: {
        card: 'summary_large_image',
        title,
        description,
        image: linkTree.profileImage?.url || linkTree.coverImage?.url
      },
      canonical: url
    };
  }
}

// ===== IMPORTACIÓN Y EXPORTACIÓN =====

/**
 * Herramientas para importar/exportar datos de LinkTree
 */
export class LinkTreeDataManager {
  
  /**
   * Exporta LinkTree a JSON
   */
  static exportToJson(linkTree: LinkTree): string {
    const exportData = {
      version: '1.0',
      exportDate: new Date().toISOString(),
      linkTree: {
        ...linkTree,
        // Excluir datos sensibles
        id: undefined,
        restaurantId: undefined,
        analytics: undefined,
        createdAt: undefined,
        updatedAt: undefined
      }
    };
    
    return JSON.stringify(exportData, null, 2);
  }
  
  /**
   * Importa LinkTree desde JSON
   */
  static importFromJson(jsonString: string): Partial<LinkTree> | null {
    try {
      const data = JSON.parse(jsonString);
      
      if (!data.linkTree) {
        throw new Error('Formato de archivo inválido');
      }
      
      // Validar estructura básica
      const { linkTree } = data;
      
      if (!Array.isArray(linkTree.links)) {
        linkTree.links = [];
      }
      
      // Limpiar IDs
      linkTree.links = linkTree.links.map((link: any) => ({
        ...link,
        id: undefined
      }));
      
      return linkTree;
    } catch (error) {
      console.error('Error importing LinkTree:', error);
      return null;
    }
  }
  
  /**
   * Exporta enlaces a CSV
   */
  static exportLinksToCSV(links: Link[]): string {
    const headers = ['Título', 'URL', 'Descripción', 'Tipo', 'Activo', 'Color', 'Icono'];
    const rows = links.map(link => [
      link.title,
      link.url,
      link.description || '',
      link.type,
      link.active ? 'Sí' : 'No',
      link.customColor || '',
      link.icon || ''
    ]);
    
    const csvContent = [headers, ...rows]
      .map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
      .join('\n');
    
    return csvContent;
  }
  
  /**
   * Importa enlaces desde CSV
   */
  static importLinksFromCSV(csvString: string): Partial<Link>[] {
    const lines = csvString.trim().split('\n');
    const headers = lines[0].split(',').map(h => h.replace(/"/g, '').trim());
    
    return lines.slice(1).map((line, index) => {
      const values = line.split(',').map(v => v.replace(/"/g, '').trim());
      
      return {
        title: values[0] || `Enlace ${index + 1}`,
        url: values[1] || '',
        description: values[2] || undefined,
        type: (values[3] as LinkType) || 'custom',
        active: values[4]?.toLowerCase() === 'sí' || values[4]?.toLowerCase() === 'yes',
        customColor: values[5] || undefined,
        icon: values[6] || undefined,
        order: index
      };
    }).filter(link => link.url); // Solo enlaces con URL válida
  }
}

// ===== TEMAS Y PERSONALIZACIÓN =====

/**
 * Generador de temas para LinkTree
 */
export class LinkTreeThemeGenerator {
  
  /**
   * Temas predefinidos
   */
  static presetThemes: Record<string, Partial<LinkTree>> = {
    modern: {
      theme: 'light' as LinkTreeTheme,
      backgroundColor: '#ffffff',
      textColor: '#1f2937',
      linksBackgroundColor: '#f9fafb',
      linksColor: '#374151',
      buttonStyle: 'rounded' as ButtonStyle
    },
    dark: {
      theme: 'dark' as LinkTreeTheme,
      backgroundColor: '#111827',
      textColor: '#f9fafb',
      linksBackgroundColor: '#374151',
      linksColor: '#f3f4f6',
      buttonStyle: 'rounded' as ButtonStyle
    },
    vibrant: {
      theme: 'custom' as LinkTreeTheme,
      backgroundColor: '#7c3aed',
      textColor: '#ffffff',
      linksBackgroundColor: '#a855f7',
      linksColor: '#ffffff',
      buttonStyle: 'pill' as ButtonStyle
    },
    minimal: {
      theme: 'light' as LinkTreeTheme,
      backgroundColor: '#ffffff',
      textColor: '#374151',
      linksBackgroundColor: 'transparent',
      linksColor: '#4b5563',
      buttonStyle: 'square' as ButtonStyle
    },
    nature: {
      theme: 'custom' as LinkTreeTheme,
      backgroundColor: '#ecfdf5',
      textColor: '#065f46',
      linksBackgroundColor: '#d1fae5',
      linksColor: '#047857',
      buttonStyle: 'rounded' as ButtonStyle
    }
  };
  
  /**
   * Aplica un tema predefinido
   */
  static applyTheme(linkTree: LinkTree, themeName: string): LinkTree {
    const theme = this.presetThemes[themeName];
    if (!theme) {
      throw new Error(`Tema '${themeName}' no encontrado`);
    }
    
    return {
      ...linkTree,
      ...theme
    };
  }
  
  /**
   * Genera un tema basado en colores principales
   */
  static generateThemeFromColors(primaryColor: string, secondaryColor?: string): Partial<LinkTree> {
    // Lógica simplificada para generar tema
    const isDark = this.isColorDark(primaryColor);
    
    return {
      theme: 'custom' as LinkTreeTheme,
      backgroundColor: isDark ? primaryColor : '#ffffff',
      textColor: isDark ? '#ffffff' : primaryColor,
      linksBackgroundColor: secondaryColor || (isDark ? this.lightenColor(primaryColor, 20) : this.darkenColor(primaryColor, 5)),
      linksColor: isDark ? '#ffffff' : primaryColor,
      buttonStyle: 'rounded' as ButtonStyle
    };
  }
  
  /**
   * Verifica si un color es oscuro
   */
  private static isColorDark(color: string): boolean {
    const hex = color.replace('#', '');
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);
    const brightness = (r * 299 + g * 587 + b * 114) / 1000;
    return brightness < 128;
  }
  
  /**
   * Aclara un color
   */
  private static lightenColor(color: string, percent: number): string {
    const num = parseInt(color.replace('#', ''), 16);
    const amt = Math.round(2.55 * percent);
    const R = (num >> 16) + amt;
    const G = (num >> 8 & 0x00FF) + amt;
    const B = (num & 0x0000FF) + amt;
    return '#' + (0x1000000 + (R < 255 ? R < 1 ? 0 : R : 255) * 0x10000 +
      (G < 255 ? G < 1 ? 0 : G : 255) * 0x100 +
      (B < 255 ? B < 1 ? 0 : B : 255)).toString(16).slice(1);
  }
  
  /**
   * Oscurece un color
   */
  private static darkenColor(color: string, percent: number): string {
    const num = parseInt(color.replace('#', ''), 16);
    const amt = Math.round(2.55 * percent);
    const R = (num >> 16) - amt;
    const G = (num >> 8 & 0x00FF) - amt;
    const B = (num & 0x0000FF) - amt;
    return '#' + (0x1000000 + (R > 255 ? 255 : R < 0 ? 0 : R) * 0x10000 +
      (G > 255 ? 255 : G < 0 ? 0 : G) * 0x100 +
      (B > 255 ? 255 : B < 0 ? 0 : B)).toString(16).slice(1);
  }
}

// ===== VALIDACIÓN AVANZADA =====

/**
 * Validador avanzado para LinkTree
 */
export class LinkTreeValidator {
  
  /**
   * Valida todos los aspectos de un LinkTree
   */
  static validateComplete(linkTree: LinkTree): {
    isValid: boolean;
    errors: string[];
    warnings: string[];
  } {
    const errors: string[] = [];
    const warnings: string[] = [];
    
    // Validar información básica
    if (!linkTree.title?.trim()) {
      warnings.push('Se recomienda agregar un título');
    }
    
    if (!linkTree.description?.trim()) {
      warnings.push('Se recomienda agregar una descripción');
    }
    
    // Validar enlaces
    if (!linkTree.links || linkTree.links.length === 0) {
      errors.push('Debe tener al menos un enlace');
    } else {
      linkTree.links.forEach((link, index) => {
        const linkErrors = this.validateLink(link);
        linkErrors.forEach(error => {
          errors.push(`Enlace ${index + 1}: ${error}`);
        });
      });
    }
    
    // Validar slug personalizado
    if (linkTree.customSlug) {
      if (!/^[a-zA-Z0-9_-]{3,50}$/.test(linkTree.customSlug)) {
        errors.push('El slug personalizado debe tener entre 3-50 caracteres y solo puede contener letras, números, guiones y guiones bajos');
      }
    }
    
    // Validar colores
    const colorFields = ['backgroundColor', 'textColor', 'linksBackgroundColor', 'linksColor'];
    colorFields.forEach(field => {
      const color = linkTree[field as keyof LinkTree] as string;
      if (color && !this.isValidColor(color)) {
        errors.push(`Color inválido en ${field}: ${color}`);
      }
    });
    
    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }
  
  /**
   * Valida un enlace individual
   */
  static validateLink(link: Link): string[] {
    const errors: string[] = [];
    
    if (!link.title?.trim()) {
      errors.push('El título es requerido');
    }
    
    if (!link.url?.trim()) {
      errors.push('La URL es requerida');
    } else {
      try {
        new URL(link.url);
      } catch {
        errors.push('La URL no es válida');
      }
    }
    
    if (link.description && link.description.length > 200) {
      errors.push('La descripción no puede exceder 200 caracteres');
    }
    
    if (link.customColor && !this.isValidColor(link.customColor)) {
      errors.push('Color personalizado inválido');
    }
    
    return errors;
  }
  
  /**
   * Valida si un color es válido
   */
  private static isValidColor(color: string): boolean {
    return /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(color);
  }
}

// ===== EXPORTAR INSTANCIAS Y CLASES =====

export const linkTreeUrlGenerator = new LinkTreeUrlGenerator();
export const linkTreeMetrics = LinkTreeMetrics;
export const linkTreeOptimizer = LinkTreeOptimizer;
export const linkTreeDataManager = LinkTreeDataManager;
export const linkTreeThemeGenerator = LinkTreeThemeGenerator;
export const linkTreeValidator = LinkTreeValidator;