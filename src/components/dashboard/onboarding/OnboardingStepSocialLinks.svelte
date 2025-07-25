<script>
  import { createEventDispatcher } from 'svelte';
  import { restaurantStore } from '../../../stores/restaurantStore';
  import { toastStore } from '../../../stores/toastStore';
  export let restaurant;
  export let restaurantId;
  const dispatch = createEventDispatcher();

  let formData = {
    facebook: restaurant?.socialLinks?.facebook || '',
    instagram: restaurant?.socialLinks?.instagram || '',
    whatsapp: restaurant?.socialLinks?.whatsapp || ''
  };
  let isSubmitting = false;
  let error = null;

  // Exponer método save() para el wizard
  export async function save() {
    isSubmitting = true;
    error = null;
    try {
      const result = await restaurantStore.updateRestaurant(restaurantId, {
        socialLinks: {
          facebook: formData.facebook,
          instagram: formData.instagram,
          whatsapp: formData.whatsapp
        }
      });
      if (result.success) {
        return true;
      } else {
        error = result.error;
        if (error) {
          toastStore.error(error);
        }
        return false;
      }
    } catch (e) {
      error = e?.message || 'Error desconocido';
      toastStore.error(error);
      return false;
    } finally {
      isSubmitting = false;
    }
  }
</script>

<div class="onboarding-social-links flex flex-col gap-xl w-full max-w-lg mx-auto animate-fade-in">
  <h2 class="text-2xl font-bold text-primary text-center mb-lg">¡Agrega tus redes sociales principales!</h2>
  <p class="text-muted text-center mb-xl">Más adelante podrás agregar otras redes sociales.</p>
  <form class="flex flex-col gap-lg" on:submit|preventDefault={() => {}}>
    <div class="flex flex-col gap-xs">
      <label class="font-medium text-secondary" for="facebook">Facebook</label>
      <input id="facebook" class="input" type="url" placeholder="https://facebook.com/tu-pagina" bind:value={formData.facebook} />
    </div>
    <div class="flex flex-col gap-xs">
      <label class="font-medium text-secondary" for="instagram">Instagram</label>
      <input id="instagram" class="input" type="url" placeholder="https://instagram.com/tu-usuario" bind:value={formData.instagram} />
    </div>
    <div class="flex flex-col gap-xs">
      <label class="font-medium text-secondary" for="whatsapp">WhatsApp</label>
      <input id="whatsapp" class="input" type="tel" placeholder="Ej: 521234567890" bind:value={formData.whatsapp} />
    </div>
    {#if isSubmitting}
      <div class="text-center text-muted mt-lg animate-pulse">Guardando...</div>
    {/if}
  </form>
</div>

<style>
.onboarding-social-links {
  padding: 0;
  margin: 0 auto;
  box-sizing: border-box;
}
</style> 