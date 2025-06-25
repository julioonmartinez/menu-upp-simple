<!-- src/components/ui/Modal.svelte - Adaptado a estilos globales -->
<script>
  import { createEventDispatcher, onDestroy, onMount } from 'svelte';
  
  export let isOpen = false;
  export let title = '';
  export let size = 'md';
  export let showCloseButton = true;
  export let closeOnEscape = true;
  export let closeOnBackdrop = true;
  
  const dispatch = createEventDispatcher();
  
  function close() {
    dispatch('close');
  }
  
  function handleKeydown(event) {
    if (closeOnEscape && event.key === 'Escape') {
      close();
    }
  }
  
  function handleBackdropClick(event) {
    if (closeOnBackdrop && event.target === event.currentTarget) {
      close();
    }
  }
  
  // Manejar el scroll del body con clases CSS
  function toggleBodyScrollLock(lock) {
    if (typeof document === 'undefined') return;
    
    const htmlElement = document.documentElement;
    const bodyElement = document.body;
    
    if (lock) {
      // Agregar clase para bloquear scroll
      htmlElement.classList.add('modal-open');
      bodyElement.classList.add('modal-open');
    } else {
      // Remover clase para restaurar scroll
      htmlElement.classList.remove('modal-open');
      bodyElement.classList.remove('modal-open');
      
      // Asegurar que se remueva después de un frame como medida adicional
      requestAnimationFrame(() => {
        htmlElement.classList.remove('modal-open');
        bodyElement.classList.remove('modal-open');
      });
    }
  }
  
  // Reactive statement para manejar el scroll
  $: toggleBodyScrollLock(isOpen);
  
  // Limpiar al destruir el componente
  onDestroy(() => {
    toggleBodyScrollLock(false);
  });
  
  // Limpiar al montar/desmontar
  onMount(() => {
    return () => {
      toggleBodyScrollLock(false);
    };
  });
</script>

<svelte:window on:keydown={handleKeydown} />

{#if isOpen}
  <div class="modal-overlay" on:click={handleBackdropClick}>
    <div class="modal-container modal-{size} bg-white rounded-xl shadow-xl flex flex-col overflow-hidden animate-slide-up">
      <!-- Header -->
      {#if title || showCloseButton}
        <div class="modal-header flex items-center justify-between border-b p-2xl pb-lg mb-lg">
          {#if title}
            <h2 class="modal-title text-xl font-semibold text-primary m-0">{title}</h2>
          {/if}
          {#if showCloseButton}
            <button
              type="button"
              class="modal-close-btn btn btn-ghost btn-rounded"
              on:click={close}
              aria-label="Cerrar modal"
            >
              <svg class="modal-close-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          {/if}
        </div>
      {/if}
      <!-- Content -->
      <div class="modal-content p-2xl overflow-y-auto flex-1">
        <slot />
      </div>
    </div>
  </div>
{/if}

<style>
  :global(html.modal-open),
  :global(body.modal-open) {
    overflow: hidden !important;
    height: 100% !important;
  }
  :global(body.modal-open) {
    position: fixed !important;
    width: 100% !important;
    height: 100% !important;
    top: 0 !important;
    left: 0 !important;
  }
  .modal-overlay {
    position: fixed;
    inset: 0;
    background: rgba(0,0,0,0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: var(--z-modal, 500);
    padding: var(--spacing-lg);
    animation: fadeIn 0.15s ease-out;
    overflow-y: auto;
  }
  .modal-container {
    max-height: 90vh;
    margin: auto;
  }
  .modal-sm { max-width: 28rem; width: 100%; }
  .modal-md { max-width: 32rem; width: 100%; }
  .modal-lg { max-width: 48rem; width: 100%; }
  .modal-xl { max-width: 64rem; width: 100%; }
  .modal-full { max-width: 95vw; width: 100%; max-height: 95vh; }
  .modal-header { border-bottom: 1px solid var(--bg-accent); }
  .modal-close-icon { width: 1.5rem; height: 1.5rem; }
  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }
  @keyframes slideUp {
    from { transform: translateY(100%); opacity: 0; }
    to { transform: translateY(0); opacity: 1; }
  }
  .animate-slide-up { animation: slideUp 0.2s cubic-bezier(0.4,0,0.2,1) both; }
  @media (max-width: 640px) {
    .modal-overlay { padding: var(--spacing-sm); }
    .modal-container { max-height: 95vh; }
    .modal-sm, .modal-md, .modal-lg, .modal-xl { max-width: 100%; }
    .modal-header { padding: var(--spacing-lg) var(--spacing-lg) 0 var(--spacing-lg); }
    .modal-content { padding: 0 var(--spacing-lg) var(--spacing-lg) var(--spacing-lg); }
  }
</style>