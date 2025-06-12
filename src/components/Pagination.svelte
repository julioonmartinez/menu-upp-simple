<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { fly, scale } from 'svelte/transition';
  import { quintOut } from 'svelte/easing';

  // Props
  export let currentPage: number;
  export let totalPages: number;
  export let hasNext: boolean;
  export let hasPrev: boolean;
  export let loading: boolean;

  // Dispatcher
  const dispatch = createEventDispatcher<{
    pageChange: number
  }>();

  // Estado local
  let hoveredPage: number | null = null;

  function handlePageClick(page: number) {
    if (page === currentPage || loading) return;
    dispatch('pageChange', page);
  }

  function handlePrevious() {
    if (!hasPrev || loading) return;
    dispatch('pageChange', currentPage - 1);
  }

  function handleNext() {
    if (!hasNext || loading) return;
    dispatch('pageChange', currentPage + 1);
  }

  // Generar números de página para mostrar
  function generatePageNumbers(): (number | string)[] {
    const pages: (number | string)[] = [];
    const maxVisible = 7; // Máximo número de páginas visibles
    
    if (totalPages <= maxVisible) {
      // Si hay pocas páginas, mostrar todas
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Lógica compleja para páginas con ellipsis
      const start = Math.max(1, currentPage - 2);
      const end = Math.min(totalPages, currentPage + 2);
      
      // Siempre mostrar la primera página
      if (start > 1) {
        pages.push(1);
        if (start > 2) {
          pages.push('...');
        }
      }
      
      // Páginas del rango central
      for (let i = start; i <= end; i++) {
        pages.push(i);
      }
      
      // Siempre mostrar la última página
      if (end < totalPages) {
        if (end < totalPages - 1) {
          pages.push('...');
        }
        pages.push(totalPages);
      }
    }
    
    return pages;
  }

  $: pageNumbers = generatePageNumbers();

  function handleMouseEnter(page: number) {
    hoveredPage = page;
  }

  function handleMouseLeave() {
    hoveredPage = null;
  }
</script>

<nav class="pagination" in:fly={{ y: 20, duration: 400, easing: quintOut }}>
  <div class="pagination-container">
    
    <!-- Botón anterior -->
    <button 
      class="pagination-btn prev-btn"
      class:disabled={!hasPrev || loading}
      disabled={!hasPrev || loading}
      on:click={handlePrevious}
      title="Página anterior"
    >
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M15 18L9 12L15 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
      <span class="btn-text">Anterior</span>
    </button>

    <!-- Números de página -->
    <div class="page-numbers">
      {#each pageNumbers as page, index (page)}
        {#if typeof page === 'number'}
          <button 
            class="page-number"
            class:current={page === currentPage}
            class:hovered={hoveredPage === page}
            disabled={loading}
            on:click={() => handlePageClick(page)}
            on:mouseenter={() => handleMouseEnter(page)}
            on:mouseleave={handleMouseLeave}
            title="Ir a la página {page}"
            in:scale={{ duration: 200, delay: index * 50 }}
          >
            {page}
          </button>
        {:else}
          <span class="ellipsis" in:scale={{ duration: 200, delay: index * 50 }}>
            {page}
          </span>
        {/if}
      {/each}
    </div>

    <!-- Botón siguiente -->
    <button 
      class="pagination-btn next-btn"
      class:disabled={!hasNext || loading}
      disabled={!hasNext || loading}
      on:click={handleNext}
      title="Página siguiente"
    >
      <span class="btn-text">Siguiente</span>
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M9 18L15 12L9 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    </button>
  </div>

  <!-- Información de página -->
  <div class="page-info" in:fly={{ y: 10, duration: 300, delay: 200 }}>
    <span class="info-text">
      Página <strong>{currentPage}</strong> de <strong>{totalPages}</strong>
    </span>
  </div>

  <!-- Loading overlay -->
  {#if loading}
    <div class="loading-overlay" in:scale={{ duration: 200 }}>
      <div class="loading-spinner"></div>
    </div>
  {/if}
</nav>

<style>
  .pagination {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 20px;
    padding: 32px;
    background: white;
    border-radius: 20px;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
    border: 1px solid #e2e8f0;
    position: relative;
    max-width: 600px;
    margin: 0 auto;
  }

  .pagination-container {
    display: flex;
    align-items: center;
    gap: 16px;
    flex-wrap: wrap;
    justify-content: center;
  }

  .pagination-btn {
    background: linear-gradient(135deg, #f8fafc, #f1f5f9);
    border: 2px solid #e2e8f0;
    color: #475569;
    padding: 12px 20px;
    border-radius: 12px;
    font-weight: 600;
    font-size: 0.95rem;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 8px;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    white-space: nowrap;
    min-height: 48px;
  }

  .pagination-btn:hover:not(:disabled) {
    background: linear-gradient(135deg, var(--primary-color, #ff6b35), #ff8c69);
    color: white;
    border-color: var(--primary-color, #ff6b35);
    transform: translateY(-3px);
    box-shadow: 0 12px 24px rgba(255, 107, 53, 0.4);
  }

  .pagination-btn:active:not(:disabled) {
    transform: translateY(-1px);
  }

  .pagination-btn.disabled {
    opacity: 0.4;
    cursor: not-allowed;
    transform: none;
    background: #f1f5f9;
    color: #94a3b8;
  }

  .btn-text {
    font-weight: 700;
  }

  .page-numbers {
    display: flex;
    align-items: center;
    gap: 8px;
    flex-wrap: wrap;
    justify-content: center;
  }

  .page-number {
    background: white;
    border: 2px solid #e2e8f0;
    color: #64748b;
    width: 48px;
    height: 48px;
    border-radius: 12px;
    font-weight: 700;
    font-size: 1rem;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    position: relative;
    overflow: hidden;
  }

  .page-number::before {
    content: '';
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.4), transparent);
    transition: left 0.5s ease;
  }

  .page-number:hover:not(:disabled)::before {
    left: 100%;
  }

  .page-number:hover:not(:disabled),
  .page-number.hovered {
    border-color: var(--primary-color, #ff6b35);
    color: var(--primary-color, #ff6b35);
    transform: translateY(-3px) scale(1.05);
    box-shadow: 0 8px 20px rgba(255, 107, 53, 0.3);
    background: linear-gradient(135deg, #fff7ed, #fed7aa);
  }

  .page-number.current {
    background: linear-gradient(135deg, var(--primary-color, #ff6b35), #ff8c69);
    border-color: var(--primary-color, #ff6b35);
    color: white;
    transform: scale(1.1);
    box-shadow: 0 8px 20px rgba(255, 107, 53, 0.4);
    animation: currentPagePulse 2s ease-in-out infinite;
  }

  @keyframes currentPagePulse {
    0%, 100% { 
      box-shadow: 0 8px 20px rgba(255, 107, 53, 0.4);
    }
    50% { 
      box-shadow: 0 12px 28px rgba(255, 107, 53, 0.6);
    }
  }

  .page-number:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    transform: none;
  }

  .ellipsis {
    color: #94a3b8;
    font-weight: 700;
    font-size: 1.2rem;
    padding: 0 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    height: 48px;
  }

  .page-info {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 12px 24px;
    background: linear-gradient(135deg, #f8fafc, #f1f5f9);
    border: 1px solid #e2e8f0;
    border-radius: 12px;
  }

  .info-text {
    color: #64748b;
    font-size: 0.95rem;
    font-weight: 500;
  }

  .info-text strong {
    color: #0D1B2A;
    font-weight: 700;
  }

  .loading-overlay {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(255, 255, 255, 0.9);
    backdrop-filter: blur(4px);
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 20px;
  }

  .loading-spinner {
    width: 32px;
    height: 32px;
    border: 3px solid #f1f5f9;
    border-top: 3px solid var(--primary-color, #ff6b35);
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }

  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }

  /* Estados especiales para navegación rápida */
  .pagination-btn.prev-btn:hover:not(:disabled) {
    background: linear-gradient(135deg, #0D1B2A, #1e293b);
    border-color: #0D1B2A;
  }

  .pagination-btn.next-btn:hover:not(:disabled) {
    background: linear-gradient(135deg, #0D1B2A, #1e293b);
    border-color: #0D1B2A;
  }

  /* Micro-animaciones adicionales */
  .page-number:active:not(:disabled) {
    transform: translateY(-1px) scale(1.02);
  }

  .pagination-btn:active:not(:disabled) {
    animation: buttonPress 0.1s ease;
  }

  @keyframes buttonPress {
    0% { transform: translateY(-3px) scale(1); }
    50% { transform: translateY(-1px) scale(0.98); }
    100% { transform: translateY(-3px) scale(1); }
  }

  /* Responsive Design */
  @media (max-width: 768px) {
    .pagination {
      padding: 24px 20px;
      margin: 0 16px;
    }
    
    .pagination-container {
      gap: 12px;
    }
    
    .pagination-btn {
      padding: 10px 16px;
      font-size: 0.9rem;
      min-height: 44px;
    }
    
    .page-number {
      width: 44px;
      height: 44px;
      font-size: 0.9rem;
    }
    
    .btn-text {
      display: none;
    }
    
    .page-info {
      padding: 10px 20px;
    }
    
    .info-text {
      font-size: 0.9rem;
    }
  }

  @media (max-width: 480px) {
    .pagination {
      padding: 20px 16px;
    }
    
    .pagination-container {
      gap: 8px;
      flex-direction: column;
    }
    
    .page-numbers {
      order: -1;
      margin-bottom: 16px;
      gap: 6px;
    }
    
    .pagination-btn {
      flex: 1;
      justify-content: center;
      min-width: 120px;
    }
    
    .btn-text {
      display: inline;
    }
    
    .page-number {
      width: 40px;
      height: 40px;
      font-size: 0.85rem;
    }
    
    /* Limitar número de páginas visibles en móvil */
    .page-numbers {
      max-width: 100%;
      overflow-x: auto;
      padding: 8px 0;
      scrollbar-width: none;
      -ms-overflow-style: none;
    }
    
    .page-numbers::-webkit-scrollbar {
      display: none;
    }
  }

  /* Efectos de hover mejorados */
  @media (hover: hover) {
    .pagination-btn:hover:not(:disabled) {
      animation: hoverFloat 0.3s ease forwards;
    }
    
    .page-number:hover:not(:disabled):not(.current) {
      animation: hoverBounce 0.3s ease forwards;
    }
  }

  @keyframes hoverFloat {
    0% { transform: translateY(0); }
    100% { transform: translateY(-3px); }
  }

  @keyframes hoverBounce {
    0% { transform: translateY(0) scale(1); }
    50% { transform: translateY(-2px) scale(1.02); }
    100% { transform: translateY(-3px) scale(1.05); }
  }

  /* Accesibilidad mejorada */
  .pagination-btn:focus-visible,
  .page-number:focus-visible {
    outline: 3px solid rgba(255, 107, 53, 0.5);
    outline-offset: 2px;
  }

  /* Estados de carga específicos */
  .pagination.loading .pagination-btn,
  .pagination.loading .page-number {
    pointer-events: none;
    opacity: 0.6;
  }
</style>