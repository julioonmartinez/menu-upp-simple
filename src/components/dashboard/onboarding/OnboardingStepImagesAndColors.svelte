<script>
    import ImageUploader from '../../ui/ImageUploader.svelte';
    import ColorPicker from '../../ui/ColorPicker.svelte';
    import { restaurantStore } from '../../../stores/restaurantStore';
    import { createEventDispatcher } from 'svelte';
    import MiniImageUploader from '../../ui/MiniImageUploader.svelte';
  
    export let restaurant;
    export let restaurantId;
  
    const dispatch = createEventDispatcher();

    let formData = {
      imageProfile: restaurant?.imageProfile || '',
      imageCover: restaurant?.imageCover || '',
      primaryColor: restaurant?.primaryColor || '#3b82f6',
      backgroundColor: restaurant?.backgroundColor || '#ffffff',
      secondaryColor: restaurant?.secondaryColor || '#f59e42' // Color por defecto
    };
  
    let uploading = { imageProfile: false, imageCover: false };
    let isSubmitting = false;
    let error = null;
  
    async function handleImageUpload(type, event) {
      const { file } = event.detail;
      uploading[type] = true;
      try {
        const result = await restaurantStore.uploadRestaurantImage(restaurantId, file, type);
        if (result.success) {
          formData[type] = result.restaurant[type];
        } else {
          error = result.error;
        }
      } finally {
        uploading[type] = false;
      }
    }

    function handleImageRemove(type) {
      formData[type] = '';
      // Opcional: aquí podrías hacer una llamada al backend para eliminar la imagen real
    }
  
    async function handleSubmit() {
      isSubmitting = true;
      error = null;
      try {
        const updateData = {
          imageProfile: formData.imageProfile,
          imageCover: formData.imageCover,
          primaryColor: formData.primaryColor,
          backgroundColor: formData.backgroundColor,
          secondaryColor: formData.secondaryColor // Nuevo campo
        };
        const result = await restaurantStore.updateRestaurant(restaurantId, updateData);
        if (result.success) {
          dispatch('next');
        } else {
          error = result.error;
        }
      } finally {
        isSubmitting = false;
      }
    }

    // Exponer método save() para el wizard
    export async function save() {
      isSubmitting = true;
      error = null;
      try {
        const updateData = {
          imageProfile: formData.imageProfile,
          imageCover: formData.imageCover,
          primaryColor: formData.primaryColor,
          backgroundColor: formData.backgroundColor,
          secondaryColor: formData.secondaryColor
        };
        const result = await restaurantStore.updateRestaurant(restaurantId, updateData);
        if (result.success) {
          return true;
        } else {
          error = result.error;
          return false;
        }
      } finally {
        isSubmitting = false;
      }
    }
  </script>
  
  <div class="onboarding-images-colors flex flex-col gap-2xl h-full w-full animate-fade-in">
    <h2 class="text-2xl font-bold text-primary mb-lg text-center">Personaliza tu restaurante</h2>
    <p class="text-muted text-center mb-xl">Sube tus imágenes y elige los colores que representarán tu marca.</p>
    <div class="flex md:flex-row gap-xl justify-center items-stretch w-full">
      <div class="flex-1 flex flex-col gap-md items-center justify-center bg-bg-tertiary rounded-xl p-lg">
        <MiniImageUploader
          label="Logo"
          currentImage={formData.imageProfile}
          uploading={uploading.imageProfile}
          on:fileSelected={(e) => handleImageUpload('imageProfile', e)}
          on:remove={() => handleImageRemove('imageProfile')}
        />
      </div>
      <div class="flex-1 flex flex-col gap-md items-center justify-center bg-bg-tertiary rounded-xl p-lg">
        <MiniImageUploader
          label="Banner"
          currentImage={formData.imageCover}
          uploading={uploading.imageCover}
          on:fileSelected={(e) => handleImageUpload('imageCover', e)}
          on:remove={() => handleImageRemove('imageCover')}
        />
      </div>
    </div>
    <div class="flex flex-col gap-xl mt-2xl w-full">
      <div class="flex md:flex-row gap-xl w-full">
        <div class="flex flex-col items-center gap-xs flex-1">
          <ColorPicker label="Color Primario" bind:value={formData.primaryColor} class="input w-full" />
          <span class="text-xs text-muted mt-xs">Color principal</span>
        </div>
        <div class="flex flex-col items-center gap-xs flex-1">
          <ColorPicker label="Color Secundario" bind:value={formData.secondaryColor} class="input w-full" />
          <span class="text-xs text-muted mt-xs">Color secundario</span>
        </div>
      </div>
      <div class="flex flex-col items-center gap-xs flex-1 w-full">
        <ColorPicker label="Color de Fondo" bind:value={formData.backgroundColor} class="input w-full" />
        <span class="text-xs text-muted mt-xs">Color de fondo del menú</span>
      </div>
    </div>
    {#if error}
      <div class="error-state mt-2xl">{error}</div>
    {/if}
    {#if isSubmitting}
      <div class="text-center text-muted mt-lg animate-pulse">Guardando...</div>
    {/if}
  </div>

<style>
.onboarding-images-colors {
  width: 100%;
  height: 100%;
  padding: 0;
  margin: 0;
  box-sizing: border-box;
}
.onboarding-images-colors .flex-1 {
  min-width: 0;
}
@media (max-width: 768px) {
  .onboarding-images-colors .flex-col.md\:flex-row {
    flex-direction: column !important;
    gap: var(--spacing-xl) !important;
  }
  .onboarding-images-colors .flex-1 {
    width: 100%;
    min-width: 0;
  }
}
</style>