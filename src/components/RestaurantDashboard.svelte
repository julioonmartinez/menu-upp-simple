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
<div class="restaurant-dashboard">
  <!-- Header -->
  <div class="dashboard-header">
    <div class="header-content">
      <h1>Mis Restaurantes</h1>
      <div class="header-actions">
        <button
          class="btn btn-primary"
          onclick={() => showCreateForm = true}
        >
          <svg class="icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
          </svg>
          Crear Restaurante
        </button>
        
        <button
          class="btn btn-secondary"
          onclick={refreshData}
          disabled={loading}
        >
          <svg class="icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
          </svg>
          Actualizar
        </button>
      </div>
    </div>
  </div>

  <!-- Estados de carga y error -->
  {#if loading}
    <div class="loading-state">
      <div class="spinner-large"></div>
      <p>Cargando tus restaurantes...</p>
    </div>
  {:else if mainError}
    <div class="error-state">
      <svg class="error-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
      </svg>
      <h3>Error cargando restaurantes</h3>
      <p>{mainError}</p>
      <button class="btn btn-primary" onclick={refreshData}>
        Intentar de nuevo
      </button>
    </div>
  {:else if (restaurants?.length || 0 ) === 0}
    <!-- Estado vacío -->
    <div class="empty-state">
      <svg class="empty-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/>
      </svg>
      <h3>No tienes restaurantes todavía</h3>
      <p>Crea tu primer restaurante para empezar a gestionar tu negocio digital</p>
      <button
        class="btn btn-primary btn-large"
        onclick={() => showCreateForm = true}
      >
        Crear mi primer restaurante
      </button>
    </div>
  {:else}
    <!-- Lista de restaurantes -->
    <div class="restaurants-grid">
      {#each restaurants as restaurant (restaurant.id)}
        <div class="restaurant-card" class:incomplete={!isComplete(restaurant)}>
          <!-- Header de la tarjeta -->
          <div class="card-header">
            <div class="restaurant-info">
              {#if restaurant.logo}
                <img src={restaurant.logo} alt="Logo" class="restaurant-logo" />
              {:else}
                <div class="restaurant-logo-placeholder">
                  {restaurant.name.charAt(0).toUpperCase()}
                </div>
              {/if}
              
              <div class="restaurant-details">
                <h3 class="restaurant-name">{restaurant.name}</h3>
                {#if restaurant.username}
                  <span class="restaurant-username">@{restaurant.username}</span>
                {/if}
                <div class="restaurant-status">
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
            
            <div class="card-actions">
              <button
                class="btn-icon"
                onclick={() => startEdit(restaurant)}
                title="Editar"
              >
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
                </svg>
              </button>
              
              <button
                class="btn-icon danger"
                onclick={() => confirmDelete(restaurant.id)}
                title="Eliminar"
              >
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                </svg>
              </button>
            </div>
          </div>
          
          <!-- Descripción -->
          {#if restaurant.description}
            <p class="restaurant-description">{restaurant.description}</p>
          {/if}
          
          <!-- Información adicional -->
          <div class="restaurant-meta">
            {#if restaurant.address}
              <div class="meta-item">
                <svg class="meta-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/>
                </svg>
                <span>{restaurant.address}</span>
              </div>
            {/if}
            
            {#if restaurant.phone}
              <div class="meta-item">
                <svg class="meta-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/>
                </svg>
                <span>{restaurant.phone}</span>
              </div>
            {/if}
          </div>
          
          <!-- Subir imágenes -->
          <div class="image-upload-section">
            <h4>Imágenes</h4>
            <div class="upload-controls">
              <select bind:value={selectedImageType} class="image-type-select">
                <option value="logo">Logo</option>
                <option value="image">Imagen principal</option>
                <option value="imageProfile">Imagen perfil</option>
                <option value="imageCover">Imagen portada</option>
                <option value="imageText">Imagen texto</option>
                <option value="qrCode">Código QR</option>
              </select>
              
              <label class="upload-btn" class:uploading={uploadingImageFor === `${restaurant.id}-${selectedImageType}`}>
                {#if uploadingImageFor === `${restaurant.id}-${selectedImageType}`}
                  <span class="spinner-small"></span>
                  Subiendo...
                {:else}
                  <svg class="icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"/>
                  </svg>
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
          <div class="card-footer">
            <a
              href={getRestaurantUrl(restaurant)}
              target="_blank"
              class="btn btn-outline"
            >
              <svg class="icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/>
              </svg>
              Ver Público
            </a>
            
            <button class="btn btn-primary">
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
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
            </svg>
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
  /* Estilos base */
  .restaurant-dashboard {
    max-width: 1200px;
    margin: 0 auto;
    padding: 2rem;
  }

  .dashboard-header {
    margin-bottom: 2rem;
  }

  .header-content {
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex-wrap: wrap;
    gap: 1rem;
  }

  .header-content h1 {
    color: #1f2937;
    margin: 0;
    font-size: 2rem;
    font-weight: 700;
  }

  .header-actions {
    display: flex;
    gap: 1rem;
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
  }

  .spinner-large {
    width: 3rem;
    height: 3rem;
    border: 3px solid #e5e7eb;
    border-top: 3px solid #3b82f6;
    border-radius: 50%;
    animation: spin 1s linear infinite;
    margin-bottom: 1rem;
  }

  .error-icon,
  .empty-icon {
    width: 4rem;
    height: 4rem;
    color: #6b7280;
    margin-bottom: 1rem;
  }

  /* Grid de restaurantes */
  .restaurants-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
    gap: 2rem;
  }

  /* Tarjetas de restaurante */
  .restaurant-card {
    background: white;
    border: 2px solid #e5e7eb;
    border-radius: 12px;
    padding: 1.5rem;
    transition: all 0.2s;
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .restaurant-card:hover {
    border-color: #d1d5db;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
  }

  .restaurant-card.incomplete {
    border-color: #f59e0b;
    background: #fffbeb;
  }

  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
  }

  .restaurant-info {
    display: flex;
    align-items: center;
    gap: 1rem;
    flex: 1;
  }

  .restaurant-logo {
    width: 3rem;
    height: 3rem;
    border-radius: 8px;
    object-fit: cover;
    border: 2px solid #e5e7eb;
  }

  .restaurant-logo-placeholder {
    width: 3rem;
    height: 3rem;
    border-radius: 8px;
    background: #f3f4f6;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 600;
    color: #6b7280;
    border: 2px solid #e5e7eb;
  }

  .restaurant-details {
    flex: 1;
  }

  .restaurant-name {
    margin: 0 0 0.25rem 0;
    font-size: 1.25rem;
    font-weight: 600;
    color: #1f2937;
  }

  .restaurant-username {
    color: #6b7280;
    font-size: 0.9rem;
    font-weight: 500;
  }

  .restaurant-status {
    display: flex;
    gap: 0.5rem;
    margin-top: 0.5rem;
  }

  .status-badge {
    padding: 0.25rem 0.5rem;
    border-radius: 4px;
    font-size: 0.75rem;
    font-weight: 600;
    text-transform: uppercase;
  }

  .status-badge.complete {
    background: #d1fae5;
    color: #065f46;
  }

  .status-badge.incomplete {
    background: #fef3c7;
    color: #92400e;
  }

  .status-badge.active {
    background: #dbeafe;
    color: #1e40af;
  }

  .status-badge.inactive {
    background: #f3f4f6;
    color: #6b7280;
  }

  .card-actions {
    display: flex;
    gap: 0.5rem;
  }

  .restaurant-description {
    color: #6b7280;
    line-height: 1.5;
    margin: 0;
  }

  .restaurant-meta {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .meta-item {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    color: #6b7280;
    font-size: 0.9rem;
  }

  .meta-icon {
    width: 1rem;
    height: 1rem;
  }

  /* Sección de upload de imágenes */
  .image-upload-section {
    border-top: 1px solid #e5e7eb;
    padding-top: 1rem;
  }

  .image-upload-section h4 {
    margin: 0 0 0.75rem 0;
    font-size: 1rem;
    font-weight: 600;
    color: #374151;
  }

  .upload-controls {
    display: flex;
    gap: 0.75rem;
    align-items: center;
  }

  .image-type-select {
    padding: 0.5rem;
    border: 1px solid #d1d5db;
    border-radius: 6px;
    font-size: 0.875rem;
    background: white;
  }

  .upload-btn {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.5rem 0.75rem;
    background: #f3f4f6;
    border: 1px solid #d1d5db;
    border-radius: 6px;
    font-size: 0.875rem;
    color: #374151;
    cursor: pointer;
    transition: all 0.2s;
  }

  .upload-btn:hover:not(.uploading) {
    background: #e5e7eb;
  }

  .upload-btn.uploading {
    opacity: 0.7;
    cursor: not-allowed;
  }

  .card-footer {
    display: flex;
    gap: 1rem;
    justify-content: space-between;
    border-top: 1px solid #e5e7eb;
    padding-top: 1rem;
  }

  /* Botones */
  .btn {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.75rem 1rem;
    border: none;
    border-radius: 8px;
    font-size: 0.875rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
    text-decoration: none;
    justify-content: center;
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
    background: #f9fafb;
    color: #374151;
    border: 1px solid #d1d5db;
  }

  .btn-secondary:hover:not(:disabled) {
    background: #f3f4f6;
  }

  .btn-outline {
    background: transparent;
    color: #6b7280;
    border: 1px solid #d1d5db;
  }

  .btn-outline:hover:not(:disabled) {
    background: #f9fafb;
    color: #374151;
  }

  .btn-danger {
    background: #ef4444;
    color: white;
  }

  .btn-danger:hover:not(:disabled) {
    background: #dc2626;
  }

  .btn-large {
    padding: 1rem 1.5rem;
    font-size: 1rem;
  }

  .btn-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 2.5rem;
    height: 2.5rem;
    padding: 0;
    background: #f9fafb;
    border: 1px solid #d1d5db;
    border-radius: 6px;
    color: #6b7280;
    cursor: pointer;
    transition: all 0.2s;
  }

  .btn-icon:hover {
    background: #f3f4f6;
    color: #374151;
  }

  .btn-icon.danger:hover {
    background: #fef2f2;
    color: #dc2626;
    border-color: #fecaca;
  }

  .btn-icon svg {
    width: 1.25rem;
    height: 1.25rem;
  }

  .btn-close {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 2rem;
    height: 2rem;
    padding: 0;
    background: none;
    border: none;
    color: #6b7280;
    cursor: pointer;
    border-radius: 4px;
  }

  .btn-close:hover {
    background: #f3f4f6;
    color: #374151;
  }

  .btn-close svg {
    width: 1.25rem;
    height: 1.25rem;
  }

  /* Iconos */
  .icon {
    width: 1rem;
    height: 1rem;
  }

  /* Spinners */
  .spinner-small {
    width: 1rem;
    height: 1rem;
    border: 2px solid transparent;
    border-top: 2px solid currentColor;
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }

  /* Modales */
  .modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
    padding: 1rem;
  }

  .modal {
    background: white;
    border-radius: 12px;
    width: 100%;
    max-width: 600px;
    max-height: 90vh;
    overflow-y: auto;
  }

  .modal-small {
    max-width: 400px;
  }

  .modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1.5rem 1.5rem 0 1.5rem;
  }

  .modal-header h3 {
    margin: 0;
    font-size: 1.25rem;
    font-weight: 600;
    color: #1f2937;
  }

  .modal-body {
    padding: 1.5rem;
  }

  .modal-footer {
    display: flex;
    gap: 1rem;
    justify-content: flex-end;
    padding: 0 1.5rem 1.5rem 1.5rem;
    border-top: 1px solid #e5e7eb;
    margin-top: 1rem;
    padding-top: 1rem;
  }

  /* Formularios */
  .form-row {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1rem;
  }

  .form-group {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .form-group label {
    font-weight: 600;
    color: #374151;
    font-size: 0.875rem;
  }

  .form-input,
  .form-textarea {
    padding: 0.75rem;
    border: 1px solid #d1d5db;
    border-radius: 6px;
    font-size: 0.875rem;
    transition: border-color 0.2s;
  }

  .form-input:focus,
  .form-textarea:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }

  .form-textarea {
    resize: vertical;
    font-family: inherit;
  }

  /* Mensajes */
  .error-message {
    background: #fef2f2;
    border: 1px solid #fecaca;
    border-radius: 6px;
    padding: 0.75rem;
    color: #dc2626;
    font-size: 0.875rem;
    margin-top: 0.5rem;
  }

  .warning-text {
    color: #d97706;
    font-weight: 500;
    font-size: 0.875rem;
  }

  .error-toast {
    position: fixed;
    bottom: 1rem;
    right: 1rem;
    background: #fef2f2;
    border: 1px solid #fecaca;
    border-radius: 8px;
    padding: 1rem;
    color: #dc2626;
    display: flex;
    align-items: center;
    gap: 1rem;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    z-index: 1001;
  }

  .error-toast button {
    background: none;
    border: none;
    color: #dc2626;
    font-size: 1.25rem;
    cursor: pointer;
    padding: 0;
    width: 1.5rem;
    height: 1.5rem;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  /* Responsive */
  @media (max-width: 768px) {
    .restaurant-dashboard {
      padding: 1rem;
    }

    .restaurants-grid {
      grid-template-columns: 1fr;
    }

    .header-content {
      flex-direction: column;
      align-items: stretch;
    }

    .header-actions {
      justify-content: center;
    }

    .restaurant-info {
      flex-direction: column;
      align-items: flex-start;
      gap: 0.75rem;
    }

    .form-row {
      grid-template-columns: 1fr;
    }

    .upload-controls {
      flex-direction: column;
      align-items: stretch;
    }

    .card-footer {
      flex-direction: column;
    }

    .modal-footer {
      flex-direction: column;
    }
  }
</style>