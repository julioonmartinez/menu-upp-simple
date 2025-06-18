<script>
  import { onMount, onDestroy } from 'svelte';
  import { modalState, closeModal } from '../stores/modalStore';
  import { fade, scale, fly } from 'svelte/transition';
  import { quintOut } from 'svelte/easing';
  
  // Importar todos los tipos de modales
  import CommentsModal from './CommentsModal.svelte';
  import DishModal from './DishModal.svelte';
    import CustomDishModal from './CustomDishModal.svelte';
  // import ConfirmationModal from './modals/ConfirmationModal.svelte';
  // import ImageGalleryModal from './modals/ImageGalleryModal.svelte';
  // import FormModal from './modals/FormModal.svelte';
  
  // Registro de componentes de modal
  const modalComponents = {
    'comments': CommentsModal,
    'dish': DishModal,
    'dishCustom': CustomDishModal,
    // 'confirmation': ConfirmationModal,
    // 'imageGallery': ImageGalleryModal,
    // 'form': FormModal,
  };

  
  
  // Estados usando Svelte 5
  let isMobile = $state(false);
  
  // Valores derivados usando Svelte 5
  const modalStateValue = $derived($modalState);
  const isOpen = $derived(modalStateValue.isOpen);
  const type = $derived(modalStateValue.type);
  const props = $derived(modalStateValue.props);
  const currentComponent = $derived(type ? modalComponents[type] : null);
  const useBottomSheet = $derived(props?.bottomSheet && isMobile);
  
  // Funciones
  function checkMobile() {
    if (typeof window !== 'undefined') {
      isMobile = window.innerWidth < 768;
    }
  }
  
  function handleBackdropClick(event) {
    if (event.target === event.currentTarget) {
      closeModal();
    }
  }
  
  function handleKeydown(event) {
    if (event.key === 'Escape' && isOpen) {
      closeModal();
    }
  }
  
  function handleResize() {
    checkMobile();
  }
  
  // Efectos usando Svelte 5
  $effect(() => {
    // Detectar móvil al montar y en resize
    if (typeof window !== 'undefined') {
      checkMobile();
      window.addEventListener('resize', handleResize);
      
      return () => {
        window.removeEventListener('resize', handleResize);
      };
    }
  });
  
  $effect(() => {
    // Prevenir scroll del body cuando el modal está abierto
    if (typeof document !== 'undefined') {
      if (isOpen) {
        document.body.style.overflow = 'hidden';
      } else {
        document.body.style.overflow = '';
      }
      
      // Cleanup cuando el componente se desmonta
      return () => {
        document.body.style.overflow = '';
      };
    }
  });
</script>

<!-- Listener global para ESC -->
<svelte:window on:keydown={handleKeydown} />

{#if isOpen && currentComponent}
  <!-- Backdrop -->
  <div 
    class="modal-backdrop"
    on:click={handleBackdropClick}
    in:fade={{ duration: 200 }}
    out:fade={{ duration: 150 }}
    role="dialog"
    aria-modal="true"
  >
    <!-- Container del modal -->
    <div 
      class="modal-container"
      class:bottom-sheet-container={useBottomSheet}
      in:fly={useBottomSheet ? 
        { y: 300, duration: 300, easing: quintOut } : 
        { y: 30, duration: 300, easing: quintOut }
      }
      out:fly={useBottomSheet ? 
        { y: 300, duration: 250 } : 
        { y: -30, duration: 200 }
      }
    >
      <!-- Renderizar componente dinámicamente -->
      <svelte:component 
        this={currentComponent} 
        {...props}
        on:close={closeModal}
      />
    </div>
  </div>
{/if}

<style>
  .modal-backdrop {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    width: 100vw;
    height: 100vh;
    background: rgba(0, 0, 0, 0.6);
    backdrop-filter: blur(4px);
    z-index: 99999;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 1rem;
    overflow-y: auto;
  }
  
  .modal-container {
    position: relative;
    max-width: 90vw;
    max-height: 90vh;
    margin: auto;
    /* El componente hijo define sus propios estilos */
  }
  
  .modal-container.bottom-sheet-container {
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    max-width: 100vw;
    max-height: 90vh;
    width: 100%;
    margin: 0;
  }
  
  /* Responsive */
  @media (max-width: 768px) {
    .modal-backdrop {
      padding: 0.5rem;
      align-items: flex-end;
    }
    
    .modal-container {
      max-width: 100%;
      max-height: 95vh;
      width: 100%;
    }
    
    .modal-container.bottom-sheet-container {
      padding: 0;
      align-items: flex-end;
    }
  }
  
  /* Asegurar que funcione en todos los navegadores */
  @supports not (backdrop-filter: blur(4px)) {
    .modal-backdrop {
      background: rgba(0, 0, 0, 0.8);
    }
  }
</style>