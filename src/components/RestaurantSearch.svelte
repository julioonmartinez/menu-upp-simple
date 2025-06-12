<script lang="ts">
  import { onMount } from 'svelte';
  import { fly, fade, scale } from 'svelte/transition';
  import { quintOut } from 'svelte/easing';
  
  // Componentes modulares
  import SearchForm from './SearchForm.svelte';
  import RestaurantCard from './RestaurantCard.svelte';
  import Pagination from './Pagination.svelte';
  import Toast from './Toast.svelte';
  
  // Stores y servicios
  import { 
    ratingStore, 
    searchStore, 
    deviceId,
    isSearching,
    searchResults,
    hasSearchResults,
    isInitialized,
  } from '../stores/ratingStore';
  
  import { searchRestaurants } from '../services/apiRatingService';
  
  import type { 
    RestaurantSearchFilters,
    RestaurantSearchResponse
  } from '../interfaces/restaurantRating';

  // Detección de browser para Astro
  const isBrowser = typeof window !== 'undefined';

  // Estado del componente
  let searchFilters = $state<RestaurantSearchFilters>({});
  let showResults = $state(false);
  let toastMessage = $state('');
  let toastType = $state<'success' | 'error' | 'info'>('info');
  let showToast = $state(false);

  // Valores derivados
  let loading = $derived($isSearching);
  let results = $derived($searchResults);
  let hasResults = $derived($hasSearchResults);
  let isEmpty = $derived(!results && !$searchStore.error && !loading && showResults);
  let error = $derived($searchStore.error);
  let storeInitialized = $derived($isInitialized);

  // Inicialización
  onMount(() => {
    if (isBrowser) {
      ratingStore.init();
      initializeFromUrl();
    }
  });

  function initializeFromUrl() {
    if (!isBrowser) return;
    
    const urlParams = new URLSearchParams(window.location.search);
    
    const filters: RestaurantSearchFilters = {};
    if (urlParams.get('search')) filters.search = urlParams.get('search')!;
    if (urlParams.get('minRating')) filters.minRating = parseFloat(urlParams.get('minRating')!);
    if (urlParams.get('maxRating')) filters.maxRating = parseFloat(urlParams.get('maxRating')!);
    if (urlParams.get('cuisineType')) filters.cuisineType = urlParams.get('cuisineType')!;
    if (urlParams.get('priceRange')) filters.priceRange = urlParams.get('priceRange')!;
    if (urlParams.get('sortBy')) filters.sortBy = urlParams.get('sortBy')!;
    filters.sortOrder = parseInt(urlParams.get('sortOrder') || '-1');

    searchFilters = filters;

    // Si hay parámetros, ejecutar búsqueda automáticamente
    if (Object.keys(filters).length > 0) {
      setTimeout(() => handleSearch(filters, 1), 100);
    }
  }

  async function handleSearch(filters: RestaurantSearchFilters, pageNum: number = 1) {
    if (loading || !isBrowser) return;
    
    try {
      console.log('🔍 Ejecutando búsqueda:', filters);
      
      searchStore.startSearch(filters, pageNum);
      showResults = true;
      
      const results = await searchRestaurants(filters, pageNum, 20);
      searchStore.completeSearch(results);
      
      updateUrl(filters, pageNum);
      
      // Mostrar toast de éxito
      if (results.restaurants.length > 0) {
        showToastMessage(`Se encontraron ${results.pagination.total} restaurantes`, 'success');
      } else {
        showToastMessage('No se encontraron restaurantes con estos criterios', 'info');
      }
      
    } catch (err) {
      console.error('Error en búsqueda:', err);
      const errorMessage = err instanceof Error ? err.message : 'Error en la búsqueda';
      searchStore.failSearch(errorMessage);
      showToastMessage('Error al buscar restaurantes. Inténtalo de nuevo.', 'error');
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

  async function handlePageChange(page: number) {
    await handleSearch(searchFilters, page);
  }

  function showToastMessage(message: string, type: 'success' | 'error' | 'info') {
    toastMessage = message;
    toastType = type;
    showToast = true;
  }

  function hideToast() {
    showToast = false;
  }

  function handleFormSubmit(event: CustomEvent<RestaurantSearchFilters>) {
    searchFilters = event.detail;
    handleSearch(event.detail, 1);
  }
</script>

<main class="search-page">
  <div class="container">
    <!-- Hero Section -->
    <section class="hero-section" in:fly={{ y: 30, duration: 800, easing: quintOut }}>
      <div class="hero-content">
        <h1 class="hero-title">
          <span class="gradient-text">Descubre</span> restaurantes increíbles
        </h1>
        <p class="hero-subtitle">
          Explora, valora y comenta sobre los mejores lugares para comer cerca de ti
        </p>
      </div>
    </section>

    <!-- Search Form -->
    <section class="search-section" in:fly={{ y: 50, duration: 800, delay: 200, easing: quintOut }}>
      <SearchForm 
        on:search={handleFormSubmit}
        {loading}
        initialFilters={searchFilters}
      />
    </section>

    <!-- Results Section -->
    {#if showResults}
      <section class="results-section" in:fade={{ duration: 600, delay: 300 }}>
        
        <!-- Error Message -->
        {#if error}
          <div class="error-container" in:scale={{ duration: 400, easing: quintOut }}>
            <div class="error-card">
              <div class="error-icon">⚠️</div>
              <div class="error-content">
                <h3>Ups, algo salió mal</h3>
                <p>{error}</p>
                <button 
                  class="retry-btn"
                  on:click={() => handleSearch(searchFilters, 1)}
                >
                  Intentar de nuevo
                </button>
              </div>
            </div>
          </div>
        {/if}

        <!-- Loading State -->
        {#if loading}
          <div class="loading-container" in:fade={{ duration: 300 }}>
            <div class="loading-card">
              <div class="loading-spinner"></div>
              <h3>Buscando restaurantes increíbles...</h3>
              <p>Esto tomará solo unos segundos</p>
            </div>
          </div>
        {/if}

        <!-- Results -->
        {#if hasResults && !loading}
          <div class="search-results" in:fly={{ y: 30, duration: 600, easing: quintOut }}>
            <div class="results-header">
              <div class="results-count">
                <h2>
                  <span class="count-number">{results?.pagination.total}</span>
                  <span class="count-text">restaurantes encontrados</span>
                </h2>
                <p class="page-info">
                  Página {results?.pagination.page} de {results?.pagination.total_pages}
                </p>
              </div>
            </div>
            
            <div class="restaurants-grid">
              {#each results?.restaurants! as restaurant, index (restaurant.id)}
                <div 
                  in:fly={{ 
                    y: 50, 
                    duration: 500, 
                    delay: index * 100,
                    easing: quintOut 
                  }}
                >
                  <RestaurantCard 
                    {restaurant}
                    {storeInitialized}
                    on:toast={(e) => showToastMessage(e.detail.message, e.detail.type)}
                  />
                </div>
              {/each}
            </div>

            <!-- Pagination -->
            {#if results?.pagination?.total_pages! > 1}
              <div class="pagination-container" in:fade={{ duration: 400, delay: 600 }}>
                <Pagination 
                  currentPage={results?.pagination.page!}
                  totalPages={results?.pagination.total_pages!}
                  hasNext={results?.pagination.has_next!}
                  hasPrev={results?.pagination.has_prev!}
                  {loading}
                  on:pageChange={(e) => handlePageChange(e.detail)}
                />
              </div>
            {/if}
          </div>
        {/if}

        <!-- Empty State -->
        {#if isEmpty}
          <div class="empty-state" in:scale={{ duration: 600, easing: quintOut }}>
            <div class="empty-card">
              <div class="empty-icon">🔍</div>
              <h3>No encontramos restaurantes</h3>
              <p>Intenta ajustar tus filtros de búsqueda o explora otras opciones</p>
              <button 
                class="clear-filters-btn"
                on:click={() => {
                  searchFilters = {};
                  showResults = false;
                }}
              >
                Limpiar filtros
              </button>
            </div>
          </div>
        {/if}
      </section>
    {:else}
      <!-- Initial Welcome State -->
      <section class="welcome-section" in:fade={{ duration: 800, delay: 400 }}>
        <div class="welcome-card">
          <div class="welcome-icon">🍽️</div>
          <h3>¿Listos para una aventura culinaria?</h3>
          <p>Usa el formulario de búsqueda para descubrir restaurantes increíbles cerca de ti</p>
          <div class="feature-tags">
            <span class="feature-tag">🌟 Valoraciones reales</span>
            <span class="feature-tag">💬 Comentarios auténticos</span>
            <span class="feature-tag">📍 Ubicaciones precisas</span>
          </div>
        </div>
      </section>
    {/if}
  </div>

  <!-- Toast Notifications -->
  {#if showToast}
    <Toast 
      message={toastMessage}
      type={toastType}
      on:close={hideToast}
    />
  {/if}
</main>

<style>
  /* Reset específico para evitar interferencias */
  .search-page * {
    box-sizing: border-box !important;
  }

  .search-page {
    min-height: 100vh !important;
    background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%) !important;
    padding: 0 !important;
    width: 100% !important;
    overflow-x: hidden !important;
  }

  .search-page .container {
    max-width: 1400px !important;
    margin: 0 auto !important;
    padding: 0 20px !important;
    width: 100% !important;
  }

  /* Hero Section */
  .search-page .hero-section {
    padding: 60px 0 40px 0 !important;
    text-align: center !important;
    width: 100% !important;
  }

  .search-page .hero-content {
    max-width: 800px !important;
    margin: 0 auto !important;
    width: 100% !important;
  }

  .search-page .hero-title {
    font-size: clamp(2rem, 5vw, 3.5rem) !important;
    font-weight: 800 !important;
    line-height: 1.1 !important;
    margin: 0 0 20px 0 !important;
    color: #0D1B2A !important;
    word-wrap: break-word !important;
  }

  .search-page .gradient-text {
    background: linear-gradient(135deg, #ff6b35 0%, #ff8c69 100%) !important;
    -webkit-background-clip: text !important;
    -webkit-text-fill-color: transparent !important;
    background-clip: text !important;
  }

  .search-page .hero-subtitle {
    font-size: clamp(1rem, 3vw, 1.25rem) !important;
    color: #64748b !important;
    margin: 0 !important;
    line-height: 1.6 !important;
    padding: 0 10px !important;
  }

  /* Search Section */
  .search-page .search-section {
    margin-bottom: 40px !important;
    width: 100% !important;
  }

  /* Results Section */
  .search-page .results-section {
    margin-bottom: 60px !important;
    width: 100% !important;
  }

  .search-page .results-header {
    margin-bottom: 30px !important;
    padding: 24px !important;
    background: white !important;
    border-radius: 16px !important;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08) !important;
    border: 1px solid #e2e8f0 !important;
    width: 100% !important;
  }

  .search-page .results-count h2 {
    margin: 0 0 8px 0 !important;
    color: #0D1B2A !important;
    display: flex !important;
    align-items: center !important;
    gap: 8px !important;
    flex-wrap: wrap !important;
    justify-content: center !important;
    text-align: center !important;
  }

  .search-page .count-number {
    font-size: clamp(1.8rem, 4vw, 2.5rem) !important;
    font-weight: 800 !important;
    color: #ff6b35 !important;
  }

  .search-page .count-text {
    font-size: clamp(1.2rem, 3vw, 1.5rem) !important;
    font-weight: 600 !important;
  }

  .search-page .page-info {
    margin: 0 !important;
    color: #64748b !important;
    font-size: clamp(0.9rem, 2vw, 1rem) !important;
    text-align: center !important;
  }

  .search-page .restaurants-grid {
    display: grid !important;
    grid-template-columns: repeat(auto-fill, minmax(min(100%, 350px), 1fr)) !important;
    gap: 20px !important;
    margin-bottom: 40px !important;
    width: 100% !important;
    padding: 0 !important;
  }

  .search-page .pagination-container {
    display: flex !important;
    justify-content: center !important;
    width: 100% !important;
    margin-top: 30px !important;
  }

  /* Loading State */
  .search-page .loading-container {
    display: flex !important;
    justify-content: center !important;
    padding: 60px 10px !important;
    width: 100% !important;
  }

  .search-page .loading-card {
    background: white !important;
    padding: 40px 24px !important;
    border-radius: 20px !important;
    text-align: center !important;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1) !important;
    border: 1px solid #e2e8f0 !important;
    max-width: 400px !important;
    width: 100% !important;
  }

  .search-page .loading-spinner {
    width: 40px !important;
    height: 40px !important;
    border: 3px solid #f1f5f9 !important;
    border-top: 3px solid #ff6b35 !important;
    border-radius: 50% !important;
    animation: searchPageSpin 1s linear infinite !important;
    margin: 0 auto 20px !important;
  }

  @keyframes searchPageSpin {
    0% { transform: rotate(0deg) !important; }
    100% { transform: rotate(360deg) !important; }
  }

  .search-page .loading-card h3 {
    margin: 0 0 12px 0 !important;
    color: #0D1B2A !important;
    font-size: clamp(1.2rem, 3vw, 1.5rem) !important;
    font-weight: 700 !important;
  }

  .search-page .loading-card p {
    margin: 0 !important;
    color: #64748b !important;
    font-size: clamp(0.9rem, 2vw, 1rem) !important;
  }

  /* Error State */
  .search-page .error-container {
    display: flex !important;
    justify-content: center !important;
    padding: 60px 10px !important;
    width: 100% !important;
  }

  .search-page .error-card {
    background: white !important;
    padding: 32px 20px !important;
    border-radius: 20px !important;
    text-align: center !important;
    box-shadow: 0 8px 32px rgba(220, 38, 38, 0.1) !important;
    border: 2px solid #fecaca !important;
    max-width: 500px !important;
    width: 100% !important;
  }

  .search-page .error-icon {
    font-size: 2.5rem !important;
    margin-bottom: 16px !important;
  }

  .search-page .error-content h3 {
    margin: 0 0 12px 0 !important;
    color: #dc2626 !important;
    font-size: clamp(1.2rem, 3vw, 1.5rem) !important;
    font-weight: 700 !important;
  }

  .search-page .error-content p {
    margin: 0 0 20px 0 !important;
    color: #64748b !important;
    line-height: 1.6 !important;
    font-size: clamp(0.9rem, 2vw, 1rem) !important;
  }

  .search-page .retry-btn {
    background: #ff6b35 !important;
    color: white !important;
    border: none !important;
    padding: 12px 20px !important;
    border-radius: 10px !important;
    font-weight: 600 !important;
    cursor: pointer !important;
    transition: all 0.2s ease !important;
    font-size: clamp(0.9rem, 2vw, 1rem) !important;
  }

  .search-page .retry-btn:hover {
    background: #e55a2b !important;
    transform: translateY(-2px) !important;
    box-shadow: 0 8px 20px rgba(255, 107, 53, 0.3) !important;
  }

  /* Empty State */
  .search-page .empty-state {
    display: flex !important;
    justify-content: center !important;
    padding: 60px 10px !important;
    width: 100% !important;
  }

  .search-page .empty-card {
    background: white !important;
    padding: 40px 24px !important;
    border-radius: 20px !important;
    text-align: center !important;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1) !important;
    border: 1px solid #e2e8f0 !important;
    max-width: 500px !important;
    width: 100% !important;
  }

  .search-page .empty-icon {
    font-size: 3rem !important;
    margin-bottom: 20px !important;
  }

  .search-page .empty-card h3 {
    margin: 0 0 16px 0 !important;
    color: #0D1B2A !important;
    font-size: clamp(1.2rem, 3vw, 1.5rem) !important;
    font-weight: 700 !important;
  }

  .search-page .empty-card p {
    margin: 0 0 24px 0 !important;
    color: #64748b !important;
    line-height: 1.6 !important;
    font-size: clamp(0.9rem, 2vw, 1rem) !important;
  }

  .search-page .clear-filters-btn {
    background: #0D1B2A !important;
    color: white !important;
    border: none !important;
    padding: 12px 20px !important;
    border-radius: 10px !important;
    font-weight: 600 !important;
    cursor: pointer !important;
    transition: all 0.2s ease !important;
    font-size: clamp(0.9rem, 2vw, 1rem) !important;
  }

  .search-page .clear-filters-btn:hover {
    background: #1e293b !important;
    transform: translateY(-2px) !important;
    box-shadow: 0 8px 20px rgba(13, 27, 42, 0.3) !important;
  }

  /* Welcome Section */
  .search-page .welcome-section {
    padding: 60px 10px !important;
    display: flex !important;
    justify-content: center !important;
    width: 100% !important;
  }

  .search-page .welcome-card {
    background: white !important;
    padding: 40px 24px !important;
    border-radius: 20px !important;
    text-align: center !important;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1) !important;
    border: 1px solid #e2e8f0 !important;
    max-width: 600px !important;
    width: 100% !important;
  }

  .search-page .welcome-icon {
    font-size: 3rem !important;
    margin-bottom: 20px !important;
  }

  .search-page .welcome-card h3 {
    margin: 0 0 16px 0 !important;
    color: #0D1B2A !important;
    font-size: clamp(1.3rem, 3vw, 1.75rem) !important;
    font-weight: 700 !important;
  }

  .search-page .welcome-card p {
    margin: 0 0 24px 0 !important;
    color: #64748b !important;
    line-height: 1.6 !important;
    font-size: clamp(1rem, 2vw, 1.1rem) !important;
  }

  .search-page .feature-tags {
    display: flex !important;
    flex-wrap: wrap !important;
    gap: 10px !important;
    justify-content: center !important;
  }

  .search-page .feature-tag {
    background: linear-gradient(135deg, #ff6b35, #ff8c69) !important;
    color: white !important;
    padding: 8px 12px !important;
    border-radius: 16px !important;
    font-size: clamp(0.8rem, 2vw, 0.9rem) !important;
    font-weight: 600 !important;
    white-space: nowrap !important;
    text-align: center !important;
    min-width: max-content !important;
  }

  /* Mobile Optimization - Breakpoints específicos */
  @media (max-width: 768px) {
    .search-page .container {
      padding: 0 16px !important;
    }
    
    .search-page .hero-section {
      padding: 40px 0 30px 0 !important;
    }
    
    .search-page .restaurants-grid {
      grid-template-columns: 1fr !important;
      gap: 16px !important;
    }
    
    .search-page .results-header {
      padding: 20px !important;
      margin-bottom: 24px !important;
    }
    
    .search-page .results-count h2 {
      flex-direction: column !important;
      gap: 4px !important;
    }
    
    .search-page .feature-tags {
      flex-direction: column !important;
      align-items: center !important;
    }

    .search-page .feature-tag {
      width: auto !important;
      max-width: 280px !important;
    }
  }

  @media (max-width: 480px) {
    .search-page .container {
      padding: 0 12px !important;
    }

    .search-page .restaurants-grid {
      gap: 12px !important;
    }
    
    .search-page .hero-section {
      padding: 30px 0 20px 0 !important;
    }

    .search-page .search-section {
      margin-bottom: 30px !important;
    }

    .search-page .results-section {
      margin-bottom: 40px !important;
    }

    .search-page .welcome-section,
    .search-page .loading-container,
    .search-page .error-container,
    .search-page .empty-state {
      padding: 40px 5px !important;
    }

    .search-page .welcome-card,
    .search-page .loading-card,
    .search-page .error-card,
    .search-page .empty-card {
      padding: 30px 16px !important;
    }
  }

  /* Ultra small devices */
  @media (max-width: 360px) {
    .search-page .container {
      padding: 0 8px !important;
    }

    .search-page .restaurants-grid {
      gap: 8px !important;
    }

    .search-page .hero-title {
      font-size: 1.8rem !important;
    }

    .search-page .hero-subtitle {
      font-size: 1rem !important;
    }
  }

  /* Asegurar que las animaciones no interfieran */
  @media (prefers-reduced-motion: reduce) {
    .search-page * {
      animation-duration: 0.01ms !important;
      animation-iteration-count: 1 !important;
      transition-duration: 0.01ms !important;
    }
  }

  /* Fix para overflow en contenedores */
  .search-page .restaurants-grid > * {
    min-width: 0 !important;
    overflow: hidden !important;
  }
</style>