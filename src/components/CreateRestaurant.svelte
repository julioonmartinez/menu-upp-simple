<!-- src/components/CreateRestaurant.svelte -->
<script>
  import { createEventDispatcher, onMount } from 'svelte';
  import { restaurantStore, useRestaurants } from '../stores/restaurantStore.ts';
  import { restaurantService } from '../services/restaurantService.ts';
  
  const dispatch = createEventDispatcher();
  
  // Estado del formulario
  let formData = {
    name: '',
    username: '',
    description: ''
  };
  
  // Estados de validación
  let errors = {
    name: '',
    username: '',
    description: ''
  };
  
  let isFormValid = false;
  let usernameCheckTimeout;
  let usernameChecked = false;
  let usernameAvailable = false;
  
  // Obtener métodos y stores reactivos del store
  const {
    checkUsernameAvailability,
    createRestaurant,
    clearAllErrors,
    // Stores reactivos para usar con $
    isLoadingStore,
    errorStore
  } = useRestaurants();

  // Usar los stores reactivos individuales directamente
  const isCreating = restaurantStore.isCreating;
  const createError = restaurantStore.createError;
  const isCheckingUsername = restaurantStore.isCheckingUsername;
  const usernameError = restaurantStore.usernameError;
  
  // Stores reactivos - ahora usando los stores correctos
  $: creating = $isCreating;
  $: error = $createError;
  $: checkingUsername = $isCheckingUsername;
  $: usernameErr = $usernameError;
  
  onMount(() => {
    // Limpiar errores al montar
    clearAllErrors();
  });
  
  // Validaciones en tiempo real
  $: validateForm();
  
  function validateForm() {
    errors = {
      name: '',
      username: '',
      description: ''
    };
    
    // Validar nombre
    if (!formData.name.trim()) {
      errors.name = 'El nombre es requerido';
    } else if (formData.name.trim().length < 2) {
      errors.name = 'El nombre debe tener al menos 2 caracteres';
    } else if (formData.name.trim().length > 100) {
      errors.name = 'El nombre no puede exceder 100 caracteres';
    }
    
    // Validar username (opcional pero con formato)
    if (formData.username && formData.username.trim()) {
      if (!restaurantService.utils.isValidUsername(formData.username.trim())) {
        errors.username = 'Username inválido. Solo letras, números y guiones bajos (3-50 caracteres)';
        usernameChecked = false;
        usernameAvailable = false;
      } else if (!usernameChecked) {
        errors.username = 'Verificando disponibilidad...';
      } else if (!usernameAvailable) {
        errors.username = 'Este username no está disponible';
      }
    } else {
      usernameChecked = false;
      usernameAvailable = false;
    }
    
    // Validar descripción (opcional)
    if (formData.description && formData.description.length > 500) {
      errors.description = 'La descripción no puede exceder 500 caracteres';
    }
    
    // El formulario es válido si no hay errores y el nombre está presente
    isFormValid = !errors.name && 
                  !errors.description && 
                  (!formData.username || (!errors.username && usernameAvailable)) &&
                  formData.name.trim().length > 0;
  }
  
  // Verificar username con debounce
  $: if (formData.username && formData.username.trim() && restaurantService.utils.isValidUsername(formData.username.trim())) {
    debouncedCheckUsername(formData.username.trim());
  }
  
  function debouncedCheckUsername(username) {
    clearTimeout(usernameCheckTimeout);
    usernameChecked = false;
    usernameAvailable = false;
    
    usernameCheckTimeout = setTimeout(async () => {
      const result = await checkUsernameAvailability(username);
      if (result.success) {
        usernameChecked = true;
        usernameAvailable = result.available || false;
      }
      validateForm();
    }, 800);
  }
  
  // Generar username sugerido
  function generateUsername() {
    if (formData.name.trim()) {
      const suggested = restaurantService.utils.generateSuggestedUsername(formData.name.trim());
      formData.username = suggested;
    }
  }
  
  // Enviar formulario
  async function handleSubmit() {
    if (!isFormValid || creating) return;
    
    const restaurantData = {
      name: formData.name.trim(),
      description: formData.description.trim() || undefined,
      username: formData.username.trim() || undefined
    };
    
    const result = await createRestaurant(restaurantData);
    
    if (result.success) {
      // Limpiar formulario
      formData = {
        name: '',
        username: '',
        description: ''
      };
      
      usernameChecked = false;
      usernameAvailable = false;
      
      // Emitir evento de éxito
      dispatch('created', {
        restaurant: result.restaurant
      });
      
      // Mostrar mensaje de éxito
      alert(`¡Restaurante "${result.restaurant.name}" creado exitosamente!`);
    }
  }
  
  // Limpiar formulario
  function clearForm() {
    formData = {
      name: '',
      username: '',
      description: ''
    };
    usernameChecked = false;
    usernameAvailable = false;
    clearAllErrors();
  }
</script>

<!-- Formulario de creación de restaurante -->
<div class="create-restaurant-form">
  <div class="form-header">
    <h2>Crear Nuevo Restaurante</h2>
    <p class="form-description">
      Completa la información básica para crear tu restaurante. 
      Podrás agregar más detalles después.
    </p>
  </div>

  <form on:submit|preventDefault={handleSubmit} class="restaurant-form">
    <!-- Campo Nombre -->
    <div class="form-group">
      <label for="name" class="form-label required">
        Nombre del Restaurante
      </label>
      <input
        type="text"
        id="name"
        bind:value={formData.name}
        placeholder="Ej: Taquería El Rincón"
        class="form-input"
        class:error={errors.name}
        maxlength="100"
        required
      />
      {#if errors.name}
        <span class="error-message">{errors.name}</span>
      {/if}
      <span class="input-hint">
        Será el nombre público de tu restaurante
      </span>
    </div>

    <!-- Campo Username -->
    <div class="form-group">
      <label for="username" class="form-label">
        Username (opcional)
        <button
          type="button"
          class="generate-btn"
          on:click={generateUsername}
          disabled={!formData.name.trim()}
        >
          Generar
        </button>
      </label>
      <input
        type="text"
        id="username"
        bind:value={formData.username}
        placeholder="ej: taqueria_rincon"
        class="form-input"
        class:error={errors.username}
        class:success={usernameChecked && usernameAvailable}
        maxlength="50"
      />
      {#if checkingUsername}
        <span class="checking-message">Verificando disponibilidad...</span>
      {:else if errors.username}
        <span class="error-message">{errors.username}</span>
      {:else if usernameChecked && usernameAvailable}
        <span class="success-message">✓ Username disponible</span>
      {/if}
      <span class="input-hint">
        URL personalizada: tudominio.com/restaurant/{formData.username || 'username'}
      </span>
    </div>

    <!-- Campo Descripción -->
    <div class="form-group">
      <label for="description" class="form-label">
        Descripción (opcional)
      </label>
      <textarea
        id="description"
        bind:value={formData.description}
        placeholder="Describe tu restaurante, tipo de cocina, especialidades..."
        class="form-textarea"
        class:error={errors.description}
        rows="4"
        maxlength="500"
      ></textarea>
      {#if errors.description}
        <span class="error-message">{errors.description}</span>
      {/if}
      <span class="input-hint">
        {500 - formData.description.length} caracteres restantes
      </span>
    </div>

    <!-- Error general -->
    {#if error}
      <div class="error-alert">
        <strong>Error:</strong> {error}
      </div>
    {/if}

    <!-- Botones -->
    <div class="form-actions">
      <button
        type="button"
        class="btn btn-secondary"
        on:click={clearForm}
        disabled={creating}
      >
        Limpiar
      </button>
      <button
        type="submit"
        class="btn btn-primary"
        disabled={!isFormValid || creating}
      >
        {#if creating}
          <span class="spinner"></span>
          Creando...
        {:else}
          Crear Restaurante
        {/if}
      </button>
    </div>
  </form>

  <!-- Información adicional -->
  <div class="form-footer">
    <div class="info-box">
      <h4>¿Qué puedes hacer después?</h4>
      <ul>
        <li>Agregar fotos y logo</li>
        <li>Configurar horarios y contacto</li>
        <li>Personalizar colores y diseño</li>
        <li>Crear tu menú digital</li>
        <li>Generar código QR</li>
      </ul>
    </div>
  </div>
</div>

<style>
  .create-restaurant-form {
    max-width: 600px;
    margin: 0 auto;
    padding: 2rem;
    background: white;
    border-radius: 12px;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  }

  .form-header {
    text-align: center;
    margin-bottom: 2rem;
  }

  .form-header h2 {
    color: #1f2937;
    margin-bottom: 0.5rem;
    font-size: 1.75rem;
    font-weight: 600;
  }

  .form-description {
    color: #6b7280;
    font-size: 0.95rem;
    line-height: 1.5;
  }

  .restaurant-form {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
  }

  .form-group {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .form-label {
    font-weight: 600;
    color: #374151;
    font-size: 0.95rem;
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .form-label.required::after {
    content: '*';
    color: #ef4444;
    font-weight: bold;
  }

  .generate-btn {
    background: #f3f4f6;
    border: 1px solid #d1d5db;
    border-radius: 4px;
    padding: 0.25rem 0.5rem;
    font-size: 0.75rem;
    color: #6b7280;
    cursor: pointer;
    transition: all 0.2s;
  }

  .generate-btn:hover:not(:disabled) {
    background: #e5e7eb;
    color: #374151;
  }

  .generate-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .form-input,
  .form-textarea {
    padding: 0.75rem;
    border: 2px solid #e5e7eb;
    border-radius: 8px;
    font-size: 1rem;
    transition: all 0.2s;
    background: white;
  }

  .form-input:focus,
  .form-textarea:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }

  .form-input.error,
  .form-textarea.error {
    border-color: #ef4444;
  }

  .form-input.success {
    border-color: #10b981;
  }

  .form-textarea {
    resize: vertical;
    min-height: 100px;
    font-family: inherit;
  }

  .input-hint {
    font-size: 0.8rem;
    color: #6b7280;
    font-style: italic;
  }

  .error-message {
    color: #ef4444;
    font-size: 0.85rem;
    font-weight: 500;
  }

  .success-message {
    color: #10b981;
    font-size: 0.85rem;
    font-weight: 500;
  }

  .checking-message {
    color: #f59e0b;
    font-size: 0.85rem;
    font-weight: 500;
  }

  .error-alert {
    background: #fef2f2;
    border: 1px solid #fecaca;
    border-radius: 8px;
    padding: 1rem;
    color: #dc2626;
    font-size: 0.9rem;
  }

  .form-actions {
    display: flex;
    gap: 1rem;
    justify-content: flex-end;
    margin-top: 1rem;
  }

  .btn {
    padding: 0.75rem 1.5rem;
    border: none;
    border-radius: 8px;
    font-size: 1rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    min-width: 120px;
    justify-content: center;
  }

  .btn:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .btn-secondary {
    background: #f9fafb;
    color: #374151;
    border: 2px solid #e5e7eb;
  }

  .btn-secondary:hover:not(:disabled) {
    background: #f3f4f6;
  }

  .btn-primary {
    background: #3b82f6;
    color: white;
  }

  .btn-primary:hover:not(:disabled) {
    background: #2563eb;
  }

  .spinner {
    width: 16px;
    height: 16px;
    border: 2px solid transparent;
    border-top: 2px solid currentColor;
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }

  .form-footer {
    margin-top: 2rem;
    padding-top: 2rem;
    border-top: 1px solid #e5e7eb;
  }

  .info-box {
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    padding: 1.5rem;
  }

  .info-box h4 {
    color: #1e293b;
    margin-bottom: 1rem;
    font-size: 1.1rem;
  }

  .info-box ul {
    list-style: none;
    padding: 0;
    margin: 0;
  }

  .info-box li {
    padding: 0.25rem 0;
    color: #475569;
    position: relative;
    padding-left: 1.25rem;
  }

  .info-box li::before {
    content: '✓';
    position: absolute;
    left: 0;
    color: #10b981;
    font-weight: bold;
  }

  @media (max-width: 640px) {
    .create-restaurant-form {
      padding: 1rem;
      margin: 1rem;
    }

    .form-actions {
      flex-direction: column;
    }

    .btn {
      width: 100%;
    }
  }
</style>