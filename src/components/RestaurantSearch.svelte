<script lang="ts">
  //RestaurantSearch.svelte - CON LOGO NAVEGACIÓN Y SIN CONFLICTOS DE HEADER
  import { onMount } from 'svelte';
  import { fly, fade, scale } from 'svelte/transition';
  import { quintOut } from 'svelte/easing';
  import './RestaunrantSearch.css'
  // Componentes modulares
  import SearchForm from './SearchForm.svelte';
  import RestaurantCard from './RestaurantCard.svelte';
  import DishCardCompact from '../components/Cards/CardDishCompact.svelte';
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
  
  import { searchRestaurants, fetchTopRatedRestaurants } from '../services/apiRatingService';
  
  // Stores y servicios PLATILLOS
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
  import CardDishCompact from './Cards/CardDishCompact.svelte';
    import RestaurantCardCompact from './RestaurantCardCompact.svelte';
    import CardDishDyanmic from './Cards/CardDishDyanmic.svelte';
    import CardDishSvelte from './Cards/CardDishSvelte.svelte';

  // Detección de browser para Astro
  const isBrowser = typeof window !== 'undefined';

  // Estados del componente
  let restaurantSearchFilters = $state<RestaurantSearchFilters>({});
  let dishSearchFilters = $state<DishSearchFilters>({});
  let showResults = $state(false);
  let toastMessage = $state('');
  let toastType = $state<'success' | 'error' | 'info'>('info');
  let showToast = $state(false);
  let isMobile = $state(false);
  let isScrolled = $state(false);
  let showInitialData = $state(true);
  
  // Estados para datos iniciales
  let topRestaurants = $state<any[]>([]);
  let topDishesData = $state<any[]>([]);
  let loadingInitialData = $state(true);
  
  // Estado para los tipos de búsqueda
  let activeSearchType = $state<'restaurants' | 'dishes' | 'routes'>('restaurants');

  // Valores derivados RESTAURANTES
  let restaurantLoading = $derived($isSearching);
  let restaurantResults = $derived($searchResults);
  let hasRestaurantResults = $derived($hasSearchResults);
  let restaurantStoreInitialized = $derived($isInitialized);

  // Valores derivados PLATILLOS
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

  // Detectar móvil y scroll
  function checkMobile() {
    if (isBrowser) {
      isMobile = window.innerWidth < 768;
    }
  }

  function handleScroll() {
    if (isBrowser) {
      isScrolled = window.scrollY > 120;
    }
  }

  // Cargar datos iniciales
  async function loadInitialData() {
    console.log('🏠 Cargando datos iniciales...');
    loadingInitialData = true;
    
    try {
      const [restaurantsResult, dishesResult] = await Promise.allSettled([
        fetchTopRatedRestaurants(8, 1),
        fetchTopRatedDishes(8, 1)
      ]);

      if (restaurantsResult.status === 'fulfilled') {
        topRestaurants = restaurantsResult.value;
        console.log('✅ Top restaurantes cargados:', topRestaurants.length);
      } else {
        console.warn('⚠️ Error cargando top restaurantes:', restaurantsResult.reason);
      }

      if (dishesResult.status === 'fulfilled') {
        topDishesData = dishesResult.value;
        console.log('✅ Top platillos cargados:', topDishesData.length);
      } else {
        console.warn('⚠️ Error cargando top platillos:', dishesResult.reason);
      }

    } catch (error) {
      console.error('❌ Error cargando datos iniciales:', error);
    } finally {
      loadingInitialData = false;
    }
  }

  // Inicialización
  onMount(() => {
    if (isBrowser) {
      checkMobile();
      handleScroll();
      
      window.addEventListener('resize', checkMobile);
      window.addEventListener('scroll', handleScroll, { passive: true });
      
      // Inicializar stores
      ratingStore.init();
      dishRatingStore.init();
      
      // Verificar si hay parámetros de búsqueda en la URL
      const hasUrlParams = initializeFromUrl();
      
      // Si NO hay parámetros, cargar datos iniciales
      if (!hasUrlParams) {
        loadInitialData();
      } else {
        showInitialData = false;
      }
      
      return () => {
        window.removeEventListener('resize', checkMobile);
        window.removeEventListener('scroll', handleScroll);
      };
    }
  });

  function initializeFromUrl(): boolean {
    if (!isBrowser) return false;
    
    const urlParams = new URLSearchParams(window.location.search);
    
    const searchType = urlParams.get('type') as 'restaurants' | 'dishes' | 'routes';
    if (searchType && ['restaurants', 'dishes', 'routes'].includes(searchType)) {
      activeSearchType = searchType;
    }

    let hasSearchParams = false;

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
      hasSearchParams = Object.keys(filters).some(key => filters[key as keyof typeof filters] !== undefined && filters[key as keyof typeof filters] !== '');
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
      hasSearchParams = Object.keys(filters).some(key => filters[key as keyof typeof filters] !== undefined && filters[key as keyof typeof filters] !== '');
    }

    if (hasSearchParams) {
      setTimeout(() => {
        if (activeSearchType === 'restaurants') {
          handleRestaurantSearch(restaurantSearchFilters, 1);
        } else if (activeSearchType === 'dishes') {
          handleDishSearch(dishSearchFilters, 1);
        }
      }, 100);
    }

    return hasSearchParams;
  }

  async function handleRestaurantSearch(filters: RestaurantSearchFilters, pageNum: number = 1) {
    if (restaurantLoading || !isBrowser) return;
    
    try {
      console.log('🔍 Ejecutando búsqueda de restaurantes:', filters);
      
      searchStore.startSearch(filters, pageNum);
      showResults = true;
      showInitialData = false;
      
      const results = await searchRestaurants(filters, pageNum, isMobile ? 10 : 20);
      searchStore.completeSearch(results);
      
      updateUrl(filters, pageNum, 'restaurants');
      
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

  async function handleDishSearch(filters: DishSearchFilters, pageNum: number = 1) {
    if (dishLoading || !isBrowser) return;
    
    try {
      console.log('🔍 Ejecutando búsqueda de platillos:', filters);
      
      dishSearchStore.startSearch(filters, pageNum);
      showResults = true;
      showInitialData = false;
      
      const results = await searchDishes(filters, pageNum, isMobile ? 10 : 20);
      dishSearchStore.completeSearch(results);
      
      updateUrl(filters, pageNum, 'dishes');
      
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

  function updateUrl(filters: RestaurantSearchFilters | DishSearchFilters, page: number = 1, type: string) {
    if (!isBrowser) return;
    
    const params = new URLSearchParams();
    
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

  function handleFormSubmit(event: CustomEvent<RestaurantSearchFilters | DishSearchFilters>) {
    if (activeSearchType === 'restaurants') {
      restaurantSearchFilters = event.detail as RestaurantSearchFilters;
      handleRestaurantSearch(restaurantSearchFilters, 1);
    } else if (activeSearchType === 'dishes') {
      dishSearchFilters = event.detail as DishSearchFilters;
      handleDishSearch(dishSearchFilters, 1);
    }
  }

  function scrollToTop() {
    if (isBrowser) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  function handleSearchTypeChange(type: 'restaurants' | 'dishes' | 'routes') {
    console.log('🔄 Cambiando tipo de búsqueda a:', type);
    
    showResults = false;
    searchStore.clear();
    dishSearchStore.clear();
    
    activeSearchType = type;
    
    restaurantSearchFilters = {};
    dishSearchFilters = {};
    
    showInitialData = true;
    
    updateUrl({}, 1, type);
    
    const typeNames = {
      restaurants: 'restaurantes',
      dishes: 'platillos',
      routes: 'rutas gastronómicas'
    };
    showToastMessage(`Cambiando a búsqueda de ${typeNames[type]}`, 'info');
  }

  // NUEVA FUNCIÓN: Navegar al inicio
  function goToHome() {
    if (isBrowser) {
      window.location.href = '/';
    }
  }

  // Configuración de tipos de búsqueda
  const searchTypes: { id:'restaurants' | 'dishes' | 'routes', label:string, icon:string, placeholder:string, description:string}[]  = [
    {
      id: 'restaurants',
      label: 'Restaurantes',
      icon: '🍽️',
      placeholder: 'Buscar restaurantes...',
      description: 'Encuentra los mejores restaurantes'
    },
    {
      id: 'dishes',
      label: 'Platillos',
      icon: '🍕',
      placeholder: 'Buscar platillos...',
      description: 'Descubre platos deliciosos'
    },
  ];

  let currentSearchType = $derived(() => searchTypes.find(type => type.id === activeSearchType) || searchTypes[0]);

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
 
  <!-- Hero Section más compacto -->
  <section class="hero-section" class:compact={isScrolled}>
    <div class="hero-container">
      <!-- Formulario de búsqueda -->
      <div class="search-form-hero" in:fly={{ y: 20, duration: 600, delay: 200, easing: quintOut }}>
        <SearchForm 
          on:search={handleFormSubmit}
          loading={loading()}
          initialFilters={currentFilters()}
          placeholder={currentSearchType().placeholder}
          searchType={activeSearchType}
          {searchTypes}
          onSearchTypeChange={handleSearchTypeChange}
        />
      </div>
    </div>
  </section>

  <!-- Header fijo al hacer scroll -->
  {#if isScrolled}
    <header 
      class="fixed-header"
      in:fly={{ y: -80, duration: 400, easing: quintOut }}
      out:fly={{ y: -80, duration: 300, easing: quintOut }}
    >
      <div class="header-container">
        <SearchForm 
          on:search={handleFormSubmit}
          loading={loading()}
          initialFilters={currentFilters()}
          placeholder={currentSearchType().placeholder}
          searchType={activeSearchType}
          {searchTypes}
          onSearchTypeChange={handleSearchTypeChange}
          compact={true}
        />
      </div>
    </header>
  {/if}

  <!-- Contenedor principal de contenido -->
  <div class="main-content">
    
    <!-- Datos iniciales: Top Restaurantes y Platillos -->
    {#if showInitialData && !loadingInitialData && (topRestaurants.length > 0 || topDishesData.length > 0)}
      <section class="initial-data-section" in:fade={{ duration: 500 }}>
        
        <!-- Top Restaurantes -->
        {#if topRestaurants.length > 0}
          <div class="section-block" in:fly={{ y: 20, duration: 500, delay: 100 }}>
            <div class="section-header">
              <h2>🏆 Restaurantes Mejor Valorados</h2>
              <p>Los restaurantes con las mejores valoraciones</p>
            </div>
            
            <div class="restaurants-grid">
              {#each topRestaurants as restaurant, index (restaurant.id)}
                <div 
                  in:fly={{ 
                    y: 20, 
                    duration: 400, 
                    delay: index * 80,
                    easing: quintOut 
                  }}
                >
                  <!-- <RestaurantCard 
                    {restaurant}
                    storeInitialized={restaurantStoreInitialized}
                    on:toast={(e) => showToastMessage(e.detail.message, e.detail.type)}
                  /> -->
                  <RestaurantCardCompact 
                  {restaurant}
                    storeInitialized={restaurantStoreInitialized}
                    on:toast={(e) => showToastMessage(e.detail.message, e.detail.type)}
                  />
                </div>
              {/each}
            </div>
          </div>
        {/if}

        <!-- Top Platillos -->
        {#if topDishesData.length > 0}
          <div class="section-block" in:fly={{ y: 20, duration: 500, delay: 200 }}>
            <div class="section-header">
              <h2>⭐ Platillos Mejor Valorados</h2>
              <p>Los platillos más deliciosos según nuestros usuarios</p>
            </div>
            
            <div class="dishes-grid">
              {#each topDishesData as dish, index (dish.id)}
                <div 
                  in:fly={{ 
                    y: 20, 
                    duration: 400, 
                    delay: index * 80,
                    easing: quintOut 
                  }}
                >
                  <CardDishSvelte
                    item={dish}
                    index={index} storeMode={false}
                  />
                </div>
              {/each}
            </div>
          </div>
        {/if}
      </section>
    {/if}

    <!-- Loading inicial -->
    {#if showInitialData && loadingInitialData}
      <section class="loading-initial" in:fade={{ duration: 300 }}>
        <div class="loading-card">
          <div class="loading-spinner"></div>
          <h3>Cargando contenido destacado...</h3>
          <p>Preparando los mejores restaurantes y platillos para ti</p>
        </div>
      </section>
    {/if}

    <!-- Resultados de búsqueda -->
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
                  : `Buscando ${activeSearchType === 'dishes' ? 'platillos' : 'restaurantes'}...`}
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
              <!-- <ResultsHeader 
                totalResults={restaurantResults.pagination.total || 0}
                currentPage={restaurantResults.pagination.page || 1}
                totalPages={restaurantResults.pagination.total_pages || 1}
                {isMobile}
              /> -->
              
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
                     <RestaurantCardCompact 
                  {restaurant}
                    storeInitialized={restaurantStoreInitialized}
                    on:toast={(e) => showToastMessage(e.detail.message, e.detail.type)}
                  />
                  </div>
                {/each}
              </div>

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

            <!-- RESULTADOS DE PLATILLOS -->
            {#if activeSearchType === 'dishes' && dishResults}
              <!-- <ResultsHeader 
                totalResults={dishResults.pagination.total || 0}
                currentPage={dishResults.pagination.page || 1}
                totalPages={dishResults.pagination.total_pages || 1}
                {isMobile}
              /> -->
              
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
                    <CardDishDyanmic item={dish} index={index} storeMode={false} />
                  </div>
                {/each}
              </div>

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
                  showInitialData = true;
                }}
              >
                Ver contenido destacado
              </button>
            </div>
          </div>
        {/if}
      </section>
    {/if}
  </div>

  <!-- Scroll to top button -->
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