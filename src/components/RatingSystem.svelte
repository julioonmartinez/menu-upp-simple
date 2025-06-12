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
    <!-- Estado: Ya valorado -->
    <div class="rating-display" in:scale={{ duration: 300, easing: quintOut }}>
      <div class="rating-label">Tu valoración:</div>
      <div class="stars-row rated">
        {#each [1, 2, 3, 4, 5] as star}
          <span class="star rated" class:filled={star <= userRating}>
            {getStarEmoji(star)}
          </span>
        {/each}
      </div>
      <div class="rating-text-display">{getRatingText(userRating)}</div>
    </div>
  {:else if canRate}
    <!-- Estado: Puede valorar -->
    <div class="rating-interactive" class:mobile={isMobile}>
      
      {#if !hasInteracted || !isMobile}
        <!-- Estrellas interactivas -->
        <div class="rating-prompt" class:mobile={isMobile}>
          <div class="prompt-text" class:mobile={isMobile}>
            {selectedRating > 0 ? '¡Gracias por valorar!' : 'Valorar este restaurante'}
          </div>
          
          <div 
            class="stars-row interactive" 
            class:mobile={isMobile}
            class:selecting={hoveredStar > 0 || selectedRating > 0}
          >
            {#each [1, 2, 3, 4, 5] as star}
              <button
                class="star-btn"
                class:active={getStarDisplay(star)}
                class:mobile={isMobile}
                class:hovered={hoveredStar === star}
                disabled={isRating}
                on:click={() => handleStarClick(star)}
                on:mouseenter={() => handleStarHover(star)}
                on:mouseleave={handleStarLeave}
                title="{star} estrella{star > 1 ? 's' : ''} - {getRatingText(star)}"
                in:scale={{ duration: 200, delay: star * 50, easing: backOut }}
              >
                <span class="star-emoji" class:active={getStarDisplay(star)}>
                  {getStarEmoji(star)}
                </span>
              </button>
            {/each}
          </div>

          {#if (hoveredStar > 0 || selectedRating > 0) && !isMobile}
            <div class="rating-preview" in:fade={{ duration: 200 }}>
              <span class="preview-text">
                {getRatingText(hoveredStar || selectedRating)}
              </span>
              <span class="preview-message">
                {getRatingMessage(hoveredStar || selectedRating)}
              </span>
            </div>
          {/if}
        </div>
      {/if}

      <!-- Confirmación móvil -->
      {#if showConfirmation && isMobile}
        <div 
          class="mobile-confirmation"
          in:fly={{ y: 20, duration: 350, easing: quintOut }}
          out:fly={{ y: -20, duration: 250, easing: quintOut }}
        >
          <div class="confirmation-content">
            <div class="confirmation-header">
              <span class="confirmation-emoji">
                {selectedRating === 5 ? '🤩' : selectedRating >= 4 ? '😊' : selectedRating >= 3 ? '🙂' : selectedRating >= 2 ? '😐' : '😞'}
              </span>
              <div class="confirmation-text">
                <div class="confirmation-title">
                  Valorar con {selectedRating} estrella{selectedRating > 1 ? 's' : ''}
                </div>
                <div class="confirmation-subtitle">
                  {getRatingMessage(selectedRating)}
                </div>
              </div>
            </div>
            
            <div class="confirmation-stars">
              {#each [1, 2, 3, 4, 5] as star}
                <span class="confirmation-star" class:filled={star <= selectedRating}>
                  {getStarEmoji(star)}
                </span>
              {/each}
            </div>

            <div class="confirmation-actions">
              <button 
                class="cancel-btn"
                on:click={cancelRating}
                disabled={isRating}
              >
                Cancelar
              </button>
              <button 
                class="confirm-btn"
                on:click={submitRating}
                disabled={isRating}
                class:loading={isRating}
              >
                {#if isRating}
                  <div class="btn-spinner"></div>
                  Enviando...
                {:else}
                  Confirmar
                {/if}
              </button>
            </div>
          </div>
        </div>
      {/if}

      <!-- Loading state -->
      {#if isRating && !isMobile}
        <div class="rating-loading" in:fade={{ duration: 200 }}>
          <div class="loading-spinner-rating"></div>
          <span>Enviando valoración...</span>
        </div>
      {/if}
    </div>
  {:else}
    <!-- Estado: No puede valorar (pero tampoco tiene rating) -->
    <div class="rating-disabled" in:fade={{ duration: 300 }}>
      <div class="disabled-message">
        <span class="disabled-icon">🔒</span>
        <span class="disabled-text">Ya has valorado este restaurante</span>
      </div>
    </div>
  {/if}
</div>

<style>
  .rating-system {
    width: 100%;
    transition: all 0.3s ease;
  }

  .rating-system.mobile {
    /* Ajustes específicos para móvil */
  }

  .rating-system.has-rating {
    /* Estilos cuando ya tiene rating */
  }

  /* Estado: Ya valorado */
  .rating-display {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
    padding: 12px;
    background: linear-gradient(135deg, #f0fdf4, #dcfce7);
    border: 1px solid #bbf7d0;
    border-radius: 12px;
  }

  .rating-label {
    font-size: 0.8rem;
    font-weight: 600;
    color: #166534;
  }

  .stars-row.rated {
    display: flex;
    gap: 2px;
  }

  .star.rated {
    font-size: 1.1rem;
    color: #fbbf24;
  }

  .star.rated.filled {
    animation: starGlow 0.3s ease;
  }

  .rating-text-display {
    font-size: 0.85rem;
    font-weight: 600;
    color: #166534;
  }

  /* Estado: Interactivo */
  .rating-interactive {
    width: 100%;
  }

  .rating-interactive.mobile {
    /* Ajustes móvil */
  }

  .rating-prompt {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 12px;
    padding: 16px;
    background: white;
    border: 1px solid #e2e8f0;
    border-radius: 12px;
    transition: all 0.3s ease;
  }

  .rating-prompt.mobile {
    padding: 14px;
    gap: 10px;
  }

  .rating-prompt:hover {
    border-color: var(--primary-color, #ff6b35);
    box-shadow: 0 4px 12px rgba(255, 107, 53, 0.1);
  }

  .prompt-text {
    font-size: 0.9rem;
    font-weight: 600;
    color: #0D1B2A;
    text-align: center;
  }

  .prompt-text.mobile {
    font-size: 0.85rem;
  }

  .stars-row.interactive {
    display: flex;
    gap: 6px;
    transition: all 0.3s ease;
  }

  .stars-row.interactive.mobile {
    gap: 8px; /* Más espacio para touch targets */
  }

  .stars-row.interactive.selecting {
    transform: scale(1.05);
  }

  .star-btn {
    background: none;
    border: none;
    cursor: pointer;
    padding: 4px;
    border-radius: 50%;
    transition: all 0.2s ease;
    position: relative;
    width: 36px; /* Reducido de 40px */
    height: 36px;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .star-btn.mobile {
    width: 40px; /* Tamaño adecuado para touch */
    height: 40px;
    padding: 6px;
  }

  .star-btn:hover:not(:disabled) {
    background: rgba(255, 107, 53, 0.1);
    transform: scale(1.1);
  }

  .star-btn.mobile:hover {
    transform: none; /* Sin hover en móvil */
  }

  .star-btn:active:not(:disabled) {
    transform: scale(0.95);
  }

  .star-btn.hovered {
    background: rgba(255, 107, 53, 0.15);
    box-shadow: 0 0 0 2px rgba(255, 107, 53, 0.2);
  }

  .star-btn:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .star-emoji {
    font-size: 1.25rem;
    transition: all 0.2s ease;
    color: #e2e8f0;
  }

  .star-btn.mobile .star-emoji {
    font-size: 1.4rem;
  }

  .star-emoji.active {
    color: #fbbf24;
    animation: starPulse 0.3s ease;
  }

  @keyframes starGlow {
    0% { transform: scale(1); }
    50% { transform: scale(1.2); }
    100% { transform: scale(1); }
  }

  @keyframes starPulse {
    0% { transform: scale(1); }
    50% { transform: scale(1.15); }
    100% { transform: scale(1); }
  }

  /* Preview del rating */
  .rating-preview {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 4px;
    margin-top: 8px;
  }

  .preview-text {
    font-size: 0.9rem;
    font-weight: 700;
    color: var(--primary-color, #ff6b35);
  }

  .preview-message {
    font-size: 0.8rem;
    color: #64748b;
    text-align: center;
  }

  /* Confirmación móvil */
  .mobile-confirmation {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    background: white;
    border: 2px solid var(--primary-color, #ff6b35);
    border-radius: 12px;
    padding: 16px;
    box-shadow: 0 8px 24px rgba(255, 107, 53, 0.2);
    z-index: 10;
  }

  .confirmation-content {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  .confirmation-header {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .confirmation-emoji {
    font-size: 2rem;
    flex-shrink: 0;
  }

  .confirmation-text {
    flex: 1;
  }

  .confirmation-title {
    font-size: 1rem;
    font-weight: 700;
    color: #0D1B2A;
    margin-bottom: 4px;
  }

  .confirmation-subtitle {
    font-size: 0.85rem;
    color: #64748b;
  }

  .confirmation-stars {
    display: flex;
    justify-content: center;
    gap: 4px;
  }

  .confirmation-star {
    font-size: 1.5rem;
    color: #e2e8f0;
  }

  .confirmation-star.filled {
    color: #fbbf24;
  }

  .confirmation-actions {
    display: flex;
    gap: 12px;
  }

  .cancel-btn,
  .confirm-btn {
    flex: 1;
    padding: 10px 16px;
    border-radius: 8px;
    font-weight: 600;
    font-size: 0.9rem;
    cursor: pointer;
    transition: all 0.3s ease;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    position: relative;
  }

  .cancel-btn {
    background: white;
    border: 1px solid #e2e8f0;
    color: #64748b;
  }

  .cancel-btn:hover:not(:disabled) {
    border-color: #cbd5e1;
    color: #475569;
  }

  .confirm-btn {
    background: linear-gradient(135deg, var(--primary-color, #ff6b35), #ff8c69);
    color: white;
    border: none;
  }

  .confirm-btn:hover:not(:disabled) {
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(255, 107, 53, 0.3);
  }

  .confirm-btn:disabled {
    opacity: 0.7;
    cursor: not-allowed;
    transform: none;
  }

  .confirm-btn.loading {
    color: transparent;
  }

  .btn-spinner {
    position: absolute;
    width: 16px;
    height: 16px;
    border: 2px solid rgba(255, 255, 255, 0.3);
    border-top: 2px solid white;
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }

  /* Loading state */
  .rating-loading {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    padding: 16px;
    background: #f8fafc;
    border-radius: 12px;
    color: #64748b;
    font-size: 0.9rem;
  }

  .loading-spinner-rating {
    width: 16px;
    height: 16px;
    border: 2px solid #e2e8f0;
    border-top: 2px solid var(--primary-color, #ff6b35);
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }

  /* Estado deshabilitado */
  .rating-disabled {
    padding: 12px;
    background: #f1f5f9;
    border: 1px solid #e2e8f0;
    border-radius: 12px;
    display: flex;
    justify-content: center;
  }

  .disabled-message {
    display: flex;
    align-items: center;
    gap: 8px;
    color: #64748b;
    font-size: 0.85rem;
  }

  .disabled-icon {
    font-size: 1rem;
  }

  .disabled-text {
    font-weight: 500;
  }

  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }

  /* Responsive */
  @media (max-width: 480px) {
    .rating-prompt {
      padding: 12px;
    }

    .star-btn {
      width: 36px;
      height: 36px;
    }

    .star-emoji {
      font-size: 1.2rem;
    }

    .mobile-confirmation {
      padding: 14px;
    }

    .confirmation-emoji {
      font-size: 1.75rem;
    }

    .confirmation-title {
      font-size: 0.9rem;
    }

    .confirmation-subtitle {
      font-size: 0.8rem;
    }
  }

  /* Accesibilidad */
  @media (prefers-reduced-motion: reduce) {
    .star-btn,
    .star-emoji,
    .stars-row {
      animation: none;
      transition: none;
    }

    .star-btn:hover {
      transform: none;
    }
  }

  /* Focus states */
  .star-btn:focus-visible {
    outline: 2px solid var(--primary-color, #ff6b35);
    outline-offset: 2px;
  }

  .cancel-btn:focus-visible,
  .confirm-btn:focus-visible {
    outline: 2px solid currentColor;
    outline-offset: 2px;
  }
</style>