<!-- src/components/dashboard/edit-sections/BasicInfoForm.svelte -->
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

  // Estados
  let isSubmitting = false;
  let error = null;
  let success = null;
  let isCheckingUsername = false;
  let usernameError = null;
  let usernameSuccess = null;

  // Reactive statements
  $: isUpdating = $restaurantStore.isUpdating;
  $: updateError = $restaurantStore.updateError;

  let usernameCheckTimeout;

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
      // Preparar datos para el update
      const updateData = {
        name: formData.name.trim(),
        username: formData.username.trim(),
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
        
        console.log('✅ Actualización exitosa');
        
        // Cerrar modal después de 2 segundos
        setTimeout(() => {
          dispatch('close');
        }, 2000);
      } else {
        error = result.error || 'Error actualizando la información';
        console.error('❌ Error en la actualización:', error);
      }
    } catch (err) {
      error = err.message || 'Error desconocido';
      console.error('❌ Error en catch:', err);
    } finally {
      isSubmitting = false;
      console.log('🔚 Submit finalizado');
    }
  }

  async function checkUsernameAvailability() {
    if (!formData.username || formData.username === restaurant?.username) {
      usernameError = null;
      usernameSuccess = null;
      return;
    }

    isCheckingUsername = true;
    usernameError = null;
    usernameSuccess = null;

    try {
      const result = await restaurantStore.checkUsernameAvailability(formData.username);
      
      if (result.success) {
        if (result.available) {
          usernameSuccess = 'Username disponible';
        } else {
          usernameError = 'Username no disponible';
        }
      } else {
        usernameError = result.error || 'Error verificando username';
      }
    } catch (err) {
      usernameError = err.message || 'Error verificando username';
    } finally {
      isCheckingUsername = false;
    }
  }

  function onUsernameChange() {
    // Debounce para no hacer muchas peticiones
    clearTimeout(usernameCheckTimeout);
    usernameError = null;
    usernameSuccess = null;
    
    if (formData.username && formData.username !== restaurant?.username) {
      usernameCheckTimeout = setTimeout(checkUsernameAvailability, 500);
    }
  }

  function formatUsername(value) {
    // Convertir a lowercase y remover caracteres especiales
    return value.toLowerCase()
      .replace(/[^a-z0-9_-]/g, '')
      .replace(/^[-_]+|[-_]+$/g, ''); // Remover guiones/underscores al inicio/final
  }

  function handleUsernameInput(event) {
    const formatted = formatUsername(event.target.value);
    formData.username = formatted;
    // Forzar actualización del input
    event.target.value = formatted;
    onUsernameChange();
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
          <InputField
            label="Username (URL)"
            id="username"
            type="text"
            bind:value={formData.username}
            on:input={handleUsernameInput}
            required
            placeholder="ej: mi-restaurante"
            help={`Tu URL será: tudominio.com/restaurant/${formData.username || 'username'}`}
            loading={isCheckingUsername}
            error={usernameError}
            success={usernameSuccess}
          />
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
        disabled={isSubmitting || isUpdating}
      >
        Cancelar
      </button>
      
      <LoadingButton
        type="submit"
        loading={isSubmitting || isUpdating}
        disabled={!formData.name || !formData.username || !!usernameError}
        class="btn btn-primary"
      >
        Guardar Cambios
      </LoadingButton>
    </div>
  </form>
</div>

<style>
  .form-container { width: 100%; }
  .form-grid { width: 100%; }
  .form-field.full-width, .col-span-full { grid-column: 1 / -1; }

  @media (max-width: 640px) {
    .form-actions { flex-direction: column; }
    .btn { width: 100%; }
  }
</style>