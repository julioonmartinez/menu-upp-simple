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

  // Estado local
  let showComments = $state(false);
  let commentForm = $state({
    comment: '',
    rating: '',
    isExpanded: false
  });
  let selectedRestaurantForComments = $state<string | null>(null);

  // Valores derivados
  let loadingComments = $derived($isLoadingComments);
  let comments = $derived($restaurantComments);
  let commentsErrorMsg = $derived($commentsError);
  let isCreatingCommentState = $derived($isCreatingComment(restaurantId));

  function toggleComments() {
    showComments = !showComments;
    
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
      
      dispatch('toast', {
        message: '¡Comentario enviado correctamente! Gracias por compartir tu experiencia.',
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
    if (diffInSeconds < 3600) return `hace ${Math.floor(diffInSeconds / 60)} minutos`;
    if (diffInSeconds < 86400) return `hace ${Math.floor(diffInSeconds / 3600)} horas`;
    if (diffInSeconds < 604800) return `hace ${Math.floor(diffInSeconds / 86400)} días`;
    
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
  }

  function collapseCommentForm() {
    if (!commentForm.comment.trim() && !commentForm.rating) {
      commentForm.isExpanded = false;
    }
  }

  function getCommentCountText(count: number): string {
    if (count === 0) return 'Sin comentarios';
    if (count === 1) return '1 comentario';
    return `${count} comentarios`;
  }
</script>

<div class="comments-section">
  <!-- Header de comentarios -->
  <div class="comments-header">
    <button 
      class="comments-toggle-btn"
      class:active={showComments}
      on:click={toggleComments}
      in:fly={{ x: -20, duration: 300 }}
    >
      <span class="toggle-icon">💬</span>
      <span class="toggle-text">
        {showComments ? 'Ocultar comentarios' : 'Ver comentarios'}
      </span>
      {#if commentsCount !== undefined}
        <span class="comments-count">({getCommentCountText(commentsCount)})</span>
      {/if}
      <svg 
        width="16" 
        height="16" 
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
      in:slide={{ duration: 400, easing: quintOut }}
      out:slide={{ duration: 300, easing: quintOut }}
    >
      <!-- Formulario para nuevo comentario -->
      <div class="comment-form-container">
        <div class="comment-form" class:expanded={commentForm.isExpanded}>
          <div class="form-header">
            <h5 class="form-title">
              <span class="form-icon">✍️</span>
              Comparte tu experiencia en {restaurantName}
            </h5>
          </div>
          
          <div class="form-content">
            <textarea
              bind:value={commentForm.comment}
              placeholder={commentForm.isExpanded ? 
                "Cuéntanos sobre tu experiencia: la comida, el servicio, el ambiente..." : 
                "Haz clic para escribir tu comentario..."
              }
              maxlength="500"
              rows={commentForm.isExpanded ? 4 : 2}
              disabled={isCreatingCommentState}
              class="comment-textarea"
              class:expanded={commentForm.isExpanded}
              on:focus={expandCommentForm}
              on:blur={collapseCommentForm}
            ></textarea>
            
            <div class="character-count" class:visible={commentForm.isExpanded && commentForm.comment.length > 0}>
              <span class="count-text">{commentForm.comment.length}/500</span>
            </div>

            {#if commentForm.isExpanded}
              <div class="form-footer" in:slide={{ duration: 300 }}>
                <div class="rating-input">
                  <label class="rating-label">
                    <span class="label-icon">⭐</span>
                    Valoración (opcional):
                  </label>
                  <select 
                    bind:value={commentForm.rating} 
                    disabled={isCreatingCommentState}
                    class="rating-select"
                  >
                    <option value="">Sin valoración</option>
                    <option value="5">⭐⭐⭐⭐⭐ Excelente (5)</option>
                    <option value="4">⭐⭐⭐⭐ Muy bueno (4)</option>
                    <option value="3">⭐⭐⭐ Bueno (3)</option>
                    <option value="2">⭐⭐ Regular (2)</option>
                    <option value="1">⭐ Malo (1)</option>
                  </select>
                </div>
                
                <div class="form-actions">
                  <button 
                    type="button"
                    class="cancel-btn"
                    on:click={() => {
                      commentForm.comment = '';
                      commentForm.rating = '';
                      commentForm.isExpanded = false;
                    }}
                    disabled={isCreatingCommentState}
                  >
                    Cancelar
                  </button>
                  
                  <button 
                    class="submit-comment-btn"
                    on:click={submitComment}
                    disabled={isCreatingCommentState || !commentForm.comment.trim()}
                    class:loading={isCreatingCommentState}
                  >
                    {#if isCreatingCommentState}
                      <div class="btn-spinner"></div>
                      <span>Enviando...</span>
                    {:else}
                      <span>Enviar comentario</span>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M2 21L23 12L2 3V10L17 12L2 14V21Z" fill="currentColor"/>
                      </svg>
                    {/if}
                  </button>
                </div>
              </div>
            {/if}
          </div>
        </div>
      </div>

      <!-- Lista de comentarios -->
      <div class="comments-list">
        {#if loadingComments && selectedRestaurantForComments === restaurantId}
          <div class="loading-comments" in:fade={{ duration: 300 }}>
            <div class="loading-spinner-comments"></div>
            <p>Cargando comentarios...</p>
          </div>
        {:else if commentsErrorMsg && selectedRestaurantForComments === restaurantId}
          <div class="comments-error" in:scale={{ duration: 300 }}>
            <span class="error-icon">⚠️</span>
            <p>Error al cargar comentarios: {commentsErrorMsg}</p>
            <button class="retry-btn" on:click={loadCommentsForRestaurant}>
              Intentar de nuevo
            </button>
          </div>
        {:else if comments && selectedRestaurantForComments === restaurantId}
          {#if comments.comments.length > 0}
            <div class="comments-header-list">
              <h5 class="comments-title">
                Comentarios ({comments.pagination.total})
              </h5>
            </div>
            
            <div class="comments-grid">
              {#each comments.comments as comment, index (comment.id)}
                <div 
                  class="comment-item"
                  in:fly={{ y: 30, duration: 400, delay: index * 100, easing: quintOut }}
                >
                  <div class="comment-header">
                    <div class="comment-author-section">
                      <div class="author-avatar">
                        {comment.anonymous ? '👤' : '👨‍💼'}
                      </div>
                      <div class="author-info">
                        <span class="comment-author">
                          {comment.anonymous ? 'Usuario Anónimo' : 'Usuario Registrado'}
                        </span>
                        <span class="comment-time">{formatTimeAgo(comment.timestamp)}</span>
                      </div>
                    </div>
                    
                    {#if comment.rating}
                      <div class="comment-rating">
                        {#each renderStars(Number(comment.rating)) as star}
                          <span class="comment-star" class:filled={star.filled}>
                            {star.filled ? '⭐' : '☆'}
                          </span>
                        {/each}
                      </div>
                    {/if}
                  </div>
                  
                  <div class="comment-content">
                    <p class="comment-text">{comment.comment}</p>
                    {#if comment.isEdited}
                      <span class="comment-edited">editado</span>
                    {/if}
                  </div>
                </div>
              {/each}
            </div>
            
            {#if comments.pagination.total_pages > 1}
              <div class="comments-pagination" in:fade={{ duration: 400, delay: 300 }}>
                <span class="pagination-info">
                  Mostrando página {comments.pagination.page} de {comments.pagination.total_pages}
                </span>
              </div>
            {/if}
          {:else}
            <div class="no-comments" in:scale={{ duration: 400 }}>
              <div class="no-comments-icon">💭</div>
              <h6>Aún no hay comentarios</h6>
              <p>¡Sé el primero en compartir tu experiencia en este restaurante!</p>
            </div>
          {/if}
        {/if}
      </div>
    </div>
  {/if}
</div>

<style>
  .comments-section {
    border-top: 2px solid #f1f5f9;
    padding-top: 20px;
  }

  .comments-header {
    margin-bottom: 16px;
  }

  .comments-toggle-btn {
    background: linear-gradient(135deg, #f8fafc, #f1f5f9);
    border: 2px solid #e2e8f0;
    color: #475569;
    padding: 12px 20px;
    border-radius: 12px;
    cursor: pointer;
    font-weight: 600;
    display: flex;
    align-items: center;
    gap: 10px;
    transition: all 0.3s ease;
    width: 100%;
    justify-content: center;
  }

  .comments-toggle-btn:hover,
  .comments-toggle-btn.active {
    background: linear-gradient(135deg, var(--primary-color, #ff6b35), #ff8c69);
    color: white;
    border-color: var(--primary-color, #ff6b35);
    transform: translateY(-2px);
    box-shadow: 0 8px 20px rgba(255, 107, 53, 0.3);
  }

  .toggle-icon {
    font-size: 1.2rem;
  }

  .toggle-text {
    font-size: 1rem;
  }

  .comments-count {
    font-size: 0.9rem;
    opacity: 0.8;
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
    border-radius: 16px;
    padding: 24px;
    margin-top: 16px;
  }

  .comment-form-container {
    margin-bottom: 32px;
  }

  .comment-form {
    background: white;
    border: 2px solid #e2e8f0;
    border-radius: 16px;
    padding: 20px;
    transition: all 0.3s ease;
  }

  .comment-form.expanded {
    border-color: var(--primary-color, #ff6b35);
    box-shadow: 0 8px 24px rgba(255, 107, 53, 0.15);
  }

  .form-header {
    margin-bottom: 16px;
  }

  .form-title {
    margin: 0;
    font-size: 1.1rem;
    font-weight: 700;
    color: #0D1B2A;
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .form-icon {
    font-size: 1.2rem;
  }

  .comment-textarea {
    width: 100%;
    border: 2px solid #e2e8f0;
    border-radius: 12px;
    padding: 16px;
    font-family: inherit;
    font-size: 1rem;
    line-height: 1.5;
    color: #0D1B2A;
    background: #fafbfc;
    resize: vertical;
    transition: all 0.3s ease;
    box-sizing: border-box;
  }

  .comment-textarea:focus {
    outline: none;
    border-color: var(--primary-color, #ff6b35);
    background: white;
    box-shadow: 0 0 0 4px rgba(255, 107, 53, 0.1);
  }

  .comment-textarea.expanded {
    background: white;
  }

  .comment-textarea::placeholder {
    color: #94a3b8;
  }

  .character-count {
    opacity: 0;
    transition: opacity 0.3s ease;
    text-align: right;
    margin-top: 8px;
  }

  .character-count.visible {
    opacity: 1;
  }

  .count-text {
    font-size: 0.85rem;
    color: #64748b;
  }

  .form-footer {
    margin-top: 20px;
    padding-top: 20px;
    border-top: 1px solid #f1f5f9;
  }

  .rating-input {
    margin-bottom: 20px;
  }

  .rating-label {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 0.95rem;
    font-weight: 600;
    color: #0D1B2A;
    margin-bottom: 8px;
  }

  .label-icon {
    font-size: 1.1rem;
  }

  .rating-select {
    width: 100%;
    padding: 12px 16px;
    border: 2px solid #e2e8f0;
    border-radius: 8px;
    background: white;
    font-size: 1rem;
    color: #0D1B2A;
    cursor: pointer;
    transition: border-color 0.3s ease;
  }

  .rating-select:focus {
    outline: none;
    border-color: var(--primary-color, #ff6b35);
  }

  .form-actions {
    display: flex;
    gap: 12px;
    justify-content: flex-end;
  }

  .cancel-btn {
    background: white;
    border: 2px solid #e2e8f0;
    color: #64748b;
    padding: 12px 20px;
    border-radius: 8px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.3s ease;
  }

  .cancel-btn:hover:not(:disabled) {
    border-color: #cbd5e1;
    color: #475569;
  }

  .submit-comment-btn {
    background: linear-gradient(135deg, #0D1B2A, #1e293b);
    color: white;
    border: none;
    padding: 12px 24px;
    border-radius: 8px;
    font-weight: 600;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 8px;
    transition: all 0.3s ease;
    position: relative;
    overflow: hidden;
  }

  .submit-comment-btn:hover:not(:disabled) {
    background: linear-gradient(135deg, #1e293b, #334155);
    transform: translateY(-2px);
    box-shadow: 0 8px 20px rgba(13, 27, 42, 0.3);
  }

  .submit-comment-btn:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
  }

  .submit-comment-btn.loading {
    color: transparent;
  }

  .btn-spinner {
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

  @keyframes spin {
    0% { transform: translate(-50%, -50%) rotate(0deg); }
    100% { transform: translate(-50%, -50%) rotate(360deg); }
  }

  .comments-list {
    min-height: 100px;
  }

  .loading-comments {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 40px 20px;
    color: #64748b;
  }

  .loading-spinner-comments {
    width: 32px;
    height: 32px;
    border: 3px solid #f1f5f9;
    border-top: 3px solid var(--primary-color, #ff6b35);
    border-radius: 50%;
    animation: spin 1s linear infinite;
    margin-bottom: 16px;
  }

  .comments-error {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 40px 20px;
    background: #fef2f2;
    border: 2px solid #fecaca;
    border-radius: 12px;
    color: #dc2626;
    text-align: center;
  }

  .error-icon {
    font-size: 2rem;
    margin-bottom: 12px;
  }

  .retry-btn {
    background: #dc2626;
    color: white;
    border: none;
    padding: 8px 16px;
    border-radius: 6px;
    cursor: pointer;
    margin-top: 12px;
    transition: background-color 0.3s ease;
  }

  .retry-btn:hover {
    background: #b91c1c;
  }

  .comments-header-list {
    margin-bottom: 24px;
  }

  .comments-title {
    margin: 0;
    font-size: 1.2rem;
    font-weight: 700;
    color: #0D1B2A;
  }

  .comments-grid {
    display: flex;
    flex-direction: column;
    gap: 20px;
  }

  .comment-item {
    background: white;
    padding: 20px;
    border-radius: 12px;
    border: 1px solid #e2e8f0;
    transition: all 0.3s ease;
  }

  .comment-item:hover {
    border-color: var(--primary-color, #ff6b35);
    box-shadow: 0 4px 12px rgba(255, 107, 53, 0.1);
  }

  .comment-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 12px;
    gap: 12px;
  }

  .comment-author-section {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .author-avatar {
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

  .author-info {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  .comment-author {
    font-weight: 600;
    color: #0D1B2A;
    font-size: 0.95rem;
  }

  .comment-time {
    color: #64748b;
    font-size: 0.85rem;
  }

  .comment-rating {
    display: flex;
    gap: 2px;
    flex-shrink: 0;
  }

  .comment-star {
    font-size: 1rem;
    color: #e2e8f0;
  }

  .comment-star.filled {
    color: #fbbf24;
  }

  .comment-content {
    margin-left: 52px;
  }

  .comment-text {
    color: #374151;
    font-size: 1rem;
    line-height: 1.6;
    margin: 0;
  }

  .comment-edited {
    color: #9ca3af;
    font-size: 0.8rem;
    font-style: italic;
    margin-top: 8px;
    display: block;
  }

  .no-comments {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 60px 20px;
    text-align: center;
    color: #64748b;
  }

  .no-comments-icon {
    font-size: 3rem;
    margin-bottom: 16px;
    opacity: 0.7;
  }

  .no-comments h6 {
    margin: 0 0 8px 0;
    font-size: 1.2rem;
    font-weight: 700;
    color: #374151;
  }

  .no-comments p {
    margin: 0;
    font-size: 1rem;
    line-height: 1.5;
  }

  .comments-pagination {
    text-align: center;
    margin-top: 24px;
    padding-top: 20px;
    border-top: 1px solid #f1f5f9;
  }

  .pagination-info {
    color: #64748b;
    font-size: 0.9rem;
  }

  /* Responsive Design */
  @media (max-width: 768px) {
    .comments-container {
      padding: 20px;
    }

    .form-actions {
      flex-direction: column;
    }

    .cancel-btn,
    .submit-comment-btn {
      width: 100%;
      justify-content: center;
    }

    .comment-content {
      margin-left: 0;
      margin-top: 12px;
    }

    .comment-header {
      flex-direction: column;
      align-items: flex-start;
      gap: 8px;
    }

    .comment-rating {
      align-self: flex-end;
    }
  }

  @media (max-width: 480px) {
    .comment-form {
      padding: 16px;
    }

    .form-title {
      font-size: 1rem;
    }

    .comment-item {
      padding: 16px;
    }

    .comments-toggle-btn {
      padding: 10px 16px;
    }

    .toggle-text {
      font-size: 0.9rem;
    }

    .comments-count {
      font-size: 0.8rem;
    }
  }
</style>