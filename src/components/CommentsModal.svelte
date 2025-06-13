<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { fly, fade, slide } from 'svelte/transition';
  import { quintOut } from 'svelte/easing';
  
  import { 
    isLoadingComments,
    restaurantComments,
    commentsError,
    isCreatingComment,
    loadRestaurantComments,
    createRestaurantCommentAnonymously
  } from '../stores/ratingStore';
  import './CommentsModal.css'
  
  import type { RestaurantCommentCreate } from '../interfaces/restaurantRating';

  // Props
  const { restaurantId, restaurantName, commentsCount, onClose } = $props<{
    restaurantId: string;
    restaurantName: string;
    commentsCount: number | undefined;
    onClose: () => void;
  }>();

  // Dispatcher para toasts
  const dispatch = createEventDispatcher<{
    toast: { message: string; type: 'success' | 'error' | 'info' }
  }>();

  // Estado local del formulario
  let commentForm = $state({
    comment: '',
    rating: '',
    isExpanded: false,
    isFocused: false
  });

  let selectedRestaurantForComments = $state<string | null>(null);
  let isMobile = $state(false);

  // Detectar móvil
  function checkMobile() {
    if (typeof window !== 'undefined') {
      isMobile = window.innerWidth < 768;
    }
  }

  // Valores derivados
  let loadingComments = $derived($isLoadingComments);
  let comments = $derived($restaurantComments);
  let commentsErrorMsg = $derived($commentsError);
  let isCreatingCommentState = $derived($isCreatingComment(restaurantId));

  // Inicializar
  if (typeof window !== 'undefined') {
    checkMobile();
    window.addEventListener('resize', checkMobile);
  }

  // Cargar comentarios al abrir el modal
  $effect(() => {
    if (selectedRestaurantForComments !== restaurantId) {
      loadCommentsForRestaurant();
    }
  });

  async function loadCommentsForRestaurant() {
    selectedRestaurantForComments = restaurantId;
    const success = await loadRestaurantComments(restaurantId);
    
    if (!success) {
      dispatch('toast', {
        message: 'Error al cargar los comentarios',
        type: 'error'
      });
    }
  }

  async function submitComment() {
    if (!commentForm.comment.trim()) {
      dispatch('toast', {
        message: 'Por favor escribe un comentario',
        type: 'info'
      });
      return;
    }

    if (commentForm.comment.trim().length < 3) {
      dispatch('toast', {
        message: 'El comentario debe tener al menos 3 caracteres',
        type: 'info'
      });
      return;
    }

    const commentData: RestaurantCommentCreate = {
      comment: commentForm.comment.trim()
    };

    if (commentForm.rating && parseFloat(commentForm.rating) > 0) {
      commentData.rating = parseFloat(commentForm.rating);
    }

    const success = await createRestaurantCommentAnonymously(restaurantId, commentData);
    
    if (success) {
      commentForm.comment = '';
      commentForm.rating = '';
      commentForm.isExpanded = false;
      commentForm.isFocused = false;
      
      dispatch('toast', {
        message: '¡Comentario enviado! Gracias por compartir tu experiencia.',
        type: 'success'
      });
      
      // Recargar comentarios
      await loadCommentsForRestaurant();
    } else {
      dispatch('toast', {
        message: 'Error al enviar el comentario. Inténtalo de nuevo.',
        type: 'error'
      });
    }
  }

  function formatTimeAgo(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffInSeconds < 60) return 'hace unos segundos';
    if (diffInSeconds < 3600) return `hace ${Math.floor(diffInSeconds / 60)}m`;
    if (diffInSeconds < 86400) return `hace ${Math.floor(diffInSeconds / 3600)}h`;
    if (diffInSeconds < 604800) return `hace ${Math.floor(diffInSeconds / 86400)}d`;
    
    return date.toLocaleDateString();
  }

  function renderStars(rating: number) {
    return Array.from({ length: 5 }, (_, i) => ({
      filled: i < Math.floor(rating),
      number: i + 1
    }));
  }

  function expandCommentForm() {
    commentForm.isExpanded = true;
    commentForm.isFocused = true;
  }

  function collapseCommentForm() {
    if (!commentForm.comment.trim() && !commentForm.rating) {
      commentForm.isExpanded = false;
      commentForm.isFocused = false;
    }
  }

  function getCommentCountText(count: number): string {
    if (count === 0) return 'Sin comentarios';
    if (count === 1) return '1 comentario';
    return `${count} comentarios`;
  }

  function cancelComment() {
    commentForm.comment = '';
    commentForm.rating = '';
    commentForm.isExpanded = false;
    commentForm.isFocused = false;
  }

  function handleModalClick(event: MouseEvent) {
    // Cerrar si se hace clic en el backdrop
    if (event.target === event.currentTarget) {
      onClose();
    }
  }

  function handleKeydown(event: KeyboardEvent) {
    if (event.key === 'Escape') {
      onClose();
    }
  }
</script>


<div 
  class="modal-backdrop"
  class:mobile={isMobile}
  onclick={handleModalClick}
  onkeydown={handleKeydown}
  tabindex="-1"
  in:fade={{ duration: 300 }}
  out:fade={{ duration: 200 }}
>
  <div 
    class="modal-container"
    class:mobile={isMobile}
    in:fly={{ y: 30, duration: 400, easing: quintOut }}
    out:fly={{ y: -30, duration: 300, easing: quintOut }}
  >
    <!-- Header del modal -->
    <div class="modal-header">
      <div class="header-content">
        <div class="header-info">
          <h2 class="modal-title">Comentarios</h2>
          <p class="restaurant-name">{restaurantName}</p>
        </div>
        <button 
          class="close-btn"
          onclick={onClose}
          title="Cerrar"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </button>
      </div>
    </div>

    <!-- Contenido del modal -->
    <div class="modal-content">
      <!-- Formulario para nuevo comentario -->
      <div class="comment-form-section">
        <div class="comment-form-modal" class:expanded={commentForm.isExpanded} class:focused={commentForm.isFocused}>
          
          {#if !commentForm.isExpanded}
            <!-- Versión compacta del formulario -->
            <button 
              class="comment-form-trigger-modal"
              onclick={expandCommentForm}
            >
              <div class="trigger-avatar-modal">✍️</div>
              <span class="trigger-text-modal">Comparte tu experiencia...</span>
            </button>
          {:else}
            <!-- Formulario expandido -->
            <div class="form-content-modal" in:slide={{ duration: 300 }}>
              <div class="form-header-modal">
                <span class="form-icon-modal">✍️</span>
                <span class="form-title-modal">Tu experiencia</span>
                <button 
                  class="form-close-btn-modal"
                  onclick={cancelComment}
                  disabled={isCreatingCommentState}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                  </svg>
                </button>
              </div>
              
              <textarea
                bind:value={commentForm.comment}
                placeholder="Cuéntanos sobre la comida, el servicio, el ambiente..."
                maxlength="500"
                rows="4"
                disabled={isCreatingCommentState}
                class="comment-textarea-modal"
                onblur={collapseCommentForm}
              ></textarea>
              
              <div class="form-meta-modal" class:visible={commentForm.comment.length > 0}>
                <span class="char-count-modal" class:warning={commentForm.comment.length > 450}>
                  {commentForm.comment.length}/500
                </span>
              </div>

              <div class="form-footer-modal">
                <div class="rating-input-modal">
                  <label class="rating-label-modal">⭐ Valoración:</label>
                  <select 
                    bind:value={commentForm.rating} 
                    disabled={isCreatingCommentState}
                    class="rating-select-modal"
                  >
                    <option value="">Sin valoración</option>
                    <option value="5">⭐⭐⭐⭐⭐</option>
                    <option value="4">⭐⭐⭐⭐</option>
                    <option value="3">⭐⭐⭐</option>
                    <option value="2">⭐⭐</option>
                    <option value="1">⭐</option>
                  </select>
                </div>
                
                <button 
                  class="submit-comment-btn-modal"
                  onclick={submitComment}
                  disabled={isCreatingCommentState || !commentForm.comment.trim()}
                  class:loading={isCreatingCommentState}
                >
                  {#if isCreatingCommentState}
                    <div class="btn-spinner-modal"></div>
                  {:else}
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M2 21L23 12L2 3V10L17 12L2 14V21Z" fill="currentColor"/>
                    </svg>
                    Enviar
                  {/if}
                </button>
              </div>
            </div>
          {/if}
        </div>
      </div>

      <!-- Lista de comentarios -->
      <div class="comments-list-modal">
        {#if loadingComments && selectedRestaurantForComments === restaurantId}
          <div class="loading-comments-modal" in:fade={{ duration: 300 }}>
            <div class="loading-spinner-comments-modal"></div>
            <p>Cargando comentarios...</p>
          </div>
        {:else if commentsErrorMsg && selectedRestaurantForComments === restaurantId}
          <div class="comments-error-modal" in:fade={{ duration: 300 }}>
            <span class="error-icon-modal">⚠️</span>
            <p>Error: {commentsErrorMsg}</p>
            <button class="retry-btn-modal" onclick={loadCommentsForRestaurant}>
              Reintentar
            </button>
          </div>
        {:else if comments && selectedRestaurantForComments === restaurantId}
          {#if comments.comments.length > 0}
            <div class="comments-header-modal">
              <h3 class="comments-title-modal">
                💬 {getCommentCountText(comments.pagination.total)}
              </h3>
            </div>
            
            <div class="comments-grid-modal">
              {#each comments.comments as comment, index (comment.id)}
                <div 
                  class="comment-item-modal"
                  in:fly={{ y: 20, duration: 300, delay: index * 50, easing: quintOut }}
                >
                  <div class="comment-header-modal">
                    <div class="author-section-modal">
                      <div class="author-avatar-modal">
                        {comment.anonymous ? '👤' : '👨‍💼'}
                      </div>
                      <div class="author-info-modal">
                        <span class="comment-author-modal">
                          {comment.anonymous ? 'Anónimo' : 'Usuario'}
                        </span>
                        <span class="comment-time-modal">{formatTimeAgo(comment.timestamp)}</span>
                      </div>
                    </div>
                    
                    {#if comment.rating}
                      <div class="comment-rating-modal">
                        {#each renderStars(Number(comment.rating)) as star}
                          <span class="comment-star-modal" class:filled={star.filled}>
                            {star.filled ? '⭐' : '☆'}
                          </span>
                        {/each}
                      </div>
                    {/if}
                  </div>
                  
                  <div class="comment-content-modal">
                    <p class="comment-text-modal">{comment.comment}</p>
                    {#if comment.isEdited}
                      <span class="comment-edited-modal">editado</span>
                    {/if}
                  </div>
                </div>
              {/each}
            </div>
            
            {#if comments.pagination.total_pages > 1}
              <div class="comments-pagination-modal" in:fade={{ duration: 400, delay: 200 }}>
                <span class="pagination-info-modal">
                  Página {comments.pagination.page} de {comments.pagination.total_pages}
                </span>
              </div>
            {/if}
          {:else}
            <div class="no-comments-modal" in:fade={{ duration: 400 }}>
              <div class="no-comments-icon-modal">💭</div>
              <h4>Aún no hay comentarios</h4>
              <p>¡Sé el primero en compartir tu experiencia!</p>
            </div>
          {/if}
        {/if}
      </div>
    </div>
  </div>
</div>

