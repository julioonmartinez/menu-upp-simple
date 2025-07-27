<!-- src/components/dashboard/edit-sections/UsernameChangeModal.svelte -->
<script>
  import { createEventDispatcher } from 'svelte';
  import { restaurantStore } from '../../../stores/restaurantStore.ts';
  import InputField from '../../ui/InputField.svelte';
  import LoadingButton from '../../ui/LoadingButton.svelte';
  import ErrorMessage from '../../ui/ErrorMessage.svelte';
  import WarningMessage from '../../ui/WarningMessage.svelte';
  import GlobalModal from '../../ui/GlobalModal.svelte';

  export let isOpen = false;
  export let currentUsername = '';
  export let restaurantId = '';

  const dispatch = createEventDispatcher();

  // Estados del formulario
  let newUsername = '';
  let isSubmitting = false;
  let error = null;
  let success = null;

  // Timeout para debounce
  let usernameCheckTimeout;

  // Reactive statements
  $: isUpdating = $restaurantStore.isUpdating;
  $: updateError = $restaurantStore.updateError;
  $: isCheckingUsername = $restaurantStore.isCheckingUsername;
  $: usernameError = $restaurantStore.usernameError;
  $: hasChanges = newUsername && newUsername !== currentUsername;
  
  // Verificar disponibilidad del username actual usando el store reactivo
  $: usernameAvailability = newUsername ? $restaurantStore.usernameAvailability[newUsername] : null;
  $: isUsernameAvailable = usernameAvailability === true;
  $: isUsernameUnavailable = usernameAvailability === false;
  
  // Fallback: Si el store derivado no funciona, usar el estado directo
  $: fallbackAvailability = newUsername ? restaurantStore.getCurrentState().usernameAvailability[newUsername] : null;
  $: finalIsAvailable = isUsernameAvailable !== null ? isUsernameAvailable : fallbackAvailability;
  $: finalIsUnavailable = isUsernameUnavailable !== null ? isUsernameUnavailable : (fallbackAvailability === false);
  
  // También verificar si hay un error específico para este username
  $: hasUsernameError = usernameError && newUsername;
  
  // Debug: Log de estados
  $: {
    console.log('🔄 Username states:', {
      newUsername,
      usernameAvailability,
      isUsernameAvailable,
      isUsernameUnavailable,
      fallbackAvailability,
      finalIsAvailable,
      finalIsUnavailable,
      isCheckingUsername: $restaurantStore.isCheckingUsername,
      usernameError: $restaurantStore.usernameError
    });
  }

  // Watcher reactivo para verificar username cuando cambie
  $: if (newUsername && newUsername !== currentUsername && newUsername.length >= 3) {
    console.log('👀 Reactive watcher triggered for:', newUsername);
    // Usar un timeout para evitar múltiples llamadas
    clearTimeout(usernameCheckTimeout);
    usernameCheckTimeout = setTimeout(() => {
      console.log('🚀 Reactive check for:', newUsername);
      checkUsernameAvailability();
    }, 500);
  }

  // Funciones
  function closeModal() {
    if (!isSubmitting && !isUpdating) {
      resetForm();
      dispatch('close');
    }
  }

  function resetForm() {
    newUsername = '';
    isSubmitting = false;
    error = null;
    success = null;
    clearTimeout(usernameCheckTimeout);
    // Limpiar errores del store
    restaurantStore.clearAllErrors();
  }

  function formatUsername(value) {
    return value.toLowerCase()
      .replace(/[^a-z0-9_-]/g, '')
      .replace(/^[-_]+|[-_]+$/g, '');
  }

  function handleUsernameInput(event) {
    const formatted = formatUsername(event.target.value);
    console.log('📝 Username input:', { original: event.target.value, formatted });
    newUsername = formatted;
    event.target.value = formatted;
    console.log('🔄 Calling onUsernameChange...');
    onUsernameChange();
  }

  function onUsernameChange() {
    clearTimeout(usernameCheckTimeout);
    
    if (newUsername && newUsername !== currentUsername) {
      console.log('⏰ Scheduling username check for:', newUsername);
      usernameCheckTimeout = setTimeout(() => {
        console.log('🚀 Executing username check for:', newUsername);
        checkUsernameAvailability();
      }, 500);
    }
  }

  async function checkUsernameAvailability() {
    if (!newUsername || newUsername === currentUsername) {
      console.log('⏭️ Skipping check - no username or same as current');
      return;
    }

    console.log('🔍 Checking username availability for:', newUsername);

    try {
      console.log('📞 Calling restaurantStore.checkUsernameAvailability...');
      const result = await restaurantStore.checkUsernameAvailability(newUsername);
      console.log('📥 Username check result:', result);
      
      // Verificar el estado después de la llamada
      setTimeout(() => {
        const currentState = restaurantStore.getCurrentState();
        console.log('📊 Store state after check:', {
          usernameAvailability: currentState.usernameAvailability,
          isCheckingUsername: currentState.isCheckingUsername,
          usernameError: currentState.usernameError
        });
      }, 100);
      
    } catch (err) {
      console.error('❌ Error checking username availability:', err);
    }
  }

  async function handleSubmit(event) {
    event.preventDefault();
    
    if (isSubmitting || !hasChanges || usernameError) {
      return;
    }

    isSubmitting = true;
    error = null;
    success = null;

    try {
      const updateData = {
        username: newUsername.trim()
      };

      const result = await restaurantStore.updateRestaurant(restaurantId, updateData);

      if (result.success) {
        success = 'Username actualizado correctamente';
        dispatch('update', { newUsername });
        
        // Cerrar modal después de 2 segundos
        setTimeout(() => {
          closeModal();
        }, 2000);
      } else {
        error = result.error || 'Error actualizando el username';
      }
    } catch (err) {
      error = err.message || 'Error desconocido';
    } finally {
      isSubmitting = false;
    }
  }

  // Limpiar timeout al desmontar
  function cleanup() {
    clearTimeout(usernameCheckTimeout);
  }
</script>

<GlobalModal
  {isOpen}
  title="Cambiar Username"
  size="md"
  closeOnEscape={true}
  closeOnBackdrop={true}
  on:close={closeModal}
>
  <div class="username-change-modal">
    <!-- Mensajes de estado -->
    {#if error || updateError}
      <div class="message-container mb-2xl">
        <ErrorMessage message={error || updateError} />
      </div>
    {/if}

    {#if success}
      <div class="message-container mb-2xl">
        <div class="success-message">
          <div class="success-icon">✓</div>
          <div class="success-content">
            <h4>¡Username actualizado!</h4>
            <p>{success}</p>
          </div>
        </div>
      </div>
    {/if}

    <!-- Warnings importantes -->
    <div class="warnings-container mb-2xl">
      <div class="warning-card">
        <div class="warning-icon">⚠️</div>
        <div class="warning-content">
          <h4>Cambio de Username</h4>
          <p>Al cambiar tu username, ten en cuenta que:</p>
          <ul class="warning-list">
            <li>Los códigos QR generados anteriormente ya no funcionarán</li>
            <li>Necesitarás generar nuevos códigos QR con el nuevo username</li>
            <li>La URL de tu menú cambiará a: <strong>menuupp.com/{newUsername || 'nuevo-username'}</strong></li>
            <li>Los enlaces compartidos anteriormente dejarán de funcionar</li>
          </ul>
        </div>
      </div>
    </div>

    <!-- Formulario -->
    <form on:submit={handleSubmit} class="username-form">
      <div class="form-section">
        <div class="current-username-display">
          <label class="form-label">Username actual:</label>
          <div class="current-username">
            <span class="username-text">{currentUsername}</span>
            <span class="username-url">menuupp.com/{currentUsername}</span>
          </div>
        </div>

        <div class="new-username-field">
          <InputField
            label="Nuevo username"
            id="newUsername"
            type="text"
            bind:value={newUsername}
            on:input={handleUsernameInput}
            on:change={handleUsernameInput}
            required
            placeholder="nuevo-username"
            help="Solo letras minúsculas, números, guiones y guiones bajos"
            error={usernameError}
          />
          
          <!-- Estado de disponibilidad del username -->
          {#if newUsername && newUsername !== currentUsername}
            <div class="username-status">
              {#if isCheckingUsername}
                <div class="status-loading">
                  <div class="loading-spinner"></div>
                  <span>Verificando disponibilidad...</span>
                </div>
              {:else if hasUsernameError}
                <div class="status-error">
                  <span class="status-icon">⚠️</span>
                  <span>{usernameError}</span>
                </div>
              {:else if finalIsAvailable}
                <div class="status-success">
                  <span class="status-icon">✓</span>
                  <span>Username disponible</span>
                </div>
              {:else if finalIsUnavailable}
                <div class="status-error">
                  <span class="status-icon">✗</span>
                  <span>Username no disponible</span>
                </div>
              {:else}
                <div class="status-info">
                  <span class="status-icon">ℹ️</span>
                  <span>Escribiendo...</span>
                </div>
              {/if}
            </div>
          {/if}
          
          {#if hasChanges && finalIsAvailable}
            <div class="new-url-preview">
              <label class="form-label">Nueva URL:</label>
              <div class="url-preview">
                <span class="url-prefix">menuupp.com/</span>
                <span class="url-username">{newUsername}</span>
              </div>
            </div>
          {/if}
        </div>
      </div>

      <!-- Botones -->
      <div class="form-actions">
        <button
          type="button"
          on:click={closeModal}
          class="btn btn-secondary"
          disabled={isSubmitting || isUpdating}
        >
          Cancelar
        </button>
        
        <LoadingButton
          type="submit"
          loading={isSubmitting || isUpdating}
          disabled={!hasChanges || !finalIsAvailable || !newUsername}
          class="btn btn-primary"
        >
          Cambiar Username
        </LoadingButton>
      </div>
    </form>
  </div>
</GlobalModal>

<style>
  .username-change-modal {
    width: 100%;
    max-width: 500px;
  }

  .message-container {
    margin-bottom: var(--spacing-2xl);
  }

  .success-message {
    display: flex;
    align-items: flex-start;
    gap: var(--spacing-md);
    padding: var(--spacing-lg);
    background: var(--success-bg);
    border: 1px solid var(--success);
    border-radius: var(--radius-lg);
    color: var(--success);
  }

  .success-icon {
    font-size: 1.5rem;
    font-weight: bold;
    flex-shrink: 0;
  }

  .success-content h4 {
    margin: 0 0 var(--spacing-xs) 0;
    font-size: var(--font-lg);
    font-weight: var(--weight-semibold);
  }

  .success-content p {
    margin: 0;
    font-size: var(--font-base);
  }

  .warnings-container {
    margin-bottom: var(--spacing-2xl);
  }

  .warning-card {
    display: flex;
    align-items: flex-start;
    gap: var(--spacing-md);
    padding: var(--spacing-lg);
    background: var(--bg-tertiary);
    border: 1px solid var(--warning);
    border-radius: var(--radius-lg);
  }

  .warning-icon {
    font-size: 1.5rem;
    flex-shrink: 0;
  }

  .warning-content h4 {
    margin: 0 0 var(--spacing-sm) 0;
    font-size: var(--font-lg);
    font-weight: var(--weight-semibold);
    color: var(--warning);
  }

  .warning-content p {
    margin: 0 0 var(--spacing-sm) 0;
    font-size: var(--font-base);
    color: var(--text-secondary);
  }

  .warning-list {
    margin: 0;
    padding-left: var(--spacing-lg);
    color: var(--text-secondary);
  }

  .warning-list li {
    margin-bottom: var(--spacing-xs);
    font-size: var(--font-sm);
  }

  .warning-list li:last-child {
    margin-bottom: 0;
  }

  .username-form {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-2xl);
  }

  .form-section {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-xl);
  }

  .current-username-display {
    padding: var(--spacing-lg);
    background: var(--bg-tertiary);
    border: 1px solid var(--bg-accent);
    border-radius: var(--radius-lg);
  }

  .form-label {
    display: block;
    font-size: var(--font-sm);
    font-weight: var(--weight-medium);
    color: var(--text-muted);
    margin-bottom: var(--spacing-xs);
  }

  .current-username {
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

  .new-username-field {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-md);
  }

  .username-status {
   
    border-radius: var(--radius-md);
    font-size: var(--font-sm);
    font-weight: var(--weight-medium);
  }

  .status-loading {
    display: flex;
    align-items: center;
    gap: var(--spacing-sm);
    color: var(--text-muted);
    background: var(--bg-tertiary);
    border: 1px solid var(--bg-accent);
    padding: var(--spacing-md);
  }

  .status-success {
    display: flex;
    align-items: center;
    gap: var(--spacing-sm);
    color: var(--success);
    background: var(--success-bg);
    border: 1px solid var(--success);
    padding: var(--spacing-md);
  }

  .status-error {
    display: flex;
    align-items: center;
    gap: var(--spacing-sm);
    color: var(--error);
    background: var(--error-bg);
    border: 1px solid var(--error);
    padding: var(--spacing-md);
  }

  .status-info {
    display: flex;
    align-items: center;
    gap: var(--spacing-sm);
    color: var(--text-muted);
    background: var(--bg-tertiary);
    border: 1px solid var(--bg-accent);
    padding: var(--spacing-md);
  }

  .status-icon {
    font-size: 1rem;
    flex-shrink: 0;
  }

  .loading-spinner {
    width: 16px;
    height: 16px;
    border: 2px solid var(--bg-accent);
    border-top: 2px solid var(--primary-color);
    border-radius: 50%;
    animation: spin 1s linear infinite;
    flex-shrink: 0;
  }

  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }

  .new-url-preview {
    padding: var(--spacing-md);
    background: var(--bg-tertiary);
    border: 1px solid var(--bg-accent);
    border-radius: var(--radius-md);
  }

  .url-preview {
    display: flex;
    align-items: center;
    font-family: monospace;
    font-size: var(--font-sm);
  }

  .url-prefix {
    color: var(--text-muted);
  }

  .url-username {
    color: var(--primary-color);
    font-weight: var(--weight-medium);
  }

  .form-actions {
    display: flex;
    justify-content: flex-end;
    gap: var(--spacing-md);
    padding-top: var(--spacing-xl);
    border-top: 1px solid var(--bg-accent);
  }

  @media (max-width: 640px) {
    .username-change-modal {
      max-width: 100%;
    }

    .warning-card {
      flex-direction: column;
      align-items: flex-start;
      gap: var(--spacing-sm);
    }

    .form-actions {
      flex-direction: column;
    }

    .form-actions .btn {
      width: 100%;
    }
  }
</style> 