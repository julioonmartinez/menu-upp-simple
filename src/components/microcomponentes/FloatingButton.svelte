<script lang="ts">
    import { onMount } from 'svelte';
    import { fade, fly } from 'svelte/transition';
    
    // Estado para controlar la visibilidad del botón
    let hasRatedDishes = false;
    let isVisible = false;
    let hasSavedItems = false;
    export let colorPrimary = '#Ff4500'
    export let username : string | null = null;
    
    // Verificar si hay platos calificados al montar el componente
    onMount(() => {
      checkRatedDishes();
      checkSavedItems();
      // Escuchar cambios en localStorage (por si el usuario califica un plato mientras navega)
      // window.addEventListener('storage', checkRatedDishes);
      window.addEventListener('dishRatingsUpdated', checkRatedDishes);
      window.addEventListener('savedItemsUpdated', checkSavedItems)
      // Mostrar el botón con un pequeño retraso para la animación
      setTimeout(() => {
        isVisible = true;
      }, 500);
      
      // Limpieza al desmontar
      return () => {
        window.removeEventListener('storage', checkRatedDishes);
      };
    });

    //Función para verificar si hay platillos guardados
    function checkSavedItems(){
      console.log('che2')
      try {
        const savedItemsStr = localStorage.getItem('favoriteItems');
        console.log(savedItemsStr, 'str')

        const savedItems = savedItemsStr ? JSON.parse(savedItemsStr) : [];
        console.log('saved', savedItems)
        hasSavedItems = savedItems && savedItems.length > 0;
        console.log(hasSavedItems)
      } catch(erro){
        console.error('Error al verificar platillos guardados:', erro);
        hasSavedItems = false;
      }
    
    }
    
    // Función para verificar si hay platillos calificados
    function checkRatedDishes() {
      console.log('che')
      try {
        const savedRatingsStr = localStorage.getItem('dishRatingsList');
        const savedRatings = savedRatingsStr ? JSON.parse(savedRatingsStr) : [];
        hasRatedDishes = savedRatings && savedRatings.length > 0;
      } catch (error) {
        console.error('Error al verificar platos calificados:', error);
        hasRatedDishes = false;
      }
    }
    
  </script>
  
  {#if (hasRatedDishes || hasSavedItems ) && isVisible}
    <a 
      href="{username ? `/${username}/favorites` : '/' }" 
      class="floating-button"
      in:fly={{ y: 50, duration: 500 }}
      out:fade={{ duration: 300 }}
      style='--primary-color: {colorPrimary}'
    >
      <div class="button-content">
        <div class="icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </div>
        <span class="label">Ver mis favoritos</span>
      </div>
      <div class="pulse-effect"></div>
    </a>
  {/if}
  
  <style>
    .floating-button {
      position: fixed;
      bottom: 2rem;
      /* left: 2rem; */
      right: 2rem;
      background-color: var(--primary-color);
      color: white;
      border-radius: 3rem;
      padding: 0.75rem 1.25rem;
      box-shadow: 0 4px 20px rgba(232, 188, 188, 0.486);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 20;
      overflow: hidden;
      transition: all 0.3s ease;
    }
    
    .floating-button:hover {
      transform: translateY(-5px);
      /* box-shadow: 0 6px 25px rgba(233, 113, 104, 0.4); */
      /* background-color: var(--color-primary-dark); */
    }
    
    .button-content {
      display: flex;
      align-items: center;
      position: relative;
      z-index: 2;
    }
    
    .icon {
      width: 24px;
      height: 24px;
      margin-right: 0.75rem;
    }
    
    .label {
      font-weight: 500;
      font-size: 1rem;
      white-space: nowrap;
    }
    
    /* Efecto de pulso */
    .pulse-effect {
      position: absolute;
      width: 100%;
      height: 100%;
      background: radial-gradient(circle, rgba(255,255,255,0.3) 0%, rgba(255,255,255,0) 70%);
      border-radius: 50%;
      transform: scale(0);
      animation: pulse 2s infinite;
      z-index: 1;
    }
    
    @keyframes pulse {
      0% {
        transform: scale(0);
        opacity: 0.8;
      }
      100% {
        transform: scale(2);
        opacity: 0;
      }
    }
    
    /* Media query para dispositivos móviles */
    @media (max-width: 768px) {
      .floating-button {
        bottom: 1.5rem;
        right: 1.5rem;
        padding: 0.6rem 1rem;
      }
      
      .icon {
        margin-right: 0.5rem;
      }
      
      .label {
        font-size: 0.9rem;
      }
    }
  </style>