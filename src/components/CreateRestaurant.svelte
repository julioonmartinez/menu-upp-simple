<!-- src/components/CreateRestaurant.svelte -->
<script>
  import { createEventDispatcher, onMount } from 'svelte';
  import { restaurantStore, useRestaurants } from '../stores/restaurantStore.ts';
  import { restaurantService } from '../services/restaurantService.ts';
  import { toastStore } from '../stores/toastStore.ts';
  
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

  // Generar y subir QR automáticamente
  try {
    const qrUrl = `https://www.menuupp.com/${result.restaurant.username}`;
    const QRCode = await import('qrcode');
    const qrDataUrl = await QRCode.toDataURL(qrUrl, {
      width: 300,
      margin: 2,
      color: { dark: '#000000', light: '#FFFFFF' },
      errorCorrectionLevel: 'M'
    });
    const filename = `qr-${result.restaurant.username}.png`;
    const qrFile = dataURLtoFile(qrDataUrl, filename);
    await restaurantStore.uploadRestaurantImage(result.restaurant.id, qrFile, 'qrCode');
  } catch (err) {
    console.error('Error generando o subiendo el QR:', err);
  }

  // Mostrar mensaje de éxito usando toast
  toastStore.success(`¡Restaurante "${result.restaurant.name}" creado exitosamente!`);

  // Redirigir al onboarding (Astro + Svelte)
  window.location.href = `/dashboard/restaurant/${result.restaurant.id}/onboarding`;
} else {
  if (error) {
    toastStore.error(`Error al crear el restaurante: ${error}`);
  }
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

  // Agrega la función para convertir dataURL a File
  function dataURLtoFile(dataUrl, filename) {
    const arr = dataUrl.split(',');
    const mime = arr[0].match(/:(.*?);/)[1];
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    return new File([u8arr], filename, { type: mime });
  }
</script>

<!-- Formulario de creación de restaurante -->
<div class="w-full max-w-full">
  <div class="text-center mb-2xl">
    <p class="text-muted text-base leading-normal m-0">
      Completa la información básica para crear tu restaurante. 
      Podrás agregar más detalles después.
    </p>
  </div>

  <form on:submit|preventDefault={handleSubmit} class="flex flex-col gap-2xl">
    <!-- Campo Nombre -->
    <div class="flex flex-col gap-md">
      <label for="name" class="font-semibold text-secondary text-base flex items-center gap-md required">
        Nombre del Restaurante
      </label>
      <input
        type="text"
        id="name"
        bind:value={formData.name}
        placeholder="Ej: Taquería El Rincón"
        class="input {errors.name ? 'error' : ''}"
        maxlength="100"
        required
      />
      {#if errors.name}
        <span class="text-error text-sm font-medium">{errors.name}</span>
      {/if}
      <span class="text-light text-xs italic">
        Será el nombre público de tu restaurante
      </span>
    </div>

    <!-- Campo Username -->
    <div class="flex flex-col gap-md">
      <label for="username" class="font-semibold text-secondary text-base flex items-center gap-md">
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
        class="input {errors.username ? 'error' : ''} {usernameChecked && usernameAvailable ? 'success' : ''}"
        maxlength="50"
      />
      {#if checkingUsername}
        <span class="text-warning text-sm font-medium">Verificando disponibilidad...</span>
      {:else if errors.username}
        <span class="text-error text-sm font-medium">{errors.username}</span>
      {:else if usernameChecked && usernameAvailable}
        <span class="text-success text-sm font-medium">✓ Username disponible</span>
      {/if}
      <span class="text-light text-xs italic">
        URL personalizada: tudominio.com/restaurant/{formData.username || 'username'}
      </span>
    </div>

    <!-- Campo Descripción -->
    <div class="flex flex-col gap-md">
      <label for="description" class="font-semibold text-secondary text-base">
        Descripción (opcional)
      </label>
      <textarea
        id="description"
        bind:value={formData.description}
        placeholder="Describe tu restaurante, tipo de cocina, especialidades..."
        class="form-textarea {errors.description ? 'error' : ''}"
        rows="4"
        maxlength="500"
      ></textarea>
      {#if errors.description}
        <span class="text-error text-sm font-medium">{errors.description}</span>
      {/if}
      <span class="text-light text-xs italic">
        {500 - formData.description.length} caracteres restantes
      </span>
    </div>

    <!-- Error general -->
    {#if error}
      <div class="bg-error-bg border border-error-light rounded-lg p-lg text-error text-base">
        <strong>Error:</strong> {error}
      </div>
    {/if}

    <!-- Botones -->
    <div class="flex gap-lg justify-end mt-lg">
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
          <span class="animate-spin w-4 h-4 border-2 border-transparent border-t-current rounded-full"></span>
          Creando...
        {:else}
          Crear Restaurante
        {/if}
      </button>
    </div>
  </form>

  <!-- Información adicional -->
  <div class="mt-2xl pt-2xl border-t border-accent">
    <div class="bg-gray-light border border-accent rounded-lg p-2xl">
      <h4 class="text-primary font-semibold mb-lg text-xl">¿Qué puedes hacer después?</h4>
      <ul class="list-none p-0 m-0">
        <li class="py-xs text-secondary relative pl-5 before:content-['✓'] before:absolute before:left-0 before:text-success before:font-bold">Agregar fotos y logo</li>
        <li class="py-xs text-secondary relative pl-5 before:content-['✓'] before:absolute before:left-0 before:text-success before:font-bold">Configurar horarios y contacto</li>
        <li class="py-xs text-secondary relative pl-5 before:content-['✓'] before:absolute before:left-0 before:text-success before:font-bold">Personalizar colores y diseño</li>
        <li class="py-xs text-secondary relative pl-5 before:content-['✓'] before:absolute before:left-0 before:text-success before:font-bold">Crear tu menú digital</li>
        <li class="py-xs text-secondary relative pl-5 before:content-['✓'] before:absolute before:left-0 before:text-success before:font-bold">Generar código QR</li>
      </ul>
    </div>
  </div>
</div>

<style>
  /* Estilos específicos que no pueden ser manejados por las clases globales */
  
  .required::after {
    content: '*';
    color: var(--error);
    font-weight: bold;
  }

  .generate-btn {
    background: var(--bg-tertiary);
    border: 1px solid var(--bg-accent);
    border-radius: var(--radius-sm);
    padding: var(--spacing-xs) var(--spacing-md);
    font-size: var(--font-xs);
    color: var(--text-muted);
    cursor: pointer;
    transition: all var(--transition-fast);
  }

  .generate-btn:hover:not(:disabled) {
    background: var(--bg-accent);
    color: var(--text-secondary);
  }

  .generate-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .form-textarea {
    width: 100%;
    padding: var(--spacing-md) var(--spacing-lg);
    border: 2px solid var(--bg-accent);
    border-radius: var(--radius-lg);
    font-size: var(--font-base);
    transition: all var(--transition-normal);
    background: var(--bg-primary);
    color: var(--text-primary);
    resize: vertical;
    min-height: 100px;
    font-family: inherit;
  }

  .form-textarea:focus {
    outline: none;
    border-color: var(--primary-color);
    box-shadow: 0 0 0 3px rgba(255, 107, 53, 0.1);
  }

  .form-textarea.error {
    border-color: var(--error);
  }

  .input.error {
    border-color: var(--error);
  }

  .input.success {
    border-color: var(--success);
  }

  /* Responsive para móvil */
  @media (max-width: 640px) {
    .flex.gap-lg.justify-end {
      flex-direction: column;
    }

    .btn {
      width: 100%;
    }
  }

  /* Dark mode support */
  @media (prefers-color-scheme: dark) {
    .generate-btn {
      background: var(--bg-accent);
      border-color: var(--bg-tertiary);
      color: var(--text-light);
    }

    .generate-btn:hover:not(:disabled) {
      background: var(--bg-tertiary);
      color: var(--text-primary);
    }

    .form-textarea {
      background: var(--bg-tertiary);
      border-color: var(--bg-accent);
      color: var(--text-primary);
    }

    .form-textarea:focus {
      background: var(--bg-primary);
    }
  }

  /* Reduced motion */
  @media (prefers-reduced-motion: reduce) {
    .generate-btn,
    .form-textarea {
      transition: none;
    }
  }
</style>