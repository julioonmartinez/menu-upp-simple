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
  let imageLoaded = $state(false); // Usar $state para asegurar reactividad
  let imageError = $state(false); // Usar $state para asegurar reactividad
  let quantity = 1;
  let showOptions = false;
  let addingToCart = false;
  let selectedOptions: DishOption[] = [];
  const isDishFavoriteStore = dishRatingStore.isDishFavorite(item.id!);
  console.log('isDishFavoriteStore', item, $isDishFavoriteStore );
  
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
    
    // Debug: Log del estado inicial de la imagen
    console.log('Component mounted:', item.name, 'Image:', item.image, 'ImageLoaded:', imageLoaded, 'ImageError:', imageError);
    
    // Timeout de seguridad para evitar que las imágenes se queden en estado de carga indefinidamente
    const imageTimeout = setTimeout(() => {
      if (!imageLoaded && !imageError && item.image && item.image !== '') {
        console.log('Image timeout reached for:', item.name);
        imageError = true;
      }
    }, 5000); // 5 segundos de timeout
    
    // Suscribirse al store para mantener actualizado el contador de favoritos
    const unsubscribe = favoritesStore.subscribe(state => {
      const dish = state.allDishes.find(d => d.id === item.id);
      if (dish && typeof dish.favorites === 'number') {
        favoritesCount = dish.favorites;
      }
    });
    
    // Limpiar la suscripción cuando el componente se desmonte
    return () => {
      clearTimeout(imageTimeout);
      unsubscribe();
    };
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
    console.log('Image loaded successfully:', item.name, item.image);
    console.log('Before setting imageLoaded:', imageLoaded, imageError);
    imageLoaded = true;
    imageError = false;
    console.log('After setting imageLoaded:', imageLoaded, imageError);
  }
  
  // Función para manejar errores de carga de imagen
  function handleImageError() {
    console.log('Image failed to load:', item.name, item.image);
    console.log('Before setting imageError:', imageLoaded, imageError);
    imageError = true;
    imageLoaded = false;
    console.log('After setting imageError:', imageLoaded, imageError);
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
    const index = selectedOptions.findIndex(opt => opt.name === option.name);
    
    if (index >= 0) {
      selectedOptions = selectedOptions.filter(opt => opt.name !== option.name);
    } else {
      selectedOptions = [...selectedOptions, {...option}];
    }
    
    // Registrar interacción de analytics
    if (item.id) {
      recordLinkClick(`dish-option-${option.name}-${item.id}`);
    }
  }
  
  // Comprobar si una opción está seleccionada
  function isOptionSelected(optionName: string) {
    return selectedOptions.some(opt => opt.name === optionName);
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
    <!-- Debug: imageLoaded={imageLoaded}, imageError={imageError} -->
    {#if !item.image || item.image === ''}
      <div class="placeholder-icon-card" in:fade={{ duration: 300, delay: 100 }}>
        <i class="fa-solid fa-utensils"></i>
      </div>
    {:else if imageError}
      <div class="image-placeholder error">
        <i class="fa-solid fa-image"></i>
      </div>
    {:else}
      <img 
        src={item.image} 
        alt={item.name} 
        class="dish-image {imageLoaded ? 'loaded' : 'loading'}"
        onload={handleImageLoad}
        onerror={handleImageError}
        in:fade={{ duration: 400, delay: 100 }}
        out:fade={{ duration: 200 }}
      />
      {#if !imageLoaded}
        <div class="image-placeholder">
          <div class="loading-spinner">
            <!-- <i class="fa-solid fa-spinner fa-spin"></i> -->
          </div>
        </div>
      {/if}
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
                    checked={isOptionSelected(option.name)} 
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
/* Componente principal - Clickeable */
.bento-card {
  height: 100%;
  background-color: var(--bg-primary);
  border-radius: var(--radius-xl);
  box-shadow: var(--shadow-sm);
  transition: all var(--transition-normal);
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
  box-shadow: var(--shadow-lg);
  transform: translateY(-3px);
}

.clickable-card:focus {
  outline: 2px solid var(--primary-color);
  outline-offset: 2px;
}

/* Evitar que los elementos de acción activen el modal */
.action-button {
  position: relative;
  z-index: var(--z-popover);
}

/* Badge de descuento */
.discount-badge {
  position: absolute;
  top: 0;
  left: 0;
  background-color: var(--error);
  color: var(--text-inverse);
  padding: var(--spacing-xs) var(--spacing-md);
  border-bottom-right-radius: var(--radius-md);
  z-index: var(--z-popover);
  font-weight: var(--weight-medium);
  font-size: var(--font-sm);
  box-shadow: var(--shadow-xs);
}

/* Contenedor de imagen - Mejorado */
.image-container {
  position: relative;
  height: 12rem;
  overflow: hidden;
  background-color: var(--bg-tertiary);
  display: flex;
  align-items: center;
  justify-content: center;
}

.image-container.no-image {
  padding: var(--spacing-sm);
}

.dish-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: opacity var(--transition-normal);
  opacity: 0;
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
  background-color: var(--bg-tertiary);
  z-index: 2;
}

.image-placeholder.error {
  background-color: var(--bg-secondary);
  color: var(--text-muted);
}

.image-placeholder.error i {
  font-size: 3rem;
}

.loading-spinner {
  color: var(--text-muted);
  font-size: 2rem;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

.placeholder-icon-card {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  color: var(--text-secondary);
  font-size: 4rem;
  background-color: var(--bg-tertiary);
}

/* Contenedor de favoritos */
.favorites-container {
  position: absolute;
  top: var(--spacing-md);
  right: var(--spacing-md);
  z-index: var(--z-popover);
  display: flex;
  align-items: center;
}

.favorites-counter {
  background-color: rgba(255, 255, 255, 0.8);
  backdrop-filter: var(--backdrop-blur-sm);
  padding: var(--spacing-xs) var(--spacing-sm);
  border-radius: var(--radius-full);
  margin-right: var(--spacing-sm);
  box-shadow: var(--shadow-xs);
  font-size: var(--font-xs);
  font-weight: var(--weight-medium);
  display: flex;
  align-items: center;
}

.heart-icon {
  width: 0.75rem;
  height: 0.75rem;
  color: var(--error);
  margin-right: var(--spacing-xs);
}

.favorites-text {
  color: var(--text-primary);
}

/* Overlay de agotado */
.out-of-stock-overlay {
  position: absolute;
  inset: 0;
  background-color: rgba(0, 0, 0, 0.6);
  backdrop-filter: var(--backdrop-blur-sm);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 5;
}

.out-of-stock-text {
  color: var(--text-inverse);
  font-weight: var(--weight-bold);
  font-size: var(--font-xl);
}

/* Contenido de la tarjeta */
.card-content {
  padding: var(--spacing-2xl);
  flex: 1;
  display: flex;
  flex-direction: column;
}

.header-section {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--spacing-sm);
}

.dish-title {
  font-size: var(--font-2xl);
  font-weight: var(--weight-bold);
  color: var(--text-primary);
  line-height: var(--leading-tight);
  max-width: 70%;
}

.price-container {
  font-weight: var(--weight-bold);
  text-align: right;
  display: flex;
  align-items: center;
  flex-shrink: 0;
}

.original-price {
  font-size: var(--font-sm);
  text-decoration: line-through;
  color: var(--text-muted);
  margin-right: var(--spacing-xs);
}

.discounted-price {
  color: var(--primary-color);
  font-size: var(--font-3xl);
}

.regular-price {
  color: var(--primary-color);
  font-size: var(--font-2xl);
}

.description {
  color: var(--text-secondary);
  margin-bottom: var(--spacing-md);
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  line-height: var(--leading-relaxed);
  font-size: var(--font-base);
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
  margin-bottom: var(--spacing-sm);
  gap: var(--spacing-md);
  flex-wrap: wrap;
}

/* Indicador de rating */
.rating-indicator {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
  background-color: var(--bg-secondary);
  padding: var(--spacing-xs) var(--spacing-sm);
  border-radius: var(--radius-full);
  font-size: var(--font-xs);
  color: var(--text-secondary);
  transition: all var(--transition-fast);
  cursor: pointer;
  flex-shrink: 0;
}

.rating-indicator:hover {
  background-color: var(--bg-accent);
  color: var(--text-primary);
}

.star-icon {
  color: #fbbf24;
  font-size: var(--font-sm);
}

.rating-value {
  font-weight: var(--weight-semibold);
  color: var(--text-primary);
}

.reviews-count {
  font-weight: var(--weight-normal);
  color: var(--text-muted);
  font-size: 0.7rem;
}

/* Indicador de comentarios */
.comments-indicator {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
  background-color: var(--bg-secondary);
  padding: var(--spacing-xs) var(--spacing-sm);
  border-radius: var(--radius-full);
  font-size: var(--font-xs);
  color: var(--text-secondary);
  transition: all var(--transition-fast);
  cursor: pointer;
  flex-shrink: 0;
}

.comments-indicator:hover {
  background-color: var(--bg-accent);
  color: var(--text-primary);
}

.comment-icon {
  color: var(--primary-color);
  font-size: var(--font-sm);
}

.comments-count {
  font-weight: var(--weight-medium);
  min-width: 1rem;
  text-align: center;
}

/* Controles de la tienda */
.store-controls {
  margin-top: var(--spacing-md);
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
}

.options-panel {
  background-color: var(--bg-primary);
  padding: var(--spacing-md);
  border-radius: var(--radius-md);
  border: 1px solid var(--bg-accent);
}

.options-title {
  font-weight: var(--weight-medium);
  font-size: var(--font-sm);
  margin-bottom: var(--spacing-sm);
  color: var(--text-primary);
}

.options-list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
}

.option-item {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  cursor: pointer;
  padding: var(--spacing-xs);
  border-radius: var(--radius-sm);
  transition: background-color var(--transition-fast);
}

.option-item:hover {
  background-color: var(--bg-secondary);
}

.option-checkbox {
  border-radius: var(--radius-sm);
  color: var(--primary-color);
}

.option-checkbox:focus {
  box-shadow: 0 0 0 3px rgba(255, 107, 53, 0.1);
}

.option-name {
  font-size: var(--font-sm);
  flex: 1;
}

.option-price {
  font-size: var(--font-xs);
  color: var(--text-muted);
  font-weight: var(--weight-medium);
}

.quantity-and-options {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--spacing-sm);
}

.quantity-controls {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  background-color: var(--bg-secondary);
  border-radius: var(--radius-md);
  padding: var(--spacing-xs);
}

.quantity-btn {
  width: 2rem;
  height: 2rem;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--radius-sm);
  background-color: var(--bg-primary);
  color: var(--text-primary);
  transition: all var(--transition-fast);
  border: none;
  cursor: pointer;
  box-shadow: var(--shadow-xs);
}

.quantity-btn:hover:not(:disabled) {
  background-color: var(--primary-color);
  color: var(--text-inverse);
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
  font-weight: var(--weight-semibold);
  font-size: var(--font-base);
}

.toggle-options-btn {
  font-size: var(--font-xs);
  color: var(--primary-color);
  font-weight: var(--weight-medium);
  display: flex;
  align-items: center;
  background: none;
  border: none;
  cursor: pointer;
  transition: all var(--transition-fast);
  padding: var(--spacing-xs) var(--spacing-sm);
  border-radius: var(--radius-sm);
}

.toggle-options-btn:hover {
  background-color: rgba(255, 107, 53, 0.1);
}

.toggle-icon {
  width: 1rem;
  height: 1rem;
  margin-left: var(--spacing-xs);
  transition: transform var(--transition-normal);
}

.toggle-icon.rotated {
  transform: rotate(180deg);
}

.add-to-cart-section {
  display: flex;
  align-items: center;
  margin-top: var(--spacing-xs);
}

.add-to-cart-btn {
  flex: 1;
  background: var(--primary-gradient);
  color: var(--text-inverse);
  border: none;
  border-radius: var(--radius-xl);
  padding: var(--spacing-md) var(--spacing-lg);
  font-weight: var(--weight-semibold);
  cursor: pointer;
  transition: all var(--transition-normal);
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  box-shadow: var(--shadow-md);
  min-height: 44px;
}

.add-to-cart-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: var(--primary-glow);
}

.add-to-cart-btn.loading {
  pointer-events: none;
}

.loading-content {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
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
  background-color: var(--bg-accent);
  color: var(--text-muted);
  border: none;
  border-radius: var(--radius-xl);
  padding: var(--spacing-md) var(--spacing-lg);
  font-weight: var(--weight-medium);
  cursor: not-allowed;
  min-height: 44px;
}

/* Responsive mejoras */
@media (max-width: 480px) {
  .dish-title {
    font-size: var(--font-xl);
  }
  
  .regular-price,
  .discounted-price {
    font-size: var(--font-xl);
  }
  
  .description {
    font-size: var(--font-sm);
  }
  
  .card-content {
    padding: var(--spacing-lg);
  }

  .rating-and-comments-container {
    flex-direction: column;
    align-items: flex-start;
    gap: var(--spacing-sm);
  }

  .comments-indicator {
    align-self: flex-end;
  }
}

/* Mejoras visuales para modo oscuro */
@media (prefers-color-scheme: dark) {
  .bento-card {
    box-shadow: var(--shadow-xl);
  }
  
  .image-placeholder,
  .placeholder-icon-card {
    background-color: var(--bg-tertiary);
  }

  .comments-indicator {
    background-color: rgba(55, 65, 81, 0.8);
    color: var(--text-light);
  }

  .comments-indicator:hover {
    background-color: rgba(75, 85, 99, 0.9);
    color: var(--text-primary);
  }
}

/* Transiciones generales para botones */
button {
  transition: all var(--transition-fast);
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
  border-radius: var(--radius-full);
}
</style>