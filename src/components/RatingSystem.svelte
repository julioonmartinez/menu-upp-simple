<script lang="ts">
  //RatingSystem
  import { createEventDispatcher } from 'svelte';
  import { scale, fade, fly } from 'svelte/transition';
  import { quintOut, backOut } from 'svelte/easing';
  
  import { 
    isRatingInProgress, 
    rateRestaurantAnonymously, 
    canUserRate, 
    getUserRatingForRestaurant 
  } from '../stores/ratingStore';

  // Props
  const { restaurantId } = $props<{
    restaurantId: string;
  }>();

  // Dispatcher para toasts
  const dispatch = createEventDispatcher<{
    toast: { message: string; type: 'success' | 'error' | 'info' }
  }>();

  // Estado local compacto
  let hoveredStar = $state(0);
  let selectedRating = $state(0);
  let showConfirmation = $state(false);
  let isMobile = $state(false);
  let hasInteracted = $state(false);

  // Detectar móvil
  function checkMobile() {
    if (typeof window !== 'undefined') {
      isMobile = window.innerWidth < 768;
    }
  }

  // Inicializar
  if (typeof window !== 'undefined') {
    checkMobile();
    window.addEventListener('resize', checkMobile);
  }

  // Valores derivados
  let isRating = $derived($isRatingInProgress(restaurantId));
  let canRate = $derived(canUserRate(restaurantId));
  let userRating = $derived(getUserRatingForRestaurant(restaurantId));

  // Al montar, verificar si ya tiene rating
  $effect(() => {
    if (userRating > 0) {
      selectedRating = userRating;
    }
  });

  function handleStarHover(star: number) {
    if (!isMobile && canRate && !isRating) {
      hoveredStar = star;
    }
  }

  function handleStarLeave() {
    if (!isMobile) {
      hoveredStar = 0;
    }
  }

  function handleStarClick(star: number) {
    if (!canRate || isRating) return;

    hasInteracted = true;
    selectedRating = star;
    
    if (isMobile) {
      // En móvil, mostrar confirmación
      showConfirmation = true;
    } else {
      // En desktop, rating inmediato
      submitRating();
    }
  }

  async function submitRating() {
    if (selectedRating === 0 || isRating) return;

    try {
      const success = await rateRestaurantAnonymously(restaurantId, selectedRating);
      
      if (success) {
        showConfirmation = false;
        hasInteracted = false;
        
        dispatch('toast', {
          message: `¡Gracias por valorar con ${selectedRating} estrella${selectedRating > 1 ? 's' : ''}!`,
          type: 'success'
        });
      }
    } catch (error) {
      dispatch('toast', {
        message: 'Error al enviar la valoración. Inténtalo de nuevo.',
        type: 'error'
      });
      
      // Reset en caso de error
      selectedRating = userRating;
      showConfirmation = false;
    }
  }

  function cancelRating() {
    selectedRating = userRating;
    showConfirmation = false;
    hasInteracted = false;
    hoveredStar = 0;
  }

  function getStarDisplay(starNumber: number): boolean {
    if (hoveredStar > 0) return starNumber <= hoveredStar;
    if (selectedRating > 0) return starNumber <= selectedRating;
    return false;
  }

  function getRatingEmoji(rating: number): string {
    const emojis = {
      1: '😢',
      2: '😕', 
      3: '😐',
      4: '😊',
      5: '🤩'
    };
    return emojis[rating as keyof typeof emojis] || '😐';
  }

  function getRatingText(rating: number): string {
    switch (rating) {
      case 1: return 'Malo';
      case 2: return 'Regular';
      case 3: return 'Bueno';
      case 4: return 'Muy bueno';
      case 5: return 'Excelente';
      default: return 'Valorar';
    }
  }

  function getRatingMessage(rating: number): string {
    switch (rating) {
      case 1: return '😞 No fue una buena experiencia';
      case 2: return '😐 Podría mejorar';
      case 3: return '🙂 Estuvo bien';
      case 4: return '😊 Me gustó mucho';
      case 5: return '🤩 ¡Increíble!';
      default: return '';
    }
  }
</script>

<div class="rating-system" class:mobile={isMobile} class:has-rating={userRating > 0}>
  
  {#if !canRate && userRating > 0}
    <!-- Estado: Ya valorado - Compacto con emoji -->
    <div class="rating-display-compact" in:scale={{ duration: 300, easing: quintOut }}>
      <div class="stars-row-compact rated">
        {#each [1, 2, 3, 4, 5] as star}
          <i class="fas fa-star star-compact" class:filled={star <= userRating}></i>
        {/each}
      </div>
      <div class="rating-emoji-display">
        {getRatingEmoji(userRating)}
      </div>
    </div>
  {:else if canRate}
    <!-- Estado: Puede valorar -->
    <div class="rating-interactive-compact" class:mobile={isMobile}>
      
      {#if !hasInteracted || !isMobile}
        <!-- Estrellas interactivas compactas -->
        <div class="rating-container-compact">
          <div 
            class="stars-row-compact interactive" 
            class:mobile={isMobile}
          >
            {#each [1, 2, 3, 4, 5] as star}
              <button
                class="star-btn-compact"
                class:active={getStarDisplay(star)}
                class:mobile={isMobile}
                disabled={isRating}
                on:click={() => handleStarClick(star)}
                on:mouseenter={() => handleStarHover(star)}
                on:mouseleave={handleStarLeave}
                title="{star} estrella{star > 1 ? 's' : ''}"
                in:scale={{ duration: 200, delay: star * 30, easing: backOut }}
              >
                <i class="fas fa-star" class:active={getStarDisplay(star)}></i>
              </button>
            {/each}

            <!-- Emoji flotante absoluto -->
            {#if hoveredStar > 0 && !isMobile}
              <div class="hover-emoji-absolute">
                {getRatingEmoji(hoveredStar)}
              </div>
            {/if}
          </div>
        </div>
      {/if}

      <!-- Confirmación móvil compacta -->
      {#if showConfirmation && isMobile}
        <div 
          class="mobile-confirmation-compact"
          in:fly={{ y: 20, duration: 350, easing: quintOut }}
          out:fly={{ y: -20, duration: 250, easing: quintOut }}
        >
          <div class="confirmation-content-compact">
            <div class="confirmation-header-compact">
              <span class="confirmation-emoji-compact">
                {getRatingEmoji(selectedRating)}
              </span>
              <div class="confirmation-stars-compact">
                {#each [1, 2, 3, 4, 5] as star}
                  <i class="fas fa-star confirmation-star-compact" class:filled={star <= selectedRating}></i>
                {/each}
              </div>
            </div>

            <div class="confirmation-actions-compact">
              <button 
                class="cancel-btn-compact"
                on:click={cancelRating}
                disabled={isRating}
              >
                ✕
              </button>
              <button 
                class="confirm-btn-compact"
                on:click={submitRating}
                disabled={isRating}
                class:loading={isRating}
              >
                {#if isRating}
                  <div class="btn-spinner-compact"></div>
                {:else}
                  ✓
                {/if}
              </button>
            </div>
          </div>
        </div>
      {/if}

      <!-- Loading state compacto -->
      {#if isRating && !isMobile}
        <div class="rating-loading-compact" in:fade={{ duration: 200 }}>
          <div class="loading-spinner-compact"></div>
        </div>
      {/if}
    </div>
  {/if}
</div>

<style>
  .rating-system {
    position: relative;
    width: fit-content;
  }

  /* ESTADO VALORADO - Azul transparente compacto */
  .rating-display-compact {
    display: flex;
    align-items: center;
    gap: 0.4rem;
    padding: 0.35rem 0.6rem;
    background: rgba(59, 130, 246, 0.15);
    border: 1px solid rgba(59, 130, 246, 0.3);
    border-radius: 8px;
    backdrop-filter: blur(4px);
  }

  .stars-row-compact {
    display: flex;
    gap: 0.15rem;
    align-items: center;
  }

  .star-compact {
    font-size: 0.9rem;
    color: #d1d5db;
    transition: color 0.15s ease;
  }

  .star-compact.filled {
    color: #3b82f6;
    text-shadow: 0 0 4px rgba(59, 130, 246, 0.3);
  }

  .rating-emoji-display {
    font-size: 1rem;
    line-height: 1;
  }

  /* ESTADO INTERACTIVO COMPACTO */
  .rating-interactive-compact {
    position: relative;
  }

  .rating-container-compact {
    padding: 0.3rem 0.5rem;
    background: rgba(0, 0, 0, 0.04);
    border: 1px solid rgba(0, 0, 0, 0.08);
    border-radius: 8px;
    transition: all 0.2s ease;
  }

  .rating-container-compact:hover {
    background: rgba(0, 0, 0, 0.06);
    border-color: rgba(0, 0, 0, 0.12);
  }

  .stars-row-compact.interactive {
    display: flex;
    gap: 0.2rem;
    position: relative;
  }

  .star-btn-compact {
    background: none;
    border: none;
    cursor: pointer;
    padding: 0.1rem;
    font-size: 1rem;
    color: #d1d5db;
    transition: all 0.15s ease;
    line-height: 1;
    border-radius: 3px;
  }

  .star-btn-compact:hover:not(:disabled) {
    transform: scale(1.1);
  }

  .star-btn-compact i.active {
    color: #fbbf24;
    text-shadow: 0 0 6px rgba(251, 191, 36, 0.4);
  }

  .star-btn-compact:disabled {
    cursor: default;
    opacity: 0.6;
  }

  /* EMOJI FLOTANTE ABSOLUTO */
  .hover-emoji-absolute {
    position: absolute;
    top: -2.2rem;
    left: 50%;
    transform: translateX(-50%);
    background: rgba(0, 0, 0, 0.85);
    color: white;
    padding: 0.25rem 0.4rem;
    border-radius: 6px;
    font-size: 1rem;
    pointer-events: none;
    z-index: 100;
    animation: fadeInUp 0.2s ease;
    white-space: nowrap;
  }

  @keyframes fadeInUp {
    from {
      opacity: 0;
      transform: translateX(-50%) translateY(0.3rem);
    }
    to {
      opacity: 1;
      transform: translateX(-50%) translateY(0);
    }
  }

  /* CONFIRMACIÓN MÓVIL COMPACTA */
  .mobile-confirmation-compact {
    position: absolute;
    top: 100%;
    left: 0;
    right: 0;
    z-index: 50;
    margin-top: 0.5rem;
  }

  .confirmation-content-compact {
    background: white;
    border-radius: 10px;
    padding: 0.75rem;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
    border: 1px solid rgba(0, 0, 0, 0.1);
  }

  .confirmation-header-compact {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin-bottom: 0.6rem;
  }

  .confirmation-emoji-compact {
    font-size: 1.2rem;
  }

  .confirmation-stars-compact {
    display: flex;
    gap: 0.1rem;
  }

  .confirmation-star-compact {
    font-size: 0.8rem;
    color: #d1d5db;
  }

  .confirmation-star-compact.filled {
    color: #fbbf24;
  }

  .confirmation-actions-compact {
    display: flex;
    gap: 0.4rem;
    justify-content: flex-end;
  }

  .cancel-btn-compact,
  .confirm-btn-compact {
    padding: 0.4rem 0.8rem;
    border: none;
    border-radius: 6px;
    font-size: 0.85rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s ease;
    min-width: 2.5rem;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .cancel-btn-compact {
    background: rgba(239, 68, 68, 0.1);
    color: #ef4444;
  }

  .cancel-btn-compact:hover:not(:disabled) {
    background: rgba(239, 68, 68, 0.2);
  }

  .confirm-btn-compact {
    background: #3b82f6;
    color: white;
  }

  .confirm-btn-compact:hover:not(:disabled) {
    background: #2563eb;
  }

  .confirm-btn-compact:disabled {
    opacity: 0.7;
    cursor: not-allowed;
  }

  /* LOADING STATES */
  .rating-loading-compact {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0.5rem;
  }

  .loading-spinner-compact,
  .btn-spinner-compact {
    width: 1rem;
    height: 1rem;
    border: 2px solid transparent;
    border-top: 2px solid currentColor;
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }

  /* OPTIMIZACIONES MÓVILES */
  @media (max-width: 768px) {
    .rating-display-compact {
      padding: 0.3rem 0.5rem;
      gap: 0.3rem;
    }

    .star-compact {
      font-size: 0.8rem;
    }

    .rating-emoji-display {
      font-size: 0.9rem;
    }

    .rating-container-compact {
      padding: 0.25rem 0.4rem;
    }

    .star-btn-compact {
      font-size: 0.9rem;
      padding: 0.15rem;
      min-width: 1.8rem;
      min-height: 1.8rem;
    }

    .confirmation-content-compact {
      padding: 0.6rem;
    }

    .confirmation-emoji-compact {
      font-size: 1.1rem;
    }

    .confirmation-star-compact {
      font-size: 0.75rem;
    }
  }

  /* MODO OSCURO */
  @media (prefers-color-scheme: dark) {
    .rating-display-compact {
      background: rgba(59, 130, 246, 0.2);
      border-color: rgba(59, 130, 246, 0.4);
    }

    .rating-container-compact {
      background: rgba(255, 255, 255, 0.05);
      border-color: rgba(255, 255, 255, 0.1);
    }

    .rating-container-compact:hover {
      background: rgba(255, 255, 255, 0.08);
      border-color: rgba(255, 255, 255, 0.15);
    }

    .confirmation-content-compact {
      background: #1f2937;
      border-color: #374151;
    }
  }

  /* ACCESIBILIDAD */
  .star-btn-compact:focus-visible {
    outline: 2px solid #3b82f6;
    outline-offset: 2px;
  }

  /* REDUCIR ANIMACIONES */
  @media (prefers-reduced-motion: reduce) {
    .star-btn-compact,
    .rating-display-compact,
    .rating-container-compact,
    .hover-emoji-absolute {
      animation: none;
      transition: none;
    }

    .star-btn-compact:hover {
      transform: none;
    }
  }
</style>