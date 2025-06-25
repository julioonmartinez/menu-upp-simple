<!-- src/components/LinkManager.svelte -->
<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import type { 
    Link, 
    LinkCreateData, 
    LinkUpdateData, 
    LinkType 
  } from '../interfaces/links.ts';
  import { 
    validateLinkData,
    sortLinksByOrder,
    LINK_TYPE_LABELS,
    LINK_TYPE_ICONS,
    formatClickCount,
    LinkType as LinkTypeEnum
  } from '../interfaces/links.ts';
  import { useLinkTrees } from '../stores/linkTreeStore.ts';

  // Props
  export let linkTreeId: string;
  export let links: Link[] = [];
  export let editable = true;
  export let showAnalytics = false;

  // Event dispatcher
  const dispatch = createEventDispatcher<{
    linkCreated: Link;
    linkUpdated: Link;
    linkDeleted: string;
    linkReordered: { linkId: string; newOrder: number };
  }>();

  // Store state
  const {
    currentLinks,
    isLoadingLinks,
    isCreatingLink,
    isUpdatingLink,
    isDeletingLink,
    linkError,
    loadLinks,
    createLink,
    updateLink,
    deleteLink
  } = useLinkTrees();

  // Local state
  let displayLinks: Link[] = [];
  let showCreateForm = false;
  let editingLink: Link | null = null;
  let deletingLinkId: string | null = null;
  let draggedLink: Link | null = null;
  let dropTarget: number | null = null;

  // Form state
  let linkForm = {
    title: '',
    url: '',
    icon: '',
    description: '',
    type: 'custom' as LinkType,
    active: true,
    customColor: '#3b82f6'
  };

  let formErrors: string[] = [];

  // Reactive statements
  $: displayLinks = links.length > 0 ? sortLinksByOrder(links) : sortLinksByOrder(currentLinks);
  $: isLoading = isLoadingLinks;
  $: error = linkError;

  // Initialize
  async function initializeLinks() {
    if (!links.length) {
      await loadLinks(linkTreeId);
    }
  }

  // Reset form
  function resetForm() {
    linkForm = {
      title: '',
      url: '',
      icon: '',
      description: '',
      type: 'custom' as LinkType,
      active: true,
      customColor: '#3b82f6'
    };
    formErrors = [];
  }

  // Validate link form
  function validateForm(): boolean {
    const validation = validateLinkData(linkForm);
    formErrors = validation.errors;
    return validation.isValid;
  }

  // Handle create link
  async function handleCreateLink() {
    if (!validateForm()) return;

    try {
      const result = await createLink(linkTreeId, {
        ...linkForm,
        order: displayLinks.length
      });

      if (result.success && result.link) {
        dispatch('linkCreated', result.link);
        resetForm();
        showCreateForm = false;
      }
    } catch (err) {
      console.error('Error creating link:', err);
    }
  }

  // Handle edit link
  function startEditLink(link: Link) {
    editingLink = link;
    linkForm = {
      title: link.title,
      url: link.url,
      icon: link.icon || '',
      description: link.description || '',
      type: link.type,
      active: link.active,
      customColor: link.customColor || '#3b82f6'
    };
    formErrors = [];
  }

  // Handle update link
  async function handleUpdateLink() {
    if (!editingLink || !validateForm()) return;

    try {
      const result = await updateLink(linkTreeId, editingLink.id!, linkForm);

      if (result.success && result.link) {
        dispatch('linkUpdated', result.link);
        resetForm();
        editingLink = null;
      }
    } catch (err) {
      console.error('Error updating link:', err);
    }
  }

  // Handle delete link
  async function handleDeleteLink(linkId: string) {
    if (!confirm('¿Estás seguro de que quieres eliminar este enlace?')) {
      return;
    }

    deletingLinkId = linkId;

    try {
      const result = await deleteLink(linkTreeId, linkId);

      if (result.success) {
        dispatch('linkDeleted', linkId);
      }
    } catch (err) {
      console.error('Error deleting link:', err);
    } finally {
      deletingLinkId = null;
    }
  }

  // Handle drag start
  function handleDragStart(event: DragEvent, link: Link) {
    if (!editable) return;
    
    draggedLink = link;
    if (event.dataTransfer) {
      event.dataTransfer.effectAllowed = 'move';
      event.dataTransfer.setData('text/html', '');
    }
  }

  // Handle drag over
  function handleDragOver(event: DragEvent, index: number) {
    if (!editable || !draggedLink) return;
    
    event.preventDefault();
    dropTarget = index;
  }

  // Handle drop
  async function handleDrop(event: DragEvent, targetIndex: number) {
    if (!editable || !draggedLink) return;
    
    event.preventDefault();
    
    const sourceIndex = displayLinks.findIndex(l => l.id === draggedLink!.id);
    
    if (sourceIndex !== targetIndex && draggedLink.id) {
      // Calculate new order
      let newOrder: number;
      
      if (targetIndex === 0) {
        newOrder = 0;
      } else if (targetIndex >= displayLinks.length - 1) {
        newOrder = displayLinks.length;
      } else {
        newOrder = targetIndex;
      }
      
      try {
        const result = await updateLink(linkTreeId, draggedLink.id, { order: newOrder });
        
        if (result.success) {
          dispatch('linkReordered', { linkId: draggedLink.id, newOrder });
        }
      } catch (err) {
        console.error('Error reordering link:', err);
      }
    }
    
    draggedLink = null;
    dropTarget = null;
  }

  // Handle drag end
  function handleDragEnd() {
    draggedLink = null;
    dropTarget = null;
  }

  // Cancel edit
  function cancelEdit() {
    editingLink = null;
    resetForm();
  }

  // Cancel create
  function cancelCreate() {
    showCreateForm = false;
    resetForm();
  }

  // Toggle link active status
  async function toggleLinkActive(link: Link) {
    if (!editable || !link.id) return;

    try {
      const result = await updateLink(linkTreeId, link.id, { active: !link.active });
      
      if (result.success && result.link) {
        dispatch('linkUpdated', result.link);
      }
    } catch (err) {
      console.error('Error toggling link status:', err);
    }
  }

  // Get link type icon
  function getTypeIcon(type: LinkType): string {
    return LINK_TYPE_ICONS[type] || 'link';
  }

  // Initialize on mount
  initializeLinks();
</script>

<div class="link-manager">
  <!-- Header -->
  <div class="manager-header">
    <div class="header-content">
      <h3>Enlaces ({displayLinks.length})</h3>
      <p>Gestiona los enlaces de tu LinkTree</p>
    </div>
    
    {#if editable}
      <button 
        class="btn btn-primary"
        on:click={() => showCreateForm = true}
        disabled={showCreateForm || (editingLink ? true : false ) }
      >
        <i class="icon-plus"></i>
        Agregar Enlace
      </button>
    {/if}
  </div>

  <!-- Error display -->
  {#if error}
    <div class="error-message">
      <i class="icon-alert-circle"></i>
      {error}
    </div>
  {/if}

  <!-- Create Form -->
  {#if showCreateForm}
    <div class="link-form">
      <div class="form-header">
        <h4>Crear Nuevo Enlace</h4>
        <div class="form-actions">
          <button class="btn btn-sm btn-secondary" on:click={cancelCreate}>
            Cancelar
          </button>
          <button 
            class="btn btn-sm btn-primary" 
            on:click={handleCreateLink}
            disabled={isCreatingLink}
          >
            {#if isCreatingLink}
              <i class="icon-loader spinning"></i>
              Creando...
            {:else}
              Crear
            {/if}
          </button>
        </div>
      </div>

      <!-- Form errors -->
      {#if formErrors.length > 0}
        <div class="form-errors">
          <ul>
            {#each formErrors as error}
              <li>{error}</li>
            {/each}
          </ul>
        </div>
      {/if}

      <div class="form-grid">
        <div class="form-group">
          <label for="create-title">Título *</label>
          <input
            id="create-title"
            type="text"
            bind:value={linkForm.title}
            placeholder="Mi enlace"
            maxlength="100"
            required
          />
        </div>

        <div class="form-group">
          <label for="create-url">URL *</label>
          <input
            id="create-url"
            type="url"
            bind:value={linkForm.url}
            placeholder="https://ejemplo.com"
            required
          />
        </div>

        <div class="form-group">
          <label for="create-type">Tipo</label>
          <select id="create-type" bind:value={linkForm.type}>
            {#each Object.entries(LINK_TYPE_LABELS) as [value, label]}
              <option value={value}>{label}</option>
            {/each}
          </select>
        </div>

        <div class="form-group">
          <label for="create-icon">Icono</label>
          <input
            id="create-icon"
            type="text"
            bind:value={linkForm.icon}
            placeholder="instagram, menu, etc."
          />
        </div>

        <div class="form-group span-2">
          <label for="create-description">Descripción</label>
          <input
            id="create-description"
            type="text"
            bind:value={linkForm.description}
            placeholder="Descripción opcional"
            maxlength="200"
          />
        </div>

        <div class="form-group">
          <label for="create-color">Color Personalizado</label>
          <input
            id="create-color"
            type="color"
            bind:value={linkForm.customColor}
          />
        </div>

        <div class="form-group">
          <label>
            <input
              type="checkbox"
              bind:checked={linkForm.active}
            />
            Enlace activo
          </label>
        </div>
      </div>
    </div>
  {/if}

  <!-- Links List -->
  {#if isLoading}
    <div class="loading-state">
      <div class="loading-spinner"></div>
      <p>Cargando enlaces...</p>
    </div>
  {:else if displayLinks.length === 0}
    <div class="empty-state">
      <div class="empty-icon">🔗</div>
      <h4>No hay enlaces</h4>
      <p>
        {editable 
          ? 'Comienza agregando tu primer enlace'
          : 'Este LinkTree no tiene enlaces configurados'
        }
      </p>
    </div>
  {:else}
    <div class="links-list">
      {#each displayLinks as link, index (link.id)}
        <div 
          class="link-item"
          class:editing={editingLink?.id === link.id}
          class:dragging={draggedLink?.id === link.id}
          class:drop-target={dropTarget === index}
          class:inactive={!link.active}
          draggable={editable}
          on:dragstart={(e) => handleDragStart(e, link)}
          on:dragover={(e) => handleDragOver(e, index)}
          on:drop={(e) => handleDrop(e, index)}
          on:dragend={handleDragEnd}
        >
          {#if editingLink?.id === link.id}
            <!-- Edit Form -->
            <div class="link-edit-form">
              <div class="form-header">
                <h4>Editar Enlace</h4>
                <div class="form-actions">
                  <button class="btn btn-sm btn-secondary" on:click={cancelEdit}>
                    Cancelar
                  </button>
                  <button 
                    class="btn btn-sm btn-primary" 
                    on:click={handleUpdateLink}
                    disabled={isUpdatingLink}
                  >
                    {#if isUpdatingLink}
                      <i class="icon-loader spinning"></i>
                      Guardando...
                    {:else}
                      Guardar
                    {/if}
                  </button>
                </div>
              </div>

              <!-- Form errors -->
              {#if formErrors.length > 0}
                <div class="form-errors">
                  <ul>
                    {#each formErrors as error}
                      <li>{error}</li>
                    {/each}
                  </ul>
                </div>
              {/if}

              <div class="form-grid">
                <div class="form-group">
                  <label>Título *</label>
                  <input
                    type="text"
                    bind:value={linkForm.title}
                    maxlength="100"
                    required
                  />
                </div>

                <div class="form-group">
                  <label>URL *</label>
                  <input
                    type="url"
                    bind:value={linkForm.url}
                    required
                  />
                </div>

                <div class="form-group">
                  <label>Tipo</label>
                  <select bind:value={linkForm.type}>
                    {#each Object.entries(LINK_TYPE_LABELS) as [value, label]}
                      <option value={value}>{label}</option>
                    {/each}
                  </select>
                </div>

                <div class="form-group">
                  <label>Icono</label>
                  <input
                    type="text"
                    bind:value={linkForm.icon}
                    placeholder="instagram, menu, etc."
                  />
                </div>

                <div class="form-group span-2">
                  <label>Descripción</label>
                  <input
                    type="text"
                    bind:value={linkForm.description}
                    maxlength="200"
                  />
                </div>

                <div class="form-group">
                  <label>Color</label>
                  <input
                    type="color"
                    bind:value={linkForm.customColor}
                  />
                </div>

                <div class="form-group">
                  <label>
                    <input
                      type="checkbox"
                      bind:checked={linkForm.active}
                    />
                    Activo
                  </label>
                </div>
              </div>
            </div>
          {:else}
            <!-- Link Display -->
            <div class="link-content">
              <div class="link-handle" class:hidden={!editable}>
                <i class="icon-grip-vertical"></i>
              </div>

              <div class="link-icon" style="background-color: {link.customColor || '#3b82f6'}">
                <i class="icon-{link.icon || getTypeIcon(link.type)}"></i>
              </div>

              <div class="link-details">
                <div class="link-title">{link.title}</div>
                <div class="link-url">{link.url}</div>
                {#if link.description}
                  <div class="link-description">{link.description}</div>
                {/if}
                <div class="link-meta">
                  <span class="link-type">{LINK_TYPE_LABELS[link.type]}</span>
                  {#if showAnalytics && link.analytics}
                    <span class="link-clicks">
                      {formatClickCount(link.analytics.clicks)} clics
                    </span>
                  {/if}
                </div>
              </div>

              {#if editable}
                <div class="link-actions">
                  <button
                    class="btn-icon"
                    class:active={link.active}
                    on:click={() => toggleLinkActive(link)}
                    title={link.active ? 'Desactivar' : 'Activar'}
                  >
                    <i class="icon-{link.active ? 'eye' : 'eye-off'}"></i>
                  </button>

                  <button
                    class="btn-icon"
                    on:click={() => startEditLink(link)}
                    title="Editar"
                  >
                    <i class="icon-edit"></i>
                  </button>

                  <button
                    class="btn-icon delete"
                    on:click={() => handleDeleteLink(link.id!)}
                    disabled={deletingLinkId === link.id}
                    title="Eliminar"
                  >
                    {#if deletingLinkId === link.id}
                      <i class="icon-loader spinning"></i>
                    {:else}
                      <i class="icon-trash"></i>
                    {/if}
                  </button>
                </div>
              {/if}
            </div>
          {/if}
        </div>
      {/each}
    </div>
  {/if}
</div>

<style>
  .link-manager {
    background: white;
    border-radius: 12px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    overflow: hidden;
  }

  .manager-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1.5rem;
    border-bottom: 1px solid #e5e7eb;
    background: #f9fafb;
  }

  .header-content h3 {
    margin: 0 0 0.25rem 0;
    color: #111827;
  }

  .header-content p {
    margin: 0;
    color: #6b7280;
    font-size: 0.875rem;
  }

  .error-message {
    background: #fef2f2;
    border: 1px solid #fecaca;
    color: #dc2626;
    padding: 1rem;
    margin: 1rem;
    border-radius: 8px;
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .loading-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 3rem;
    color: #6b7280;
  }

  .loading-spinner {
    width: 24px;
    height: 24px;
    border: 2px solid #e5e7eb;
    border-top: 2px solid #3b82f6;
    border-radius: 50%;
    animation: spin 1s linear infinite;
    margin-bottom: 1rem;
  }

  .empty-state {
    text-align: center;
    padding: 3rem 1rem;
    color: #6b7280;
  }

  .empty-icon {
    font-size: 3rem;
    margin-bottom: 1rem;
  }

  .empty-state h4 {
    margin: 0 0 0.5rem 0;
    color: #374151;
  }

  .empty-state p {
    margin: 0;
  }

  .link-form,
  .link-edit-form {
    background: #f9fafb;
    border: 1px solid #e5e7eb;
    border-radius: 8px;
    padding: 1.5rem;
    margin: 1rem;
  }

  .form-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1rem;
  }

  .form-header h4 {
    margin: 0;
    color: #111827;
  }

  .form-actions {
    display: flex;
    gap: 0.5rem;
  }

  .form-errors {
    background: #fef2f2;
    border: 1px solid #fecaca;
    color: #dc2626;
    padding: 0.75rem;
    border-radius: 6px;
    margin-bottom: 1rem;
  }

  .form-errors ul {
    margin: 0;
    padding-left: 1.25rem;
  }

  .form-errors li {
    font-size: 0.875rem;
  }

  .form-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 1rem;
  }

  .form-group {
    display: flex;
    flex-direction: column;
  }

  .form-group.span-2 {
    grid-column: span 2;
  }

  .form-group label {
    font-weight: 500;
    color: #374151;
    margin-bottom: 0.25rem;
    font-size: 0.875rem;
  }

  .form-group input,
  .form-group select {
    padding: 0.5rem;
    border: 1px solid #d1d5db;
    border-radius: 6px;
    font-size: 0.875rem;
  }

  .form-group input:focus,
  .form-group select:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }

  .form-group input[type="color"] {
    width: 50px;
    height: 40px;
    padding: 0;
    cursor: pointer;
  }

  .form-group input[type="checkbox"] {
    width: auto;
    margin-right: 0.5rem;
  }

  .links-list {
    padding: 1rem;
  }

  .link-item {
    border: 1px solid #e5e7eb;
    border-radius: 8px;
    margin-bottom: 0.75rem;
    background: white;
    transition: all 0.2s;
  }

  .link-item:last-child {
    margin-bottom: 0;
  }

  .link-item.inactive {
    opacity: 0.6;
  }

  .link-item.dragging {
    opacity: 0.5;
    transform: rotate(5deg);
  }

  .link-item.drop-target {
    border-color: #3b82f6;
    background: #eff6ff;
  }

  .link-item.editing {
    border-color: #3b82f6;
  }

  .link-content {
    display: flex;
    align-items: center;
    gap: 1rem;
    padding: 1rem;
  }

  .link-handle {
    cursor: grab;
    color: #9ca3af;
    padding: 0.25rem;
  }

  .link-handle:active {
    cursor: grabbing;
  }

  .link-handle.hidden {
    display: none;
  }

  .link-icon {
    width: 40px;
    height: 40px;
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    font-size: 1.125rem;
    flex-shrink: 0;
  }

  .link-details {
    flex: 1;
    min-width: 0;
  }

  .link-title {
    font-weight: 600;
    color: #111827;
    margin-bottom: 0.25rem;
  }

  .link-url {
    font-size: 0.875rem;
    color: #3b82f6;
    margin-bottom: 0.25rem;
    word-break: break-all;
  }

  .link-description {
    font-size: 0.875rem;
    color: #6b7280;
    margin-bottom: 0.25rem;
  }

  .link-meta {
    display: flex;
    gap: 1rem;
    font-size: 0.75rem;
    color: #9ca3af;
  }

  .link-actions {
    display: flex;
    gap: 0.5rem;
    flex-shrink: 0;
  }

  .btn-icon {
    width: 32px;
    height: 32px;
    border: none;
    background: #f3f4f6;
    color: #6b7280;
    border-radius: 6px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s;
  }

  .btn-icon:hover {
    background: #e5e7eb;
    color: #374151;
  }

  .btn-icon.active {
    background: #dcfce7;
    color: #16a34a;
  }

  .btn-icon.delete {
    color: #dc2626;
  }

  .btn-icon.delete:hover {
    background: #fef2f2;
  }

  .btn {
    padding: 0.5rem 1rem;
    border: none;
    border-radius: 6px;
    font-size: 0.875rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s;
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .btn-sm {
    padding: 0.375rem 0.75rem;
    font-size: 0.8125rem;
  }

  .btn-primary {
    background: #3b82f6;
    color: white;
  }

  .btn-primary:hover:not(:disabled) {
    background: #2563eb;
  }

  .btn-secondary {
    background: #f3f4f6;
    color: #374151;
    border: 1px solid #d1d5db;
  }

  .btn-secondary:hover:not(:disabled) {
    background: #e5e7eb;
  }

  .spinning {
    animation: spin 1s linear infinite;
  }

  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }

  /* Responsive */
  @media (max-width: 768px) {
    .manager-header {
      flex-direction: column;
      gap: 1rem;
      align-items: stretch;
    }

    .form-grid {
      grid-template-columns: 1fr;
    }

    .form-group.span-2 {
      grid-column: span 1;
    }

    .link-content {
      flex-wrap: wrap;
      gap: 0.75rem;
    }

    .link-actions {
      width: 100%;
      justify-content: flex-end;
    }
  }
</style>