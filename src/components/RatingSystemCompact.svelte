<script lang="ts">
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

  // Estado local ultra compacto
  let hoveredStar = $state(0);
  let selectedRating = $state(0);
  let showMobileConfirm = $state(false);
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
      // En móvil, mostrar confirmación mini
      showMobileConfirm = true;
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
        showMobileConfirm = false;
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
      showMobileConfirm = false;
    }
  }

  function cancelRating() {
    selectedRating = userRating;
    showMobileConfirm = false;
    hasInteracted = false;
    hoveredStar = 0;
  }

  function getStarDisplay(starNumber: number): boolean {
    if (hoveredStar > 0) return starNumber <= hoveredStar;
    if (selectedRating > 0) return starNumber <= selectedRating;
    return false;
  }

  function getStarEmoji(starNumber: number): string {
    return getStarDisplay(starNumber) ? '⭐' : '☆';
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

  function getRatingEmoji(rating: number): string {
    switch (rating) {
      case 1: return '😞';
      case 2: return '😐';
      case 3: return '🙂';
      case 4: return '😊';
      case 5: return '🤩';
      default: return '';
    }
  }
</script>

<div class="rating-system-compact" class:mobile={isMobile} class:has-rating={userRating > 0}>
  
  {#if !canRate && userRating > 0}
    <!-- Estado: Ya valorado - muy compacto -->
    <div class="rating-display-compact" in:scale={{ duration: 300, easing: quintOut }}>
      <div class="rated-label">Tu valoración:</div>
      <div class="stars-rated-compact">
        {#each [1, 2, 3, 4, 5] as star}
          <span class="star-rated-compact" class:filled={star <= userRating}>
            {getStarEmoji(star)}
          </span>
        {/each}
      </div>
      <div class="rating-text-compact">{getRatingText(userRating)}</div>
    </div>
  {:else if canRate}
    <!-- Estado: Puede valorar - ultra compacto -->
    <div class="rating-interactive-compact" class:mobile={isMobile}>
      
      {#if !hasInteracted || !isMobile}
        <!-- Estrellas compactas -->
        <div class="rating-prompt-compact">
          <div class="prompt-text-compact">
            {selectedRating > 0 ? '¡Gracias!' : 'Valorar'}
          </div>
          
          <div 
            class="stars-row-compact" 
            class:mobile={isMobile}
            class:selecting={hoveredStar > 0 || selectedRating > 0}
          >
            {#each [1, 2, 3, 4, 5] as star}
              <button
                class="star-btn-compact"
                class:active={getStarDisplay(star)}
                class:mobile={isMobile}
                class:hovered={hoveredStar === star}
                disabled={isRating}
                onclick={() => handleStarClick(star)}
                onmouseenter={() => handleStarHover(star)}
                onmouseleave={handleStarLeave}
                title="{star} estrella{star > 1 ? 's' : ''} - {getRatingText(star)}"
                in:scale={{ duration: 200, delay: star * 30, easing: backOut }}
              >
                <span class="star-emoji-compact" class:active={getStarDisplay(star)}>
                  {getStarEmoji(star)}
                </span>
              </button>
            {/each}
          </div>

          {#if (hoveredStar > 0 || selectedRating > 0) && !isMobile}
            <div class="rating-preview-compact" in:fade={{ duration: 200 }}>
              <span class="preview-emoji">{getRatingEmoji(hoveredStar || selectedRating)}</span>
              <span class="preview-text-compact">
                {getRatingText(hoveredStar || selectedRating)}
              </span>
            </div>
          {/if}
        </div>
      {/if}

      <!-- Confirmación móvil mini -->
      {#if showMobileConfirm && isMobile}
        <div 
          class="mobile-confirm-mini"
          in:fly={{ y: 15, duration: 300, easing: quintOut }}
          out:fly={{ y: -15, duration: 200, easing: quintOut }}
        >
          <div class="confirm-content-mini">
            <div class="confirm-header-mini">
              <span class="confirm-emoji-mini">{getRatingEmoji(selectedRating)}</span>
              <span class="confirm-text-mini">{selectedRating} estrella{selectedRating > 1 ? 's' : ''}</span>
            </div>
            
            <div class="confirm-actions-mini">
              <button 
                class="cancel-btn-mini"
                onclick={cancelRating}
                disabled={isRating}
              >
                ✕
              </button>
              <button 
                class="confirm-btn-mini"
                onclick={submitRating}
                disabled={isRating}
                class:loading={isRating}
              >
                {#if isRating}
                  <div class="btn-spinner-mini"></div>
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
          <span>Enviando...</span>
        </div>
      {/if}
    </div>
  {:else}
    <!-- Estado: No puede valorar -->
    <div class="rating-disabled-compact" in:fade={{ duration: 300 }}>
      <div class="disabled-message-compact">
        <span class="disabled-icon-compact">🔒</span>
        <span class="disabled-text-compact">Ya valorado</span>
      </div>
    </div>
  {/if}
</div>

<style>
  .rating-system-compact {
    width: 100%;
    transition: all 0.3s ease;
  }

  /* Estado: Ya valorado - compacto */
  .rating-display-compact {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 4px;
    padding: 8px;
    background: linear-gradient(135deg, #f0fdf4, #dcfce7);
    border: 1px solid #bbf7d0;
    border-radius: 8px;
  }

  .rated-label {
    font-size: 0.7rem;
    font-weight: 600;
    color: #166534;
  }

  .stars-rated-compact {
    display: flex;
    gap: 1px;
  }

  .star-rated-compact {
    font-size: 0.9rem;
    color: #fbbf24;
  }

  .rating-text-compact {
    font-size: 0.75rem;
    font-weight: 600;
    color: #166534;
  }

  /* Estado: Interactivo compacto */
  .rating-interactive-compact {
    width: 100%;
  }

  .rating-prompt-compact {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 6px;
    padding: 8px;
    background: white;
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    transition: all 0.3s ease;
  }

  .rating-prompt-compact:hover {
    border-color: var(--primary-color, #ff6b35);
    box-shadow: 0 2px 8px rgba(255, 107, 53, 0.1);
  }

  .prompt-text-compact {
    font-size: 0.75rem;
    font-weight: 600;
    color: #0D1B2A;
    text-align: center;
  }

  .stars-row-compact {
    display: flex;
    gap: 4px;
    transition: all 0.3s ease;
  }

  .stars-row-compact.mobile {
    gap: 6px;
  }

  .star-btn-compact {
    background: none;
    border: none;
    cursor: pointer;
    padding: 2px;
    border-radius: 50%;
    transition: all 0.2s ease;
    position: relative;
    width: 28px;
    height: 28px;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .star-btn-compact.mobile {
    width: 32px;
    height: 32px;
    padding: 4px;
  }

  .star-btn-compact:hover:not(:disabled) {
    background: rgba(255, 107, 53, 0.1);
    transform: scale(1.1);
  }

  .star-btn-compact.mobile:hover {
    transform: none;
  }

  .star-btn-compact:active:not(:disabled) {
    transform: scale(0.95);
  }

  .star-btn-compact.hovered {
    background: rgba(255, 107, 53, 0.15);
  }

  .star-btn-compact:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .star-emoji-compact {
    font-size: 1rem;
    transition: all 0.2s ease;
    color: #e2e8f0;
  }

  .star-btn-compact.mobile .star-emoji-compact {
    font-size: 1.1rem;
  }

  .star-emoji-compact.active {
    color: #fbbf24;
  }

  /* Preview compacto */
  .rating-preview-compact {
    display: flex;
    align-items: center;
    gap: 4px;
    margin-top: 4px;
  }

  .preview-emoji {
    font-size: 0.9rem;
  }

  .preview-text-compact {
    font-size: 0.75rem;
    font-weight: 700;
    color: var(--primary-color, #ff6b35);
  }

  /* Confirmación móvil mini */
  .mobile-confirm-mini {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    background: white;
    border: 2px solid var(--primary-color, #ff6b35);
    border-radius: 8px;
    padding: 8px;
    box-shadow: 0 4px 12px rgba(255, 107, 53, 0.2);
    z-index: 10;
  }

  .confirm-content-mini {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
  }

  .confirm-header-mini {
    display: flex;
    align-items: center;
    gap: 6px;
    flex: 1;
  }

  .confirm-emoji-mini {
    font-size: 1.2rem;
  }

  .confirm-text-mini {
    font-size: 0.8rem;
    font-weight: 700;
    color: #0D1B2A;
  }

  .confirm-actions-mini {
    display: flex;
    gap: 6px;
  }

  .cancel-btn-mini,
  .confirm-btn-mini {
    width: 28px;
    height: 28px;
    border-radius: 6px;
    font-weight: 700;
    cursor: pointer;
    transition: all 0.3s ease;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 0.9rem;
    position: relative;
  }

  .cancel-btn-mini {
    background: white;
    border: 1px solid #e2e8f0;
    color: #64748b;
  }

  .cancel-btn-mini:hover:not(:disabled) {
    border-color: #cbd5e1;
    color: #475569;
  }

  .confirm-btn-mini {
    background: linear-gradient(135deg, var(--primary-color, #ff6b35), #ff8c69);
    color: white;
    border: none;
  }

  .confirm-btn-mini:hover:not(:disabled) {
    transform: translateY(-1px);
    box-shadow: 0 2px 8px rgba(255, 107, 53, 0.3);
  }

  .confirm-btn-mini:disabled {
    opacity: 0.7;
    cursor: not-allowed;
    transform: none;
  }

  .confirm-btn-mini.loading {
    color: transparent;
  }

  .btn-spinner-mini {
    position: absolute;
    width: 12px;
    height: 12px;
    border: 2px solid rgba(255, 255, 255, 0.3);
    border-top: 2px solid white;
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }

  /* Loading compacto */
  .rating-loading-compact {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    padding: 8px;
    background: #f8fafc;
    border-radius: 8px;
    color: #64748b;
    font-size: 0.75rem;
  }

  .loading-spinner-compact {
    width: 12px;
    height: 12px;
    border: 2px solid #e2e8f0;
    border-top: 2px solid var(--primary-color, #ff6b35);
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }

  /* Estado deshabilitado compacto */
  .rating-disabled-compact {
    padding: 6px;
    background: #f1f5f9;
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    display: flex;
    justify-content: center;
  }

  .disabled-message-compact {
    display: flex;
    align-items: center;
    gap: 4px;
    color: #64748b;
    font-size: 0.7rem;
  }

  .disabled-icon-compact {
    font-size: 0.8rem;
  }

  .disabled-text-compact {
    font-weight: 500;
  }

  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }

  /* Responsive compacto */
  @media (max-width: 480px) {
    .rating-prompt-compact {
      padding: 6px;
    }

    .star-btn-compact {
      width: 26px;
      height: 26px;
    }

    .star-emoji-compact {
      font-size: 0.9rem;
    }

    .mobile-confirm-mini {
      padding: 6px;
    }

    .confirm-emoji-mini {
      font-size: 1rem;
    }

    .confirm-text-mini {
      font-size: 0.75rem;
    }
  }

  /* Accesibilidad */
  @media (prefers-reduced-motion: reduce) {
    .star-btn-compact,
    .star-emoji-compact,
    .stars-row-compact {
      animation: none;
      transition: none;
    }

    .star-btn-compact:hover {
      transform: none;
    }
  }

  /* Focus states */
  .star-btn-compact:focus-visible {
    outline: 2px solid var(--primary-color, #ff6b35);
    outline-offset: 2px;
  }

  .cancel-btn-mini:focus-visible,
  .confirm-btn-mini:focus-visible {
    outline: 2px solid currentColor;
    outline-offset: 2px;
  }
</style>