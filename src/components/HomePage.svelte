<script lang="ts">
  // HomePage.svelte - Página de inicio con contenido destacado
  import { onMount } from 'svelte';
  import { fly, fade, scale } from 'svelte/transition';
  import { quintOut, elasticOut } from 'svelte/easing';
  import { isAuthenticated } from '../stores/authStore'
  import { restaurantFavoritesStore } from '../stores/restaurantFavoritesStore'

  // Componentes
  import RestaurantCard from './RestaurantCard.svelte';
  import CardDishSvelte from './Cards/CardDishDyanmic.svelte';
  import Toast from './Toast.svelte';
  import HeroSearchBox from './HeroSearchBox.svelte';
  // import CSSVariableTest from './CSSVariableTest.svelte';

  import DishModal from './DishModal.svelte';
  import type { DishWithRatings } from '../interfaces/dishRating';
  import type { RestaurantSearchResult } from '../interfaces/restaurantRating';
  
  // Stores
  import { 
    ratingStore, 
    searchStore,  
    isInitialized as isRestaurantStoreInitialized 
  } from '../stores/ratingStore';
  
  import { 
    dishRatingStore, 
    dishSearchStore,
    isDishRatingInitialized 
  } from '../stores/dishStore';
  
  // Servicios
  import { 
    fetchTopRatedRestaurants, 
    fetchFeaturedRestaurants 
  } from '../services/apiRatingService';
  
  import { 
    fetchTopRatedDishes, 
    fetchMostCommentedDishes 
  } from '../services/apiDishService';
  
  import type { 
    RestaurantRanking, 
    FeaturedRestaurantsResponse 
  } from '../interfaces/restaurantRating';
  
  import type { DishRanking } from '../interfaces/dishRating';
  import type { Restaurant } from '../interfaces/restaurant';
  import type { Dish } from '../interfaces/dish';
    import RestaurantCardCompact from './RestaurantCardCompact.svelte';

  // Estados del componente usando Svelte 5 runes
  let loading = $state({
    topRestaurants: true,
    topDishes: true,
    featuredRestaurants: true,
    mostCommentedDishes: true
  });

  // Agregar estos estados después de las variables existentes:
let showDishModal = $state(false);
let selectedDish = $state<DishWithRatings | null>(null);

// Estados para búsqueda integrada
let showSearchResults = $state(false);
let searchQuery = $state('');
let searchResults = $state({
  restaurants: [] as RestaurantSearchResult[],
  dishes: [] as DishWithRatings[],
  total: 0
});
let isSearching = $state(false);
  
  let data = $state({
    topRestaurants: [] as RestaurantRanking[],
    topDishes: [] as DishRanking[],
    featuredRestaurants: null as FeaturedRestaurantsResponse | null,
    mostCommentedDishes: [] as DishRanking[]
  });
  
  let errors = $state({
    topRestaurants: null as string | null,
    topDishes: null as string | null,
    featuredRestaurants: null as string | null,
    mostCommentedDishes: null as string | null
  });

  // Toast state
  let showToast = $state(false);
  let toastMessage = $state('');
  let toastType = $state<'success' | 'error' | 'info'>('info');

  // Detección de móvil
  let isMobile = $state(false);
  
  function checkMobile() {
    if (typeof window !== 'undefined') {
      isMobile = window.innerWidth < 768;
    }
  }


  onMount(() => {
    ratingStore.init();
dishRatingStore.init();
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    // NUEVO: Listener para eventos de toast del modal
  const handleToastEvent = (event: Event) => {
    const customEvent = event as CustomEvent<{ message: string; type: 'success' | 'error' | 'info' }>;
    showToastMessage(customEvent.detail.message, customEvent.detail.type);
  };

  window.addEventListener('showToast', handleToastEvent as EventListener);
    // Inicializar stores
    ratingStore.init();
    dishRatingStore.init();
    
    // Cargar datos iniciales
    loadAllData();
    
    return () => {
      window.removeEventListener('resize', checkMobile);
       window.removeEventListener('showToast', handleToastEvent);
    };
  });
  // Funciones para manejar el modal:
function openDishModal(dish: DishWithRatings) {
  selectedDish = dish;
  showDishModal = true;
}

function closeDishModal() {
  showDishModal = false;
  selectedDish = null;
}

// Funciones para manejar la búsqueda integrada
function handleSearchSubmit(event: CustomEvent<{ query: string; results: any }>) {
  searchQuery = event.detail.query;
  searchResults = event.detail.results;
  showSearchResults = true;
  
  // Scroll suave a los resultados
  setTimeout(() => {
    const resultsElement = document.querySelector('.search-results-section');
    if (resultsElement) {
      resultsElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, 100);
}

function clearSearchResults() {
  showSearchResults = false;
  searchQuery = '';
  searchResults = { restaurants: [], dishes: [], total: 0 };
}

  async function loadAllData() {
    await Promise.all([
      loadTopRestaurants(),
      loadTopDishes(),
      loadFeaturedRestaurants(),
      loadMostCommentedDishes()
    ]);
  }

  async function loadTopRestaurants() {
    try {
      loading.topRestaurants = true;
      errors.topRestaurants = null;
      
      const topRestaurants = await fetchTopRatedRestaurants(6, 3);
      const topRestaurants2 = await restaurantFavoritesStore.loadPopularRestaurants(10)
      console.log('response service', topRestaurants2)
      data.topRestaurants = topRestaurants;
      
      console.log('✅ Top restaurants loaded:', topRestaurants.length);
    } catch (error) {
      console.error('❌ Error loading top restaurants:', error);
      errors.topRestaurants = 'Error cargando restaurantes destacados';
    } finally {
      loading.topRestaurants = false;
    }
  }

  async function loadTopDishes() {
    try {
      loading.topDishes = true;
      errors.topDishes = null;
      
      const topDishes = await fetchTopRatedDishes();
      data.topDishes = topDishes;
      
      console.log('✅ Top dishes loaded:', topDishes.length);
    } catch (error) {
      console.error('❌ Error loading top dishes:', error);
      errors.topDishes = 'Error cargando platillos destacados';
    } finally {
      loading.topDishes = false;
    }
  }

  async function loadFeaturedRestaurants() {
    try {
      loading.featuredRestaurants = true;
      errors.featuredRestaurants = null;
      
      const featured = await fetchFeaturedRestaurants(4);
      data.featuredRestaurants = featured;
      
      console.log('✅ Featured restaurants loaded:', featured.featured_restaurants.length);
    } catch (error) {
      console.error('❌ Error loading featured restaurants:', error);
      errors.featuredRestaurants = 'Error cargando restaurantes recomendados';
    } finally {
      loading.featuredRestaurants = false;
    }
  }

  async function loadMostCommentedDishes() {
    try {
      loading.mostCommentedDishes = true;
      errors.mostCommentedDishes = null;
      
      const mostCommented = await fetchMostCommentedDishes(6, 2);
      data.mostCommentedDishes = mostCommented;
      
      console.log('✅ Most commented dishes loaded:', mostCommented.length);
    } catch (error) {
      console.error('❌ Error loading most commented dishes:', error);
      errors.mostCommentedDishes = 'Error cargando platillos más comentados';
    } finally {
      loading.mostCommentedDishes = false;
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

  // Función para transformar RestaurantRanking a Restaurant
  // function transformRestaurantRanking(ranking: RestaurantRanking): Restaurant {
  //   const restaurant = ranking.restaurant;
  //   console.log('ranking', ranking)
  //   return {
  //     ...restaurant,
  //     // Asegurar que priceRange sea del tipo correcto
  //     priceRange: restaurant.priceRange as "low" | "medium" | "high" | "premium" | undefined,
  //     // Agregar analytics si no existen
  //     analytics: {
  //       averageRating: ranking.rating,
  //       reviewsCount: ranking.totalReviews,
  //       visitsCount: ranking.restaurant. ,
  //       ordersCount: 0 ,
  //       favoritesCount: ranking.analytics?.favoritesCount,
  //       commentsCount: ranking.analytics?.commentsCount
  //     }
  //   };
  // }

  // Stores derivados usando Svelte 5 syntax
  const storeInitialized = $derived($isRestaurantStoreInitialized && $isDishRatingInitialized);
</script>

<main class="homepage">
  <!-- Hero Section -->
  <section class="hero-section">
    <div class="hero-container">
      <div class="hero-content" in:fly={{ y: 30, duration: 600, easing: quintOut }}>
        <h1 class="hero-title">
          Descubre sabores
          <span class="gradient-text">increíbles</span>
        </h1>
        <p class="hero-subtitle">
          {!isMobile 
            ? 'Los mejores restaurantes y platillos cerca de ti' 
            : ''}
        </p>
        
        <div class="hero-cta" in:fly={{ y: 20, duration: 500, delay: 200 }}>
          <!-- Búsqueda directa con autocomplete -->
          <HeroSearchBox 
            {isMobile} 
            onDishSelect={openDishModal}
            on:searchSubmit={handleSearchSubmit}
          />
          
          <!-- <div class="hero-stats" in:fade={{ duration: 400, delay: 400 }}>
            <div class="stat-item">
              <span class="stat-number">1,200+</span>
              <span class="stat-label">Restaurantes</span>
            </div>
            <div class="stat-divider"></div>
            <div class="stat-item">
              <span class="stat-number">15k+</span>
              <span class="stat-label">Platillos</span>
            </div>
            <div class="stat-divider"></div>
            <div class="stat-item">
              <span class="stat-number">50k+</span>
              <span class="stat-label">Reseñas</span>
            </div>
          </div> -->
        </div>
      </div>
    </div>
  </section>

  <!-- Search Results Section -->
  {#if showSearchResults}
    <section class="search-results-section" in:fly={{ y: 20, duration: 500, easing: quintOut }}>
      <div class="section-container">
        <div class="search-results-header">
          <div class="search-info">
            <h2 class="search-title">
              Resultados para "{searchQuery}"
            </h2>
            <p class="search-subtitle">
              {searchResults.total} resultados encontrados
            </p>
          </div>
          <button 
            class="clear-search-btn"
            onclick={clearSearchResults}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
            Limpiar búsqueda
          </button>
        </div>

        <!-- Restaurantes encontrados -->
        {#if searchResults.restaurants.length > 0}
          <div class="search-section" in:fly={{ y: 20, duration: 400, delay: 100 }}>
            <div class="section-header">
              <h3 class="section-title">🍽️ Restaurantes</h3>
              <p class="section-subtitle">{searchResults.restaurants.length} restaurantes encontrados</p>
            </div>
            
            <div class="restaurants-grid">
              {#each searchResults.restaurants as restaurant, index (restaurant.id)}
                <div 
                  in:fly={{ 
                    y: isMobile ? 15 : 25, 
                    duration: 350, 
                    delay: index * 75,
                    easing: quintOut 
                  }}
                >
                  <RestaurantCardCompact 
                    restaurant={restaurant}
                    storeInitialized={storeInitialized}
                    on:toast={(e) => showToastMessage(e.detail.message, e.detail.type)}
                  />
                </div>
              {/each}
            </div>
          </div>
        {/if}

        <!-- Platillos encontrados -->
        {#if searchResults.dishes.length > 0}
          <div class="search-section" in:fly={{ y: 20, duration: 400, delay: 200 }}>
            <div class="section-header">
              <h3 class="section-title">🍕 Platillos</h3>
              <p class="section-subtitle">{searchResults.dishes.length} platillos encontrados</p>
            </div>
            
            <div class="dishes-grid">
              {#each searchResults.dishes as dish, index (dish.id)}
                <div 
                  in:fly={{ 
                    y: isMobile ? 15 : 25, 
                    duration: 350, 
                    delay: index * 75,
                    easing: quintOut 
                  }}
                >
                  <CardDishSvelte 
                    item={dish}
                    index={index}
                    storeMode={false}
                  />
                </div>
              {/each}
            </div>
          </div>
        {/if}

        <!-- Sin resultados -->
        {#if searchResults.total === 0}
          <div class="empty-search-state" in:scale={{ duration: 500, easing: quintOut }}>
            <div class="empty-card">
              <div class="empty-icon">🔍</div>
              <h3>No encontramos resultados</h3>
              <p>Intenta con otros términos de búsqueda</p>
            </div>
          </div>
        {/if}
      </div>
    </section>
  {/if}

    <!-- Top Rated Dishes Section -->
  {#if !showSearchResults}
  <section class="content-section">
    <div class="section-container">
      <div class="section-header" in:fly={{ y: 20, duration: 400 }}>
        <h2 class="section-title">⭐ Platillos estrella</h2>
        <p class="section-subtitle">Los platos más deliciosos según nuestros usuarios</p>
      </div>

      {#if loading.topDishes}
        <div class="loading-grid dishes-grid">
          {#each Array(8) as _, i}
            <div class="skeleton-card skeleton-dish" in:fade={{ duration: 200, delay: i * 50 }}></div>
          {/each}
        </div>
      {:else if errors.topDishes}
        <div class="error-state" in:scale={{ duration: 300 }}>
          <div class="error-icon">⚠️</div>
          <p>{errors.topDishes}</p>
          <button class="retry-btn" onclick={loadTopDishes}>Reintentar</button>
        </div>
      {:else if data.topDishes.length > 0}
        <div class="dishes-grid">
          {#each data.topDishes as dishRanking, index (dishRanking.id || `dish-${index}`)}
            <div 
              in:fly={{ 
                y: isMobile ? 15 : 25, 
                duration: 350, 
                delay: index * 75,
                easing: quintOut 
              }}
            >
              <CardDishSvelte 
                item={dishRanking}
                index={index}
                storeMode={false}
              />
            </div>
          {/each}
        </div>
      {:else}
        <div class="empty-state">
          <div class="empty-icon">🍕</div>
          <p>No hay platillos disponibles en este momento</p>
        </div>
      {/if}
    </div>
  </section>
  {/if}

  <!-- Top Rated Restaurants Section -->
  {#if !showSearchResults}
  <section class="content-section">
    <div class="section-container">
      <div class="section-header" in:fly={{ y: 20, duration: 400 }}>
        <h2 class="section-title">🏆 Restaurantes mejor valorados</h2>
        <p class="section-subtitle">Los favoritos de nuestra comunidad</p>
      </div>

      {#if loading.topRestaurants}
        <div class="loading-grid">
          {#each Array(6) as _, i}
            <div class="skeleton-card" in:fade={{ duration: 200, delay: i * 100 }}></div>
          {/each}
        </div>
      {:else if errors.topRestaurants}
        <div class="error-state" in:scale={{ duration: 300 }}>
          <div class="error-icon">⚠️</div>
          <p>{errors.topRestaurants}</p>
          <button class="retry-btn" onclick={loadTopRestaurants}>Reintentar</button>
        </div>
      {:else if data.topRestaurants.length > 0}
        <div class="restaurants-grid">
          {#each data.topRestaurants as restaurant, index (restaurant.restaurant.id)}
            <div 
              in:fly={{ 
                y: isMobile ? 20 : 30, 
                duration: 400, 
                delay: index * 100,
                easing: quintOut 
              }}
            >
             <RestaurantCardCompact 
                restaurant={restaurant.restaurant}
                  storeInitialized={storeInitialized}
                  on:toast={(e) => showToastMessage(e.detail.message, e.detail.type)}
                
                />
              
            </div>
          {/each}
        </div>
      {:else}
        <div class="empty-state">
          <div class="empty-icon">🍽️</div>
          <p>No hay restaurantes disponibles en este momento</p>
        </div>
      {/if}
    </div>
  </section>
  {/if}

  <!-- Most Commented Dishes Section -->
  {#if !showSearchResults && data.mostCommentedDishes.length > 0}
    <section class="content-section">
      <div class="section-container">
        <div class="section-header" in:fly={{ y: 20, duration: 400 }}>
          <h2 class="section-title">💬 Más comentados</h2>
          <p class="section-subtitle">Los platillos que generan más conversación</p>
        </div>

        <div class="dishes-grid">
          {#each data.mostCommentedDishes as dishRanking, index (dishRanking.id || `commented-dish-${index}`)}
            <div 
              in:fly={{ 
                y: isMobile ? 15 : 25, 
                duration: 350, 
                delay: index * 100,
                easing: quintOut 
              }}
            >
              <div class="commented-dish-wrapper">
                <div class="comments-badge">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M8.5 19H16.5C17.8807 19 19 17.8807 19 16.5V7.5C19 6.11929 17.8807 5 16.5 5H7.5C6.11929 5 5 6.11929 5 7.5V18.25C5 18.6642 5.33579 19 5.75 19C5.88807 19 6.01951 18.9481 6.12132 18.8536L8.5 19Z" 
                          stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                  </svg>
                  <span>{dishRanking.totalComments || 0}</span>
                </div>
                <CardDishSvelte 
                  item={dishRanking}
                  index={index}
                  storeMode={false}
                />
              </div>
            </div>
          {/each}
        </div>
      </div>
    </section>
  {/if}


  <!-- Featured Restaurants Section -->
  {#if !showSearchResults && data.featuredRestaurants && data.featuredRestaurants.featured_restaurants.length > 0}
    <section class="content-section featured-section">
      <div class="section-container">
        <div class="section-header" in:fly={{ y: 20, duration: 400 }}>
          <h2 class="section-title">🌟 Recomendados para ti</h2>
          <p class="section-subtitle">Descubre nuevos sabores</p>
        </div>

        <div class="featured-grid">
          {#each data.featuredRestaurants.featured_restaurants as restaurant, index (restaurant.id)}
            <div 
              in:fly={{ 
                y: isMobile ? 20 : 30, 
                duration: 400, 
                delay: index * 120,
                easing: quintOut 
              }}
            >
              <div class="featured-card">
                <div class="featured-badge">
                  <span>#{restaurant.position}</span>
                  <span class="badge-text">Recomendado</span>
                </div>
                
                <RestaurantCardCompact 
                restaurant={{
                    ...restaurant,
                    priceRange: restaurant.priceRange as "low" | "medium" | "high" | "premium" | undefined,
                    analytics: {
                      averageRating: restaurant.rating,
                      reviewsCount: restaurant.totalReviews,
                      visitsCount: 0,
                      ordersCount: 0,
                      favoritesCount: 0,
                      commentsCount: 0
                    }
                  }}
                  storeInitialized={storeInitialized}
                  on:toast={(e) => showToastMessage(e.detail.message, e.detail.type)}
                
                />
              </div>
            </div>
          {/each}
        </div>
      </div>
    </section>
  {/if}


  <!-- CTA Final Section -->
  {#if !showSearchResults}
  <section class="cta-section">
    <div class="section-container">
      <div class="cta-content" in:scale={{ duration: 500, easing: elasticOut }}>
        <h2 class="cta-title">¿Listo para descubrir más?</h2>
        <p class="cta-subtitle">
          {isMobile 
            ? 'Explora miles de opciones' 
            : 'Explora miles de restaurantes y platillos cerca de ti'}
        </p>
        <button 
          class="cta-button"
          onclick={() => window.location.href = '/buscar'}
        >
          <span>Comenzar búsqueda</span>
          <svg class="cta-arrow" width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M5 12H19M19 12L12 5M19 12L12 19" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </button>
      </div>
    </div>
  </section>
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
  .homepage {
    min-height: 100vh;
    background: var(--bg-secondary);
  }

  /* Hero Section */
  .hero-section {
    padding: var(--spacing-2xl) 0 var(--spacing-lg);
    background-image: none !important;
    position: relative;
    z-index: var(--z-dropdown);
    padding-top: 59px;
  }

  .hero-container {
    max-width: var(--container-xl);
    margin: 0 auto;
    padding: 0 var(--spacing-lg);
  }

  .hero-content {
    text-align: center;
    max-width: 600px;
    margin: 0 auto;
  }

  .hero-title {
    font-size: var(--font-6xl);
    font-weight: var(--weight-extrabold);
    color: var(--text-primary);
    margin-bottom: var(--spacing-lg);
    line-height: var(--leading-tight);
  }

  .gradient-text {
    background: var(--primary-gradient);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }

  .hero-subtitle {
    font-size: var(--font-xl);
    color: var(--text-secondary);
    margin-bottom: var(--spacing-2xl);
    line-height: var(--leading-relaxed);
  }

  .hero-cta {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: var(--spacing-2xl);
    width: 100%;
  }

  .hero-stats {
    display: flex;
    align-items: center;
    gap: var(--spacing-xl);
    backdrop-filter: var(--backdrop-blur);
    padding: var(--spacing-lg) var(--spacing-xl);
    border-radius: var(--radius-xl);
    border: 1px solid var(--bg-accent);
  }

  .stat-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: var(--spacing-xs);
  }

  .stat-number {
    font-size: var(--font-3xl);
    font-weight: var(--weight-extrabold);
    color: var(--primary-color);
  }

  .stat-label {
    font-size: var(--font-sm);
    color: var(--text-muted);
    font-weight: var(--weight-semibold);
  }

  .stat-divider {
    width: 1px;
    height: var(--spacing-2xl);
    background: var(--bg-secondary);
  }

  /* Content Sections */
  .content-section {
    padding: var(--spacing-xl) 0;
    position: relative;
    z-index: 1;
  }

  .featured-section {
    background: linear-gradient(135deg, 
      rgba(16, 185, 129, 0.03) 0%, 
      rgba(52, 211, 153, 0.02) 100%);
  }

  .section-container {
    max-width: var(--container-xl);
    margin: 0 auto;
    padding: 0 var(--spacing-lg);
  }

  .search-results-section .section-container {
    max-width: 1200px;
  }

  .section-header {
    text-align: center;
    margin-bottom: var(--spacing-xl);
    position: relative;
    z-index: 2;
  }

  .section-title {
    font-size: var(--font-4xl);
    font-weight: var(--weight-extrabold);
    color: var(--text-primary);
    margin-bottom: var(--spacing-md);
  }

  .section-subtitle {
    font-size: var(--font-lg);
    color: var(--text-secondary);
    max-width: 500px;
    margin: 0 auto;
  }

  /* Grids */
  .restaurants-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
    gap: var(--spacing-xl);
    max-width: 1200px;
    margin: 0 auto;
  }

  .dishes-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: var(--spacing-xl);
    max-width: 1200px;
    margin: 0 auto;
  }

  .featured-grid {
    display: grid;
    grid-template-columns: 1fr;
    gap: var(--spacing-2xl);
  }

  .loading-grid {
    display: grid;
    grid-template-columns: 1fr;
    gap: var(--spacing-xl);
  }

  /* Featured Cards */
  .featured-card {
    position: relative;
  }

  .featured-badge {
    position: absolute;
    top: calc(-1 * var(--spacing-xl));
    right: var(--spacing-lg);
    background: var(--success);
    color: var(--text-inverse);
    padding: var(--spacing-md) var(--spacing-lg);
    border-radius: var(--radius-lg);
    font-size: var(--font-sm);
    font-weight: var(--weight-bold);
    z-index: var(--z-popover);
    display: flex;
    align-items: center;
    gap: var(--spacing-md);
    box-shadow: var(--shadow-lg);
  }

  .badge-text {
    font-size: var(--font-xs);
  }

  /* Comments Badge */
  .commented-dish-wrapper {
    position: relative;
  }

  .comments-badge {
    position: absolute;
    top: var(--spacing-md);
    left: var(--spacing-md);
    background: rgba(59, 130, 246, 0.9);
    color: var(--text-inverse);
    padding: var(--spacing-xs) var(--spacing-md);
    border-radius: var(--radius-md);
    font-size: var(--font-sm);
    font-weight: var(--weight-semibold);
    z-index: var(--z-popover);
    display: flex;
    align-items: center;
    gap: var(--spacing-xs);
    backdrop-filter: var(--backdrop-blur);
  }

  /* Skeleton Loaders */
  .skeleton-card {
    height: 300px;
    background: var(--bg-skeleton);
    background-size: 200% 100%;
    animation: loading 1.5s infinite;
    border-radius: var(--radius-xl);
  }

  .skeleton-dish {
    height: 400px;
  }

  @keyframes loading {
    0% { background-position: 200% 0; }
    100% { background-position: -200% 0; }
  }

  /* Error and Empty States */
  .error-state, .empty-state {
    text-align: center;
    padding: var(--spacing-3xl) var(--spacing-lg);
  }

  .error-icon, .empty-icon {
    font-size: var(--font-6xl);
    margin-bottom: var(--spacing-lg);
  }

  .retry-btn {
    background: var(--primary-color);
    color: var(--text-inverse);
    border: none;
    padding: var(--spacing-md) var(--spacing-xl);
    border-radius: var(--radius-md);
    font-weight: var(--weight-semibold);
    cursor: pointer;
    margin-top: var(--spacing-lg);
    transition: all var(--transition-normal);
  }

  .retry-btn:hover {
    background: var(--primary-dark);
    transform: translateY(-1px);
  }

  /* CTA Section */
  .cta-section {
    padding: var(--spacing-4xl) 0;
    background: linear-gradient(135deg, var(--secondary-color) 0%, #1e293b 100%);
  }

  .cta-content {
    text-align: center;
    color: var(--text-inverse);
  }

  .cta-title {
    font-size: var(--font-5xl);
    font-weight: var(--weight-extrabold);
    margin-bottom: var(--spacing-lg);
  }

  .cta-subtitle {
    font-size: var(--font-xl);
    color: var(--text-light);
    margin-bottom: var(--spacing-2xl);
  }

  .cta-button {
    background: var(--primary-gradient);
    color: var(--text-inverse);
    border: none;
    border-radius: var(--radius-xl);
    padding: var(--spacing-lg) var(--spacing-2xl);
    font-size: var(--font-xl);
    font-weight: var(--weight-bold);
    cursor: pointer;
    transition: all var(--transition-normal);
    display: inline-flex;
    align-items: center;
    gap: var(--spacing-md);
    box-shadow: var(--primary-glow);
  }

  .cta-button:hover {
    transform: translateY(-2px);
    box-shadow: var(--shadow-2xl);
  }

  .cta-arrow {
    transition: transform var(--transition-normal);
  }

  .cta-button:hover .cta-arrow {
    transform: translateX(4px);
  }

  /* Responsive Design - Mobile First */
  @media (max-width: 480px) {
    .hero-title {
      font-size: var(--font-5xl);
    }

    .hero-subtitle {
      font-size: var(--font-lg);
    }

    .hero-cta {
      gap: var(--spacing-xl);
    }

    .hero-stats {
      gap: var(--spacing-lg);
      padding: var(--spacing-md) var(--spacing-lg);
      font-size: var(--font-sm);
    }

    .stat-number {
      font-size: var(--font-2xl);
    }

    .section-title {
      font-size: var(--font-3xl);
    }

    .section-subtitle {
      font-size: var(--font-sm);
    }
    
    .restaurants-grid {
      grid-template-columns: 1fr;
      max-width: 100%;
    }

    .dishes-grid {
      grid-template-columns: 1fr;
      max-width: 100%;
    }

    .search-section .restaurants-grid {
      grid-template-columns: 1fr;
      max-width: 100%;
    }

    .search-section .dishes-grid {
      grid-template-columns: 1fr;
      max-width: 100%;
    }

    .cta-title {
      font-size: var(--font-3xl);
    }

    .cta-subtitle {
      font-size: var(--font-lg);
    }

    /* Search Results Mobile */
    .search-results-header {
      flex-direction: column;
      gap: var(--spacing-md);
      text-align: center;
    }

    .search-title {
      font-size: var(--font-2xl);
    }

    .search-subtitle {
      font-size: var(--font-md);
    }

    .clear-search-btn {
      width: 100%;
      justify-content: center;
    }

    .search-section .section-title {
      font-size: var(--font-xl);
    }

    .search-section .section-subtitle {
      font-size: var(--font-sm);
    }
  }

  /* Desktop Improvements */
  @media (min-width: 768px) {
    .hero-section {
      padding: var(--spacing-4xl) 0 var(--spacing-2xl);
    }

    .restaurants-grid {
      grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
    }

    .featured-grid {
      grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
    }

    .loading-grid {
      grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
    }

    .content-section {
      padding: var(--spacing-md) 0;
    }

    .section-header {
      margin-bottom: var(--spacing-2xl);
    }
  }

  /* Large Desktop Improvements */
  @media (min-width: 1200px) {
    .restaurants-grid {
      grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
    }

    .dishes-grid {
      grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
    }

    .search-section .restaurants-grid {
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    }

    .search-section .dishes-grid {
      grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
    }
  }

  /* Search Results Section */
  .search-results-section {
    padding: var(--spacing-xl) 0;
    background: var(--bg-primary);
    border-top: 1px solid var(--bg-tertiary);
    max-width: 1200px;
    margin: 0 auto;
  }

  .search-results-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: var(--spacing-xl);
    padding: var(--spacing-lg);
    background: var(--bg-secondary);
    border-radius: var(--radius-xl);
    border: 1px solid var(--bg-accent);
  }

  .search-info {
    flex: 1;
  }

  .search-title {
    font-size: var(--font-3xl);
    font-weight: var(--weight-extrabold);
    color: var(--text-primary);
    margin-bottom: var(--spacing-sm);
  }

  .search-subtitle {
    font-size: var(--font-lg);
    color: var(--text-secondary);
  }

  .clear-search-btn {
    display: flex;
    align-items: center;
    gap: var(--spacing-sm);
    background: var(--bg-tertiary);
    border: 1px solid var(--bg-accent);
    border-radius: var(--radius-lg);
    padding: var(--spacing-md) var(--spacing-lg);
    color: var(--text-secondary);
    font-weight: var(--weight-medium);
    cursor: pointer;
    transition: all var(--transition-normal);
  }

  .clear-search-btn:hover {
    background: var(--bg-accent);
    border-color: var(--primary-color);
    color: var(--primary-color);
    transform: translateY(-1px);
  }

  .search-section {
    margin-bottom: var(--spacing-2xl);
  }

  .search-section .restaurants-grid {
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    max-width: 1000px;
  }

  .search-section .dishes-grid {
    grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
    max-width: 1000px;
  }

  .search-section .section-header {
    text-align: left;
    margin-bottom: var(--spacing-lg);
  }

  .search-section .section-title {
    font-size: var(--font-2xl);
    font-weight: var(--weight-bold);
    color: var(--text-primary);
    margin-bottom: var(--spacing-sm);
  }

  .search-section .section-subtitle {
    font-size: var(--font-md);
    color: var(--text-secondary);
    text-align: left;
  }

  .empty-search-state {
    padding: var(--spacing-3xl) var(--spacing-lg);
    text-align: center;
    max-width: 600px;
    margin: 0 auto;
  }

  .empty-card {
    background: var(--bg-secondary);
    border: 1px solid var(--bg-accent);
    border-radius: var(--radius-xl);
    padding: var(--spacing-3xl);
    max-width: 400px;
    margin: 0 auto;
  }

  .empty-icon {
    font-size: var(--font-6xl);
    margin-bottom: var(--spacing-lg);
  }

  .empty-card h3 {
    font-size: var(--font-xl);
    font-weight: var(--weight-semibold);
    color: var(--text-primary);
    margin-bottom: var(--spacing-md);
  }

  .empty-card p {
    color: var(--text-secondary);
    font-size: var(--font-md);
  }

  /* Touch device optimizations */
  @media (hover: none) and (pointer: coarse) {
    .cta-button:hover,
    .retry-btn:hover,
    .clear-search-btn:hover {
      transform: none;
    }
  }

  /* Reduced motion */
  @media (prefers-reduced-motion: reduce) {
    .cta-button,
    .retry-btn,
    .cta-arrow {
      transition: none;
    }
    
    .cta-button:hover,
    .retry-btn:hover {
      transform: none;
    }
  }
</style>