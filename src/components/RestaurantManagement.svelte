<!-- src/components/RestaurantManagement.svelte - Svelte 5 -->
<script>
  import { onMount, createEventDispatcher } from 'svelte';
  import { restaurantStore } from '../stores/restaurantStore.ts';
  import { restaurantUtils } from '../utils/restaurantUtils.ts';
  import CreateRestaurant from './CreateRestaurant.svelte';
  import RestaurantCard from './RestaurantCard20.svelte';
  
  // Props
  let {
    currentUser = null,
    view = $bindable('grid'), // 'grid', 'list', 'analytics'
    showCreateButton = true,
    maxRestaurants = null
  } = $props();
  
  const dispatch = createEventDispatcher();
  
  // Estados del componente usando runes de Svelte 5
  let showCreateModal = $state(false);
  let selectedRestaurant = $state(null);
  let searchQuery = $state('');
  let sortBy = $state('updatedAt'); // 'name', 'createdAt', 'updatedAt', 'completeness'
  let sortOrder = $state('desc'); // 'asc', 'desc'
  let filterBy = $state('all'); // 'all', 'complete', 'incomplete', 'active', 'inactive'
  
  // Estados derivados del store - usando runes
  let loading = $derived($restaurantStore.isLoadingUser);
  let restaurants = $derived($restaurantStore.userRestaurants);
  let apiError = $derived($restaurantStore.error);
  
  // Restaurantes filtrados y ordenados - usando $derived
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
    // Limpiar errores
    restaurantStore.clearAllErrors();
    
    // Cargar restaurantes del usuario
    try {
      await restaurantStore.loadUserRestaurants();
    } catch (error) {
      console.error('Error loading user restaurants:', error);
    }
  });
  
  // Funciones de filtrado y ordenamiento
  function getFilteredAndSortedRestaurants(restaurants, query, filter, sort, order) {
    // Verificar que restaurants sea un array válido
    if (!Array.isArray(restaurants)) {
      return [];
    }
    
    let filtered = [...restaurants];
    
    // Aplicar búsqueda
    if (query && query.trim()) {
      const searchLower = query.toLowerCase();
      filtered = filtered.filter(restaurant => 
        restaurant.name?.toLowerCase().includes(searchLower) ||
        restaurant.description?.toLowerCase().includes(searchLower) ||
        restaurant.username?.toLowerCase().includes(searchLower) ||
        restaurant.address?.toLowerCase().includes(searchLower)
      );
    }
    
    // Aplicar filtros
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
    
    // Aplicar ordenamiento
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
  
  // Manejadores de eventos
  function handleCreateClick() {
    if (!canCreateMore) {
      alert(`Has alcanzado el límite máximo de ${maxRestaurants} restaurantes`);
      return;
    }
    showCreateModal = true;
  }
  
  async function handleRestaurantCreated(event) {
    showCreateModal = false;
    
    // Recargar restaurantes
    try {
      await restaurantStore.loadUserRestaurants(true);
    } catch (error) {
      console.error('Error reloading restaurants:', error);
    }
    
    dispatch('restaurantCreated', {
      restaurant: event.detail.restaurant
    });
  }
  
  function handleEditRestaurant(event) {
    selectedRestaurant = event.detail.restaurant;
    
    dispatch('editRestaurant', {
      restaurant: event.detail.restaurant
    });
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
          dispatch('restaurantDeleted', {
            restaurant
          });
        }
      } catch (error) {
        console.error('Error deleting restaurant:', error);
      }
    }
  }
  
  function handleViewRestaurant(event) {
    dispatch('viewRestaurant', {
      restaurant: event.detail.restaurant
    });
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
  
  // Funciones de utilidad
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

<div class="restaurant-management">
  <!-- Header con estadísticas y controles -->
  <div class="management-header">
    <!-- Estadísticas resumidas -->
    <div class="stats-overview">
      <div class="stat-card">
        <div class="stat-value">{stats.total}</div>
        <div class="stat-label">Restaurantes</div>
      </div>
      
      <div class="stat-card">
        <div class="stat-value">{stats.averageCompleteness}%</div>
        <div class="stat-label">Completitud Promedio</div>
      </div>
      
      <div class="stat-card">
        <div class="stat-value">{stats.totalVisits}</div>
        <div class="stat-label">Visitas Totales</div>
      </div>
      
      <div class="stat-card">
        <div class="stat-value">{stats.averageRating.toFixed(1)}</div>
        <div class="stat-label">Rating Promedio</div>
      </div>
    </div>
    
    <!-- Controles de vista -->
    <div class="view-controls">
      <div class="search-box">
        <svg class="search-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
        </svg>
        <input
          type="text"
          placeholder="Buscar restaurantes..."
          bind:value={searchQuery}
          class="search-input"
        />
      </div>
      
      <div class="filter-controls">
        <select bind:value={filterBy} class="filter-select">
          <option value="all">Todos</option>
          <option value="complete">Completos</option>
          <option value="incomplete">Incompletos</option>
          <option value="active">Activos</option>
          <option value="inactive">Inactivos</option>
        </select>
        
        <select bind:value={sortBy} class="filter-select">
          <option value="updatedAt">Última actualización</option>
          <option value="createdAt">Fecha de creación</option>
          <option value="name">Nombre</option>
          <option value="completeness">Completitud</option>
        </select>
        
        <button
          class="sort-toggle"
          onclick={toggleSortOrder}
          title={sortOrder === 'asc' ? 'Cambiar a descendente' : 'Cambiar a ascendente'}
        >
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
            {#if sortOrder === 'asc'}
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 4h13M3 8h9m-9 4h9m0 0l4-4m0 0l4 4m-4-4v12"/>
            {:else}
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 4h13M3 8h9m-9 4h6m0 0l4-4m0 0l4 4m-4-4v12"/>
            {/if}
          </svg>
        </button>
      </div>
      
      <div class="action-controls">
        <button class="btn-icon" onclick={handleRefresh} title="Actualizar">
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
          </svg>
        </button>
        
        {#if showCreateButton}
          <button
            class="btn btn-primary"
            onclick={handleCreateClick}
            disabled={!canCreateMore || loading}
          >
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
            </svg>
            Crear Restaurante
          </button>
        {/if}
      </div>
    </div>
  </div>

  <!-- Contenido principal -->
  <div class="management-content">
    {#if loading}
      <!-- Estado de carga -->
      <div class="loading-state">
        <div class="loading-spinner"></div>
        <p>Cargando restaurantes...</p>
      </div>
    {:else if apiError}
      <!-- Estado de error -->
      <div class="error-state">
        <svg class="error-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.664-.833-2.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z"/>
        </svg>
        <h3>Error cargando restaurantes</h3>
        <p>{apiError}</p>
        <button class="btn btn-primary" onclick={handleRefresh}>
          Intentar de nuevo
        </button>
      </div>
    {:else if filteredRestaurants.length === 0}
      <!-- Estado vacío -->
      <div class="empty-state">
        {#if searchQuery || filterBy !== 'all'}
          <svg class="empty-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
          </svg>
          <h3>No se encontraron restaurantes</h3>
          <p>Intenta cambiar los filtros de búsqueda</p>
          <button
            class="btn btn-secondary"
            onclick={clearFilters}
          >
            Limpiar filtros
          </button>
        {:else}
          <svg class="empty-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/>
          </svg>
          <h3>Aún no tienes restaurantes</h3>
          <p>Crea tu primer restaurante para empezar</p>
          {#if showCreateButton && canCreateMore}
            <button class="btn btn-primary" onclick={handleCreateClick}>
              Crear mi primer restaurante
            </button>
          {/if}
        {/if}
      </div>
    {:else}
      <!-- Lista de restaurantes -->
      <div class="restaurants-container">
        {#if view === 'analytics'}
          <!-- Vista de análisis -->
          <div class="analytics-view">
            {#each filteredRestaurants as restaurant (restaurant.id)}
              {@const analysis = restaurantUtils.analyzeRestaurantCompleteness(restaurant)}
              <div class="analytics-card">
                <div class="analytics-header">
                  <div class="restaurant-basic-info">
                    {#if restaurant.logo}
                      <img src={restaurant.logo} alt="Logo" class="mini-logo" />
                    {:else}
                      <div class="mini-logo-placeholder">
                        {restaurant.name.charAt(0).toUpperCase()}
                      </div>
                    {/if}
                    <div>
                      <h4 class="restaurant-name">{restaurant.name}</h4>
                      {#if restaurant.username}
                        <p class="restaurant-username">@{restaurant.username}</p>
                      {/if}
                    </div>
                  </div>
                  
                  <div class="completeness-score">
                    <div class="score-circle {getCompletenessColor(analysis?.score || 0)}">
                      {analysis?.score || 0}%
                    </div>
                    <span class="score-label {getCompletenessColor(analysis?.score || 0)}">
                      {getCompletenessLabel(analysis?.score || 0)}
                    </span>
                  </div>
                </div>
                
                <div class="analytics-details">
                  <div class="completed-fields">
                    <h5>Campos completados ({analysis?.completedFields?.length || 0})</h5>
                    <div class="field-tags">
                      {#each (analysis?.completedFields || []).slice(0, 5) as field}
                        <span class="field-tag completed">{field}</span>
                      {/each}
                      {#if (analysis?.completedFields?.length || 0) > 5}
                        <span class="field-tag more">+{(analysis?.completedFields?.length || 0) - 5}</span>
                      {/if}
                    </div>
                  </div>
                  
                  {#if (analysis?.missingFields?.length || 0) > 0}
                    <div class="missing-fields">
                      <h5>Campos pendientes ({analysis?.missingFields?.length || 0})</h5>
                      <div class="field-tags">
                        {#each (analysis?.missingFields || []).slice(0, 3) as field}
                          <span class="field-tag missing">{field}</span>
                        {/each}
                        {#if (analysis?.missingFields?.length || 0) > 3}
                          <span class="field-tag more">+{(analysis?.missingFields?.length || 0) - 3}</span>
                        {/if}
                      </div>
                    </div>
                  {/if}
                </div>
                
                <div class="analytics-actions">
                  <button
                    class="btn btn-sm btn-outline"
                    onclick={() => handleEditRestaurant({ detail: { restaurant } })}
                  >
                    Completar información
                  </button>
                </div>
              </div>
            {/each}
          </div>
        {:else}
          <!-- Vista de tarjetas (grid o lista) -->
          <div class="restaurants-grid" class:list-view={view === 'list'}>
            {#each filteredRestaurants as restaurant (restaurant.id)}
              <RestaurantCard
                {restaurant}
                compact={view === 'list'}
                showActions={true}
                showOwnerActions={true}
                currentUserId={currentUser?.id}
                on:edit={handleEditRestaurant}
                on:delete={handleDeleteRestaurant}
                on:view={handleViewRestaurant}
              />
            {/each}
          </div>
        {/if}
      </div>
    {/if}
  </div>

  <!-- Modal de creación -->
  {#if showCreateModal}
    <div class="modal-overlay" onclick={() => showCreateModal = false}>
      <div class="modal-content" onclick={(e) => e.stopPropagation()}>
        <CreateRestaurant
          on:created={handleRestaurantCreated}
        />
        
        <button
          class="modal-close"
          onclick={() => showCreateModal = false}
        >
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
          </svg>
        </button>
      </div>
    </div>
  {/if}
</div>

<style>
  .restaurant-management {
    width: 100%;
    max-width: 1200px;
    margin: 0 auto;
  }

  /* Header */
  .management-header {
    background: white;
    border-radius: 12px;
    padding: 1.5rem;
    margin-bottom: 2rem;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  }

  .stats-overview {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
    gap: 1rem;
    margin-bottom: 1.5rem;
  }

  .stat-card {
    text-align: center;
    padding: 1rem;
    background: #f8fafc;
    border-radius: 8px;
    border: 1px solid #e2e8f0;
  }

  .stat-value {
    font-size: 1.5rem;
    font-weight: 700;
    color: #1e293b;
    line-height: 1;
  }

  .stat-label {
    font-size: 0.875rem;
    color: #64748b;
    margin-top: 0.25rem;
  }

  .view-controls {
    display: flex;
    gap: 1rem;
    align-items: center;
    flex-wrap: wrap;
  }

  .search-box {
    position: relative;
    flex: 1;
    min-width: 250px;
  }

  .search-icon {
    position: absolute;
    left: 0.75rem;
    top: 50%;
    transform: translateY(-50%);
    width: 1rem;
    height: 1rem;
    color: #64748b;
  }

  .search-input {
    width: 100%;
    padding: 0.75rem 0.75rem 0.75rem 2.5rem;
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    font-size: 0.875rem;
    background: white;
  }

  .search-input:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }

  .filter-controls {
    display: flex;
    gap: 0.5rem;
    align-items: center;
  }

  .filter-select {
    padding: 0.5rem 0.75rem;
    border: 1px solid #e2e8f0;
    border-radius: 6px;
    font-size: 0.875rem;
    background: white;
  }

  .sort-toggle {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 2.5rem;
    height: 2.5rem;
    border: 1px solid #e2e8f0;
    border-radius: 6px;
    background: white;
    cursor: pointer;
    transition: all 0.2s;
  }

  .sort-toggle:hover {
    background: #f8fafc;
    border-color: #cbd5e1;
  }

  .sort-toggle svg {
    width: 1.25rem;
    height: 1.25rem;
    color: #64748b;
  }

  .action-controls {
    display: flex;
    gap: 0.75rem;
    align-items: center;
  }

  /* Contenido principal */
  .management-content {
    min-height: 400px;
  }

  /* Estados especiales */
  .loading-state,
  .error-state,
  .empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 4rem 2rem;
    text-align: center;
    background: white;
    border-radius: 12px;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  }

  .loading-spinner {
    width: 3rem;
    height: 3rem;
    border: 3px solid #e2e8f0;
    border-top: 3px solid #3b82f6;
    border-radius: 50%;
    animation: spin 1s linear infinite;
    margin-bottom: 1rem;
  }

  .error-icon,
  .empty-icon {
    width: 4rem;
    height: 4rem;
    color: #64748b;
    margin-bottom: 1rem;
  }

  /* Contenedor de restaurantes */
  .restaurants-container {
    background: white;
    border-radius: 12px;
    padding: 1.5rem;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  }

  .restaurants-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
    gap: 1.5rem;
  }

  .restaurants-grid.list-view {
    grid-template-columns: 1fr;
    gap: 1rem;
  }

  /* Vista de análisis */
  .analytics-view {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .analytics-card {
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    padding: 1.25rem;
    background: #f8fafc;
  }

  .analytics-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1rem;
  }

  .restaurant-basic-info {
    display: flex;
    align-items: center;
    gap: 0.75rem;
  }

  .mini-logo {
    width: 2.5rem;
    height: 2.5rem;
    border-radius: 6px;
    object-fit: cover;
    border: 2px solid white;
  }

  .mini-logo-placeholder {
    width: 2.5rem;
    height: 2.5rem;
    border-radius: 6px;
    background: #3b82f6;
    color: white;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 700;
    font-size: 0.875rem;
    border: 2px solid white;
  }

  .restaurant-name {
    margin: 0;
    font-size: 1rem;
    font-weight: 600;
    color: #1e293b;
  }

  .restaurant-username {
    margin: 0;
    font-size: 0.875rem;
    color: #64748b;
  }

  .completeness-score {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.25rem;
  }

  .score-circle {
    width: 3rem;
    height: 3rem;
    border-radius: 50%;
    border: 3px solid currentColor;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 700;
    font-size: 0.875rem;
  }

  .score-label {
    font-size: 0.75rem;
    font-weight: 600;
    text-transform: uppercase;
  }

  .analytics-details {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    margin-bottom: 1rem;
  }

  .analytics-details h5 {
    margin: 0 0 0.5rem 0;
    font-size: 0.875rem;
    font-weight: 600;
    color: #475569;
  }

  .field-tags {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
  }

  .field-tag {
    padding: 0.25rem 0.5rem;
    border-radius: 4px;
    font-size: 0.75rem;
    font-weight: 500;
  }

  .field-tag.completed {
    background: #dcfce7;
    color: #166534;
  }

  .field-tag.missing {
    background: #fed7d7;
    color: #c53030;
  }

  .field-tag.more {
    background: #e2e8f0;
    color: #475569;
  }

  .analytics-actions {
    display: flex;
    justify-content: flex-end;
  }

  /* Botones */
  .btn {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.75rem 1rem;
    border: none;
    border-radius: 6px;
    font-size: 0.875rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
    text-decoration: none;
  }

  .btn:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .btn-primary {
    background: #3b82f6;
    color: white;
  }

  .btn-primary:hover:not(:disabled) {
    background: #2563eb;
  }

  .btn-secondary {
    background: #f1f5f9;
    color: #475569;
    border: 1px solid #e2e8f0;
  }

  .btn-secondary:hover:not(:disabled) {
    background: #e2e8f0;
  }

  .btn-outline {
    background: transparent;
    color: #64748b;
    border: 1px solid #e2e8f0;
  }

  .btn-outline:hover:not(:disabled) {
    background: #f8fafc;
    color: #475569;
  }

  .btn-sm {
    padding: 0.5rem 0.75rem;
    font-size: 0.8rem;
  }

  .btn-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 2.5rem;
    height: 2.5rem;
    padding: 0;
    background: white;
    border: 1px solid #e2e8f0;
    border-radius: 6px;
    color: #64748b;
    cursor: pointer;
    transition: all 0.2s;
  }

  .btn-icon:hover {
    background: #f8fafc;
    color: #475569;
  }

  .btn-icon svg {
    width: 1.25rem;
    height: 1.25rem;
  }

  /* Modal */
  .modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.6);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
    padding: 1rem;
    backdrop-filter: blur(4px);
  }

  .modal-content {
    position: relative;
    max-width: 600px;
    width: 100%;
    max-height: 90vh;
    overflow-y: auto;
    border-radius: 12px;
    box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
  }

  .modal-close {
    position: absolute;
    top: 1rem;
    right: 1rem;
    width: 2rem;
    height: 2rem;
    background: rgba(255, 255, 255, 0.9);
    border: 1px solid #e2e8f0;
    border-radius: 6px;
    color: #64748b;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s;
    z-index: 10;
    backdrop-filter: blur(8px);
  }

  .modal-close:hover {
    background: white;
    color: #475569;
  }

  .modal-close svg {
    width: 1rem;
    height: 1rem;
  }

  /* Clases de color */
  .text-green-600 { color: #059669; }
  .text-yellow-600 { color: #d97706; }
  .text-orange-600 { color: #ea580c; }
  .text-red-600 { color: #dc2626; }

  /* Animaciones */
  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }

  /* Responsive */
  @media (max-width: 768px) {
    .management-header {
      padding: 1rem;
    }

    .stats-overview {
      grid-template-columns: repeat(2, 1fr);
    }

    .view-controls {
      flex-direction: column;
      align-items: stretch;
    }

    .search-box {
      min-width: auto;
    }

    .filter-controls {
      justify-content: space-between;
    }

    .restaurants-grid {
      grid-template-columns: 1fr;
    }

    .analytics-header {
      flex-direction: column;
      align-items: flex-start;
      gap: 1rem;
    }

    .modal-overlay {
      padding: 0.5rem;
    }
  }

  @media (max-width: 480px) {
    .stats-overview {
      grid-template-columns: 1fr;
    }

    .filter-controls {
      flex-direction: column;
      gap: 0.75rem;
    }

    .filter-select {
      width: 100%;
    }
  }
</style>