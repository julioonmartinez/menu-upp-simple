<script>
  import { createEventDispatcher } from 'svelte';
  import { restaurantStore } from '../../../stores/restaurantStore';
  import { toastStore } from '../../../stores/toastStore';
  
  export let restaurant;
  export let restaurantId;
  const dispatch = createEventDispatcher();

  let formData = {
    schedule: restaurant?.schedule || ''
  };
  let isSubmitting = false;
  let error = null;

  // Exponer método save() para el wizard
  export async function save() {
    isSubmitting = true;
    error = null;
    try {
      const result = await restaurantStore.updateRestaurant(restaurantId, {
        schedule: formData.schedule.trim()
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

  function setPresetSchedule(preset) {
    const presets = {
      'business': 'Lunes a Viernes de 9:00 a 18:00. Domingo cerrado.',
      'restaurant': 'Todos los días de 12:00 a 22:00.',
      'cafe': 'Todos los días de 7:00 a 19:00.',
      '24h': 'Abierto las 24 horas, todos los días.'
    };

    const selectedPreset = presets[preset];
    if (!selectedPreset) return;

    formData.schedule = selectedPreset;
    formData = { ...formData };
  }
</script>

<div class="onboarding-schedule flex flex-col gap-xl w-full max-w-lg mx-auto animate-fade-in">
  <h2 class="text-2xl font-bold text-primary text-center mb-lg">¡Configura tus horarios de atención!</h2>
  <p class="text-muted text-center mb-xl">Ayuda a tus clientes a saber cuándo pueden visitarte.</p>
  
  <form class="flex flex-col gap-lg" on:submit|preventDefault={() => {}}>
    <div class="flex flex-col gap-xs">
      <label class="font-medium text-secondary" for="schedule">Descripción de horarios</label>
      <textarea 
        id="schedule" 
        class="input" 
        placeholder="Ej: Abierto todos los días de 12:00 a 22:00. Horarios especiales en días festivos."
        bind:value={formData.schedule}
        rows="3"
      ></textarea>
      <span class="text-xs text-muted">Describe tus horarios de atención de manera clara</span>
    </div>

    <div class="card-compact bg-gray-light">
      <h3 class="text-lg font-medium text-primary mb-md">
        <i class="fas fa-magic text-accent mr-sm"></i>
        Configuraciones rápidas
      </h3>
      <div class="flex flex-wrap gap-sm">
        <button
          type="button"
          on:click={() => setPresetSchedule('business')}
          class="btn btn-secondary btn-sm"
        >
          <i class="fas fa-building mr-xs"></i>
          Oficina
        </button>
        <button
          type="button"
          on:click={() => setPresetSchedule('restaurant')}
          class="btn btn-secondary btn-sm"
        >
          <i class="fas fa-utensils mr-xs"></i>
          Restaurante
        </button>
        <button
          type="button"
          on:click={() => setPresetSchedule('cafe')}
          class="btn btn-secondary btn-sm"
        >
          <i class="fas fa-coffee mr-xs"></i>
          Café
        </button>
        <button
          type="button"
          on:click={() => setPresetSchedule('24h')}
          class="btn btn-secondary btn-sm"
        >
          <i class="fas fa-clock mr-xs"></i>
          24 Horas
        </button>
      </div>
    </div>

    {#if formData.schedule.trim()}
      <div class="card-compact bg-info-bg border border-info">
        <h4 class="font-medium text-info mb-sm">
          <i class="fas fa-eye mr-sm"></i>
          Vista previa:
        </h4>
        <div class="text-sm text-info">
          <p class="italic">"{formData.schedule}"</p>
        </div>
      </div>
    {/if}

    {#if isSubmitting}
      <div class="text-center text-muted mt-lg animate-pulse">Guardando...</div>
    {/if}
  </form>
</div>

<style>
.onboarding-schedule {
  padding: 0;
  margin: 0 auto;
  box-sizing: border-box;
}
</style> 