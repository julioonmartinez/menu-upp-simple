<script lang="ts">
  import { createEventDispatcher, onMount } from 'svelte';
  import { fade, fly, scale } from 'svelte/transition';
  import { quintOut } from 'svelte/easing';
  
  import type { RestaurantSearchFilters } from '../interfaces/restaurantRating';

  // Props
  const { loading, initialFilters } = $props<{
    loading: boolean;
    initialFilters: RestaurantSearchFilters;
  }>();

  // Dispatcher
  const dispatch = createEventDispatcher<{
    search: RestaurantSearchFilters
  }>();

  // Estado del formulario más compacto
  let searchForm = $state({
    search: '',
    minRating: '',
    maxRating: '',
    cuisineType: '',
    priceRange: '',
    sortBy: 'rating',
    sortOrder: -1,
    showAdvancedFilters: false
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
    
    if (initialFilters) {
      searchForm.search = initialFilters.search || '';
      searchForm.minRating = initialFilters.minRating?.toString() || '';
      searchForm.maxRating = initialFilters.maxRating?.toString() || '';
      searchForm.cuisineType = initialFilters.cuisineType || '';
      searchForm.priceRange = initialFilters.priceRange || '';
      searchForm.sortBy = initialFilters.sortBy || 'rating';
      searchForm.sortOrder = initialFilters.sortOrder || -1;
    }

    return () => window.removeEventListener('resize', checkMobile);
  });

  function handleSubmit(event: Event) {
    event.preventDefault();
    
    const filters: RestaurantSearchFilters = {};
    
    if (searchForm.search.trim()) filters.search = searchForm.search.trim();
    if (searchForm.minRating) filters.minRating = parseFloat(searchForm.minRating);
    if (searchForm.maxRating) filters.maxRating = parseFloat(searchForm.maxRating);
    if (searchForm.cuisineType) filters.cuisineType = searchForm.cuisineType;
    if (searchForm.priceRange) filters.priceRange = searchForm.priceRange;
    if (searchForm.sortBy) filters.sortBy = searchForm.sortBy;
    filters.sortOrder = searchForm.sortOrder;

    dispatch('search', filters);
  }

  function clearFilters() {
    searchForm = {
      search: '',
      minRating: '',
      maxRating: '',
      cuisineType: '',
      priceRange: '',
      sortBy: 'rating',
      sortOrder: -1,
      showAdvancedFilters: false
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

  // Sugerencias populares más compactas
  const popularSearches = [
    { emoji: '🍕', text: 'Pizza' },
    { emoji: '🍔', text: 'Hamburguesas' },
    { emoji: '🍜', text: 'Ramen' },
    { emoji: '🌮', text: 'Mexicana' },
    { emoji: '🍝', text: 'Italiana' },
    { emoji: '🥗', text: 'Saludable' }
  ];

  function handlePopularSearch(search: string) {
    searchForm.search = search;
    handleSubmit(new Event('submit'));
  }

  // Filtros rápidos para móvil
  const quickFilters = [
    { key: 'minRating', value: '4.0', label: '4⭐+', active: false },
    { key: 'priceRange', value: 'low', label: '💵', active: false },
    { key: 'priceRange', value: 'medium', label: '💶', active: false },
    { key: 'cuisineType', value: 'italiana', label: '🍝', active: false },
    { key: 'cuisineType', value: 'mexicana', label: '🌮', active: false },
  ];

  function handleQuickFilter(filterKey: string, value: string) {
    if (filterKey === 'minRating') {
      searchForm.minRating = searchForm.minRating === value ? '' : value;
    } else if (filterKey === 'priceRange') {
      searchForm.priceRange = searchForm.priceRange === value ? '' : value;
    } else if (filterKey === 'cuisineType') {
      searchForm.cuisineType = searchForm.cuisineType === value ? '' : value;
    }
  }

  function isQuickFilterActive(filterKey: string, value: string): boolean {
    if (filterKey === 'minRating') return searchForm.minRating === value;
    if (filterKey === 'priceRange') return searchForm.priceRange === value;
    if (filterKey === 'cuisineType') return searchForm.cuisineType === value;
    return false;
  }

  // Contar filtros activos
  const activeFiltersCount = $derived(() =>
    [
      searchForm.minRating,
      searchForm.maxRating,
      searchForm.cuisineType,
      searchForm.priceRange
    ].filter(Boolean).length
  );
</script>

<div class="search-form-container" class:focused={isFormFocused}>
  <form 
    class="search-form" 
    class:mobile={isMobile}
    on:submit={handleSubmit}
    in:fly={{ y: 20, duration: 500, easing: quintOut }}
  >
    <!-- Búsqueda principal compacta -->
    <div class="search-main">
      <div class="search-input-wrapper" class:focused={isFormFocused}>
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
          placeholder="Buscar restaurantes..."
          class="search-input"
          on:focus={handleInputFocus}
          on:blur={handleInputBlur}
        />
        
        {#if searchForm.search}
          <button 
            type="button" 
            class="clear-search-btn"
            on:click={() => searchForm.search = ''}
            in:scale={{ duration: 200 }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </button>
        {/if}
      </div>

      <button 
        type="submit" 
        class="search-btn"
        disabled={loading}
        class:loading
      >
        {#if loading}
          <div class="search-btn-spinner"></div>
        {:else}
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M21 21L16.514 16.506L21 21ZM19 10.5C19 15.194 15.194 19 10.5 19C5.806 19 2 15.194 2 10.5C2 5.806 5.806 2 10.5 2C15.194 2 19 5.806 19 10.5Z" 
                  stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        {/if}
      </button>
    </div>

    <!-- Filtros rápidos para móvil -->
    <!-- {#if isMobile && !searchForm.search && !isFormFocused}
      <div class="quick-filters" in:fade={{ duration: 300, delay: 100 }}>
        <div class="quick-filters-scroll">
          {#each quickFilters as filter, index}
            <button 
              type="button"
              class="quick-filter-btn"
              class:active={isQuickFilterActive(filter.key, filter.value)}
              on:click={() => handleQuickFilter(filter.key, filter.value)}
              in:fly={{ x: -10, duration: 300, delay: index * 50 }}
            >
              {filter.label}
            </button>
          {/each}
        </div>
      </div>
    {/if} -->

    <!-- Búsquedas populares para desktop -->
    {#if  !searchForm.search && !isFormFocused}
      <div class="popular-searches" in:fade={{ duration: 300, delay: 150 }}>
        <span class="popular-label">Popular:</span>
        {#each popularSearches as search, index}
          <button 
            type="button"
            class="popular-tag"
            on:click={() => handlePopularSearch(search.text)}
            in:fly={{ x: -15, duration: 300, delay: index * 75 }}
          >
            <span class="popular-emoji">{search.emoji}</span>
            {search.text}
          </button>
        {/each}
      </div>
    {/if}

    <!-- Toggle de filtros avanzados más compacto -->
    <div class="filters-toggle-container">
      <button 
        type="button"
        class="filters-toggle-btn"
        on:click={toggleAdvancedFilters}
        class:active={searchForm.showAdvancedFilters}
        class:has-filters={activeFiltersCount() > 0}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M3 4.6C3 4.03995 3 3.75992 3.10899 3.54601C3.20487 3.35785 3.35785 3.20487 3.54601 3.10899C3.75992 3 4.03995 3 4.6 3H19.4C19.9601 3 20.2401 3 20.454 3.10899C20.6422 3.20487 20.7951 3.35785 20.891 3.54601C21 3.75992 21 4.03995 21 4.6V6.33726C21 6.58185 21 6.70414 20.9724 6.81923C20.9479 6.92127 20.9075 7.01881 20.8526 7.10828C20.7908 7.2092 20.7043 7.29568 20.5314 7.46863L14.4686 13.5314C14.2957 13.7043 14.2092 13.7908 14.1474 13.8917C14.0925 13.9812 14.0521 14.0787 14.0276 14.1808C14 14.2959 14 14.4182 14 14.6627V17L10 21V14.6627C10 14.4182 10 14.2959 9.97237 14.1808C9.94787 14.0787 9.90747 13.9812 9.85264 13.8917C9.7908 13.7908 9.70432 13.7043 9.53137 13.5314L3.46863 7.46863C3.29568 7.29568 3.2092 7.2092 3.14736 7.10828C3.09253 7.01881 3.05213 6.92127 3.02763 6.81923C3 6.70414 3 6.58185 3 6.33726V4.6Z" 
                stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
        <span>Filtros</span>
        {#if activeFiltersCount() > 0}
          <span class="filters-count">{activeFiltersCount()}</span>
        {/if}
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" 
             class="chevron-icon" class:rotated={searchForm.showAdvancedFilters}>
          <path d="M6 9L12 15L18 9" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </button>
    </div>

    <!-- Filtros avanzados compactos -->
    {#if searchForm.showAdvancedFilters}
      <div 
        class="advanced-filters"
        in:fly={{ y: -15, duration: 350, easing: quintOut }}
        out:fly={{ y: -15, duration: 250, easing: quintOut }}
      >
        <div class="filters-grid" class:mobile-grid={isMobile}>
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

          <!-- Tipo de cocina -->
          <div class="filter-group">
            <label class="filter-label">🍽️ Cocina</label>
            <select bind:value={searchForm.cuisineType} class="filter-select">
              <option value="">Todos</option>
              <option value="mexicana">🌮 Mexicana</option>
              <option value="italiana">🍝 Italiana</option>
              <option value="asiática">🍜 Asiática</option>
              <option value="americana">🍔 Americana</option>
              <option value="española">🥘 Española</option>
              <option value="japonesa">🍣 Japonesa</option>
            </select>
          </div>

          <!-- Precio -->
          <div class="filter-group">
            <label class="filter-label">💰 Precio</label>
            <select bind:value={searchForm.priceRange} class="filter-select">
              <option value="">Cualquiera</option>
              <option value="low">💵 Económico</option>
              <option value="medium">💶 Medio</option>
              <option value="high">💷 Alto</option>
            </select>
          </div>

          <!-- Ordenar -->
          <div class="filter-group">
            <label class="filter-label">📊 Ordenar</label>
            <select bind:value={searchForm.sortBy} class="filter-select">
              <option value="rating">⭐ Valoración</option>
              <option value="name">📝 Nombre</option>
              <option value="analytics.reviewsCount">💬 Reseñas</option>
            </select>
          </div>
        </div>

        <!-- Acciones compactas -->
        <div class="filter-actions">
          <button 
            type="button" 
            class="clear-btn"
            on:click={clearFilters}
            disabled={activeFiltersCount() === 0}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M3 6H21M8 6V4C8 3.44772 8.44772 3 9 3H15C15.5523 3 16 3.44772 16 4V6M19 6V20C19 20.5523 18.4477 21 18 21H6C5.44772 21 5 20.5523 5 20V6H19Z" 
                    stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
            Limpiar
          </button>
          
          <button 
            type="submit" 
            class="apply-btn"
            disabled={loading}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M20 6L9 17L4 12" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
            Aplicar
          </button>
        </div>
      </div>
    {/if}
  </form>
</div>

<style>
  .search-form-container {
    margin: 0 auto;
    max-width: 800px; /* Reducido de 900px */
    transition: all 0.3s ease;
  }

  .search-form {
    background: white;
    border-radius: 20px; /* Reducido de 24px */
    padding: 20px; /* Reducido de 32px */
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.06); /* Más sutil */
    border: 1px solid #f1f5f9;
    transition: all 0.3s ease;
    position: relative;
  }

  .search-form.mobile {
    border-radius: 16px;
    padding: 16px;
  }

  .search-form-container.focused .search-form {
    border-color: var(--primary-color, #ff6b35);
    box-shadow: 0 8px 25px rgba(255, 107, 53, 0.12);
    transform: translateY(-2px); /* Reducido de -4px */
  }

  /* Búsqueda principal más compacta */
  .search-main {
    display: flex;
    gap: 12px; /* Reducido de 16px */
    margin-bottom: 16px; /* Reducido de 24px */
    align-items: stretch;
  }

  .search-input-wrapper {
    flex: 1;
    position: relative;
    display: flex;
    align-items: center;
    background: #f8fafc;
    border: 1px solid #e2e8f0; /* Reducido de 2px */
    border-radius: 14px; /* Reducido de 16px */
    padding: 0 16px; /* Reducido de 20px */
    transition: all 0.3s ease;
    min-height: 48px; /* Reducido de 56px */
  }

  .search-input-wrapper.focused {
    background: white;
    border-color: var(--primary-color, #ff6b35);
    box-shadow: 0 0 0 3px rgba(255, 107, 53, 0.1); /* Reducido de 4px */
  }

  .search-icon {
    color: #64748b;
    margin-right: 10px; /* Reducido de 12px */
    display: flex;
    align-items: center;
    transition: color 0.3s ease;
  }

  .search-input-wrapper.focused .search-icon {
    color: var(--primary-color, #ff6b35);
  }

  .search-input {
    flex: 1;
    border: none;
    background: transparent;
    font-size: 1rem; /* Reducido de 1.1rem */
    color: #0D1B2A;
    outline: none;
    padding: 0;
    font-weight: 500;
  }

  .search-input::placeholder {
    color: #94a3b8;
    font-weight: 400;
  }

  .clear-search-btn {
    background: #e2e8f0;
    border: none;
    border-radius: 50%;
    width: 24px; /* Reducido de 28px */
    height: 24px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    color: #64748b;
    transition: all 0.2s ease;
    margin-left: 6px; /* Reducido de 8px */
  }

  .clear-search-btn:hover {
    background: #cbd5e1;
    color: #475569;
    transform: scale(1.05); /* Reducido de 1.1 */
  }

  .search-btn {
    background: linear-gradient(135deg, var(--primary-color, #ff6b35) 0%, #ff8c69 100%);
    color: white;
    border: none;
    border-radius: 14px; /* Reducido de 16px */
    padding: 0 24px; /* Reducido de 32px */
    font-weight: 700;
    font-size: 0.95rem; /* Reducido de 1.1rem */
    cursor: pointer;
    transition: all 0.3s ease;
    display: flex;
    align-items: center;
    gap: 6px; /* Reducido de 8px */
    min-height: 48px; /* Reducido de 56px */
    white-space: nowrap;
    position: relative;
  }

  .search-btn:not(:disabled):hover {
    transform: translateY(-2px); /* Reducido de -3px */
    box-shadow: 0 8px 20px rgba(255, 107, 53, 0.3); /* Reducido de 12px 24px */
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
    width: 16px; /* Reducido de 20px */
    height: 16px;
    border: 2px solid rgba(255, 255, 255, 0.3);
    border-top: 2px solid white;
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }

  /* Filtros rápidos para móvil */
  .quick-filters {
    margin-bottom: 16px;
    overflow: hidden;
  }

  .quick-filters-scroll {
    display: flex;
    gap: 8px;
    overflow-x: auto;
    padding: 4px 0;
    scrollbar-width: none;
    -ms-overflow-style: none;
  }

  .quick-filters-scroll::-webkit-scrollbar {
    display: none;
  }

  .quick-filter-btn {
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    color: #64748b;
    padding: 6px 12px;
    border-radius: 20px;
    font-size: 0.85rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s ease;
    flex-shrink: 0;
    min-width: 44px;
    height: 36px;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .quick-filter-btn:hover,
  .quick-filter-btn.active {
    background: var(--primary-color, #ff6b35);
    color: white;
    border-color: var(--primary-color, #ff6b35);
    transform: translateY(-1px);
  }

  /* Búsquedas populares más compactas */
  .popular-searches {
    display: flex;
    flex-wrap: wrap;
    gap: 8px; /* Reducido de 12px */
    align-items: center;
    margin-bottom: 16px; /* Reducido de 20px */
    padding-top: 4px; /* Reducido de 8px */
  }

  .popular-label {
    color: #64748b;
    font-size: 0.85rem; /* Reducido de 0.9rem */
    font-weight: 600;
    margin-right: 6px; /* Reducido de 8px */
  }

  .popular-tag {
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    color: #475569;
    padding: 6px 12px; /* Reducido de 8px 16px */
    border-radius: 16px; /* Reducido de 20px */
    font-size: 0.8rem; /* Reducido de 0.9rem */
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s ease;
    display: flex;
    align-items: center;
    gap: 4px;
  }

  .popular-tag:hover {
    background: var(--primary-color, #ff6b35);
    color: white;
    border-color: var(--primary-color, #ff6b35);
    transform: translateY(-1px); /* Reducido de -2px */
    box-shadow: 0 2px 8px rgba(255, 107, 53, 0.2); /* Reducido de 4px 12px */
  }

  .popular-emoji {
    font-size: 0.9rem;
  }

  /* Toggle de filtros más compacto */
  .filters-toggle-container {
    display: flex;
    justify-content: center;
    margin-bottom: 12px; /* Reducido de 16px */
  }

  .filters-toggle-btn {
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    color: #64748b;
    padding: 8px 16px; /* Reducido de 12px 20px */
    border-radius: 10px; /* Reducido de 12px */
    cursor: pointer;
    font-weight: 600;
    font-size: 0.9rem; /* Reducido */
    display: flex;
    align-items: center;
    gap: 6px; /* Reducido de 8px */
    transition: all 0.3s ease;
    position: relative;
  }

  .filters-toggle-btn:hover,
  .filters-toggle-btn.active {
    background: var(--primary-color, #ff6b35);
    color: white;
    border-color: var(--primary-color, #ff6b35);
    transform: translateY(-1px); /* Reducido de -2px */
    box-shadow: 0 4px 12px rgba(255, 107, 53, 0.25); /* Reducido de 8px 20px */
  }

  .filters-toggle-btn.has-filters {
    background: #0D1B2A;
    color: white;
    border-color: #0D1B2A;
  }

  .filters-count {
    background: var(--primary-color, #ff6b35);
    color: white;
    border-radius: 50%;
    width: 18px; /* Reducido de 20px */
    height: 18px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 0.7rem; /* Reducido de 0.75rem */
    font-weight: 700;
    margin-left: 2px;
  }

  .chevron-icon {
    transition: transform 0.3s ease;
    margin-left: 2px;
  }

  .chevron-icon.rotated {
    transform: rotate(180deg);
  }

  /* Filtros avanzados más compactos */
  .advanced-filters {
    border-top: 1px solid #f1f5f9;
    padding-top: 16px; /* Reducido de 24px */
    margin-top: 4px; /* Reducido de 8px */
  }

  .filters-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); /* Reducido de 250px */
    gap: 16px; /* Reducido de 24px */
    margin-bottom: 16px; /* Reducido de 24px */
  }

  .filters-grid.mobile-grid {
    grid-template-columns: 1fr 1fr; /* 2 columnas en móvil */
    gap: 12px;
  }

  .filter-group {
    display: flex;
    flex-direction: column;
    gap: 6px; /* Reducido de 8px */
  }

  .filter-label {
    font-weight: 600;
    color: #0D1B2A;
    font-size: 0.85rem; /* Reducido de 0.95rem */
    display: flex;
    align-items: center;
    gap: 4px; /* Reducido de 8px */
  }

  .filter-select {
    padding: 8px 12px; /* Reducido de 12px 16px */
    border: 1px solid #e2e8f0; /* Reducido de 2px */
    border-radius: 8px; /* Reducido de 12px */
    background: white;
    font-size: 0.9rem; /* Reducido de 1rem */
    color: #0D1B2A;
    cursor: pointer;
    transition: all 0.3s ease;
    appearance: none;
    background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='m6 8 4 4 4-4'/%3e%3c/svg%3e");
    background-position: right 8px center; /* Reducido de 12px */
    background-repeat: no-repeat;
    background-size: 14px; /* Reducido de 16px */
    padding-right: 32px; /* Reducido de 40px */
  }

  .filter-select:focus {
    outline: none;
    border-color: var(--primary-color, #ff6b35);
    box-shadow: 0 0 0 2px rgba(255, 107, 53, 0.1); /* Reducido de 4px */
  }

  /* Acciones más compactas */
  .filter-actions {
    display: flex;
    gap: 10px; /* Reducido de 16px */
    justify-content: flex-end;
    border-top: 1px solid #f1f5f9;
    padding-top: 16px; /* Reducido de 24px */
  }

  .clear-btn,
  .apply-btn {
    padding: 8px 16px; /* Reducido de 12px 20px */
    border-radius: 8px; /* Reducido de 12px */
    font-weight: 600;
    font-size: 0.85rem; /* Reducido de 1rem */
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 4px; /* Reducido de 8px */
    transition: all 0.3s ease;
    flex: 1;
    justify-content: center;
  }

  .clear-btn {
    background: white;
    border: 1px solid #e2e8f0;
    color: #64748b;
  }

  .clear-btn:hover:not(:disabled) {
    border-color: #cbd5e1;
    color: #475569;
    transform: translateY(-1px); /* Reducido de -2px */
  }

  .clear-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .apply-btn {
    background: #0D1B2A;
    color: white;
    border: none;
  }

  .apply-btn:hover:not(:disabled) {
    background: #1e293b;
    transform: translateY(-1px); /* Reducido de -2px */
    box-shadow: 0 4px 12px rgba(13, 27, 42, 0.2); /* Reducido de 8px 20px */
  }

  .apply-btn:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
  }

  @keyframes spin {
    0% { transform: translate(-50%, -50%) rotate(0deg); }
    100% { transform: translate(-50%, -50%) rotate(360deg); }
  }

  /* Responsive mejorado para móvil */
  @media (max-width: 768px) {
    .search-form {
      padding: 14px;
      border-radius: 16px;
    }

    .search-main {
      gap: 8px;
      margin-bottom: 12px;
    }

    .search-input-wrapper {
      min-height: 44px;
      padding: 0 14px;
      border-radius: 12px;
    }

    .search-btn {
      min-height: 44px;
      padding: 0 16px;
      border-radius: 12px;
    }

    .popular-searches {
      justify-content: center;
      margin-bottom: 12px;
    }

    .popular-label {
      width: 100%;
      text-align: center;
      margin-bottom: 6px;
      margin-right: 0;
    }

    .filter-actions {
      gap: 8px;
    }

    .filters-grid.mobile-grid {
      gap: 10px;
    }
  }

  @media (max-width: 480px) {
    .search-form {
      padding: 12px;
      border-radius: 14px;
    }

    .search-input-wrapper {
      min-height: 40px;
      padding: 0 12px;
    }

    .search-btn {
      min-height: 40px;
      padding: 0 12px;
    }

    .search-input {
      font-size: 0.95rem;
    }

    .filters-grid.mobile-grid {
      grid-template-columns: 1fr; /* 1 columna en móviles muy pequeños */
    }

    .filter-actions {
      flex-direction: column;
    }
  }
</style>