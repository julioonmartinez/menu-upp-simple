// src/services/rankingService.ts

import type { Ranking } from '../interfaces/ranking.ts';

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

// ✅ Estructura para crear ranking
export interface RankingCreateRequest {
  titulo: string;
  platillo_base_id?: string;
  categoria_principal?: string;
  tipo_cocina?: string;
  region: string;
  categoria_ranking: 'platillo_especifico' | 'categoria' | 'tipo_cocina' | 'temporada';
  criterios: ('rating' | 'favoritos' | 'comentarios' | 'pedidos' | 'visitas')[];
  periodo: 'semanal' | 'mensual' | 'trimestral' | 'anual';
  descripcion?: string;
  tags?: string[];
  imagen_destacada?: string;
  min_restaurantes?: number;
  min_ratings?: number;
  max_posiciones?: number;
  fecha_inicio?: string;
  auto_calcular?: boolean;
}

// ✅ Estructura para actualizar ranking
export interface RankingUpdateRequest {
  titulo?: string;
  descripcion?: string;
  criterios?: ('rating' | 'favoritos' | 'comentarios' | 'pedidos' | 'visitas')[];
  min_restaurantes?: number;
  min_ratings?: number;
  max_posiciones?: number;
  tags?: string[];
  imagen_destacada?: string;
  estado?: 'programado' | 'activo' | 'finalizado' | 'pausado';
}

export type RankingResponse = Ranking;

// ✅ Interface para resultado de ranking
export interface RankingResult {
  posicion: number;
  dish_id: string;
  restaurant_id: string;
  restaurant_name: string;
  restaurant_username?: string;
  dish_name: string;
  score_final: number;
  metricas: {
    rating: number;
    favoritos: number;
    comentarios: number;
  };
  diferencia_anterior?: number;
  badge?: string;
  imagen_restaurante?: string;
  ubicacion?: string;
}

// ✅ Interface para filtros de búsqueda de rankings
export interface FiltrosRanking {
  region?: string;
  categoria_ranking?: 'platillo_especifico' | 'categoria' | 'tipo_cocina' | 'temporada';
  platillo_base_id?: string;
  categoria_principal?: string;
  tipo_cocina?: string;
  estado?: 'programado' | 'activo' | 'finalizado' | 'pausado';
  periodo?: 'semanal' | 'mensual' | 'trimestral' | 'anual';
  creado_por?: string;
  tags?: string[];
  fecha_desde?: string;
  fecha_hasta?: string;
}

// ✅ Interface para respuesta de búsqueda de rankings
export interface BusquedaRankingResponse {
  rankings: Ranking[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    total_pages: number;
    has_next: boolean;
    has_prev: boolean;
  };
  filtros_aplicados: FiltrosRanking;
}

// ✅ Interface para estadísticas de ranking
export interface RankingStats {
  total_participantes: number;
  promedio_score: number;
  rango_scores: {
    excelente: number;
    muy_bueno: number;
    bueno: number;
    regular: number;
  };
  distribucion_ratings: Record<string, number>;
  restaurantes_unicos: number;
  regiones_representadas: string[];
}

// ✅ Interface para información de badges
export interface BadgeInfo {
  badge: string;
  nombre: string;
  descripcion: string;
  criterio: string;
  color?: string;
}

// ✅ Interface para regiones disponibles
export interface RegionInfo {
  region: string;
  total_rankings: number;
  ultimo_ranking: string;
}

// ✅ Interface para categorías populares
export interface CategoriaPopular {
  categoria: string;
  total_rankings: number;
  total_participantes: number;
}

const API_BASE_URL = import.meta.env.PUBLIC_API_URL || 'http://localhost:8000';

/**
 * Servicio para manejar todas las operaciones de rankings regionales
 * Permite crear, gestionar y consultar rankings de platillos por región
 */
class RankingService {
  
  /**
   * Obtiene todos los rankings con filtros opcionales
   */
  async getAllRankings(
    filtros: FiltrosRanking = {},
    limit: number = 20,
    page: number = 1
  ): Promise<ApiResult<BusquedaRankingResponse>> {
    try {
      const params = new URLSearchParams({
        limit: limit.toString(),
        page: page.toString()
      });

      // Agregar filtros si están definidos
      if (filtros.region) params.append('region', filtros.region);
      if (filtros.categoria_ranking) params.append('categoria_ranking', filtros.categoria_ranking);
      if (filtros.platillo_base_id) params.append('platillo_base_id', filtros.platillo_base_id);
      if (filtros.categoria_principal) params.append('categoria_principal', filtros.categoria_principal);
      if (filtros.tipo_cocina) params.append('tipo_cocina', filtros.tipo_cocina);
      if (filtros.estado) params.append('estado', filtros.estado);
      if (filtros.periodo) params.append('periodo', filtros.periodo);
      if (filtros.creado_por) params.append('creado_por', filtros.creado_por);
      if (filtros.fecha_desde) params.append('fecha_desde', filtros.fecha_desde);
      if (filtros.fecha_hasta) params.append('fecha_hasta', filtros.fecha_hasta);
      
      if (filtros.tags && filtros.tags.length > 0) {
        filtros.tags.forEach(tag => params.append('tags', tag));
      }

      const response = await fetch(
        `${API_BASE_URL}/rankings/?${params}`,
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
          error: errorData.detail || 'Error obteniendo rankings'
        };
      }

      const data: BusquedaRankingResponse = await response.json();
      return {
        success: true,
        data
      };
    } catch (error) {
      console.error('Error obteniendo rankings:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido obteniendo rankings'
      };
    }
  }

  /**
   * Obtiene un ranking específico por ID
   */
  async getRanking(rankingId: string): Promise<ApiResult<Ranking>> {
    try {
      const response = await fetch(
        `${API_BASE_URL}/rankings/${rankingId}`,
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
          error: errorData.detail || 'Error obteniendo ranking'
        };
      }

      const data = await response.json();
      return {
        success: true,
        data: data.ranking
      };
    } catch (error) {
      console.error('Error obteniendo ranking:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido obteniendo ranking'
      };
    }
  }

  /**
   * Crea un nuevo ranking (requiere autenticación)
   */
  async createRanking(rankingData: RankingCreateRequest): Promise<ApiResult<RankingResponse>> {
    try {
      const isAuthenticated = await this.checkAuthentication();
      
      if (!isAuthenticated) {
        return {
          success: false,
          error: 'Debes estar autenticado para crear rankings'
        };
      }

      // Validar datos mínimos
      const validation = this.validateRankingData(rankingData);
      if (!validation.isValid) {
        return {
          success: false,
          error: `Datos inválidos: ${validation.errors.join(', ')}`
        };
      }

      const response = await this.makeAuthenticatedRequest('/rankings/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(rankingData)
      });

      if (!response.ok) {
        const errorData: ApiError = await response.json();
        return {
          success: false,
          error: errorData.detail || 'Error creando ranking'
        };
      }

      const data = await response.json();
      return {
        success: true,
        data: data.ranking
      };
    } catch (error) {
      console.error('Error creando ranking:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido creando ranking'
      };
    }
  }

  /**
   * Actualiza un ranking existente (requiere autenticación)
   */
  async updateRanking(
    rankingId: string, 
    rankingData: RankingUpdateRequest
  ): Promise<ApiResult<RankingResponse>> {
    try {
      const isAuthenticated = await this.checkAuthentication();
      
      if (!isAuthenticated) {
        return {
          success: false,
          error: 'Debes estar autenticado para actualizar rankings'
        };
      }

      const response = await this.makeAuthenticatedRequest(`/rankings/${rankingId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(rankingData)
      });

      if (!response.ok) {
        const errorData: ApiError = await response.json();
        return {
          success: false,
          error: errorData.detail || 'Error actualizando ranking'
        };
      }

      const data = await response.json();
      return {
        success: true,
        data: data.ranking
      };
    } catch (error) {
      console.error('Error actualizando ranking:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido actualizando ranking'
      };
    }
  }

  /**
   * Elimina un ranking (requiere autenticación)
   */
  async deleteRanking(rankingId: string): Promise<ApiResult<{ message: string }>> {
    try {
      const isAuthenticated = await this.checkAuthentication();
      
      if (!isAuthenticated) {
        return {
          success: false,
          error: 'Debes estar autenticado para eliminar rankings'
        };
      }

      const response = await this.makeAuthenticatedRequest(`/rankings/${rankingId}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        const errorData: ApiError = await response.json();
        return {
          success: false,
          error: errorData.detail || 'Error eliminando ranking'
        };
      }

      const data = await response.json();
      return {
        success: true,
        data
      };
    } catch (error) {
      console.error('Error eliminando ranking:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido eliminando ranking'
      };
    }
  }

  /**
   * Calcula o recalcula los resultados de un ranking
   */
  async calcularRanking(rankingId: string): Promise<ApiResult<RankingResult[]>> {
    try {
      const isAuthenticated = await this.checkAuthentication();
      
      if (!isAuthenticated) {
        return {
          success: false,
          error: 'Debes estar autenticado para calcular rankings'
        };
      }

      const response = await this.makeAuthenticatedRequest(`/rankings/${rankingId}/calcular`, {
        method: 'POST'
      });

      if (!response.ok) {
        const errorData: ApiError = await response.json();
        return {
          success: false,
          error: errorData.detail || 'Error calculando ranking'
        };
      }

      const data = await response.json();
      return {
        success: true,
        data: data.resultados || []
      };
    } catch (error) {
      console.error('Error calculando ranking:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido calculando ranking'
      };
    }
  }

  /**
   * Obtiene rankings por platillo base
   */
  async getRankingsByPlatilloBase(
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
        `${API_BASE_URL}/rankings/platillo-base/${platilloBaseId}?${params}`,
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
          error: errorData.detail || 'Error obteniendo rankings por platillo base'
        };
      }

      const data = await response.json();
      return {
        success: true,
        data: data.rankings || []
      };
    } catch (error) {
      console.error('Error obteniendo rankings por platillo base:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido obteniendo rankings'
      };
    }
  }

  /**
   * Obtiene los rankings más populares de una región
   */
  async getTopRankingsByRegion(
    region: string,
    limit: number = 20
  ): Promise<ApiResult<any[]>> {
    try {
      const params = new URLSearchParams({
        limit: limit.toString()
      });

      const response = await fetch(
        `${API_BASE_URL}/rankings/top/${region}?${params}`,
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
          error: errorData.detail || 'Error obteniendo top rankings'
        };
      }

      const data = await response.json();
      return {
        success: true,
        data: data.rankings || []
      };
    } catch (error) {
      console.error('Error obteniendo top rankings:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido obteniendo top rankings'
      };
    }
  }

  /**
   * Obtiene rankings por categoría
   */
  async getRankingsByCategory(
    categoria: string,
    region?: string,
    limit: number = 20,
    page: number = 1
  ): Promise<ApiResult<BusquedaRankingResponse>> {
    try {
      const params = new URLSearchParams({
        limit: limit.toString(),
        page: page.toString()
      });

      if (region) params.append('region', region);

      const response = await fetch(
        `${API_BASE_URL}/rankings/categoria/${categoria}?${params}`,
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
          error: errorData.detail || 'Error obteniendo rankings por categoría'
        };
      }

      const data: BusquedaRankingResponse = await response.json();
      return {
        success: true,
        data
      };
    } catch (error) {
      console.error('Error obteniendo rankings por categoría:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido obteniendo rankings'
      };
    }
  }

  /**
   * Obtiene rankings por tipo de cocina
   */
  async getRankingsByCuisine(
    tipoCocina: string,
    region?: string,
    limit: number = 20,
    page: number = 1
  ): Promise<ApiResult<BusquedaRankingResponse>> {
    try {
      const params = new URLSearchParams({
        limit: limit.toString(),
        page: page.toString()
      });

      if (region) params.append('region', region);

      const response = await fetch(
        `${API_BASE_URL}/rankings/cocina/${tipoCocina}?${params}`,
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
          error: errorData.detail || 'Error obteniendo rankings por tipo de cocina'
        };
      }

      const data: BusquedaRankingResponse = await response.json();
      return {
        success: true,
        data
      };
    } catch (error) {
      console.error('Error obteniendo rankings por tipo de cocina:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido obteniendo rankings'
      };
    }
  }

  /**
   * Obtiene estadísticas de un ranking
   */
  async getRankingStats(rankingId: string): Promise<ApiResult<RankingStats>> {
    try {
      const response = await fetch(
        `${API_BASE_URL}/rankings/${rankingId}/estadisticas`,
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
          error: errorData.detail || 'Error obteniendo estadísticas del ranking'
        };
      }

      const data = await response.json();
      return {
        success: true,
        data: data.estadisticas
      };
    } catch (error) {
      console.error('Error obteniendo estadísticas del ranking:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido obteniendo estadísticas'
      };
    }
  }

  /**
   * Obtiene información de badges disponibles
   */
  async getBadgesInfo(): Promise<ApiResult<Record<string, BadgeInfo>>> {
    try {
      const response = await fetch(
        `${API_BASE_URL}/rankings/badges/info`,
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
          error: errorData.detail || 'Error obteniendo información de badges'
        };
      }

      const data = await response.json();
      return {
        success: true,
        data: data.badges
      };
    } catch (error) {
      console.error('Error obteniendo información de badges:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido obteniendo badges'
      };
    }
  }

  /**
   * Obtiene regiones disponibles con rankings
   */
  async getAvailableRegions(): Promise<ApiResult<RegionInfo[]>> {
    try {
      const response = await fetch(
        `${API_BASE_URL}/rankings/regiones/disponibles`,
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
          error: errorData.detail || 'Error obteniendo regiones disponibles'
        };
      }

      const data = await response.json();
      return {
        success: true,
        data: data.regiones
      };
    } catch (error) {
      console.error('Error obteniendo regiones disponibles:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido obteniendo regiones'
      };
    }
  }

  /**
   * Obtiene categorías populares en rankings
   */
  async getPopularCategories(
    region?: string,
    limit: number = 10
  ): Promise<ApiResult<CategoriaPopular[]>> {
    try {
      const params = new URLSearchParams({
        limit: limit.toString()
      });

      if (region) params.append('region', region);

      const response = await fetch(
        `${API_BASE_URL}/rankings/categorias/populares?${params}`,
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
          error: errorData.detail || 'Error obteniendo categorías populares'
        };
      }

      const data = await response.json();
      return {
        success: true,
        data: data.categorias
      };
    } catch (error) {
      console.error('Error obteniendo categorías populares:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido obteniendo categorías'
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
   * Valida los datos del ranking
   */
  private validateRankingData(data: RankingCreateRequest): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    // Validar título (requerido)
    if (!data.titulo || data.titulo.trim().length === 0) {
      errors.push('El título del ranking es requerido');
    } else if (data.titulo.trim().length < 5) {
      errors.push('El título debe tener al menos 5 caracteres');
    } else if (data.titulo.trim().length > 200) {
      errors.push('El título no puede exceder 200 caracteres');
    }
    
    // Validar región (requerida)
    if (!data.region || data.region.trim().length === 0) {
      errors.push('La región es requerida');
    }
    
    // Validar categoría de ranking (requerida)
    if (!data.categoria_ranking) {
      errors.push('La categoría de ranking es requerida');
    }
    
    // Validar criterios (requeridos, mínimo 1)
    if (!data.criterios || data.criterios.length === 0) {
      errors.push('Debe especificar al menos un criterio');
    } else if (data.criterios.length > 5) {
      errors.push('Máximo 5 criterios permitidos');
    }
    
    // Validar período (requerido)
    if (!data.periodo) {
      errors.push('El período es requerido');
    }
    
    // Validar según categoría de ranking
    if (data.categoria_ranking === 'platillo_especifico' && !data.platillo_base_id) {
      errors.push('platillo_base_id es requerido para rankings de platillo específico');
    }
    if (data.categoria_ranking === 'categoria' && !data.categoria_principal) {
      errors.push('categoria_principal es requerida para rankings por categoría');
    }
    if (data.categoria_ranking === 'tipo_cocina' && !data.tipo_cocina) {
      errors.push('tipo_cocina es requerido para rankings por tipo de cocina');
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Utilidades para trabajar con rankings
   */
  utils = {
    /**
     * Obtiene el emoji del badge según la posición
     */
    getBadgeEmoji: (posicion: number): string => {
      switch (posicion) {
        case 1: return '🥇';
        case 2: return '🥈';
        case 3: return '🥉';
        default: return '';
      }
    },

    /**
     * Obtiene el color del badge según la posición
     */
    getBadgeColor: (posicion: number): string => {
      switch (posicion) {
        case 1: return '#FFD700'; // Oro
        case 2: return '#C0C0C0'; // Plata
        case 3: return '#CD7F32'; // Bronce
        default: return '#6B7280'; // Gris
      }
    },

    /**
     * Formatea el score para mostrar
     */
    formatScore: (score: number): string => {
      return score.toFixed(1);
    },

    /**
     * Obtiene el nivel de calidad basado en el score
     */
    getQualityLevel: (score: number): 'excelente' | 'muy_bueno' | 'bueno' | 'regular' => {
      if (score >= 8) return 'excelente';
      if (score >= 6) return 'muy_bueno';
      if (score >= 4) return 'bueno';
      return 'regular';
    },

    /**
     * Obtiene el color del nivel de calidad
     */
    getQualityColor: (nivel: string): string => {
      const colors = {
        excelente: '#10B981',
        muy_bueno: '#F59E0B',
        bueno: '#3B82F6',
        regular: '#6B7280'
      };
      return colors[nivel as keyof typeof colors] || '#6B7280';
    },

    /**
     * Formatea la diferencia de posición
     */
    formatPositionChange: (diferencia: number): string => {
      if (diferencia > 0) return `+${diferencia}`;
      if (diferencia < 0) return `${diferencia}`;
      return '0';
    },

    /**
     * Obtiene el color de la diferencia de posición
     */
    getPositionChangeColor: (diferencia: number): string => {
      if (diferencia > 0) return '#10B981'; // Verde para subida
      if (diferencia < 0) return '#EF4444'; // Rojo para bajada
      return '#6B7280'; // Gris para sin cambio
    },

    /**
     * Obtiene el icono de la diferencia de posición
     */
    getPositionChangeIcon: (diferencia: number): string => {
      if (diferencia > 0) return '↗️';
      if (diferencia < 0) return '↘️';
      return '➡️';
    },

    /**
     * Formatea la fecha del ranking
     */
    formatRankingDate: (dateString: string): string => {
      const date = new Date(dateString);
      return date.toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    },

    /**
     * Obtiene la URL pública del ranking
     */
    getRankingPublicUrl: (ranking: Ranking): string => {
      const baseUrl = window.location.origin;
      return `${baseUrl}/ranking/${ranking.id}`;
    },

    /**
     * Verifica si un ranking está activo
     */
    isRankingActive: (ranking: Ranking): boolean => {
      return ranking.estado === 'activo';
    },

    /**
     * Obtiene sugerencias de regiones populares
     */
    getRegionesPopulares: (): string[] => {
      return [
        'CDMX', 'Guadalajara', 'Monterrey', 'Puebla', 'Querétaro',
        'Mérida', 'Tijuana', 'Cancún', 'Puerto Vallarta', 'San Miguel de Allende'
      ];
    },

    /**
     * Obtiene sugerencias de períodos
     */
    getPeriodosDisponibles: (): Array<{value: string; label: string}> => {
      return [
        { value: 'semanal', label: 'Semanal' },
        { value: 'mensual', label: 'Mensual' },
        { value: 'trimestral', label: 'Trimestral' },
        { value: 'anual', label: 'Anual' }
      ];
    },

    /**
     * Obtiene sugerencias de criterios
     */
    getCriteriosDisponibles: (): Array<{value: string; label: string}> => {
      return [
        { value: 'rating', label: 'Rating' },
        { value: 'favoritos', label: 'Favoritos' },
        { value: 'comentarios', label: 'Comentarios' },
        { value: 'pedidos', label: 'Pedidos' },
        { value: 'visitas', label: 'Visitas' }
      ];
    }
  };
}

// Exportar una instancia única del servicio
export const rankingService = new RankingService();
export default rankingService; 