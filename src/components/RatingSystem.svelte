<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { scale, fly, fade } from 'svelte/transition';
  import { quintOut } from 'svelte/easing';
  
  import { 
    ratingStore,
    canUserRate,
    getUserRatingForRestaurant,
    rateRestaurantAnonymously
  } from '../stores/ratingStore';

  // Props
  let restaurantId = $props<string>();

  // Dispatcher para toasts
  const dispatch = createEventDispatcher<{
    toast: { message: string; type: 'success' | 'error' | 'info' }
  }>();

  // Estado local
  let hoveredStar = $state(0);
  let isAnimating = $state(false);

  // Valores derivados
  let canRate = $derived(canUserRate(restaurantId));
  let userRating = $derived(getUserRatingForRestaurant(restaurantId));
  let isRating = $derived($ratingStore.ratingsInProgress[restaurantId] || false);

  async function handleStarClick(rating: number) {
    if (!canRate || isRating) return;
    
    isAnimating = true;
    
    const success = await rateRestaurantAnonymously(restaurantId, rating);
    
    if (success) {
      dispatch('toast', {
        message: '¡Valoración enviada correctamente! Gracias por tu opinión.',
        type: 'success'
      });
      
      // Pequeña animación de éxito
      setTimeout(() => {
        isAnimating = false;
      }, 600);
    } else {
      const storeError = $ratingStore.lastError;
      dispatch('toast', {
        message: storeError || 'Error al enviar la valoración. Inténtalo de nuevo.',
        type: 'error'
      });
      isAnimating = false;
    }
  }

  function handleStarHover(star: number) {
    if (!canRate || isRating) return;
    hoveredStar = star;
  }

  function handleStarLeave() {
    hoveredStar = 0;
  }

  function getStarState(starNumber: number) {
    if (userRating > 0) {
      return starNumber <= userRating ? 'selected' : 'unselected';
    }
    
    if (hoveredStar > 0) {
      return starNumber <= hoveredStar ? 'hovered' : 'unselected';
    }
    
    return 'unselected';
  }

  function getRatingText(rating: number): string {
    const texts = {
      1: 'Muy malo',
      2: 'Malo', 
      3: 'Regular',
      4: 'Bueno',
      5: 'Excelente'
    };
    return texts[rating as keyof typeof texts] || '';
  }
</script>

<div class="rating-system">
  <div class="rating-header">
    <h4 class="rating-title">
      <span class="title-icon">⭐</span>
      Valorar este restaurante
    </h4>
    
    {#if userRating > 0}
      <div class="current-rating" in:scale={{ duration: 300 }}>
        <span class="current-rating-text">Tu valoración:</span>
        <span class="current-rating-value">{userRating} ⭐</span>
      </div>
    {/if}
  </div>

  <div class="rating-container">
    {#if canRate}
      <div class="stars-interactive">
        {#each [1, 2, 3, 4, 5] as starValue}
          <button 
            class="rating-star {getStarState(starValue)}"
            class:animating={isAnimating && userRating === starValue}
            disabled={isRating}
            onclick={() => handleStarClick(starValue)}
            onmouseenter={() => handleStarHover(starValue)}
            onmouseleave={handleStarLeave}
            title="{getRatingText(starValue)} ({starValue} estrella{starValue > 1 ? 's' : ''})"
            in:fly={{ x: -20, duration: 300, delay: starValue * 50 }}
          >
            <span class="star-icon">⭐</span>
            <span class="star-number">{starValue}</span>
          </button>
        {/each}
      </div>

      {#if hoveredStar > 0 && !userRating}
        <div class="rating-preview" in:scale={{ duration: 200 }}>
          <span class="preview-text">{getRatingText(hoveredStar)}</span>
        </div>
      {/if}

      {#if isRating}
        <div class="rating-loading" in:fade={{ duration: 200 }}>
          <div class="loading-spinner-tiny"></div>
          <span>Enviando valoración...</span>
        </div>
      {/if}
    {:else}
      <div class="rating-disabled" in:scale={{ duration: 300 }}>
        <div class="disabled-icon">✅</div>
        <div class="disabled-content">
          <span class="disabled-title">¡Ya has valorado!</span>
          <span class="disabled-subtitle">Gracias por tu opinión</span>
        </div>
      </div>
    {/if}
  </div>

  {#if canRate && !isRating}
    <div class="rating-help" in:fade={{ duration: 400, delay: 200 }}>
      <span class="help-text">Haz clic en las estrellas para valorar</span>
    </div>
  {/if}
</div>

<style>
  .rating-system {
    background: linear-gradient(135deg, #f8fafc, #f1f5f9);
    border: 2px solid #e2e8f0;
    border-radius: 16px;
    padding: 20px;
    transition: all 0.3s ease;
  }

  .rating-system:hover {
    border-color: var(--primary-color, #ff6b35);
    box-shadow: 0 8px 20px rgba(255, 107, 53, 0.1);
  }

  .rating-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 16px;
    flex-wrap: wrap;
    gap: 12px;
  }

  .rating-title {
    margin: 0;
    font-size: 1.1rem;
    font-weight: 700;
    color: #0D1B2A;
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .title-icon {
    font-size: 1.2rem;
  }

  .current-rating {
    display: flex;
    align-items: center;
    gap: 8px;
    background: white;
    padding: 6px 12px;
    border-radius: 20px;
    border: 1px solid #e2e8f0;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  }

  .current-rating-text {
    font-size: 0.85rem;
    color: #64748b;
    font-weight: 500;
  }

  .current-rating-value {
    font-size: 0.9rem;
    font-weight: 700;
    color: var(--primary-color, #ff6b35);
  }

  .rating-container {
    position: relative;
  }

  .stars-interactive {
    display: flex;
    gap: 8px;
    justify-content: center;
    margin-bottom: 12px;
  }

  .rating-star {
    background: white;
    border: 2px solid #e2e8f0;
    border-radius: 12px;
    padding: 12px;
    cursor: pointer;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 4px;
    min-width: 60px;
    position: relative;
    overflow: hidden;
  }

  .rating-star:hover:not(:disabled) {
    transform: translateY(-4px) scale(1.05);
    box-shadow: 0 8px 20px rgba(0, 0, 0, 0.15);
  }

  .rating-star:active:not(:disabled) {
    transform: translateY(-2px) scale(1.02);
  }

  .rating-star:disabled {
    cursor: not-allowed;
    opacity: 0.6;
  }

  .rating-star.unselected {
    border-color: #e2e8f0;
    color: #94a3b8;
  }

  .rating-star.hovered {
    border-color: var(--primary-color, #ff6b35);
    background: linear-gradient(135deg, #fff7ed, #fed7aa);
    color: var(--primary-color, #ff6b35);
    transform: translateY(-4px) scale(1.05);
    box-shadow: 0 8px 20px rgba(255, 107, 53, 0.3);
  }

  .rating-star.selected {
    border-color: var(--primary-color, #ff6b35);
    background: linear-gradient(135deg, var(--primary-color, #ff6b35), #ff8c69);
    color: white;
    box-shadow: 0 8px 20px rgba(255, 107, 53, 0.4);
  }

  .rating-star.animating {
    animation: ratingSuccess 0.6s ease-out;
  }

  @keyframes ratingSuccess {
    0% { transform: scale(1); }
    25% { transform: scale(1.3) rotate(10deg); }
    50% { transform: scale(1.1) rotate(-5deg); }
    75% { transform: scale(1.2) rotate(3deg); }
    100% { transform: scale(1) rotate(0deg); }
  }

  .star-icon {
    font-size: 1.5rem;
    transition: all 0.3s ease;
  }

  .rating-star.hovered .star-icon,
  .rating-star.selected .star-icon {
    transform: scale(1.2);
    filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.2));
  }

  .star-number {
    font-size: 0.75rem;
    font-weight: 700;
    opacity: 0.8;
  }

  .rating-preview {
    text-align: center;
    margin-bottom: 8px;
  }

  .preview-text {
    background: var(--primary-color, #ff6b35);
    color: white;
    padding: 6px 16px;
    border-radius: 20px;
    font-size: 0.9rem;
    font-weight: 600;
    box-shadow: 0 4px 12px rgba(255, 107, 53, 0.3);
  }

  .rating-loading {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    padding: 12px;
    background: white;
    border-radius: 12px;
    border: 1px solid #e2e8f0;
    color: #64748b;
    font-size: 0.9rem;
  }

  .loading-spinner-tiny {
    width: 14px;
    height: 14px;
    border: 2px solid #f1f5f9;
    border-top: 2px solid var(--primary-color, #ff6b35);
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }

  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }

  .rating-disabled {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 16px;
    background: linear-gradient(135deg, #f0fdf4, #dcfce7);
    border: 2px solid #bbf7d0;
    border-radius: 12px;
    color: #166534;
  }

  .disabled-icon {
    font-size: 1.5rem;
    flex-shrink: 0;
  }

  .disabled-content {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  .disabled-title {
    font-weight: 700;
    font-size: 0.95rem;
  }

  .disabled-subtitle {
    font-size: 0.85rem;
    opacity: 0.8;
  }

  .rating-help {
    text-align: center;
    margin-top: 8px;
  }

  .help-text {
    color: #64748b;
    font-size: 0.85rem;
    font-style: italic;
  }

  /* Responsive Design */
  @media (max-width: 768px) {
    .rating-system {
      padding: 16px;
    }

    .stars-interactive {
      gap: 6px;
    }

    .rating-star {
      padding: 10px;
      min-width: 50px;
    }

    .star-icon {
      font-size: 1.3rem;
    }

    .star-number {
      font-size: 0.7rem;
    }

    .rating-header {
      flex-direction: column;
      align-items: flex-start;
    }
  }

  @media (max-width: 480px) {
    .stars-interactive {
      gap: 4px;
      flex-wrap: wrap;
      justify-content: center;
    }

    .rating-star {
      padding: 8px;
      min-width: 45px;
    }

    .star-icon {
      font-size: 1.2rem;
    }

    .rating-title {
      font-size: 1rem;
    }
  }
</style>