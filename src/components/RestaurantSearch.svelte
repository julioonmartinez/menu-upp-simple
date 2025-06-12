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
  .search-page {
    min-height: 100vh;
    background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
    padding: 0;
  }

  .container {
    max-width: 1400px;
    margin: 0 auto;
    padding: 0 24px;
  }

  /* Hero Section */
  .hero-section {
    padding: 80px 0 60px 0;
    text-align: center;
  }

  .hero-content {
    max-width: 800px;
    margin: 0 auto;
  }

  .hero-title {
    font-size: clamp(2.5rem, 5vw, 4rem);
    font-weight: 800;
    line-height: 1.1;
    margin: 0 0 24px 0;
    color: #0D1B2A;
  }

  .gradient-text {
    background: linear-gradient(135deg, var(--primary-color, #ff6b35) 0%, #ff8c69 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }

  .hero-subtitle {
    font-size: 1.25rem;
    color: #64748b;
    margin: 0;
    line-height: 1.6;
  }

  /* Search Section */
  .search-section {
    margin-bottom: 60px;
  }

  /* Results Section */
  .results-section {
    margin-bottom: 80px;
  }

  .results-header {
    margin-bottom: 40px;
    padding: 32px;
    background: white;
    border-radius: 20px;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
    border: 1px solid #e2e8f0;
  }

  .results-count h2 {
    margin: 0 0 8px 0;
    color: #0D1B2A;
    display: flex;
    align-items: baseline;
    gap: 12px;
    flex-wrap: wrap;
  }

  .count-number {
    font-size: 2.5rem;
    font-weight: 800;
    color: var(--primary-color, #ff6b35);
  }

  .count-text {
    font-size: 1.5rem;
    font-weight: 600;
  }

  .page-info {
    margin: 0;
    color: #64748b;
    font-size: 1rem;
  }

  .restaurants-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
    gap: 32px;
    margin-bottom: 60px;
  }

  .pagination-container {
    display: flex;
    justify-content: center;
  }

  /* Loading State */
  .loading-container {
    display: flex;
    justify-content: center;
    padding: 80px 20px;
  }

  .loading-card {
    background: white;
    padding: 60px 40px;
    border-radius: 24px;
    text-align: center;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
    border: 1px solid #e2e8f0;
    max-width: 400px;
    width: 100%;
  }

  .loading-spinner {
    width: 48px;
    height: 48px;
    border: 4px solid #f1f5f9;
    border-top: 4px solid var(--primary-color, #ff6b35);
    border-radius: 50%;
    animation: spin 1s linear infinite;
    margin: 0 auto 24px;
  }

  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }

  .loading-card h3 {
    margin: 0 0 12px 0;
    color: #0D1B2A;
    font-size: 1.5rem;
    font-weight: 700;
  }

  .loading-card p {
    margin: 0;
    color: #64748b;
    font-size: 1rem;
  }

  /* Error State */
  .error-container {
    display: flex;
    justify-content: center;
    padding: 80px 20px;
  }

  .error-card {
    background: white;
    padding: 48px 32px;
    border-radius: 24px;
    text-align: center;
    box-shadow: 0 8px 32px rgba(220, 38, 38, 0.1);
    border: 2px solid #fecaca;
    max-width: 500px;
    width: 100%;
  }

  .error-icon {
    font-size: 3rem;
    margin-bottom: 20px;
  }

  .error-content h3 {
    margin: 0 0 12px 0;
    color: #dc2626;
    font-size: 1.5rem;
    font-weight: 700;
  }

  .error-content p {
    margin: 0 0 24px 0;
    color: #64748b;
    line-height: 1.6;
  }

  .retry-btn {
    background: var(--primary-color, #ff6b35);
    color: white;
    border: none;
    padding: 12px 24px;
    border-radius: 12px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s ease;
    font-size: 1rem;
  }

  .retry-btn:hover {
    background: #e55a2b;
    transform: translateY(-2px);
    box-shadow: 0 8px 20px rgba(255, 107, 53, 0.3);
  }

  /* Empty State */
  .empty-state {
    display: flex;
    justify-content: center;
    padding: 80px 20px;
  }

  .empty-card {
    background: white;
    padding: 60px 40px;
    border-radius: 24px;
    text-align: center;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
    border: 1px solid #e2e8f0;
    max-width: 500px;
    width: 100%;
  }

  .empty-icon {
    font-size: 4rem;
    margin-bottom: 24px;
  }

  .empty-card h3 {
    margin: 0 0 16px 0;
    color: #0D1B2A;
    font-size: 1.5rem;
    font-weight: 700;
  }

  .empty-card p {
    margin: 0 0 32px 0;
    color: #64748b;
    line-height: 1.6;
  }

  .clear-filters-btn {
    background: #0D1B2A;
    color: white;
    border: none;
    padding: 14px 28px;
    border-radius: 12px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s ease;
    font-size: 1rem;
  }

  .clear-filters-btn:hover {
    background: #1e293b;
    transform: translateY(-2px);
    box-shadow: 0 8px 20px rgba(13, 27, 42, 0.3);
  }

  /* Welcome Section */
  .welcome-section {
    padding: 80px 20px;
    display: flex;
    justify-content: center;
  }

  .welcome-card {
    background: white;
    padding: 60px 40px;
    border-radius: 24px;
    text-align: center;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
    border: 1px solid #e2e8f0;
    max-width: 600px;
    width: 100%;
  }

  .welcome-icon {
    font-size: 4rem;
    margin-bottom: 24px;
  }

  .welcome-card h3 {
    margin: 0 0 16px 0;
    color: #0D1B2A;
    font-size: 1.75rem;
    font-weight: 700;
  }

  .welcome-card p {
    margin: 0 0 32px 0;
    color: #64748b;
    line-height: 1.6;
    font-size: 1.1rem;
  }

  .feature-tags {
    display: flex;
    flex-wrap: wrap;
    gap: 12px;
    justify-content: center;
  }

  .feature-tag {
    background: linear-gradient(135deg, var(--primary-color, #ff6b35), #ff8c69);
    color: white;
    padding: 8px 16px;
    border-radius: 20px;
    font-size: 0.9rem;
    font-weight: 600;
    white-space: nowrap;
  }

  /* Responsive Design */
  @media (max-width: 768px) {
    .container {
      /* min-width: none; */
      padding: 0 16px;
    }
    
    .hero-section {
      padding: 60px 0 40px 0;
    }
    
    .restaurants-grid {
      grid-template-columns: 1fr;
      gap: 24px;
    }
    
    .results-header {
      padding: 24px;
    }
    
    .count-number {
      font-size: 2rem;
    }
    
    .count-text {
      font-size: 1.25rem;
    }
    
    .loading-card,
    .error-card,
    .empty-card,
    .welcome-card {
      padding: 40px 24px;
    }
    
    .feature-tags {
      flex-direction: column;
      align-items: center;
    }
  }

  @media (max-width: 480px) {
    .restaurants-grid {
      grid-template-columns: 1fr;
    }
    
    .results-count h2 {
      flex-direction: column;
      align-items: center;
      gap: 8px;
    }
  }
</style>