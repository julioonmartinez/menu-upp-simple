// src/interfaces/platilloBase.ts

/**
 * Interface principal para Platillo Base
 * Representa un platillo base que puede ser vinculado por múltiples restaurantes
 */
export interface PlatilloBase {
    id: string;
    nombre: string;
    descripcion: string;
    tipo_cocina: string;
    categoria_principal: string;
    subcategoria?: string;
    ingredientes_principales: string[];
    ingredientes_opcionales?: string[];
    tags: string[];
    slug: string;
    imagen_destacada?: string;
    permite_variaciones: boolean;
    requiere_ingredientes_minimos: boolean;
    
    // Estadísticas y métricas
    estadisticas: {
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
    };
    
    // Información de moderación
    moderacion: {
      estado: 'pendiente' | 'aprobado' | 'rechazado' | 'revision';
      moderado_por?: string;
      fecha_moderacion?: string;
      notas?: string;
      razon_rechazo?: string;
    };
    
    // Información de creación
    creado_por: string;
    fecha_creacion: string;
    fecha_actualizacion: string;
    
    // Metadatos
    version: number;
    visible: boolean;
    destacado: boolean;
    
    // Relaciones
    platillos_vinculados?: PlatilloVinculado[];
    rankings_relacionados?: RankingRelacionado[];
  }
  
  /**
   * Interface para platillos vinculados a un platillo base
   */
  export interface PlatilloVinculado {
    dish_id: string;
    restaurant_id: string;
    restaurant_name: string;
    restaurant_username?: string;
    dish_name: string;
    es_variacion_unica: boolean;
    variacion_descripcion?: string;
    ingredientes_adicionales: string[];
    ingredientes_removidos: string[];
    confianza: number;
    fecha_vinculacion: string;
    activo: boolean;
    
    // Estadísticas del platillo vinculado
    estadisticas: {
      rating: number;
      total_valoraciones: number;
      total_favoritos: number;
      precio?: number;
      disponible: boolean;
    };
  }
  
  /**
   * Interface para rankings relacionados a un platillo base
   */
  export interface RankingRelacionado {
    ranking_id: string;
    titulo: string;
    region: string;
    categoria_ranking: 'platillo_especifico' | 'categoria' | 'tipo_cocina' | 'temporada';
    estado: 'programado' | 'activo' | 'finalizado' | 'pausado';
    fecha_creacion: string;
    fecha_ultima_actualizacion: string;
    total_participantes: number;
    posicion_mejor_restaurante?: number;
  }
  
  /**
   * Interface para sugerencias de vinculación
   */
  export interface SugerenciaVinculacion {
    platillo_base_id: string;
    nombre: string;
    categoria_principal: string;
    tipo_cocina: string;
    similitud_score: number;
    razon_sugerencia: string;
    ingredientes_coincidentes: string[];
    ingredientes_similares: string[];
    nivel_confianza: 'bajo' | 'medio' | 'alto';
  }
  
  /**
   * Interface para estadísticas detalladas de un platillo base
   */
  export interface EstadisticasDetalladasPlatilloBase {
    // Métricas básicas
    num_instancias: number;
    num_restaurantes_activos: number;
    num_restaurantes_inactivos: number;
    
    // Métricas de rating
    rating_promedio_global: number;
    rating_mediana: number;
    rating_moda: number;
    total_valoraciones: number;
    distribucion_ratings: {
      '1': number;
      '2': number;
      '3': number;
      '4': number;
      '5': number;
    };
    
    // Métricas de popularidad
    total_favoritos: number;
    popularidad_score: number;
    nivel_popularidad: 'muy_bajo' | 'bajo' | 'medio' | 'alto' | 'muy_alto';
    
    // Métricas de precio
    precio_promedio?: number;
    precio_mediana?: number;
    precio_minimo?: number;
    precio_maximo?: number;
    rango_precios: {
      economico: number;
      moderado: number;
      premium: number;
    };
    
    // Métricas de distribución geográfica
    regiones_representadas: string[];
    top_regiones: Array<{
      region: string;
      num_restaurantes: number;
      rating_promedio: number;
    }>;
    
    // Métricas de tendencias
    tendencia_rating: 'subiendo' | 'bajando' | 'estable';
    cambio_rating_ultimo_mes: number;
    crecimiento_instancias: number;
    
    // Métricas de engagement
    total_comentarios: number;
    total_visitas: number;
    tasa_engagement: number;
  }
  
  /**
   * Interface para filtros de búsqueda de platillos base
   */
  export interface FiltrosPlatilloBase {
    // Filtros básicos
    nombre?: string;
    tipo_cocina?: string;
    categoria_principal?: string;
    subcategoria?: string;
    tags?: string[];
    
    // Filtros de popularidad
    min_popularidad?: number;
    max_popularidad?: number;
    min_instancias?: number;
    max_instancias?: number;
    
    // Filtros de rating
    min_rating?: number;
    max_rating?: number;
    min_valoraciones?: number;
    
    // Filtros de precio
    min_precio?: number;
    max_precio?: number;
    rango_precio?: 'economico' | 'moderado' | 'premium';
    
    // Filtros de moderación
    solo_moderados?: boolean;
    solo_visibles?: boolean;
    estado_moderacion?: 'pendiente' | 'aprobado' | 'rechazado' | 'revision';
    
    // Filtros de fecha
    fecha_desde?: string;
    fecha_hasta?: string;
    creado_por?: string;
    
    // Filtros de ingredientes
    ingredientes_requeridos?: string[];
    ingredientes_excluidos?: string[];
    
    // Filtros de características
    permite_variaciones?: boolean;
    requiere_ingredientes_minimos?: boolean;
    destacado?: boolean;
  }
  
  /**
   * Interface para respuesta de búsqueda de platillos base
   */
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
    estadisticas_busqueda: {
      tiempo_busqueda: number;
      resultados_por_categoria: Record<string, number>;
      resultados_por_tipo_cocina: Record<string, number>;
    };
  }
  
  /**
   * Interface para comparación de platillos base
   */
  export interface ComparacionPlatilloBase {
    platillo_base_id: string;
    nombre: string;
    metricas_comparacion: {
      popularidad: number;
      rating: number;
      precio: number;
      disponibilidad: number;
      variedad: number;
    };
    diferencias: {
      popularidad_diferencia: number;
      rating_diferencia: number;
      precio_diferencia: number;
    };
    ventajas: string[];
    desventajas: string[];
  }
  
  /**
   * Interface para reporte de platillo base
   */
  export interface ReportePlatilloBase {
    platillo_base_id: string;
    nombre: string;
    fecha_generacion: string;
    periodo: string;
    
    // Resumen ejecutivo
    resumen: {
      estado_general: 'excelente' | 'bueno' | 'regular' | 'mejorable';
      tendencia: 'creciendo' | 'estable' | 'declinando';
      recomendaciones: string[];
    };
    
    // Métricas detalladas
    metricas: EstadisticasDetalladasPlatilloBase;
    
    // Análisis de competencia
    competencia: {
      platillos_similares: Array<{
        platillo_base_id: string;
        nombre: string;
        similitud_score: number;
        ventajas_competitivas: string[];
      }>;
      posicion_mercado: 'lider' | 'competidor' | 'seguidor' | 'nicho';
    };
    
    // Análisis de tendencias
    tendencias: {
      crecimiento_mensual: number;
      estacionalidad: Record<string, number>;
      proyeccion_3_meses: number;
    };
  }
  
  /**
   * Interface para auditoría de cambios en platillo base
   */
  export interface AuditoriaPlatilloBase {
    platillo_base_id: string;
    cambios: Array<{
      fecha: string;
      usuario_id: string;
      usuario_nombre: string;
      tipo_cambio: 'creacion' | 'actualizacion' | 'moderacion' | 'eliminacion';
      campo_modificado?: string;
      valor_anterior?: any;
      valor_nuevo?: any;
      razon?: string;
    }>;
  }
  
  /**
   * Interface para exportación de datos de platillo base
   */
  export interface ExportacionPlatilloBase {
    formato: 'json' | 'csv' | 'xlsx';
    datos: PlatilloBase[];
    metadatos: {
      fecha_exportacion: string;
      usuario_exportacion: string;
      filtros_aplicados?: FiltrosPlatilloBase;
      total_registros: number;
    };
  }