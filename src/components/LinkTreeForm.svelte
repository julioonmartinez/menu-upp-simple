<!-- src/components/LinkTreeForm.svelte -->
<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { createEventDispatcher } from 'svelte';
  import type { 
    LinkTree, 
    LinkTreeCreateData, 
    LinkTreeUpdateData
  } from '../interfaces/links.ts';
  import { 
    validateLinkTreeData
  } from '../interfaces/links.ts';
  import { useLinkTrees } from '../stores/linkTreeStore.ts';
  import { useRestaurants } from '../stores/restaurantStore.ts';
  import { toastStore } from '../stores/toastStore.ts';
  
  // Importar componentes de UI personalizados
  import ToggleSwitch from './ui/ToggleSwitch.svelte';
  import InputField from './ui/InputField.svelte';

  // Props
  const { 
    linkTreeId = null,
    restaurantId = undefined,
    onSuccess = undefined,
    onCancel = undefined
  } = $props<{
    linkTreeId?: string | null;
    restaurantId?: string | undefined;
    onSuccess?: ((linkTree: LinkTree) => void) | undefined;
    onCancel?: (() => void) | undefined;
  }>();

  // Event dispatcher
  const dispatch = createEventDispatcher<{
    success: LinkTree;
    cancel: void;
  }>();

  // Store state
  const linkTreeService = useLinkTrees();
  const restaurantService = useRestaurants();
  
  // Destructuring reactivo del store
  const {
    currentLinkTree,
    isCreating, 
    isUpdating,
    createError,
    updateError,
    isLoadingCurrent
  } = linkTreeService;

  const {
    currentRestaurant,
    loadRestaurant
  } = restaurantService;

  // Estados locales
  let validationErrors: string[] = [];
  let isInitialized = false;

  // Form data reactivo - usando $state para que sea reactivo en Svelte 5
  let formData = $state({
    title: '',
    description: '',
    isPublic: true,
    customSlug: '',
  });

  // Función para inicializar formData desde un LinkTree
  function initializeFormData(linkTree: LinkTree | null) {
    formData.title = linkTree?.title || '';
    formData.description = linkTree?.description || '';
    formData.isPublic = linkTree?.isPublic ?? true;
    if (linkTree?.customSlug) {
      formData.customSlug = linkTree.customSlug;
    } else if ($currentRestaurant?.username) {
      formData.customSlug = $currentRestaurant.username;
    }
    isInitialized = true;
  }

  // Cargar LinkTree si se proporciona ID
  onMount(async () => {
    if (restaurantId) {
      await loadRestaurant(restaurantId);
    }
    if (linkTreeId) {
      const result = await linkTreeService.loadLinkTree(linkTreeId);
      if (result.success && result.data) {
        initializeFormData(result.data);
      }
    } else {
      initializeFormData(null);
    }
  });

  // Reactividad: sincronizar formData cuando cambia currentLinkTree
  $effect(() => {
    if ($currentLinkTree && linkTreeId === $currentLinkTree.id && !isInitialized) {
      initializeFormData($currentLinkTree);
    }
  });

  // Estados derivados reactivos
  const isSubmitting = $derived($isCreating || $isUpdating);
  const currentError = $derived($createError || $updateError);
  const isEditMode = $derived(Boolean(linkTreeId && $currentLinkTree));

  // Validar formulario
  function validateForm(): boolean {
    const dataToValidate = isEditMode 
      ? formData as LinkTreeUpdateData
      : { ...formData, restaurantId: restaurantId! } as LinkTreeCreateData;
    
    const validation = validateLinkTreeData(dataToValidate);
    validationErrors = validation.errors;
    
    if (!isEditMode && !restaurantId) {
      validationErrors.push('ID del restaurante es requerido');
    }
    
    const isValid = validation.isValid && validationErrors.length === 0;
    
    if (!isValid) {
      toastStore.error('Por favor, corrige los errores en el formulario');
    }
    
    return isValid;
  }

  // Manejar envío del formulario
  async function handleSubmit() {
    if (!validateForm()) {
      return;
    }
    try {
      let result;
      if (isEditMode && linkTreeId) {
        const updateData = {
          ...formData,
          customSlug: formData.customSlug
        } as LinkTreeUpdateData;
        result = await linkTreeService.updateLinkTree(linkTreeId, updateData);
      } else {
        const createData = { ...formData, restaurantId: restaurantId! } as LinkTreeCreateData;
        result = await linkTreeService.createLinkTree(createData);
      }
      if (result.success && result.linkTree) {
        toastStore.success(isEditMode ? 'LinkTree actualizado correctamente' : 'LinkTree creado correctamente');
        onSuccess?.(result.linkTree);
        dispatch('success', result.linkTree);
        handleCancel();
      } else {
        toastStore.error(`Error al ${isEditMode ? 'actualizar' : 'crear'} LinkTree: ${result.error}`);
      }
    } catch (error) {
      toastStore.error('Error inesperado al procesar el formulario');
    }
  }

  // Manejar cancelación
  function handleCancel() {
    onCancel?.();
    dispatch('cancel');
  }

  // Manejar cambio de toggle
  function handleToggleChange(event: CustomEvent) {
    const { checked } = event.detail;
    formData.isPublic = checked;
  }

  // Manejar cambio de input
  function handleInputChange(field: string, event: CustomEvent) {
    (formData as any)[field] = event.detail.value;
  }

  // Limpiar errores cuando el componente se desmonta
  onDestroy(() => {
    linkTreeService.clearAllErrors();
  });
</script>

<div class="linktree-form">
  <!-- Loading state -->
  {#if $isLoadingCurrent && linkTreeId}
    <div class="loading-state">
      <div class="spinner-large"></div>
      <p class="text-muted">Cargando LinkTree...</p>
    </div>
  {:else}
    <form on:submit|preventDefault={handleSubmit}>
      <!-- Header compacto -->
      <div class="form-header">
        <h2 class="text-xl font-semibold text-primary">
          {isEditMode ? 'Editar LinkTree' : 'Crear LinkTree'}
        </h2>
        <p class="text-muted text-sm">
          {isEditMode 
            ? 'Personaliza tu página de enlaces' 
            : 'Crea una página personalizada con todos tus enlaces importantes'
          }
        </p>
      </div>

      <!-- Error display -->
      {#if currentError}
        <div class="error-message">
          <i class="icon-alert-circle"></i>
          <span>{currentError}</span>
        </div>
      {/if}

      <!-- Validation errors -->
      {#if validationErrors.length > 0}
        <div class="validation-errors">
          <h4 class="text-sm font-semibold">Errores de validación:</h4>
          <ul class="text-sm">
            {#each validationErrors as error}
              <li>{error}</li>
            {/each}
          </ul>
        </div>
      {/if}

      <!-- Información Básica -->
      <div class="form-section">
        <InputField
          id="title"
          label="Título"
          value={formData.title}
          placeholder="Mi LinkTree"
          help="Opcional. Aparecerá como encabezado en tu página."
          maxlength={100}
          on:change={(e) => handleInputChange('title', e)}
        />

        <InputField
          id="description"
          label="Descripción"
          value={formData.description}
          placeholder="Encuentra todos mis enlaces aquí"
          help="Opcional. Una breve descripción que aparecerá debajo del título."
          maxlength={500}
          on:change={(e) => handleInputChange('description', e)}
        />

        <ToggleSwitch
          id="isPublic"
          label="Hacer público"
          checked={formData.isPublic}
          help="Si está desactivado, solo tú podrás ver este LinkTree."
          color="blue"
          on:change={(e) => handleToggleChange(e)}
        />
      </div>

      <!-- Actions -->
      <div class="form-actions">
        <button
          type="button"
          class="btn btn-secondary"
          on:click={handleCancel}
          disabled={isSubmitting}
        >
          Cancelar
        </button>
        
        <button
          type="submit"
          class="btn btn-primary"
          disabled={isSubmitting}
        >
          {#if isSubmitting}
            <i class="icon-loader spinning"></i>
            <span>{isEditMode ? 'Actualizando...' : 'Creando...'}</span>
          {:else}
            <span>{isEditMode ? 'Actualizar' : 'Crear'} LinkTree</span>
          {/if}
        </button>
      </div>
    </form>
  {/if}
</div>

<style>
  /* ========================================
     LINKTREE FORM - ESTILOS MOBILE-FIRST
     Consistente con el sistema global
     ======================================== */

  .linktree-form {
    width: 100%;
    max-width: 100%;
    margin: 0 auto;
    background: var(--bg-primary);
    border-radius: var(--radius-xl);
    overflow: hidden;
  }

  /* Loading State */
  .loading-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: var(--spacing-3xl);
    min-height: 200px;
  }

  .spinner-large {
    width: 32px;
    height: 32px;
    border: 3px solid var(--bg-accent);
    border-top: 3px solid var(--primary-color);
    border-radius: 50%;
    animation: spin 1s linear infinite;
    margin-bottom: var(--spacing-md);
  }

  /* Form Header */
  .form-header {
    padding: var(--spacing-lg);
    border-bottom: 1px solid var(--bg-accent);
    text-align: center;
  }

  .form-header h2 {
    margin: 0 0 var(--spacing-xs) 0;
    color: var(--text-primary);
  }

  .form-header p {
    margin: 0;
    color: var(--text-muted);
  }

  /* Error Messages */
  .error-message,
  .validation-errors {
    margin: var(--spacing-md);
    padding: var(--spacing-md);
    border-radius: var(--radius-lg);
    display: flex;
    align-items: flex-start;
    gap: var(--spacing-sm);
  }

  .error-message {
    background: var(--error-bg);
    border: 1px solid var(--error-light);
    color: var(--error);
  }

  .validation-errors {
    background: var(--error-bg);
    border: 1px solid var(--error-light);
    color: var(--error);
    flex-direction: column;
  }

  .validation-errors h4 {
    margin: 0 0 var(--spacing-xs) 0;
    font-size: var(--font-sm);
    font-weight: var(--weight-semibold);
  }

  .validation-errors ul {
    margin: 0;
    padding-left: var(--spacing-lg);
  }

  .validation-errors li {
    font-size: var(--font-sm);
    margin-bottom: var(--spacing-xs);
  }

  /* Form Section */
  .form-section {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-md);
    padding: var(--spacing-lg);
  }

  /* Form Actions */
  .form-actions {
    display: flex;
    justify-content: flex-end;
    gap: var(--spacing-md);
    padding: var(--spacing-lg);
    border-top: 1px solid var(--bg-accent);
    background: var(--bg-secondary);
  }

  /* Responsive */
  @media (max-width: 640px) {
    .linktree-form {
      border-radius: 0;
    }
    .form-header {
      padding: var(--spacing-md);
    }
    .form-section {
      padding: var(--spacing-md);
    }
    .form-actions {
      padding: var(--spacing-md);
      flex-direction: column;
    }
  }

  /* Desktop improvements */
  @media (min-width: 768px) {
    .form-header {
      padding: var(--spacing-xl);
    }
    .form-section {
      padding: var(--spacing-xl);
    }
    .form-actions {
      padding: var(--spacing-xl);
    }
  }

  /* Animations */
  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }
  .spinning {
    animation: spin 1s linear infinite;
  }
</style>