<script>
  //src/components/RestaurantUpdate.svelte
  import { onMount } from 'svelte';
  import { restaurantStore } from '../stores/restaurantStore.ts';
  import BasicInfoForm from './dashboard/edit-sections/BasicInfoForm.svelte';
  import ScheduleForm from './dashboard/edit-sections/ScheduleForm.svelte';
  import VisualIdentityForm from './dashboard/edit-sections/VisualIdentityForm.svelte';
  import SocialLinksForm from './dashboard/edit-sections/SocialLinksForm.svelte';
  import FeaturesForm from './dashboard/edit-sections/FeaturesForm.svelte';
  import TechnicalConfigForm from './dashboard/edit-sections/TechnicalConfigForm.svelte';
  import HeroSlidesForm from './dashboard/edit-sections/HeroSlidesForm.svelte';
  import LoadingSpinner from './ui/LoadingSpinner.svelte';
  import ErrorMessage from './ui/ErrorMessage.svelte';
  import Modal from './ui/Modal.svelte';
  import { toastStore } from '../stores/toastStore.ts';
    import { deleteRestaurantRating } from '../services/apiRatingService.ts';

  export let restaurantId;

  let isLoading = true;
  let error = null;
  let restaurant = null;

  // Estado de modales
  let activeModal = null;

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
      component: BasicInfoForm
    },
    {
      id: 'schedule',
      name: 'Horarios',
      icon: 'fas fa-clock',
      description: 'Horarios de atención y días laborales',
      component: ScheduleForm
    },
    {
      id: 'visual',
      name: 'Identidad Visual',
      icon: 'fas fa-palette',
      description: 'Logo, colores, fuentes e imágenes',
      component: VisualIdentityForm,
     
    },
    {
      id: 'social',
      name: 'Redes Sociales',
      icon: 'fas fa-share-alt',
      description: 'Enlaces a redes sociales',
      component: SocialLinksForm,
      
    },
    {
      id: 'features',
      name: 'Características',
      icon: 'fas fa-star',
      description: 'Tipo de cocina, métodos de pago, rango de precios',
      component: FeaturesForm,
      
    },
    {
      id: 'hero-slides',
      name: 'Hero Slides',
      icon: 'fas fa-images',
      description: 'Carrusel de imágenes destacadas para el menú',
      component: HeroSlidesForm,
      
    },
    {
      id: 'technical',
      name: 'Configuraciones',
      icon: 'fas fa-cog',
      description: 'QR, dominio personalizado, configuraciones técnicas',
      component: TechnicalConfigForm,
      
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

  function openModal(sectionId) {
    const section = sections.find(s => s.id === sectionId);
    if (section && !section.disabled) {
      activeModal = sectionId;
    }
  }

  function closeModal() {
    activeModal = null;
  }

  function onSectionUpdate() {
    // Recargar el restaurante después de una actualización
    loadRestaurant();
  }
  async function Restaurant() {
   try {
    const result = await restaurantStore.deleteRestaurant(restaurantId);
    if (result.success) {
      toastStore.addToast({
        message: 'Restaurante eliminado correctamente',
        type: 'success'
      });
      window.location.href = '/dashboard';
    } else {
      toastStore.addToast({
        message: 'Error al eliminar el restaurante',
        type: 'error'
      });
    }
   } catch (error) {
    console.error(error);
    toastStore.addToast({
        message: 'Error al eliminar el restaurante',
        type: 'error'
      });
  }
}

  // Obtener la sección activa
  $: activeSection = sections.find(s => s.id === activeModal);
</script>

<style>
  /* Icon styling for Font Awesome icons */
  .card i {
    color: var(--primary-color);
    transition: all var(--transition-normal);
  }

  .card:hover i {
    transform: scale(1.1);
    color: var(--primary-dark);
  }

  /* Special styling for the dishes card icon */
  .card-highlight i {
    color: #d97706; /* amber-600 */
  }

  .card-highlight:hover i {
    color: #b45309; /* amber-700 */
  }

  /* Special styling for the links card icon */
  .card a[href*="/links"] i {
    color: #2563eb; /* blue-600 */
  }

  .card a[href*="/links"]:hover i {
    color: #1d4ed8; /* blue-700 */
  }

  /* Section card icons */
  .section-card i {
    opacity: 0.8;
  }

  .section-card:hover i {
    opacity: 1;
  }

  /* Disabled section styling */
  .section-card.opacity-50 i {
    opacity: 0.4;
  }

  /* Responsive icon sizing */
  @media (max-width: 768px) {
    .card i {
      font-size: 2rem !important;
    }
  }

  @media (max-width: 480px) {
    .card i {
      font-size: 1.75rem !important;
    }
  }

  /* Animation for icon hover effects */
  @keyframes iconPulse {
    0%, 100% {
      transform: scale(1);
    }
    50% {
      transform: scale(1.05);
    }
  }

  .card:hover i {
    animation: iconPulse 0.3s ease-in-out;
  }

  /* Touch device optimizations */
  @media (hover: none) and (pointer: coarse) {
    .card:hover i {
      transform: none;
      animation: none;
    }
    
    .card:active i {
      transform: scale(0.95);
    }
  }

  /* Reduced motion support */
  @media (prefers-reduced-motion: reduce) {
    .card i {
      transition: none;
    }
    
    .card:hover i {
      transform: none;
      animation: none;
    }
  }
</style>

<div class="container p-lg grid gap-lg">
  <div class="mb-2xl">
    <div class="flex items-center justify-between flex-wrap">
      <div>
        <h1 class="text-3xl font-bold text-primary">Configuración del Restaurante</h1>
        {#if restaurant}
          <p class="mt-xs text-muted">
            {restaurant.name || 'Sin nombre'} • @{restaurant.username || 'sin-username'}
          </p>
        {/if}
      </div>
      <div class="flex gap-md">
        <!-- <button
          type="button"
          on:click={() => window.history.back()}
          class="btn btn-secondary btn-sm"
        >
          <i class="fas fa-arrow-left mr-xs"></i> Volver
        </button> -->
        {#if restaurant}
          <a
            href="/{restaurant.username}"
            target="_blank"
            class="btn btn-primary btn-sm"
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
    <div class="mb-lg">
      <a
        class="card card-highlight flex items-center gap-md p-lg transition-all hover:shadow-xl border-2 border-yellow-400 bg-yellow-50 cursor-pointer text-yellow-900 hover:bg-yellow-100 focus:outline-none focus:ring-2 focus:ring-yellow-400"
        href={`/dashboard/restaurant/${restaurant.id}/dishes`}
        style="text-decoration: none;"
      >
        <i class="fas fa-utensils text-3xl"></i>
        <div class="flex-1 min-w-0">
          <h3 class="text-xl font-bold mb-xs">Gestionar Platillos y Categorías</h3>
          <p class="text-base text-yellow-800 mb-0">Agrega, edita y organiza los platillos y categorías de tu menú digital.</p>
        </div>
        <button type="button" class="btn btn-primary btn-lg ml-auto">Ir a gestión</button>
      </a>
    </div>
    <div class="grid gap-lg md:grid-cols-2 lg:grid-cols-3">
      <!-- Card especial para links del restaurante -->
      <a
        class="card flex items-start gap-md p-lg transition-all hover:shadow-lg border-2 border-blue-400 bg-blue-50 cursor-pointer text-blue-900 hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-blue-400"
        href={`/dashboard/restaurant/${restaurant.id}/links`}
        style="text-decoration: none;"
      >
        <i class="fas fa-link text-3xl"></i>
        <div class="flex-1 min-w-0">
          <h3 class="text-lg font-bold mb-xs">Links</h3>
          <p class="text-sm text-blue-800 mb-0">Gestiona los enlaces públicos.</p>
        </div>
        <button type="button" class="btn btn-primary btn-md ml-auto">Ver links</button>
      </a>
      {#each sections as section}
        <div
          class="card transition-all section-card {section.disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:shadow-lg border-primary'}"
          on:click={() => openModal(section.id)}
        >
          {#if section.disabled}
            <div class="absolute top-xs right-xs">
              <span class="rounded-full bg-gray-light text-xs font-medium px-xs py-2 text-muted">Próximamente</span>
            </div>
          {/if}
          <div class="flex items-start gap-md">
            <i class="{section.icon} text-3xl"></i>
            <div class="flex-1 min-w-0">
              <h3 class="text-lg font-semibold text-primary mb-xs">{section.name}</h3>
              <p class="text-sm text-muted mb-md">{section.description}</p>
              {#if !section.disabled}
                <div class="flex items-center text-accent text-sm font-medium">
                  <span>Configurar</span>
                  <i class="fas fa-chevron-right ml-xs"></i>
                </div>
              {/if}
            </div>
          </div>
        </div>
      {/each}
    </div>

    <div class="card bg-blue-50 border border-blue-200 rounded-lg mt-2xl">
      <h3 class="text-lg font-semibold text-blue-900 mb-md">Resumen de Configuración</h3>
      <div class="grid gap-md sm:grid-cols-2 lg:grid-cols-4 text-sm">
        <div>
          <span class="font-medium text-blue-800">Estado:</span>
          <span class="ml-xs text-accent">{restaurant.active ? 'Activo' : 'Inactivo'}</span>
        </div>
        <div>
          <span class="font-medium text-blue-800">Plan:</span>
          <span class="ml-xs text-accent capitalize">{restaurant.planType || 'Free'}</span>
        </div>
        <div>
          <span class="font-medium text-blue-800">Última actualización:</span>
          <span class="ml-xs text-accent">{restaurant.updatedAt ? new Date(restaurant.updatedAt).toLocaleDateString() : 'N/A'}</span>
        </div>
        <div>
          <span class="font-medium text-blue-800">Configurado:</span>
          <span class="ml-xs text-accent">{Math.round(((restaurant.name ? 1 : 0) + (restaurant.description ? 1 : 0) + (restaurant.address ? 1 : 0) + (restaurant.phone ? 1 : 0)) / 4 * 100)}%</span>
        </div>
      </div>
    </div>
    <button on:click={deleteRestaurantRating}  class='btn btn-ghost btn-lg mt-lg'>
      <i class="fas fa-trash mr-xs"></i> Borrar restaurante
    </button>
  {:else}
    <div class="flex justify-center py-3xl text-center">
      <p class="text-muted">No se encontró el restaurante.</p>
    </div>
  {/if}
</div>

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
      {restaurantId}
      on:update={onSectionUpdate}
      on:close={closeModal}
    />
  </Modal>
{/if}