<script lang="ts">
  //DishCard.svelte - Componente simple para platillos
  import { createEventDispatcher } from 'svelte';
  import { fly, scale, fade } from 'svelte/transition';
  import { quintOut } from 'svelte/easing';
  import './DishCard.css'
  // Componentes
  import RatingSystem from './RatingSystem.svelte';
  
  import type { DishRanking, DishRating, DishWithRatings } from '../interfaces/dishRating';

  // Props
  const { dish, storeInitialized, isTopDish = false, position } = $props<{ 
    dish: DishWithRatings | DishRanking ; 
    storeInitialized: boolean;
    isTopDish?: boolean;
    position?: number;
  }>();

  // Dispatcher para toasts
  const dispatch = createEventDispatcher<{
    toast: { message: string; type: 'success' | 'error' | 'info' }
  }>();

  // Estado local
  let imageLoaded = $state(false);
  let imageError = $state(false);
  let isHovered = $state(false);

  function handleImageLoad() {
    imageLoaded = true;
  }

  function handleImageError() {
    imageError = true;
  }

  function handleMouseEnter() {
    isHovered = true;
  }

  function handleMouseLeave() {
    isHovered = false;
  }

  function renderStars(rating: number) {
    return Array.from({ length: 5 }, (_, i) => ({
      filled: i < Math.floor(rating),
      number: i + 1
    }));
  }

  function formatPrice(price: number): string {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN'
    }).format(price);
  }

  function handleToast(event: CustomEvent<{ message: string; type: 'success' | 'error' | 'info' }>) {
    dispatch('toast', event.detail);
  }

  // Obtener datos del ranking si es un top dish
  const dishData = $derived(() => {
    if (isTopDish && dish.dish) {
      return dish.dish;
    }
    return dish;
  });

  const dishRating = $derived(() => {
    if (isTopDish && dish.rating) {
      return dish.rating;
    }
    return dishData().rating || 0;
  });

  const dishReviewsCount = $derived(() => {
    if (isTopDish && (dish.totalRatings || dish.total_ratings)) {
      return dish.totalRatings || dish.total_ratings;
    }
    return dishData().reviewsCount || dishData().analytics?.totalRatings || 0;
  });
</script>

<article 
  class="dish-card"
  class:hovered={isHovered}
  class:top-dish={isTopDish}
  onmouseenter={handleMouseEnter}
  onmouseleave={handleMouseLeave}
  in:fly={{ y: 20, duration: 400, easing: quintOut }}
>
  <!-- Badge de posición para top dishes -->
  {#if isTopDish && position}
    <div class="position-badge">#{position}</div>
  {/if}

  <!-- Imagen del platillo -->
  <div class="dish-image-container">
    {#if dishData().image}
      <img 
        src={dishData().image} 
        alt={dishData().name}
        class="dish-image"
        class:loaded={imageLoaded}
        onload={handleImageLoad}
        onerror={handleImageError}
        loading="lazy"
      />
      {#if !imageLoaded && !imageError}
        <div class="image-skeleton"></div>
      {/if}
    {:else}
      <div class="dish-placeholder">
        <div class="placeholder-icon">🍽️</div>
      </div>
    {/if}

    <!-- Overlay con estado de stock -->
    {#if dishData().inStock === false}
      <div class="stock-overlay">
        <span class="stock-badge">Agotado</span>
      </div>
    {/if}
  </div>

  <div class="dish-content">
    <!-- Header del platillo -->
    <header class="dish-header">
      <h3 class="dish-name">{dishData.name}</h3>
      <div class="dish-price">{formatPrice(dishData().price)}</div>
    </header>

    <!-- Descripción -->
    {#if dishData().description}
      <p class="dish-description">{dishData().description}</p>
    {/if}

    <!-- Metadatos -->
    <div class="dish-meta">
      <!-- Rating display -->
      {#if dishRating() > 0}
        <div class="rating-display">
          <div class="stars-row">
            {#each renderStars(dishRating()) as star}
              <span class="star" class:filled={star.filled}>⭐</span>
            {/each}
          </div>
          <span class="rating-value">{dishRating().toFixed(1)}</span>
          <span class="reviews-count">({dishReviewsCount})</span>
        </div>
      {/if}

      <!-- Badges adicionales -->
      <div class="dish-badges">
        {#if dishData().categoryId}
          <span class="category-badge">Cat: {dishData().categoryId}</span>
        {/if}
        {#if dishData().favorites && dishData().favorites > 0}
          <span class="favorites-badge">❤️ {dishData().favorites}</span>
        {/if}
      </div>
    </div>

    <!-- Sistema de valoración -->
    {#if storeInitialized && dishData().id}
      <div class="rating-section">
        <RatingSystem 
          restaurantId={dishData().id}
          on:toast={handleToast}
        />
      </div>
    {:else}
      <div class="rating-section">
        <div class="rating-initializing">
          <div class="loading-spinner-small"></div>
          <span>Cargando valoración...</span>
        </div>
      </div>
    {/if}
  </div>

  <!-- Efecto de hover -->
  {#if isHovered}
    <div class="hover-glow" in:fade={{ duration: 200 }}></div>
  {/if}
</article>
