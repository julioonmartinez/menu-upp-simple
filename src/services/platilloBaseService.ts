// src/services/platilloBaseService.ts

import type { PlatilloBase } from '../interfaces/platilloBase.ts';
export type { PlatilloBase };

// Types para resultados de API
export interface ApiResult<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}

// API Error interface
export interface ApiError {
  detail: string;
  status?: number;
}

// ✅ Estructura para crear platillo base
export interface PlatilloBaseCreateRequest {
  nombre: string;
  descripcion: string;
  tipo_cocina: string;
  categoria_principal: string;
  subcategoria?: string;
  ingredientes_principales: string[];
  tags?: string[];
  imagen_destacada?: string;
  ingredientes_opcionales?: string[];
  permite_variaciones?: boolean;
  requiere_ingredientes_minimos?: boolean;
}

// ✅ Estructura para actualizar platillo base
export interface PlatilloBaseUpdateRequest {
  nombre?: string;
  descripcion?: string;
  tipo_cocina?: string;
  categoria_principal?: string;
  subcategoria?: string;
  ingredientes_principales?: string[];
  ingredientes_opcionales?: string[];
  tags?: string[];
  imagen_destacada?: string;
  permite_variaciones?: boolean;
  requiere_ingredientes_minimos?: boolean;
}

export type PlatilloBaseResponse = PlatilloBase;

// ✅ Interface para vinculación de platillos
export interface VinculacionPlatilloRequest {
  dish_id: string;
  platillo_base_id: string;
  es_variacion_unica: boolean;
  variacion_descripcion?: string;
  ingredientes_adicionales: string[];
  ingredientes_removidos: string[];
  confianza: number;
}

// ✅ Interface para sugerencias de vinculación
export interface SugerenciaVinculacion {
  platillo_base_id: string;
  nombre: string;
  categoria_principal: string;
  similitud_score: number;
  razon_sugerencia: string;
  ingredientes_coincidentes: string[];
}

// ✅ Interface para rankings de platillo base
export interface RankingPlatilloBase {
  posicion: number;
  platillo_base: PlatilloBase;
  mejor_restaurante?: {
    id: string;
    nombre: string;
    rating: number;
    precio: number;
  };
  mejores_restaurantes: Array<{
    id: string;
    nombre: string;
    rating: number;
    precio: number;
  }>;
  estadisticas_ranking: Record<string, any>;
}

// ✅ Interface para filtros de búsqueda
export interface FiltrosPlatilloBase {
  tipo_cocina?: string;
  categoria_principal?: string;
  subcategoria?: string;
  tags?: string[];
  min_popularidad?: number;
  min_instancias?: number;
  solo_moderados?: boolean;
  solo_visibles?: boolean;
  estado_moderacion?: 'pendiente' | 'aprobado' | 'rechazado' | 'revision';
}

// ✅ Interface para respuesta de búsqueda
export interface BusquedaPlatilloBaseResponse {
  platillos_base: PlatilloBase[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    total_pages: number;
    has_next: boolean;
    has_prev: boolean;
  };
  filtros_aplicados: FiltrosPlatilloBase;
}

// ✅ Interface para estadísticas de platillo base
export interface EstadisticasPlatilloBase {
  num_instancias: number;
  num_restaurantes_activos: number;
  rating_promedio_global: number;
  total_valoraciones: number;
  total_favoritos: number;
  popularidad_score: number;
  nivel_popularidad: 'muy_bajo' | 'bajo' | 'medio' | 'alto' | 'muy_alto';
  precio_promedio?: number;
  precio_minimo?: number;
  precio_maximo?: number;
}

const API_BASE_URL = import.meta.env.PUBLIC_API_URL || 'http://localhost:8000';

/**
 * Servicio para manejar todas las operaciones de platillos base
 * Permite crear, buscar, vincular y gestionar platillos base
 */
class PlatilloBaseService {
  
  /**
   * Obtiene todos los platillos base con filtros opcionales
   */
  async getAllPlatillosBase(
    filtros: FiltrosPlatilloBase = {},
    limit: number = 20,
    page: number = 1,
    sortBy: string = 'popularidad_score',
    sortOrder: number = -1
  ): Promise<ApiResult<BusquedaPlatilloBaseResponse>> {
    try {
      const params = new URLSearchParams({
        limit: limit.toString(),
        page: page.toString(),
        sort_by: sortBy,
        sort_order: sortOrder.toString()
      });

      // Agregar filtros si están definidos
      if (filtros.tipo_cocina) params.append('tipo_cocina', filtros.tipo_cocina);
      if (filtros.categoria_principal) params.append('categoria_principal', filtros.categoria_principal);
      if (filtros.subcategoria) params.append('subcategoria', filtros.subcategoria);
      if (filtros.min_popularidad) params.append('min_popularidad', filtros.min_popularidad.toString());
      if (filtros.min_instancias) params.append('min_instancias', filtros.min_instancias.toString());
      if (filtros.solo_moderados !== undefined) params.append('solo_moderados', filtros.solo_moderados.toString());
      if (filtros.solo_visibles !== undefined) params.append('solo_visibles', filtros.solo_visibles.toString());
      if (filtros.estado_moderacion) params.append('estado_moderacion', filtros.estado_moderacion);
      
      if (filtros.tags && filtros.tags.length > 0) {
        filtros.tags.forEach(tag => params.append('tags', tag));
      }

      const response = await fetch(
        `${API_BASE_URL}/platillos-base/?${params}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      if (!response.ok) {
        const errorData: ApiError = await response.json();
        return {
          success: false,
          error: errorData.detail || 'Error obteniendo platillos base'
        };
      }

      const data: BusquedaPlatilloBaseResponse = await response.json();
      return {
        success: true,
        data
      };
    } catch (error) {
      console.error('Error obteniendo platillos base:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido obteniendo platillos base'
      };
    }
  }

  /**
   * Obtiene un platillo base específico por ID
   */
  async getPlatilloBase(platilloBaseId: string): Promise<ApiResult<PlatilloBase>> {
    try {
      const response = await fetch(
        `${API_BASE_URL}/platillos-base/${platilloBaseId}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      if (!response.ok) {
        const errorData: ApiError = await response.json();
        return {
          success: false,
          error: errorData.detail || 'Error obteniendo platillo base'
        };
      }

      const data: PlatilloBase = await response.json();
      return {
        success: true,
        data
      };
    } catch (error) {
      console.error('Error obteniendo platillo base:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido obteniendo platillo base'
      };
    }
  }

  /**
   * Crea un nuevo platillo base (requiere autenticación)
   */
  async createPlatilloBase(platilloData: PlatilloBaseCreateRequest): Promise<ApiResult<PlatilloBaseResponse>> {
    try {
      const isAuthenticated = await this.checkAuthentication();
      
      if (!isAuthenticated) {
        return {
          success: false,
          error: 'Debes estar autenticado para crear platillos base'
        };
      }

      // Validar datos mínimos
      const validation = this.validatePlatilloBaseData(platilloData);
      if (!validation.isValid) {
        return {
          success: false,
          error: `Datos inválidos: ${validation.errors.join(', ')}`
        };
      }

      const response = await this.makeAuthenticatedRequest('/platillos-base/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(platilloData)
      });

      if (!response.ok) {
        const errorData: ApiError = await response.json();
        return {
          success: false,
          error: errorData.detail || 'Error creando platillo base'
        };
      }

      const data: PlatilloBaseResponse = await response.json();
      return {
        success: true,
        data
      };
    } catch (error) {
      console.error('Error creando platillo base:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido creando platillo base'
      };
    }
  }

  /**
   * Actualiza un platillo base existente (requiere autenticación)
   */
  async updatePlatilloBase(
    platilloBaseId: string, 
    platilloData: PlatilloBaseUpdateRequest
  ): Promise<ApiResult<PlatilloBaseResponse>> {
    try {
      const isAuthenticated = await this.checkAuthentication();
      
      if (!isAuthenticated) {
        return {
          success: false,
          error: 'Debes estar autenticado para actualizar platillos base'
        };
      }

      const response = await this.makeAuthenticatedRequest(`/platillos-base/${platilloBaseId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(platilloData)
      });

      if (!response.ok) {
        const errorData: ApiError = await response.json();
        return {
          success: false,
          error: errorData.detail || 'Error actualizando platillo base'
        };
      }

      const data: PlatilloBaseResponse = await response.json();
      return {
        success: true,
        data
      };
    } catch (error) {
      console.error('Error actualizando platillo base:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido actualizando platillo base'
      };
    }
  }

  /**
   * Elimina un platillo base (requiere autenticación y permisos de admin)
   */
  async deletePlatilloBase(platilloBaseId: string): Promise<ApiResult<{ message: string }>> {
    try {
      const isAuthenticated = await this.checkAuthentication();
      
      if (!isAuthenticated) {
        return {
          success: false,
          error: 'Debes estar autenticado para eliminar platillos base'
        };
      }

      const response = await this.makeAuthenticatedRequest(`/platillos-base/${platilloBaseId}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        const errorData: ApiError = await response.json();
        return {
          success: false,
          error: errorData.detail || 'Error eliminando platillo base'
        };
      }

      const data = await response.json();
      return {
        success: true,
        data
      };
    } catch (error) {
      console.error('Error eliminando platillo base:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido eliminando platillo base'
      };
    }
  }

  /**
   * Vincula un platillo existente a un platillo base
   */
  async vincularPlatillo(
    vinculacionData: VinculacionPlatilloRequest
  ): Promise<ApiResult<{ message: string; dish_id: string; platillo_base_id: string }>> {
    try {
      const isAuthenticated = await this.checkAuthentication();
      
      if (!isAuthenticated) {
        return {
          success: false,
          error: 'Debes estar autenticado para vincular platillos'
        };
      }

      const response = await this.makeAuthenticatedRequest('/platillos-base/vincular', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(vinculacionData)
      });

      if (!response.ok) {
        const errorData: ApiError = await response.json();
        return {
          success: false,
          error: errorData.detail || 'Error vinculando platillo'
        };
      }

      const data = await response.json();
      return {
        success: true,
        data
      };
    } catch (error) {
      console.error('Error vinculando platillo:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido vinculando platillo'
      };
    }
  }

  /**
   * Obtiene sugerencias de vinculación para un platillo
   */
  async obtenerSugerenciasVinculacion(
    dishName: string,
    limit: number = 5
  ): Promise<ApiResult<SugerenciaVinculacion[]>> {
    try {
      const isAuthenticated = await this.checkAuthentication();
      
      if (!isAuthenticated) {
        return {
          success: false,
          error: 'Debes estar autenticado para obtener sugerencias'
        };
      }

      const response = await this.makeAuthenticatedRequest('/platillos-base/sugerir-vinculacion', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ dish_name: dishName })
      });

      if (!response.ok) {
        const errorData: ApiError = await response.json();
        return {
          success: false,
          error: errorData.detail || 'Error obteniendo sugerencias'
        };
      }

      const data: SugerenciaVinculacion[] = await response.json();
      return {
        success: true,
        data
      };
    } catch (error) {
      console.error('Error obteniendo sugerencias:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido obteniendo sugerencias'
      };
    }
  }

  /**
   * Desvincula un platillo de su platillo base
   */
  async desvincularPlatillo(dishId: string): Promise<ApiResult<{ message: string }>> {
    try {
      const isAuthenticated = await this.checkAuthentication();
      
      if (!isAuthenticated) {
        return {
          success: false,
          error: 'Debes estar autenticado para desvincular platillos'
        };
      }

      const response = await this.makeAuthenticatedRequest(`/platillos-base/desvincular/${dishId}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        const errorData: ApiError = await response.json();
        return {
          success: false,
          error: errorData.detail || 'Error desvinculando platillo'
        };
      }

      const data = await response.json();
      return {
        success: true,
        data
      };
    } catch (error) {
      console.error('Error desvinculando platillo:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido desvinculando platillo'
      };
    }
  }

  /**
   * Obtiene el ranking global de platillos base
   */
  async obtenerRankingGlobal(
    categoria?: string,
    tipoCocina?: string,
    limit: number = 50
  ): Promise<ApiResult<RankingPlatilloBase[]>> {
    try {
      const params = new URLSearchParams({
        limit: limit.toString()
      });

      if (categoria) params.append('categoria', categoria);
      if (tipoCocina) params.append('tipo_cocina', tipoCocina);

      const response = await fetch(
        `${API_BASE_URL}/platillos-base/rankings/global?${params}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      if (!response.ok) {
        const errorData: ApiError = await response.json();
        return {
          success: false,
          error: errorData.detail || 'Error obteniendo ranking global'
        };
      }

      const data: RankingPlatilloBase[] = await response.json();
      return {
        success: true,
        data
      };
    } catch (error) {
      console.error('Error obteniendo ranking global:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido obteniendo ranking global'
      };
    }
  }

  /**
   * Obtiene los mejores restaurantes que ofrecen un platillo base específico
   */
  async obtenerMejoresRestaurantes(
    platilloBaseId: string,
    limit: number = 10
  ): Promise<ApiResult<any[]>> {
    try {
      const params = new URLSearchParams({
        limit: limit.toString()
      });

      const response = await fetch(
        `${API_BASE_URL}/platillos-base/${platilloBaseId}/mejores-restaurantes?${params}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      if (!response.ok) {
        const errorData: ApiError = await response.json();
        return {
          success: false,
          error: errorData.detail || 'Error obteniendo mejores restaurantes'
        };
      }

      const data = await response.json();
      return {
        success: true,
        data: data.mejores_restaurantes || []
      };
    } catch (error) {
      console.error('Error obteniendo mejores restaurantes:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido obteniendo mejores restaurantes'
      };
    }
  }

  /**
   * Obtiene rankings relacionados a un platillo base
   */
  async obtenerRankingsPlatilloBase(
    platilloBaseId: string,
    region?: string,
    limit: number = 10
  ): Promise<ApiResult<any[]>> {
    try {
      const params = new URLSearchParams({
        limit: limit.toString()
      });

      if (region) params.append('region', region);

      const response = await fetch(
        `${API_BASE_URL}/platillos-base/${platilloBaseId}/rankings?${params}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      if (!response.ok) {
        const errorData: ApiError = await response.json();
        return {
          success: false,
          error: errorData.detail || 'Error obteniendo rankings del platillo base'
        };
      }

      const data = await response.json();
      return {
        success: true,
        data: data.rankings || []
      };
    } catch (error) {
      console.error('Error obteniendo rankings del platillo base:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido obteniendo rankings'
      };
    }
  }

  /**
   * Actualiza las estadísticas de un platillo base (solo admin)
   */
  async actualizarEstadisticas(platilloBaseId: string): Promise<ApiResult<{ message: string }>> {
    try {
      const isAuthenticated = await this.checkAuthentication();
      
      if (!isAuthenticated) {
        return {
          success: false,
          error: 'Debes estar autenticado para actualizar estadísticas'
        };
      }

      const response = await this.makeAuthenticatedRequest(`/platillos-base/${platilloBaseId}/actualizar-estadisticas`, {
        method: 'POST'
      });

      if (!response.ok) {
        const errorData: ApiError = await response.json();
        return {
          success: false,
          error: errorData.detail || 'Error actualizando estadísticas'
        };
      }

      const data = await response.json();
      return {
        success: true,
        data
      };
    } catch (error) {
      console.error('Error actualizando estadísticas:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido actualizando estadísticas'
      };
    }
  }

  /**
   * Obtiene platillos base pendientes de moderación (solo admin)
   */
  async obtenerPendientesModeracion(
    limit: number = 20,
    page: number = 1
  ): Promise<ApiResult<BusquedaPlatilloBaseResponse>> {
    try {
      const isAuthenticated = await this.checkAuthentication();
      
      if (!isAuthenticated) {
        return {
          success: false,
          error: 'Debes estar autenticado para ver pendientes de moderación'
        };
      }

      const params = new URLSearchParams({
        limit: limit.toString(),
        page: page.toString()
      });

      const response = await this.makeAuthenticatedRequest(`/platillos-base/pendientes-moderacion?${params}`, {
        method: 'GET'
      });

      if (!response.ok) {
        const errorData: ApiError = await response.json();
        return {
          success: false,
          error: errorData.detail || 'Error obteniendo pendientes de moderación'
        };
      }

      const data: BusquedaPlatilloBaseResponse = await response.json();
      return {
        success: true,
        data
      };
    } catch (error) {
      console.error('Error obteniendo pendientes de moderación:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido obteniendo pendientes'
      };
    }
  }

  /**
   * Modera un platillo base (solo admin)
   */
  async moderarPlatilloBase(
    platilloBaseId: string,
    estado: 'pendiente' | 'aprobado' | 'rechazado' | 'revision',
    notas?: string
  ): Promise<ApiResult<{ message: string; estado: string }>> {
    try {
      const isAuthenticated = await this.checkAuthentication();
      
      if (!isAuthenticated) {
        return {
          success: false,
          error: 'Debes estar autenticado para moderar platillos base'
        };
      }

      const body: any = { estado };
      if (notas) body.notas = notas;

      const response = await this.makeAuthenticatedRequest(`/platillos-base/${platilloBaseId}/moderar`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
      });

      if (!response.ok) {
        const errorData: ApiError = await response.json();
        return {
          success: false,
          error: errorData.detail || 'Error moderando platillo base'
        };
      }

      const data = await response.json();
      return {
        success: true,
        data
      };
    } catch (error) {
      console.error('Error moderando platillo base:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido moderando platillo base'
      };
    }
  }

  /**
   * Verifica si el usuario está autenticado
   */
  private async checkAuthentication(): Promise<boolean> {
    try {
      const { authService } = await import('./authService.ts');
      return authService.isAuthenticated();
    } catch (error) {
      console.error('Error verificando autenticación:', error);
      return false;
    }
  }

  /**
   * Realiza una petición autenticada
   */
  private async makeAuthenticatedRequest(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<Response> {
    const { authService } = await import('./authService.ts');
    return authService.authenticatedFetch(endpoint, options);
  }

  /**
   * Valida los datos del platillo base
   */
  private validatePlatilloBaseData(data: PlatilloBaseCreateRequest): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    // Validar nombre (requerido)
    if (!data.nombre || data.nombre.trim().length === 0) {
      errors.push('El nombre del platillo es requerido');
    } else if (data.nombre.trim().length < 3) {
      errors.push('El nombre debe tener al menos 3 caracteres');
    } else if (data.nombre.trim().length > 100) {
      errors.push('El nombre no puede exceder 100 caracteres');
    }
    
    // Validar descripción (requerida)
    if (!data.descripcion || data.descripcion.trim().length === 0) {
      errors.push('La descripción es requerida');
    } else if (data.descripcion.trim().length < 10) {
      errors.push('La descripción debe tener al menos 10 caracteres');
    } else if (data.descripcion.trim().length > 500) {
      errors.push('La descripción no puede exceder 500 caracteres');
    }
    
    // Validar tipo de cocina (requerido)
    if (!data.tipo_cocina || data.tipo_cocina.trim().length === 0) {
      errors.push('El tipo de cocina es requerido');
    }
    
    // Validar categoría principal (requerida)
    if (!data.categoria_principal || data.categoria_principal.trim().length === 0) {
      errors.push('La categoría principal es requerida');
    }
    
    // Validar ingredientes principales (requeridos, mínimo 2)
    if (!data.ingredientes_principales || data.ingredientes_principales.length < 2) {
      errors.push('Debe especificar al menos 2 ingredientes principales');
    } else if (data.ingredientes_principales.length > 15) {
      errors.push('Máximo 15 ingredientes principales permitidos');
    }
    
    // Validar tags (opcional pero con límites)
    if (data.tags && data.tags.length > 20) {
      errors.push('Máximo 20 tags permitidos');
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Utilidades para trabajar con platillos base
   */
  utils = {
    /**
     * Genera un slug a partir del nombre
     */
    generateSlug: (nombre: string): string => {
      return nombre
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '') // Remover acentos
        .replace(/[^a-z0-9\s-]/g, '') // Solo letras, números, espacios y guiones
        .replace(/\s+/g, '-') // Reemplazar espacios con guiones
        .replace(/-+/g, '-') // Múltiples guiones a uno solo
        .trim()
        .replace(/^-+|-+$/g, ''); // Remover guiones al inicio y final
    },

    /**
     * Valida si un nombre es válido para platillo base
     */
    isValidNombre: (nombre: string): boolean => {
      return nombre.trim().length >= 3 && nombre.trim().length <= 100;
    },

    /**
     * Formatea el nombre del platillo base
     */
    formatPlatilloBaseName: (nombre: string): string => {
      return nombre.trim().replace(/\s+/g, ' '); // Normalizar espacios
    },

    /**
     * Calcula el nivel de popularidad basado en el score
     */
    calcularNivelPopularidad: (score: number): 'muy_bajo' | 'bajo' | 'medio' | 'alto' | 'muy_alto' => {
      if (score >= 80) return 'muy_alto';
      if (score >= 60) return 'alto';
      if (score >= 40) return 'medio';
      if (score >= 20) return 'bajo';
      return 'muy_bajo';
    },

    /**
     * Obtiene el color del badge según el nivel de popularidad
     */
    getPopularidadColor: (nivel: string): string => {
      const colors = {
        muy_bajo: '#6B7280',
        bajo: '#10B981',
        medio: '#F59E0B',
        alto: '#EF4444',
        muy_alto: '#8B5CF6'
      };
      return colors[nivel as keyof typeof colors] || '#6B7280';
    },

    /**
     * Verifica si un platillo base está completo
     */
    isPlatilloBaseComplete: (platillo: PlatilloBase): boolean => {
      return !!(
        platillo.nombre &&
        platillo.descripcion &&
        platillo.tipo_cocina &&
        platillo.categoria_principal &&
        platillo.ingredientes_principales &&
        platillo.ingredientes_principales.length >= 2
      );
    },

    /**
     * Obtiene la URL pública del platillo base
     */
    getPlatilloBasePublicUrl: (platillo: PlatilloBase): string => {
      const baseUrl = window.location.origin;
      return `${baseUrl}/platillo-base/${platillo.slug || platillo.id}`;
    },

    /**
     * Formatea las estadísticas para mostrar
     */
    formatEstadisticas: (estadisticas: EstadisticasPlatilloBase): {
      restaurantes: string;
      rating: string;
      popularidad: string;
      precio: string;
    } => {
      return {
        restaurantes: `${estadisticas.num_instancias} restaurantes`,
        rating: estadisticas.rating_promedio_global.toFixed(1),
        popularidad: `${estadisticas.popularidad_score.toFixed(0)}%`,
        precio: estadisticas.precio_promedio 
          ? `$${estadisticas.precio_promedio.toFixed(0)}`
          : 'No disponible'
      };
    },

    /**
     * Obtiene sugerencias de categorías populares
     */
    getCategoriasPopulares: (): string[] => {
      return [
        'Tacos', 'Pizzas', 'Hamburguesas', 'Sushi', 'Pasta',
        'Ensaladas', 'Sopas', 'Postres', 'Bebidas', 'Desayunos'
      ];
    },

    /**
     * Obtiene sugerencias de tipos de cocina
     */
    getTiposCocinaPopulares: (): string[] => {
      return [
        'Mexicana', 'Italiana', 'Japonesa', 'China', 'Americana',
        'Mediterránea', 'India', 'Francesa', 'Thai', 'Española'
      ];
    }
  };
}

// Exportar una instancia única del servicio
export const platilloBaseService = new PlatilloBaseService();
export default platilloBaseService; 