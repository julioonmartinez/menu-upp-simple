<script lang="ts">
  import { onMount } from 'svelte';
  import { fade, fly } from 'svelte/transition';
  import { quintOut } from 'svelte/easing';

  // Props
  const { totalResults, currentPage = 1, totalPages = 1, isMobile = false } = $props<{
    totalResults: number;
    currentPage?: number;
    totalPages?: number;
    isMobile?: boolean;
  }>();

  // Estado para mensajes rotativos
  let currentMessageIndex = $state(0);
  let showMessage = $state(true);

  // Mensajes promocionales
  const promotionalMessages = [
    {
      icon: '❤️',
      text: 'Guarda tus favoritos y no los pierdas de vista',
      color: '#ef4444'
    },
    {
      icon: '⭐',
      text: 'Califica y comenta para obtener descuentos increíbles',
      color: '#f59e0b'
    },
    {
      icon: '🎯',
      text: 'Descubre nuevos sabores cerca de ti',
      color: '#10b981'
    },
    {
      icon: '🔥',
      text: 'Los restaurantes mejor valorados te esperan',
      color: '#ff6b35'
    }
  ];

  // Rotar mensajes cada 4 segundos
  onMount(() => {
    const interval = setInterval(() => {
      showMessage = false;
      setTimeout(() => {
        currentMessageIndex = (currentMessageIndex + 1) % promotionalMessages.length;
        showMessage = true;
      }, 300);
    }, 4000);

    return () => clearInterval(interval);
  });

  // Formatear número con separadores de miles
  function formatNumber(num: number): string {
    return num.toLocaleString();
  }

  // Obtener texto contextual
  function getResultsText(): string {
    if (totalResults === 0) return 'No hay resultados';
    if (totalResults === 1) return '1 restaurante encontrado';
    return `${formatNumber(totalResults)} restaurantes encontrados`;
  }

  const currentMessage = $derived(() => promotionalMessages[currentMessageIndex]);
</script>

<div class="results-header-compact" class:mobile={isMobile}>
  <div class="header-content">
    <!-- Sección principal: Resultados + Mensaje promocional -->
    <div class="main-section">
      <!-- Contador de resultados -->
      <div class="results-count-compact">
        <div class="count-wrapper">
          <span class="count-number">{formatNumber(totalResults)}</span>
          <span class="count-text">
            {isMobile ? 'encontrados' : 'restaurantes encontrados'}
          </span>
        </div>
        
        <!-- Información de página (sutil) -->
        {#if totalPages > 1 && !isMobile}
          <span class="page-info-compact">
            Página {currentPage} de {totalPages}
          </span>
        {/if}
      </div>

      <!-- Mensaje promocional rotativo -->
      <div class="promotional-section">
        {#if showMessage}
          <div 
            class="promo-message"
            style="--accent-color: {currentMessage().color}"
            in:fly={{ y: 15, duration: 300, easing: quintOut }}
            out:fade={{ duration: 200 }}
          >
            <span class="promo-icon">{currentMessage().icon}</span>
            <span class="promo-text">{currentMessage().text}</span>
          </div>
        {/if}
      </div>
    </div>

    <!-- Indicadores de mensaje (solo desktop) -->
    {#if !isMobile}
      <div class="message-indicators">
        {#each promotionalMessages as _, i}
          <button 
            class="indicator-dot"
            class:active={i === currentMessageIndex}
            on:click={() => {
              currentMessageIndex = i;
              showMessage = true;
            }}
            aria-label="Ver mensaje {i + 1}"
          ></button>
        {/each}
      </div>
    {/if}
  </div>
</div>

<style>
  .results-header-compact {
    background: white;
    border: 1px solid #f1f5f9;
    border-radius: 12px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
    margin-bottom: 24px;
    overflow: hidden;
    
  }

  .results-header-compact.mobile {
    border-radius: 10px;
    margin-bottom: 20px;
  }

  .header-content {
    padding: 16px 20px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
  }

  .results-header-compact.mobile .header-content {
    padding: 12px 16px;
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }

  /* Sección principal */
  .main-section {
    flex: 1;
    display: flex;
    align-items: center;
    gap: 24px;
  }

  .results-header-compact.mobile .main-section {
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
    width: 100%;
  }

  /* Contador de resultados compacto */
  .results-count-compact {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  .count-wrapper {
    display: flex;
    align-items: baseline;
    gap: 8px;
    flex-wrap: wrap;
  }

  .count-number {
    font-size: 1.5rem;
    font-weight: 800;
    color: var(--primary-color, #ff6b35);
    line-height: 1;
  }

  .results-header-compact.mobile .count-number {
    font-size: 1.25rem;
  }

  .count-text {
    font-size: 0.95rem;
    font-weight: 600;
    color: #374151;
    line-height: 1;
  }

  .results-header-compact.mobile .count-text {
    font-size: 0.85rem;
  }

  .page-info-compact {
    font-size: 0.75rem;
    color: #9ca3af;
    font-weight: 500;
  }

  /* Sección promocional */
  .promotional-section {
  height: 40px; /* FIJO en lugar de min-height */
  display: flex;
  align-items: center;
  justify-content: flex-start; /* AGREGADO */
}

  .promo-message {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background: linear-gradient(135deg, 
    rgba(var(--accent-color), 0.1) 0%, 
    rgba(var(--accent-color), 0.05) 100%);
  border: 1px solid rgba(var(--accent-color), 0.2);
  border-radius: 20px;
  backdrop-filter: blur(10px);
  height: 32px; /* ALTURA FIJA */
  max-width: 400px; /* ANCHO MÁXIMO */
}

  .promo-icon {
    font-size: 1rem;
    flex-shrink: 0;
  }

  .promo-text {
  font-size: 0.8rem;
  font-weight: 600;
  color: #374151;
  white-space: nowrap;
  overflow: hidden; /* AGREGADO */
  text-overflow: ellipsis; /* AGREGADO */
  line-height: 1.2; /* FIJO */
}

  .results-header-compact.mobile .promo-text {
    font-size: 0.75rem;
    white-space: normal;
  }

  /* Indicadores de mensaje */
  .message-indicators {
    display: flex;
    gap: 6px;
    align-items: center;
  }

  .indicator-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    border: none;
    background: #e5e7eb;
    cursor: pointer;
    transition: all 0.3s ease;
  }

  .indicator-dot:hover {
    background: #d1d5db;
    transform: scale(1.2);
  }

  .indicator-dot.active {
    background: var(--primary-color, #ff6b35);
    transform: scale(1.3);
  }

  /* Animaciones CSS custom properties */
  .promo-message {
    --accent-color: 255, 107, 53; /* Default fallback */
  }

  .results-header-compact.mobile .promotional-section {
  height: 44px; /* Altura fija para móvil */
}

.results-header-compact.mobile .promo-message {
  height: 36px; /* Altura fija para móvil */
  max-width: 100%;
}

.results-header-compact.mobile .promo-text {
  white-space: normal; /* Permitir wrap en móvil */
  line-height: 1.3;
  display: -webkit-box;
  -webkit-line-clamp: 2; /* Máximo 2 líneas */
  -webkit-box-orient: vertical;
  overflow: hidden;
}

  /* Estados responsive adicionales */
  @media (max-width: 640px) {
    .header-content {
      padding: 10px 12px;
    }

    .promo-message {
      padding: 6px 10px;
      border-radius: 16px;
    }

    .count-wrapper {
      gap: 6px;
    }

    .promotional-section {
      width: 100%;
    }

    .promo-message {
      width: 100%;
      justify-content: center;
    }
  }

  /* Estados de hover mejorados */
  @media (hover: hover) {
    .promo-message:hover {
      transform: translateY(-1px);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    }
  }

  /* Dark mode support */
  @media (prefers-color-scheme: dark) {
    .results-header-compact {
      background: #1e293b;
      border-color: #334155;
    }

    .count-text,
    .promo-text {
      color: #e2e8f0;
    }

    .page-info-compact {
      color: #94a3b8;
    }

    .indicator-dot {
      background: #475569;
    }

    .indicator-dot:hover {
      background: #64748b;
    }
  }

  /* Reduced motion */
  @media (prefers-reduced-motion: reduce) {
    .promo-message {
      transition: none;
    }

    .indicator-dot {
      transition: none;
    }

    .promo-message:hover {
      transform: none;
    }
  }
</style>