// src/stores/platilloBaseStore.ts

import { writable, derived, get } from 'svelte/store';
import type { 
  PlatilloBase,
  FiltrosPlatilloBase,
  BusquedaPlatilloBaseResponse
} from '../interfaces/platilloBase';
import type { 
  PlatilloBaseCreateRequest, 
  PlatilloBaseUpdateRequest,
  VinculacionPlatilloRequest,
  SugerenciaVinculacion,
  RankingPlatilloBase,
  EstadisticasPlatilloBase,
  ApiResult
} from '../services/platilloBaseService';
import { platilloBaseService } from '../services/platilloBaseService';

// Tipos para el estado del store
interface PlatilloBaseState {
  // Lista de platillos base
  platillosBase: PlatilloBase[];
  
  // Platillo base actualmente seleccionado
  platilloBaseSeleccionado: PlatilloBase | null;
  
  // Estado de carga
  loading: boolean;
  
  // Estado de error
  error: string | null;
  
  // Paginación
  pagination: {
    total: number;
    page: number;
    limit: number;
    total_pages: number;
    has_next: boolean;
    has_prev: boolean;
  };
  
  // Filtros aplicados
  filtrosAplicados: FiltrosPlatilloBase;
  
  // Rankings
  rankings: RankingPlatilloBase[];
  
  // Sugerencias de vinculación
  sugerenciasVinculacion: SugerenciaVinculacion[];
  
  // Estadísticas
  estadisticas: EstadisticasPlatilloBase | null;
  
  // Estado de moderación
  pendientesModeracion: PlatilloBase[];
  
  // Cache de platillos base por ID
  cache: Map<string, PlatilloBase>;
}

// Estado inicial
const initialState: PlatilloBaseState = {
  platillosBase: [],
  platilloBaseSeleccionado: null,
  loading: false,
  error: null,
  pagination: {
    total: 0,
    page: 1,
    limit: 20,
    total_pages: 0,
    has_next: false,
    has_prev: false
  },
  filtrosAplicados: {},
  rankings: [],
  sugerenciasVinculacion: [],
  estadisticas: null,
  pendientesModeracion: [],
  cache: new Map()
};

// Store principal
function createPlatilloBaseStore() {
  const { subscribe, set, update } = writable<PlatilloBaseState>(initialState);

  return {
    subscribe,
    
    // Resetear el store
    reset: () => set(initialState),
    
    // Establecer estado de carga
    setLoading: (loading: boolean) => update(state => ({ ...state, loading, error: null })),
    
    // Establecer error
    setError: (error: string | null) => update(state => ({ ...state, error, loading: false })),
    
    // Limpiar error
    clearError: () => update(state => ({ ...state, error: null })),
    
    // Cargar platillos base
    async cargarPlatillosBase(
      filtros: FiltrosPlatilloBase = {},
      limit: number = 20,
      page: number = 1,
      sortBy: string = 'popularidad_score',
      sortOrder: number = -1
    ) {
      update(state => ({ ...state, loading: true, error: null }));
      
      try {
        const result = await platilloBaseService.getAllPlatillosBase(filtros, limit, page, sortBy, sortOrder);
        
        if (result.success && result.data) {
          update(state => ({
            ...state,
            platillosBase: result.data!.platillos_base,
            pagination: result.data!.pagination,
            filtrosAplicados: result.data!.filtros_aplicados,
            loading: false,
            error: null
          }));
          
          // Actualizar cache
          result.data!.platillos_base.forEach(platillo => {
            update(state => ({
              ...state,
              cache: new Map(state.cache).set(platillo.id, platillo)
            }));
          });
        } else {
          update(state => ({
            ...state,
            loading: false,
            error: result.error || 'Error cargando platillos base'
          }));
        }
      } catch (error) {
        update(state => ({
          ...state,
          loading: false,
          error: error instanceof Error ? error.message : 'Error desconocido'
        }));
      }
    },
    
    // Cargar platillo base por ID
    async cargarPlatilloBase(id: string) {
      update(state => ({ ...state, loading: true, error: null }));
      
      try {
        // Verificar cache primero
        const currentState = get({ subscribe });
        const cached = currentState.cache.get(id);
        
        if (cached) {
          update(state => ({
            ...state,
            platilloBaseSeleccionado: cached,
            loading: false
          }));
          return;
        }
        
        const result = await platilloBaseService.getPlatilloBase(id);
        
        if (result.success && result.data) {
          update(state => ({
            ...state,
            platilloBaseSeleccionado: result.data!,
            loading: false,
            error: null,
            cache: new Map(state.cache).set(result.data!.id, result.data!)
          }));
        } else {
          update(state => ({
            ...state,
            loading: false,
            error: result.error || 'Error cargando platillo base'
          }));
        }
      } catch (error) {
        update(state => ({
          ...state,
          loading: false,
          error: error instanceof Error ? error.message : 'Error desconocido'
        }));
      }
    },
    
    // Crear platillo base
    async crearPlatilloBase(platilloData: PlatilloBaseCreateRequest) {
      update(state => ({ ...state, loading: true, error: null }));
      
      try {
        const result = await platilloBaseService.createPlatilloBase(platilloData);
        
        if (result.success && result.data) {
          update(state => ({
            ...state,
            platillosBase: [result.data!, ...state.platillosBase],
            platilloBaseSeleccionado: result.data!,
            loading: false,
            error: null,
            cache: new Map(state.cache).set(result.data!.id, result.data!)
          }));
          
          return { success: true, data: result.data! };
        } else {
          update(state => ({
            ...state,
            loading: false,
            error: result.error || 'Error creando platillo base'
          }));
          
          return { success: false, error: result.error };
        }
      } catch (error) {
        update(state => ({
          ...state,
          loading: false,
          error: error instanceof Error ? error.message : 'Error desconocido'
        }));
        
        return { success: false, error: error instanceof Error ? error.message : 'Error desconocido' };
      }
    },
    
    // Actualizar platillo base
    async actualizarPlatilloBase(id: string, platilloData: PlatilloBaseUpdateRequest) {
      update(state => ({ ...state, loading: true, error: null }));
      
      try {
        const result = await platilloBaseService.updatePlatilloBase(id, platilloData);
        
        if (result.success && result.data) {
          update(state => ({
            ...state,
            platillosBase: state.platillosBase.map(pb => 
              pb.id === id ? result.data! : pb
            ),
            platilloBaseSeleccionado: result.data!,
            loading: false,
            error: null,
            cache: new Map(state.cache).set(result.data!.id, result.data!)
          }));
          
          return { success: true, data: result.data! };
        } else {
          update(state => ({
            ...state,
            loading: false,
            error: result.error || 'Error actualizando platillo base'
          }));
          
          return { success: false, error: result.error };
        }
      } catch (error) {
        update(state => ({
          ...state,
          loading: false,
          error: error instanceof Error ? error.message : 'Error desconocido'
        }));
        
        return { success: false, error: error instanceof Error ? error.message : 'Error desconocido' };
      }
    },
    
    // Eliminar platillo base
    async eliminarPlatilloBase(id: string) {
      update(state => ({ ...state, loading: true, error: null }));
      
      try {
        const result = await platilloBaseService.deletePlatilloBase(id);
        
        if (result.success) {
          update(state => ({
            ...state,
            platillosBase: state.platillosBase.filter(pb => pb.id !== id),
            platilloBaseSeleccionado: state.platilloBaseSeleccionado?.id === id ? null : state.platilloBaseSeleccionado,
            loading: false,
            error: null
          }));
          
          // Remover del cache
          const currentState = get({ subscribe });
          const newCache = new Map(currentState.cache);
          newCache.delete(id);
          update(state => ({ ...state, cache: newCache }));
          
          return { success: true };
        } else {
          update(state => ({
            ...state,
            loading: false,
            error: result.error || 'Error eliminando platillo base'
          }));
          
          return { success: false, error: result.error };
        }
      } catch (error) {
        update(state => ({
          ...state,
          loading: false,
          error: error instanceof Error ? error.message : 'Error desconocido'
        }));
        
        return { success: false, error: error instanceof Error ? error.message : 'Error desconocido' };
      }
    },
    
    // Vincular platillo
    async vincularPlatillo(vinculacionData: VinculacionPlatilloRequest) {
      update(state => ({ ...state, loading: true, error: null }));
      
      try {
        const result = await platilloBaseService.vincularPlatillo(vinculacionData);
        
        if (result.success) {
          update(state => ({ ...state, loading: false, error: null }));
          return { success: true, data: result.data };
        } else {
          update(state => ({
            ...state,
            loading: false,
            error: result.error || 'Error vinculando platillo'
          }));
          
          return { success: false, error: result.error };
        }
      } catch (error) {
        update(state => ({
          ...state,
          loading: false,
          error: error instanceof Error ? error.message : 'Error desconocido'
        }));
        
        return { success: false, error: error instanceof Error ? error.message : 'Error desconocido' };
      }
    },
    
    // Obtener sugerencias de vinculación
    async obtenerSugerenciasVinculacion(dishName: string, limit: number = 5) {
      update(state => ({ ...state, loading: true, error: null }));
      
      try {
        const result = await platilloBaseService.obtenerSugerenciasVinculacion(dishName, limit);
        
        if (result.success && result.data) {
          update(state => ({
            ...state,
            sugerenciasVinculacion: result.data!,
            loading: false,
            error: null
          }));
        } else {
          update(state => ({
            ...state,
            loading: false,
            error: result.error || 'Error obteniendo sugerencias'
          }));
        }
      } catch (error) {
        update(state => ({
          ...state,
          loading: false,
          error: error instanceof Error ? error.message : 'Error desconocido'
        }));
      }
    },
    
    // Cargar rankings globales
    async cargarRankingsGlobales(categoria?: string, tipoCocina?: string, limit: number = 50) {
      update(state => ({ ...state, loading: true, error: null }));
      
      try {
        const result = await platilloBaseService.obtenerRankingGlobal(categoria, tipoCocina, limit);
        
        if (result.success && result.data) {
          update(state => ({
            ...state,
            rankings: result.data!,
            loading: false,
            error: null
          }));
        } else {
          update(state => ({
            ...state,
            loading: false,
            error: result.error || 'Error cargando rankings'
          }));
        }
      } catch (error) {
        update(state => ({
          ...state,
          loading: false,
          error: error instanceof Error ? error.message : 'Error desconocido'
        }));
      }
    },
    
    // Cargar pendientes de moderación
    async cargarPendientesModeracion(limit: number = 20, page: number = 1) {
      update(state => ({ ...state, loading: true, error: null }));
      
      try {
        const result = await platilloBaseService.obtenerPendientesModeracion(limit, page);
        
        if (result.success && result.data) {
          update(state => ({
            ...state,
            pendientesModeracion: result.data!.platillos_base,
            loading: false,
            error: null
          }));
        } else {
          update(state => ({
            ...state,
            loading: false,
            error: result.error || 'Error cargando pendientes de moderación'
          }));
        }
      } catch (error) {
        update(state => ({
          ...state,
          loading: false,
          error: error instanceof Error ? error.message : 'Error desconocido'
        }));
      }
    },
    
    // Moderar platillo base
    async moderarPlatilloBase(
      platilloBaseId: string,
      estado: 'pendiente' | 'aprobado' | 'rechazado' | 'revision',
      notas?: string
    ) {
      update(state => ({ ...state, loading: true, error: null }));
      
      try {
        const result = await platilloBaseService.moderarPlatilloBase(platilloBaseId, estado, notas);
        
        if (result.success) {
          // Actualizar en la lista de pendientes
          update(state => ({
            ...state,
            pendientesModeracion: state.pendientesModeracion.filter(pb => pb.id !== platilloBaseId),
            loading: false,
            error: null
          }));
          
          return { success: true, data: result.data };
        } else {
          update(state => ({
            ...state,
            loading: false,
            error: result.error || 'Error moderando platillo base'
          }));
          
          return { success: false, error: result.error };
        }
      } catch (error) {
        update(state => ({
          ...state,
          loading: false,
          error: error instanceof Error ? error.message : 'Error desconocido'
        }));
        
        return { success: false, error: error instanceof Error ? error.message : 'Error desconocido' };
      }
    },
    
    // Seleccionar platillo base
    seleccionarPlatilloBase: (platillo: PlatilloBase | null) => 
      update(state => ({ ...state, platilloBaseSeleccionado: platillo })),
    
    // Limpiar selección
    limpiarSeleccion: () => 
      update(state => ({ ...state, platilloBaseSeleccionado: null })),
    
    // Actualizar filtros
    actualizarFiltros: (filtros: FiltrosPlatilloBase) => 
      update(state => ({ ...state, filtrosAplicados: filtros })),
    
    // Limpiar filtros
    limpiarFiltros: () => 
      update(state => ({ ...state, filtrosAplicados: {} })),
    
    // Obtener platillo base del cache
    getFromCache: (id: string): PlatilloBase | undefined => {
      const currentState = get({ subscribe });
      return currentState.cache.get(id);
    },
    
    // Limpiar cache
    limpiarCache: () => 
      update(state => ({ ...state, cache: new Map() }))
  };
}

// Crear instancia del store
export const platilloBaseStore = createPlatilloBaseStore();

// Stores derivados para facilitar el uso
export const platillosBase = derived(platilloBaseStore, $store => $store.platillosBase);
export const platilloBaseSeleccionado = derived(platilloBaseStore, $store => $store.platilloBaseSeleccionado);
export const loading = derived(platilloBaseStore, $store => $store.loading);
export const error = derived(platilloBaseStore, $store => $store.error);
export const pagination = derived(platilloBaseStore, $store => $store.pagination);
export const filtrosAplicados = derived(platilloBaseStore, $store => $store.filtrosAplicados);
export const rankings = derived(platilloBaseStore, $store => $store.rankings);
export const sugerenciasVinculacion = derived(platilloBaseStore, $store => $store.sugerenciasVinculacion);
export const pendientesModeracion = derived(platilloBaseStore, $store => $store.pendientesModeracion);

// Store derivado para platillos base filtrados
export const platillosBaseFiltrados = derived(
  [platilloBaseStore, filtrosAplicados],
  ([$store, $filtros]) => {
    if (Object.keys($filtros).length === 0) {
      return $store.platillosBase;
    }
    
    return $store.platillosBase.filter(platillo => {
      // Filtrar por tipo de cocina
      if ($filtros.tipo_cocina && platillo.tipo_cocina !== $filtros.tipo_cocina) {
        return false;
      }
      
      // Filtrar por categoría principal
      if ($filtros.categoria_principal && platillo.categoria_principal !== $filtros.categoria_principal) {
        return false;
      }
      
      // Filtrar por subcategoría
      if ($filtros.subcategoria && platillo.subcategoria !== $filtros.subcategoria) {
        return false;
      }
      
      // Filtrar por tags
      if ($filtros.tags && $filtros.tags.length > 0) {
        const platilloTags = platillo.tags || [];
        const tieneTags = $filtros.tags.some(tag => platilloTags.includes(tag));
        if (!tieneTags) {
          return false;
      }
      }
      
      // Filtrar por popularidad mínima
      if ($filtros.min_popularidad && platillo.estadisticas?.popularidad_score < $filtros.min_popularidad) {
        return false;
      }
      
      // Filtrar por instancias mínimas
      if ($filtros.min_instancias && platillo.estadisticas?.num_instancias < $filtros.min_instancias) {
        return false;
      }
      
      // Filtrar por estado de moderación
      if ($filtros.estado_moderacion && platillo.moderacion.estado !== $filtros.estado_moderacion) {
        return false;
      }
      
      return true;
    });
  }
);

// Store derivado para estadísticas resumidas
export const estadisticasResumidas = derived(
  platilloBaseStore,
  $store => {
    const platillos = $store.platillosBase;
    if (platillos.length === 0) return null;
    
    const totalPlatillos = platillos.length;
    const totalRestaurantes = platillos.reduce((sum, pb) => sum + (pb.estadisticas?.num_instancias || 0), 0);
    const ratingPromedio = platillos.reduce((sum, pb) => sum + (pb.estadisticas?.rating_promedio_global || 0), 0) / totalPlatillos;
    const popularidadPromedio = platillos.reduce((sum, pb) => sum + (pb.estadisticas?.popularidad_score || 0), 0) / totalPlatillos;
    
    return {
      totalPlatillos,
      totalRestaurantes,
      ratingPromedio: ratingPromedio.toFixed(1),
      popularidadPromedio: popularidadPromedio.toFixed(0)
    };
  }
);

export default platilloBaseStore; 