<script lang="ts">
  import { createEventDispatcher, onMount } from 'svelte';
  import { fly, scale, fade } from 'svelte/transition';
  import { quintOut } from 'svelte/easing';
  import { openModal } from '../stores/modalStore.js';
  import RatingSystem from './RatingSystem.svelte';
  import type { RestaurantSearchResult } from '../interfaces/restaurantRating.js';
  import { canUserRate } from '../stores/ratingStore.js';
  
  // ✅ NUEVAS IMPORTACIONES para favoritos
  import { 
    toggleRestaurantFavorite,
    toggleAnonymousRestaurantFavorite,
    checkRestaurantFavoriteStatus,
    checkAnonymousRestaurantFavoriteStatus,
    getDeviceId,
    hasRestaurantFavoriteLocally
  } from '../services/apiRatingService.js';
  import { authStore } from '../stores/authStore.js'; // Ajusta la ruta según tu estructura
  
  import './RestaurantCardCompact.css';

  // Props
  const { restaurant, storeInitialized } = $props<{ 
    restaurant: RestaurantSearchResult; 
    storeInitialized: boolean 
  }>();

  // Dispatcher para toasts
  const dispatch = createEventDispatcher<{
    toast: { message: string; type: 'success' | 'error' | 'info' }
  }>();

  // Estado local
  let imageLoaded = $state(false);
  let imageError = $state(false);
  let isHovered = $state(false);
  
  // ✅ ESTADO MEJORADO para favoritos
  let isLiked = $state(false);
  let likesCount = $state(restaurant.analytics.favoritesCount || 0);
  let isProcessingLike = $state(false);
  let favoriteInitialized = $state(false);

  // ✅ NUEVAS VARIABLES reactivas para auth
  let isAuthenticated = $state(false);
  let userToken = $state('');
  let deviceId = $state('');

  // ✅ INICIALIZACIÓN en onMount
  onMount(() => {
    // Obtener deviceId
    deviceId = getDeviceId();

    // Suscribirse al store de autenticación
    const unsubscribe = authStore.subscribe((auth) => {
      isAuthenticated = auth.isAuthenticated;
      userToken = auth.token || '';
    });

    // Verificar estado inicial del favorito (async, pero no como return)
    checkInitialFavoriteStatus().catch((error) => {
      console.error('❌ Error initializing restaurant card:', error);
    });

    // Cleanup subscription
    return () => {
      unsubscribe();
    };
  });

  // ✅ FUNCIÓN para verificar estado inicial del favorito
  async function checkInitialFavoriteStatus() {
    if (!restaurant.id) return;

    try {
      if (isAuthenticated && userToken) {
        // Usuario autenticado: verificar en servidor
        const status = await checkRestaurantFavoriteStatus(restaurant.id, userToken);
        isLiked = status.isFavorite;
      } else {
        // Usuario anónimo: verificar localmente primero, luego en servidor
        const localStatus = hasRestaurantFavoriteLocally(restaurant.id, deviceId);
        if (localStatus) {
          isLiked = true;
        } else {
          // Verificar en servidor para anónimos
          try {
            const status = await checkAnonymousRestaurantFavoriteStatus(restaurant.id, deviceId);
            isLiked = status.isFavorite;
          } catch (error) {
            // Si falla, mantener estado local
            isLiked = localStatus;
          }
        }
      }
      
      favoriteInitialized = true;
      console.log(`✅ Favorite status initialized for ${restaurant.name}: ${isLiked}`);
      
    } catch (error) {
      console.warn('⚠️ Error checking initial favorite status:', error);
      favoriteInitialized = true; // Marcar como inicializado aunque falle
    }
  }

  // ✅ FUNCIÓN MEJORADA para toggle de favoritos
  async function toggleLike(event: Event) {
    event.stopPropagation();
    event.preventDefault();

    if (isProcessingLike || !restaurant.id) return;

    isProcessingLike = true;
    const previousState = isLiked;
    const previousCount = likesCount;

    try {
      // Optimistic update
      isLiked = !isLiked;
      likesCount = isLiked ? likesCount + 1 : Math.max(0, likesCount - 1);

      let result;

      if (isAuthenticated && userToken) {
        // Usuario autenticado
        result = await toggleRestaurantFavorite(restaurant.id, userToken);
      } else {
        // Usuario anónimo
        result = await toggleAnonymousRestaurantFavorite(
          restaurant.id, 
          deviceId, 
          'toggle'
        );
      }

      // Actualizar estado basado en la respuesta
      isLiked = result.action === 'added';
      likesCount = result.favoritesCount || likesCount;

      // Toast de éxito
      dispatch('toast', { 
        message: result.message || (isLiked ? 'Agregado a favoritos' : 'Removido de favoritos'), 
        type: 'success' 
      });

      console.log(`✅ ${result.action} favorite for ${restaurant.name}`);

    } catch (error) {
      // Revertir optimistic update
      isLiked = previousState;
      likesCount = previousCount;

      console.error('❌ Error toggling favorite:', error);

      // Toast de error más específico
      let errorMessage = 'Error al actualizar favoritos';
      if (error instanceof Error) {
        if (error.message.includes('autenticación')) {
          errorMessage = 'Inicia sesión para guardar favoritos';
        } else if (error.message.includes('límite')) {
          errorMessage = 'Has alcanzado el límite de favoritos';
        } else {
          errorMessage = error.message;
        }
      }

      dispatch('toast', { 
        message: errorMessage, 
        type: 'error' 
      });
    } finally {
      isProcessingLike = false;
    }
  }

  // ✅ FUNCIÓN para mostrar contador de favoritos
  function formatFavoritesCount(count: number): string {
    if (count === 0) return '';
    if (count < 1000) return count.toString();
    if (count < 1000000) return (count / 1000).toFixed(1) + 'K';
    return (count / 1000000).toFixed(1) + 'M';
  }

  // Funciones existentes (sin cambios)
  function renderStars(rating: number) {
    return Array.from({ length: 5 }, (_, i) => ({
      filled: i < Math.floor(rating),
      number: i + 1
    }));
  }

  function handleImageLoad() {
    imageLoaded = true;
  }

  function handleImageError() {
    imageError = true;
  }

  function handleMouseEnter() {
    isHovered = true;
  }

  function handleMouseLeave() {
    isHovered = false;
  }

  function getPriceRangeText(priceRange: string): string {
    console.log('priceRange', priceRange)
    switch (priceRange) {
      case 'economico': return '$';
      case 'moderado': return '$$';
      case 'premium': return '$$$';
      case 'lujo': return '$$$';
      default: return '';
    }
  }

  function getPriceRangeColor(priceRange: string): string {
    switch (priceRange) {
          case 'economico': return '#10b981'; // Green
          case 'moderado': return '#f59e0b';  // Orange
          case 'premium': return '#ef4444';   // Red
          case 'lujo': return '#D4AF37';     // Metallic Gold (or your chosen luxury color)
          default: return '#6b7280';
    }
  }

  function handleToast(event: CustomEvent<{ message: string; type: 'success' | 'error' | 'info' }>) {
    dispatch('toast', event.detail);
  }

  function showComments(event: Event) {
    event.stopPropagation();
    event.preventDefault();
    const isMobile = window.innerWidth < 768;
    openModal('comments', {
      restaurantId: restaurant.id,
      restaurantName: restaurant.name,
      commentsCount: restaurant.commentsCount,
      isMobile: isMobile
    });
  }

  function navigateToRestaurant(event: Event) {
    // Prevenir propagación si se hace click en elementos interactivos
    const target = event.target as HTMLElement;
    if (target.closest('button') || target.closest('a') || target.closest('.rating-system')) {
      return;
    }
    window.location.href = `/${restaurant.username}`;
  }

  function truncateText(text: string, maxLength: number): string {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  }
  console.log( restaurant  , likesCount)
</script>

<article 
  class="restaurant-card-compact"
  class:hovered={isHovered}
  onmouseenter={handleMouseEnter}
  onmouseleave={handleMouseLeave}
  onclick={navigateToRestaurant}
  in:fly={{ y: 20, duration: 400, easing: quintOut }}
>
  <!-- Imagen dominante con overlays -->
  <div class="image-section">
    {#if restaurant.image || restaurant.imageProfile}
      <img 
        src={restaurant.image || restaurant.imageProfile} 
        alt={restaurant.name}
        class="restaurant-image-dominant"
        class:loaded={imageLoaded}
        onload={handleImageLoad}
        onerror={handleImageError}
        loading="lazy"
      />
      {#if !imageLoaded && !imageError}
        <div class="image-skeleton-compact"></div>
      {/if}
    {:else}
      <div class="restaurant-placeholder-compact">
        <div class="placeholder-icon-large">🍽️</div>
      </div>
    {/if}

    <!-- Overlay superior con acciones -->
    <div class="top-overlay">
      <!-- ✅ BOTÓN DE LIKE MEJORADO -->
      <button 
        class="like-button"
        class:liked={isLiked}
        class:processing={isProcessingLike}
        class:loading={!favoriteInitialized}
        onclick={toggleLike}
        disabled={isProcessingLike || !favoriteInitialized}
        title={isLiked ? 'Quitar de favoritos' : 'Agregar a favoritos'}
        in:scale={{ duration: 300, delay: 100 }}
      >
        {#if isProcessingLike}
          <!-- Spinner de carga -->
          <div class="like-spinner">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2" opacity="0.3"/>
              <path d="M12 2 A10 10 0 0 1 22 12" stroke="currentColor" stroke-width="2" stroke-linecap="round">
                <animateTransform attributeName="transform" type="rotate" dur="1s" repeatCount="indefinite" values="0 12 12;360 12 12"/>
              </path>
            </svg>
          </div>
        {:else}
          <!-- Corazón normal o relleno -->
          <svg width="18" height="18" viewBox="0 0 24 24" fill={isLiked ? "currentColor" : "none"} xmlns="http://www.w3.org/2000/svg">
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" 
                  stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        {/if}

        <!-- ✅ CONTADOR DE FAVORITOS (opcional) -->
        {#if likesCount > 0 && favoriteInitialized}
          <span class="likes-count" in:scale={{ duration: 200 }}>
            {formatFavoritesCount(likesCount)}
          </span>
        {/if}
      </button>

      <!-- Rating compacto -->
      {#if restaurant.analytics?.averageRating}
        <div class="rating-overlay" in:scale={{ duration: 300, delay: 200 }}>
          <span class="rating-star-overlay">⭐</span>
          <span class="rating-value-overlay">{restaurant.analytics.averageRating.toFixed(1)}</span>
        </div>
      {/if}
    </div>

    <!-- Overlay inferior con precio -->
    {#if restaurant.priceRange && (restaurant.priceRange != '')}
      <div class="bottom-overlay">
        <div 
          class="price-tag-overlay"
          style="background-color: {getPriceRangeColor(restaurant.priceRange)}; color: white;"
        >
          {getPriceRangeText(restaurant.priceRange)}
        </div>
      </div>
    {/if}

    <!-- Gradiente sutil para mejor legibilidad -->
    <div class="image-gradient"></div>
  </div>

  <!-- Footer compacto con información esencial -->
  <div class="footer-section">
    <div class="restaurant-info">
      <h3 class="restaurant-name-compact">
        {truncateText(restaurant.name, 25)}
      </h3>
      
      <div class="meta-info">
        <div class="address-compact">
          <span class="address-icon">📍</span>
          {#if restaurant.address}
            <span class="address-text">{truncateText(restaurant.address, 30)}</span>
          {:else}
            <div class="address-text">Sin dirección registrada.</div> 
          {/if}
        </div>
       
        <div class="rating-section-compact">
          <RatingSystem 
            restaurantId={restaurant.id!}
            on:toast={handleToast}
          />
        </div>
      </div>
    </div>

    <!-- Acciones del footer -->
    <div class="footer-actions">
      {#if storeInitialized}
        <!-- Botón de comentarios compacto -->
        <button 
          class="comments-button-compact"
          onclick={showComments}
          title="Ver comentarios"
        >
          <span class="comments-icon-compact">
            <i class="fa-solid fa-comment"></i>
          </span>
          {#if restaurant.analytics.commentsCount && (restaurant.analytics.commentsCount != 0) }
            <span class="comments-count-compact">{restaurant.analytics.commentsCount}</span>
          {/if}
        </button>
      {:else}
        <div class="loading-compact">
          <div class="loading-spinner-compact"></div>
        </div>
      {/if}
    </div>
  </div>

  <!-- Efecto de hover -->
  {#if isHovered}
    <div class="hover-effect-compact" in:fade={{ duration: 200 }}></div>
  {/if}
</article>