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

  // Estado del formulario
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

  // Inicializar con filtros iniciales
  onMount(() => {
    if (initialFilters) {
      searchForm.search = initialFilters.search || '';
      searchForm.minRating = initialFilters.minRating?.toString() || '';
      searchForm.maxRating = initialFilters.maxRating?.toString() || '';
      searchForm.cuisineType = initialFilters.cuisineType || '';
      searchForm.priceRange = initialFilters.priceRange || '';
      searchForm.sortBy = initialFilters.sortBy || 'rating';
      searchForm.sortOrder = initialFilters.sortOrder || -1;
    }
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

  // Función para enfocar automáticamente el input de búsqueda
  function focusSearchInput() {
    if (searchInputElement) {
      searchInputElement.focus();
    }
  }

  // Sugerencias de búsqueda populares
  const popularSearches = [
    '🍕 Pizza', '🍔 Hamburguesas', '🍜 Ramen', 
    '🥗 Saludable', '🌮 Mexicana', '🍝 Italiana'
  ];

  function handlePopularSearch(search: string) {
    searchForm.search = search.replace(/[🍕🍔🍜🥗🌮🍝]\s/, '');
    handleSubmit(new Event('submit'));
  }
</script>

<div class="search-form-container" class:focused={isFormFocused}>
  <form 
    class="search-form" 
    on:submit={handleSubmit}
    in:fly={{ y: 30, duration: 600, easing: quintOut }}
  >
    <!-- Campo de búsqueda principal -->
    <div class="search-main">
      <div class="search-input-wrapper" class:focused={isFormFocused}>
        <div class="search-icon">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M21 21L16.514 16.506L21 21ZM19 10.5C19 15.194 15.194 19 10.5 19C5.806 19 2 15.194 2 10.5C2 5.806 5.806 2 10.5 2C15.194 2 19 5.806 19 10.5Z" 
                  stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </div>
        
        <input 
          bind:this={searchInputElement}
          type="text" 
          bind:value={searchForm.search}
          placeholder="Buscar restaurantes, tipo de cocina, ubicación..."
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
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
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
          <span>Buscar</span>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M5 12H19M19 12L12 5M19 12L12 19" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        {/if}
      </button>
    </div>

    <!-- Búsquedas populares -->
    {#if !searchForm.search && !isFormFocused}
      <div class="popular-searches" in:fade={{ duration: 300, delay: 200 }}>
        <span class="popular-label">Populares:</span>
        {#each popularSearches as search, index}
          <button 
            type="button"
            class="popular-tag"
            on:click={() => handlePopularSearch(search)}
            in:fly={{ x: -20, duration: 300, delay: index * 100 }}
          >
            {search}
          </button>
        {/each}
      </div>
    {/if}

    <!-- Toggle de filtros avanzados -->
    <div class="advanced-toggle">
      <button 
        type="button"
        class="toggle-btn"
        on:click={toggleAdvancedFilters}
        class:active={searchForm.showAdvancedFilters}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" class="filter-icon">
          <path d="M3 4.6C3 4.03995 3 3.75992 3.10899 3.54601C3.20487 3.35785 3.35785 3.20487 3.54601 3.10899C3.75992 3 4.03995 3 4.6 3H19.4C19.9601 3 20.2401 3 20.454 3.10899C20.6422 3.20487 20.7951 3.35785 20.891 3.54601C21 3.75992 21 4.03995 21 4.6V6.33726C21 6.58185 21 6.70414 20.9724 6.81923C20.9479 6.92127 20.9075 7.01881 20.8526 7.10828C20.7908 7.2092 20.7043 7.29568 20.5314 7.46863L14.4686 13.5314C14.2957 13.7043 14.2092 13.7908 14.1474 13.8917C14.0925 13.9812 14.0521 14.0787 14.0276 14.1808C14 14.2959 14 14.4182 14 14.6627V17L10 21V14.6627C10 14.4182 10 14.2959 9.97237 14.1808C9.94787 14.0787 9.90747 13.9812 9.85264 13.8917C9.7908 13.7908 9.70432 13.7043 9.53137 13.5314L3.46863 7.46863C3.29568 7.29568 3.2092 7.2092 3.14736 7.10828C3.09253 7.01881 3.05213 6.92127 3.02763 6.81923C3 6.70414 3 6.58185 3 6.33726V4.6Z" 
                stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
        <span>Filtros</span>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" 
             class="chevron-icon" class:rotated={searchForm.showAdvancedFilters}>
          <path d="M6 9L12 15L18 9" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </button>
    </div>

    <!-- Filtros avanzados -->
    {#if searchForm.showAdvancedFilters}
      <div 
        class="advanced-filters"
        in:fly={{ y: -20, duration: 400, easing: quintOut }}
        out:fly={{ y: -20, duration: 300, easing: quintOut }}
      >
        <div class="filters-grid">
          <!-- Valoración -->
          <div class="filter-group">
            <label class="filter-label">
              <span class="label-icon">⭐</span>
              Valoración mínima
            </label>
            <select bind:value={searchForm.minRating} class="filter-select">
              <option value="">Cualquiera</option>
              <option value="4.5">4.5+ ⭐⭐⭐⭐⭐</option>
              <option value="4.0">4.0+ ⭐⭐⭐⭐</option>
              <option value="3.5">3.5+ ⭐⭐⭐</option>
              <option value="3.0">3.0+ ⭐⭐</option>
              <option value="2.0">2.0+ ⭐</option>
            </select>
          </div>

          <!-- Tipo de cocina -->
          <div class="filter-group">
            <label class="filter-label">
              <span class="label-icon">🍽️</span>
              Tipo de cocina
            </label>
            <select bind:value={searchForm.cuisineType} class="filter-select">
              <option value="">Todos los tipos</option>
              <option value="mexicana">🌮 Mexicana</option>
              <option value="italiana">🍝 Italiana</option>
              <option value="asiática">🍜 Asiática</option>
              <option value="americana">🍔 Americana</option>
              <option value="española">🥘 Española</option>
              <option value="francesa">🥖 Francesa</option>
              <option value="mediterránea">🫒 Mediterránea</option>
              <option value="japonesa">🍣 Japonesa</option>
              <option value="china">🥢 China</option>
              <option value="india">🍛 India</option>
            </select>
          </div>

          <!-- Rango de precios -->
          <div class="filter-group">
            <label class="filter-label">
              <span class="label-icon">💰</span>
              Rango de precios
            </label>
            <select bind:value={searchForm.priceRange} class="filter-select">
              <option value="">Cualquier precio</option>
              <option value="low">💵 Económico ($)</option>
              <option value="medium">💶 Medio ($$)</option>
              <option value="high">💷 Alto ($$$)</option>
            </select>
          </div>

          <!-- Ordenar por -->
          <div class="filter-group">
            <label class="filter-label">
              <span class="label-icon">📊</span>
              Ordenar por
            </label>
            <select bind:value={searchForm.sortBy} class="filter-select">
              <option value="rating">⭐ Valoración</option>
              <option value="name">📝 Nombre</option>
              <option value="analytics.reviewsCount">💬 Más reseñas</option>
              <option value="priceRange">💰 Precio</option>
            </select>
          </div>
        </div>

        <!-- Acciones de filtros -->
        <div class="filter-actions">
          <button 
            type="button" 
            class="clear-filters-btn"
            on:click={clearFilters}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M3 6H21M8 6V4C8 3.44772 8.44772 3 9 3H15C15.5523 3 16 3.44772 16 4V6M19 6V20C19 20.5523 18.4477 21 18 21H6C5.44772 21 5 20.5523 5 20V6H19Z" 
                    stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
            Limpiar filtros
          </button>
          
          <button 
            type="submit" 
            class="apply-filters-btn"
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
    margin: 0 auto;
    max-width: 900px;
    transition: all 0.3s ease;
  }

  .search-form {
    background: white;
    border-radius: 24px;
    padding: 32px;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.08);
    border: 2px solid transparent;
    transition: all 0.3s ease;
    position: relative;
    overflow: hidden;
  }

  .search-form-container.focused .search-form {
    border-color: var(--primary-color, #ff6b35);
    box-shadow: 0 12px 40px rgba(255, 107, 53, 0.15);
    transform: translateY(-4px);
  }

  .search-main {
    display: flex;
    gap: 16px;
    margin-bottom: 24px;
    align-items: stretch;
  }

  .search-input-wrapper {
    flex: 1;
    position: relative;
    display: flex;
    align-items: center;
    background: #f8fafc;
    border: 2px solid #e2e8f0;
    border-radius: 16px;
    padding: 0 20px;
    transition: all 0.3s ease;
    min-height: 56px;
  }

  .search-input-wrapper.focused {
    background: white;
    border-color: var(--primary-color, #ff6b35);
    box-shadow: 0 0 0 4px rgba(255, 107, 53, 0.1);
  }

  .search-icon {
    color: #64748b;
    margin-right: 12px;
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
    font-size: 1.1rem;
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
    width: 28px;
    height: 28px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    color: #64748b;
    transition: all 0.2s ease;
    margin-left: 8px;
  }

  .clear-search-btn:hover {
    background: #cbd5e1;
    color: #475569;
    transform: scale(1.1);
  }

  .search-btn {
    background: linear-gradient(135deg, var(--primary-color, #ff6b35) 0%, #ff8c69 100%);
    color: white;
    border: none;
    border-radius: 16px;
    padding: 0 32px;
    font-weight: 700;
    font-size: 1.1rem;
    cursor: pointer;
    transition: all 0.3s ease;
    display: flex;
    align-items: center;
    gap: 8px;
    min-height: 56px;
    white-space: nowrap;
    position: relative;
    overflow: hidden;
  }

  .search-btn:not(:disabled):hover {
    transform: translateY(-3px);
    box-shadow: 0 12px 24px rgba(255, 107, 53, 0.4);
  }

  .search-btn:not(:disabled):active {
    transform: translateY(-1px);
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
    width: 20px;
    height: 20px;
    border: 2px solid rgba(255, 255, 255, 0.3);
    border-top: 2px solid white;
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }

  @keyframes spin {
    0% { transform: translate(-50%, -50%) rotate(0deg); }
    100% { transform: translate(-50%, -50%) rotate(360deg); }
  }

  .popular-searches {
    display: flex;
    flex-wrap: wrap;
    gap: 12px;
    align-items: center;
    margin-bottom: 20px;
    padding-top: 8px;
  }

  .popular-label {
    color: #64748b;
    font-size: 0.9rem;
    font-weight: 600;
    margin-right: 8px;
  }

  .popular-tag {
    background: linear-gradient(135deg, #f1f5f9, #e2e8f0);
    border: 1px solid #cbd5e1;
    color: #475569;
    padding: 8px 16px;
    border-radius: 20px;
    font-size: 0.9rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .popular-tag:hover {
    background: linear-gradient(135deg, var(--primary-color, #ff6b35), #ff8c69);
    color: white;
    border-color: var(--primary-color, #ff6b35);
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(255, 107, 53, 0.3);
  }

  .advanced-toggle {
    display: flex;
    justify-content: center;
    margin-bottom: 16px;
  }

  .toggle-btn {
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    color: #64748b;
    padding: 12px 20px;
    border-radius: 12px;
    cursor: pointer;
    font-weight: 600;
    display: flex;
    align-items: center;
    gap: 8px;
    transition: all 0.3s ease;
  }

  .toggle-btn:hover,
  .toggle-btn.active {
    background: var(--primary-color, #ff6b35);
    color: white;
    border-color: var(--primary-color, #ff6b35);
    transform: translateY(-2px);
    box-shadow: 0 8px 20px rgba(255, 107, 53, 0.3);
  }

  .filter-icon {
    transition: transform 0.3s ease;
  }

  .toggle-btn.active .filter-icon {
    transform: rotate(180deg);
  }

  .chevron-icon {
    transition: transform 0.3s ease;
  }

  .chevron-icon.rotated {
    transform: rotate(180deg);
  }

  .advanced-filters {
    border-top: 2px solid #f1f5f9;
    padding-top: 24px;
    margin-top: 8px;
  }

  .filters-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 24px;
    margin-bottom: 24px;
  }

  .filter-group {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .filter-label {
    font-weight: 600;
    color: #0D1B2A;
    font-size: 0.95rem;
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .label-icon {
    font-size: 1.1rem;
  }

  .filter-select {
    padding: 12px 16px;
    border: 2px solid #e2e8f0;
    border-radius: 12px;
    background: white;
    font-size: 1rem;
    color: #0D1B2A;
    cursor: pointer;
    transition: all 0.3s ease;
    appearance: none;
    background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='m6 8 4 4 4-4'/%3e%3c/svg%3e");
    background-position: right 12px center;
    background-repeat: no-repeat;
    background-size: 16px;
    padding-right: 40px;
  }

  .filter-select:focus {
    outline: none;
    border-color: var(--primary-color, #ff6b35);
    box-shadow: 0 0 0 4px rgba(255, 107, 53, 0.1);
  }

  .filter-actions {
    display: flex;
    gap: 16px;
    justify-content: flex-end;
    border-top: 1px solid #f1f5f9;
    padding-top: 24px;
  }

  .clear-filters-btn {
    background: white;
    border: 2px solid #e2e8f0;
    color: #64748b;
    padding: 12px 20px;
    border-radius: 12px;
    font-weight: 600;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 8px;
    transition: all 0.3s ease;
  }

  .clear-filters-btn:hover {
    border-color: #cbd5e1;
    color: #475569;
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  }

  .apply-filters-btn {
    background: #0D1B2A;
    color: white;
    border: none;
    padding: 12px 20px;
    border-radius: 12px;
    font-weight: 600;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 8px;
    transition: all 0.3s ease;
  }

  .apply-filters-btn:hover:not(:disabled) {
    background: #1e293b;
    transform: translateY(-2px);
    box-shadow: 0 8px 20px rgba(13, 27, 42, 0.3);
  }

  .apply-filters-btn:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
  }

  /* Responsive Design */
  @media (max-width: 768px) {
    .search-form {
      padding: 24px;
      border-radius: 20px;
    }

    .search-main {
      flex-direction: column;
      gap: 12px;
    }

    .filters-grid {
      grid-template-columns: 1fr;
      gap: 16px;
    }

    .filter-actions {
      flex-direction: column;
    }

    .popular-searches {
      justify-content: center;
    }

    .popular-label {
      width: 100%;
      text-align: center;
      margin-bottom: 8px;
    }
  }

  @media (max-width: 480px) {
    .search-form {
      padding: 20px;
    }

    .search-input-wrapper {
      padding: 0 16px;
      min-height: 48px;
    }

    .search-btn {
      min-height: 48px;
      padding: 0 24px;
    }

    .search-input {
      font-size: 1rem;
    }
  }
</style>