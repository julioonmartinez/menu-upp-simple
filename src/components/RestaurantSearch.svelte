<script lang="ts">
  import { onMount } from 'svelte';
  
  // Importar el store y funciones del servicio API
  import { 
    ratingStore, 
    searchStore, 
    deviceId,
    isSearching,
    searchResults,
    hasSearchResults,
    isInitialized,
    rateRestaurantAnonymously,
    canUserRate,
    getUserRatingForRestaurant
  } from '../stores/ratingStore';
  
  import { searchRestaurants } from '../services/apiRatingService';
  
  import type { 
    RestaurantSearchFilters
  } from '../interfaces/restaurantRating';

  // Detección de browser para Astro
  const isBrowser = typeof window !== 'undefined';

  // Estado del formulario
  let searchForm = $state({
    search: '',
    minRating: '',
    maxRating: '',
    cuisineType: '',
    priceRange: '',
    sortBy: 'rating',
    sortOrder: -1
  });

  // Valores derivados usando los stores
  let loading = $derived($isSearching);
  let results = $derived($searchResults);
  let hasResults = $derived($hasSearchResults);
  let isEmpty = $derived(!results && !$searchStore.error && !loading);
  let error = $derived($searchStore.error);
  let storeInitialized = $derived($isInitialized);

  // Inicializar desde URL params y store
  onMount(() => {
    if (isBrowser) {
      // Inicializar el store primero
      ratingStore.init();
      
      // Luego inicializar desde URL
      initializeFromUrl();
    }
  });

  function initializeFromUrl() {
    if (!isBrowser) return;
    
    const urlParams = new URLSearchParams(window.location.search);
    
    searchForm.search = urlParams.get('search') || '';
    searchForm.minRating = urlParams.get('minRating') || '';
    searchForm.maxRating = urlParams.get('maxRating') || '';
    searchForm.cuisineType = urlParams.get('cuisineType') || '';
    searchForm.priceRange = urlParams.get('priceRange') || '';
    searchForm.sortBy = urlParams.get('sortBy') || 'rating';
    searchForm.sortOrder = parseInt(urlParams.get('sortOrder') || '-1');

    // Si hay parámetros, ejecutar búsqueda automáticamente
    if (urlParams.has('search') || urlParams.has('minRating')) {
      // Esperar a que el store esté inicializado
      setTimeout(() => handleSearch(), 100);
    }
  }

  async function handleSearch(pageNum: number = 1) {
    if (loading || !isBrowser) return;
    
    try {
      const filters: RestaurantSearchFilters = {};
      
      if (searchForm.search.trim()) filters.search = searchForm.search.trim();
      if (searchForm.minRating) filters.minRating = parseFloat(searchForm.minRating);
      if (searchForm.maxRating) filters.maxRating = parseFloat(searchForm.maxRating);
      if (searchForm.cuisineType) filters.cuisineType = searchForm.cuisineType;
      if (searchForm.priceRange) filters.priceRange = searchForm.priceRange;
      if (searchForm.sortBy) filters.sortBy = searchForm.sortBy;
      filters.sortOrder = searchForm.sortOrder;

      console.log('🔍 Ejecutando búsqueda:', filters);
      
      // Usar el store para manejar el estado
      searchStore.startSearch(filters, pageNum);
      
      const results = await searchRestaurants(filters, pageNum, 20);
      searchStore.completeSearch(results);
      
      // Actualizar URL sin recargar
      updateUrl(filters, pageNum);
      
    } catch (err) {
      console.error('Error en búsqueda:', err);
      const errorMessage = err instanceof Error ? err.message : 'Error en la búsqueda';
      searchStore.failSearch(errorMessage);
    }
  }

  function updateUrl(filters: RestaurantSearchFilters, page: number = 1) {
    if (!isBrowser) return;
    
    const params = new URLSearchParams();
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== '') {
        params.set(key, value.toString());
      }
    });
    
    if (page > 1) {
      params.set('page', page.toString());
    }
    
    const newUrl = `${window.location.pathname}${params.toString() ? '?' + params.toString() : ''}`;
    window.history.pushState({}, '', newUrl);
  }

  async function handleSubmit(event: Event) {
    event.preventDefault();
    await handleSearch(1);
  }

  async function loadPage(page: number) {
    await handleSearch(page);
  }

  // Sistema de valoración anónima usando el store
  async function rateRestaurant(restaurantId: string, rating: number) {
    if (!storeInitialized) {
      alert('Sistema de valoración no inicializado. Inténtalo de nuevo.');
      return;
    }

    if (!canUserRate(restaurantId)) {
      alert('Ya has valorado este restaurante');
      return;
    }

    const success = await rateRestaurantAnonymously(restaurantId, rating);
    
    if (success) {
      alert('¡Valoración enviada correctamente!');
    } else {
      // El error ya se maneja en el store
      const storeError = $ratingStore.lastError;
      alert(storeError || 'Error al enviar la valoración. Inténtalo de nuevo.');
    }
  }

  function renderStars(rating: number) {
    return Array.from({ length: 5 }, (_, i) => ({
      filled: i < Math.floor(rating),
      number: i + 1
    }));
  }

  // Helper para verificar si el usuario puede valorar (usa el store)
  function canUserRateRestaurant(restaurantId: string): boolean {
    return canUserRate(restaurantId);
  }

  // Helper para obtener la valoración del usuario (usa el store)
  function getUserRating(restaurantId: string): number {
    return getUserRatingForRestaurant(restaurantId);
  }

  // Helper para verificar si está valorando (usa el store)
  function isRatingInProgress(restaurantId: string): boolean {
    return $ratingStore.ratingsInProgress[restaurantId] || false;
  }
</script>

<main class="search-page">
  <div class="container">
    <h1>Buscar Restaurantes</h1>
    
    <!-- Formulario de búsqueda -->
    <form class="search-form" on:submit={handleSubmit}>
      <div class="search-row">
        <input 
          type="text" 
          bind:value={searchForm.search}
          placeholder="Buscar por nombre, tipo de cocina..."
        />
        <button type="submit" disabled={loading}>
          {loading ? 'Buscando...' : 'Buscar'}
        </button>
      </div>
      
      <div class="filters-row">
        <div class="filter-group">
          <label>Valoración mínima:</label>
          <select bind:value={searchForm.minRating}>
            <option value="">Cualquiera</option>
            <option value="4.5">4.5+ ⭐</option>
            <option value="4.0">4.0+ ⭐</option>
            <option value="3.5">3.5+ ⭐</option>
            <option value="3.0">3.0+ ⭐</option>
          </select>
        </div>
        
        <div class="filter-group">
          <label>Tipo de cocina:</label>
          <select bind:value={searchForm.cuisineType}>
            <option value="">Todos</option>
            <option value="mexicana">Mexicana</option>
            <option value="italiana">Italiana</option>
            <option value="asiática">Asiática</option>
            <option value="americana">Americana</option>
          </select>
        </div>
        
        <div class="filter-group">
          <label>Rango de precios:</label>
          <select bind:value={searchForm.priceRange}>
            <option value="">Cualquiera</option>
            <option value="low">Económico ($)</option>
            <option value="medium">Medio ($$)</option>
            <option value="high">Alto ($$$)</option>
          </select>
        </div>
        
        <div class="filter-group">
          <label>Ordenar por:</label>
          <select bind:value={searchForm.sortBy}>
            <option value="rating">Valoración</option>
            <option value="name">Nombre</option>
            <option value="analytics.reviewsCount">Más reseñas</option>
          </select>
        </div>
      </div>
    </form>

    <!-- Contenedor principal de resultados -->
    <div class="search-results-container">
      
      <!-- Mensaje de error -->
      {#if error}
        <div class="error-message">
          <p>Error: {error}</p>
        </div>
      {/if}

      <!-- Loading state -->
      {#if loading}
        <div class="loading">
          <p>Buscando restaurantes...</p>
        </div>
      {/if}

      <!-- Resultados de búsqueda -->
      {#if hasResults}
        <div class="search-results">
          <div class="results-header">
            <h2>Resultados ({results?.pagination.total} restaurantes)</h2>
            <p>Página {results?.pagination.page} de {results?.pagination.total_pages}</p>
          </div>
          
          <div class="restaurants-grid">
            {#each results?.restaurants! as restaurant (restaurant.id)}
              <div class="restaurant-card">
                <div class="restaurant-image">
                  {#if restaurant.image || restaurant.imageProfile}
                    <img 
                      src={restaurant.image || restaurant.imageProfile} 
                      alt={restaurant.name}
                      loading="lazy"
                    />
                  {:else}
                    <div class="restaurant-icon-placeholder">
                      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M8.1 13.34L7.2 14.24C6.45 14.99 6.45 16.22 7.2 16.97C7.95 17.72 9.18 17.72 9.93 16.97L10.83 16.07C11.58 15.32 11.58 14.09 10.83 13.34C10.08 12.59 8.85 12.59 8.1 13.34ZM14.24 7.2C14.99 6.45 16.22 6.45 16.97 7.2C17.72 7.95 17.72 9.18 16.97 9.93L16.07 10.83C15.32 11.58 14.09 11.58 13.34 10.83C12.59 10.08 12.59 8.85 13.34 8.1L14.24 7.2ZM12.94 14.06L9.94 11.06L11.06 9.94L14.06 12.94L12.94 14.06Z" fill="white"/>
                        <path d="M12 2C13.1 2 14 2.9 14 4C14 5.1 13.1 6 12 6C10.9 6 10 5.1 10 4C10 2.9 10.9 2 12 2ZM21 9V7L15 3V4H9V3L3 7V9H21ZM21 10H3V21C3 21.6 3.4 22 4 22H20C20.6 22 21 21.6 21 21V10Z" fill="white"/>
                      </svg>
                    </div>
                  {/if}
                </div>
                
                <div class="restaurant-info">
                  <h3>
                    <a href="/{restaurant.username}">{restaurant.name}</a>
                  </h3>
                  <p class="description">{restaurant.description || ''}</p>
                  
                  <div class="restaurant-meta">
                    <div class="rating">
                      <span class="stars">
                        {#each renderStars(restaurant.analytics?.averageRating || 0) as star}
                          <span class="star {star.filled ? 'filled' : ''}">⭐</span>
                        {/each}
                      </span>
                      <span class="rating-value">
                        {restaurant.analytics?.averageRating?.toFixed(1) || 'N/A'}
                      </span>
                      <span class="reviews-count">
                        ({restaurant.analytics?.reviewsCount || 0} reseñas)
                      </span>
                    </div>
                    
                    <div class="restaurant-details">
                      {#if restaurant.cuisineType?.[0]}
                        <span class="cuisine-badge">{restaurant.cuisineType[0]}</span>
                      {/if}
                      {#if restaurant.priceRange}
                        <span class="price-badge">
                          {restaurant.priceRange === 'low' ? '$' : 
                           restaurant.priceRange === 'medium' ? '$$' : '$$$'}
                        </span>
                      {/if}
                      {#if restaurant.address}
                        <span class="address">{restaurant.address}</span>
                      {/if}
                    </div>
                  </div>

                  <!-- Sistema de valoración anónima -->
                  {#if storeInitialized}
                    <div class="anonymous-rating">
                      <h4>Valorar este restaurante:</h4>
                      <div class="rating-stars">
                        {#each [1, 2, 3, 4, 5] as starValue}
                          <button 
                            class="rating-star {getUserRating(restaurant.id!) >= starValue ? 'selected' : ''}"
                            disabled={isRatingInProgress(restaurant.id!) || !canUserRateRestaurant(restaurant.id!)}
                            on:click={() => rateRestaurant(restaurant.id!, starValue)}
                            title={!canUserRateRestaurant(restaurant.id!) ? 'Ya has valorado este restaurante' : `Valorar con ${starValue} estrella${starValue > 1 ? 's' : ''}`}
                          >
                            ⭐
                          </button>
                        {/each}
                      </div>
                      
                      {#if getUserRating(restaurant.id!)}
                        <p class="user-rating">Tu valoración: {getUserRating(restaurant.id!)} ⭐</p>
                      {/if}
                      
                      {#if isRatingInProgress(restaurant.id!)}
                        <p class="rating-loading">Enviando valoración...</p>
                      {/if}

                      {#if !canUserRateRestaurant(restaurant.id!)}
                        <p class="rating-disabled">Ya has valorado este restaurante</p>
                      {/if}
                    </div>
                  {:else}
                    <div class="anonymous-rating">
                      <p class="rating-initializing">Inicializando sistema de valoración...</p>
                    </div>
                  {/if}
                </div>
              </div>
            {/each}
          </div>

          <!-- Paginación -->
          {#if results?.pagination?.total_pages! > 1}
            <div class="pagination">
              {#if results?.pagination.has_prev}
                <button 
                  class="pagination-btn"
                  on:click={() => loadPage(results.pagination.page - 1)}
                  disabled={loading}
                >
                  ← Anterior
                </button>
              {/if}
              
              <span class="page-info">
                Página {results?.pagination.page} de {results?.pagination.total_pages}
              </span>
              
              {#if results?.pagination.has_next}
                <button 
                  class="pagination-btn"
                  on:click={() => loadPage(results.pagination.page + 1)}
                  disabled={loading}
                >
                  Siguiente →
                </button>
              {/if}
            </div>
          {/if}
        </div>
      {/if}

      <!-- Estado vacío inicial -->
      {#if isEmpty}
        <div class="empty-state">
          <p>Usa el formulario arriba para buscar restaurantes por nombre, valoración, tipo de cocina y más.</p>
        </div>
      {/if}
    </div>
  </div>
</main>

<style>
  .search-page {
    padding: 20px 0;
  }

  .container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 0 20px;
  }

  .search-form {
    background: white;
    padding: 20px;
    border-radius: 10px;
    box-shadow: 0 2px 10px rgba(0,0,0,0.1);
    margin-bottom: 30px;
  }

  .search-row {
    display: flex;
    gap: 10px;
    margin-bottom: 20px;
  }

  .search-row input {
    flex: 1;
    padding: 12px;
    border: 1px solid #ddd;
    border-radius: 5px;
    font-size: 16px;
  }

  .search-row button {
    padding: 12px 24px;
    background: #ff6b35;
    color: white;
    border: none;
    border-radius: 5px;
    cursor: pointer;
    font-weight: bold;
    transition: background-color 0.2s ease;
  }

  .search-row button:hover:not(:disabled) {
    background: #e55a2b;
  }

  .search-row button:disabled {
    background: #ccc;
    cursor: not-allowed;
  }

  .filters-row {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 15px;
  }

  .filter-group {
    display: flex;
    flex-direction: column;
    gap: 5px;
  }

  .filter-group label {
    font-weight: bold;
    font-size: 14px;
    color: #555;
  }

  .filter-group select {
    padding: 8px;
    border: 1px solid #ddd;
    border-radius: 5px;
  }

  .restaurants-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
    gap: 20px;
  }

  .restaurant-card {
    background: white;
    border-radius: 10px;
    overflow: hidden;
    box-shadow: 0 2px 10px rgba(0,0,0,0.1);
    transition: transform 0.2s ease;
  }

  .restaurant-card:hover {
    transform: translateY(-5px);
  }

  .restaurant-image img {
    width: 100%;
    height: 200px;
    object-fit: cover;
  }

  .restaurant-icon-placeholder {
    width: 100%;
    height: 200px;
    background: #e5e5e5;
    display: flex;
    align-items: center;
    justify-content: center;
    border-bottom: 1px solid #e9ecef;
  }

  .restaurant-icon-placeholder svg {
    opacity: 0.6;
  }

  .restaurant-info {
    padding: 15px;
  }

  .restaurant-info h3 {
    margin: 0 0 10px 0;
  }

  .restaurant-info h3 a {
    color: #333;
    text-decoration: none;
  }

  .restaurant-info h3 a:hover {
    color: #ff6b35;
  }

  .description {
    color: #666;
    font-size: 14px;
    margin-bottom: 15px;
  }

  .rating {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 10px;
  }

  .star {
    color: #ddd;
  }

  .star.filled {
    color: #ffc107;
  }

  .restaurant-details {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    align-items: center;
    margin-bottom: 15px;
  }

  .cuisine-badge,
  .price-badge {
    background: #e9ecef;
    padding: 4px 8px;
    border-radius: 12px;
    font-size: 12px;
    font-weight: bold;
  }

  .address {
    color: #666;
    font-size: 12px;
  }

  /* Sistema de valoración anónima */
  .anonymous-rating {
    border-top: 1px solid #eee;
    padding-top: 15px;
    margin-top: 15px;
  }

  .anonymous-rating h4 {
    margin: 0 0 10px 0;
    font-size: 14px;
    color: #555;
  }

  .rating-stars {
    display: flex;
    gap: 5px;
    margin-bottom: 10px;
  }

  .rating-star {
    background: none;
    border: none;
    font-size: 20px;
    cursor: pointer;
    padding: 5px;
    border-radius: 3px;
    transition: all 0.2s ease;
    color: #ddd;
  }

  .rating-star:hover:not(:disabled) {
    background: #f8f9fa;
    transform: scale(1.1);
  }

  .rating-star.selected {
    color: #ffc107;
  }

  .rating-star:disabled {
    cursor: not-allowed;
    opacity: 0.5;
  }

  .user-rating {
    color: #28a745;
    font-size: 12px;
    font-weight: bold;
    margin: 5px 0;
  }

  .rating-loading {
    color: #6c757d;
    font-size: 12px;
    font-style: italic;
    margin: 5px 0;
  }

  .rating-disabled {
    color: #dc3545;
    font-size: 12px;
    font-weight: bold;
    margin: 5px 0;
  }

  .rating-initializing {
    color: #6c757d;
    font-size: 12px;
    font-style: italic;
    margin: 5px 0;
  }

  .pagination {
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 20px;
    margin-top: 40px;
  }

  .pagination-btn {
    padding: 10px 20px;
    background: #ff6b35;
    color: white;
    border: none;
    border-radius: 5px;
    font-weight: bold;
    cursor: pointer;
    transition: background-color 0.2s ease;
  }

  .pagination-btn:hover:not(:disabled) {
    background: #e55a2b;
  }

  .pagination-btn:disabled {
    background: #ccc;
    cursor: not-allowed;
  }

  .loading,
  .error-message,
  .empty-state {
    text-align: center;
    padding: 40px;
    color: #666;
  }

  .error-message {
    background: #f8d7da;
    color: #721c24;
    border-radius: 5px;
    margin-bottom: 20px;
  }

  .results-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
  }

  .results-header h2 {
    margin: 0;
  }

  .results-header p {
    margin: 0;
    color: #666;
  }

  /* Responsive */
  @media (max-width: 768px) {
    .search-row {
      flex-direction: column;
    }
    
    .restaurants-grid {
      grid-template-columns: 1fr;
    }
    
    .results-header {
      flex-direction: column;
      align-items: flex-start;
      gap: 10px;
    }
    
    .pagination {
      flex-direction: column;
      gap: 15px;
    }
  }
</style>