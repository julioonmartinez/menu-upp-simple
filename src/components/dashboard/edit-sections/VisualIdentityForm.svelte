<!-- src/components/dashboard/edit-sections/VisualIdentityForm.svelte -->
<script>
  import { createEventDispatcher } from 'svelte';
  import { restaurantStore } from '../../../stores/restaurantStore';
  import ImageUploader from '../../ui/ImageUploader.svelte';
  import ColorPicker from '../../ui/ColorPicker.svelte';
  import LoadingButton from '../../ui/LoadingButton.svelte';
  import ErrorMessage from '../../ui/ErrorMessage.svelte';
  import SuccessMessage from '../../ui/SuccessMessage.svelte';
  import FontPreview from '../../ui/FontPreview.svelte';
  import { fontFamilies } from '../../../utils/fontLoader';

  export let restaurant;
  export let restaurantId;

  const dispatch = createEventDispatcher();

  // Form data reactivo
  let formData = {
    logo: '',
    imageProfile: '',
    imageCover: '',
    image: '',
    imageText: '',
    primaryColor: '#3b82f6',
    secondaryColor: '#10b981',
    fontFamily: 'Inter'
  };

  // Estados de upload individuales
  let uploading = {
    logo: false,
    imageProfile: false,
    imageCover: false,
    image: false,
    imageText: false
  };

  // Estados del formulario
  let isSubmitting = false;
  let error = null;
  let success = null;

  // Reactive statements
  $: isUpdating = $restaurantStore.isUpdating;
  $: updateError = $restaurantStore.updateError;
  $: isUploadingAny = Object.values(uploading).some(Boolean);

  // Fuentes disponibles (importadas desde fontLoader.ts)

  // Actualizar formData cuando cambie restaurant
  $: if (restaurant) {
    formData = {
      logo: restaurant.logo || '',
      imageProfile: restaurant.imageProfile || '',
      imageCover: restaurant.imageCover || '',
      image: restaurant.image || '',
      imageText: restaurant.imageText || '',
      primaryColor: restaurant.primaryColor || '#3b82f6',
      secondaryColor: restaurant.secondaryColor || '#10b981',
      fontFamily: restaurant.fontFamily || 'Inter'
    };
  }

  async function handleImageUpload(imageType, event) {
    const { file } = event.detail;
    
    uploading[imageType] = true;
    error = null;

    try {
      const result = await restaurantStore.uploadRestaurantImage(
        restaurantId,
        file,
        imageType
      );

      if (result.success) {
        formData[imageType] = result.restaurant[imageType];
        console.log(`${imageType} uploaded successfully:`, result.restaurant[imageType]);
      } else {
        error = result.error || `Error subiendo ${imageType}`;
      }
    } catch (err) {
      error = err.message || `Error desconocido subiendo ${imageType}`;
    } finally {
      uploading[imageType] = false;
    }
  }

  function handleImageRemove(imageType) {
    formData[imageType] = '';
    // Aquí podrías hacer una llamada al backend para eliminar la imagen del servidor
  }

  async function handleSubmit(event) {
    event.preventDefault();
    
    if (isSubmitting || isUploadingAny) return;

    isSubmitting = true;
    error = null;
    success = null;

    try {
      const updateData = {
        primaryColor: formData.primaryColor,
        secondaryColor: formData.secondaryColor,
        fontFamily: formData.fontFamily
      };

      // Solo incluir imágenes que hayan cambiado
      ['logo', 'imageProfile', 'imageCover', 'image', 'imageText'].forEach(imageType => {
        if (formData[imageType] !== restaurant?.[imageType]) {
          updateData[imageType] = formData[imageType];
        }
      });

      const result = await restaurantStore.updateRestaurant(restaurantId, updateData);

      if (result.success) {
        success = 'Identidad visual actualizada correctamente';
        dispatch('update');
        
        // Cerrar modal después de 2 segundos
        setTimeout(() => {
          dispatch('close');
        }, 2000);
      } else {
        error = result.error || 'Error actualizando la identidad visual';
      }
    } catch (err) {
      error = err.message || 'Error desconocido';
    } finally {
      isSubmitting = false;
    }
  }
</script>

<div class="visual-identity-form">
  <!-- Mensajes -->
  {#if error || updateError}
    <div class="message-container">
      <ErrorMessage message={error || updateError} />
    </div>
  {/if}

  {#if success}
    <div class="message-container">
      <SuccessMessage message={success} />
    </div>
  {/if}

  <form on:submit={handleSubmit} class="form">
    <!-- Sección de Imágenes -->
    <div class="form-section">
      <h3 class="section-title">Imágenes del Restaurante</h3>
      
      <div class="images-grid">
        <!-- Logo -->
        <div class="image-field">
          <ImageUploader
            label="Logo"
            currentImage={formData.logo}
            maxSize={2}
            width={200}
            height={200}
            aspectRatio="1:1"
            help="Logo cuadrado recomendado"
            uploading={uploading.logo}
            on:fileSelected={(e) => handleImageUpload('logo', e)}
            on:remove={() => handleImageRemove('logo')}
          />
        </div>

        <!-- Imagen de perfil -->
        <div class="image-field">
          <ImageUploader
            label="Imagen de Perfil"
            currentImage={formData.imageProfile}
            maxSize={3}
            width={400}
            height={400}
            aspectRatio="1:1"
            help="Imagen principal del restaurante"
            uploading={uploading.imageProfile}
            on:fileSelected={(e) => handleImageUpload('imageProfile', e)}
            on:remove={() => handleImageRemove('imageProfile')}
          />
        </div>

        <!-- Imagen de portada -->
        <div class="image-field full-width">
          <ImageUploader
            label="Imagen de Portada"
            currentImage={formData.imageCover}
            maxSize={5}
            width={1200}
            height={400}
            aspectRatio="3:1"
            help="Imagen panorámica para la portada"
            uploading={uploading.imageCover}
            on:fileSelected={(e) => handleImageUpload('imageCover', e)}
            on:remove={() => handleImageRemove('imageCover')}
          />
        </div>

        <!-- Imagen general -->
        <div class="image-field">
          <ImageUploader
            label="Imagen General"
            currentImage={formData.image}
            maxSize={3}
            help="Imagen adicional del restaurante"
            uploading={uploading.image}
            on:fileSelected={(e) => handleImageUpload('image', e)}
            on:remove={() => handleImageRemove('image')}
          />
        </div>

        <!-- Imagen con texto -->
        <div class="image-field">
          <ImageUploader
            label="Imagen con Texto"
            currentImage={formData.imageText}
            maxSize={3}
            help="Imagen para combinar con texto"
            uploading={uploading.imageText}
            on:fileSelected={(e) => handleImageUpload('imageText', e)}
            on:remove={() => handleImageRemove('imageText')}
          />
        </div>
      </div>
    </div>

    <!-- Sección de Colores -->
    <div class="form-section">
      <h3 class="section-title">Colores de Marca</h3>
      
      <div class="colors-grid">
        <div class="color-field">
          <ColorPicker
            label="Color Primario"
            bind:value={formData.primaryColor}
            help="Color principal de tu marca"
          />
        </div>

        <div class="color-field">
          <ColorPicker
            label="Color Secundario"
            bind:value={formData.secondaryColor}
            help="Color complementario"
          />
        </div>
      </div>

      <!-- Preview de colores -->
      <div class="color-preview">
        <h4 class="preview-title">Vista Previa</h4>
        <div class="preview-card" style="border-color: {formData.primaryColor}">
          <div class="preview-header" style="background-color: {formData.primaryColor}">
            <h5 class="preview-restaurant-name" style="color: white">
              {restaurant?.name || 'Nombre del Restaurante'}
            </h5>
          </div>
          <div class="preview-content">
            <p class="preview-description">
              {restaurant?.description || 'Descripción del restaurante aparecerá aquí...'}
            </p>
            <button 
              type="button" 
              class="preview-button" 
              style="background-color: {formData.secondaryColor}; color: white"
            >
              Ver Menú
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Sección de Tipografía -->
    <div class="form-section">
      <h3 class="section-title">Tipografía</h3>
      
      <div class="font-field">
        <label for="fontFamily" class="font-label">Fuente Principal</label>
        <select 
          id="fontFamily" 
          bind:value={formData.fontFamily}
          class="font-select"
        >
          {#each fontFamilies as font}
            <option value={font.value}>{font.label}</option>
          {/each}
        </select>
        <p class="font-help">Fuente que se usará en tu página web</p>
      </div>

      <!-- Preview de fuente -->
      <FontPreview 
        fontFamily={formData.fontFamily}
        restaurantName={restaurant?.name || 'Nombre del Restaurante'}
        description={restaurant?.description || 'Descripción del restaurante aparecerá aquí...'}
      />
    </div>

    <!-- Botones -->
    <div class="form-actions">
      <button
        type="button"
        on:click={() => dispatch('close')}
        class="cancel-button"
        disabled={isSubmitting || isUploadingAny}
      >
        Cancelar
      </button>
      
      <LoadingButton
        type="submit"
        loading={isSubmitting || isUpdating}
        disabled={isUploadingAny}
        variant="primary"
        size="md"
      >
        {isUploadingAny ? 'Subiendo imágenes...' : 'Guardar Cambios'}
      </LoadingButton>
    </div>
  </form>
</div>

<style>
  /* Container principal */
  .visual-identity-form {
    width: 100%;
  }

  /* Mensajes */
  .message-container {
    margin-bottom: var(--spacing-2xl);
  }

  /* Formulario */
  .form {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-3xl);
  }

  /* Secciones del formulario */
  .form-section:not(:first-child) {
    border-top: 1px solid var(--bg-accent);
    padding-top: var(--spacing-3xl);
  }

  .section-title {
    font-size: var(--font-xl);
    font-weight: var(--weight-semibold);
    color: var(--text-primary);
    margin: 0 0 var(--spacing-2xl) 0;
  }

  /* Grid de imágenes */
  .images-grid {
    display: grid;
    grid-template-columns: 1fr;
    gap: var(--spacing-2xl);
  }

  @media (min-width: 768px) {
    .images-grid {
      grid-template-columns: repeat(2, 1fr);
    }

    .image-field.full-width {
      grid-column: 1 / -1;
    }
  }

  /* Grid de colores */
  .colors-grid {
    display: grid;
    grid-template-columns: 1fr;
    gap: var(--spacing-2xl);
    margin-bottom: var(--spacing-3xl);
  }

  @media (min-width: 768px) {
    .colors-grid {
      grid-template-columns: repeat(2, 1fr);
    }
  }

  /* Preview de colores */
  .color-preview {
    background-color: var(--bg-tertiary);
    border-radius: var(--radius-xl);
    padding: var(--spacing-2xl);
    box-shadow: var(--shadow-sm);
  }

  .preview-title {
    font-size: var(--font-lg);
    font-weight: var(--weight-semibold);
    color: var(--text-primary);
    margin: 0 0 var(--spacing-lg) 0;
  }

  .preview-card {
    background-color: var(--bg-primary);
    border-radius: var(--radius-lg);
    border: 2px solid;
    overflow: hidden;
    box-shadow: var(--shadow-md);
    transition: all var(--transition-normal);
  }

  .preview-card:hover {
    box-shadow: var(--shadow-lg);
    transform: translateY(-2px);
  }

  .preview-header {
    padding: var(--spacing-lg) var(--spacing-2xl);
  }

  .preview-restaurant-name {
    font-size: var(--font-2xl);
    font-weight: var(--weight-bold);
    margin: 0;
  }

  .preview-content {
    padding: var(--spacing-2xl);
  }

  .preview-description {
    color: var(--text-secondary);
    margin: 0 0 var(--spacing-lg) 0;
    line-height: var(--leading-relaxed);
  }

  .preview-button {
    padding: var(--spacing-md) var(--spacing-xl);
    border: none;
    border-radius: var(--radius-md);
    font-weight: var(--weight-medium);
    font-size: var(--font-sm);
    cursor: pointer;
    transition: all var(--transition-fast);
    box-shadow: var(--shadow-sm);
  }

  .preview-button:hover {
    transform: translateY(-1px);
    box-shadow: var(--shadow-md);
  }

  /* Campo de fuente */
  .font-field {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-sm);
    margin-bottom: var(--spacing-3xl);
  }

  .font-label {
    font-size: var(--font-sm);
    font-weight: var(--weight-medium);
    color: var(--text-primary);
  }

  .font-select {
    padding: var(--spacing-md) var(--spacing-lg);
    border: 1px solid var(--bg-accent);
    border-radius: var(--radius-lg);
    background-color: var(--bg-primary);
    font-size: var(--font-sm);
    color: var(--text-primary);
    transition: all var(--transition-normal);
    cursor: pointer;
    min-height: 44px;
  }

  .font-select:focus {
    outline: none;
    border-color: var(--primary-color);
    box-shadow: 0 0 0 3px rgba(255, 107, 53, 0.1);
    transform: scale(1.01);
  }

  .font-select:hover:not(:focus) {
    border-color: var(--text-muted);
  }

  .font-help {
    font-size: var(--font-xs);
    color: var(--text-muted);
    margin: 0;
  }



  /* Acciones del formulario */
  .form-actions {
    border-top: 1px solid var(--bg-accent);
    padding-top: var(--spacing-2xl);
    display: flex;
    justify-content: flex-end;
    gap: var(--spacing-md);
    flex-wrap: wrap;
  }

  .cancel-button {
    padding: var(--spacing-md) var(--spacing-2xl);
    border-radius: var(--radius-lg);
    font-size: var(--font-sm);
    font-weight: var(--weight-medium);
    border: 1px solid var(--bg-accent);
    cursor: pointer;
    transition: all var(--transition-normal);
    min-width: 120px;
    background-color: var(--bg-primary);
    color: var(--text-primary);
  }

  .cancel-button:hover:not(:disabled) {
    background-color: var(--bg-tertiary);
    border-color: var(--text-muted);
    transform: translateY(-1px);
  }

  .cancel-button:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
  }

  .cancel-button:focus-visible {
    outline: 2px solid var(--primary-color);
    outline-offset: 2px;
  }

  /* Responsive adjustments */
  @media (max-width: 768px) {
    .form {
      gap: var(--spacing-2xl);
    }

    .form-section:not(:first-child) {
      padding-top: var(--spacing-2xl);
    }

    .section-title {
      font-size: var(--font-lg);
      margin-bottom: var(--spacing-xl);
    }

    .color-preview {
      padding: var(--spacing-xl);
    }

    .preview-header {
      padding: var(--spacing-md) var(--spacing-xl);
    }

    .preview-content {
      padding: var(--spacing-xl);
    }


  }

  @media (max-width: 640px) {
    .form-actions {
      flex-direction: column;
    }

    .cancel-button {
      width: 100%;
    }

    .preview-button {
      width: 100%;
      padding: var(--spacing-lg);
    }
  }

  /* Touch device optimizations */
  @media (hover: none) and (pointer: coarse) {
    .preview-card:hover,
    .preview-button:hover,
    .cancel-button:hover {
      transform: none;
    }

    .font-select:focus {
      transform: none;
    }

    .preview-button,
    .cancel-button {
      min-height: 48px;
    }
  }

  /* Reduced motion support */
  @media (prefers-reduced-motion: reduce) {
    .preview-card,
    .preview-button,
    .cancel-button,
    .font-select {
      transition: none;
    }

    .preview-card:hover,
    .preview-button:hover,
    .cancel-button:hover {
      transform: none;
    }

    .font-select:focus {
      transform: none;
    }
  }

  /* Dark mode support */
  @media (prefers-color-scheme: dark) {
    .color-preview {
      background-color: var(--bg-accent);
    }

    .preview-card {
      background-color: var(--bg-tertiary);
    }

    .font-select {
      background-color: var(--bg-tertiary);
      border-color: var(--bg-accent);
    }

    .font-select:focus {
      background-color: var(--bg-primary);
    }

    .cancel-button {
      background-color: var(--bg-tertiary);
      border-color: var(--bg-accent);
      color: var(--text-primary);
    }

    .cancel-button:hover:not(:disabled) {
      background-color: var(--bg-accent);
    }
  }

  /* High contrast mode */
  @media (prefers-contrast: high) {
    .form-section:not(:first-child) {
      border-top-width: 2px;
    }

    .preview-card {
      border-width: 3px;
    }

    .font-select,
    .cancel-button {
      border-width: 2px;
    }

    .form-actions {
      border-top-width: 2px;
    }
  }

  /* Focus management */
  .font-select:focus-visible,
  .cancel-button:focus-visible {
    outline: 2px solid var(--primary-color);
    outline-offset: 2px;
  }

  /* Print styles */
  @media print {
    .form-actions {
      display: none;
    }

    .preview-card,
    .color-preview,
    .font-preview {
      border: 1px solid black;
      box-shadow: none;
    }

    .preview-button {
      border: 1px solid black;
      background: white !important;
      color: black !important;
    }
  }
</style>