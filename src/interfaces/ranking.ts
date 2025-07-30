// src/interfaces/ranking.ts

/**
 * Interface principal para Ranking Regional
 * Representa un ranking de platillos por región
 */
export interface Ranking {
    id: string;
    titulo: string;
    descripcion?: string;
    
    // Configuración del ranking
    platillo_base_id?: string;
    categoria_principal?: string;
    tipo_cocina?: string;
    region: string;
    categoria_ranking: 'platillo_especifico' | 'categoria' | 'tipo_cocina' | 'temporada';
    criterios: ('rating' | 'favoritos' | 'comentarios' | 'pedidos' | 'visitas')[];
    periodo: 'semanal' | 'mensual' | 'trimestral' | 'anual';
    
    // Configuración de filtros
    min_restaurantes?: number;
    min_ratings?: number;
    max_posiciones?: number;
    
    // Estado y control
    estado: 'programado' | 'activo' | 'finalizado' | 'pausado';
    auto_calcular: boolean;
    fecha_inicio?: string;
    fecha_fin?: string;
    fecha_ultimo_calculo?: string;
    proximo_calculo?: string;
    
    // Resultados
    resultados: RankingResult[];
    total_participantes: number;
    version_resultados: number;
    
    // Metadatos
    tags: string[];
    imagen_destacada?: string;
    creado_por: string;
    fecha_creacion: string;
    fecha_actualizacion: string;
    
    // Configuración de notificaciones
    notificar_cambios: boolean;
    notificar_finalizacion: boolean;
    
    // Configuración de visibilidad
    publico: boolean;
    destacado: boolean;
    featured: boolean;
    
    // Estadísticas del ranking
    estadisticas: {
      total_restaurantes_unicos: number;
      promedio_score: number;
      rango_scores: {
        excelente: number;
        muy_bueno: number;
        bueno: number;
        regular: number;
      };
      distribucion_ratings: Record<string, number>;
      regiones_representadas: string[];
      categorias_representadas: string[];
    };
  }
  
  /**
   * Interface para resultado individual en un ranking
   */
  export interface RankingResult {
    posicion: number;
    dish_id: string;
    restaurant_id: string;
    restaurant_name: string;
    restaurant_username?: string;
    dish_name: string;
    score_final: number;
    
    // Métricas individuales
    metricas: {
      rating: number;
      favoritos: number;
      comentarios: number;
      pedidos?: number;
      visitas?: number;
    };
    
    // Información adicional
    badge?: string;
    diferencia_anterior?: number;
    tendencia?: 'subiendo' | 'bajando' | 'estable';
    
    // Información del restaurante
    imagen_restaurante?: string;
    ubicacion?: string;
    precio?: number;
    disponible: boolean;
    
    // Información de contacto
    telefono_restaurante?: string;
    website_restaurante?: string;
    
    // Metadatos
    fecha_ultima_actualizacion: string;
    confianza_score: number;
  }
  
  /**
   * Interface para estadísticas detalladas de un ranking
   */
  export interface EstadisticasRanking {
    // Métricas básicas
    total_participantes: number;
    total_restaurantes_unicos: number;
    promedio_score: number;
    mediana_score: number;
    desviacion_estandar: number;
    
    // Distribución de scores
    rango_scores: {
      excelente: number;
      muy_bueno: number;
      bueno: number;
      regular: number;
    };
    
    // Distribución de ratings
    distribucion_ratings: Record<string, number>;
    
    // Análisis geográfico
    regiones_representadas: string[];
    top_regiones: Array<{
      region: string;
      num_restaurantes: number;
      promedio_score: number;
    }>;
    
    // Análisis de categorías
    categorias_representadas: string[];
    top_categorias: Array<{
      categoria: string;
      num_restaurantes: number;
      promedio_score: number;
    }>;
    
    // Análisis de precios
    distribucion_precios: {
      economico: number;
      moderado: number;
      premium: number;
    };
    precio_promedio?: number;
    precio_mediana?: number;
    
    // Análisis de tendencias
    tendencias: {
      cambio_promedio_score: number;
      nuevos_participantes: number;
      participantes_perdidos: number;
      estabilidad_ranking: number;
    };
    
    // Métricas de engagement
    total_interacciones: number;
    total_visitas: number;
    tasa_engagement: number;
    
    // Métricas de calidad
    calidad_promedio: number;
    consistencia_scores: number;
    variabilidad_scores: number;
  }
  
  /**
   * Interface para filtros de búsqueda de rankings
   */
  export interface FiltrosRanking {
    // Filtros básicos
    titulo?: string;
    region?: string;
    categoria_ranking?: 'platillo_especifico' | 'categoria' | 'tipo_cocina' | 'temporada';
    platillo_base_id?: string;
    categoria_principal?: string;
    tipo_cocina?: string;
    
    // Filtros de estado
    estado?: 'programado' | 'activo' | 'finalizado' | 'pausado';
    periodo?: 'semanal' | 'mensual' | 'trimestral' | 'anual';
    
    // Filtros de autoría
    creado_por?: string;
    
    // Filtros de fecha
    fecha_desde?: string;
    fecha_hasta?: string;
    fecha_ultimo_calculo_desde?: string;
    fecha_ultimo_calculo_hasta?: string;
    
    // Filtros de contenido
    tags?: string[];
    publico?: boolean;
    destacado?: boolean;
    featured?: boolean;
    
    // Filtros de participación
    min_participantes?: number;
    max_participantes?: number;
    min_restaurantes_unicos?: number;
    
    // Filtros de score
    min_score_promedio?: number;
    max_score_promedio?: number;
  }
  
  /**
   * Interface para respuesta de búsqueda de rankings
   */
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
    estadisticas_busqueda: {
      tiempo_busqueda: number;
      rankings_por_estado: Record<string, number>;
      rankings_por_region: Record<string, number>;
      rankings_por_periodo: Record<string, number>;
    };
  }
  
  /**
   * Interface para información de badges
   */
  export interface BadgeInfo {
    badge: string;
    nombre: string;
    descripcion: string;
    criterio: string;
    color?: string;
    icono?: string;
    categoria: 'posicion' | 'especial' | 'logro';
    requisitos: {
      posicion_minima?: number;
      score_minimo?: number;
      criterios_especiales?: string[];
    };
  }
  
  /**
   * Interface para regiones disponibles
   */
  export interface RegionInfo {
    region: string;
    total_rankings: number;
    ultimo_ranking: string;
    ranking_mas_popular?: {
      id: string;
      titulo: string;
      participantes: number;
    };
    estadisticas: {
      promedio_participantes: number;
      total_restaurantes_unicos: number;
      categorias_populares: string[];
    };
  }
  
  /**
   * Interface para categorías populares en rankings
   */
  export interface CategoriaPopular {
    categoria: string;
    total_rankings: number;
    total_participantes: number;
    promedio_participantes: number;
    ranking_mas_popular?: {
      id: string;
      titulo: string;
      region: string;
      participantes: number;
    };
    tendencia: 'creciendo' | 'estable' | 'declinando';
  }
  
  /**
   * Interface para comparación de rankings
   */
  export interface ComparacionRanking {
    ranking_id: string;
    titulo: string;
    metricas_comparacion: {
      participacion: number;
      calidad: number;
      engagement: number;
      estabilidad: number;
      diversidad: number;
    };
    diferencias: {
      participacion_diferencia: number;
      calidad_diferencia: number;
      engagement_diferencia: number;
    };
    ventajas: string[];
    desventajas: string[];
    recomendaciones: string[];
  }
  
  /**
   * Interface para reporte de ranking
   */
  export interface ReporteRanking {
    ranking_id: string;
    titulo: string;
    fecha_generacion: string;
    periodo_analisis: string;
    
    // Resumen ejecutivo
    resumen: {
      estado_general: 'excelente' | 'bueno' | 'regular' | 'mejorable';
      tendencia: 'creciendo' | 'estable' | 'declinando';
      recomendaciones: string[];
      insights_clave: string[];
    };
    
    // Métricas detalladas
    metricas: EstadisticasRanking;
    
    // Análisis de participantes
    participantes: {
      top_performers: RankingResult[];
      nuevos_participantes: RankingResult[];
      participantes_perdidos: RankingResult[];
      movimientos_significativos: Array<{
        restaurant_id: string;
        restaurant_name: string;
        cambio_posicion: number;
        razon: string;
      }>;
    };
    
    // Análisis de competencia
    competencia: {
      rankings_similares: Array<{
        ranking_id: string;
        titulo: string;
        similitud_score: number;
        diferencias_clave: string[];
      }>;
      posicion_mercado: 'lider' | 'competidor' | 'seguidor' | 'nicho';
    };
    
    // Análisis de tendencias
    tendencias: {
      crecimiento_participacion: number;
      cambio_calidad_promedio: number;
      estacionalidad: Record<string, number>;
      proyeccion_3_meses: number;
    };
    
    // Análisis de engagement
    engagement: {
      total_visitas: number;
      total_interacciones: number;
      tasa_engagement: number;
      fuentes_trafico: Record<string, number>;
      horarios_pico: Record<string, number>;
    };
  }
  
  /**
   * Interface para configuración de ranking
   */
  export interface ConfiguracionRanking {
    ranking_id: string;
    
    // Configuración de cálculo
    algoritmo_calculo: 'ponderado' | 'promedio' | 'personalizado';
    pesos_criterios: Record<string, number>;
    factores_ajuste: {
      antiguedad: number;
      popularidad: number;
      calidad: number;
      engagement: number;
    };
    
    // Configuración de filtros
    filtros_automaticos: {
      min_rating: number;
      min_valoraciones: number;
      min_antiguedad_dias: number;
      max_precio?: number;
      solo_disponibles: boolean;
    };
    
    // Configuración de notificaciones
    notificaciones: {
      cambios_posicion: boolean;
      nuevos_participantes: boolean;
      finalizacion_ranking: boolean;
      recordatorios_calculo: boolean;
    };
    
    // Configuración de visibilidad
    visibilidad: {
      publico: boolean;
      destacado: boolean;
      featured: boolean;
      mostrar_metricas_detalladas: boolean;
      permitir_comentarios: boolean;
    };
    
    // Configuración de exportación
    exportacion: {
      formato_por_defecto: 'json' | 'csv' | 'xlsx' | 'pdf';
      incluir_metricas_detalladas: boolean;
      incluir_estadisticas: boolean;
      incluir_graficos: boolean;
    };
  }
  
  /**
   * Interface para auditoría de ranking
   */
  export interface AuditoriaRanking {
    ranking_id: string;
    cambios: Array<{
      fecha: string;
      usuario_id: string;
      usuario_nombre: string;
      tipo_cambio: 'creacion' | 'actualizacion' | 'calculo' | 'moderacion' | 'eliminacion';
      campo_modificado?: string;
      valor_anterior?: any;
      valor_nuevo?: any;
      razon?: string;
      impacto?: 'bajo' | 'medio' | 'alto';
    }>;
  }
  
  /**
   * Interface para exportación de ranking
   */
  export interface ExportacionRanking {
    formato: 'json' | 'csv' | 'xlsx' | 'pdf';
    ranking: Ranking;
    resultados: RankingResult[];
    estadisticas?: EstadisticasRanking;
    metadatos: {
      fecha_exportacion: string;
      usuario_exportacion: string;
      version_datos: string;
      total_registros: number;
    };
  }
  
  /**
   * Interface para suscripción a rankings
   */
  export interface SuscripcionRanking {
    usuario_id: string;
    ranking_id: string;
    tipo_suscripcion: 'notificaciones' | 'actualizaciones' | 'reportes' | 'completa';
    preferencias: {
      frecuencia_notificaciones: 'inmediata' | 'diaria' | 'semanal' | 'mensual';
      canales_notificacion: ('email' | 'push' | 'sms')[];
      incluir_metricas: boolean;
      incluir_insights: boolean;
    };
    fecha_suscripcion: string;
    activa: boolean;
    ultima_notificacion?: string;
  }
  
  /**
   * Interface para comentarios en rankings
   */
  export interface ComentarioRanking {
    id: string;
    ranking_id: string;
    usuario_id: string;
    usuario_nombre: string;
    contenido: string;
    calificacion?: number;
    fecha_creacion: string;
    fecha_actualizacion?: string;
    moderado: boolean;
    visible: boolean;
    likes: number;
    dislikes: number;
    respuestas?: ComentarioRanking[];
  }