<!-- src/components/RestaurantFavorites.svelte -->
<script lang="ts">
  import { onMount } from 'svelte';
  import { 
    restaurantFavoritesStore,
    favorites,
    favoritesCount,
    favoritesLoading,
    favoritesError,
    hasFavorites,
    favoritesPagination
  } from '../../stores/restaurantFavoritesStore.ts';
  import { isAuthenticated } from '../../stores/authStore.ts';
//   import type { Restaurant } from '../../services/restaurantFavoritesService.ts';
import type { Restaurant } from '../../interfaces';

  // Propiedades del componente
  export let showPopular: boolean = false;
  export let limit: number = 20;
  export let showFilters: boolean = true;

  // Estado local del componente
  let searchQuery = '';
  let selectedCuisine = '';
  let selectedPriceRange = '';
  let isTogglingFavorite = false;

  // Cuisines disponibles para el filtro
  const cuisines = [
    'Italiana', 'Mexicana', 'China', 'Japonesa', 'Francesa', 
    'Española', 'India', 'Tailandesa', 'Americana', 'Vegetariana'
  ];

  // Rangos de precio disponibles
  const priceRanges = [
    { value: '$', label: 'Económico ($)' },
    { value: '$$', label: 'Moderado ($$)' },
    { value: '$$$', label: 'Caro ($$$)' },
    { value: '$$$$', label: 'Muy Caro ($$$$)' }
  ];

  // Favoritos filtrados
  $: filteredFavorites = $favorites.filter(restaurant => {
    // Filtro por búsqueda
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const matchesSearch = 
        restaurant.name?.toLowerCase().includes(query) ||
        restaurant.description?.toLowerCase().includes(query) ||
        restaurant.cuisineType?.[0]?.toLowerCase().includes(query);
      
      if (!matchesSearch) return false;
    }

    // Filtro por cocina
    if (selectedCuisine && restaurant.cuisineType?.[0] !== selectedCuisine) {
      return false;
    }

    // Filtro por rango de precio
    if (selectedPriceRange && restaurant.priceRange !== selectedPriceRange) {
      return false;
    }

    return true;
  });

  // Cargar favoritos al montar el componente
  onMount(async () => {
    if ($isAuthenticated) {
      await restaurantFavoritesStore.loadUserFavorites(limit);
      
      if (showPopular) {
        await restaurantFavoritesStore.loadPopularRestaurants(10);
      }
    }
  });

  // Función para alternar favorito
  async function handleToggleFavorite(restaurantId: string) {
    if (isTogglingFavorite) return;
    
    isTogglingFavorite = true;
    try {
      const result = await restaurantFavoritesStore.toggleFavorite(restaurantId);
      
      if (result.success) {
        // Mostrar notificación de éxito si tienes un sistema de notificaciones
        console.log(result.restaurant?.message);
      } else {
        // Mostrar error
        console.error(result.error);
      }
    } finally {
      isTogglingFavorite = false;
    }
  }

  // Función para cargar más favoritos
  async function loadMoreFavorites() {
    if ($favoritesPagination?.has_next) {
      await restaurantFavoritesStore.loadMoreFavorites();
    }
  }

  // Función para refrescar favoritos
  async function refreshFavorites() {
    await restaurantFavoritesStore.refreshFavorites();
  }

  // Limpiar filtros
  function clearFilters() {
    searchQuery = '';
    selectedCuisine = '';
    selectedPriceRange = '';
  }

  // Formatear fecha
  function formatDate(dateString: string | undefined): string {
    if (!dateString) return '';
    
    try {
      return new Date(dateString).toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch {
      return '';
    }
  }
</script>

<div class="restaurant-favorites">
  <!-- Header -->
  <div class="favorites-header">
    <div class="header-content">
      <h2 class="title">
        Mis Restaurantes Favoritos
        {#if $favoritesCount > 0}
          <span class="count">({$favoritesCount})</span>
        {/if}
      </h2>
      
      <div class="header-actions">
        <button 
          class="btn btn-secondary"
          on:click={refreshFavorites}
          disabled={$favoritesLoading}
        >
          {$favoritesLoading ? 'Cargando...' : 'Actualizar'}
        </button>
      </div>
    </div>

    <!-- Filtros -->
    {#if showFilters && $hasFavorites}
      <div class="filters">
        <!-- Búsqueda -->
        <div class="filter-group">
          <input
            type="text"
            placeholder="Buscar restaurantes..."
            bind:value={searchQuery}
            class="filter-input"
          />
        </div>

        <!-- Filtro por cocina -->
        <div class="filter-group">
          <select bind:value={selectedCuisine} class="filter-select">
            <option value="">Todas las cocinas</option>
            {#each cuisines as cuisine}
              <option value={cuisine}>{cuisine}</option>
            {/each}
          </select>
        </div>

        <!-- Filtro por precio -->
        <div class="filter-group">
          <select bind:value={selectedPriceRange} class="filter-select">
            <option value="">Todos los precios</option>
            {#each priceRanges as range}
              <option value={range.value}>{range.label}</option>
            {/each}
          </select>
        </div>

        <!-- Limpiar filtros -->
        {#if searchQuery || selectedCuisine || selectedPriceRange}
          <button class="btn btn-text" on:click={clearFilters}>
            Limpiar filtros
          </button>
        {/if}
      </div>
    {/if}
  </div>

  <!-- Error -->
  {#if $favoritesError}
    <div class="error-message">
      <p>{$favoritesError}</p>
      <button class="btn btn-primary" on:click={refreshFavorites}>
        Reintentar
      </button>
    </div>
  {/if}

  <!-- Loading inicial -->
  {#if $favoritesLoading && $favorites.length === 0}
    <div class="loading-state">
      <div class="loading-spinner"></div>
      <p>Cargando tus restaurantes favoritos...</p>
    </div>
  {/if}

  <!-- Lista de favoritos -->
  {#if $hasFavorites && !$favoritesLoading}
    <div class="favorites-grid">
      {#each filteredFavorites as restaurant (restaurant.id)}
        <div class="restaurant-card">
          <!-- Imagen del restaurante -->
          <div class="restaurant-image">
            {#if restaurant.image}
              <img src={restaurant.image} alt={restaurant.name} />
            {:else}
              <div class="placeholder-image">
                <span>🍽️</span>
              </div>
            {/if}
            
            <!-- Botón de favorito -->
            <button
              class="favorite-btn active"
              on:click={() => handleToggleFavorite(restaurant.id!)}
              disabled={isTogglingFavorite}
              aria-label="Quitar de favoritos"
            >
              ❤️
            </button>
          </div>

          <!-- Información del restaurante -->
          <div class="restaurant-info">
            <h3 class="restaurant-name">
              <a href={`/restaurants/${restaurant.id}`}>
                {restaurant.name}
              </a>
            </h3>

            {#if restaurant.description}
              <p class="restaurant-description">
                {restaurant.description}
              </p>
            {/if}

            <div class="restaurant-meta">
              {#if restaurant.cuisineType}
                <span class="cuisine-tag">{restaurant.cuisineType[0]}</span>
              {/if}
              
              {#if restaurant.priceRange}
                <span class="price-range">{restaurant.priceRange}</span>
              {/if}

              {#if restaurant.analytics?.favoritesCount}
                <span class="favorites-count">
                  ❤️ {restaurant.analytics.favoritesCount}
                </span>
              {/if}
            </div>

            {#if restaurant.createdAt}
              <p class="favorited-date">
                Agregado el {restaurant.createdAt}
              </p>
            {/if}
          </div>
        </div>
      {/each}
    </div>

    <!-- Mensaje de filtros sin resultados -->
    {#if filteredFavorites.length === 0 && (searchQuery || selectedCuisine || selectedPriceRange)}
      <div class="no-results">
        <p>No se encontraron restaurantes con los filtros seleccionados.</p>
        <button class="btn btn-secondary" on:click={clearFilters}>
          Limpiar filtros
        </button>
      </div>
    {/if}

    <!-- Botón cargar más -->
    {#if $favoritesPagination?.has_next}
      <div class="load-more">
        <button 
          class="btn btn-secondary"
          on:click={loadMoreFavorites}
          disabled={$favoritesLoading}
        >
          {$favoritesLoading ? 'Cargando...' : 'Cargar más favoritos'}
        </button>
      </div>
    {/if}
  {/if}

  <!-- Estado vacío -->
  {#if !$hasFavorites && !$favoritesLoading && !$favoritesError}
    <div class="empty-state">
      <div class="empty-icon">💔</div>
      <h3>No tienes restaurantes favoritos</h3>
      <p>Comienza explorando restaurantes y añádelos a tus favoritos.</p>
      <a href="/restaurants" class="btn btn-primary">
        Explorar restaurantes
      </a>
    </div>
  {/if}
</div>

<style>
  .restaurant-favorites {
    max-width: 1200px;
    margin: 0 auto;
    padding: 1rem;
  }

  .favorites-header {
    margin-bottom: 2rem;
  }

  .header-content {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1rem;
  }

  .title {
    font-size: 2rem;
    font-weight: bold;
    color: #333;
    margin: 0;
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .count {
    font-size: 1.5rem;
    color: #666;
    font-weight: normal;
  }

  .filters {
    display: flex;
    gap: 1rem;
    flex-wrap: wrap;
    align-items: center;
    padding: 1rem;
    background: #f8f9fa;
    border-radius: 8px;
  }

  .filter-group {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }

  .filter-input,
  .filter-select {
    padding: 0.5rem;
    border: 1px solid #ddd;
    border-radius: 4px;
    font-size: 0.9rem;
    min-width: 200px;
  }

  .favorites-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
    gap: 1.5rem;
    margin-bottom: 2rem;
  }

  .restaurant-card {
    background: white;
    border-radius: 12px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    overflow: hidden;
    transition: transform 0.2s, box-shadow 0.2s;
  }

  .restaurant-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
  }

  .restaurant-image {
    position: relative;
    height: 200px;
    background: #f0f0f0;
  }

  .restaurant-image img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .placeholder-image {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 100%;
    font-size: 3rem;
    color: #999;
  }

  .favorite-btn {
    position: absolute;
    top: 0.5rem;
    right: 0.5rem;
    background: rgba(255, 255, 255, 0.9);
    border: none;
    border-radius: 50%;
    width: 40px;
    height: 40px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: transform 0.2s;
    font-size: 1.2rem;
  }

  .favorite-btn:hover {
    transform: scale(1.1);
  }

  .favorite-btn.active {
    background: rgba(220, 38, 127, 0.1);
  }

  .restaurant-info {
    padding: 1rem;
  }

  .restaurant-name {
    margin: 0 0 0.5rem 0;
    font-size: 1.25rem;
    font-weight: bold;
  }

  .restaurant-name a {
    color: #333;
    text-decoration: none;
  }

  .restaurant-name a:hover {
    color: #007bff;
  }

  .restaurant-description {
    margin: 0 0 1rem 0;
    color: #666;
    font-size: 0.9rem;
    line-height: 1.4;
  }

  .restaurant-meta {
    display: flex;
    gap: 0.5rem;
    flex-wrap: wrap;
    margin-bottom: 0.5rem;
  }

  .cuisine-tag,
  .price-range,
  .favorites-count {
    padding: 0.25rem 0.5rem;
    background: #e9ecef;
    border-radius: 12px;
    font-size: 0.8rem;
    color: #495057;
  }

  .cuisine-tag {
    background: #e7f3ff;
    color: #0066cc;
  }

  .price-range {
    background: #fff3cd;
    color: #856404;
  }

  .favorites-count {
    background: #fce4ec;
    color: #c2185b;
  }

  .favorited-date {
    margin: 0;
    font-size: 0.8rem;
    color: #999;
  }

  .btn {
    padding: 0.5rem 1rem;
    border-radius: 6px;
    font-size: 0.9rem;
    cursor: pointer;
    text-decoration: none;
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    transition: all 0.2s;
    border: none;
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

  .btn-text {
    background: transparent;
    color: #007bff;
    text-decoration: underline;
  }

  .btn:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .loading-state,
  .empty-state,
  .error-message,
  .no-results {
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

  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }

  .empty-icon {
    font-size: 4rem;
    margin-bottom: 1rem;
  }

  .error-message {
    background: #f8d7da;
    color: #721c24;
    border-radius: 8px;
  }

  .load-more {
    text-align: center;
    margin-top: 2rem;
  }

  /* Responsive */
  @media (max-width: 768px) {
    .header-content {
      flex-direction: column;
      gap: 1rem;
      align-items: stretch;
    }

    .filters {
      flex-direction: column;
      align-items: stretch;
    }

    .filter-input,
    .filter-select {
      min-width: auto;
    }

    .favorites-grid {
      grid-template-columns: 1fr;
    }

    .title {
      font-size: 1.5rem;
      text-align: center;
    }
  }
</style>