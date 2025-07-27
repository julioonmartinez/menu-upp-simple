<script>
  //src/components/RestaurantUpdate.svelte
  import { onMount } from 'svelte';
  import { restaurantStore } from '../stores/restaurantStore.ts';
  import LoadingSpinner from './ui/LoadingSpinner.svelte';
  import ErrorMessage from './ui/ErrorMessage.svelte';
  import { toastStore } from '../stores/toastStore.ts';

  export let restaurantId;

  let isLoading = true;
  let error = null;
  let restaurant = null;

  // Reactive statements para el store
  $: isLoadingStore = $restaurantStore.isLoadingCurrent;
  $: errorStore = $restaurantStore.error;
  $: currentRestaurant = $restaurantStore.currentRestaurant;

  // Secciones disponibles
  const sections = [
    {
      id: 'basic',
      name: 'Información Básica',
      icon: 'fas fa-info-circle',
      description: 'Nombre, username, contacto y ubicación',
      route: 'basic-info',
      color: 'primary'
    },
    {
      id: 'schedule',
      name: 'Horarios',
      icon: 'fas fa-clock',
      description: 'Horarios de atención y días laborales',
      route: 'schedule',
      color: 'success'
    },
    {
      id: 'visual',
      name: 'Identidad Visual',
      icon: 'fas fa-palette',
      description: 'Logo, colores, fuentes e imágenes',
      route: 'visual-identity',
      color: 'warning'
    },
    {
      id: 'social',
      name: 'Redes Sociales',
      icon: 'fas fa-share-alt',
      description: 'Enlaces a redes sociales',
      route: 'social-links',
      color: 'info'
    },
    {
      id: 'features',
      name: 'Características',
      icon: 'fas fa-star',
      description: 'Tipo de cocina, métodos de pago, rango de precios',
      route: 'features',
      color: 'primary'
    },
    {
      id: 'hero-slides',
      name: 'Hero Slides',
      icon: 'fas fa-images',
      description: 'Carrusel de imágenes destacadas para el menú',
      route: 'hero-slides-form',
      color: 'warning'
    },
    {
      id: 'technical',
      name: 'Configuraciones',
      icon: 'fas fa-cog',
      description: 'QR, dominio personalizado, configuraciones técnicas',
      route: 'technical-config',
      color: 'secondary'
    }
  ];

  onMount(async () => {
    if (restaurantId) {
      await loadRestaurant();
    }
  });

  async function loadRestaurant() {
    isLoading = true;
    error = null;

    try {
      const result = await restaurantStore.loadRestaurant(restaurantId);

      if (result.success) {
        restaurant = result.data;
      } else {
        error = result.error || 'Error cargando el restaurante';
      }
    } catch (err) {
      error = err.message || 'Error desconocido';
    } finally {
      isLoading = false;
    }
  }

  function openSection(sectionId) {
    const section = sections.find(s => s.id === sectionId);
    if (section && !section.disabled) {
      // Redirigir a la página específica para cada sección
      window.location.href = `/dashboard/restaurant/${restaurantId}/${section.route}`;
    }
  }

  function onSectionUpdate() {
    // Recargar el restaurante después de una actualización
    loadRestaurant();
  }
</script>

<style>
  /* ====================================
     DISEÑO MODERNO Y RESPONSIVE
     ==================================== */
  
  .dashboard-header {
    background:var(--bg-tertiary);
    border-radius: var(--radius-2xl);
    padding: var(--spacing-3xl);
    margin-bottom: var(--spacing-3xl);
    color: white;
    position: relative;
    overflow: hidden;
  }

  .dashboard-header::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.05'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E");
    opacity: 0.3;
  }

  .dashboard-header-content {
    position: relative;
    z-index: 1;
  }

  .restaurant-badge {
    display: inline-flex;
    align-items: center;
    gap: var(--spacing-sm);
    background: rgba(255, 255, 255, 0.2);
    backdrop-filter: blur(10px);
    border: 1px solid rgba(255, 255, 255, 0.3);
    border-radius: var(--radius-full);
    padding: var(--spacing-sm) var(--spacing-lg);
    font-size: var(--font-sm);
    font-weight: var(--weight-medium);
    margin-top: var(--spacing-md);
  }

  /* ====================================
     CARDS DESTACADAS MEJORADAS
     ==================================== */
  
  .featured-cards {
    display: grid;
    gap: var(--spacing-xl);
    margin-bottom: var(--spacing-3xl);
  }

  @media (min-width: 768px) {
    .featured-cards {
      grid-template-columns: 1fr 1fr;
      gap: var(--spacing-2xl);
    }
  }

  .featured-card {
    background: var(--bg-primary);
    border-radius: var(--radius-2xl);
    padding: var(--spacing-2xl);
    box-shadow: var(--shadow-lg);
    transition: all var(--transition-normal);
    position: relative;
    overflow: hidden;
    text-decoration: none;
    color: inherit;
    display: block;
    border: 1px solid var(--bg-accent);
  }

  .featured-card::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 4px;
    background: var(--primary-gradient);
    transform: scaleX(0);
    transition: transform var(--transition-normal);
  }

  .featured-card:hover::before {
    transform: scaleX(1);
  }

  .featured-card:hover {
    transform: translateY(-8px);
    box-shadow: var(--shadow-2xl);
    border-color: var(--primary-color);
  }

  .featured-card-primary {
    background: linear-gradient(135deg, #fef7f0, #fdf2f8);
    border-left: 4px solid var(--primary-color);
    position: relative;
  }

  .featured-card-primary::after {
    content: '';
    position: absolute;
    top: 0;
    right: 0;
    width: 0;
    height: 0;
    border-style: solid;
    border-width: 0 40px 40px 0;
    border-color: transparent var(--primary-color) transparent transparent;
    opacity: 0.1;
  }

  .featured-card-primary .featured-card-title {
    color: var(--primary-color);
  }

  .featured-card-primary .featured-card-description {
    color: var(--text-secondary);
  }

  .featured-card-secondary {
    background: linear-gradient(135deg, #f8fafc, #f1f5f9);
    border-left: 4px solid var(--secondary-color);
    position: relative;
  }

  .featured-card-secondary::after {
    content: '';
    position: absolute;
    top: 0;
    right: 0;
    width: 0;
    height: 0;
    border-style: solid;
    border-width: 0 40px 40px 0;
    border-color: transparent var(--secondary-color) transparent transparent;
    opacity: 0.1;
  }

  .featured-card-secondary .featured-card-title {
    color: var(--secondary-color);
  }

  .featured-card-secondary .featured-card-description {
    color: var(--text-secondary);
  }

  .featured-card-content {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-lg);
  }

  .featured-card-header {
    display: flex;
    align-items: flex-start;
    gap: var(--spacing-lg);
  }

  .featured-card-icon {
    width: 64px;
    height: 64px;
    border-radius: var(--radius-xl);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.75rem;
    flex-shrink: 0;
    position: relative;
  }

  .featured-card-primary .featured-card-icon {
    background: linear-gradient(135deg, var(--primary-color), var(--primary-light));
    color: white;
    box-shadow: 0 8px 25px rgba(255, 107, 53, 0.3);
  }

  .featured-card-primary .featured-card-icon::before {
    content: '';
    position: absolute;
    top: -2px;
    left: -2px;
    right: -2px;
    bottom: -2px;
    background: linear-gradient(135deg, var(--primary-color), var(--primary-light));
    border-radius: var(--radius-xl);
    z-index: -1;
    opacity: 0.3;
    filter: blur(8px);
  }

  .featured-card-secondary .featured-card-icon {
    background: linear-gradient(135deg, var(--secondary-color), #1e3a8a);
    color: white;
    box-shadow: 0 8px 25px rgba(13, 27, 42, 0.3);
  }

  .featured-card-secondary .featured-card-icon::before {
    content: '';
    position: absolute;
    top: -2px;
    left: -2px;
    right: -2px;
    bottom: -2px;
    background: linear-gradient(135deg, var(--secondary-color), #1e3a8a);
    border-radius: var(--radius-xl);
    z-index: -1;
    opacity: 0.3;
    filter: blur(8px);
  }

  .featured-card-text {
    flex: 1;
    min-width: 0;
  }

  .featured-card-title {
    font-size: var(--font-xl);
    font-weight: var(--weight-bold);
    margin-bottom: var(--spacing-xs);
    line-height: var(--leading-tight);
  }

  .featured-card-description {
    font-size: var(--font-base);
    line-height: var(--leading-relaxed);
  }

  .featured-card-action {
    align-self: flex-start;
    margin-top: var(--spacing-md);
  }

  .featured-card-primary .btn {
    background: var(--primary-color);
    color: white;
    border: 1px solid var(--primary-color);
    box-shadow: 0 4px 15px rgba(255, 107, 53, 0.3);
  }

  .featured-card-primary .btn:hover {
    background: var(--primary-dark);
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(255, 107, 53, 0.4);
  }

  .featured-card-secondary .btn {
    background: var(--secondary-color);
    color: white;
    border: 1px solid var(--secondary-color);
    box-shadow: 0 4px 15px rgba(13, 27, 42, 0.3);
  }

  .featured-card-secondary .btn:hover {
    background: #1e3a8a;
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(13, 27, 42, 0.4);
  }

  /* ====================================
     GRID DE SECCIONES MEJORADO
     ==================================== */
  
  .sections-grid {
    display: grid;
    gap: var(--spacing-lg);
    margin-bottom: var(--spacing-3xl);
  }

  @media (min-width: 640px) {
    .sections-grid {
      grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
    }
  }

  @media (min-width: 1024px) {
    .sections-grid {
      grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
    }
  }

  .section-card {
    background: var(--bg-primary);
    border: 1px solid var(--bg-accent);
    border-radius: var(--radius-xl);
    padding: var(--spacing-2xl);
    transition: all var(--transition-normal);
    cursor: pointer;
    position: relative;
    overflow: hidden;
  }

  .section-card::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: var(--primary-gradient);
    opacity: 0;
    transition: opacity var(--transition-normal);
    z-index: 0;
  }

  .section-card:hover::before {
    opacity: 0.05;
  }

  .section-card:hover {
    transform: translateY(-4px);
    box-shadow: var(--shadow-xl);
    border-color: var(--primary-color);
  }

  .section-card-content {
    position: relative;
    z-index: 1;
    display: flex;
    flex-direction: column;
    gap: var(--spacing-lg);
  }

  .section-card-header {
    display: flex;
    align-items: flex-start;
    gap: var(--spacing-lg);
  }

  .section-card-icon {
    width: 48px;
    height: 48px;
    border-radius: var(--radius-lg);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.25rem;
    flex-shrink: 0;
    background: var(--bg-tertiary);
    color: var(--primary-color);
    transition: all var(--transition-normal);
  }

  .section-card:hover .section-card-icon {
    background: var(--primary-color);
    color: white;
    transform: scale(1.1);
  }

  .section-card-text {
    flex: 1;
    min-width: 0;
  }

  .section-card-title {
    font-size: var(--font-lg);
    font-weight: var(--weight-semibold);
    color: var(--text-primary);
    margin-bottom: var(--spacing-xs);
    line-height: var(--leading-tight);
  }

  .section-card-description {
    font-size: var(--font-sm);
    color: var(--text-muted);
    line-height: var(--leading-relaxed);
    margin-bottom: var(--spacing-md);
  }

  .section-card-action {
    display: flex;
    align-items: center;
    gap: var(--spacing-xs);
    color: var(--primary-color);
    font-size: var(--font-sm);
    font-weight: var(--weight-medium);
    transition: all var(--transition-normal);
  }

  .section-card:hover .section-card-action {
    transform: translateX(4px);
  }

  .section-card-action i {
    transition: transform var(--transition-normal);
  }

  .section-card:hover .section-card-action i {
    transform: translateX(4px);
  }

    /* ====================================
     RESUMEN MEJORADO
     ==================================== */
   
   .summary-card {
     background: linear-gradient(135deg, #fafbfc, #f8fafc);
     border: 1px solid var(--bg-accent);
     border-radius: var(--radius-2xl);
     padding: var(--spacing-3xl);
     box-shadow: var(--shadow-lg);
     position: relative;
     overflow: hidden;
   }

   .summary-card::before {
     content: '';
     position: absolute;
     top: 0;
     left: 0;
     right: 0;
     height: 3px;
     background: linear-gradient(90deg, var(--primary-color), var(--secondary-color));
     opacity: 0.7;
   }

  .summary-header {
    display: flex;
    align-items: center;
    gap: var(--spacing-md);
    margin-bottom: var(--spacing-2xl);
  }

  .summary-icon {
    width: 48px;
    height: 48px;
    border-radius: var(--radius-lg);
    background: var(--primary-gradient);
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    font-size: 1.25rem;
  }

  .summary-title {
    font-size: var(--font-xl);
    font-weight: var(--weight-bold);
    color: var(--text-primary);
  }

  .summary-grid {
    display: grid;
    gap: var(--spacing-lg);
  }

  @media (min-width: 640px) {
    .summary-grid {
      grid-template-columns: repeat(2, 1fr);
    }
  }

  @media (min-width: 1024px) {
    .summary-grid {
      grid-template-columns: repeat(4, 1fr);
    }
  }

  .summary-item {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-xs);
    padding: var(--spacing-lg);
    background: var(--bg-tertiary);
    border-radius: var(--radius-lg);
    border: 1px solid var(--bg-accent);
    transition: all var(--transition-normal);
  }

  .summary-item:hover {
    background: var(--bg-primary);
    box-shadow: var(--shadow-sm);
    transform: translateY(-2px);
  }

  .summary-label {
    font-size: var(--font-sm);
    color: var(--text-muted);
    font-weight: var(--weight-medium);
  }

  .summary-value {
    font-size: var(--font-lg);
    font-weight: var(--weight-bold);
    color: var(--primary-color);
  }

  .summary-status {
    display: inline-flex;
    align-items: center;
    gap: var(--spacing-xs);
    padding: var(--spacing-xs) var(--spacing-sm);
    border-radius: var(--radius-full);
    font-size: var(--font-xs);
    font-weight: var(--weight-medium);
  }

  .summary-status.active {
    background: var(--success-bg);
    color: var(--success);
  }

  .summary-status.inactive {
    background: var(--error-bg);
    color: var(--error);
  }

  /* ====================================
     RESPONSIVE MEJORADO
     ==================================== */
  
  @media (max-width: 768px) {
    .dashboard-header {
      padding: var(--spacing-2xl);
      margin-bottom: var(--spacing-2xl);
    }

    .featured-cards {
      gap: var(--spacing-lg);
      margin-bottom: var(--spacing-2xl);
    }

    .featured-card {
      padding: var(--spacing-xl);
    }

    .featured-card-header {
      flex-direction: column;
      gap: var(--spacing-md);
      text-align: center;
    }

    .featured-card-icon {
      align-self: center;
    }

    .featured-card-action {
      align-self: stretch;
    }

    .featured-card-action .btn {
      width: 100%;
      justify-content: center;
    }

    .sections-grid {
      gap: var(--spacing-md);
    }

    .section-card {
      padding: var(--spacing-xl);
    }

    .section-card-header {
      flex-direction: column;
      gap: var(--spacing-md);
      text-align: center;
    }

    .section-card-icon {
      align-self: center;
    }

    .summary-card {
      padding: var(--spacing-2xl);
    }

    .summary-grid {
      gap: var(--spacing-md);
    }
  }

  /* ====================================
     ANIMACIONES Y EFECTOS
     ==================================== */
  
  @keyframes fadeInUp {
    from {
      opacity: 0;
      transform: translateY(20px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  .animate-fade-in-up {
    animation: fadeInUp 0.6s ease-out forwards;
  }

  .featured-card:nth-child(1) { animation-delay: 0.1s; }
  .featured-card:nth-child(2) { animation-delay: 0.2s; }
  .section-card:nth-child(1) { animation-delay: 0.3s; }
  .section-card:nth-child(2) { animation-delay: 0.4s; }
  .section-card:nth-child(3) { animation-delay: 0.5s; }
  .section-card:nth-child(4) { animation-delay: 0.6s; }
  .section-card:nth-child(5) { animation-delay: 0.7s; }
  .section-card:nth-child(6) { animation-delay: 0.8s; }
  .section-card:nth-child(7) { animation-delay: 0.9s; }

  /* ====================================
     ACCESIBILIDAD
     ==================================== */
  
  @media (prefers-reduced-motion: reduce) {
    .featured-card,
    .section-card,
    .summary-item {
      transition: none;
    }

    .featured-card:hover,
    .section-card:hover,
    .summary-item:hover {
      transform: none;
    }

    .animate-fade-in-up {
      animation: none;
    }
  }

    /* ====================================
     DARK MODE SUPPORT
     ==================================== */
   
   @media (prefers-color-scheme: dark) {
     .featured-card-primary {
       background: linear-gradient(135deg, #2d1b0f, #1a0f0a);
       border-left-color: var(--primary-color);
     }

     .featured-card-primary .featured-card-title {
       color: var(--primary-color);
     }

     .featured-card-primary .featured-card-description {
       color: var(--text-secondary);
     }

     .featured-card-secondary {
       background: linear-gradient(135deg, #0f172a, #1e293b);
       border-left-color: var(--secondary-color);
     }

     .featured-card-secondary .featured-card-title {
       color: var(--secondary-color);
     }

     .featured-card-secondary .featured-card-description {
       color: var(--text-secondary);
     }

     .summary-card {
       background: linear-gradient(135deg, #1e293b, #334155);
     }
   }
</style>

<div class="container p-lg">
  <!-- Header mejorado -->
  <div class="dashboard-header">
    <div class="dashboard-header-content">
      <h1 class="text-3xl font-bold mb-md">Configuración del Restaurante</h1>
      {#if restaurant}
        <div class="restaurant-badge">
          <i class="fas fa-store"></i>
          <span>{restaurant.name || 'Sin nombre'} • @{restaurant.username || 'sin-username'}</span>
        </div>
      {/if}
      <div class="flex gap-md mt-lg">
        {#if restaurant}
          <a
            href="/{restaurant.username}"
            target="_blank"
            class="btn btn-sm"
            style="background: rgba(255, 255, 255, 0.2); backdrop-filter: blur(10px); border: 1px solid rgba(255, 255, 255, 0.3); color: white;"
          >
            <i class="fas fa-external-link-alt mr-xs"></i> Ver Público
          </a>
        {/if}
      </div>
    </div>
  </div>

  {#if isLoading || isLoadingStore}
    <div class="flex justify-center py-3xl text-center">
      <LoadingSpinner size="lg" />
    </div>
  {:else if error || errorStore}
    <div class="flex justify-center py-3xl text-center">
      <ErrorMessage
        message={error || errorStore}
        onRetry={loadRestaurant}
      />
    </div>
  {:else if restaurant}
    <!-- Cards destacadas mejoradas -->
    <div class="featured-cards">
      <a
        class="featured-card featured-card-primary animate-fade-in-up"
        href={`/dashboard/restaurant/${restaurant.id}/dishes`}
      >
        <div class="featured-card-content">
          <div class="featured-card-header">
            <div class="featured-card-icon">
              <i class="fas fa-utensils"></i>
            </div>
            <div class="featured-card-text">
              <h3 class="featured-card-title">Gestionar Platillos</h3>
              <p class="featured-card-description">Agrega, edita y organiza los platillos y categorías de tu menú digital con una interfaz intuitiva.</p>
            </div>
          </div>
          <div class="featured-card-action">
            <button type="button" class="btn btn-lg">
              <i class="fas fa-arrow-right mr-xs"></i> Ir a gestión
            </button>
          </div>
        </div>
      </a>

      <a
        class="featured-card featured-card-secondary animate-fade-in-up"
        href={`/dashboard/restaurant/${restaurant.id}/links`}
      >
        <div class="featured-card-content">
          <div class="featured-card-header">
            <div class="featured-card-icon">
              <i class="fas fa-link"></i>
            </div>
            <div class="featured-card-text">
              <h3 class="featured-card-title">Gestionar Links</h3>
              <p class="featured-card-description">Crea y personaliza los enlaces públicos para compartir tu menú digital con tus clientes.</p>
            </div>
          </div>
          <div class="featured-card-action">
            <button type="button" class="btn btn-lg">
              <i class="fas fa-arrow-right mr-xs"></i> Ver links
            </button>
          </div>
        </div>
      </a>
    </div>

    <!-- Grid de secciones mejorado -->
    <div class="sections-grid">
      {#each sections as section}
        <div
          class="section-card animate-fade-in-up"
          on:click={() => openSection(section.id)}
        >
          {#if section.disabled}
            <div class="absolute top-xs right-xs">
              <span class="rounded-full bg-gray-light text-xs font-medium px-xs py-2 text-muted">Próximamente</span>
            </div>
          {/if}
          <div class="section-card-content">
            <div class="section-card-header">
              <div class="section-card-icon">
                <i class="{section.icon}"></i>
              </div>
              <div class="section-card-text">
                <h3 class="section-card-title">{section.name}</h3>
                <p class="section-card-description">{section.description}</p>
              </div>
            </div>
            {#if !section.disabled}
              <div class="section-card-action">
                <span>Configurar</span>
                <i class="fas fa-chevron-right"></i>
              </div>
            {/if}
          </div>
        </div>
      {/each}
    </div>

    <!-- Resumen mejorado -->
    <div class="summary-card">
      <div class="summary-header">
        <div class="summary-icon">
          <i class="fas fa-chart-bar"></i>
        </div>
        <h3 class="summary-title">Resumen de Configuración</h3>
      </div>
      <div class="summary-grid">
        <div class="summary-item">
          <span class="summary-label">Estado</span>
          <div class="summary-status {restaurant.active ? 'active' : 'inactive'}">
            <i class="fas fa-circle"></i>
            <span>{restaurant.active ? 'Activo' : 'Inactivo'}</span>
          </div>
        </div>
        <div class="summary-item">
          <span class="summary-label">Plan</span>
          <span class="summary-value capitalize">{restaurant.planType || 'Free'}</span>
        </div>
        <div class="summary-item">
          <span class="summary-label">Última actualización</span>
          <span class="summary-value">{restaurant.updatedAt ? new Date(restaurant.updatedAt).toLocaleDateString() : 'N/A'}</span>
        </div>
        <div class="summary-item">
          <span class="summary-label">Configurado</span>
          <span class="summary-value">{Math.round(((restaurant.name ? 1 : 0) + (restaurant.description ? 1 : 0) + (restaurant.address ? 1 : 0) + (restaurant.phone ? 1 : 0)) / 4 * 100)}%</span>
        </div>
      </div>
    </div>
  {:else}
    <div class="flex justify-center py-3xl text-center">
      <p class="text-muted">No se encontró el restaurante.</p>
    </div>
  {/if}
</div>

