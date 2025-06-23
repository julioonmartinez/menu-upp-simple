<!-- src/components/PopularRestaurants.svelte -->
<script lang="ts">
  import { onMount } from 'svelte';
  import { 
    restaurantFavoritesStore,
    popularRestaurants,
    favoritesLoading
  } from '../stores/restaurantFavoritesStore.ts';
  import { isAuthenticated } from '../stores/authStore.ts';
  import type { RestaurantRanking } from '../interfaces/restaurantRating.ts';


  // Propiedades del componente
  export let limit: number = 10;
  export let showAddToFavorites: boolean = true;
  export let layout: 'grid' | 'carousel' | 'list' = 'grid';
  export let title: string = 'Restaurantes Populares';
  export let subtitle: string = 'Los lugares más valorados por nuestros usuarios';

  // Estado local
  let isTogglingFavorite = false;
  let toggledRestaurants = new Set<string>();

  // Cargar restaurantes populares al montar
  onMount(async () => {
    await restaurantFavoritesStore.loadPopularRestaurants(limit);
  });

  // Función para alternar favorito
  async function handleToggleFavorite(restaurantId: string) {
    if (!$isAuthenticated || isTogglingFavorite || toggledRestaurants.has(restaurantId)) {
      return;
    }
    
    toggledRestaurants.add(restaurantId);
    isTogglingFavorite = true;
    
    try {
      const result = await restaurantFavoritesStore.toggleFavorite(restaurantId);
      
      if (result.success) {
        // Actualizar el estado visual temporalmente
        console.log(result.restaurant?.message);
      } else {
        console.error(result.error);
      }
    } finally {
      isTogglingFavorite = false;
      // Remover después de un delay para evitar clics múltiples
      setTimeout(() => {
        toggledRestaurants.delete(restaurantId);
        toggledRestaurants = toggledRestaurants;
      }, 1000);
    }
  }

  // Verificar si un restaurante está en favoritos
  function isRestaurantFavorited(restaurantId: string): boolean {
    return restaurantFavoritesStore.isRestaurantFavorited(restaurantId);
  }

  // Formatear contador de favoritos
  function formatFavoritesCount(count: number | undefined): string {
    if (!count) return '0';
    if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}k`;
    }
    return count.toString();
  }

  // Obtener color del rango de precio
  function getPriceRangeColor(priceRange: string | undefined): string {
    switch (priceRange) {
      case '$': return '#28a745'; // Verde
      case '$$': return '#ffc107'; // Amarillo
      case '$$$': return '#fd7e14'; // Naranja
      case '$$$$': return '#dc3545'; // Rojo
      default: return '#6c757d'; // Gris
    }
  }
</script>

<div class="popular-restaurants {layout}">
  <!-- Header -->
  <div class="header">
    <h2 class="title">{title}</h2>
    {#if subtitle}
      <p class="subtitle">{subtitle}</p>
    {/if}
  </div>

  <!-- Loading state -->
  {#if $favoritesLoading && $popularRestaurants.length === 0}
    <div class="loading-state">
      <div class="loading-spinner"></div>
      <p>Cargando restaurantes populares...</p>
    </div>
  {/if}

  <!-- Restaurantes populares -->
  {#if $popularRestaurants.length > 0}
    <div class="restaurants-container" class:grid={layout === 'grid'} class:carousel={layout === 'carousel'} class:list={layout === 'list'}>
      {#each $popularRestaurants as restaurant, index (restaurant.id)}
        <article class="restaurant-card" class:favorited={isRestaurantFavorited(restaurant.id!)}>
          <!-- Posición en ranking -->
          <div class="ranking-badge">
            <span class="position">#{ index + 1}</span>
          </div>

          <!-- Imagen del restaurante -->
          <div class="restaurant-image">
            {#if restaurant.image}
              <img src={restaurant.image} alt={restaurant.name} loading="lazy" />
            {:else}
              <div class="placeholder-image">
                <span class="placeholder-icon">🍽️</span>
              </div>
            {/if}

            <!-- Botón de favorito (solo si está autenticado) -->
            {#if showAddToFavorites && $isAuthenticated}
              <button
                class="favorite-btn"
                class:active={isRestaurantFavorited(restaurant.id!)}
                class:loading={toggledRestaurants.has(restaurant.id!)}
                on:click={() => handleToggleFavorite(restaurant.id!)}
                disabled={toggledRestaurants.has(restaurant.id!)}
                aria-label={isRestaurantFavorited(restaurant.id!) ? 'Quitar de favoritos' : 'Añadir a favoritos'}
              >
                {#if toggledRestaurants.has(restaurant.id!)}
                  <span class="spinner-sm"></span>
                {:else if isRestaurantFavorited(restaurant.id!)}
                  ❤️
                {:else}
                  🤍
                {/if}
              </button>
            {/if}
          </div>

          <!-- Información del restaurante -->
          <div class="restaurant-info">
            <header class="restaurant-header">
              <h3 class="restaurant-name">
                <a href={`/restaurants/${restaurant.id}`}>
                  {restaurant.name}
                </a>
              </h3>
              
              {#if restaurant.analytics?.averageRating}
                <div class="rating">
                  <span class="stars">
                    {#each Array(5) as _, i}
                      <span class="star" class:filled={i < Math.floor(restaurant.analytics.averageRating || 0)}>
                        ⭐
                      </span>
                    {/each}
                  </span>
                  <span class="rating-value">
                    {restaurant.analytics.averageRating.toFixed(1)}
                  </span>
                </div>
              {/if}
            </header>

            {#if restaurant.description}
              <p class="restaurant-description">
                {restaurant.description}
              </p>
            {/if}

            <!-- Metadata del restaurante -->
            <div class="restaurant-meta">
              {#if restaurant.cuisineType}
                <span class="meta-tag cuisine">
                  {restaurant.cuisineType}
                </span>
              {/if}

              {#if restaurant.priceRange}
                <span 
                  class="meta-tag price-range" 
                  style="border-color: {getPriceRangeColor(restaurant.priceRange)}; color: {getPriceRangeColor(restaurant.priceRange)}"
                >
                  {restaurant.priceRange}
                </span>
              {/if}

              {#if restaurant.analytics?.favoritesCount}
                <span class="meta-tag favorites">
                  ❤️ {formatFavoritesCount(restaurant.analytics.favoritesCount)}
                </span>
              {/if}

              {#if restaurant.analytics?.reviewsCount}
                <span class="meta-tag reviews">
                  💬 {restaurant.analytics.reviewsCount} reseñas
                </span>
              {/if}
            </div>

            <!-- Información de contacto -->
            {#if restaurant.address}
              <div class="contact-info">
                <span class="address">
                  📍 {restaurant.address}
                </span>
              </div>
            {/if}
          </div>

          <!-- Acciones del restaurante -->
          <div class="restaurant-actions">
            <a href={`/restaurants/${restaurant.id}`} class="btn btn-primary btn-sm">
              Ver detalles
            </a>
            
            {#if restaurant.phone}
              <a href={`tel:${restaurant.phone}`} class="btn btn-secondary btn-sm">
                Llamar
              </a>
            {/if}
          </div>
        </article>
      {/each}
    </div>

    <!-- Ver más restaurantes -->
    <div class="view-more">
      <a href="/restaurants?sort=popular" class="btn btn-outline">
        Ver todos los restaurantes populares
      </a>
    </div>
  {/if}

  <!-- Estado vacío -->
  {#if $popularRestaurants.length === 0 && !$favoritesLoading}
    <div class="empty-state">
      <div class="empty-icon">🔍</div>
      <h3>No hay restaurantes populares</h3>
      <p>Aún no tenemos suficientes datos para mostrar restaurantes populares.</p>
    </div>
  {/if}
</div>

<style>
  .popular-restaurants {
    width: 100%;
  }

  .header {
    margin-bottom: 1.5rem;
    text-align: center;
  }

  .title {
    font-size: 1.75rem;
    font-weight: 700;
    color: #333;
    margin: 0 0 0.5rem 0;
  }

  .subtitle {
    font-size: 1rem;
    color: #666;
    margin: 0;
  }

  /* Layouts */
  .restaurants-container.grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: 1.5rem;
  }

  .restaurants-container.carousel {
    display: flex;
    gap: 1rem;
    overflow-x: auto;
    padding-bottom: 1rem;
    scroll-snap-type: x mandatory;
  }

  .restaurants-container.carousel .restaurant-card {
    flex: 0 0 280px;
    scroll-snap-align: start;
  }

  .restaurants-container.list {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .restaurants-container.list .restaurant-card {
    display: flex;
    flex-direction: row;
    height: auto;
  }

  .restaurants-container.list .restaurant-image {
    width: 150px;
    height: 120px;
    flex-shrink: 0;
  }

  .restaurants-container.list .restaurant-info {
    flex: 1;
    padding: 1rem;
  }

  /* Restaurant Card */
  .restaurant-card {
    background: white;
    border-radius: 16px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    overflow: hidden;
    position: relative;
    transition: all 0.3s ease;
    border: 2px solid transparent;
  }

  .restaurant-card:hover {
    transform: translateY(-4px);
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
  }

  .restaurant-card.favorited {
    border-color: #dc3545;
  }

  .ranking-badge {
    position: absolute;
    top: 0.75rem;
    left: 0.75rem;
    z-index: 2;
  }

  .position {
    background: linear-gradient(135deg, #ffd700, #ffb347);
    color: #333;
    padding: 0.25rem 0.5rem;
    border-radius: 12px;
    font-weight: bold;
    font-size: 0.8rem;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
  }

  .restaurant-image {
    position: relative;
    height: 200px;
    background: #f8f9fa;
    overflow: hidden;
  }

  .restaurant-image img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    transition: transform 0.3s ease;
  }

  .restaurant-card:hover .restaurant-image img {
    transform: scale(1.05);
  }

  .placeholder-image {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 100%;
    background: linear-gradient(135deg, #f8f9fa, #e9ecef);
  }

  .placeholder-icon {
    font-size: 2.5rem;
    opacity: 0.6;
  }

  .favorite-btn {
    position: absolute;
    top: 0.75rem;
    right: 0.75rem;
    background: rgba(255, 255, 255, 0.95);
    backdrop-filter: blur(4px);
    border: none;
    border-radius: 50%;
    width: 36px;
    height: 36px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: all 0.2s ease;
    font-size: 1rem;
    z-index: 2;
  }

  .favorite-btn:hover {
    transform: scale(1.1);
    background: rgba(255, 255, 255, 1);
  }

  .favorite-btn.active {
    background: rgba(220, 53, 69, 0.1);
  }

  .favorite-btn.loading {
    cursor: not-allowed;
  }

  .spinner-sm {
    width: 12px;
    height: 12px;
    border: 2px solid #f3f3f3;
    border-top: 2px solid #007bff;
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }

  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }

  .restaurant-info {
    padding: 1.25rem;
    flex: 1;
  }

  .restaurant-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 0.75rem;
    gap: 1rem;
  }

  .restaurant-name {
    margin: 0;
    font-size: 1.1rem;
    font-weight: 600;
    flex: 1;
  }

  .restaurant-name a {
    color: #333;
    text-decoration: none;
    transition: color 0.2s ease;
  }

  .restaurant-name a:hover {
    color: #007bff;
  }

  .rating {
    display: flex;
    align-items: center;
    gap: 0.25rem;
    flex-shrink: 0;
  }

  .stars {
    display: flex;
    gap: 1px;
  }

  .star {
    font-size: 0.8rem;
    opacity: 0.3;
    transition: opacity 0.2s ease;
  }

  .star.filled {
    opacity: 1;
  }

  .rating-value {
    font-size: 0.85rem;
    font-weight: 600;
    color: #666;
  }

  .restaurant-description {
    margin: 0 0 1rem 0;
    color: #666;
    font-size: 0.9rem;
    line-height: 1.4;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }

  .restaurant-meta {
    display: flex;
    gap: 0.5rem;
    flex-wrap: wrap;
    margin-bottom: 1rem;
  }

  .meta-tag {
    padding: 0.25rem 0.5rem;
    border-radius: 8px;
    font-size: 0.75rem;
    font-weight: 500;
    border: 1px solid;
  }

  .meta-tag.cuisine {
    background: #e7f3ff;
    border-color: #0066cc;
    color: #0066cc;
  }

  .meta-tag.price-range {
    background: transparent;
  }

  .meta-tag.favorites {
    background: #fce4ec;
    border-color: #c2185b;
    color: #c2185b;
  }

  .meta-tag.reviews {
    background: #f3e5f5;
    border-color: #7b1fa2;
    color: #7b1fa2;
  }

  .contact-info {
    margin-bottom: 1rem;
  }

  .address {
    font-size: 0.85rem;
    color: #666;
  }

  .restaurant-actions {
    display: flex;
    gap: 0.5rem;
    padding: 0 1.25rem 1.25rem;
  }

  .btn {
    padding: 0.5rem 1rem;
    border-radius: 8px;
    font-size: 0.85rem;
    font-weight: 500;
    text-decoration: none;
    text-align: center;
    cursor: pointer;
    transition: all 0.2s ease;
    border: none;
    flex: 1;
  }

  .btn-sm {
    padding: 0.4rem 0.8rem;
    font-size: 0.8rem;
  }

  .btn-primary {
    background: #007bff;
    color: white;
  }

  .btn-primary:hover {
    background: #0056b3;
  }

  .btn-secondary {
    background: #6c757d;
    color: white;
  }

  .btn-secondary:hover {
    background: #545b62;
  }

  .btn-outline {
    background: transparent;
    color: #007bff;
    border: 2px solid #007bff;
  }

  .btn-outline:hover {
    background: #007bff;
    color: white;
  }

  .view-more {
    text-align: center;
    margin-top: 2rem;
  }

  /* Estados */
  .loading-state,
  .empty-state {
    text-align: center;
    padding: 3rem 1rem;
  }

  .loading-spinner {
    width: 40px;
    height: 40px;
    border: 4px solid #f3f3f3;
    border-top: 4px solid #007bff;
    border-radius: 50%;
    animation: spin 1s linear infinite;
    margin: 0 auto 1rem;
  }

  .empty-icon {
    font-size: 3rem;
    margin-bottom: 1rem;
    opacity: 0.6;
  }

  /* Responsive */
  @media (max-width: 768px) {
    .restaurants-container.grid {
      grid-template-columns: 1fr;
    }

    .restaurants-container.carousel {
      gap: 0.75rem;
    }

    .restaurants-container.carousel .restaurant-card {
      flex: 0 0 260px;
    }

    .restaurants-container.list .restaurant-card {
      flex-direction: column;
    }

    .restaurants-container.list .restaurant-image {
      width: 100%;
      height: 180px;
    }

    .restaurant-header {
      flex-direction: column;
      gap: 0.5rem;
    }

    .rating {
      align-self: flex-start;
    }

    .title {
      font-size: 1.5rem;
    }
  }
</style>