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
  import { toastStore } from '../stores/toastStore.ts';
  import { getIconClass } from '../utils/iconUtils.ts';
  import LinkItem from './LinkItem.svelte';
  import IconPicker from './ui/IconPicker.svelte';
  import InputField from './ui/InputField.svelte';
  import TextareaField from './ui/TextareaField.svelte';
  import ColorPicker from './ui/ColorPicker.svelte';
  import ToggleSwitch from './ui/ToggleSwitch.svelte';
  import SelectField from './ui/SelectField.svelte';
  import GlobalModal from './ui/GlobalModal.svelte';
  import ConfirmationModal from './ui/ConfirmationModal.svelte';

  // Props
  export let linkTreeId: string;
  export let links: Link[] = [];
  export let editable = true;
  export let showAnalytics = false;
  export let restaurantUsername: string = '';

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
  let showCreateForm = false;
  let showEditForm = false;
  let showDeleteConfirm = false;
  let editingLink: Link | null = null;
  let deletingLinkId: string | null = null;
  let linkToDelete: Link | null = null;
  let draggedLink: Link | null = null;
  let dropTarget: number | null = null;

  // Form state
  let linkForm = {
    title: '',
    url: '',
    icon: '',
    description: '',
    type: LinkTypeEnum.CUSTOM,
    active: true,
    customColor: '#3b82f6'
  };

  // Menu link state
  let isMenuLink = false;

  let formErrors: string[] = [];

  // Reactive statements
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
      type: LinkTypeEnum.CUSTOM,
      active: true,
      customColor: '#3b82f6'
    };
    formErrors = [];
    isMenuLink = false;
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
        order: sortLinksByOrder(links).length
      });

      if (result.success && result.link) {
        dispatch('linkCreated', result.link);
        
        // Toast de éxito
        toastStore.success('Enlace creado correctamente');
        
        resetForm();
        showCreateForm = false;
        
        await initializeLinks();
      } else {
        // Toast de error
        toastStore.error(result.error || 'No se pudo crear el enlace');
      }
    } catch (err) {
      console.error('Error creating link:', err);
      toastStore.error('Error al crear el enlace');
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
    
    // Check if this is a menu link
    isMenuLink = link.type === LinkTypeEnum.MENU && link.url.includes('/menu');
    
    formErrors = [];
    showEditForm = true;
  }

  // Handle update link
  async function handleUpdateLink() {
    if (!editingLink || !validateForm()) return;

    try {
      const result = await updateLink(linkTreeId, editingLink.id!, linkForm);

      if (result.success && result.link) {
        dispatch('linkUpdated', result.link);
        
        // Toast de éxito
        toastStore.success('Enlace actualizado correctamente');
        
        resetForm();
        editingLink = null;
        showEditForm = false;
        
        await initializeLinks();
      } else {
        // Toast de error
        toastStore.error(result.error || 'No se pudo actualizar el enlace');
      }
    } catch (err) {
      console.error('Error updating link:', err);
      toastStore.error('Error al actualizar el enlace');
    }
  }

  // Handle delete link - mostrar modal de confirmación
  function showDeleteConfirmation(link: Link) {
    linkToDelete = link;
    showDeleteConfirm = true;
  }

  // Handle delete link - ejecutar eliminación
  async function handleDeleteLink() {
    if (!linkToDelete) return;
    
    deletingLinkId = linkToDelete.id!;
    showDeleteConfirm = false;

    try {
      const result = await deleteLink(linkTreeId, linkToDelete.id!);

      if (result.success) {
        dispatch('linkDeleted', linkToDelete.id!);
        
        // Toast de éxito
        toastStore.success('Enlace eliminado correctamente');
        
        await initializeLinks();
      } else {
        // Toast de error
        toastStore.error(result.error || 'No se pudo eliminar el enlace');
      }
    } catch (err) {
      console.error('Error deleting link:', err);
      toastStore.error('Error al eliminar el enlace');
    } finally {
      deletingLinkId = null;
      linkToDelete = null;
    }
  }

  // Cancelar eliminación
  function cancelDelete() {
    showDeleteConfirm = false;
    linkToDelete = null;
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
    
    const sourceIndex = sortLinksByOrder(links).findIndex(l => l.id === draggedLink!.id);
    
    if (sourceIndex !== targetIndex && draggedLink.id) {
      // Calculate new order
      let newOrder: number;
      
      if (targetIndex === 0) {
        newOrder = 0;
      } else if (targetIndex >= sortLinksByOrder(links).length - 1) {
        newOrder = sortLinksByOrder(links).length;
      } else {
        newOrder = targetIndex;
      }
      
      try {
        const result = await updateLink(linkTreeId, draggedLink.id, { order: newOrder });
        
        if (result.success) {
          dispatch('linkReordered', { linkId: draggedLink.id, newOrder });
          
          // Toast de éxito
          toastStore.success('Orden de enlaces actualizado');
        } else {
          // Toast de error
          toastStore.error('No se pudo actualizar el orden de los enlaces');
        }
      } catch (err) {
        console.error('Error reordering link:', err);
        toastStore.error('Error al reordenar los enlaces');
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
    showEditForm = false;
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
        
        // Toast de éxito
        const status = result.link.active ? 'activado' : 'desactivado';
        toastStore.success(`Enlace ${status} correctamente`);
      } else {
        // Toast de error
        toastStore.error(result.error || 'No se pudo cambiar el estado del enlace');
      }
    } catch (err) {
      console.error('Error toggling link status:', err);
      toastStore.error('Error al cambiar el estado del enlace');
    }
  }

  // Get Font Awesome icon class for link
  function getLinkIconClass(link: Link): string {
    if (link.icon) {
      // Usar la nueva utilidad de iconos
      return getIconClass(link.icon);
    }
    
    // Use the icon from LINK_TYPE_ICONS for the link type
    return LINK_TYPE_ICONS[link.type] || 'fa-solid fa-link';
  }

  // Handle menu link toggle
  function handleMenuLinkToggle() {
    if (isMenuLink) {
      // Set menu link properties
      linkForm.type = LinkTypeEnum.MENU;
      linkForm.url = `https://www.menuupp.com/${restaurantUsername}/menu`;
      linkForm.icon = 'utensils';
      if (!linkForm.title) {
        linkForm.title = 'Ver Menú';
      }
      if (!linkForm.description) {
        linkForm.description = 'Descubre nuestros platillos';
      }
    } else {
      // Reset to custom type
      linkForm.type = LinkTypeEnum.CUSTOM;
      linkForm.url = '';
      linkForm.icon = '';
    }
  }

  // Initialize on mount
  initializeLinks();
</script>

<div class="link-manager card">
  <!-- Header -->
  <div class="management-header">
    <div class="flex justify-between items-center">
      <div>
        <h3 class="text-2xl font-bold text-primary mb-sm">Enlaces ({sortLinksByOrder(links).length})</h3>
        <p class="text-muted">Gestiona los enlaces de tu LinkTree</p>
      </div>
      
      {#if editable}
        <button 
          class="btn btn-primary"
          on:click={() => showCreateForm = true}
          disabled={showCreateForm || showEditForm}
        >
          <i class="fa-solid fa-plus"></i>
          Agregar Enlace
        </button>
      {/if}
    </div>
  </div>

  <!-- Error display -->
  {#if $error}
    <div class="error-state">
      <i class="fa-solid fa-circle-exclamation"></i>
      <h3>Error</h3>
      <p>{$error}</p>
    </div>
  {/if}

  <!-- Links List -->
  {#if $isLoading}
    <div class="loading-state">
      <div class="animate-spin w-xl h-xl border-2 border-accent border-t-primary rounded-full mb-md"></div>
      <p class="text-muted">Cargando enlaces...</p>
    </div>
  {:else if sortLinksByOrder(links).length === 0}
    <div class="empty-state">
      <div class="text-6xl mb-md">🔗</div>
      <h4 class="text-xl font-semibold text-primary mb-sm">No hay enlaces</h4>
      <p class="text-muted">
        {editable 
          ? 'Comienza agregando tu primer enlace'
          : 'Este LinkTree no tiene enlaces configurados'
        }
      </p>
    </div>
  {:else}
    <div class="links-list">
      {#each sortLinksByOrder(links) as link, index (link.id)}
        <div 
          class="link-item card card-compact"
          class:dragging={draggedLink?.id === link.id}
          class:drop-target={dropTarget === index}
          class:inactive={!link.active}
          draggable={editable}
          on:dragstart={(e) => handleDragStart(e, link)}
          on:dragover={(e) => handleDragOver(e, index)}
          on:drop={(e) => handleDrop(e, index)}
          on:dragend={handleDragEnd}
        >
          <!-- Link Display -->
          <div class="link-content flex items-center gap-lg">
            <div class="link-handle" class:hidden={!editable}>
              <i class="fa-solid fa-grip-vertical text-muted"></i>
            </div>

            <div class="link-icon flex-shrink-0" style="background-color: {link.customColor || '#3b82f6'}">
              <i class="{getLinkIconClass(link)} text-inverse"></i>
            </div>

            <div class="link-details flex-1 min-w-0">
              <div class="link-title text-lg font-semibold text-primary mb-xs">{link.title}</div>
              <div class="link-url text-sm text-accent mb-xs break-all">{link.url}</div>
              {#if link.description}
                <div class="link-description text-sm text-muted mb-xs">{link.description}</div>
              {/if}
              <div class="link-meta flex gap-lg text-xs text-light">
                <span class="link-type">{LINK_TYPE_LABELS[link.type]}</span>
                {#if showAnalytics && link.analytics}
                  <span class="link-clicks">
                    {formatClickCount(link.analytics.clicks)} clics
                  </span>
                {/if}
              </div>
            </div>

            {#if editable}
              <div class="link-actions flex gap-xs flex-shrink-0">
                <button
                  class="btn-icon"
                  class:active={link.active}
                  on:click={() => toggleLinkActive(link)}
                  title={link.active ? 'Desactivar' : 'Activar'}
                >
                  <i class="fa-solid {link.active ? 'fa-eye' : 'fa-eye-slash'}"></i>
                </button>

                <button
                  class="btn-icon"
                  on:click={() => startEditLink(link)}
                  title="Editar"
                >
                  <i class="fa-solid fa-edit"></i>
                </button>

                <button
                  class="btn-icon delete"
                  on:click={() => showDeleteConfirmation(link)}
                  disabled={deletingLinkId === link.id}
                  title="Eliminar"
                >
                  {#if deletingLinkId === link.id}
                    <i class="fa-solid fa-spinner fa-spin"></i>
                  {:else}
                    <i class="fa-solid fa-trash"></i>
                  {/if}
                </button>
              </div>
            {/if}
          </div>
        </div>
      {/each}
    </div>
  {/if}
</div>

<!-- Modales renderizados a nivel global -->
{#if showCreateForm}
  <GlobalModal 
    bind:isOpen={showCreateForm}
    title="Crear Nuevo Enlace"
    size="lg"
    on:close={cancelCreate}
  >
    <!-- Form errors -->
    {#if formErrors.length > 0}
      <div class="bg-error-bg border border-error text-error p-md rounded mb-lg">
        <ul class="list-disc pl-lg">
          {#each formErrors as error}
            <li class="text-sm">{error}</li>
          {/each}
        </ul>
      </div>
    {/if}

    <div class="grid grid-cols-1 md:grid-cols-2 gap-lg">
      <InputField
        id="create-title"
        label="Título"
        bind:value={linkForm.title}
        placeholder="Mi enlace"
        required={true}
      />

      <InputField
        id="create-url"
        label="URL"
        type="url"
        bind:value={linkForm.url}
        placeholder="https://ejemplo.com"
        required={true}
        disabled={isMenuLink}
      />

      <!-- Menu Link Switch -->
      <div class="md:col-span-2">
        <div class="bg-info-bg border border-info rounded-lg p-md">
          <div class="flex items-center justify-between">
            <div>
              <h4 class="text-sm font-semibold text-primary mb-xs">Link al Menú</h4>
              <p class="text-xs text-muted">Activa esta opción para crear un enlace directo a tu menú en MenuUpp</p>
            </div>
            <ToggleSwitch
              id="create-menu-link"
              label=""
              checked={isMenuLink}
              color="blue"
              on:change={(e) => {
                isMenuLink = e.detail.checked;
                handleMenuLinkToggle();
              }}
            />
          </div>
          {#if isMenuLink}
            <div class="mt-sm text-xs text-info">
              <i class="fa-solid fa-info-circle"></i>
              URL automática: <code>https://www.menuupp.com/{restaurantUsername}/menu</code>
            </div>
          {/if}
        </div>
      </div>

      <div class="form-group">
        <label for="create-icon" class="text-sm font-medium text-secondary mb-xs">Icono</label>
        <IconPicker bind:value={linkForm.icon} />
      </div>

      <div class="md:col-span-2">
        <TextareaField
          id="create-description"
          label="Descripción"
          bind:value={linkForm.description}
          placeholder="Descripción opcional"
          rows={3}
        />
      </div>

      <ColorPicker
        id="create-color"
        label="Color Personalizado"
        bind:value={linkForm.customColor}
      />

      <div class="flex items-center">
        <ToggleSwitch
          id="create-active"
          label="Enlace activo"
          bind:checked={linkForm.active}
          color="green"
        />
      </div>
    </div>

    <!-- Modal Actions -->
    <div class="flex justify-end gap-sm mt-2xl pt-lg border-t border-accent">
      <button class="btn btn-secondary" on:click={cancelCreate}>
        Cancelar
      </button>
      <button 
        class="btn btn-primary" 
        on:click={handleCreateLink}
        disabled={$isCreatingLink}
      >
        {#if $isCreatingLink}
          <i class="fa-solid fa-spinner fa-spin"></i>
          Creando...
        {:else}
          Crear Enlace
        {/if}
      </button>
    </div>
  </GlobalModal>
{/if}

{#if showEditForm}
  <GlobalModal 
    bind:isOpen={showEditForm}
    title="Editar Enlace"
    size="lg"
    on:close={cancelEdit}
  >
    <!-- Form errors -->
    {#if formErrors.length > 0}
      <div class="bg-error-bg border border-error text-error p-md rounded mb-lg">
        <ul class="list-disc pl-lg">
          {#each formErrors as error}
            <li class="text-sm">{error}</li>
          {/each}
        </ul>
      </div>
    {/if}

    <div class="grid grid-cols-1 md:grid-cols-2 gap-lg">
      <InputField
        id="edit-title"
        label="Título"
        bind:value={linkForm.title}
        required={true}
      />

      <InputField
        id="edit-url"
        label="URL"
        type="url"
        bind:value={linkForm.url}
        required={true}
        disabled={isMenuLink}
      />

      <!-- Menu Link Switch -->
      <div class="md:col-span-2">
        <div class="bg-info-bg border border-info rounded-lg p-md">
          <div class="flex items-center justify-between">
            <div>
              <h4 class="text-sm font-semibold text-primary mb-xs">Link al Menú</h4>
              <p class="text-xs text-muted">Activa esta opción para crear un enlace directo a tu menú en MenuUpp</p>
            </div>
            <ToggleSwitch
              id="edit-menu-link"
              label=""
              checked={isMenuLink}
              color="blue"
              on:change={(e) => {
                isMenuLink = e.detail.checked;
                handleMenuLinkToggle();
              }}
            />
          </div>
          {#if isMenuLink}
            <div class="mt-sm text-xs text-info">
              <i class="fa-solid fa-info-circle"></i>
              URL automática: <code>https://www.menuupp.com/{restaurantUsername}/menu</code>
            </div>
          {/if}
        </div>
      </div>

      <div class="form-group">
        <label class="text-sm font-medium text-secondary mb-xs">Icono</label>
        <IconPicker bind:value={linkForm.icon} />
      </div>

      <div class="md:col-span-2">
        <TextareaField
          id="edit-description"
          label="Descripción"
          bind:value={linkForm.description}
          rows={3}
        />
      </div>

      <ColorPicker
        id="edit-color"
        label="Color"
        bind:value={linkForm.customColor}
      />

      <div class="flex items-center">
        <ToggleSwitch
          id="edit-active"
          label="Activo"
          bind:checked={linkForm.active}
          color="green"
        />
      </div>
    </div>

    <!-- Modal Actions -->
    <div class="flex justify-end gap-sm mt-2xl pt-lg border-t border-accent">
      <button class="btn btn-secondary" on:click={cancelEdit}>
        Cancelar
      </button>
      <button 
        class="btn btn-primary" 
        on:click={handleUpdateLink}
        disabled={$isUpdatingLink}
      >
        {#if $isUpdatingLink}
          <i class="fa-solid fa-spinner fa-spin"></i>
          Guardando...
        {:else}
          Guardar Cambios
        {/if}
      </button>
    </div>
  </GlobalModal>
{/if}

<!-- Modal de Confirmación de Eliminación -->
<ConfirmationModal 
  isOpen={showDeleteConfirm}
  title="Confirmar Eliminación"
  message={linkToDelete 
    ? `¿Estás seguro de que quieres eliminar el enlace "${linkToDelete.title}"?\n\nEsta acción no se puede deshacer.`
    : "¿Estás seguro de que quieres eliminar este enlace?\n\nEsta acción no se puede deshacer."
  }
  confirmText="Eliminar Enlace"
  cancelText="Cancelar"
  type="danger"
  loading={deletingLinkId !== null}
  loadingText="Eliminando..."
  on:confirm={handleDeleteLink}
  on:cancel={cancelDelete}
/>

<style>
  /* Component-specific styles using CSS variables */
  .link-manager {
    background: var(--bg-primary);
    border: 1px solid var(--bg-accent);
    border-radius: var(--radius-xl);
    box-shadow: var(--shadow-md);
    overflow: hidden;
  }

  .management-header {
    background: var(--bg-secondary);
    border-bottom: 1px solid var(--bg-accent);
    padding: var(--spacing-2xl);
  }

  .links-list {
    /* padding: var(--spacing-lg); */
  }

  .link-item {
    margin-bottom: var(--spacing-md);
    transition: all var(--transition-normal);
    border: 1px solid var(--bg-accent);
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
    border-color: var(--primary-color);
    background: var(--info-bg);
  }

  .link-content {
    padding: var(--spacing-lg);
  }

  .link-handle {
    cursor: grab;
    color: var(--text-light);
    padding: var(--spacing-xs);
    transition: color var(--transition-fast);
  }

  .link-handle:hover {
    color: var(--text-muted);
  }

  .link-handle:active {
    cursor: grabbing;
  }

  .link-handle.hidden {
    display: none;
  }

  .link-icon {
    width: 48px;
    height: 48px;
    border-radius: var(--radius-lg);
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--text-inverse);
    font-size: var(--font-xl);
    flex-shrink: 0;
  }

  .link-details {
    flex: 1;
    min-width: 0;
  }

  .link-title {
    font-weight: var(--weight-semibold);
    color: var(--text-primary);
    margin-bottom: var(--spacing-xs);
  }

  .link-url {
    font-size: var(--font-sm);
    color: var(--primary-color);
    margin-bottom: var(--spacing-xs);
    word-break: break-all;
  }

  .link-description {
    font-size: var(--font-sm);
    color: var(--text-muted);
    margin-bottom: var(--spacing-xs);
  }

  .link-meta {
    display: flex;
    gap: var(--spacing-lg);
    font-size: var(--font-xs);
    color: var(--text-light);
  }

  .link-actions {
    display: flex;
    gap: var(--spacing-xs);
    flex-shrink: 0;
  }

  .btn-icon {
    width: 36px;
    height: 36px;
    border: 1px solid var(--bg-accent);
    background: var(--bg-primary);
    color: var(--text-muted);
    border-radius: var(--radius-md);
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all var(--transition-fast);
    font-size: var(--font-sm);
  }

  .btn-icon:hover {
    background: var(--bg-tertiary);
    color: var(--text-primary);
    border-color: var(--primary-color);
    transform: scale(1.05);
  }

  .btn-icon:active {
    transform: scale(0.95);
  }

  .btn-icon.active {
    background: var(--success-bg);
    color: var(--success);
    border-color: var(--success);
  }

  .btn-icon.delete {
    color: var(--error);
  }

  .btn-icon.delete:hover {
    background: var(--error-bg);
    border-color: var(--error);
  }

  .btn-icon:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    transform: none;
  }

  /* Responsive adjustments */
  @media (max-width: 768px) {
    .management-header .flex {
      flex-direction: column;
      gap: var(--spacing-lg);
      align-items: stretch;
    }

    .grid {
      grid-template-columns: 1fr;
    }

    .link-content {
      flex-wrap: wrap;
      gap: var(--spacing-md);
    }

    .link-actions {
      width: 100%;
      justify-content: flex-end;
    }

    .btn-icon {
      width: 40px;
      height: 40px;
    }
  }

  @media (max-width: 640px) {
    .loading-state,
    .error-state,
    .empty-state {
      padding: var(--spacing-2xl);
      min-height: 300px;
    }
  }

  /* Dark mode support */
  @media (prefers-color-scheme: dark) {
    .btn-icon {
      background: var(--bg-tertiary);
      border-color: var(--bg-accent);
      color: var(--text-light);
    }

    .btn-icon:hover {
      background: var(--bg-accent);
      color: var(--text-primary);
    }
  }

  /* Reduced motion */
  @media (prefers-reduced-motion: reduce) {
    .btn-icon:hover,
    .link-item.dragging {
      transform: none;
    }

    .btn-icon,
    .link-item {
      transition: none;
    }
  }

  /* High contrast mode */
  @media (prefers-contrast: high) {
    .btn-icon {
      border-width: 2px;
    }

    .link-item {
      border-width: 2px;
    }
  }
</style> 