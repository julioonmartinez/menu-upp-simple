<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { fly, scale, fade, slide } from 'svelte/transition';
  import { quintOut } from 'svelte/easing';
  
  import { 
    isLoadingComments,
    restaurantComments,
    commentsError,
    isCreatingComment,
    loadRestaurantComments,
    createRestaurantCommentAnonymously
  } from '../stores/ratingStore';
  
  import type { RestaurantCommentCreate } from '../interfaces/restaurantRating';

  // Props
  const { restaurantId, restaurantName, commentsCount } = $props<{
    restaurantId: string;
    restaurantName: string;
    commentsCount: number | undefined;
  }>();

  // Dispatcher para toasts
  const dispatch = createEventDispatcher<{
    toast: { message: string; type: 'success' | 'error' | 'info' }
  }>();

  // Estado local más compacto
  let showComments = $state(false);
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

  function toggleComments() {
    showComments = !showComments;
    checkMobile();
    
    if (showComments && selectedRestaurantForComments !== restaurantId) {
      loadCommentsForRestaurant();
    }
  }

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
    return `${count}`;
  }

  function cancelComment() {
    commentForm.comment = '';
    commentForm.rating = '';
    commentForm.isExpanded = false;
    commentForm.isFocused = false;
  }
</script>

<div class="comments-section">
  <!-- Header de comentarios compacto -->
  <div class="comments-header">
    <button 
      class="comments-toggle-btn"
      class:active={showComments}
      on:click={toggleComments}
      in:fly={{ x: -15, duration: 300 }}
    >
      <span class="toggle-icon">💬</span>
      <span class="toggle-text">
        {showComments ? 'Ocultar' : 'Ver'} comentarios
      </span>
      {#if commentsCount !== undefined && commentsCount > 0}
        <span class="comments-count-badge">{getCommentCountText(commentsCount)}</span>
      {/if}
      <svg 
        width="14" 
        height="14" 
        viewBox="0 0 24 24" 
        fill="none" 
        xmlns="http://www.w3.org/2000/svg"
        class="chevron-icon"
        class:rotated={showComments}
      >
        <path d="M6 9L12 15L18 9" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    </button>
  </div>

  {#if showComments}
    <div 
      class="comments-container"
      class:mobile={isMobile}
      in:slide={{ duration: 350, easing: quintOut }}
      out:slide={{ duration: 250, easing: quintOut }}
    >
      <!-- Formulario compacto para nuevo comentario -->
      <div class="comment-form-container">
        <div class="comment-form" class:expanded={commentForm.isExpanded} class:focused={commentForm.isFocused}>
          
          {#if !commentForm.isExpanded}
            <!-- Versión compacta del formulario -->
            <button 
              class="comment-form-trigger"
              on:click={expandCommentForm}
            >
              <div class="trigger-avatar">✍️</div>
              <span class="trigger-text">Comparte tu experiencia en {restaurantName}</span>
            </button>
          {:else}
            <!-- Formulario expandido -->
            <div class="form-content-expanded" in:slide={{ duration: 300 }}>
              <div class="form-header-compact">
                <span class="form-icon">✍️</span>
                <span class="form-title-compact">Tu experiencia</span>
                <button 
                  class="form-close-btn"
                  on:click={cancelComment}
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
                rows="3"
                disabled={isCreatingCommentState}
                class="comment-textarea-compact"
                on:blur={collapseCommentForm}
              ></textarea>
              
              <div class="form-meta" class:visible={commentForm.comment.length > 0}>
                <span class="char-count" class:warning={commentForm.comment.length > 450}>
                  {commentForm.comment.length}/500
                </span>
              </div>

              <div class="form-footer-compact">
                <div class="rating-input-compact">
                  <label class="rating-label-compact">⭐ Valoración:</label>
                  <select 
                    bind:value={commentForm.rating} 
                    disabled={isCreatingCommentState}
                    class="rating-select-compact"
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
                  class="submit-comment-btn-compact"
                  on:click={submitComment}
                  disabled={isCreatingCommentState || !commentForm.comment.trim()}
                  class:loading={isCreatingCommentState}
                >
                  {#if isCreatingCommentState}
                    <div class="btn-spinner-compact"></div>
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

      <!-- Lista de comentarios compacta -->
      <div class="comments-list">
        {#if loadingComments && selectedRestaurantForComments === restaurantId}
          <div class="loading-comments-compact" in:fade={{ duration: 300 }}>
            <div class="loading-spinner-comments-compact"></div>
            <p>Cargando comentarios...</p>
          </div>
        {:else if commentsErrorMsg && selectedRestaurantForComments === restaurantId}
          <div class="comments-error-compact" in:scale={{ duration: 300 }}>
            <span class="error-icon">⚠️</span>
            <p>Error: {commentsErrorMsg}</p>
            <button class="retry-btn-compact" on:click={loadCommentsForRestaurant}>
              Reintentar
            </button>
          </div>
        {:else if comments && selectedRestaurantForComments === restaurantId}
          {#if comments.comments.length > 0}
            <div class="comments-header-list-compact">
              <h5 class="comments-title-compact">
                💬 {comments.pagination.total} comentarios
              </h5>
            </div>
            
            <div class="comments-grid-compact">
              {#each comments.comments as comment, index (comment.id)}
                <div 
                  class="comment-item-compact"
                  in:fly={{ y: 20, duration: 300, delay: index * 50, easing: quintOut }}
                >
                  <div class="comment-header-compact">
                    <div class="author-section-compact">
                      <div class="author-avatar-compact">
                        {comment.anonymous ? '👤' : '👨‍💼'}
                      </div>
                      <div class="author-info-compact">
                        <span class="comment-author-compact">
                          {comment.anonymous ? 'Anónimo' : 'Usuario'}
                        </span>
                        <span class="comment-time-compact">{formatTimeAgo(comment.timestamp)}</span>
                      </div>
                    </div>
                    
                    {#if comment.rating}
                      <div class="comment-rating-compact">
                        {#each renderStars(Number(comment.rating)) as star}
                          <span class="comment-star-compact" class:filled={star.filled}>
                            {star.filled ? '⭐' : '☆'}
                          </span>
                        {/each}
                      </div>
                    {/if}
                  </div>
                  
                  <div class="comment-content-compact">
                    <p class="comment-text-compact">{comment.comment}</p>
                    {#if comment.isEdited}
                      <span class="comment-edited-compact">editado</span>
                    {/if}
                  </div>
                </div>
              {/each}
            </div>
            
            {#if comments.pagination.total_pages > 1}
              <div class="comments-pagination-compact" in:fade={{ duration: 400, delay: 200 }}>
                <span class="pagination-info-compact">
                  Página {comments.pagination.page} de {comments.pagination.total_pages}
                </span>
              </div>
            {/if}
          {:else}
            <div class="no-comments-compact" in:scale={{ duration: 400 }}>
              <div class="no-comments-icon-compact">💭</div>
              <h6>Aún no hay comentarios</h6>
              <p>¡Sé el primero en compartir tu experiencia!</p>
            </div>
          {/if}
        {/if}
      </div>
    </div>
  {/if}
</div>

<style>
  .comments-section {
    border-top: 1px solid #f1f5f9; /* Reducido de 2px */
    padding-top: 16px; /* Reducido de 20px */
  }

  .comments-header {
    margin-bottom: 12px; /* Reducido de 16px */
  }

  .comments-toggle-btn {
    background: linear-gradient(135deg, #f8fafc, #f1f5f9);
    border: 1px solid #e2e8f0; /* Reducido de 2px */
    color: #475569;
    padding: 10px 16px; /* Reducido de 12px 20px */
    border-radius: 10px; /* Reducido de 12px */
    cursor: pointer;
    font-weight: 600;
    font-size: 0.9rem; /* Reducido de 1rem */
    display: flex;
    align-items: center;
    gap: 8px; /* Reducido de 10px */
    transition: all 0.3s ease;
    width: 100%;
    justify-content: center;
  }

  .comments-toggle-btn:hover,
  .comments-toggle-btn.active {
    background: linear-gradient(135deg, var(--primary-color, #ff6b35), #ff8c69);
    color: white;
    border-color: var(--primary-color, #ff6b35);
    transform: translateY(-1px); /* Reducido de -2px */
    box-shadow: 0 4px 12px rgba(255, 107, 53, 0.2); /* Reducido de 8px 20px */
  }

  .toggle-icon {
    font-size: 1rem; /* Reducido de 1.2rem */
  }

  .toggle-text {
    font-size: 0.9rem; /* Reducido */
  }

  .comments-count-badge {
    background: rgba(255, 255, 255, 0.2);
    padding: 2px 6px; /* Reducido de 4px 8px */
    border-radius: 10px;
    font-size: 0.75rem; /* Reducido de 0.8rem */
    font-weight: 700;
  }

  .chevron-icon {
    transition: transform 0.3s ease;
    margin-left: auto;
  }

  .chevron-icon.rotated {
    transform: rotate(180deg);
  }

  .comments-container {
    background: #f8fafc;
    border-radius: 12px; /* Reducido de 16px */
    padding: 16px; /* Reducido de 24px */
    margin-top: 12px; /* Reducido de 16px */
  }

  .comments-container.mobile {
    padding: 12px;
    border-radius: 10px;
  }

  .comment-form-container {
    margin-bottom: 20px; /* Reducido de 32px */
  }

  .comment-form {
    background: white;
    border: 1px solid #e2e8f0; /* Reducido de 2px */
    border-radius: 12px; /* Reducido de 16px */
    transition: all 0.3s ease;
    overflow: hidden;
  }

  .comment-form.expanded,
  .comment-form.focused {
    border-color: var(--primary-color, #ff6b35);
    box-shadow: 0 4px 15px rgba(255, 107, 53, 0.1); /* Reducido de 8px 24px */
  }

  /* Trigger compacto del formulario */
  .comment-form-trigger {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 12px 16px; /* Reducido de 16px 20px */
    width: 100%;
    border: none;
    background: transparent;
    cursor: pointer;
    transition: all 0.3s ease;
    text-align: left;
  }

  .comment-form-trigger:hover {
    background: #f8fafc;
  }

  .trigger-avatar {
    width: 36px; /* Reducido de 40px */
    height: 36px;
    background: linear-gradient(135deg, #f1f5f9, #e2e8f0);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1rem; /* Reducido de 1.2rem */
    flex-shrink: 0;
  }

  .trigger-text {
    color: #64748b;
    font-size: 0.9rem; /* Reducido */
    line-height: 1.4;
  }

  /* Formulario expandido compacto */
  .form-content-expanded {
    padding: 16px; /* Reducido de 20px */
  }

  .form-header-compact {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 12px; /* Reducido de 16px */
  }

  .form-icon {
    font-size: 1rem; /* Reducido de 1.2rem */
  }

  .form-title-compact {
    font-weight: 700;
    color: #0D1B2A;
    font-size: 1rem; /* Reducido de 1.1rem */
    flex: 1;
  }

  .form-close-btn {
    background: none;
    border: none;
    color: #64748b;
    cursor: pointer;
    padding: 4px;
    border-radius: 4px;
    transition: all 0.2s ease;
  }

  .form-close-btn:hover {
    background: #f1f5f9;
    color: #475569;
  }

  .comment-textarea-compact {
    width: 100%;
    border: 1px solid #e2e8f0; /* Reducido de 2px */
    border-radius: 8px; /* Reducido de 12px */
    padding: 12px; /* Reducido de 16px */
    font-family: inherit;
    font-size: 0.9rem; /* Reducido de 1rem */
    line-height: 1.5;
    color: #0D1B2A;
    background: #fafbfc;
    resize: vertical;
    transition: all 0.3s ease;
    box-sizing: border-box;
    min-height: 80px; /* Reducido */
  }

  .comment-textarea-compact:focus {
    outline: none;
    border-color: var(--primary-color, #ff6b35);
    background: white;
    box-shadow: 0 0 0 2px rgba(255, 107, 53, 0.1); /* Reducido de 4px */
  }

  .comment-textarea-compact::placeholder {
    color: #94a3b8;
  }

  .form-meta {
    opacity: 0;
    transition: opacity 0.3s ease;
    text-align: right;
    margin: 6px 0; /* Reducido de 8px */
  }

  .form-meta.visible {
    opacity: 1;
  }

  .char-count {
    font-size: 0.75rem; /* Reducido de 0.85rem */
    color: #64748b;
  }

  .char-count.warning {
    color: #f59e0b;
  }

  .form-footer-compact {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    padding-top: 12px; /* Reducido de 20px */
    border-top: 1px solid #f1f5f9;
  }

  .rating-input-compact {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .rating-label-compact {
    font-size: 0.8rem; /* Reducido de 0.95rem */
    font-weight: 600;
    color: #0D1B2A;
  }

  .rating-select-compact {
    padding: 6px 10px; /* Reducido de 12px 16px */
    border: 1px solid #e2e8f0; /* Reducido de 2px */
    border-radius: 6px; /* Reducido de 8px */
    background: white;
    font-size: 0.8rem; /* Reducido de 1rem */
    color: #0D1B2A;
    cursor: pointer;
    transition: border-color 0.3s ease;
    min-width: 120px;
  }

  .rating-select-compact:focus {
    outline: none;
    border-color: var(--primary-color, #ff6b35);
  }

  .submit-comment-btn-compact {
    background: linear-gradient(135deg, #0D1B2A, #1e293b);
    color: white;
    border: none;
    padding: 8px 16px; /* Reducido de 12px 24px */
    border-radius: 6px; /* Reducido de 8px */
    font-weight: 600;
    font-size: 0.85rem; /* Reducido */
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 6px; /* Reducido de 8px */
    transition: all 0.3s ease;
    position: relative;
    white-space: nowrap;
  }

  .submit-comment-btn-compact:hover:not(:disabled) {
    background: linear-gradient(135deg, #1e293b, #334155);
    transform: translateY(-1px); /* Reducido de -2px */
    box-shadow: 0 4px 12px rgba(13, 27, 42, 0.25); /* Reducido de 8px 20px */
  }

  .submit-comment-btn-compact:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
  }

  .submit-comment-btn-compact.loading {
    color: transparent;
  }

  .btn-spinner-compact {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 14px; /* Reducido de 16px */
    height: 14px;
    border: 2px solid rgba(255, 255, 255, 0.3);
    border-top: 2px solid white;
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }

  /* Lista de comentarios compacta */
  .comments-list {
    min-height: 60px; /* Reducido de 100px */
  }

  .loading-comments-compact {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 30px 15px; /* Reducido de 40px 20px */
    color: #64748b;
  }

  .loading-spinner-comments-compact {
    width: 24px; /* Reducido de 32px */
    height: 24px;
    border: 2px solid #f1f5f9; /* Reducido de 3px */
    border-top: 2px solid var(--primary-color, #ff6b35);
    border-radius: 50%;
    animation: spin 1s linear infinite;
    margin-bottom: 12px; /* Reducido de 16px */
  }

  .comments-error-compact {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 30px 15px; /* Reducido de 40px 20px */
    background: #fef2f2;
    border: 1px solid #fecaca; /* Reducido de 2px */
    border-radius: 8px; /* Reducido de 12px */
    color: #dc2626;
    text-align: center;
  }

  .error-icon {
    font-size: 1.5rem; /* Reducido de 2rem */
    margin-bottom: 8px; /* Reducido de 12px */
  }

  .retry-btn-compact {
    background: #dc2626;
    color: white;
    border: none;
    padding: 6px 12px; /* Reducido de 8px 16px */
    border-radius: 4px; /* Reducido de 6px */
    cursor: pointer;
    margin-top: 8px; /* Reducido de 12px */
    font-size: 0.8rem; /* Reducido */
    transition: background-color 0.3s ease;
  }

  .retry-btn-compact:hover {
    background: #b91c1c;
  }

  .comments-header-list-compact {
    margin-bottom: 16px; /* Reducido de 24px */
  }

  .comments-title-compact {
    margin: 0;
    font-size: 1rem; /* Reducido de 1.2rem */
    font-weight: 700;
    color: #0D1B2A;
  }

  .comments-grid-compact {
    display: flex;
    flex-direction: column;
    gap: 12px; /* Reducido de 20px */
  }

  .comment-item-compact {
    background: white;
    padding: 14px; /* Reducido de 20px */
    border-radius: 8px; /* Reducido de 12px */
    border: 1px solid #e2e8f0;
    transition: all 0.3s ease;
  }

  .comment-item-compact:hover {
    border-color: var(--primary-color, #ff6b35);
    box-shadow: 0 2px 8px rgba(255, 107, 53, 0.08); /* Reducido de 4px 12px */
  }

  .comment-header-compact {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 10px; /* Reducido de 12px */
    gap: 8px; /* Reducido de 12px */
  }

  .author-section-compact {
    display: flex;
    align-items: center;
    gap: 8px; /* Reducido de 12px */
  }

  .author-avatar-compact {
    width: 32px; /* Reducido de 40px */
    height: 32px;
    background: linear-gradient(135deg, #f1f5f9, #e2e8f0);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1rem; /* Reducido de 1.2rem */
    flex-shrink: 0;
  }

  .author-info-compact {
    display: flex;
    flex-direction: column;
    gap: 1px; /* Reducido de 2px */
  }

  .comment-author-compact {
    font-weight: 600;
    color: #0D1B2A;
    font-size: 0.85rem; /* Reducido de 0.95rem */
  }

  .comment-time-compact {
    color: #64748b;
    font-size: 0.75rem; /* Reducido de 0.85rem */
  }

  .comment-rating-compact {
    display: flex;
    gap: 1px; /* Reducido de 2px */
    flex-shrink: 0;
  }

  .comment-star-compact {
    font-size: 0.85rem; /* Reducido de 1rem */
    color: #e2e8f0;
  }

  .comment-star-compact.filled {
    color: #fbbf24;
  }

  .comment-content-compact {
    margin-left: 40px; /* Reducido de 52px */
  }

  .comment-text-compact {
    color: #374151;
    font-size: 0.9rem; /* Reducido de 1rem */
    line-height: 1.5; /* Reducido de 1.6 */
    margin: 0;
  }

  .comment-edited-compact {
    color: #9ca3af;
    font-size: 0.7rem; /* Reducido de 0.8rem */
    font-style: italic;
    margin-top: 6px; /* Reducido de 8px */
    display: block;
  }

  .no-comments-compact {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 40px 15px; /* Reducido de 60px 20px */
    text-align: center;
    color: #64748b;
  }

  .no-comments-icon-compact {
    font-size: 2.5rem; /* Reducido de 3rem */
    margin-bottom: 12px; /* Reducido de 16px */
    opacity: 0.7;
  }

  .no-comments-compact h6 {
    margin: 0 0 6px 0; /* Reducido de 8px */
    font-size: 1.1rem; /* Reducido de 1.2rem */
    font-weight: 700;
    color: #374151;
  }

  .no-comments-compact p {
    margin: 0;
    font-size: 0.9rem; /* Reducido de 1rem */
    line-height: 1.4; /* Reducido de 1.5 */
  }

  .comments-pagination-compact {
    text-align: center;
    margin-top: 16px; /* Reducido de 24px */
    padding-top: 16px; /* Reducido de 20px */
    border-top: 1px solid #f1f5f9;
  }

  .pagination-info-compact {
    color: #64748b;
    font-size: 0.8rem; /* Reducido de 0.9rem */
  }

  @keyframes spin {
    0% { transform: translate(-50%, -50%) rotate(0deg); }
    100% { transform: translate(-50%, -50%) rotate(360deg); }
  }

  /* Responsive Design optimizado */
  @media (max-width: 768px) {
    .comments-container {
      padding: 12px;
    }

    .comment-content-compact {
      margin-left: 0;
      margin-top: 8px;
    }

    .comment-header-compact {
      flex-direction: column;
      align-items: flex-start;
      gap: 6px;
    }

    .comment-rating-compact {
      align-self: flex-end;
    }

    .form-footer-compact {
      flex-direction: column;
      align-items: stretch;
      gap: 10px;
    }

    .submit-comment-btn-compact {
      width: 100%;
      justify-content: center;
    }
  }

  @media (max-width: 480px) {
    .comment-form {
      border-radius: 8px;
    }

    .form-content-expanded {
      padding: 12px;
    }

    .comment-item-compact {
      padding: 12px;
    }

    .comments-toggle-btn {
      padding: 8px 14px;
      font-size: 0.85rem;
    }

    .toggle-text {
      font-size: 0.85rem;
    }

    .comments-count-badge {
      font-size: 0.7rem;
    }

    .trigger-avatar {
      width: 32px;
      height: 32px;
    }

    .trigger-text {
      font-size: 0.85rem;
    }
  }
</style>