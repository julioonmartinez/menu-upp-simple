<!-- src/components/dashboard/edit-sections/BasicInfoForm.svelte -->
<script>
  import { createEventDispatcher } from 'svelte';
  import { restaurantStore } from '../../../stores/restaurantStore.ts';
  import InputField from '../../ui/InputField.svelte';
  import TextareaField from '../../ui/TextareaField.svelte';
  import LoadingButton from '../../ui/LoadingButton.svelte';
  import ErrorMessage from '../../ui/ErrorMessage.svelte';
  import SuccessMessage from '../../ui/SuccessMessage.svelte';
  import WarningMessage from '../../ui/WarningMessage.svelte';
  import UsernameChangeModal from './UsernameChangeModal.svelte';

  export let restaurant;
  export let restaurantId;

  const dispatch = createEventDispatcher();

  // Form data - hacer reactivo cuando cambie restaurant
  let formData = {
    name: '',
    username: '',
    description: '',
    address: '',
    phone: '',
    email: '',
    website: '',
    coordinates: {
      latitude: '',
      longitude: ''
    }
  };

  // Reactivamente actualizar formData cuando cambie restaurant
  $: if (restaurant) {
    formData = {
      name: restaurant.name || '',
      username: restaurant.username || '',
      description: restaurant.description || '',
      address: restaurant.address || '',
      phone: restaurant.phone || '',
      email: restaurant.email || '',
      website: restaurant.website || '',
      coordinates: {
        latitude: restaurant.coordinates?.latitude || '',
        longitude: restaurant.coordinates?.longitude || ''
      }
    };
  }

  // ESTADOS PARA GUARDADO AUTOMÁTICO Y BOTÓN FLOTANTE
  let isDirty = false;
  let isSaving = false;
  let saveError = null;
  let lastSaved = null;
  let autoSaveTimeout;

  // ESTADOS PARA MODAL DE USERNAME
  let showUsernameModal = false;

  // Detectar cambios en formData para activar guardado automático
  $: if (restaurant && formData) {
    // Compara los valores actuales con los originales, excluyendo username
    const hasChanges = JSON.stringify({
      name: formData.name,
      description: formData.description,
      address: formData.address,
      phone: formData.phone,
      email: formData.email,
      website: formData.website,
      coordinates: formData.coordinates
    }) !== JSON.stringify({
      name: restaurant.name || '',
      description: restaurant.description || '',
      address: restaurant.address || '',
      phone: restaurant.phone || '',
      email: restaurant.email || '',
      website: restaurant.website || '',
      coordinates: {
        latitude: restaurant.coordinates?.latitude || '',
        longitude: restaurant.coordinates?.longitude || ''
      }
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
    // Preparar datos excluyendo username (se maneja en modal separado)
    const updateData = {
      name: formData.name.trim(),
      description: formData.description.trim(),
      address: formData.address.trim(),
      phone: formData.phone.trim(),
      email: formData.email.trim(),
      website: formData.website.trim(),
      coordinates: {
        latitude: formData.coordinates.latitude ? parseFloat(formData.coordinates.latitude) : undefined,
        longitude: formData.coordinates.longitude ? parseFloat(formData.coordinates.longitude) : undefined
      }
    };
    Object.keys(updateData).forEach(key => {
      if (updateData[key] === '' || updateData[key] === null || updateData[key] === undefined) {
        delete updateData[key];
      }
    });
    if (updateData.coordinates && (!updateData.coordinates.latitude || !updateData.coordinates.longitude)) {
      delete updateData.coordinates;
    }
    const result = await restaurantStore.updateRestaurant(restaurantId, updateData);
    if (!result.success) {
      throw new Error(result.error || 'Error actualizando la información');
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

  // Estados
  let isSubmitting = false;
  let error = null;
  let success = null;
  let isClosing = false;

  // Reactive statements
  $: isUpdating = $restaurantStore.isUpdating;
  $: updateError = $restaurantStore.updateError;

  async function handleSubmit(event) {
    event.preventDefault();
    
    console.log('🚀 Iniciando submit...', { formData, restaurantId });
    
    if (isSubmitting) {
      console.log('⚠️ Ya se está enviando, ignorando...');
      return;
    }

    isSubmitting = true;
    error = null;
    success = null;

    try {
      // Preparar datos para el update (excluyendo username)
      const updateData = {
        name: formData.name.trim(),
        description: formData.description.trim(),
        address: formData.address.trim(),
        phone: formData.phone.trim(),
        email: formData.email.trim(),
        website: formData.website.trim(),
        coordinates: {
          latitude: formData.coordinates.latitude ? parseFloat(formData.coordinates.latitude) : undefined,
          longitude: formData.coordinates.longitude ? parseFloat(formData.coordinates.longitude) : undefined
        }
      };

      // Remover campos vacíos
      Object.keys(updateData).forEach(key => {
        if (updateData[key] === '' || updateData[key] === null || updateData[key] === undefined) {
          delete updateData[key];
        }
      });

      // Limpiar coordenadas vacías
      if (updateData.coordinates && (!updateData.coordinates.latitude || !updateData.coordinates.longitude)) {
        delete updateData.coordinates;
      }

      console.log('📤 Enviando datos:', updateData);

      const result = await restaurantStore.updateRestaurant(restaurantId, updateData);

      console.log('📥 Resultado:', result);

      if (result.success) {
        success = 'Información básica actualizada correctamente';
        dispatch('update');
        isClosing = true;
        setTimeout(() => {
          isClosing = false;
          dispatch('close');
        }, 2000);
        
        console.log('✅ Actualización exitosa');
        
      } else {
        error = result.error || 'Error actualizando la información';
        console.error('❌ Error en la actualización:', error);
        isSubmitting = false;
      }
    } catch (err) {
      error = err.message || 'Error desconocido';
      console.error('❌ Error en catch:', err);
    } finally {
      isSubmitting = false;
      console.log('🔚 Submit finalizado');
    }
  }



  // Funciones para manejar el modal de username
  function openUsernameModal() {
    showUsernameModal = true;
  }

  function closeUsernameModal() {
    showUsernameModal = false;
  }

  function handleUsernameUpdate(event) {
    const { newUsername } = event.detail;
    // Actualizar el formData con el nuevo username
    formData.username = newUsername;
    // Cerrar el modal
    closeUsernameModal();
  }

  // Debug: Ver cambios en formData
  $: {
    console.log('FormData actualizado:', formData);
  }

  // Debug: Ver cambios en el store
  $: {
    console.log('Store state:', {
      isUpdating: $restaurantStore.isUpdating,
      updateError: $restaurantStore.updateError,
      currentRestaurant: $restaurantStore.currentRestaurant
    });
  }
</script>

<div class="form-container container">
  <!-- Header -->
  <div class="form-header">
    <h2>Información Básica</h2>
    <p class="subtitle">
      Configura el nombre, contacto y ubicación de tu restaurante
    </p>
  </div>

  <!-- Mensajes -->
  {#if error || updateError}
    <div class="message-container mb-2xl">
      <ErrorMessage message={error || updateError} />
    </div>
  {/if}

  {#if success}
    <div class="message-container mb-2xl">
      <SuccessMessage message={success} />
    </div>
  {/if}

  <form on:submit={handleSubmit} class="form flex flex-col gap-3xl">
    <!-- Información general -->
    <div class="form-section flex flex-col gap-xl">
      <div class="form-grid grid grid-cols-1 md:grid-cols-2 gap-xl">
        <div class="form-field full-width col-span-full">
          <InputField
            label="Nombre del restaurante"
            id="name"
            type="text"
            bind:value={formData.name}
            required
            placeholder="Ej: La Bella Cocina"
            help="El nombre que aparecerá en tu página pública"
          />
        </div>

        <div class="form-field full-width col-span-full">
          <div class="username-field-container">
            <div class="username-display">
              <label class="form-label">Username (URL)</label>
              <div class="username-current">
                <span class="username-text">{formData.username}</span>
                <span class="username-url">menuupp.com/{formData.username}</span>
              </div>
            </div>
            <button
              type="button"
              class="btn btn-secondary btn-sm"
              on:click={openUsernameModal}
            >
              Cambiar Username
            </button>
          </div>
        </div>

        <div class="form-field full-width col-span-full">
          <TextareaField
            label="Descripción"
            id="description"
            bind:value={formData.description}
            placeholder="Describe tu restaurante..."
            rows={3}
            help="Una breve descripción que aparecerá en tu página"
          />
        </div>
      </div>
    </div>

    <!-- Información de contacto -->
    <div class="form-section flex flex-col gap-xl border-t pt-2xl">
      <h3 class="section-title text-lg font-semibold text-primary m-0 mb-lg">Información de Contacto</h3>
      
      <div class="form-grid grid grid-cols-1 md:grid-cols-2 gap-xl">
        <div class="form-field full-width col-span-full">
          <InputField
            label="Dirección"
            id="address"
            type="text"
            bind:value={formData.address}
            placeholder="Calle Principal 123, Ciudad"
          />
        </div>

        <div class="form-field">
          <InputField
            label="Teléfono"
            id="phone"
            type="tel"
            bind:value={formData.phone}
            placeholder="+52 123 456 7890"
          />
        </div>

        <div class="form-field">
          <InputField
            label="Email"
            id="email"
            type="email"
            bind:value={formData.email}
            placeholder="contacto@mirestaurante.com"
          />
        </div>

        <div class="form-field full-width col-span-full">
          <InputField
            label="Sitio web"
            id="website"
            type="url"
            bind:value={formData.website}
            placeholder="https://www.mirestaurante.com"
          />
        </div>
      </div>
    </div>

    <!-- Coordenadas -->
    <div class="form-section flex flex-col gap-xl border-t pt-2xl">
      <h3 class="section-title text-lg font-semibold text-primary m-0 mb-lg">Coordenadas (Opcional)</h3>
      
      <div class="form-grid grid grid-cols-1 md:grid-cols-2 gap-xl">
        <div class="form-field">
          <InputField
            label="Latitud"
            id="latitude"
            type="number"
            step="any"
            bind:value={formData.coordinates.latitude}
            placeholder="19.4326"
            help="Ej: 19.4326"
          />
        </div>

        <div class="form-field">
          <InputField
            label="Longitud"
            id="longitude"
            type="number"
            step="any"
            bind:value={formData.coordinates.longitude}
            placeholder="-99.1332"
            help="Ej: -99.1332"
          />
        </div>
      </div>
      
      <p class="help-text text-sm text-muted mt-sm">
        Las coordenadas ayudan a mostrar tu ubicación exacta en mapas
      </p>
    </div>

    <!-- Botones -->
    <div class="form-actions border-t pt-xl flex justify-end gap-md flex-wrap">
      <button
        type="button"
        on:click={() => dispatch('close')}
        class="btn btn-secondary"
        disabled={isSubmitting || isUpdating || isClosing}
      >
        Cancelar
      </button>
      
      <LoadingButton
        type="submit"
        loading={isSubmitting || isUpdating || isClosing}
        disabled={!formData.name || !formData.username || isClosing}
        class="btn btn-primary"
      >
        Guardar Cambios
      </LoadingButton>
    </div>
  </form>
</div>

<!-- BOTÓN FLOTANTE DE GUARDAR -->
<div class="floating-save-btn">
  <button
    class="btn btn-primary floating"
    on:click={handleManualSave}
    disabled={!isDirty || isSaving || !formData.name || !formData.username}
    aria-label="Guardar cambios"
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

<!-- MODAL DE CAMBIO DE USERNAME -->
<UsernameChangeModal
  isOpen={showUsernameModal}
  currentUsername={formData.username}
  {restaurantId}
  on:close={closeUsernameModal}
  on:update={handleUsernameUpdate}
/>

<style>
  .form-container { width: 100%; }
  .form-grid { width: 100%; }
  .form-field.full-width, .col-span-full { grid-column: 1 / -1; }

  .form-header h2 {
    color: var(--primary-color);
    font-size: var(--font-3xl);
    font-weight: var(--weight-bold);
    margin: 0 0 var(--spacing-md) 0;
  }

  .form-header .subtitle {
    color: var(--text-muted);
    font-size: var(--font-base);
    margin: 0;
  }

  @media (max-width: 640px) {
    .form-actions { flex-direction: column; }
    .btn { width: 100%; }
  }

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

  /* Estilos para el campo de username */
  .username-field-container {
    display: flex;
    align-items: flex-end;
    gap: var(--spacing-lg);
  }

  .username-display {
    flex: 1;
  }

  .form-label {
    display: block;
    font-size: var(--font-sm);
    font-weight: var(--weight-medium);
    color: var(--text-muted);
    margin-bottom: var(--spacing-xs);
  }

  .username-current {
    padding: var(--spacing-md) var(--spacing-lg);
    background: var(--bg-tertiary);
    border: 1px solid var(--bg-accent);
    border-radius: var(--radius-lg);
    display: flex;
    flex-direction: column;
    gap: var(--spacing-xs);
  }

  .username-text {
    font-size: var(--font-lg);
    font-weight: var(--weight-semibold);
    color: var(--text-primary);
  }

  .username-url {
    font-size: var(--font-sm);
    color: var(--text-muted);
    font-family: monospace;
  }

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

    .username-field-container {
      flex-direction: column;
      align-items: stretch;
      gap: var(--spacing-md);
    }

    .username-display {
      order: 1;
    }

    .username-field-container .btn {
      order: 2;
      width: 100%;
    }
  }
</style>