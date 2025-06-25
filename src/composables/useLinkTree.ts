// src/composables/useLinkTree.ts

import type { 
  LinkTree, 
  Link, 
  LinkTreeAnalytics,
  LinkTreeCreateData,
  LinkTreeUpdateData,
  LinkCreateData,
  LinkUpdateData 
} from '../interfaces/links.ts';
import { linkTreeService } from '../services/linkTreeService.ts';
import { 
  LinkTreeMetrics, 
  LinkTreeOptimizer,
  LinkTreeValidator,
  linkTreeUrlGenerator 
} from '../utils/linkTreeUtils.ts';

/**
 * Composable principal para manejar LinkTree en aplicaciones Astro
 * Proporciona una API unificada para todas las operaciones de LinkTree
 */
export class LinkTreeComposable {
  private linkTree: LinkTree | null = null;
  private analytics: LinkTreeAnalytics | null = null;
  private isLoading = false;
  private error: string | null = null;

  // ===== GETTERS =====

  get currentLinkTree(): LinkTree | null {
    return this.linkTree;
  }

  get currentAnalytics(): LinkTreeAnalytics | null {
    return this.analytics;
  }

  get loading(): boolean {
    return this.isLoading;
  }

  get lastError(): string | null {
    return this.error;
  }

  get activeLinks(): Link[] {
    if (!this.linkTree) return [];
    return this.linkTree.links.filter(link => link.active);
  }

  get publicUrl(): string {
    if (!this.linkTree) return '';
    return linkTreeUrlGenerator.getPublicUrl(this.linkTree);
  }

  // ===== MÉTODOS DE CARGA =====

  /**
   * Carga un LinkTree por ID
   */
  async loadById(linkTreeId: string): Promise<LinkTree | null> {
    this.setLoading(true);
    this.clearError();

    try {
      const result = await linkTreeService.getLinkTree(linkTreeId);
      
      if (result.success && result.data) {
        this.linkTree = result.data;
        return result.data;
      } else {
        this.setError(result.error || 'Error cargando LinkTree');
        return null;
      }
    } catch (err) {
      this.setError(err instanceof Error ? err.message : 'Error desconocido');
      return null;
    } finally {
      this.setLoading(false);
    }
  }

  /**
   * Carga un LinkTree por slug
   */
  async loadBySlug(slug: string): Promise<LinkTree | null> {
    this.setLoading(true);
    this.clearError();

    try {
      const result = await linkTreeService.getLinkTreeBySlug(slug);
      
      if (result.success && result.data) {
        this.linkTree = result.data;
        return result.data;
      } else {
        this.setError(result.error || 'LinkTree no encontrado');
        return null;
      }
    } catch (err) {
      this.setError(err instanceof Error ? err.message : 'Error desconocido');
      return null;
    } finally {
      this.setLoading(false);
    }
  }

  /**
   * Carga un LinkTree por username del restaurante
   */
  async loadByUsername(username: string): Promise<LinkTree | null> {
    this.setLoading(true);
    this.clearError();

    try {
      const result = await linkTreeService.getLinkTreeByUsername(username);
      
      if (result.success && result.data) {
        this.linkTree = result.data;
        return result.data;
      } else {
        this.setError(result.error || 'LinkTree no encontrado');
        return null;
      }
    } catch (err) {
      this.setError(err instanceof Error ? err.message : 'Error desconocido');
      return null;
    } finally {
      this.setLoading(false);
    }
  }

  /**
   * Carga un LinkTree por ID del restaurante
   */
  async loadByRestaurant(restaurantId: string): Promise<LinkTree | null> {
    this.setLoading(true);
    this.clearError();

    try {
      const result = await linkTreeService.getLinkTreeByRestaurant(restaurantId);
      
      if (result.success && result.data) {
        this.linkTree = result.data;
        return result.data;
      } else {
        this.setError(result.error || 'LinkTree no encontrado');
        return null;
      }
    } catch (err) {
      this.setError(err instanceof Error ? err.message : 'Error desconocido');
      return null;
    } finally {
      this.setLoading(false);
    }
  }

  // ===== MÉTODOS DE ANÁLISIS =====

  /**
   * Carga las analíticas del LinkTree actual
   */
  async loadAnalytics(): Promise<LinkTreeAnalytics | null> {
    if (!this.linkTree?.id) {
      this.setError('No hay LinkTree cargado');
      return null;
    }

    this.setLoading(true);
    this.clearError();

    try {
      const result = await linkTreeService.getAnalytics(this.linkTree.id);
      
      if (result.success && result.data) {
        this.analytics = result.data;
        return result.data;
      } else {
        this.setError(result.error || 'Error cargando analíticas');
        return null;
      }
    } catch (err) {
      this.setError(err instanceof Error ? err.message : 'Error desconocido');
      return null;
    } finally {
      this.setLoading(false);
    }
  }

  /**
   * Obtiene métricas calculadas
   */
  getMetrics() {
    if (!this.analytics) return null;

    return {
      clickThroughRate: LinkTreeMetrics.getClickThroughRate(this.analytics),
      mostPopularLink: LinkTreeMetrics.getMostPopularLink(this.analytics),
      last7Days: LinkTreeMetrics.getPeriodStats(this.analytics, 7),
      last30Days: LinkTreeMetrics.getPeriodStats(this.analytics, 30),
      performanceReport: LinkTreeMetrics.generatePerformanceReport(this.analytics)
    };
  }

  // ===== MÉTODOS DE OPTIMIZACIÓN =====

  /**
   * Analiza la optimización del LinkTree actual
   */
  analyzeOptimization() {
    if (!this.linkTree) return null;
    return LinkTreeOptimizer.analyzeOptimization(this.linkTree);
  }

  /**
   * Genera metadatos para SEO
   */
  generateMetadata() {
    if (!this.linkTree) return null;
    return LinkTreeOptimizer.generateMetadata(this.linkTree);
  }

  // ===== MÉTODOS DE VALIDACIÓN =====

  /**
   * Valida el LinkTree actual
   */
  validate() {
    if (!this.linkTree) return null;
    return LinkTreeValidator.validateComplete(this.linkTree);
  }

  /**
   * Valida un enlace específico
   */
  validateLink(link: Link) {
    return LinkTreeValidator.validateLink(link);
  }

  // ===== MÉTODOS DE UTILIDAD =====

  /**
   * Obtiene URLs para compartir en redes sociales
   */
  getSocialShareUrls(message?: string) {
    if (!this.linkTree) return null;
    return linkTreeUrlGenerator.getSocialShareUrls(this.linkTree, message);
  }

  /**
   * Registra un clic en un enlace
   */
  async registerLinkClick(linkId: string): Promise<boolean> {
    if (!this.linkTree?.id) return false;

    try {
      const result = await linkTreeService.registerLinkClick(this.linkTree.id, linkId);
      return result.success;
    } catch (err) {
      console.error('Error registering link click:', err);
      return false;
    }
  }

  /**
   * Busca un enlace por ID
   */
  findLinkById(linkId: string): Link | null {
    if (!this.linkTree) return null;
    return this.linkTree.links.find(link => link.id === linkId) || null;
  }

  /**
   * Filtra enlaces por tipo
   */
  getLinksByType(type: string): Link[] {
    if (!this.linkTree) return [];
    return this.linkTree.links.filter(link => link.type === type && link.active);
  }

  /**
   * Obtiene enlaces ordenados
   */
  getOrderedLinks(): Link[] {
    if (!this.linkTree) return [];
    return [...this.linkTree.links].sort((a, b) => a.order - b.order);
  }

  // ===== MÉTODOS PRIVADOS =====

  private setLoading(loading: boolean) {
    this.isLoading = loading;
  }

  private setError(error: string | null) {
    this.error = error;
  }

  private clearError() {
    this.error = null;
  }

  // ===== MÉTODOS ESTÁTICOS =====

  /**
   * Crea una nueva instancia del composable
   */
  static create(): LinkTreeComposable {
    return new LinkTreeComposable();
  }

  /**
   * Carga un LinkTree estáticamente (útil para SSR)
   */
  static async loadStatic(identifier: string, type: 'id' | 'slug' | 'username' | 'restaurant' = 'slug'): Promise<{
    linkTree: LinkTree | null;
    error: string | null;
  }> {
    try {
      let result;
      
      switch (type) {
        case 'id':
          result = await linkTreeService.getLinkTree(identifier);
          break;
        case 'slug':
          result = await linkTreeService.getLinkTreeBySlug(identifier);
          break;
        case 'username':
          result = await linkTreeService.getLinkTreeByUsername(identifier);
          break;
        case 'restaurant':
          result = await linkTreeService.getLinkTreeByRestaurant(identifier);
          break;
        default:
          throw new Error(`Tipo de carga no válido: ${type}`);
      }

      if (result.success && result.data) {
        return {
          linkTree: result.data,
          error: null
        };
      } else {
        return {
          linkTree: null,
          error: result.error || 'LinkTree no encontrado'
        };
      }
    } catch (err) {
      return {
        linkTree: null,
        error: err instanceof Error ? err.message : 'Error desconocido'
      };
    }
  }

  /**
   * Valida un slug estáticamente
   */
  static validateSlug(slug: string): boolean {
    return /^[a-zA-Z0-9_-]{3,50}$/.test(slug);
  }

  /**
   * Genera un slug a partir de un título
   */
  static generateSlug(title: string): string {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .replace(/\s+/g, '-')
      .substring(0, 30);
  }
}

/**
 * Hook para usar en componentes Svelte dentro de Astro
 */
export function useLinkTree(): LinkTreeComposable {
  return LinkTreeComposable.create();
}

/**
 * Función para cargar LinkTree en páginas Astro (SSR)
 */
export async function loadLinkTreeForPage(
  identifier: string, 
  type: 'id' | 'slug' | 'username' | 'restaurant' = 'slug'
) {
  return LinkTreeComposable.loadStatic(identifier, type);
}

/**
 * Utilidades para templates de Astro
 */
export const linkTreeUtils = {
  /**
   * Genera metadatos completos para una página de LinkTree
   */
  generatePageMetadata(linkTree: LinkTree, baseUrl: string) {
    const metadata = LinkTreeOptimizer.generateMetadata(linkTree);
    const shareUrls = linkTreeUrlGenerator.getSocialShareUrls(linkTree);
    
    return {
      ...metadata,
      shareUrls,
      structuredData: {
        "@context": "https://schema.org",
        "@type": "WebPage",
        "name": metadata.title,
        "description": metadata.description,
        "url": metadata.canonical,
        "author": {
          "@type": "Organization",
          "name": linkTree.title || "LinkTree"
        },
        "mainEntity": {
          "@type": "ItemList",
          "numberOfItems": linkTree.links.filter(link => link.active).length,
          "itemListElement": linkTree.links
            .filter(link => link.active)
            .map((link, index) => ({
              "@type": "ListItem",
              "position": index + 1,
              "name": link.title,
              "url": link.url,
              "description": link.description
            }))
        }
      }
    };
  },

  /**
   * Valida si un LinkTree es público y accesible
   */
  isPubliclyAccessible(linkTree: LinkTree): boolean {
    return linkTree.isPublic && linkTree.links.some(link => link.active);
  },

  /**
   * Genera configuración para PWA
   */
  generatePWAConfig(linkTree: LinkTree) {
    return {
      name: linkTree.title || 'Mi LinkTree',
      shortName: linkTree.title?.substring(0, 12) || 'LinkTree',
      description: linkTree.description || 'Mi página de enlaces',
      themeColor: linkTree.backgroundColor || '#3b82f6',
      backgroundColor: linkTree.backgroundColor || '#ffffff',
      display: 'standalone',
      orientation: 'portrait',
      scope: `/links/${linkTree.customSlug || linkTree.id}/`,
      startUrl: `/links/${linkTree.customSlug || linkTree.id}/`
    };
  },

  /**
   * Formatea datos para compartir
   */
  formatShareData(linkTree: LinkTree, url: string) {
    return {
      title: linkTree.title || 'Mi LinkTree',
      text: linkTree.description || 'Visita mi página de enlaces',
      url: url
    };
  }
};

// Export default para compatibilidad
export default LinkTreeComposable;