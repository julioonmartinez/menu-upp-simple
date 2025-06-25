<!-- src/components/LinkTreeForm.svelte -->
<script lang="ts">
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

  // Props
  export let linkTree: LinkTree | null = null;
  export let restaurantId: string | undefined = undefined;
  export let isLoading = false;
  export let error: string | null = null;

  // Event dispatcher
  const dispatch = createEventDispatcher<{
    submit: LinkTreeCreateData | LinkTreeUpdateData;
    cancel: void;
    uploadImage: { type: 'profile' | 'cover' | 'text'; file: File };
  }>();

  // Store state
  const {
    isCreating,
    isUpdating,
    isUploadingImage,
    createError,
    updateError,
    imageError
  } = useLinkTrees();

  // Form data
  let formData : any = {
    title: linkTree?.title || '',
    description: linkTree?.description || '',
    backgroundColor: linkTree?.backgroundColor || '#ffffff',
    textColor: linkTree?.textColor || '#333333',
    linksBackgroundColor: linkTree?.linksBackgroundColor || '#f8f9fa',
    linksColor: linkTree?.linksColor || '#333333',
    buttonStyle: linkTree?.buttonStyle || 'rounded' as ButtonStyle,
    theme: linkTree?.theme || 'light' as LinkTreeTheme,
    customCss: linkTree?.customCss || '',
    isPublic: linkTree?.isPublic ?? true,
    customSlug: linkTree?.customSlug || ''
  };

  // Validation state
  let validationErrors: string[] = [];
  let slugAvailable = true;
  let slugChecking = false;

  // File inputs
  let profileImageFile: File | null = null;
  let coverImageFile: File | null = null;
  let textImageFile: File | null = null;

  // Reactive statements
  $: isSubmitting = isCreating || isUpdating || isLoading;
  $: currentError = error || createError || updateError || imageError;
  $: if (formData.title && !formData.customSlug && !linkTree) {
    // Auto-generate slug from title for new LinkTrees
    formData.customSlug = generateSlugFromTitle(formData.title);
  }

  // Validate form
  function validateForm(): boolean {
    const dataToValidate = linkTree 
      ? formData as LinkTreeUpdateData
      : { ...formData, restaurantId: restaurantId! } as LinkTreeCreateData;
    
    const validation = validateLinkTreeData(dataToValidate);
    validationErrors = validation.errors;
    
    // Additional validation for create mode
    if (!linkTree && !restaurantId) {
      validationErrors.push('ID del restaurante es requerido');
    }
    
    return validation.isValid && validationErrors.length === 0;
  }

  // Handle form submission
  async function handleSubmit() {
    if (!validateForm()) {
      return;
    }

    const submitData = linkTree
      ? formData as LinkTreeUpdateData
      : { ...formData, restaurantId: restaurantId! } as LinkTreeCreateData;

    dispatch('submit', submitData);
  }

  // Handle cancel
  function handleCancel() {
    dispatch('cancel');
  }

  // Handle file input change
  function handleFileChange(type: 'profile' | 'cover' | 'text', event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        alert('Por favor selecciona un archivo de imagen válido');
        return;
      }
      
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert('El archivo es demasiado grande. Máximo 5MB');
        return;
      }
      
      switch (type) {
        case 'profile':
          profileImageFile = file;
          break;
        case 'cover':
          coverImageFile = file;
          break;
        case 'text':
          textImageFile = file;
          break;
      }
      
      dispatch('uploadImage', { type, file });
    }
  }

  // Handle color input
  function handleColorChange(property: string, event: Event) {
    const input = event.target as HTMLInputElement;
    formData[property] = input.value;
  }

  // Validate slug
  async function validateSlug() {
    if (!formData.customSlug) {
      slugAvailable = true;
      return;
    }
    
    if (!isValidSlug(formData.customSlug)) {
      slugAvailable = false;
      return;
    }
    
    // Skip validation if it's the same slug as current LinkTree
    if (linkTree && linkTree.customSlug === formData.customSlug) {
      slugAvailable = true;
      return;
    }
    
    // TODO: Implement slug availability check with backend
    // For now, assume it's available
    slugAvailable = true;
  }

  // Generate slug from title
  function generateSlug() {
    if (formData.title) {
      formData.customSlug = generateSlugFromTitle(formData.title);
      validateSlug();
    }
  }

  // Preview URL
  $: previewUrl = formData.customSlug 
    ? `${window.location.origin}/links/${formData.customSlug}`
    : linkTree?.id 
      ? `${window.location.origin}/links/${linkTree.id}`
      : '';
</script>

<div class="linktree-form">
  <form on:submit|preventDefault={handleSubmit}>
    <!-- Header -->
    <div class="form-header">
      <h2>{linkTree ? 'Editar LinkTree' : 'Crear LinkTree'}</h2>
      <p class="form-description">
        {linkTree 
          ? 'Personaliza tu página de enlaces' 
          : 'Crea una página personalizada con todos tus enlaces importantes'
        }
      </p>
    </div>

    <!-- Error display -->
    {#if currentError}
      <div class="error-message">
        <i class="icon-alert-circle"></i>
        {currentError}
      </div>
    {/if}

    <!-- Validation errors -->
    {#if validationErrors.length > 0}
      <div class="validation-errors">
        <h4>Errores de validación:</h4>
        <ul>
          {#each validationErrors as error}
            <li>{error}</li>
          {/each}
        </ul>
      </div>
    {/if}

    <!-- Basic Information -->
    <section class="form-section">
      <h3>Información Básica</h3>
      
      <div class="form-group">
        <label for="title">Título</label>
        <input
          id="title"
          type="text"
          bind:value={formData.title}
          placeholder="Mi LinkTree"
          maxlength="100"
        />
        <small>Opcional. Aparecerá como encabezado en tu página.</small>
      </div>

      <div class="form-group">
        <label for="description">Descripción</label>
        <textarea
          id="description"
          bind:value={formData.description}
          placeholder="Encuentra todos mis enlaces aquí"
          maxlength="500"
          rows="3"
        ></textarea>
        <small>Opcional. Una breve descripción que aparecerá debajo del título.</small>
      </div>

      <div class="form-group">
        <label for="customSlug">Slug personalizado</label>
        <div class="slug-input-container">
          <input
            id="customSlug"
            type="text"
            bind:value={formData.customSlug}
            on:blur={validateSlug}
            placeholder="mi-restaurante"
            maxlength="50"
            class:invalid={!slugAvailable}
          />
          <button
            type="button"
            class="generate-slug-btn"
            on:click={generateSlug}
            disabled={!formData.title}
            title="Generar desde el título"
          >
            <i class="icon-refresh"></i>
          </button>
        </div>
        {#if previewUrl}
          <small class="preview-url">
            Vista previa: <a href={previewUrl} target="_blank" rel="noopener">{previewUrl}</a>
          </small>
        {/if}
        {#if !slugAvailable}
          <small class="error-text">Este slug no está disponible o no es válido</small>
        {/if}
      </div>

      <div class="form-group">
        <label>
          <input
            type="checkbox"
            bind:checked={formData.isPublic}
          />
          Hacer público
        </label>
        <small>Si está desactivado, solo tú podrás ver este LinkTree.</small>
      </div>
    </section>

    <!-- Images -->
    <section class="form-section">
      <h3>Imágenes</h3>
      
      <div class="images-grid">
        <!-- Profile Image -->
        <div class="image-upload">
          <label>Imagen de Perfil</label>
          {#if linkTree?.profileImage?.url}
            <div class="current-image">
              <img src={linkTree.profileImage.url} alt="Profile" />
            </div>
          {/if}
          <input
            type="file"
            accept="image/*"
            on:change={(e) => handleFileChange('profile', e)}
            disabled={isUploadingImage}
          />
          <small>Recomendado: 400x400px, máximo 5MB</small>
        </div>

        <!-- Cover Image -->
        <div class="image-upload">
          <label>Imagen de Portada</label>
          {#if linkTree?.coverImage?.url}
            <div class="current-image cover">
              <img src={linkTree.coverImage.url} alt="Cover" />
            </div>
          {/if}
          <input
            type="file"
            accept="image/*"
            on:change={(e) => handleFileChange('cover', e)}
            disabled={isUploadingImage}
          />
          <small>Recomendado: 1200x300px, máximo 5MB</small>
        </div>

        <!-- Text Image -->
        <div class="image-upload">
          <label>Imagen de Texto</label>
          {#if linkTree?.textImage?.url}
            <div class="current-image">
              <img src={linkTree.textImage.url} alt="Text" />
            </div>
          {/if}
          <input
            type="file"
            accept="image/*"
            on:change={(e) => handleFileChange('text', e)}
            disabled={isUploadingImage}
          />
          <small>Reemplaza el título y descripción con una imagen personalizada</small>
        </div>
      </div>
    </section>

    <!-- Appearance -->
    <section class="form-section">
      <h3>Apariencia</h3>
      
      <div class="appearance-grid">
        <div class="form-group">
          <label for="theme">Tema</label>
          <select id="theme" bind:value={formData.theme}>
            {#each Object.entries(THEME_LABELS) as [value, label]}
              <option {value}>{label}</option>
            {/each}
          </select>
        </div>

        <div class="form-group">
          <label for="buttonStyle">Estilo de Botones</label>
          <select id="buttonStyle" bind:value={formData.buttonStyle}>
            {#each Object.entries(BUTTON_STYLE_LABELS) as [value, label]}
              <option {value}>{label}</option>
            {/each}
          </select>
        </div>

        <div class="form-group">
          <label for="backgroundColor">Color de Fondo</label>
          <input
            id="backgroundColor"
            type="color"
            value={formData.backgroundColor}
            on:input={(e) => handleColorChange('backgroundColor', e)}
          />
        </div>

        <div class="form-group">
          <label for="textColor">Color de Texto</label>
          <input
            id="textColor"
            type="color"
            value={formData.textColor}
            on:input={(e) => handleColorChange('textColor', e)}
          />
        </div>

        <div class="form-group">
          <label for="linksBackgroundColor">Color de Fondo de Enlaces</label>
          <input
            id="linksBackgroundColor"
            type="color"
            value={formData.linksBackgroundColor}
            on:input={(e) => handleColorChange('linksBackgroundColor', e)}
          />
        </div>

        <div class="form-group">
          <label for="linksColor">Color de Texto de Enlaces</label>
          <input
            id="linksColor"
            type="color"
            value={formData.linksColor}
            on:input={(e) => handleColorChange('linksColor', e)}
          />
        </div>
      </div>
    </section>

    <!-- Advanced -->
    <section class="form-section">
      <h3>Avanzado</h3>
      
      <div class="form-group">
        <label for="customCss">CSS Personalizado</label>
        <textarea
          id="customCss"
          bind:value={formData.customCss}
          placeholder="/* Tu CSS personalizado aquí */"
          rows="6"
          class="code-input"
        ></textarea>
        <small>Añade CSS personalizado para mayor control sobre el diseño.</small>
      </div>
    </section>

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
          {linkTree ? 'Actualizando...' : 'Creando...'}
        {:else}
          {linkTree ? 'Actualizar' : 'Crear'} LinkTree
        {/if}
      </button>
    </div>
  </form>
</div>

<style>
  .linktree-form {
    max-width: 800px;
    margin: 0 auto;
    padding: 2rem;
    background: white;
    border-radius: 12px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  }

  .form-header {
    text-align: center;
    margin-bottom: 2rem;
  }

  .form-header h2 {
    margin: 0 0 0.5rem 0;
    color: #333;
  }

  .form-description {
    color: #666;
    margin: 0;
  }

  .error-message {
    background: #fff5f5;
    border: 1px solid #fed7d7;
    color: #c53030;
    padding: 1rem;
    border-radius: 8px;
    margin-bottom: 1.5rem;
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .validation-errors {
    background: #fff5f5;
    border: 1px solid #fed7d7;
    color: #c53030;
    padding: 1rem;
    border-radius: 8px;
    margin-bottom: 1.5rem;
  }

  .validation-errors h4 {
    margin: 0 0 0.5rem 0;
    font-size: 0.875rem;
  }

  .validation-errors ul {
    margin: 0;
    padding-left: 1.25rem;
  }

  .validation-errors li {
    font-size: 0.875rem;
  }

  .form-section {
    margin-bottom: 2rem;
    padding-bottom: 2rem;
    border-bottom: 1px solid #e2e8f0;
  }

  .form-section:last-of-type {
    border-bottom: none;
  }

  .form-section h3 {
    margin: 0 0 1.5rem 0;
    color: #2d3748;
    font-size: 1.25rem;
  }

  .form-group {
    margin-bottom: 1.5rem;
  }

  .form-group label {
    display: block;
    margin-bottom: 0.5rem;
    font-weight: 500;
    color: #374151;
  }

  .form-group input[type="text"],
  .form-group input[type="email"],
  .form-group input[type="url"],
  .form-group textarea,
  .form-group select {
    width: 100%;
    padding: 0.75rem;
    border: 1px solid #d1d5db;
    border-radius: 6px;
    font-size: 1rem;
    transition: border-color 0.2s, box-shadow 0.2s;
  }

  .form-group input:focus,
  .form-group textarea:focus,
  .form-group select:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }

  .form-group input.invalid {
    border-color: #ef4444;
  }

  .form-group input[type="color"] {
    width: 60px;
    height: 40px;
    padding: 0;
    border: 1px solid #d1d5db;
    border-radius: 6px;
    cursor: pointer;
  }

  .form-group input[type="checkbox"] {
    width: auto;
    margin-right: 0.5rem;
  }

  .form-group small {
    display: block;
    margin-top: 0.25rem;
    font-size: 0.875rem;
    color: #6b7280;
  }

  .error-text {
    color: #ef4444 !important;
  }

  .slug-input-container {
    display: flex;
    gap: 0.5rem;
    align-items: center;
  }

  .slug-input-container input {
    flex: 1;
  }

  .generate-slug-btn {
    background: #f3f4f6;
    border: 1px solid #d1d5db;
    color: #374151;
    padding: 0.75rem;
    border-radius: 6px;
    cursor: pointer;
    transition: all 0.2s;
  }

  .generate-slug-btn:hover:not(:disabled) {
    background: #e5e7eb;
  }

  .generate-slug-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .preview-url {
    color: #3b82f6 !important;
  }

  .preview-url a {
    color: inherit;
    text-decoration: none;
  }

  .preview-url a:hover {
    text-decoration: underline;
  }

  .images-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 1.5rem;
  }

  .image-upload {
    border: 2px dashed #d1d5db;
    border-radius: 8px;
    padding: 1rem;
    text-align: center;
  }

  .image-upload label {
    font-weight: 600;
    margin-bottom: 1rem;
  }

  .current-image {
    width: 100px;
    height: 100px;
    margin: 0 auto 1rem;
    border-radius: 8px;
    overflow: hidden;
    background: #f3f4f6;
  }

  .current-image.cover {
    width: 100%;
    height: 60px;
  }

  .current-image img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .appearance-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 1.5rem;
  }

  .code-input {
    font-family: 'Monaco', 'Consolas', 'Courier New', monospace;
    font-size: 0.875rem;
  }

  .form-actions {
    display: flex;
    justify-content: flex-end;
    gap: 1rem;
    margin-top: 2rem;
    padding-top: 2rem;
    border-top: 1px solid #e2e8f0;
  }

  .btn {
    padding: 0.75rem 1.5rem;
    border: none;
    border-radius: 6px;
    font-size: 1rem;
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
    .linktree-form {
      padding: 1rem;
      margin: 1rem;
    }

    .images-grid,
    .appearance-grid {
      grid-template-columns: 1fr;
    }

    .form-actions {
      flex-direction: column;
    }

    .slug-input-container {
      flex-direction: column;
      align-items: stretch;
    }
  }
</style>