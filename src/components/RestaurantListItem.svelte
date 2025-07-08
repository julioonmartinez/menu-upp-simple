<!-- src/components/RestaurantListItem.svelte - Vista Compacta para Lista -->
<script>
  import { createEventDispatcher } from 'svelte';
  import { restaurantService } from '../services/restaurantService.ts';
  
  export let restaurant;
  export let currentUserId = null;
  export let showActions = true;
  import './RestaurantListItem.css';
  
  const dispatch = createEventDispatcher();
  
  // Estados locales
  let logoError = false;
  
  // Propiedades derivadas
  // $: canEdit = currentUserId && restaurantService.utils.canEditRestaurant(restaurant, currentUserId);
  $: isComplete = restaurantService.utils.isRestaurantComplete(restaurant);
  $: completenessScore = restaurant.completeness || 0;
  
  // Funciones de navegación
  function handleCardClick() {
    // Click general en la card lleva a editar
    window.location.href = `/dashboard/restaurant/${restaurant.id}`;
  }
  
  function handleEdit(event) {
    event.stopPropagation(); // Evitar que se dispare el click de la card
    window.location.href = `/dashboard/restaurant/${restaurant.id}`;
  }
  
  function handleVisit(event) {
    event.stopPropagation(); // Evitar que se dispare el click de la card
    if (restaurant.username) {
      console.log(restaurant)
      window.location.href = `/${restaurant.username}`;
    }
  }
  
  function handleDelete(event) {
    event.stopPropagation(); // Evitar que se dispare el click de la card
    dispatch('delete', { restaurant });
  }
  
  // Funciones auxiliares (sin cambios)
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
  
  function getStatusColor() {
    if (!restaurant.active) return 'status-inactive';
    if (!isComplete) return 'status-incomplete';
    return 'status-active';
  }
  
  function getCompletenessColor(score) {
    if (score >= 80) return 'completeness-high';
    if (score >= 60) return 'completeness-medium';
    if (score >= 40) return 'completeness-low';
    return 'completeness-critical';
  }
</script>

<div 
  class="restaurant-list-item {getStatusColor()}"
  on:click={handleCardClick}
  on:keydown={(e) => e.key === 'Enter' && handleCardClick()}
  role="button"
  tabindex="0"
>
  <!-- Imagen/Logo -->
  <div class="item-avatar">
    {#if restaurant.logo && !logoError}
      <img
        src={restaurant.logo}
        alt="Logo de {restaurant.name}"
        class="avatar-image"
        on:error={handleLogoError}
      />
    {:else if restaurant.imageCover || restaurant.image}
      <img
        src={restaurant.imageCover || restaurant.image}
        alt="Imagen de {restaurant.name}"
        class="avatar-image"
        on:error={handleLogoError}
      />
    {:else}
      <div class="avatar-placeholder">
        {getInitials(restaurant.name)}
      </div>
    {/if}
  </div>

  <!-- Información Principal -->
  <div class="item-info">
    <div class="info-primary">
      <h4 class="restaurant-name">{restaurant.name}</h4>
      <div class="status-indicators">
        <!-- Estado del restaurante -->
        <span class="status-dot {getStatusColor()}"></span>
        
        <!-- Indicador de completitud -->
        {#if !isComplete}
          <span class="completeness-badge {getCompletenessColor(completenessScore)}">
            {completenessScore}%
          </span>
        {/if}
        
        <!-- Badge Premium -->
        {#if restaurant.planType === 'premium'}
          <span class="premium-badge">
            <i class="fa-solid fa-crown"></i>
          </span>
        {/if}
      </div>
    </div>
    
    <div class="info-secondary">
      {#if restaurant.username}
        <span class="username">@{restaurant.username}</span>
      {/if}
      
      {#if restaurant.cuisineType && restaurant.cuisineType.length > 0}
        <span class="cuisine-type">{restaurant.cuisineType[0]}</span>
      {/if}
      
      {#if restaurant.analytics?.averageRating > 0}
        <span class="rating">
          <i class="fa-solid fa-star"></i>
          {restaurant.analytics.averageRating.toFixed(1)}
        </span>
      {/if}
    </div>
  </div>

  <!-- Acciones -->
  {#if showActions}
    <div class="item-actions">
      <!-- Botón Visitar -->
      {#if restaurant.username}
        <button
          class="action-btn visit-btn"
          on:click={handleVisit}
          title="Visitar restaurante"
        >
          <i class="fa-solid fa-external-link-alt"></i>
          <span class="action-text">Visitar</span>
        </button>
      {/if}
      
      <!-- Botón Editar -->
      <button
        class="action-btn edit-btn"
        on:click={handleEdit}
        title="Editar restaurante"
      >
        <i class="fa-solid fa-pen"></i>
        <span class="action-text">Editar</span>
      </button>
      
      <!-- Botón Eliminar -->
      <button
        class="action-btn delete-btn"
        on:click={handleDelete}
        title="Eliminar restaurante"
      >
        <i class="fa-solid fa-trash"></i>
        <span class="action-text">Eliminar</span>
      </button>
    </div>
  {/if}
</div>

