<!-- src/components/ui/GlobalModal.svelte -->
<script>
  import { onMount, onDestroy } from 'svelte';
  import Modal from './Modal.svelte';
  
  export let isOpen = false;
  export let title = '';
  export let size = 'md';
  export let showCloseButton = true;
  export let closeOnEscape = true;
  export let closeOnBackdrop = true;
  
  let modalContainer;
  let isMounted = false;
  
  onMount(() => {
    // Crear un contenedor para el modal en el body
    modalContainer = document.createElement('div');
    modalContainer.id = 'global-modal-container';
    document.body.appendChild(modalContainer);
    isMounted = true;
  });
  
  onDestroy(() => {
    // Limpiar el contenedor al destruir
    if (modalContainer && modalContainer.parentNode) {
      modalContainer.parentNode.removeChild(modalContainer);
    }
  });
</script>

{#if isMounted && isOpen}
  <svelte:component this={Modal} 
    {isOpen}
    {title}
    {size}
    {showCloseButton}
    {closeOnEscape}
    {closeOnBackdrop}
    on:close
  >
    <slot />
  </svelte:component>
{/if}

<style>
  /* Estilos para el contenedor global */
  :global(#global-modal-container) {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    z-index: 9999;
    pointer-events: none;
  }
  
  :global(#global-modal-container > *) {
    pointer-events: auto;
  }
</style> 