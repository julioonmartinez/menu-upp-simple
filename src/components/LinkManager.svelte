<!-- src/components/LinkManager.svelte -->
<script lang="ts">
  import { createEventDispatcher, onDestroy } from 'svelte';
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
  import './LinkManager.css';
  import { useLinkTrees } from '../stores/linkTreeStore.ts';
  import { toastStore } from '../stores/toastStore.ts';
  import { getIconClass } from '../utils/iconUtils.ts';
  import { getIconColor } from '../utils/colorUtils.ts';
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
    isReorderingLinks,
    linkError,
    reorderError,
    loadLinks,
    createLink,
    updateLink,
    deleteLink,
    reorderLinks
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
  let originalOrder: string[] = [];
  
  // Estado optimista para reordenamiento
  let optimisticLinks: Link[] = [];
  let isOptimisticUpdate = false;
  let lastOptimisticOrder: string[] = [];
  
  // Estado de progreso para reordenamiento
  let isReorderingInProgress = false;
  let reorderProgress = 0;
  let reorderProgressInterval: number | null = null;

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
  $: error = linkError || reorderError;
  
  // Use optimistic links when available, otherwise use store links, fallback to prop links
  $: displayLinks = isOptimisticUpdate && optimisticLinks.length > 0 
    ? optimisticLinks 
    : $currentLinks && $currentLinks.length > 0 
      ? $currentLinks 
      : links || [];
  $: console.log('displayLinks updated:', displayLinks?.length || 0, displayLinks?.map(l => ({ id: l.id, title: l.title, order: l.order })) || []);

  // Initialize
  async function initializeLinks(forceReload = false) {
    if (!displayLinks?.length || forceReload) {
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
        order: sortLinksByOrder(displayLinks || []).length
      });

      if (result.success && result.link) {
        dispatch('linkCreated', result.link);
        
        // Toast de éxito
        toastStore.success('Enlace creado correctamente');
        
        resetForm();
        showCreateForm = false;
        
        await initializeLinks(true);
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
        
        await initializeLinks(true);
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
        
        await initializeLinks(true);
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
    if (!editable || !link || !link.id) {
      console.warn('Cannot start drag: link is invalid or has no ID');
      event.preventDefault();
      return;
    }
    
    draggedLink = link;
    // Guardar el orden original para poder revertir si es necesario
    originalOrder = sortLinksByOrder(displayLinks || []).filter(l => l.id).map(l => l.id!);
    
    if (event.dataTransfer) {
      event.dataTransfer.effectAllowed = 'move';
      event.dataTransfer.setData('text/html', '');
    }
  }

  // Handle drag over
  function handleDragOver(event: DragEvent, index: number) {
    if (!editable || !draggedLink || !draggedLink.id) return;
    
    event.preventDefault();
    dropTarget = index;
  }

  // Handle drop
  async function handleDrop(event: DragEvent, targetIndex: number) {
    if (!editable || !draggedLink || !draggedLink.id || !linkTreeId) {
      console.warn('Cannot handle drop: missing required data');
      return;
    }
    
    event.preventDefault();
    
    // Guardar una referencia local al enlace arrastrado para evitar problemas de concurrencia
    const currentDraggedLink = draggedLink;
    
    // Verificación adicional de seguridad
    if (!currentDraggedLink || !currentDraggedLink.id) {
      console.warn('Dragged link is null or has no ID');
      draggedLink = null;
      dropTarget = null;
      return;
    }
    
    // Obtener todos los enlaces ordenados (incluyendo los que no tienen ID)
    const allSortedLinks = sortLinksByOrder(displayLinks || []);
    
    // Encontrar el índice del enlace arrastrado en el array completo
    const sourceIndexInAll = allSortedLinks.findIndex(l => l.id === currentDraggedLink.id);
    
    if (sourceIndexInAll === -1) {
      console.warn('Link not found in sorted list');
      draggedLink = null;
      dropTarget = null;
      return;
    }
    
    // Solo procesar si realmente se está moviendo a una posición diferente
    if (sourceIndexInAll !== targetIndex) {
      // Crear el nuevo orden usando todos los enlaces
      const newOrder: string[] = [];
      
      // Copiar todos los IDs válidos excepto el que se está moviendo
      for (let i = 0; i < allSortedLinks.length; i++) {
        const link = allSortedLinks[i];
        
        if (i !== sourceIndexInAll && link?.id) {
          newOrder.push(link.id);
        }
      }
      
      // Insertar el ID movido en la nueva posición
      newOrder.splice(targetIndex, 0, currentDraggedLink.id);
      
      // === PATRÓN OPTIMISTA MEJORADO ===
      // 1. Guardar el estado actual para poder revertir si es necesario
      const currentLinks = [...(displayLinks || [])];
      const currentOrder = sortLinksByOrder(currentLinks).filter(l => l.id).map(l => l.id!);
      
      // 2. Aplicar el cambio optimista inmediatamente
      const reorderedLinks = newOrder.map(id => {
        const link = currentLinks.find(l => l.id === id);
        if (!link) {
          console.warn(`Link with id ${id} not found in current links`);
          return null;
        }
        return link;
      }).filter(Boolean) as Link[];
      
      // Actualizar el estado optimista
      optimisticLinks = reorderedLinks;
      isOptimisticUpdate = true;
      lastOptimisticOrder = newOrder;
      
      // 3. Iniciar barra de progreso
      startReorderProgress();
      
      // 4. Enviar el cambio al backend
      try {
        console.log('newOrder', newOrder);
        console.log('draggedLink', linkTreeId);
        const result = await reorderLinks(linkTreeId, newOrder);
        
        if (result.success) {
          // Éxito: mantener el cambio optimista y limpiar el estado
          dispatch('linkReordered', { linkId: currentDraggedLink.id, newOrder: targetIndex });
          toastStore.success('Orden de enlaces actualizado');
          
          // Completar progreso
          completeReorderProgress();
          
          // Limpiar estado optimista
          clearOptimisticState();
        } else {
          // Error: revertir el cambio optimista
          console.warn('Backend rejected reorder, reverting optimistic update');
          optimisticLinks = [...currentLinks];
          clearOptimisticState();
          cancelReorderProgress();
          
          toastStore.error(result.error || 'No se pudo actualizar el orden de los enlaces');
        }
      } catch (err) {
        // Error de red: revertir el cambio optimista
        console.error('Error reordering links:', err);
        optimisticLinks = [...currentLinks];
        clearOptimisticState();
        cancelReorderProgress();
        
        toastStore.error('Error al reordenar los enlaces');
      }
    }
    
    draggedLink = null;
    dropTarget = null;
  }

  // Handle drag end
  function handleDragEnd() {
    // Limpiar el estado del drag
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

  // Get icon color based on background color
  function getLinkIconColor(link: Link): string {
    const backgroundColor = link.customColor || '#3b82f6';
    return getIconColor(backgroundColor);
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

  // Limpiar estado optimista al desmontar el componente
  onDestroy(() => {
    clearOptimisticState();
    cancelReorderProgress();
  });

  // Función para limpiar estado optimista
  function clearOptimisticState() {
    isOptimisticUpdate = false;
    optimisticLinks = [];
    lastOptimisticOrder = [];
  }

  // Función para iniciar el progreso de reordenamiento
  function startReorderProgress() {
    isReorderingInProgress = true;
    reorderProgress = 0;
    
    // Simular progreso gradual
    reorderProgressInterval = setInterval(() => {
      reorderProgress = Math.min(reorderProgress + Math.random() * 15, 90);
    }, 200) as any;
  }

  // Función para completar el progreso de reordenamiento
  function completeReorderProgress() {
    if (reorderProgressInterval) {
      clearInterval(reorderProgressInterval);
      reorderProgressInterval = null;
    }
    reorderProgress = 100;
    
    // Ocultar progreso después de un breve delay
    setTimeout(() => {
      isReorderingInProgress = false;
      reorderProgress = 0;
    }, 500);
  }

  // Función para cancelar el progreso de reordenamiento
  function cancelReorderProgress() {
    if (reorderProgressInterval) {
      clearInterval(reorderProgressInterval);
      reorderProgressInterval = null;
    }
    isReorderingInProgress = false;
    reorderProgress = 0;
  }

  // Limpiar estado optimista cuando se recargan los enlaces
  $: if ($currentLinks.length > 0 && isOptimisticUpdate) {
    // Solo limpiar si los enlaces del store son diferentes a los optimistas
    const storeLinksOrder = sortLinksByOrder($currentLinks).filter(l => l.id).map(l => l.id!);
    if (JSON.stringify(storeLinksOrder) !== JSON.stringify(lastOptimisticOrder)) {
      clearOptimisticState();
    }
  }
</script>

<div class="link-manager">
  <!-- Header -->
  <div class="management-header">
    <div class="management-header-content">
      <div class="flex justify-between items-center">
        <div>
          <h3 class="text-2xl font-bold text-primary mb-sm">Enlaces ({sortLinksByOrder(displayLinks || []).length})</h3>
          <p class="text-muted">Gestiona los enlaces de tu LinkTree</p>
        </div>
        
        {#if editable}
          <div class="flex gap-sm">
            <button 
              class="btn btn-primary"
              on:click={() => showCreateForm = true}
              disabled={isReorderingInProgress || showCreateForm || showEditForm}
            >
              <i class="fa-solid fa-plus"></i>
              Agregar Enlace
            </button>
          </div>
        {/if}
      </div>
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

  <!-- Optimistic Update Indicator -->
  {#if isOptimisticUpdate}
    <div class="optimistic-indicator">
      <i class="fa-solid fa-clock text-info"></i>
      <span class="text-sm text-info">Guardando cambios...</span>
    </div>
  {/if}

  <!-- Progress Bar for Reordering -->
  {#if isReorderingInProgress}
    <div class="progress-bar-container">
      <div class="progress-bar">
        <div class="progress-fill" style="width: {reorderProgress}%"></div>
      </div>
      <div class="progress-text">
        <i class="fa-solid fa-arrows-up-down text-primary"></i>
        <span class="text-sm text-primary">Actualizando orden...</span>
      </div>
    </div>
  {/if}

  <!-- Links List -->
  {#if $isLoading}
    <div class="loading-state">
      <div class="animate-spin w-xl h-xl border-2 border-accent border-t-primary rounded-full mb-md"></div>
      <p class="text-muted">Cargando enlaces...</p>
    </div>
  {:else if sortLinksByOrder(displayLinks || []).length === 0}
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
  {:else if sortLinksByOrder(displayLinks || []).filter(l => !l.id).length > 0}
    <div class="warning-state">
      <i class="fa-solid fa-triangle-exclamation text-warning"></i>
      <h4 class="text-lg font-semibold text-warning mb-sm">Enlaces sin ID</h4>
      <p class="text-muted mb-md">
        Algunos enlaces no tienen ID válido y no se pueden reordenar. 
        {editable ? 'Guarda los cambios pendientes para solucionarlo.' : ''}
      </p>
      {#if editable}
        <button class="btn btn-warning" on:click={() => initializeLinks(true)}>
          <i class="fa-solid fa-refresh"></i>
          Recargar Enlaces
        </button>
      {/if}
    </div>
  {:else}
    <div class="links-list">
      {#each sortLinksByOrder(displayLinks || []) as link, index (link.id)}
        <div 
          class="link-item"
          class:dragging={draggedLink?.id === link.id}
          class:drop-target={dropTarget === index}
          class:inactive={!link.active}
          class:reordering={isReorderingInProgress}
          draggable={editable && !isReorderingInProgress && !!link.id}
          on:dragstart={(e) => handleDragStart(e, link)}
          on:dragover={(e) => handleDragOver(e, index)}
          on:drop={(e) => handleDrop(e, index)}
          on:dragend={handleDragEnd}
          on:dragleave={() => dropTarget = null}
        >
          <!-- Drag Handle -->
          {#if editable}
            <div class="link-handle">
              <i class="fa-solid fa-grip-vertical"></i>
            </div>
          {/if}

          <!-- Link Icon -->
          <div class="link-icon" style="background-color: {link.customColor || '#3b82f6'}">
            <i class="{getLinkIconClass(link)}" style="color: {getLinkIconColor(link)}"></i>
          </div>

          <!-- Link Details -->
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

          <!-- Link Actions -->
          {#if editable}
            <div class="link-actions">
              <button
                class="btn-icon"
                class:active={link.active}
                on:click={() => toggleLinkActive(link)}
                title={link.active ? 'Desactivar' : 'Activar'}
                disabled={isReorderingInProgress}
              >
                <i class="fa-solid {link.active ? 'fa-eye' : 'fa-eye-slash'}"></i>
              </button>

              <button
                class="btn-icon"
                on:click={() => startEditLink(link)}
                title="Editar"
                disabled={isReorderingInProgress}
              >
                <i class="fa-solid fa-edit"></i>
              </button>

              <button
                class="btn-icon delete"
                on:click={() => showDeleteConfirmation(link)}
                disabled={deletingLinkId === link.id || isReorderingInProgress}
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

