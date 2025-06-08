<script>
  // components/EnhancedDynamicMenu.svelte
  import { onMount, afterUpdate } from 'svelte';
  import { fade, fly, scale } from 'svelte/transition';
  import { quintOut, elasticOut } from 'svelte/easing';
  import { flip } from 'svelte/animate';
  import EnhancedDishCard from './Cards/EnhancedDishCard.svelte';
  import SkeletonLoader from './SkeletonLoader.svelte';
  
  // Importación para analíticas
  import { recordView, initDishViewObserver, trackCategoryInteraction } from '../services/analyticsService';
  
  // Props
  export let categories = [];
  export let initialCategoryId = '';
  export let storeMode = false;
  export let dishes = [];
  export let modelCard = 'enhanced';
  
  // Estado local
  let currentCategoryId = initialCategoryId;
  let currentDishes = [];
  let isFirstLoad = true;
  let isChanging = false;
  let isGridView = true;
  let searchQuery = '';
  let sortBy = 'name'; // name, price, rating, popularity
  let sortOrder = 'asc'; // asc, desc
  let filterBy = 'all'; // all, available, featured
  let observer;
  let dishContainer;
  
  // Estados de la UI
  let showFilters = false;
  let showSortOptions = false;
  let viewMode = 'grid'; // grid, list, compact
  
  // Configuración de vista
  const gridConfig = {
    cols: {
      default: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
      compact: 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4',
      list: 'grid-cols-1'
    }
  };
  
  // Computed properties
  $: filteredAndSortedDishes = filterAndSortDishes(currentDishes, searchQuery, sortBy, sortOrder, filterBy);
  $: currentCategory = categories.find(cat => cat.id === currentCategoryId);
  $: gridClasses = gridConfig.cols[viewMode] || gridConfig.cols.default;
  
  // Función para filtrar y ordenar platillos
  function filterAndSortDishes(dishes, search, sort, order, filter) {
    let filtered = [...dishes];
    
    // Aplicar filtro de búsqueda
    if (search.trim()) {
      filtered = filtered.filter(dish => 
        dish.name.toLowerCase().includes(search.toLowerCase()) ||
        (dish.description && dish.description.toLowerCase().includes(search.toLowerCase())) ||
        (dish.tags && dish.tags.some(tag => tag.toLowerCase().includes(search.toLowerCase())))
      );
    }
    
    // Aplicar filtros adicionales
    switch (filter) {
      case 'available':
        filtered = filtered.filter(dish => dish.inStock !== false);
        break;
      case 'featured':
        filtered = filtered.filter(dish => dish.isSpecial || dish.isFeatured);
        break;
      default:
        break;
    }
    
    // Aplicar ordenamiento
    filtered.sort((a, b) => {
      let comparison = 0;
      
      switch (sort) {
        case 'name':
          comparison = a.name.localeCompare(b.name);
          break;
        case 'price':
          comparison = (a.price || 0) - (b.price || 0);
          break;
        case 'rating':
          comparison = (a.rating || 0) - (b.rating || 0);
          break;
        case 'popularity':
          comparison = (a.reviewCount || 0) - (b.reviewCount || 0);
          break;
        default:
          comparison = 0;
      }
      
      return order === 'desc' ? -comparison : comparison;
    });
    
    return filtered;
  }
  
  // Función para actualizar platillos basado en la categoría seleccionada
  async function updateDishes(categoryId) {
    if (isChanging) return;
    
    isChanging = true;
    
    // Analytics tracking
    if (!isFirstLoad && categoryId) {
      trackCategoryInteraction(categoryId);
    }
    
    // Pequeña pausa para animaciones
    if (!isFirstLoad) {
      await new Promise(resolve => setTimeout(resolve, 200));
    }
    
    // Filtrar platillos por categoría
    if (categoryId) {
      currentDishes = dishes.filter(dish => dish.categoryId === categoryId);
      
      // Enriquecer datos para modo tienda
      if (storeMode) {
        currentDishes = currentDishes.map((dish, index) => ({
          ...dish,
          inStock: dish.inStock !== undefined ? dish.inStock : Math.random() > 0.1,
          isSpecial: dish.isSpecial || (index % 7 === 0),
          reviewCount: dish.reviewCount || Math.floor(Math.random() * 100) + 5,
          rating: dish.rating || (Math.random() * 2 + 3), // Rating entre 3-5
          tags: dish.tags || generateTags(dish)
        }));
      }
    } else {
      currentDishes = [];
    }
    
    isFirstLoad = false;
    isChanging = false;
    
    // Configurar observadores después de actualizar
    setTimeout(() => {
      setupDishObservers();
      scrollToTop();
    }, 300);
  }
  
  // Generar tags automáticamente
  function generateTags(dish) {
    const tags = [];
    const name = dish.name.toLowerCase();
    
    if (name.includes('picante') || name.includes('spicy')) tags.push('picante');
    if (name.includes('vegano') || name.includes('vegan')) tags.push('vegano');
    if (name.includes('vegetariano')) tags.push('vegetariano');
    if (name.includes('gluten free') || name.includes('sin gluten')) tags.push('sin-gluten');
    if (dish.price && dish.price < 100) tags.push('económico');
    if (dish.rating && dish.rating > 4.5) tags.push('favorito');
    
    return tags.slice(0, 3); // Máximo 3 tags
  }
  
  // Configurar observadores de intersección
  function setupDishObservers() {
    if (typeof IntersectionObserver === 'undefined') return;
    
    if (observer) {
      observer.disconnect();
    }
    
    observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const dishId = entry.target.getAttribute('data-dish-id');
          if (dishId) {
            // Tracking de vista de platillo
            window.dispatchEvent(new CustomEvent('dishViewed', {
              detail: {
                dishId,
                categoryId: currentCategoryId,
                timestamp: Date.now(),
                viewMode,
                searchQuery
              }
            }));
          }
        }
      });
    }, {
      threshold: 0.3,
      rootMargin: '0px 0px -10% 0px'
    });
    
    // Observar todas las cartas de platillos
    document.querySelectorAll('[data-dish-id]').forEach(card => {
      observer.observe(card);
    });
  }
  
  // Scroll suave al inicio de la sección
  function scrollToTop() {
    if (dishContainer) {
      dishContainer.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'start' 
      });
    }
  }
  
  // Manejar cambio de vista
  function handleViewChange(newView) {
    viewMode = newView;
    
    window.dispatchEvent(new CustomEvent('viewModeChanged', {
      detail: {
        viewMode: newView,
        categoryId: currentCategoryId,
        timestamp: Date.now()
      }
    }));
  }
  
  // Manejar búsqueda
  function handleSearch(event) {
    searchQuery = event.target.value;
    
    // Debounce para evitar demasiadas operaciones
    clearTimeout(window.searchTimeout);
    window.searchTimeout = setTimeout(() => {
      window.dispatchEvent(new CustomEvent('dishSearched', {
        detail: {
          query: searchQuery,
          categoryId: currentCategoryId,
          resultCount: filteredAndSortedDishes.length,
          timestamp: Date.now()
        }
      }));
    }, 500);
  }
  
  // Lifecycle hooks
  onMount(() => {
    // Inicializar con delay para mejor UX
    setTimeout(() => {
      if (initialCategoryId) {
        updateDishes(initialCategoryId);
      } else if (categories.length > 0) {
        currentCategoryId = categories[0].id;
        updateDishes(currentCategoryId);
      }
    }, 100);
    
    // Escuchar eventos de cambio de categoría
    document.addEventListener('categoryChange', handleCategoryChange);
    
    // Cleanup
    return () => {
      document.removeEventListener('categoryChange', handleCategoryChange);
      if (observer) observer.disconnect();
    };
  });
  
  function handleCategoryChange(event) {
    const { category } = event.detail;
    if (category !== currentCategoryId) {
      currentCategoryId = category;
      updateDishes(category);
    }
  }
</script>

<!-- Search and Filter Bar -->
<div class="menu-controls" class:show-filters={showFilters}>
  <div class="controls-container">
    <!-- Search Bar -->
    <div class="search-container">
      <div class="search-input-wrapper">
        <svg class="search-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          type="text"
          placeholder="Buscar platillos..."
          bind:value={searchQuery}
          on:input={handleSearch}
          class="search-input"
        />
        {#if searchQuery}
          <button class="clear-search" on:click={() => searchQuery = ''}>
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        {/if}
      </div>
    </div>
    
    <!-- View Controls -->
    <div class="view-controls">
      <button 
        class="view-btn"
        class:active={viewMode === 'grid'}
        on:click={() => handleViewChange('grid')}
        title="Vista en cuadrícula"
      >
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
        </svg>
      </button>
      <button 
        class="view-btn"
        class:active={viewMode === 'list'}
        on:click={() => handleViewChange('list')}
        title="Vista en lista"
      >
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 10h16M4 14h16M4 18h16" />
        </svg>
      </button>
    </div>
    
    <!-- Filter and Sort -->
    <div class="filter-sort-controls">
      <div class="dropdown" class:open={showSortOptions}>
        <button 
          class="dropdown-btn"
          on:click={() => showSortOptions = !showSortOptions}
        >
          <span>Ordenar por</span>
          <svg class="w-4 h-4 transition-transform" class:rotate-180={showSortOptions} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        
        {#if showSortOptions}
          <div class="dropdown-menu" transition:scale={{ duration: 200, easing: quintOut }}>
            <button on:click={() => { sortBy = 'name'; showSortOptions = false; }}>Nombre</button>
            <button on:click={() => { sortBy = 'price'; showSortOptions = false; }}>Precio</button>
            <button on:click={() => { sortBy = 'rating'; showSortOptions = false; }}>Valoración</button>
            <button on:click={() => { sortBy = 'popularity'; showSortOptions = false; }}>Popularidad</button>
          </div>
        {/if}
      </div>
      
      <button class="filter-btn" on:click={() => showFilters = !showFilters}>
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.707A1 1 0 013 7V4z" />
        </svg>
        Filtros
      </button>
    </div>
  </div>
  
  <!-- Expanded Filters -->
  {#if showFilters}
    <div class="filters-panel" transition:fly={{ y: -20, duration: 300 }}>
      <div class="filter-groups">
        <div class="filter-group">
          <label>Disponibilidad:</label>
          <select bind:value={filterBy}>
            <option value="all">Todos los platillos</option>
            <option value="available">Solo disponibles</option>
            <option value="featured">Platillos destacados</option>
          </select>
        </div>
        
        <div class="filter-group">
          <label>Orden:</label>
          <select bind:value={sortOrder}>
            <option value="asc">Ascendente</option>
            <option value="desc">Descendente</option>
          </select>
        </div>
      </div>
    </div>
  {/if}
</div>

<!-- Main Menu Container -->
<div class="menu-container" bind:this={dishContainer}>
  <!-- Category Header -->
  {#if currentCategory && !isChanging}
    <div class="category-header" in:fade={{ duration: 400, delay: 200 }}>
      <div class="category-info">
        <h2 class="category-title">{currentCategory.name}</h2>
        {#if currentCategory.description}
          <p class="category-description">{currentCategory.description}</p>
        {/if}
        <div class="category-stats">
          <span class="dish-count">{filteredAndSortedDishes.length} platillos</span>
          {#if searchQuery}
            <span class="search-results">en "{searchQuery}"</span>
          {/if}
        </div>
      </div>
    </div>
  {/if}
  
  <!-- Loading State -->
  {#if isChanging || isFirstLoad}
    <div class="loading-container" in:fade={{ duration: 300 }} out:fade={{ duration: 200 }}>
      <SkeletonLoader count={6} />
    </div>
  {:else}
    <!-- Dishes Grid -->
    <div class="dishes-grid {gridClasses}" id="category-{currentCategoryId}">
      {#each filteredAndSortedDishes as dish, index (dish.id)}
        <div 
          animate:flip={{ duration: 400, easing: quintOut }}
          in:fly={{ y: 30, duration: 400, delay: index * 50, easing: quintOut }}
          out:scale={{ duration: 200 }}
          class="dish-wrapper"
          data-dish-id={dish.id}
        >
          <EnhancedDishCard {dish} {index} {storeMode} />
        </div>
      {/each}
    </div>
    
    <!-- Empty State -->
    {#if filteredAndSortedDishes.length === 0}
      <div class="empty-state" in:fade={{ duration: 400, delay: 200 }}>
        <div class="empty-content">
          <svg class="empty-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6-4h6m2 5.291A7.962 7.962 0 0112 15c-2.220 0-4.240-.90-5.709-2.364C6.774 11.846 7.000 11 7.500 11h9c.500 0 .726.846 1.209 1.636z" />
          </svg>
          <h3 class="empty-title">
            {searchQuery ? 'No se encontraron platillos' : 'No hay platillos disponibles'}
          </h3>
          <p class="empty-description">
            {searchQuery 
              ? `No encontramos platillos que coincidan con "${searchQuery}". Intenta con otro término.`
              : 'Esta categoría aún no tiene platillos disponibles.'
            }
          </p>
          {#if searchQuery}
            <button class="clear-search-btn" on:click={() => searchQuery = ''}>
              Limpiar búsqueda
            </button>
          {/if}
        </div>
      </div>
    {/if}
  {/if}
</div>

<!-- Progress Indicator -->
<div class="progress-indicator" class:active={isChanging && !isFirstLoad}>
  <div class="progress-bar"></div>
</div>

<style>
  .menu-controls {
    position: sticky;
    top: 80px;
    z-index: 30;
    background: rgba(255, 255, 255, 0.95);
    backdrop-filter: blur(20px);
    border-bottom: 1px solid rgba(229, 231, 235, 0.5);
    transition: all 0.3s ease;
  }
  
  .controls-container {
    display: flex;
    align-items: center;
    gap: 1rem;
    padding: 1rem;
    max-width: 1200px;
    margin: 0 auto;
    flex-wrap: wrap;
  }
  
  .search-container {
    flex: 1;
    min-width: 280px;
  }
  
  .search-input-wrapper {
    position: relative;
    display: flex;
    align-items: center;
  }
  
  .search-icon {
    position: absolute;
    left: 12px;
    width: 20px;
    height: 20px;
    color: #9ca3af;
    pointer-events: none;
  }
  
  .search-input {
    width: 100%;
    padding: 12px 16px 12px 44px;
    border: 2px solid #e5e7eb;
    border-radius: 12px;
    font-size: 14px;
    background: white;
    transition: all 0.3s ease;
  }
  
  .search-input:focus {
    outline: none;
    border-color: #667eea;
    box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
  }
  
  .clear-search {
    position: absolute;
    right: 12px;
    padding: 4px;
    background: none;
    border: none;
    color: #9ca3af;
    cursor: pointer;
    border-radius: 4px;
    transition: color 0.2s ease;
  }
  
  .clear-search:hover {
    color: #6b7280;
  }
  
  .view-controls {
    display: flex;
    gap: 4px;
    background: #f3f4f6;
    padding: 4px;
    border-radius: 10px;
  }
  
  .view-btn {
    padding: 8px 12px;
    border: none;
    background: transparent;
    border-radius: 6px;
    cursor: pointer;
    transition: all 0.2s ease;
    color: #6b7280;
  }
  
  .view-btn.active {
    background: white;
    color: #667eea;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  }
  
  .filter-sort-controls {
    display: flex;
    gap: 8px;
    align-items: center;
  }
  
  .dropdown {
    position: relative;
  }
  
  .dropdown-btn {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 10px 16px;
    background: white;
    border: 2px solid #e5e7eb;
    border-radius: 8px;
    cursor: pointer;
    font-size: 14px;
    font-weight: 500;
    transition: all 0.2s ease;
  }
  
  .dropdown-btn:hover {
    border-color: #d1d5db;
  }
  
  .dropdown-menu {
    position: absolute;
    top: 100%;
    right: 0;
    background: white;
    border: 1px solid #e5e7eb;
    border-radius: 8px;
    box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15);
    z-index: 50;
    min-width: 150px;
    overflow: hidden;
  }
  
  .dropdown-menu button {
    width: 100%;
    padding: 12px 16px;
    text-align: left;
    background: none;
    border: none;
    font-size: 14px;
    cursor: pointer;
    transition: background-color 0.2s ease;
  }
  
  .dropdown-menu button:hover {
    background: #f9fafb;
  }
  
  .filter-btn {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 10px 16px;
    background: white;
    border: 2px solid #e5e7eb;
    border-radius: 8px;
    cursor: pointer;
    font-size: 14px;
    font-weight: 500;
    transition: all 0.2s ease;
  }
  
  .filter-btn:hover {
    border-color: #d1d5db;
  }
  
  .filters-panel {
    border-top: 1px solid #e5e7eb;
    padding: 1rem;
    background: #f9fafb;
  }
  
  .filter-groups {
    display: flex;
    gap: 2rem;
    max-width: 1200px;
    margin: 0 auto;
  }
  
  .filter-group {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
  
  .filter-group label {
    font-size: 14px;
    font-weight: 600;
    color: #374151;
  }
  
  .filter-group select {
    padding: 8px 12px;
    border: 1px solid #d1d5db;
    border-radius: 6px;
    background: white;
    font-size: 14px;
  }
  
  .menu-container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 2rem 1rem;
  }
  
  .category-header {
    margin-bottom: 2rem;
    text-align: center;
  }
  
  .category-title {
    font-size: 2.5rem;
    font-weight: 800;
    color: #1f2937;
    margin-bottom: 0.5rem;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }
  
  .category-description {
    font-size: 1.125rem;
    color: #6b7280;
    margin-bottom: 1rem;
    max-width: 600px;
    margin-left: auto;
    margin-right: auto;
  }
  
  .category-stats {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 1rem;
    font-size: 0.875rem;
    color: #9ca3af;
  }
  
  .dish-count {
    font-weight: 600;
  }
  
  .search-results {
    font-style: italic;
  }
  
  .loading-container {
    padding: 2rem 0;
  }
  
  .dishes-grid {
    display: grid;
    gap: 2rem;
    margin-bottom: 3rem;
  }
  
  .dish-wrapper {
    will-change: transform;
  }
  
  .empty-state {
    text-align: center;
    padding: 4rem 2rem;
  }
  
  .empty-content {
    max-width: 400px;
    margin: 0 auto;
  }
  
  .empty-icon {
    width: 4rem;
    height: 4rem;
    color: #d1d5db;
    margin: 0 auto 1.5rem;
  }
  
  .empty-title {
    font-size: 1.5rem;
    font-weight: 700;
    color: #374151;
    margin-bottom: 0.5rem;
  }
  
  .empty-description {
    color: #6b7280;
    margin-bottom: 1.5rem;
    line-height: 1.6;
  }
  
  .clear-search-btn {
    padding: 12px 24px;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    border: none;
    border-radius: 8px;
    font-weight: 600;
    cursor: pointer;
    transition: transform 0.2s ease;
  }
  
  .clear-search-btn:hover {
    transform: translateY(-2px);
  }
  
  .progress-indicator {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 3px;
    background: rgba(229, 231, 235, 0.3);
    z-index: 100;
    opacity: 0;
    transition: opacity 0.3s ease;
  }
  
  .progress-indicator.active {
    opacity: 1;
  }
  
  .progress-bar {
    height: 100%;
    background: linear-gradient(90deg, #667eea, #764ba2);
    width: 30%;
    animation: progress 1s ease-in-out infinite;
  }
  
  @keyframes progress {
    0% { transform: translateX(-100%); }
    100% { transform: translateX(400%); }
  }
  
  /* Responsive Design */
  @media (max-width: 768px) {
    .controls-container {
      flex-direction: column;
      gap: 1rem;
    }
    
    .search-container {
      width: 100%;
      min-width: auto;
    }
    
    .filter-sort-controls {
      width: 100%;
      justify-content: space-between;
    }
    
    .filter-groups {
      flex-direction: column;
      gap: 1rem;
    }
    
    .category-title {
      font-size: 2rem;
    }
    
    .dishes-grid {
      gap: 1.5rem;
    }
    
    .menu-container {
      padding: 1rem;
    }
  }
  
  /* Dark mode support */
  @media (prefers-color-scheme: dark) {
    .menu-controls {
      background: rgba(31, 41, 55, 0.95);
      border-bottom-color: rgba(75, 85, 99, 0.5);
    }
    
    .search-input,
    .dropdown-btn,
    .filter-btn {
      background: #374151;
      border-color: #4b5563;
      color: #f9fafb;
    }
    
    .dropdown-menu {
      background: #374151;
      border-color: #4b5563;
    }
    
    .filters-panel {
      background: #1f2937;
      border-top-color: #374151;
    }
    
    .category-title {
      color: #f9fafb;
    }
  }
</style>