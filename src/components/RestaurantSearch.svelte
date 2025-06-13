<script lang="ts">
  //RestaurantSearch.svelte - INTEGRADO CON BÚSQUEDA DE PLATILLOS
  import { onMount } from 'svelte';
  import { fly, fade, scale } from 'svelte/transition';
  import { quintOut } from 'svelte/easing';
  
  // Componentes modulares
  import SearchForm from './SearchForm.svelte';
  import RestaurantCard from './RestaurantCard.svelte';
  import DishCard from './DishCard.svelte'; // NUEVO COMPONENTE
  import Pagination from './Pagination.svelte';
  import Toast from './Toast.svelte';
  import ResultsHeader from './ResultsHeader.svelte';
  
  // Stores y servicios RESTAURANTES
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
  
  // Stores y servicios PLATILLOS - NUEVO
  import { 
    dishRatingStore, 
    dishSearchStore, 
    isDishSearching,
    dishSearchResults,
    hasDishSearchResults,
    isDishRatingInitialized,
    topRatedDishes,
  } from '../stores/dishStore';
  
  import { searchDishes, fetchTopRatedDishes } from '../services/apiDishService';
  
  import type { 
    RestaurantSearchFilters,
    RestaurantSearchResponse
  } from '../interfaces/restaurantRating';
  
  import type { 
    DishSearchFilters,
    DishSearchResponse
  } from '../interfaces/dishRating';
    import CardDishSvelte from './Cards/CardDishSvelte.svelte';

  // Detección de browser para Astro
  const isBrowser = typeof window !== 'undefined';

  // Estados del componente
  let restaurantSearchFilters = $state<RestaurantSearchFilters>({});
  let dishSearchFilters = $state<DishSearchFilters>({}); // NUEVO
  let showResults = $state(false);
  let toastMessage = $state('');
  let toastType = $state<'success' | 'error' | 'info'>('info');
  let showToast = $state(false);
  let isMobile = $state(false); // Solo para lógica JS
  let isScrolled = $state(false);
  
  // Estado para los tipos de búsqueda
  let activeSearchType = $state<'restaurants' | 'dishes' | 'routes'>('restaurants');

  // Valores derivados RESTAURANTES
  let restaurantLoading = $derived($isSearching);
  let restaurantResults = $derived($searchResults);
  let hasRestaurantResults = $derived($hasSearchResults);
  let restaurantStoreInitialized = $derived($isInitialized);

  // Valores derivados PLATILLOS - NUEVO
  let dishLoading = $derived($isDishSearching);
  let dishResults = $derived($dishSearchResults);
  let hasDishResults = $derived($hasDishSearchResults);
  let dishStoreInitialized = $derived($isDishRatingInitialized);
  let topDishes = $derived($topRatedDishes);

  // Estados derivados unificados según el tipo activo
  let loading = $derived(() => {
    switch (activeSearchType) {
      case 'dishes':
        return dishLoading;
      case 'restaurants':
        return restaurantLoading;
      default:
        return false;
    }
  });

  let hasResults = $derived(() => {
    switch (activeSearchType) {
      case 'dishes':
        return hasDishResults;
      case 'restaurants':
        return hasRestaurantResults;
      default:
        return false;
    }
  });

  let isEmpty = $derived(() => {
    if (!showResults || loading()) return false;
    switch (activeSearchType) {
      case 'dishes':
        return !dishResults && !$dishSearchStore.error;
      case 'restaurants':
        return !restaurantResults && !$searchStore.error;
      default:
        return true;
    }
  });

  let error = $derived(() => {
    switch (activeSearchType) {
      case 'dishes':
        return $dishSearchStore.error;
      case 'restaurants':
        return $searchStore.error;
      default:
        return null;
    }
  });

  let storeInitialized = $derived(() => {
    switch (activeSearchType) {
      case 'dishes':
        return dishStoreInitialized;
      case 'restaurants':
        return restaurantStoreInitialized;
      default:
        return true;
    }
  });

  // Detectar móvil solo para lógica JS (mantener para scroll y comportamientos)
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
      
      // Inicializar ambos stores
      ratingStore.init();
      dishRatingStore.init();
      
      initializeFromUrl();
      
      // Cargar datos iniciales para dishes
      loadInitialDishData();
      
      return () => {
        window.removeEventListener('resize', checkMobile);
        window.removeEventListener('scroll', handleScroll);
      };
    }
  });

  // NUEVA FUNCIÓN: Cargar datos iniciales de platillos
  async function loadInitialDishData() {
    try {
      console.log('🏆 Cargando platillos mejor valorados iniciales...');
      const topRated = await fetchTopRatedDishes(12, 3);
      dishSearchStore.loadTopRated(topRated);
      console.log('✅ Datos iniciales de platillos cargados:', topRated.length);
    } catch (error) {
      console.warn('⚠️ Error cargando datos iniciales de platillos:', error);
    }
  }

  function initializeFromUrl() {
    if (!isBrowser) return;
    
    const urlParams = new URLSearchParams(window.location.search);
    
    // Detectar tipo de búsqueda desde URL
    const searchType = urlParams.get('type') as 'restaurants' | 'dishes' | 'routes';
    if (searchType && ['restaurants', 'dishes', 'routes'].includes(searchType)) {
      activeSearchType = searchType;
    }

    // Inicializar filtros según el tipo
    if (activeSearchType === 'restaurants') {
      const filters: RestaurantSearchFilters = {};
      if (urlParams.get('search')) filters.search = urlParams.get('search')!;
      if (urlParams.get('minRating')) filters.minRating = parseFloat(urlParams.get('minRating')!);
      if (urlParams.get('maxRating')) filters.maxRating = parseFloat(urlParams.get('maxRating')!);
      if (urlParams.get('cuisineType')) filters.cuisineType = urlParams.get('cuisineType')!;
      if (urlParams.get('priceRange')) filters.priceRange = urlParams.get('priceRange')!;
      if (urlParams.get('sortBy')) filters.sortBy = urlParams.get('sortBy')!;
      filters.sortOrder = parseInt(urlParams.get('sortOrder') || '-1');

      restaurantSearchFilters = filters;
    } else if (activeSearchType === 'dishes') {
      const filters: DishSearchFilters = {};
      if (urlParams.get('search')) filters.search = urlParams.get('search')!;
      if (urlParams.get('minRating')) filters.minRating = parseFloat(urlParams.get('minRating')!);
      if (urlParams.get('maxRating')) filters.maxRating = parseFloat(urlParams.get('maxRating')!);
      if (urlParams.get('categoryId')) filters.categoryId = urlParams.get('categoryId')!;
      if (urlParams.get('restaurantId')) filters.restaurantId = urlParams.get('restaurantId')!;
      if (urlParams.get('sortBy')) filters.sortBy = urlParams.get('sortBy')!;
      filters.sortOrder = parseInt(urlParams.get('sortOrder') || '-1');

      dishSearchFilters = filters;
    }

    // Si hay parámetros, ejecutar búsqueda automáticamente
    const hasSearchParams = urlParams.has('search') && urlParams.get('search')?.trim();
    if (hasSearchParams) {
      setTimeout(() => {
        if (activeSearchType === 'restaurants') {
          handleRestaurantSearch(restaurantSearchFilters, 1);
        } else if (activeSearchType === 'dishes') {
          handleDishSearch(dishSearchFilters, 1);
        }
      }, 100);
    }
  }

  // NUEVA FUNCIÓN: Manejar búsqueda de restaurantes
  async function handleRestaurantSearch(filters: RestaurantSearchFilters, pageNum: number = 1) {
    if (restaurantLoading || !isBrowser) return;
    
    try {
      console.log('🔍 Ejecutando búsqueda de restaurantes:', filters);
      
      searchStore.startSearch(filters, pageNum);
      showResults = true;
      
      const results = await searchRestaurants(filters, pageNum, isMobile ? 10 : 20);
      searchStore.completeSearch(results);
      
      updateUrl(filters, pageNum, 'restaurants');
      
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
      
      if (results.restaurants.length > 0) {
        showToastMessage(`${results.pagination.total} restaurantes encontrados`, 'success');
      } else {
        showToastMessage('No se encontraron restaurantes', 'info');
      }
      
    } catch (err) {
      console.error('Error en búsqueda de restaurantes:', err);
      const errorMessage = err instanceof Error ? err.message : 'Error en la búsqueda';
      searchStore.failSearch(errorMessage);
      showToastMessage('Error al buscar restaurantes', 'error');
    }
  }

  // NUEVA FUNCIÓN: Manejar búsqueda de platillos
  async function handleDishSearch(filters: DishSearchFilters, pageNum: number = 1) {
    if (dishLoading || !isBrowser) return;
    
    try {
      console.log('🔍 Ejecutando búsqueda de platillos:', filters);
      
      dishSearchStore.startSearch(filters, pageNum);
      showResults = true;
      
      const results = await searchDishes(filters, pageNum, isMobile ? 10 : 20);
      dishSearchStore.completeSearch(results);
      
      updateUrl(filters, pageNum, 'dishes');
      
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
      
      if (results.dishes.length > 0) {
        showToastMessage(`${results.pagination.total} platillos encontrados`, 'success');
      } else {
        showToastMessage('No se encontraron platillos', 'info');
      }
      
    } catch (err) {
      console.error('Error en búsqueda de platillos:', err);
      const errorMessage = err instanceof Error ? err.message : 'Error en la búsqueda';
      dishSearchStore.failSearch(errorMessage);
      showToastMessage('Error al buscar platillos', 'error');
    }
  }

  // FUNCIÓN MODIFICADA: updateUrl para manejar diferentes tipos
  function updateUrl(filters: RestaurantSearchFilters | DishSearchFilters, page: number = 1, type: string) {
    if (!isBrowser) return;
    
    const params = new URLSearchParams();
    
    // Agregar tipo de búsqueda
    params.set('type', type);
    
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

  // FUNCIÓN MODIFICADA: Manejar cambio de páginas
  async function handlePageChange(page: number) {
    if (activeSearchType === 'restaurants') {
      await handleRestaurantSearch(restaurantSearchFilters, page);
    } else if (activeSearchType === 'dishes') {
      await handleDishSearch(dishSearchFilters, page);
    }
  }

  function showToastMessage(message: string, type: 'success' | 'error' | 'info') {
    toastMessage = message;
    toastType = type;
    showToast = true;
  }

  function hideToast() {
    showToast = false;
  }

  // FUNCIÓN MODIFICADA: Manejar envío del formulario
  function handleFormSubmit(event: CustomEvent<RestaurantSearchFilters | DishSearchFilters>) {
    if (activeSearchType === 'restaurants') {
      restaurantSearchFilters = event.detail as RestaurantSearchFilters;
      handleRestaurantSearch(restaurantSearchFilters, 1);
    } else if (activeSearchType === 'dishes') {
      dishSearchFilters = event.detail as DishSearchFilters;
      handleDishSearch(dishSearchFilters, 1);
    }
  }

  // Función para scroll al inicio
  function scrollToTop() {
    if (isBrowser) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  // FUNCIÓN MODIFICADA: Cambiar tipo de búsqueda con funcionalidad
  function handleSearchTypeChange(type: 'restaurants' | 'dishes' | 'routes') {
    console.log('🔄 Cambiando tipo de búsqueda a:', type);
    
    // Limpiar resultados anteriores
    showResults = false;
    searchStore.clear();
    dishSearchStore.clear();
    
    // Cambiar tipo activo
    activeSearchType = type;
    
    // Limpiar filtros según el tipo anterior y nuevo
    restaurantSearchFilters = {};
    dishSearchFilters = {};
    
    // Actualizar URL sin parámetros de búsqueda
    updateUrl({}, 1, type);
    
    // Mostrar toast informativo
    const typeNames = {
      restaurants: 'restaurantes',
      dishes: 'platillos',
      routes: 'rutas gastronómicas'
    };
    showToastMessage(`Cambiando a búsqueda de ${typeNames[type]}`, 'info');
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
    // {
    //   id: 'routes',
    //   label: 'Rutas',
    //   icon: '🗺️',
    //   placeholder: 'Planear ruta gastronómica...',
    //   description: 'Crea tu ruta culinaria perfecta'
    // }
  ];

  let currentSearchType = $derived(() => searchTypes.find(type => type.id === activeSearchType) || searchTypes[0]);

  // NUEVA FUNCIÓN: Obtener filtros actuales según el tipo
  let currentFilters = $derived(() => {
    switch (activeSearchType) {
      case 'dishes':
        return dishSearchFilters;
      case 'restaurants':
        return restaurantSearchFilters;
      default:
        return {};
    }
  });
</script>

<main class="search-page">
  <!-- Hero Section estilo Kayak -->
  <section class="hero-section">
    <div class="hero-background">
      <div class="hero-overlay"></div>
    </div>
    
    <div class="hero-container">
      <div class="hero-content-wrapper">
        <div class="hero-main-content">
          <!-- Título principal comentado en el original, lo mantengo así -->
        </div>
        
        <div class="hero-carousel">
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
      <div class="search-navigation" in:fly={{ y: 30, duration: 600, delay: 200, easing: quintOut }}>
        <div class="nav-tabs">
          {#each searchTypes as searchType, index}
            <button
              class="nav-tab"
              class:active={activeSearchType === searchType.id}
              onclick={() => handleSearchTypeChange(searchType.id)}
              in:fly={{ x: -20, duration: 400, delay: index * 100 }}
            >
              <span class="tab-icon">{searchType.icon}</span>
              <span class="tab-label">{searchType.label}</span>
            </button>
          {/each}
        </div>
      </div>
      
      <div class="hero-header" in:fly={{ y: 20, duration: 600, easing: quintOut }}>
        <p class="hero-subtitle">
          {currentSearchType().description}
        </p>
      </div>

      <!-- Formulario de búsqueda integrado -->
      <div class="search-form-hero" in:fly={{ y: 40, duration: 600, delay: 300, easing: quintOut }}>
        <div class="search-card">
          <SearchForm 
            on:search={handleFormSubmit}
            loading={loading()}
            initialFilters={currentFilters()}
            placeholder={currentSearchType().placeholder}
            searchType={activeSearchType}
          />
        </div>
      </div>
    </div>
  </section>

  <!-- Contenedor de resultados -->
  <div class="results-container">
    <!-- Results Section optimizada -->
    {#if showResults}
      <section class="results-section" in:fade={{ duration: 500, delay: 200 }}>
        
        <!-- Error Message -->
        {#if error()}
          <div class="error-container" in:scale={{ duration: 350, easing: quintOut }}>
            <div class="error-card">
              <div class="error-icon">⚠️</div>
              <div class="error-content">
                <h3>Algo salió mal</h3>
                <p>{error()}</p>
                <button 
                  class="retry-btn"
                  onclick={() => {
                    if (activeSearchType === 'restaurants') {
                      handleRestaurantSearch(restaurantSearchFilters, 1);
                    } else if (activeSearchType === 'dishes') {
                      handleDishSearch(dishSearchFilters, 1);
                    }
                  }}
                >
                  Reintentar
                </button>
              </div>
            </div>
          </div>
        {/if}

        <!-- Loading State -->
        {#if loading()}
          <div class="loading-container" in:fade={{ duration: 250 }}>
            <div class="loading-card">
              <div class="loading-spinner"></div>
              <h3>
                {isMobile 
                  ? 'Buscando...' 
                  : `Buscando ${activeSearchType === 'dishes' ? 'platillos' : 'restaurantes'} increíbles...`}
              </h3>
              <p class="loading-subtitle">Esto tomará solo unos segundos</p>
            </div>
          </div>
        {/if}

        <!-- Results -->
        {#if hasResults() && !loading()}
          <div class="search-results" in:fly={{ y: 20, duration: 500, easing: quintOut }}>
            <!-- RESULTADOS DE RESTAURANTES -->
            {#if activeSearchType === 'restaurants' && restaurantResults}
              <ResultsHeader 
                totalResults={restaurantResults.pagination.total || 0}
                currentPage={restaurantResults.pagination.page || 1}
                totalPages={restaurantResults.pagination.total_pages || 1}
                {isMobile}
              />
              
              <div class="restaurants-grid">
                {#each restaurantResults.restaurants as restaurant, index (restaurant.id)}
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
                      storeInitialized={storeInitialized()}
                      on:toast={(e) => showToastMessage(e.detail.message, e.detail.type)}
                    />
                  </div>
                {/each}
              </div>

              <!-- Pagination para restaurantes -->
              {#if restaurantResults.pagination.total_pages > 1}
                <div class="pagination-container" in:fade={{ duration: 300, delay: 400 }}>
                  <Pagination 
                    currentPage={restaurantResults.pagination.page}
                    totalPages={restaurantResults.pagination.total_pages}
                    hasNext={restaurantResults.pagination.has_next}
                    hasPrev={restaurantResults.pagination.has_prev}
                    loading={loading()}
                    on:pageChange={(e) => handlePageChange(e.detail)}
                  />
                </div>
              {/if}
            {/if}

            <!-- RESULTADOS DE PLATILLOS - NUEVO -->
            {#if activeSearchType === 'dishes' && dishResults}
              <ResultsHeader 
                totalResults={dishResults.pagination.total || 0}
                currentPage={dishResults.pagination.page || 1}
                totalPages={dishResults.pagination.total_pages || 1}
                {isMobile}
              />
              
              <div class="dishes-grid">
                {#each dishResults.dishes as dish, index (dish.id)}
                  <div 
                    in:fly={{ 
                      y: isMobile ? 30 : 40, 
                      duration: isMobile ? 350 : 450, 
                      delay: index * (isMobile ? 50 : 80),
                      easing: quintOut 
                    }}
                  >
                    <CardDishSvelte item={dish} index={index} storeMode={false}   />
                  </div>
                {/each}
              </div>

              <!-- Pagination para platillos -->
              {#if dishResults.pagination.total_pages > 1}
                <div class="pagination-container" in:fade={{ duration: 300, delay: 400 }}>
                  <Pagination 
                    currentPage={dishResults.pagination.page}
                    totalPages={dishResults.pagination.total_pages}
                    hasNext={dishResults.pagination.has_next}
                    hasPrev={dishResults.pagination.has_prev}
                    loading={loading()}
                    on:pageChange={(e) => handlePageChange(e.detail)}
                  />
                </div>
              {/if}
            {/if}
          </div>
        {/if}

        <!-- Empty State -->
        {#if isEmpty()}
          <div class="empty-state" in:scale={{ duration: 500, easing: quintOut }}>
            <div class="empty-card">
              <div class="empty-icon">🔍</div>
              <h3>No encontramos {activeSearchType === 'dishes' ? 'platillos' : 'restaurantes'}</h3>
              <p class="empty-description">
                Intenta ajustar tus filtros de búsqueda o explora otras opciones
              </p>
              <p class="empty-description-mobile">
                Intenta ajustar tus filtros
              </p>
              <button 
                class="clear-filters-btn"
                onclick={() => {
                  if (activeSearchType === 'restaurants') {
                    restaurantSearchFilters = {};
                  } else if (activeSearchType === 'dishes') {
                    dishSearchFilters = {};
                  }
                  showResults = false;
                }}
              >
                Limpiar filtros
              </button>
            </div>
          </div>
        {/if}

        <!-- Top Dishes cuando no hay búsqueda activa y estamos en dishes -->
        {#if !showResults && activeSearchType === 'dishes' && topDishes.length > 0}
          <div class="top-dishes" in:fade={{ duration: 500 }}>
            <div class="top-dishes-header">
              <h2>🏆 Platillos Mejor Valorados</h2>
              <p>Los platillos con las mejores valoraciones de nuestros usuarios</p>
            </div>
            
            <div class="dishes-grid">
              {#each topDishes as ranking, index (ranking.dish?.id )}
                <div 
                  in:fly={{ 
                    y: 20, 
                    duration: 400, 
                    delay: index * 100,
                    easing: quintOut 
                  }}
                >
                  <DishCard 
                    dish={ranking}
                    storeInitialized={storeInitialized()}
                    isTopDish={true}
                    position={ranking.position}
                    on:toast={(e) => showToastMessage(e.detail.message, e.detail.type)}
                  />
                </div>
              {/each}
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
  /* Estilos base mejorados con media queries */
  .search-page {
    min-height: 100vh;
    background: #f8fafc;
    padding: 0;
  }

  .hero-section {
    position: relative;
    /* min-height: 40vh; */
    display: flex;
    align-items: center;
    justify-content: center;
    background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 50%, #e2e8f0 100%);
    overflow: hidden;
    padding: 2rem 0;
  }

  @media (max-width: 768px) {
    .hero-section {
      min-height: 40vh;
      padding: 2rem 0;
    }
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
    padding: 5rem 20px;
    text-align: center;
    width: 100%;
    align-items: stretch;
  }

  @media (max-width: 768px) {
    .hero-container {
      padding: 0 12px;
    }
  }

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

  .hero-carousel {
    display: none;
    flex-shrink: 0;
    width: 300px;
    height: 500px;
    position: absolute;
    top: -160px;
    right: 80px;
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

  @media (min-width: 1200px) {
    .hero-carousel {
      display: block;
    }
    
    .hero-container {
      max-width: 1400px;
    }
  }

  @media (max-width: 1199px) {
    .hero-content-wrapper {
      justify-content: center;
    }
    
    .hero-main-content {
      max-width: 100%;
    }
  }

  .hero-header {
    margin-bottom: 20px;
  }

  .hero-title {
    font-size: clamp(2rem, 7vw, 4rem);
    font-weight: 800;
    line-height: 1.1;
    margin: 0 0 16px 0;
    color: #0f172a;
  }

  @media (max-width: 768px) {
    .hero-title {
      font-size: clamp(2rem, 7vw, 3rem);
      margin: 0 0 12px 0;
    }
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

  .search-navigation {
    margin-bottom: 20px;
  }

  @media (max-width: 768px) {
    .search-navigation {
      margin-bottom: 30px;
    }
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

  @media (max-width: 768px) {
    .nav-tab {
      padding: 8px 10px;
      font-size: 0.75rem;
      gap: 6px;
      min-width: 60px;
    }
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

  @media (max-width: 768px) {
    .tab-icon {
      font-size: 1rem;
    }
  }

  .tab-label {
    white-space: nowrap;
  }

  .search-form-hero {
    margin-bottom: 40px;
  }

  @media (max-width: 768px) {
    .search-form-hero {
      margin-bottom: 30px;
    }
  }



  .results-container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 0 20px;
  }

  @media (max-width: 768px) {
    .results-container {
      padding: 0 8px;
    }
  }

  .results-section {
    margin: 60px 0;
  }

  .restaurants-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
    gap: 24px;
    margin-bottom: 40px;
  }

  @media (max-width: 768px) {
    .restaurants-grid {
      grid-template-columns: 1fr;
      gap: 16px;
      margin-bottom: 30px;
    }
  }

  /* ESTILOS PARA GRIDS DE RESULTADOS */
  .dishes-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
    gap: 24px;
    margin-bottom: 40px;
  }

  @media (max-width: 768px) {
    .dishes-grid {
      grid-template-columns: 1fr;
      gap: 16px;
      margin-bottom: 30px;
    }
  }

  .top-dishes {
    margin: 60px 0;
  }

  .top-dishes-header {
    text-align: center;
    margin-bottom: 40px;
  }

  .top-dishes-header h2 {
    margin: 0 0 8px 0;
    font-size: 1.75rem;
    font-weight: 800;
    color: #0D1B2A;
  }

  .top-dishes-header p {
    margin: 0;
    color: #64748b;
    font-size: 1rem;
  }

  .pagination-container {
    display: flex;
    justify-content: center;
  }

  .loading-container {
    display: flex;
    justify-content: center;
    padding: 60px 15px;
  }

  @media (max-width: 768px) {
    .loading-container {
      padding: 40px 10px;
    }
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

  @media (max-width: 768px) {
    .loading-card {
      padding: 30px 20px;
      border-radius: 16px;
    }
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

  @media (max-width: 768px) {
    .loading-spinner {
      width: 32px;
      height: 32px;
      margin: 0 auto 16px;
    }
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

  @media (max-width: 768px) {
    .loading-card h3 {
      font-size: 1.1rem;
      margin: 0 0 8px 0;
    }
  }

  .loading-card p {
    margin: 0;
    color: #64748b;
    font-size: 0.9rem;
  }

  /* Mostrar solo en desktop */
  .loading-subtitle {
    display: block;
  }

  @media (max-width: 768px) {
    .loading-subtitle {
      display: none;
    }
  }

  .error-container {
    display: flex;
    justify-content: center;
    padding: 60px 15px;
  }

  @media (max-width: 768px) {
    .error-container {
      padding: 40px 10px;
    }
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

  @media (max-width: 768px) {
    .error-card {
      padding: 24px 16px;
      border-radius: 16px;
    }
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

  .empty-state {
    display: flex;
    justify-content: center;
    padding: 60px 15px;
  }

  @media (max-width: 768px) {
    .empty-state {
      padding: 40px 10px;
    }
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

  @media (max-width: 768px) {
    .empty-card {
      padding: 30px 20px;
      border-radius: 16px;
    }
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

  /* Mostrar solo en desktop */
  .empty-description {
    display: block;
  }

  .empty-description-mobile {
    display: none;
  }

  @media (max-width: 768px) {
    .empty-description {
      display: none;
    }

    .empty-description-mobile {
      display: block;
      font-size: 0.9rem;
      line-height: 1.4;
      margin: 0 0 20px 0;
    }
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

  @media (max-width: 768px) {
    .scroll-top-btn {
      width: 44px;
      height: 44px;
      bottom: 16px;
      right: 16px;
    }

    .nav-tabs {
      max-width: 100%;
      padding: 4px;
    }
  }
  
</style>