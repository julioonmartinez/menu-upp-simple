<!-- src/components/LinkTreeForm.svelte -->
<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { createEventDispatcher } from 'svelte';
  import type { 
    LinkTree, 
    LinkTreeCreateData, 
    LinkTreeUpdateData,
    LinkTreeTheme,
    ButtonStyle 
  } from '../interfaces/links.ts';
  import { 
    validateLinkTreeData,
    generateSlugFromTitle,
    isValidSlug,
    THEME_LABELS,
    BUTTON_STYLE_LABELS
  } from '../interfaces/links.ts';
  import { useLinkTrees } from '../stores/linkTreeStore.ts';
  import { useRestaurants } from '../stores/restaurantStore.ts';
  
  // Importar componentes de UI personalizados
  import ColorPicker from './ui/ColorPicker.svelte';
  import ToggleSwitch from './ui/ToggleSwitch.svelte';
  import InputField from './ui/InputField.svelte';
  import ImageUploader from './ui/ImageUploader.svelte';

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
    isUploadingImage,
    createError,
    updateError,
    imageError,
    isLoadingCurrent
  } = linkTreeService;

  const {
    currentRestaurant,
    loadRestaurant
  } = restaurantService;

  // Estados locales
  let validationErrors: string[] = [];
  let slugAvailable = true;
  let slugChecking = false;
  let isInitialized = false;
  let activeSection = $state('basic'); // Para navegación por secciones

  // Form data reactivo - usando $state para que sea reactivo en Svelte 5
  let formData = $state({
    title: '',
    description: '',
    backgroundColor: '#ffffff',
    textColor: '#333333',
    linksBackgroundColor: '#f8f9fa',
    linksColor: '#333333',
    buttonStyle: 'rounded' as ButtonStyle,
    theme: 'light' as LinkTreeTheme,
    customCss: '',
    isPublic: true,
    customSlug: '',
  });

  // Función para inicializar formData desde un LinkTree
  function initializeFormData(linkTree: LinkTree | null) {
    console.log('🔄 Initializing form data:', linkTree);
    
    // Actualizar cada propiedad del objeto reactivo
    formData.title = linkTree?.title || '';
    formData.description = linkTree?.description || '';
    formData.backgroundColor = linkTree?.backgroundColor || '#ffffff';
    formData.textColor = linkTree?.textColor || '#333333';
    formData.linksBackgroundColor = linkTree?.linksBackgroundColor || '#f8f9fa';
    formData.linksColor = linkTree?.linksColor || '#333333';
    formData.buttonStyle = linkTree?.buttonStyle || 'rounded' as ButtonStyle;
    formData.theme = linkTree?.theme || 'light' as LinkTreeTheme;
    formData.customCss = linkTree?.customCss || '';
    formData.isPublic = linkTree?.isPublic ?? true;
    
    // Para el customSlug:
    // - En modo edición: usar el valor existente del LinkTree
    // - En modo creación: usar el username del restaurante
    if (linkTree?.customSlug) {
      formData.customSlug = linkTree.customSlug;
    } else if ($currentRestaurant?.username) {
      formData.customSlug = $currentRestaurant.username;
    }
    
    isInitialized = true;
    console.log('✅ Form data initialized:', formData);
  }

  // Función para reinicializar el formulario
  function reinitializeForm() {
    if (linkTreeId && $currentLinkTree && linkTreeId === $currentLinkTree.id) {
      console.log('🔄 Re-initializing form with current LinkTree:', $currentLinkTree);
      isInitialized = false; // Reset para forzar reinicialización
      initializeFormData($currentLinkTree);
    }
  }

  // Cargar LinkTree si se proporciona ID
  onMount(async () => {
    console.log('🚀 Component mounted, linkTreeId:', linkTreeId, 'restaurantId:', restaurantId);
    
    // Cargar restaurante si tenemos restaurantId
    if (restaurantId) {
      console.log('🏪 Loading restaurant:', restaurantId);
      await loadRestaurant(restaurantId);
    }
    
    if (linkTreeId) {
      console.log('📥 Loading LinkTree for editing:', linkTreeId);
      const result = await linkTreeService.loadLinkTree(linkTreeId);
      console.log('📊 Load result:', result);
      if (result.success && result.data) {
        initializeFormData(result.data);
      } else {
        console.error('❌ Failed to load LinkTree:', result.error);
      }
    } else {
      console.log('🆕 Creating new LinkTree');
      initializeFormData(null);
    }
  });

  // Reactividad: sincronizar formData cuando cambia currentLinkTree
  $effect(() => {
    console.log('🔄 Effect triggered:', {
      hasCurrentLinkTree: !!$currentLinkTree,
      linkTreeId,
      currentLinkTreeId: $currentLinkTree?.id,
      isInitialized
    });
    
    if ($currentLinkTree && linkTreeId === $currentLinkTree.id && !isInitialized) {
      console.log('🔄 Syncing form data from store:', $currentLinkTree);
      initializeFormData($currentLinkTree);
    }
  });

  // Effect adicional para manejar el caso cuando el LinkTree ya está en el store
  $effect(() => {
    if ($currentLinkTree && linkTreeId === $currentLinkTree.id && isInitialized && !formData.title) {
      console.log('🔄 Re-initializing form data from store (empty title detected):', $currentLinkTree);
      initializeFormData($currentLinkTree);
    }
  });

  // Effect para forzar la recarga cuando el LinkTree cambia y tenemos el ID correcto
  $effect(() => {
    if ($currentLinkTree && linkTreeId === $currentLinkTree.id) {
      console.log('🔄 Current LinkTree updated, re-initializing form:', $currentLinkTree);
      initializeFormData($currentLinkTree);
    }
  });

  // Effect para detectar cuando el modal se abre y el LinkTree ya está disponible
  $effect(() => {
    if (linkTreeId && $currentLinkTree && linkTreeId === $currentLinkTree.id) {
      // Si tenemos el LinkTree en el store y coincide con el ID, inicializar
      if (!isInitialized || !formData.title) {
        console.log('🔄 Modal opened with LinkTree available, initializing form:', $currentLinkTree);
        initializeFormData($currentLinkTree);
      }
    }
  });

  // Estados derivados reactivos
  const isSubmitting = $derived($isCreating || $isUpdating);
  const currentError = $derived($createError || $updateError || $imageError);
  const isEditMode = $derived(Boolean(linkTreeId && $currentLinkTree));

  // Auto-generar slug desde username del restaurante para LinkTrees nuevos
  $effect(() => {
    if (!isEditMode && isInitialized && $currentRestaurant?.username) {
      console.log('🔄 Setting customSlug from restaurant username:', $currentRestaurant.username);
      formData.customSlug = $currentRestaurant.username;
    }
  });
  

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
    
    return validation.isValid && validationErrors.length === 0;
  }

  // Manejar envío del formulario
  async function handleSubmit() {
    if (!validateForm()) {
      return;
    }

    try {
      let result;
      
      if (isEditMode && linkTreeId) {
        // En modo edición, usar el customSlug del formData (que debe ser el username del restaurante)
        const updateData = {
          ...formData,
          customSlug: formData.customSlug // Usar el slug del formData
        } as LinkTreeUpdateData;
        
        console.log('📝 Updating LinkTree with data:', updateData);
        result = await linkTreeService.updateLinkTree(linkTreeId, updateData);
      } else {
        const createData = { ...formData, restaurantId: restaurantId! } as LinkTreeCreateData;
        console.log('🆕 Creating LinkTree with data:', createData);
        result = await linkTreeService.createLinkTree(createData);
      }

      if (result.success && result.linkTree) {
        console.log('✅ Operation successful:', result.linkTree);
        onSuccess?.(result.linkTree);
        dispatch('success', result.linkTree);
        handleCancel();
      } else {
        console.error('❌ Operation failed:', result.error);
      }
    } catch (error) {
      console.error('❌ Error in handleSubmit:', error);
    }
  }

  // Manejar cancelación
  function handleCancel() {
    onCancel?.();
    dispatch('cancel');
  }

  // Manejar cambio de archivos
  async function handleFileChange(type: 'profile' | 'cover' | 'text', event: CustomEvent) {
    const { file } = event.detail;
    
    if (!file || !linkTreeId) return;
    
    try {
      let result;
      switch (type) {
        case 'profile':
          result = await linkTreeService.uploadProfileImage(linkTreeId, file);
          break;
        case 'cover':
          result = await linkTreeService.uploadCoverImage(linkTreeId, file);
          break;
        case 'text':
          result = await linkTreeService.uploadTextImage(linkTreeId, file);
          break;
      }
      
      if (result.success) {
        console.log(`Imagen ${type} subida correctamente`);
      } else {
        alert(`Error subiendo imagen: ${result.error}`);
      }
    } catch (error) {
      console.error('Error subiendo imagen:', error);
    }
  }

  // Manejar cambio de color
  function handleColorChange(property: string, event: CustomEvent) {
    const { color } = event.detail;
    (formData as any)[property] = color;
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

  // Validar slug
  async function validateSlug() {
    if (!formData.customSlug) {
      slugAvailable = true;
      return;
    }
    
    if (!isValidSlug(formData.customSlug)) {
      slugAvailable = false;
      return;
    }
    
    if ($currentLinkTree && $currentLinkTree.customSlug === formData.customSlug) {
      slugAvailable = true;
      return;
    }
    
    slugAvailable = true;
  }

  // Generar slug desde título
  function generateSlug() {
    if (formData.title) {
      formData.customSlug = generateSlugFromTitle(formData.title);
      validateSlug();
    }
  }

  // URL de vista previa reactiva
  const previewUrl = $derived(formData.customSlug 
    ? `${typeof window !== 'undefined' ? window.location.origin : ''}/links/${formData.customSlug}`
    : $currentLinkTree?.id 
      ? `${typeof window !== 'undefined' ? window.location.origin : ''}/links/${$currentLinkTree.id}`
      : '');

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

      <!-- Navegación por secciones (mobile-first) -->
      <div class="section-nav">
        <button 
          type="button"
          class="section-tab"
          class:active={activeSection === 'basic'}
          on:click={() => activeSection = 'basic'}
        >
          <i class="icon-info"></i>
          <span class="mobile-only">Básico</span>
          <span class="desktop-only">Información Básica</span>
        </button>
        
        {#if isEditMode && $currentLinkTree}
          <button 
            type="button"
            class="section-tab"
            class:active={activeSection === 'images'}
            on:click={() => activeSection = 'images'}
          >
            <i class="icon-image"></i>
            <span class="mobile-only">Imágenes</span>
            <span class="desktop-only">Imágenes</span>
          </button>
        {/if}
        
        <button 
          type="button"
          class="section-tab"
          class:active={activeSection === 'appearance'}
          on:click={() => activeSection = 'appearance'}
        >
          <i class="icon-palette"></i>
          <span class="mobile-only">Apariencia</span>
          <span class="desktop-only">Apariencia</span>
        </button>
      </div>

      <!-- Contenido de secciones -->
      <div class="section-content">
        {#if activeSection === 'basic'}
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

            <!-- Campo de solo lectura para mostrar el customSlug -->
            <div class="form-group">
              <label for="customSlug" class="form-label">URL Personalizada</label>
              <input 
                type="text" 
                id="customSlug" 
                class="input" 
                value={formData.customSlug} 
                readonly 
                placeholder="Se generará automáticamente"
              />
              <div class="form-help">
                La URL de tu LinkTree será: <strong>/{formData.customSlug}</strong>
              </div>
            </div>
          </div>

        {:else if activeSection === 'images' && isEditMode && $currentLinkTree}
          <!-- Imágenes -->
          <div class="form-section">
            <div class="images-grid">
              <!-- Profile Image -->
              <ImageUploader
                id="profileImage"
                label="Imagen de Perfil"
                currentImage={$currentLinkTree.profileImage?.url || null}
                width={400}
                height={400}
                aspectRatio="1:1"
                help="Recomendado: 400x400px, máximo 5MB"
                uploading={$isUploadingImage}
                on:fileSelected={(e) => handleFileChange('profile', e)}
                on:error={(e) => alert(e.detail.message)}
              />

              <!-- Cover Image -->
              <ImageUploader
                id="coverImage"
                label="Imagen de Portada"
                currentImage={$currentLinkTree.coverImage?.url}
                width="1200"
                height="300"
                aspectRatio="4:1"
                help="Recomendado: 1200x300px, máximo 5MB"
                uploading={$isUploadingImage}
                on:fileSelected={(e) => handleFileChange('cover', e)}
                on:error={(e) => alert(e.detail.message)}
              />

              <!-- Text Image -->
              <ImageUploader
                id="textImage"
                label="Imagen de Texto"
                currentImage={$currentLinkTree.textImage?.url}
                help="Reemplaza el título y descripción con una imagen personalizada"
                uploading={$isUploadingImage}
                on:fileSelected={(e) => handleFileChange('text', e)}
                on:error={(e) => alert(e.detail.message)}
              />
            </div>
          </div>

        {:else if activeSection === 'appearance'}
          <!-- Apariencia -->
          <div class="form-section">
            <div class="appearance-grid">
              <div class="form-group">
                <label for="theme" class="form-label">Tema</label>
                <select id="theme" class="input" bind:value={formData.theme} on:change={(e) => {
                  const target = e.currentTarget as HTMLSelectElement;
                  handleInputChange('theme', { detail: { value: target.value } } as CustomEvent);
                }}>
                  {#each Object.entries(THEME_LABELS) as [value, label]}
                    <option {value}>{label}</option>
                  {/each}
                </select>
              </div>

              <div class="form-group">
                <label for="buttonStyle" class="form-label">Estilo de Botones</label>
                <select id="buttonStyle" class="input" bind:value={formData.buttonStyle} on:change={(e) => {
                  const target = e.currentTarget as HTMLSelectElement;
                  handleInputChange('buttonStyle', { detail: { value: target.value } } as CustomEvent);
                }}>
                  {#each Object.entries(BUTTON_STYLE_LABELS) as [value, label]}
                    <option {value}>{label}</option>
                  {/each}
                </select>
              </div>

              <ColorPicker
                id="linksBackgroundColor"
                label="Color de Fondo de Enlaces"
                value={formData.linksBackgroundColor}
                help="Color de fondo para los botones de enlaces"
                on:change={(e) => handleColorChange('linksBackgroundColor', e)}
              />

              <ColorPicker
                id="linksColor"
                label="Color de Texto de Enlaces"
                value={formData.linksColor}
                help="Color del texto en los botones de enlaces"
                on:change={(e) => handleColorChange('linksColor', e)}
              />
            </div>
          </div>
        {/if}
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
          disabled={isSubmitting || !slugAvailable}
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

  /* Section Navigation */
  .section-nav {
    display: flex;
    background: var(--bg-secondary);
    border-bottom: 1px solid var(--bg-accent);
    overflow-x: auto;
    scrollbar-width: none;
    -ms-overflow-style: none;
  }

  .section-nav::-webkit-scrollbar {
    display: none;
  }

  .section-tab {
    flex: 1;
    min-width: 100px;
    padding: var(--spacing-sm) var(--spacing-xs);
    border: none;
    background: transparent;
    color: var(--text-muted);
    border-radius: 0;
    cursor: pointer;
    transition: all var(--transition-fast);
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: var(--spacing-xs);
    font-size: var(--font-xs);
    font-weight: var(--weight-medium);
    white-space: nowrap;
  }

  .section-tab:hover {
    color: var(--text-primary);
    background: var(--bg-tertiary);
  }

  .section-tab.active {
    background: var(--primary-color);
    color: var(--text-inverse);
  }

  .section-tab i {
    font-size: var(--font-base);
  }

  /* Section Content */
  .section-content {
    padding: var(--spacing-lg);
  }

  .form-section {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-md);
  }

  /* Form Groups */
  .form-group {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-xs);
  }

  .form-label {
    font-weight: var(--weight-semibold);
    color: var(--text-primary);
    font-size: var(--font-sm);
  }

  .form-help {
    color: var(--text-muted);
    font-size: var(--font-xs);
    line-height: var(--leading-snug);
  }

  /* Inputs */
  .input {
    width: 100%;
    padding: var(--spacing-sm) var(--spacing-md);
    border: 1px solid var(--bg-accent);
    border-radius: var(--radius-lg);
    font-size: var(--font-base);
    background: var(--bg-primary);
    color: var(--text-primary);
    transition: all var(--transition-normal);
    min-height: 40px;
  }

  .input:focus {
    outline: none;
    border-color: var(--primary-color);
    box-shadow: 0 0 0 3px rgba(255, 107, 53, 0.1);
  }

  .input::placeholder {
    color: var(--text-light);
  }

  /* Images Grid */
  .images-grid {
    display: grid;
    gap: var(--spacing-md);
    grid-template-columns: 1fr;
  }

  @media (min-width: 640px) {
    .images-grid {
      grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
    }
  }

  /* Appearance Grid */
  .appearance-grid {
    display: grid;
    gap: var(--spacing-md);
    grid-template-columns: 1fr;
  }

  @media (min-width: 640px) {
    .appearance-grid {
      grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
    }
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

    .section-content {
      padding: var(--spacing-md);
    }

    .form-actions {
      padding: var(--spacing-md);
      flex-direction: column;
    }

    .section-tab {
      min-width: 80px;
      padding: var(--spacing-xs);
    }

    .section-tab span {
      font-size: var(--font-xs);
    }

    .images-grid,
    .appearance-grid {
      grid-template-columns: 1fr;
    }
  }

  /* Desktop improvements */
  @media (min-width: 768px) {
    .section-tab {
      min-width: 120px;
      padding: var(--spacing-md) var(--spacing-sm);
      font-size: var(--font-sm);
    }

    .section-tab i {
      font-size: var(--font-lg);
    }

    .form-header {
      padding: var(--spacing-xl);
    }

    .section-content {
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

  /* Dark mode support */
  @media (prefers-color-scheme: dark) {
    .current-image {
      background: var(--bg-accent);
    }
  }

  /* Reduced motion */
  @media (prefers-reduced-motion: reduce) {
    .section-tab,
    .input {
      transition: none;
    }

    .spinning {
      animation: none;
    }
  }

  

  .btn-sm {
    padding: var(--spacing-xs) var(--spacing-sm);
    font-size: var(--font-xs);
  }
</style>