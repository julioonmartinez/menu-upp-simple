<script>
  // components/MenuSkeletonLoader.svelte
  import { onMount } from 'svelte';
  import { fade } from 'svelte/transition';
  
  // Props
  export let count = 6;
  export let showCategoryHeader = true;
  
  // Generate array for skeleton items
  $: skeletonItems = Array.from({ length: count }, (_, i) => i);
  
  let mounted = false;
  
  onMount(() => {
    mounted = true;
  });
</script>

{#if mounted}
  <div class="menu-skeleton-loader" in:fade={{ duration: 300 }}>
    <!-- Category Header Skeleton -->
    {#if showCategoryHeader}
      <div class="category-header-skeleton">
        <div class="skeleton-title"></div>
        <div class="skeleton-subtitle"></div>
      </div>
    {/if}
    
    <!-- Dishes Grid Skeleton -->
    <div class="dishes-skeleton-grid">
      {#each skeletonItems as item, index}
        <div 
          class="dish-skeleton-card"
          style="--delay: {index * 0.1}s"
        >
          <!-- Image Skeleton -->
          <div class="skeleton-image-container">
            <div class="skeleton-image"></div>
            <!-- Favorite button skeleton -->
            <div class="skeleton-favorite-btn"></div>
            <!-- Price badge skeleton -->
            <div class="skeleton-price-badge"></div>
          </div>
          
          <!-- Content Skeleton -->
          <div class="skeleton-content">
            <!-- Title and special badge -->
            <div class="skeleton-header">
              <div class="skeleton-dish-title"></div>
              <div class="skeleton-special-badge"></div>
            </div>
            
            <!-- Description -->
            <div class="skeleton-description">
              <div class="skeleton-line"></div>
              <div class="skeleton-line skeleton-line-short"></div>
            </div>
            
            <!-- Rating -->
            <div class="skeleton-rating-section">
              <div class="skeleton-stars">
                {#each Array(5) as _}
                  <div class="skeleton-star"></div>
                {/each}
              </div>
              <div class="skeleton-rating-text"></div>
            </div>
            
            <!-- Tags -->
            <div class="skeleton-tags">
              <div class="skeleton-tag"></div>
              <div class="skeleton-tag"></div>
              <div class="skeleton-tag"></div>
            </div>
            
            <!-- Stock status (for store mode) -->
            <div class="skeleton-stock-status">
              <div class="skeleton-stock-indicator"></div>
              <div class="skeleton-stock-text"></div>
            </div>
          </div>
        </div>
      {/each}
    </div>
  </div>
{/if}

<style>
  .menu-skeleton-loader {
    max-width: 1200px;
    margin: 0 auto;
    padding: 2rem 1rem;
  }
  
  /* Category Header Skeleton */
  .category-header-skeleton {
    text-align: center;
    margin-bottom: 2rem;
  }
  
  .skeleton-title {
    height: 2.5rem;
    width: 300px;
    margin: 0 auto 0.5rem;
    background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
    background-size: 200% 100%;
    animation: shimmer 1.5s infinite;
    border-radius: 8px;
  }
  
  .skeleton-subtitle {
    height: 1rem;
    width: 200px;
    margin: 0 auto;
    background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
    background-size: 200% 100%;
    animation: shimmer 1.5s infinite;
    border-radius: 6px;
  }
  
  /* Dishes Grid */
  .dishes-skeleton-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
    gap: 2rem;
  }
  
  .dish-skeleton-card {
    background: white;
    border-radius: 24px;
    overflow: hidden;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
    height: 400px;
    display: flex;
    flex-direction: column;
    opacity: 0;
    animation: fadeInSkeleton 0.5s ease forwards;
    animation-delay: var(--delay, 0s);
  }
  
  @keyframes fadeInSkeleton {
    to {
      opacity: 1;
    }
  }
  
  /* Image Container */
  .skeleton-image-container {
    position: relative;
    height: 200px;
  }
  
  .skeleton-image {
    width: 100%;
    height: 100%;
    background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
    background-size: 200% 100%;
    animation: shimmer 1.5s infinite;
  }
  
  .skeleton-favorite-btn {
    position: absolute;
    top: 16px;
    right: 16px;
    width: 40px;
    height: 40px;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.9);
  }
  
  .skeleton-price-badge {
    position: absolute;
    bottom: 16px;
    left: 16px;
    width: 80px;
    height: 28px;
    border-radius: 50px;
    background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
    background-size: 200% 100%;
    animation: shimmer 1.5s infinite;
  }
  
  /* Content */
  .skeleton-content {
    padding: 24px;
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 16px;
  }
  
  .skeleton-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 12px;
  }
  
  .skeleton-dish-title {
    flex: 1;
    height: 24px;
    background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
    background-size: 200% 100%;
    animation: shimmer 1.5s infinite;
    border-radius: 6px;
  }
  
  .skeleton-special-badge {
    width: 60px;
    height: 20px;
    border-radius: 50px;
    background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
    background-size: 200% 100%;
    animation: shimmer 1.5s infinite;
  }
  
  .skeleton-description {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
  
  .skeleton-line {
    height: 14px;
    background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
    background-size: 200% 100%;
    animation: shimmer 1.5s infinite;
    border-radius: 4px;
  }
  
  .skeleton-line-short {
    width: 70%;
  }
  
  /* Rating Section */
  .skeleton-rating-section {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-top: auto;
  }
  
  .skeleton-stars {
    display: flex;
    gap: 2px;
  }
  
  .skeleton-star {
    width: 16px;
    height: 16px;
    background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
    background-size: 200% 100%;
    animation: shimmer 1.5s infinite;
    border-radius: 2px;
  }
  
  .skeleton-rating-text {
    width: 60px;
    height: 14px;
    background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
    background-size: 200% 100%;
    animation: shimmer 1.5s infinite;
    border-radius: 4px;
  }
  
  /* Tags */
  .skeleton-tags {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
  }
  
  .skeleton-tag {
    width: 50px;
    height: 24px;
    border-radius: 12px;
    background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
    background-size: 200% 100%;
    animation: shimmer 1.5s infinite;
  }
  
  .skeleton-tag:nth-child(2) {
    width: 60px;
  }
  
  .skeleton-tag:nth-child(3) {
    width: 40px;
  }
  
  /* Stock Status */
  .skeleton-stock-status {
    display: flex;
    align-items: center;
    gap: 8px;
  }
  
  .skeleton-stock-indicator {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
    background-size: 200% 100%;
    animation: shimmer 1.5s infinite;
  }
  
  .skeleton-stock-text {
    width: 80px;
    height: 14px;
    background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
    background-size: 200% 100%;
    animation: shimmer 1.5s infinite;
    border-radius: 4px;
  }
  
  /* Shimmer Animation */
  @keyframes shimmer {
    0% {
      background-position: -200% 0;
    }
    100% {
      background-position: 200% 0;
    }
  }
  
  /* Responsive Design */
  @media (max-width: 768px) {
    .menu-skeleton-loader {
      padding: 1rem;
    }
    
    .dishes-skeleton-grid {
      grid-template-columns: 1fr;
      gap: 1.5rem;
    }
    
    .dish-skeleton-card {
      height: 350px;
    }
    
    .skeleton-content {
      padding: 16px;
      gap: 12px;
    }
    
    .skeleton-title {
      width: 250px;
      height: 2rem;
    }
    
    .skeleton-subtitle {
      width: 150px;
    }
  }
  
  @media (max-width: 480px) {
    .dishes-skeleton-grid {
      gap: 1rem;
    }
    
    .skeleton-title {
      width: 200px;
      height: 1.75rem;
    }
    
    .skeleton-subtitle {
      width: 120px;
    }
  }
  
  /* Dark mode support */
  @media (prefers-color-scheme: dark) {
    .dish-skeleton-card {
      background: #1f2937;
    }
    
    .skeleton-image,
    .skeleton-title,
    .skeleton-subtitle,
    .skeleton-dish-title,
    .skeleton-special-badge,
    .skeleton-line,
    .skeleton-star,
    .skeleton-rating-text,
    .skeleton-tag,
    .skeleton-price-badge,
    .skeleton-stock-indicator,
    .skeleton-stock-text {
      background: linear-gradient(90deg, #374151 25%, #4b5563 50%, #374151 75%);
      background-size: 200% 100%;
    }
    
    .skeleton-favorite-btn {
      background: rgba(75, 85, 99, 0.9);
    }
  }
  
  /* Reduced motion support */
  @media (prefers-reduced-motion: reduce) {
    .dish-skeleton-card {
      animation: none;
      opacity: 1;
    }
    
    .skeleton-image,
    .skeleton-title,
    .skeleton-subtitle,
    .skeleton-dish-title,
    .skeleton-special-badge,
    .skeleton-line,
    .skeleton-star,
    .skeleton-rating-text,
    .skeleton-tag,
    .skeleton-price-badge,
    .skeleton-stock-indicator,
    .skeleton-stock-text {
      animation: none;
      background: #f0f0f0;
    }
    
    @media (prefers-color-scheme: dark) {
      .skeleton-image,
      .skeleton-title,
      .skeleton-subtitle,
      .skeleton-dish-title,
      .skeleton-special-badge,
      .skeleton-line,
      .skeleton-star,
      .skeleton-rating-text,
      .skeleton-tag,
      .skeleton-price-badge,
      .skeleton-stock-indicator,
      .skeleton-stock-text {
        background: #374151;
      }
    }
  }
</style>