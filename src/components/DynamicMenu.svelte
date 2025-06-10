<script>
  // components/DynamicMenu.svelte
  import { onMount, onDestroy } from 'svelte';
  import { fade, fly } from 'svelte/transition';
  import { quintOut } from 'svelte/easing';
  import EnhancedDishCard from './Cards/EnhancedDishCard.svelte';
  import MenuSkeletonLoader from './MenuSkeletonLoader.svelte';
    import CardDishSvelte from './Cards/CardDishSvelte.svelte';
  
  // Props
  export let username;
  export let categories = [];
  export let restaurant = null;
  export let storeMode = false;
  export let backgroundColor = '#FFFF';
  export let primaryColor = '#2b2b2b';
  export let secondaryColor = 'Ff4500';

  
  // Estado local
  let currentCategory = null;
  let dishes = [];
  let isLoading = false;
  let error = null;
  let mounted = false;
  
  // Variables para el manejo de eventos
  let categoryChangeHandler;
  
  // API call para obtener platillos por categoría
  async function fetchDishesByCategory(categoryId) {
    if (!categoryId || !username) return;
    
    isLoading = true;
    error = null;
    
    try {
      const apiUrl = import.meta.env.PUBLIC_API_URL || 'http://localhost:8000/api';
      const response = await fetch(
        `${apiUrl}/dishes/restaurant-username/${username}/category/${categoryId}?limit=100`
      );
      
      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      if (data && Array.isArray(data.dishes)) {
        dishes = data.dishes.map((dish, index) => ({
          ...dish,
          // Enriquecer datos para el modo tienda
          inStock: dish.inStock !== undefined ? dish.inStock : Math.random() > 0.1,
          isSpecial: dish.isSpecial || (index % 7 === 0),
          reviewCount: dish.reviewCount || Math.floor(Math.random() * 100) + 5,
          rating: dish.rating || (Math.random() * 2 + 3), // Rating entre 3-5
          tags: dish.tags || generateTags(dish)
        }));
      } else {
        dishes = [];
      }
      
      console.log(`🍽️ Loaded ${dishes.length} dishes for category ${categoryId}`);
      
    } catch (err) {
      console.error('Error fetching dishes:', err);
      error = err.message;
      dishes = [];
    } finally {
      isLoading = false;
    }
  }
  
  // Generar tags automáticamente para los platillos
  function generateTags(dish) {
    const tags = [];
    const name = dish.name?.toLowerCase() || '';
    const description = dish.description?.toLowerCase() || '';
    
    if (name.includes('picante') || name.includes('spicy') || description.includes('picante')) {
      tags.push('picante');
    }
    if (name.includes('vegano') || name.includes('vegan') || description.includes('vegano')) {
      tags.push('vegano');
    }
    if (name.includes('vegetariano') || description.includes('vegetariano')) {
      tags.push('vegetariano');
    }
    if (name.includes('gluten free') || name.includes('sin gluten') || description.includes('sin gluten')) {
      tags.push('sin-gluten');
    }
    if (dish.price && dish.price < 100) {
      tags.push('económico');
    }
    if (dish.rating && dish.rating > 4.5) {
      tags.push('favorito');
    }
    
    return tags.slice(0, 3); // Máximo 3 tags
  }
  
  // Manejar cambio de categoría
  function handleCategoryChange(event) {
    const { categoryId, categoryName, categoryIndex } = event.detail;
    
    console.log('🔄 DynamicMenu: Category changed to:', { categoryId, categoryName });
    
    currentCategory = { id: categoryId, name: categoryName, index: categoryIndex };
    fetchDishesByCategory(categoryId);
  }
  
  // Lifecycle hooks
  onMount(() => {
    mounted = true;
    
    // Configurar listener para cambios de categoría
    categoryChangeHandler = handleCategoryChange;
    document.addEventListener('categoryChanged', categoryChangeHandler);
    
    // Cargar la primera categoría si existe
    if (categories && categories.length > 0) {
      const firstCategory = categories[0];
      currentCategory = {
        id: firstCategory.id,
        name: firstCategory.name,
        index: 0
      };
      fetchDishesByCategory(firstCategory.id);
    }
    
    console.log('🚀 DynamicMenu mounted for username:', username);
  });
  
  onDestroy(() => {
    // Limpiar listeners
    if (categoryChangeHandler) {
      document.removeEventListener('categoryChanged', categoryChangeHandler);
    }
  });
  
  // Formatear precio
  function formatPrice(price) {
    if (!price) return 'Precio a consultar';
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN'
    }).format(price);
  }
</script>

{#if mounted}
  <div style="--bg-color: {backgroundColor};" class="dynamic-menu" id="menu-section">
    <!-- Header de la categoría actual -->
    <!-- {#if currentCategory && !isLoading}
      <div class="category-header" in:fade={{ duration: 400, delay: 200 }}>
        <h2 class="category-title">{currentCategory.name}</h2>
        <p class="category-count">{dishes.length} platillos disponibles</p>
      </div>
    {/if} -->
    
    <!-- Estado de carga -->
    {#if isLoading}
      <MenuSkeletonLoader 
        count={6} 
        showCategoryHeader={true}
      />
    {:else}
      <!-- Menú de platillos -->
      <div class="dishes-container">
        {#if error}
          <div class="error-state" in:fade={{ duration: 400 }}>
            <div class="error-content">
              <div class="error-icon">⚠️</div>
              <h3 class="error-title">Error al cargar platillos</h3>
              <p class="error-message">{error}</p>
              <button 
                class="retry-button"
                on:click={() => currentCategory && fetchDishesByCategory(currentCategory.id)}
              >
                Intentar nuevamente
              </button>
            </div>
          </div>
        {:else if dishes.length === 0}
          <div class="empty-state" in:fade={{ duration: 400 }}>
            <div class="empty-content">
              <div class="empty-icon">🍽️</div>
              <h3 class="empty-title">No hay platillos disponibles</h3>
              <p class="empty-message">Esta categoría aún no tiene platillos registrados.</p>
            </div>
          </div>
        {:else}
          <div class="dishes-grid" id="category-{currentCategory?.id}">
            {#each dishes as dish, index (dish.id)}
              <div 
                class="dish-wrapper"
                in:fly={{ y: 30, duration: 400, delay: index * 50, easing: quintOut }}
                data-dish-id={dish.id}
              >
                <!-- <EnhancedDishCard {dish} {index} {storeMode} /> -->
                 <CardDishSvelte backgroundColor={backgroundColor} primaryColor={primaryColor} secondaryColor={secondaryColor} item={dish} {index} {storeMode} ></CardDishSvelte>
              </div>
            {/each}
          </div>
        {/if}
      </div>
    {/if}
  </div>
{/if}

<style>
  .dynamic-menu {
    max-width: 1200px;
    margin: 0 auto;
    padding: 2rem 1rem;
    min-height: 50vh;
     background-color: var(--bg-color);
  }
  
  .category-header {
    text-align: center;
    margin-bottom: 2rem;
  }
  
  .category-title {
    font-size: 2rem;
    font-weight: 700;
    color: #1f2937;
    margin-bottom: 0.5rem;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }
  
  .category-count {
    color: #6b7280;
    font-size: 0.875rem;
    font-weight: 500;
  }
  
  /* Error State */
  .error-state {
    display: flex;
    justify-content: center;
    align-items: center;
    min-height: 300px;
  }
  
  .error-content {
    text-align: center;
    max-width: 400px;
    padding: 2rem;
  }
  
  .error-icon {
    font-size: 3rem;
    margin-bottom: 1rem;
  }
  
  .error-title {
    font-size: 1.5rem;
    font-weight: 600;
    color: #dc2626;
    margin-bottom: 0.5rem;
  }
  
  .error-message {
    color: #6b7280;
    margin-bottom: 1.5rem;
    line-height: 1.5;
  }
  
  .retry-button {
    padding: 12px 24px;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    border: none;
    border-radius: 8px;
    font-weight: 600;
    cursor: pointer;
    transition: transform 0.2s ease;
  }
  
  .retry-button:hover {
    transform: translateY(-2px);
  }
  
  /* Empty State */
  .empty-state {
    display: flex;
    justify-content: center;
    align-items: center;
    min-height: 300px;
  }
  
  .empty-content {
    text-align: center;
    max-width: 400px;
    padding: 2rem;
  }
  
  .empty-icon {
    font-size: 3rem;
    margin-bottom: 1rem;
  }
  
  .empty-title {
    font-size: 1.5rem;
    font-weight: 600;
    color: #374151;
    margin-bottom: 0.5rem;
  }
  
  .empty-message {
    color: #6b7280;
    line-height: 1.5;
  }
  
  /* Dishes Grid */
  .dishes-container {
    width: 100%;
  
  }
  
  .dishes-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
    gap: 2rem;
    margin-bottom: 3rem;
  }
  
  .dish-wrapper {
    will-change: transform;
  }
  
  /* Responsive Design */
  @media (max-width: 768px) {
    .dynamic-menu {
      padding: 1rem;
    }
    
    .category-title {
      font-size: 1.75rem;
    }
    
    .dishes-grid {
      grid-template-columns: 1fr;
      gap: 1.5rem;
    }
  }
  
  @media (max-width: 480px) {
    .dishes-grid {
      gap: 1rem;
    }
  }
  
  /* Dark mode support */
  @media (prefers-color-scheme: dark) {
    .category-title {
      color: #f9fafb;
    }
    
    .error-content,
    .empty-content {
      color: #f9fafb;
    }
  }
</style>