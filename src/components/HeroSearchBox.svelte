<script lang="ts">
  // HeroSearchBox.svelte - Búsqueda directa con autocomplete
  import { onMount, createEventDispatcher } from 'svelte';
  import { fly, fade, scale } from 'svelte/transition';
  import { quintOut } from 'svelte/easing';
  
  // Servicios de búsqueda
  import { searchRestaurants } from '../services/apiRatingService';
  import { searchDishes } from '../services/apiDishService';
  
  import type { RestaurantSearchResult } from '../interfaces/restaurantRating';
  import type { DishRating, DishWithRatings } from '../interfaces/dishRating';
    import { openModal } from '../stores/modalStore';

  // Props
  const { isMobile = false, onDishSelect } = $props();

  const dispatch = createEventDispatcher();

  // Estados del componente
  let searchValue = $state('');
  let isSearching = $state(false);
  let showDropdown = $state(false);
  let searchInputElement: HTMLInputElement;
  let dropdownElement: HTMLElement;
  let focusedIndex = $state(-1);
  
  // Resultados de búsqueda
  let searchResults = $state({
    restaurants: [] as RestaurantSearchResult[],
    dishes: [] as DishWithRatings[],
    total: 0
  });

  // Referencias para navegación con teclado
  let searchItems: HTMLElement[] = [];

  // Debounce timer
  let searchTimeout: ReturnType<typeof setTimeout>;

  // Estados de interacción
  let isInputFocused = $state(false);
  let hasSearched = $state(false);

  // onDishSelect prop is now accessed via $props()
  // (already destructured above)

  onMount(() => {
    // Cerrar dropdown al hacer clic afuera
    document.addEventListener('click', handleClickOutside);
    
    return () => {
      document.removeEventListener('click', handleClickOutside);
      if (searchTimeout) clearTimeout(searchTimeout);
      // Limpiar backdrop al desmontar
      const backdrop = document.querySelector('.search-backdrop');
      if (backdrop) {
        backdrop.remove();
      }
    };
  });

  function handleClickOutside(event: Event) {
    if (dropdownElement && !dropdownElement.contains(event.target as Node) && 
        !searchInputElement.contains(event.target as Node)) {
      closeDropdown();
    }
  }

  function closeDropdown() {
    showDropdown = false;
    focusedIndex = -1;
    // Remover backdrop si existe
    const backdrop = document.querySelector('.search-backdrop');
    if (backdrop) {
      backdrop.remove();
    }
  }

  function openDropdown() {
    if (searchValue.trim().length >= 2) {
      showDropdown = true;
      
      // Agregar backdrop en móvil para mejor UX
      if (isMobile && !document.querySelector('.search-backdrop')) {
        const backdrop = document.createElement('div');
        backdrop.className = 'search-backdrop';
        backdrop.style.cssText = `
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.1);
          z-index: 99;
          backdrop-filter: blur(2px);
        `;
        backdrop.addEventListener('click', closeDropdown);
        document.body.appendChild(backdrop);
      }
    }
  }

  // Función de búsqueda con debounce
  async function performSearch(query: string) {
    if (query.trim().length < 2) {
      searchResults = { restaurants: [], dishes: [], total: 0 };
      showDropdown = false;
      return;
    }

    isSearching = true;
    hasSearched = true;

    try {
      // Búsquedas en paralelo con límites para preview
      const [restaurantsResponse, dishesResponse] = await Promise.all([
        searchRestaurants({ search: query }, 1, 6),
        searchDishes({ search: query }, 1, 6)
      ]);

      searchResults = {
        restaurants: restaurantsResponse.restaurants || [],
        dishes: dishesResponse.dishes || [],
        total: (restaurantsResponse.pagination?.total || 0) + (dishesResponse.pagination?.total || 0)
      };

      showDropdown = true;
      focusedIndex = -1;

    } catch (error) {
      console.error('Error en búsqueda:', error);
      searchResults = { restaurants: [], dishes: [], total: 0 };
    } finally {
      isSearching = false;
    }
  }

  // Debounced search
  function handleInput() {
    if (searchTimeout) clearTimeout(searchTimeout);
    
    if (searchValue.trim().length === 0) {
      searchResults = { restaurants: [], dishes: [], total: 0 };
      showDropdown = false;
      // Limpiar backdrop cuando no hay búsqueda
      const backdrop = document.querySelector('.search-backdrop');
      if (backdrop) {
        backdrop.remove();
      }
      return;
    }

    if (searchValue.trim().length >= 2) {
      searchTimeout = setTimeout(() => {
        performSearch(searchValue);
      }, 300);
    }
  }

  // Navegación con teclado
  function handleKeydown(event: KeyboardEvent) {
    if (!showDropdown) {
      if (event.key === 'Enter') {
        handleSearchSubmit();
      }
      return;
    }

    const totalItems = searchResults.restaurants.length + searchResults.dishes.length + 
                      (searchResults.total > (searchResults.restaurants.length + searchResults.dishes.length) ? 1 : 0);

    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        focusedIndex = focusedIndex < totalItems - 1 ? focusedIndex + 1 : 0;
        break;
      case 'ArrowUp':
        event.preventDefault();
        focusedIndex = focusedIndex > 0 ? focusedIndex - 1 : totalItems - 1;
        break;
      case 'Enter':
        event.preventDefault();
        if (focusedIndex >= 0) {
          handleItemSelect(focusedIndex);
        } else {
          handleSearchSubmit();
        }
        break;
      case 'Escape':
        closeDropdown();
        searchInputElement.blur();
        break;
    }
  }

  function handleItemSelect(index: number) {
    const restaurantsCount = searchResults.restaurants.length;
    const dishesCount = searchResults.dishes.length;
    const hasViewAll = searchResults.total > (restaurantsCount + dishesCount);

    if (index < restaurantsCount) {
      // Seleccionar restaurante
      const restaurant = searchResults.restaurants[index];
      window.location.href = `/${restaurant.username}`;
    } else if (index < restaurantsCount + dishesCount) {
      // Seleccionar platillo - ir a búsqueda con filtro
      const dish = searchResults.dishes[index - restaurantsCount];
      handleSearchSubmit();
    } else if (hasViewAll) {
      // Ver todos los resultados
      handleSearchSubmit();
    }
  }

  function handleSearchSubmit() {
    if (searchValue.trim()) {
      // Redirigir a página de búsqueda con query
      const params = new URLSearchParams({ search: searchValue.trim() });
      window.location.href = `/buscar?${params.toString()}`;
    }
  }

  function handleFocus() {
    isInputFocused = true;
    openDropdown();
  }

  function handleBlur() {
    isInputFocused = false;
    // Delay para permitir clics en dropdown
    setTimeout(() => {
      if (!dropdownElement?.matches(':hover')) {
        closeDropdown();
      }
    }, 150);
  }

  function handleRestaurantClick(restaurant: RestaurantSearchResult) {
    window.location.href = `/${restaurant.username}`;
  }

  function handleDishClick(dish: DishWithRatings) {
  if (onDishSelect) {
    // Si se proporciona callback, usarlo (cuando se usa desde HomePage)
    // onDishSelect(dish);
    showDishDetails(dish);
    
  } else {
    // Si no, manejar internamente (cuando se usa standalone)
    const selectedDish = dish;
    const showDishModal = true;
  }
  closeDropdown();
}
function showDishDetails(dish:DishWithRatings) {
    openModal('dish', {
      dish: dish
    });
  }

  function highlightMatch(text: string, query: string): string {
    if (!query.trim()) return text;
    
    const regex = new RegExp(`(${query.trim()})`, 'gi');
    return text.replace(regex, '<mark>$1</mark>');
  }

  // Reactive para actualizar el input
  $effect(() => {
    if (searchValue !== undefined) {
      handleInput();
    }
  });
</script>

<div class="hero-search-container" class:mobile={isMobile}>
  <div class="search-box" class:focused={isInputFocused} class:has-results={showDropdown}>
    <div class="search-input-wrapper">
      <div class="search-icon">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M21 21L16.514 16.506L21 21ZM19 10.5C19 15.194 15.194 19 10.5 19C5.806 19 2 15.194 2 10.5C2 5.806 5.806 2 10.5 2C15.194 2 19 5.806 19 10.5Z" 
                stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </div>
      
      <input 
        bind:this={searchInputElement}
        bind:value={searchValue}
        type="text" 
        placeholder={isMobile ? 'Buscar restaurantes, platillos...' : 'Buscar restaurantes, platillos o cocinas...'}
        class="search-input"
        onfocus={handleFocus}
        onblur={handleBlur}
        onkeydown={handleKeydown}
        autocomplete="off"
        spellcheck="false"
      />
      
      {#if isSearching}
        <div class="search-loading">
          <div class="loading-spinner"></div>
        </div>
      {:else if searchValue.trim()}
        <button 
          type="button" 
          class="clear-btn"
          onclick={() => { searchValue = ''; closeDropdown(); }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </button>
      {/if}
    </div>

    <button 
      type="button"
      class="search-submit-btn"
      onclick={handleSearchSubmit}
      disabled={!searchValue.trim()}
    >
      <span class="submit-text">{isMobile ? 'Buscar' : 'Buscar'}</span>
      <svg class="submit-arrow" width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M5 12H19M19 12L12 5M19 12L12 19" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    </button>
  </div>

  <!-- Dropdown de resultados -->
  {#if showDropdown && (searchResults.restaurants.length > 0 || searchResults.dishes.length > 0)}
    <div 
      bind:this={dropdownElement}
      class="search-dropdown"
      in:fly={{ y: -10, duration: 200, easing: quintOut }}
      out:fade={{ duration: 150 }}
    >
      <!-- Restaurantes -->
      {#if searchResults.restaurants.length > 0}
        <div class="results-section">
          <div class="section-header">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M3 9L12 2L21 9V20C21 20.5523 20.4477 21 20 21H4C3.44772 21 3 20.5523 3 20V9Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
            <span>Restaurantes</span>
          </div>
          
          {#each searchResults.restaurants as restaurant, index}
            <button 
              class="result-item"
              class:focused={focusedIndex === index}
              onclick={() => handleRestaurantClick(restaurant)}
            >
              <div class="item-image">
                {#if restaurant.image || restaurant.imageProfile}
                  <img src={restaurant.image || restaurant.imageProfile} alt={restaurant.name} />
                {:else}
                  <div class="placeholder-icon">🍽️</div>
                {/if}
              </div>
              
              <div class="item-content">
                <div class="item-title">{@html highlightMatch(restaurant.name!, searchValue)}</div>
                <div class="item-meta">
                  {#if restaurant.cuisineType?.[0]}
                    <span class="cuisine">{restaurant.cuisineType[0]}</span>
                  {/if}
                  {#if restaurant.analytics?.averageRating}
                    <span class="rating">⭐ {restaurant.analytics.averageRating.toFixed(1)}</span>
                  {/if}
                </div>
                {#if restaurant.address}
                  <div class="item-description">{restaurant.address}</div>
                {/if}
              </div>
            </button>
          {/each}
        </div>
      {/if}

      <!-- Platillos -->
      {#if searchResults.dishes.length > 0}
        <div class="results-section">
          <div class="section-header">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M16 7C16 9.20914 14.2091 11 12 11C9.79086 11 8 9.20914 8 7C8 4.79086 9.79086 3 12 3C14.2091 3 16 4.79086 16 7Z" stroke="currentColor" stroke-width="2"/>
              <path d="M12 14V21M8 21H16" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
            </svg>
            <span>Platillos</span>
          </div>
          
          {#each searchResults.dishes as dish, index}
            <button 
              class="result-item"
              class:focused={focusedIndex === (searchResults.restaurants.length + index)}
              onclick={() => handleDishClick(dish)}
            >
              <div class="item-image">
                {#if dish.image}
                  <img src={dish.image} alt={dish.name} />
                {:else}
                  <div class="placeholder-icon">🍽️</div>
                {/if}
              </div>
              
              <div class="item-content">
                <div class="item-title">{@html highlightMatch(dish.name, searchValue)}</div>
                <div class="item-meta">
                  <span class="price">${dish.price.toFixed(2)}</span>
                  {#if dish.rating}
                    <span class="rating">⭐ {dish.rating.toFixed(1)}</span>
                  {/if}
                </div>
                {#if dish.description}
                  <div class="item-description">{dish.description}</div>
                {/if}
              </div>
            </button>
          {/each}
        </div>
      {/if}

      <!-- Ver todos los resultados -->
      {#if searchResults.total > (searchResults.restaurants.length + searchResults.dishes.length)}
        <div class="view-all-section">
          <button 
            class="view-all-btn"
            class:focused={focusedIndex === (searchResults.restaurants.length + searchResults.dishes.length)}
            onclick={handleSearchSubmit}
          >
            <span>Ver todos los resultados ({searchResults.total})</span>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M5 12H19M19 12L12 5M19 12L12 19" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </button>
        </div>
      {/if}
    </div>
  {:else if showDropdown && hasSearched && !isSearching && searchValue.trim().length >= 2}
    <!-- Estado sin resultados -->
    <div 
      bind:this={dropdownElement}
      class="search-dropdown no-results"
      in:fly={{ y: -10, duration: 200 }}
      out:fade={{ duration: 150 }}
    >
      <div class="empty-state">
        <div class="empty-icon">🔍</div>
        <div class="empty-title">No encontramos resultados</div>
        <div class="empty-subtitle">Intenta con otros términos de búsqueda</div>
      </div>
    </div>
  {/if}
</div>

<style>
  .hero-search-container {
    position: relative;
    width: 100%;
    max-width: 600px;
    margin: 0 auto;
    z-index: 100; /* Asegurar que el contenedor tenga z-index base */
  }

  .search-box {
    background: white;
    border: 2px solid #e2e8f0;
    border-radius: 16px;
    padding: 8px;
    display: flex;
    align-items: center;
    gap: 8px;
    transition: all 0.3s ease;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  }

  .search-box.focused {
    border-color: var(--primary-color, #ff6b35);
    box-shadow: 0 8px 30px rgba(255, 107, 53, 0.15);
    transform: translateY(-2px);
  }

  .search-box.has-results {
    border-bottom-left-radius: 8px;
    border-bottom-right-radius: 8px;
  }

  .search-input-wrapper {
    flex: 1;
    display: flex;
    align-items: center;
    gap: 12px;
    min-height: 48px;
    padding: 0 12px;
  }

  .search-icon {
    color: #64748b;
    flex-shrink: 0;
    transition: color 0.3s ease;
  }

  .search-box.focused .search-icon {
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
    width: 0px;
  }

  .search-input::placeholder {
    color: #94a3b8;
    font-weight: 400;
  }

  .search-loading {
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .loading-spinner {
    width: 16px;
    height: 16px;
    border: 2px solid #e2e8f0;
    border-top: 2px solid var(--primary-color, #ff6b35);
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }

  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }

  .clear-btn {
    background: #e2e8f0;
    border: none;
    border-radius: 50%;
    width: 24px;
    height: 24px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    color: #64748b;
    transition: all 0.2s ease;
  }

  .clear-btn:hover {
    background: #cbd5e1;
    color: #475569;
    transform: scale(1.1);
  }

  .search-submit-btn {
    background: linear-gradient(135deg, var(--primary-color, #ff6b35) 0%, #ff8c69 100%);
    color: white;
    border: none;
    border-radius: 12px;
    padding: 12px 20px;
    font-weight: 700;
    cursor: pointer;
    transition: all 0.3s ease;
    display: flex;
    align-items: center;
    gap: 8px;
    min-height: 48px;
    flex-shrink: 0;
  }

  .search-submit-btn:not(:disabled):hover {
    transform: translateY(-1px);
    box-shadow: 0 6px 20px rgba(255, 107, 53, 0.3);
  }

  .search-submit-btn:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
  }

  .submit-arrow {
    transition: transform 0.3s ease;
  }

  .search-submit-btn:hover .submit-arrow {
    transform: translateX(2px);
  }

  /* Dropdown */
  .search-dropdown {
    position: absolute;
    top: calc(100% - 8px);
    left: 0;
    right: 0;
    background: white;
    border: 2px solid var(--primary-color, #ff6b35);
    border-top: none;
    border-radius: 0 0 16px 16px;
    box-shadow: 0 8px 30px rgba(255, 107, 53, 0.15);
    max-height: 400px;
    overflow-y: auto;
    z-index: 9999; /* Aumentado para estar por encima de todo */
  }

  .search-dropdown.no-results {
    max-height: 200px;
  }

  .results-section {
    padding: 12px 0;
  }

  .results-section:not(:last-child) {
    border-bottom: 1px solid #f1f5f9;
  }

  .section-header {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px 16px;
    font-size: 0.85rem;
    font-weight: 600;
    color: #64748b;
    background: #f8fafc;
    margin-bottom: 4px;
  }

  .result-item {
    width: 100%;
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 12px 16px;
    border: none;
    background: none;
    cursor: pointer;
    transition: all 0.2s ease;
    text-align: left;
  }

  .result-item:hover,
  .result-item.focused {
    background: #f8fafc;
  }

  .item-image {
    width: 48px;
    height: 48px;
    border-radius: 8px;
    overflow: hidden;
    flex-shrink: 0;
    background: #f1f5f9;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .item-image img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .placeholder-icon {
    font-size: 1.5rem;
    color: #94a3b8;
  }

  .item-content {
    flex: 1;
    min-width: 0;
  }

  .item-title {
    font-weight: 600;
    color: #0D1B2A;
    margin-bottom: 4px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .item-title :global(mark) {
    background: rgba(255, 107, 53, 0.2);
    color: var(--primary-color, #ff6b35);
    padding: 0;
    border-radius: 2px;
  }

  .item-meta {
    display: flex;
    align-items: center;
    gap: 12px;
    font-size: 0.8rem;
    color: #64748b;
    margin-bottom: 2px;
  }

  .cuisine, .price {
    font-weight: 500;
  }

  .rating {
    display: flex;
    align-items: center;
    gap: 2px;
  }

  .item-description {
    font-size: 0.8rem;
    color: #94a3b8;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .view-all-section {
    padding: 8px;
    border-top: 1px solid #f1f5f9;
  }

  .view-all-btn {
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 12px 16px;
    border: none;
    background: #f8fafc;
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.2s ease;
    font-weight: 600;
    color: var(--primary-color, #ff6b35);
  }

  .view-all-btn:hover,
  .view-all-btn.focused {
    background: rgba(255, 107, 53, 0.1);
    transform: translateY(-1px);
  }

  /* Empty state */
  .empty-state {
    padding: 32px 16px;
    text-align: center;
  }

  .empty-icon {
    font-size: 2.5rem;
    margin-bottom: 12px;
  }

  .empty-title {
    font-weight: 600;
    color: #0D1B2A;
    margin-bottom: 4px;
  }

  .empty-subtitle {
    font-size: 0.9rem;
    color: #64748b;
  }

  /* Mobile optimizations */
  .hero-search-container.mobile .search-input {
    font-size: 16px; /* Prevent zoom on iOS */
  }

  .hero-search-container.mobile .search-submit-btn {
    padding: 12px 16px;
  }

  .hero-search-container.mobile .submit-text {
    display: none;
  }

  .hero-search-container.mobile .search-dropdown {
    z-index: 10000; /* Aún más alto en móvil */
    border-radius: 0 0 16px 16px;
    max-height: 60vh;
  }

  @media (max-width: 480px) {
    .search-box {
      padding: 6px;
      border-radius: 12px;
    }

    .search-input-wrapper {
      padding: 0 8px;
      min-height: 44px;
    }

    .search-input {
      font-size: 16px;
    }

    .search-submit-btn {
      min-height: 44px;
      border-radius: 8px;
    }

    .item-image {
      width: 40px;
      height: 40px;
    }

    .result-item {
      padding: 10px 12px;
    }
  }

  /* Scrollbar para dropdown */
  .search-dropdown::-webkit-scrollbar {
    width: 6px;
  }

  .search-dropdown::-webkit-scrollbar-track {
    background: #f1f5f9;
  }

  .search-dropdown::-webkit-scrollbar-thumb {
    background: #cbd5e1;
    border-radius: 3px;
  }

  .search-dropdown::-webkit-scrollbar-thumb:hover {
    background: #94a3b8;
  }
</style>