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
</script>

<article 
  class="restaurant-card"
  class:hovered={isHovered}
  on:mouseenter={handleMouseEnter}
  on:mouseleave={handleMouseLeave}
  in:fly={{ y: 30, duration: 500, easing: quintOut }}
>
  <!-- Imagen del restaurante -->
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
        <div class="placeholder-icon">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 2L13.09 8.26L20 9L13.09 9.74L12 16L10.91 9.74L4 9L10.91 8.26L12 2Z" 
                  fill="currentColor" opacity="0.6"/>
            <path d="M3 20L4.545 16.82L8 18L4.545 19.18L3 16L1.455 19.18L-2 18L1.455 16.82L3 20Z" 
                  fill="currentColor" opacity="0.4"/>
          </svg>
        </div>
        <span class="placeholder-text">Sin imagen</span>
      </div>
    {/if}

    <!-- Badge de valoración -->
    {#if restaurant.analytics?.averageRating}
      <div class="rating-badge" in:scale={{ duration: 300, delay: 200 }}>
        <span class="rating-star">⭐</span>
        <span class="rating-value">{restaurant.analytics.averageRating.toFixed(1)}</span>
      </div>
    {/if}
  </div>

  <div class="restaurant-content">
    <!-- Header del restaurante -->
    <header class="restaurant-header">
      <div class="restaurant-title-section">
        <h3 class="restaurant-name">
          <a href="/{restaurant.username}" class="restaurant-link">
            {restaurant.name}
          </a>
        </h3>
        
        <div class="restaurant-badges">
          {#if restaurant.cuisineType?.[0]}
            <span class="cuisine-badge">
              <span class="badge-icon">🍽️</span>
              {restaurant.cuisineType[0]}
            </span>
          {/if}
          
          {#if restaurant.priceRange}
            <span 
              class="price-badge"
              style="color: {getPriceRangeColor(restaurant.priceRange)}"
            >
              <span class="badge-icon">💰</span>
              {getPriceRangeText(restaurant.priceRange)}
            </span>
          {/if}
        </div>
      </div>
    </header>

    <!-- Descripción -->
    {#if restaurant.description}
      <p class="restaurant-description">{restaurant.description}</p>
    {/if}

    <!-- Metadatos del restaurante -->
    <div class="restaurant-meta">
      <div class="rating-display">
        <div class="stars-container">
          {#each renderStars(restaurant.analytics?.averageRating || 0) as star}
            <span class="star" class:filled={star.filled}>
              {star.filled ? '⭐' : '☆'}
            </span>
          {/each}
        </div>
        
        <span class="rating-text">
          {restaurant.analytics?.averageRating?.toFixed(1) || 'N/A'}
        </span>
        
        <span class="reviews-count">
          ({restaurant.analytics?.reviewsCount || 0} reseñas)
        </span>
      </div>

      {#if restaurant.address}
        <div class="address-info">
          <span class="address-icon">📍</span>
          <span class="address-text">{restaurant.address}</span>
        </div>
      {/if}
    </div>

    <!-- Sistema de valoración y comentarios -->
    {#if storeInitialized}
      <div class="interaction-section">
        <!-- Sistema de valoración -->
        <RatingSystem 
          restaurantId={restaurant.id!}
          on:toast={handleToast}
        />

        <!-- Sistema de comentarios -->
        <CommentsSection 
          restaurantId={restaurant.id!}
          restaurantName={restaurant.name}
          commentsCount={restaurant.analytics?.commentsCount}
          on:toast={handleToast}
        />
      </div>
    {:else}
      <div class="interaction-loading">
        <div class="loading-spinner-small"></div>
        <span>Inicializando sistema de valoración...</span>
      </div>
    {/if}
  </div>

  <!-- Efecto de hover -->
  {#if isHovered}
    <div class="hover-overlay" in:fade={{ duration: 200 }}></div>
  {/if}
</article>

<style>
  .restaurant-card {
    background: white;
    border-radius: 20px;
    overflow: hidden;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
    border: 1px solid #e2e8f0;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    position: relative;
    height: fit-content;
  }

  .restaurant-card:hover {
    transform: translateY(-8px);
    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15);
    border-color: var(--primary-color, #ff6b35);
  }

  .restaurant-card.hovered {
    transform: translateY(-8px) scale(1.02);
  }

  .restaurant-image-container {
    position: relative;
    width: 100%;
    height: 240px;
    overflow: hidden;
    background: #f8fafc;
  }

  .restaurant-image {
    width: 100%;
    height: 100%;
    object-fit: cover;
    transition: all 0.5s ease;
    opacity: 0;
  }

  .restaurant-image.loaded {
    opacity: 1;
  }

  .restaurant-card:hover .restaurant-image {
    transform: scale(1.1);
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
    0% {
      background-position: 200% 0;
    }
    100% {
      background-position: -200% 0;
    }
  }

  .restaurant-placeholder {
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    background: linear-gradient(135deg, #f8fafc, #e2e8f0);
    color: #94a3b8;
  }

  .placeholder-icon {
    margin-bottom: 12px;
    opacity: 0.7;
  }

  .placeholder-text {
    font-size: 0.9rem;
    font-weight: 500;
  }

  .rating-badge {
    position: absolute;
    top: 16px;
    right: 16px;
    background: rgba(255, 255, 255, 0.95);
    backdrop-filter: blur(10px);
    padding: 8px 12px;
    border-radius: 20px;
    display: flex;
    align-items: center;
    gap: 4px;
    font-weight: 700;
    color: #0D1B2A;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    border: 1px solid rgba(255, 255, 255, 0.2);
  }

  .rating-star {
    font-size: 1rem;
  }

  .rating-value {
    font-size: 0.9rem;
  }

  .restaurant-content {
    padding: 24px;
  }

  .restaurant-header {
    margin-bottom: 16px;
  }

  .restaurant-title-section {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .restaurant-name {
    margin: 0;
    font-size: 1.5rem;
    font-weight: 700;
    line-height: 1.3;
  }

  .restaurant-link {
    color: #0D1B2A;
    text-decoration: none;
    transition: color 0.3s ease;
    position: relative;
  }

  .restaurant-link::after {
    content: '';
    position: absolute;
    bottom: -2px;
    left: 0;
    width: 0;
    height: 2px;
    background: var(--primary-color, #ff6b35);
    transition: width 0.3s ease;
  }

  .restaurant-link:hover {
    color: var(--primary-color, #ff6b35);
  }

  .restaurant-link:hover::after {
    width: 100%;
  }

  .restaurant-badges {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
  }

  .cuisine-badge,
  .price-badge {
    display: flex;
    align-items: center;
    gap: 4px;
    padding: 6px 12px;
    border-radius: 16px;
    font-size: 0.85rem;
    font-weight: 600;
    white-space: nowrap;
  }

  .cuisine-badge {
    background: linear-gradient(135deg, #f0fdf4, #dcfce7);
    color: #166534;
    border: 1px solid #bbf7d0;
  }

  .price-badge {
    background: linear-gradient(135deg, #fefce8, #fef3c7);
    border: 1px solid #fde047;
    font-weight: 700;
  }

  .badge-icon {
    font-size: 0.9rem;
  }

  .restaurant-description {
    color: #64748b;
    font-size: 1rem;
    line-height: 1.6;
    margin: 0 0 20px 0;
    display: -webkit-box;
    -webkit-line-clamp: 3;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }

  .restaurant-meta {
    margin-bottom: 24px;
    padding: 16px 0;
    border-top: 1px solid #f1f5f9;
    border-bottom: 1px solid #f1f5f9;
  }

  .rating-display {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 12px;
    flex-wrap: wrap;
  }

  .stars-container {
    display: flex;
    gap: 2px;
  }

  .star {
    font-size: 1.1rem;
    color: #e2e8f0;
    transition: all 0.2s ease;
  }

  .star.filled {
    color: #fbbf24;
    animation: starGlow 0.3s ease;
  }

  @keyframes starGlow {
    0% { transform: scale(1); }
    50% { transform: scale(1.2); }
    100% { transform: scale(1); }
  }

  .rating-text {
    font-weight: 700;
    color: #0D1B2A;
    font-size: 1.1rem;
  }

  .reviews-count {
    color: #64748b;
    font-size: 0.9rem;
  }

  .address-info {
    display: flex;
    align-items: center;
    gap: 8px;
    color: #64748b;
    font-size: 0.9rem;
  }

  .address-icon {
    font-size: 1rem;
  }

  .address-text {
    line-height: 1.4;
  }

  .interaction-section {
    display: flex;
    flex-direction: column;
    gap: 20px;
  }

  .interaction-loading {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 16px;
    background: #f8fafc;
    border-radius: 12px;
    color: #64748b;
    font-size: 0.9rem;
  }

  .loading-spinner-small {
    width: 16px;
    height: 16px;
    border: 2px solid #e2e8f0;
    border-top: 2px solid var(--primary-color, #ff6b35);
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }

  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }

  .hover-overlay {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(135deg, 
      rgba(255, 107, 53, 0.05), 
      rgba(13, 27, 42, 0.05));
    pointer-events: none;
    border-radius: 20px;
  }

  /* Responsive Design */
  @media (max-width: 768px) {
    .restaurant-content {
      padding: 20px;
    }

    .restaurant-name {
      font-size: 1.25rem;
    }

    .restaurant-image-container {
      height: 200px;
    }

    .rating-badge {
      top: 12px;
      right: 12px;
      padding: 6px 10px;
    }

    .restaurant-badges {
      flex-direction: column;
      align-items: flex-start;
    }
  }

  @media (max-width: 480px) {
    .restaurant-content {
      padding: 16px;
    }

    .restaurant-image-container {
      height: 180px;
    }

    .rating-display {
      flex-direction: column;
      align-items: flex-start;
      gap: 8px;
    }

    .interaction-section {
      gap: 16px;
    }
  }
</style>