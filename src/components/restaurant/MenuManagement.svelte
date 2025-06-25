<!-- src/components/restaurant/MenuManagement.svelte -->
<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import CategoryManager from './CategoryManager.svelte';
  import DishManager from './DishManager.svelte';
  import Modal from '../ui/Modal.svelte';

  // Props
  export let restaurant: any;
  export let restaurantId: string;

  // Event dispatcher
  const dispatch = createEventDispatcher();

  // Local state
  let activeTab: 'categories' | 'dishes' = 'categories';
  let showCreateModal = false;
  let createModalType: 'category' | 'dish' | null = null;

  // Tab management
  function switchTab(tab: 'categories' | 'dishes') {
    activeTab = tab;
  }

  // Modal management
  function openCreateModal(type: 'category' | 'dish') {
    createModalType = type;
    showCreateModal = true;
  }

  function closeCreateModal() {
    showCreateModal = false;
    createModalType = null;
  }

  // Event handlers
  function handleUpdate(event: CustomEvent) {
    // Propagate updates to parent component
    dispatch('update', event.detail);
  }

  function handleClose() {
    dispatch('close');
  }

  // Stats calculation
  function getTabStats() {
    // This would normally come from the stores
    return {
      categories: 0,
      dishes: 0
    };
  }

  $: stats = getTabStats();
</script>

<div class="menu-management">
  <!-- Header -->
  <div class="management-header">
    <div class="header-content">
      <div class="header-text">
        <h2 class="header-title">Gestión de Menú</h2>
        <p class="header-subtitle">
          Administra las categorías y platillos de <strong>{restaurant?.name || 'tu restaurante'}</strong>
        </p>
      </div>
      
      <div class="header-actions">
        <button
          type="button"
          class="btn-outline"
          on:click={handleClose}
        >
          <svg class="btn-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
          Cerrar
        </button>
      </div>
    </div>

    <!-- Quick Actions -->
    <div class="quick-actions">
      <button
        type="button"
        class="quick-action-btn category-btn"
        on:click={() => openCreateModal('category')}
      >
        <svg class="action-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.99 1.99 0 013 12V7a4 4 0 014-4z" />
        </svg>
        <div class="action-content">
          <span class="action-title">Nueva Categoría</span>
          <span class="action-subtitle">Organizar el menú</span>
        </div>
      </button>

      <button
        type="button"
        class="quick-action-btn dish-btn"
        on:click={() => openCreateModal('dish')}
      >
        <svg class="action-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
        </svg>
        <div class="action-content">
          <span class="action-title">Nuevo Platillo</span>
          <span class="action-subtitle">Agregar al menú</span>
        </div>
      </button>
    </div>
  </div>

  <!-- Tab Navigation -->
  <div class="tab-navigation">
    <div class="tab-container">
      <button
        type="button"
        class="tab-btn"
        class:active={activeTab === 'categories'}
        on:click={() => switchTab('categories')}
      >
        <svg class="tab-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.99 1.99 0 013 12V7a4 4 0 014-4z" />
        </svg>
        <div class="tab-content">
          <span class="tab-title">Categorías</span>
          <span class="tab-count">{stats.categories || 0}</span>
        </div>
      </button>

      <button
        type="button"
        class="tab-btn"
        class:active={activeTab === 'dishes'}
        on:click={() => switchTab('dishes')}
      >
        <svg class="tab-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
        </svg>
        <div class="tab-content">
          <span class="tab-title">Platillos</span>
          <span class="tab-count">{stats.dishes || 0}</span>
        </div>
      </button>
    </div>

    <!-- Tab Indicator -->
    <div class="tab-indicator" class:categories={activeTab === 'categories'} class:dishes={activeTab === 'dishes'}></div>
  </div>

  <!-- Tab Content -->
  <div class="tab-content-container">
    {#if activeTab === 'categories'}
      <CategoryManager
        {restaurant}
        {restaurantId}
        on:update={handleUpdate}
        on:close={handleClose}
      />
    {:else if activeTab === 'dishes'}
      <DishManager
        {restaurant}
        {restaurantId}
        on:update={handleUpdate}
        on:close={handleClose}
      />
    {/if}
  </div>
</div>

<!-- Quick Create Modals -->
{#if showCreateModal && createModalType === 'category'}
  <Modal
    isOpen={showCreateModal}
    title="Crear Nueva Categoría"
    size="md"
    on:close={closeCreateModal}
  >
    <!-- This would integrate the CategoryForm directly -->
    <div class="quick-create-info">
      <div class="info-icon-container">
        <svg class="info-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.99 1.99 0 013 12V7a4 4 0 014-4z" />
        </svg>
      </div>
      <div class="info-content">
        <h3 class="info-title">Ir a la pestaña de Categorías</h3>
        <p class="info-description">
          Para crear una nueva categoría, utiliza la pestaña de "Categorías" donde encontrarás 
          todas las herramientas de gestión completas.
        </p>
        <div class="info-actions">
          <button
            type="button"
            class="btn-primary"
            on:click={() => {
              switchTab('categories');
              closeCreateModal();
            }}
          >
            Ir a Categorías
          </button>
          <button
            type="button"
            class="btn-secondary"
            on:click={closeCreateModal}
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  </Modal>
{/if}

{#if showCreateModal && createModalType === 'dish'}
  <Modal
    isOpen={showCreateModal}
    title="Crear Nuevo Platillo"
    size="md"
    on:close={closeCreateModal}
  >
    <div class="quick-create-info">
      <div class="info-icon-container">
        <svg class="info-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
        </svg>
      </div>
      <div class="info-content">
        <h3 class="info-title">Ir a la pestaña de Platillos</h3>
        <p class="info-description">
          Para crear un nuevo platillo, utiliza la pestaña de "Platillos" donde podrás 
          agregar toda la información, imágenes y detalles nutricionales.
        </p>
        <div class="info-actions">
          <button
            type="button"
            class="btn-primary"
            on:click={() => {
              switchTab('dishes');
              closeCreateModal();
            }}
          >
            Ir a Platillos
          </button>
          <button
            type="button"
            class="btn-secondary"
            on:click={closeCreateModal}
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  </Modal>
{/if}

<style>
  .menu-management {
    display: flex;
    flex-direction: column;
    height: 100%;
    max-height: 80vh;
    overflow: hidden;
  }

  /* Header */
  .management-header {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
    padding: 1.5rem 1.5rem 1rem 1.5rem;
    border-bottom: 1px solid #e5e7eb;
    background-color: #f9fafb;
  }

  .header-content {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 1rem;
  }

  .header-text {
    flex: 1;
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

  .header-actions {
    display: flex;
    gap: 0.75rem;
  }

  /* Quick Actions */
  .quick-actions {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1rem;
  }

  .quick-action-btn {
    display: flex;
    align-items: center;
    gap: 1rem;
    padding: 1rem;
    background-color: #ffffff;
    border: 1px solid #e5e7eb;
    border-radius: 0.75rem;
    cursor: pointer;
    transition: all 0.15s ease-in-out;
  }

  .quick-action-btn:hover {
    border-color: #d1d5db;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  }

  .category-btn:hover {
    border-color: #3b82f6;
    background-color: #eff6ff;
  }

  .dish-btn:hover {
    border-color: #059669;
    background-color: #ecfdf5;
  }

  .action-icon {
    width: 2rem;
    height: 2rem;
    color: #6b7280;
    flex-shrink: 0;
  }

  .category-btn:hover .action-icon {
    color: #3b82f6;
  }

  .dish-btn:hover .action-icon {
    color: #059669;
  }

  .action-content {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 0.25rem;
  }

  .action-title {
    font-size: 0.875rem;
    font-weight: 600;
    color: #111827;
  }

  .action-subtitle {
    font-size: 0.75rem;
    color: #6b7280;
  }

  /* Tab Navigation */
  .tab-navigation {
    position: relative;
    display: flex;
    align-items: center;
    background-color: #f9fafb;
    border-bottom: 1px solid #e5e7eb;
  }

  .tab-container {
    display: flex;
    width: 100%;
  }

  .tab-btn {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 1rem 1.5rem;
    background: none;
    border: none;
    cursor: pointer;
    transition: all 0.15s ease-in-out;
    flex: 1;
    justify-content: center;
    position: relative;
  }

  .tab-btn.active {
    color: #3b82f6;
    background-color: #ffffff;
  }

  .tab-btn:not(.active) {
    color: #6b7280;
  }

  .tab-btn:not(.active):hover {
    color: #374151;
    background-color: #f3f4f6;
  }

  .tab-icon {
    width: 1.25rem;
    height: 1.25rem;
  }

  .tab-content {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.25rem;
  }

  .tab-title {
    font-size: 0.875rem;
    font-weight: 600;
  }

  .tab-count {
    font-size: 0.75rem;
    color: #9ca3af;
    font-weight: 500;
  }

  .tab-btn.active .tab-count {
    color: #3b82f6;
  }

  /* Tab Indicator */
  .tab-indicator {
    position: absolute;
    bottom: 0;
    height: 2px;
    background-color: #3b82f6;
    transition: all 0.3s ease-in-out;
    width: 50%;
  }

  .tab-indicator.categories {
    left: 0;
  }

  .tab-indicator.dishes {
    left: 50%;
  }

  /* Tab Content */
  .tab-content-container {
    flex: 1;
    overflow-y: auto;
    padding: 1.5rem;
  }

  /* Buttons */
  .btn-outline {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.5rem 1rem;
    background-color: #ffffff;
    color: #6b7280;
    border: 1px solid #d1d5db;
    border-radius: 0.5rem;
    font-size: 0.875rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.15s ease-in-out;
  }

  .btn-outline:hover {
    background-color: #f9fafb;
    border-color: #9ca3af;
    color: #374151;
  }

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
  }

  .btn-primary:hover {
    background-color: #2563eb;
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

  .btn-icon {
    width: 1.25rem;
    height: 1.25rem;
  }

  /* Quick Create Info */
  .quick-create-info {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1.5rem;
    padding: 2rem 1rem;
    text-align: center;
  }

  .info-icon-container {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 4rem;
    height: 4rem;
    background-color: #eff6ff;
    border-radius: 50%;
  }

  .info-icon {
    width: 2rem;
    height: 2rem;
    color: #3b82f6;
  }

  .info-content {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    max-width: 400px;
  }

  .info-title {
    font-size: 1.125rem;
    font-weight: 600;
    color: #111827;
    margin: 0;
  }

  .info-description {
    font-size: 0.875rem;
    color: #6b7280;
    margin: 0;
    line-height: 1.5;
  }

  .info-actions {
    display: flex;
    gap: 0.75rem;
    justify-content: center;
    flex-wrap: wrap;
  }

  /* Responsive */
  @media (max-width: 768px) {
    .management-header {
      padding: 1rem;
    }

    .header-content {
      flex-direction: column;
      align-items: stretch;
    }

    .quick-actions {
      grid-template-columns: 1fr;
    }

    .tab-content-container {
      padding: 1rem;
    }

    .tab-btn {
      padding: 0.75rem 1rem;
    }

    .tab-content {
      gap: 0.125rem;
    }

    .action-content {
      text-align: left;
    }
  }

  @media (max-width: 480px) {
    .tab-btn {
      flex-direction: column;
      gap: 0.5rem;
      padding: 1rem 0.5rem;
    }

    .info-actions {
      flex-direction: column;
      align-items: stretch;
    }

    .quick-action-btn {
      padding: 0.75rem;
      gap: 0.75rem;
    }

    .action-icon {
      width: 1.5rem;
      height: 1.5rem;
    }
  }
</style>