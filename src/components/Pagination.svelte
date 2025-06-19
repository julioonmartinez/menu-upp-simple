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

  // Generar números de página para mostrar (optimizado)
  function generatePageNumbers(): (number | string)[] {
    const pages: (number | string)[] = [];
    const maxVisible = isMobile ? 5 : 7;
    
    if (totalPages <= maxVisible) {
      // Si hay pocas páginas, mostrar todas
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Lógica optimizada para páginas con ellipsis
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

<nav class="pagination" class:mobile={isMobile} in:fly={{ y: 20, duration: 400, easing: quintOut }}>
  <div class="pagination-container">
    
    <!-- Botón anterior mejorado -->
    <button 
      class="pagination-btn prev-btn"
      class:disabled={!hasPrev || loading}
      disabled={!hasPrev || loading}
      on:click={handlePrevious}
      title="Página anterior"
    >
      <div class="btn-icon">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M15 18L9 12L15 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </div>
      {#if !isMobile}
        <span class="btn-text">Anterior</span>
      {/if}
      <div class="btn-glow"></div>
    </button>

    <!-- Números de página elegantes -->
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
            in:scale={{ duration: 200, delay: index * 40 }}
            style="--delay: {index * 40}ms"
          >
            <span class="page-number-text">{page}</span>
            <div class="page-ripple"></div>
            <div class="page-glow"></div>
          </button>
        {:else}
          <button 
            class="ellipsis-btn"
            on:click={jumpToPage}
            title="Saltar a página..."
            in:scale={{ duration: 200, delay: index * 40 }}
          >
            <span class="ellipsis-dots">{page}</span>
            <div class="ellipsis-hover">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M7 7H17V17M17 7L7 17" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </div>
          </button>
        {/if}
      {/each}
    </div>

    <!-- Botón siguiente mejorado -->
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
      <div class="btn-icon">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M9 18L15 12L9 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </div>
      <div class="btn-glow"></div>
    </button>
  </div>

  <!-- Información de página elegante -->
  <div class="page-info" in:fly={{ y: 10, duration: 300, delay: 200 }}>
    <div class="info-content">
      <span class="info-text">
        {#if isMobile}
          <span class="current-page">{currentPage}</span>
          <span class="separator">de</span>
          <span class="total-pages">{totalPages}</span>
        {:else}
          Página <strong class="current-page">{currentPage}</strong> de <strong class="total-pages">{totalPages}</strong>
        {/if}
      </span>
      
      <!-- Salto rápido en desktop -->
      {#if !isMobile && totalPages > 10}
        <button class="jump-btn" on:click={jumpToPage} title="Saltar a página...">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M7 7H17V17M17 7L7 17" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </button>
      {/if}
    </div>
    
    <!-- Barra de progreso -->
    <div class="progress-bar">
      <div class="progress-fill" style="--progress: {(currentPage / totalPages) * 100}%"></div>
    </div>
  </div>

  <!-- Loading overlay elegante -->
  {#if loading}
    <div class="loading-overlay" in:scale={{ duration: 200 }}>
      <div class="loading-spinner-elegant">
        <div class="spinner-ring"></div>
        <div class="spinner-ring"></div>
        <div class="spinner-ring"></div>
      </div>
    </div>
  {/if}
</nav>

<style>
  .pagination {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: var(--spacing-xl);
    padding: var(--spacing-3xl) var(--spacing-2xl);
    background: var(--bg-primary);
    border-radius: var(--radius-2xl);
    box-shadow: var(--shadow-lg);
    border: 1px solid var(--bg-accent);
    position: relative;
    max-width: var(--container-md);
    margin: 0 auto;
    backdrop-filter: var(--backdrop-blur);
    transition: all var(--transition-normal);
  }

  .pagination.mobile {
    padding: var(--spacing-2xl) var(--spacing-xl);
    border-radius: var(--radius-xl);
    gap: var(--spacing-lg);
  }

  .pagination-container {
    display: flex;
    align-items: center;
    gap: var(--spacing-lg);
    flex-wrap: wrap;
    justify-content: center;
  }

  .pagination-btn {
    background: var(--bg-glass);
    border: 1px solid var(--bg-accent);
    color: var(--text-secondary);
    padding: var(--spacing-md) var(--spacing-xl);
    border-radius: var(--radius-lg);
    font-weight: var(--weight-semibold);
    font-size: var(--font-base);
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: var(--spacing-sm);
    transition: all var(--transition-normal);
    white-space: nowrap;
    min-height: 48px;
    position: relative;
    overflow: hidden;
    touch-action: manipulation;
  }

  .pagination-btn::before {
    content: '';
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: var(--bg-surface);
    transition: left var(--transition-slow);
  }

  .pagination-btn:hover:not(:disabled)::before {
    left: 100%;
  }

  .btn-icon {
    display: flex;
    align-items: center;
    transition: transform var(--transition-fast);
  }

  .pagination-btn:hover:not(:disabled) .btn-icon {
    transform: scale(1.1);
  }

  .prev-btn:hover:not(:disabled) .btn-icon {
    transform: translateX(-2px) scale(1.1);
  }

  .next-btn:hover:not(:disabled) .btn-icon {
    transform: translateX(2px) scale(1.1);
  }

  .btn-glow {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: var(--primary-gradient);
    border-radius: var(--radius-lg);
    opacity: 0;
    transition: opacity var(--transition-fast);
  }

  .pagination-btn:hover:not(:disabled) {
    color: var(--text-inverse);
    border-color: var(--primary-color);
    transform: translateY(-3px);
    box-shadow: var(--primary-glow);
  }

  .pagination-btn:hover:not(:disabled) .btn-glow {
    opacity: 1;
  }

  .pagination-btn:active:not(:disabled) {
    transform: translateY(-1px);
  }

  .pagination-btn.disabled {
    opacity: 0.4;
    cursor: not-allowed;
    transform: none;
    background: var(--bg-tertiary);
    color: var(--text-light);
  }

  .btn-text {
    font-weight: var(--weight-bold);
    font-size: var(--font-sm);
    position: relative;
    z-index: 2;
  }

  .page-numbers {
    display: flex;
    align-items: center;
    gap: var(--spacing-sm);
    flex-wrap: wrap;
    justify-content: center;
  }

  .page-number {
    background: var(--bg-primary);
    border: 1px solid var(--bg-accent);
    color: var(--text-muted);
    width: 48px;
    height: 48px;
    border-radius: var(--radius-lg);
    font-weight: var(--weight-bold);
    font-size: var(--font-base);
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all var(--transition-normal);
    position: relative;
    overflow: hidden;
    animation: pageSlideIn var(--transition-slow) ease forwards;
    animation-delay: var(--delay, 0ms);
    opacity: 0;
    transform: translateY(var(--spacing-xl));
    touch-action: manipulation;
  }

  @keyframes pageSlideIn {
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  .page-number-text {
    position: relative;
    z-index: 3;
    transition: transform var(--transition-fast);
  }

  .page-ripple {
    position: absolute;
    top: 50%;
    left: 50%;
    width: 0;
    height: 0;
    background: rgba(255, 107, 53, 0.2);
    border-radius: var(--radius-full);
    transform: translate(-50%, -50%);
    transition: all var(--transition-fast);
  }

  .page-glow {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: var(--primary-gradient);
    border-radius: var(--radius-lg);
    opacity: 0;
    transition: opacity var(--transition-fast);
  }

  .page-number:hover:not(:disabled):not(.current) {
    border-color: var(--primary-color);
    color: var(--primary-color);
    transform: translateY(-3px) scale(1.02);
    box-shadow: var(--shadow-md);
    background: linear-gradient(135deg, var(--bg-primary), var(--bg-secondary));
  }

  .page-number:hover:not(:disabled):not(.current) .page-ripple {
    width: 100%;
    height: 100%;
  }

  .page-number:hover:not(:disabled):not(.current) .page-number-text {
    transform: scale(1.1);
  }

  .page-number.current {
    background: var(--primary-gradient);
    border-color: var(--primary-color);
    color: var(--text-inverse);
    transform: scale(1.05);
    box-shadow: var(--primary-glow);
    animation: currentPagePulse 3s ease-in-out infinite;
  }

  .page-number.current .page-glow {
    opacity: 1;
  }

  @keyframes currentPagePulse {
    0%, 100% { 
      box-shadow: var(--primary-glow);
    }
    50% { 
      box-shadow: var(--glow-primary);
    }
  }

  .page-number:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    transform: none;
  }

  .ellipsis-btn {
    color: var(--text-light);
    font-weight: var(--weight-bold);
    font-size: var(--font-xl);
    padding: var(--spacing-sm);
    display: flex;
    align-items: center;
    justify-content: center;
    height: 48px;
    width: 48px;
    background: none;
    border: none;
    cursor: pointer;
    transition: all var(--transition-fast);
    border-radius: var(--radius-md);
    position: relative;
    overflow: hidden;
    touch-action: manipulation;
  }

  .ellipsis-dots {
    transition: opacity var(--transition-fast);
  }

  .ellipsis-hover {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    opacity: 0;
    transition: all var(--transition-fast);
    color: var(--primary-color);
  }

  .ellipsis-btn:hover {
    background: linear-gradient(135deg, var(--bg-secondary), var(--bg-tertiary));
    color: var(--primary-color);
    transform: scale(1.1);
  }

  .ellipsis-btn:hover .ellipsis-dots {
    opacity: 0;
  }

  .ellipsis-btn:hover .ellipsis-hover {
    opacity: 1;
    transform: translate(-50%, -50%) scale(1.1);
  }

  .page-info {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: var(--spacing-md);
    width: 100%;
  }

  .info-content {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: var(--spacing-md);
    padding: var(--spacing-md) var(--spacing-xl);
    background: linear-gradient(135deg, var(--bg-secondary), var(--bg-tertiary));
    border: 1px solid var(--bg-accent);
    border-radius: var(--radius-xl);
    backdrop-filter: var(--backdrop-blur-sm);
  }

  .info-text {
    color: var(--text-muted);
    font-size: var(--font-base);
    font-weight: var(--weight-medium);
    display: flex;
    align-items: center;
    gap: var(--spacing-xs);
  }

  .current-page,
  .total-pages {
    color: var(--primary-color);
    font-weight: var(--weight-bold);
    font-size: var(--font-lg);
  }

  .separator {
    color: var(--text-light);
    font-weight: var(--weight-normal);
  }

  .jump-btn {
    background: var(--bg-primary);
    border: 1px solid var(--bg-accent);
    color: var(--text-muted);
    width: 32px;
    height: 32px;
    border-radius: var(--radius-sm);
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all var(--transition-fast);
    touch-action: manipulation;
  }

  .jump-btn:hover {
    background: var(--primary-color);
    color: var(--text-inverse);
    border-color: var(--primary-color);
    transform: scale(1.1);
  }

  .progress-bar {
    width: 100%;
    max-width: 200px;
    height: 4px;
    background: var(--bg-accent);
    border-radius: var(--radius-xs);
    overflow: hidden;
  }

  .progress-fill {
    height: 100%;
    background: var(--primary-gradient);
    border-radius: var(--radius-xs);
    width: var(--progress);
    transition: width var(--transition-slow);
    position: relative;
  }

  .progress-fill::after {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent);
    animation: progressShine 2s ease-in-out infinite;
  }

  @keyframes progressShine {
    0% { transform: translateX(-100%); }
    100% { transform: translateX(100%); }
  }

  .loading-overlay {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(255, 255, 255, 0.9);
    backdrop-filter: var(--backdrop-blur-sm);
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: var(--radius-2xl);
    z-index: var(--z-loading);
  }

  .loading-spinner-elegant {
    position: relative;
    width: 48px;
    height: 48px;
  }

  .spinner-ring {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    border: 3px solid transparent;
    border-radius: var(--radius-full);
    animation: spinElegant 2s linear infinite;
  }

  .spinner-ring:nth-child(1) {
    border-top-color: var(--primary-color);
    animation-delay: 0s;
  }

  .spinner-ring:nth-child(2) {
    border-right-color: var(--primary-light);
    animation-delay: 0.3s;
    width: 75%;
    height: 75%;
    top: 12.5%;
    left: 12.5%;
  }

  .spinner-ring:nth-child(3) {
    border-bottom-color: var(--primary-dark);
    animation-delay: 0.6s;
    width: 50%;
    height: 50%;
    top: 25%;
    left: 25%;
  }

  @keyframes spinElegant {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }

  /* Responsive Design usando variables globales */
  @media (max-width: 768px) {
    .pagination {
      padding: var(--spacing-xl) var(--spacing-lg);
      margin: 0 var(--spacing-lg);
      border-radius: var(--radius-lg);
    }
    
    .pagination-container {
      gap: var(--spacing-sm);
    }
    
    .pagination-btn {
      padding: var(--spacing-sm) var(--spacing-lg);
      font-size: var(--font-sm);
      min-height: 44px;
    }
    
    .page-number {
      width: 44px;
      height: 44px;
      font-size: var(--font-sm);
    }
    
    .btn-text {
      display: none;
    }
    
    .info-content {
      padding: var(--spacing-sm) var(--spacing-lg);
    }
    
    .info-text {
      font-size: var(--font-sm);
    }
  }

  @media (max-width: 480px) {
    .pagination {
      padding: var(--spacing-lg) var(--spacing-md);
      border-radius: var(--radius-md);
    }
    
    .pagination-container {
      gap: var(--spacing-xs);
    }
    
    .pagination-btn {
      min-width: 40px;
      justify-content: center;
      padding: var(--spacing-sm) var(--spacing-md);
    }
    
    .page-number {
      width: 40px;
      height: 40px;
      font-size: var(--font-xs);
    }
    
    .ellipsis-btn {
      height: 40px;
      width: 40px;
      font-size: var(--font-lg);
    }
    
    /* Limitar número de páginas visibles en móvil pequeño */
    .page-numbers {
      max-width: 100%;
      overflow-x: auto;
      padding: var(--spacing-sm) 0;
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
      animation: hoverFloat var(--transition-fast) ease forwards;
    }
    
    .page-number:hover:not(:disabled):not(.current) {
      animation: hoverBounce var(--transition-fast) ease forwards;
    }
  }

  @keyframes hoverFloat {
    0% { transform: translateY(0); }
    100% { transform: translateY(-3px); }
  }

  @keyframes hoverBounce {
    0% { transform: translateY(0) scale(1); }
    50% { transform: translateY(-2px) scale(1.01); }
    100% { transform: translateY(-3px) scale(1.02); }
  }

  /* Accesibilidad mejorada usando variables globales */
  .pagination-btn:focus-visible,
  .page-number:focus-visible,
  .jump-btn:focus-visible,
  .ellipsis-btn:focus-visible {
    outline: 3px solid rgba(255, 107, 53, 0.5);
    outline-offset: 2px;
  }

  /* Mejoras para usuarios que prefieren menos movimiento */
  @media (prefers-reduced-motion: reduce) {
    .pagination *,
    .page-number,
    .pagination-btn::before,
    .progress-fill::after {
      animation: none;
      transition: none;
    }
    
    .pagination-btn:hover:not(:disabled),
    .page-number:hover:not(:disabled) {
      transform: none;
    }

    .page-number {
      opacity: 1;
      transform: translateY(0);
    }

    .loading-spinner-elegant .spinner-ring {
      animation: none;
      border-top-color: var(--primary-color);
      border-right-color: transparent;
      border-bottom-color: transparent;
      border-left-color: transparent;
    }
  }

  /* Modo oscuro usando variables globales */
  @media (prefers-color-scheme: dark) {
    .loading-overlay {
      background: rgba(30, 41, 59, 0.9);
    }
  }

  /* Alto contraste */
  @media (prefers-contrast: high) {
    .pagination-btn,
    .page-number,
    .jump-btn {
      border-width: 2px;
    }
  }
</style>