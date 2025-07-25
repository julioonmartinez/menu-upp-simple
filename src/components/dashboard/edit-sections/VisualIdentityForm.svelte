<!-- src/components/dashboard/edit-sections/VisualIdentityForm.svelte -->
<script  >
  import { createEventDispatcher } from 'svelte';
  import { restaurantStore } from '../../../stores/restaurantStore';
  import ImageUploader from '../../ui/ImageUploader.svelte';
  import CompactImageCard from '../../ui/CompactImageCard.svelte';
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
    profileImage: '',   // antes imageProfile
    coverImage: '',     // antes imageCover
    image: '',
    textImage: '',      // antes imageText
    primaryColor: '#3b82f6',
    secondaryColor: '#10b981',
    backgroundColor: '#ffffff',
    textColor: '#222222',
    fontFamily: 'Inter'
  };

  let lastRestaurantId = null;
  $: if (restaurant && restaurant.id !== lastRestaurantId) {
    formData = {
      logo: restaurant.logo || '',
      profileImage: restaurant.profileImage || '',
      coverImage: restaurant.coverImage || '',
      image: restaurant.image || '',
      textImage: restaurant.textImage || '',
      primaryColor: restaurant.primaryColor || '#3b82f6',
      secondaryColor: restaurant.secondaryColor || '#10b981',
      backgroundColor: restaurant.backgroundColor || '#ffffff',
      textColor: restaurant.textColor || '#222222',
      fontFamily: restaurant.fontFamily || 'Inter'
    };
    lastRestaurantId = restaurant.id;
  }


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
  let isClosing = false;

  // Reactive statements
  $: isUpdating = $restaurantStore.isUpdating;
  $: updateError = $restaurantStore.updateError;
  $: isUploadingAny = Object.values(uploading).some(Boolean);

  // Fuentes disponibles (importadas desde fontLoader.ts)

  // Actualizar formData cuando cambie restaurant
  // $: if (restaurant) {
  //   formData = {
  //     logo: restaurant.logo || '',
  //     profileImage: restaurant.profileImage || '',
  //     coverImage: restaurant.coverImage || '',
  //     image: restaurant.image || '',
  //     textImage: restaurant.textImage || '',
  //     primaryColor: restaurant.primaryColor || '#3b82f6',
  //     secondaryColor: restaurant.secondaryColor || '#10b981',
  //     backgroundColor: restaurant.backgroundColor || '#ffffff',
  //     textColor: restaurant.textColor || '#222222',
  //     fontFamily: restaurant.fontFamily || 'Inter'
  //   };
  // }

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

  async function handleImageRemove(imageType) {
    if (!restaurantId) return;
    uploading[imageType] = true;
    error = null;
    try {
      const result = await restaurantStore.deleteRestaurantImage(restaurantId, imageType);
      if (result.success) {
        formData[imageType] = '';
        // Opcional: mostrar mensaje de éxito
      } else {
        error = result.error || `Error eliminando ${imageType}`;
      }
    } catch (err) {
      error = err.message || `Error desconocido eliminando ${imageType}`;
    } finally {
      uploading[imageType] = false;
    }
  }

  async function handleSubmit(event) {
    event.preventDefault();
    console.log('handleSubmit ejecutado');
    if (isSubmitting || isUploadingAny) {
      console.log('Bloqueado por isSubmitting o isUploadingAny', { isSubmitting, isUploadingAny });
      return;
    }

    isSubmitting = true;
    error = null;
    success = null;

    try {
      const updateData = {
        primaryColor: formData.primaryColor,
        secondaryColor: formData.secondaryColor,
        backgroundColor: formData.backgroundColor,
        textColor: formData.textColor,
        fontFamily: formData.fontFamily
      };

      // Solo incluir imágenes que hayan cambiado
      ['logo', 'profileImage', 'coverImage', 'image', 'textImage'].forEach(imageType => {
        if (formData[imageType] !== restaurant?.[imageType]) {
          updateData[imageType] = formData[imageType];
        }
      });

      console.log('Enviando updateData:', updateData);
      const result = await restaurantStore.updateRestaurant(restaurantId, updateData);
      console.log('Resultado del update:', result);

      if (result.success) {
        success = 'Identidad visual actualizada correctamente';
        dispatch('update');
        isClosing = true;
        await restaurantStore.loadRestaurant(restaurantId, true);
        setTimeout(() => {
          isClosing = false;
          dispatch('close');
        }, 2000);
      } else {
        error = result.error || 'Error actualizando la identidad visual';
        console.error('Error en update:', error);
        isSubmitting = false;
      }
    } catch (err) {
      error = err.message || 'Error desconocido';
      console.error('Error en catch:', err);
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
        <CompactImageCard
          label="Logo"
          currentImage={formData.logo}
          maxSize={2}
          width={96}
          height={96}
          uploading={uploading.logo}
          error={error}
          on:fileSelected={(e) => handleImageUpload('logo', e)}
          on:remove={() => handleImageRemove('logo')}
        />
        <CompactImageCard
        label="Imagen de Perfil"
        currentImage={formData.profileImage}
        maxSize={3}
        width={96}
        height={96}
        uploading={uploading.profileImage}
        error={error}
        on:fileSelected={(e) => handleImageUpload('profileImage', e)}
        on:remove={() => handleImageRemove('profileImage')}
      />
        <CompactImageCard
          label="Imagen General"
          currentImage={formData.image}
          maxSize={3}
          width={96}
          height={96}
          uploading={uploading.image}
          error={error}
          on:fileSelected={(e) => handleImageUpload('image', e)}
          on:remove={() => handleImageRemove('image')}
        />
        <CompactImageCard
  label="Imagen con Texto"
  currentImage={formData.textImage}
  maxSize={3}
  width={96}
  height={96}
  uploading={uploading.textImage}
  error={error}
  on:fileSelected={(e) => handleImageUpload('textImage', e)}
  on:remove={() => handleImageRemove('textImage')}
/>
        <CompactImageCard
        label="Imagen de Portada"
        currentImage={formData.coverImage}
        maxSize={5}
        width={96}
        height={96}
        uploading={uploading.coverImage}
        error={error}
        on:fileSelected={(e) => handleImageUpload('coverImage', e)}
        on:remove={() => handleImageRemove('coverImage')}
      />
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

        <div class="color-field">
          <ColorPicker
            label="Color de Fondo"
            bind:value={formData.backgroundColor}
            help="Color de fondo de la página"
          />
        </div>

        <div class="color-field">
          <ColorPicker
            label="Color de Texto"
            bind:value={formData.textColor}
            help="Color principal del texto en la página"
          />
        </div>
      </div>

      <!-- Preview de colores -->
      <div class="color-preview" style="background-color: {formData.backgroundColor}">
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
        disabled={isSubmitting || isUploadingAny || isClosing}
      >
        Cancelar
      </button>
      
      <LoadingButton
        type="submit"
        loading={isSubmitting || isUpdating || isClosing}
        disabled={isUploadingAny || isClosing}
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
    grid-template-columns: repeat(2, 1fr);
    gap: var(--spacing-xl);
    align-items: start;
  }
  @media (min-width: 640px) {
    .images-grid {
      grid-template-columns: repeat(2, 1fr);
    }
  }
  @media (min-width: 1024px) {
    .images-grid {
      grid-template-columns: repeat(4, 1fr);
    }
  }
  .cover-image {
    grid-column: span 2;
  }
  @media (min-width: 1024px) {
    .cover-image {
      grid-column: span 2;
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