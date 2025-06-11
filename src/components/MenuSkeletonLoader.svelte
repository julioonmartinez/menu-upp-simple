<script>
  // components/MenuSkeletonLoader.svelte
  import { onMount } from 'svelte';
  import { fade } from 'svelte/transition';
  
  // Props
  export let count = 6;
  export let showCategoryHeader = true;
  export let primaryColor = '#3B82F6'; // Azul por defecto
  export let secondaryColor = '#64748B'; // Gris azulado por defecto
  
  // Generate array for skeleton items
  $: skeletonItems = Array.from({ length: count }, (_, i) => i);
  
  let mounted = false;
  
  onMount(() => {
    mounted = true;
  });

  // Función para convertir hex a RGB
  function hexToRgb(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : { r: 59, g: 130, b: 246 }; // fallback al azul por defecto
  }

  // Función para calcular la luminancia
  function getLuminance(r, g, b) {
    const [rs, gs, bs] = [r, g, b].map(c => {
      c = c / 255;
      return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
  }

  // Determinar si es tema oscuro basado en el color primario
  $: primaryRgb = hexToRgb(primaryColor);
  $: isDarkTheme = getLuminance(primaryRgb.r, primaryRgb.g, primaryRgb.b) < 0.5;

  // Generar colores del skeleton basados en los colores primario y secundario
  $: skeletonColors = (() => {
    const primary = hexToRgb(primaryColor);
    const secondary = hexToRgb(secondaryColor);
    
    if (isDarkTheme) {
      // Para temas oscuros
      return {
        base: `rgba(${primary.r}, ${primary.g}, ${primary.b}, 0.08)`,
        shimmer1: `rgba(${primary.r}, ${primary.g}, ${primary.b}, 0.04)`,
        shimmer2: `rgba(${secondary.r}, ${secondary.g}, ${secondary.b}, 0.12)`,
        shimmer3: `rgba(${primary.r}, ${primary.g}, ${primary.b}, 0.04)`,
        card: `rgba(${primary.r}, ${primary.g}, ${primary.b}, 0.02)`,
        overlay: `rgba(${secondary.r}, ${secondary.g}, ${secondary.b}, 0.15)`
      };
    } else {
      // Para temas claros
      return {
        base: `rgba(${primary.r}, ${primary.g}, ${primary.b}, 0.06)`,
        shimmer1: `rgba(${primary.r}, ${primary.g}, ${primary.b}, 0.03)`,
        shimmer2: `rgba(${secondary.r}, ${secondary.g}, ${secondary.b}, 0.08)`,
        shimmer3: `rgba(${primary.r}, ${primary.g}, ${primary.b}, 0.03)`,
        card: `rgba(255, 255, 255, 0.8)`,
        overlay: `rgba(${secondary.r}, ${secondary.g}, ${secondary.b}, 0.1)`
      };
    }
  })();

  // CSS custom properties reactivas
  $: cssProps = `
    --skeleton-base: ${skeletonColors.base};
    --skeleton-shimmer-1: ${skeletonColors.shimmer1};
    --skeleton-shimmer-2: ${skeletonColors.shimmer2};
    --skeleton-shimmer-3: ${skeletonColors.shimmer3};
    --skeleton-card: ${skeletonColors.card};
    --skeleton-overlay: ${skeletonColors.overlay};
    --primary-color: ${primaryColor};
    --secondary-color: ${secondaryColor};
  `;
</script>

{#if mounted}
  <div class="menu-skeleton-loader" style={cssProps} in:fade={{ duration: 300 }}>
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
    background: linear-gradient(90deg, var(--skeleton-shimmer-1) 25%, var(--skeleton-shimmer-2) 50%, var(--skeleton-shimmer-3) 75%);
    background-size: 200% 100%;
    animation: shimmer 1.8s ease-in-out infinite;
    border-radius: 8px;
  }
  
  .skeleton-subtitle {
    height: 1rem;
    width: 200px;
    margin: 0 auto;
    background: linear-gradient(90deg, var(--skeleton-shimmer-1) 25%, var(--skeleton-shimmer-2) 50%, var(--skeleton-shimmer-3) 75%);
    background-size: 200% 100%;
    animation: shimmer 1.8s ease-in-out infinite;
    animation-delay: 0.2s;
    border-radius: 6px;
  }
  
  /* Dishes Grid */
  .dishes-skeleton-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
    gap: 2rem;
  }
  
  .dish-skeleton-card {
    background: var(--skeleton-card);
    border-radius: 24px;
    overflow: hidden;
    box-shadow: 
      0 4px 20px rgba(0, 0, 0, 0.04),
      0 1px 3px rgba(0, 0, 0, 0.02);
    height: 400px;
    display: flex;
    flex-direction: column;
    opacity: 0;
    animation: fadeInSkeleton 0.6s ease forwards;
    animation-delay: var(--delay, 0s);
    border: 1px solid var(--skeleton-base);
    transition: transform 0.2s ease, box-shadow 0.2s ease;
  }
  
  .dish-skeleton-card:hover {
    transform: translateY(-2px);
    box-shadow: 
      0 8px 30px rgba(0, 0, 0, 0.06),
      0 2px 6px rgba(0, 0, 0, 0.04);
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
    background: linear-gradient(90deg, var(--skeleton-shimmer-1) 25%, var(--skeleton-shimmer-2) 50%, var(--skeleton-shimmer-3) 75%);
    background-size: 200% 100%;
    animation: shimmer 1.8s ease-in-out infinite;
  }
  
  .skeleton-favorite-btn {
    position: absolute;
    top: 16px;
    right: 16px;
    width: 40px;
    height: 40px;
    border-radius: 50%;
    background: var(--skeleton-overlay);
    backdrop-filter: blur(8px);
  }
  
  .skeleton-price-badge {
    position: absolute;
    bottom: 16px;
    left: 16px;
    width: 80px;
    height: 28px;
    border-radius: 50px;
    background: linear-gradient(90deg, var(--skeleton-shimmer-1) 25%, var(--skeleton-shimmer-2) 50%, var(--skeleton-shimmer-3) 75%);
    background-size: 200% 100%;
    animation: shimmer 1.8s ease-in-out infinite;
    animation-delay: 0.3s;
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
    background: linear-gradient(90deg, var(--skeleton-shimmer-1) 25%, var(--skeleton-shimmer-2) 50%, var(--skeleton-shimmer-3) 75%);
    background-size: 200% 100%;
    animation: shimmer 1.8s ease-in-out infinite;
    animation-delay: 0.1s;
    border-radius: 6px;
  }
  
  .skeleton-special-badge {
    width: 60px;
    height: 20px;
    border-radius: 50px;
    background: linear-gradient(90deg, var(--skeleton-shimmer-1) 25%, var(--skeleton-shimmer-2) 50%, var(--skeleton-shimmer-3) 75%);
    background-size: 200% 100%;
    animation: shimmer 1.8s ease-in-out infinite;
    animation-delay: 0.4s;
  }
  
  .skeleton-description {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
  
  .skeleton-line {
    height: 14px;
    background: linear-gradient(90deg, var(--skeleton-shimmer-1) 25%, var(--skeleton-shimmer-2) 50%, var(--skeleton-shimmer-3) 75%);
    background-size: 200% 100%;
    animation: shimmer 1.8s ease-in-out infinite;
    border-radius: 4px;
  }
  
  .skeleton-line:first-child {
    animation-delay: 0.2s;
  }
  
  .skeleton-line-short {
    width: 70%;
    animation-delay: 0.5s;
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
    background: linear-gradient(90deg, var(--skeleton-shimmer-1) 25%, var(--skeleton-shimmer-2) 50%, var(--skeleton-shimmer-3) 75%);
    background-size: 200% 100%;
    animation: shimmer 1.8s ease-in-out infinite;
    border-radius: 2px;
  }
  
  .skeleton-star:nth-child(1) { animation-delay: 0.1s; }
  .skeleton-star:nth-child(2) { animation-delay: 0.2s; }
  .skeleton-star:nth-child(3) { animation-delay: 0.3s; }
  .skeleton-star:nth-child(4) { animation-delay: 0.4s; }
  .skeleton-star:nth-child(5) { animation-delay: 0.5s; }
  
  .skeleton-rating-text {
    width: 60px;
    height: 14px;
    background: linear-gradient(90deg, var(--skeleton-shimmer-1) 25%, var(--skeleton-shimmer-2) 50%, var(--skeleton-shimmer-3) 75%);
    background-size: 200% 100%;
    animation: shimmer 1.8s ease-in-out infinite;
    animation-delay: 0.6s;
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
    background: linear-gradient(90deg, var(--skeleton-shimmer-1) 25%, var(--skeleton-shimmer-2) 50%, var(--skeleton-shimmer-3) 75%);
    background-size: 200% 100%;
    animation: shimmer 1.8s ease-in-out infinite;
  }
  
  .skeleton-tag:nth-child(1) { 
    animation-delay: 0.3s; 
  }
  
  .skeleton-tag:nth-child(2) {
    width: 60px;
    animation-delay: 0.4s; 
  }
  
  .skeleton-tag:nth-child(3) {
    width: 40px;
    animation-delay: 0.5s; 
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
    background: linear-gradient(90deg, var(--skeleton-shimmer-1) 25%, var(--skeleton-shimmer-2) 50%, var(--skeleton-shimmer-3) 75%);
    background-size: 200% 100%;
    animation: shimmer 1.8s ease-in-out infinite;
    animation-delay: 0.7s;
  }
  
  .skeleton-stock-text {
    width: 80px;
    height: 14px;
    background: linear-gradient(90deg, var(--skeleton-shimmer-1) 25%, var(--skeleton-shimmer-2) 50%, var(--skeleton-shimmer-3) 75%);
    background-size: 200% 100%;
    animation: shimmer 1.8s ease-in-out infinite;
    animation-delay: 0.8s;
    border-radius: 4px;
  }
  
  /* Shimmer Animation - Suavizada */
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
      background: var(--skeleton-base);
    }
  }
  
  /* High contrast mode support */
  @media (prefers-contrast: high) {
    .dish-skeleton-card {
      border: 2px solid var(--secondary-color);
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
      background: var(--skeleton-shimmer-2);
    }
  }
</style>