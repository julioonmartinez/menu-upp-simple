<script>
  import { createEventDispatcher } from 'svelte';
  import { restaurantStore } from '../../../stores/restaurantStore.ts';
  import InputField from '../../ui/InputField.svelte';
  import TextareaField from '../../ui/TextareaField.svelte';
  import LoadingButton from '../../ui/LoadingButton.svelte';
  import ErrorMessage from '../../ui/ErrorMessage.svelte';
  import SuccessMessage from '../../ui/SuccessMessage.svelte';

  export let restaurant;
  export let restaurantId;

  const dispatch = createEventDispatcher();

  // Días de la semana con iconos Font Awesome
  const daysOfWeek = [
    { key: 'monday', label: 'Lunes', icon: 'fas fa-calendar-day' },
    { key: 'tuesday', label: 'Martes', icon: 'fas fa-calendar-day' },
    { key: 'wednesday', label: 'Miércoles', icon: 'fas fa-calendar-day' },
    { key: 'thursday', label: 'Jueves', icon: 'fas fa-calendar-day' },
    { key: 'friday', label: 'Viernes', icon: 'fas fa-calendar-day' },
    { key: 'saturday', label: 'Sábado', icon: 'fas fa-calendar-day' },
    { key: 'sunday', label: 'Domingo', icon: 'fas fa-calendar-day' }
  ];

  // Form data
  let formData = {
    schedule: restaurant?.schedule || '',
    businessHours: { ...restaurant?.businessHours }
  };

  // Inicializar horarios si no existen
  daysOfWeek.forEach(day => {
    if (!formData.businessHours[day.key]) {
      formData.businessHours[day.key] = {
        open: '09:00',
        close: '18:00',
        closed: false
      };
    }
  });

  // Estados
  let isSubmitting = false;
  let error = null;
  let success = null;

  // Reactive statements
  $: isUpdating = $restaurantStore.isUpdating;
  $: updateError = $restaurantStore.updateError;

  async function handleSubmit() {
    if (isSubmitting) return;

    isSubmitting = true;
    error = null;
    success = null;

    try {
      // Preparar datos para el update
      const updateData = {
        schedule: formData.schedule.trim(),
        businessHours: { ...formData.businessHours }
      };

      const result = await restaurantStore.updateRestaurant(restaurantId, updateData);

      if (result.success) {
        success = 'Horarios actualizados correctamente';
        dispatch('update');
        
        // Limpiar mensaje de éxito después de 3 segundos
        setTimeout(() => {
          success = null;
        }, 3000);
      } else {
        error = result.error || 'Error actualizando los horarios';
      }
    } catch (err) {
      error = err.message || 'Error desconocido';
    } finally {
      isSubmitting = false;
    }
  }

  function toggleDayClosed(dayKey) {
    formData.businessHours[dayKey].closed = !formData.businessHours[dayKey].closed;
  }

  function copyToAllDays(dayKey) {
    const sourceDay = formData.businessHours[dayKey];
    
    daysOfWeek.forEach(day => {
      if (day.key !== dayKey) {
        formData.businessHours[day.key] = {
          open: sourceDay.open,
          close: sourceDay.close,
          closed: sourceDay.closed
        };
      }
    });
    
    // Forzar reactividad
    formData = { ...formData };
  }

  function setPresetSchedule(preset) {
    const presets = {
      'business': {
        hours: { open: '09:00', close: '18:00', closed: false },
        weekendClosed: true
      },
      'restaurant': {
        hours: { open: '12:00', close: '22:00', closed: false },
        weekendClosed: false
      },
      'cafe': {
        hours: { open: '07:00', close: '19:00', closed: false },
        weekendClosed: false
      },
      '24h': {
        hours: { open: '00:00', close: '23:59', closed: false },
        weekendClosed: false
      }
    };

    const selectedPreset = presets[preset];
    if (!selectedPreset) return;

    daysOfWeek.forEach(day => {
      const isSunday = day.key === 'sunday';
      
      formData.businessHours[day.key] = {
        open: selectedPreset.hours.open,
        close: selectedPreset.hours.close,
        closed: selectedPreset.weekendClosed && isSunday
      };
    });

    // Forzar reactividad
    formData = { ...formData };
  }
</script>

<div class="p-2xl">
  <div class="mb-2xl">
    <h2 class="text-2xl font-semibold text-primary mb-sm">
      <i class="fas fa-clock text-accent mr-sm"></i>
      Horarios de Atención
    </h2>
    <p class="text-muted">
      Configura los horarios de tu restaurante para cada día de la semana
    </p>
  </div>

  {#if error || updateError}
    <div class="mb-2xl">
      <ErrorMessage message={error || updateError} />
    </div>
  {/if}

  {#if success}
    <div class="mb-2xl">
      <SuccessMessage message={success} />
    </div>
  {/if}

  <form on:submit|preventDefault={handleSubmit} class="flex flex-col gap-2xl">
    <div>
      <TextareaField
        label="Descripción de horarios (opcional)"
        id="schedule"
        bind:value={formData.schedule}
        placeholder="Ej: Abierto todos los días. Horarios especiales en días festivos."
        rows={2}
        help="Descripción adicional sobre tus horarios que aparecerá en tu página"
      />
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
          Oficina (9:00 - 18:00, Dom cerrado)
        </button>
        <button
          type="button"
          on:click={() => setPresetSchedule('restaurant')}
          class="btn btn-secondary btn-sm"
        >
          <i class="fas fa-utensils mr-xs"></i>
          Restaurante (12:00 - 22:00)
        </button>
        <button
          type="button"
          on:click={() => setPresetSchedule('cafe')}
          class="btn btn-secondary btn-sm"
        >
          <i class="fas fa-coffee mr-xs"></i>
          Café (7:00 - 19:00)
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

    <div class="flex flex-col gap-lg">
      <h3 class="text-xl font-medium text-primary">
        <i class="fas fa-calendar-week text-accent mr-sm"></i>
        Horarios por día
      </h3>

      {#each daysOfWeek as day}
        <div class="card-compact">
          <div class="flex items-center justify-between mb-lg">
            <div class="flex items-center gap-md">
              <i class="{day.icon} text-xl text-accent"></i>
              <h4 class="font-medium text-primary">{day.label}</h4>
            </div>
            
            <div class="flex items-center gap-sm">
              <label class="flex items-center">
                <input
                  type="checkbox"
                  bind:checked={formData.businessHours[day.key].closed}
                  class="mr-sm"
                />
                <span class="text-sm text-muted">Cerrado</span>
              </label>
              
              <button
                type="button"
                on:click={() => copyToAllDays(day.key)}
                class="btn btn-ghost btn-sm"
                title="Copiar este horario a todos los días"
              >
                <i class="fas fa-copy mr-xs"></i>
                Copiar a todos
              </button>
            </div>
          </div>

          {#if !formData.businessHours[day.key].closed}
            <div class="grid grid-cols-2 gap-lg">
              <div>
                <label for="open-{day.key}" class="block text-sm font-medium text-secondary mb-xs">
                  <i class="fas fa-door-open mr-xs text-success"></i>
                  Hora de apertura
                </label>
                <input
                  id="open-{day.key}"
                  type="time"
                  bind:value={formData.businessHours[day.key].open}
                  class="input"
                />
              </div>
              
              <div>
                <label for="close-{day.key}" class="block text-sm font-medium text-secondary mb-xs">
                  <i class="fas fa-door-closed mr-xs text-error"></i>
                  Hora de cierre
                </label>
                <input
                  id="close-{day.key}"
                  type="time"
                  bind:value={formData.businessHours[day.key].close}
                  class="input"
                />
              </div>
            </div>
          {:else}
            <div class="text-center py-lg text-muted bg-gray-light rounded">
              <i class="fas fa-lock text-xl mb-sm"></i>
              <p>Cerrado este día</p>
            </div>
          {/if}
        </div>
      {/each}
    </div>

    <div class="card-compact bg-info-bg border border-info">
      <h4 class="font-medium text-info mb-sm">
        <i class="fas fa-eye mr-sm"></i>
        Vista previa:
      </h4>
      <div class="text-sm text-info flex flex-col gap-xs">
        {#if formData.schedule.trim()}
          <p class="italic">"{formData.schedule}"</p>
        {/if}
        {#each daysOfWeek as day}
          <div class="flex justify-between">
            <span class="font-medium">{day.label}:</span>
            <span>
              {#if formData.businessHours[day.key].closed}
                <i class="fas fa-lock mr-xs"></i>
                Cerrado
              {:else}
                <i class="fas fa-clock mr-xs"></i>
                {formData.businessHours[day.key].open} - {formData.businessHours[day.key].close}
              {/if}
            </span>
          </div>
        {/each}
      </div>
    </div>

    <div class="border-t border-accent pt-2xl flex justify-end gap-md">
      <button
        type="button"
        on:click={() => window.history.back()}
        class="btn btn-secondary"
        disabled={isSubmitting || isUpdating}
      >
        <i class="fas fa-times mr-sm"></i>
        Cancelar
      </button>
      
      <LoadingButton
        type="submit"
        loading={isSubmitting || isUpdating}
        class="btn btn-primary"
      >
        <i class="fas fa-save mr-sm"></i>
        Guardar Horarios
      </LoadingButton>
    </div>
  </form>
</div>

<style>
  /* Estilos específicos que no están en global-styles.css */
  
  /* Mejoras para inputs de tiempo */
  input[type="time"] {
    font-family: inherit;
    font-size: var(--font-base);
    -webkit-appearance: none;
    appearance: none;
  }
  
  /* Mejoras para checkboxes */
  input[type="checkbox"] {
    width: 16px;
    height: 16px;
    border: 1px solid var(--bg-accent);
    border-radius: var(--radius-xs);
    background: var(--bg-primary);
    cursor: pointer;
    transition: all var(--transition-fast);
  }
  
  input[type="checkbox"]:checked {
    background: var(--primary-color);
    border-color: var(--primary-color);
  }
  
  input[type="checkbox"]:focus {
    outline: 2px solid var(--primary-color);
    outline-offset: 2px;
  }
  
  /* Responsive para móviles */
  @media (max-width: 768px) {
    .grid-cols-2 {
      grid-template-columns: 1fr;
    }
    
    .flex.justify-between {
      flex-direction: column;
      gap: var(--spacing-md);
    }
    
    .flex.items-center.justify-between {
      flex-direction: column;
      align-items: flex-start;
      gap: var(--spacing-md);
    }
  }
  
  /* Mejoras de accesibilidad */
  @media (prefers-reduced-motion: reduce) {
    .btn,
    .card {
      transition: none;
    }
  }
  
  /* Dark mode support */
  @media (prefers-color-scheme: dark) {
    input[type="checkbox"] {
      background: var(--bg-tertiary);
      border-color: var(--bg-accent);
    }
    
    input[type="checkbox"]:checked {
      background: var(--primary-color);
      border-color: var(--primary-color);
    }
  }
</style> 