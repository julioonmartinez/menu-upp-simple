<script lang="ts">
  //CardDishDynamic.svelte
  import { onMount, createEventDispatcher } from 'svelte';
  import type { CartItem, Dish, DishOption } from '../../interfaces/dish';
   import { dishRatingStore } from '../../stores/dishRatingStore';
  import FavoriteButton from '../microcomponentes/FavoriteButton.svelte';
  import { fly, fade, scale } from 'svelte/transition';
  import { elasticOut, cubicOut } from 'svelte/easing';
  import { cartStore } from '../../stores/cartStore20';
  import { favoritesStore } from '../../stores/favoritesStore';
  import { openModal } from '../../stores/modalStore';
  import { trackDishInteraction, recordLinkClick } from '../../services/analyticsService';
  
  // Props con valores por defecto
  const {
    item,
    index,
    storeMode = false,
    backgroundColor = '#FFFFFF',
    primaryColor = '#ff6b35',
    secondaryColor = '#FF4500'
  } = $props();
  
  // Variable reactiva para la calificación del usuario
  let userRating = 0;
  let visible = false;
  let imageLoaded = false; // Nueva variable para controlar la carga de imagen
  let quantity = 1;
  let showOptions = false;
  let addingToCart = false;
  let selectedOptions: DishOption[] = [];
  const isDishFavoriteStore = dishRatingStore.isDishFavorite(item.id!);
  
  // Variable reactiva para mantener actualizado el contador de likes
  let favoritesCount = item.favorites || 0;
  
  const dispatch = createEventDispatcher();
  
  const isDishFavorite = $derived($isDishFavoriteStore || false);
  // Computed para asegurar que los colores estén bien formateados
  const formattedPrimaryColor = $derived(() => primaryColor || '#2b2b2b');
  const formattedSecondaryColor = $derived(() => secondaryColor || '#FF4500');
  const formattedBackgroundColor = $derived(() => backgroundColor || '#FFFFFF');
  
  onMount(() => {
    // Inicializar opciones seleccionadas si existen
    if (item.options) {
      selectedOptions = item.options.filter((opt:any) => opt.selected).map((opt:any) => ({...opt}));
    }
    
    // Hacer visible inmediatamente (las transiciones de Svelte manejarán la animación)
    visible = true;
    
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

  // Función para abrir el modal de detalles del platillo
  function showDishDetails(event: Event) {
    // Prevenir que se abra si se hizo click en botones de acción
    const target = event.target as HTMLElement;
    if (target.closest('.action-button')) {
      return;
    }
    
    if (item.id) {
      trackDishInteraction(item.id.toString(), 'view_details');
      recordLinkClick(`dish-details-${item.id}`);
    }
    
    openModal('dish', {
      dish: item
    });
  }
  
  // Función para manejar la carga de la imagen
  function handleImageLoad() {
    imageLoaded = true;
  }
  
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

  // Función para formatear el contador de comentarios
  function formatCommentsCount(count: number): string {
    return formatLikesCount(count);
  }
  
  // Calcula el precio con descuento si existe
  const finalPrice = $derived(() =>
    item.discount
      ? item.price * (1 - item.discount / 100)
      : item.price
  );
  
  // Calcula el precio total con opciones
  const totalPrice = $derived(() =>
    finalPrice() + selectedOptions.reduce((sum, opt) => sum + opt.price, 0)
  );
  
  // Función para agregar al carrito
  function addToCart(event: Event) {
    event.stopPropagation(); // Prevenir que se abra el modal
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
        totalPrice: totalPrice() * quantity,
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
  function toggleOptions(event: Event) {
    event.stopPropagation(); // Prevenir que se abra el modal
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

  // Función para manejar clicks en controles de cantidad
  function handleQuantityChange(event: Event, action: 'increment' | 'decrement') {
    event.stopPropagation(); // Prevenir que se abra el modal
    if (action === 'increment') {
      quantity = quantity + 1;
    } else {
      quantity = Math.max(1, quantity - 1);
    }
  }
</script>

<!-- Card clickeable para abrir modal -->
<div 
  class="bento-card group clickable-card"
  data-item-id={item.id}
  style="--bg-color: {formattedBackgroundColor}; --primary-color: {formattedPrimaryColor}; --secondary-color: {formattedSecondaryColor};"
  in:fly={{y: 30, delay: index * 50, duration: 500, easing: cubicOut}}
  onclick={showDishDetails}
  onkeydown={(e) => e.key === 'Enter' && showDishDetails(e)}
  role="button"
  tabindex="0"
  aria-label="Ver detalles de {item.name}"
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
        class="dish-image {imageLoaded ? 'loaded' : 'loading'}"
        onload={handleImageLoad}
        in:fade={{ duration: 400, delay: 100 }}
        out:fade={{ duration: 200 }}
      />
      <!-- Placeholder mientras carga la imagen -->
      {#if !imageLoaded}
        <div class="image-placeholder">
          <div class="loading-spinner">
            <!-- <i class="fa-solid fa-spinner fa-spin"></i> -->
          </div>
        </div>
      {/if}
    {:else}
      <div class="placeholder-icon-card" in:fade={{ duration: 300, delay: 100 }}>
        <i class="fa-solid fa-utensils"></i>
      </div>
    {/if}
    
    <!-- Favorito con contador (solo se muestra cuando hay 5 o más likes) -->
    <div class="favorites-container action-button" in:fade={{ duration: 300, delay: 200 }}>
      {#if favoritesCount >= 5}
        <div class="favorites-counter">
          <svg class="heart-icon" fill="currentColor" viewBox="0 0 24 24">
            <path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"></path>
          </svg>
          <span class="favorites-text">{formatLikesCount(favoritesCount)}</span>
        </div>
      {/if}
      <FavoriteButton id={item.id!} title={item.name} isSaved={isDishFavorite} />
    </div>
    
    {#if storeMode && !item.inStock}
      <div class="out-of-stock-overlay" in:fade={{ duration: 300 }}>
        <p class="out-of-stock-text">Agotado</p>
      </div>
    {/if}
  </div>

  <div class="card-content" in:fade={{ duration: 400, delay: 150 }}>
    <div class="header-section">
      <h3 class="dish-title">{item.name}</h3>
      <div class="price-container">
        {#if item.discount && storeMode}
          <span class="original-price">${item.price.toFixed(2)}</span>
          <span class="discounted-price">${finalPrice().toFixed(2)}</span>
        {:else}
          <span class="regular-price">${item.price.toFixed(2)}</span>
        {/if}
      </div>
    </div>
    
    <p class="description">{item.description}</p>
    
    <!-- El contenedor flex-grow empuja el contenido hacia arriba -->
    <div class="spacer"></div>
    
    <!-- Indicadores de valoración y comentarios -->
    <div class="rating-and-comments-container">
      <!-- Indicador de rating -->
      {#if item.rating && item.rating > 0}
        <div class="rating-indicator" title="Ver valoraciones">
          <i class="fas fa-star star-icon"></i>
          <span class="rating-value">{item.rating.toFixed(1)}</span>
          {#if item.reviewsCount && item.reviewsCount > 0}
            <span class="reviews-count">({formatCommentsCount(item.reviewsCount)})</span>
          {/if}
        </div>
      {/if}
      
      <!-- Indicador de comentarios -->
      {#if item.reviewsCount && item.reviewsCount > 0}
        <div class="comments-indicator" title="Ver comentarios">
          <i class="fas fa-comment comment-icon"></i>
          <span class="comments-count">{formatCommentsCount(item.reviewsCount)}</span>
        </div>
      {/if}
    </div>
    
    {#if storeMode}
      <!-- Modo tienda: Controles de cantidad y opciones -->
      <div class="store-controls action-button" in:fade={{ duration: 300, delay: 250 }}>
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
                    onchange={() => toggleOption(option)}
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
              onclick={(e) => handleQuantityChange(e, 'decrement')}
              disabled={!item.inStock}
            >
              <svg class="quantity-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 12H4" />
              </svg>
            </button>
            
            <span class="quantity-display">{quantity}</span>
            
            <button 
              class="quantity-btn"
              onclick={(e) => handleQuantityChange(e, 'increment')}
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
              onclick={toggleOptions}
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
              onclick={addToCart}
              disabled={addingToCart}
            >
              {#if addingToCart}
                <span
                  in:scale={{start: 0.5, duration: 400, easing: elasticOut}}
                  class="loading-content"
                >
                  <svg class="loading-spinner-btn" fill="none" viewBox="0 0 24 24">
                    <circle class="loading-circle" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                    <path class="loading-path" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Agregando...
                </span>
              {:else}
                <span>Agregar $ {(totalPrice() * quantity).toFixed(2)}</span>
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
  --red-color: #eb0000;
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

/* Componente principal - Clickeable */
.bento-card {
  height: 100%;
  background-color: var(--bg-primary);
  border-radius: 0.75rem;
  box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  overflow: hidden;
  position: relative;
  display: flex;
  flex-direction: column;
  will-change: transform;
}

.clickable-card {
  cursor: pointer;
}

.clickable-card:hover {
  box-shadow: 0 8px 25px -5px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
  transform: translateY(-3px);
}

.clickable-card:focus {
  outline: 2px solid var(--primary-color);
  outline-offset: 2px;
}

/* Evitar que los elementos de acción activen el modal */
.action-button {
  position: relative;
  z-index: 10;
}

/* Badge de descuento */
.discount-badge {
  position: absolute;
  top: 0;
  left: 0;
  background-color: var(--red-color);
  color: var(--color-white);
  padding: 0.25rem 0.75rem;
  border-bottom-right-radius: 0.5rem;
  z-index: 10;
  font-weight: 500;
  font-size: 0.875rem;
  box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
}

/* Contenedor de imagen - Mejorado */
.image-container {
  position: relative;
  height: 12rem;
  overflow: hidden;
  background-color: var(--bg-tertiary, #f1f5f9);
  display: flex;
  align-items: center;
  justify-content: center;
}

.image-container.no-image {
  padding: 0.5rem;
}

.dish-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  opacity: 1; /* Asegurar que la opacidad inicial sea 1 */
}

.dish-image.loading {
  opacity: 0;
}

.dish-image.loaded {
  opacity: 1;
}

.clickable-card:hover .dish-image {
  transform: scale(1.05);
}

/* Placeholder de imagen mientras carga */
.image-placeholder {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: var(--bg-tertiary, #f1f5f9);
  z-index: 1;
}

.loading-spinner {
  color: var(--text-muted, #64748b);
  font-size: 2rem;
}

.placeholder-icon-card {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  color: var(--color-gray-600);
  font-size: 4rem;
  background-color: var(--bg-tertiary, #f1f5f9);
}

/* Contenedor de favoritos */
.favorites-container {
  position: absolute;
  top: 0.75rem;
  right: 0.75rem;
  z-index: 15;
  display: flex;
  align-items: center;
}

.favorites-counter {
  background-color: var(--color-white-80);
  backdrop-filter: blur(4px);
  padding: 0.25rem 0.5rem;
  border-radius: 9999px;
  margin-right: 0.5rem;
  box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
  font-size: 0.75rem;
  font-weight: 500;
  display: flex;
  align-items: center;
}

.heart-icon {
  width: 0.75rem;
  height: 0.75rem;
  color: var(--red-color);
  margin-right: 0.25rem;
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
  z-index: 5;
}

.out-of-stock-text {
  color: var(--color-white);
  font-weight: 700;
  font-size: 1.125rem;
}

/* Contenido de la tarjeta */
.card-content {
  padding: 1.25rem;
  flex: 1;
  display: flex;
  flex-direction: column;
}

.header-section {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
}

.dish-title {
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--text-primary);
  line-height: 1.2;
  max-width: 70%;
}

.price-container {
  font-weight: 700;
  text-align: right;
  display: flex;
  align-items: center;
  flex-shrink: 0;
}

.original-price {
  font-size: 0.875rem;
  text-decoration: line-through;
  color: var(--color-gray-400);
  margin-right: 0.25rem;
}

.discounted-price {
  color: var(--primary-color);
  font-size: 1.5rem;
}

.regular-price {
  color: var(--primary-color);
  font-size: 1.25rem;
}

.description {
  color: var(--text-secondary);
  margin-bottom: 0.75rem;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  line-height: 1.4;
  font-size: 0.9rem;
}

.spacer {
  flex-grow: 1;
}

/* Contenedor de rating y comentarios */
.rating-and-comments-container {
  min-height: 36px;
  display: flex;
  align-items: center;
  justify-content: flex-start;
  margin-bottom: 0.5rem;
  gap: 0.75rem;
  flex-wrap: wrap;
}

/* Indicador de rating */
.rating-indicator {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  background-color: var(--color-gray-100);
  padding: 0.25rem 0.5rem;
  border-radius: 9999px;
  font-size: 0.75rem;
  color: var(--color-gray-600);
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  cursor: pointer;
  flex-shrink: 0;
}

.rating-indicator:hover {
  background-color: var(--color-gray-200);
  color: var(--color-gray-700);
}

.star-icon {
  color: #fbbf24; /* yellow-400 */
  font-size: 0.875rem;
}

.rating-value {
  font-weight: 600;
  color: var(--color-gray-700);
}

.reviews-count {
  font-weight: 400;
  color: var(--color-gray-500);
  font-size: 0.7rem;
}

/* Indicador de comentarios */
.comments-indicator {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  background-color: var(--color-gray-100);
  padding: 0.25rem 0.5rem;
  border-radius: 9999px;
  font-size: 0.75rem;
  color: var(--color-gray-600);
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  cursor: pointer;
  flex-shrink: 0;
}

.comments-indicator:hover {
  background-color: var(--color-gray-200);
  color: var(--color-gray-700);
}

.comment-icon {
  color: var(--primary-color);
  font-size: 0.875rem;
}

.comments-count {
  font-weight: 500;
  min-width: 1rem;
  text-align: center;
}

/* Controles de la tienda */
.store-controls {
  margin-top: 0.75rem;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.options-panel {
  background-color: var(--color-gray-50);
  padding: 0.75rem;
  border-radius: 0.5rem;
  border: 1px solid var(--color-gray-200);
}

.options-title {
  font-weight: 500;
  font-size: 0.875rem;
  margin-bottom: 0.5rem;
  color: var(--color-gray-700);
}

.options-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.option-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
  padding: 0.25rem;
  border-radius: 0.25rem;
  transition: background-color 0.2s;
}

.option-item:hover {
  background-color: var(--color-gray-100);
}

.option-checkbox {
  border-radius: 0.25rem;
  color: var(--primary-color);
}

.option-checkbox:focus {
  box-shadow: 0 0 0 3px rgba(255, 107, 53, 0.1);
}

.option-name {
  font-size: 0.875rem;
  flex: 1;
}

.option-price {
  font-size: 0.75rem;
  color: var(--color-gray-500);
  font-weight: 500;
}

.quantity-and-options {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
}

.quantity-controls {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background-color: var(--color-gray-100);
  border-radius: 0.5rem;
  padding: 0.25rem;
}

.quantity-btn {
  width: 2rem;
  height: 2rem;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 0.375rem;
  background-color: var(--color-white);
  color: var(--color-gray-700);
  transition: all 0.2s;
  border: none;
  cursor: pointer;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
}

.quantity-btn:hover:not(:disabled) {
  background-color: var(--primary-color);
  color: white;
  transform: scale(1.05);
}

.quantity-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.quantity-icon {
  width: 1rem;
  height: 1rem;
}

.quantity-display {
  width: 2rem;
  text-align: center;
  font-weight: 600;
  font-size: 0.9rem;
}

.toggle-options-btn {
  font-size: 0.8rem;
  color: var(--primary-color);
  font-weight: 500;
  display: flex;
  align-items: center;
  background: none;
  border: none;
  cursor: pointer;
  transition: all 0.2s;
  padding: 0.25rem 0.5rem;
  border-radius: 0.25rem;
}

.toggle-options-btn:hover {
  background-color: rgba(255, 107, 53, 0.1);
}

.toggle-icon {
  width: 1rem;
  height: 1rem;
  margin-left: 0.25rem;
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.toggle-icon.rotated {
  transform: rotate(180deg);
}

.add-to-cart-section {
  display: flex;
  align-items: center;
  margin-top: 0.25rem;
}

.add-to-cart-btn {
  flex: 1;
  background: linear-gradient(135deg, var(--primary-color) 0%, #e55a2b 100%);
  color: var(--color-white);
  border: none;
  border-radius: 0.75rem;
  padding: 0.75rem 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  box-shadow: 0 2px 8px rgba(255, 107, 53, 0.2);
  min-height: 44px;
}

.add-to-cart-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(255, 107, 53, 0.3);
}

.add-to-cart-btn.loading {
  pointer-events: none;
}

.loading-content {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.loading-spinner-btn {
  width: 1.25rem;
  height: 1.25rem;
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
  background-color: var(--color-gray-200);
  color: var(--color-gray-500);
  border: none;
  border-radius: 0.75rem;
  padding: 0.75rem 1rem;
  font-weight: 500;
  cursor: not-allowed;
  min-height: 44px;
}

/* Animaciones */
@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

/* Responsive mejoras */
@media (max-width: 480px) {
  .dish-title {
    font-size: 1.1rem;
  }
  
  .regular-price,
  .discounted-price {
    font-size: 1.1rem;
  }
  
  .description {
    font-size: 0.85rem;
  }
  
  .card-content {
    padding: 1rem;
  }

  .rating-and-comments-container {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.5rem;
  }

  .comments-indicator {
    align-self: flex-end;
  }
}

/* Mejoras visuales para modo oscuro */
@media (prefers-color-scheme: dark) {
  .bento-card {
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.25);
  }
  
  .image-placeholder,
  .placeholder-icon-card {
    background-color: #374151;
  }

  .comments-indicator {
    background-color: rgba(55, 65, 81, 0.8);
    color: #d1d5db;
  }

  .comments-indicator:hover {
    background-color: rgba(75, 85, 99, 0.9);
    color: #f3f4f6;
  }
}

/* Transiciones generales para botones */
button {
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

/* Mejoras de accesibilidad */
@media (prefers-reduced-motion: reduce) {
  .bento-card,
  .dish-image,
  .quantity-btn,
  .add-to-cart-btn,
  .toggle-icon,
  .comments-indicator {
    transition: none;
  }
  
  .loading-spinner-btn {
    animation: none;
  }
  
  .clickable-card:hover {
    transform: none;
  }
  
  .clickable-card:hover .dish-image {
    transform: none;
  }
}

/* Estados de focus mejorados para accesibilidad */
.clickable-card:focus-visible {
  outline: 2px solid var(--primary-color);
  outline-offset: 2px;
}

.comments-indicator:focus-visible {
  outline: 2px solid var(--primary-color);
  outline-offset: 1px;
  border-radius: 9999px;
}
</style>