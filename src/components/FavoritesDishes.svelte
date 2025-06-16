<script lang="ts">
    import { onMount } from "svelte";
    import type { Dish } from "../interfaces/dish";
    import CardDishSvelte from "./Cards/CardDishSvelte.svelte";
    import { fade, fly } from "svelte/transition";
    import { favoritesStore, favCount, ratingCount } from "../stores/favoritesStore";
  
    //estados para los platillos
    let dishesRating: Dish[] = [];
    let dishesSaved: Dish[] = [];
    let allDishes: Dish[] = [];
    let showFloatingButton: boolean = true
    let loading = true;
    let checked = false;
    let activeTab: 'favorites' | 'ratings' = 'favorites';

    // Props con valores por defecto
    export let backgroundColor = '#FFFFFF';
    export let primaryColor = '#FF4500';
    export let secondaryColor = '#FF4500';
    export let username : string | null = null;
    
    // Computed para asegurar que los colores estén bien formateados
    $: formattedPrimaryColor = primaryColor || '#FF4500';
    $: formattedSecondaryColor = secondaryColor || '#FF4500';
    $: formattedBackgroundColor = backgroundColor || 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)';
    
    // Suscribirse al store para mantener actualizados los datos
    onMount(() => {
        // Suscripción al store
        const unsubscribe = favoritesStore.subscribe(state => {
            // Actualizar las listas desde el store centralizado
            dishesSaved = state.favorites;
            dishesRating = state.ratingsDish;
            allDishes = state.allDishes;
            
            // Marcar como cargado cuando tengamos datos disponibles
            loading = false;
            checked = true;
            
            console.log('FavoritesCollection updated from store:', {
                favoritesCount: dishesSaved.length,
                ratingsCount: dishesRating.length,
                allDishesCount: allDishes.length,
                colors: {
                    primary: formattedPrimaryColor,
                    secondary: formattedSecondaryColor,
                    background: formattedBackgroundColor
                }
            });
        });
        
        // Limpiar suscripción al desmontar
        return unsubscribe;
    });
</script>

<div 
    style="--bg-color: {formattedBackgroundColor}; --primary-color: {formattedPrimaryColor}; --secondary-color: {formattedSecondaryColor};" 
    class="ratings-container" 
    class:active={(dishesRating.length > 0) || (dishesSaved.length > 0)}
>
    {#if loading}
        <div class="loading-container">
            <div class="loader-ring">
                <div class="loader-ring-inner"></div>
            </div>
            <div class="loading-text">Buscando tus platillos favoritos...</div>
        </div>
    {:else if (dishesRating.length > 0) || (dishesSaved.length > 0)}
        <div class="rated-dishes">
            <div class="header-container">
                <h1 class="main-title">Tu Colección</h1>
                <p class="subtitle">Tus platillos favoritos y calificados</p>
                
                <div class="tabs-container">
                    <div class="tabs">
                        <button class="tab-button" on:click={() => activeTab = 'favorites'} class:active={activeTab === 'favorites'}>
                            <i class="fa-solid fa-bookmark"></i><span class="tab-text">Favoritos {dishesSaved.length > 0 ? `(${dishesSaved.length})` : ''}</span>
                        </button>
                        <button class="tab-button" on:click={() => activeTab = 'ratings'} class:active={activeTab === 'ratings'}>
                            <i class="fa-solid fa-star"></i><span class="tab-text">Calificados {dishesRating.length > 0 ? `(${dishesRating.length})` : ''}</span>
                        </button>
                    </div>
                </div>
            </div>

            {#if activeTab === 'favorites'}
                {#if dishesSaved.length > 0}
                    <div class="section-header">
                        <h2 class="section-title"><i class="fa-solid fa-bookmark icon-primary"></i> Guardados</h2>
                        <div class="badge">{dishesSaved.length} {dishesSaved.length === 1 ? 'platillo' : 'platillos'}</div>
                    </div>
                    <div class="dishes-grid">
                        {#each dishesSaved as dish, index (dish.id)}
                            <div in:fly={{y: 20, delay: index * 50, duration: 300}}>
                                <CardDishSvelte 
                                    item={dish} 
                                    index={index} 
                                    storeMode={false}
                                    primaryColor={formattedPrimaryColor}
                                    secondaryColor={formattedSecondaryColor}
                                    backgroundColor={formattedBackgroundColor}
                                />
                            </div>
                        {/each}
                    </div>
                {:else}
                    <div class="empty-container">
                        <div class="empty-state">
                            <div class="icon-container">
                                <i class="fa-solid fa-bookmark empty-icon"></i>
                            </div>
                            <h3 class="empty-title">¡Aún no tienes platos Favoritos!</h3>
                            <p class="empty-description">
                                Explora nuestro menú y guarda tus platillos favoritos para encontrarlos fácilmente después.
                            </p>
                            <a href="/menu" class="explore-button">
                                Explorar el menú
                                <i class="fa-solid fa-arrow-right arrow-margin"></i>
                            </a>
                        </div>
                    </div>
                {/if}
            {:else if activeTab === 'ratings'}
                {#if dishesRating.length > 0}
                    <div class="section-header">
                        <h2 class="section-title"><i class="fa-solid fa-star icon-primary"></i> Calificados</h2>
                        <div class="badge">{dishesRating.length} {dishesRating.length === 1 ? 'platillo' : 'platillos'}</div>
                    </div>
                    <div class="dishes-grid">
                        {#each dishesRating as dish, index (dish.id)}
                            <div in:fly={{y: 20, delay: index * 50, duration: 300}}>
                                <CardDishSvelte 
                                    item={dish} 
                                    index={index} 
                                    storeMode={false}
                                    primaryColor={formattedPrimaryColor}
                                    secondaryColor={formattedSecondaryColor}
                                    backgroundColor={formattedBackgroundColor}
                                />
                            </div>
                        {/each}
                    </div>
                {:else}
                    <div class="empty-container">
                        <div class="empty-state">
                            <div class="icon-container">
                                <i class="fa-solid fa-star empty-icon"></i>
                            </div>
                            <h3 class="empty-title">¡Aún no tienes platillos Calificados!</h3>
                            <p class="empty-description">
                                Explora nuestro menú y dale estrellas a tus platillos favoritos para encontrarlos fácilmente después.
                            </p>
                            <a href="/menu" class="explore-button">
                                Explorar menú
                                <i class="fa-solid fa-arrow-right arrow-margin"></i>
                            </a>
                        </div>
                    </div>
                {/if}
            {/if}
        </div>
    {:else if checked}
        <div class="empty-container">
            <div class="empty-state">
                <div class="icon-container">
                    <i class="fa-solid fa-utensils empty-icon"></i>
                </div>
                <h3 class="empty-title">¡Tu colección está vacía!</h3>
                <p class="empty-description">
                    Aún no tienes platillos calificados ni favoritos. Explora nuestro menú y comienza a crear tu colección personal.
                </p>
                <a href="/menu" class="explore-button">
                    Explorar menú
                    <i class="fa-solid fa-arrow-right arrow-margin"></i>
                </a>
            </div>
        </div>
    {/if}
</div>

{#if showFloatingButton}
    <a 
  href="{username ? `/${username}/menu` : '/' }" 
  class="floating-button"
  in:fly={{ y: 50, duration: 500 }}
  out:fade={{ duration: 300 }}
  style="--primary-color: {formattedPrimaryColor}; --secondary-color: {formattedSecondaryColor};"
>
  <div class="button-content">
    <div class="icon ">
        <i class="fa-solid fa-utensils"></i>
    </div>
    <span class="label">Ver menú</span>
  </div>
  <div class="pulse-effect"></div>
</a>
{/if}
  
<style>
  /* Estilos convertidos de Tailwind a CSS puro */
  .icon-primary {
      color: var(--primary-color);
  }
  
  .arrow-margin {
      margin-left: 0.5rem; /* Equivalente a ml-2 de Tailwind (8px) */
  }

  /* Estilos originales mantenidos */
  .ratings-container {
      min-height: 100vh;
      width: 100%;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 1rem;
      background-color: var(--bg-color);
      overflow-x: hidden;
  }
  
  .ratings-container.active {
      justify-content: flex-start;
      padding-top: 1.5rem;
  }

  .header-container {
      text-align: center;
      margin-bottom: 1.5rem;
      width: 100%;
  }

  .main-title {
      font-size: 1.75rem;
      font-weight: 700;
      color: var(--color-text);
      margin-bottom: 0.25rem;
      position: relative;
      display: inline-block;
  }

  .main-title::after {
      content: "";
      position: absolute;
      bottom: -0.25rem;
      left: 50%;
      transform: translateX(-50%);
      width: 60px;
      height: 3px;
      background-color: var(--primary-color);
      border-radius: 3px;
  }

  .subtitle {
      font-size: 0.9rem;
      color: var(--color-text);
      opacity: 0.8;
      margin-bottom: 1.25rem;
  }

  .tabs-container {
      display: flex;
      justify-content: center;
      margin-bottom: 1rem;
  }

  .tabs {
      display: flex;
      width: 100%;
      max-width: 300px;
      padding: 0.3rem;
      background-color: var(--secondary-color);
      border-radius: 1.75rem;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  }

  .tab-button {
      flex: 1;
      padding: 0.6rem 0.75rem;
      border: none;
      border-radius: 1.5rem;
      cursor: pointer;
      transition: all 0.3s ease;
      font-weight: 500;
      color: var(--color-text);
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.3rem;
      font-size: 0.9rem;
  }

  .tab-button.active {
      background-color: var(--primary-color);
      color: white;
      box-shadow: 0 2px 8px rgba(216, 64, 64, 0.3);
  }

  .section-header {
      display: flex;
      align-items: center;
      margin-bottom: 1rem;
      gap: 0.5rem;
      justify-content: space-between;
  }

  .section-title {
      font-size: 1.2rem;
      color: var(--color-text);
      display: inline-flex;
      align-items: center;
      gap: 0.3rem;
      font-weight: 600;
  }

  .badge {
      background-color: var(--primary-color);
      color: white;
      padding: 0.2rem 0.6rem;
      border-radius: 1rem;
      font-size: 0.8rem;
      font-weight: 500;
      height: 100%;
      display: flex;
      align-items: center;
  }
  
  /* Estilos para el loader */
  .loading-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: 200px;
  }
  
  .loader-ring {
      width: 50px;
      height: 50px;
      border-radius: 50%;
      position: relative;
      padding: 2px;
      background: linear-gradient(0deg, rgba(255,255,255,0) 33%, var(--primary-color) 100%);
      animation: rotate 1.5s linear infinite;
  }
  
  .loader-ring-inner {
      width: 100%;
      height: 100%;
      border-radius: 50%;
      background-color: var(--bg-color);
  }
  
  .loading-text {
      margin-top: 1rem;
      color: var(--color-text);
      font-size: 0.9rem;
      font-weight: 500;
  }
  
  /* Estilos para la lista de platillos */
  .rated-dishes {
      width: 100%;
      max-width: 1200px;
  }
  
  .dishes-grid {
      display: grid;
      gap: 1rem;
      grid-template-columns: repeat(1, 1fr);
  }
  
  /* Estilos para el estado vacío */
  .empty-container {
      display: flex;
      justify-content: center;
      align-items: center;
      width: 100%;
      min-height: 60vh;
      padding: 1rem;
  }
  
  .empty-state {
      background: linear-gradient(135deg, var(--primary-color) 0%, var(--color-primary-dark) 100%);
      border-radius: 1.25rem;
      padding: 2rem 1.5rem;
      text-align: center;
      box-shadow: 0 8px 20px rgba(163, 29, 29, 0.15);
      display: flex;
      flex-direction: column;
      align-items: center;
      width: 100%;
      max-width: 350px;
      transition: all 0.3s ease;
  }
  
  .icon-container {
      background-color: rgba(255, 255, 255, 0.15);
      color: var(--color-text-light);
      width: 70px;
      height: 70px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 1rem;
      border: 3px solid rgba(255, 255, 255, 0.2);
  }
  
  .empty-icon {
      font-size: 1.75rem;
      color: white;
  }
  
  .empty-title {
      font-size: 1.5rem;
      color: var(--color-text-light);
      margin-bottom: 0.5rem;
      font-weight: 600;
  }
  
  .empty-description {
      color: var(--color-text-light);
      opacity: 0.9;
      margin-bottom: 1.5rem;
      line-height: 1.4;
      font-size: 0.95rem;
  }
  
  .explore-button {
      display: flex;
      align-items: center;
      background-color: white;
      color: var(--primary-color);
      padding: 0.75rem 1.25rem;
      border-radius: 2rem;
      font-weight: 600;
      font-size: 0.9rem;
      transition: all 0.3s ease;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  }
  
  .explore-button:hover {
      background-color: var(--bg-color);
      transform: translateY(-2px);
      box-shadow: 0 6px 15px rgba(0, 0, 0, 0.15);
  }
  
  @keyframes rotate {
      0% {
          transform: rotate(0deg);
      }
      100% {
          transform: rotate(360deg);
      }
  }
  
  /* Responsive */
  @media (max-width: 400px) {
      .tab-text {
          display: none;
      }
      
      .tab-button {
          padding: 0.6rem;
      }
      
      .tab-button i {
          font-size: 1.1rem;
      }
  }
  
  @media (min-width: 480px) {
      .main-title {
          font-size: 2rem;
      }
      
      .subtitle {
          font-size: 1rem;
      }
      
      .section-title {
          font-size: 1.4rem;
      }
      
      .empty-state {
          padding: 2.5rem 2rem;
      }
  }
  
  @media (min-width: 640px) {
      .dishes-grid {
          grid-template-columns: repeat(2, 1fr);
          gap: 1.25rem;
      }
      
      .header-container {
          margin-bottom: 2rem;
      }
  }
  
  @media (min-width: 1024px) {
      .dishes-grid {
          grid-template-columns: repeat(3, 1fr);
          gap: 1.5rem;
      }
      
      .ratings-container {
          padding: 2rem;
      }
  }
  
  .floating-button {
    position: fixed;
    bottom: 2rem;
    right: 2rem;
    background-color: var(--primary-color);
    color: white;
    border-radius: 3rem;
    padding: 0.75rem 1.25rem;
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 20;
    overflow: hidden;
    transition: all 0.3s ease;
  }
  
  .floating-button:hover {
    transform: translateY(-5px);
    background-color: var(--primary-color);
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