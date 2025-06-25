<!-- src/components/RestaurantDashboard.svelte -->
<script>
  import { onMount } from 'svelte';
  import { restaurantStore } from '../stores/restaurantStore.ts';
  import { restaurantService } from '../services/restaurantService.ts';
  
  // Estados del componente
  let showCreateForm = $state(false);
  let editingRestaurant = $state(null);
  let deleteConfirmId = $state(null);
  let selectedImageType = $state('logo');
  let uploadingImageFor = $state(null);
  
  // 🔧 CORRECCIÓN: Llamar a useRestaurants() como función
  const restaurantHook = restaurantStore.getCurrentState();
  
  // 🔧 CORRECCIÓN: Usar stores reactivos de Svelte 5
  let loading = $state(false);
  let updating = $state(false);
  let deleting = $state(false);
  let uploadingImage = $state(false);
  let restaurants = $state([]);
  let mainError = $state(null);
  let editError = $state(null);
  let removeError = $state(null);
  let imgError = $state(null);
  
  // 🔧 CORRECCIÓN: Suscribirse a los stores correctamente en Svelte 5
  $effect(() => {
    const unsubscribeLoading = restaurantStore.isLoadingUser.subscribe(value => {
      loading = value;
    });
    
    const unsubscribeUpdating = restaurantStore.isUpdating.subscribe(value => {
      updating = value;
    });
    
    const unsubscribeDeleting = restaurantStore.isDeleting.subscribe(value => {
      deleting = value;
    });
    
    const unsubscribeUploadingImage = restaurantStore.isUploadingImage.subscribe(value => {
      uploadingImage = value;
    });
    
    const unsubscribeRestaurants = restaurantStore.userRestaurants.subscribe(value => {
      restaurants = value;
    });
    
    const unsubscribeError = restaurantStore.error.subscribe(value => {
      mainError = value;
    });
    
    const unsubscribeUpdateError = restaurantStore.updateError.subscribe(value => {
      editError = value;
    });
    
    const unsubscribeDeleteError = restaurantStore.deleteError.subscribe(value => {
      removeError = value;
    });
    
    const unsubscribeImageError = restaurantStore.imageError.subscribe(value => {
      imgError = value;
    });
    
    // Cleanup function
    return () => {
      unsubscribeLoading();
      unsubscribeUpdating();
      unsubscribeDeleting();
      unsubscribeUploadingImage();
      unsubscribeRestaurants();
      unsubscribeError();
      unsubscribeUpdateError();
      unsubscribeDeleteError();
      unsubscribeImageError();
    };
  });
  
  onMount(async () => {
    // 🔧 CORRECCIÓN: Usar los métodos del store directamente
    await restaurantStore.loadUserRestaurants();
  });
  
  // Editar restaurante
  function startEdit(restaurant) {
    editingRestaurant = {
      id: restaurant.id,
      name: restaurant.name || '',
      username: restaurant.username || '',
      description: restaurant.description || '',
      address: restaurant.address || '',
      phone: restaurant.phone || '',
      email: restaurant.email || '',
      website: restaurant.website || ''
    };
  }
  
  function cancelEdit() {
    editingRestaurant = null;
  }
  
  async function saveEdit(event) {
    if (event) event.preventDefault();
    if (!editingRestaurant) return;
    
    const { id, ...updateData } = editingRestaurant;
    
    // Limpiar campos vacíos
    Object.keys(updateData).forEach(key => {
      if (!updateData[key] || updateData[key].trim() === '') {
        delete updateData[key];
      }
    });
    
    const result = await restaurantStore.updateRestaurant(id, updateData);
    
    if (result.success) {
      editingRestaurant = null;
      // Mostrar mensaje de éxito
      alert('Restaurante actualizado correctamente');
    }
  }
  
  // Eliminar restaurante
  function confirmDelete(restaurantId) {
    deleteConfirmId = restaurantId;
  }
  
  function cancelDelete() {
    deleteConfirmId = null;
  }
  
  async function performDelete() {
    if (!deleteConfirmId) return;
    
    const result = await restaurantStore.deleteRestaurant(deleteConfirmId);
    
    if (result.success) {
      deleteConfirmId = null;
      alert('Restaurante eliminado correctamente');
    }
  }
  
  // Subir imagen
  function handleImageUpload(event, restaurantId, imageType) {
    const file = event.target.files[0];
    if (!file) return;
    
    // Validar tipo de archivo
    if (!file.type.startsWith('image/')) {
      alert('Por favor selecciona un archivo de imagen válido');
      return;
    }
    
    // Validar tamaño (5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('El archivo es muy grande. Máximo 5MB');
      return;
    }
    
    uploadImage(restaurantId, file, imageType);
  }
  
  async function uploadImage(restaurantId, file, imageType) {
    uploadingImageFor = `${restaurantId}-${imageType}`;
    
    const result = await restaurantStore.uploadRestaurantImage(restaurantId, file, imageType);
    
    uploadingImageFor = null;
    
    if (result.success) {
      alert(`${getImageTypeLabel(imageType)} subida correctamente`);
      // Recargar datos del restaurante
      await restaurantStore.loadUserRestaurants(true);
    }
  }
  
  function getImageTypeLabel(type) {
    const labels = {
      'logo': 'Logo',
      'image': 'Imagen principal',
      'imageProfile': 'Imagen de perfil',
      'imageCover': 'Imagen de portada',
      'imageText': 'Imagen de texto',
      'qrCode': 'Código QR'
    };
    return labels[type] || 'Imagen';
  }
  
  function getRestaurantUrl(restaurant) {
    return restaurantService.utils.getRestaurantPublicUrl(restaurant);
  }
  
  function isComplete(restaurant) {
    return restaurantService.utils.isRestaurantComplete(restaurant);
  }
  
  function refreshData() {
    restaurantStore.loadUserRestaurants(true);
  }
</script>

<!-- Dashboard de Restaurantes -->
<div class="restaurant-dashboard container p-3xl">
  <!-- Header -->
  <div class="dashboard-header mb-2xl">
    <div class="header-content flex justify-between items-center flex-wrap gap-lg">
      <h1 class="text-3xl font-bold text-primary m-0">Mis Restaurantes</h1>
      <div class="header-actions flex gap-md">
        <button
          class="btn btn-primary"
          onclick={() => showCreateForm = true}
        >
          <i class="fa-solid fa-plus"></i>
          Crear Restaurante
        </button>
        <button
          class="btn btn-secondary"
          onclick={refreshData}
          disabled={loading}
        >
          <i class="fa-solid fa-arrows-rotate"></i>
          Actualizar
        </button>
      </div>
    </div>
  </div>

  <!-- Estados de carga y error -->
  {#if loading}
    <div class="loading-state flex flex-col items-center justify-center p-4xl text-center">
      <span class="spinner-large animate-spin mb-md"></span>
      <p class="text-lg text-muted">Cargando tus restaurantes...</p>
    </div>
  {:else if mainError}
    <div class="error-state flex flex-col items-center justify-center p-4xl text-center">
      <i class="fa-solid fa-circle-exclamation text-4xl text-error mb-md"></i>
      <h3 class="text-xl font-semibold text-error mb-xs">Error cargando restaurantes</h3>
      <p class="text-muted mb-md">{mainError}</p>
      <button class="btn btn-primary" onclick={refreshData}>
        Intentar de nuevo
      </button>
    </div>
  {:else if (restaurants?.length || 0 ) === 0}
    <!-- Estado vacío -->
    <div class="empty-state flex flex-col items-center justify-center p-4xl text-center">
      <i class="fa-solid fa-utensils text-4xl text-accent mb-md"></i>
      <h3 class="text-xl font-semibold text-primary mb-xs">No tienes restaurantes todavía</h3>
      <p class="text-muted mb-md">Crea tu primer restaurante para empezar a gestionar tu negocio digital</p>
      <button
        class="btn btn-primary btn-large"
        onclick={() => showCreateForm = true}
      >
        Crear mi primer restaurante
      </button>
    </div>
  {:else}
    <!-- Lista de restaurantes -->
    <div class="restaurants-grid grid gap-2xl grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
      {#each restaurants as restaurant (restaurant.id)}
        <div class="restaurant-card card flex flex-col gap-lg {isComplete(restaurant) ? '' : 'incomplete'}">
          <!-- Header de la tarjeta -->
          <div class="card-header flex justify-between items-start">
            <div class="restaurant-info flex items-center gap-md flex-1">
              {#if restaurant.logo}
                <img src={restaurant.logo} alt="Logo" class="restaurant-logo w-12 h-12 rounded-lg object-cover border border-accent" />
              {:else}
                <div class="restaurant-logo-placeholder w-12 h-12 rounded-lg bg-gray flex items-center justify-center font-bold text-xl text-muted border border-accent">
                  {restaurant.name.charAt(0).toUpperCase()}
                </div>
              {/if}
              <div class="restaurant-details flex-1">
                <h3 class="restaurant-name text-lg font-semibold text-primary m-0 mb-xs">{restaurant.name}</h3>
                {#if restaurant.username}
                  <span class="restaurant-username text-muted text-sm font-medium">@{restaurant.username}</span>
                {/if}
                <div class="restaurant-status flex gap-xs mt-xs">
                  {#if isComplete(restaurant)}
                    <span class="status-badge complete">Completo</span>
                  {:else}
                    <span class="status-badge incomplete">Incompleto</span>
                  {/if}
                  {#if restaurant.active}
                    <span class="status-badge active">Activo</span>
                  {:else}
                    <span class="status-badge inactive">Inactivo</span>
                  {/if}
                </div>
              </div>
            </div>
            <div class="card-actions flex gap-xs">
              <button
                class="btn-icon"
                onclick={() => startEdit(restaurant)}
                title="Editar"
              >
                <i class="fa-solid fa-pen"></i>
              </button>
              <button
                class="btn-icon danger"
                onclick={() => confirmDelete(restaurant.id)}
                title="Eliminar"
              >
                <i class="fa-solid fa-trash"></i>
              </button>
            </div>
          </div>
          <!-- Descripción -->
          {#if restaurant.description}
            <p class="restaurant-description text-muted leading-normal m-0">{restaurant.description}</p>
          {/if}
          <!-- Información adicional -->
          <div class="restaurant-meta flex flex-col gap-xs">
            {#if restaurant.address}
              <div class="meta-item flex items-center gap-xs text-muted text-sm">
                <i class="fa-solid fa-location-dot"></i>
                <span>{restaurant.address}</span>
              </div>
            {/if}
            {#if restaurant.phone}
              <div class="meta-item flex items-center gap-xs text-muted text-sm">
                <i class="fa-solid fa-phone"></i>
                <span>{restaurant.phone}</span>
              </div>
            {/if}
          </div>
          <!-- Subir imágenes -->
          <div class="image-upload-section border-t border-accent pt-md">
            <h4 class="text-base font-semibold text-secondary mb-xs">Imágenes</h4>
            <div class="upload-controls flex gap-md items-center">
              <select bind:value={selectedImageType} class="image-type-select input">
                <option value="logo">Logo</option>
                <option value="image">Imagen principal</option>
                <option value="imageProfile">Imagen perfil</option>
                <option value="imageCover">Imagen portada</option>
                <option value="imageText">Imagen texto</option>
                <option value="qrCode">Código QR</option>
              </select>
              <label class="upload-btn flex items-center gap-xs px-md py-xs bg-gray-light border border-accent rounded-lg text-sm cursor-pointer transition-all relative {uploadingImageFor === `${restaurant.id}-${selectedImageType}` ? 'uploading opacity-50 pointer-events-none' : ''}">
                {#if uploadingImageFor === `${restaurant.id}-${selectedImageType}`}
                  <span class="spinner-small animate-spin"></span>
                  Subiendo...
                {:else}
                  <i class="fa-solid fa-upload"></i>
                  Subir {getImageTypeLabel(selectedImageType)}
                {/if}
                <input
                  type="file"
                  accept="image/*"
                  onchange={(e) => handleImageUpload(e, restaurant.id, selectedImageType)}
                  disabled={uploadingImageFor === `${restaurant.id}-${selectedImageType}`}
                  style="display: none;"
                />
              </label>
            </div>
          </div>
          <!-- Acciones de la tarjeta -->
          <div class="card-footer flex gap-md justify-between border-t border-accent pt-md">
            <a
              href={getRestaurantUrl(restaurant)}
              target="_blank"
              class="btn btn-outline"
            >
              <i class="fa-solid fa-arrow-up-right-from-square"></i>
              Ver Público
            </a>
            <button class="btn btn-primary">
              <i class="fa-solid fa-gear"></i>
              Gestionar
            </button>
          </div>
        </div>
      {/each}
    </div>
  {/if}

  <!-- Modal de edición -->
  {#if editingRestaurant}
    <div class="modal-overlay" onclick={cancelEdit}>
      <div class="modal" onclick={event => event.stopPropagation()}>
        <div class="modal-header">
          <h3>Editar Restaurante</h3>
          <button class="btn-close" onclick={cancelEdit}>
            <i class="fa-solid fa-xmark"></i>
          </button>
        </div>
        
          <form onsubmit={saveEdit}>
            <div class="form-row">
              <div class="form-group">
                <label>Nombre *</label>
                <input
                  type="text"
                  bind:value={editingRestaurant.name}
                  required
                  class="form-input"
                />
              </div>
              
              <div class="form-group">
                <label>Username</label>
                <input
                  type="text"
                  bind:value={editingRestaurant.username}
                  class="form-input"
                />
              </div>
            </div>
            
            <div class="form-group">
              <label>Descripción</label>
              <textarea
                bind:value={editingRestaurant.description}
                class="form-textarea"
                rows="3"
              ></textarea>
            </div>
            
            <div class="form-group">
              <label>Dirección</label>
              <input
                type="text"
                bind:value={editingRestaurant.address}
                class="form-input"
              />
            </div>
            
            <div class="form-row">
              <div class="form-group">
                <label>Teléfono</label>
                <input
                  type="tel"
                  bind:value={editingRestaurant.phone}
                  class="form-input"
                />
              </div>
              
              <div class="form-group">
                <label>Email</label>
                <input
                  type="email"
                  bind:value={editingRestaurant.email}
                  class="form-input"
                />
              </div>
            </div>
            
            <div class="form-group">
              <label>Sitio Web</label>
              <input
                type="url"
                bind:value={editingRestaurant.website}
                class="form-input"
              />
            </div>
            
            {#if editError}
              <div class="error-message">
                {editError}
              </div>
            {/if}
            <div class="modal-footer">
              <button
                type="button"
                class="btn btn-secondary"
                onclick={cancelEdit}
                disabled={updating}
              >
                Cancelar
              </button>
              <button
                type="submit"
                class="btn btn-primary"
                disabled={updating || !editingRestaurant.name.trim()}
              >
                {#if updating}
                  <span class="spinner-small"></span>
                  Guardando...
                {:else}
                  Guardar Cambios
                {/if}
              </button>
            </div>
          </form>
        </div>
      </div>
    
  {/if}

  <!-- Modal de confirmación de eliminación -->
  {#if deleteConfirmId}
    <div class="modal-overlay" onclick={cancelDelete}>
      <div class="modal modal-small" onclick={event => event.stopPropagation()}>
        <div class="modal-header">
          <h3>Confirmar Eliminación</h3>
        </div>
        
        <div class="modal-body">
          <p>¿Estás seguro de que quieres eliminar este restaurante?</p>
          <p class="warning-text">Esta acción no se puede deshacer.</p>
          
          {#if removeError}
            <div class="error-message">
              {removeError}
            </div>
          {/if}
        </div>
        
        <div class="modal-footer">
          <button
            type="button"
            class="btn btn-secondary"
            onclick={cancelDelete}
            disabled={deleting}
          >
            Cancelar
          </button>
          <button
            type="button"
            class="btn btn-danger"
            onclick={performDelete}
            disabled={deleting}
          >
            {#if deleting}
              <span class="spinner-small"></span>
              Eliminando...
            {:else}
              Eliminar
            {/if}
          </button>
        </div>
      </div>
    </div>
  {/if}

  <!-- Errores de imagen -->
  {#if imgError}
    <div class="error-toast">
      <span>Error subiendo imagen: {imgError}</span>
      <button onclick={() => imgError = null}>×</button>
    </div>
  {/if}
</div>

<style>
  /* Solo estilos locales estrictamente necesarios */
  .restaurant-card.incomplete {
    border-color: var(--warning);
    background: var(--warning-bg);
  }
  .status-badge {
    padding: 0.25rem 0.5rem;
    border-radius: var(--radius-xs);
    font-size: var(--font-xs);
    font-weight: var(--weight-semibold);
    text-transform: uppercase;
  }
  .status-badge.complete {
    background: var(--success-bg);
    color: var(--success);
  }
  .status-badge.incomplete {
    background: var(--warning-bg);
    color: var(--warning);
  }
  .status-badge.active {
    background: var(--info-bg);
    color: var(--info);
  }
  .status-badge.inactive {
    background: var(--bg-tertiary);
    color: var(--text-muted);
  }
  .upload-btn.uploading {
    opacity: 0.7;
    cursor: not-allowed;
  }
  /* Spinner override for FontAwesome */
  .spinner-large, .spinner-small {
    border-color: var(--bg-accent);
    border-top-color: var(--primary-color);
  }
</style>