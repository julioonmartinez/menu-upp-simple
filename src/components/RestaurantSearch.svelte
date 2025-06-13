<script lang="ts">
  //RestaurantSearch.svelte
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

  // Estado del componente más compacto
  let searchFilters = $state<RestaurantSearchFilters>({});
  let showResults = $state(false);
  let toastMessage = $state('');
  let toastType = $state<'success' | 'error' | 'info'>('info');
  let showToast = $state(false);
  let isMobile = $state(false);
  let isScrolled = $state(false);

  // Valores derivados
  let loading = $derived($isSearching);
  let results = $derived($searchResults);
  let hasResults = $derived($hasSearchResults);
  let isEmpty = $derived(!results && !$searchStore.error && !loading && showResults);
  let error = $derived($searchStore.error);
  let storeInitialized = $derived($isInitialized);

  // Detectar móvil y scroll
  function checkMobile() {
    if (isBrowser) {
      isMobile = window.innerWidth < 768;
    }
  }

  function handleScroll() {
    if (isBrowser) {
      isScrolled = window.scrollY > 100;
    }
  }

  // Inicialización
  onMount(() => {
    if (isBrowser) {
      checkMobile();
      handleScroll();
      
      window.addEventListener('resize', checkMobile);
      window.addEventListener('scroll', handleScroll, { passive: true });
      
      ratingStore.init();
      initializeFromUrl();
      
      return () => {
        window.removeEventListener('resize', checkMobile);
        window.removeEventListener('scroll', handleScroll);
      };
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
      
      const results = await searchRestaurants(filters, pageNum, isMobile ? 10 : 20);
      searchStore.completeSearch(results);
      
      updateUrl(filters, pageNum);
      
      // Scroll suave a resultados en móvil
      if (isMobile && pageNum === 1) {
        setTimeout(() => {
          const resultsElement = document.querySelector('.search-results');
          if (resultsElement) {
            resultsElement.scrollIntoView({ 
              behavior: 'smooth', 
              block: 'start' 
            });
          }
        }, 500);
      }
      
      // Mostrar toast de éxito más compacto
      if (results.restaurants.length > 0) {
        showToastMessage(`${results.pagination.total} restaurantes encontrados`, 'success');
      } else {
        showToastMessage('No se encontraron restaurantes', 'info');
      }
      
    } catch (err) {
      console.error('Error en búsqueda:', err);
      const errorMessage = err instanceof Error ? err.message : 'Error en la búsqueda';
      searchStore.failSearch(errorMessage);
      showToastMessage('Error al buscar restaurantes', 'error');
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

  // Función para scroll al inicio
  function scrollToTop() {
    if (isBrowser) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }
</script>

<main class="search-page" class:mobile={isMobile}>
  <div class="container" class:mobile={isMobile}>
    <!-- Hero Section compacto -->
    <section class="hero-section" class:mobile={isMobile} in:fly={{ y: 20, duration: 600, easing: quintOut }}>
      <div class="hero-content" class:mobile={isMobile}>
        <h1 class="hero-title" class:mobile={isMobile}>
          <span class="gradient-text">Descubre</span> restaurantes
          {#if isMobile}
            <br><span class="subtitle-mobile">cerca de ti</span>
          {:else}
            increíbles
          {/if}
        </h1>
        {#if !isMobile}
          <p class="hero-subtitle">
            Explora, valora y comenta sobre los mejores lugares para comer
          </p>
        {/if}
      </div>
    </section>

    <!-- Search Form compacto -->
    <section class="search-section" in:fly={{ y: 30, duration: 600, delay: 150, easing: quintOut }}>
      <SearchForm 
        on:search={handleFormSubmit}
        {loading}
        initialFilters={searchFilters}
      />
    </section>

    <!-- Results Section optimizada -->
    {#if showResults}
      <section class="results-section" in:fade={{ duration: 500, delay: 200 }}>
        
        <!-- Error Message compacto -->
        {#if error}
          <div class="error-container" class:mobile={isMobile} in:scale={{ duration: 350, easing: quintOut }}>
            <div class="error-card" class:mobile={isMobile}>
              <div class="error-icon">⚠️</div>
              <div class="error-content">
                <h3>Algo salió mal</h3>
                <p>{error}</p>
                <button 
                  class="retry-btn"
                  on:click={() => handleSearch(searchFilters, 1)}
                >
                  Reintentar
                </button>
              </div>
            </div>
          </div>
        {/if}

        <!-- Loading State compacto -->
        {#if loading}
          <div class="loading-container" class:mobile={isMobile} in:fade={{ duration: 250 }}>
            <div class="loading-card" class:mobile={isMobile}>
              <div class="loading-spinner" class:mobile={isMobile}></div>
              <h3 class:mobile={isMobile}>
                {isMobile ? 'Buscando...' : 'Buscando restaurantes increíbles...'}
              </h3>
              {#if !isMobile}
                <p>Esto tomará solo unos segundos</p>
              {/if}
            </div>
          </div>
        {/if}

        <!-- Results compactos -->
        {#if hasResults && !loading}
          <div class="search-results" in:fly={{ y: 20, duration: 500, easing: quintOut }}>
            <div class="results-header" class:mobile={isMobile}>
              <div class="results-count">
                <h2 class:mobile={isMobile}>
                  <span class="count-number" class:mobile={isMobile}>{results?.pagination.total}</span>
                  <span class="count-text" class:mobile={isMobile}>
                    {isMobile ? 'encontrados' : 'restaurantes encontrados'}
                  </span>
                </h2>
                {#if !isMobile}
                  <p class="page-info">
                    Página {results?.pagination.page} de {results?.pagination.total_pages}
                  </p>
                {/if}
              </div>
            </div>
            
            <div class="restaurants-grid" class:mobile={isMobile}>
              {#each results?.restaurants! as restaurant, index (restaurant.id)}
                <div 
                  in:fly={{ 
                    y: isMobile ? 30 : 40, 
                    duration: isMobile ? 350 : 450, 
                    delay: index * (isMobile ? 50 : 80),
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

            <!-- Pagination compacta -->
            {#if results?.pagination?.total_pages! > 1}
              <div class="pagination-container" in:fade={{ duration: 300, delay: 400 }}>
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

        <!-- Empty State compacto -->
        {#if isEmpty}
          <div class="empty-state" class:mobile={isMobile} in:scale={{ duration: 500, easing: quintOut }}>
            <div class="empty-card" class:mobile={isMobile}>
              <div class="empty-icon">🔍</div>
              <h3>No encontramos restaurantes</h3>
              <p class:mobile={isMobile}>
                {isMobile 
                  ? 'Intenta ajustar tus filtros' 
                  : 'Intenta ajustar tus filtros de búsqueda o explora otras opciones'
                }
              </p>
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
      <!-- Initial Welcome State compacto -->
      <section class="welcome-section" class:mobile={isMobile} in:fade={{ duration: 600, delay: 300 }}>
        <div class="welcome-card" class:mobile={isMobile}>
          <div class="welcome-icon">🍽️</div>
          <h3 class:mobile={isMobile}>
            {isMobile ? '¿Listos?' : '¿Listos para una aventura culinaria?'}
          </h3>
          <p class:mobile={isMobile}>
            {isMobile 
              ? 'Usa la búsqueda para descubrir restaurantes cerca de ti' 
              : 'Usa el formulario de búsqueda para descubrir restaurantes increíbles cerca de ti'
            }
          </p>
          <div class="feature-tags" class:mobile={isMobile}>
            <span class="feature-tag">🌟 Valoraciones</span>
            <span class="feature-tag">💬 Comentarios</span>
            {#if !isMobile}
              <span class="feature-tag">📍 Ubicaciones</span>
            {/if}
          </div>
        </div>
      </section>
    {/if}
  </div>

  <!-- Scroll to top button para móvil -->
  {#if isMobile && isScrolled}
    <button 
      class="scroll-top-btn"
      on:click={scrollToTop}
      in:scale={{ duration: 300 }}
      out:scale={{ duration: 200 }}
      title="Ir arriba"
    >
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M18 15L12 9L6 15" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    </button>
  {/if}

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

  .search-page.mobile {
    background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
  }

  .container {
    max-width: 1200px; /* Reducido de 1400px */
    margin: 0 auto;
    padding: 0 20px; /* Reducido de 24px */
  }

  .container.mobile {
    padding: 0 12px; /* Reducido para móvil */
  }

  /* Hero Section compacto */
  .hero-section {
    padding: 60px 0 40px 0; /* Reducido de 80px 0 60px 0 */
    text-align: center;
  }

  .hero-section.mobile {
    padding: 40px 0 30px 0; /* Aún más compacto en móvil */
  }

  .hero-content {
    max-width: 700px; /* Reducido de 800px */
    margin: 0 auto;
  }

  .hero-content.mobile {
    max-width: 100%;
  }

  .hero-title {
    font-size: clamp(2rem, 5vw, 3.5rem); /* Reducido de 2.5rem, 5vw, 4rem */
    font-weight: 800;
    line-height: 1.1;
    margin: 0 0 20px 0; /* Reducido de 24px */
    color: #0D1B2A;
  }

  .hero-title.mobile {
    font-size: clamp(1.75rem, 6vw, 2.5rem);
    margin: 0 0 16px 0;
    line-height: 1.2;
  }

  .subtitle-mobile {
    font-size: 0.85em;
    font-weight: 600;
    color: #64748b;
  }

  .gradient-text {
    background: linear-gradient(135deg, var(--primary-color, #ff6b35) 0%, #ff8c69 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }

  .hero-subtitle {
    font-size: 1.1rem; /* Reducido de 1.25rem */
    color: #64748b;
    margin: 0;
    line-height: 1.5; /* Reducido de 1.6 */
  }

  /* Search Section */
  .search-section {
    margin-bottom: 50px; /* Reducido de 60px */
  }

  /* Results Section compacta */
  .results-section {
    margin-bottom: 60px; /* Reducido de 80px */
  }

  .results-header {
    margin-bottom: 30px; /* Reducido de 40px */
    padding: 24px; /* Reducido de 32px */
    background: white;
    border-radius: 16px; /* Reducido de 20px */
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06); /* Más sutil */
    border: 1px solid #f1f5f9;
  }

  .results-header.mobile {
    padding: 16px;
    border-radius: 12px;
    margin-bottom: 20px;
  }

  .results-count h2 {
    margin: 0 0 6px 0; /* Reducido de 8px */
    color: #0D1B2A;
    display: flex;
    align-items: baseline;
    gap: 10px; /* Reducido de 12px */
    flex-wrap: wrap;
  }

  .results-count h2.mobile {
    flex-direction: column;
    align-items: center;
    text-align: center;
    gap: 4px;
  }

  .count-number {
    font-size: 2rem; /* Reducido de 2.5rem */
    font-weight: 800;
    color: var(--primary-color, #ff6b35);
  }

  .count-number.mobile {
    font-size: 1.75rem;
  }

  .count-text {
    font-size: 1.25rem; /* Reducido de 1.5rem */
    font-weight: 600;
  }

  .count-text.mobile {
    font-size: 1rem;
  }

  .page-info {
    margin: 0;
    color: #64748b;
    font-size: 0.9rem; /* Reducido de 1rem */
  }

  .restaurants-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(350px, 1fr)); /* Reducido de 400px */
    gap: 24px; /* Reducido de 32px */
    margin-bottom: 40px; /* Reducido de 60px */
  }

  .restaurants-grid.mobile {
    grid-template-columns: 1fr;
    gap: 16px;
    margin-bottom: 30px;
  }

  .pagination-container {
    display: flex;
    justify-content: center;
  }

  /* Loading State compacto */
  .loading-container {
    display: flex;
    justify-content: center;
    padding: 60px 15px; /* Reducido de 80px 20px */
  }

  .loading-container.mobile {
    padding: 40px 10px;
  }

  .loading-card {
    background: white;
    padding: 40px 30px; /* Reducido de 60px 40px */
    border-radius: 20px; /* Reducido de 24px */
    text-align: center;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08); /* Más sutil */
    border: 1px solid #f1f5f9;
    max-width: 350px; /* Reducido de 400px */
    width: 100%;
  }

  .loading-card.mobile {
    padding: 30px 20px;
    border-radius: 16px;
  }

  .loading-spinner {
    width: 40px; /* Reducido de 48px */
    height: 40px;
    border: 3px solid #f1f5f9; /* Reducido de 4px */
    border-top: 3px solid var(--primary-color, #ff6b35);
    border-radius: 50%;
    animation: spin 1s linear infinite;
    margin: 0 auto 20px; /* Reducido de 24px */
  }

  .loading-spinner.mobile {
    width: 32px;
    height: 32px;
    margin: 0 auto 16px;
  }

  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }

  .loading-card h3 {
    margin: 0 0 10px 0; /* Reducido de 12px */
    color: #0D1B2A;
    font-size: 1.25rem; /* Reducido de 1.5rem */
    font-weight: 700;
  }

  .loading-card h3.mobile {
    font-size: 1.1rem;
    margin: 0 0 8px 0;
  }

  .loading-card p {
    margin: 0;
    color: #64748b;
    font-size: 0.9rem; /* Reducido de 1rem */
  }

  /* Error State compacto */
  .error-container {
    display: flex;
    justify-content: center;
    padding: 60px 15px; /* Reducido de 80px 20px */
  }

  .error-container.mobile {
    padding: 40px 10px;
  }

  .error-card {
    background: white;
    padding: 36px 24px; /* Reducido de 48px 32px */
    border-radius: 20px; /* Reducido de 24px */
    text-align: center;
    box-shadow: 0 4px 20px rgba(220, 38, 38, 0.08); /* Más sutil */
    border: 2px solid #fecaca;
    max-width: 450px; /* Reducido de 500px */
    width: 100%;
  }

  .error-card.mobile {
    padding: 24px 16px;
    border-radius: 16px;
  }

  .error-icon {
    font-size: 2.5rem; /* Reducido de 3rem */
    margin-bottom: 16px; /* Reducido de 20px */
  }

  .error-content h3 {
    margin: 0 0 10px 0; /* Reducido de 12px */
    color: #dc2626;
    font-size: 1.25rem; /* Reducido de 1.5rem */
    font-weight: 700;
  }

  .error-content p {
    margin: 0 0 20px 0; /* Reducido de 24px */
    color: #64748b;
    line-height: 1.5; /* Reducido de 1.6 */
  }

  .retry-btn {
    background: var(--primary-color, #ff6b35);
    color: white;
    border: none;
    padding: 10px 20px; /* Reducido de 12px 24px */
    border-radius: 10px; /* Reducido de 12px */
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s ease;
    font-size: 0.9rem; /* Reducido de 1rem */
  }

  .retry-btn:hover {
    background: #e55a2b;
    transform: translateY(-1px); /* Reducido de -2px */
    box-shadow: 0 4px 12px rgba(255, 107, 53, 0.25); /* Reducido de 8px 20px */
  }

  /* Empty State compacto */
  .empty-state {
    display: flex;
    justify-content: center;
    padding: 60px 15px; /* Reducido de 80px 20px */
  }

  .empty-state.mobile {
    padding: 40px 10px;
  }

  .empty-card {
    background: white;
    padding: 40px 30px; /* Reducido de 60px 40px */
    border-radius: 20px; /* Reducido de 24px */
    text-align: center;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08); /* Más sutil */
    border: 1px solid #f1f5f9;
    max-width: 450px; /* Reducido de 500px */
    width: 100%;
  }

  .empty-card.mobile {
    padding: 30px 20px;
    border-radius: 16px;
  }

  .empty-icon {
    font-size: 3.5rem; /* Reducido de 4rem */
    margin-bottom: 20px; /* Reducido de 24px */
  }

  .empty-card h3 {
    margin: 0 0 12px 0; /* Reducido de 16px */
    color: #0D1B2A;
    font-size: 1.25rem; /* Reducido de 1.5rem */
    font-weight: 700;
  }

  .empty-card p {
    margin: 0 0 24px 0; /* Reducido de 32px */
    color: #64748b;
    line-height: 1.5; /* Reducido de 1.6 */
  }

  .empty-card p.mobile {
    font-size: 0.9rem;
    line-height: 1.4;
    margin: 0 0 20px 0;
  }

  .clear-filters-btn {
    background: #0D1B2A;
    color: white;
    border: none;
    padding: 12px 24px; /* Reducido de 14px 28px */
    border-radius: 10px; /* Reducido de 12px */
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s ease;
    font-size: 0.9rem; /* Reducido de 1rem */
  }

  .clear-filters-btn:hover {
    background: #1e293b;
    transform: translateY(-1px); /* Reducido de -2px */
    box-shadow: 0 4px 12px rgba(13, 27, 42, 0.25); /* Reducido de 8px 20px */
  }

  /* Welcome Section compacta */
  .welcome-section {
    padding: 60px 15px; /* Reducido de 80px 20px */
    display: flex;
    justify-content: center;
  }

  .welcome-section.mobile {
    padding: 40px 10px;
  }

  .welcome-card {
    background: white;
    padding: 40px 30px; /* Reducido de 60px 40px */
    border-radius: 20px; /* Reducido de 24px */
    text-align: center;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08); /* Más sutil */
    border: 1px solid #f1f5f9;
    max-width: 550px; /* Reducido de 600px */
    width: 100%;
  }

  .welcome-card.mobile {
    padding: 30px 20px;
    border-radius: 16px;
  }

  .welcome-icon {
    font-size: 3.5rem; /* Reducido de 4rem */
    margin-bottom: 20px; /* Reducido de 24px */
  }

  .welcome-card h3 {
    margin: 0 0 12px 0; /* Reducido de 16px */
    color: #0D1B2A;
    font-size: 1.5rem; /* Reducido de 1.75rem */
    font-weight: 700;
  }

  .welcome-card h3.mobile {
    font-size: 1.25rem;
  }

  .welcome-card p {
    margin: 0 0 24px 0; /* Reducido de 32px */
    color: #64748b;
    line-height: 1.5; /* Reducido de 1.6 */
    font-size: 1rem; /* Reducido de 1.1rem */
  }

  .welcome-card p.mobile {
    font-size: 0.9rem;
    line-height: 1.4;
    margin: 0 0 20px 0;
  }

  .feature-tags {
    display: flex;
    flex-wrap: wrap;
    gap: 10px; /* Reducido de 12px */
    justify-content: center;
  }

  .feature-tags.mobile {
    gap: 8px;
  }

  .feature-tag {
    background: linear-gradient(135deg, var(--primary-color, #ff6b35), #ff8c69);
    color: white;
    padding: 6px 12px; /* Reducido de 8px 16px */
    border-radius: 16px; /* Reducido de 20px */
    font-size: 0.8rem; /* Reducido de 0.9rem */
    font-weight: 600;
    white-space: nowrap;
  }

  /* Scroll to top button */
  .scroll-top-btn {
    position: fixed;
    bottom: 20px;
    right: 20px;
    background: var(--primary-color, #ff6b35);
    color: white;
    border: none;
    border-radius: 50%;
    width: 48px;
    height: 48px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    box-shadow: 0 4px 16px rgba(255, 107, 53, 0.3);
    transition: all 0.3s ease;
    z-index: 100;
  }

  .scroll-top-btn:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(255, 107, 53, 0.4);
  }

  .scroll-top-btn:active {
    transform: translateY(0);
  }

  /* Responsive adicional */
  @media (max-width: 480px) {
    .container {
      padding: 0 8px;
    }
    
    .hero-section {
      padding: 30px 0 20px 0;
    }
    
    .search-section {
      margin-bottom: 30px;
    }
    
    .scroll-top-btn {
      width: 44px;
      height: 44px;
      bottom: 16px;
      right: 16px;
    }
  }
</style>