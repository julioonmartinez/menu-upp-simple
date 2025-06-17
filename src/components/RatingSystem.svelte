<script lang="ts">
  //RatingSystem
  import { createEventDispatcher } from 'svelte';
  import { scale, fade } from 'svelte/transition';
  import { quintOut, backOut } from 'svelte/easing';
  
  import { 
    isRatingInProgress, 
    rateRestaurantAnonymously, 
    canUserRate, 
    getUserRatingForRestaurant 
  } from '../stores/ratingStore';
  import './RatingSystem.css'

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
  let isMobile = $state(false);

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

    selectedRating = star;
    // Envío directo sin confirmación
    submitRating();
  }

  async function submitRating() {
    if (selectedRating === 0 || isRating) return;

    try {
      const success = await rateRestaurantAnonymously(restaurantId, selectedRating);
      
      if (success) {
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
    }
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

      <!-- Loading state compacto -->
      {#if isRating}
        <div class="rating-loading-compact" in:fade={{ duration: 200 }}>
          <div class="loading-spinner-compact"></div>
        </div>
      {/if}
    </div>
  {/if}
</div>
