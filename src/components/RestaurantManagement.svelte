<!-- src/components/RestaurantManagement.svelte - Con Vista de Lista -->
<script>
  import { onMount, createEventDispatcher } from 'svelte';
  import { restaurantStore } from '../stores/restaurantStore.ts';
  import { restaurantUtils } from '../utils/restaurantUtils.ts';
  import CreateRestaurant from './CreateRestaurant.svelte';
  import RestaurantCard from './RestaurantCard20.svelte';
  import RestaurantListItem from './RestaurantListItem.svelte';
  
  // Props
  let {
    currentUser = null,
    
    showCreateButton = true,
    maxRestaurants = null
  } = $props();
  
  const dispatch = createEventDispatcher();
  
  // Estados del componente usando runes de Svelte 5
  let showCreateModal = $state(false);
  let selectedRestaurant = $state(null);
  let searchQuery = $state('');
  let sortBy = $state('updatedAt');
  let sortOrder = $state('desc');
  let filterBy = $state('all');
  
  // Estados derivados del store
  let loading = $derived($restaurantStore.isLoadingUser);
  let restaurants = $derived($restaurantStore.userRestaurants);
  let apiError = $derived($restaurantStore.error);
  
  // Restaurantes filtrados y ordenados
  let filteredRestaurants = $derived(getFilteredAndSortedRestaurants(
    restaurants || [],
    searchQuery, 
    filterBy, 
    sortBy, 
    sortOrder
  ));
  
  // Estadísticas generales
  let stats = $derived(calculateOverallStats(restaurants || []));
  
  // Verificar límite de restaurantes
  let canCreateMore = $derived(maxRestaurants ? (restaurants?.length || 0) < maxRestaurants : true);
  
  onMount(async () => {
    restaurantStore.clearAllErrors();
    try {
      await restaurantStore.loadUserRestaurants();
    } catch (error) {
      console.error('Error loading user restaurants:', error);
    }
  });
  
  // Funciones de filtrado y ordenamiento
  function getFilteredAndSortedRestaurants(restaurants, query, filter, sort, order) {
    if (!Array.isArray(restaurants)) {
      return [];
    }
    
    let filtered = [...restaurants];
    
    if (query && query.trim()) {
      const searchLower = query.toLowerCase();
      filtered = filtered.filter(restaurant => 
        restaurant.name?.toLowerCase().includes(searchLower) ||
        restaurant.description?.toLowerCase().includes(searchLower) ||
        restaurant.username?.toLowerCase().includes(searchLower) ||
        restaurant.address?.toLowerCase().includes(searchLower)
      );
    }
    
    switch (filter) {
      case 'complete':
        filtered = filtered.filter(r => {
          const analysis = restaurantUtils.analyzeRestaurantCompleteness(r);
          return analysis && analysis.score >= 70;
        });
        break;
      case 'incomplete':
        filtered = filtered.filter(r => {
          const analysis = restaurantUtils.analyzeRestaurantCompleteness(r);
          return analysis && analysis.score < 70;
        });
        break;
      case 'active':
        filtered = filtered.filter(r => r.active !== false);
        break;
      case 'inactive':
        filtered = filtered.filter(r => r.active === false);
        break;
    }
    
    filtered.sort((a, b) => {
      let comparison = 0;
      
      switch (sort) {
        case 'name':
          comparison = (a.name || '').localeCompare(b.name || '');
          break;
        case 'createdAt':
          comparison = new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime();
          break;
        case 'updatedAt':
          comparison = new Date(a.updatedAt || 0).getTime() - new Date(b.updatedAt || 0).getTime();
          break;
        case 'completeness':
          const scoreA = restaurantUtils.analyzeRestaurantCompleteness(a)?.score || 0;
          const scoreB = restaurantUtils.analyzeRestaurantCompleteness(b)?.score || 0;
          comparison = scoreA - scoreB;
          break;
        default:
          comparison = 0;
      }
      
      return order === 'desc' ? -comparison : comparison;
    });
    
    return filtered;
  }
  
  // Calcular estadísticas generales
  function calculateOverallStats(restaurants) {
    if (!Array.isArray(restaurants) || restaurants.length === 0) {
      return {
        total: 0,
        complete: 0,
        incomplete: 0,
        active: 0,
        inactive: 0,
        averageCompleteness: 0,
        totalVisits: 0,
        totalFavorites: 0,
        averageRating: 0
      };
    }
    
    const complete = restaurants.filter(r => {
      const analysis = restaurantUtils.analyzeRestaurantCompleteness(r);
      return analysis && analysis.score >= 70;
    }).length;
    
    const active = restaurants.filter(r => r.active !== false).length;
    
    const completenessScores = restaurants.map(r => {
      const analysis = restaurantUtils.analyzeRestaurantCompleteness(r);
      return analysis?.score || 0;
    });
    
    const averageCompleteness = completenessScores.length > 0 
      ? completenessScores.reduce((sum, score) => sum + score, 0) / restaurants.length 
      : 0;
    
    const totalVisits = restaurants.reduce((sum, r) => sum + (r.analytics?.visitsCount || 0), 0);
    const totalFavorites = restaurants.reduce((sum, r) => sum + (r.analytics?.favoritesCount || 0), 0);
    
    const ratingsSum = restaurants.reduce((sum, r) => sum + (r.analytics?.averageRating || 0), 0);
    const restaurantsWithRating = restaurants.filter(r => (r.analytics?.averageRating || 0) > 0).length;
    const averageRating = restaurantsWithRating > 0 ? ratingsSum / restaurantsWithRating : 0;
    
    return {
      total: restaurants.length,
      complete,
      incomplete: restaurants.length - complete,
      active,
      inactive: restaurants.length - active,
      averageCompleteness: Math.round(averageCompleteness),
      totalVisits,
      totalFavorites,
      averageRating: Math.round(averageRating * 10) / 10
    };
  }
  
  // Event handlers
  function handleCreateClick() {
    if (!canCreateMore) {
      alert(`Has alcanzado el límite máximo de ${maxRestaurants} restaurantes`);
      return;
    }
    showCreateModal = true;
  }
  
  async function handleRestaurantCreated(event) {
    showCreateModal = false;
    try {
      await restaurantStore.loadUserRestaurants(true);
    } catch (error) {
      console.error('Error reloading restaurants:', error);
    }
    dispatch('restaurantCreated', { restaurant: event.detail.restaurant });
  }
  
  function handleEditRestaurant(event) {
    selectedRestaurant = event.detail.restaurant;
    dispatch('editRestaurant', { restaurant: event.detail.restaurant });
  }
  
  async function handleDeleteRestaurant(event) {
    const restaurant = event.detail.restaurant;
    const confirmed = confirm(
      `¿Estás seguro de que quieres eliminar "${restaurant.name}"?\n\nEsta acción no se puede deshacer.`
    );
    
    if (confirmed) {
      try {
        const result = await restaurantStore.deleteRestaurant(restaurant.id);
        if (result.success) {
          dispatch('restaurantDeleted', { restaurant });
        }
      } catch (error) {
        console.error('Error deleting restaurant:', error);
      }
    }
  }
  
  function handleViewRestaurant(event) {
    dispatch('viewRestaurant', { restaurant: event.detail.restaurant });
  }
  
  async function handleRefresh() {
    try {
      await restaurantStore.loadUserRestaurants(true);
    } catch (error) {
      console.error('Error refreshing restaurants:', error);
    }
  }
  
  function toggleSortOrder() {
    sortOrder = sortOrder === 'asc' ? 'desc' : 'asc';
  }
  
  function clearFilters() {
    searchQuery = '';
    filterBy = 'all';
  }
  
  function getCompletenessColor(score) {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    if (score >= 40) return 'text-orange-600';
    return 'text-red-600';
  }
  
  function getCompletenessLabel(score) {
    if (score >= 80) return 'Excelente';
    if (score >= 60) return 'Bueno';
    if (score >= 40) return 'Regular';
    return 'Básico';
  }
</script>

<div class="restaurant-management container">
  <!-- Header con estadísticas y controles -->
  <div class="management-header card mb-2xl">
    <!-- Estadísticas resumidas -->
    <div class="stats-overview grid gap-lg grid-cols-2 md:grid-cols-4 mb-xl">
      <div class="stat-card bg-gray-light border rounded-lg p-lg text-center">
        <div class="stat-value text-2xl font-bold text-primary">{stats.total}</div>
        <div class="stat-label text-sm text-muted mt-xs">Restaurantes</div>
      </div>
      <div class="stat-card bg-gray-light border rounded-lg p-lg text-center">
        <div class="stat-value text-2xl font-bold text-primary">{stats.averageCompleteness}%</div>
        <div class="stat-label text-sm text-muted mt-xs">Completitud Promedio</div>
      </div>
      <div class="stat-card bg-gray-light border rounded-lg p-lg text-center">
        <div class="stat-value text-2xl font-bold text-primary">{stats.totalVisits}</div>
        <div class="stat-label text-sm text-muted mt-xs">Visitas Totales</div>
      </div>
      <div class="stat-card bg-gray-light border rounded-lg p-lg text-center">
        <div class="stat-value text-2xl font-bold text-primary">{stats.averageRating.toFixed(1)}</div>
        <div class="stat-label text-sm text-muted mt-xs">Rating Promedio</div>
      </div>
    </div>
    
    <!-- Controles de vista -->
    <div class="view-controls flex flex-wrap gap-md items-center">
      
      <!-- Buscador -->
      <div class="search-box relative flex-1 min-w-[200px]">
        <i class="fa-solid fa-magnifying-glass absolute left-md top-1/2 -translate-y-1/2 text-muted"></i>
        <input
          type="text"
          placeholder="Buscar restaurantes..."
          bind:value={searchQuery}
          class="input pl-2xl"
        />
      </div>

      <!-- Controles de filtro -->
      <div class="filter-controls flex gap-xs items-center">
        <select bind:value={filterBy} class="input">
          <option value="all">Todos</option>
          <option value="complete">Completos</option>
          <option value="incomplete">Incompletos</option>
          <option value="active">Activos</option>
          <option value="inactive">Inactivos</option>
        </select>
        <select bind:value={sortBy} class="input">
          <option value="updatedAt">Última actualización</option>
          <option value="createdAt">Fecha de creación</option>
          <option value="name">Nombre</option>
          <option value="completeness">Completitud</option>
        </select>
        <button
          class="btn-icon"
          onclick={toggleSortOrder}
          title={sortOrder === 'asc' ? 'Cambiar a descendente' : 'Cambiar a ascendente'}
        >
          <i class={sortOrder === 'asc' ? 'fa-solid fa-arrow-up' : 'fa-solid fa-arrow-down'}></i>
        </button>
      </div>

      <!-- Acciones -->
      <div class="action-controls flex gap-xs items-center">
        <button class="btn-icon" onclick={handleRefresh} title="Actualizar">
          <i class="fa-solid fa-arrows-rotate"></i>
        </button>
        {#if showCreateButton}
          <button
            class="btn btn-primary"
            onclick={handleCreateClick}
            disabled={!canCreateMore || loading}
          >
            <i class="fa-solid fa-plus"></i>
            <span class="desktop-only">Crear Restaurante</span>
          </button>
        {/if}
      </div>
    </div>
  </div>

  <!-- Contenido principal -->
  <div class="management-content min-h-[400px]">
    {#if loading}
      <div class="loading-state flex flex-col items-center justify-center p-4xl text-center bg-white rounded-xl shadow">
        <span class="spinner-large animate-spin mb-md"></span>
        <p class="text-lg text-muted">Cargando restaurantes...</p>
      </div>
    {:else if apiError}
      <div class="error-state flex flex-col items-center justify-center p-4xl text-center bg-white rounded-xl shadow">
        <i class="fa-solid fa-circle-exclamation text-4xl text-error mb-md"></i>
        <h3 class="text-xl font-semibold text-error mb-xs">Error cargando restaurantes</h3>
        <p class="text-muted mb-md">{apiError}</p>
        <button class="btn btn-primary" onclick={handleRefresh}>
          Intentar de nuevo
        </button>
      </div>
    {:else if filteredRestaurants.length === 0}
      <div class="empty-state flex flex-col items-center justify-center p-4xl text-center bg-white rounded-xl shadow">
        {#if searchQuery || filterBy !== 'all'}
          <i class="fa-solid fa-magnifying-glass text-4xl text-accent mb-md"></i>
          <h3 class="text-xl font-semibold text-primary mb-xs">No se encontraron restaurantes</h3>
          <p class="text-muted mb-md">Intenta cambiar los filtros de búsqueda</p>
          <button class="btn btn-secondary" onclick={clearFilters}>
            Limpiar filtros
          </button>
        {:else}
          <i class="fa-solid fa-utensils text-4xl text-accent mb-md"></i>
          <h3 class="text-xl font-semibold text-primary mb-xs">Aún no tienes restaurantes</h3>
          <p class="text-muted mb-md">Crea tu primer restaurante para empezar</p>
          {#if showCreateButton && canCreateMore}
            <button class="btn btn-primary" onclick={handleCreateClick}>
              Crear mi primer restaurante
            </button>
          {/if}
        {/if}
      </div>
    {:else}
      <div class="restaurants-container-wrapper">
        <div class="restaurants-container bg-white rounded-xl p-xl shadow">
            <!-- Vista de Lista Compacta -->
            <div class="restaurants-list">
              <div class="list-header mb-lg">
                <h3 class="text-lg font-semibold text-primary">
                  {filteredRestaurants.length} restaurante{filteredRestaurants.length !== 1 ? 's' : ''}
                </h3>
              </div>
              <div class="restaurants-list-container">
                {#each filteredRestaurants as restaurant (restaurant.id)}
                  <RestaurantListItem
                    {restaurant}
                    currentUserId={currentUser?.id}
                    showActions={true}
                    on:edit={handleEditRestaurant}
                    on:delete={handleDeleteRestaurant}
                    on:view={handleViewRestaurant}
                  />
                {/each}
              </div>
            </div>
        </div>
      </div>
    {/if}
  </div>

  <!-- Modal de creación -->
  {#if showCreateModal}
    <div class="modal-overlay flex items-center justify-center p-md">
      <div class="modal-content relative max-w-xl w-full max-h-[90vh] overflow-y-auto rounded-xl shadow bg-white" onclick={(e) => e.stopPropagation()}>
        <CreateRestaurant
          on:created={handleRestaurantCreated}
        />
        <button
          class="modal-close absolute top-md right-md w-8 h-8 bg-white border border-accent rounded-lg text-muted flex items-center justify-center transition-all z-10"
          onclick={() => showCreateModal = false}
        >
          <i class="fa-solid fa-xmark"></i>
        </button>
      </div>
    </div>
  {/if}
</div>

<style>
  /* SELECTOR DE VISTA */
  .view-selector {
    display: flex;
    background: var(--bg-tertiary);
    border-radius: var(--radius-lg);
    padding: 4px;
    border: 1px solid var(--bg-accent);
  }

  .view-toggle {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.5rem 0.75rem;
    border: none;
    background: transparent;
    color: var(--text-muted);
    border-radius: var(--radius-md);
    cursor: pointer;
    transition: all var(--transition-fast);
    font-size: var(--font-sm);
    font-weight: var(--weight-medium);
    min-height: 36px;
  }

  .view-toggle:hover {
    color: var(--text-primary);
    background: rgba(255, 255, 255, 0.5);
  }

  .view-toggle.active {
    background: var(--bg-primary);
    color: var(--primary-color);
    box-shadow: var(--shadow-sm);
    font-weight: var(--weight-semibold);
  }

  .view-toggle i {
    font-size: 1rem;
  }

  /* GRID OPTIMIZADO */
  .restaurants-grid-optimized {
    display: grid;
    gap: 1.5rem;
    grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
    justify-items: center;
    align-items: start;
    width: 100%;
    max-width: 1400px;
    margin: 0 auto;
  }

  @media (min-width: 640px) {
    .restaurants-grid-optimized {
      grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
      gap: 1.75rem;
    }
  }

  @media (min-width: 1024px) {
    .restaurants-grid-optimized {
      grid-template-columns: repeat(auto-fill, minmax(320px, 360px));
      gap: 2rem;
    }
  }

  /* LISTA DE RESTAURANTES */
  .restaurants-list {
    max-width: 900px;
    margin: 0 auto;
  }

  .restaurants-list-container {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  .list-header {
    padding-bottom: 0.75rem;
    /* border-bottom: 1px solid var(--bg-accent); */
  }

  /* CONTENEDOR PRINCIPAL */
  .restaurants-container-wrapper {
    max-width: 1400px;
    margin: 0 auto;
    width: 100%;
  }

  /* ESTILOS PARA ANALYTICS */
  .score-circle.text-green-600 { 
    border-color: var(--success); 
    color: var(--success); 
  }
  .score-circle.text-yellow-600 { 
    border-color: var(--warning); 
    color: var(--warning); 
  }
  .score-circle.text-orange-600 { 
    border-color: #ea580c; 
    color: #ea580c; 
  }
  .score-circle.text-red-600 { 
    border-color: var(--error); 
    color: var(--error); 
  }

  .field-tag {
    padding: 0.125rem 0.5rem;
    border-radius: var(--radius-sm);
    font-size: var(--font-xs);
    font-weight: var(--weight-medium);
  }

  .field-tag.completed {
    background: var(--success-bg);
    color: var(--success);
  }

  .field-tag.missing {
    background: var(--error-bg);
    color: var(--error);
  }

  .field-tag.more {
    background: var(--bg-accent);
    color: var(--text-secondary);
  }

  /* LOADING STATE */
  .spinner-large {
    width: 3rem;
    height: 3rem;
    border: 3px solid var(--bg-accent);
    border-top: 3px solid var(--primary-color);
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }

  @keyframes spin {
    to { transform: rotate(360deg); }
  }

  /* RESPONSIVE */
  @media (max-width: 768px) {
    .view-controls {
      flex-direction: column;
      align-items: stretch;
      gap: 1rem;
    }

    .view-selector {
      order: -1;
      align-self: center;
    }

    .filter-controls {
      flex-wrap: wrap;
    }

    .action-controls {
      justify-content: center;
    }
  }

  @media (max-width: 640px) {
    .view-toggle span {
      display: none;
    }

    .restaurants-grid-optimized {
      grid-template-columns: 1fr;
      gap: 1rem;
    }
  }

  /* MODAL */
  .modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.5);
    backdrop-filter: blur(4px);
    z-index: var(--z-modal);
  }

  .modal-content {
    position: relative;
    background: var(--bg-primary);
    border-radius: var(--radius-xl);
    box-shadow: var(--shadow-2xl);
    max-width: 600px;
    width: 90%;
    max-height: 90vh;
    overflow-y: auto;
  }

  .modal-close {
    position: absolute;
    top: 1rem;
    right: 1rem;
    width: 32px;
    height: 32px;
    background: var(--bg-primary);
    border: 1px solid var(--bg-accent);
    border-radius: var(--radius-md);
    color: var(--text-muted);
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all var(--transition-fast);
    z-index: 10;
  }

  .modal-close:hover {
    background: var(--bg-tertiary);
    color: var(--text-primary);
    transform: scale(1.05);
  }
</style>