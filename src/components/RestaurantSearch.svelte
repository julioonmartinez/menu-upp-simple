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
    import ResultsHeader from './ResultsHeader.svelte';

  // Detección de browser para Astro
  const isBrowser = typeof window !== 'undefined';

  // Estado del componente
  let searchFilters = $state<RestaurantSearchFilters>({});
  let showResults = $state(false);
  let toastMessage = $state('');
  let toastType = $state<'success' | 'error' | 'info'>('info');
  let showToast = $state(false);
  let isMobile = $state(false);
  let isScrolled = $state(false);
  
  // Nuevo estado para los tipos de búsqueda
  let activeSearchType = $state<'restaurants' | 'dishes' | 'routes'>('restaurants');

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

  // Funciones para cambiar tipo de búsqueda (solo visual por ahora)
  function handleSearchTypeChange(type: 'restaurants' | 'dishes' | 'routes') {
    activeSearchType = type;
    // Aquí irá la lógica para cambiar entre tipos de búsqueda
    console.log('Cambiando a:', type);
  }

  // Configuración de tipos de búsqueda
  const searchTypes: { id:'restaurants' | 'dishes' | 'routes', label:string, icon:string, placeholder:string, description:string}[]  = [
    {
      id: 'restaurants',
      label: 'Restaurantes',
      icon: '🍽️',
      placeholder: 'Buscar restaurantes...',
      description: 'Encuentra los mejores restaurantes cerca de ti'
    },
    {
      id: 'dishes',
      label: 'Platillos',
      icon: '🍕',
      placeholder: 'Buscar platillos...',
      description: 'Descubre platos deliciosos en cualquier lugar'
    },
    {
      id: 'routes',
      label: 'Rutas',
      icon: '🗺️',
      placeholder: 'Planear ruta gastronómica...',
      description: 'Crea tu ruta culinaria perfecta'
    }
  ];

  let currentSearchType = $derived(() => searchTypes.find(type => type.id === activeSearchType) || searchTypes[0]);
</script>

<main class="search-page" class:mobile={isMobile}>
  <!-- Hero Section estilo Kayak -->
  <section class="hero-section" class:mobile={isMobile}>
    <div class="hero-background">
      <div class="hero-overlay"></div>
    </div>
    
    <div class="hero-container" class:mobile={isMobile}>
      <div class="hero-content-wrapper">
  <div class="hero-main-content">
      <!-- Título principal -->
      <div class="hero-header" in:fly={{ y: 20, duration: 600, easing: quintOut }}>
        <h1 class="hero-title" class:mobile={isMobile}>
          <span class="gradient-text">Descubre</span> sabores
          {#if isMobile}
            <br><span class="subtitle-mobile">increíbles</span>
          {:else}
            increíbles
          {/if}
        </h1>
        {#if !isMobile}
          <p class="hero-subtitle">
            {currentSearchType().description}
          </p>
        {/if}
      </div>
    </div>
<div class="hero-carousel" class:mobile={isMobile}>
    <div class="carousel-container">
      <div class="carousel-column">
        <div class="carousel-item" style="--delay: 0s">
          <img src="https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=400&h=300&fit=crop" alt="Pizza deliciosa" />
        </div>
        <div class="carousel-item" style="--delay: 2s">
          <img src="https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=400&h=300&fit=crop" alt="Restaurante elegante" />
        </div>
        <div class="carousel-item" style="--delay: 4s">
          <img src="https://images.unsplash.com/photo-1565958011703-44f9829ba187?w=400&h=300&fit=crop" alt="Hamburguesa gourmet" />
        </div>
        <div class="carousel-item" style="--delay: 6s">
          <img src="https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=400&h=300&fit=crop" alt="Menú del chef" />
        </div>
      </div>
      
      <div class="carousel-column carousel-column-2">
        <div class="carousel-item" style="--delay: 1s">
          <img src="https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=400&h=300&fit=crop" alt="Platillo gourmet" />
        </div>
        <div class="carousel-item" style="--delay: 3s">
          <img src="https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=400&h=300&fit=crop" alt="Interior restaurante" />
        </div>
        <div class="carousel-item" style="--delay: 5s">
          <img src="https://images.unsplash.com/photo-1565299507177-b0ac66763828?w=400&h=300&fit=crop" alt="Sushi fresco" />
        </div>
        <div class="carousel-item" style="--delay: 7s">
          <img src="https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=400&h=300&fit=crop" alt="Mesa de restaurante" />
        </div>
      </div>
    </div>
  </div>
</div>
      <!-- Navegación de tipos de búsqueda -->
      <div class="search-navigation" class:mobile={isMobile} in:fly={{ y: 30, duration: 600, delay: 200, easing: quintOut }}>
        <div class="nav-tabs">
          {#each searchTypes as searchType, index}
            <button
              class="nav-tab"
              class:active={activeSearchType === searchType.id}
              class:mobile={isMobile}
              onclick={() => handleSearchTypeChange(searchType.id)}
              in:fly={{ x: -20, duration: 400, delay: index * 100 }}
            >
              <span class="tab-icon">{searchType.icon}</span>
              <span class="tab-label">{searchType.label}</span>
            </button>
          {/each}
        </div>
      </div>

      <!-- Formulario de búsqueda integrado -->
      <div class="search-form-hero" class:mobile={isMobile} in:fly={{ y: 40, duration: 600, delay: 300, easing: quintOut }}>
        <div class="search-card">
          <SearchForm 
            on:search={handleFormSubmit}
            {loading}
            initialFilters={searchFilters}
            placeholder={currentSearchType().placeholder}
            searchType={activeSearchType}
          />
        </div>
      </div>

      <!-- Búsquedas populares -->
      {#if !showResults}
        <div class="popular-searches-hero" class:mobile={isMobile} in:fade={{ duration: 500, delay: 400 }}>
          <span class="popular-label">Búsquedas populares:</span>
          <div class="popular-tags">
            {#each ['Pizza', 'Sushi', 'Tacos', 'Hamburguesas', 'Italiana', 'Mexicana'] as tag, index}
              <button 
                class="popular-tag-hero"
                onclick={() => {
                  searchFilters = { search: tag };
                  handleSearch({ search: tag }, 1);
                }}
                in:fly={{ x: -15, duration: 300, delay: 500 + (index * 75) }}
              >
                {tag}
              </button>
            {/each}
          </div>
        </div>
      {/if}
    </div>
  </section>

  <!-- Contenedor de resultados -->
  <div class="results-container" class:mobile={isMobile}>
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
                  onclick={() => handleSearch(searchFilters, 1)}
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
            <ResultsHeader 
          totalResults={results?.pagination.total || 0}
          currentPage={results?.pagination.page || 1}
          totalPages={results?.pagination.total_pages || 1}
          {isMobile}
        />
            
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
                onclick={() => {
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
    {/if}
  </div>

  <!-- Scroll to top button para móvil -->
  {#if isMobile && isScrolled}
    <button 
      class="scroll-top-btn"
      onclick={scrollToTop}
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
    background: #f8fafc;
    padding: 0;
  }

  /* Hero Section estilo Kayak */
  .hero-section {
    position: relative;
    min-height: 85vh;
    display: flex;
    align-items: center;
    justify-content: center;
    background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 50%, #e2e8f0 100%);
    overflow: hidden;
  }

  .hero-section.mobile {
    min-height: 80vh;
    padding: 0;
  }

  .hero-background {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.05'%3E%3Ccircle cx='30' cy='30' r='4'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E") repeat;
  }

  .hero-overlay {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
   background: linear-gradient(135deg, rgba(248, 250, 252, 0.3) 0%, rgba(226, 232, 240, 0.2) 100%);
  }

  .hero-container {
    position: relative;
    z-index: 2;
    max-width: 1200px;
    margin: 0 auto;
    padding: 0 20px;
    text-align: center;
    width: 100%;
    align-items: stretch;
  }

  .hero-container.mobile {
    padding: 0 16px;
  }

  /* Header del hero */
  .hero-header {
    margin-bottom: 40px;
  }

  .hero-title {
    font-size: clamp(2.5rem, 6vw, 4rem);
    font-weight: 800;
    line-height: 1.1;
    margin: 0 0 16px 0;
   color: #0f172a;
  }

  .hero-title.mobile {
    font-size: clamp(2rem, 7vw, 3rem);
    margin: 0 0 12px 0;
  }

  .subtitle-mobile {
    font-size: 0.85em;
    font-weight: 600;
    opacity: 0.9;
  }

  .gradient-text {
   background: linear-gradient(135deg, var(--primary-color, #ff6b35) 0%, #ff8c69 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  }

  .hero-subtitle {
    font-size: 1.2rem;
    color: #64748b;
    margin: 0;
    line-height: 1.5;
    max-width: 600px;
    margin: 0 auto;
  }
  /* Layout del hero con carousel */
.hero-content-wrapper {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 60px;
  width: 100%;
}

.hero-main-content {
  position: relative;
  flex: 1;
  max-width: 700px;
  z-index: 3;
}

/* Carousel vertical */
.hero-carousel {
  display: none; /* Oculto por defecto */
  flex-shrink: 0;
  width: 300px;
  height: 500px;
  position: absolute;
  top: -160px;
  right: 80px;
  /* overflow: hidden; */
  border-radius: 20px;
}

.carousel-container {
  display: flex;
  gap: 12px;
  height: 100%;
}

.carousel-column {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 12px;
 animation: slideUpDown 15s ease-in-out infinite;
}

.carousel-column-2 {
  animation: slideDownUp 15s ease-in-out infinite;
}

.carousel-item {
  flex-shrink: 0;
  height: 180px;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
  opacity: 0;
  animation: fadeInCarousel 1s ease-out var(--delay) forwards;
}

.carousel-item img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.3s ease;
}

.carousel-item:hover img {
  transform: scale(1.05);
}

/* Animaciones del carousel */
@keyframes slideUpDown {
  0%, 10% { transform: translateY(0); }
  40%, 60% { transform: translateY(-40%); }
  90%, 100% { transform: translateY(0); }
}

@keyframes slideDownUp {
  0%, 10% { transform: translateY(-40%); }
  40%, 60% { transform: translateY(0); }
  90%, 100% { transform: translateY(-40%); }
}

@keyframes fadeInCarousel {
  from {
    opacity: 0;
    transform: translateY(20px) scale(0.9);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

/* Mostrar carousel solo en pantallas anchas */
@media (min-width: 1200px) {
  .hero-content-wrapper{
    /* justify-content: space-between; */
  }
  .hero-carousel {
    display: block;
  }
  
  .hero-container {
    max-width: 1400px; /* Ampliar contenedor */
  }
}

/* Ajustes responsive */
@media (max-width: 1199px) {
  .hero-content-wrapper {
    justify-content: center;
  }
  
  .hero-main-content {
    max-width: 100%;
  }
}

  /* Navegación de tipos de búsqueda */
  .search-navigation {
    margin-bottom: 40px;
  }

  .search-navigation.mobile {
    margin-bottom: 30px;
  }

  .nav-tabs {
    display: flex;
    justify-content: center;
    gap: 0;
    background: rgba(255, 255, 255, 0.8);
    backdrop-filter: blur(10px);
    border-radius: 16px;
    padding: 6px;
    border: 1px solid rgba(226, 232, 240, 0.6);
    max-width: 400px;
    margin: 0 auto;
  }

  .nav-tab {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 4px;
    padding: 10px 12px;
    border: none;
    background: transparent;
   color: #64748b;
    font-weight: 600;
    font-size: 0.9rem;
    border-radius: 12px;
    cursor: pointer;
    transition: all 0.3s ease;
    position: relative;
    overflow: hidden;
    flex-direction: column;
  }

  .nav-tab.mobile {
    padding: 10px 12px;
    font-size: 0.8rem;
    gap: 6px;
  }

  .nav-tab:hover {
   color: #374151;
    background: rgba(255, 255, 255, 0.1);
  }

  .nav-tab.active {
    background: white;
   color: var(--primary-color, #ff6b35);
   box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  }

  .tab-icon {
    font-size: 1.1rem;
  }

  .tab-icon.mobile {
    font-size: 1rem;
  }

  .tab-label {
    white-space: nowrap;
  }

  /* Formulario de búsqueda en hero */
  .search-form-hero {
    margin-bottom: 40px;
  }

  .search-form-hero.mobile {
    margin-bottom: 30px;
  }

  .search-card {
    background: white;
    border-radius: 20px;
    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
    border: 1px solid rgba(255, 255, 255, 0.2);
    backdrop-filter: blur(10px);
    padding: 8px;
    max-width: 900px;
    margin: 0 auto;
  }

  /* Búsquedas populares en hero */
  .popular-searches-hero {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 16px;
  }

  .popular-searches-hero.mobile {
    gap: 12px;
  }

  .popular-label {
    color: #64748b;
    font-size: 0.9rem;
    font-weight: 600;
  }

  .popular-tags {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    justify-content: center;
    max-width: 600px;
  }

  .popular-tag-hero {
    background: rgba(255, 255, 255, 0.15);
    backdrop-filter: blur(10px);
    border: 1px solid rgba(255, 255, 255, 0.2);
    color: white;
    padding: 8px 16px;
    border-radius: 20px;
    font-size: 0.85rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.3s ease;
  }

  .popular-tag-hero:hover {
    background: rgba(255, 255, 255, 0.25);
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(255, 255, 255, 0.2);
  }

  /* Contenedor de resultados */
  .results-container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 0 20px;
  }

  .results-container.mobile {
    padding: 0 12px;
  }

  /* Results Section */
  .results-section {
    margin: 60px 0;
  }

  .results-header {
    margin-bottom: 30px;
    padding: 24px;
    background: white;
    border-radius: 16px;
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
    border: 1px solid #f1f5f9;
  }

  .results-header.mobile {
    padding: 16px;
    border-radius: 12px;
    margin-bottom: 20px;
  }

  .results-count h2 {
    margin: 0 0 6px 0;
    color: #0D1B2A;
    display: flex;
    align-items: baseline;
    gap: 10px;
    flex-wrap: wrap;
  }

  .results-count h2.mobile {
    flex-direction: column;
    align-items: center;
    text-align: center;
    gap: 4px;
  }

  .count-number {
    font-size: 2rem;
    font-weight: 800;
    color: var(--primary-color, #ff6b35);
  }

  .count-number.mobile {
    font-size: 1.75rem;
  }

  .count-text {
    font-size: 1.25rem;
    font-weight: 600;
  }

  .count-text.mobile {
    font-size: 1rem;
  }

  .page-info {
    margin: 0;
    color: #64748b;
    font-size: 0.9rem;
  }

  .restaurants-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
    gap: 24px;
    margin-bottom: 40px;
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

  /* Loading State */
  .loading-container {
    display: flex;
    justify-content: center;
    padding: 60px 15px;
  }

  .loading-container.mobile {
    padding: 40px 10px;
  }

  .loading-card {
    background: white;
    padding: 40px 30px;
    border-radius: 20px;
    text-align: center;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
    border: 1px solid #f1f5f9;
    max-width: 350px;
    width: 100%;
  }

  .loading-card.mobile {
    padding: 30px 20px;
    border-radius: 16px;
  }

  .loading-spinner {
    width: 40px;
    height: 40px;
    border: 3px solid #f1f5f9;
    border-top: 3px solid var(--primary-color, #ff6b35);
    border-radius: 50%;
    animation: spin 1s linear infinite;
    margin: 0 auto 20px;
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
    margin: 0 0 10px 0;
    color: #0D1B2A;
    font-size: 1.25rem;
    font-weight: 700;
  }

  .loading-card h3.mobile {
    font-size: 1.1rem;
    margin: 0 0 8px 0;
  }

  .loading-card p {
    margin: 0;
    color: #64748b;
    font-size: 0.9rem;
  }

  /* Error State */
  .error-container {
    display: flex;
    justify-content: center;
    padding: 60px 15px;
  }

  .error-container.mobile {
    padding: 40px 10px;
  }

  .error-card {
    background: white;
    padding: 36px 24px;
    border-radius: 20px;
    text-align: center;
    box-shadow: 0 4px 20px rgba(220, 38, 38, 0.08);
    border: 2px solid #fecaca;
    max-width: 450px;
    width: 100%;
  }

  .error-card.mobile {
    padding: 24px 16px;
    border-radius: 16px;
  }

  .error-icon {
    font-size: 2.5rem;
    margin-bottom: 16px;
  }

  .error-content h3 {
    margin: 0 0 10px 0;
    color: #dc2626;
    font-size: 1.25rem;
    font-weight: 700;
  }

  .error-content p {
    margin: 0 0 20px 0;
    color: #64748b;
    line-height: 1.5;
  }

  .retry-btn {
    background: var(--primary-color, #ff6b35);
    color: white;
    border: none;
    padding: 10px 20px;
    border-radius: 10px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s ease;
    font-size: 0.9rem;
  }

  .retry-btn:hover {
    background: #e55a2b;
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(255, 107, 53, 0.25);
  }

  /* Empty State */
  .empty-state {
    display: flex;
    justify-content: center;
    padding: 60px 15px;
  }

  .empty-state.mobile {
    padding: 40px 10px;
  }

  .empty-card {
    background: white;
    padding: 40px 30px;
    border-radius: 20px;
    text-align: center;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
    border: 1px solid #f1f5f9;
    max-width: 450px;
    width: 100%;
  }

  .empty-card.mobile {
    padding: 30px 20px;
    border-radius: 16px;
  }

  .empty-icon {
    font-size: 3.5rem;
    margin-bottom: 20px;
  }

  .empty-card h3 {
    margin: 0 0 12px 0;
    color: #0D1B2A;
    font-size: 1.25rem;
    font-weight: 700;
  }

  .empty-card p {
    margin: 0 0 24px 0;
    color: #64748b;
    line-height: 1.5;
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
    padding: 12px 24px;
    border-radius: 10px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s ease;
    font-size: 0.9rem;
  }

  .clear-filters-btn:hover {
    background: #1e293b;
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(13, 27, 42, 0.25);
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
    .hero-container {
      padding: 0 12px;
    }
    
    .results-container {
      padding: 0 8px;
    }
    
    .scroll-top-btn {
      width: 44px;
      height: 44px;
      bottom: 16px;
      right: 16px;
    }

    .nav-tabs {
  max-width: 100%;
  padding: 4px; /* REDUCIDO */
}

.nav-tab {
  padding: 8px 10px; /* MÁS COMPACTO */
  min-width: 60px; /* ANCHO MÍNIMO */
}

.tab-label {
  font-size: 0.75rem; /* MÁS PEQUEÑO en móvil */
}
  }
</style>