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
  import LoadingSpinner from './ui/LoadingSpinner.svelte';
  import ErrorMessage from './ui/ErrorMessage.svelte';
  import Modal from './ui/Modal.svelte';

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
      icon: '📋',
      description: 'Nombre, username, contacto y ubicación',
      component: BasicInfoForm
    },
    {
      id: 'schedule',
      name: 'Horarios',
      icon: '🕒',
      description: 'Horarios de atención y días laborales',
      component: ScheduleForm
    },
    {
      id: 'visual',
      name: 'Identidad Visual',
      icon: '🎨',
      description: 'Logo, colores, fuentes e imágenes',
      component: VisualIdentityForm,
     
    },
    {
      id: 'social',
      name: 'Redes Sociales',
      icon: '📱',
      description: 'Enlaces a redes sociales',
      component: SocialLinksForm,
      
    },
    {
      id: 'features',
      name: 'Características',
      icon: '⭐',
      description: 'Tipo de cocina, métodos de pago, rango de precios',
      component: FeaturesForm,
      
    },
    {
      id: 'technical',
      name: 'Configuraciones',
      icon: '⚙️',
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

  // Obtener la sección activa
  $: activeSection = sections.find(s => s.id === activeModal);
</script>

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
        <button
          type="button"
          on:click={() => window.history.back()}
          class="btn btn-secondary btn-sm"
        >
          <i class="fas fa-arrow-left mr-xs"></i> Volver
        </button>
        {#if restaurant}
          <a
            href="/restaurant/{restaurant.username}"
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
        <span class="text-3xl" role="img" aria-label="Platillos">🍽️</span>
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
        <span class="text-3xl" role="img" aria-label="Links">🔗</span>
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
            <span class="text-3xl" role="img" aria-label={section.name}>{section.icon}</span>
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
    <button  class='btn btn-ghost btn-lg mt-lg'>
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