<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { fly, scale, fade } from 'svelte/transition';
  import { quintOut } from 'svelte/easing';
  
  // Componentes
  import RatingSystem from './RatingSystem.svelte';
  import CommentsSection from './CommentsSection.svelte';
  
 import type { RestaurantSearchResult } from '../interfaces/restaurantRating';

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
</script>

<article 
  class="restaurant-card"
  class:hovered={isHovered}
  on:mouseenter={handleMouseEnter}
  on:mouseleave={handleMouseLeave}
  in:fly={{ y: 20, duration: 400, easing: quintOut }}
>
  <!-- Imagen del restaurante con overlay de info -->
  <div class="restaurant-image-container">
    {#if restaurant.image || restaurant.imageProfile}
      <img 
        src={restaurant.image || restaurant.imageProfile} 
        alt={restaurant.name}
        class="restaurant-image"
        class:loaded={imageLoaded}
        on:load={handleImageLoad}
        on:error={handleImageError}
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
        
        <button 
          class="expand-btn"
          class:expanded={showMoreInfo}
          on:click={toggleMoreInfo}
          title={showMoreInfo ? 'Ocultar detalles' : 'Ver más detalles'}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M6 9L12 15L18 9" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </button>
      </div>

      <div class="meta-row">
        {#if restaurant.cuisineType?.[0]}
          <span class="cuisine-tag">🍽️ {restaurant.cuisineType[0]}</span>
        {/if}
        
        <div class="rating-compact">
          <div class="stars-mini">
            {#each renderStars(restaurant.analytics?.averageRating || 0) as star}
              <span class="star-mini" class:filled={star.filled}>
                {star.filled ? '⭐' : '☆'}
              </span>
            {/each}
          </div>
          <span class="reviews-count-mini">
            ({restaurant.analytics?.reviewsCount || 0})
          </span>
        </div>
      </div>
    </header>

    <!-- Descripción colapsable -->
    {#if restaurant.description}
      <p class="restaurant-description" class:expanded={showMoreInfo}>
        {restaurant.description}
      </p>
    {/if}

    <!-- Info expandible -->
    {#if showMoreInfo}
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
            <RatingSystem 
              restaurantId={restaurant.id!}
              on:toast={handleToast}
            />
            <CommentsSection 
              restaurantId={restaurant.id!}
              restaurantName={restaurant.name}
              commentsCount={restaurant.analytics?.commentsCount}
              on:toast={handleToast}
            />
          </div>
        {:else}
          <div class="interaction-loading-mini">
            <div class="loading-spinner-mini"></div>
            <span>Cargando...</span>
          </div>
        {/if}
      </div>
    {:else}
      <!-- Versión compacta de interacción -->
      {#if storeInitialized}
        <div class="interaction-section-compact">
          <RatingSystem 
            restaurantId={restaurant.id!}
            on:toast={handleToast}
          />
        </div>
      {:else}
        <div class="interaction-loading-mini">
          <div class="loading-spinner-mini"></div>
          <span>Cargando...</span>
        </div>
      {/if}
    {/if}
  </div>

  <!-- Efecto de hover sutil -->
  {#if isHovered}
    <div class="hover-glow" in:fade={{ duration: 200 }}></div>
  {/if}
</article>

<style>
  .restaurant-card {
    background: white;
    border-radius: 16px;
    overflow: hidden;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
    border: 1px solid #f1f5f9;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    position: relative;
    height: fit-content;
  }

  .restaurant-card:hover {
    transform: translateY(-4px);
    box-shadow: 0 8px 25px rgba(0, 0, 0, 0.12);
    border-color: var(--primary-color, #ff6b35);
  }

  /* Imagen más compacta */
  .restaurant-image-container {
    position: relative;
    width: 100%;
    height: 160px; /* Reducido de 240px */
    overflow: hidden;
    background: #f8fafc;
  }

  .restaurant-image {
    width: 100%;
    height: 100%;
    object-fit: cover;
    transition: all 0.4s ease;
    opacity: 0;
  }

  .restaurant-image.loaded {
    opacity: 1;
  }

  .restaurant-card:hover .restaurant-image {
    transform: scale(1.05); /* Reducido el scale */
  }

  .image-skeleton {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: linear-gradient(90deg, #f0f2f5 25%, #e4e6ea 50%, #f0f2f5 75%);
    background-size: 200% 100%;
    animation: loading 1.5s infinite;
  }

  @keyframes loading {
    0% { background-position: 200% 0; }
    100% { background-position: -200% 0; }
  }

  .restaurant-placeholder {
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    background: linear-gradient(135deg, #f8fafc, #e2e8f0);
    color: #94a3b8;
    font-size: 2rem;
  }

  /* Overlay mejorado y compacto */
  .image-overlay {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(to bottom, rgba(0,0,0,0.1) 0%, transparent 50%);
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    padding: 12px;
    pointer-events: none;
  }

  .rating-badge-compact {
    background: rgba(255, 255, 255, 0.95);
    backdrop-filter: blur(8px);
    padding: 4px 8px;
    border-radius: 12px;
    display: flex;
    align-items: center;
    gap: 2px;
    font-weight: 700;
    font-size: 0.8rem;
    color: #0D1B2A;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  }

  .price-badge-compact {
    padding: 4px 8px;
    border-radius: 12px;
    font-weight: 700;
    font-size: 0.8rem;
    border: 1px solid;
    backdrop-filter: blur(8px);
  }

  /* Contenido más compacto */
  .restaurant-content {
    padding: 16px; /* Reducido de 24px */
  }

  .restaurant-header {
    margin-bottom: 12px; /* Reducido de 16px */
  }

  .title-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 8px;
  }

  .restaurant-name {
    margin: 0;
    font-size: 1.25rem; /* Reducido de 1.5rem */
    font-weight: 700;
    line-height: 1.3;
    flex: 1;
  }

  .restaurant-link {
    color: #0D1B2A;
    text-decoration: none;
    transition: color 0.3s ease;
  }

  .restaurant-link:hover {
    color: var(--primary-color, #ff6b35);
  }

  .expand-btn {
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    width: 32px;
    height: 32px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: all 0.3s ease;
    flex-shrink: 0;
    margin-left: 12px;
  }

  .expand-btn:hover {
    background: var(--primary-color, #ff6b35);
    color: white;
    border-color: var(--primary-color, #ff6b35);
  }

  .expand-btn.expanded {
    background: var(--primary-color, #ff6b35);
    color: white;
    border-color: var(--primary-color, #ff6b35);
  }

  .expand-btn.expanded svg {
    transform: rotate(180deg);
  }

  .meta-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
  }

  .cuisine-tag {
    background: linear-gradient(135deg, #f0fdf4, #dcfce7);
    color: #166534;
    border: 1px solid #bbf7d0;
    padding: 4px 8px;
    border-radius: 12px;
    font-size: 0.75rem;
    font-weight: 600;
    flex-shrink: 0;
  }

  .rating-compact {
    display: flex;
    align-items: center;
    gap: 6px;
  }

  .stars-mini {
    display: flex;
    gap: 1px;
  }

  .star-mini {
    font-size: 0.75rem;
    color: #e2e8f0;
  }

  .star-mini.filled {
    color: #fbbf24;
  }

  .reviews-count-mini {
    color: #64748b;
    font-size: 0.75rem;
    font-weight: 500;
  }

  /* Descripción compacta */
  .restaurant-description {
    color: #64748b;
    font-size: 0.9rem; /* Reducido de 1rem */
    line-height: 1.5;
    margin: 0 0 12px 0;
    display: -webkit-box;
    -webkit-line-clamp: 2; /* Reducido de 3 */
    -webkit-box-orient: vertical;
    overflow: hidden;
    transition: all 0.3s ease;
  }

  .restaurant-description.expanded {
    -webkit-line-clamp: unset;
    max-height: none;
  }

  /* Info expandible */
  .expanded-info {
    border-top: 1px solid #f1f5f9;
    padding-top: 12px;
    margin-top: 12px;
  }

  .info-item {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 8px;
    font-size: 0.85rem;
    color: #64748b;
  }

  .info-icon {
    font-size: 1rem;
  }

  .info-text {
    line-height: 1.4;
  }

  /* Secciones de interacción */
  .interaction-section-compact {
    margin-top: 12px;
    padding-top: 12px;
    border-top: 1px solid #f1f5f9;
  }

  .interaction-section-expanded {
    margin-top: 16px;
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  .interaction-loading-mini {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px 12px;
    background: #f8fafc;
    border-radius: 8px;
    color: #64748b;
    font-size: 0.8rem;
    margin-top: 8px;
  }

  .loading-spinner-mini {
    width: 12px;
    height: 12px;
    border: 2px solid #e2e8f0;
    border-top: 2px solid var(--primary-color, #ff6b35);
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }

  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }

  .hover-glow {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(135deg, 
      rgba(255, 107, 53, 0.03), 
      rgba(13, 27, 42, 0.03));
    pointer-events: none;
    border-radius: 16px;
  }

  /* Responsive optimizado para móvil */
  @media (max-width: 768px) {
    .restaurant-content {
      padding: 14px; /* Más compacto en móvil */
    }

    .restaurant-name {
      font-size: 1.1rem;
    }

    .restaurant-image-container {
      height: 140px; /* Aún más compacto en móvil */
    }

    .meta-row {
      flex-direction: column;
      align-items: flex-start;
      gap: 8px;
    }

    .title-row {
      align-items: flex-start;
    }

    .expand-btn {
      width: 28px;
      height: 28px;
      margin-left: 8px;
    }
  }

  @media (max-width: 480px) {
    .restaurant-content {
      padding: 12px;
    }

    .restaurant-image-container {
      height: 120px; /* Súper compacto en móviles pequeños */
    }

    .image-overlay {
      padding: 8px;
    }

    .rating-badge-compact,
    .price-badge-compact {
      padding: 3px 6px;
      font-size: 0.7rem;
    }
  }
</style>