import { writable } from 'svelte/store';

export interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
  duration?: number;
  autoClose?: boolean;
}

interface ToastStore {
  toasts: Toast[];
}

function createToastStore() {
  const { subscribe, update } = writable<ToastStore>({
    toasts: []
  });

  function addToast(toast: Omit<Toast, 'id'>) {
    const id = Math.random().toString(36).substr(2, 9);
    const newToast: Toast = {
      id,
      duration: 4000,
      autoClose: true,
      ...toast
    };

    update(state => ({
      ...state,
      toasts: [...state.toasts, newToast]
    }));

    return id;
  }

  function removeToast(id: string) {
    update(state => ({
      ...state,
      toasts: state.toasts.filter(toast => toast.id !== id)
    }));
  }

  function clearAll() {
    update(state => ({
      ...state,
      toasts: []
    }));
  }

  // Métodos de conveniencia
  function success(message: string, duration?: number) {
    return addToast({ message, type: 'success', duration });
  }

  function error(message: string, duration?: number) {
    return addToast({ message, type: 'error', duration });
  }

  function info(message: string, duration?: number) {
    return addToast({ message, type: 'info', duration });
  }

  return {
    subscribe,
    addToast,
    removeToast,
    clearAll,
    success,
    error,
    info
  };
}

export const toastStore = createToastStore(); 