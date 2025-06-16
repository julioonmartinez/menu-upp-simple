<script lang="ts">
  //ResultsHeader.svelte
  import { onMount } from 'svelte';
  import { fade, fly } from 'svelte/transition';
  import { quintOut } from 'svelte/easing';

  import './ResultsHeader.css'
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
      <!-- <div class="message-indicators">
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
      </div> -->
    {/if}
  </div>
</div>

