<script>
    import ImageUploader from '../../ui/ImageUploader.svelte';
    import ColorPicker from '../../ui/ColorPicker.svelte';
    import { restaurantStore } from '../../../stores/restaurantStore';
    import { createEventDispatcher } from 'svelte';
    import CompactImageCard from '../../ui/CompactImageCard.svelte';
  
    export let restaurant;
    export let restaurantId;
  
    const dispatch = createEventDispatcher();

    let formData = {
      profileImage: restaurant?.profileImage || '',
      coverImage: restaurant?.coverImage || '',
      primaryColor: restaurant?.primaryColor || '#3b82f6',
      backgroundColor: restaurant?.backgroundColor || '#ffffff',
      secondaryColor: restaurant?.secondaryColor || '#f59e42', // Color por defecto
      textColor: restaurant?.textColor || '#222222'
    };
  
    let uploading = { profileImage: false, coverImage: false };
    let isSubmitting = false;
    let error = null;

    // Control de apertura de ColorPickers
    let openPicker = null; // 'primary' | 'secondary' | 'text' | 'background' | null
  
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
          profileImage: formData.profileImage,
          coverImage: formData.coverImage,
          primaryColor: formData.primaryColor,
          backgroundColor: formData.backgroundColor,
          secondaryColor: formData.secondaryColor, // Nuevo campo
          textColor: formData.textColor
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
          profileImage: formData.profileImage,
          coverImage: formData.coverImage,
          primaryColor: formData.primaryColor,
          backgroundColor: formData.backgroundColor,
          secondaryColor: formData.secondaryColor,
          textColor: formData.textColor
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
        <CompactImageCard
          label="Perfil"
          currentImage={formData.profileImage}
          uploading={uploading.profileImage}
          on:fileSelected={(e) => handleImageUpload('profileImage', e)}
          on:remove={() => handleImageRemove('profileImage')}
          width={96}
          height={96}
        />
      </div>
      <div class="flex-1 flex flex-col gap-md items-center justify-center bg-bg-tertiary rounded-xl p-lg">
        <CompactImageCard
          label="Banner"
          currentImage={formData.coverImage}
          uploading={uploading.coverImage}
          on:fileSelected={(e) => handleImageUpload('coverImage', e)}
          on:remove={() => handleImageRemove('coverImage')}
          width={96}
          height={96}
        />
      </div>
    </div>
    <div class="content-colors-pickers">
      <div>
        <ColorPicker
          label="Color Primario"
          bind:value={formData.primaryColor}
          class="input w-full"
          open={openPicker === 'primary'}
          on:open={() => openPicker = 'primary'}
          on:close={() => openPicker = null}
          dropdownWidth="320px"
          modal={true}
        />
        <span class="text-xs text-muted mt-xs">Color principal</span>
      </div>
      <div>
        <ColorPicker
          label="Color Secundario"
          bind:value={formData.secondaryColor}
          class="input w-full"
          open={openPicker === 'secondary'}
          on:open={() => openPicker = 'secondary'}
          on:close={() => openPicker = null}
          dropdownWidth="320px"
          modal={true}
        />
        <span class="text-xs text-muted mt-xs">Color secundario</span>
      </div>
      <div>
        <ColorPicker
          label="Color de Texto"
          bind:value={formData.textColor}
          class="input w-full"
          open={openPicker === 'text'}
          on:open={() => openPicker = 'text'}
          on:close={() => openPicker = null}
          dropdownWidth="320px"
          modal={true}
        />
        <span class="text-xs text-muted mt-xs">Color del texto principal</span>
      </div>
      <div>
        <ColorPicker
          label="Color de Fondo"
          bind:value={formData.backgroundColor}
          class="input w-full"
          open={openPicker === 'background'}
          on:open={() => openPicker = 'background'}
          on:close={() => openPicker = null}
          dropdownWidth="320px"
          modal={true}
        />
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
.content-colors-pickers {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: var(--spacing-xl, 20px);
  width: 100%;
}
.content-colors-pickers > div {
  flex: 1 1 140px;
  min-width: 140px;
  max-width: 320px;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--spacing-xs, 4px);
}

@media (min-width: 600px) {
  .content-colors-pickers > div {
    min-width: 180px;
  }
}
@media (min-width: 900px) {
  .content-colors-pickers > div {
    min-width: 220px;
  }
}
</style>