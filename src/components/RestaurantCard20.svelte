<!-- src/components/RestaurantCard.svelte -->
<script>
  import { createEventDispatcher } from 'svelte';
  import { restaurantService } from '../services/restaurantService.ts';
  
  export let restaurant;
  export let showActions = false;
  export let showOwnerActions = false;
  export let compact = false;
  export let currentUserId = null;
  
  const dispatch = createEventDispatcher();
  
  // Estados locales
  let imageError = false;
  let logoError = false;
  
  // Propiedades derivadas
  $: canEdit = currentUserId && restaurantService.utils.canEditRestaurant(restaurant, currentUserId);
  $: isComplete = restaurantService.utils.isRestaurantComplete(restaurant);
  $: publicUrl = restaurantService.utils.getRestaurantPublicUrl(restaurant);
  
  // Funciones de eventos
  function handleEdit() {
    dispatch('edit', { restaurant });
  }
  
  function handleDelete() {
    dispatch('delete', { restaurant });
  }
  
  function handleView() {
    dispatch('view', { restaurant });
  }
  
  function handleImageError() {
    imageError = true;
  }
  
  function handleLogoError() {
    logoError = true;
  }
  
  function getInitials(name) {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .slice(0, 2)
      .join('')
      .toUpperCase();
  }
  
  function formatAddress(address) {
    return address.length > 40 ? address.substring(0, 40) + '...' : address;
  }
  
  function formatDescription(description) {
    const maxLength = compact ? 80 : 120;
    return description.length > maxLength 
      ? description.substring(0, maxLength) + '...' 
      : description;
  }
</script>

<div class="restaurant-card" class:compact class:incomplete={!isComplete}>
  <!-- Imagen de portada -->
  {#if !compact && (restaurant.imageCover || restaurant.image)}
    <div class="card-cover">
      <img
        src={restaurant.imageCover || restaurant.image}
        alt="Portada de {restaurant.name}"
        class="cover-image"
        on:error={handleImageError}
      />
      {#if imageError}
        <div class="cover-placeholder">
          <svg class="placeholder-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/>
          </svg>
        </div>
      {/if}
      
      <!-- Badges de estado en la portada -->
      <div class="cover-badges">
        {#if !restaurant.active}
          <span class="badge inactive">Inactivo</span>
        {/if}
        {#if !isComplete}
          <span class="badge incomplete">Incompleto</span>
        {/if}
        {#if restaurant.planType === 'premium'}
          <span class="badge premium">Premium</span>
        {/if}
      </div>
      
      <!-- Acciones del propietario en la portada -->
      {#if showOwnerActions && canEdit}
        <div class="cover-actions">
          <button class="action-btn" on:click={handleEdit} title="Editar">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
            </svg>
          </button>
          <button class="action-btn danger" on:click={handleDelete} title="Eliminar">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
            </svg>
          </button>
        </div>
      {/if}
    </div>
  {/if}

  <!-- Contenido principal -->
  <div class="card-content">
    <!-- Header con logo y nombre -->
    <div class="card-header">
      <div class="restaurant-info">
        <!-- Logo -->
        <div class="logo-container">
          {#if restaurant.logo && !logoError}
            <img
              src={restaurant.logo}
              alt="Logo de {restaurant.name}"
              class="restaurant-logo"
              on:error={handleLogoError}
            />
          {:else}
            <div class="logo-placeholder">
              {getInitials(restaurant.name)}
            </div>
          {/if}
        </div>
        
        <!-- Información básica -->
        <div class="basic-info">
          <h3 class="restaurant-name">{restaurant.name}</h3>
          
          {#if restaurant.username}
            <p class="restaurant-username">@{restaurant.username}</p>
          {/if}
          
          <!-- Badges compactos para modo compacto -->
          {#if compact}
            <div class="compact-badges">
              {#if !restaurant.active}
                <span class="badge-mini inactive">●</span>
              {/if}
              {#if !isComplete}
                <span class="badge-mini incomplete">!</span>
              {/if}
              {#if restaurant.planType === 'premium'}
                <span class="badge-mini premium">★</span>
              {/if}
            </div>
          {/if}
        </div>
      </div>
      
      <!-- Acciones del header para modo compacto -->
      {#if compact && showOwnerActions && canEdit}
        <div class="header-actions">
          <button class="action-btn-small" on:click={handleEdit} title="Editar">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
            </svg>
          </button>
        </div>
      {/if}
    </div>

    <!-- Descripción -->
    {#if restaurant.description}
      <p class="restaurant-description">
        {formatDescription(restaurant.description)}
      </p>
    {/if}

    <!-- Información adicional -->
    {#if !compact}
      <div class="restaurant-details">
        {#if restaurant.address}
          <div class="detail-item">
            <svg class="detail-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/>
            </svg>
            <span>{formatAddress(restaurant.address)}</span>
          </div>
        {/if}
        
        {#if restaurant.phone}
          <div class="detail-item">
            <svg class="detail-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/>
            </svg>
            <span>{restaurant.phone}</span>
          </div>
        {/if}
        
        {#if restaurant.cuisineType && restaurant.cuisineType.length > 0}
          <div class="detail-item">
            <svg class="detail-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 4V2a1 1 0 011-1h4a1 1 0 011 1v2m3 0V1.5A1.5 1.5 0 0014.5 0h-5A1.5 1.5 0 008 1.5V4m8 0h3a2 2 0 012 2v11a2 2 0 01-2 2H5a2 2 0 01-2-2V6a2 2 0 012-2h3"/>
            </svg>
            <span>{restaurant.cuisineType.slice(0, 2).join(', ')}</span>
          </div>
        {/if}
        
        {#if restaurant.priceRange}
          <div class="detail-item">
            <svg class="detail-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"/>
            </svg>
            <span class="price-range price-{restaurant.priceRange}">
              {#if restaurant.priceRange === 'low'}$ Económico
              {:else if restaurant.priceRange === 'medium'}$$ Moderado
              {:else if restaurant.priceRange === 'high'}$$$ Alto
              {:else if restaurant.priceRange === 'premium'}$$$$ Premium
              {/if}
            </span>
          </div>
        {/if}
      </div>
    {/if}

    <!-- Analytics (si están disponibles) -->
    {#if restaurant.analytics && !compact}
      <div class="analytics-section">
        <div class="analytics-grid">
          {#if restaurant.analytics.averageRating > 0}
            <div class="analytics-item">
              <span class="analytics-value">{restaurant.analytics.averageRating.toFixed(1)}</span>
              <span class="analytics-label">
                <svg class="star-icon" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
                </svg>
                Rating
              </span>
            </div>
          {/if}
          
          {#if restaurant.analytics.reviewsCount > 0}
            <div class="analytics-item">
              <span class="analytics-value">{restaurant.analytics.reviewsCount}</span>
              <span class="analytics-label">Reviews</span>
            </div>
          {/if}
          
          {#if restaurant.analytics.favoritesCount > 0}
            <div class="analytics-item">
              <span class="analytics-value">{restaurant.analytics.favoritesCount}</span>
              <span class="analytics-label">Favoritos</span>
            </div>
          {/if}
        </div>
      </div>
    {/if}

    <!-- Acciones -->
    {#if showActions}
      <div class="card-actions">
        <button class="action-btn-text" on:click={handleView}>
          <svg class="action-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
          </svg>
          Ver
        </button>
        <a class="btn btn-ghost"  href={`/dashboard/restaurant/${restaurant.id }`}>ir</a>
        
        <a href={publicUrl} target="_blank" class="action-btn-text">
          <svg class="action-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/>
          </svg>
          Visitar
        </a>
        
        {#if showOwnerActions && canEdit}
          <button class="action-btn-text" on:click={handleEdit}>
            <svg class="action-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
            </svg>
            Editar
          </button>
        {/if}
      </div>
    {/if}
  </div>
</div>

<style>
  .restaurant-card {
    background: white;
    border: 2px solid #e5e7eb;
    border-radius: 12px;
    overflow: hidden;
    transition: all 0.2s ease;
    display: flex;
    flex-direction: column;
  }

  .restaurant-card:hover {
    border-color: #d1d5db;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    transform: translateY(-2px);
  }

  .restaurant-card.compact {
    border-radius: 8px;
  }

  .restaurant-card.incomplete {
    border-color: #f59e0b;
    background: linear-gradient(135deg, #fffbeb 0%, white 100%);
  }

  /* Portada */
  .card-cover {
    position: relative;
    height: 160px;
    overflow: hidden;
  }

  .cover-image {
    width: 100%;
    height: 100%;
    object-fit: cover;
    transition: transform 0.3s ease;
  }

  .restaurant-card:hover .cover-image {
    transform: scale(1.05);
  }

  .cover-placeholder {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    height: 100%;
    background: linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%);
    color: #9ca3af;
  }

  .placeholder-icon {
    width: 3rem;
    height: 3rem;
  }

  .cover-badges {
    position: absolute;
    top: 0.75rem;
    left: 0.75rem;
    display: flex;
    gap: 0.5rem;
    flex-wrap: wrap;
  }

  .cover-actions {
    position: absolute;
    top: 0.75rem;
    right: 0.75rem;
    display: flex;
    gap: 0.5rem;
  }

  /* Contenido */
  .card-content {
    padding: 1.25rem;
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .restaurant-card.compact .card-content {
    padding: 1rem;
    gap: 0.75rem;
  }

  /* Header */
  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
  }

  .restaurant-info {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    flex: 1;
  }

  .logo-container {
    flex-shrink: 0;
  }

  .restaurant-logo {
    width: 3rem;
    height: 3rem;
    border-radius: 8px;
    object-fit: cover;
    border: 2px solid #f3f4f6;
  }

  .restaurant-card.compact .restaurant-logo {
    width: 2.5rem;
    height: 2.5rem;
    border-radius: 6px;
  }

  .logo-placeholder {
    width: 3rem;
    height: 3rem;
    border-radius: 8px;
    background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
    color: white;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 700;
    font-size: 0.875rem;
    border: 2px solid #f3f4f6;
  }

  .restaurant-card.compact .logo-placeholder {
    width: 2.5rem;
    height: 2.5rem;
    font-size: 0.75rem;
  }

  .basic-info {
    flex: 1;
    min-width: 0;
  }

  .restaurant-name {
    margin: 0 0 0.25rem 0;
    font-size: 1.125rem;
    font-weight: 600;
    color: #1f2937;
    line-height: 1.3;
    word-break: break-word;
  }

  .restaurant-card.compact .restaurant-name {
    font-size: 1rem;
    margin-bottom: 0.125rem;
  }

  .restaurant-username {
    margin: 0;
    font-size: 0.875rem;
    color: #6b7280;
    font-weight: 500;
  }

  .restaurant-card.compact .restaurant-username {
    font-size: 0.8rem;
  }

  .compact-badges {
    display: flex;
    gap: 0.25rem;
    margin-top: 0.25rem;
  }

  .header-actions {
    display: flex;
    gap: 0.5rem;
    flex-shrink: 0;
  }

  /* Descripción */
  .restaurant-description {
    margin: 0;
    color: #6b7280;
    line-height: 1.5;
    font-size: 0.9rem;
  }

  .restaurant-card.compact .restaurant-description {
    font-size: 0.85rem;
    line-height: 1.4;
  }

  /* Detalles */
  .restaurant-details {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .detail-item {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    color: #6b7280;
    font-size: 0.875rem;
  }

  .detail-icon {
    width: 1rem;
    height: 1rem;
    flex-shrink: 0;
  }

  .price-range {
    font-weight: 600;
  }

  .price-low { color: #059669; }
  .price-medium { color: #d97706; }
  .price-high { color: #dc2626; }
  .price-premium { color: #7c3aed; }

  /* Analytics */
  .analytics-section {
    border-top: 1px solid #f3f4f6;
    padding-top: 0.75rem;
  }

  .analytics-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(60px, 1fr));
    gap: 0.75rem;
  }

  .analytics-item {
    text-align: center;
  }

  .analytics-value {
    display: block;
    font-size: 1.125rem;
    font-weight: 700;
    color: #1f2937;
    line-height: 1;
  }

  .analytics-label {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.25rem;
    font-size: 0.75rem;
    color: #6b7280;
    margin-top: 0.25rem;
  }

  .star-icon {
    width: 0.875rem;
    height: 0.875rem;
    color: #f59e0b;
  }

  /* Badges */
  .badge {
    padding: 0.25rem 0.5rem;
    border-radius: 6px;
    font-size: 0.75rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.025em;
  }

  .badge.inactive {
    background: rgba(239, 68, 68, 0.1);
    color: #dc2626;
    backdrop-filter: blur(8px);
  }

  .badge.incomplete {
    background: rgba(245, 158, 11, 0.1);
    color: #d97706;
    backdrop-filter: blur(8px);
  }

  .badge.premium {
    background: rgba(124, 58, 237, 0.1);
    color: #7c3aed;
    backdrop-filter: blur(8px);
  }

  .badge-mini {
    font-size: 0.75rem;
    font-weight: 700;
  }

  .badge-mini.inactive { color: #dc2626; }
  .badge-mini.incomplete { color: #d97706; }
  .badge-mini.premium { color: #f59e0b; }

  /* Acciones */
  .card-actions {
    display: flex;
    gap: 0.75rem;
    justify-content: flex-end;
    border-top: 1px solid #f3f4f6;
    padding-top: 0.75rem;
    margin-top: auto;
  }

  .action-btn,
  .action-btn-small {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0.5rem;
    background: rgba(255, 255, 255, 0.9);
    border: 1px solid rgba(255, 255, 255, 0.8);
    border-radius: 6px;
    color: #374151;
    cursor: pointer;
    transition: all 0.2s ease;
    backdrop-filter: blur(8px);
  }

  .action-btn {
    width: 2.5rem;
    height: 2.5rem;
  }

  .action-btn-small {
    width: 2rem;
    height: 2rem;
  }

  .action-btn svg,
  .action-btn-small svg {
    width: 1.125rem;
    height: 1.125rem;
  }

  .action-btn-small svg {
    width: 1rem;
    height: 1rem;
  }

  .action-btn:hover,
  .action-btn-small:hover {
    background: white;
    border-color: #d1d5db;
    transform: translateY(-1px);
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  }

  .action-btn.danger:hover {
    background: #fef2f2;
    border-color: #fecaca;
    color: #dc2626;
  }

  .action-btn-text {
    display: flex;
    align-items: center;
    gap: 0.375rem;
    padding: 0.5rem 0.75rem;
    background: none;
    border: 1px solid #e5e7eb;
    border-radius: 6px;
    color: #6b7280;
    font-size: 0.875rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s ease;
    text-decoration: none;
  }

  .action-btn-text:hover {
    background: #f9fafb;
    border-color: #d1d5db;
    color: #374151;
  }

  .action-icon {
    width: 1rem;
    height: 1rem;
  }

  /* Responsive */
  @media (max-width: 640px) {
    .card-content {
      padding: 1rem;
    }

    .restaurant-card.compact .card-content {
      padding: 0.75rem;
    }

    .restaurant-info {
      gap: 0.5rem;
    }

    .restaurant-logo {
      width: 2.5rem;
      height: 2.5rem;
    }

    .logo-placeholder {
      width: 2.5rem;
      height: 2.5rem;
      font-size: 0.75rem;
    }

    .restaurant-name {
      font-size: 1rem;
    }

    .card-actions {
      flex-wrap: wrap;
      justify-content: center;
    }

    .analytics-grid {
      grid-template-columns: repeat(3, 1fr);
    }
  }
</style>