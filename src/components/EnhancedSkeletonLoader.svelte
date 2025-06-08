<script>
  // components/EnhancedSkeletonLoader.svelte
  import { onMount } from 'svelte';
  import { fade } from 'svelte/transition';
  
  // Props
  export let count = 6;
  export let variant = 'card'; // card, list, compact, hero
  export let showText = true;
  export let animated = true;
  
  // Generate array for skeleton items
  $: skeletonItems = Array.from({ length: count }, (_, i) => i);
  
  // Different skeleton variants
  const variants = {
    card: {
      container: 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6',
      item: 'skeleton-card'
    },
    list: {
      container: 'space-y-4',
      item: 'skeleton-list'
    },
    compact: {
      container: 'grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4',
      item: 'skeleton-compact'
    },
    hero: {
      container: 'space-y-8',
      item: 'skeleton-hero'
    }
  };
  
  $: currentVariant = variants[variant] || variants.card;
  
  let mounted = false;
  
  onMount(() => {
    mounted = true;
  });
</script>

{#if mounted}
  <div 
    class="skeleton-loader {currentVariant.container}"
    class:animated
    in:fade={{ duration: 300 }}
  >
    {#each skeletonItems as item, index}
      <div 
        class="skeleton-item {currentVariant.item}"
        style="--delay: {index * 0.1}s"
      >
        {#if variant === 'card'}
          <!-- Card Skeleton -->
          <div class="card-skeleton">
            <div class="skeleton-image"></div>
            <div class="skeleton-content">
              <div class="skeleton-line skeleton-title"></div>
              <div class="skeleton-line skeleton-subtitle"></div>
              <div class="skeleton-text">
                <div class="skeleton-line"></div>
                <div class="skeleton-line skeleton-short"></div>
              </div>
              <div class="skeleton-footer">
                <div class="skeleton-rating">
                  <div class="skeleton-stars">
                    {#each Array(5) as _, i}
                      <div class="skeleton-star"></div>
                    {/each}
                  </div>
                  <div class="skeleton-line skeleton-rating-text"></div>
                </div>
                <div class="skeleton-price"></div>
              </div>
            </div>
          </div>
          
        {:else if variant === 'list'}
          <!-- List Skeleton -->
          <div class="list-skeleton">
            <div class="skeleton-image-small"></div>
            <div class="skeleton-content-list">
              <div class="skeleton-line skeleton-title"></div>
              <div class="skeleton-line skeleton-description"></div>
              <div class="skeleton-meta">
                <div class="skeleton-line skeleton-price"></div>
                <div class="skeleton-line skeleton-rating"></div>
              </div>
            </div>
          </div>
          
        {:else if variant === 'compact'}
          <!-- Compact Skeleton -->
          <div class="compact-skeleton">
            <div class="skeleton-image-compact"></div>
            <div class="skeleton-content-compact">
              <div class="skeleton-line skeleton-title-small"></div>
              <div class="skeleton-line skeleton-price-small"></div>
            </div>
          </div>
          
        {:else if variant === 'hero'}
          <!-- Hero Skeleton -->
          <div class="hero-skeleton">
            <div class="skeleton-avatar"></div>
            <div class="skeleton-hero-content">
              <div class="skeleton-line skeleton-hero-title"></div>
              <div class="skeleton-line skeleton-hero-subtitle"></div>
              <div class="skeleton-hero-text">
                <div class="skeleton-line"></div>
                <div class="skeleton-line"></div>
                <div class="skeleton-line skeleton-short"></div>
              </div>
              <div class="skeleton-buttons">
                <div class="skeleton-button skeleton-button-primary"></div>
                <div class="skeleton-button skeleton-button-secondary"></div>
              </div>
            </div>
          </div>
        {/if}
      </div>
    {/each}
  </div>
{/if}

<style>
  .skeleton-loader {
    opacity: 0;
    animation: fadeIn 0.3s ease-out forwards;
  }
  
  @keyframes fadeIn {
    to {
      opacity: 1;
    }
  }
  
  .skeleton-item {
    opacity: 0;
    animation: slideIn 0.5s ease-out forwards;
    animation-delay: var(--delay, 0s);
  }
  
  @keyframes slideIn {
    from {
      opacity: 0;
      transform: translateY(20px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
  
  /* Base skeleton element */
  .skeleton-line,
  .skeleton-image,
  .skeleton-image-small,
  .skeleton-image-compact,
  .skeleton-avatar,
  .skeleton-star,
  .skeleton-button {
    background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
    background-size: 200% 100%;
    border-radius: 8px;
  }
  
  .animated .skeleton-line,
  .animated .skeleton-image,
  .animated .skeleton-image-small,
  .animated .skeleton-image-compact,
  .animated .skeleton-avatar,
  .animated .skeleton-star,
  .animated .skeleton-button {
    animation: shimmer 1.5s infinite;
  }
  
  @keyframes shimmer {
    0% {
      background-position: -200% 0;
    }
    100% {
      background-position: 200% 0;
    }
  }
  
  /* Card Skeleton */
  .card-skeleton {
    background: white;
    border-radius: 24px;
    overflow: hidden;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
    height: 400px;
    display: flex;
    flex-direction: column;
  }
  
  .skeleton-image {
    height: 200px;
    border-radius: 0;
  }
  
  .skeleton-content {
    padding: 24px;
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 16px;
  }
  
  .skeleton-title {
    height: 24px;
    width: 80%;
  }
  
  .skeleton-subtitle {
    height: 16px;
    width: 60%;
  }
  
  .skeleton-text {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
  
  .skeleton-line {
    height: 14px;
    width: 100%;
  }
  
  .skeleton-short {
    width: 70%;
  }
  
  .skeleton-footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-top: auto;
  }
  
  .skeleton-rating {
    display: flex;
    align-items: center;
    gap: 8px;
  }
  
  .skeleton-stars {
    display: flex;
    gap: 2px;
  }
  
  .skeleton-star {
    width: 16px;
    height: 16px;
    border-radius: 2px;
  }
  
  .skeleton-rating-text {
    width: 60px;
    height: 14px;
  }
  
  .skeleton-price {
    width: 80px;
    height: 20px;
    border-radius: 12px;
  }
  
  /* List Skeleton */
  .list-skeleton {
    display: flex;
    gap: 16px;
    padding: 16px;
    background: white;
    border-radius: 12px;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
  }
  
  .skeleton-image-small {
    width: 80px;
    height: 80px;
    border-radius: 8px;
    flex-shrink: 0;
  }
  
  .skeleton-content-list {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
  
  .skeleton-description {
    width: 90%;
    height: 14px;
  }
  
  .skeleton-meta {
    display: flex;
    gap: 16px;
    margin-top: auto;
  }
  
  /* Compact Skeleton */
  .compact-skeleton {
    background: white;
    border-radius: 16px;
    overflow: hidden;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
    height: 250px;
    display: flex;
    flex-direction: column;
  }
  
  .skeleton-image-compact {
    height: 140px;
    border-radius: 0;
  }
  
  .skeleton-content-compact {
    padding: 16px;
    display: flex;
    flex-direction: column;
    gap: 8px;
    flex: 1;
  }
  
  .skeleton-title-small {
    height: 18px;
    width: 90%;
  }
  
  .skeleton-price-small {
    height: 16px;
    width: 60%;
    margin-top: auto;
  }
  
  /* Hero Skeleton */
  .hero-skeleton {
    text-align: center;
    padding: 40px 20px;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    border-radius: 24px;
    color: white;
  }
  
  .skeleton-avatar {
    width: 120px;
    height: 120px;
    border-radius: 50%;
    margin: 0 auto 24px;
    background: rgba(255, 255, 255, 0.2);
  }
  
  .skeleton-hero-content {
    max-width: 600px;
    margin: 0 auto;
  }
  
  .skeleton-hero-title {
    height: 48px;
    width: 70%;
    margin: 0 auto 16px;
    background: rgba(255, 255, 255, 0.3);
  }
  
  .skeleton-hero-subtitle {
    height: 24px;
    width: 50%;
    margin: 0 auto 32px;
    background: rgba(255, 255, 255, 0.2);
  }
  
  .skeleton-hero-text {
    display: flex;
    flex-direction: column;
    gap: 8px;
    margin-bottom: 32px;
  }
  
  .skeleton-hero-text .skeleton-line {
    height: 16px;
    margin: 0 auto;
    background: rgba(255, 255, 255, 0.2);
  }
  
  .skeleton-buttons {
    display: flex;
    gap: 16px;
    justify-content: center;
    flex-wrap: wrap;
  }
  
  .skeleton-button {
    height: 48px;
    border-radius: 24px;
    background: rgba(255, 255, 255, 0.2);
  }
  
  .skeleton-button-primary {
    width: 200px;
  }
  
  .skeleton-button-secondary {
    width: 150px;
  }
  
  /* Responsive Design */
  @media (max-width: 768px) {
    .card-skeleton {
      height: 350px;
    }
    
    .skeleton-content {
      padding: 16px;
      gap: 12px;
    }
    
    .list-skeleton {
      padding: 12px;
    }
    
    .skeleton-image-small {
      width: 60px;
      height: 60px;
    }
    
    .compact-skeleton {
      height: 220px;
    }
    
    .skeleton-content-compact {
      padding: 12px;
    }
    
    .skeleton-buttons {
      flex-direction: column;
      align-items: center;
    }
    
    .skeleton-button {
      width: 200px;
    }
  }
  
  /* Dark mode support */
  @media (prefers-color-scheme: dark) {
    .skeleton-line,
    .skeleton-image,
    .skeleton-image-small,
    .skeleton-image-compact,
    .skeleton-star,
    .skeleton-button {
      background: linear-gradient(90deg, #374151 25%, #4b5563 50%, #374151 75%);
      background-size: 200% 100%;
    }
    
    .card-skeleton,
    .list-skeleton,
    .compact-skeleton {
      background: #1f2937;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
    }
    
    .skeleton-avatar {
      background: rgba(255, 255, 255, 0.1);
    }
    
    .skeleton-hero-title,
    .skeleton-hero-subtitle,
    .skeleton-hero-text .skeleton-line,
    .skeleton-button {
      background: rgba(255, 255, 255, 0.1);
    }
  }
  
  /* Reduced motion support */
  @media (prefers-reduced-motion: reduce) {
    .skeleton-item {
      animation: none;
      opacity: 1;
    }
    
    .skeleton-loader {
      animation: none;
      opacity: 1;
    }
    
    .skeleton-line,
    .skeleton-image,
    .skeleton-image-small,
    .skeleton-image-compact,
    .skeleton-avatar,
    .skeleton-star,
    .skeleton-button {
      animation: none;
      background: #f0f0f0;
    }
    
    @media (prefers-color-scheme: dark) {
      .skeleton-line,
      .skeleton-image,
      .skeleton-image-small,
      .skeleton-image-compact,
      .skeleton-avatar,
      .skeleton-star,
      .skeleton-button {
        background: #374151;
      }
    }
  }
  
  /* High performance mode for older devices */
  @media (max-width: 480px) and (max-resolution: 150dpi) {
    .animated .skeleton-line,
    .animated .skeleton-image,
    .animated .skeleton-image-small,
    .animated .skeleton-image-compact,
    .animated .skeleton-avatar,
    .animated .skeleton-star,
    .animated .skeleton-button {
      animation: none;
      background: #f0f0f0;
    }
  }
</style>