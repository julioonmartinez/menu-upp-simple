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
  let isMobile = false;

  // Detectar móvil
  function checkMobile() {
    if (typeof window !== 'undefined') {
      isMobile = window.innerWidth < 768;
    }
  }

  // Inicializar detección móvil
  if (typeof window !== 'undefined') {
    checkMobile();
    window.addEventListener('resize', checkMobile);
  }

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

  // Generar números de página para mostrar (más compacto)
  function generatePageNumbers(): (number | string)[] {
    const pages: (number | string)[] = [];
    const maxVisible = isMobile ? 5 : 7; // Menos páginas en móvil
    
    if (totalPages <= maxVisible) {
      // Si hay pocas páginas, mostrar todas
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Lógica compacta para páginas con ellipsis
      const start = Math.max(1, currentPage - (isMobile ? 1 : 2));
      const end = Math.min(totalPages, currentPage + (isMobile ? 1 : 2));
      
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
    if (!isMobile) {
      hoveredPage = page;
    }
  }

  function handleMouseLeave() {
    hoveredPage = null;
  }

  // Navegación rápida para móvil
  function jumpToPage() {
    const page = prompt(`Ir a página (1-${totalPages}):`);
    if (page) {
      const pageNum = parseInt(page);
      if (pageNum >= 1 && pageNum <= totalPages && pageNum !== currentPage) {
        dispatch('pageChange', pageNum);
      }
    }
  }
</script>

<nav class="pagination" class:mobile={isMobile} in:fly={{ y: 15, duration: 350, easing: quintOut }}>
  <div class="pagination-container">
    
    <!-- Botón anterior compacto -->
    <button 
      class="pagination-btn prev-btn"
      class:disabled={!hasPrev || loading}
      disabled={!hasPrev || loading}
      on:click={handlePrevious}
      title="Página anterior"
    >
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M15 18L9 12L15 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
      {#if !isMobile}
        <span class="btn-text">Anterior</span>
      {/if}
    </button>

    <!-- Números de página compactos -->
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
            in:scale={{ duration: 150, delay: index * 30 }}
          >
            {page}
          </button>
        {:else}
          <button 
            class="ellipsis-btn"
            on:click={jumpToPage}
            title="Saltar a página..."
            in:scale={{ duration: 150, delay: index * 30 }}
          >
            {page}
          </button>
        {/if}
      {/each}
    </div>

    <!-- Botón siguiente compacto -->
    <button 
      class="pagination-btn next-btn"
      class:disabled={!hasNext || loading}
      disabled={!hasNext || loading}
      on:click={handleNext}
      title="Página siguiente"
    >
      {#if !isMobile}
        <span class="btn-text">Siguiente</span>
      {/if}
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M9 18L15 12L9 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    </button>
  </div>

  <!-- Información de página compacta -->
  <div class="page-info" in:fly={{ y: 8, duration: 250, delay: 150 }}>
    <span class="info-text">
      {#if isMobile}
        {currentPage} / {totalPages}
      {:else}
        Página <strong>{currentPage}</strong> de <strong>{totalPages}</strong>
      {/if}
    </span>
    
    <!-- Salto rápido en desktop -->
    {#if !isMobile && totalPages > 10}
      <button class="jump-btn" on:click={jumpToPage} title="Saltar a página...">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M7 7H17V17M17 7L7 17" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </button>
    {/if}
  </div>

  <!-- Loading overlay más sutil -->
  {#if loading}
    <div class="loading-overlay" in:scale={{ duration: 150 }}>
      <div class="loading-spinner-compact"></div>
    </div>
  {/if}
</nav>

<style>
  .pagination {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 12px; /* Reducido de 20px */
    padding: 20px; /* Reducido de 32px */
    background: white;
    border-radius: 16px; /* Reducido de 20px */
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06); /* Más sutil */
    border: 1px solid #f1f5f9;
    position: relative;
    max-width: 500px; /* Reducido de 600px */
    margin: 0 auto;
  }

  .pagination.mobile {
    padding: 16px;
    border-radius: 12px;
    gap: 10px;
  }

  .pagination-container {
    display: flex;
    align-items: center;
    gap: 8px; /* Reducido de 16px */
    flex-wrap: wrap;
    justify-content: center;
  }

  .pagination-btn {
    background: linear-gradient(135deg, #f8fafc, #f1f5f9);
    border: 1px solid #e2e8f0; /* Reducido de 2px */
    color: #475569;
    padding: 8px 12px; /* Reducido de 12px 20px */
    border-radius: 8px; /* Reducido de 12px */
    font-weight: 600;
    font-size: 0.85rem; /* Reducido de 0.95rem */
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 4px; /* Reducido de 8px */
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    white-space: nowrap;
    min-height: 36px; /* Reducido de 48px */
  }

  .pagination-btn:hover:not(:disabled) {
    background: linear-gradient(135deg, var(--primary-color, #ff6b35), #ff8c69);
    color: white;
    border-color: var(--primary-color, #ff6b35);
    transform: translateY(-2px); /* Reducido de -3px */
    box-shadow: 0 6px 16px rgba(255, 107, 53, 0.3); /* Reducido de 12px 24px */
  }

  .pagination-btn:active:not(:disabled) {
    transform: translateY(0); /* Reducido de -1px */
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
    font-size: 0.8rem; /* Reducido */
  }

  .page-numbers {
    display: flex;
    align-items: center;
    gap: 4px; /* Reducido de 8px */
    flex-wrap: wrap;
    justify-content: center;
  }

  .page-number {
    background: white;
    border: 1px solid #e2e8f0; /* Reducido de 2px */
    color: #64748b;
    width: 36px; /* Reducido de 48px */
    height: 36px;
    border-radius: 8px; /* Reducido de 12px */
    font-weight: 700;
    font-size: 0.85rem; /* Reducido de 1rem */
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
    background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent);
    transition: left 0.4s ease; /* Reducido de 0.5s */
  }

  .page-number:hover:not(:disabled)::before {
    left: 100%;
  }

  .page-number:hover:not(:disabled),
  .page-number.hovered {
    border-color: var(--primary-color, #ff6b35);
    color: var(--primary-color, #ff6b35);
    transform: translateY(-2px) scale(1.02); /* Reducido de -3px y 1.05 */
    box-shadow: 0 4px 12px rgba(255, 107, 53, 0.25); /* Reducido de 8px 20px */
    background: linear-gradient(135deg, #fff7ed, #fed7aa);
  }

  .page-number.current {
    background: linear-gradient(135deg, var(--primary-color, #ff6b35), #ff8c69);
    border-color: var(--primary-color, #ff6b35);
    color: white;
    transform: scale(1.05); /* Reducido de 1.1 */
    box-shadow: 0 4px 12px rgba(255, 107, 53, 0.35); /* Reducido de 8px 20px */
    animation: currentPagePulse 2s ease-in-out infinite;
  }

  @keyframes currentPagePulse {
    0%, 100% { 
      box-shadow: 0 4px 12px rgba(255, 107, 53, 0.35);
    }
    50% { 
      box-shadow: 0 6px 18px rgba(255, 107, 53, 0.5); /* Reducido */
    }
  }

  .page-number:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    transform: none;
  }

  .ellipsis-btn {
    color: #94a3b8;
    font-weight: 700;
    font-size: 1rem; /* Reducido de 1.2rem */
    padding: 0 6px; /* Reducido de 8px */
    display: flex;
    align-items: center;
    justify-content: center;
    height: 36px;
    background: none;
    border: none;
    cursor: pointer;
    transition: all 0.2s ease;
    border-radius: 6px;
  }

  .ellipsis-btn:hover {
    background: #f1f5f9;
    color: var(--primary-color, #ff6b35);
    transform: scale(1.1);
  }

  .page-info {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    padding: 8px 16px; /* Reducido de 12px 24px */
    background: linear-gradient(135deg, #f8fafc, #f1f5f9);
    border: 1px solid #e2e8f0;
    border-radius: 8px; /* Reducido de 12px */
  }

  .info-text {
    color: #64748b;
    font-size: 0.85rem; /* Reducido de 0.95rem */
    font-weight: 500;
  }

  .info-text strong {
    color: #0D1B2A;
    font-weight: 700;
  }

  .jump-btn {
    background: none;
    border: 1px solid #e2e8f0;
    color: #64748b;
    width: 24px; /* Reducido de 28px */
    height: 24px;
    border-radius: 4px; /* Reducido de 6px */
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s ease;
  }

  .jump-btn:hover {
    background: var(--primary-color, #ff6b35);
    color: white;
    border-color: var(--primary-color, #ff6b35);
    transform: scale(1.05);
  }

  .loading-overlay {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(255, 255, 255, 0.8); /* Más transparente */
    backdrop-filter: blur(2px); /* Reducido de 4px */
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 16px;
  }

  .loading-spinner-compact {
    width: 24px; /* Reducido de 32px */
    height: 24px;
    border: 2px solid #f1f5f9; /* Reducido de 3px */
    border-top: 2px solid var(--primary-color, #ff6b35);
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }

  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }

  /* Estados especiales más sutiles */
  .pagination-btn.prev-btn:hover:not(:disabled) {
    background: linear-gradient(135deg, #0D1B2A, #1e293b);
    border-color: #0D1B2A;
  }

  .pagination-btn.next-btn:hover:not(:disabled) {
    background: linear-gradient(135deg, #0D1B2A, #1e293b);
    border-color: #0D1B2A;
  }

  /* Animaciones más sutiles */
  .page-number:active:not(:disabled) {
    transform: translateY(0) scale(0.98); /* Reducido */
  }

  .pagination-btn:active:not(:disabled) {
    animation: buttonPress 0.1s ease;
  }

  @keyframes buttonPress {
    0% { transform: translateY(-2px) scale(1); }
    50% { transform: translateY(0) scale(0.98); }
    100% { transform: translateY(-2px) scale(1); }
  }

  /* Responsive Design más compacto */
  @media (max-width: 768px) {
    .pagination {
      padding: 16px 12px;
      margin: 0 12px;
      border-radius: 12px;
    }
    
    .pagination-container {
      gap: 6px;
    }
    
    .pagination-btn {
      padding: 6px 10px; /* Reducido */
      font-size: 0.8rem;
      min-height: 32px; /* Reducido */
    }
    
    .page-number {
      width: 32px; /* Reducido */
      height: 32px;
      font-size: 0.8rem;
    }
    
    .btn-text {
      display: none;
    }
    
    .page-info {
      padding: 6px 12px; /* Reducido */
    }
    
    .info-text {
      font-size: 0.8rem;
    }
  }

  @media (max-width: 480px) {
    .pagination {
      padding: 12px 8px;
      border-radius: 10px;
    }
    
    .pagination-container {
      gap: 4px;
    }
    
    .pagination-btn {
      min-width: 36px;
      justify-content: center;
      padding: 6px 8px;
    }
    
    .page-number {
      width: 28px; /* Reducido */
      height: 28px;
      font-size: 0.75rem;
    }
    
    .ellipsis-btn {
      height: 28px;
      font-size: 0.9rem;
    }
    
    /* Limitar número de páginas visibles en móvil pequeño */
    .page-numbers {
      max-width: 100%;
      overflow-x: auto;
      padding: 4px 0;
      scrollbar-width: none;
      -ms-overflow-style: none;
    }
    
    .page-numbers::-webkit-scrollbar {
      display: none;
    }
  }

  /* Efectos de hover solo en dispositivos que lo soportan */
  @media (hover: hover) {
    .pagination-btn:hover:not(:disabled) {
      animation: hoverFloat 0.25s ease forwards; /* Reducido de 0.3s */
    }
    
    .page-number:hover:not(:disabled):not(.current) {
      animation: hoverBounce 0.25s ease forwards;
    }
  }

  @keyframes hoverFloat {
    0% { transform: translateY(0); }
    100% { transform: translateY(-2px); }
  }

  @keyframes hoverBounce {
    0% { transform: translateY(0) scale(1); }
    50% { transform: translateY(-1px) scale(1.01); }
    100% { transform: translateY(-2px) scale(1.02); }
  }

  /* Accesibilidad mejorada */
  .pagination-btn:focus-visible,
  .page-number:focus-visible,
  .jump-btn:focus-visible {
    outline: 2px solid rgba(255, 107, 53, 0.5); /* Reducido de 3px */
    outline-offset: 1px; /* Reducido de 2px */
  }

  /* Mejoras para usuarios que prefieren menos movimiento */
  @media (prefers-reduced-motion: reduce) {
    .pagination *,
    .page-number::before {
      animation: none;
      transition: none;
    }
    
    .pagination-btn:hover:not(:disabled),
    .page-number:hover:not(:disabled) {
      transform: none;
    }
  }
</style>