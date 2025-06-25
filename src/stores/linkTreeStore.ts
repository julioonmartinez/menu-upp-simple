// src/stores/linkTreeStore.ts

import { writable, derived, type Writable, type Readable } from 'svelte/store';
import { 
  linkTreeService, 
  type ApiResult,
  type LinkTreeCreateRequest,
  type LinkTreeUpdateRequest,
  type LinkTreeResponse,
  type LinkCreateRequest,
  type LinkUpdateRequest,
  type LinkResponse,
  type ImageUploadResponse,
  type LinkTreeAnalytics
} from '../services/linkTreeService.ts';
import type { LinkTree, Link } from '../interfaces/links.ts';
import { authStore } from './authStore.ts';

// Types para el estado de LinkTrees
export interface LinkTreesState {
  // LinkTrees en cache
  linkTrees: LinkTree[];
  currentLinkTree: LinkTree | null;
  currentLinks: Link[];
  
  // Estados de carga para LinkTrees
  isLoading: boolean;
  isLoadingCurrent: boolean;
  isCreating: boolean;
  isUpdating: boolean;
  isDeleting: boolean;
  isUploadingImage: boolean;
  
  // Estados de carga para Links
  isLoadingLinks: boolean;
  isCreatingLink: boolean;
  isUpdatingLink: boolean;
  isDeletingLink: boolean;
  isRegisteringClick: boolean;
  
  // Estados para Analytics
  isLoadingAnalytics: boolean;
  currentAnalytics: LinkTreeAnalytics | null;
  
  // Errores
  error: string | null;
  createError: string | null;
  updateError: string | null;
  deleteError: string | null;
  imageError: string | null;
  linkError: string | null;
  analyticsError: string | null;
  
  // Cache metadata
  lastUpdated: {
    linkTrees: Date | null;
    current: Date | null;
    links: Date | null;
    analytics: Date | null;
  };
  
  // Usuario actual
  currentUserId: string | null;
  isAuthenticated: boolean;
}

// Types para resultados de acciones
export interface CreateLinkTreeResult {
  success: boolean;
  linkTree?: LinkTreeResponse;
  error?: string;
}

export interface UpdateLinkTreeResult {
  success: boolean;
  linkTree?: LinkTreeResponse;
  error?: string;
}

export interface DeleteLinkTreeResult {
  success: boolean;
  message?: string;
  error?: string;
}

export interface UploadImageResult {
  success: boolean;
  linkTree?: ImageUploadResponse;
  error?: string;
}

export interface CreateLinkResult {
  success: boolean;
  link?: LinkResponse;
  error?: string;
}

export interface UpdateLinkResult {
  success: boolean;
  link?: LinkResponse;
  error?: string;
}

export interface DeleteLinkResult {
  success: boolean;
  message?: string;
  error?: string;
}

export interface RegisterClickResult {
  success: boolean;
  message?: string;
  error?: string;
}

/**
 * Estado inicial del store
 */
const initialState: LinkTreesState = {
  linkTrees: [],
  currentLinkTree: null,
  currentLinks: [],
  isLoading: false,
  isLoadingCurrent: false,
  isCreating: false,
  isUpdating: false,
  isDeleting: false,
  isUploadingImage: false,
  isLoadingLinks: false,
  isCreatingLink: false,
  isUpdatingLink: false,
  isDeletingLink: false,
  isRegisteringClick: false,
  isLoadingAnalytics: false,
  currentAnalytics: null,
  error: null,
  createError: null,
  updateError: null,
  deleteError: null,
  imageError: null,
  linkError: null,
  analyticsError: null,
  lastUpdated: {
    linkTrees: null,
    current: null,
    links: null,
    analytics: null
  },
  currentUserId: null,
  isAuthenticated: false
};

/**
 * Clase para manejar el estado de LinkTrees
 */
class LinkTreeStore {
  private store: Writable<LinkTreesState>;
  
  // Stores derivados públicos
  public readonly subscribe: Writable<LinkTreesState>['subscribe'];
  public readonly isLoading: Readable<boolean>;
  public readonly isLoadingCurrent: Readable<boolean>;
  public readonly isCreating: Readable<boolean>;
  public readonly isUpdating: Readable<boolean>;
  public readonly isDeleting: Readable<boolean>;
  public readonly isUploadingImage: Readable<boolean>;
  public readonly isLoadingLinks: Readable<boolean>;
  public readonly isCreatingLink: Readable<boolean>;
  public readonly isUpdatingLink: Readable<boolean>;
  public readonly isDeletingLink: Readable<boolean>;
  public readonly isRegisteringClick: Readable<boolean>;
  public readonly isLoadingAnalytics: Readable<boolean>;
  public readonly error: Readable<string | null>;
  public readonly createError: Readable<string | null>;
  public readonly updateError: Readable<string | null>;
  public readonly deleteError: Readable<string | null>;
  public readonly imageError: Readable<string | null>;
  public readonly linkError: Readable<string | null>;
  public readonly analyticsError: Readable<string | null>;
  public readonly linkTrees: Readable<LinkTree[]>;
  public readonly currentLinkTree: Readable<LinkTree | null>;
  public readonly currentLinks: Readable<Link[]>;
  public readonly currentAnalytics: Readable<LinkTreeAnalytics | null>;
  public readonly isAuthenticated: Readable<boolean>;

  constructor() {
    this.store = writable<LinkTreesState>(initialState);
    this.subscribe = this.store.subscribe;

    // Stores derivados
    this.isLoading = derived(this.store, $state => $state.isLoading);
    this.isLoadingCurrent = derived(this.store, $state => $state.isLoadingCurrent);
    this.isCreating = derived(this.store, $state => $state.isCreating);
    this.isUpdating = derived(this.store, $state => $state.isUpdating);
    this.isDeleting = derived(this.store, $state => $state.isDeleting);
    this.isUploadingImage = derived(this.store, $state => $state.isUploadingImage);
    this.isLoadingLinks = derived(this.store, $state => $state.isLoadingLinks);
    this.isCreatingLink = derived(this.store, $state => $state.isCreatingLink);
    this.isUpdatingLink = derived(this.store, $state => $state.isUpdatingLink);
    this.isDeletingLink = derived(this.store, $state => $state.isDeletingLink);
    this.isRegisteringClick = derived(this.store, $state => $state.isRegisteringClick);
    this.isLoadingAnalytics = derived(this.store, $state => $state.isLoadingAnalytics);
    this.error = derived(this.store, $state => $state.error);
    this.createError = derived(this.store, $state => $state.createError);
    this.updateError = derived(this.store, $state => $state.updateError);
    this.deleteError = derived(this.store, $state => $state.deleteError);
    this.imageError = derived(this.store, $state => $state.imageError);
    this.linkError = derived(this.store, $state => $state.linkError);
    this.analyticsError = derived(this.store, $state => $state.analyticsError);
    this.linkTrees = derived(this.store, $state => $state.linkTrees);
    this.currentLinkTree = derived(this.store, $state => $state.currentLinkTree);
    this.currentLinks = derived(this.store, $state => $state.currentLinks);
    this.currentAnalytics = derived(this.store, $state => $state.currentAnalytics);
    this.isAuthenticated = derived(this.store, $state => $state.isAuthenticated);

    // Reaccionar a cambios de autenticación
    authStore.isAuthenticated.subscribe(isAuthenticated => {
      this.store.update(state => ({
        ...state,
        isAuthenticated,
        currentUserId: isAuthenticated ? authStore.getCurrentUser()?.id || null : null
      }));

      // Si el usuario se desautentica, limpiar datos sensibles
      if (!isAuthenticated) {
        this.clearUserData();
      }
    });

    // Reaccionar a cambios de usuario
    authStore.user.subscribe(user => {
      this.store.update(state => ({
        ...state,
        currentUserId: user?.id || null
      }));
    });
  }

  // ===== MÉTODOS PARA LINKTREE =====

  /**
   * Obtiene el LinkTree de un restaurante por ID
   */
  async loadLinkTreeByRestaurant(restaurantId: string, forceReload: boolean = false): Promise<ApiResult<LinkTree>> {
    // Verificar cache si no es forzado
    if (!forceReload) {
      const currentState = this.getCurrentState();
      const cached = currentState.linkTrees.find(lt => lt.restaurantId === restaurantId);
      
      if (cached) {
        this.setCurrentLinkTree(cached);
        return {
          success: true,
          data: cached
        };
      }
    }

    this.setLoadingCurrent(true);
    this.clearError();

    try {
      const result = await linkTreeService.getLinkTreeByRestaurant(restaurantId);

      if (result.success && result.data) {
        this.setCurrentLinkTree(result.data);
        this.addToCache(result.data);
        this.setLoadingCurrent(false);

        return {
          success: true,
          data: result.data
        };
      } else {
        this.setLoadingCurrent(false);
        this.setError(result.error || 'Error cargando LinkTree del restaurante');
        
        return {
          success: false,
          error: result.error || 'Error cargando LinkTree del restaurante'
        };
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido cargando LinkTree';
      this.setLoadingCurrent(false);
      this.setError(errorMessage);
      
      return {
        success: false,
        error: errorMessage
      };
    }
  }

  /**
   * Obtiene el LinkTree por username del restaurante
   */
  async loadLinkTreeByUsername(username: string): Promise<ApiResult<LinkTree>> {
    this.setLoadingCurrent(true);
    this.clearError();

    try {
      const result = await linkTreeService.getLinkTreeByUsername(username);

      if (result.success && result.data) {
        this.setCurrentLinkTree(result.data);
        this.addToCache(result.data);
        this.setLoadingCurrent(false);

        return {
          success: true,
          data: result.data
        };
      } else {
        this.setLoadingCurrent(false);
        this.setError(result.error || 'Error cargando LinkTree por username');
        
        return {
          success: false,
          error: result.error || 'Error cargando LinkTree por username'
        };
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido cargando LinkTree';
      this.setLoadingCurrent(false);
      this.setError(errorMessage);
      
      return {
        success: false,
        error: errorMessage
      };
    }
  }

  /**
   * Obtiene el LinkTree por slug
   */
  async loadLinkTreeBySlug(slug: string): Promise<ApiResult<LinkTree>> {
    this.setLoadingCurrent(true);
    this.clearError();

    try {
      const result = await linkTreeService.getLinkTreeBySlug(slug);

      if (result.success && result.data) {
        this.setCurrentLinkTree(result.data);
        this.addToCache(result.data);
        this.setLoadingCurrent(false);

        return {
          success: true,
          data: result.data
        };
      } else {
        this.setLoadingCurrent(false);
        this.setError(result.error || 'Error cargando LinkTree por slug');
        
        return {
          success: false,
          error: result.error || 'Error cargando LinkTree por slug'
        };
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido cargando LinkTree';
      this.setLoadingCurrent(false);
      this.setError(errorMessage);
      
      return {
        success: false,
        error: errorMessage
      };
    }
  }

  /**
   * Obtiene un LinkTree específico por ID (requiere autenticación)
   */
  async loadLinkTree(linkTreeId: string, forceReload: boolean = false): Promise<ApiResult<LinkTree>> {
    // Verificar cache si no es forzado
    if (!forceReload) {
      const currentState = this.getCurrentState();
      const cached = currentState.linkTrees.find(lt => lt.id === linkTreeId);
      
      if (cached) {
        this.setCurrentLinkTree(cached);
        return {
          success: true,
          data: cached
        };
      }
    }

    this.setLoadingCurrent(true);
    this.clearError();

    try {
      const result = await linkTreeService.getLinkTree(linkTreeId);

      if (result.success && result.data) {
        this.setCurrentLinkTree(result.data);
        this.addToCache(result.data);
        this.setLoadingCurrent(false);

        return {
          success: true,
          data: result.data
        };
      } else {
        this.setLoadingCurrent(false);
        this.setError(result.error || 'Error cargando LinkTree');
        
        return {
          success: false,
          error: result.error || 'Error cargando LinkTree'
        };
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido cargando LinkTree';
      this.setLoadingCurrent(false);
      this.setError(errorMessage);
      
      return {
        success: false,
        error: errorMessage
      };
    }
  }

  /**
   * Crea un nuevo LinkTree
   */
  async createLinkTree(linkTreeData: LinkTreeCreateRequest): Promise<CreateLinkTreeResult> {
    if (!this.getCurrentState().isAuthenticated) {
      return {
        success: false,
        error: 'Debes estar autenticado para crear LinkTrees'
      };
    }

    this.setCreating(true);
    this.clearCreateError();

    try {
      const result = await linkTreeService.createLinkTree(linkTreeData);

      if (result.success && result.data) {
        // Actualizar cache local
        this.setCurrentLinkTree(result.data);
        this.addToCache(result.data);
        this.setCreating(false);

        return {
          success: true,
          linkTree: result.data
        };
      } else {
        this.setCreating(false);
        this.setCreateError(result.error || 'Error creando LinkTree');
        
        return {
          success: false,
          error: result.error || 'Error creando LinkTree'
        };
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido creando LinkTree';
      this.setCreating(false);
      this.setCreateError(errorMessage);
      
      return {
        success: false,
        error: errorMessage
      };
    }
  }

  /**
   * Actualiza un LinkTree existente
   */
  async updateLinkTree(
    linkTreeId: string,
    linkTreeData: LinkTreeUpdateRequest
  ): Promise<UpdateLinkTreeResult> {
    if (!this.getCurrentState().isAuthenticated) {
      return {
        success: false,
        error: 'Debes estar autenticado para actualizar LinkTrees'
      };
    }

    this.setUpdating(true);
    this.clearUpdateError();

    try {
      const result = await linkTreeService.updateLinkTree(linkTreeId, linkTreeData);

      if (result.success && result.data) {
        // Actualizar cache local
        this.store.update(state => {
          const updateLinkTreeInArray = (linkTrees: LinkTree[]) =>
            linkTrees.map(lt => lt.id === linkTreeId ? result.data! : lt);

          return {
            ...state,
            linkTrees: updateLinkTreeInArray(state.linkTrees),
            currentLinkTree: state.currentLinkTree?.id === linkTreeId ? result.data! : state.currentLinkTree,
            isUpdating: false,
            updateError: null,
            lastUpdated: {
              ...state.lastUpdated,
              current: new Date()
            }
          };
        });

        return {
          success: true,
          linkTree: result.data
        };
      } else {
        this.setUpdating(false);
        this.setUpdateError(result.error || 'Error actualizando LinkTree');
        
        return {
          success: false,
          error: result.error || 'Error actualizando LinkTree'
        };
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido actualizando LinkTree';
      this.setUpdating(false);
      this.setUpdateError(errorMessage);
      
      return {
        success: false,
        error: errorMessage
      };
    }
  }

  /**
   * Elimina un LinkTree
   */
  async deleteLinkTree(linkTreeId: string): Promise<DeleteLinkTreeResult> {
    if (!this.getCurrentState().isAuthenticated) {
      return {
        success: false,
        error: 'Debes estar autenticado para eliminar LinkTrees'
      };
    }

    this.setDeleting(true);
    this.clearDeleteError();

    try {
      const result = await linkTreeService.deleteLinkTree(linkTreeId);

      if (result.success) {
        // Actualizar cache local
        this.store.update(state => {
          const filterLinkTrees = (linkTrees: LinkTree[]) =>
            linkTrees.filter(lt => lt.id !== linkTreeId);

          return {
            ...state,
            linkTrees: filterLinkTrees(state.linkTrees),
            currentLinkTree: state.currentLinkTree?.id === linkTreeId ? null : state.currentLinkTree,
            currentLinks: state.currentLinkTree?.id === linkTreeId ? [] : state.currentLinks,
            isDeleting: false,
            deleteError: null
          };
        });

        return {
          success: true,
          message: result.data?.message || 'LinkTree eliminado correctamente'
        };
      } else {
        this.setDeleting(false);
        this.setDeleteError(result.error || 'Error eliminando LinkTree');
        
        return {
          success: false,
          error: result.error || 'Error eliminando LinkTree'
        };
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido eliminando LinkTree';
      this.setDeleting(false);
      this.setDeleteError(errorMessage);
      
      return {
        success: false,
        error: errorMessage
      };
    }
  }

  // ===== MÉTODOS PARA IMÁGENES =====

  /**
   * Sube imagen de perfil para un LinkTree
   */
  async uploadProfileImage(linkTreeId: string, file: File): Promise<UploadImageResult> {
    return this.uploadImage(linkTreeId, file, 'profile');
  }

  /**
   * Sube imagen de cover para un LinkTree
   */
  async uploadCoverImage(linkTreeId: string, file: File): Promise<UploadImageResult> {
    return this.uploadImage(linkTreeId, file, 'cover');
  }

  /**
   * Sube imagen de texto para un LinkTree
   */
  async uploadTextImage(linkTreeId: string, file: File): Promise<UploadImageResult> {
    return this.uploadImage(linkTreeId, file, 'text');
  }

  /**
   * Método privado para subir imágenes
   */
  private async uploadImage(
    linkTreeId: string, 
    file: File, 
    imageType: 'profile' | 'cover' | 'text'
  ): Promise<UploadImageResult> {
    if (!this.getCurrentState().isAuthenticated) {
      return {
        success: false,
        error: 'Debes estar autenticado para subir imágenes'
      };
    }

    this.setUploadingImage(true);
    this.clearImageError();

    try {
      let result: ApiResult<ImageUploadResponse>;
      
      switch (imageType) {
        case 'profile':
          result = await linkTreeService.uploadProfileImage(linkTreeId, file);
          break;
        case 'cover':
          result = await linkTreeService.uploadCoverImage(linkTreeId, file);
          break;
        case 'text':
          result = await linkTreeService.uploadTextImage(linkTreeId, file);
          break;
        default:
          throw new Error('Tipo de imagen no válido');
      }

      if (result.success && result.data) {
        // Actualizar cache local
        this.store.update(state => {
          const updateLinkTreeInArray = (linkTrees: LinkTree[]) =>
            linkTrees.map(lt => lt.id === linkTreeId ? { ...lt, ...result.data! } : lt);

          return {
            ...state,
            linkTrees: updateLinkTreeInArray(state.linkTrees),
            currentLinkTree: state.currentLinkTree?.id === linkTreeId 
              ? { ...state.currentLinkTree, ...result.data! } 
              : state.currentLinkTree,
            isUploadingImage: false,
            imageError: null
          };
        });

        return {
          success: true,
          linkTree: result.data
        };
      } else {
        this.setUploadingImage(false);
        this.setImageError(result.error || 'Error subiendo imagen');
        
        return {
          success: false,
          error: result.error || 'Error subiendo imagen'
        };
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido subiendo imagen';
      this.setUploadingImage(false);
      this.setImageError(errorMessage);
      
      return {
        success: false,
        error: errorMessage
      };
    }
  }

  // ===== MÉTODOS PARA LINKS =====

  /**
   * Obtiene todos los enlaces de un LinkTree
   */
  async loadLinks(linkTreeId: string, forceReload: boolean = false): Promise<ApiResult<Link[]>> {
    // Verificar cache si no es forzado
    if (!forceReload) {
      const currentState = this.getCurrentState();
      if (currentState.currentLinkTree?.id === linkTreeId && currentState.currentLinks.length > 0) {
        return {
          success: true,
          data: currentState.currentLinks
        };
      }
    }

    this.setLoadingLinks(true);
    this.clearLinkError();

    try {
      const result = await linkTreeService.getLinks(linkTreeId);

      if (result.success && result.data) {
        this.store.update(state => ({
          ...state,
          currentLinks: result.data!,
          isLoadingLinks: false,
          linkError: null,
          lastUpdated: {
            ...state.lastUpdated,
            links: new Date()
          }
        }));

        return {
          success: true,
          data: result.data
        };
      } else {
        this.setLoadingLinks(false);
        this.setLinkError(result.error || 'Error cargando enlaces');
        
        return {
          success: false,
          error: result.error || 'Error cargando enlaces'
        };
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido cargando enlaces';
      this.setLoadingLinks(false);
      this.setLinkError(errorMessage);
      
      return {
        success: false,
        error: errorMessage
      };
    }
  }

  /**
   * Crea un nuevo enlace
   */
  async createLink(linkTreeId: string, linkData: LinkCreateRequest): Promise<CreateLinkResult> {
    if (!this.getCurrentState().isAuthenticated) {
      return {
        success: false,
        error: 'Debes estar autenticado para crear enlaces'
      };
    }

    this.setCreatingLink(true);
    this.clearLinkError();

    try {
      const result = await linkTreeService.createLink(linkTreeId, linkData);

      if (result.success && result.data) {
        // Actualizar cache local
        this.store.update(state => ({
          ...state,
          currentLinks: [...state.currentLinks, result.data!],
          isCreatingLink: false,
          linkError: null,
          lastUpdated: {
            ...state.lastUpdated,
            links: new Date()
          }
        }));

        return {
          success: true,
          link: result.data
        };
      } else {
        this.setCreatingLink(false);
        this.setLinkError(result.error || 'Error creando enlace');
        
        return {
          success: false,
          error: result.error || 'Error creando enlace'
        };
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido creando enlace';
      this.setCreatingLink(false);
      this.setLinkError(errorMessage);
      
      return {
        success: false,
        error: errorMessage
      };
    }
  }

  /**
   * Actualiza un enlace existente
   */
  async updateLink(
    linkTreeId: string,
    linkId: string,
    linkData: LinkUpdateRequest
  ): Promise<UpdateLinkResult> {
    if (!this.getCurrentState().isAuthenticated) {
      return {
        success: false,
        error: 'Debes estar autenticado para actualizar enlaces'
      };
    }

    this.setUpdatingLink(true);
    this.clearLinkError();

    try {
      const result = await linkTreeService.updateLink(linkTreeId, linkId, linkData);

      if (result.success && result.data) {
        // Actualizar cache local
        this.store.update(state => ({
          ...state,
          currentLinks: state.currentLinks.map(link => 
            link.id === linkId ? result.data! : link
          ),
          isUpdatingLink: false,
          linkError: null,
          lastUpdated: {
            ...state.lastUpdated,
            links: new Date()
          }
        }));

        return {
          success: true,
          link: result.data
        };
      } else {
        this.setUpdatingLink(false);
        this.setLinkError(result.error || 'Error actualizando enlace');
        
        return {
          success: false,
          error: result.error || 'Error actualizando enlace'
        };
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido actualizando enlace';
      this.setUpdatingLink(false);
      this.setLinkError(errorMessage);
      
      return {
        success: false,
        error: errorMessage
      };
    }
  }

  /**
   * Elimina un enlace
   */
  async deleteLink(linkTreeId: string, linkId: string): Promise<DeleteLinkResult> {
    if (!this.getCurrentState().isAuthenticated) {
      return {
        success: false,
        error: 'Debes estar autenticado para eliminar enlaces'
      };
    }

    this.setDeletingLink(true);
    this.clearLinkError();

    try {
      const result = await linkTreeService.deleteLink(linkTreeId, linkId);

      if (result.success) {
        // Actualizar cache local
        this.store.update(state => ({
          ...state,
          currentLinks: state.currentLinks.filter(link => link.id !== linkId),
          isDeletingLink: false,
          linkError: null,
          lastUpdated: {
            ...state.lastUpdated,
            links: new Date()
          }
        }));

        return {
          success: true,
          message: result.data?.message || 'Enlace eliminado correctamente'
        };
      } else {
        this.setDeletingLink(false);
        this.setLinkError(result.error || 'Error eliminando enlace');
        
        return {
          success: false,
          error: result.error || 'Error eliminando enlace'
        };
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido eliminando enlace';
      this.setDeletingLink(false);
      this.setLinkError(errorMessage);
      
      return {
        success: false,
        error: errorMessage
      };
    }
  }

  /**
   * Registra un clic en un enlace
   */
  async registerLinkClick(linkTreeId: string, linkId: string): Promise<RegisterClickResult> {
    this.setRegisteringClick(true);

    try {
      const result = await linkTreeService.registerLinkClick(linkTreeId, linkId);

      if (result.success) {
        // Opcionalmente actualizar el contador local (si tenemos analytics en cache)
        this.store.update(state => ({
          ...state,
          currentLinks: state.currentLinks.map(link => 
            link.id === linkId && link.analytics
              ? { ...link, analytics: { ...link.analytics, clicks: link.analytics.clicks + 1 } }
              : link
          ),
          isRegisteringClick: false
        }));

        return {
          success: true,
          message: result.data?.message || 'Clic registrado correctamente'
        };
      } else {
        this.setRegisteringClick(false);
        
        return {
          success: false,
          error: result.error || 'Error registrando clic'
        };
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido registrando clic';
      this.setRegisteringClick(false);
      
      return {
        success: false,
        error: errorMessage
      };
    }
  }

  // ===== MÉTODOS PARA ANALYTICS =====

  /**
   * Obtiene las analíticas de un LinkTree
   */
  async loadAnalytics(linkTreeId: string, forceReload: boolean = false): Promise<ApiResult<LinkTreeAnalytics>> {
    // Verificar cache si no es forzado
    if (!forceReload) {
      const currentState = this.getCurrentState();
      if (currentState.currentAnalytics && currentState.lastUpdated.analytics) {
        const timeDiff = Date.now() - currentState.lastUpdated.analytics.getTime();
        if (timeDiff < 5 * 60 * 1000) { // 5 minutos de cache para analytics
          return {
            success: true,
            data: currentState.currentAnalytics
          };
        }
      }
    }

    this.setLoadingAnalytics(true);
    this.clearAnalyticsError();

    try {
      const result = await linkTreeService.getAnalytics(linkTreeId);

      if (result.success && result.data) {
        this.store.update(state => ({
          ...state,
          currentAnalytics: result.data!,
          isLoadingAnalytics: false,
          analyticsError: null,
          lastUpdated: {
            ...state.lastUpdated,
            analytics: new Date()
          }
        }));

        return {
          success: true,
          data: result.data
        };
      } else {
        this.setLoadingAnalytics(false);
        this.setAnalyticsError(result.error || 'Error cargando analíticas');
        
        return {
          success: false,
          error: result.error || 'Error cargando analíticas'
        };
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido cargando analíticas';
      this.setLoadingAnalytics(false);
      this.setAnalyticsError(errorMessage);
      
      return {
        success: false,
        error: errorMessage
      };
    }
  }

  // ===== MÉTODOS AUXILIARES PRIVADOS =====

  private setLoadingCurrent(isLoading: boolean): void {
    this.store.update(state => ({ ...state, isLoadingCurrent: isLoading }));
  }

  private setCreating(isCreating: boolean): void {
    this.store.update(state => ({ ...state, isCreating }));
  }

  private setUpdating(isUpdating: boolean): void {
    this.store.update(state => ({ ...state, isUpdating }));
  }

  private setDeleting(isDeleting: boolean): void {
    this.store.update(state => ({ ...state, isDeleting }));
  }

  private setUploadingImage(isUploading: boolean): void {
    this.store.update(state => ({ ...state, isUploadingImage: isUploading }));
  }

  private setLoadingLinks(isLoading: boolean): void {
    this.store.update(state => ({ ...state, isLoadingLinks: isLoading }));
  }

  private setCreatingLink(isCreating: boolean): void {
    this.store.update(state => ({ ...state, isCreatingLink: isCreating }));
  }

  private setUpdatingLink(isUpdating: boolean): void {
    this.store.update(state => ({ ...state, isUpdatingLink: isUpdating }));
  }

  private setDeletingLink(isDeleting: boolean): void {
    this.store.update(state => ({ ...state, isDeletingLink: isDeleting }));
  }

  private setRegisteringClick(isRegistering: boolean): void {
    this.store.update(state => ({ ...state, isRegisteringClick: isRegistering }));
  }

  private setLoadingAnalytics(isLoading: boolean): void {
    this.store.update(state => ({ ...state, isLoadingAnalytics: isLoading }));
  }

  private setCurrentLinkTree(linkTree: LinkTree | null): void {
    this.store.update(state => ({ 
      ...state, 
      currentLinkTree: linkTree,
      currentLinks: linkTree?.links || [],
      lastUpdated: {
        ...state.lastUpdated,
        current: new Date(),
        links: new Date()
      }
    }));
  }

  private addToCache(linkTree: LinkTree): void {
    this.store.update(state => {
      const existingIndex = state.linkTrees.findIndex(lt => lt.id === linkTree.id);
      let updatedLinkTrees: LinkTree[];

      if (existingIndex >= 0) {
        // Actualizar existente
        updatedLinkTrees = [...state.linkTrees];
        updatedLinkTrees[existingIndex] = linkTree;
      } else {
        // Agregar nuevo
        updatedLinkTrees = [linkTree, ...state.linkTrees];
      }

      return {
        ...state,
        linkTrees: updatedLinkTrees,
        lastUpdated: {
          ...state.lastUpdated,
          linkTrees: new Date()
        }
      };
    });
  }

  private setError(error: string | null): void {
    this.store.update(state => ({ ...state, error }));
  }

  private setCreateError(error: string | null): void {
    this.store.update(state => ({ ...state, createError: error }));
  }

  private setUpdateError(error: string | null): void {
    this.store.update(state => ({ ...state, updateError: error }));
  }

  private setDeleteError(error: string | null): void {
    this.store.update(state => ({ ...state, deleteError: error }));
  }

  private setImageError(error: string | null): void {
    this.store.update(state => ({ ...state, imageError: error }));
  }

  private setLinkError(error: string | null): void {
    this.store.update(state => ({ ...state, linkError: error }));
  }

  private setAnalyticsError(error: string | null): void {
    this.store.update(state => ({ ...state, analyticsError: error }));
  }

  private clearError(): void {
    this.setError(null);
  }

  private clearCreateError(): void {
    this.setCreateError(null);
  }

  private clearUpdateError(): void {
    this.setUpdateError(null);
  }

  private clearDeleteError(): void {
    this.setDeleteError(null);
  }

  private clearImageError(): void {
    this.setImageError(null);
  }

  private clearLinkError(): void {
    this.setLinkError(null);
  }

  private clearAnalyticsError(): void {
    this.setAnalyticsError(null);
  }

  /**
   * Limpia los datos del usuario
   */
  private clearUserData(): void {
    this.store.update(state => ({
      ...state,
      linkTrees: [],
      currentLinkTree: null,
      currentLinks: [],
      currentAnalytics: null,
      lastUpdated: {
        linkTrees: null,
        current: null,
        links: null,
        analytics: null
      }
    }));
  }

  /**
   * Limpia todo el cache
   */
  clearCache(): void {
    this.store.update(state => ({
      ...state,
      linkTrees: [],
      currentLinkTree: null,
      currentLinks: [],
      currentAnalytics: null,
      lastUpdated: {
        linkTrees: null,
        current: null,
        links: null,
        analytics: null
      }
    }));
  }

  /**
   * Limpia todos los errores
   */
  clearAllErrors(): void {
    this.store.update(state => ({
      ...state,
      error: null,
      createError: null,
      updateError: null,
      deleteError: null,
      imageError: null,
      linkError: null,
      analyticsError: null
    }));
  }

  /**
   * Obtiene el estado actual (para uso en funciones)
   */
  getCurrentState(): LinkTreesState {
    let currentState: LinkTreesState;
    this.store.subscribe(state => {
      currentState = state;
    })();
    return currentState!;
  }

  /**
   * Métodos helper para obtener valores sincrónicamente
   */
  getIsLoading(): boolean {
    return this.getCurrentState().isLoading;
  }

  getError(): string | null {
    return this.getCurrentState().error;
  }

  getCurrentLinkTree(): LinkTree | null {
    return this.getCurrentState().currentLinkTree;
  }

  getCurrentLinks(): Link[] {
    return this.getCurrentState().currentLinks;
  }

  getCurrentAnalytics(): LinkTreeAnalytics | null {
    return this.getCurrentState().currentAnalytics;
  }

  /**
   * Stores derivados para casos específicos
   */
  getLinkTreeById(linkTreeId: string): Readable<LinkTree | null> {
    return derived(this.store, $state => 
      $state.linkTrees.find(lt => lt.id === linkTreeId) || null
    );
  }

  getLinkById(linkId: string): Readable<Link | null> {
    return derived(this.store, $state => 
      $state.currentLinks.find(link => link.id === linkId) || null
    );
  }

  getActiveLinks(): Readable<Link[]> {
    return derived(this.store, $state => 
      $state.currentLinks.filter(link => link.active)
    );
  }

  getLinksByType(type: string): Readable<Link[]> {
    return derived(this.store, $state => 
      $state.currentLinks.filter(link => link.type === type)
    );
  }
}

/**
 * Instancia única del store de LinkTrees
 */
export const linkTreeStore = new LinkTreeStore();

// Exports individuales para compatibilidad
export const linkTreesLoading = linkTreeStore.isLoading;
export const linkTreesLoadingCurrent = linkTreeStore.isLoadingCurrent;
export const linkTreesCreating = linkTreeStore.isCreating;
export const linkTreesUpdating = linkTreeStore.isUpdating;
export const linkTreesDeleting = linkTreeStore.isDeleting;
export const linkTreesUploadingImage = linkTreeStore.isUploadingImage;
export const linksLoading = linkTreeStore.isLoadingLinks;
export const linksCreating = linkTreeStore.isCreatingLink;
export const linksUpdating = linkTreeStore.isUpdatingLink;
export const linksDeleting = linkTreeStore.isDeletingLink;
export const linkClickRegistering = linkTreeStore.isRegisteringClick;
export const analyticsLoading = linkTreeStore.isLoadingAnalytics;
export const linkTreesError = linkTreeStore.error;
export const linkTreesCreateError = linkTreeStore.createError;
export const linkTreesUpdateError = linkTreeStore.updateError;
export const linkTreesDeleteError = linkTreeStore.deleteError;
export const linkTreesImageError = linkTreeStore.imageError;
export const linksError = linkTreeStore.linkError;
export const analyticsError = linkTreeStore.analyticsError;
export const linkTrees = linkTreeStore.linkTrees;
export const currentLinkTree = linkTreeStore.currentLinkTree;
export const currentLinks = linkTreeStore.currentLinks;
export const currentAnalytics = linkTreeStore.currentAnalytics;
export const linkTreesIsAuthenticated = linkTreeStore.isAuthenticated;

/**
 * Hook personalizado para usar en componentes Svelte
 */
export function useLinkTrees() {
  const state = linkTreeStore.getCurrentState();

  return {
    // Estado general
    isLoading: state.isLoading,
    isLoadingCurrent: state.isLoadingCurrent,
    isCreating: state.isCreating,
    isUpdating: state.isUpdating,
    isDeleting: state.isDeleting,
    isUploadingImage: state.isUploadingImage,
    isLoadingLinks: state.isLoadingLinks,
    isCreatingLink: state.isCreatingLink,
    isUpdatingLink: state.isUpdatingLink,
    isDeletingLink: state.isDeletingLink,
    isRegisteringClick: state.isRegisteringClick,
    isLoadingAnalytics: state.isLoadingAnalytics,
    
    // Errores
    error: state.error,
    createError: state.createError,
    updateError: state.updateError,
    deleteError: state.deleteError,
    imageError: state.imageError,
    linkError: state.linkError,
    analyticsError: state.analyticsError,
    
    // Datos
    linkTrees: state.linkTrees,
    currentLinkTree: state.currentLinkTree,
    currentLinks: state.currentLinks,
    currentAnalytics: state.currentAnalytics,
    isAuthenticated: state.isAuthenticated,
    
    // Métodos para LinkTree
    loadLinkTreeByRestaurant: linkTreeStore.loadLinkTreeByRestaurant.bind(linkTreeStore),
    loadLinkTreeByUsername: linkTreeStore.loadLinkTreeByUsername.bind(linkTreeStore),
    loadLinkTreeBySlug: linkTreeStore.loadLinkTreeBySlug.bind(linkTreeStore),
    loadLinkTree: linkTreeStore.loadLinkTree.bind(linkTreeStore),
    createLinkTree: linkTreeStore.createLinkTree.bind(linkTreeStore),
    updateLinkTree: linkTreeStore.updateLinkTree.bind(linkTreeStore),
    deleteLinkTree: linkTreeStore.deleteLinkTree.bind(linkTreeStore),
    uploadProfileImage: linkTreeStore.uploadProfileImage.bind(linkTreeStore),
    uploadCoverImage: linkTreeStore.uploadCoverImage.bind(linkTreeStore),
    uploadTextImage: linkTreeStore.uploadTextImage.bind(linkTreeStore),
    
    // Métodos para Links
    loadLinks: linkTreeStore.loadLinks.bind(linkTreeStore),
    createLink: linkTreeStore.createLink.bind(linkTreeStore),
    updateLink: linkTreeStore.updateLink.bind(linkTreeStore),
    deleteLink: linkTreeStore.deleteLink.bind(linkTreeStore),
    registerLinkClick: linkTreeStore.registerLinkClick.bind(linkTreeStore),
    
    // Métodos para Analytics
    loadAnalytics: linkTreeStore.loadAnalytics.bind(linkTreeStore),
    
    // Utilidades
    clearCache: linkTreeStore.clearCache.bind(linkTreeStore),
    clearAllErrors: linkTreeStore.clearAllErrors.bind(linkTreeStore),
    
    // Stores reactivos (para uso en componentes)
    linkTreesStore: linkTreeStore.linkTrees,
    currentLinkTreeStore: linkTreeStore.currentLinkTree,
    currentLinksStore: linkTreeStore.currentLinks,
    currentAnalyticsStore: linkTreeStore.currentAnalytics,
    isLoadingStore: linkTreeStore.isLoading,
    errorStore: linkTreeStore.error
  };
}

// Default export
export default linkTreeStore;