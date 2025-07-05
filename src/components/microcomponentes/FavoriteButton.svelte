<script lang="ts">
  import { onMount } from 'svelte';
  import unifiedFavoritesStore from '../../stores/unifiedFavoritesStore';

  export let id: string | number;
  export let title: string;
  export let isSaved: boolean = false;
  
  // Variable local para controlar el estado de carga
  let isToggling = false;
  
  // Variable para controlar la dirección de la animación
  let isTogglingToSaved = false;

  // Variables reactivas para el estado de carga
  let isTogglingFavorite = false;

  async function toggleSavedState(e: Event) {
    // Prevenir propagación del evento
    e.stopPropagation();
    
    // Evitar múltiples clics mientras se procesa
    if (isToggling || isTogglingFavorite) return;
    
    try {
      // Activar estado de carga y guardar la dirección del cambio
      isToggling = true;
      isTogglingToSaved = !isSaved;
      
      // Usar el store unificado que maneja automáticamente la lógica
      await unifiedFavoritesStore.toggleFavorite(id);
    } catch (error) {
      console.error('Error al cambiar estado de favorito:', error);
    } finally {
      // Desactivar estado de carga después de una breve demora 
      // para permitir que la animación complete
      setTimeout(() => {
        isToggling = false;
      }, 300);
    }
  }

  onMount(() => {
    let unsubscribeFavorite: (() => void) | undefined;
    let unsubscribeToggling: (() => void) | undefined;

    // Suscribirse al estado de favorito
    unsubscribeFavorite = unifiedFavoritesStore.isDishFavorite(id).subscribe(isFavorite => {
      if (isFavorite !== isSaved) {
        isSaved = isFavorite;
      }
    });

    // Suscribirse al estado de carga
    unsubscribeToggling = unifiedFavoritesStore.isTogglingFavorite(id).subscribe(toggling => {
      isTogglingFavorite = toggling;
    });
    
    // Limpiar las suscripciones cuando el componente se desmonte
    return () => {
      if (unsubscribeFavorite) unsubscribeFavorite();
      if (unsubscribeToggling) unsubscribeToggling();
    };
  });
</script>

<div class="saved-container" data-item-id={id} data-item-title={title} data-is-saved={isSaved}>
  <button 
    aria-label="toggle-favorite" 
    type="button" 
    on:click={(e) => toggleSavedState(e)} 
    class="saved-button {(isToggling || isTogglingFavorite) ? 'loading' : ''}"
    data-item-title={title}
    data-is-saved={isSaved}
    data-item-id={id}
    disabled={isToggling || isTogglingFavorite}
  >
    <div class="heart-container">
      <!-- Corazón principal (siempre visible) -->
      <svg 
        class="heart-icon {isSaved ? 'saved' : 'unsaved'} {(isToggling || isTogglingFavorite) ? 'toggling' : ''}" 
        fill={isSaved ? 'currentColor' : 'none'} 
        stroke="currentColor" 
        viewBox="0 0 24 24"
      >
        <path 
          stroke-linecap="round" 
          stroke-linejoin="round" 
          stroke-width="2" 
          d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
        ></path>
      </svg>
      
      <!-- Efecto de onda/pulso cuando está cargando -->
      {#if isToggling || isTogglingFavorite}
        <div class="pulse-effect {isTogglingToSaved ? 'adding' : 'removing'}">
          <svg 
            class="pulse-icon {isTogglingToSaved ? 'pulse-add' : 'pulse-remove'}" 
            fill={isTogglingToSaved ? 'currentColor' : 'none'} 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path 
              stroke-linecap="round" 
              stroke-linejoin="round" 
              stroke-width="2" 
              d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
            ></path>
          </svg>
        </div>
      {/if}
    </div>
  </button>
</div>

<style>
  /* Variables CSS nativas */
  :root {
    --primary-color: #eb0000;
    --color-white: #ffffff;
    --color-white-80: rgba(255, 255, 255, 0.8);
    --color-gray-500: #6b7280;
    --color-gray-400: #9ca3af;
    --transition-duration: 0.3s;
    --animation-duration: 0.6s;
    --button-padding: 0.5rem;
    --icon-size: 1.5rem;
    --ease-out-cubic: cubic-bezier(0.25, 0.46, 0.45, 0.94);
    --ease-transition: cubic-bezier(0.4, 0, 0.2, 1);
  }

  .saved-container {
    display: inline-flex;
    align-items: center;
  }

  .saved-button {
    background-color: var(--color-white-80);
    backdrop-filter: blur(4px);
    padding: var(--button-padding);
    border-radius: 50%;
    box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
    cursor: pointer;
    overflow: hidden;
    border: none;
    transition: all var(--transition-duration) var(--ease-transition);
  }

  .saved-button:hover {
    background-color: var(--color-white);
  }

  .saved-button:disabled {
    cursor: not-allowed;
  }

  .saved-button.loading {
    pointer-events: none;
  }

  .heart-container {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .heart-icon {
    width: var(--icon-size);
    height: var(--icon-size);
    transition: all var(--transition-duration) var(--ease-transition);
  }

  .heart-icon.unsaved {
    color: var(--color-gray-500);
  }

  .heart-icon.unsaved:hover {
    color: #eb0000;
  }

  .heart-icon.saved {
    color: #eb0000 ;
    fill: currentColor;
  }

  .heart-icon.toggling {
    transform: scale(1.05);
  }

  .pulse-effect {
    position: absolute;
    top: 0;
    right: 0;
    bottom: 0;
    left: 0;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .pulse-effect.adding {
    animation: heart-pulse-in var(--animation-duration) var(--ease-out-cubic);
  }

  .pulse-effect.removing {
    animation: heart-pulse-out var(--animation-duration) var(--ease-out-cubic);
  }

  .pulse-icon {
    width: var(--icon-size);
    height: var(--icon-size);
  }

  .pulse-icon.pulse-add {
    color: var(--primary-color);
  }

  .pulse-icon.pulse-remove {
    color: var(--color-gray-400);
  }

  /* Animaciones */
  @keyframes heart-pulse-in {
    0% {
      opacity: 0;
      transform: scale(0.6);
    }
    50% {
      opacity: 0.8;
      transform: scale(1.4);
    }
    100% {
      opacity: 0;
      transform: scale(1.8);
    }
  }

  @keyframes heart-pulse-out {
    0% {
      opacity: 0.8;
      transform: scale(1);
    }
    50% {
      opacity: 0.4;
      transform: scale(1.2);
    }
    100% {
      opacity: 0;
      transform: scale(0.8);
    }
  }

  /* Estados responsivos y accesibilidad */
  @media (prefers-reduced-motion: reduce) {
    .heart-icon,
    .pulse-effect {
      animation: none !important;
      transition: none !important;
    }
  }

  /* Focus states para accesibilidad */
  .saved-button:focus {
    outline: 2px solid var(--primary-color);
    outline-offset: 2px;
  }

  .saved-button:focus:not(:focus-visible) {
    outline: none;
  }
</style>