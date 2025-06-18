<script>
  import { createEventDispatcher } from 'svelte';
  //Modal.svelte
  
  const dispatch = createEventDispatcher();
  
  // Props (sin duplicación)
  const { 
    title = '', 
    subtitle = '', 
    showCloseButton = true, 
    size = 'medium', // small, medium, large, full
    headerless = false, 
    bottomSheet =  true, // Convierte en bottom sheet en móviles
    backgroundColor = undefined
  } = $props();
  
  // Estados usando Svelte 5
  let isMobile = $state(false);
  let isDragging = $state(false);
  let startY = $state(0);
  let currentY = $state(0);
  let modalElement = $state(null);
  
  // Valores derivados usando Svelte 5
  const useBottomSheet = $derived(bottomSheet && isMobile);
  
  // Funciones
  function checkMobile() {
    if (typeof window !== 'undefined') {
      isMobile = window.innerWidth < 768;
    }
  }
  
  function handleResize() {
    checkMobile();
  }
  
  function handleTouchStart(event) {
    if (!useBottomSheet) return;
    
    isDragging = true;
    startY = event.touches[0].clientY;
    currentY = startY;
  }
  
  function handleTouchMove(event) {
    if (!isDragging || !useBottomSheet) return;
    
    currentY = event.touches[0].clientY;
    const deltaY = currentY - startY;
    
    // Solo permitir arrastrar hacia abajo
    if (deltaY > 0 && modalElement) {
      modalElement.style.transform = `translateY(${deltaY}px)`;
    }
  }
  
  function handleTouchEnd() {
    if (!isDragging || !useBottomSheet) return;
    
    isDragging = false;
    const deltaY = currentY - startY;
    
    // Si se arrastró más de 100px hacia abajo, cerrar
    if (deltaY > 100) {
      handleClose();
    } else if (modalElement) {
      // Volver a la posición original
      modalElement.style.transform = 'translateY(0)';
    }
  }
  
  function handleClose() {
    dispatch('close');
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
</script>

<div 
  bind:this={modalElement}
  class="modal-content"
  style={`--bg-primary:${backgroundColor}`} 
  class:size-{size}
  class:bottom-sheet={useBottomSheet}
  class:dragging={isDragging}
  on:touchstart={handleTouchStart}
  on:touchmove={handleTouchMove}
  on:touchend={handleTouchEnd}
>
  {#if useBottomSheet}
    <!-- Handle visual para bottom sheet -->
    <div class="bottom-sheet-handle"></div>
  {/if}
  
  {#if !headerless && (title || subtitle || showCloseButton)}
    <!-- Header del modal -->
    <div class="modal-header">
      <div class="modal-header-content">
        {#if title || subtitle}
          <div class="modal-header-info">
            {#if title}
              <h2 class="modal-title">{title}</h2>
            {/if}
            {#if subtitle}
              <p class="modal-subtitle">{subtitle}</p>
            {/if}
          </div>
        {/if}
        
        {#if showCloseButton}
          <button 
            class="close-btn"
            on:click={handleClose}
            title="Cerrar"
            aria-label="Cerrar modal"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </button>
        {/if}
      </div>
    </div>
  {/if}

  <!-- Slot para contenido personalizable -->
  <div class="modal-body" class:no-header={headerless}>
    <slot />
  </div>

  <!-- Slot opcional para footer -->
  {#if $$slots.footer}
    <div class="modal-footer">
      <slot name="footer" />
    </div>
  {/if}
</div>

<style>
  .modal-content {
    background: var( --bg-primary, --bg-custom);
    border-radius: 16px;
    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15);
    display: flex;
    flex-direction: column;
    overflow: hidden;
    width: 100%;
  }
  
  /* Tamaños */
  .modal-content.size-small {
    max-width: 400px;
    max-height: 50vh;
  }
  
  .modal-content.size-medium {
    max-width: 600px;
    max-height: 80vh;
  }
  
  .modal-content.size-large {
    max-width: 900px;
    max-height: 90vh;
  }
  
  .modal-content.size-full {
    max-width: 95vw;
    max-height: 95vh;
  }
  
  /* Header */
  .modal-header {
    padding: 20px;
    border-bottom: 1px solid var(--bg-glass);
    flex-shrink: 0;
    /* display: flex; */
    justify-content: space-between;
  }
  
  .modal-header-content {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
  }
  
  .modal-header-info {
    flex: 1;
    min-width: 0;
  }
  
  .modal-title {
    margin: 0;
    font-size: 1.25rem;
    font-weight: 700;
    color: var(--text-primary);
    line-height: 1.2;
  }
  
  .modal-subtitle {
    margin: 4px 0 0 0;
    font-size: 0.9rem;
    color: var(--text-muted);
    line-height: 1.4;
  }
  
  .close-btn {
    background: var(--bg-glass);
    /* border: 1px solid #e2e8f0; */
    border-radius: 8px;
    width: 40px;
    height: 40px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: all 0.3s ease;
    color: var(--text-muted);
    flex-shrink: 0;
  }
  
  .close-btn:hover {
    background: #f1f5f9;
    color: #475569;
    border-color: #cbd5e1;
    transform: scale(1.05);
  }
  
  /* Body */
  .modal-body {
    flex: 1;
    overflow-y: auto;
    overflow-x: hidden;
    padding: 20px;
    min-height: 0; /* Importante para scroll */
  }
  
  .modal-body.no-header {
    padding-top: 20px;
  }
  
  /* Footer */
  .modal-footer {
    padding: 16px 20px;
    border-top: 1px solid var(--bg-tertiary);
    flex-shrink: 0;
    background: var(--bg-secondary);
  }
  
  /* Scrollbar personalizado */
  .modal-body::-webkit-scrollbar {
    width: 6px;
  }
  
  .modal-body::-webkit-scrollbar-track {
    background: #f1f5f9;
    border-radius: 3px;
  }
  
  .modal-body::-webkit-scrollbar-thumb {
    background: #cbd5e1;
    border-radius: 3px;
  }
  
  .modal-body::-webkit-scrollbar-thumb:hover {
    background: var(--text-light)
  }
  
  /* Firefox */
  .modal-body {
    scrollbar-width: thin;
    scrollbar-color: #cbd5e1 #f1f5f9;
  }
  
  /* Bottom Sheet Styles */
  .modal-content.bottom-sheet {
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    top: auto;
    max-width: 100vw;
    max-height: 90vh;
    width: 100%;
    border-radius: 20px 20px 0 0;
    margin: 0;
    transform: translateY(0);
    transition: transform 0.3s ease;
  }
  
  .modal-content.bottom-sheet.dragging {
    transition: none;
  }
  
  .bottom-sheet-handle {
    width: 40px;
    height: 4px;
    background: var(--bg-accent);
    border-radius: 2px;
    margin: 8px auto 12px auto;
    cursor: grab;
    flex-shrink: 0;
  }
  
  .bottom-sheet-handle:active {
    cursor: grabbing;
  }
  
  /* Ajustes específicos para bottom sheet */
  .modal-content.bottom-sheet .modal-header {
    padding: 12px 20px 16px;
  }
  
  .modal-content.bottom-sheet .modal-body {
    max-height: calc(90vh - 100px);
    padding: 0 20px 20px;
  }
  
  .modal-content.bottom-sheet .modal-body.no-header {
    padding-top: 0;
    max-height: calc(90vh - 60px);
  }
  
  .modal-content.bottom-sheet .modal-footer {
    padding: 12px 20px 20px;
  }
  
  /* Responsive */
  @media (max-width: 768px) {
    .modal-content {
      border-radius: 16px 16px 0 0;
      max-height: 95vh;
    }
    
    .modal-header {
      padding: 16px;
    }
    
    .modal-body {
      padding: 0 16px 16px;
    }
    
    .modal-footer {
      padding: 12px 16px;
    }
    
    .modal-title {
      font-size: 1.125rem;
    }
    
    .modal-subtitle {
      font-size: 0.85rem;
    }
    
    .close-btn {
      width: 36px;
      height: 36px;
    }
    
    /* Todos los tamaños son responsive en móvil */
    .modal-content.size-small,
    .modal-content.size-medium,
    .modal-content.size-large,
    .modal-content.size-full {
      max-width: 100%;
    }
  }
</style>