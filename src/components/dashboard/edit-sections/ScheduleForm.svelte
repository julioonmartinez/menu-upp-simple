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

  // Días de la semana
  const daysOfWeek = [
    { key: 'monday', label: 'Lunes', emoji: '📅' },
    { key: 'tuesday', label: 'Martes', emoji: '📅' },
    { key: 'wednesday', label: 'Miércoles', emoji: '📅' },
    { key: 'thursday', label: 'Jueves', emoji: '📅' },
    { key: 'friday', label: 'Viernes', emoji: '📅' },
    { key: 'saturday', label: 'Sábado', emoji: '📅' },
    { key: 'sunday', label: 'Domingo', emoji: '📅' }
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

<div class="schedule-form-container">
  <div class="form-header">
    <h2 class="form-title">
      Horarios de Atención
    </h2>
    <p class="form-description">
      Configura los horarios de tu restaurante para cada día de la semana
    </p>
  </div>

  {#if error || updateError}
    <div class="form-message-container">
      <ErrorMessage message={error || updateError} />
    </div>
  {/if}

  {#if success}
    <div class="form-message-container">
      <SuccessMessage message={success} />
    </div>
  {/if}

  <form on:submit|preventDefault={handleSubmit} class="schedule-form">
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

    <div class="quick-presets-section">
      <h3 class="quick-presets-title">
        Configuraciones rápidas
      </h3>
      <div class="quick-presets-buttons">
        <button
          type="button"
          on:click={() => setPresetSchedule('business')}
          class="preset-button"
        >
          Oficina (9:00 - 18:00, Dom cerrado)
        </button>
        <button
          type="button"
          on:click={() => setPresetSchedule('restaurant')}
          class="preset-button"
        >
          Restaurante (12:00 - 22:00)
        </button>
        <button
          type="button"
          on:click={() => setPresetSchedule('cafe')}
          class="preset-button"
        >
          Café (7:00 - 19:00)
        </button>
        <button
          type="button"
          on:click={() => setPresetSchedule('24h')}
          class="preset-button"
        >
          24 Horas
        </button>
      </div>
    </div>

    <div class="daily-hours-section">
      <h3 class="daily-hours-title">
        Horarios por día
      </h3>

      {#each daysOfWeek as day}
        <div class="daily-hour-card">
          <div class="daily-hour-header">
            <div class="daily-hour-label-container">
              <span class="daily-hour-emoji">{day.emoji}</span>
              <h4 class="daily-hour-label">{day.label}</h4>
            </div>
            
            <div class="daily-hour-actions">
              <label class="closed-checkbox-label">
                <input
                  type="checkbox"
                  bind:checked={formData.businessHours[day.key].closed}
                  class="closed-checkbox"
                />
                <span class="closed-checkbox-text">Cerrado</span>
              </label>
              
              <button
                type="button"
                on:click={() => copyToAllDays(day.key)}
                class="copy-to-all-button"
                title="Copiar este horario a todos los días"
              >
                Copiar a todos
              </button>
            </div>
          </div>

          {#if !formData.businessHours[day.key].closed}
            <div class="time-inputs-grid">
              <div>
                <label for="open-{day.key}" class="time-input-label">
                  Hora de apertura
                </label>
                <input
                  id="open-{day.key}"
                  type="time"
                  bind:value={formData.businessHours[day.key].open}
                  class="time-input-field"
                />
              </div>
              
              <div>
                <label for="close-{day.key}" class="time-input-label">
                  Hora de cierre
                </label>
                <input
                  id="close-{day.key}"
                  type="time"
                  bind:value={formData.businessHours[day.key].close}
                  class="time-input-field"
                />
              </div>
            </div>
          {:else}
            <div class="closed-message">
              Cerrado este día
            </div>
          {/if}
        </div>
      {/each}
    </div>

    <div class="preview-section">
      <h4 class="preview-title">Vista previa:</h4>
      <div class="preview-content">
        {#if formData.schedule.trim()}
          <p class="preview-schedule">"{formData.schedule}"</p>
        {/if}
        {#each daysOfWeek as day}
          <div class="preview-day-item">
            <span class="preview-day-label">{day.label}:</span>
            <span>
              {#if formData.businessHours[day.key].closed}
                Cerrado
              {:else}
                {formData.businessHours[day.key].open} - {formData.businessHours[day.key].close}
              {/if}
            </span>
          </div>
        {/each}
      </div>
    </div>

    <div class="form-actions">
      <button
        type="button"
        on:click={() => window.history.back()}
        class="button-cancel"
        disabled={isSubmitting || isUpdating}
      >
        Cancelar
      </button>
      
      <LoadingButton
        type="submit"
        loading={isSubmitting || isUpdating}
        class="button-save"
      >
        Guardar Horarios
      </LoadingButton>
    </div>
  </form>
</div>

<style>
  .schedule-form-container {
    padding: 1.5rem; /* p-6 */
  }

  .form-header {
    margin-bottom: 1.5rem; /* mb-6 */
  }

  .form-title {
    font-size: 1.25rem; /* text-xl */
    font-weight: 600; /* font-semibold */
    color: #1a202c; /* text-gray-900 */
    margin-bottom: 0.5rem; /* mb-2 */
  }

  .form-description {
    color: #4a5568; /* text-gray-600 */
  }

  .form-message-container {
    margin-bottom: 1.5rem; /* mb-6 */
  }

  .schedule-form {
    display: flex;
    flex-direction: column;
    gap: 1.5rem; /* space-y-6 */
  }

  .quick-presets-section {
    background-color: #f7fafc; /* bg-gray-50 */
    border-radius: 0.5rem; /* rounded-lg */
    padding: 1rem; /* p-4 */
  }

  .quick-presets-title {
    font-size: 0.875rem; /* text-sm */
    font-weight: 500; /* font-medium */
    color: #1a202c; /* text-gray-900 */
    margin-bottom: 0.75rem; /* mb-3 */
  }

  .quick-presets-buttons {
    display: flex;
    flex-wrap: wrap; /* flex-wrap */
    gap: 0.5rem; /* gap-2 */
  }

  .preset-button {
    padding: 0.25rem 0.75rem; /* px-3 py-1 */
    font-size: 0.75rem; /* text-xs */
    background-color: #ffffff; /* bg-white */
    border: 1px solid #cbd5e0; /* border border-gray-300 */
    border-radius: 0.25rem; /* rounded */
    transition: background-color 0.15s ease-in-out; /* transition-colors */
  }

  .preset-button:hover {
    background-color: #f7fafc; /* hover:bg-gray-50 */
  }

  .daily-hours-section {
    display: flex;
    flex-direction: column;
    gap: 1rem; /* space-y-4 */
  }

  .daily-hours-title {
    font-size: 1.125rem; /* text-lg */
    font-weight: 500; /* font-medium */
    color: #1a202c; /* text-gray-900 */
  }

  .daily-hour-card {
    background-color: #ffffff; /* bg-white */
    border: 1px solid #e2e8f0; /* border border-gray-200 */
    border-radius: 0.5rem; /* rounded-lg */
    padding: 1rem; /* p-4 */
  }

  .daily-hour-header {
    display: flex;
    align-items: center; /* items-center */
    justify-content: space-between; /* justify-between */
    margin-bottom: 1rem; /* mb-4 */
  }

  .daily-hour-label-container {
    display: flex;
    align-items: center; /* items-center */
    gap: 0.75rem; /* space-x-3 */
  }

  .daily-hour-emoji {
    font-size: 1.125rem; /* text-lg */
  }

  .daily-hour-label {
    font-weight: 500; /* font-medium */
    color: #1a202c; /* text-gray-900 */
  }

  .daily-hour-actions {
    display: flex;
    align-items: center; /* items-center */
    gap: 0.5rem; /* space-x-2 */
  }

  .closed-checkbox-label {
    display: inline-flex;
    align-items: center; /* items-center */
  }

  .closed-checkbox {
    border-radius: 0.25rem; /* rounded */
    border: 1px solid #cbd5e0; /* border-gray-300 */
    color: #2b6cb0; /* text-blue-600 */
    box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05); /* shadow-sm */
  }

  .closed-checkbox:focus {
    border-color: #90cdf4; /* focus:border-blue-300 */
    box-shadow: 0 0 0 3px rgba(66, 153, 225, 0.5); /* focus:ring focus:ring-blue-200 focus:ring-opacity-50 */
    outline: none;
  }

  .closed-checkbox-text {
    margin-left: 0.5rem; /* ml-2 */
    font-size: 0.875rem; /* text-sm */
    color: #4a5568; /* text-gray-600 */
  }

  .copy-to-all-button {
    font-size: 0.75rem; /* text-xs */
    color: #2b6cb0; /* text-blue-600 */
    text-decoration: underline; /* underline */
  }

  .copy-to-all-button:hover {
    color: #2c5282; /* hover:text-blue-800 */
  }

  .time-inputs-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr); /* grid-cols-2 */
    gap: 1rem; /* gap-4 */
  }

  .time-input-label {
    display: block;
    font-size: 0.875rem; /* text-sm */
    font-weight: 500; /* font-medium */
    color: #3b434b; /* text-gray-700 */
    margin-bottom: 0.25rem; /* mb-1 */
  }

  .time-input-field {
    display: block;
    width: 100%; /* w-full */
    padding: 0.5rem 0.75rem; /* px-3 py-2 */
    border: 1px solid #cbd5e0; /* border border-gray-300 */
    border-radius: 0.5rem; /* rounded-lg */
    box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05); /* shadow-sm */
    outline: none; /* focus:outline-none */
  }

  .time-input-field:focus {
    border-color: #4299e1; /* focus:border-blue-500 */
    box-shadow: 0 0 0 2px rgba(66, 153, 225, 0.5); /* focus:ring-2 focus:ring-blue-500 */
  }

  .closed-message {
    text-align: center; /* text-center */
    padding-top: 1rem; /* py-4 */
    padding-bottom: 1rem; /* py-4 */
    color: #6b7280; /* text-gray-500 */
    background-color: #f7fafc; /* bg-gray-50 */
    border-radius: 0.25rem; /* rounded */
  }

  .preview-section {
    background-color: #ebf8ff; /* bg-blue-50 */
    border: 1px solid #bee3f8; /* border border-blue-200 */
    border-radius: 0.5rem; /* rounded-lg */
    padding: 1rem; /* p-4 */
  }

  .preview-title {
    font-weight: 500; /* font-medium */
    color: #2a4365; /* text-blue-900 */
    margin-bottom: 0.5rem; /* mb-2 */
  }

  .preview-content {
    font-size: 0.875rem; /* text-sm */
    color: #2c5282; /* text-blue-800 */
    display: flex;
    flex-direction: column;
    gap: 0.25rem; /* space-y-1 */
  }

  .preview-schedule {
    font-style: italic; /* italic */
  }

  .preview-day-item {
    display: flex;
    justify-content: space-between; /* justify-between */
  }

  .preview-day-label {
    font-weight: 500; /* font-medium */
  }

  .form-actions {
    border-top: 1px solid #e2e8f0; /* border-t */
    padding-top: 1.5rem; /* pt-6 */
    display: flex;
    justify-content: flex-end; /* justify-end */
    gap: 0.75rem; /* space-x-3 */
  }

  .button-cancel {
    padding: 0.5rem 1rem; /* px-4 py-2 */
    color: #4a5568; /* text-gray-700 */
    background-color: #ffffff; /* bg-white */
    border: 1px solid #cbd5e0; /* border border-gray-300 */
    border-radius: 0.5rem; /* rounded-lg */
    transition: background-color 0.15s ease-in-out; /* transition-colors */
  }

  .button-cancel:hover {
    background-color: #f7fafc; /* hover:bg-gray-50 */
  }

  .button-cancel:disabled {
    opacity: 0.5; /* disabled:opacity-50 */
    cursor: not-allowed; /* disabled:cursor-not-allowed */
  }

  .button-save {
    padding: 0.5rem 1.5rem; /* px-6 py-2 */
    background-color: #2b6cb0; /* bg-blue-600 */
    color: #ffffff; /* text-white */
    border-radius: 0.5rem; /* rounded-lg */
    transition: background-color 0.15s ease-in-out; /* transition-colors */
  }

  .button-save:hover {
    background-color: #2c5282; /* hover:bg-blue-700 */
  }

  .button-save:disabled {
    opacity: 0.5; /* disabled:opacity-50 */
    cursor: not-allowed; /* disabled:cursor-not-allowed */
  }
</style>