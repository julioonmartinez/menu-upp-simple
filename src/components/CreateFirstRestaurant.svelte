<!-- src/components/CreateFirstRestaurant.svelte -->
<script>
  import { createEventDispatcher, onMount } from 'svelte';
  import { restaurantStore, useRestaurants } from '../stores/restaurantStore.ts';
  import { restaurantService } from '../services/restaurantService.ts';
  import { toastStore } from '../stores/toastStore.ts';
  import { onDestroy } from 'svelte';
  let isLoading = false;
  let isSuccess = false;
  let confettiTimeout;
  let redirectTimeout;
  let errorMsg = '';

  // Limpieza de timeouts
  onDestroy(() => {
    clearTimeout(confettiTimeout);
    clearTimeout(redirectTimeout);
  });

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
    isLoadingStore,
    errorStore
  } = useRestaurants();

  const isCreating = restaurantStore.isCreating;
  const createError = restaurantStore.createError;
  const isCheckingUsername = restaurantStore.isCheckingUsername;
  const usernameError = restaurantStore.usernameError;

  $: creating = $isCreating;
  $: error = $createError;
  $: checkingUsername = $isCheckingUsername;
  $: usernameErr = $usernameError;

  onMount(() => {
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
    if (!formData.name.trim()) {
      errors.name = 'El nombre es requerido';
    } else if (formData.name.trim().length < 2) {
      errors.name = 'El nombre debe tener al menos 2 caracteres';
    } else if (formData.name.trim().length > 100) {
      errors.name = 'El nombre no puede exceder 100 caracteres';
    }
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
    if (formData.description && formData.description.length > 500) {
      errors.description = 'La descripción no puede exceder 500 caracteres';
    }
    isFormValid = !errors.name && 
                  !errors.description && 
                  (!formData.username || (!errors.username && usernameAvailable)) &&
                  formData.name.trim().length > 0;
  }

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

  function generateUsername() {
    if (formData.name.trim()) {
      const suggested = restaurantService.utils.generateSuggestedUsername(formData.name.trim());
      formData.username = suggested;
    }
  }

  async function handleSubmit() {
    if (!isFormValid || creating || isLoading) return;
    isLoading = true;
    errorMsg = '';
    // Fade out del formulario y mostrar loader
    const restaurantData = {
      name: formData.name.trim(),
      description: formData.description.trim() || undefined,
      username: formData.username.trim() || undefined
    };
    const result = await createRestaurant(restaurantData);
    if (result.success) {
      isLoading = false;
      isSuccess = true;
      formData = { name: '', username: '', description: '' };
      usernameChecked = false;
      usernameAvailable = false;
      // Redirigir tras éxito
      redirectTimeout = setTimeout(() => {
        window.location.href = `/dashboard/restaurant/${result.restaurant.id}/onboarding?first=1`;
      }, 1800);
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
        // No bloquea el éxito
        console.error('Error generando o subiendo el QR:', err);
      }
      toastStore.success(`¡Restaurante "${result.restaurant.name}" creado exitosamente!`);
    } else {
      isLoading = false;
      isSuccess = false;
      errorMsg = error || 'Ocurrió un error al crear el restaurante.';
      toastStore.error(`Error al crear el restaurante: ${errorMsg}`);
    }
  }

  function clearForm() {
    formData = { name: '', username: '', description: '' };
    usernameChecked = false;
    usernameAvailable = false;
    clearAllErrors();
  }

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

<!-- Onboarding visual para primer restaurante -->
<div class="onboarding-wrapper">
  {#if isLoading}
    <div class="wizard-loading flex flex-col items-center justify-center h-full w-full animate-fade-in">
      <div class="spinner mb-md" aria-label="Cargando">
        <svg class="spinner-svg" viewBox="0 0 50 50">
          <circle class="spinner-bg" cx="25" cy="25" r="20" fill="none" stroke-width="6" />
          <circle class="spinner-fg" cx="25" cy="25" r="20" fill="none" stroke-width="6" />
        </svg>
      </div>
      <span class="text-primary font-semibold text-lg">Creando tu restaurante…</span>
    </div>
  {:else if isSuccess}
    <div class="success-overlay animate-fade-in">
      <div class="success-check">
        <svg width="64" height="64" viewBox="0 0 64 64" fill="none"><circle cx="32" cy="32" r="32" fill="#10b981"/><path d="M20 34l8 8 16-16" stroke="#fff" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/></svg>
      </div>
      <div class="success-msg">¡Restaurante creado exitosamente!<br/>Redirigiendo…</div>
    </div>
  {:else}
    <div class:fade-out={isLoading}>
      <div class="onboarding-header">
        <h2 class="text-2xl font-bold text-primary mb-md animate-fade-in">¡Bienvenido a Menu App!</h2>
        <p class="text-muted text-base leading-normal mb-lg animate-fade-in" style="animation-delay:0.1s">Crea tu primer restaurante y comienza a digitalizar tu menú en minutos.</p>
      </div>
      <form on:submit|preventDefault={handleSubmit} class="onboarding-form animate-slide-up">
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
            autofocus
            disabled={isLoading}
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
              disabled={!formData.name.trim() || isLoading}
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
            disabled={isLoading}
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
            disabled={isLoading}
          ></textarea>
          {#if errors.description}
            <span class="text-error text-sm font-medium">{errors.description}</span>
          {/if}
          <span class="text-light text-xs italic">
            {500 - formData.description.length} caracteres restantes
          </span>
        </div>
        <!-- Error general -->
        {#if errorMsg}
          <div class="bg-error-bg border border-error-light rounded-lg p-lg text-error text-base">
            <strong>Error:</strong> {errorMsg}
          </div>
        {/if}
        <!-- Botones -->
        <div class="flex gap-lg justify-end mt-lg">
          <button
            type="button"
            class="btn btn-secondary"
            on:click={clearForm}
            disabled={creating || isLoading}
          >
            Limpiar
          </button>
          <button
            type="submit"
            class="btn btn-primary"
            disabled={!isFormValid || creating || isLoading}
          >
            Crear Restaurante
          </button>
        </div>
      </form>
    </div>
  {/if}
  <!-- <div class="onboarding-benefits animate-fade-in" style="animation-delay:0.2s">
    <h4 class="text-primary font-semibold mb-lg text-xl">¿Qué puedes hacer después?</h4>
    <ul class="list-none p-0 m-0">
      <li class="py-xs text-secondary relative pl-5 before:content-['✓'] before:absolute before:left-0 before:text-success before:font-bold">Agregar fotos y logo</li>
      <li class="py-xs text-secondary relative pl-5 before:content-['✓'] before:absolute before:left-0 before:text-success before:font-bold">Configurar horarios y contacto</li>
      <li class="py-xs text-secondary relative pl-5 before:content-['✓'] before:absolute before:left-0 before:text-success before:font-bold">Personalizar colores y diseño</li>
      <li class="py-xs text-secondary relative pl-5 before:content-['✓'] before:absolute before:left-0 before:text-success before:font-bold">Crear tu menú digital</li>
      <li class="py-xs text-secondary relative pl-5 before:content-['✓'] before:absolute before:left-0 before:text-success before:font-bold">Generar código QR</li>
    </ul>
  </div> -->
</div>

<style>
  .onboarding-wrapper {
    width: 100%;
    max-width: 420px;
    margin: 0 auto;
    padding: var(--spacing-xl) var(--spacing-md);
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: flex-start;
    min-height: 80vh;
  }
  .loader-overlay, .success-overlay {
    width: 100%;
    min-height: 320px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: var(--spacing-xl);
    padding: var(--spacing-xl) 0;
    background: transparent;
    z-index: 10;
  }
  .loader-spinner {
    width: 56px;
    height: 56px;
    border: 6px solid var(--bg-accent);
    border-top: 6px solid var(--primary-color);
    border-radius: 50%;
    animation: spin 1s linear infinite;
    margin-bottom: var(--spacing-lg);
  }
  .loader-msg {
    font-size: var(--font-lg);
    color: var(--text-muted);
    text-align: center;
  }
  .success-check {
    margin-bottom: var(--spacing-lg);
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .success-msg {
    font-size: var(--font-lg);
    color: var(--success);
    text-align: center;
    font-weight: var(--weight-semibold);
  }
  .fade-out {
    opacity: 0.5;
    pointer-events: none;
    filter: blur(2px);
    transition: opacity 0.3s, filter 0.3s;
  }
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
  .onboarding-header {
    text-align: center;
    margin-bottom: var(--spacing-lg);
  }
  .onboarding-form {
    width: 100%;
    margin-bottom: var(--spacing-xl);
    border-radius: var(--radius-lg);
    background: transparent; /* Sin fondo adicional */
    padding: 0;
    border: none;
    box-shadow: none;
    animation-delay: 0.1s;
  }
  .onboarding-benefits {
    width: 100%;
    background: var(--bg-tertiary);
    border-radius: var(--radius-md);
    padding: var(--spacing-lg) var(--spacing-md);
    margin-top: var(--spacing-md);
    border: none;
    box-shadow: none;
    animation-delay: 0.2s;
  }
  @media (max-width: 640px) {
    .onboarding-wrapper {
      padding: var(--spacing-md) var(--spacing-xs);
      min-height: 100vh;
    }
    .onboarding-form, .onboarding-benefits {
      padding: 0;
    }
    .onboarding-benefits {
      padding: var(--spacing-md) var(--spacing-xs);
    }
  }
  .required::after {
    content: '*';
    color: var(--error);
    font-weight: bold;
    margin-left: 0.25em;
  }
  .generate-btn {
    background: var(--bg-tertiary);
    border: none;
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
    border: 1px solid var(--bg-accent);
    border-radius: var(--radius-md);
    font-size: var(--font-base);
    transition: all var(--transition-normal);
    background: var(--bg-primary);
    color: var(--text-primary);
    resize: vertical;
    min-height: 100px;
    font-family: inherit;
    box-shadow: none;
  }
  .form-textarea:focus {
    outline: none;
    border-color: var(--primary-color);
    box-shadow: none;
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
  .input {
    box-shadow: none;
    border-radius: var(--radius-md);
    border: 1px solid var(--bg-accent);
    background: var(--bg-primary);
    color: var(--text-primary);
  }
  .btn {
    box-shadow: none;
    border-radius: var(--radius-md);
    border: none;
  }
  @media (max-width: 640px) {
    .flex.gap-lg.justify-end {
      flex-direction: column;
    }
    .btn {
      width: 100%;
    }
  }
  @media (prefers-color-scheme: dark) {
    .onboarding-wrapper {
      /* background: var(--bg-tertiary); */
    }
    .onboarding-form {
      background: transparent;
      border: none;
    }
    .onboarding-benefits {
      background: var(--bg-accent);
      border: none;
    }
    .generate-btn {
      background: var(--bg-accent);
      border: none;
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
    .input {
      background: var(--bg-tertiary);
      border-color: var(--bg-accent);
      color: var(--text-primary);
    }
  }
  @media (prefers-reduced-motion: reduce) {
    .onboarding-form, .onboarding-benefits, .onboarding-header {
      transition: none;
      animation: none;
    }
    .generate-btn, .form-textarea {
      transition: none;
    }
  }
  .wizard-loading {
    min-height: 200px;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-direction: column;
    width: 100%;
    height: 100%;
    background: var(--bg-primary, #fff);
    border-radius: var(--radius-xl);
    animation: fadeIn 0.5s;
  }
  .spinner {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 56px;
    height: 56px;
    margin-bottom: 1rem;
  }
  .spinner-svg {
    width: 56px;
    height: 56px;
    animation: spinner-rotate 1s linear infinite;
  }
  .spinner-bg {
    stroke: var(--bg-accent, #e5e7eb);
    opacity: 0.3;
  }
  .spinner-fg {
    stroke: url(#spinner-gradient);
    stroke-dasharray: 90 150;
    stroke-dashoffset: 0;
    stroke-linecap: round;
    animation: spinner-dash 1.2s ease-in-out infinite;
  }
  @keyframes spinner-rotate {
    100% { transform: rotate(360deg); }
  }
  @keyframes spinner-dash {
    0% { stroke-dasharray: 1 150; stroke-dashoffset: 0; }
    50% { stroke-dasharray: 90 150; stroke-dashoffset: -35; }
    100% { stroke-dasharray: 90 150; stroke-dashoffset: -124; }
  }
  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(20px); }
    to { opacity: 1; transform: translateY(0); }
  }
</style>
<!-- SVG gradient definition for spinner -->
<svg width="0" height="0">
  <defs>
    <linearGradient id="spinner-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="var(--primary, #4f46e5)" />
      <stop offset="100%" stop-color="var(--primary-light, #6366f1)" />
    </linearGradient>
  </defs>
</svg> 