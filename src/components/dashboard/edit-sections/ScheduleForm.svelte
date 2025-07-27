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
  let error = null;
  let success = null;

  // ESTADOS PARA GUARDADO AUTOMÁTICO Y BOTÓN FLOTANTE
  let isDirty = false;
  let isSaving = false;
  let saveError = null;
  let lastSaved = null;
  let autoSaveTimeout;

  // Detectar cambios en formData para activar guardado automático
  $: if (restaurant && formData) {
    // Compara los valores actuales con los originales
    const hasChanges = JSON.stringify(formData) !== JSON.stringify({
      schedule: restaurant.schedule || '',
      businessHours: restaurant.businessHours || {}
    });
    isDirty = hasChanges;
    if (hasChanges) {
      debounceAutoSave();
    }
  }

  function debounceAutoSave() {
    clearTimeout(autoSaveTimeout);
    autoSaveTimeout = setTimeout(() => {
      autoSave();
    }, 1500); // 1.5 segundos de espera
  }

  async function autoSave() {
    if (!isDirty || isSaving) return;
    isSaving = true;
    saveError = null;
    try {
      await saveFormData();
      lastSaved = new Date();
      isDirty = false;
    } catch (err) {
      saveError = err.message || 'Error al guardar automáticamente';
    } finally {
      isSaving = false;
    }
  }

  async function saveFormData() {
    // Preparar datos para el update
    const updateData = {
      schedule: formData.schedule.trim(),
      businessHours: { ...formData.businessHours }
    };

    const result = await restaurantStore.updateRestaurant(restaurantId, updateData);
    if (!result.success) {
      throw new Error(result.error || 'Error actualizando los horarios');
    }
  }

  // Guardar manualmente desde el botón flotante
  async function handleManualSave() {
    isSaving = true;
    saveError = null;
    try {
      await saveFormData();
      lastSaved = new Date();
      isDirty = false;
      success = 'Horarios actualizados correctamente';
      dispatch('update');
      // Limpiar mensaje de éxito después de 3 segundos
      setTimeout(() => {
        success = null;
      }, 3000);
    } catch (err) {
      saveError = err.message || 'Error al guardar';
    } finally {
      isSaving = false;
    }
  }

  // Prevenir salida si hay cambios sin guardar
  function handleBeforeUnload(event) {
    if (isDirty) {
      event.preventDefault();
      event.returnValue = '';
      return '';
    }
  }

  if (typeof window !== 'undefined') {
    window.addEventListener('beforeunload', handleBeforeUnload);
  }

  // Reactive statements
  $: updateError = $restaurantStore.updateError;



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
      description: 'Lunes a Viernes de 9:00 a 18:00. Domingo cerrado.'
    },
    'restaurant': {
      description: 'Todos los días de 12:00 a 22:00.'
    },
    'cafe': {
      description: 'Todos los días de 7:00 a 19:00.'
    },
    '24h': {
      description: 'Abierto las 24 horas, todos los días.'
    }
  };

  const selectedPreset = presets[preset];
  if (!selectedPreset) return;

  formData.schedule = selectedPreset.description;
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

  <form class="flex flex-col gap-2xl">
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

    <!-- Elimino la sección de horarios por día -->

    <!-- Elimino la vista previa de horarios por día, dejo solo la descripción si existe -->
    <div class="card-compact bg-info-bg border border-info">
      <h4 class="font-medium text-info mb-sm">
        <i class="fas fa-eye mr-sm"></i>
        Vista previa:
      </h4>
      <div class="text-sm text-info flex flex-col gap-xs">
        {#if formData.schedule.trim()}
          <p class="italic">"{formData.schedule}"</p>
        {/if}
      </div>
    </div>

  </form>
</div>

<!-- BOTÓN FLOTANTE DE GUARDAR -->
<div class="floating-save-btn">
  <button
    class="btn btn-primary floating"
    on:click={handleManualSave}
    disabled={!isDirty || isSaving}
    aria-label="Guardar horarios"
    type="button"
  >
    {#if isSaving}
      Guardando...
    {:else if saveError}
      Reintentar
    {:else if !isDirty && lastSaved}
      Guardado ✓
    {:else}
      Guardar
    {/if}
  </button>
  {#if saveError}
    <div class="save-status error">{saveError}</div>
  {:else if isSaving}
    <div class="save-status saving">Guardando...</div>
  {:else if !isDirty && lastSaved}
    <div class="save-status success">Guardado</div>
  {/if}
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

  /* Estilos para el botón flotante */
  .floating-save-btn {
    position: fixed;
    bottom: 2rem;
    right: 2rem;
    z-index: 1000;
    display: flex;
    flex-direction: column;
    align-items: flex-end;
  }
  .floating-save-btn .floating {
    min-width: 120px;
    font-size: 1rem;
    box-shadow: 0 4px 16px rgba(0,0,0,0.12);
    border-radius: 2rem;
    padding: 0.75rem 2rem;
  }
  .save-status {
    margin-top: 0.5rem;
    font-size: 0.95rem;
    padding: 0.25rem 0.75rem;
    border-radius: 1rem;
    background: #fff;
    box-shadow: 0 2px 8px rgba(0,0,0,0.08);
  }
  .save-status.saving { color: #888; }
  .save-status.success { color: #1a7f37; }
  .save-status.error { color: #b91c1c; }
  @media (max-width: 640px) {
    .floating-save-btn {
      right: 1rem;
      bottom: 1rem;
    }
    .floating-save-btn .floating {
      width: 100%;
      min-width: 0;
      padding: 0.75rem 1.5rem;
    }
  }
</style> 