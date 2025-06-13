<script lang="ts">
  import { createEventDispatcher, onMount } from 'svelte';
  import { fade, fly, scale } from 'svelte/transition';
  import { quintOut } from 'svelte/easing';
  
  import type { RestaurantSearchFilters } from '../interfaces/restaurantRating';

  // Props
  const { 
    loading, 
    initialFilters, 
    placeholder = 'Buscar restaurantes...',
    searchType = 'restaurants'
  } = $props<{
    loading: boolean;
    initialFilters: RestaurantSearchFilters;
    placeholder?: string;
    searchType?: string;
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

  // Sugerencias contextuales basadas en el tipo de búsqueda
  const getContextualSuggestions = () => {
    switch (searchType) {
      case 'dishes':
        return [
          { emoji: '🍕', text: 'Pizza Margherita' },
          { emoji: '🍣', text: 'California Roll' },
          { emoji: '🍔', text: 'Hamburguesa Clásica' },
          { emoji: '🌮', text: 'Tacos al Pastor' },
          { emoji: '🍝', text: 'Pasta Carbonara' },
          { emoji: '🥗', text: 'Ensalada César' }
        ];
      case 'routes':
        return [
          { emoji: '🗺️', text: 'Ruta Centro Histórico' },
          { emoji: '🍷', text: 'Tour Gastronómico' },
          { emoji: '🌮', text: 'Ruta de Tacos' },
          { emoji: '☕', text: 'Cafeterías Locales' },
          { emoji: '🍺', text: 'Bares y Cervecerías' },
          { emoji: '🧁', text: 'Postres Artesanales' }
        ];
      default: // restaurants
        return [
          { emoji: '🍕', text: 'Pizza' },
          { emoji: '🍔', text: 'Hamburguesas' },
          { emoji: '🍜', text: 'Ramen' },
          { emoji: '🌮', text: 'Mexicana' },
          { emoji: '🍝', text: 'Italiana' },
          { emoji: '🥗', text: 'Saludable' }
        ];
    }
  };

  function handlePopularSearch(search: string) {
    searchForm.search = search;
    handleSubmit(new Event('submit'));
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

  // Obtener el placeholder dinámico
  const dynamicPlaceholder = $derived(() => placeholder || 'Buscar restaurantes...');
</script>

<div class="search-form-container-hero" class:focused={isFormFocused}>
  <form 
    class="search-form-hero" 
    class:mobile={isMobile}
    onsubmit={handleSubmit}
  >
    <!-- Búsqueda principal estilo Kayak -->
    <div class="search-main-hero">
      <div class="search-input-group">
        <div class="search-input-wrapper-hero" class:focused={isFormFocused}>
          <div class="search-icon-hero">
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
            class="search-input-hero"
            onfocus={handleInputFocus}
            onblur={handleInputBlur}
          />
          
          {#if searchForm.search}
            <button 
              type="button" 
              class="clear-search-btn-hero"
              onclick={() => searchForm.search = ''}
              in:scale={{ duration: 200 }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </button>
          {/if}
        </div>
        <!-- Búsquedas populares rápidas -->
<div class="popular-searches-quick">
  {#each getContextualSuggestions() as search, index}
    <button 
      type="button"
      class="popular-quick-btn"
      onclick={() => handlePopularSearch(search.text)}
    >
      <span class="popular-emoji">{search.emoji}</span>
      <span class="popular-text">{search.text}</span>
    </button>
  {/each}
</div>
        <!-- Filtros rápidos -->
        <!-- <div class="quick-filters-hero">
          <button 
            type="button"
            class="quick-filter-btn-hero"
            class:active={searchForm.minRating === '4.0'}
            onclick={() => searchForm.minRating = searchForm.minRating === '4.0' ? '' : '4.0'}
          >
            <span class="filter-icon">⭐</span>
            <span class="filter-text">4.0+</span>
          </button>
          
          <button 
            type="button"
            class="quick-filter-btn-hero"
            class:active={searchForm.priceRange === 'low'}
            onclick={() => searchForm.priceRange = searchForm.priceRange === 'low' ? '' : 'low'}
          >
            <span class="filter-icon">💵</span>
            <span class="filter-text">Económico</span>
          </button>
          
          <button 
            type="button"
            class="quick-filter-btn-hero"
            class:active={searchForm.cuisineType === 'italiana'}
            onclick={() => searchForm.cuisineType = searchForm.cuisineType === 'italiana' ? '' : 'italiana'}
          >
            <span class="filter-icon">🍝</span>
            <span class="filter-text">Italiana</span>
          </button>
        </div> -->
      </div>

      <div class="search-actions-hero">
        <!-- Botón de filtros avanzados -->
        <button 
          type="button"
          class="filters-btn-hero"
          onclick={toggleAdvancedFilters}
          class:active={searchForm.showAdvancedFilters}
          class:has-filters={activeFiltersCount() > 0}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M3 4.6C3 4.03995 3 3.75992 3.10899 3.54601C3.20487 3.35785 3.35785 3.20487 3.54601 3.10899C3.75992 3 4.03995 3 4.6 3H19.4C19.9601 3 20.2401 3 20.454 3.10899C20.6422 3.20487 20.7951 3.35785 20.891 3.54601C21 3.75992 21 4.03995 21 4.6V6.33726C21 6.58185 21 6.70414 20.9724 6.81923C20.9479 6.92127 20.9075 7.01881 20.8526 7.10828C20.7908 7.2092 20.7043 7.29568 20.5314 7.46863L14.4686 13.5314C14.2957 13.7043 14.2092 13.7908 14.1474 13.8917C14.0925 13.9812 14.0521 14.0787 14.0276 14.1808C14 14.2959 14 14.4182 14 14.6627V17L10 21V14.6627C10 14.4182 10 14.2959 9.97237 14.1808C9.94787 14.0787 9.90747 13.9812 9.85264 13.8917C9.7908 13.7908 9.70432 13.7043 9.53137 13.5314L3.46863 7.46863C3.29568 7.29568 3.2092 7.2092 3.14736 7.10828C3.09253 7.01881 3.05213 6.92127 3.02763 6.81923C3 6.70414 3 6.58185 3 6.33726V4.6Z" 
                  stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
          {#if !isMobile}
            <span>Filtros</span>
          {/if}
          {#if activeFiltersCount() > 0}
            <span class="filters-count-hero">{activeFiltersCount()}</span>
          {/if}
        </button>

        <!-- Botón de búsqueda -->
        <button 
          type="submit" 
          class="search-btn-hero"
          disabled={loading}
          class:loading
        >
          {#if loading}
            <div class="search-btn-spinner-hero"></div>
          {:else}
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M21 21L16.514 16.506L21 21ZM19 10.5C19 15.194 15.194 19 10.5 19C5.806 19 2 15.194 2 10.5C2 5.806 5.806 2 10.5 2C15.194 2 19 5.806 19 10.5Z" 
                    stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
            {#if !isMobile}
              Buscar
            {/if}
          {/if}
        </button>
      </div>
    </div>

    <!-- Filtros avanzados -->
    {#if searchForm.showAdvancedFilters}
      <div 
        class="advanced-filters-hero"
        in:fly={{ y: -20, duration: 350, easing: quintOut }}
        out:fly={{ y: -20, duration: 250, easing: quintOut }}
      >
        <div class="filters-grid-hero" class:mobile-grid={isMobile}>
          <!-- Valoración -->
          <div class="filter-group-hero">
            <label class="filter-label-hero">⭐ Valoración</label>
            <select bind:value={searchForm.minRating} class="filter-select-hero">
              <option value="">Cualquiera</option>
              <option value="4.5">4.5+ ⭐⭐⭐⭐⭐</option>
              <option value="4.0">4.0+ ⭐⭐⭐⭐</option>
              <option value="3.5">3.5+ ⭐⭐⭐</option>
              <option value="3.0">3.0+</option>
            </select>
          </div>

          <!-- Tipo de cocina -->
          <div class="filter-group-hero">
            <label class="filter-label-hero">🍽️ Cocina</label>
            <select bind:value={searchForm.cuisineType} class="filter-select-hero">
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
          <div class="filter-group-hero">
            <label class="filter-label-hero">💰 Precio</label>
            <select bind:value={searchForm.priceRange} class="filter-select-hero">
              <option value="">Cualquiera</option>
              <option value="low">💵 Económico</option>
              <option value="medium">💶 Medio</option>
              <option value="high">💷 Alto</option>
            </select>
          </div>

          <!-- Ordenar -->
          <div class="filter-group-hero">
            <label class="filter-label-hero">📊 Ordenar</label>
            <select bind:value={searchForm.sortBy} class="filter-select-hero">
              <option value="rating">⭐ Valoración</option>
              <option value="name">📝 Nombre</option>
              <option value="analytics.reviewsCount">💬 Reseñas</option>
            </select>
          </div>
        </div>

        <!-- Acciones de filtros -->
        <div class="filter-actions-hero">
          <button 
            type="button" 
            class="clear-btn-hero"
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
            class="apply-btn-hero"
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
  .search-form-container-hero {
    width: 100%;
    transition: all 0.3s ease;
  }

  .search-form-hero {
    background: white;
    border-radius: 16px;
    border: 1px solid #e2e8f0;
    overflow: hidden;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
    transition: all 0.3s ease;
  }

  .search-form-hero.mobile {
    border-radius: 12px;
  }

  .search-form-container-hero.focused .search-form-hero {
    border-color: var(--primary-color, #ff6b35);
    box-shadow: 0 8px 30px rgba(255, 107, 53, 0.15);
    transform: translateY(-2px);
  }

  /* Búsqueda principal */
  .search-main-hero {
    padding: 20px;
    display: flex;
    gap: 16px;
    align-items: flex-start;
  }

  .search-input-group {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .search-input-wrapper-hero {
    position: relative;
    display: flex;
    align-items: center;
    background: #f8fafc;
    border: 2px solid #e2e8f0;
    border-radius: 12px;
    padding: 0 16px;
    transition: all 0.3s ease;
    min-height: 52px;
  }

  .search-input-wrapper-hero.focused {
    background: white;
    border-color: var(--primary-color, #ff6b35);
    box-shadow: 0 0 0 4px rgba(255, 107, 53, 0.1);
  }

  .search-icon-hero {
    color: #64748b;
    margin-right: 12px;
    display: flex;
    align-items: center;
    transition: color 0.3s ease;
  }

  .search-input-wrapper-hero.focused .search-icon-hero {
    color: var(--primary-color, #ff6b35);
  }

  .search-input-hero {
    flex: 1;
    border: none;
    background: transparent;
    font-size: 1.1rem;
    color: #0D1B2A;
    outline: none;
    padding: 0;
    font-weight: 500;
  }

  .search-input-hero::placeholder {
    color: #94a3b8;
    font-weight: 400;
  }

  .clear-search-btn-hero {
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

  .clear-search-btn-hero:hover {
    background: #cbd5e1;
    color: #475569;
    transform: scale(1.1);
  }

  /* Filtros rápidos */
  .quick-filters-hero {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
  }

  .quick-filter-btn-hero {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 8px 12px;
    background: #f1f5f9;
    border: 1px solid #e2e8f0;
    border-radius: 20px;
    color: #64748b;
    font-size: 0.85rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.3s ease;
  }

  .quick-filter-btn-hero:hover,
  .quick-filter-btn-hero.active {
    background: var(--primary-color, #ff6b35);
    color: white;
    border-color: var(--primary-color, #ff6b35);
    transform: translateY(-1px);
    box-shadow: 0 2px 8px rgba(255, 107, 53, 0.2);
  }

  .filter-icon {
    font-size: 0.9rem;
  }

  .filter-text {
    white-space: nowrap;
  }

  /* Acciones de búsqueda */
  .search-actions-hero {
    display: flex;
    flex-direction: column;
    gap: 8px;
    flex-shrink: 0;
  }

  .filters-btn-hero {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    padding: 12px 16px;
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    border-radius: 10px;
    color: #64748b;
    font-weight: 600;
    font-size: 0.9rem;
    cursor: pointer;
    transition: all 0.3s ease;
    min-height: 44px;
    position: relative;
  }

  .filters-btn-hero:hover,
  .filters-btn-hero.active {
    background: #0D1B2A;
    color: white;
    border-color: #0D1B2A;
  }

  .filters-btn-hero.has-filters {
    background: var(--primary-color, #ff6b35);
    color: white;
    border-color: var(--primary-color, #ff6b35);
  }

  .filters-count-hero {
    position: absolute;
    top: -6px;
    right: -6px;
    background: #dc2626;
    color: white;
    border-radius: 50%;
    width: 20px;
    height: 20px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 0.7rem;
    font-weight: 700;
    border: 2px solid white;
  }

  .search-btn-hero {
    background: linear-gradient(135deg, var(--primary-color, #ff6b35) 0%, #ff8c69 100%);
    color: white;
    border: none;
    border-radius: 12px;
    padding: 12px 20px;
    font-weight: 700;
    font-size: 1rem;
    cursor: pointer;
    transition: all 0.3s ease;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    min-height: 52px;
    position: relative;
  }

  .search-btn-hero:not(:disabled):hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 20px rgba(255, 107, 53, 0.3);
  }

  .search-btn-hero:disabled {
    opacity: 0.7;
    cursor: not-allowed;
    transform: none;
  }

  .search-btn-hero.loading {
    color: transparent;
  }

  .search-btn-spinner-hero {
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

  .popular-searches-quick {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.popular-quick-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 12px;
  background: #f1f5f9;
  border: 1px solid #e2e8f0;
  border-radius: 20px;
  color: #64748b;
  font-size: 0.85rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
}

.popular-quick-btn:hover {
  background: var(--primary-color, #ff6b35);
  color: white;
  border-color: var(--primary-color, #ff6b35);
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(255, 107, 53, 0.2);
}

.popular-emoji {
  font-size: 0.9rem;
}

.popular-text {
  white-space: nowrap;
}

  /* Filtros avanzados */
  .advanced-filters-hero {
    border-top: 1px solid #f1f5f9;
    padding: 20px;
    background: #f8fafc;
  }

  .filters-grid-hero {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 16px;
    margin-bottom: 20px;
  }

  .filters-grid-hero.mobile-grid {
    grid-template-columns: 1fr 1fr;
    gap: 12px;
  }

  .filter-group-hero {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .filter-label-hero {
    font-weight: 600;
    color: #0D1B2A;
    font-size: 0.9rem;
    display: flex;
    align-items: center;
    gap: 6px;
  }

  .filter-select-hero {
    padding: 10px 12px;
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    background: white;
    font-size: 0.9rem;
    color: #0D1B2A;
    cursor: pointer;
    transition: all 0.3s ease;
    appearance: none;
    background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='m6 8 4 4 4-4'/%3e%3c/svg%3e");
    background-position: right 10px center;
    background-repeat: no-repeat;
    background-size: 16px;
    padding-right: 36px;
  }

  .filter-select-hero:focus {
    outline: none;
    border-color: var(--primary-color, #ff6b35);
    box-shadow: 0 0 0 3px rgba(255, 107, 53, 0.1);
  }

  /* Acciones de filtros */
  .filter-actions-hero {
    display: flex;
    gap: 12px;
    justify-content: flex-end;
    padding-top: 20px;
    border-top: 1px solid #e2e8f0;
  }

  .clear-btn-hero,
  .apply-btn-hero {
    padding: 10px 20px;
    border-radius: 8px;
    font-weight: 600;
    font-size: 0.9rem;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 6px;
    transition: all 0.3s ease;
    min-height: 40px;
  }

  .clear-btn-hero {
    background: white;
    border: 1px solid #e2e8f0;
    color: #64748b;
  }

  .clear-btn-hero:hover:not(:disabled) {
    border-color: #cbd5e1;
    color: #475569;
  }

  .clear-btn-hero:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .apply-btn-hero {
    background: #0D1B2A;
    color: white;
    border: none;
    flex: 1;
    justify-content: center;
    max-width: 200px;
  }

  .apply-btn-hero:hover:not(:disabled) {
    background: #1e293b;
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(13, 27, 42, 0.2);
  }

  .apply-btn-hero:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
  }

  @keyframes spin {
    0% { transform: translate(-50%, -50%) rotate(0deg); }
    100% { transform: translate(-50%, -50%) rotate(360deg); }
  }

  /* Responsive */
  @media (max-width: 768px) {
    .search-main-hero {
      flex-direction: column;
      padding: 16px;
      gap: 12px;
    }

    .search-actions-hero {
      flex-direction: row;
      width: 100%;
    }

    .filters-btn-hero,
    .search-btn-hero {
      flex: 1;
      min-height: 48px;
    }

    .quick-filters-hero {
      justify-content: center;
    }
    .popular-searches-quick {
      justify-content: center;
    }

    .filter-actions-hero {
      flex-direction: column;
      gap: 8px;
    }

    .clear-btn-hero,
    .apply-btn-hero {
      max-width: none;
    }
  }

  @media (max-width: 480px) {
    .search-main-hero {
      padding: 12px;
    }

    .search-input-wrapper-hero {
      min-height: 48px;
      padding: 0 12px;
    }

    .search-input-hero {
      font-size: 16px; /* Previene zoom en iOS */
    }

    .filters-grid-hero.mobile-grid {
      grid-template-columns: 1fr;
    }

    .quick-filters-hero {
      gap: 6px;
    }

    .quick-filter-btn-hero {
      padding: 6px 10px;
      font-size: 0.8rem;
    }
  }
</style>