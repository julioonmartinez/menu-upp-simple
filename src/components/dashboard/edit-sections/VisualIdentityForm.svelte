<!-- src/components/dashboard/edit-sections/VisualIdentityForm.svelte -->
<script>
  import { createEventDispatcher } from 'svelte';
  import { restaurantStore } from '../../../stores/restaurantStore';
  import ImageUploader from '../../ui/ImageUploader.svelte';
  import ColorPicker from '../../ui/ColorPicker.svelte';
  import LoadingButton from '../../ui/LoadingButton.svelte';
  import ErrorMessage from '../../ui/ErrorMessage.svelte';
  import SuccessMessage from '../../ui/SuccessMessage.svelte';

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

  // Fuentes disponibles
  const fontFamilies = [
    { value: 'Inter', label: 'Inter (Moderna)' },
    { value: 'Roboto', label: 'Roboto (Clásica)' },
    { value: 'Open Sans', label: 'Open Sans (Amigable)' },
    { value: 'Montserrat', label: 'Montserrat (Elegante)' },
    { value: 'Poppins', label: 'Poppins (Redonda)' },
    { value: 'Lato', label: 'Lato (Profesional)' },
    { value: 'Nunito', label: 'Nunito (Casual)' },
    { value: 'Playfair Display', label: 'Playfair (Serif)' },
    { value: 'Dancing Script', label: 'Dancing Script (Script)' }
  ];

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
        <label for="fontFamily" class="label">Fuente Principal</label>
        <select 
          id="fontFamily" 
          bind:value={formData.fontFamily}
          class="font-select"
        >
          {#each fontFamilies as font}
            <option value={font.value}>{font.label}</option>
          {/each}
        </select>
        <p class="help-text">Fuente que se usará en tu página web</p>
      </div>

      <!-- Preview de fuente -->
      <div class="font-preview" style="font-family: {formData.fontFamily}">
        <h4 class="preview-title">Vista Previa de Fuente</h4>
        <h1 class="font-preview-h1">{restaurant?.name || 'Nombre del Restaurante'}</h1>
        <h2 class="font-preview-h2">Especialidades de la Casa</h2>
        <p class="font-preview-p">
          Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor 
          incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam.
        </p>
      </div>
    </div>

    <!-- Botones -->
    <div class="form-actions">
      <button
        type="button"
        on:click={() => dispatch('close')}
        class="btn btn-secondary"
        disabled={isSubmitting || isUploadingAny}
      >
        Cancelar
      </button>
      
      <LoadingButton
        type="submit"
        loading={isSubmitting || isUpdating}
        disabled={isUploadingAny}
        class="btn btn-primary"
      >
        {isUploadingAny ? 'Subiendo imágenes...' : 'Guardar Cambios'}
      </LoadingButton>
    </div>
  </form>
</div>

<style>
  /* Variables */
  :root {
    --color-gray-100: #f3f4f6;
    --color-gray-200: #e5e7eb;
    --color-gray-300: #d1d5db;
    --color-gray-500: #6b7280;
    --color-gray-600: #4b5563;
    --color-gray-700: #374151;
    --color-gray-900: #111827;
    --color-blue-500: #3b82f6;
    --color-blue-600: #2563eb;
    --color-blue-700: #1d4ed8;
    --color-white: #ffffff;
    --shadow-sm: 0 1px 2px 0 rgb(0 0 0 / 0.05);
  }

  .visual-identity-form {
    width: 100%;
  }

  .message-container {
    margin-bottom: 1.5rem;
  }

  .form {
    display: flex;
    flex-direction: column;
    gap: 2rem;
  }

  /* Secciones */
  .form-section:not(:first-child) {
    border-top: 1px solid var(--color-gray-200);
    padding-top: 2rem;
  }

  .section-title {
    font-size: 1.125rem;
    font-weight: 600;
    color: var(--color-gray-900);
    margin: 0 0 1.5rem 0;
  }

  /* Grid de imágenes */
  .images-grid {
    display: grid;
    grid-template-columns: 1fr;
    gap: 1.5rem;
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
    gap: 1.5rem;
    margin-bottom: 2rem;
  }

  @media (min-width: 768px) {
    .colors-grid {
      grid-template-columns: repeat(2, 1fr);
    }
  }

  /* Preview de colores */
  .color-preview {
    background-color: var(--color-gray-100);
    border-radius: 0.75rem;
    padding: 1.5rem;
  }

  .preview-title {
    font-size: 1rem;
    font-weight: 600;
    color: var(--color-gray-900);
    margin: 0 0 1rem 0;
  }

  .preview-card {
    background-color: var(--color-white);
    border-radius: 0.5rem;
    border: 2px solid;
    overflow: hidden;
    box-shadow: var(--shadow-sm);
  }

  .preview-header {
    padding: 1rem 1.5rem;
  }

  .preview-restaurant-name {
    font-size: 1.25rem;
    font-weight: 700;
    margin: 0;
  }

  .preview-content {
    padding: 1.5rem;
  }

  .preview-description {
    color: var(--color-gray-600);
    margin: 0 0 1rem 0;
    line-height: 1.5;
  }

  .preview-button {
    padding: 0.5rem 1rem;
    border: none;
    border-radius: 0.375rem;
    font-weight: 500;
    cursor: pointer;
    transition: opacity 0.15s ease-in-out;
  }

  .preview-button:hover {
    opacity: 0.9;
  }

  /* Tipografía */
  .font-field {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    margin-bottom: 2rem;
  }

  .label {
    font-size: 0.875rem;
    font-weight: 500;
    color: var(--color-gray-700);
  }

  .font-select {
    padding: 0.5rem 0.75rem;
    border: 1px solid var(--color-gray-300);
    border-radius: 0.5rem;
    background-color: var(--color-white);
    font-size: 0.875rem;
    transition: border-color 0.15s ease-in-out;
  }

  .font-select:focus {
    outline: none;
    border-color: var(--color-blue-500);
    box-shadow: 0 0 0 3px rgb(59 130 246 / 0.1);
  }

  .help-text {
    font-size: 0.75rem;
    color: var(--color-gray-500);
    margin: 0;
  }

  /* Preview de fuente */
  .font-preview {
    background-color: var(--color-gray-100);
    border-radius: 0.75rem;
    padding: 1.5rem;
  }

  .font-preview-h1 {
    font-size: 2rem;
    font-weight: 700;
    margin: 0 0 0.5rem 0;
    color: var(--color-gray-900);
  }

  .font-preview-h2 {
    font-size: 1.5rem;
    font-weight: 600;
    margin: 0 0 1rem 0;
    color: var(--color-gray-700);
  }

  .font-preview-p {
    font-size: 1rem;
    line-height: 1.6;
    margin: 0;
    color: var(--color-gray-600);
  }

  /* Botones */
  .form-actions {
    border-top: 1px solid var(--color-gray-200);
    padding-top: 1.5rem;
    display: flex;
    justify-content: flex-end;
    gap: 0.75rem;
    flex-wrap: wrap;
  }

  .btn {
    padding: 0.625rem 1.25rem;
    border-radius: 0.5rem;
    font-size: 0.875rem;
    font-weight: 500;
    border: 1px solid transparent;
    cursor: pointer;
    transition: all 0.15s ease-in-out;
    min-width: 120px;
  }

  .btn:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .btn-secondary {
    color: var(--color-gray-700);
    background-color: var(--color-white);
    border-color: var(--color-gray-300);
  }

  .btn-secondary:hover:not(:disabled) {
    background-color: var(--color-gray-100);
  }

  :global(.btn-primary) {
    background-color: var(--color-blue-600) !important;
    color: var(--color-white) !important;
    border-color: var(--color-blue-600) !important;
  }

  :global(.btn-primary:hover:not(:disabled)) {
    background-color: var(--color-blue-700) !important;
    border-color: var(--color-blue-700) !important;
  }

  /* Responsive */
  @media (max-width: 640px) {
    .form-actions {
      flex-direction: column;
    }

    .btn {
      width: 100%;
    }
  }
</style>