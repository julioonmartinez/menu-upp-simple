<!-- src/components/restaurant/CategoryManager.svelte -->
<script lang="ts">
  import { createEventDispatcher, onMount } from 'svelte';
  import { categoryStore, useCategories, allCategories } from '../../services/index.ts';
  import CategoryForm from './CategoryForm.svelte';
  import CategoryList from './CategoryList.svelte';
  import Modal from '../ui/Modal.svelte';
  import type { Category } from '../../interfaces/category.ts';

  // Props
  export let restaurant: any;
  export let restaurantId: string;

  // Event dispatcher
  const dispatch = createEventDispatcher();

  // Store state
  const {
    // allCategories, // <-- probablemente es un array, NO una store
    isLoadingAll,  // <-- si es store, usa $isLoadingAll, si no, úsalo directo
    isCreating,
    isUpdating,
    isDeleting,
    error,         // <-- si es store, usa $error, si no, úsalo directo
    createError,
    updateError,
    deleteError,
    loadAllCategories,
    createCategory,
    updateCategory,
    deleteCategory,
    clearAllErrors
  } = useCategories();

  // Local state
  let showForm = false;
  let editingCategory: Category | null = null;
  let searchTerm = '';
  let isFormSubmitting = false;

  // Computed
  $: filteredCategories = Array.isArray($allCategories)
    ? $allCategories.filter(category => {
        if (!searchTerm.trim()) return true;
        const term = searchTerm.toLowerCase();
        return (
          category.name.toLowerCase().includes(term) ||
          (category.description && category.description.toLowerCase().includes(term))
        );
      })
    : [];

  $: hasCategories = Array.isArray($allCategories) && $allCategories.length > 0;
  $: isLoading = isLoadingAll; // Si isLoadingAll es store, usa $isLoadingAll
  $: formTitle = editingCategory ? 'Editar Categoría' : 'Nueva Categoría';

  // Lifecycle
  onMount(() => {
    loadCategoriesData();
  });

  // Methods
  async function loadCategoriesData() {
    try {
      await loadAllCategories(restaurantId);
    } catch (error) {
      console.error('Error cargando categorías:', error);
    }
  }

  function openCreateForm() {
    editingCategory = null;
    showForm = true;
    clearAllErrors();
  }

  function openEditForm(category: Category) {
    editingCategory = category;
    showForm = true;
    clearAllErrors();
  }

  function closeForm() {
    showForm = false;
    editingCategory = null;
    isFormSubmitting = false;
    clearAllErrors();
  }

  async function handleCreateCategory(event: CustomEvent) {
    const categoryData = event.detail;
    isFormSubmitting = true;

    try {
      const result = await createCategory({
        ...categoryData,
        restaurantId
      });

      if (result.success) {
        closeForm();
        dispatch('update', {
          type: 'category_created',
          category: result.category
        });
      }
    } catch (error) {
      console.error('Error creando categoría:', error);
    } finally {
      isFormSubmitting = false;
    }
  }

  async function handleUpdateCategory(event: CustomEvent) {
    if (!editingCategory?.id) return;

    const categoryData = event.detail;
    isFormSubmitting = true;

    try {
      const result = await updateCategory(editingCategory.id, categoryData);

      if (result.success) {
        closeForm();
        dispatch('update', {
          type: 'category_updated',
          category: result.category
        });
      }
    } catch (error) {
      console.error('Error actualizando categoría:', error);
    } finally {
      isFormSubmitting = false;
    }
  }

  async function handleDeleteCategory(event: CustomEvent) {
    const categoryId = event.detail.id;

    if (!confirm('¿Estás seguro de que quieres eliminar esta categoría?')) {
      return;
    }

    try {
      const result = await deleteCategory(categoryId);

      if (result.success) {
        dispatch('update', {
          type: 'category_deleted',
          categoryId
        });
      }
    } catch (error) {
      console.error('Error eliminando categoría:', error);
    }
  }

  function handleSearchChange(event: Event) {
    const target = event.target as HTMLInputElement;
    searchTerm = target.value;
  }

  function refreshCategories() {
    loadCategoriesData();
  }
</script>

<div class="category-manager">
  <!-- Header -->
  <div class="manager-header">
    <div class="header-content">
      <div class="header-text">
        <h3 class="header-title">Gestión de Categorías</h3>
        <p class="header-subtitle">
          Organiza tu menú creando categorías para tus platillos
        </p>
      </div>
      
      <button
        type="button"
        class="btn-primary"
        on:click={openCreateForm}
        disabled={isLoading}
      >
        <svg class="btn-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
        </svg>
        Nueva Categoría
      </button>
    </div>

    <!-- Search -->
    {#if hasCategories}
      <div class="search-container">
        <div class="search-input-wrapper">
          <svg class="search-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Buscar categorías..."
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
          <p class="error-title">Error en categorías</p>
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

  <!-- Loading State -->
  {#if isLoading}
    <div class="loading-container">
      <div class="loading-spinner"></div>
      <p class="loading-text">Cargando categorías...</p>
    </div>
  
  <!-- Categories List -->
  {:else if hasCategories}
    <CategoryList
      categories={filteredCategories}
      {searchTerm}
      isDeleting={isDeleting}
      on:edit={({ detail }) => openEditForm(detail)}
      on:delete={handleDeleteCategory}
    />
    
    <!-- Empty Search Results -->
    {#if filteredCategories.length === 0 && searchTerm}
      <div class="empty-search">
        <svg class="empty-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <h3 class="empty-title">No se encontraron categorías</h3>
        <p class="empty-subtitle">
          No hay categorías que coincidan con "{searchTerm}"
        </p>
        <button
          type="button"
          class="btn-secondary"
          on:click={() => searchTerm = ''}
        >
          Limpiar búsqueda
        </button>
      </div>
    {/if}
  
  <!-- Empty State -->
  {:else}
    <div class="empty-state">
      <svg class="empty-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 002 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
      </svg>
      <h3 class="empty-title">No hay categorías aún</h3>
      <p class="empty-subtitle">
        Crea tu primera categoría para organizar los platillos de tu menú
      </p>
      <button
        type="button"
        class="btn-primary"
        on:click={openCreateForm}
      >
        <svg class="btn-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
        </svg>
        Crear Primera Categoría
      </button>
    </div>
  {/if}

  <!-- Refresh Button -->
  {#if hasCategories}
    <div class="refresh-container">
      <button
        type="button"
        class="btn-ghost"
        on:click={refreshCategories}
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

<!-- Category Form Modal -->
<Modal
  isOpen={showForm}
  title={formTitle}
  size="md"
  on:close={closeForm}
>
  <CategoryForm
    category={editingCategory}
    {restaurantId}
    isSubmitting={isFormSubmitting}
    error={editingCategory ? updateError : createError}
    on:submit={editingCategory ? handleUpdateCategory : handleCreateCategory}
    on:cancel={closeForm}
  />
</Modal>

<style>
  .category-manager {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
    max-width: 100%;
  }

  /* Header */
  .manager-header {
    display: flex;
    flex-direction: column;
    gap: 1rem;
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

  /* Search */
  .search-container {
    max-width: 400px;
  }

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

  /* Error Display */
  .error-container {
    background-color: #fef2f2;
    border: 1px solid #fecaca;
    border-radius: 0.5rem;
    padding: 1rem;
  }

  .error-content {
    display: flex;
    align-items: flex-start;
    gap: 0.75rem;
  }

  .error-icon {
    width: 1.25rem;
    height: 1.25rem;
    color: #dc2626;
    flex-shrink: 0;
    margin-top: 0.125rem;
  }

  .error-text {
    flex: 1;
  }

  .error-title {
    font-size: 0.875rem;
    font-weight: 500;
    color: #991b1b;
    margin: 0 0 0.25rem 0;
  }

  .error-message {
    font-size: 0.875rem;
    color: #dc2626;
    margin: 0;
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

  /* Refresh */
  .refresh-container {
    display: flex;
    justify-content: center;
    padding-top: 1rem;
    border-top: 1px solid #e5e7eb;
  }

  /* Responsive */
  @media (max-width: 640px) {
    .header-content {
      flex-direction: column;
      align-items: stretch;
    }

    .search-container {
      max-width: none;
    }

    .btn-primary,
    .btn-secondary {
      justify-content: center;
    }
  }
</style>