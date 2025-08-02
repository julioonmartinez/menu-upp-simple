<!-- src/examples/AnonymousStoresExample.svelte -->

<script lang="ts">
  import { onMount } from 'svelte';
  import { useAllAnonymousStores } from '../stores/anonymousStores';
  import type { 
    AnonymousRestaurantCreateRequest,
    AnonymousCategoryCreateRequest,
    AnonymousDishCreateRequest 
  } from '../interfaces/anonymousRestaurant';

  // Usar todos los stores anónimos
  const {
    restaurants,
    categories,
    dishes,
    services,
    initializeAllStores,
    clearAllStores,
    syncAllStores
  } = useAllAnonymousStores();

  // Estados locales
  let showCreateForm = false;
  let createFormData = {
    restaurant: {
      name: '',
      description: '',
      address: '',
      phone: '',
      email: ''
    } as AnonymousRestaurantCreateRequest,
    categories: [
      {
        name: '',
        description: '',
        order: 1
      } as AnonymousCategoryCreateRequest
    ],
    dishes: [
      {
        name: '',
        description: '',
        price: 0,
        categoryId: '',
        inStock: true
      } as AnonymousDishCreateRequest
    ]
  };

  // Inicializar stores al montar el componente
  onMount(async () => {
    console.log('🚀 Inicializando stores anónimos...');
    const result = await initializeAllStores();
    if (result.success) {
      console.log('✅ Stores inicializados correctamente');
    } else {
      console.error('❌ Error inicializando stores:', result.error);
    }
  });

  // Función para crear un restaurante completo
  async function handleCreateCompleteRestaurant() {
    console.log('🔄 Creando restaurante completo...');
    
    // Asignar categoryId a los platillos
    const updatedDishes = createFormData.dishes.map((dish, index) => ({
      ...dish,
      categoryId: createFormData.categories[index % createFormData.categories.length]?.name || ''
    }));

    const result = await services.createCompleteAnonymousRestaurant(
      createFormData.restaurant,
      createFormData.categories,
      updatedDishes
    );

    if (result.success) {
      console.log('✅ Restaurante creado exitosamente:', result.data);
      showCreateForm = false;
      // Recargar datos
      await syncAllStores(true);
    } else {
      console.error('❌ Error creando restaurante:', result.error);
    }
  }

  // Función para limpiar todos los datos
  async function handleClearAllData() {
    if (confirm('¿Estás seguro de que quieres limpiar todos los datos anónimos?')) {
      console.log('🗑️ Limpiando todos los datos...');
      const result = await services.clearAllAnonymousData();
      if (result.success) {
        console.log('✅ Datos limpiados correctamente');
        await clearAllStores();
      } else {
        console.error('❌ Error limpiando datos:', result.error);
      }
    }
  }

  // Función para agregar una nueva categoría al formulario
  function addCategory() {
    createFormData.categories = [
      ...createFormData.categories,
      {
        name: '',
        description: '',
        order: createFormData.categories.length + 1
      }
    ];
  }

  // Función para agregar un nuevo platillo al formulario
  function addDish() {
    createFormData.dishes = [
      ...createFormData.dishes,
      {
        name: '',
        description: '',
        price: 0,
        categoryId: '',
        inStock: true
      }
    ];
  }

  // Función para remover una categoría
  function removeCategory(index: number) {
    createFormData.categories = createFormData.categories.filter((_, i) => i !== index);
  }

  // Función para remover un platillo
  function removeDish(index: number) {
    createFormData.dishes = createFormData.dishes.filter((_, i) => i !== index);
  }
</script>

<div class="anonymous-stores-example">
  <h1>🏪 Ejemplo de Stores Anónimos</h1>
  
  <!-- Estados de carga -->
  <div class="loading-states">
    <h2>📊 Estados de Carga</h2>
    <div class="state-grid">
      <div class="state-item">
        <span class="label">Restaurantes:</span>
        <span class="value" class:loading={$restaurants.isLoadingAll}>
          {$restaurants.isLoadingAll ? '🔄' : '✅'}
        </span>
      </div>
      <div class="state-item">
        <span class="label">Categorías:</span>
        <span class="value" class:loading={$categories.isLoadingAll}>
          {$categories.isLoadingAll ? '🔄' : '✅'}
        </span>
      </div>
      <div class="state-item">
        <span class="label">Platillos:</span>
        <span class="value" class:loading={$dishes.isLoadingAll}>
          {$dishes.isLoadingAll ? '🔄' : '✅'}
        </span>
      </div>
      <div class="state-item">
        <span class="label">Servicios:</span>
        <span class="value" class:loading={$services.isLoadingAll}>
          {$services.isLoadingAll ? '🔄' : '✅'}
        </span>
      </div>
    </div>
  </div>

  <!-- Estadísticas -->
  <div class="stats">
    <h2>📈 Estadísticas</h2>
    <div class="stats-grid">
      <div class="stat-item">
        <span class="label">Restaurantes:</span>
        <span class="value">{$restaurants.restaurantsCount}</span>
      </div>
      <div class="stat-item">
        <span class="label">Activos:</span>
        <span class="value">{$restaurants.activeRestaurantsCount}</span>
      </div>
      <div class="stat-item">
        <span class="label">Expirados:</span>
        <span class="value">{$restaurants.expiredRestaurantsCount}</span>
      </div>
      <div class="stat-item">
        <span class="label">Reclamados:</span>
        <span class="value">{$restaurants.claimedRestaurantsCount}</span>
      </div>
      <div class="stat-item">
        <span class="label">Categorías:</span>
        <span class="value">{$categories.categoriesCount}</span>
      </div>
      <div class="stat-item">
        <span class="label">Platillos:</span>
        <span class="value">{$dishes.dishesCount}</span>
      </div>
      <div class="stat-item">
        <span class="label">En Stock:</span>
        <span class="value">{$dishes.dishesInStock.length}</span>
      </div>
      <div class="stat-item">
        <span class="label">Precio Promedio:</span>
        <span class="value">${$dishes.averagePrice.toFixed(2)}</span>
      </div>
    </div>
  </div>

  <!-- Datos -->
  <div class="data-sections">
    <!-- Restaurantes -->
    <div class="data-section">
      <h3>🏪 Restaurantes Anónimos</h3>
      {#if $restaurants.allAnonymousRestaurants.length > 0}
        <div class="items-grid">
          {#each $restaurants.allAnonymousRestaurants as restaurant}
            <div class="item-card">
              <h4>{restaurant.name}</h4>
              <p>{restaurant.description || 'Sin descripción'}</p>
              <div class="item-meta">
                <span class="status" class:active={restaurant.days_remaining > 0 && !restaurant.is_claimed}>
                  {restaurant.is_claimed ? 'Reclamado' : restaurant.days_remaining > 0 ? 'Activo' : 'Expirado'}
                </span>
                <span class="days">{$restaurants.utils.calculateDaysRemaining(restaurant.expires_at)} días</span>
              </div>
            </div>
          {/each}
        </div>
      {:else}
        <p class="empty-state">No hay restaurantes anónimos</p>
      {/if}
    </div>

    <!-- Categorías -->
    <div class="data-section">
      <h3>📂 Categorías Anónimas</h3>
      {#if $categories.allAnonymousCategories.length > 0}
        <div class="items-grid">
          {#each $categories.sortedCategories as category}
            <div class="item-card">
              <h4>{category.name}</h4>
              <p>{category.description || 'Sin descripción'}</p>
              <div class="item-meta">
                <span class="order">Orden: {category.order || 0}</span>
              </div>
            </div>
          {/each}
        </div>
      {:else}
        <p class="empty-state">No hay categorías anónimas</p>
      {/if}
    </div>

    <!-- Platillos -->
    <div class="data-section">
      <h3>🍽️ Platillos Anónimos</h3>
      {#if $dishes.allAnonymousDishes.length > 0}
        <div class="items-grid">
          {#each $dishes.dishesByPrice as dish}
            <div class="item-card">
              <h4>{dish.name}</h4>
              <p>{dish.description || 'Sin descripción'}</p>
              <div class="item-meta">
                <span class="price">${dish.price.toFixed(2)}</span>
                <span class="stock" class:in-stock={dish.inStock !== false}>
                  {dish.inStock !== false ? 'En Stock' : 'Sin Stock'}
                </span>
              </div>
            </div>
          {/each}
        </div>
      {:else}
        <p class="empty-state">No hay platillos anónimos</p>
      {/if}
    </div>
  </div>

  <!-- Acciones -->
  <div class="actions">
    <h2>⚡ Acciones</h2>
    <div class="action-buttons">
      <button 
        class="btn btn-primary" 
        on:click={() => showCreateForm = !showCreateForm}
        disabled={$services.isCreatingComplete}
      >
        {showCreateForm ? '❌ Cancelar' : '➕ Crear Restaurante Completo'}
      </button>
      
      <button 
        class="btn btn-secondary" 
        on:click={() => syncAllStores(true)}
        disabled={$services.isLoadingAll}
      >
        🔄 Sincronizar Datos
      </button>
      
      <button 
        class="btn btn-danger" 
        on:click={handleClearAllData}
        disabled={$services.isClearingData}
      >
        🗑️ Limpiar Todos los Datos
      </button>
    </div>
  </div>

  <!-- Formulario de creación -->
  {#if showCreateForm}
    <div class="create-form">
      <h3>🏪 Crear Restaurante Completo</h3>
      
      <!-- Datos del restaurante -->
      <div class="form-section">
        <h4>Información del Restaurante</h4>
        <div class="form-group">
          <label for="restaurant-name">Nombre:</label>
          <input 
            id="restaurant-name"
            type="text" 
            bind:value={createFormData.restaurant.name}
            placeholder="Nombre del restaurante"
          />
        </div>
        <div class="form-group">
          <label for="restaurant-description">Descripción:</label>
          <textarea 
            id="restaurant-description"
            bind:value={createFormData.restaurant.description}
            placeholder="Descripción del restaurante"
          ></textarea>
        </div>
        <div class="form-group">
          <label for="restaurant-address">Dirección:</label>
          <input 
            id="restaurant-address"
            type="text" 
            bind:value={createFormData.restaurant.address}
            placeholder="Dirección del restaurante"
          />
        </div>
        <div class="form-group">
          <label for="restaurant-phone">Teléfono:</label>
          <input 
            id="restaurant-phone"
            type="tel" 
            bind:value={createFormData.restaurant.phone}
            placeholder="Teléfono del restaurante"
          />
        </div>
        <div class="form-group">
          <label for="restaurant-email">Email:</label>
          <input 
            id="restaurant-email"
            type="email" 
            bind:value={createFormData.restaurant.email}
            placeholder="Email del restaurante"
          />
        </div>
      </div>

      <!-- Categorías -->
      <div class="form-section">
        <h4>Categorías</h4>
        <button class="btn btn-small" on:click={addCategory}>➕ Agregar Categoría</button>
        
        {#each createFormData.categories as category, index}
          <div class="category-item">
            <div class="form-group">
              <label>Nombre:</label>
              <input 
                type="text" 
                bind:value={category.name}
                placeholder="Nombre de la categoría"
              />
            </div>
            <div class="form-group">
              <label>Descripción:</label>
              <textarea 
                bind:value={category.description}
                placeholder="Descripción de la categoría"
              ></textarea>
            </div>
            <div class="form-group">
              <label>Orden:</label>
              <input 
                type="number" 
                bind:value={category.order}
                min="1"
              />
            </div>
            <button 
              class="btn btn-small btn-danger" 
              on:click={() => removeCategory(index)}
            >
              ❌ Remover
            </button>
          </div>
        {/each}
      </div>

      <!-- Platillos -->
      <div class="form-section">
        <h4>Platillos</h4>
        <button class="btn btn-small" on:click={addDish}>➕ Agregar Platillo</button>
        
        {#each createFormData.dishes as dish, index}
          <div class="dish-item">
            <div class="form-group">
              <label>Nombre:</label>
              <input 
                type="text" 
                bind:value={dish.name}
                placeholder="Nombre del platillo"
              />
            </div>
            <div class="form-group">
              <label>Descripción:</label>
              <textarea 
                bind:value={dish.description}
                placeholder="Descripción del platillo"
              ></textarea>
            </div>
            <div class="form-group">
              <label>Precio:</label>
              <input 
                type="number" 
                bind:value={dish.price}
                min="0"
                step="0.01"
              />
            </div>
            <div class="form-group">
              <label>En Stock:</label>
              <input 
                type="checkbox" 
                bind:checked={dish.inStock}
              />
            </div>
            <button 
              class="btn btn-small btn-danger" 
              on:click={() => removeDish(index)}
            >
              ❌ Remover
            </button>
          </div>
        {/each}
      </div>

      <!-- Botones de acción -->
      <div class="form-actions">
        <button 
          class="btn btn-primary" 
          on:click={handleCreateCompleteRestaurant}
          disabled={$services.isCreatingComplete}
        >
          {#if $services.isCreatingComplete}
            🔄 Creando...
          {:else}
            ✅ Crear Restaurante Completo
          {/if}
        </button>
        
        <button 
          class="btn btn-secondary" 
          on:click={() => showCreateForm = false}
        >
          ❌ Cancelar
        </button>
      </div>
    </div>
  {/if}

  <!-- Errores -->
  {#if $restaurants.error || $categories.error || $dishes.error || $services.error}
    <div class="errors">
      <h3>❌ Errores</h3>
      {#if $restaurants.error}
        <div class="error-item">
          <strong>Restaurantes:</strong> {$restaurants.error}
        </div>
      {/if}
      {#if $categories.error}
        <div class="error-item">
          <strong>Categorías:</strong> {$categories.error}
        </div>
      {/if}
      {#if $dishes.error}
        <div class="error-item">
          <strong>Platillos:</strong> {$dishes.error}
        </div>
      {/if}
      {#if $services.error}
        <div class="error-item">
          <strong>Servicios:</strong> {$services.error}
        </div>
      {/if}
    </div>
  {/if}
</div>

<style>
  .anonymous-stores-example {
    max-width: 1200px;
    margin: 0 auto;
    padding: 20px;
    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  }

  h1 {
    color: #333;
    text-align: center;
    margin-bottom: 30px;
  }

  h2 {
    color: #555;
    margin-bottom: 15px;
  }

  h3 {
    color: #666;
    margin-bottom: 10px;
  }

  .loading-states, .stats, .data-sections, .actions {
    margin-bottom: 30px;
    padding: 20px;
    border-radius: 8px;
    background: #f8f9fa;
  }

  .state-grid, .stats-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 15px;
  }

  .state-item, .stat-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 10px;
    background: white;
    border-radius: 6px;
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  }

  .label {
    font-weight: 600;
    color: #555;
  }

  .value {
    font-weight: bold;
    color: #333;
  }

  .loading {
    color: #007bff;
  }

  .data-sections {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
    gap: 20px;
  }

  .data-section {
    background: white;
    padding: 20px;
    border-radius: 8px;
    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  }

  .items-grid {
    display: grid;
    gap: 15px;
  }

  .item-card {
    padding: 15px;
    border: 1px solid #e0e0e0;
    border-radius: 6px;
    background: #fafafa;
  }

  .item-card h4 {
    margin: 0 0 8px 0;
    color: #333;
  }

  .item-card p {
    margin: 0 0 10px 0;
    color: #666;
    font-size: 14px;
  }

  .item-meta {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 12px;
  }

  .status {
    padding: 2px 8px;
    border-radius: 12px;
    font-size: 11px;
    font-weight: bold;
  }

  .status.active {
    background: #d4edda;
    color: #155724;
  }

  .price {
    font-weight: bold;
    color: #28a745;
  }

  .stock {
    padding: 2px 8px;
    border-radius: 12px;
    font-size: 11px;
  }

  .stock.in-stock {
    background: #d4edda;
    color: #155724;
  }

  .empty-state {
    text-align: center;
    color: #999;
    font-style: italic;
  }

  .action-buttons {
    display: flex;
    gap: 10px;
    flex-wrap: wrap;
  }

  .btn {
    padding: 10px 20px;
    border: none;
    border-radius: 6px;
    cursor: pointer;
    font-weight: 600;
    transition: all 0.2s;
  }

  .btn:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .btn-primary {
    background: #007bff;
    color: white;
  }

  .btn-primary:hover:not(:disabled) {
    background: #0056b3;
  }

  .btn-secondary {
    background: #6c757d;
    color: white;
  }

  .btn-secondary:hover:not(:disabled) {
    background: #545b62;
  }

  .btn-danger {
    background: #dc3545;
    color: white;
  }

  .btn-danger:hover:not(:disabled) {
    background: #c82333;
  }

  .btn-small {
    padding: 5px 10px;
    font-size: 12px;
  }

  .create-form {
    background: white;
    padding: 20px;
    border-radius: 8px;
    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    margin-top: 20px;
  }

  .form-section {
    margin-bottom: 25px;
    padding: 15px;
    border: 1px solid #e0e0e0;
    border-radius: 6px;
  }

  .form-group {
    margin-bottom: 15px;
  }

  .form-group label {
    display: block;
    margin-bottom: 5px;
    font-weight: 600;
    color: #555;
  }

  .form-group input,
  .form-group textarea {
    width: 100%;
    padding: 8px 12px;
    border: 1px solid #ddd;
    border-radius: 4px;
    font-size: 14px;
  }

  .form-group textarea {
    min-height: 80px;
    resize: vertical;
  }

  .category-item,
  .dish-item {
    padding: 15px;
    border: 1px solid #e0e0e0;
    border-radius: 6px;
    margin-bottom: 15px;
    background: #f8f9fa;
  }

  .form-actions {
    display: flex;
    gap: 10px;
    justify-content: center;
    margin-top: 20px;
  }

  .errors {
    background: #f8d7da;
    color: #721c24;
    padding: 15px;
    border-radius: 6px;
    margin-top: 20px;
  }

  .error-item {
    margin-bottom: 8px;
  }

  .error-item:last-child {
    margin-bottom: 0;
  }
</style> 