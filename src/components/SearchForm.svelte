<script lang="ts">
  import { createEventDispatcher, onMount } from 'svelte';
  import { fade, fly, scale } from 'svelte/transition';
  import { quintOut } from 'svelte/easing';
  
  import type { RestaurantSearchFilters } from '../interfaces/restaurantRating';
  import type { DishSearchFilters } from '../interfaces/dishRating';

  // Props
  const { 
    loading, 
    initialFilters, 
    placeholder = 'Buscar...',
    searchType = 'restaurants',
    compact = false,
    searchTypes = [],
    onSearchTypeChange
  } = $props<{
    loading: boolean;
    initialFilters: RestaurantSearchFilters | DishSearchFilters;
    placeholder?: string;
    searchType?: 'restaurants' | 'dishes' | 'routes';
    compact?: boolean;
    searchTypes?: Array<{
      id: 'restaurants' | 'dishes' | 'routes';
      label: string;
      icon: string;
      placeholder: string;
      description: string;
    }>;
    onSearchTypeChange?: (type: 'restaurants' | 'dishes' | 'routes') => void;
  }>();

  // Dispatcher
  const dispatch = createEventDispatcher<{
    search: RestaurantSearchFilters | DishSearchFilters
  }>();

  // Estado del formulario
  let searchForm = $state({
    search: '',
    minRating: '',
    maxRating: '',
    sortBy: 'rating',
    sortOrder: -1,
    showAdvancedFilters: false,
    // Campos específicos de restaurantes
    cuisineType: '',
    priceRange: '',
    // Campos específicos de platillos
    categoryId: '',
    restaurantId: ''
  });

  // Estados de interacción
  let isFormFocused = $state(false);
  let searchInputElement: HTMLInputElement;
  let isMobile = $state(false);

  // Detectar móvil
  onMount(() => {
    const checkMobile = () => {
      isMobile = window.innerWidth < 768;
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    initializeFromFilters();

    return () => window.removeEventListener('resize', checkMobile);
  });

  function initializeFromFilters() {
    if (initialFilters) {
      searchForm.search = initialFilters.search || '';
      searchForm.minRating = initialFilters.minRating?.toString() || '';
      searchForm.maxRating = initialFilters.maxRating?.toString() || '';
      searchForm.sortBy = initialFilters.sortBy || 'rating';
      searchForm.sortOrder = initialFilters.sortOrder || -1;

      if (searchType === 'restaurants') {
        const restaurantFilters = initialFilters as RestaurantSearchFilters;
        searchForm.cuisineType = restaurantFilters.cuisineType || '';
        searchForm.priceRange = restaurantFilters.priceRange || '';
      } else if (searchType === 'dishes') {
        const dishFilters = initialFilters as DishSearchFilters;
        searchForm.categoryId = dishFilters.categoryId || '';
        searchForm.restaurantId = dishFilters.restaurantId || '';
      }
    }
  }

  function buildFilters(): RestaurantSearchFilters | DishSearchFilters {
    const baseFilters: any = {};
    
    if (searchForm.search.trim()) baseFilters.search = searchForm.search.trim();
    if (searchForm.minRating) baseFilters.minRating = parseFloat(searchForm.minRating);
    if (searchForm.maxRating) baseFilters.maxRating = parseFloat(searchForm.maxRating);
    if (searchForm.sortBy) baseFilters.sortBy = searchForm.sortBy;
    baseFilters.sortOrder = parseInt(searchForm.sortOrder.toString()) === 1 ? 1 : -1;

    if (searchType === 'restaurants') {
      if (searchForm.cuisineType) baseFilters.cuisineType = searchForm.cuisineType;
      if (searchForm.priceRange) baseFilters.priceRange = searchForm.priceRange;
      return baseFilters as RestaurantSearchFilters;
    } else if (searchType === 'dishes') {
      if (searchForm.categoryId) baseFilters.categoryId = searchForm.categoryId;
      if (searchForm.restaurantId) baseFilters.restaurantId = searchForm.restaurantId;
      return baseFilters as DishSearchFilters;
    }

    return baseFilters;
  }

  function handleSubmit(event: Event) {
    event.preventDefault();
    const filters = buildFilters();
    console.log('🔍 Ejecutando búsqueda:', { searchType, filters });
    dispatch('search', filters);
  }

  function clearFilters() {
    searchForm = {
      search: '',
      minRating: '',
      maxRating: '',
      sortBy: 'rating',
      sortOrder: -1,
      showAdvancedFilters: false,
      cuisineType: '',
      priceRange: '',
      categoryId: '',
      restaurantId: ''
    };
  }

  function toggleAdvancedFilters() {
    searchForm.showAdvancedFilters = !searchForm.showAdvancedFilters;
  }

  function handleInputFocus() {
    isFormFocused = true;
  }

  function handleInputBlur() {
    isFormFocused = false;
  }

  const getContextualSuggestions = () => {
    if (compact) return []; // No mostrar sugerencias en modo compacto
    
    switch (searchType) {
      case 'dishes':
        return [
          { emoji: '🍕', text: 'Pizza' },
          { emoji: '🍣', text: 'Sushi' },
          { emoji: '🍔', text: 'Hamburguesa' },
          { emoji: '🌮', text: 'Tacos' }
        ];
      default:
        return [
          { emoji: '🍕', text: 'Pizza' },
          { emoji: '🍔', text: 'Hamburguesas' },
          { emoji: '🍜', text: 'Ramen' },
          { emoji: '🌮', text: 'Mexicana' }
        ];
    }
  };

  function handlePopularSearch(search: string) {
    searchForm.search = search;
    handleSubmit(new Event('submit'));
  }

  const activeFiltersCount = $derived(() => {
    const baseFilters = [
      searchForm.minRating,
      searchForm.maxRating
    ].filter(Boolean).length;

    if (searchType === 'restaurants') {
      return baseFilters + [
        searchForm.cuisineType,
        searchForm.priceRange
      ].filter(Boolean).length;
    } else if (searchType === 'dishes') {
      return baseFilters + [
        searchForm.categoryId,
        searchForm.restaurantId
      ].filter(Boolean).length;
    }

    return baseFilters;
  });

  const dynamicPlaceholder = $derived(() => placeholder || 'Buscar...');

  const getSortOptions = () => {
    switch (searchType) {
      case 'dishes':
        return [
          { value: 'rating', label: '⭐ Valoración' },
          { value: 'name', label: '📝 Nombre' },
          { value: 'price', label: '💰 Precio' }
        ];
      case 'restaurants':
        return [
          { value: 'rating', label: '⭐ Valoración' },
          { value: 'name', label: '📝 Nombre' },
          { value: 'analytics.reviewsCount', label: '💬 Reseñas' }
        ];
      default:
        return [
          { value: 'rating', label: '⭐ Valoración' },
          { value: 'name', label: '📝 Nombre' }
        ];
    }
  };

  $effect(() => {
    if (searchType) {
      searchForm.cuisineType = '';
      searchForm.priceRange = '';
      searchForm.categoryId = '';
      searchForm.restaurantId = '';
      initializeFromFilters();
    }
  });
</script>

<div class="search-form-container" class:focused={isFormFocused} class:compact>
  <!-- Navegación de tipos (solo si no es compacto y hay tipos disponibles) -->
  {#if !compact && searchTypes.length > 0 && onSearchTypeChange}
    <div class="search-navigation" in:fly={{ y: 20, duration: 400, delay: 100, easing: quintOut }}>
       <!-- Logo/Brand -->
      <a 
        class="brand-button"
        href="/"
        aria-label="Ir a inicio"
      >
        <div class="brand-logo">
          <span class="brand-text">Menu</span><span class="brand-accent">Upp</span>
        </div>
      </a>
      
      <div class="nav-tabs">
        {#each searchTypes as type, index}
          <button
            class="nav-tab"
            class:active={searchType === type.id}
            onclick={() => onSearchTypeChange?.(type.id)}
            in:fly={{ x: -20, duration: 400, delay: index * 80 }}
          >
            <span class="tab-icon">{type.icon}</span>
            <span class="tab-label">{type.label}</span>
          </button>
        {/each}
      </div>

      <div class="nav-buttons">
       <a
          class="btn btn-ghost"
          title="Favoritos"
          aria-label="Ver favoritos"
          href="/favorites"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M20.84 4.61C20.3292 4.099 19.7228 3.69364 19.0554 3.41708C18.3879 3.14052 17.6725 2.99817 16.95 2.99817C16.2275 2.99817 15.5121 3.14052 14.8446 3.41708C14.1772 3.69364 13.5708 4.099 13.06 4.61L12 5.67L10.94 4.61C9.9083 3.5783 8.50903 2.9987 7.05 2.9987C5.59096 2.9987 4.19169 3.5783 3.16 4.61C2.1283 5.6417 1.5487 7.04097 1.5487 8.5C1.5487 9.95903 2.1283 11.3583 3.16 12.39L4.22 13.45L12 21.23L19.78 13.45L20.84 12.39C21.351 11.8792 21.7563 11.2728 22.0329 10.6053C22.3095 9.93789 22.4518 9.22248 22.4518 8.5C22.4518 7.77752 22.3095 7.06211 22.0329 6.39467C21.7563 5.72723 21.351 5.1208 20.84 4.61V4.61Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </a>
      </div>
    </div>
  {/if}

  <form 
    class="search-form" 
    class:mobile={isMobile}
    class:compact
    onsubmit={handleSubmit}
  >
    <!-- Búsqueda principal -->
    <div class="search-main" class:compact>
      <div class="search-input-section" class:compact>
        <div class="search-input-wrapper" class:focused={isFormFocused} class:compact>
          <div class="search-icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M21 21L16.514 16.506L21 21ZM19 10.5C19 15.194 15.194 19 10.5 19C5.806 19 2 15.194 2 10.5C2 5.806 5.806 2 10.5 2C15.194 2 19 5.806 19 10.5Z" 
                    stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </div>
          
          <input 
            bind:this={searchInputElement}
            type="text" 
            bind:value={searchForm.search}
            placeholder={dynamicPlaceholder()}
            class="search-input"
            class:compact
            onfocus={handleInputFocus}
            onblur={handleInputBlur}
          />
          
          {#if searchForm.search}
            <button 
              type="button" 
              class="clear-search-btn btn btn-secondary btn-sm btn-rounded"
              onclick={() => searchForm.search = ''}
              in:scale={{ duration: 200 }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </button>
          {/if}
        </div>
        
        <!-- Búsquedas populares (solo si no es compacto) -->
        {#if !compact}
          <div class="popular-searches-quick">
            {#each getContextualSuggestions() as search, index}
              <button 
                type="button"
                class="popular-quick-btn"
                onclick={() => handlePopularSearch(search.text)}
                style="--delay: {index * 50}ms"
              >
                <span class="popular-emoji">{search.emoji}</span>
                <span class="popular-text">{search.text}</span>
              </button>
            {/each}
          </div>
        {/if}
      </div>

      <div class="search-actions" class:compact>
        <!-- Botón de filtros avanzados -->
        <button 
          type="button"
          class="filters-btn btn btn-secondary"
          class:compact
          onclick={toggleAdvancedFilters}
          class:active={searchForm.showAdvancedFilters}
          class:has-filters={activeFiltersCount() > 0}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M3 4.6C3 4.03995 3 3.75992 3.10899 3.54601C3.20487 3.35785 3.35785 3.20487 3.54601 3.10899C3.75992 3 4.03995 3 4.6 3H19.4C19.9601 3 20.2401 3 20.454 3.10899C20.6422 3.20487 20.7951 3.35785 20.891 3.54601C21 3.75992 21 4.03995 21 4.6V6.33726C21 6.58185 21 6.70414 20.9724 6.81923C20.9479 6.92127 20.9075 7.01881 20.8526 7.10828C20.7908 7.2092 20.7043 7.29568 20.5314 7.46863L14.4686 13.5314C14.2957 13.7043 14.2092 13.7908 14.1474 13.8917C14.0925 13.9812 14.0521 14.0787 14.0276 14.1808C14 14.2959 14 14.4182 14 14.6627V17L10 21V14.6627C10 14.4182 10 14.2959 9.97237 14.1808C9.94787 14.0787 9.90747 13.9812 9.85264 13.8917C9.7908 13.7908 9.70432 13.7043 9.53137 13.5314L3.46863 7.46863C3.29568 7.29568 3.2092 7.2092 3.14736 7.10828C3.09253 7.01881 3.05213 6.92127 3.02763 6.81923C3 6.70414 3 6.58185 3 6.33726V4.6Z" 
                  stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
          {#if !compact || !isMobile}
            <span>Filtros</span>
          {/if}
          {#if activeFiltersCount() > 0}
            <span class="filters-count">{activeFiltersCount()}</span>
          {/if}
        </button>

        <!-- Botón de búsqueda -->
        <button 
          type="submit" 
          class="search-btn btn btn-primary"
          class:compact
          disabled={loading}
          class:loading
        >
          {#if loading}
            <div class="search-btn-spinner"></div>
          {:else}
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M21 21L16.514 16.506L21 21ZM19 10.5C19 15.194 15.194 19 10.5 19C5.806 19 2 15.194 2 10.5C2 5.806 5.806 2 10.5 2C15.194 2 19 5.806 19 10.5Z" 
                    stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
            {#if !compact || !isMobile}
              Buscar
            {/if}
          {/if}
        </button>
      </div>
    </div>

    <!-- Filtros avanzados -->
    {#if searchForm.showAdvancedFilters}
      <div 
        class="advanced-filters"
        class:compact
        in:fly={{ y: -20, duration: 350, easing: quintOut }}
        out:fly={{ y: -20, duration: 250, easing: quintOut }}
      >
        <div class="filters-grid" class:mobile-grid={isMobile} class:compact>
          <!-- Valoración -->
          <div class="filter-group">
            <label class="filter-label">⭐ Valoración</label>
            <select bind:value={searchForm.minRating} class="filter-select">
              <option value="">Cualquiera</option>
              <option value="4.5">4.5+ ⭐⭐⭐⭐⭐</option>
              <option value="4.0">4.0+ ⭐⭐⭐⭐</option>
              <option value="3.5">3.5+ ⭐⭐⭐</option>
              <option value="3.0">3.0+</option>
            </select>
          </div>

          <!-- Filtros específicos para restaurantes -->
          {#if searchType === 'restaurants'}
            <div class="filter-group">
              <label class="filter-label">🍽️ Cocina</label>
              <select bind:value={searchForm.cuisineType} class="filter-select">
                <option value="">Todos</option>
                <option value="mexicana">🌮 Mexicana</option>
                <option value="italiana">🍝 Italiana</option>
                <option value="asiática">🍜 Asiática</option>
                <option value="americana">🍔 Americana</option>
                <option value="japonesa">🍣 Japonesa</option>
              </select>
            </div>

            <div class="filter-group">
              <label class="filter-label">💰 Precio</label>
              <select bind:value={searchForm.priceRange} class="filter-select">
                <option value="">Cualquiera</option>
                <option value="low">💵 Económico</option>
                <option value="medium">💶 Medio</option>
                <option value="high">💷 Alto</option>
              </select>
            </div>
          {/if}

          <!-- Filtros específicos para platillos -->
          {#if searchType === 'dishes'}
            <div class="filter-group">
              <label class="filter-label">🏷️ Categoría</label>
              <input 
                type="text" 
                bind:value={searchForm.categoryId}
                placeholder="ID de categoría"
                class="filter-input"
              />
            </div>

            <div class="filter-group">
              <label class="filter-label">🏪 Restaurante</label>
              <input 
                type="text" 
                bind:value={searchForm.restaurantId}
                placeholder="ID de restaurante"
                class="filter-input"
              />
            </div>
          {/if}

          <!-- Ordenar -->
          <div class="filter-group">
            <label class="filter-label">📊 Ordenar</label>
            <select bind:value={searchForm.sortBy} class="filter-select">
              {#each getSortOptions() as option}
                <option value={option.value}>{option.label}</option>
              {/each}
            </select>
          </div>

          <!-- Orden -->
          <div class="filter-group">
            <label class="filter-label">🔄 Orden</label>
            <select bind:value={searchForm.sortOrder} class="filter-select">
              <option value={-1}>Descendente ↓</option>
              <option value={1}>Ascendente ↑</option>
            </select>
          </div>
        </div>

        <!-- Acciones de filtros -->
        <div class="filter-actions">
          <button 
            type="button" 
            class="clear-btn btn btn-ghost"
            onclick={clearFilters}
            disabled={activeFiltersCount() === 0}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M3 6H21M8 6V4C8 3.44772 8.44772 3 9 3H15C15.5523 3 16 3.44772 16 4V6M19 6V20C19 20.5523 18.4477 21 18 21H6C5.44772 21 5 20.5523 5 20V6H19Z" 
                    stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
            Limpiar
          </button>
          
          <button 
            type="submit" 
            class="apply-btn btn btn-primary"
            disabled={loading}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M20 6L9 17L4 12" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
            Aplicar filtros
          </button>
        </div>
      </div>
    {/if}
  </form>
</div>

<style>
  .search-form-container {
    width: 100%;
    /* max-width: 900px; */
    margin: 0 auto;
    transition: all 0.3s ease;
    padding-bottom: 0.5rem;
  }

  .search-form-container.compact {
    max-width: 1000px;
  }
   

  /* Navegación de tipos */
  .search-navigation {
    margin-bottom: 0.5rem;
    display: grid;
    grid-template-columns:  1fr 2fr 1fr;
    align-items: center;
    padding: 1rem 0rem 0.5rem 0;
  }
  /* Brand */
  .brand-button {
    background: none;
    border: none;
    cursor: pointer;
    padding: 0.5rem;
    transition: all 0.3s ease;
    border-radius: 8px;
  }

  .brand-button:hover {
    background: rgba(255, 107, 53, 0.1);
  }

  .brand-logo {
    display: flex;
    align-items: center;
    font-size: 1.5rem;
    font-weight: 800;
  }

  .brand-text {
    color: var(--text-primary);
  }

  .brand-accent {
    color: var(--primary-color, #ff6b35);
  }

  .nav-tabs {
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 0;
    background: var(--bg-glass);
    backdrop-filter: blur(20px);
    border-radius: 999px;
    padding: 0.3rem;
    border: var(--bg-accent);
    /* max-width: 380px; */
    margin: 0 auto;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.06);
  }

  .nav-tab {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
     padding: 0.6rem 0.75rem;
    border: none;
    background: transparent;
    color: var(--text-muted);
    /* font-weight: 400; */
    font-size: 0.9rem;
    border-radius: 999px;
    cursor: pointer;
    transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
    position: relative;
    overflow: hidden;
  }

  @media (max-width: 768px) {
    .nav-tab {
      padding: 0.6rem 0.75rem;
      font-size: 0.8rem;
      gap: 6px;
      /* flex-direction: column; */
    }

    .nav-tabs {
      max-width: 100%;
      padding: 6px;
    }
  }

  .nav-tab:hover {
    /* color: var(--text-sedondary);
    background: var(--bg-surface);
    transform: translateY(-2px); */
  }

  .nav-tab.active {
    background: var(--primary-color);
    color: white;
    /* box-shadow: 0 6px 20px rgba(255, 107, 53, 0.3); */
    /* transform: translateY(-1px) scale(1.02); */
  }

  .tab-icon {
    font-size: 1.2rem;
    transition: transform 0.3s ease;
  }

  .nav-tab.active .tab-icon {
    /* transform: scale(1.1); */
  }

  .tab-label {
    white-space: nowrap;
    font-weight: 700;
  }

  .nav-buttons{
    display: flex;
    justify-content: flex-end;
    gap: 0.5rem;
  }

  /* Formulario principal */
  .search-form {
    background: var(--bg-primary);
    border-radius: 20px;
    border: 1px solid var(--bg-glass);
    overflow: hidden;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.08);
    transition: all 0.3s ease;
    backdrop-filter: blur(10px);
    max-width: 850px;
    margin:  0 auto;
  }

  .search-form.compact {
    border-radius: 16px;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  }

  .search-form-container.focused .search-form {
    border-color: var(--primary-color, #ff6b35);
    box-shadow: 0 12px 40px rgba(255, 107, 53, 0.15);
    transform: translateY(-2px);
  }

  .search-form-container.compact.focused .search-form {
    transform: translateY(-1px);
  }

  .search-main {
    padding: 24px;
    display: flex;
    gap: 20px;
    align-items: flex-start;
  }

  .search-main.compact {
    padding: 16px 20px;
    gap: 16px;
  }

  .search-input-section {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 16px;
    min-width: 0;
  }

  .search-input-section.compact {
    gap: 0;
  }

  .search-input-wrapper {
    position: relative;
    display: flex;
    align-items: center;
    background: var(--bg-secondary);
    border: 2px solid var(--bg-accent);
    border-radius: 16px;
    padding: 0 20px;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    min-height: 56px;
    overflow: hidden;
  }

  .search-input-wrapper.compact {
    min-height: 48px;
    border-radius: 12px;
    padding: 0 16px;
  }

  .search-input-wrapper.focused {
    background: var(--bg-accent);
    border-color: var(--primary-color, #ff6b35);
    box-shadow: 0 0 0 4px rgba(255, 107, 53, 0.1);
    transform: scale(1.02);
  }

  .search-input-wrapper.compact.focused {
    transform: scale(1.01);
  }

  .search-icon {
    color: #64748b;
    margin-right: 16px;
    display: flex;
    align-items: center;
    transition: all 0.3s ease;
    flex-shrink: 0;
  }

  .search-input-wrapper.focused .search-icon {
    color: var(--primary-color, #ff6b35);
    transform: scale(1.1);
  }

  .search-input {
    flex: 1;
    border: none;
    background: transparent;
    font-size: 1.1rem;
    color: var(--text-primary);
    outline: none;
    padding: 0;
    font-weight: 500;
  }

  .search-input.compact {
    font-size: 1rem;
  }

  .search-input::placeholder {
    color: var(--text-light);
    font-weight: 400;
  }

  .clear-search-btn {
   
  }

  .clear-search-btn:hover {
  
  }

  .popular-searches-quick {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
    align-items: center;
  }

  .popular-quick-btn {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 8px 14px;
    background: var(--bg-tertiary);
    border: 1px solid var(--bg-accent);
    border-radius: 24px;
    color: var(--text-secondary);
    font-size: 0.85rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    animation: slideIn 0.5s ease forwards;
    animation-delay: var(--delay, 0ms);
    opacity: 0;
  }

  @keyframes slideIn {
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  .popular-quick-btn:hover {
    background: var(--primary-color, #ff6b35);
    color: white;
    border-color: var(--primary-color, #ff6b35);
    transform: translateY(-2px) scale(1.05);
    box-shadow: var(--primary-glow);
  }

  .search-actions {
    display: flex;
    flex-direction: column;
    gap: 12px;
    flex-shrink: 0;
  }

  .search-actions.compact {
    flex-direction: row;
    gap: 8px;
  }

  .filters-btn {
    /* display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    padding: 14px 18px;
    background: var(--bg-tertiary);
    border: 1px solid var(--bg-accent);
    border-radius: 12px;
    color: var(--text-muted);
    font-weight: 600;
    font-size: 0.9rem;
    cursor: pointer;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    min-height: 48px;
    position: relative;
    overflow: hidden; */
  }

  .filters-btn.compact {
    /* padding: 12px 16px;
    min-height: 44px; */
  }

  .filters-btn:hover,
  .filters-btn.active {
    /* background: linear-gradient(135deg, #0D1B2A, #1e293b); */
    /* color: white; */
    /* border-color: #0D1B2A; */
    /* transform: translateY(-2px); */
    /* box-shadow: 0 8px 20px rgba(13, 27, 42, 0.2); */
  }

  .filters-btn.has-filters {
    /* background: linear-gradient(135deg, var(--primary-color, #ff6b35), #ff8c69);
    color: white;
    border-color: var(--primary-color, #ff6b35); */
  }

  .filters-count {
    position: absolute;
    top: -6px;
    right: -6px;
    background: var(--primary-color);
    color: white;
    border-radius: 50%;
    width: 22px;
    height: 22px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 0.7rem;
    font-weight: 700;
    border: 2px solid white;
  }

  .search-btn {
    /* background: linear-gradient(135deg, var(--primary-color, #ff6b35) 0%, #ff8c69 100%);
    color: white;
    border: none;
    border-radius: 14px;
    padding: 14px 22px;
    font-weight: 700;
    font-size: 1rem;
    cursor: pointer;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
    min-height: 56px;
    position: relative; */
    /* overflow:visible; */
  }

  .search-btn.compact {
    /* min-height: 48px;
    padding: 12px 20px; */
  }

  .search-btn:not(:disabled):hover {
    transform: translateY(-3px) scale(1.05);
    box-shadow: 0 12px 30px rgba(255, 107, 53, 0.4);
  }

  .search-btn:disabled {
    opacity: 0.7;
    cursor: not-allowed;
    transform: none;
  }

  .search-btn.loading {
    color: transparent;
  }

  .search-btn-spinner {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 22px;
    height: 22px;
    border: 2px solid #ffffff4d;
    border-top: 2px solid white;
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }

  @keyframes spin {
    0% { transform: translate(-50%, -50%) rotate(0deg); }
    100% { transform: translate(-50%, -50%) rotate(360deg); }
  }

  /* Filtros avanzados */
  .advanced-filters {
    border-top: 1px solid var(--bg-secondary);
    padding: 24px;
    background: var(--bg-primary);
  }

  .advanced-filters.compact {
    padding: 20px;
  }

  .filters-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
    gap: 20px;
    margin-bottom: 24px;
  }

  .filters-grid.compact {
    gap: 16px;
    margin-bottom: 20px;
  }

  .filters-grid.mobile-grid {
    grid-template-columns: 1fr 1fr;
    gap: 16px;
  }

  .filter-group {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  .filter-label {
    font-weight: 700;
    color: var(--text-primary);
    font-size: 0.9rem;
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .filter-select,
  .filter-input {
    padding: 12px 16px;
    border: 1px solid var(--bg-accent);
    border-radius: 10px;
    background: var(--bg-primary);
    font-size: 0.9rem;
    color: var(--text-primary);
    cursor: pointer;
    transition: all 0.3s ease;
  }

  .filter-select {
    appearance: none;
    background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='m6 8 4 4 4-4'/%3e%3c/svg%3e");
    background-position: right 12px center;
    background-repeat: no-repeat;
    background-size: 16px;
    padding-right: 40px;
  }

  .filter-select:focus,
  .filter-input:focus {
    outline: none;
    border-color: var(--primary-color, #ff6b35);
    box-shadow: 0 0 0 3px rgba(255, 107, 53, 0.1);
    transform: scale(1.02);
  }

  .filter-input::placeholder {
    color: #9ca3af;
  }

  .filter-actions {
    display: flex;
    gap: 16px;
    justify-content: flex-end;
    padding-top: 24px;
    border-top: 1px solid var(--bg-accent);
  }

  .clear-btn,
  .apply-btn {
    /* padding: 12px 24px;
    border-radius: 10px;
    font-weight: 600;
    font-size: 0.9rem;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 8px;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    min-height: 44px; */
  }

  .clear-btn {
    /* background: var(--bg-secondary);
    border: 1px solid #e2e8f0;
    color: var(--text-muted); */
  }

  .clear-btn:hover:not(:disabled) {
    /* border-color: #cbd5e1;
    color: #475569;
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1); */
  }

  .clear-btn:disabled {
    /* opacity: 0.5;
    cursor: not-allowed; */
  }

  .apply-btn {
    /* background: linear-gradient(135deg, #0D1B2A, #1e293b);
    color: white;
    border: none; */
    /* flex: 1;
    justify-content: center;
    max-width: 220px; */
  }

  .apply-btn:hover:not(:disabled) {
    /* transform: translateY(-2px) scale(1.02);
    box-shadow: 0 8px 20px rgba(13, 27, 42, 0.3); */
  }

  .apply-btn:disabled {
    /* opacity: 0.6;
    cursor: not-allowed;
    transform: none; */
  }

  /* Responsive */
  @media (max-width: 768px) {
    .search-form-container {
      max-width: none;
    }

    .search-main {
      flex-direction: column;
      padding: 20px;
      gap: 16px;
    }

    .search-main.compact {
      flex-direction: row;
      padding: 12px 16px;
      gap: 12px;
    }

    .search-actions {
      flex-direction: row;
      width: 100%;
    }

    .search-actions.compact {
      width: auto;
    }

    .filters-btn,
    .search-btn {
      flex: 1;
      min-height: 52px;
    }

    .filters-btn.compact,
    .search-btn.compact {
      flex: none;
      min-height: 44px;
    }

    .filter-actions {
      flex-direction: column;
      gap: 12px;
    }

    .clear-btn,
    .apply-btn {
      max-width: none;
    }

    .search-input-wrapper {
      min-height: 52px;
    }

    .search-input-wrapper.compact {
      min-height: 44px;
    }
    .search-navigation{
      display: flex;
    }
    .nav-tabs{
      margin: 0;
      width: 100%;
    }
    .nav-buttons{
      display: none;
    }
    .brand-button{
      display: none;
    }
  }

  @media (max-width: 480px) {
    .filters-grid.mobile-grid {
      grid-template-columns: 1fr;
    }

    .search-input {
      font-size: 16px;
    }
  }

  /* Prefers reduced motion */
  @media (prefers-reduced-motion: reduce) {
    .search-form-container.focused .search-form,
    .search-input-wrapper.focused,
    .popular-quick-btn:hover,
    .filters-btn:hover,
    .search-btn:hover {
      transform: none;
      animation: none;
    }

    .popular-quick-btn {
      opacity: 1;
      animation: none;
    }
  }
</style>