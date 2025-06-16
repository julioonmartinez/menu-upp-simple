<!-- RatingDisplaySvelte.svelte: Componente principal optimizado -->
<script lang="ts">
  import { onMount } from 'svelte';
  import { favoritesStore } from '../../stores/favoritesStore';
  
  // Props
  export let id: string | number;
  export let rating: number = 0;
  export let reviewsCount: number = 0;
  
  // Estado local para seguimiento de cambios
  let currentRating = rating;
  let currentReviewsCount = reviewsCount;
  let hasUserRated = false;
  let justRated = false; // Para animar cuando el usuario acaba de calificar
  let userRating: number | null = null;
  let isRating = false;
  let pendingRating: number | null = null;
  let isHovering = false;
  let hoverRating = 0;
  const maxRating = 5;
  
  // Mensajes para las notificaciones
  const newRatingMessages : any = {
    1: "😞 ¡Gracias por tu valoración! Tomaremos nota para sorprenderte.",
    2: "😕 ¡Gracias por tu opinión! Trabajaremos duro para mejorar.",
    3: "😐 ¡Gracias por tu feedback! Estamos en constante mejora.",
    4: "😊 ¡Qué bueno! Gracias por valorarnos, nos alegra que hayas disfrutado.",
    5: "🤩 ¡Increíble! Tu 5 estrellas nos llena de energía."
  };
  
  const changedRatingMessages: any = {
    1: "😔 Has cambiado de opinión. ¡Prometemos esforzarnos más!",
    2: "😕 Tu nueva valoración nos motiva a seguir mejorando.",
    3: "😐 Gracias por actualizar tu valoración. ¡Tu opinión es vital!",
    4: "😊 ¡Fantástico! Has mejorado tu valoración. ¡Nos encanta!",
    5: "🤩 ¡Wow! Ahora eres de 5 estrellas. ¡Un auténtico experto!"
  };
  
  // Comprobar inmediatamente si el usuario ha valorado este plato
  if (typeof window !== 'undefined') {
    // Intentar obtener datos del localStorage
    try {
      // Verificar valoraciones del usuario
      const ratingsStr = localStorage.getItem('ratingItems');
      if (ratingsStr) {
        const ratings = JSON.parse(ratingsStr);
        const userDish = ratings.find((d: any) => d.id === id);
        hasUserRated = !!userDish;
        if (userDish && userDish.userRating !== undefined) {
          userRating = userDish.userRating;
        }
      }
      
      // También verificar allDishes para obtener el rating actual si está disponible
      const allDishesStr = localStorage.getItem('allDishesCache');
      if (allDishesStr) {
        const allDishes = JSON.parse(allDishesStr);
        const dish = allDishes.find((d: any) => d.id === id);
        if (dish && dish.rating !== undefined && dish.rating > 0) {
          currentRating = dish.rating;
        }
        if (dish && dish.reviewsCount !== undefined) {
          currentReviewsCount = dish.reviewsCount;
        }
      }
    } catch (e) {
      console.error('Error parsing data from localStorage:', e);
    }
  }
  
  // Suscribirse a cambios en el store
  onMount(() => {
    const unsubscribe = favoritesStore.subscribe(state => {
      // Buscar el plato en el store
      const dish = state.allDishes.find(d => d.id === id);
      if (dish) {
        // Actualizar rating promedio y número de reseñas si cambian
        if (dish.rating !== undefined && dish.rating !== currentRating) {
          currentRating = dish.rating;
        }
        if (dish.reviewsCount !== undefined && dish.reviewsCount !== currentReviewsCount) {
          currentReviewsCount = dish.reviewsCount;
        }
        
        // Verificar si el usuario ha calificado este plato
        const userRatedDish = state.ratingsDish.find(d => d.id === id);
        hasUserRated = !!userRatedDish;
        
        if (userRatedDish && userRatedDish.userRating !== undefined) {
          userRating = userRatedDish.userRating;
        }
        
        // Si el usuario acaba de calificar, mostrar animación
        if (hasUserRated && !justRated) {
          justRated = true;
          // Resetear la bandera después de la animación
          setTimeout(() => {
            justRated = false;
          }, 2000);
        }
      }
    });
    
    return unsubscribe;
  });
  
  // Función para formatear el contador de reseñas
  function formatReviewCount(count: number): string {
    if (count === 0) return "Sin reseñas";
    if (count < 1000) {
      return count === 1 ? "1 reseña" : `${count} `;
    } else if (count < 10000) {
      return (count / 1000).toFixed(1).replace(/\.0$/, '') + '';
    } else {
      return Math.floor(count / 1000) + 'K reseñas';
    }
  }
  
  // Función para manejar la valoración
  async function handleRatingClick(selectedRating: number) {
    // Si ya se está procesando una valoración, no hacer nada
    if (isRating) return;
    
    // Si es la misma valoración y el usuario ya ha valorado, no hacer nada
    if (userRating === selectedRating && hasUserRated) return;
    
    try {
      isRating = true;
      
      // Guardar temporalmente la valoración seleccionada para la animación
      pendingRating = selectedRating;
      
      // Determinar si es una valoración nueva o un cambio
      const isNew = userRating === null || !hasUserRated;
      
      // Guardar la valoración en el store centralizado
      await favoritesStore.setRating(id, selectedRating);
      
      // Actualizar el estado local
      userRating = selectedRating;
      hasUserRated = true;
      
      // Notificar al UI con un mensaje apropiado
      const message = isNew ? newRatingMessages[selectedRating] : changedRatingMessages[selectedRating];
      window.dispatchEvent(new CustomEvent('dishRatingsUpdated', {
        detail: { id, rating: selectedRating, message }
      }));
    } catch (error) {
      console.error('Error al guardar la valoración:', error);
    } finally {
      isRating = false;
      pendingRating = null;
    }
  }
  
  function handleStarHover(index: number) {
    if (!isRating) {
      isHovering = true;
      hoverRating = index;
    }
  }
  
  function handleStarLeave() {
    isHovering = false;
    hoverRating = 0;
  }
  
  // Array reactivo con estado de cada estrella para visualización
  $: displayStars = Array.from({ length: maxRating }, (_, index) => {
    // Durante la carga o animación de calificación
    if (isRating && pendingRating !== null) {
      return index < pendingRating ? 'loading' : 'empty';
    }
    
    // Al pasar el mouse sobre las estrellas
    if (isHovering) {
      return index < hoverRating ? 'hover' : 'empty';
    }
    
    // Mostrar valoración del usuario si existe
    if (hasUserRated && userRating !== null) {
      return index < userRating ? 'user' : 'empty';
    }
    
    // Si no, mostrar la valoración promedio
    const full = Math.floor(currentRating);
    const hasHalf = currentRating % 1 >= 0.5;
    
    if (index < full) return 'full';
    if (index === full && hasHalf) return 'half';
    return 'empty';
  });
  
  // Determinar si tenemos una valoración válida para mostrar
  $: hasValidRating = (currentRating > 0) || (hasUserRated && userRating !== null);
  
  // Determinar qué calificación mostrar numéricamente
  $: displayRating = hasUserRated && userRating !== null 
    ? userRating 
    : currentRating > 0 
      ? currentRating 
      : 0;
</script>

<div class="rating-display-wrapper">
  <div class="pill-container {justRated ? 'just-rated' : ''} {!hasValidRating ? 'min-width' : ''}" data-dish-id={id}>
    <!-- Sección de estrellas interactivas -->
    <div 
      class="star-rating {hasValidRating ? 'has-value' : ''}"
    >
      {#each displayStars as type, index}
        <button
          class="star-button"
          on:click={() => handleRatingClick(index + 1)}
          on:mouseenter={() => handleStarHover(index + 1)}
          on:mouseleave={handleStarLeave}
          aria-label={`Calificar ${index + 1} estrella${index + 1 > 1 ? 's' : ''}`}
          disabled={isRating}
        >
          <svg
            class="star-icon {type === 'loading' ? 'loading' : ''} {type === 'hover' ? 'hover' : ''} {type === 'user' ? 'user' : ''} {type === 'full' || type === 'half' ? 'filled' : ''} {type === 'empty' ? 'empty' : ''}"
            viewBox="0 0 20 20"
            fill={type === 'empty' ? 'none' : 'currentColor'}
            stroke={type === 'empty' ? 'currentColor' : 'none'}
            stroke-width="1.5"
            clip-path={type === 'half' ? 'inset(0 50% 0 0)' : undefined}
          >
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
          </svg>
        </button>
      {/each}
    </div>
    
    <!-- Sección de información numérica y contador de reseñas -->
    {#if hasValidRating}
      <div class="rating-info">
        <span class="rating-value">
          {displayRating.toFixed(1)}
        </span>
        
        {#if hasUserRated && userRating !== null}
          <span class="user-rated-indicator">
            <svg class="check-icon" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
            </svg>
          </span>
        {/if}
        
        {#if currentReviewsCount > 0}
          <span class="separator">•</span>
          <span class="review-count">{formatReviewCount(currentReviewsCount)}</span>
        {:else if hasUserRated}
          <span class="separator">•</span>
          <span class="your-rating-text">Tu valoración</span>
        {:else}
          <span class="rate-text">Calificar</span>
        {/if}
      </div>
    {:else}
      <!-- Estado de carga o invitación a valorar si no hay datos -->
      <span class="invite-rating">
        <span class="invite-content">
          <span>Valorar platillo</span>
          <svg class="invite-icon" viewBox="0 0 20 20" fill="currentColor">
            <path d="M10 2a8 8 0 100 16 8 8 0 000-16zm1 12a1 1 0 11-2 0 1 1 0 012 0zm0-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" />
          </svg>
        </span>
      </span>
    {/if}
  </div>
</div>

<style>
  /* Variables CSS */
  :root {
    --color-primary: #eb0000;
    --color-primary-dark: #A31D1D;
    --color-beige: #ffc224;
    --color-secondary: #ffc224;
    --color-beige-light: #fff2d0;
    --color-primary-light: #D84040;
    --color-text: #2b2b2b;
    --color-text-light: #f5f5f5;
    --color-secondary-md: #feeab8;
    --color-gray-100: #f3f4f6;
    --color-gray-200: #e5e7eb;
    --color-gray-300: #d1d5db;
    --color-gray-400: #9ca3af;
    --color-gray-600: #4b5563;
    --color-gray-800: #1f2937;
  }

  .rating-display-wrapper {
    min-height: 32px;
    display: flex;
    align-items: center;
    max-width: 100%;
  }
  
  .pill-container {
    display: flex;
    align-items: center;
    background-color: var(--color-gray-100);
    padding: 0.375rem 0.75rem; /* py-1.5 px-3 */
    border-radius: 9999px; /* rounded-full */
    font-size: 0.875rem; /* text-sm */
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); /* transition-all duration-300 */
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
    /* box-sizing: border-box; */
  }

  .pill-container:hover {
    background-color: var(--color-gray-200); /* hover:bg-gray-200 */
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
    transform: translateY(-1px);
  }

  .pill-container.min-width {
    min-width: 100px;
  }

  .star-rating {
    display: flex;
    align-items: center;
    gap: 0.125rem; /* gap-0.5 */
    margin-right: 0.5rem; /* mr-2 */
  }

  .star-rating:not(.has-value) {
    animation: encourage-rating 3s ease-in-out infinite;
  }

  .star-button {
    cursor: pointer;
    transition: transform 0.15s cubic-bezier(0.4, 0, 0.2, 1); /* transition-transform duration-150 */
    background: none;
    border: none;
    padding: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    min-width: 0;
    min-height: 0;
  }

  .star-button:hover {
    transform: scale(1.1); /* hover:scale-110 */
  }

  .star-button:focus {
    outline: none; /* focus:outline-none */
  }

  .star-button:disabled {
    cursor: not-allowed;
  }

  .star-icon {
    width: 1rem; /* w-4 */
    height: 1rem; /* h-4 */
    transition: color 0.2s cubic-bezier(0.4, 0, 0.2, 1); /* transition-colors duration-200 */
  }

  .star-icon.loading {
    color: var(--color-beige);
    animation: pulse 1.5s cubic-bezier(0.4, 0, 0.6, 1) infinite;
  }

  .star-icon.hover {
    color: var(--color-beige);
  }

  .star-icon.user {
    color: var(--color-beige);
  }

  .star-icon.filled {
    color: var(--color-secondary);
  }

  .star-icon.empty {
    color: var(--color-gray-300);
  }

  .rating-info {
    display: flex;
    align-items: center;
  }

  .rating-value {
    font-weight: 500; /* font-medium */
    color: var(--color-gray-800);
  }

  .user-rated-indicator {
    margin-left: 0.25rem; /* ml-1 */
    animation: pulse-once 1s ease-in-out;
  }

  .check-icon {
    width: 0.75rem; /* w-3 */
    height: 0.75rem; /* h-3 */
    color: var(--color-primary);
  }

  .separator {
    color: var(--color-gray-400);
    margin-left: 0.375rem; /* mx-1.5 */
    margin-right: 0.375rem;
  }

  .review-count {
    color: var(--color-gray-600);
    font-size: 0.75rem; /* text-xs */
  }

  .your-rating-text {
    color: var(--color-gray-600);
    font-size: 0.75rem; /* text-xs */
  }

  .rate-text {
    margin-left: 0.25rem; /* ml-1 */
    color: var(--color-gray-600);
    font-size: 0.75rem; /* text-xs */
  }

  .invite-rating {
    font-size: 0.875rem; /* text-sm */
    color: var(--color-gray-600);
    font-weight: 500; /* font-medium */
  }

  .invite-content {
    display: inline-flex; /* inline-flex */
    align-items: center;
  }

  .invite-icon {
    width: 0.75rem; /* w-3 */
    height: 0.75rem; /* h-3 */
    margin-left: 0.25rem; /* ml-1 */
    color: var(--color-beige);
    animation: pulse-subtle 2s infinite ease-in-out;
  }

  /* Animaciones */
  .just-rated {
    animation: highlight 1.5s ease-out;
  }

  @keyframes highlight {
    0% { 
      background-color: var(--color-secondary-md); 
    }
    100% { 
      background-color: var(--color-gray-100); 
    }
  }

  @keyframes pulse {
    0%, 100% { 
      opacity: 1; 
    }
    50% { 
      opacity: 0.5; 
    }
  }

  @keyframes pulse-once {
    0% { 
      opacity: 0; 
      transform: scale(0.5); 
    }
    50% { 
      opacity: 1; 
      transform: scale(1.2); 
    }
    100% { 
      opacity: 1; 
      transform: scale(1); 
    }
  }

  @keyframes pulse-subtle {
    0%, 100% { 
      transform: scale(1); 
    }
    50% { 
      transform: scale(1.1); 
    }
  }

  @keyframes encourage-rating {
    0%, 100% { 
      opacity: 0.9; 
    }
    50% { 
      opacity: 1; 
      transform: scale(1.02); 
    }
  }
  /* Descomenta uno por uno hasta que se solucione */


  
</style>

