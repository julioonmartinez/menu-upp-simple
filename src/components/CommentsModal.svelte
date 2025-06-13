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

<!-- svelte-ignore a11y-click-events-have-key-events -->
<!-- svelte-ignore a11y-no-static-element-interactions -->
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

<style>
  .modal-backdrop {
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
    padding: 20px;
  }

  .modal-backdrop.mobile {
    padding: 10px;
    align-items: flex-end;
  }

  .modal-container {
    background: white;
    border-radius: 16px;
    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15);
    width: 100%;
    max-width: 600px;
    max-height: 90vh;
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }

  .modal-container.mobile {
    max-height: 95vh;
    border-radius: 16px 16px 0 0;
  }

  /* Header del modal */
  .modal-header {
    padding: 20px;
    border-bottom: 1px solid #f1f5f9;
    flex-shrink: 0;
  }

  .header-content {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
  }

  .header-info {
    flex: 1;
  }

  .modal-title {
    margin: 0;
    font-size: 1.25rem;
    font-weight: 700;
    color: #0D1B2A;
  }

  .restaurant-name {
    margin: 4px 0 0 0;
    font-size: 0.9rem;
    color: #64748b;
  }

  .close-btn {
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    width: 40px;
    height: 40px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: all 0.3s ease;
    color: #64748b;
  }

  .close-btn:hover {
    background: #f1f5f9;
    color: #475569;
    border-color: #cbd5e1;
  }

  /* Contenido del modal */
  .modal-content {
    flex: 1;
    overflow-y: auto;
    padding: 0 20px 20px;
    display: flex;
    flex-direction: column;
    gap: 20px;
  }

  /* Formulario de comentarios en modal */
  .comment-form-section {
    flex-shrink: 0;
  }

  .comment-form-modal {
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    border-radius: 12px;
    transition: all 0.3s ease;
    overflow: hidden;
  }

  .comment-form-modal.expanded,
  .comment-form-modal.focused {
    border-color: var(--primary-color, #ff6b35);
    background: white;
    box-shadow: 0 4px 15px rgba(255, 107, 53, 0.1);
  }

  .comment-form-trigger-modal {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 16px;
    width: 100%;
    border: none;
    background: transparent;
    cursor: pointer;
    transition: all 0.3s ease;
    text-align: left;
  }

  .comment-form-trigger-modal:hover {
    background: rgba(255, 255, 255, 0.8);
  }

  .trigger-avatar-modal {
    width: 40px;
    height: 40px;
    background: linear-gradient(135deg, #f1f5f9, #e2e8f0);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.2rem;
    flex-shrink: 0;
  }

  .trigger-text-modal {
    color: #64748b;
    font-size: 0.95rem;
    line-height: 1.4;
  }

  .form-content-modal {
    padding: 20px;
  }

  .form-header-modal {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 16px;
  }

  .form-icon-modal {
    font-size: 1.2rem;
  }

  .form-title-modal {
    font-weight: 700;
    color: #0D1B2A;
    font-size: 1.1rem;
    flex: 1;
  }

  .form-close-btn-modal {
    background: none;
    border: none;
    color: #64748b;
    cursor: pointer;
    padding: 4px;
    border-radius: 4px;
    transition: all 0.2s ease;
  }

  .form-close-btn-modal:hover {
    background: #f1f5f9;
    color: #475569;
  }

  .comment-textarea-modal {
    width: 100%;
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    padding: 12px;
    font-family: inherit;
    font-size: 0.95rem;
    line-height: 1.5;
    color: #0D1B2A;
    background: #fafbfc;
    resize: vertical;
    transition: all 0.3s ease;
    box-sizing: border-box;
    min-height: 100px;
  }

  .comment-textarea-modal:focus {
    outline: none;
    border-color: var(--primary-color, #ff6b35);
    background: white;
    box-shadow: 0 0 0 3px rgba(255, 107, 53, 0.1);
  }

  .comment-textarea-modal::placeholder {
    color: #94a3b8;
  }

  .form-meta-modal {
    opacity: 0;
    transition: opacity 0.3s ease;
    text-align: right;
    margin: 8px 0;
  }

  .form-meta-modal.visible {
    opacity: 1;
  }

  .char-count-modal {
    font-size: 0.8rem;
    color: #64748b;
  }

  .char-count-modal.warning {
    color: #f59e0b;
  }

  .form-footer-modal {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
    padding-top: 16px;
    border-top: 1px solid #f1f5f9;
  }

  .rating-input-modal {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .rating-label-modal {
    font-size: 0.9rem;
    font-weight: 600;
    color: #0D1B2A;
  }

  .rating-select-modal {
    padding: 8px 12px;
    border: 1px solid #e2e8f0;
    border-radius: 6px;
    background: white;
    font-size: 0.9rem;
    color: #0D1B2A;
    cursor: pointer;
    transition: border-color 0.3s ease;
    min-width: 140px;
  }

  .rating-select-modal:focus {
    outline: none;
    border-color: var(--primary-color, #ff6b35);
  }

  .submit-comment-btn-modal {
    background: linear-gradient(135deg, #0D1B2A, #1e293b);
    color: white;
    border: none;
    padding: 10px 20px;
    border-radius: 8px;
    font-weight: 600;
    font-size: 0.9rem;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 8px;
    transition: all 0.3s ease;
    position: relative;
    white-space: nowrap;
  }

  .submit-comment-btn-modal:hover:not(:disabled) {
    background: linear-gradient(135deg, #1e293b, #334155);
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(13, 27, 42, 0.25);
  }

  .submit-comment-btn-modal:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
  }

  .submit-comment-btn-modal.loading {
    color: transparent;
  }

  .btn-spinner-modal {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 16px;
    height: 16px;
    border: 2px solid rgba(255, 255, 255, 0.3);
    border-top: 2px solid white;
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }

  /* Lista de comentarios */
  .comments-list-modal {
    flex: 1;
    min-height: 200px;
  }

  .loading-comments-modal {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 40px 20px;
    color: #64748b;
  }

  .loading-spinner-comments-modal {
    width: 32px;
    height: 32px;
    border: 3px solid #f1f5f9;
    border-top: 3px solid var(--primary-color, #ff6b35);
    border-radius: 50%;
    animation: spin 1s linear infinite;
    margin-bottom: 16px;
  }

  .comments-error-modal {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 40px 20px;
    background: #fef2f2;
    border: 1px solid #fecaca;
    border-radius: 12px;
    color: #dc2626;
    text-align: center;
  }

  .error-icon-modal {
    font-size: 2rem;
    margin-bottom: 12px;
  }

  .retry-btn-modal {
    background: #dc2626;
    color: white;
    border: none;
    padding: 8px 16px;
    border-radius: 6px;
    cursor: pointer;
    margin-top: 12px;
    font-size: 0.9rem;
    transition: background-color 0.3s ease;
  }

  .retry-btn-modal:hover {
    background: #b91c1c;
  }

  .comments-header-modal {
    margin-bottom: 20px;
  }

  .comments-title-modal {
    margin: 0;
    font-size: 1.1rem;
    font-weight: 700;
    color: #0D1B2A;
  }

  .comments-grid-modal {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  .comment-item-modal {
    background: #f8fafc;
    padding: 16px;
    border-radius: 12px;
    border: 1px solid #e2e8f0;
    transition: all 0.3s ease;
  }

  .comment-item-modal:hover {
    border-color: var(--primary-color, #ff6b35);
    background: white;
    box-shadow: 0 2px 8px rgba(255, 107, 53, 0.08);
  }

  .comment-header-modal {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 12px;
    gap: 12px;
  }

  .author-section-modal {
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .author-avatar-modal {
    width: 36px;
    height: 36px;
    background: linear-gradient(135deg, #f1f5f9, #e2e8f0);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.1rem;
    flex-shrink: 0;
  }

  .author-info-modal {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  .comment-author-modal {
    font-weight: 600;
    color: #0D1B2A;
    font-size: 0.9rem;
  }

  .comment-time-modal {
    color: #64748b;
    font-size: 0.8rem;
  }

  .comment-rating-modal {
    display: flex;
    gap: 2px;
    flex-shrink: 0;
  }

  .comment-star-modal {
    font-size: 0.9rem;
    color: #e2e8f0;
  }

  .comment-star-modal.filled {
    color: #fbbf24;
  }

  .comment-content-modal {
    padding-left: 46px;
  }

  .comment-text-modal {
    color: #374151;
    font-size: 0.95rem;
    line-height: 1.5;
    margin: 0;
  }

  .comment-edited-modal {
    color: #9ca3af;
    font-size: 0.75rem;
    font-style: italic;
    margin-top: 8px;
    display: block;
  }

  .no-comments-modal {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 60px 20px;
    text-align: center;
    color: #64748b;
  }

  .no-comments-icon-modal {
    font-size: 3rem;
    margin-bottom: 16px;
    opacity: 0.7;
  }

  .no-comments-modal h4 {
    margin: 0 0 8px 0;
    font-size: 1.1rem;
    font-weight: 700;
    color: #374151;
  }

  .no-comments-modal p {
    margin: 0;
    font-size: 0.95rem;
    line-height: 1.5;
  }

  .comments-pagination-modal {
    text-align: center;
    margin-top: 20px;
    padding-top: 16px;
    border-top: 1px solid #f1f5f9;
  }

  .pagination-info-modal {
    color: #64748b;
    font-size: 0.85rem;
  }

  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }

  /* Responsive */
  @media (max-width: 768px) {
    .modal-header {
      padding: 16px;
    }

    .modal-content {
      padding: 0 16px 16px;
    }

    .comment-content-modal {
      padding-left: 0;
      margin-top: 8px;
    }

    .comment-header-modal {
      flex-direction: column;
      align-items: flex-start;
      gap: 8px;
    }

    .comment-rating-modal {
      align-self: flex-end;
    }

    .form-footer-modal {
      flex-direction: column;
      align-items: stretch;
      gap: 12px;
    }

    .submit-comment-btn-modal {
      width: 100%;
      justify-content: center;
    }
  }

  @media (max-width: 480px) {
    .modal-container {
      border-radius: 12px 12px 0 0;
    }

    .modal-header {
      padding: 12px;
    }

    .modal-content {
      padding: 0 12px 12px;
    }

    .form-content-modal {
      padding: 16px;
    }

    .comment-item-modal {
      padding: 12px;
    }

    .modal-title {
      font-size: 1.1rem;
    }

    .restaurant-name {
      font-size: 0.85rem;
    }

    .close-btn {
      width: 36px;
      height: 36px;
    }
  }
</style>