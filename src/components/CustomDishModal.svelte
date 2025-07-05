<script lang="ts">
  import { createEventDispatcher, onMount } from 'svelte';
  import { fly, fade, scale } from 'svelte/transition';
  import { quintOut, elasticOut } from 'svelte/easing';
  
  import Modal from '../components/Modal.svelte';
  import { isMobileDevice } from '../components/utils/modalUtils';
  
  // Stores
  import { 
    dishRatingStore, 
    rateDishAnonymously, 
    commentDishAnonymously,
    canUserRateThisDish,
    getUserRatingForDish,
    canUserCommentThisDish,
    getUserCommentForDish
  } from '../stores/dishStore';
  
  import { favoritesStore } from '../stores/favoritesStore';
  
  // Services
  import { 
    fetchDishRatings, 
    fetchDishRatingStats 
  } from '../services/apiDishService';

  //Estilos
  import './CustomDishModal.css'
  
  // Types
  import type { DishWithRatings, DishCommentsResponse, DishRatingStats } from '../interfaces/dishRating';

  const dispatch = createEventDispatcher();

  // Props que vienen del modalStore
  const { 
    dish,
    primaryColor = '#FF6B35',
    secondaryColor = '#4ECDC4', 
    textColor = '#2C3E50',
    backgroundColor = '#FFFFFF',
    modalType = 'modal'
  } = $props<{ 
    dish: DishWithRatings;
    primaryColor?: string;
    secondaryColor?: string;
    textColor?: string;
    backgroundColor?: string;
    modalType?: 'modal' | 'bottom-sheet' | 'auto';
  }>();

  // Estados del componente
  let loading = $state(false);
  let commentsData = $state<DishCommentsResponse | null>(null);
  let statsData = $state<DishRatingStats | null>(null);
  let error = $state<string | null>(null);
  
  // Estados de interacción
  let selectedRating = $state(0);
  let hoverRating = $state(0);
  let commentText = $state('');
  let isSubmitting = $state(false);
  let showCommentForm = $state(false);
  let imageLoaded = $state(false);
  let imageError = $state(false);

  // Referencias del DOM
  let commentInput: HTMLTextAreaElement;
  let modalElement: HTMLElement;

  // Datos reactivos del store
  const dishStore = $derived($dishRatingStore);
  const favStore = $derived($favoritesStore);

  // Verificar si el usuario puede interactuar
  const canRate = $derived(canUserRateThisDish(dish.id!));
  const canComment = $derived(canUserCommentThisDish(dish.id!));
  const userRating = $derived(getUserRatingForDish(dish.id!));
  const userComment = $derived(getUserCommentForDish(dish.id!));
  const isUserFavorite = $derived(favStore.allDishes.find(d => d.id === dish.id)?.userFav || false);

  // Loading states del store
  const isRatingInProgress = $derived(dishStore.ratingsInProgress[dish.id!] || false);
  const isCommentInProgress = $derived(dishStore.commentsInProgress[dish.id!] || false);

  // Determinar si usar bottom sheet
  const useBottomSheet = $derived(modalType === 'bottom-sheet' || (modalType === 'auto' && isMobileDevice()));

  // Funciones de utilidad para colores
  function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : null;
  }

  function rgbToHsl(r: number, g: number, b: number): { h: number; s: number; l: number } {
    r /= 255;
    g /= 255;
    b /= 255;
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h = 0, s = 0, l = (max + min) / 2;

    if (max === min) {
      h = s = 0;
    } else {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      switch (max) {
        case r: h = (g - b) / d + (g < b ? 6 : 0); break;
        case g: h = (b - r) / d + 2; break;
        case b: h = (r - g) / d + 4; break;
      }
      h /= 6;
    }

    return { h: h * 360, s: s * 100, l: l * 100 };
  }

  function adjustColor(color: string, lighten: number = 0, darken: number = 0, saturate: number = 0): string {
    const rgb = hexToRgb(color);
    if (!rgb) return color;
    
    const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);
    let newL = hsl.l + lighten - darken;
    let newS = hsl.s + saturate;
    
    newL = Math.max(0, Math.min(100, newL));
    newS = Math.max(0, Math.min(100, newS));
    
    return `hsl(${hsl.h}, ${newS}%, ${newL}%)`;
  }

  function colorWithOpacity(color: string, opacity: number): string {
    const rgb = hexToRgb(color);
    if (!rgb) return color;
    return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${opacity})`;
  }

  // Generar paleta de colores dinámicamente
  $effect(() => {
    if (modalElement) {
      // Colores principales
      modalElement.style.setProperty('--custom-primary', primaryColor);
      modalElement.style.setProperty('--custom-secondary', secondaryColor);
      modalElement.style.setProperty('--custom-text', textColor);
      modalElement.style.setProperty('--custom-background', backgroundColor);
      
      // Variaciones del color primario
      modalElement.style.setProperty('--custom-primary-light', adjustColor(primaryColor, 20));
      modalElement.style.setProperty('--custom-primary-dark', adjustColor(primaryColor, 0, 20));
      modalElement.style.setProperty('--custom-primary-alpha-10', colorWithOpacity(primaryColor, 0.1));
      modalElement.style.setProperty('--custom-primary-alpha-20', colorWithOpacity(primaryColor, 0.2));
      modalElement.style.setProperty('--custom-primary-alpha-30', colorWithOpacity(primaryColor, 0.3));
      modalElement.style.setProperty('--custom-primary-alpha-80', colorWithOpacity(primaryColor, 0.8));
      
      // Variaciones del color secundario
      modalElement.style.setProperty('--custom-secondary-light', adjustColor(secondaryColor, 30));
      modalElement.style.setProperty('--custom-secondary-dark', adjustColor(secondaryColor, 0, 20));
      modalElement.style.setProperty('--custom-secondary-alpha-10', colorWithOpacity(secondaryColor, 0.1));
      modalElement.style.setProperty('--custom-secondary-alpha-20', colorWithOpacity(secondaryColor, 0.2));
      
      // Variaciones del texto
      modalElement.style.setProperty('--custom-text-light', adjustColor(textColor, 40));
      modalElement.style.setProperty('--custom-text-muted', adjustColor(textColor, 20));
      modalElement.style.setProperty('--custom-text-alpha-60', colorWithOpacity(textColor, 0.6));
      modalElement.style.setProperty('--custom-text-alpha-80', colorWithOpacity(textColor, 0.8));
      
      // Variaciones del background
      modalElement.style.setProperty('--custom-bg-secondary', adjustColor(backgroundColor, 0, 5));
      modalElement.style.setProperty('--custom-bg-tertiary', adjustColor(backgroundColor, 0, 10));
      modalElement.style.setProperty('--custom-bg-accent', adjustColor(backgroundColor, 0, 15));
      
      // Colores especiales
      modalElement.style.setProperty('--custom-warning', '#F39C12');
      modalElement.style.setProperty('--custom-success', adjustColor(secondaryColor, 0, 0, 10));
      modalElement.style.setProperty('--custom-error', '#E74C3C');
      
      // Glass effects
      modalElement.style.setProperty('--custom-glass', colorWithOpacity(backgroundColor, 0.8));
      modalElement.style.setProperty('--custom-glass-border', colorWithOpacity(textColor, 0.1));
      
      // Sombras
      const shadowColor = colorWithOpacity(textColor, 0.15);
      modalElement.style.setProperty('--custom-shadow', `0 4px 6px -1px ${shadowColor}, 0 2px 4px -1px ${colorWithOpacity(textColor, 0.06)}`);
      modalElement.style.setProperty('--custom-shadow-lg', `0 10px 15px -3px ${shadowColor}, 0 4px 6px -2px ${colorWithOpacity(textColor, 0.05)}`);
      
      // Gradientes
      modalElement.style.setProperty('--custom-gradient-primary', 
        `linear-gradient(135deg, ${primaryColor} 0%, ${adjustColor(primaryColor, 10)} 100%)`);
      modalElement.style.setProperty('--custom-gradient-bg', 
        `linear-gradient(135deg, ${backgroundColor} 0%, ${adjustColor(backgroundColor, 0, 3)} 100%)`);
    }
  });

  // Cargar datos al montar
  onMount(() => {
    console.log('🔍 CustomDishModal cargado para:', dish.name);
    loadDishData();
  });

  async function loadDishData() {
    loading = true;
    error = null;
    
    try {
      console.log('🔄 Cargando datos del platillo:', dish.id);
      
      const [commentsResult, statsResult] = await Promise.allSettled([
        fetchDishRatings(dish.id!, 1, 10, true),
        fetchDishRatingStats(dish.id!)
      ]);
      
      if (commentsResult.status === 'fulfilled') {
        commentsData = commentsResult.value;
        console.log('✅ Comentarios cargados:', commentsData.comments?.length || 0);
      } else {
        console.warn('⚠️ No se pudieron cargar comentarios:', commentsResult.reason);
        commentsData = {
          comments: [],
          pagination: {
            total: 0,
            page: 1,
            limit: 10,
            total_pages: 0,
            has_next: false,
            has_prev: false
          },
          stats: {
            total_registered: 0,
            total_anonymous: 0
          }
        };
      }
      
      if (statsResult.status === 'fulfilled') {
        statsData = statsResult.value;
        console.log('✅ Estadísticas cargadas:', statsData);
      } else {
        console.warn('⚠️ No se pudieron cargar estadísticas:', statsResult.reason);
        statsData = {
          averageRating: dish.rating || 0,
          totalRatings: dish.reviewsCount || 0,
          totalComments: 0,
          registeredRatings: 0,
          anonymousRatings: 0,
          ratingDistribution: {}
        };
      }
      
    } catch (err) {
      console.error('❌ Error cargando datos del platillo:', err);
      error = err instanceof Error ? err.message : 'Error cargando datos del platillo';
      
      // Datos de fallback seguros
      commentsData = {
        comments: [],
        pagination: {
          total: 0,
          page: 1,
          limit: 10,
          total_pages: 0,
          has_next: false,
          has_prev: false
        },
        stats: {
          total_registered: 0,
          total_anonymous: 0
        }
      };
      
      statsData = {
        averageRating: dish.rating || 0,
        totalRatings: dish.reviewsCount || 0,
        totalComments: 0,
        registeredRatings: 0,
        anonymousRatings: 0,
        ratingDistribution: {}
      };
    } finally {
      loading = false;
    }
  }

  async function handleRating(rating: number) {
    if (!canRate || isRatingInProgress || rating === userRating) return;
    
    selectedRating = rating;
    
    try {
      const success = await rateDishAnonymously(dish.id!, rating);
      if (success) {
        loadDishData();
        showToast('¡Valoración enviada con éxito!', 'success');
      } else {
        showToast(dishStore.lastError || 'Error al enviar valoración', 'error');
      }
    } catch (error) {
      showToast('Error al enviar valoración', 'error');
    }
  }

  async function handleComment() {
    if (!commentText.trim() || isCommentInProgress) return;
    
    isSubmitting = true;
    
    try {
      const success = await commentDishAnonymously(
        dish.id!, 
        commentText.trim(),
        selectedRating > 0 ? selectedRating : undefined
      );
      
      if (success) {
        commentText = '';
        selectedRating = 0;
        showCommentForm = false;
        
        loadDishData();
        showToast('¡Comentario enviado con éxito!', 'success');
      } else {
        showToast(dishStore.lastError || 'Error al enviar comentario', 'error');
      }
    } catch (error) {
      showToast('Error al enviar comentario', 'error');
    } finally {
      isSubmitting = false;
    }
  }

  async function toggleFavorite() {
    try {
      await favoritesStore.toggleFavorite(dish.id!);
      showToast(
        isUserFavorite ? 'Eliminado de favoritos' : 'Agregado a favoritos', 
        'success'
      );
    } catch (error) {
      showToast('Error al actualizar favoritos', 'error');
    }
  }

  function showToast(message: string, type: 'success' | 'error') {
    window.dispatchEvent(new CustomEvent('showToast', {
      detail: { message, type }
    }));
  }

  function handleImageLoad() {
    imageLoaded = true;
    imageError = false;
  }

  function handleImageError() {
    imageError = true;
    imageLoaded = false;
  }

  function formatPrice(price: number): string {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN'
    }).format(price);
  }

  function formatDate(dateString: string): string {
    const date = new Date(dateString);
    return new Intl.RelativeTimeFormat('es', { numeric: 'auto' }).format(
      Math.floor((date.getTime() - Date.now()) / (1000 * 60 * 60 * 24)),
      'day'
    );
  }

  function createSafeStars(rating: number): string[] {
    const safeRating = Math.max(0, Math.min(5, Math.floor(rating || 0)));
    const stars = [];
    for (let i = 0; i < safeRating; i++) {
      stars.push('⭐');
    }
    return stars;
  }
</script>

<div bind:this={modalElement} class="custom-dish-modal">
  <Modal
    size="large"
    headerless={true}
    backgroundColor={backgroundColor}
    bottomSheet={useBottomSheet}
    on:close
  >
    <!-- Header personalizado con botón de cerrar -->
    <div class="custom-dish-modal-header">
      <button 
        class="custom-close-btn"
        on:click={() => dispatch('close')}
        aria-label="Cerrar modal"
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </button>
    </div>

    <!-- Imagen del Platillo -->
    <div class="custom-dish-image-container">
      {#if dish.image && !imageError}
        <div class="custom-image-wrapper">
          {#if !imageLoaded}
            <div class="custom-image-loading">
              <div class="custom-loading-placeholder">
                <div class="custom-loading-shimmer"></div>
              </div>
            </div>
          {/if}
          <img 
            src={dish.image} 
            alt={dish.name}
            class="custom-dish-image"
            class:loaded={imageLoaded}
            loading="lazy"
            on:load={handleImageLoad}
            on:error={handleImageError}
          />
        </div>
      {:else}
        <div class="custom-dish-placeholder">
          <div class="custom-placeholder-gradient"></div>
          <div class="custom-placeholder-content">
            <div class="custom-placeholder-icon">
              <svg width="64" height="64" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 2L13.09 8.26L22 9L17 14L18.18 22L12 18.5L5.82 22L7 14L2 9L10.91 8.26L12 2Z" fill="currentColor"/>
              </svg>
            </div>
            <div class="custom-placeholder-text">
              <div class="custom-placeholder-title">{dish.name}</div>
              <div class="custom-placeholder-subtitle">Una deliciosa sorpresa te espera</div>
            </div>
          </div>
        </div>
      {/if}
      
      <!-- Botón de favorito superpuesto -->
      <button 
        class="custom-favorite-btn"
        class:active={isUserFavorite}
        on:click={toggleFavorite}
        aria-label={isUserFavorite ? 'Quitar de favoritos' : 'Agregar a favoritos'}
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill={isUserFavorite ? 'currentColor' : 'none'} xmlns="http://www.w3.org/2000/svg">
          <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </button>

      <!-- Badge de rating superpuesto -->
      {#if statsData && statsData.averageRating > 0}
        <div class="custom-rating-badge" in:scale={{ duration: 300, delay: 200 }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"/>
          </svg>
          <span>{statsData.averageRating.toFixed(1)}</span>
        </div>
      {/if}
    </div>

    <!-- Información Principal -->
    <div class="custom-dish-info">
      <div class="custom-dish-header">
        <h1 class="custom-dish-name">{dish.name}</h1>
        <div class="custom-dish-price">{formatPrice(dish.price)}</div>
      </div>

      {#if dish.description}
        <p class="custom-dish-description">{dish.description}</p>
      {/if}

      <!-- Estadísticas -->
      <div class="custom-dish-stats">
        {#if statsData}
          <div class="custom-stat-item">
            <div class="custom-stat-value">⭐ {statsData.averageRating.toFixed(1)}</div>
            <div class="custom-stat-label">{statsData.totalRatings} valoraciones</div>
          </div>
          <div class="custom-stat-divider"></div>
          <div class="custom-stat-item">
            <div class="custom-stat-value">💬 {statsData.totalComments}</div>
            <div class="custom-stat-label">comentarios</div>
          </div>
          <div class="custom-stat-divider"></div>
          <div class="custom-stat-item">
            <div class="custom-stat-value">❤️ {dish.favorites || 0}</div>
            <div class="custom-stat-label">favoritos</div>
          </div>
        {:else}
          <div class="custom-loading-stats">
            <div class="custom-skeleton custom-stat-skeleton"></div>
            <div class="custom-skeleton custom-stat-skeleton"></div>
            <div class="custom-skeleton custom-stat-skeleton"></div>
          </div>
        {/if}
      </div>

      <!-- Sistema de Rating -->
      {#if canRate}
        <div class="custom-rating-section">
          <h3 class="custom-section-title">¿Qué te pareció este platillo?</h3>
          <div class="custom-rating-stars">
            {#each Array(5) as _, i}
              <button
                class="custom-star-btn"
                class:active={i < (hoverRating || selectedRating)}
                class:user-rated={i < userRating}
                disabled={isRatingInProgress}
                on:mouseenter={() => hoverRating = i + 1}
                on:mouseleave={() => hoverRating = 0}
                on:click={() => handleRating(i + 1)}
              >
                <svg width="32" height="32" viewBox="0 0 24 24" fill={i < (hoverRating || selectedRating || userRating) ? 'currentColor' : 'none'} xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
              </button>
            {/each}
          </div>
          {#if userRating > 0}
            <p class="custom-rating-feedback">Has valorado este platillo con {userRating} estrella{userRating !== 1 ? 's' : ''}</p>
          {:else if isRatingInProgress}
            <p class="custom-rating-feedback">Enviando valoración...</p>
          {/if}
        </div>
      {:else if userRating > 0}
        <div class="custom-rating-section">
          <h3 class="custom-section-title">Tu valoración</h3>
          <div class="custom-user-rating-display">
            {#each Array(5) as _, i}
              <span class="custom-star-display" class:active={i < userRating}>⭐</span>
            {/each}
            <span class="custom-rating-text">{userRating} de 5 estrellas</span>
          </div>
        </div>
      {/if}

      <!-- Formulario de Comentarios -->
      {#if canComment}
        <div class="custom-comment-section">
          {#if !showCommentForm}
            <button 
              class="custom-add-comment-btn"
              on:click={() => showCommentForm = true}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M8.5 19H16.5C17.8807 19 19 17.8807 19 16.5V7.5C19 6.11929 17.8807 5 16.5 5H7.5C6.11929 5 5 6.11929 5 7.5V18.25C5 18.6642 5.33579 19 5.75 19C5.88807 19 6.01951 18.9481 6.12132 18.8536L8.5 19Z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
              Agregar comentario
            </button>
          {:else}
            <div class="custom-comment-form" in:fly={{ y: 10, duration: 200 }}>
              <h3 class="custom-section-title">Agregar comentario</h3>
              <textarea
                bind:this={commentInput}
                bind:value={commentText}
                placeholder="Comparte tu experiencia con este platillo..."
                class="custom-comment-input"
                rows="3"
                maxlength="500"
              ></textarea>
              <div class="custom-comment-actions">
                <button 
                  class="custom-cancel-btn"
                  on:click={() => { showCommentForm = false; commentText = ''; }}
                >
                  Cancelar
                </button>
                <button 
                  class="custom-submit-btn"
                  on:click={handleComment}
                  disabled={!commentText.trim() || isSubmitting}
                >
                  {#if isSubmitting}
                    <span class="custom-loading-spinner"></span>
                  {/if}
                  Enviar comentario
                </button>
              </div>
            </div>
          {/if}
        </div>
      {:else if userComment}
        <div class="custom-user-comment-display">
          <h3 class="custom-section-title">Tu comentario</h3>
          <div class="custom-comment-bubble">
            <p>{userComment}</p>
          </div>
        </div>
      {/if}

      <!-- Lista de Comentarios -->
      <div class="custom-comments-section">
        <h3 class="custom-section-title">
          Comentarios
          {#if statsData?.totalComments}
            <span class="custom-comments-count">({statsData.totalComments})</span>
          {/if}
        </h3>

        {#if loading}
          <div class="custom-comments-loading">
            {#each Array(3) as _, i}
              <div class="custom-comment-skeleton">
                <div class="custom-skeleton custom-avatar-skeleton"></div>
                <div class="custom-skeleton-content">
                  <div class="custom-skeleton custom-name-skeleton"></div>
                  <div class="custom-skeleton custom-text-skeleton"></div>
                  <div class="custom-skeleton custom-text-skeleton custom-short"></div>
                </div>
              </div>
            {/each}
          </div>
        {:else if error}
          <div class="custom-error-state">
            <div class="custom-error-icon">⚠️</div>
            <p>Error cargando comentarios: {error}</p>
            <button class="custom-retry-btn" on:click={() => loadDishData()}>
              Reintentar
            </button>
          </div>
        {:else if commentsData?.comments && commentsData.comments.length > 0}
          <div class="custom-comments-list">
            {#each commentsData.comments as comment, index (comment.id || `comment-${index}`)}
              <div class="custom-comment-item" in:fly={{ y: 10, duration: 200, delay: Math.min(index * 50, 300) }}>
                <div class="custom-comment-avatar">
                  <i class="fa-solid fa-user icon"></i>
                </div>
                <div class="custom-comment-content">
                  <div class="custom-comment-header">
                    <span class="custom-comment-author">
                      {#if comment.anonymous}
                        Usuario anónimo
                      {:else}
                        {comment.user?.name || 'Usuario'}
                      {/if}
                    </span>
                    {#if comment.rating && comment.rating > 0}
                      <div class="custom-comment-rating">
                        {#each createSafeStars(comment.rating) as star}
                          {star}
                        {/each}
                      </div>
                    {/if}
                    <span class="custom-comment-date">{formatDate(comment.timestamp)}</span>
                  </div>
                  <p class="custom-comment-text">{comment.comment}</p>
                </div>
              </div>
            {/each}
          </div>
        {:else if !loading && commentsData}
          <div class="custom-no-comments">
            <div class="custom-no-comments-icon">💬</div>
            <p>Aún no hay comentarios para este platillo</p>
            <p class="custom-no-comments-subtitle">¡Sé el primero en compartir tu opinión!</p>
          </div>
        {:else if !loading}
          <div class="custom-no-comments">
            <div class="custom-no-comments-icon">💬</div>
            <p>No se pudieron cargar los comentarios</p>
            <p class="custom-no-comments-subtitle">Inténtalo de nuevo más tarde</p>
          </div>
        {/if}
      </div>
    </div>
  </Modal>
</div>