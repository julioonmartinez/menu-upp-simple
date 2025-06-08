<script>
  // components/Cards/EnhancedDishCard.svelte
  import { onMount } from 'svelte';
  import { fade, fly, scale } from 'svelte/transition';
  import { quintOut, elasticOut } from 'svelte/easing';
  
  // Props
  export let dish;
  export let index = 0;
  export let storeMode = false;
  
  // Estado local
  let isVisible = false;
  let isHovered = false;
  let isLiked = false;
  let currentRating = dish.rating || 0;
  let userRating = 0;
  let isRatingHovered = false;
  let hoveredStar = 0;
  
  // Formatear precio
  const formatPrice = (price) => {
    if (!price) return 'Precio a consultar';
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN'
    }).format(price);
  };
  
  // Generar estrellas para rating
  const generateStars = (rating) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;
    
    for (let i = 1; i <= 5; i++) {
      if (i <= fullStars) {
        stars.push('full');
      } else if (i === fullStars + 1 && hasHalfStar) {
        stars.push('half');
      } else {
        stars.push('empty');
      }
    }
    return stars;
  };
  
  // Manejar clic en favorito
  const handleLikeClick = () => {
    isLiked = !isLiked;
    
    // Aquí integrarías con tu API de favoritos
    window.dispatchEvent(new CustomEvent('dishFavoriteToggle', {
      detail: {
        dishId: dish.id,
        dishName: dish.name,
        isLiked,
        timestamp: Date.now()
      }
    }));
  };
  
  // Manejar rating
  const handleStarClick = (rating) => {
    userRating = rating;
    currentRating = rating;
    
    // Aquí integrarías con tu API de ratings
    window.dispatchEvent(new CustomEvent('dishRated', {
      detail: {
        dishId: dish.id,
        dishName: dish.name,
        rating,
        timestamp: Date.now()
      }
    }));
  };
  
  // Manejar hover en estrellas
  const handleStarHover = (rating) => {
    if (isRatingHovered) {
      hoveredStar = rating;
    }
  };
  
  onMount(() => {
    // Animar entrada con delay basado en index
    setTimeout(() => {
      isVisible = true;
    }, index * 100);
    
    // Track dish view
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            window.dispatchEvent(new CustomEvent('dishViewed', {
              detail: {
                dishId: dish.id,
                dishName: dish.name,
                category: dish.categoryId,
                timestamp: Date.now()
              }
            }));
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.5 }
    );
    
    return () => observer.disconnect();
  });
</script>

<div 
  class="dish-card group"
  class:visible={isVisible}
  on:mouseenter={() => isHovered = true}
  on:mouseleave={() => isHovered = false}
  in:fly={{ y: 50, duration: 600, delay: index * 100, easing: quintOut }}
  data-dish-id={dish.id}
>
  <div class="card-container">
    <!-- Image Container -->
    <div class="image-container">
      <img 
        src={dish.image || '/images/placeholder-dish.jpg'} 
        alt={dish.name}
        class="dish-image"
        loading="lazy"
      />
      
      <!-- Overlay Effects -->
      <div class="image-overlay" class:hovered={isHovered}>
        <div class="overlay-content">
          {#if storeMode}
            <button class="action-btn primary">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-1.5 6M7 13l-1.5-6m0 0L5.4 5M7 13h10m0 0v6a2 2 0 01-2 2H9a2 2 0 01-2-2v-6m8 0V9a2 2 0 00-2-2H9a2 2 0 00-2 2v4.01" />
              </svg>
              Agregar
            </button>
          {:else}
            <button class="action-btn secondary">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
              Ver detalles
            </button>
          {/if}
        </div>
      </div>
      
      <!-- Favorite Button -->
      <button 
        class="favorite-btn"
        class:liked={isLiked}
        on:click={handleLikeClick}
        in:scale={{ duration: 300, easing: elasticOut }}
      >
        <svg class="w-5 h-5" fill={isLiked ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
        </svg>
      </button>
      
      <!-- Price Badge -->
      <div class="price-badge">
        {formatPrice(dish.price)}
      </div>
    </div>
    
    <!-- Content Container -->
    <div class="content-container">
      <!-- Header -->
      <div class="dish-header">
        <h3 class="dish-title">{dish.name}</h3>
        {#if dish.isSpecial}
          <span class="special-badge">
            ⭐ Especial
          </span>
        {/if}
      </div>
      
      <!-- Description -->
      <p class="dish-description">
        {dish.description || 'Delicioso platillo preparado con ingredientes frescos y de la mejor calidad.'}
      </p>
      
      <!-- Rating Section -->
      <div class="rating-section">
        <div class="stars-container">
          <div class="stars-display">
            {#each generateStars(isRatingHovered ? hoveredStar : currentRating) as star, i}
              <button
                class="star {star}"
                on:click={() => handleStarClick(i + 1)}
                on:mouseenter={() => handleStarHover(i + 1)}
                on:mouseenter={() => isRatingHovered = true}
                on:mouseleave={() => isRatingHovered = false}
              >
                ★
              </button>
            {/each}
          </div>
          <span class="rating-text">
            {currentRating.toFixed(1)} ({dish.reviewCount || 0} reseñas)
          </span>
        </div>
      </div>
      
      <!-- Tags -->
      {#if dish.tags && dish.tags.length > 0}
        <div class="tags-container">
          {#each dish.tags.slice(0, 3) as tag}
            <span class="tag">#{tag}</span>
          {/each}
        </div>
      {/if}
      
      <!-- Stock Status (for store mode) -->
      {#if storeMode}
        <div class="stock-status" class:in-stock={dish.inStock} class:out-of-stock={!dish.inStock}>
          <div class="status-indicator"></div>
          <span>{dish.inStock ? 'Disponible' : 'No disponible'}</span>
        </div>
      {/if}
    </div>
  </div>
</div>

<style>
  .dish-card {
    opacity: 0;
    transform: translateY(20px);
    transition: all 0.6s cubic-bezier(0.16, 1, 0.3, 1);
  }
  
  .dish-card.visible {
    opacity: 1;
    transform: translateY(0);
  }
  
  .card-container {
    background: white;
    border-radius: 24px;
    overflow: hidden;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
    transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
    position: relative;
    height: 100%;
    display: flex;
    flex-direction: column;
  }
  
  .dish-card:hover .card-container {
    transform: translateY(-8px);
    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15);
  }
  
  /* Image Container */
  .image-container {
    position: relative;
    height: 200px;
    overflow: hidden;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  }
  
  .dish-image {
    width: 100%;
    height: 100%;
    object-fit: cover;
    transition: transform 0.6s cubic-bezier(0.16, 1, 0.3, 1);
  }
  
  .dish-card:hover .dish-image {
    transform: scale(1.1);
  }
  
  .image-overlay {
    position: absolute;
    inset: 0;
    background: linear-gradient(to bottom, rgba(0,0,0,0) 0%, rgba(0,0,0,0.7) 100%);
    opacity: 0;
    transition: opacity 0.3s ease;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  
  .image-overlay.hovered {
    opacity: 1;
  }
  
  .overlay-content {
    transform: translateY(20px);
    transition: transform 0.3s ease;
  }
  
  .image-overlay.hovered .overlay-content {
    transform: translateY(0);
  }
  
  .action-btn {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 12px 24px;
    border-radius: 50px;
    font-weight: 600;
    font-size: 14px;
    transition: all 0.3s ease;
    border: none;
    cursor: pointer;
  }
  
  .action-btn.primary {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
  }
  
  .action-btn.secondary {
    background: rgba(255, 255, 255, 0.9);
    color: #333;
    backdrop-filter: blur(10px);
  }
  
  .action-btn:hover {
    transform: scale(1.05);
  }
  
  /* Favorite Button */
  .favorite-btn {
    position: absolute;
    top: 16px;
    right: 16px;
    width: 40px;
    height: 40px;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.9);
    backdrop-filter: blur(10px);
    border: none;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: all 0.3s ease;
    color: #666;
  }
  
  .favorite-btn:hover {
    transform: scale(1.1);
    background: rgba(255, 255, 255, 1);
  }
  
  .favorite-btn.liked {
    color: #e11d48;
    background: rgba(255, 255, 255, 1);
  }
  
  /* Price Badge */
  .price-badge {
    position: absolute;
    bottom: 16px;
    left: 16px;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    padding: 8px 16px;
    border-radius: 50px;
    font-weight: 700;
    font-size: 14px;
    backdrop-filter: blur(10px);
  }
  
  /* Content Container */
  .content-container {
    padding: 24px;
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 16px;
  }
  
  .dish-header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 12px;
  }
  
  .dish-title {
    font-size: 18px;
    font-weight: 700;
    color: #1f2937;
    line-height: 1.3;
    margin: 0;
  }
  
  .special-badge {
    background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%);
    color: white;
    padding: 4px 12px;
    border-radius: 50px;
    font-size: 12px;
    font-weight: 600;
    white-space: nowrap;
  }
  
  .dish-description {
    color: #6b7280;
    font-size: 14px;
    line-height: 1.5;
    margin: 0;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
  
  /* Rating Section */
  .rating-section {
    margin-top: auto;
  }
  
  .stars-container {
    display: flex;
    align-items: center;
    gap: 8px;
  }
  
  .stars-display {
    display: flex;
    gap: 2px;
  }
  
  .star {
    background: none;
    border: none;
    font-size: 16px;
    cursor: pointer;
    transition: all 0.2s ease;
    color: #d1d5db;
  }
  
  .star.full {
    color: #fbbf24;
  }
  
  .star.half {
    background: linear-gradient(90deg, #fbbf24 50%, #d1d5db 50%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }
  
  .star:hover {
    transform: scale(1.2);
    color: #fbbf24;
  }
  
  .rating-text {
    font-size: 12px;
    color: #6b7280;
    font-weight: 500;
  }
  
  /* Tags */
  .tags-container {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
  }
  
  .tag {
    background: #f3f4f6;
    color: #6b7280;
    padding: 4px 10px;
    border-radius: 12px;
    font-size: 12px;
    font-weight: 500;
  }
  
  /* Stock Status */
  .stock-status {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 14px;
    font-weight: 600;
  }
  
  .status-indicator {
    width: 8px;
    height: 8px;
    border-radius: 50%;
  }
  
  .stock-status.in-stock {
    color: #10b981;
  }
  
  .stock-status.in-stock .status-indicator {
    background: #10b981;
  }
  
  .stock-status.out-of-stock {
    color: #ef4444;
  }
  
  .stock-status.out-of-stock .status-indicator {
    background: #ef4444;
  }
  
  /* Responsive */
  @media (max-width: 768px) {
    .image-container {
      height: 160px;
    }
    
    .content-container {
      padding: 16px;
      gap: 12px;
    }
    
    .dish-title {
      font-size: 16px;
    }
    
    .action-btn {
      padding: 10px 20px;
      font-size: 13px;
    }
  }
  
  /* Dark mode support */
  @media (prefers-color-scheme: dark) {
    .card-container {
      background: #1f2937;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
    }
    
    .dish-title {
      color: #f9fafb;
    }
    
    .dish-description {
      color: #9ca3af;
    }
    
    .tag {
      background: #374151;
      color: #d1d5db;
    }
  }
</style>