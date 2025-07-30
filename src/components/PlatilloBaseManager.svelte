<script lang="ts">
  import { onMount } from 'svelte';
  import { 
    platilloBaseStore, 
    platillosBase, 
    loading, 
    error, 
    pagination
  } from '../stores/platilloBaseStore';
  import type { 
    PlatilloBase, 
    PlatilloBaseCreateRequest, 
    PlatilloBaseUpdateRequest,
    FiltrosPlatilloBase 
  } from '../services/platilloBaseService';

  // Estado local
  let showCreateForm = false;
  let showEditForm = false;
  let selectedPlatilloId: string | null = null;
  let searchTerm = '';
  let currentPage = 1;
  let itemsPerPage = 20;

  // Formularios
  let createForm: PlatilloBaseCreateRequest = {
    nombre: '',
    descripcion: '',
    tipo_cocina: '',
    categoria_principal: '',
    ingredientes_principales: [],
    tags: [],
    permite_variaciones: false,
    requiere_ingredientes_minimos: false
  };

  let editForm: PlatilloBaseUpdateRequest = {};
  let newIngrediente = '';
  let newTag = '';

  // Filtros
  let filtros: FiltrosPlatilloBase = {};

  // Categorías y tipos de cocina populares
  const categoriasPopulares = [
    'Tacos', 'Pizzas', 'Hamburguesas', 'Sushi', 'Pasta',
    'Ensaladas', 'Sopas', 'Postres', 'Bebidas', 'Desayunos'
  ];

  const tiposCocina = [
    'Mexicana', 'Italiana', 'Japonesa', 'China', 'Americana',
    'Mediterránea', 'India', 'Francesa', 'Thai', 'Española'
  ];

  onMount(() => {
    cargarPlatillosBase();
  });

  async function cargarPlatillosBase() {
    await platilloBaseStore.cargarPlatillosBase(
      filtros,
      itemsPerPage,
      currentPage
    );
  }

  async function crearPlatilloBase() {
    const result = await platilloBaseStore.crearPlatilloBase(createForm);
    if (result.success) {
      showCreateForm = false;
      resetCreateForm();
      await cargarPlatillosBase();
    }
  }

  async function actualizarPlatilloBase() {
    if (!selectedPlatilloId) return;
    
    const result = await platilloBaseStore.actualizarPlatilloBase(selectedPlatilloId, editForm);
    if (result.success) {
      showEditForm = false;
      selectedPlatilloId = null;
      await cargarPlatillosBase();
    }
  }

  async function eliminarPlatilloBase(id: string) {
    if (confirm('¿Estás seguro de que quieres eliminar este platillo base?')) {
      const result = await platilloBaseStore.eliminarPlatilloBase(id);
      if (result.success) {
        await cargarPlatillosBase();
      }
    }
  }

  function abrirEditar(platillo: PlatilloBase) {
    selectedPlatilloId = platillo.id;
    editForm = {
      nombre: platillo.nombre,
      descripcion: platillo.descripcion,
      tipo_cocina: platillo.tipo_cocina,
      categoria_principal: platillo.categoria_principal,
      subcategoria: platillo.subcategoria,
      ingredientes_principales: [...platillo.ingredientes_principales],
      ingredientes_opcionales: platillo.ingredientes_opcionales ? [...platillo.ingredientes_opcionales] : [],
      tags: platillo.tags ? [...platillo.tags] : [],
      permite_variaciones: platillo.permite_variaciones,
      requiere_ingredientes_minimos: platillo.requiere_ingredientes_minimos
    };
    showEditForm = true;
  }

  function resetCreateForm() {
    createForm = {
      nombre: '',
      descripcion: '',
      tipo_cocina: '',
      categoria_principal: '',
      ingredientes_principales: [],
      tags: [],
      permite_variaciones: false,
      requiere_ingredientes_minimos: false
    };
  }

  function agregarIngrediente(form: 'create' | 'edit') {
    if (newIngrediente.trim()) {
      if (form === 'create') {
        createForm.ingredientes_principales = [...createForm.ingredientes_principales, newIngrediente.trim()];
      } else {
        editForm.ingredientes_principales = [...(editForm.ingredientes_principales || []), newIngrediente.trim()];
      }
      newIngrediente = '';
    }
  }

  function removerIngrediente(form: 'create' | 'edit', index: number) {
    if (form === 'create') {
      createForm.ingredientes_principales = createForm.ingredientes_principales.filter((_, i) => i !== index);
    } else {
      editForm.ingredientes_principales = editForm.ingredientes_principales?.filter((_, i) => i !== index) || [];
    }
  }

  function agregarTag(form: 'create' | 'edit') {
    if (newTag.trim()) {
      if (form === 'create') {
        createForm.tags = [...(createForm.tags || []), newTag.trim()];
      } else {
        editForm.tags = [...(editForm.tags || []), newTag.trim()];
      }
      newTag = '';
    }
  }

  function removerTag(form: 'create' | 'edit', index: number) {
    if (form === 'create') {
      createForm.tags = (createForm.tags || []).filter((_, i) => i !== index);
    } else {
      editForm.tags = editForm.tags?.filter((_, i) => i !== index) || [];
    }
  }

  async function aplicarFiltros() {
    currentPage = 1;
    await cargarPlatillosBase();
  }

  async function limpiarFiltros() {
    filtros = {};
    currentPage = 1;
    await cargarPlatillosBase();
  }

  async function cambiarPagina(page: number) {
    currentPage = page;
    await cargarPlatillosBase();
  }

  function getPopularidadColor(nivel: string): string {
    const colors = {
      muy_bajo: '#6B7280',
      bajo: '#10B981',
      medio: '#F59E0B',
      alto: '#EF4444',
      muy_alto: '#8B5CF6'
    };
    return colors[nivel as keyof typeof colors] || '#6B7280';
  }

  function getModeracionColor(estado: string): string {
    const colors = {
      pendiente: '#F59E0B',
      aprobado: '#10B981',
      rechazado: '#EF4444',
      revision: '#3B82F6'
    };
    return colors[estado as keyof typeof colors] || '#6B7280';
  }
</script>

<div class="platillo-base-manager">
  <!-- Header -->
  <div class="header">
    <h1>Gestión de Platillos Base</h1>
    <button 
      class="btn btn-primary" 
      on:click={() => showCreateForm = true}
      disabled={$loading}
    >
      + Nuevo Platillo Base
    </button>
  </div>

  <!-- Filtros -->
  <div class="filtros">
    <div class="filtros-grid">
      <div class="filtro-grupo">
        <label for="search">Buscar:</label>
        <input 
          id="search"
          type="text" 
          bind:value={searchTerm}
          placeholder="Buscar por nombre..."
          class="input"
        />
      </div>

      <div class="filtro-grupo">
        <label for="tipo-cocina">Tipo de Cocina:</label>
        <select id="tipo-cocina" bind:value={filtros.tipo_cocina} class="select">
          <option value="">Todos</option>
          {#each tiposCocina as tipo}
            <option value={tipo}>{tipo}</option>
          {/each}
        </select>
      </div>

      <div class="filtro-grupo">
        <label for="categoria">Categoría:</label>
        <select id="categoria" bind:value={filtros.categoria_principal} class="select">
          <option value="">Todas</option>
          {#each categoriasPopulares as categoria}
            <option value={categoria}>{categoria}</option>
          {/each}
        </select>
      </div>

      <div class="filtro-grupo">
        <label for="estado">Estado:</label>
        <select id="estado" bind:value={filtros.estado_moderacion} class="select">
          <option value="">Todos</option>
          <option value="pendiente">Pendiente</option>
          <option value="aprobado">Aprobado</option>
          <option value="rechazado">Rechazado</option>
          <option value="revision">En Revisión</option>
        </select>
      </div>
    </div>

    <div class="filtros-acciones">
      <button class="btn btn-secondary" on:click={aplicarFiltros} disabled={$loading}>
        Aplicar Filtros
      </button>
      <button class="btn btn-outline" on:click={limpiarFiltros} disabled={$loading}>
        Limpiar
      </button>
    </div>
  </div>

  <!-- Estado de carga y error -->
  {#if $loading}
    <div class="loading">
      <div class="spinner"></div>
      <p>Cargando platillos base...</p>
    </div>
  {:else if $error}
    <div class="error">
      <p>Error: {$error}</p>
      <button class="btn btn-secondary" on:click={cargarPlatillosBase}>
        Reintentar
      </button>
    </div>
  {:else}
    <!-- Lista de platillos base -->
    <div class="platillos-grid">
      {#each $platillosBase as platillo}
        <div class="platillo-card">
          <div class="platillo-header">
            <h3>{platillo.nombre}</h3>
            <div class="badges">
              <span 
                class="badge popularidad" 
                style="background-color: {getPopularidadColor(platillo.estadisticas?.nivel_popularidad || 'muy_bajo')}"
              >
                {(platillo.estadisticas?.nivel_popularidad || 'muy_bajo').replace('_', ' ')}
              </span>
              <span 
                class="badge moderacion" 
                style="background-color: {getModeracionColor(platillo.moderacion?.estado || 'pendiente')}"
              >
                {platillo.moderacion?.estado || 'pendiente'}
              </span>
            </div>
          </div>

          <p class="descripcion">{platillo.descripcion}</p>
          
          <div class="platillo-info">
            <div class="info-item">
              <strong>Tipo:</strong> {platillo.tipo_cocina}
            </div>
            <div class="info-item">
              <strong>Categoría:</strong> {platillo.categoria_principal}
            </div>
            <div class="info-item">
              <strong>Restaurantes:</strong> {platillo.estadisticas?.num_instancias || 0}
            </div>
            <div class="info-item">
              <strong>Rating:</strong> {(platillo.estadisticas?.rating_promedio_global || 0).toFixed(1)} ⭐
            </div>
          </div>

          <div class="ingredientes">
            <strong>Ingredientes principales:</strong>
            <div class="tags">
              {#each (platillo.ingredientes_principales || []) as ingrediente}
                <span class="tag">{ingrediente}</span>
              {/each}
            </div>
          </div>

          {#if platillo.tags && platillo.tags.length > 0}
            <div class="tags">
              {#each platillo.tags as tag}
                <span class="tag tag-secondary">{tag}</span>
              {/each}
            </div>
          {/if}

          <div class="platillo-acciones">
            <button 
              class="btn btn-sm btn-primary" 
              on:click={() => abrirEditar(platillo)}
            >
              Editar
            </button>
            <button 
              class="btn btn-sm btn-danger" 
              on:click={() => eliminarPlatilloBase(platillo.id)}
            >
              Eliminar
            </button>
          </div>
        </div>
      {/each}
    </div>

    <!-- Paginación -->
    {#if $pagination.total_pages > 1}
      <div class="pagination">
        <button 
          class="btn btn-outline" 
          disabled={!$pagination.has_prev}
          on:click={() => cambiarPagina($pagination.page - 1)}
        >
          Anterior
        </button>
        
        <span class="pagination-info">
          Página {$pagination.page} de {$pagination.total_pages}
        </span>
        
        <button 
          class="btn btn-outline" 
          disabled={!$pagination.has_next}
          on:click={() => cambiarPagina($pagination.page + 1)}
        >
          Siguiente
        </button>
      </div>
    {/if}
  {/if}

  <!-- Modal de creación -->
  {#if showCreateForm}
    <div class="modal-overlay" on:click={() => showCreateForm = false}>
      <div class="modal" on:click|stopPropagation>
        <div class="modal-header">
          <h2>Crear Nuevo Platillo Base</h2>
          <button class="btn-close" on:click={() => showCreateForm = false}>×</button>
        </div>

        <form class="modal-body" on:submit|preventDefault={crearPlatilloBase}>
          <div class="form-group">
            <label for="nombre">Nombre *</label>
            <input 
              id="nombre"
              type="text" 
              bind:value={createForm.nombre}
              required
              class="input"
              placeholder="Ej: Tacos al Pastor"
            />
          </div>

          <div class="form-group">
            <label for="descripcion">Descripción *</label>
            <textarea 
              id="descripcion"
              bind:value={createForm.descripcion}
              required
              class="textarea"
              placeholder="Describe el platillo..."
            ></textarea>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label for="tipo-cocina-create">Tipo de Cocina *</label>
              <select id="tipo-cocina-create" bind:value={createForm.tipo_cocina} required class="select">
                <option value="">Seleccionar...</option>
                {#each tiposCocina as tipo}
                  <option value={tipo}>{tipo}</option>
                {/each}
              </select>
            </div>

            <div class="form-group">
              <label for="categoria-create">Categoría Principal *</label>
              <select id="categoria-create" bind:value={createForm.categoria_principal} required class="select">
                <option value="">Seleccionar...</option>
                {#each categoriasPopulares as categoria}
                  <option value={categoria}>{categoria}</option>
                {/each}
              </select>
            </div>
          </div>

          <div class="form-group">
            <label for="subcategoria">Subcategoría</label>
            <input 
              id="subcategoria"
              type="text" 
              bind:value={createForm.subcategoria}
              class="input"
              placeholder="Ej: Tacos de carne"
            />
          </div>

          <div class="form-group">
            <label>Ingredientes Principales *</label>
            <div class="ingredientes-input">
              <input 
                type="text" 
                bind:value={newIngrediente}
                placeholder="Agregar ingrediente..."
                class="input"
                on:keydown={(e) => e.key === 'Enter' && (e.preventDefault(), agregarIngrediente('create'))}
              />
              <button 
                type="button" 
                class="btn btn-sm btn-secondary"
                on:click={() => agregarIngrediente('create')}
              >
                +
              </button>
            </div>
            <div class="ingredientes-list">
              {#each createForm.ingredientes_principales as ingrediente, index}
                <span class="tag">
                  {ingrediente}
                  <button 
                    type="button" 
                    class="tag-remove"
                    on:click={() => removerIngrediente('create', index)}
                  >
                    ×
                  </button>
                </span>
              {/each}
            </div>
          </div>

          <div class="form-group">
            <label>Tags</label>
            <div class="tags-input">
              <input 
                type="text" 
                bind:value={newTag}
                placeholder="Agregar tag..."
                class="input"
                on:keydown={(e) => e.key === 'Enter' && (e.preventDefault(), agregarTag('create'))}
              />
              <button 
                type="button" 
                class="btn btn-sm btn-secondary"
                on:click={() => agregarTag('create')}
              >
                +
              </button>
            </div>
            <div class="tags-list">
              {#each (createForm.tags || []) as tag, index}
                <span class="tag tag-secondary">
                  {tag}
                  <button 
                    type="button" 
                    class="tag-remove"
                    on:click={() => removerTag('create', index)}
                  >
                    ×
                  </button>
                </span>
              {/each}
            </div>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label class="checkbox-label">
                <input 
                  type="checkbox" 
                  bind:checked={createForm.permite_variaciones}
                />
                Permite variaciones
              </label>
            </div>

            <div class="form-group">
              <label class="checkbox-label">
                <input 
                  type="checkbox" 
                  bind:checked={createForm.requiere_ingredientes_minimos}
                />
                Requiere ingredientes mínimos
              </label>
            </div>
          </div>

          <div class="modal-actions">
            <button type="button" class="btn btn-outline" on:click={() => showCreateForm = false}>
              Cancelar
            </button>
            <button type="submit" class="btn btn-primary" disabled={$loading}>
              {#if $loading}Creando...{:else}Crear Platillo Base{/if}
            </button>
          </div>
        </form>
      </div>
    </div>
  {/if}

  <!-- Modal de edición -->
  {#if showEditForm && selectedPlatilloId}
    <div class="modal-overlay" on:click={() => showEditForm = false}>
      <div class="modal" on:click|stopPropagation>
        <div class="modal-header">
          <h2>Editar Platillo Base</h2>
          <button class="btn-close" on:click={() => showEditForm = false}>×</button>
        </div>

        <form class="modal-body" on:submit|preventDefault={actualizarPlatilloBase}>
          <div class="form-group">
            <label for="nombre-edit">Nombre</label>
            <input 
              id="nombre-edit"
              type="text" 
              bind:value={editForm.nombre}
              class="input"
            />
          </div>

          <div class="form-group">
            <label for="descripcion-edit">Descripción</label>
            <textarea 
              id="descripcion-edit"
              bind:value={editForm.descripcion}
              class="textarea"
            ></textarea>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label for="tipo-cocina-edit">Tipo de Cocina</label>
              <select id="tipo-cocina-edit" bind:value={editForm.tipo_cocina} class="select">
                <option value="">Seleccionar...</option>
                {#each tiposCocina as tipo}
                  <option value={tipo}>{tipo}</option>
                {/each}
              </select>
            </div>

            <div class="form-group">
              <label for="categoria-edit">Categoría Principal</label>
              <select id="categoria-edit" bind:value={editForm.categoria_principal} class="select">
                <option value="">Seleccionar...</option>
                {#each categoriasPopulares as categoria}
                  <option value={categoria}>{categoria}</option>
                {/each}
              </select>
            </div>
          </div>

          <div class="form-group">
            <label for="subcategoria-edit">Subcategoría</label>
            <input 
              id="subcategoria-edit"
              type="text" 
              bind:value={editForm.subcategoria}
              class="input"
            />
          </div>

          <div class="form-group">
            <label>Ingredientes Principales</label>
            <div class="ingredientes-input">
              <input 
                type="text" 
                bind:value={newIngrediente}
                placeholder="Agregar ingrediente..."
                class="input"
                on:keydown={(e) => e.key === 'Enter' && (e.preventDefault(), agregarIngrediente('edit'))}
              />
              <button 
                type="button" 
                class="btn btn-sm btn-secondary"
                on:click={() => agregarIngrediente('edit')}
              >
                +
              </button>
            </div>
            <div class="ingredientes-list">
              {#each editForm.ingredientes_principales || [] as ingrediente, index}
                <span class="tag">
                  {ingrediente}
                  <button 
                    type="button" 
                    class="tag-remove"
                    on:click={() => removerIngrediente('edit', index)}
                  >
                    ×
                  </button>
                </span>
              {/each}
            </div>
          </div>

          <div class="form-group">
            <label>Tags</label>
            <div class="tags-input">
              <input 
                type="text" 
                bind:value={newTag}
                placeholder="Agregar tag..."
                class="input"
                on:keydown={(e) => e.key === 'Enter' && (e.preventDefault(), agregarTag('edit'))}
              />
              <button 
                type="button" 
                class="btn btn-sm btn-secondary"
                on:click={() => agregarTag('edit')}
              >
                +
              </button>
            </div>
            <div class="tags-list">
              {#each editForm.tags || [] as tag, index}
                <span class="tag tag-secondary">
                  {tag}
                  <button 
                    type="button" 
                    class="tag-remove"
                    on:click={() => removerTag('edit', index)}
                  >
                    ×
                  </button>
                </span>
              {/each}
            </div>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label class="checkbox-label">
                <input 
                  type="checkbox" 
                  bind:checked={editForm.permite_variaciones}
                />
                Permite variaciones
              </label>
            </div>

            <div class="form-group">
              <label class="checkbox-label">
                <input 
                  type="checkbox" 
                  bind:checked={editForm.requiere_ingredientes_minimos}
                />
                Requiere ingredientes mínimos
              </label>
            </div>
          </div>

          <div class="modal-actions">
            <button type="button" class="btn btn-outline" on:click={() => showEditForm = false}>
              Cancelar
            </button>
            <button type="submit" class="btn btn-primary" disabled={$loading}>
              {#if $loading}Actualizando...{:else}Actualizar Platillo Base{/if}
            </button>
          </div>
        </form>
      </div>
    </div>
  {/if}
</div>

<style>
  .platillo-base-manager {
    max-width: 1200px;
    margin: 0 auto;
    padding: 20px;
  }

  .header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 30px;
  }

  .header h1 {
    margin: 0;
    color: #1f2937;
  }

  .filtros {
    background: #f9fafb;
    padding: 20px;
    border-radius: 8px;
    margin-bottom: 30px;
  }

  .filtros-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 15px;
    margin-bottom: 15px;
  }

  .filtro-grupo label {
    display: block;
    margin-bottom: 5px;
    font-weight: 500;
    color: #374151;
  }

  .filtros-acciones {
    display: flex;
    gap: 10px;
  }

  .loading {
    text-align: center;
    padding: 40px;
  }

  .spinner {
    border: 3px solid #f3f4f6;
    border-top: 3px solid #3b82f6;
    border-radius: 50%;
    width: 30px;
    height: 30px;
    animation: spin 1s linear infinite;
    margin: 0 auto 15px;
  }

  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }

  .error {
    background: #fef2f2;
    border: 1px solid #fecaca;
    color: #dc2626;
    padding: 15px;
    border-radius: 8px;
    margin-bottom: 20px;
  }

  .platillos-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
    gap: 20px;
    margin-bottom: 30px;
  }

  .platillo-card {
    background: white;
    border: 1px solid #e5e7eb;
    border-radius: 8px;
    padding: 20px;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    transition: box-shadow 0.2s;
  }

  .platillo-card:hover {
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  }

  .platillo-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 10px;
  }

  .platillo-header h3 {
    margin: 0;
    color: #1f2937;
    font-size: 1.1rem;
  }

  .badges {
    display: flex;
    gap: 5px;
  }

  .badge {
    padding: 2px 8px;
    border-radius: 12px;
    font-size: 0.75rem;
    font-weight: 500;
    color: white;
    text-transform: capitalize;
  }

  .descripcion {
    color: #6b7280;
    margin-bottom: 15px;
    line-height: 1.5;
  }

  .platillo-info {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 8px;
    margin-bottom: 15px;
  }

  .info-item {
    font-size: 0.875rem;
  }

  .info-item strong {
    color: #374151;
  }

  .ingredientes {
    margin-bottom: 15px;
  }

  .ingredientes strong {
    display: block;
    margin-bottom: 5px;
    color: #374151;
  }

  .tags {
    display: flex;
    flex-wrap: wrap;
    gap: 5px;
  }

  .tag {
    background: #e5e7eb;
    color: #374151;
    padding: 2px 8px;
    border-radius: 12px;
    font-size: 0.75rem;
    display: flex;
    align-items: center;
    gap: 5px;
  }

  .tag-secondary {
    background: #f3f4f6;
    color: #6b7280;
  }

  .tag-remove {
    background: none;
    border: none;
    color: inherit;
    cursor: pointer;
    font-size: 1rem;
    padding: 0;
    line-height: 1;
  }

  .platillo-acciones {
    display: flex;
    gap: 10px;
    margin-top: 15px;
  }

  .pagination {
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 15px;
    margin-top: 30px;
  }

  .pagination-info {
    color: #6b7280;
  }

  .modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
  }

  .modal {
    background: white;
    border-radius: 8px;
    max-width: 600px;
    width: 90%;
    max-height: 90vh;
    overflow-y: auto;
  }

  .modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 20px;
    border-bottom: 1px solid #e5e7eb;
  }

  .modal-header h2 {
    margin: 0;
    color: #1f2937;
  }

  .btn-close {
    background: none;
    border: none;
    font-size: 1.5rem;
    cursor: pointer;
    color: #6b7280;
  }

  .modal-body {
    padding: 20px;
  }

  .form-group {
    margin-bottom: 20px;
  }

  .form-row {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 15px;
  }

  .form-group label {
    display: block;
    margin-bottom: 5px;
    font-weight: 500;
    color: #374151;
  }

  .input, .select, .textarea {
    width: 100%;
    padding: 8px 12px;
    border: 1px solid #d1d5db;
    border-radius: 6px;
    font-size: 0.875rem;
  }

  .textarea {
    min-height: 80px;
    resize: vertical;
  }

  .ingredientes-input, .tags-input {
    display: flex;
    gap: 10px;
    margin-bottom: 10px;
  }

  .ingredientes-input .input, .tags-input .input {
    flex: 1;
  }

  .ingredientes-list, .tags-list {
    display: flex;
    flex-wrap: wrap;
    gap: 5px;
  }

  .checkbox-label {
    display: flex;
    align-items: center;
    gap: 8px;
    cursor: pointer;
  }

  .checkbox-label input[type="checkbox"] {
    margin: 0;
  }

  .modal-actions {
    display: flex;
    justify-content: flex-end;
    gap: 10px;
    margin-top: 30px;
    padding-top: 20px;
    border-top: 1px solid #e5e7eb;
  }

  .btn {
    padding: 8px 16px;
    border: none;
    border-radius: 6px;
    font-size: 0.875rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s;
  }

  .btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .btn-primary {
    background: #3b82f6;
    color: white;
  }

  .btn-primary:hover:not(:disabled) {
    background: #2563eb;
  }

  .btn-secondary {
    background: #6b7280;
    color: white;
  }

  .btn-secondary:hover:not(:disabled) {
    background: #4b5563;
  }

  .btn-danger {
    background: #ef4444;
    color: white;
  }

  .btn-danger:hover:not(:disabled) {
    background: #dc2626;
  }

  .btn-outline {
    background: white;
    color: #374151;
    border: 1px solid #d1d5db;
  }

  .btn-outline:hover:not(:disabled) {
    background: #f9fafb;
  }

  .btn-sm {
    padding: 4px 8px;
    font-size: 0.75rem;
  }

  @media (max-width: 768px) {
    .header {
      flex-direction: column;
      gap: 15px;
      align-items: stretch;
    }

    .filtros-grid {
      grid-template-columns: 1fr;
    }

    .platillos-grid {
      grid-template-columns: 1fr;
    }

    .form-row {
      grid-template-columns: 1fr;
    }

    .modal {
      width: 95%;
      margin: 10px;
    }
  }
</style> 