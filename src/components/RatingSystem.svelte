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

  // Importar los estilos
  import './RatingSystem.css';

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