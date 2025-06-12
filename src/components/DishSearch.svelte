<script lang="ts">
  import { onMount } from 'svelte';
  //src/components/DishSearch.svelte
  // Importar el store y funciones del servicio API
  import { 
    dishRatingStore, 
    dishSearchStore, 
    dishDeviceId,
    isDishSearching,
    dishSearchResults,
    hasDishSearchResults,
    isDishRatingInitialized,
    topRatedDishes,
    rateDishAnonymously,
    canUserRateThisDish,
    getUserRatingForDish,
    commentDishAnonymously,
    canUserCommentThisDish,
    getUserCommentForDish
  } from '../stores/dishStore';
  
  import { searchDishes, fetchTopRatedDishes, fetchMostCommentedDishes } from '../services/apiDishService';
  
  import type { 
    DishSearchFilters
  } from '../interfaces/dishRating';

  // Detección de browser para Astro
  const isBrowser = typeof window !== 'undefined';

  // Estado del formulario
  let searchForm = $state({
    search: '',
    minRating: '',
    maxRating: '',
    categoryId: '',
    restaurantId: '',
    sortBy: 'rating',
    sortOrder: -1
  });

  // Valores derivados usando los stores
  let loading = $derived($isDishSearching);
  let results = $derived($dishSearchResults);
  let hasResults = $derived($hasDishSearchResults);
  let isEmpty = $derived(!results && !$dishSearchStore.error && !loading);
  let error = $derived($dishSearchStore.error);
  let storeInitialized = $derived($isDishRatingInitialized);
  let topDishes = $derived($topRatedDishes);

  // Estados para comentarios
  let showCommentForm: Record<string, boolean> = $state({});
  let commentTexts: Record<string, string> = $state({});

  // DEBUGGING: Estados adicionales para debug
  let debugInfo = $state({
    loadTopDishesCalled: false,
    loadTopDishesSuccess: false,
    loadTopDishesError: null as string | null,
    topDishesCount: 0,
    storeState: null as any,
    fetchResult: null as any
  });

  // Función de debug para mostrar estado de stores
  function logStoreStates() {
    console.log('🔍 Store states debug:');
    console.log('  - isDishSearching:', $isDishSearching);
    console.log('  - dishSearchResults:', $dishSearchResults);
    console.log('  - hasDishSearchResults:', $hasDishSearchResults);
    console.log('  - topRatedDishes:', $topRatedDishes);
    console.log('  - dishSearchStore.error:', $dishSearchStore.error);
    console.log('  - isEmpty derived:', isEmpty);
    console.log('  - loading derived:', loading);
    console.log('  - hasResults derived:', hasResults);
    
    debugInfo.storeState = {
      isDishSearching: $isDishSearching,
      dishSearchResults: $dishSearchResults,
      hasDishSearchResults: $hasDishSearchResults,
      topRatedDishes: $topRatedDishes,
      error: $dishSearchStore.error,
      isEmpty,
      loading,
      hasResults
    };
  }

  // Inicializar desde URL params y store
  onMount(async () => {
    if (isBrowser) {
      console.log('🚀 DishSearch onMount iniciado');
      
      // Inicializar el store primero
      dishRatingStore.init();
      
      // Log estado inicial
      logStoreStates();
      
      // Cargar top rated dishes inicialmente
      await loadInitialTopDishes();
      
      // Log estado después de cargar top dishes
      console.log('📊 Estado después de loadInitialTopDishes:');
      logStoreStates();
      
      // Luego inicializar desde URL
      initializeFromUrl();
    }
  });

  async function loadInitialTopDishes() {
    debugInfo.loadTopDishesCalled = true;
    debugInfo.loadTopDishesError = null;
    
    try {
      console.log('🏆 Iniciando carga de platillos mejor valorados...');
      
      // Probar primero la función directamente
      const topRated = await fetchTopRatedDishes(12, 3);
      console.log('✅ fetchTopRatedDishes exitoso:', topRated);
      console.log('📊 Datos recibidos:', {
        isArray: Array.isArray(topRated),
        length: topRated?.length,
        firstItem: topRated?.[0]
      });
      
      debugInfo.fetchResult = topRated;
      debugInfo.topDishesCount = topRated?.length || 0;
      
      // Cargar en el store
      console.log('📦 Cargando en dishSearchStore...');
      dishSearchStore.loadTopRated(topRated);
      
      debugInfo.loadTopDishesSuccess = true;
      
      // Verificar inmediatamente el estado del store
      setTimeout(() => {
        console.log('🔍 Estado del store después de loadTopRated:');
        console.log('  - topRatedDishes:', $topRatedDishes);
        console.log('  - topRatedDishes length:', $topRatedDishes?.length);
        logStoreStates();
      }, 100);
      
    } catch (error) {
      console.error('❌ Error cargando top dishes:', error);
      debugInfo.loadTopDishesError = error instanceof Error ? error.message : 'Error desconocido';
      debugInfo.loadTopDishesSuccess = false;
      
      // No fallar silenciosamente, pero tampoco bloquear la app
      dishSearchStore.loadTopRated([]);
    }
  }

  // Test manual para debugging
  async function testTopRatedDirectly() {
    console.log('🧪 Test directo de top rated dishes...');
    try {
      const result = await fetchTopRatedDishes(5, 1);
      console.log('✅ Test directo exitoso:', result);
      alert(`Test exitoso: ${result.length} platillos encontrados`);
    } catch (error) {
      console.error('❌ Test directo falló:', error);
      alert(`Test falló: ${error}`);
    }
  }

  function initializeFromUrl() {
    if (!isBrowser) return;
    
    const urlParams = new URLSearchParams(window.location.search);
    
    searchForm.search = urlParams.get('search') || '';
    searchForm.minRating = urlParams.get('minRating') || '';
    searchForm.maxRating = urlParams.get('maxRating') || '';
    searchForm.categoryId = urlParams.get('categoryId') || '';
    searchForm.restaurantId = urlParams.get('restaurantId') || '';
    searchForm.sortBy = urlParams.get('sortBy') || 'rating';
    searchForm.sortOrder = parseInt(urlParams.get('sortOrder') || '-1');

    // Solo ejecutar búsqueda automática si hay filtros de búsqueda específicos
    const hasSearchParams = urlParams.has('search') && urlParams.get('search')?.trim() ||
                           urlParams.has('minRating') && urlParams.get('minRating') ||
                           urlParams.has('maxRating') && urlParams.get('maxRating') ||
                           urlParams.has('categoryId') && urlParams.get('categoryId') ||
                           urlParams.has('restaurantId') && urlParams.get('restaurantId');
    
    if (hasSearchParams) {
      console.log('🔍 Parámetros de búsqueda detectados, ejecutando búsqueda automática');
      // Esperar a que el store esté inicializado
      setTimeout(() => handleSearch(), 100);
    }
  }

  async function handleSearch(pageNum: number = 1) {
    if (loading || !isBrowser) return;
    
    try {
      const filters: DishSearchFilters = {};
      
      if (searchForm.search.trim()) filters.search = searchForm.search.trim();
      if (searchForm.minRating) filters.minRating = parseFloat(searchForm.minRating);
      if (searchForm.maxRating) filters.maxRating = parseFloat(searchForm.maxRating);
      if (searchForm.categoryId) filters.categoryId = searchForm.categoryId;
      if (searchForm.restaurantId) filters.restaurantId = searchForm.restaurantId;
      if (searchForm.sortBy) filters.sortBy = searchForm.sortBy;
      // Convertir sortOrder a número y asegurar que sea -1 o 1
      filters.sortOrder = parseInt(searchForm.sortOrder.toString()) === 1 ? 1 : -1;

      console.log('🔍 Ejecutando búsqueda de platillos:', filters);
      
      // Usar el store para manejar el estado
      dishSearchStore.startSearch(filters, pageNum);
      
      const results = await searchDishes(filters, pageNum, 20);
      dishSearchStore.completeSearch(results);
      
      // Actualizar URL sin recargar
      updateUrl(filters, pageNum);
      
    } catch (err) {
      console.error('Error en búsqueda:', err);
      const errorMessage = err instanceof Error ? err.message : 'Error en la búsqueda';
      dishSearchStore.failSearch(errorMessage);
    }
  }

  function updateUrl(filters: DishSearchFilters, page: number = 1) {
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

  // Sistema de valoración anónima
  async function rateDish(dishId: string, rating: number) {
    if (!storeInitialized) {
      alert('Sistema de valoración no inicializado. Inténtalo de nuevo.');
      return;
    }

    if (!canUserRateThisDish(dishId)) {
      alert('Ya has valorado este platillo');
      return;
    }

    const success = await rateDishAnonymously(dishId, rating);
    
    if (success) {
      alert('¡Valoración enviada correctamente!');
    } else {
      const storeError = $dishRatingStore.lastError;
      alert(storeError || 'Error al enviar la valoración. Inténtalo de nuevo.');
    }
  }

  // Sistema de comentarios anónimos
  function toggleCommentForm(dishId: string) {
    showCommentForm[dishId] = !showCommentForm[dishId];
    if (!showCommentForm[dishId]) {
      commentTexts[dishId] = '';
    }
  }

  async function submitComment(dishId: string, rating?: number) {
    const comment = commentTexts[dishId];
    
    if (!comment || comment.trim().length < 3) {
      alert('El comentario debe tener al menos 3 caracteres');
      return;
    }

    if (!storeInitialized) {
      alert('Sistema no inicializado. Inténtalo de nuevo.');
      return;
    }

    if (!canUserCommentThisDish(dishId)) {
      alert('Ya has comentado este platillo');
      return;
    }

    const success = await commentDishAnonymously(dishId, comment.trim(), rating);
    
    if (success) {
      alert('¡Comentario enviado correctamente!');
      showCommentForm[dishId] = false;
      commentTexts[dishId] = '';
    } else {
      const storeError = $dishRatingStore.lastError;
      alert(storeError || 'Error al enviar el comentario. Inténtalo de nuevo.');
    }
  }

  function renderStars(rating: number) {
    return Array.from({ length: 5 }, (_, i) => ({
      filled: i < Math.floor(rating),
      number: i + 1
    }));
  }

  // Helper para verificar si el usuario puede valorar
  function canUserRateDish(dishId: string): boolean {
    return canUserRateThisDish(dishId);
  }

  // Helper para obtener la valoración del usuario
  function getUserRating(dishId: string): number {
    return getUserRatingForDish(dishId);
  }

  // Helper para verificar si está valorando
  function isRatingInProgress(dishId: string): boolean {
    return $dishRatingStore.ratingsInProgress[dishId] || false;
  }

  // Helper para verificar si está comentando
  function isCommentInProgress(dishId: string): boolean {
    return $dishRatingStore.commentsInProgress[dishId] || false;
  }

  // Helper para formatear precio
  function formatPrice(price: number): string {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN'
    }).format(price);
  }
</script>

<main class="search-page">
  <div class="container">
    <h1>Buscar Platillos</h1>
    
    <!-- PANEL DE DEBUG -->
    <details class="debug-panel">
      <summary>🔍 Panel de Debug</summary>
      <div class="debug-content">
        <h4>Estado de carga inicial:</h4>
        <p>loadTopDishesCalled: {debugInfo.loadTopDishesCalled}</p>
        <p>loadTopDishesSuccess: {debugInfo.loadTopDishesSuccess}</p>
        <p>loadTopDishesError: {debugInfo.loadTopDishesError || 'Ninguno'}</p>
        <p>topDishesCount: {debugInfo.topDishesCount}</p>
        
        <h4>Estados derivados:</h4>
        <p>loading: {loading}</p>
        <p>hasResults: {hasResults}</p>
        <p>isEmpty: {isEmpty}</p>
        <p>topDishes.length: {topDishes.length}</p>
        <p>error: {error || 'Ninguno'}</p>
        
        <button onclick={testTopRatedDirectly}>🧪 Test Top Rated Directo</button>
        <button onclick={logStoreStates}>📊 Log Store States</button>
        <button onclick={loadInitialTopDishes}>🔄 Recargar Top Dishes</button>
      </div>
    </details>
    
    <!-- Formulario de búsqueda -->
    <form class="search-form" onsubmit={handleSubmit}>
      <div class="search-row">
        <input 
          type="text" 
          bind:value={searchForm.search}
          placeholder="Buscar por nombre, descripción..."
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
          <label>Valoración máxima:</label>
          <select bind:value={searchForm.maxRating}>
            <option value="">Cualquiera</option>
            <option value="5.0">5.0 ⭐</option>
            <option value="4.5">4.5 ⭐</option>
            <option value="4.0">4.0 ⭐</option>
            <option value="3.5">3.5 ⭐</option>
          </select>
        </div>
        
        <div class="filter-group">
          <label>Categoría:</label>
          <input 
            type="text" 
            bind:value={searchForm.categoryId}
            placeholder="ID de categoría"
          />
        </div>
        
        <div class="filter-group">
          <label>Restaurante:</label>
          <input 
            type="text" 
            bind:value={searchForm.restaurantId}
            placeholder="ID de restaurante"
          />
        </div>
        
        <div class="filter-group">
          <label>Ordenar por:</label>
          <select bind:value={searchForm.sortBy}>
            <option value="rating">Valoración</option>
            <option value="name">Nombre</option>
            <option value="price">Precio</option>
            <option value="comments">Comentarios</option>
            <option value="favorites">Favoritos</option>
          </select>
        </div>

        <div class="filter-group">
          <label>Orden:</label>
          <select bind:value={searchForm.sortOrder}>
            <option value={-1}>Descendente (Mayor a menor)</option>
            <option value={1}>Ascendente (Menor a mayor)</option>
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
          <p>Buscando platillos...</p>
        </div>
      {/if}

      <!-- Resultados de búsqueda -->
      {#if hasResults}
        <div class="search-results">
          <div class="results-header">
            <h2>Resultados ({results?.pagination.total} platillos)</h2>
            <p>Página {results?.pagination.page} de {results?.pagination.total_pages}</p>
          </div>
          
          <div class="dishes-grid">
            {#each results?.dishes! as dish (dish.id)}
              <div class="dish-card">
                <div class="dish-image">
                  {#if dish.image}
                    <img 
                      src={dish.image} 
                      alt={dish.name}
                      loading="lazy"
                    />
                  {:else}
                    <div class="dish-icon-placeholder">
                      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M18.7 12.4C18.1 12.4 17.6 12.9 17.6 13.5V17.5C17.6 18.1 18.1 18.6 18.7 18.6S19.8 18.1 19.8 17.5V13.5C19.8 12.9 19.3 12.4 18.7 12.4Z" fill="white"/>
                        <path d="M12 2C10.9 2 10 2.9 10 4C10 5.1 10.9 6 12 6C13.1 6 14 5.1 14 4C14 2.9 13.1 2 12 2Z" fill="white"/>
                        <circle cx="12" cy="12" r="3" fill="white"/>
                      </svg>
                    </div>
                  {/if}
                </div>
                
                <div class="dish-info">
                  <h3>{dish.name}</h3>
                  <p class="description">{dish.description || ''}</p>
                  <p class="price">{formatPrice(dish.price)}</p>
                  
                  <div class="dish-meta">
                    <div class="rating">
                      <span class="stars">
                        {#each renderStars(dish.rating || 0) as star}
                          <span class="star {star.filled ? 'filled' : ''}">⭐</span>
                        {/each}
                      </span>
                      <span class="rating-value">
                        {dish.rating?.toFixed(1) || 'N/A'}
                      </span>
                      <span class="reviews-count">
                        ({dish.reviewsCount || 0} valoraciones)
                      </span>
                    </div>
                    
                    <div class="dish-details">
                      {#if dish.categoryId}
                        <span class="category-badge">Cat: {dish.categoryId}</span>
                      {/if}
                      {#if dish.favorites}
                        <span class="favorites-badge">❤️ {dish.favorites}</span>
                      {/if}
                      {#if dish.inStock === false}
                        <span class="out-of-stock">Agotado</span>
                      {/if}
                    </div>
                  </div>

                  <!-- Sistema de valoración anónima -->
                  {#if storeInitialized}
                    <div class="anonymous-rating">
                      <h4>Valorar este platillo:</h4>
                      <div class="rating-stars">
                        {#each [1, 2, 3, 4, 5] as starValue}
                          <button 
                            class="rating-star {getUserRating(dish.id!) >= starValue ? 'selected' : ''}"
                            disabled={isRatingInProgress(dish.id!) || !canUserRateDish(dish.id!)}
                            onclick={() => rateDish(dish.id!, starValue)}
                            title={!canUserRateDish(dish.id!) ? 'Ya has valorado este platillo' : `Valorar con ${starValue} estrella${starValue > 1 ? 's' : ''}`}
                          >
                            ⭐
                          </button>
                        {/each}
                      </div>
                      
                      {#if getUserRating(dish.id!)}
                        <p class="user-rating">Tu valoración: {getUserRating(dish.id!)} ⭐</p>
                      {/if}
                      
                      {#if isRatingInProgress(dish.id!)}
                        <p class="rating-loading">Enviando valoración...</p>
                      {/if}

                      {#if !canUserRateDish(dish.id!)}
                        <p class="rating-disabled">Ya has valorado este platillo</p>
                      {/if}

                      <!-- Sistema de comentarios -->
                      <div class="comments-section">
                        <button 
                          class="comment-toggle"
                          onclick={() => toggleCommentForm(dish.id!)}
                          disabled={!canUserCommentThisDish(dish.id!)}
                        >
                          {canUserCommentThisDish(dish.id!) ? '💬 Comentar' : '✅ Ya comentado'}
                        </button>

                        {#if showCommentForm[dish.id!]}
                          <div class="comment-form">
                            <textarea
                              bind:value={commentTexts[dish.id!]}
                              placeholder="Escribe tu comentario..."
                              rows="3"
                            ></textarea>
                            <div class="comment-actions">
                              <button 
                                onclick={() => submitComment(dish.id!)}
                                disabled={isCommentInProgress(dish.id!) || !commentTexts[dish.id!]?.trim()}
                              >
                                {isCommentInProgress(dish.id!) ? 'Enviando...' : 'Enviar comentario'}
                              </button>
                              <button 
                                onclick={() => toggleCommentForm(dish.id!)}
                                class="cancel"
                              >
                                Cancelar
                              </button>
                            </div>
                          </div>
                        {/if}
                      </div>
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
                  onclick={() => loadPage(results.pagination.page - 1)}
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
                  onclick={() => loadPage(results.pagination.page + 1)}
                  disabled={loading}
                >
                  Siguiente →
                </button>
              {/if}
            </div>
          {/if}
        </div>
      {/if}

      <!-- Top Dishes cuando no hay búsqueda -->
      {#if isEmpty && topDishes.length > 0}
        <div class="top-dishes">
          <div class="top-dishes-header">
            <h2>🏆 Platillos Mejor Valorados</h2>
            <p>Los platillos con las mejores valoraciones de nuestros usuarios</p>
            <small>Debug: isEmpty={isEmpty}, topDishes.length={topDishes.length}</small>
          </div>
          
          <div class="dishes-grid">
            {#each topDishes as ranking (ranking.dish?.id || ranking.id)}
              <div class="dish-card top-dish">
                <div class="position-badge">#{ranking.position}</div>
                <div class="dish-image">
                  {#if ranking.dish?.image || ranking.image}
                    <img 
                      src={ranking.dish?.image || ranking.image} 
                      alt={ranking.dish?.name || ranking.name}
                      loading="lazy"
                    />
                  {:else}
                    <div class="dish-icon-placeholder">
                      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M18.7 12.4C18.1 12.4 17.6 12.9 17.6 13.5V17.5C17.6 18.1 18.1 18.6 18.7 18.6S19.8 18.1 19.8 17.5V13.5C19.8 12.9 19.3 12.4 18.7 12.4Z" fill="white"/>
                        <path d="M12 2C10.9 2 10 2.9 10 4C10 5.1 10.9 6 12 6C13.1 6 14 5.1 14 4C14 2.9 13.1 2 12 2Z" fill="white"/>
                        <circle cx="12" cy="12" r="3" fill="white"/>
                      </svg>
                    </div>
                  {/if}
                </div>
                
                <div class="dish-info">
                  <h3>{ranking.dish?.name || ranking.name}</h3>
                  <p class="description">{ranking.dish?.description || ranking.description}</p>
                  <p class="price">{formatPrice(ranking.dish?.price || ranking.price)}</p>
                  
                  <div class="dish-meta">
                    <div class="rating">
                      <span class="stars">
                        {#each renderStars(ranking.rating) as star}
                          <span class="star {star.filled ? 'filled' : ''}">⭐</span>
                        {/each}
                      </span>
                      <span class="rating-value">{ranking.rating.toFixed(1)}</span>
                      <span class="reviews-count">({ranking.totalRatings || ranking.total_ratings} valoraciones)</span>
                    </div>
                  </div>
                </div>
              </div>
            {/each}
          </div>
        </div>
      {/if}

      <!-- Debug: mostrar estado cuando isEmpty pero no hay topDishes -->
      {#if isEmpty && topDishes.length === 0}
        <div class="empty-state">
          <p>Usa el formulario arriba para buscar platillos por nombre, valoración, categoría y más.</p>
          <div class="debug-empty-state">
            <h4>🔍 Debug Estado Vacío:</h4>
            <p>isEmpty: {isEmpty}</p>
            <p>topDishes.length: {topDishes.length}</p>
            <p>loading: {loading}</p>
            <p>hasResults: {hasResults}</p>
            <p>error: {error || 'null'}</p>
            <p>loadTopDishesSuccess: {debugInfo.loadTopDishesSuccess}</p>
            <p>loadTopDishesError: {debugInfo.loadTopDishesError || 'null'}</p>
          </div>
        </div>
      {/if}
    </div>
  </div>
</main>

<style>
  /* Todos los estilos anteriores igual... */
  .search-page {
    padding: 20px 0;
  }

  .container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 0 20px;
  }

  /* Agregar estilos para debug */
  .debug-panel {
    background: #f8f9fa;
    border: 1px solid #dee2e6;
    border-radius: 5px;
    padding: 15px;
    margin-bottom: 20px;
  }

  .debug-panel summary {
    cursor: pointer;
    font-weight: bold;
    color: #495057;
  }

  .debug-content {
    margin-top: 15px;
    font-family: monospace;
    font-size: 12px;
  }

  .debug-content h4 {
    margin: 15px 0 5px 0;
    color: #495057;
  }

  .debug-content p {
    margin: 3px 0;
    color: #6c757d;
  }

  .debug-content button {
    margin: 5px 5px 5px 0;
    padding: 5px 10px;
    background: #007bff;
    color: white;
    border: none;
    border-radius: 3px;
    cursor: pointer;
    font-size: 11px;
  }

  .debug-content button:hover {
    background: #0056b3;
  }

  .debug-empty-state {
    background: #fff3cd;
    border: 1px solid #ffeaa7;
    border-radius: 5px;
    padding: 15px;
    margin-top: 20px;
    font-family: monospace;
    font-size: 12px;
  }

  .debug-empty-state h4 {
    margin: 0 0 10px 0;
    color: #856404;
  }

  .debug-empty-state p {
    margin: 3px 0;
    color: #856404;
  }

  /* Resto de estilos igual que antes... */
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
    grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
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

  .filter-group select,
  .filter-group input {
    padding: 8px;
    border: 1px solid #ddd;
    border-radius: 5px;
  }

  .dishes-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
    gap: 20px;
  }

  .dish-card {
    background: white;
    border-radius: 10px;
    overflow: hidden;
    box-shadow: 0 2px 10px rgba(0,0,0,0.1);
    transition: transform 0.2s ease;
    position: relative;
  }

  .dish-card:hover {
    transform: translateY(-5px);
  }

  .dish-card.top-dish {
    border: 2px solid #ffd700;
  }

  .position-badge {
    position: absolute;
    top: 10px;
    left: 10px;
    background: #ffd700;
    color: #333;
    padding: 5px 10px;
    border-radius: 15px;
    font-weight: bold;
    font-size: 14px;
    z-index: 1;
  }

  .dish-image img {
    width: 100%;
    height: 200px;
    object-fit: cover;
  }

  .dish-icon-placeholder {
    width: 100%;
    height: 200px;
    background: #e5e5e5;
    display: flex;
    align-items: center;
    justify-content: center;
    border-bottom: 1px solid #e9ecef;
  }

  .dish-icon-placeholder svg {
    opacity: 0.6;
  }

  .dish-info {
    padding: 15px;
  }

  .dish-info h3 {
    margin: 0 0 10px 0;
    color: #333;
  }

  .description {
    color: #666;
    font-size: 14px;
    margin-bottom: 10px;
    line-height: 1.4;
  }

  .price {
    font-size: 18px;
    font-weight: bold;
    color: #ff6b35;
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

  .dish-details {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    align-items: center;
    margin-bottom: 15px;
  }

  .category-badge,
  .favorites-badge {
    background: #e9ecef;
    padding: 4px 8px;
    border-radius: 12px;
    font-size: 12px;
    font-weight: bold;
  }

  .out-of-stock {
    background: #dc3545;
    color: white;
    padding: 4px 8px;
    border-radius: 12px;
    font-size: 12px;
    font-weight: bold;
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

  /* Sistema de comentarios */
  .comments-section {
    margin-top: 15px;
  }

  .comment-toggle {
    background: #007bff;
    color: white;
    border: none;
    padding: 8px 12px;
    border-radius: 5px;
    cursor: pointer;
    font-size: 12px;
    transition: background-color 0.2s ease;
  }

  .comment-toggle:hover:not(:disabled) {
    background: #0056b3;
  }

  .comment-toggle:disabled {
    background: #6c757d;
    cursor: not-allowed;
  }

  .comment-form {
    margin-top: 10px;
    padding: 10px;
    background: #f8f9fa;
    border-radius: 5px;
  }

  .comment-form textarea {
    width: 100%;
    border: 1px solid #ddd;
    border-radius: 3px;
    padding: 8px;
    font-family: inherit;
    resize: vertical;
    margin-bottom: 10px;
  }

  .comment-actions {
    display: flex;
    gap: 10px;
  }

  .comment-actions button {
    padding: 6px 12px;
    border: none;
    border-radius: 3px;
    cursor: pointer;
    font-size: 12px;
    transition: background-color 0.2s ease;
  }

  .comment-actions button:not(.cancel) {
    background: #28a745;
    color: white;
  }

  .comment-actions button:not(.cancel):hover:not(:disabled) {
    background: #1e7e34;
  }

  .comment-actions button.cancel {
    background: #6c757d;
    color: white;
  }

  .comment-actions button.cancel:hover {
    background: #545b62;
  }

  .comment-actions button:disabled {
    background: #ccc;
    cursor: not-allowed;
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

  .results-header,
  .top-dishes-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
  }

  .results-header h2,
  .top-dishes-header h2 {
    margin: 0;
  }

  .results-header p,
  .top-dishes-header p {
    margin: 0;
    color: #666;
  }

  .top-dishes {
    margin-top: 30px;
  }

  .top-dishes-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
  }

  /* Responsive */
  @media (max-width: 768px) {
    .search-row {
      flex-direction: column;
    }
    
    .dishes-grid {
      grid-template-columns: 1fr;
    }
    
    .results-header,
    .top-dishes-header {
      flex-direction: column;
      align-items: flex-start;
      gap: 10px;
    }
    
    .pagination {
      flex-direction: column;
      gap: 15px;
    }

    .dish-card {
      margin: 0 10px;
    }
  }
</style>