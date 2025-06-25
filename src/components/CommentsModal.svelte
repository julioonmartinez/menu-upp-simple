
<script lang="ts">
  import { createEventDispatcher, onMount } from 'svelte';
  import { fly, fade, slide } from 'svelte/transition';
  import { quintOut } from 'svelte/easing';
  
  import Modal from '../components/Modal.svelte';
  import { 
    useRestaurantRatings,
    restaurantRatingStore
  } from '../stores/restaurantRatingStore';
  import './CommentsModal.css'
  import type { RestaurantCommentCreate } from '../interfaces/restaurantRating';
    import { useAuth, user } from '../stores/authStore';

  const dispatch = createEventDispatcher();

  // Props que vienen del modalStore
  const { restaurantId, restaurantName, commentsCount } = $props<{
    restaurantId: string;
    restaurantName: string;
    commentsCount: number | undefined;
  }>();

  // Hook personalizado para este restaurante específico
  const {
    // Estado de comentarios
    restaurantComments,
    isCommentsLoading,
    isCreatingComment,
    commentsError,
    commentsPagination,
    isAuthenticated,
    
    // Métodos de comentarios
    loadComments,
    loadMoreComments,
    createComment,
    
    // Stores reactivos
    getRestaurantComments,
    isCommentsLoadingStore,
    isCreatingCommentStore
  } = useRestaurantRatings(restaurantId);

  // Estado local del formulario
  let commentForm = $state({
    comment: '',
    rating: '',
    isExpanded: false,
    isFocused: false
  });

  // Valores derivados usando stores reactivos
  let loadingComments = $derived($isCommentsLoadingStore);
  let comments = $derived($getRestaurantComments);
  let commentsErrorMsg = $derived(commentsError);
  let isCreatingCommentState = $derived($isCreatingCommentStore);

  // Cargar comentarios al montar
  onMount(() => {
    loadCommentsForRestaurant();
  });

  async function loadCommentsForRestaurant() {
    const result = await loadComments(restaurantId, 20, 1, true);
    
    if (!result.success) {
      showToast('Error al cargar los comentarios', 'error');
    }
  }

  async function submitComment() {
    if (!commentForm.comment.trim()) {
      showToast('Por favor escribe un comentario', 'info');
      return;
    }

    if (commentForm.comment.trim().length < 3) {
      showToast('El comentario debe tener al menos 3 caracteres', 'info');
      return;
    }

    const commentData: RestaurantCommentCreate = {
      comment: commentForm.comment.trim()
    };

    if (commentForm.rating && parseFloat(commentForm.rating) > 0) {
      commentData.rating = parseFloat(commentForm.rating);
    }

    const result = await createComment(restaurantId, commentData);
    
    if (result.success) {
      commentForm.comment = '';
      commentForm.rating = '';
      commentForm.isExpanded = false;
      commentForm.isFocused = false;
      
      const commentType = isAuthenticated ? 'registrado' : 'anónimo';
      showToast(`¡Comentario ${commentType} enviado! Gracias por compartir tu experiencia.`, 'success');
    } else {
      showToast(`Error al enviar el comentario: ${result.error}`, 'error');
    }
  }

  async function handleLoadMoreComments() {
    if (commentsPagination?.has_next) {
      const result = await loadMoreComments(restaurantId);
      if (!result.success) {
        showToast('Error al cargar más comentarios', 'error');
      }
    }
  }

  function showToast(message: string, type: 'success' | 'error' | 'info') {
    // Emitir evento para el sistema de toasts global
    window.dispatchEvent(new CustomEvent('showToast', {
      detail: { message, type }
    }));
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

  function getAuthenticationStatus(): string {
    return isAuthenticated ? 'como usuario registrado' : 'anónimamente';
  }
</script>

<Modal
  title="Comentarios"
  subtitle={restaurantName}
  size="medium"
  on:close
>
  <!-- Información de autenticación -->
  <div class="auth-info">
    <span class="auth-status">
      {#if isAuthenticated}
        ✅ Comentarás como usuario registrado
      {:else}
        👤 Comentarás de forma anónima
      {/if}
    </span>
    {#if !isAuthenticated}
      <a href="/login" class="login-link">Iniciar sesión</a>
    {/if}
  </div>

  <!-- Formulario para nuevo comentario -->
  <div class="comment-form-section">
    <div class="comment-form" class:expanded={commentForm.isExpanded} class:focused={commentForm.isFocused}>
      
      {#if !commentForm.isExpanded}
        <!-- Versión compacta del formulario -->
        <button 
          class="comment-form-trigger"
          on:click={expandCommentForm}
          disabled={isCreatingCommentState}
        >
          <div class="trigger-avatar">✍️</div>
          <span class="trigger-text">Comparte tu experiencia {getAuthenticationStatus()}...</span>
        </button>
      {:else}
        <!-- Formulario expandido -->
        <div class="form-content" in:slide={{ duration: 300 }}>
          <div class="form-header">
            <span class="form-icon">✍️</span>
            <span class="form-title">
              Tu experiencia {isAuthenticated ? '(registrado)' : '(anónimo)'}
            </span>
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
            rows="4"
            disabled={isCreatingCommentState}
            class="comment-textarea"
            on:blur={collapseCommentForm}
          ></textarea>
          
          <div class="form-meta" class:visible={commentForm.comment.length > 0}>
            <span class="char-count" class:warning={commentForm.comment.length > 450}>
              {commentForm.comment.length}/500
            </span>
          </div>

          <div class="form-footer">
            <div class="rating-input">
              <label class="rating-label">⭐ Valoración:</label>
              <select 
                bind:value={commentForm.rating} 
                disabled={isCreatingCommentState}
                class="rating-select"
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
              class="submit-comment-btn btn btn-primary"
              on:click={submitComment}
              disabled={isCreatingCommentState || !commentForm.comment.trim()}
              class:loading={isCreatingCommentState}
            >
              {#if isCreatingCommentState}
                <div class="btn-spinner"></div>
              {:else}
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M2 21L23 12L2 3V10L17 12L2 14V21Z" fill="currentColor"/>
                </svg>
                Enviar {isAuthenticated ? '(Registrado)' : '(Anónimo)'}
              {/if}
            </button>
          </div>
        </div>
      {/if}
    </div>
  </div>

  <!-- Lista de comentarios -->
  <div class="comments-list">
    {#if loadingComments}
      <div class="loading-comments" in:fade={{ duration: 300 }}>
        <div class="loading-spinner-comments"></div>
        <p>Cargando comentarios...</p>
      </div>
    {:else if commentsErrorMsg}
      <div class="comments-error" in:fade={{ duration: 300 }}>
        <span class="error-icon">⚠️</span>
        <p>Error: {commentsErrorMsg}</p>
        <button class="retry-btn" on:click={loadCommentsForRestaurant}>
          Reintentar
        </button>
      </div>
    {:else if comments && comments.length > 0}
      <div class="comments-header">
        <h3 class="comments-title">
          💬 {getCommentCountText(commentsPagination?.total || comments.length)}
        </h3>
        
        {#if commentsPagination}
          <div class="comments-stats">
            <span class="stats-detail">
              Registrados: {commentsPagination.total || 0} • 
              Página {commentsPagination.page || 1} de {commentsPagination.total_pages || 1}
            </span>
          </div>
        {/if}
      </div>
      
      <div class="comments-grid">
        {#each comments as comment, index (comment.id)}
          <div 
            class="comment-item"
            class:anonymous={comment.anonymous}
            class:verified={!comment.anonymous}
            in:fly={{ y: 20, duration: 300, delay: index * 50, easing: quintOut }}
          >
            <div class="comment-header">
              <div class="author-section">
                <div class="author-avatar" class:anonymous={comment.anonymous}>
                  {#if comment.anonymous}
                    👤
                  {:else}
                    ✅
                  {/if}
                </div>
                <div class="author-info">
                  <span class="comment-author">
                    {comment.anonymous ? 'Usuario Anónimo' : ( useAuth().user?.name || useAuth().user?.email || 'Usuario Registrado' )}
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
                  <span class="rating-value">({comment.rating})</span>
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
      
      <!-- Botón para cargar más comentarios -->
      {#if commentsPagination?.has_next}
        <div class="load-more-section" in:fade={{ duration: 400, delay: 200 }}>
          <button 
            class="load-more-btn"
            on:click={handleLoadMoreComments}
            disabled={loadingComments}
          >
            {#if loadingComments}
              <div class="btn-spinner-small"></div>
              Cargando...
            {:else}
              Cargar más comentarios ({commentsPagination.total - comments.length} restantes)
            {/if}
          </button>
        </div>
      {/if}

      <!-- Información de paginación -->
      {#if commentsPagination && commentsPagination.total_pages > 1}
        <div class="comments-pagination" in:fade={{ duration: 400, delay: 200 }}>
          <span class="pagination-info">
            Mostrando {comments.length} de {commentsPagination.total} comentarios
          </span>
        </div>
      {/if}
    {:else}
      <div class="no-comments" in:fade={{ duration: 400 }}>
        <div class="no-comments-icon">💭</div>
        <h4>Aún no hay comentarios</h4>
        <p>
          ¡Sé el primero en compartir tu experiencia! 
          {#if isAuthenticated}
            Tu comentario quedará registrado con tu cuenta.
          {:else}
            Puedes comentar de forma anónima o <a href="/login">iniciar sesión</a> para comentar como usuario registrado.
          {/if}
        </p>
      </div>
    {/if}
  </div>
</Modal>