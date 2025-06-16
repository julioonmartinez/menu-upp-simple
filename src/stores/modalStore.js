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