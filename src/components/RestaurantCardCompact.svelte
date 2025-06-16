<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { fly, scale, fade } from 'svelte/transition';
  import { quintOut } from 'svelte/easing';
  import { openModal } from '../stores/modalStore.js';
  import RatingSystem from './RatingSystem.svelte';
  import type { RestaurantSearchResult } from '../interfaces/restaurantRating.js';
  import { canUserRate } from '../stores/ratingStore.js';
import './RestaurantCardCompact.css';
  // Props
  const { restaurant, storeInitialized } = $props<{ 
    restaurant: RestaurantSearchResult; 
    storeInitialized: boolean 
  }>();

  // Dispatcher para toasts
  const dispatch = createEventDispatcher<{
    toast: { message: string; type: 'success' | 'error' | 'info' }
  }>();

  // Estado local
  let imageLoaded = $state(false);
  let imageError = $state(false);
  let isHovered = $state(false);
  let isLiked = $state(false); // Para el botón de like

  // Funciones de utilidad
  function renderStars(rating: number) {
    return Array.from({ length: 5 }, (_, i) => ({
      filled: i < Math.floor(rating),
      number: i + 1
    }));
  }

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

  function getPriceRangeText(priceRange: string): string {
    console.log('priceRange', priceRange)
    switch (priceRange) {
      case 'low': return '$';
      case 'medium': return '$$';
      case 'high': return '$$$';
      default: return '';
    }
  }

  function getPriceRangeColor(priceRange: string): string {
    switch (priceRange) {
      case 'low': return '#10b981';
      case 'medium': return '#f59e0b';
      case 'high': return '#ef4444';
      default: return '#6b7280';
    }
  }

  function handleToast(event: CustomEvent<{ message: string; type: 'success' | 'error' | 'info' }>) {
    dispatch('toast', event.detail);
  }

  function toggleLike(event: Event) {
    event.stopPropagation();
    event.preventDefault();
    isLiked = !isLiked;
    // Aquí podrías agregar la lógica para guardar el like
    dispatch('toast', { 
      message: isLiked ? 'Agregado a favoritos' : 'Removido de favoritos', 
      type: 'success' 
    });
  }

  function showComments(event: Event) {
    event.stopPropagation();
    event.preventDefault();
    const isMobile = window.innerWidth < 768;
    openModal('comments', {
      restaurantId: restaurant.id,
      restaurantName: restaurant.name,
      commentsCount: restaurant.commentsCount,
      isMobile: isMobile
    });
  }

  function navigateToRestaurant(event: Event) {
    // Prevenir propagación si se hace click en elementos interactivos
    const target = event.target as HTMLElement;
    if (target.closest('button') || target.closest('a') || target.closest('.rating-system')) {
      return;
    }
    window.location.href = `/${restaurant.username}`;
  }

  function truncateText(text: string, maxLength: number): string {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  }
</script>

<article 
  class="restaurant-card-compact"
  class:hovered={isHovered}
  onmouseenter={handleMouseEnter}
  onmouseleave={handleMouseLeave}
  onclick={navigateToRestaurant}
  in:fly={{ y: 20, duration: 400, easing: quintOut }}
>
  <!-- Imagen dominante con overlays -->
  <div class="image-section">
    {#if restaurant.image || restaurant.imageProfile}
      <img 
        src={restaurant.image || restaurant.imageProfile} 
        alt={restaurant.name}
        class="restaurant-image-dominant"
        class:loaded={imageLoaded}
        onload={handleImageLoad}
        onerror={handleImageError}
        loading="lazy"
      />
      {#if !imageLoaded && !imageError}
        <div class="image-skeleton-compact"></div>
      {/if}
    {:else}
      <div class="restaurant-placeholder-compact">
        <div class="placeholder-icon-large">🍽️</div>
      </div>
    {/if}

    <!-- Overlay superior con acciones -->
    <div class="top-overlay">
      <!-- Botón de like -->
      <button 
        class="like-button"
        class:liked={isLiked}
        onclick={toggleLike}
        title={isLiked ? 'Quitar de favoritos' : 'Agregar a favoritos'}
        in:scale={{ duration: 300, delay: 100 }}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" 
                stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </button>

      <!-- Rating compacto -->
      {#if restaurant.analytics?.averageRating}
        <div class="rating-overlay" in:scale={{ duration: 300, delay: 200 }}>
          <span class="rating-star-overlay">⭐</span>
          <span class="rating-value-overlay">{restaurant.analytics.averageRating.toFixed(1)}</span>
        </div>
      {/if}
    </div>

    <!-- Overlay inferior con precio -->
    {#if restaurant.priceRange && (restaurant.priceRange != '')}
      <div class="bottom-overlay">
        <div 
          class="price-tag-overlay"
          style="background-color: {getPriceRangeColor(restaurant.priceRange)}; color: white;"
        >
          {getPriceRangeText(restaurant.priceRange)}
        </div>
      </div>
    {/if}

    <!-- Gradiente sutil para mejor legibilidad -->
    <div class="image-gradient"></div>
  </div>

  <!-- Footer compacto con información esencial -->
  <div class="footer-section">
    <div class="restaurant-info">
      <h3 class="restaurant-name-compact">
        {truncateText(restaurant.name, 25)}
      </h3>
      
      <div class="meta-info">
        
          <div class="address-compact">
            <span class="address-icon">📍</span>
            {#if restaurant.address}
            <span class="address-text">{truncateText(restaurant.address, 30)}</span>
            {:else}
            <div class="address-text">Sin dirección registrada.</div> 
            {/if}
             
          </div>
       
         <div class="rating-section-compact">
            <RatingSystem 
              restaurantId={restaurant.id!}
              on:toast={handleToast}
            />
          </div>
        
      </div>
    </div>

    <!-- Acciones del footer -->
    <div class="footer-actions">
      {#if storeInitialized}
       
         
       
        
        <!-- Botón de comentarios compacto -->
        
          <button 
            class="comments-button-compact"
            onclick={showComments}
            title="Ver comentarios"
          >
            <span class="comments-icon-compact">💬</span>
            {#if restaurant.analytics.commentsCount && (restaurant.analytics.commentsCount != 0) }
              <span class="comments-count-compact">{restaurant.analytics.commentsCount}</span>
            {/if}
          </button>
        
      {:else}
        <div class="loading-compact">
          <div class="loading-spinner-compact"></div>
        </div>
      {/if}
    </div>
  </div>

  <!-- Efecto de hover -->
  {#if isHovered}
    <div class="hover-effect-compact" in:fade={{ duration: 200 }}></div>
  {/if}
</article>