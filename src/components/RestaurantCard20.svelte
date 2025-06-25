<!-- src/components/RestaurantCard.svelte - Optimizado para Grid Responsive -->
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
  
  function getCompletenessColor(completeness) {
    if (completeness >= 80) return 'text-green-600';
    if (completeness >= 50) return 'text-yellow-600';
    return 'text-red-600';
  }
</script>

<div class="restaurant-card card flex flex-col {compact ? 'compact' : ''}">
  <!-- Imagen de portada -->
  {#if !compact && (restaurant.imageCover || restaurant.image)}
    <div class="card-cover modern-cover">
      <img
        src={restaurant.imageCover || restaurant.image}
        alt="Portada de {restaurant.name}"
        class="cover-image modern-cover-image"
        on:error={handleImageError}
      />
      {#if imageError}
        <div class="cover-placeholder modern-cover-placeholder">
          <svg class="placeholder-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="10" stroke-width="2"/>
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 15l2-2 2 2 4-4"/>
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
  <div class="card-content flex flex-col gap-lg p-xl">
    <!-- Header con logo y nombre -->
    <div class="card-header flex items-center justify-between">
      <div class="restaurant-info flex items-center gap-md flex-1">
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
        <div class="basic-info flex flex-col min-w-0">
          <div class="flex items-center gap-xs">
            <h3 class="restaurant-name m-0">{restaurant.name}</h3>
            <!-- Indicador de completitud tipo semáforo -->
            {#if !isComplete}
              <span class="completeness-indicator" title="Completitud: {restaurant.completeness || 0}%">
                <span class="circle-indicator {getCompletenessColor(restaurant.completeness || 0)}"></span>
                <span class="completeness-text">{restaurant.completeness || 0}%</span>
              </span>
            {/if}
          </div>
          {#if restaurant.username}
            <p class="restaurant-username">@{restaurant.username}</p>
          {/if}
          <!-- Badges compactos para modo compacto -->
          {#if compact}
            <div class="compact-badges flex gap-xs mt-xs">
              {#if !restaurant.active}
                <span class="badge-mini inactive">●</span>
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
            <i class="fa-solid fa-pen" style="font-size:1rem;"></i>
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
      <div class="restaurant-details flex flex-col gap-xs mt-xs">
        {#if restaurant.address}
          <div class="detail-item flex items-center gap-xs text-muted text-sm">
            <i class="fa-solid fa-location-dot detail-fa"></i>
            <span>{formatAddress(restaurant.address)}</span>
          </div>
        {/if}
        
        {#if restaurant.phone}
          <div class="detail-item flex items-center gap-xs text-muted text-sm">
            <i class="fa-solid fa-phone detail-fa"></i>
            <span>{restaurant.phone}</span>
          </div>
        {/if}
        
        {#if restaurant.cuisineType && restaurant.cuisineType.length > 0}
          <div class="detail-item flex items-center gap-xs text-muted text-sm">
            <i class="fa-solid fa-bowl-food detail-fa"></i>
            <span>{restaurant.cuisineType.slice(0, 2).join(', ')}</span>
          </div>
        {/if}
        
        {#if restaurant.priceRange}
          <div class="detail-item flex items-center gap-xs text-muted text-sm">
            <i class="fa-solid fa-money-bill-wave detail-fa"></i>
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
      <div class="card-actions flex gap-md justify-end border-t border-accent pt-md mt-auto">
        <a href={`/${restaurant.username}`} target="_blank" class="btn btn-outline flex items-center gap-xs text-sm">
          <i class="fa-solid fa-arrow-up-right-from-square" style="font-size:1rem;"></i>
          Visitar
        </a>
        <a href={`/dashboard/restaurant/${restaurant.id}`} class="btn btn-secondary flex items-center gap-xs text-sm" on:click={handleEdit}>
          <i class="fa-solid fa-pen" style="font-size:1rem;"></i>
          Editar
        </a>
      </div>
    {/if}
  </div>
</div>

<style>
  /* CARD BASE - Tamaño optimizado para grid responsive */
  .restaurant-card {
    transition: box-shadow 0.2s, transform 0.2s;
    box-shadow: 0 2px 8px 0 rgba(30, 41, 59, 0.06);
    border-radius: 1.25rem;
    overflow: hidden;
    background: #fff;
    
    /* TAMAÑO FIJO OPTIMIZADO - Evita estiramiento */
    width: 100%;
    max-width: 360px;
    min-width: 300px;
    min-height: 400px;
    
    /* Centrado automático en el grid */
    margin: 0 auto;
    
    /* Optimización para el grid */
    display: flex;
    flex-direction: column;
    align-self: start;
  }

  .restaurant-card:hover {
    box-shadow: 0 6px 24px 0 rgba(30, 41, 59, 0.13);
    transform: translateY(-2px) scale(1.012);
  }

  /* MODO COMPACTO - Para vista lista */
  .restaurant-card.compact {
    max-width: 100%;
    min-width: 300px;
    min-height: 200px;
    flex-direction: row;
  }

  /* IMAGEN DE PORTADA - Proporción fija */
  .modern-cover {
    position: relative;
    border-radius: 1.25rem 1.25rem 0 0;
    overflow: hidden;
    height: 160px; /* Altura fija para consistencia */
    background: var(--bg-accent, #f3f4f6);
    box-shadow: 0 2px 12px 0 rgba(30, 41, 59, 0.10);
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }

  .modern-cover-image {
    width: 100%;
    height: 100%;
    object-fit: cover;
    border-radius: 1.25rem 1.25rem 0 0;
    background: #f3f4f6;
    transition: filter 0.2s;
  }

  .modern-cover-placeholder {
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    background: linear-gradient(135deg, #f3f4f6 60%, #e0e7ef 100%);
    border-radius: 1.25rem 1.25rem 0 0;
  }

  .modern-cover-placeholder .placeholder-icon {
    width: 3rem;
    height: 3rem;
    color: #cbd5e1;
    opacity: 0.7;
    display: block;
    margin: auto;
  }

  /* CONTENIDO - Distribución optimizada */
  .card-content {
    padding: 1.25rem;
    gap: 1rem;
    flex: 1;
    display: flex;
    flex-direction: column;
    min-height: 0; /* Permite que el contenido se contraiga */
  }

  /* LOGO Y INFORMACIÓN BÁSICA */
  .logo-container {
    flex-shrink: 0;
    width: 48px;
    height: 48px;
  }

  .restaurant-logo {
    width: 48px;
    height: 48px;
    border-radius: 8px;
    object-fit: cover;
    border: 2px solid #fff;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  }

  .logo-placeholder {
    width: 48px;
    height: 48px;
    border-radius: 8px;
    background: var(--primary-color, #ff6b35);
    color: white;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 600;
    font-size: 16px;
    border: 2px solid #fff;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  }

  /* NOMBRE Y TÍTULO */
  .restaurant-name {
    font-size: 1.125rem;
    font-weight: 600;
    color: var(--text-primary);
    line-height: 1.3;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    max-width: 200px;
  }

  .restaurant-username {
    font-size: 0.875rem;
    color: var(--text-muted);
    margin: 0;
    margin-top: 2px;
  }

  /* DESCRIPCIÓN */
  .restaurant-description {
    color: var(--text-secondary);
    font-size: 0.9rem;
    line-height: 1.5;
    margin: 0;
    flex-shrink: 1;
    overflow: hidden;
    display: -webkit-box;
    -webkit-line-clamp: 3;
    -webkit-box-orient: vertical;
  }

  /* DETALLES DEL RESTAURANTE */
  .restaurant-details {
    gap: 0.5rem;
    flex-shrink: 0;
  }

  .detail-item {
    padding: 0.25rem 0;
    border-radius: 4px;
    transition: background 0.2s;
    align-items: center;
  }

  .detail-item:hover {
    background: var(--bg-accent, #f3f4f6);
  }

  .detail-fa {
    font-size: 1em;
    min-width: 1.1em;
    text-align: center;
    opacity: 0.85;
    flex-shrink: 0;
  }

  /* ANALYTICS */
  .analytics-section {
    flex-shrink: 0;
    margin-top: auto;
  }

  .analytics-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(80px, 1fr));
    gap: 0.75rem;
  }

  .analytics-item {
    text-align: center;
  }

  .analytics-value {
    display: block;
    font-weight: 600;
    font-size: 1.1rem;
    color: var(--primary-color);
  }

  .analytics-label {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.25rem;
    font-size: 0.75rem;
    color: var(--text-muted);
    margin-top: 0.25rem;
  }

  .star-icon {
    width: 12px;
    height: 12px;
    color: #fbbf24;
  }

  /* BADGES Y ESTADOS */
  .badge, .badge-mini {
    border-radius: 6px;
    font-size: 0.75rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.025em;
    padding: 0.25rem 0.5rem;
  }

  .badge.inactive, .badge-mini.inactive {
    background: rgba(239, 68, 68, 0.1);
    color: #ef4444;
  }

  .badge.premium, .badge-mini.premium {
    background: rgba(124, 58, 237, 0.1);
    color: #7c3aed;
  }

  .badge.incomplete {
    background: rgba(245, 158, 11, 0.1);
    color: #f59e0b;
  }

  /* ACCIONES */
  .cover-badges {
    position: absolute;
    top: 1rem;
    left: 1rem;
    display: flex;
    gap: 0.5rem;
    flex-wrap: wrap;
  }

  .cover-actions {
    position: absolute;
    top: 1rem;
    right: 1rem;
    display: flex;
    gap: 0.5rem;
  }

  .action-btn {
    width: 36px;
    height: 36px;
    border-radius: 8px;
    background: rgba(255, 255, 255, 0.9);
    border: none;
    color: var(--text-secondary);
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s;
    backdrop-filter: blur(4px);
  }

  .action-btn:hover {
    background: white;
    color: var(--primary-color);
    transform: scale(1.05);
  }

  .action-btn.danger:hover {
    color: #ef4444;
  }

  .action-btn svg {
    width: 16px;
    height: 16px;
  }

  .card-actions {
    margin-top: auto;
    padding-top: 1rem;
    border-top: 1px solid var(--bg-accent);
    flex-shrink: 0;
  }

  /* INDICADOR DE COMPLETITUD */
  .completeness-indicator {
    display: flex;
    align-items: center;
    gap: 0.25rem;
    font-size: 0.75rem;
    padding: 0.125rem 0.375rem;
    border-radius: 12px;
    background: var(--bg-tertiary);
  }

  .circle-indicator {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: currentColor;
  }

  .completeness-text {
    font-weight: 500;
  }

  /* RESPONSIVE ADJUSTMENTS */
  @media (max-width: 639px) {
    .restaurant-card {
      max-width: 100%;
      min-width: 280px;
    }
    
    .card-content {
      padding: 1rem;
    }
    
    .restaurant-name {
      font-size: 1rem;
      max-width: 180px;
    }
  }

  @media (min-width: 640px) and (max-width: 767px) {
    .restaurant-card {
      max-width: 340px;
    }
  }

  @media (min-width: 768px) and (max-width: 1023px) {
    .restaurant-card {
      max-width: 350px;
    }
  }

  @media (min-width: 1024px) {
    .restaurant-card {
      max-width: 360px;
    }
  }

  /* MODO COMPACTO ESPECÍFICO */
  .restaurant-card.compact .card-content {
    padding: 1rem;
    gap: 0.75rem;
  }

  .restaurant-card.compact .restaurant-description {
    -webkit-line-clamp: 2;
  }

  .restaurant-card.compact .modern-cover {
    height: 120px;
  }

  /* LOADING STATES */
  .spinner-large {
    width: 3rem;
    height: 3rem;
    border: 3px solid var(--bg-accent);
    border-top: 3px solid var(--primary-color);
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }

  @keyframes spin {
    to { transform: rotate(360deg); }
  }

  /* ACCESSIBILITY */
  @media (prefers-reduced-motion: reduce) {
    .restaurant-card:hover {
      transform: none;
    }
    
    .action-btn:hover {
      transform: none;
    }
  }

  /* DARK MODE SUPPORT */
  @media (prefers-color-scheme: dark) {
    .restaurant-card {
      background: var(--bg-primary, #1e293b);
      border: 1px solid var(--bg-accent, #475569);
    }
    
    .action-btn {
      background: rgba(30, 41, 59, 0.9);
      color: var(--text-light, #94a3b8);
    }
    
    .action-btn:hover {
      background: var(--bg-tertiary, #334155);
    }
  }
</style>