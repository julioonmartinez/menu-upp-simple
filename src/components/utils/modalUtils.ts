// src/utils/modalUtils.ts
// Utilidades reutilizables para manejar el estado de modales

/**
 * Abre un modal y bloquea el scroll del body
 */
export function openModal(): void {
  if (typeof document !== 'undefined') {
    document.body.classList.add('modal-open');
  }
}

/**
 * Cierra un modal y restaura el scroll del body si no hay otros modales abiertos
 */
export function closeModal(): void {
  if (typeof document !== 'undefined') {
    // Solo remover la clase si no hay otros modales abiertos
    const activeModals = document.querySelectorAll('[class*="-modal-backdrop"]');
    if (activeModals.length <= 1) {
      document.body.classList.remove('modal-open');
    }
  }
}

/**
 * Hook para manejar el estado del modal en componentes Svelte
 * Uso: 
 * ```svelte
 * <script>
 *   import { useModalState } from '../utils/modalUtils';
 *   
 *   // En el componente modal
 *   useModalState();
 * </script>
 * ```
 */
export function useModalState() {
  if (typeof window !== 'undefined') {
    // Abrir modal al montar
    openModal();
    
    // Cleanup al desmontar
    return () => {
      closeModal();
    };
  }
  return () => {};
}

/**
 * Maneja el evento de teclado Escape para cerrar modales
 */
export function handleEscapeKey(event: KeyboardEvent, onClose: () => void): void {
  if (event.key === 'Escape') {
    closeModal();
    onClose();
  }
}

/**
 * Maneja el clic en el backdrop para cerrar modales
 */
export function handleBackdropClick(event: MouseEvent, onClose: () => void): void {
  if (event.target === event.currentTarget) {
    closeModal();
    onClose();
  }
}

/**
 * Detecta si estamos en dispositivo móvil
 */
export function isMobileDevice(): boolean {
  if (typeof window === 'undefined') return false;
  return window.innerWidth < 768;
}

/**
 * Hook reactivo para detectar cambios de tamaño de pantalla
 */
export function useResponsive() {
  let isMobile = $state(isMobileDevice());

  function checkMobile() {
    isMobile = isMobileDevice();
  }

  if (typeof window !== 'undefined') {
    window.addEventListener('resize', checkMobile);
    
    return {
      isMobile: () => isMobile,
      cleanup: () => window.removeEventListener('resize', checkMobile)
    };
  }

  return {
    isMobile: () => false,
    cleanup: () => {}
  };
}