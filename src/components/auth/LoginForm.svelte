<!-- src/components/LoginForm.svelte -->
<script lang="ts">
  import { authStore, isLoading, authError } from '../../stores/authStore.ts';
  import type { LoginResult } from '../../types/auth.ts';
  import { onMount } from 'svelte';
  import { slide } from 'svelte/transition';

  // Props con tipos específicos
  interface Props {
    redirectUrl?: string;
  }
  
  let { redirectUrl = '/dashboard' }: Props = $props();

  // State del formulario con tipos explícitos
  let email = $state<string>('');
  let password = $state<string>('');
  let showPassword = $state<boolean>(false);
  let isSubmitting = $state<boolean>(false);

  // Errores del formulario con tipos específicos
  let emailError = $state<string>('');
  let passwordError = $state<string>('');
  let generalError = $state<string>('');

  // Regex para validación de email
  const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const MIN_PASSWORD_LENGTH = 6;

  // Effects para limpiar errores reactivamente
  $effect(() => {
    if (email.trim()) {
      emailError = '';
      generalError = '';
    }
  });

  $effect(() => {
    if (password) {
      passwordError = '';
      generalError = '';
    }
  });

  // Limpiar error del store cuando hay cambios
  $effect(() => {
    if ($authError && (email || password)) {
      authStore.clearError();
    }
  });

  // Validación tipada de campos
  function validateForm(): boolean {
    let isValid = true;
    
    // Reset errores
    emailError = '';
    passwordError = '';
    generalError = '';

    // Validar email
    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      emailError = 'El email es requerido';
      isValid = false;
    } else if (!EMAIL_REGEX.test(trimmedEmail)) {
      emailError = 'Ingresa un email válido';
      isValid = false;
    }

    // Validar password
    if (!password) {
      passwordError = 'La contraseña es requerida';
      isValid = false;
    } else if (password.length < MIN_PASSWORD_LENGTH) {
      passwordError = `La contraseña debe tener al menos ${MIN_PASSWORD_LENGTH} caracteres`;
      isValid = false;
    }

    return isValid;
  }

  // Manejar submit del formulario con tipos específicos
  async function handleSubmit(event: SubmitEvent): Promise<void> {
    event.preventDefault();
    
    if (!validateForm()) return;

    isSubmitting = true;
    generalError = '';

    try {
      const result: LoginResult = await authStore.login(email.trim(), password);
      
      if (result.success) {
        // Éxito - preparar redirección
        handleSuccessfulLogin();
      } else {
        generalError = result.error || 'Error en el login';
      }
    } catch (error) {
      generalError = error instanceof Error ? error.message : 'Error inesperado en el login';
    } finally {
      isSubmitting = false;
    }
  }

  // Manejar login exitoso
  function handleSuccessfulLogin(): void {
    // Obtener URL de redirección de los parámetros
    const urlParams = new URLSearchParams(window.location.search);
    const redirect = urlParams.get('redirect') || redirectUrl;
    
    // Validar que la URL de redirección sea segura
    const safeRedirect = validateRedirectUrl(redirect);
    
    // Pequeño delay para mostrar el éxito antes de redirigir
    setTimeout(() => {
      window.location.href = safeRedirect;
    }, 500);
  }

  // Validar URL de redirección para prevenir ataques
  function validateRedirectUrl(url: string): string {
    try {
      // Si es una URL relativa, está bien
      if (url.startsWith('/')) {
        return url;
      }
      
      // Si es una URL absoluta, verificar que sea del mismo origen
      const redirectUrl = new URL(url);
      const currentUrl = new URL(window.location.href);
      
      if (redirectUrl.origin === currentUrl.origin) {
        return url;
      }
      
      // Si no es segura, redirigir al dashboard
      return '/dashboard';
    } catch {
      // Si hay error parseando la URL, redirigir al dashboard
      return '/dashboard';
    }
  }

  // Alternar visibilidad de contraseña
  function togglePasswordVisibility(): void {
    showPassword = !showPassword;
  }

  // Manejar input de email con debounce para validación
  function handleEmailInput(event: Event): void {
    const target = event.target as HTMLInputElement;
    email = target.value;
  }

  // Manejar input de password
  function handlePasswordInput(event: Event): void {
    const target = event.target as HTMLInputElement;
    password = target.value;
  }

  // Manejar tecla Enter en campos
  function handleKeyDown(event: KeyboardEvent): void {
    if (event.key === 'Enter' && !isSubmitting && !$isLoading) {
      handleSubmit(event as unknown as SubmitEvent);
    }
  }

  // Inicializar autenticación al montar
  onMount(() => {
    authStore.init();
    
    // Focus automático en el campo de email
    const emailInput = document.getElementById('email');
    if (emailInput) {
      emailInput.focus();
    }
  });

  // Computed para determinar si el formulario es válido
  const isFormValid = $derived(() => {
    return email.trim().length > 0 && 
           password.length >= MIN_PASSWORD_LENGTH && 
           EMAIL_REGEX.test(email.trim());
  });

  // Computed para el texto del botón
  const buttonText = $derived(() => {
    if (isSubmitting || $isLoading) {
      return 'Iniciando sesión...';
    }
    return 'Iniciar Sesión';
  });

  // Computed para saber si el formulario está deshabilitado
  const isFormDisabled = $derived(() => {
    return isSubmitting || $isLoading;
  });
</script>

<div class="login-container">
  <div class="card login-card animate-fade-in">
    <!-- Header del formulario -->
    <div class="login-header">
      <h1 class="text-3xl font-bold text-center text-accent mb-sm">
        Iniciar Sesión
      </h1>
      <p class="text-muted text-center mb-2xl">
        Ingresa tus credenciales para acceder
      </p>
    </div>

    <!-- Formulario -->
    <form onsubmit={handleSubmit} class="login-form" novalidate>
      <!-- Campo Email -->
      <div class="form-group">
        <label for="email" class="form-label">
          Email <span class="required">*</span>
        </label>
        <div class="input-wrapper">
          <input
            id="email"
            type="email"
            value={email}
            oninput={handleEmailInput}
            onkeydown={handleKeyDown}
            class="input {emailError ? 'input-error' : ''}"
            placeholder="tu@email.com"
            disabled={isFormDisabled()}
            autocomplete="email"
            required
            aria-describedby={emailError ? 'email-error' : undefined}
            aria-invalid={!!emailError}
          />
          <div class="input-icon" aria-hidden="true">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
              <polyline points="22,6 12,13 2,6"/>
            </svg>
          </div>
        </div>
        {#if emailError}
          <div id="email-error" class="error-message" transition:slide={{ duration: 200 }} role="alert">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10"/>
              <line x1="15" y1="9" x2="9" y2="15"/>
              <line x1="9" y1="9" x2="15" y2="15"/>
            </svg>
            {emailError}
          </div>
        {/if}
      </div>

      <!-- Campo Password -->
      <div class="form-group">
        <label for="password" class="form-label">
          Contraseña <span class="required">*</span>
        </label>
        <div class="input-wrapper">
          <input
            id="password"
            type={showPassword ? 'text' : 'password'}
            value={password}
            oninput={handlePasswordInput}
            onkeydown={handleKeyDown}
            class="input {passwordError ? 'input-error' : ''}"
            placeholder="Tu contraseña"
            disabled={isFormDisabled()}
            autocomplete="current-password"
            required
            aria-describedby={passwordError ? 'password-error' : undefined}
            aria-invalid={!!passwordError}
          />
          <button
            type="button"
            class="password-toggle"
            onclick={togglePasswordVisibility()!}
            disabled={isFormDisabled()}
            aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
          >
            {#if showPassword}
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
                <line x1="1" y1="1" x2="23" y2="23"/>
              </svg>
            {:else}
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                <circle cx="12" cy="12" r="3"/>
              </svg>
            {/if}
          </button>
        </div>
        {#if passwordError}
          <div id="password-error" class="error-message" transition:slide={{ duration: 200 }} role="alert">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10"/>
              <line x1="15" y1="9" x2="9" y2="15"/>
              <line x1="9" y1="9" x2="15" y2="15"/>
            </svg>
            {passwordError}
          </div>
        {/if}
      </div>

      <!-- Error general -->
      {#if generalError || $authError}
        <div class="error-message error-general" transition:slide={{ duration: 200 }} role="alert">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <triangle cx="12" cy="12" r="10"/>
            <line x1="12" y1="8" x2="12" y2="12"/>
            <line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
          {generalError || $authError}
        </div>
      {/if}

      <!-- Botón de submit -->
      <button
        type="submit"
        class="btn btn-primary w-full btn-lg"
        disabled={isFormDisabled() || !isFormValid}
        aria-describedby="login-button-description"
      >
        {#if isSubmitting || $isLoading}
          <div class="btn-spinner">
            <svg class="animate-spin" width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" stroke-opacity="0.3"/>
              <path fill="currentColor" d="M12 2a10 10 0 0 1 10 10h-4a6 6 0 0 0-6-6V2z"/>
            </svg>
          </div>
          <span>{buttonText()}</span>
        {:else}
          {buttonText()}
        {/if}
      </button>
      
      <div id="login-button-description" class="sr-only">
        Presiona Enter o haz clic para iniciar sesión
      </div>

      <!-- Enlaces adicionales -->
      <div class="login-links">
        <a href="/register" class="link-secondary">
          ¿No tienes cuenta? Regístrate
        </a>
        <!-- <a href="/forgot-password" class="link-secondary">
          ¿Olvidaste tu contraseña?
        </a> -->
      </div>
    </form>

    <!-- Debug info (solo en desarrollo) -->
    <!-- {#if import.meta.env.DEV}
      <details class="debug-info">
        <summary>Debug Info</summary>
        <pre>
Email: "{email}"
Password: "{password.replace(/./g, '*')}"
Loading: {$isLoading}
Submitting: {isSubmitting}
Form Valid: {isFormValid}
        </pre>
      </details>
    {/if} -->
  </div>
</div>

<style>
  .login-container {
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: var(--spacing-lg);
    background: var(--bg-secondary);
  }

  .login-card {
    width: 100%;
    max-width: 420px;
    background: var(--bg-primary);
    border: 1px solid var(--bg-accent);
    box-shadow: var(--shadow-xl);
    padding: var(--spacing-3xl);
  }

  .login-header {
    margin-bottom: var(--spacing-3xl);
  }

  .form-group {
    margin-bottom: var(--spacing-2xl);
  }

  .form-label {
    display: block;
    font-weight: var(--weight-semibold);
    color: var(--text-secondary);
    margin-bottom: var(--spacing-sm);
    font-size: var(--font-sm);
  }

  .required {
    color: var(--error);
  }

  .input-wrapper {
    position: relative;
    display: flex;
    align-items: center;
  }

  .input-icon {
    position: absolute;
    left: var(--spacing-lg);
    color: var(--text-light);
    pointer-events: none;
    z-index: 1;
  }

  .input-wrapper .input {
    padding-left: var(--spacing-5xl);
    padding-right: var(--spacing-5xl);
  }

  .input-error {
    border-color: var(--error) !important;
    box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.1) !important;
  }

  .password-toggle {
    position: absolute;
    right: var(--spacing-lg);
    background: none;
    border: none;
    color: var(--text-light);
    cursor: pointer;
    padding: var(--spacing-xs);
    border-radius: var(--radius-sm);
    transition: all var(--transition-fast);
    z-index: 1;
    min-height: auto;
    min-width: auto;
  }

  .password-toggle:hover:not(:disabled) {
    color: var(--text-secondary);
    background: var(--bg-tertiary);
  }

  .password-toggle:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .error-message {
    color: var(--error);
    font-size: var(--font-sm);
    margin-top: var(--spacing-sm);
    display: flex;
    align-items: center;
    gap: var(--spacing-xs);
  }

  .error-general {
    background: var(--error-bg);
    border: 1px solid var(--error);
    border-radius: var(--radius-md);
    padding: var(--spacing-md);
    margin-bottom: var(--spacing-lg);
  }

  .btn-spinner {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: var(--spacing-sm);
  }

  .login-links {
    margin-top: var(--spacing-2xl);
    display: flex;
    flex-direction: column;
    gap: var(--spacing-md);
    align-items: center;
  }

  .link-secondary {
    color: var(--text-muted);
    font-size: var(--font-sm);
    text-decoration: none;
    transition: all var(--transition-fast);
  }

  .link-secondary:hover {
    color: var(--primary-color);
    text-decoration: underline;
  }

  .debug-info {
    margin-top: var(--spacing-lg);
    padding: var(--spacing-sm);
    background: var(--bg-tertiary);
    border-radius: var(--radius-sm);
    font-family: monospace;
    color: var(--text-muted);
    font-size: var(--font-xs);
  }

  .debug-info summary {
    cursor: pointer;
    font-weight: var(--weight-semibold);
  }

  .debug-info pre {
    margin: var(--spacing-sm) 0 0 0;
    white-space: pre-wrap;
  }

  .sr-only {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
    border: 0;
  }

  /* Responsive adjustments */
  @media (max-width: 480px) {
    .login-container {
      padding: var(--spacing-md);
    }

    .login-card {
      padding: var(--spacing-2xl);
    }

    .login-header h1 {
      font-size: var(--font-2xl);
    }
  }

  /* Focus states mejorados */
  .input:focus {
    transform: none;
    box-shadow: 0 0 0 3px rgba(255, 107, 53, 0.1);
  }

  .input-error:focus {
    box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.1);
  }

  /* Loading states */
  .input:disabled,
  .password-toggle:disabled {
    opacity: 0.7;
    cursor: not-allowed;
  }

  /* Button disabled state */
  .btn:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
  }
</style>