<script lang="ts">
  import { authStore, isLoading, authError } from '../../stores/authStore.ts';
  import { onMount } from 'svelte';
  import { slide } from 'svelte/transition';
  import type { RegisterResult } from '../../stores/authStore.ts';

  // Props
  interface Props {
    redirectUrl?: string;
  }
  let { redirectUrl = '/dashboard' }: Props = $props();

  // Form state
  let name = $state<string>('');
  let email = $state<string>('');
  let password = $state<string>('');
  let confirmPassword = $state<string>('');
  let showPassword = $state<boolean>(false);
  let isSubmitting = $state<boolean>(false);

  // Error state
  let nameError = $state<string>('');
  let emailError = $state<string>('');
  let passwordError = $state<string>('');
  let confirmPasswordError = $state<string>('');
  let generalError = $state<string>('');

  // Validation
  const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const MIN_PASSWORD_LENGTH = 6;

  $effect(() => {
    if (name.trim()) nameError = '';
    if (email.trim()) emailError = '';
    if (password) passwordError = '';
    if (confirmPassword) confirmPasswordError = '';
    if (generalError && (name || email || password || confirmPassword)) generalError = '';
  });

  $effect(() => {
    if ($authError && (name || email || password || confirmPassword)) {
      authStore.clearError();
    }
  });

  function validateForm(): boolean {
    let isValid = true;
    nameError = '';
    emailError = '';
    passwordError = '';
    confirmPasswordError = '';
    generalError = '';

    if (!name.trim()) {
      nameError = 'El nombre es requerido';
      isValid = false;
    }
    if (!email.trim()) {
      emailError = 'El email es requerido';
      isValid = false;
    } else if (!EMAIL_REGEX.test(email.trim())) {
      emailError = 'Ingresa un email válido';
      isValid = false;
    }
    if (!password) {
      passwordError = 'La contraseña es requerida';
      isValid = false;
    } else if (password.length < MIN_PASSWORD_LENGTH) {
      passwordError = `La contraseña debe tener al menos ${MIN_PASSWORD_LENGTH} caracteres`;
      isValid = false;
    }
    if (!confirmPassword) {
      confirmPasswordError = 'Confirma tu contraseña';
      isValid = false;
    } else if (password !== confirmPassword) {
      confirmPasswordError = 'Las contraseñas no coinciden';
      isValid = false;
    }
    return isValid;
  }

  async function handleSubmit(event: SubmitEvent): Promise<void> {
    event.preventDefault();
    if (!validateForm()) return;
    isSubmitting = true;
    generalError = '';
    try {
      const result: RegisterResult = await authStore.register({
        name: name.trim(),
        email: email.trim(),
        password
      });
      if (result.success) {
        handleSuccessfulRegister();
      } else {
        generalError = result.error || 'Error en el registro';
      }
    } catch (error) {
      generalError = error instanceof Error ? error.message : 'Error inesperado en el registro';
    } finally {
      isSubmitting = false;
    }
  }

  function handleSuccessfulRegister(): void {
    const urlParams = new URLSearchParams(window.location.search);
    const redirect = urlParams.get('redirect') || redirectUrl;
    const safeRedirect = validateRedirectUrl(redirect);
    setTimeout(() => {
      window.location.href = safeRedirect;
    }, 500);
  }

  function validateRedirectUrl(url: string): string {
    try {
      if (url.startsWith('/')) return url;
      const redirectUrl = new URL(url);
      const currentUrl = new URL(window.location.href);
      if (redirectUrl.origin === currentUrl.origin) return url;
      return '/dashboard';
    } catch {
      return '/dashboard';
    }
  }

  function togglePasswordVisibility(): void {
    showPassword = !showPassword;
  }

  function handleNameInput(event: Event): void {
    name = (event.target as HTMLInputElement).value;
  }
  function handleEmailInput(event: Event): void {
    email = (event.target as HTMLInputElement).value;
  }
  function handlePasswordInput(event: Event): void {
    password = (event.target as HTMLInputElement).value;
  }
  function handleConfirmPasswordInput(event: Event): void {
    confirmPassword = (event.target as HTMLInputElement).value;
  }
  function handleKeyDown(event: KeyboardEvent): void {
    if (event.key === 'Enter' && !isSubmitting && !$isLoading) {
      handleSubmit(event as unknown as SubmitEvent);
    }
  }

  onMount(() => {
    authStore.init();
    const nameInput = document.getElementById('name');
    if (nameInput) nameInput.focus();
  });

  const isFormValid = $derived(() => {
    return name.trim().length > 0 &&
           email.trim().length > 0 &&
           password.length >= MIN_PASSWORD_LENGTH &&
           confirmPassword.length >= MIN_PASSWORD_LENGTH &&
           password === confirmPassword &&
           EMAIL_REGEX.test(email.trim());
  });

  const buttonText = $derived(() => {
    if (isSubmitting || $isLoading) return 'Creando cuenta...';
    return 'Crear Cuenta';
  });
  const isFormDisabled = $derived(() => isSubmitting || $isLoading);
</script>

<div class="login-container">
  <div class="card login-card animate-fade-in">
    <div class="login-header">
      <h1 class="text-3xl font-bold text-center text-accent mb-sm">
        Crear Cuenta
      </h1>
      <p class="text-muted text-center mb-2xl">
        Regístrate para acceder a todas las funciones
      </p>
    </div>
    <form onsubmit={handleSubmit} class="login-form" novalidate>
      <div class="form-group">
        <label for="name" class="form-label">
          Nombre <span class="required">*</span>
        </label>
        <div class="input-wrapper">
          <input
            id="name"
            type="text"
            value={name}
            oninput={handleNameInput}
            onkeydown={handleKeyDown}
            class="input {nameError ? 'input-error' : ''}"
            placeholder="Tu nombre"
            disabled={isFormDisabled()}
            autocomplete="name"
            required
            aria-describedby={nameError ? 'name-error' : undefined}
            aria-invalid={!!nameError}
          />
        </div>
        {#if nameError}
          <div id="name-error" class="error-message" transition:slide={{ duration: 200 }} role="alert">
            {nameError}
          </div>
        {/if}
      </div>
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
        </div>
        {#if emailError}
          <div id="email-error" class="error-message" transition:slide={{ duration: 200 }} role="alert">
            {emailError}
          </div>
        {/if}
      </div>
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
            placeholder="Crea una contraseña"
            disabled={isFormDisabled()}
            autocomplete="new-password"
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
            {:else}
            {/if}
          </button>
        </div>
        {#if passwordError}
          <div id="password-error" class="error-message" transition:slide={{ duration: 200 }} role="alert">
            {passwordError}
          </div>
        {/if}
      </div>
      <div class="form-group">
        <label for="confirmPassword" class="form-label">
          Confirmar Contraseña <span class="required">*</span>
        </label>
        <div class="input-wrapper">
          <input
            id="confirmPassword"
            type={showPassword ? 'text' : 'password'}
            value={confirmPassword}
            oninput={handleConfirmPasswordInput}
            onkeydown={handleKeyDown}
            class="input {confirmPasswordError ? 'input-error' : ''}"
            placeholder="Repite tu contraseña"
            disabled={isFormDisabled()}
            autocomplete="new-password"
            required
            aria-describedby={confirmPasswordError ? 'confirm-password-error' : undefined}
            aria-invalid={!!confirmPasswordError}
          />
        </div>
        {#if confirmPasswordError}
          <div id="confirm-password-error" class="error-message" transition:slide={{ duration: 200 }} role="alert">
            {confirmPasswordError}
          </div>
        {/if}
      </div>
      {#if generalError || $authError}
        <div class="error-message error-general" transition:slide={{ duration: 200 }} role="alert">
          {generalError || $authError}
        </div>
      {/if}
      <button
        type="submit"
        class="btn btn-primary w-full btn-lg"
        disabled={isFormDisabled() || !isFormValid}
        aria-describedby="register-button-description"
      >
        {#if isSubmitting || $isLoading}
          <div class="btn-spinner">
            <span>{buttonText()}</span>
          </div>
        {:else}
          {buttonText()}
        {/if}
      </button>
      <div id="register-button-description" class="sr-only">
        Presiona Enter o haz clic para crear tu cuenta
      </div>
      <div class="login-links">
        <a href="/login" class="link-secondary">
          ¿Ya tienes cuenta? Inicia sesión
        </a>
      </div>
    </form>
    {#if import.meta.env.DEV}
      <details class="debug-info">
        <summary>Debug Info</summary>
        <pre>
Nombre: "{name}"
Email: "{email}"
Password: "{password.replace(/./g, '*')}"
Confirm: "{confirmPassword.replace(/./g, '*')}"
Loading: {$isLoading}
Submitting: {isSubmitting}
Form Valid: {isFormValid}
        </pre>
      </details>
    {/if}
  </div>
</div>

<style>
  /* Usa los mismos estilos que LoginForm para consistencia */
  .login-container { min-height: 100vh; display: flex; align-items: center; justify-content: center; padding: var(--spacing-lg); background: var(--bg-secondary); }
  .login-card { width: 100%; max-width: 420px; background: var(--bg-primary); border: 1px solid var(--bg-accent); box-shadow: var(--shadow-xl); padding: var(--spacing-3xl); }
  .login-header { margin-bottom: var(--spacing-3xl); }
  .form-group { margin-bottom: var(--spacing-2xl); }
  .form-label { display: block; font-weight: var(--weight-semibold); color: var(--text-secondary); margin-bottom: var(--spacing-sm); font-size: var(--font-sm); }
  .required { color: var(--error); }
  .input-wrapper { position: relative; display: flex; align-items: center; }
  .input-wrapper .input { padding-left: var(--spacing-5xl); padding-right: var(--spacing-5xl); }
  .input-error { border-color: var(--error) !important; box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.1) !important; }
  .password-toggle { position: absolute; right: var(--spacing-lg); background: none; border: none; color: var(--text-light); cursor: pointer; padding: var(--spacing-xs); border-radius: var(--radius-sm); transition: all var(--transition-fast); z-index: 1; min-height: auto; min-width: auto; }
  .password-toggle:hover:not(:disabled) { color: var(--text-secondary); background: var(--bg-tertiary); }
  .password-toggle:disabled { opacity: 0.5; cursor: not-allowed; }
  .error-message { color: var(--error); font-size: var(--font-sm); margin-top: var(--spacing-sm); display: flex; align-items: center; gap: var(--spacing-xs); }
  .error-general { background: var(--error-bg); border: 1px solid var(--error); border-radius: var(--radius-md); padding: var(--spacing-md); margin-bottom: var(--spacing-lg); }
  .btn-spinner { display: flex; align-items: center; justify-content: center; gap: var(--spacing-sm); }
  .login-links { margin-top: var(--spacing-2xl); display: flex; flex-direction: column; gap: var(--spacing-md); align-items: center; }
  .link-secondary { color: var(--text-muted); font-size: var(--font-sm); text-decoration: none; transition: all var(--transition-fast); }
  .link-secondary:hover { color: var(--primary-color); text-decoration: underline; }
  .debug-info { margin-top: var(--spacing-lg); padding: var(--spacing-sm); background: var(--bg-tertiary); border-radius: var(--radius-sm); font-family: monospace; color: var(--text-muted); font-size: var(--font-xs); }
  .debug-info summary { cursor: pointer; font-weight: var(--weight-semibold); }
  .debug-info pre { margin: var(--spacing-sm) 0 0 0; white-space: pre-wrap; }
  .sr-only { position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px; overflow: hidden; clip: rect(0, 0, 0, 0); white-space: nowrap; border: 0; }
  @media (max-width: 480px) { .login-container { padding: var(--spacing-md); } .login-card { padding: var(--spacing-2xl); } .login-header h1 { font-size: var(--font-2xl); } }
  .input:focus { transform: none; box-shadow: 0 0 0 3px rgba(255, 107, 53, 0.1); }
  .input-error:focus { box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.1); }
  .input:disabled, .password-toggle:disabled { opacity: 0.7; cursor: not-allowed; }
  .btn:disabled { opacity: 0.6; cursor: not-allowed; transform: none; }
</style>
