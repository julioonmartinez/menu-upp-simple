<script>
  // components/EnhancedSkeletonLoader.svelte
  import { onMount } from 'svelte';
  import { fade } from 'svelte/transition';
  
  // Props
  export let count = 6;
  export let variant = 'card'; // card, list, compact, hero
  export let showText = true;
  export let animated = true;

  // Color props with neutral defaults
  export let primaryColor = '#FFFF'; // neutral-500
  export let secondaryColor = '#2b2b2b'; // neutral-100
  
  // Generate array for skeleton items
  $: skeletonItems = Array.from({ length: count }, (_, i) => i);
  
  // Color processing functions
  function hexToRgb(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : { r: 107, g: 114, b: 128 }; // fallback to neutral-500
  }
  
  function rgbToHsl(r, g, b) {
    r /= 255;
    g /= 255;
    b /= 255;
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h, s, l = (max + min) / 2;

    if (max === min) {
      h = s = 0;
    } else {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      switch (max) {
        case r: h = (g - b) / d + (g < b ? 6 : 0); break;
        case g: h = (b - r) / d + 2; break;
        case b: h = (r - g) / d + 4; break;
      }
      h /= 6;
    }
    return { h: h * 360, s: s * 100, l: l * 100 };
  }
  
  // Generate skeleton color palette based on primary and secondary colors
  $: colorPalette = (() => {
    const primaryRgb = hexToRgb(primaryColor);
    const secondaryRgb = hexToRgb(secondaryColor);
    const primaryHsl = rgbToHsl(primaryRgb.r, primaryRgb.g, primaryRgb.b);
    const secondaryHsl = rgbToHsl(secondaryRgb.r, secondaryRgb.g, secondaryRgb.b);
    
    // Create a subtle color palette for skeleton
    const baseColor = `hsl(${primaryHsl.h}, ${Math.min(primaryHsl.s * 0.3, 20)}%, ${Math.max(primaryHsl.l * 0.9, 85)}%)`;
    const shimmerStart = `hsl(${primaryHsl.h}, ${Math.min(primaryHsl.s * 0.2, 15)}%, ${Math.max(primaryHsl.l * 0.85, 80)}%)`;
    const shimmerMid = `hsl(${primaryHsl.h}, ${Math.min(primaryHsl.s * 0.4, 25)}%, ${Math.max(primaryHsl.l * 0.95, 90)}%)`;
    const shimmerEnd = baseColor;
    
    // Dark mode variants
    const darkBaseColor = `hsl(${primaryHsl.h}, ${Math.min(primaryHsl.s * 0.4, 30)}%, ${Math.min(primaryHsl.l * 0.3, 25)}%)`;
    const darkShimmerStart = `hsl(${primaryHsl.h}, ${Math.min(primaryHsl.s * 0.3, 25)}%, ${Math.min(primaryHsl.l * 0.25, 20)}%)`;
    const darkShimmerMid = `hsl(${primaryHsl.h}, ${Math.min(primaryHsl.s * 0.5, 35)}%, ${Math.min(primaryHsl.l * 0.35, 30)}%)`;
    const darkShimmerEnd = darkBaseColor;
    
    // Hero background gradient
    const heroGradientStart = `hsl(${primaryHsl.h}, ${Math.min(primaryHsl.s, 70)}%, ${Math.min(primaryHsl.l, 60)}%)`;
    const heroGradientEnd = `hsl(${(primaryHsl.h + 30) % 360}, ${Math.min(primaryHsl.s, 65)}%, ${Math.min(primaryHsl.l * 0.8, 50)}%)`;
    
    return {
      base: baseColor,
      shimmerStart,
      shimmerMid,
      shimmerEnd,
      darkBase: darkBaseColor,
      darkShimmerStart,
      darkShimmerMid,
      darkShimmerEnd,
      heroGradientStart,
      heroGradientEnd
    };
  })();
  
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
    style="
      --skeleton-base: {colorPalette.base};
      --skeleton-shimmer-start: {colorPalette.shimmerStart};
      --skeleton-shimmer-mid: {colorPalette.shimmerMid};
      --skeleton-shimmer-end: {colorPalette.shimmerEnd};
      --skeleton-dark-base: {colorPalette.darkBase};
      --skeleton-dark-shimmer-start: {colorPalette.darkShimmerStart};
      --skeleton-dark-shimmer-mid: {colorPalette.darkShimmerMid};
      --skeleton-dark-shimmer-end: {colorPalette.darkShimmerEnd};
      --skeleton-hero-gradient-start: {colorPalette.heroGradientStart};
      --skeleton-hero-gradient-end: {colorPalette.heroGradientEnd};
      --primary-color: {primaryColor};
      --secondary-color: {secondaryColor};
    "
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
    background: linear-gradient(90deg, 
      var(--skeleton-shimmer-start) 0%, 
      var(--skeleton-shimmer-mid) 50%, 
      var(--skeleton-shimmer-end) 100%
    );
    background-size: 200% 100%;
    border-radius: 8px;
    transition: background 0.3s ease;
  }
  
  .animated .skeleton-line,
  .animated .skeleton-image,
  .animated .skeleton-image-small,
  .animated .skeleton-image-compact,
  .animated .skeleton-avatar,
  .animated .skeleton-star,
  .animated .skeleton-button {
    animation: shimmer 2s ease-in-out infinite;
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
    background: var(--secondary-color, #ffffff);
    border: 1px solid var(--skeleton-base);
    border-radius: 24px;
    overflow: hidden;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
    height: 400px;
    display: flex;
    flex-direction: column;
    transition: all 0.3s ease;
  }
  
  .skeleton-image {
    height: 200px;
    border-radius: 0;
    background: linear-gradient(135deg, 
      var(--skeleton-shimmer-start) 0%, 
      var(--skeleton-shimmer-mid) 50%, 
      var(--skeleton-shimmer-end) 100%
    );
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
    background: linear-gradient(90deg, 
      var(--primary-color) 0%, 
      color-mix(in srgb, var(--primary-color) 80%, white) 100%
    );
    opacity: 0.6;
  }
  
  /* List Skeleton */
  .list-skeleton {
    display: flex;
    gap: 16px;
    padding: 16px;
    background: var(--secondary-color, #ffffff);
    border: 1px solid var(--skeleton-base);
    border-radius: 12px;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
    transition: all 0.3s ease;
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
    background: var(--secondary-color, #ffffff);
    border: 1px solid var(--skeleton-base);
    border-radius: 16px;
    overflow: hidden;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
    height: 250px;
    display: flex;
    flex-direction: column;
    transition: all 0.3s ease;
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
    background: linear-gradient(135deg, 
      var(--skeleton-hero-gradient-start) 0%, 
      var(--skeleton-hero-gradient-end) 100%
    );
    border-radius: 24px;
    color: white;
    position: relative;
    overflow: hidden;
  }
  
  .hero-skeleton::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(135deg, 
      transparent 0%, 
      rgba(255, 255, 255, 0.1) 50%, 
      transparent 100%
    );
    pointer-events: none;
  }
  
  .skeleton-avatar {
    width: 120px;
    height: 120px;
    border-radius: 50%;
    margin: 0 auto 24px;
    background: rgba(255, 255, 255, 0.2);
    border: 3px solid rgba(255, 255, 255, 0.3);
    position: relative;
    z-index: 1;
  }
  
  .skeleton-hero-content {
    max-width: 600px;
    margin: 0 auto;
    position: relative;
    z-index: 1;
  }
  
  .skeleton-hero-title {
    height: 48px;
    width: 70%;
    margin: 0 auto 16px;
    background: rgba(255, 255, 255, 0.3);
    border-radius: 12px;
  }
  
  .skeleton-hero-subtitle {
    height: 24px;
    width: 50%;
    margin: 0 auto 32px;
    background: rgba(255, 255, 255, 0.2);
    border-radius: 8px;
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
    border-radius: 6px;
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
    border: 2px solid rgba(255, 255, 255, 0.3);
  }
  
  .skeleton-button-primary {
    width: 200px;
    background: rgba(255, 255, 255, 0.3);
  }
  
  .skeleton-button-secondary {
    width: 150px;
  }
  
  /* Dark mode support */
  @media (prefers-color-scheme: dark) {
    .skeleton-line,
    .skeleton-image,
    .skeleton-image-small,
    .skeleton-image-compact,
    .skeleton-star,
    .skeleton-button {
      background: linear-gradient(90deg, 
        var(--skeleton-dark-shimmer-start) 0%, 
        var(--skeleton-dark-shimmer-mid) 50%, 
        var(--skeleton-dark-shimmer-end) 100%
      );
      background-size: 200% 100%;
    }
    
    .skeleton-image {
      background: linear-gradient(135deg, 
        var(--skeleton-dark-shimmer-start) 0%, 
        var(--skeleton-dark-shimmer-mid) 50%, 
        var(--skeleton-dark-shimmer-end) 100%
      );
    }
    
    .card-skeleton,
    .list-skeleton,
    .compact-skeleton {
      background: #1f2937;
      border-color: var(--skeleton-dark-base);
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
    }
    
    .skeleton-price {
      background: linear-gradient(90deg, 
        var(--primary-color) 0%, 
        color-mix(in srgb, var(--primary-color) 70%, black) 100%
      );
      opacity: 0.8;
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
      background: var(--skeleton-base);
    }
    
    @media (prefers-color-scheme: dark) {
      .skeleton-line,
      .skeleton-image,
      .skeleton-image-small,
      .skeleton-image-compact,
      .skeleton-avatar,
      .skeleton-star,
      .skeleton-button {
        background: var(--skeleton-dark-base);
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
      background: var(--skeleton-base);
    }
    
    @media (prefers-color-scheme: dark) {
      .animated .skeleton-line,
      .animated .skeleton-image,
      .animated .skeleton-image-small,
      .animated .skeleton-image-compact,
      .animated .skeleton-avatar,
      .animated .skeleton-star,
      .animated .skeleton-button {
        background: var(--skeleton-dark-base);
      }
    }
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
    
    .hero-skeleton {
      padding: 24px 16px;
    }
    
    .skeleton-avatar {
      width: 80px;
      height: 80px;
      margin-bottom: 16px;
    }
  }
  
  /* Hover effects for interactive feel */
  @media (hover: hover) {
    .card-skeleton:hover,
    .list-skeleton:hover,
    .compact-skeleton:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 30px rgba(0, 0, 0, 0.12);
    }
    
    @media (prefers-color-scheme: dark) {
      .card-skeleton:hover,
      .list-skeleton:hover,
      .compact-skeleton:hover {
        box-shadow: 0 8px 30px rgba(0, 0, 0, 0.4);
      }
    }
  }
</style>