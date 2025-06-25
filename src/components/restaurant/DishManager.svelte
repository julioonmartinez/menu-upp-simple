<!-- src/components/restaurant/DishManager.svelte -->
<script lang="ts">
  import { createEventDispatcher, onMount } from 'svelte';
 
  import DishForm from './DishForm.svelte';
  import DishList from './DishList.svelte';
  import Modal from '../ui/Modal.svelte';
  import type { Dish, DishPaginationParams } from '../../interfaces/dish.ts';
  import type { Category } from '../../interfaces/category.ts';

  import {
    useDishes,
    useCategories, 
    dishStore,
    categoryStore,
    // Usa los stores reactivos directamente
    allDishes,
    // isLoadingAll,
    // isCreating,
    // isUpdating,
    // isDeleting,
    // pagination,
    // error,
    // createError,
    // updateError,
    // deleteError,
    allCategories
  } from '../../services/index.ts';

  // Props
  export let restaurant: any;
  export let restaurantId: string;

  // Event dispatcher
  const dispatch = createEventDispatcher();

  // Store state
  const {
    // allDishes, // <-- probablemente es un array, NO una store
    isLoadingAll,  // <-- si es store, usa $isLoadingAll, si no, úsalo directo
    isCreating,
    isUpdating,
    isDeleting,
    pagination,
    error,
    createError,
    updateError,
    deleteError,
    loadDishesByFilters,
    createDish,
    updateDish,
    deleteDish,
    clearAllErrors
  } = useDishes();

  const {
    // allCategories, // <-- probablemente es un array, NO una store
    loadAllCategories: loadCategories
  } = useCategories();

  // Local state
  let showForm = false;
  let editingDish: Dish | null = null;
  let searchTerm = '';
  let selectedCategoryId = '';
  let sortBy = 'name';
  let sortOrder: 1 | -1 = 1;
  let currentPage = 1;
  let isFormSubmitting = false;

  // Computed
  $: filteredDishes = $allDishes;
  $: hasDishes = Array.isArray($allDishes) && $allDishes.length > 0;
  $: hasCategories = Array.isArray($allCategories) && $allCategories.length > 0;
  $: isLoading = isLoadingAll; // Si isLoadingAll es store, usa $isLoadingAll
  $: formTitle = editingDish ? 'Editar Platillo' : 'Nuevo Platillo';
  $: paginationInfo = pagination; // Si pagination es store, usa $pagination

  // Reactive filtering and loading
  $: {
    loadDishesData();
  }

  // Lifecycle
  onMount(() => {
    loadInitialData();
  });

  // Methods
  async function loadInitialData() {
    try {
      // Load categories first
      await loadCategories(restaurantId);
      // Then load dishes
      await loadDishesData();
    } catch (error) {
      console.error('Error cargando datos iniciales:', error);
    }
  }

  async function loadDishesData() {
    try {
      const params: DishPaginationParams = {
        limit: 20,
        page: currentPage,
        sort_by: sortBy,
        sort_order: sortOrder,
        search: searchTerm.trim() || undefined
      };

      await loadDishesByFilters(
        selectedCategoryId || undefined,
        restaurantId,
        params
      );
    } catch (error) {
      console.error('Error cargando platillos:', error);
    }
  }

  function openCreateForm() {
    if (!hasCategories) {
      alert('Necesitas crear al menos una categoría antes de agregar platillos.');
      return;
    }
    
    editingDish = null;
    showForm = true;
    clearAllErrors();
  }

  function openEditForm(dish: Dish) {
    editingDish = dish;
    showForm = true;
    clearAllErrors();
  }

  function closeForm() {
    showForm = false;
    editingDish = null;
    isFormSubmitting = false;
    clearAllErrors();
  }

  async function handleCreateDish(event: CustomEvent) {
    const { dishData, image } = event.detail;
    isFormSubmitting = true;

    try {
      const result = await createDish({
        ...dishData,
        restaurantId
      }, image);

      if (result.success) {
        closeForm();
        await loadDishesData(); // Reload to get updated data
        dispatch('update', {
          type: 'dish_created',
          dish: result.dish
        });
      }
    } catch (error) {
      console.error('Error creando platillo:', error);
    } finally {
      isFormSubmitting = false;
    }
  }

  async function handleUpdateDish(event: CustomEvent) {
    if (!editingDish?.id) return;

    const { dishData, image } = event.detail;
    isFormSubmitting = true;

    try {
      const result = await updateDish(editingDish.id, dishData, image);

      if (result.success) {
        closeForm();
        await loadDishesData(); // Reload to get updated data
        dispatch('update', {
          type: 'dish_updated',
          dish: result.dish
        });
      }
    } catch (error) {
      console.error('Error actualizando platillo:', error);
    } finally {
      isFormSubmitting = false;
    }
  }

  async function handleDeleteDish(event: CustomEvent) {
    const dishId = event.detail.id;
    const dishName = event.detail.name;

    if (!confirm(`¿Estás seguro de que quieres eliminar "${dishName}"?`)) {
      return;
    }

    try {
      const result = await deleteDish(dishId);

      if (result.success) {
        await loadDishesData(); // Reload to get updated data
        dispatch('update', {
          type: 'dish_deleted',
          dishId
        });
      }
    } catch (error) {
      console.error('Error eliminando platillo:', error);
    }
  }

  function handleSearchChange(event: Event) {
    const target = event.target as HTMLInputElement;
    searchTerm = target.value;
    currentPage = 1; // Reset to first page
  }

  function handleCategoryFilterChange(event: Event) {
    const target = event.target as HTMLSelectElement;
    selectedCategoryId = target.value;
    currentPage = 1; // Reset to first page
  }

  function handleSortChange(event: Event) {
    const target = event.target as HTMLSelectElement;
    const [field, order] = target.value.split('-');
    sortBy = field;
    sortOrder = order === 'desc' ? -1 : 1;
    currentPage = 1; // Reset to first page
  }

  function handlePageChange(page: number) {
    currentPage = page;
  }

  function clearFilters() {
    searchTerm = '';
    selectedCategoryId = '';
    sortBy = 'name';
    sortOrder = 1;
    currentPage = 1;
  }

  function refreshDishes() {
    loadDishesData();
  }

  function getCategoryName(categoryId: string): string {
    const category = $allCategories.find(c => c.id === categoryId);
    return category?.name || 'Sin categoría';
  }
</script>

<div class="dish-manager">
  <!-- Header -->
  <div class="manager-header">
    <div class="header-content">
      <div class="header-text">
        <h3 class="header-title">Gestión de Platillos</h3>
        <p class="header-subtitle">
          Administra el menú de tu restaurante agregando, editando y organizando tus platillos
        </p>
      </div>
      
      <button
        type="button"
        class="btn-primary"
        on:click={openCreateForm}
        disabled={isLoading || !hasCategories}
        title={!hasCategories ? 'Necesitas crear categorías primero' : 'Agregar nuevo platillo'}
      >
        <svg class="btn-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
        </svg>
        Nuevo Platillo
      </button>
    </div>

    <!-- Filters -->
    {#if hasCategories}
      <div class="filters-container">
        <!-- Search -->
        <div class="filter-group">
          <label for="dish-search" class="filter-label">Buscar</label>
          <div class="search-input-wrapper">
            <svg class="search-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              id="dish-search"
              type="text"
              placeholder="Buscar platillos..."
              class="search-input"
              value={searchTerm}
              on:input={handleSearchChange}
            />
            {#if searchTerm}
              <button
                type="button"
                class="search-clear"
                on:click={() => searchTerm = ''}
              >
                <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            {/if}
          </div>
        </div>

        <!-- Category Filter -->
        <div class="filter-group">
          <label for="category-filter" class="filter-label">Categoría</label>
          <select
            id="category-filter"
            class="filter-select"
            value={selectedCategoryId}
            on:change={handleCategoryFilterChange}
          >
            <option value="">Todas las categorías</option>
            {#each $allCategories as category}
              <option value={category.id}>{category.name}</option>
            {/each}
          </select>
        </div>

        <!-- Sort -->
        <div class="filter-group">
          <label for="sort-filter" class="filter-label">Ordenar por</label>
          <select
            id="sort-filter"
            class="filter-select"
            value={`${sortBy}-${sortOrder === 1 ? 'asc' : 'desc'}`}
            on:change={handleSortChange}
          >
            <option value="name-asc">Nombre (A-Z)</option>
            <option value="name-desc">Nombre (Z-A)</option>
            <option value="price-asc">Precio (menor a mayor)</option>
            <option value="price-desc">Precio (mayor a menor)</option>
            <option value="rating-desc">Mejor valorados</option>
            <option value="rating-asc">Menor valorados</option>
          </select>
        </div>

        <!-- Clear Filters -->
        {#if searchTerm || selectedCategoryId || sortBy !== 'name' || sortOrder !== 1}
          <div class="filter-group">
            <button
              type="button"
              class="btn-ghost"
              on:click={clearFilters}
            >
              <svg class="btn-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
              Limpiar filtros
            </button>
          </div>
        {/if}
      </div>
    {/if}
  </div>

  <!-- Error Display -->
  {#if error || createError || updateError || deleteError}
    <div class="error-container">
      <div class="error-content">
        <svg class="error-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
        </svg>
        <div class="error-text">
          <p class="error-title">Error en platillos</p>
          <p class="error-message">
            {error || createError || updateError || deleteError}
          </p>
        </div>
        <button
          type="button"
          class="error-close"
          on:click={clearAllErrors}
        >
          <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  {/if}

  <!-- No Categories Warning -->
  {#if !hasCategories}
    <div class="warning-container">
      <div class="warning-content">
        <svg class="warning-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
        </svg>
        <div class="warning-text">
          <p class="warning-title">Se requieren categorías</p>
          <p class="warning-message">
            Necesitas crear al menos una categoría antes de poder agregar platillos.
          </p>
        </div>
      </div>
    </div>
  {/if}

  <!-- Loading State -->
  {#if isLoading}
    <div class="loading-container">
      <div class="loading-spinner"></div>
      <p class="loading-text">Cargando platillos...</p>
    </div>
  
  <!-- Dishes List -->
  {:else if hasDishes}
    <DishList
      dishes={filteredDishes}
      categories={$allCategories}
      {searchTerm}
      isDeleting={isDeleting}
      on:edit={({ detail }) => openEditForm(detail)}
      on:delete={handleDeleteDish}
    />
    
    <!-- Pagination -->
    {#if paginationInfo && paginationInfo.total_pages > 1}
      <div class="pagination-container">
        <div class="pagination-info">
          <p class="pagination-text">
            Mostrando {((paginationInfo.page - 1) * paginationInfo.limit) + 1} - 
            {Math.min(paginationInfo.page * paginationInfo.limit, paginationInfo.total)} 
            de {paginationInfo.total} platillos
          </p>
        </div>
        
        <div class="pagination-controls">
          <button
            type="button"
            class="pagination-btn"
            disabled={!paginationInfo.has_prev}
            on:click={() => handlePageChange(currentPage - 1)}
          >
            <svg class="pagination-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
            </svg>
            Anterior
          </button>
          
          <span class="pagination-current">
            Página {paginationInfo.page} de {paginationInfo.total_pages}
          </span>
          
          <button
            type="button"
            class="pagination-btn"
            disabled={!paginationInfo.has_next}
            on:click={() => handlePageChange(currentPage + 1)}
          >
            Siguiente
            <svg class="pagination-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>
    {/if}
    
    <!-- Empty Search Results -->
    {#if filteredDishes.length === 0 && (searchTerm || selectedCategoryId)}
      <div class="empty-search">
        <svg class="empty-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <h3 class="empty-title">No se encontraron platillos</h3>
        <p class="empty-subtitle">
          {#if searchTerm && selectedCategoryId}
            No hay platillos que coincidan con "{searchTerm}" en la categoría "{getCategoryName(selectedCategoryId)}"
          {:else if searchTerm}
            No hay platillos que coincidan con "{searchTerm}"
          {:else if selectedCategoryId}
            No hay platillos en la categoría "{getCategoryName(selectedCategoryId)}"
          {/if}
        </p>
        <button
          type="button"
          class="btn-secondary"
          on:click={clearFilters}
        >
          Limpiar filtros
        </button>
      </div>
    {/if}
  
  <!-- Empty State -->
  {:else if hasCategories}
    <div class="empty-state">
      <svg class="empty-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
      </svg>
      <h3 class="empty-title">No hay platillos aún</h3>
      <p class="empty-subtitle">
        Comienza a crear el menú de tu restaurante agregando tu primer platillo
      </p>
      <button
        type="button"
        class="btn-primary"
        on:click={openCreateForm}
      >
        <svg class="btn-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
        </svg>
        Crear Primer Platillo
      </button>
    </div>
  {/if}

  <!-- Refresh Button -->
  {#if hasDishes}
    <div class="refresh-container">
      <button
        type="button"
        class="btn-ghost"
        on:click={refreshDishes}
        disabled={isLoading}
      >
        <svg class="btn-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
        Actualizar
      </button>
    </div>
  {/if}
</div>

<!-- Dish Form Modal -->
<Modal
  isOpen={showForm}
  title={formTitle}
  size="lg"
  on:close={closeForm}
>
  <DishForm
    dish={editingDish}
    categories={$allCategories}
    {restaurantId}
    isSubmitting={isFormSubmitting}
    error={editingDish ? updateError : createError}
    on:submit={editingDish ? handleUpdateDish : handleCreateDish}
    on:cancel={closeForm}
  />
</Modal>

<style>
  .dish-manager {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
    max-width: 100%;
  }

  /* Header */
  .manager-header {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
  }

  .header-content {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 1rem;
    flex-wrap: wrap;
  }

  .header-text {
    flex: 1;
    min-width: 200px;
  }

  .header-title {
    font-size: 1.5rem;
    font-weight: 700;
    color: #111827;
    margin: 0 0 0.25rem 0;
  }

  .header-subtitle {
    font-size: 0.875rem;
    color: #6b7280;
    margin: 0;
  }

  /* Filters */
  .filters-container {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 1rem;
    align-items: end;
  }

  .filter-group {
    display: flex;
    flex-direction: column;
    gap: 0.375rem;
  }

  .filter-label {
    font-size: 0.75rem;
    font-weight: 500;
    color: #374151;
    text-transform: uppercase;
    letter-spacing: 0.025em;
  }

  /* Search */
  .search-input-wrapper {
    position: relative;
    display: flex;
    align-items: center;
  }

  .search-icon {
    position: absolute;
    left: 0.75rem;
    width: 1.25rem;
    height: 1.25rem;
    color: #9ca3af;
    pointer-events: none;
  }

  .search-input {
    width: 100%;
    padding: 0.5rem 0.75rem 0.5rem 2.5rem;
    border: 1px solid #d1d5db;
    border-radius: 0.5rem;
    font-size: 0.875rem;
    transition: all 0.15s ease-in-out;
  }

  .search-input:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }

  .search-clear {
    position: absolute;
    right: 0.5rem;
    width: 1.5rem;
    height: 1.5rem;
    background: none;
    border: none;
    color: #9ca3af;
    cursor: pointer;
    border-radius: 0.25rem;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.15s ease-in-out;
  }

  .search-clear:hover {
    color: #374151;
    background-color: #f3f4f6;
  }

  .search-clear svg {
    width: 1rem;
    height: 1rem;
  }

  /* Select */
  .filter-select {
    width: 100%;
    padding: 0.5rem 0.75rem;
    border: 1px solid #d1d5db;
    border-radius: 0.5rem;
    font-size: 0.875rem;
    background-color: #ffffff;
    transition: all 0.15s ease-in-out;
  }

  .filter-select:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }

  /* Buttons */
  .btn-primary {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.625rem 1rem;
    background-color: #3b82f6;
    color: white;
    border: none;
    border-radius: 0.5rem;
    font-size: 0.875rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.15s ease-in-out;
    white-space: nowrap;
  }

  .btn-primary:hover:not(:disabled) {
    background-color: #2563eb;
  }

  .btn-primary:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .btn-secondary {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.625rem 1rem;
    background-color: #f9fafb;
    color: #374151;
    border: 1px solid #d1d5db;
    border-radius: 0.5rem;
    font-size: 0.875rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.15s ease-in-out;
  }

  .btn-secondary:hover {
    background-color: #f3f4f6;
    border-color: #9ca3af;
  }

  .btn-ghost {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.5rem 0.75rem;
    background: none;
    color: #6b7280;
    border: none;
    border-radius: 0.5rem;
    font-size: 0.875rem;
    cursor: pointer;
    transition: all 0.15s ease-in-out;
  }

  .btn-ghost:hover:not(:disabled) {
    background-color: #f3f4f6;
    color: #374151;
  }

  .btn-ghost:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .btn-icon {
    width: 1.25rem;
    height: 1.25rem;
  }

  /* Error and Warning Display */
  .error-container,
  .warning-container {
    padding: 1rem;
    border-radius: 0.5rem;
  }

  .error-container {
    background-color: #fef2f2;
    border: 1px solid #fecaca;
  }

  .warning-container {
    background-color: #fffbeb;
    border: 1px solid #fed7aa;
  }

  .error-content,
  .warning-content {
    display: flex;
    align-items: flex-start;
    gap: 0.75rem;
  }

  .error-icon,
  .warning-icon {
    width: 1.25rem;
    height: 1.25rem;
    flex-shrink: 0;
    margin-top: 0.125rem;
  }

  .error-icon {
    color: #dc2626;
  }

  .warning-icon {
    color: #f59e0b;
  }

  .error-text,
  .warning-text {
    flex: 1;
  }

  .error-title,
  .warning-title {
    font-size: 0.875rem;
    font-weight: 500;
    margin: 0 0 0.25rem 0;
  }

  .error-title {
    color: #991b1b;
  }

  .warning-title {
    color: #92400e;
  }

  .error-message,
  .warning-message {
    font-size: 0.875rem;
    margin: 0;
  }

  .error-message {
    color: #dc2626;
  }

  .warning-message {
    color: #f59e0b;
  }

  .error-close {
    background: none;
    border: none;
    color: #dc2626;
    cursor: pointer;
    padding: 0.25rem;
    border-radius: 0.25rem;
    transition: all 0.15s ease-in-out;
  }

  .error-close:hover {
    background-color: #fee2e2;
  }

  .error-close svg {
    width: 1.25rem;
    height: 1.25rem;
  }

  /* Loading */
  .loading-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 3rem 1rem;
    text-align: center;
  }

  .loading-spinner {
    width: 2rem;
    height: 2rem;
    border: 2px solid #e5e7eb;
    border-top: 2px solid #3b82f6;
    border-radius: 50%;
    animation: spin 1s linear infinite;
    margin-bottom: 1rem;
  }

  .loading-text {
    font-size: 0.875rem;
    color: #6b7280;
    margin: 0;
  }

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }

  /* Empty States */
  .empty-state,
  .empty-search {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 3rem 1rem;
    text-align: center;
  }

  .empty-icon {
    width: 3rem;
    height: 3rem;
    color: #9ca3af;
    margin-bottom: 1rem;
  }

  .empty-title {
    font-size: 1.125rem;
    font-weight: 600;
    color: #111827;
    margin: 0 0 0.5rem 0;
  }

  .empty-subtitle {
    font-size: 0.875rem;
    color: #6b7280;
    margin: 0 0 1.5rem 0;
    max-width: 400px;
  }

  /* Pagination */
  .pagination-container {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 1rem;
    padding: 1rem;
    border-top: 1px solid #e5e7eb;
    flex-wrap: wrap;
  }

  .pagination-info {
    flex: 1;
    min-width: 200px;
  }

  .pagination-text {
    font-size: 0.875rem;
    color: #6b7280;
    margin: 0;
  }

  .pagination-controls {
    display: flex;
    align-items: center;
    gap: 1rem;
  }

  .pagination-btn {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.5rem 0.75rem;
    background-color: #ffffff;
    color: #374151;
    border: 1px solid #d1d5db;
    border-radius: 0.5rem;
    font-size: 0.875rem;
    cursor: pointer;
    transition: all 0.15s ease-in-out;
  }

  .pagination-btn:hover:not(:disabled) {
    background-color: #f9fafb;
    border-color: #9ca3af;
  }

  .pagination-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .pagination-icon {
    width: 1rem;
    height: 1rem;
  }

  .pagination-current {
    font-size: 0.875rem;
    color: #374151;
    font-weight: 500;
  }

  /* Refresh */
  .refresh-container {
    display: flex;
    justify-content: center;
    padding-top: 1rem;
    border-top: 1px solid #e5e7eb;
  }

  /* Responsive */
  @media (max-width: 768px) {
    .header-content {
      flex-direction: column;
      align-items: stretch;
    }

    .filters-container {
      grid-template-columns: 1fr;
    }

    .pagination-container {
      flex-direction: column;
      text-align: center;
    }

    .pagination-controls {
      justify-content: space-between;
      width: 100%;
    }

    .btn-primary,
    .btn-secondary {
      justify-content: center;
    }
  }
</style>