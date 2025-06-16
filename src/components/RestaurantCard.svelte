<script lang="ts">
  //RestaurantCard.svelte
  import { createEventDispatcher } from 'svelte';
  import { fly, scale, fade } from 'svelte/transition';
  import { quintOut } from 'svelte/easing';
  import { openModal } from '../stores/modalStore.js';
  // Componentes
  import RatingSystem from './RatingSystem.svelte';
  import CommentsSection from './CommentsSection.svelte';
  
  import type { RestaurantSearchResult } from '../interfaces/restaurantRating';

  // Importar los estilos
  import './ RestaurantCard.css';
    import CommentsModal from './CommentsModal.svelte';
    import { canUserRate } from '../stores/ratingStore';

  // Props
  const { restaurant, storeInitialized } = $props<{ restaurant: RestaurantSearchResult; storeInitialized: boolean }>();

  // Dispatcher para toasts
  const dispatch = createEventDispatcher<{
    toast: { message: string; type: 'success' | 'error' | 'info' }
  }>();

  // Estado local
  let imageLoaded = $state(false);
  let imageError = $state(false);
  let isHovered = $state(false);
  let showMoreInfo = $state(false);
  let showCommentsModal = $state(false);

  // Función para formatear el tiempo
  function formatTimeAgo(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffInSeconds < 60) return 'hace unos segundos';
    if (diffInSeconds < 3600) return `hace ${Math.floor(diffInSeconds / 60)} minutos`;
    if (diffInSeconds < 86400) return `hace ${Math.floor(diffInSeconds / 3600)} horas`;
    if (diffInSeconds < 604800) return `hace ${Math.floor(diffInSeconds / 86400)} días`;
    
    return date.toLocaleDateString();
  }

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

  function toggleMoreInfo() {
    showMoreInfo = !showMoreInfo;
  }

  function showComments() {
    const isMobile = window.innerWidth < 768;
  openModal('comments', {
    restaurantId: restaurant.id,
    restaurantName: restaurant.name,
    commentsCount: restaurant.commentsCount,
    isMobile: isMobile
  });
}

  function closeCommentsModal() {
    showCommentsModal = false;
  }

  // Nueva función para navegar al restaurante
  function navigateToRestaurant(event: Event) {
    // Prevenir propagación si se hace click en elementos interactivos
    const target = event.target as HTMLElement;
    if (target.closest('button') || target.closest('a') || target.closest('.rating-system')) {
      return;
    }
    window.location.href = `/${restaurant.username}`;
  }
</script>

<article 
  class="restaurant-card"
  class:hovered={isHovered}
  onmouseenter={handleMouseEnter}
  onmouseleave={handleMouseLeave}
  in:fly={{ y: 20, duration: 400, easing: quintOut }}
>
  <!-- Imagen del restaurante con overlay de info -->
  <div class="restaurant-image-container" onclick={navigateToRestaurant}>
    {#if restaurant.image || restaurant.imageProfile}
      <img 
        src={restaurant.image || restaurant.imageProfile} 
        alt={restaurant.name}
        class="restaurant-image"
        class:loaded={imageLoaded}
        onload={handleImageLoad}
        onerror={handleImageError}
        loading="lazy"
      />
      {#if !imageLoaded && !imageError}
        <div class="image-skeleton"></div>
      {/if}
    {:else}
      <div class="restaurant-placeholder">
        <div class="placeholder-icon">🍽️</div>
      </div>
    {/if}

    <!-- Overlay con info esencial -->
    <div class="image-overlay">
      <!-- Rating badge compacto -->
      {#if restaurant.analytics?.averageRating}
        <div class="rating-badge-compact" in:scale={{ duration: 300, delay: 100 }}>
          <span class="rating-star">⭐</span>
          <span class="rating-value">{restaurant.analytics.averageRating.toFixed(1)}</span>
        </div>
      {/if}

      <!-- Price badge -->
      {#if restaurant.priceRange}
        <div 
          class="price-badge-compact"
          style="background-color: {getPriceRangeColor(restaurant.priceRange)}20; border-color: {getPriceRangeColor(restaurant.priceRange)}; color: {getPriceRangeColor(restaurant.priceRange)}"
        >
          {getPriceRangeText(restaurant.priceRange)}
        </div>
      {/if}

      <!-- Botón flotante "Ver restaurante" que aparece en hover -->
      {#if isHovered}
        <div class="view-restaurant-overlay" in:fade={{ duration: 200 }}>
          <button class="view-restaurant-btn-overlay">
            <span>Ver restaurante</span>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M7 17L17 7M17 7H7M17 7V17" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </button>
        </div>
      {/if}
    </div>
  </div>

  <div class="restaurant-content">
    <!-- Header compacto -->
    <header class="restaurant-header">
      <div class="title-row">
        <h3 class="restaurant-name">
          <a href="/{restaurant.username}" class="restaurant-link">
            {restaurant.name}
          </a>
        </h3>
       
        {#if storeInitialized && !canUserRate(restaurant.id) }
          <RatingSystem 
            restaurantId={restaurant.id!}
            on:toast={handleToast}
          />
        {/if}
      </div>

      <div class="meta-row">
        {#if restaurant.cuisineType?.[0]}
          <span class="cuisine-tag">🍽️ {restaurant.cuisineType[0]}</span>
        {/if}
      </div>
    </header>

    <!-- Descripción colapsable -->
    {#if restaurant.description}
      <p class="restaurant-description" class:expanded={showMoreInfo}>
        {restaurant.description}
      </p>
    {/if}

    <!-- Info expandible -->
    <div class="expanded-info" in:fly={{ y: -10, duration: 300 }}>
      {#if restaurant.address}
        <div class="info-item">
          <span class="info-icon">📍</span>
          <span class="info-text">{restaurant.address}</span>
        </div>
      {/if}
      
      <!-- Sección de interacción expandida -->
      {#if storeInitialized}
        <div class="interaction-section-expanded">
          {#if canUserRate(restaurant.id)}
            <RatingSystem 
              restaurantId={restaurant.id!}
              on:toast={handleToast}
            />
          {/if}
          <!-- Botón de comentarios -->
          <button 
            class="comments-button-mini"
            onclick={showComments}
            title="Ver comentarios"
          >
            <span class="comments-icon">💬</span>
            {#if restaurant.analytics?.commentsCount && restaurant.analytics.commentsCount > 0}
              <span class="comments-count-mini">{restaurant.analytics.commentsCount}</span>
            {/if}
          </button>
        </div>
      {:else}
        <div class="interaction-loading-mini">
          <div class="loading-spinner-mini"></div>
          <span>Cargando...</span>
        </div>
      {/if}
    </div>

    <!-- Botón principal "Ver restaurante" al final de la tarjeta -->
    <div class="card-actions">
      <a href="/{restaurant.username}" class="view-restaurant-btn">
        <span>Ver restaurante</span>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M7 17L17 7M17 7H7M17 7V17" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </a>
    </div>
  </div>

  <!-- Efecto de hover sutil -->
  {#if isHovered}
    <div class="hover-glow" in:fade={{ duration: 200 }}></div>
  {/if}
</article>

