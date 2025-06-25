<!-- src/components/restaurant/RestaurantDashboard.svelte -->
<!-- Ejemplo de cómo integrar el sistema de gestión de menú -->

<script lang="ts">
  import { onMount } from 'svelte';
  import Modal from '../ui/Modal.svelte';
  import MenuManagement from './MenuManagement.svelte';
  import CategoryManager from './CategoryManager.svelte';
  import DishManager from './DishManager.svelte';
  import restaurantService from '../../services/restaurantService';

  export let idRestaurant : string | null = null; 
  
  // Estado de carga y error
  let loading = false;
  let error: string | null = null;

  // Estado del restaurante
  export let restaurant: any = null;

  // Cargar restaurante cuando cambia idRestaurant
  $: if (idRestaurant) {
    loading = true;
    error = null;
    
    restaurantService.getRestaurant(idRestaurant)
      .then(result => {
        if (result.success) {
          restaurant = result.data;
        } else {
          error = result.error || 'No se pudo cargar el restaurante';
          restaurant = null;
        }
      })
      .catch(e => {
        error = e.message || 'Error desconocido';
        restaurant = null;
      })
      .finally(() => {
        loading = false;
      });
  }

  // Estado del modal
  let activeModal: string | null = null;
  let activeSection: any = null;

  // Secciones disponibles (siguiendo tu patrón)
  type SectionKey = 'menu' | 'categories' | 'dishes';
  const sections: Record<SectionKey, {
    name: string;
    component: typeof MenuManagement | typeof CategoryManager | typeof DishManager;
    icon: string;
  }> = {
    menu: {
      name: 'Gestión de Menú',
      component: MenuManagement,
      icon: '🍽️'
    },
    categories: {
      name: 'Gestión de Categorías', 
      component: CategoryManager,
      icon: '🏷️'
    },
    dishes: {
      name: 'Gestión de Platillos',
      component: DishManager,
      icon: '🍕'
    }
  };
  function openModal(sectionKey: SectionKey) {
    activeSection = sections[sectionKey];
    activeModal = sectionKey;
  }
  // Methods
  // function openModal(sectionKey: string) {
  //   activeSection = sections[sectionKey];
  //   activeModal = sectionKey;
  // }

  function closeModal() {
    activeModal = null;
    activeSection = null;
  }

  function onSectionUpdate(event: CustomEvent) {
    const { type, ...data } = event.detail;
    
    console.log('Update received:', type, data);
    
    // Aquí puedes manejar las actualizaciones según el tipo
    switch (type) {
      case 'category_created':
        console.log('Nueva categoría creada:', data.category);
        // Actualizar datos, mostrar notificación, etc.
        break;
        
      case 'category_updated':
        console.log('Categoría actualizada:', data.category);
        break;
        
      case 'category_deleted':
        console.log('Categoría eliminada:', data.categoryId);
        break;
        
      case 'dish_created':
        console.log('Nuevo platillo creado:', data.dish);
        break;
        
      case 'dish_updated':
        console.log('Platillo actualizado:', data.dish);
        break;
        
      case 'dish_deleted':
        console.log('Platillo eliminado:', data.dishId);
        break;
    }
  }

  // Lifecycle
  $: if (restaurant) {
    console.log('Dashboard montado para restaurante:', idRestaurant, restaurant.name);
  }
</script>

<div class="restaurant-dashboard">
  {#if loading}
    <div class="dashboard-loader">Cargando restaurante...</div>
  {:else if error}
    <div class="dashboard-error">{error}</div>
  {:else if restaurant}
    <!-- Dashboard Header -->
    <div class="dashboard-header">
      <div class="header-content">
        <div class="restaurant-info">
          <h1 class="restaurant-name">{restaurant?.name}</h1>
          <p class="restaurant-subtitle">Panel de administración</p>
        </div>
        
        <div class="header-stats">
          <div class="stat-card">
            <div class="stat-value">12</div>
            <div class="stat-label">Categorías</div>
          </div>
          <div class="stat-card">
            <div class="stat-value">48</div>
            <div class="stat-label">Platillos</div>
          </div>
        </div>
      </div>
    </div>

    <!-- Quick Actions Grid -->
    <div class="quick-actions-grid">
      <h2 class="section-title">Gestión de Menú</h2>
      
      <div class="actions-container">
        <!-- Menu Management - Comprehensive -->
        <button
          type="button"
          class="action-card primary"
          on:click={() => openModal('menu')}
        >
          <div class="card-icon">🍽️</div>
          <div class="card-content">
            <h3 class="card-title">Gestión Completa del Menú</h3>
            <p class="card-description">
              Administra categorías y platillos desde un panel unificado
            </p>
            <div class="card-features">
              <span class="feature">Categorías</span>
              <span class="feature">Platillos</span>
              <span class="feature">Imágenes</span>
            </div>
          </div>
          <div class="card-arrow">
            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
            </svg>
          </div>
        </button>

        <!-- Categories Only -->
        <button
          type="button"
          class="action-card secondary"
          on:click={() => openModal('categories')}
        >
          <div class="card-icon">🏷️</div>
          <div class="card-content">
            <h3 class="card-title">Solo Categorías</h3>
            <p class="card-description">
              Gestiona únicamente las categorías del menú
            </p>
            <div class="card-features">
              <span class="feature">Crear categorías</span>
              <span class="feature">Editar existentes</span>
            </div>
          </div>
          <div class="card-arrow">
            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
            </svg>
          </div>
        </button>

        <!-- Dishes Only -->
        <button
          type="button"
          class="action-card secondary"
          on:click={() => openModal('dishes')}
        >
          <div class="card-icon">🍕</div>
          <div class="card-content">
            <h3 class="card-title">Solo Platillos</h3>
            <p class="card-description">
              Administra únicamente los platillos del menú
            </p>
            <div class="card-features">
              <span class="feature">Crear platillos</span>
              <span class="feature">Subir imágenes</span>
              <span class="feature">Info nutricional</span>
            </div>
          </div>
          <div class="card-arrow">
            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
            </svg>
          </div>
        </button>
      </div>
    </div>

    <!-- Recent Activity -->
    <div class="recent-activity">
      <h2 class="section-title">Actividad Reciente</h2>
      
      <div class="activity-list">
        <div class="activity-item">
          <div class="activity-icon create">
            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
            </svg>
          </div>
          <div class="activity-content">
            <p class="activity-description">Se creó la categoría <strong>"Postres"</strong></p>
            <span class="activity-time">Hace 2 horas</span>
          </div>
        </div>

        <div class="activity-item">
          <div class="activity-icon update">
            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </div>
          <div class="activity-content">
            <p class="activity-description">Se actualizó el platillo <strong>"Tacos al Pastor"</strong></p>
            <span class="activity-time">Hace 4 horas</span>
          </div>
        </div>

        <div class="activity-item">
          <div class="activity-icon create">
            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
            </svg>
          </div>
          <div class="activity-content">
            <p class="activity-description">Se agregó el platillo <strong>"Enchiladas Rojas"</strong></p>
            <span class="activity-time">Ayer</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Tips Section -->
    <div class="tips-section">
      <h2 class="section-title">💡 Consejos</h2>
      
      <div class="tips-grid">
        <div class="tip-card">
          <div class="tip-icon">📸</div>
          <div class="tip-content">
            <h4 class="tip-title">Agrega imágenes atractivas</h4>
            <p class="tip-description">
              Los platillos con imágenes de alta calidad reciben 3x más pedidos
            </p>
          </div>
        </div>

        <div class="tip-card">
          <div class="tip-icon">🏷️</div>
          <div class="tip-content">
            <h4 class="tip-title">Organiza con categorías</h4>
            <p class="tip-description">
              Facilita la navegación de tus clientes agrupando platillos similares
            </p>
          </div>
        </div>

        <div class="tip-card">
          <div class="tip-icon">📊</div>
          <div class="tip-content">
            <h4 class="tip-title">Información nutricional</h4>
            <p class="tip-description">
              Agrega datos nutricionales para atraer clientes conscientes de la salud
            </p>
          </div>
        </div>
      </div>
    </div>
  {/if}
</div>

<!-- Modal Integration (siguiendo tu patrón exacto) -->
{#if activeSection}
  <Modal
    isOpen={!!activeModal}
    title={activeSection.name}
    size="xl"
    on:close={closeModal}
  >
    <svelte:component
      this={activeSection.component}
      {restaurant}
      restaurantId={restaurant.id}
      on:update={onSectionUpdate}
      on:close={closeModal}
    />
  </Modal>
{/if}

<style>
  .restaurant-dashboard {
    display: flex;
    flex-direction: column;
    gap: 2rem;
    padding: 2rem;
    max-width: 1200px;
    margin: 0 auto;
  }

  /* Dashboard Header */
  .dashboard-header {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    border-radius: 1rem;
    padding: 2rem;
    color: white;
  }

  .header-content {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 2rem;
  }

  .restaurant-info {
    flex: 1;
  }

  .restaurant-name {
    font-size: 2rem;
    font-weight: 700;
    margin: 0 0 0.5rem 0;
  }

  .restaurant-subtitle {
    font-size: 1rem;
    opacity: 0.9;
    margin: 0;
  }

  .header-stats {
    display: flex;
    gap: 1.5rem;
  }

  .stat-card {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.25rem;
    padding: 1rem;
    background-color: rgba(255, 255, 255, 0.15);
    border-radius: 0.75rem;
    backdrop-filter: blur(10px);
    min-width: 80px;
  }

  .stat-value {
    font-size: 1.5rem;
    font-weight: 700;
  }

  .stat-label {
    font-size: 0.75rem;
    opacity: 0.9;
    text-align: center;
  }

  /* Sections */
  .section-title {
    font-size: 1.25rem;
    font-weight: 600;
    color: #111827;
    margin: 0 0 1rem 0;
  }

  /* Quick Actions */
  .quick-actions-grid {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .actions-container {
    display: grid;
    grid-template-columns: 2fr 1fr 1fr;
    gap: 1.5rem;
  }

  .action-card {
    display: flex;
    align-items: center;
    gap: 1.5rem;
    padding: 1.5rem;
    background-color: #ffffff;
    border: 1px solid #e5e7eb;
    border-radius: 1rem;
    cursor: pointer;
    transition: all 0.2s ease-in-out;
    text-align: left;
  }

  .action-card:hover {
    border-color: #d1d5db;
    box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1);
    transform: translateY(-2px);
  }

  .action-card.primary {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    border: none;
  }

  .action-card.primary:hover {
    transform: translateY(-3px);
    box-shadow: 0 15px 35px -5px rgba(102, 126, 234, 0.4), 0 10px 15px -6px rgba(102, 126, 234, 0.2);
  }

  .action-card.secondary:hover {
    border-color: #3b82f6;
  }

  .card-icon {
    font-size: 2.5rem;
    flex-shrink: 0;
  }

  .card-content {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .card-title {
    font-size: 1.125rem;
    font-weight: 600;
    margin: 0;
  }

  .action-card.secondary .card-title {
    color: #111827;
  }

  .card-description {
    font-size: 0.875rem;
    margin: 0;
    opacity: 0.9;
  }

  .action-card.secondary .card-description {
    color: #6b7280;
  }

  .card-features {
    display: flex;
    gap: 0.5rem;
    flex-wrap: wrap;
  }

  .feature {
    padding: 0.125rem 0.5rem;
    background-color: rgba(255, 255, 255, 0.2);
    border-radius: 1rem;
    font-size: 0.75rem;
    font-weight: 500;
  }

  .action-card.secondary .feature {
    background-color: #eff6ff;
    color: #1d4ed8;
  }

  .card-arrow {
    width: 1.5rem;
    height: 1.5rem;
    flex-shrink: 0;
    opacity: 0.7;
  }

  /* Recent Activity */
  .recent-activity {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .activity-list {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .activity-item {
    display: flex;
    align-items: center;
    gap: 1rem;
    padding: 1rem;
    background-color: #ffffff;
    border: 1px solid #e5e7eb;
    border-radius: 0.75rem;
  }

  .activity-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 2.5rem;
    height: 2.5rem;
    border-radius: 50%;
    flex-shrink: 0;
  }

  .activity-icon.create {
    background-color: #dcfce7;
    color: #166534;
  }

  .activity-icon.update {
    background-color: #dbeafe;
    color: #1d4ed8;
  }

  .activity-icon svg {
    width: 1.25rem;
    height: 1.25rem;
  }

  .activity-content {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }

  .activity-description {
    font-size: 0.875rem;
    color: #374151;
    margin: 0;
  }

  .activity-time {
    font-size: 0.75rem;
    color: #9ca3af;
  }

  /* Tips Section */
  .tips-section {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .tips-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 1rem;
  }

  .tip-card {
    display: flex;
    align-items: flex-start;
    gap: 1rem;
    padding: 1.5rem;
    background-color: #f9fafb;
    border: 1px solid #e5e7eb;
    border-radius: 0.75rem;
  }

  .tip-icon {
    font-size: 2rem;
    flex-shrink: 0;
  }

  .tip-content {
    flex: 1;
  }

  .tip-title {
    font-size: 0.875rem;
    font-weight: 600;
    color: #111827;
    margin: 0 0 0.5rem 0;
  }

  .tip-description {
    font-size: 0.75rem;
    color: #6b7280;
    margin: 0;
    line-height: 1.4;
  }

  /* Loader and Error */
  .dashboard-loader {
    text-align: center;
    padding: 2rem;
    font-size: 1.2rem;
    color: #666;
  }

  .dashboard-error {
    text-align: center;
    padding: 2rem;
    color: #b91c1c;
    background: #fee2e2;
    border-radius: 1rem;
    margin: 2rem 0;
  }

  /* Responsive */
  @media (max-width: 1024px) {
    .actions-container {
      grid-template-columns: 1fr;
    }

    .action-card {
      padding: 1.25rem;
    }

    .header-content {
      flex-direction: column;
      gap: 1.5rem;
    }

    .header-stats {
      align-self: stretch;
      justify-content: space-around;
    }
  }

  @media (max-width: 768px) {
    .restaurant-dashboard {
      padding: 1rem;
      gap: 1.5rem;
    }

    .dashboard-header {
      padding: 1.5rem;
    }

    .restaurant-name {
      font-size: 1.5rem;
    }

    .card-content {
      gap: 0.375rem;
    }

    .card-title {
      font-size: 1rem;
    }

    .card-description {
      font-size: 0.8rem;
    }

    .action-card {
      flex-direction: column;
      text-align: center;
      gap: 1rem;
    }

    .card-arrow {
      transform: rotate(90deg);
    }

    .tips-grid {
      grid-template-columns: 1fr;
    }
  }

  @media (max-width: 480px) {
    .action-card {
      padding: 1rem;
    }

    .tip-card {
      padding: 1rem;
    }

    .activity-item {
      padding: 0.75rem;
    }

    .stat-card {
      padding: 0.75rem;
      min-width: 70px;
    }

    .stat-value {
      font-size: 1.25rem;
    }
  }
</style>