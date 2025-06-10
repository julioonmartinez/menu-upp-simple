<script lang="ts">
  import { onMount, createEventDispatcher } from 'svelte';
  import type { CartItem, Dish, DishOption } from '../../interfaces/dish';
  import RatingDisplay from '../microcomponentes/RatingDisplay.svelte';
  import FavoriteButton from '../microcomponentes/FavoriteButton.svelte';
  import { fly, fade, scale } from 'svelte/transition';
  import { elasticOut, cubicOut } from 'svelte/easing';
  import { cartStore } from '../../stores/cartStore20';
  import { favoritesStore } from '../../stores/favoritesStore';
  import { trackDishInteraction, recordLinkClick } from '../../services/analyticsService';
  
  // Props
  export let item: Dish;
  export let index: number;
  export let storeMode: boolean = false; // Prop para activar el modo tienda
  export let backgroundColor = '#FFFF';
  export let primaryColor = '#2b2b2b';
  export let secondaryColor = 'Ff4500';
  // Variable reactiva para la calificación del usuario
  let userRating = 0;
  let visible = false;
  let quantity = 1;
  let showOptions = false;
  let addingToCart = false;
  let selectedOptions: DishOption[] = [];
  
  
  // Variable reactiva para mantener actualizado el contador de likes
  let favoritesCount = item.favorites || 0;
  
  const dispatch = createEventDispatcher();
  
  onMount(() => {
    // Inicializar opciones seleccionadas si existen
    if (item.options) {
      selectedOptions = item.options.filter(opt => opt.selected).map(opt => ({...opt}));
    }
    
    // Hacer visible con un pequeño delay para la animación
    setTimeout(() => {
      visible = true;
    }, 100);
    
    // Suscribirse al store para mantener actualizado el contador de favoritos
    const unsubscribe = favoritesStore.subscribe(state => {
      const dish = state.allDishes.find(d => d.id === item.id);
      if (dish && typeof dish.favorites === 'number') {
        favoritesCount = dish.favorites;
      }
    });
    
    // Limpiar la suscripción cuando el componente se desmonte
    return unsubscribe;
  });
  
  // Función para formatear el contador de likes
  function formatLikesCount(count: number): string {
    if (count < 1000) {
      return count.toString();
    } else if (count < 10000) {
      // Para números entre 1000 y 9999, mostrar como "1.2K"
      return (count / 1000).toFixed(1).replace(/\.0$/, '') + 'K';
    } else {
      // Para números mayores a 10000, mostrar como "10K" sin decimales
      return Math.floor(count / 1000) + 'K';
    }
  }
  
  // Calcula el precio con descuento si existe
  $: finalPrice = item.discount 
    ? item.price * (1 - item.discount / 100) 
    : item.price;
  
  // Calcula el precio total con opciones
  $: totalPrice = finalPrice + selectedOptions.reduce((sum, opt) => sum + opt.price, 0);
  
  // Función para agregar al carrito
  function addToCart() {
    addingToCart = true;
    if (item.id) {
      // Enviar evento de analytics al agregar al carrito
      trackDishInteraction(item.id.toString(), 'cart_add');
      // También registrar como un clic para mayor consistencia
      recordLinkClick(`dish-cart-add-${item.id}`);
    }
    // Simular un breve retraso para la animación
    setTimeout(() => {
      const cartItem : CartItem = {
        ...item,
        quantity,
        selectedOptions,
        totalPrice: totalPrice * quantity,
        type: 'dish',
        item: item
      };
      
      cartStore.addItem(cartItem);
      
      // Resetear cantidad y mostrar confirmación
      setTimeout(() => {
        addingToCart = false;
        quantity = 1;
        showOptions = false;
        
        // Dispatch event para notificar a componentes padres
        // dispatch('itemAdded', cartItem);
      }, 100);
    }, 300);
  }
  
  // Función para alternar opciones
  function toggleOptions() {
    showOptions = !showOptions;
    // Registrar interacción de analytics
    if (item.id) {
      recordLinkClick(`dish-options-toggle-${item.id}`);
    }
  }
  
  // Función para alternar una opción seleccionada
  function toggleOption(option: DishOption) {
    const index = selectedOptions.findIndex(opt => opt.id === option.id);
    
    if (index >= 0) {
      selectedOptions = selectedOptions.filter(opt => opt.id !== option.id);
    } else {
      selectedOptions = [...selectedOptions, {...option}];
    }
    
    // Registrar interacción de analytics
    if (item.id && option.id) {
      recordLinkClick(`dish-option-${option.id}-${item.id}`);
    }
  }
  
  // Comprobar si una opción está seleccionada
  function isOptionSelected(optionId: string | number) {
    return selectedOptions.some(opt => opt.id === optionId);
  }
</script>

<div 
  class="bento-card group {visible ? 'animate-fade-in' : 'opacity-hidden'}"
  data-item-id={item.id}
  data-animation-delay={index}
  style="--index: {index}; --bg-color:{backgroundColor}; --primary-color: {primaryColor}; --secondaryColor: {secondaryColor}"
  in:fly={{y: 30, delay: index * 50, duration: 500, easing: cubicOut}}
>
  {#if item.discount && storeMode}
    <div class="discount-badge" 
         in:fly={{x: -20, duration: 300, delay: 300 + index * 50}}>
      -{item.discount}%
    </div>
  {/if}

  <div class="image-container {!item.image || item.image === '' ? 'no-image' : ''}">
    {#if item.image && item.image !== ''}
      <img 
        src={item.image} 
        alt={item.name} 
        class="dish-image"
        in:fade={{ duration: 300 }}
        out:fade={{ duration: 200 }}
      />
    {:else}
      <div class="placeholder-icon">
        <i class="fa-solid fa-utensils"></i>
      </div>
    {/if}
    
    <!-- Favorito con contador (solo se muestra cuando hay 5 o más likes) -->
    <div class="favorites-container">
      {#if favoritesCount >= 5}
        <div class="favorites-counter">
          <svg class="heart-icon" fill="currentColor" viewBox="0 0 24 24">
            <path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"></path>
          </svg>
          <span class="favorites-text">{formatLikesCount(favoritesCount)}</span>
        </div>
      {/if}
      <FavoriteButton id={item.id!} title={item.name} isSaved={item.userFav} />
    </div>
    
    {#if storeMode && !item.inStock}
      <div class="out-of-stock-overlay">
        <p class="out-of-stock-text">Agotado</p>
      </div>
    {/if}
  </div>

  <div class="card-content">
    <div class="header-section">
      <h3 class="dish-title">{item.name}</h3>
      <div class="price-container">
        {#if item.discount && storeMode}
          <span class="original-price">${item.price.toFixed(2)}</span>
          <span class="discounted-price">${finalPrice.toFixed(2)}</span>
        {:else}
          <span class="regular-price">${item.price.toFixed(2)}</span>
        {/if}
      </div>
    </div>
    
    <p class="description">{item.description}</p>
    
    <!-- El contenedor flex-grow empuja el contenido hacia arriba -->
    <div class="spacer"></div>
    
    <!-- Componente de valoración independiente con altura fija -->
    <div class="rating-container">
      <RatingDisplay 
        id={item.id!} 
        rating={item.rating || 0} 
        reviewsCount={item.reviewsCount || 0} 
      />
    </div>
    
    {#if storeMode}
      <!-- Modo tienda: Controles de cantidad y opciones -->
      <div class="store-controls">
        {#if showOptions && item.options && item.options.length > 0}
          <div 
            class="options-panel"
            in:fly={{y: -10, duration: 200}}
            out:fly={{y: -10, duration: 150}}
          >
            <h4 class="options-title">Opciones</h4>
            <div class="options-list">
              {#each item.options as option}
                <label class="option-item">
                  <input 
                    type="checkbox" 
                    checked={isOptionSelected(option.id)} 
                    on:change={() => toggleOption(option)}
                    class="option-checkbox"
                  />
                  <span class="option-name">{option.name}</span>
                  <span class="option-price">+${option.price.toFixed(2)}</span>
                </label>
              {/each}
            </div>
          </div>
        {/if}
        
        <div class="quantity-and-options">
          <div class="quantity-controls">
            <button 
              class="quantity-btn"
              on:click={() => quantity = Math.max(1, quantity - 1)}
              disabled={!item.inStock}
            >
              <svg class="quantity-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 12H4" />
              </svg>
            </button>
            
            <span class="quantity-display">{quantity}</span>
            
            <button 
              class="quantity-btn"
              on:click={() => quantity = quantity + 1}
              disabled={!item.inStock}
            >
              <svg class="quantity-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
              </svg>
            </button>
          </div>
          
          {#if item.options && item.options.length > 0}
            <button 
              class="toggle-options-btn"
              on:click={toggleOptions}
            >
              {showOptions ? 'Ocultar opciones' : 'Ver opciones'} 
              <svg class="toggle-icon {showOptions ? 'rotated' : ''}" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
              </svg>
            </button>
          {/if}
        </div>
        
        <div class="add-to-cart-section">
          {#if item.inStock}
            <button 
              class="add-to-cart-btn {addingToCart ? 'loading' : ''}"
              on:click={addToCart}
              disabled={addingToCart}
            >
              {#if addingToCart}
                <span
                  in:scale={{start: 0.5, duration: 400, easing: elasticOut}}
                  class="loading-content"
                >
                  <svg class="loading-spinner" fill="none" viewBox="0 0 24 24">
                    <circle class="loading-circle" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                    <path class="loading-path" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Agregando...
                </span>
              {:else}
                <span>Agregar $ {(totalPrice * quantity).toFixed(2)}</span>
              {/if}
            </button>
          {:else}
            <button class="out-of-stock-btn">Agotado</button>
          {/if}
        </div>
      </div>
    {/if}
  </div>
</div>

<style>
/* Variables CSS para colores (ajusta según tu paleta) */
:root {

  --red-color: #eb0000; ;
  --color-secondary-md: #f3f4f6; /* gray-100 */
  --color-text: #1f2937; /* gray-800 */
  --color-white: #ffffff;
  --color-gray-50: #f9fafb;
  --color-gray-100: #f3f4f6;
  --color-gray-200: #e5e7eb;
  --color-gray-400: #9ca3af;
  --color-gray-500: #6b7280;
  --color-gray-600: #4b5563;
  --color-gray-700: #374151;
  --color-black-60: rgba(0, 0, 0, 0.6);
  --color-white-80: rgba(255, 255, 255, 0.8);
}

/* Componente principal */
.bento-card {
  height: 100%;
  background-color: var(--color-white);
  border-radius: 0.75rem; /* rounded-xl */
  box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05); /* shadow-sm */
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  overflow: hidden;
  position: relative;
  display: flex;
  flex-direction: column;
  will-change: transform, opacity;
  backface-visibility: hidden;
}

.bento-card:hover {
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06); /* hover:shadow-md */
}

.opacity-hidden {
  opacity: 0;
}

.animate-fade-in {
  opacity: 1 !important;
  transform: translateY(0);
  animation: fadeScale 0.5s forwards;
  animation-delay: calc(var(--index) * 0.1s);
}

/* Badge de descuento */
.discount-badge {
  position: absolute;
  top: 0;
  left: 0;
  background-color: var(--red-color);
  color: var(--color-white);
  padding: 0.25rem 0.75rem; /* py-1 px-3 */
  border-bottom-right-radius: 0.5rem; /* rounded-br-lg */
  z-index: 10;
  font-weight: 500; /* font-medium */
  font-size: 0.875rem; /* text-sm */
  box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05); /* shadow-sm */
}

/* Contenedor de imagen */
.image-container {
  position: relative;
  height: 12rem; /* h-48 */
  overflow: hidden;
  background-color: var(--color-secondary);
}

.image-container.no-image {
  display: flex;
  justify-content: center;
  padding: 0.5rem; /* p-2 */
}

.dish-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.group:hover .dish-image {
  transform: scale(1.05); /* group-hover:scale-105 */
}

.placeholder-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  color: var(--color-gray-600);
  font-size: 5.625rem; /* text-9xl */
}

/* Contenedor de favoritos */
.favorites-container {
  position: absolute;
  top: 0.75rem; /* top-3 */
  right: 0.75rem; /* right-3 */
  z-index: 10;
  display: flex;
  align-items: center;
}

.favorites-counter {
  background-color: var(--color-white-80);
  backdrop-filter: blur(4px);
  padding: 0.25rem 0.5rem; /* py-1 px-2 */
  border-radius: 9999px; /* rounded-full */
  margin-right: 0.5rem; /* mr-2 */
  box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
  font-size: 0.75rem; /* text-xs */
  font-weight: 500;
  display: flex;
  align-items: center;
}

.heart-icon {
  width: 0.75rem; /* w-3 */
  height: 0.75rem; /* h-3 */
  color: var(--red-color);
  margin-right: 0.25rem; /* mr-1 */
}

.favorites-text {
  color: var(--color-gray-700);
}

/* Overlay de agotado */
.out-of-stock-overlay {
  position: absolute;
  inset: 0;
  background-color: var(--color-black-60);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
}

.out-of-stock-text {
  color: var(--color-white);
  font-weight: 700; /* font-bold */
  font-size: 1.125rem; /* text-lg */
}

/* Contenido de la tarjeta */
.card-content {
  padding: 1.25rem; /* p-5 */
  flex: 1;
  display: flex;
  flex-direction: column;
}

.header-section {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem; /* mb-2 */
}

.dish-title {
  font-size: 1.25rem; /* text-xl */
  font-weight: 700; /* font-bold */
  color: var(--color-text);
}

.price-container {
  font-weight: 700; /* font-bold */
  text-align: right;
  display: flex;
  align-items: center;
}

.original-price {
  font-size: 0.875rem; /* text-sm */
  text-decoration: line-through;
  color: var(--color-gray-400);
  margin-right: 0.25rem; /* mr-1 */
}

.discounted-price {
  color: var(--primary-color);
  font-size: 1.875rem; /* text-3xl */
}

.regular-price {
  color: var(--primary-color);
  font-size: 1.5rem; /* text-2xl */
}

.description {
  color: var(--color-gray-600);
  margin-bottom: 0.75rem; /* mb-3 */
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.spacer {
  flex-grow: 1;
}

/* Contenedor de rating */
.rating-container {
  min-height: 36px;
  display: flex;
  align-items: end;
}

/* Controles de la tienda */
.store-controls {
  margin-top: 0.75rem; /* mt-3 */
  display: flex;
  flex-direction: column;
  gap: 0.75rem; /* gap-3 */
}

.options-panel {
  background-color: var(--color-gray-50);
  padding: 0.75rem; /* p-3 */
  border-radius: 0.5rem; /* rounded-lg */
}

.options-title {
  font-weight: 500; /* font-medium */
  font-size: 0.875rem; /* text-sm */
  margin-bottom: 0.5rem; /* mb-2 */
  color: var(--color-gray-700);
}

.options-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem; /* space-y-2 */
}

.option-item {
  display: flex;
  align-items: center;
  gap: 0.5rem; /* space-x-2 */
  cursor: pointer;
}

.option-checkbox {
  border-radius: 0.25rem; /* rounded */
  color: var(--red-color);
}

.option-checkbox:focus {
  --tw-ring-color: var(--red-color);
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.option-name {
  font-size: 0.875rem; /* text-sm */
  flex: 1;
}

.option-price {
  font-size: 0.75rem; /* text-xs */
  color: var(--color-gray-500);
}

.quantity-and-options {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.quantity-controls {
  display: flex;
  align-items: center;
  gap: 0.25rem; /* space-x-1 */
}

.quantity-btn {
  width: 2rem; /* w-8 */
  height: 2rem; /* h-8 */
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 9999px; /* rounded-full */
  background-color: var(--color-gray-100);
  color: var(--color-gray-700);
  transition: colors 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  border: none;
  cursor: pointer;
}

.quantity-btn:hover:not(:disabled) {
  background-color: var(--color-gray-200);
}

.quantity-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.quantity-icon {
  width: 1rem; /* w-4 */
  height: 1rem; /* h-4 */
}

.quantity-display {
  width: 2rem; /* w-8 */
  text-align: center;
  font-weight: 500; /* font-medium */
}

.toggle-options-btn {
  font-size: 0.875rem; /* text-sm */
  color: var(--primary-color);
  font-weight: 500; /* font-medium */
  display: flex;
  align-items: center;
  background: none;
  border: none;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.toggle-icon {
  width: 1rem; /* w-4 */
  height: 1rem; /* h-4 */
  margin-left: 0.25rem; /* ml-1 */
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.toggle-icon.rotated {
  transform: rotate(180deg);
}

.add-to-cart-section {
  display: flex;
  align-items: center;
  margin-top: 0.25rem; /* mt-1 */
}

.add-to-cart-btn {
  flex: 1;
  /* Aquí deberías definir los estilos de btn-primary-alt */
  background-color: var(--primary-color);
  color: var(--color-white);
  border: none;
  border-radius: 0.5rem;
  padding: 0.5rem 1rem; /* py-2 */
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
}

.add-to-cart-btn:hover:not(:disabled) {
  background-color: #2563eb; /* Darker shade of primary */
}

.add-to-cart-btn.loading {
  pointer-events: none;
}

.loading-content {
  display: flex;
  align-items: center;
}

.loading-spinner {
  width: 1.25rem; /* w-5 */
  height: 1.25rem; /* h-5 */
  margin-right: 0.5rem; /* mr-2 */
  animation: spin 1s linear infinite;
}

.loading-circle {
  opacity: 0.25;
}

.loading-path {
  opacity: 0.75;
}

.out-of-stock-btn {
  flex: 1;
  /* Aquí deberías definir los estilos de btn-disabled */
  background-color: var(--color-gray-200);
  color: var(--color-gray-500);
  border: none;
  border-radius: 0.5rem;
  padding: 0.5rem 1rem; /* py-2 */
  font-weight: 500;
  cursor: not-allowed;
}

/* Animaciones */
@keyframes fadeScale {
  from {
    opacity: 0;
    transform: scale(0.95) translateY(10px);
  }
  to {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

/* Mejoras visuales para modo oscuro */
@media (prefers-color-scheme: dark) {
  .bento-card {
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.25);
  }
}

/* Transiciones generales para botones */
button {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}
</style>