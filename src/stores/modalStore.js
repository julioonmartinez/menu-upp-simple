// modalStore.js
import { writable } from 'svelte/store';

// Estado del modal
export const modalState = writable({
  isOpen: false,
  type: null,
  props: {},
  component: null
});

// Stack de modales para manejar múltiples modales si es necesario
export const modalStack = writable([]);

// Funciones helper
export const modalActions = {
  // Abrir un modal
  open: (type, props = {}) => {
    modalState.update(state => ({
      ...state,
      isOpen: true,
      type,
      props
    }));
  },

  // Cerrar el modal actual
  close: () => {
    modalState.update(state => ({
      ...state,
      isOpen: false,
      type: null,
      props: {}
    }));
  },

  // Actualizar props del modal actual
  updateProps: (newProps) => {
    modalState.update(state => ({
      ...state,
      props: { ...state.props, ...newProps }
    }));
  },

  // Verificar si hay un modal abierto
  isOpen: () => {
    let currentState;
    modalState.subscribe(state => currentState = state)();
    return currentState.isOpen;
  },

  // Para manejar stack de modales (opcional)
  pushModal: (type, props = {}) => {
    modalStack.update(stack => [
      ...stack,
      { type, props, id: Date.now() }
    ]);
  },

  popModal: () => {
    modalStack.update(stack => stack.slice(0, -1));
  }
};

// Shortcuts para facilitar el uso
export const openModal = modalActions.open;
export const closeModal = modalActions.close;
export const updateModalProps = modalActions.updateProps;

// ========================================
// FUNCIONES ESPECIALES PARA DISH MODALS
// ========================================

/**
 * Abre el modal de platillo estándar
 * @param {Object} dish - Datos del platillo
 * @param {Object} additionalProps - Props adicionales
 */
export const openDishModal = (dish, additionalProps = {}) => {
  openModal('dish', {
    dish,
    ...additionalProps
  });
};

/**
 * Abre el modal de platillo personalizado con colores específicos
 * @param {Object} dish - Datos del platillo
 * @param {Object} colorScheme - Esquema de colores
 * @param {string} colorScheme.primaryColor - Color principal
 * @param {string} colorScheme.secondaryColor - Color secundario
 * @param {string} colorScheme.textColor - Color del texto
 * @param {string} colorScheme.backgroundColor - Color de fondo
 * @param {Object} additionalProps - Props adicionales
 */
export const openCustomDishModal = (dish, colorScheme = {}, additionalProps = {}) => {
  const {
    primaryColor = '#FF6B35',
    secondaryColor = '#4ECDC4',
    textColor = '#2C3E50',
    backgroundColor = '#FFFFFF'
  } = colorScheme;

  openModal('dishCustom', {
    dish,
    primaryColor,
    secondaryColor,
    textColor,
    backgroundColor,
    ...additionalProps
  });
};

/**
 * Abre automáticamente el modal apropiado según si se proporcionan colores personalizados
 * @param {Object} dish - Datos del platillo
 * @param {Object} options - Opciones del modal
 * @param {Object} options.colorScheme - Esquema de colores (opcional)
 * @param {boolean} options.forceCustom - Forzar uso del modal personalizado
 * @param {Object} options.additionalProps - Props adicionales
 */
export const openDishModalSmart = (dish, options = {}) => {
  const { colorScheme, forceCustom = false, additionalProps = {} } = options;
  
  // Si se proporcionan colores personalizados o se fuerza el custom, usar modal personalizado
  if (colorScheme || forceCustom) {
    openCustomDishModal(dish, colorScheme, additionalProps);
  } else {
    // Usar modal estándar
    openDishModal(dish, additionalProps);
  }
};

// ========================================
// FUNCIONES PARA OTROS MODALES
// ========================================

/**
 * Abre el modal de comentarios
 * @param {Object} props - Props del modal de comentarios
 */
export const openCommentsModal = (props = {}) => {
  openModal('comments', props);
};

/**
 * Abre un modal de confirmación (cuando esté implementado)
 * @param {Object} props - Props del modal de confirmación
 */
export const openConfirmationModal = (props = {}) => {
  openModal('confirmation', props);
};

// ========================================
// ESQUEMAS DE COLORES PREDEFINIDOS
// ========================================

export const COLOR_SCHEMES = {
  // Esquema clásico (naranja y azul)
  classic: {
    primaryColor: '#FF6B35',
    secondaryColor: '#4ECDC4',
    textColor: '#2C3E50',
    backgroundColor: '#FFFFFF'
  },
  
  // Esquema natural (verde y dorado)
  natural: {
    primaryColor: '#27AE60',
    secondaryColor: '#F39C12',
    textColor: '#1A252F',
    backgroundColor: '#F8F9FA'
  },
  
  // Esquema elegante (púrpura y rosa)
  elegant: {
    primaryColor: '#8E44AD',
    secondaryColor: '#E74C3C',
    textColor: '#2C3E50',
    backgroundColor: '#FDFEFE'
  },
  
  // Modo oscuro
  dark: {
    primaryColor: '#3498DB',
    secondaryColor: '#E67E22',
    textColor: '#ECF0F1',
    backgroundColor: '#2C3E50'
  },
  
  // Esquema mexicano tradicional
  mexican: {
    primaryColor: '#D32F2F',
    secondaryColor: '#388E3C',
    textColor: '#1B5E20',
    backgroundColor: '#FFF8E1'
  },
  
  // Esquema marino
  ocean: {
    primaryColor: '#1976D2',
    secondaryColor: '#00ACC1',
    textColor: '#0D47A1',
    backgroundColor: '#E3F2FD'
  },
  
  // Esquema sunset
  sunset: {
    primaryColor: '#FF5722',
    secondaryColor: '#FF9800',
    textColor: '#3E2723',
    backgroundColor: '#FFF3E0'
  }
};

/**
 * Abre el modal personalizado con un esquema predefinido
 * @param {Object} dish - Datos del platillo
 * @param {string} schemeName - Nombre del esquema (classic, natural, elegant, etc.)
 * @param {Object} additionalProps - Props adicionales
 */
export const openDishModalWithScheme = (dish, schemeName = 'classic', additionalProps = {}) => {
  const colorScheme = COLOR_SCHEMES[schemeName] || COLOR_SCHEMES.classic;
  openCustomDishModal(dish, colorScheme, additionalProps);
};

// ========================================
// UTILIDADES PARA DETECTAR COLORES DEL RESTAURANTE
// ========================================

/**
 * Extrae colores de un restaurante/menú y genera un esquema personalizado
 * @param {Object} restaurant - Datos del restaurante
 * @returns {Object} Esquema de colores generado
 */
export const generateColorSchemeFromRestaurant = (restaurant) => {
  // Si el restaurante tiene colores definidos
  if (restaurant?.branding?.colors) {
    const { primary, secondary, text, background } = restaurant.branding.colors;
    return {
      primaryColor: primary || '#FF6B35',
      secondaryColor: secondary || '#4ECDC4',
      textColor: text || '#2C3E50',
      backgroundColor: background || '#FFFFFF'
    };
  }
  
  // Si tiene una categoría, usar esquema basado en categoría
  const categorySchemes = {
    'mexican': COLOR_SCHEMES.mexican,
    'italian': COLOR_SCHEMES.elegant,
    'seafood': COLOR_SCHEMES.ocean,
    'bbq': COLOR_SCHEMES.sunset,
    'vegetarian': COLOR_SCHEMES.natural,
    'fast-food': COLOR_SCHEMES.classic
  };
  
  const category = restaurant?.category?.toLowerCase();
  if (category && categorySchemes[category]) {
    return categorySchemes[category];
  }
  
  // Esquema por defecto
  return COLOR_SCHEMES.classic;
};

/**
 * Abre el modal del platillo adaptándose automáticamente al restaurante
 * @param {Object} dish - Datos del platillo
 * @param {Object} restaurant - Datos del restaurante (opcional)
 * @param {Object} additionalProps - Props adicionales
 */
export const openAdaptiveDishModal = (dish, restaurant = null, additionalProps = {}) => {
  if (restaurant) {
    const colorScheme = generateColorSchemeFromRestaurant(restaurant);
    openCustomDishModal(dish, colorScheme, additionalProps);
  } else {
    openDishModal(dish, additionalProps);
  }
};