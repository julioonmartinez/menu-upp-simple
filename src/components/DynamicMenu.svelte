<script>
  import { onMount, onDestroy } from 'svelte';
  import { fade, fly } from 'svelte/transition';
  import { quintOut } from 'svelte/easing';
  import CardDishSvelte from './Cards/CardDishSvelte.svelte';
  import MenuSkeletonLoader from './MenuSkeletonLoader.svelte';
  import { fetchDishesByUsernameAndCategory, fetchDishesByUsername } from '../services/apiService';
  
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
  let allDishes = []; // Cache de todos los platos
  let isLoading = false;
  let error = null;
  let mounted = false;
  let retryCount = 0;
  let maxRetries = 2;
  
  // Variables para el manejo de eventos
  let categoryChangeHandler;

  // Función mejorada para obtener platillos por categoría con fallbacks
  async function fetchDishesByCategory(categoryId, isRetry = false) {
    if (!categoryId || !username) return;
    
    isLoading = true;
    error = null;
    
    try {
      console.log(`🔄 Fetching dishes for category: ${categoryId}, retry: ${isRetry}`);
      
      // MÉTODO 1: Intentar endpoint específico de categoría
      let data;
      try {
        data = await fetchDishesByUsernameAndCategory(username, categoryId, 100);
        console.log('✅ Method 1 successful - specific category endpoint');
      } catch (categoryError) {
        console.warn('⚠️ Method 1 failed:', categoryError.message);
        
        // MÉTODO 2: Fallback - obtener todos los platos y filtrar
        if (!allDishes || allDishes.length === 0) {
          console.log('🔄 Loading all dishes for filtering...');
          const allDishesResponse = await fetchDishesByUsername(username, 500);
          allDishes = allDishesResponse.dishes || [];
          console.log(`📦 Loaded ${allDishes.length} total dishes`);
        }
        
        // Filtrar localmente
        const filteredDishes = allDishes.filter(dish => {
          return dish.categoryId === categoryId || 
                 dish.category_id === categoryId ||
                 dish.category === categoryId;
        });
        
        console.log(`✅ Method 2 successful - local filtering found ${filteredDishes.length} dishes`);
        data = { dishes: filteredDishes };
      }
      
      if (data && Array.isArray(data.dishes)) {
        dishes = data.dishes.map((dish, index) => ({
          ...dish,
          // Enriquecer datos para el modo tienda
          inStock: dish.inStock !== undefined ? dish.inStock : Math.random() > 0.1,
          isSpecial: dish.isSpecial || (index % 7 === 0),
          reviewCount: dish.reviewCount || Math.floor(Math.random() * 100) + 5,
          rating: dish.rating || (Math.random() * 2 + 3),
          tags: dish.tags || generateTags(dish)
        }));
        
        retryCount = 0; // Reset counter on success
        console.log(`🍽️ Successfully loaded ${dishes.length} dishes for category ${categoryId}`);
        
        // Disparar evento para indicar que el menú está listo
        setTimeout(() => {
          document.dispatchEvent(new CustomEvent('svelteMenuReady'));
        }, 100);
      } else {
        console.warn('⚠️ Invalid data structure received');
        dishes = [];
        
        // Disparar evento incluso si no hay datos
        setTimeout(() => {
          document.dispatchEvent(new CustomEvent('svelteMenuReady'));
        }, 100);
      }
      
    } catch (err) {
      console.error('❌ Error fetching dishes:', err);
      
      // Intentar retry si no hemos excedido el límite
      if (!isRetry && retryCount < maxRetries) {
        retryCount++;
        console.log(`🔄 Retrying... attempt ${retryCount}/${maxRetries}`);
        
        // Esperar un poco antes del retry
        setTimeout(() => {
          fetchDishesByCategory(categoryId, true);
        }, 1000 * retryCount); // Backoff exponencial
        
        return; // No cambiar el estado de loading todavía
      }
      
      // Si llegamos aquí, todos los intentos fallaron
      error = `No se pudieron cargar los platillos. ${err.message}`;
      dishes = [];
      retryCount = 0;
      
      // Disparar evento incluso si hay error
      setTimeout(() => {
        document.dispatchEvent(new CustomEvent('svelteMenuReady'));
      }, 100);
    } finally {
      isLoading = false;
    }
  }

  // Función para generar tags automáticamente
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
    
    return tags.slice(0, 3);
  }

  // Función para manejar cambio de categoría
  function handleCategoryChange(event) {
    const { categoryId, categoryName, categoryIndex } = event.detail;
    
    console.log('🔄 DynamicMenu: Category changed to:', { categoryId, categoryName });
    
    currentCategory = { id: categoryId, name: categoryName, index: categoryIndex };
    fetchDishesByCategory(categoryId);
  }

  // Función para retry manual
  function handleRetry() {
    if (currentCategory) {
      retryCount = 0;
      fetchDishesByCategory(currentCategory.id);
    }
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
    } else {
      // Si no hay categorías, disparar evento inmediatamente
      setTimeout(() => {
        document.dispatchEvent(new CustomEvent('svelteMenuReady'));
      }, 100);
    }
    
    console.log('🚀 DynamicMenu mounted for username:', username);
  });

  onDestroy(() => {
    if (categoryChangeHandler) {
      document.removeEventListener('categoryChanged', categoryChangeHandler);
    }
  });
</script>

{#if mounted}
  <div style="--bg-color: {backgroundColor};" class="dynamic-menu" id="menu-section">
    <!-- Estado de carga -->
    {#if isLoading}
      <MenuSkeletonLoader 
        count={6} 
        showCategoryHeader={true}
        variant="hero"
       
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
              <div class="error-actions">
                <button 
                  class="retry-button"
                  on:click={handleRetry}
                >
                  Intentar nuevamente
                </button>
                {#if retryCount > 0}
                  <p class="retry-info">Intento {retryCount} de {maxRetries}</p>
                {/if}
              </div>
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
                <CardDishSvelte 
                  backgroundColor={backgroundColor} 
                  primaryColor={primaryColor} 
                  secondaryColor={secondaryColor} 
                  item={dish} 
                  {index} 
                  {storeMode} 
                />
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
    min-height: 100vh;
    background-color: var(--bg-color);

  }
  
  .dishes-container {
    width: 100%;
  }
  
  .dishes-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
    gap: 2rem;
    margin-bottom: 3rem;
    flex-shrink: 1;
  }
  
  .dish-wrapper {
    will-change: transform;
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

  .error-actions {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.5rem;
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

  .retry-info {
    font-size: 0.875rem;
    color: #6b7280;
    margin: 0;
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

  /* Responsive Design */
  @media (max-width: 768px) {
    .dynamic-menu {
      padding: 1rem;
    }
    
    .dishes-grid {
      grid-template-columns: 1fr;
      gap: 1.5rem;
    }
  }
  
  @media (max-width: 480px) {
    
    .dishes-grid {
      gap: 1rem;
      grid-template-columns: 1fr;
    }
  }
</style>