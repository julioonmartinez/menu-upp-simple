<script lang="ts">
  // HomePage.svelte - Página de inicio con contenido destacado
  import { onMount } from 'svelte';
  import { fly, fade, scale } from 'svelte/transition';
  import { quintOut, elasticOut } from 'svelte/easing';
  
  // Componentes
  import RestaurantCard from './RestaurantCard.svelte';
  import CardDishSvelte from './Cards/CardDishSvelte.svelte';
  import Toast from './Toast.svelte';
  import HeroSearchBox from './HeroSearchBox.svelte';
  
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

  // Estados del componente usando Svelte 5 runes
  let loading = $state({
    topRestaurants: true,
    topDishes: true,
    featuredRestaurants: true,
    mostCommentedDishes: true
  });
  
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
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    // Inicializar stores
    ratingStore.init();
    dishRatingStore.init();
    
    // Cargar datos iniciales
    loadAllData();
    
    return () => {
      window.removeEventListener('resize', checkMobile);
    };
  });

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
      
      const topDishes = await fetchTopRatedDishes(8, 3);
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
  function transformRestaurantRanking(ranking: RestaurantRanking): Restaurant {
    const restaurant = ranking.restaurant;
    return {
      ...restaurant,
      // Asegurar que priceRange sea del tipo correcto
      priceRange: restaurant.priceRange as "low" | "medium" | "high" | "premium" | undefined,
      // Agregar analytics si no existen
      analytics: {
        averageRating: ranking.rating,
        reviewsCount: ranking.totalReviews,
        visitsCount: 0,
        ordersCount: 0,
        favoritesCount: 0,
        commentsCount: 0
      }
    };
  }

  // Función para transformar DishRanking a Dish
  function transformDishRanking(ranking: DishRanking): Dish {
    const dish = ranking.dish;
    return {
      ...dish,
      // Propiedades requeridas que faltan
      rating: ranking.rating,
      favorites: 0, // Valor por defecto
      reviewsCount: ranking.totalRatings,
      userRating: 0,
      userFav: false,
      inStock: true,
      // Propiedades opcionales
      categoryId: dish.categoryId || '',
      image: dish.image || '',
      nutritionalInfo: undefined,
      options: undefined,
      discount: undefined
    };
  }

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
          {isMobile 
            ? 'Los mejores restaurantes y platillos cerca de ti' 
            : 'Explora los mejores restaurantes y platillos valorados por nuestra comunidad'}
        </p>
        
        <div class="hero-cta" in:fly={{ y: 20, duration: 500, delay: 200 }}>
          <!-- Búsqueda directa con autocomplete -->
          <HeroSearchBox {isMobile} />
          
          <div class="hero-stats" in:fade={{ duration: 400, delay: 400 }}>
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
          </div>
        </div>
      </div>
    </div>
  </section>

  <!-- Top Rated Restaurants Section -->
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
              <RestaurantCard 
                restaurant={transformRestaurantRanking(restaurant)}
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

  <!-- Top Rated Dishes Section -->
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
          {#each data.topDishes as dishRanking, index (dishRanking.dish?.id)}
            <div 
              in:fly={{ 
                y: isMobile ? 15 : 25, 
                duration: 350, 
                delay: index * 75,
                easing: quintOut 
              }}
            >
              <CardDishSvelte 
                item={transformDishRanking(dishRanking)}
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

  <!-- Featured Restaurants Section -->
  {#if data.featuredRestaurants && data.featuredRestaurants.featured_restaurants.length > 0}
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
                <RestaurantCard 
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

  <!-- Most Commented Dishes Section -->
  {#if data.mostCommentedDishes.length > 0}
    <section class="content-section">
      <div class="section-container">
        <div class="section-header" in:fly={{ y: 20, duration: 400 }}>
          <h2 class="section-title">💬 Más comentados</h2>
          <p class="section-subtitle">Los platillos que generan más conversación</p>
        </div>

        <div class="dishes-grid">
          {#each data.mostCommentedDishes as dishRanking, index (dishRanking.dish?.id)}
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
                  item={transformDishRanking(dishRanking)}
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

  <!-- CTA Final Section -->
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
    background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 50%, #e2e8f0 100%);
  }

  /* Hero Section */
  .hero-section {
    padding: 2rem 0 3rem;
    background: linear-gradient(135deg, 
      rgba(255, 107, 53, 0.05) 0%, 
      rgba(255, 140, 105, 0.03) 50%, 
      transparent 100%);
    position: relative;
    z-index: 10; /* Por debajo del dropdown pero por encima del contenido */
  }

  .hero-container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 0 1rem;
  }

  .hero-content {
    text-align: center;
    max-width: 600px;
    margin: 0 auto;
  }

  .hero-title {
    font-size: 2.5rem;
    font-weight: 800;
    color: #0D1B2A;
    margin-bottom: 1rem;
    line-height: 1.1;
  }

  .gradient-text {
    background: linear-gradient(135deg, var(--primary-color, #ff6b35) 0%, #ff8c69 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }

  .hero-subtitle {
    font-size: 1.1rem;
    color: #64748b;
    margin-bottom: 2rem;
    line-height: 1.6;
  }

  .hero-cta {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 2rem;
    width: 100%;
  }

  .hero-stats {
    display: flex;
    align-items: center;
    gap: 1.5rem;
    background: rgba(255, 255, 255, 0.8);
    backdrop-filter: blur(10px);
    padding: 1rem 1.5rem;
    border-radius: 16px;
    border: 1px solid rgba(226, 232, 240, 0.6);
  }

  .stat-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.25rem;
  }

  .stat-number {
    font-size: 1.5rem;
    font-weight: 800;
    color: var(--primary-color, #ff6b35);
  }

  .stat-label {
    font-size: 0.8rem;
    color: #64748b;
    font-weight: 600;
  }

  .stat-divider {
    width: 1px;
    height: 2rem;
    background: #e2e8f0;
  }

  /* Content Sections */
  .content-section {
    padding: 3rem 0;
    position: relative;
    z-index: 1; /* Asegurar que esté por debajo del dropdown */
  }

  .featured-section {
    background: linear-gradient(135deg, 
      rgba(16, 185, 129, 0.03) 0%, 
      rgba(52, 211, 153, 0.02) 100%);
  }

  .section-container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 0 1rem;
  }

  .section-header {
    text-align: center;
    margin-bottom: 2.5rem;
    position: relative;
    z-index: 2; /* Por debajo del dropdown */
  }

  .section-title {
    font-size: 1.75rem;
    font-weight: 800;
    color: #0D1B2A;
    margin-bottom: 0.5rem;
  }

  .section-subtitle {
    font-size: 1rem;
    color: #64748b;
    max-width: 500px;
    margin: 0 auto;
  }

  /* Grids */
  .restaurants-grid {
    display: grid;
    grid-template-columns: 1fr;
    gap: 1.5rem;
  }

  .dishes-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
    gap: 1.5rem;
  }

  .featured-grid {
    display: grid;
    grid-template-columns: 1fr;
    gap: 2rem;
  }

  .loading-grid {
    display: grid;
    grid-template-columns: 1fr;
    gap: 1.5rem;
  }

  /* Featured Cards */
  .featured-card {
    position: relative;
  }

  .featured-badge {
    position: absolute;
    top: -8px;
    right: 1rem;
    background: linear-gradient(135deg, #10b981 0%, #34d399 100%);
    color: white;
    padding: 0.5rem 1rem;
    border-radius: 12px;
    font-size: 0.8rem;
    font-weight: 700;
    z-index: 10;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
  }

  .badge-text {
    font-size: 0.7rem;
  }

  /* Comments Badge */
  .commented-dish-wrapper {
    position: relative;
  }

  .comments-badge {
    position: absolute;
    top: 8px;
    left: 8px;
    background: rgba(59, 130, 246, 0.9);
    color: white;
    padding: 0.25rem 0.5rem;
    border-radius: 8px;
    font-size: 0.75rem;
    font-weight: 600;
    z-index: 10;
    display: flex;
    align-items: center;
    gap: 0.25rem;
    backdrop-filter: blur(10px);
  }

  /* Skeleton Loaders */
  .skeleton-card {
    height: 300px;
    background: linear-gradient(90deg, #f0f2f5 25%, #e4e6ea 50%, #f0f2f5 75%);
    background-size: 200% 100%;
    animation: loading 1.5s infinite;
    border-radius: 16px;
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
    padding: 3rem 1rem;
  }

  .error-icon, .empty-icon {
    font-size: 3rem;
    margin-bottom: 1rem;
  }

  .retry-btn {
    background: var(--primary-color, #ff6b35);
    color: white;
    border: none;
    padding: 0.75rem 1.5rem;
    border-radius: 8px;
    font-weight: 600;
    cursor: pointer;
    margin-top: 1rem;
    transition: all 0.3s ease;
  }

  .retry-btn:hover {
    background: #e55a2b;
    transform: translateY(-1px);
  }

  /* CTA Section */
  .cta-section {
    padding: 4rem 0;
    background: linear-gradient(135deg, #0D1B2A 0%, #1e293b 100%);
  }

  .cta-content {
    text-align: center;
    color: white;
  }

  .cta-title {
    font-size: 2rem;
    font-weight: 800;
    margin-bottom: 1rem;
  }

  .cta-subtitle {
    font-size: 1.1rem;
    color: #94a3b8;
    margin-bottom: 2rem;
  }

  .cta-button {
    background: linear-gradient(135deg, var(--primary-color, #ff6b35) 0%, #ff8c69 100%);
    color: white;
    border: none;
    border-radius: 16px;
    padding: 1rem 2rem;
    font-size: 1.1rem;
    font-weight: 700;
    cursor: pointer;
    transition: all 0.3s ease;
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    box-shadow: 0 4px 20px rgba(255, 107, 53, 0.3);
  }

  .cta-button:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 30px rgba(255, 107, 53, 0.4);
  }

  .cta-arrow {
    transition: transform 0.3s ease;
  }

  .cta-button:hover .cta-arrow {
    transform: translateX(4px);
  }

  /* Responsive Design - Mobile First */
  @media (max-width: 480px) {
    .hero-title {
      font-size: 2rem;
    }

    .hero-subtitle {
      font-size: 1rem;
    }

    .hero-cta {
      gap: 1.5rem;
    }

    .hero-stats {
      gap: 1rem;
      padding: 0.875rem 1rem;
      font-size: 0.9rem;
    }

    .stat-number {
      font-size: 1.25rem;
    }

    .section-title {
      font-size: 1.5rem;
    }

    .section-subtitle {
      font-size: 0.9rem;
    }

    .dishes-grid {
      grid-template-columns: 1fr;
    }

    .cta-title {
      font-size: 1.5rem;
    }

    .cta-subtitle {
      font-size: 1rem;
    }
  }

  /* Desktop Improvements */
  @media (min-width: 768px) {
    .hero-section {
      padding: 4rem 0 5rem;
    }

    .restaurants-grid {
      grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
    }

    .featured-grid {
      grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
    }

    .loading-grid {
      grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
    }

    .content-section {
      padding: 4rem 0;
    }

    .section-header {
      margin-bottom: 3rem;
    }
  }
</style>