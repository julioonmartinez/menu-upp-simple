<!-- src/components/restaurant/DishList.svelte -->
<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { dishUtils } from '../../services/index.ts';
  import type { Dish } from '../../interfaces/dish.ts';
  import type { Category } from '../../interfaces/category.ts';

  // Props
  export let dishes: Dish[] = [];
  export let categories: Category[] = [];
  export let searchTerm: string = '';
  export let isDeleting: boolean = false;

  // Event dispatcher
  const dispatch = createEventDispatcher();

  // Local state
  let deletingId: string | null = null;
  let viewMode: 'grid' | 'list' = 'grid';

  // Methods
  function handleEdit(dish: Dish) {
    dispatch('edit', dish);
  }

  function handleDelete(dish: Dish) {
    if (!dish.id) return;
    
    deletingId = dish.id;
    dispatch('delete', { 
      id: dish.id,
      name: dish.name 
    });
    
    // Reset deleting state after a delay
    setTimeout(() => {
      deletingId = null;
    }, 1000);
  }

  function highlightText(text: string, searchTerm: string): string {
    if (!searchTerm.trim()) return text;
    
    const regex = new RegExp(`(${searchTerm})`, 'gi');
    return text.replace(regex, '<mark>$1</mark>');
  }

  function getCategoryName(categoryId: string): string {
    const category = categories.find(c => c.id === categoryId);
    return category?.name || 'Sin categoría';
  }

  function getCategoryColor(categoryId: string): string {
    const category = categories.find(c => c.id === categoryId);
    // Generate a consistent color based on category name
    if (!category) return '#6b7280';
    
    const colors = [
      '#ef4444', '#f97316', '#f59e0b', '#eab308', 
      '#84cc16', '#22c55e', '#10b981', '#14b8a6',
      '#06b6d4', '#0ea5e9', '#3b82f6', '#6366f1',
      '#8b5cf6', '#a855f7', '#d946ef', '#ec4899'
    ];
    
    let hash = 0;
    for (let i = 0; i < category.name.length; i++) {
      hash = category.name.charCodeAt(i) + ((hash << 5) - hash);
    }
    
    return colors[Math.abs(hash) % colors.length];
  }

  function formatPrice(price: number): string {
    return dishUtils.formatPrice(price);
  }

  function formatDiscountedPrice(dish: Dish): string {
    if (!dish.discount || dish.discount <= 0) return formatPrice(dish.price);
    
    const discountedPrice = dishUtils.calculateDiscountedPrice(dish.price, dish.discount);
    return formatPrice(discountedPrice);
  }

  function truncateDescription(description: string, maxLength: number = 120): string {
    return dishUtils.truncateText(description, maxLength);
  }

  function generateStars(rating: number): string {
    return dishUtils.generateStars(rating);
  }

  function isBeingDeleted(dishId: string): boolean {
    return isDeleting && deletingId === dishId;
  }

  function getStockStatusClass(dish: Dish): string {
    return dish.inStock !== false ? 'in-stock' : 'out-of-stock';
  }

  function getStockStatusText(dish: Dish): string {
    return dish.inStock !== false ? 'Disponible' : 'No disponible';
  }
</script>

<div class="dish-list">
  <!-- View Mode Toggle -->
  <div class="view-controls">
    <div class="view-toggle">
      <button
        type="button"
        class="view-btn"
        class:active={viewMode === 'grid'}
        on:click={() => viewMode = 'grid'}
      >
        <svg class="view-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
        </svg>
        Cuadrícula
      </button>
      <button
        type="button"
        class="view-btn"
        class:active={viewMode === 'list'}
        on:click={() => viewMode = 'list'}
      >
        <svg class="view-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 10h16M4 14h16M4 18h16" />
        </svg>
        Lista
      </button>
    </div>

    <div class="dish-count">
      <span class="count-text">
        {dishes.length} platillo{dishes.length !== 1 ? 's' : ''}
      </span>
    </div>
  </div>

  <!-- Dishes Grid/List -->
  <div class="dishes-container" class:grid-view={viewMode === 'grid'} class:list-view={viewMode === 'list'}>
    {#each dishes as dish (dish.id)}
      <div class="dish-card" class:deleting={isBeingDeleted(dish.id || '')}>
        <!-- Dish Image -->
        <div class="dish-image-container">
          {#if dish.image}
            <img 
              src={dish.image} 
              alt={dish.name}
              class="dish-image"
              loading="lazy"
            />
          {:else}
            <div class="dish-image-placeholder">
              <svg class="placeholder-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
          {/if}

          <!-- Stock Status Badge -->
          <div class="stock-badge {getStockStatusClass(dish)}">
            {getStockStatusText(dish)}
          </div>

          <!-- Discount Badge -->
          {#if dish.discount && dish.discount > 0}
            <div class="discount-badge">
              -{dish.discount}%
            </div>
          {/if}
        </div>

        <!-- Dish Info -->
        <div class="dish-info">
          <!-- Header -->
          <div class="dish-header">
            <div class="dish-title-section">
              <h4 class="dish-name">
                {@html highlightText(dish.name, searchTerm)}
              </h4>
              
              <!-- Category Badge -->
              <div 
                class="category-badge" 
                style="background-color: {getCategoryColor(dish.categoryId)}20; color: {getCategoryColor(dish.categoryId)}"
              >
                {getCategoryName(dish.categoryId)}
              </div>
            </div>

            <!-- Price Section -->
            <div class="price-section">
              {#if dish.discount && dish.discount > 0}
                <span class="price-original">{formatPrice(dish.price)}</span>
                <span class="price-discounted">{formatDiscountedPrice(dish)}</span>
              {:else}
                <span class="price-current">{formatPrice(dish.price)}</span>
              {/if}
            </div>
          </div>

          <!-- Description -->
          <p class="dish-description">
            {@html highlightText(truncateDescription(dish.description), searchTerm)}
          </p>

          <!-- Stats Row -->
          <div class="dish-stats">
            <!-- Rating -->
            {#if dish.rating > 0}
              <div class="stat-item rating">
                <span class="stars">{generateStars(dish.rating)}</span>
                <span class="rating-value">{dish.rating.toFixed(1)}</span>
                {#if dish.reviewsCount && dish.reviewsCount > 0}
                  <span class="rating-count">({dish.reviewsCount})</span>
                {/if}
              </div>
            {:else}
              <div class="stat-item no-rating">
                <span class="no-rating-text">Sin valoraciones</span>
              </div>
            {/if}

            <!-- Favorites -->
            {#if dish.favorites > 0}
              <div class="stat-item favorites">
                <svg class="stat-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
                <span class="stat-value">{dish.favorites}</span>
              </div>
            {/if}
          </div>

          <!-- Nutritional Info (if available) -->
          {#if dish.nutritionalInfo}
            <div class="nutritional-preview">
              {#if dish.nutritionalInfo.calories}
                <span class="nutrition-item">
                  <svg class="nutrition-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  {dish.nutritionalInfo.calories} cal
                </span>
              {/if}
              
              {#if dish.nutritionalInfo.allergens && dish.nutritionalInfo.allergens.length > 0}
                <span class="nutrition-item allergens">
                  <svg class="nutrition-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                  Contiene alérgenos
                </span>
              {/if}
            </div>
          {/if}
        </div>

        <!-- Dish Actions -->
        <div class="dish-actions">
          <button
            type="button"
            class="action-btn action-edit"
            on:click={() => handleEdit(dish)}
            disabled={isDeleting}
            title="Editar platillo"
          >
            <svg class="action-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            <span class="action-text">Editar</span>
          </button>

          <button
            type="button"
            class="action-btn action-delete"
            on:click={() => handleDelete(dish)}
            disabled={isDeleting}
            title="Eliminar platillo"
          >
            {#if isBeingDeleted(dish.id || '')}
              <svg class="action-icon action-spinner" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span class="action-text">Eliminando...</span>
            {:else}
              <svg class="action-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              <span class="action-text">Eliminar</span>
            {/if}
          </button>
        </div>
      </div>
    {/each}
  </div>
</div>

<style>
  .dish-list {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
  }

  /* View Controls */
  .view-controls {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1rem;
    background-color: #f9fafb;
    border: 1px solid #e5e7eb;
    border-radius: 0.5rem;
  }

  .view-toggle {
    display: flex;
    background-color: #ffffff;
    border: 1px solid #d1d5db;
    border-radius: 0.375rem;
    overflow: hidden;
  }

  .view-btn {
    display: inline-flex;
    align-items: center;
    gap: 0.375rem;
    padding: 0.5rem 0.75rem;
    background-color: #ffffff;
    color: #6b7280;
    border: none;
    font-size: 0.75rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.15s ease-in-out;
  }

  .view-btn.active {
    background-color: #3b82f6;
    color: #ffffff;
  }

  .view-btn:not(.active):hover {
    background-color: #f3f4f6;
    color: #374151;
  }

  .view-icon {
    width: 1rem;
    height: 1rem;
  }

  .dish-count {
    display: flex;
    align-items: center;
  }

  .count-text {
    font-size: 0.875rem;
    color: #6b7280;
    font-weight: 500;
  }

  /* Dishes Container */
  .dishes-container {
    display: grid;
    gap: 1.5rem;
  }

  .dishes-container.grid-view {
    grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  }

  .dishes-container.list-view {
    grid-template-columns: 1fr;
  }

  /* Dish Card */
  .dish-card {
    display: flex;
    background-color: #ffffff;
    border: 1px solid #e5e7eb;
    border-radius: 0.75rem;
    overflow: hidden;
    transition: all 0.15s ease-in-out;
  }

  .grid-view .dish-card {
    flex-direction: column;
  }

  .list-view .dish-card {
    flex-direction: row;
    align-items: stretch;
  }

  .dish-card:hover {
    border-color: #d1d5db;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  }

  .dish-card.deleting {
    opacity: 0.6;
    pointer-events: none;
    background-color: #fef2f2;
    border-color: #fecaca;
  }

  /* Dish Image */
  .dish-image-container {
    position: relative;
    background-color: #f3f4f6;
  }

  .grid-view .dish-image-container {
    width: 100%;
    height: 200px;
  }

  .list-view .dish-image-container {
    width: 200px;
    height: auto;
    flex-shrink: 0;
  }

  .dish-image {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
  }

  .dish-image-placeholder {
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    background-color: #f3f4f6;
  }

  .placeholder-icon {
    width: 3rem;
    height: 3rem;
    color: #9ca3af;
  }

  /* Badges */
  .stock-badge {
    position: absolute;
    top: 0.75rem;
    left: 0.75rem;
    padding: 0.25rem 0.5rem;
    border-radius: 0.375rem;
    font-size: 0.75rem;
    font-weight: 500;
  }

  .stock-badge.in-stock {
    background-color: #dcfce7;
    color: #166534;
  }

  .stock-badge.out-of-stock {
    background-color: #fee2e2;
    color: #991b1b;
  }

  .discount-badge {
    position: absolute;
    top: 0.75rem;
    right: 0.75rem;
    padding: 0.25rem 0.5rem;
    background-color: #dc2626;
    color: #ffffff;
    border-radius: 0.375rem;
    font-size: 0.75rem;
    font-weight: 600;
  }

  /* Dish Info */
  .dish-info {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    padding: 1.25rem;
    flex: 1;
    min-width: 0;
  }

  .list-view .dish-info {
    gap: 0.75rem;
  }

  /* Dish Header */
  .dish-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 1rem;
  }

  .list-view .dish-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.5rem;
  }

  .dish-title-section {
    flex: 1;
    min-width: 0;
  }

  .dish-name {
    font-size: 1.125rem;
    font-weight: 600;
    color: #111827;
    margin: 0 0 0.5rem 0;
    word-break: break-word;
  }

  .list-view .dish-name {
    font-size: 1rem;
    margin-bottom: 0.25rem;
  }

  .category-badge {
    display: inline-flex;
    align-items: center;
    padding: 0.25rem 0.5rem;
    border-radius: 0.375rem;
    font-size: 0.75rem;
    font-weight: 500;
  }

  /* Price Section */
  .price-section {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    gap: 0.25rem;
    flex-shrink: 0;
  }

  .list-view .price-section {
    align-items: flex-start;
  }

  .price-current {
    font-size: 1.25rem;
    font-weight: 700;
    color: #111827;
  }

  .price-original {
    font-size: 0.875rem;
    color: #9ca3af;
    text-decoration: line-through;
  }

  .price-discounted {
    font-size: 1.25rem;
    font-weight: 700;
    color: #dc2626;
  }

  /* Description */
  .dish-description {
    font-size: 0.875rem;
    color: #6b7280;
    margin: 0;
    line-height: 1.5;
    word-break: break-word;
  }

  /* Stats */
  .dish-stats {
    display: flex;
    align-items: center;
    gap: 1rem;
    flex-wrap: wrap;
  }

  .stat-item {
    display: flex;
    align-items: center;
    gap: 0.375rem;
  }

  .stat-item.rating {
    color: #f59e0b;
  }

  .stars {
    font-size: 0.875rem;
    color: #f59e0b;
  }

  .rating-value {
    font-size: 0.875rem;
    font-weight: 600;
    color: #374151;
  }

  .rating-count {
    font-size: 0.75rem;
    color: #9ca3af;
  }

  .no-rating-text {
    font-size: 0.75rem;
    color: #9ca3af;
    font-style: italic;
  }

  .stat-item.favorites {
    color: #dc2626;
  }

  .stat-icon {
    width: 1rem;
    height: 1rem;
  }

  .stat-value {
    font-size: 0.875rem;
    font-weight: 500;
  }

  /* Nutritional Preview */
  .nutritional-preview {
    display: flex;
    align-items: center;
    gap: 1rem;
    flex-wrap: wrap;
  }

  .nutrition-item {
    display: flex;
    align-items: center;
    gap: 0.25rem;
    font-size: 0.75rem;
    color: #6b7280;
  }

  .nutrition-item.allergens {
    color: #dc2626;
  }

  .nutrition-icon {
    width: 0.875rem;
    height: 0.875rem;
  }

  /* Dish Actions */
  .dish-actions {
    display: flex;
    gap: 0.5rem;
    padding: 1rem;
    border-top: 1px solid #e5e7eb;
    flex-shrink: 0;
  }

  .grid-view .dish-actions {
    justify-content: space-between;
  }

  .list-view .dish-actions {
    flex-direction: column;
    width: 120px;
    justify-content: center;
    border-top: none;
    border-left: 1px solid #e5e7eb;
  }

  .action-btn {
    display: inline-flex;
    align-items: center;
    gap: 0.375rem;
    padding: 0.5rem 0.75rem;
    border: 1px solid;
    border-radius: 0.375rem;
    font-size: 0.75rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.15s ease-in-out;
    flex: 1;
    justify-content: center;
  }

  .list-view .action-btn {
    flex: none;
    width: 100%;
  }

  .action-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .action-edit {
    background-color: #ffffff;
    color: #3b82f6;
    border-color: #3b82f6;
  }

  .action-edit:hover:not(:disabled) {
    background-color: #3b82f6;
    color: #ffffff;
  }

  .action-delete {
    background-color: #ffffff;
    color: #dc2626;
    border-color: #dc2626;
  }

  .action-delete:hover:not(:disabled) {
    background-color: #dc2626;
    color: #ffffff;
  }

  .action-icon {
    width: 1rem;
    height: 1rem;
    flex-shrink: 0;
  }

  .action-spinner {
    animation: spin 1s linear infinite;
  }

  .action-text {
    font-size: 0.75rem;
  }

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }

  /* Highlight styles */
  :global(.dish-list mark) {
    background-color: #fef3c7;
    color: #92400e;
    padding: 0.125rem 0.25rem;
    border-radius: 0.25rem;
    font-weight: 500;
  }

  /* Responsive */
  @media (max-width: 768px) {
    .dishes-container.grid-view {
      grid-template-columns: 1fr;
    }

    .list-view .dish-card {
      flex-direction: column;
    }

    .list-view .dish-image-container {
      width: 100%;
      height: 150px;
    }

    .list-view .dish-actions {
      flex-direction: row;
      width: auto;
      border-left: none;
      border-top: 1px solid #e5e7eb;
    }

    .dish-header {
      flex-direction: column;
      align-items: flex-start;
      gap: 0.5rem;
    }

    .price-section {
      align-items: flex-start;
    }

    .view-controls {
      flex-direction: column;
      gap: 1rem;
      align-items: stretch;
    }

    .view-toggle {
      align-self: center;
    }
  }

  @media (max-width: 480px) {
    .dish-info {
      padding: 1rem;
    }

    .dish-actions {
      padding: 0.75rem;
    }

    .action-text {
      display: none;
    }

    .action-btn {
      padding: 0.5rem;
      border-radius: 0.5rem;
    }

    .action-icon {
      width: 1.25rem;
      height: 1.25rem;
    }

    .dish-stats {
      gap: 0.75rem;
    }

    .nutritional-preview {
      gap: 0.75rem;
    }
  }
</style>