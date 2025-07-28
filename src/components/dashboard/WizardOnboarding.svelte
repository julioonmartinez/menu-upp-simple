<script>
  import OnboardingStepImagesAndColors from './onboarding/OnboardingStepImagesAndColors.svelte';
  import OnboardingStepCategory from './onboarding/OnboardingStepCategory.svelte';
  import OnboardingStepDish from './onboarding/OnboardingStepDish.svelte';
  import OnboardingStepHeroSlides from './onboarding/OnboardingStepHeroSlides.svelte';
  import OnboardingStepSocialLinks from './onboarding/OnboardingStepSocialLinks.svelte';
  import OnboardingStepSchedule from './onboarding/OnboardingStepSchedule.svelte';
  import OnboardingStepFeatures from './onboarding/OnboardingStepFeatures.svelte';
  import OnboardingStepLink from './onboarding/OnboardingStepLink.svelte';
  import OnboardingStepQRCode from './onboarding/OnboardingStepQRCode.svelte';
  import { restaurantStore, currentRestaurant } from '../../stores/restaurantStore';
  import { onMount } from 'svelte';

  export let restaurantId;

  let loading = true;
  let error = null;
  let stepComponent;
  let currentStep = 1;

  $: restaurant = $currentRestaurant;
  $: isValidStep = currentStep >= 1 && currentStep <= steps.length;

  const steps = [
    'Imágenes y Colores',
    'Categoría',
    'Platillos',
    'Slides Hero',
    'Redes Sociales',
    'Horarios',
    'Características',
    'Enlace Adicional',
    'QR',
  ];

  // Función para obtener el parámetro step de la URL
  function getStepFromURL() {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const stepParam = urlParams.get('step');
      return stepParam ? parseInt(stepParam) : 1;
    }
    return 1;
  }

  // Función para actualizar la URL sin recargar la página
  function updateURL(stepNumber) {
    if (typeof window !== 'undefined') {
      const url = new URL(window.location);
      url.searchParams.set('step', stepNumber.toString());
      window.history.pushState({}, '', url);
    }
  }

  // Función para navegar a una URL específica
  function navigateToURL(url) {
    if (typeof window !== 'undefined') {
      window.location.href = url;
    }
  }

  onMount(async () => {
    loading = true;
    error = null;
    
    // Obtener el paso actual de la URL
    currentStep = getStepFromURL();
    
    // Si no hay parámetro step en la URL, redirigir al paso 1
    if (!new URLSearchParams(window.location.search).has('step')) {
      updateURL(1);
      currentStep = 1;
    }
    
    const result = await restaurantStore.loadRestaurant(restaurantId, true);
    if (!result.success) {
      error = result.error;
    }
    loading = false;
  });

  async function navigateToStep(stepNumber) {
    if (stepNumber >= 1 && stepNumber <= steps.length) {
      updateURL(stepNumber);
      currentStep = stepNumber;
    }
  }

  async function nextStep() {
    if (currentStep < steps.length) {
      await navigateToStep(currentStep + 1);
    }
  }

  async function prevStep() {
    if (currentStep > 1) {
      await navigateToStep(currentStep - 1);
    }
  }

  async function handleNext() {
    if (stepComponent && typeof stepComponent.save === 'function') {
      const ok = await stepComponent.save();
      if (ok) await nextStep();
    } else {
      await nextStep();
    }
  }

  async function handleFinish() {
    // Mostrar mensaje de éxito antes de redirigir
    if (typeof window !== 'undefined') {
      // Opcional: mostrar un toast de éxito
      setTimeout(() => {
        navigateToURL('/dashboard');
      }, 500);
    } else {
      navigateToURL('/dashboard');
    }
  }
</script>

<div class="wizard-container">
  <div class="wizard-card">
    <div class="wizard-progress-bar-container">
      <div class="wizard-progress-bar" style="width: {(currentStep/steps.length)*100}%"></div>
    </div>
    <div class="wizard-header">
      <div class="wizard-header-content">
        <span class="wizard-step-counter">Paso {currentStep} de {steps.length}</span>
        <span class="wizard-step-title">{steps[currentStep-1]}</span>
      </div>
    </div>
    <div class="wizard-content">
      {#if loading}
        <div class="wizard-loading">
          <div class="spinner" aria-label="Cargando">
            <svg class="spinner-svg" viewBox="0 0 50 50">
              <circle class="spinner-bg" cx="25" cy="25" r="20" fill="none" stroke-width="6" />
              <circle class="spinner-fg" cx="25" cy="25" r="20" fill="none" stroke-width="6" />
            </svg>
          </div>
          <span class="wizard-loading-text">Cargando…</span>
        </div>
      {:else if error}
        <p class="wizard-error">{error}</p>
      {:else if restaurant && isValidStep}
        {#if currentStep === 1}
          <OnboardingStepImagesAndColors
            bind:this={stepComponent}
            restaurant={restaurant}
            restaurantId={restaurantId}
            on:next={nextStep}
          />
        {/if}
        {#if currentStep === 2}
          <OnboardingStepCategory
            bind:this={stepComponent}
            restaurantId={restaurantId}
            on:next={nextStep}
            on:prev={prevStep}
          />
        {/if}
        {#if currentStep === 3}
          <OnboardingStepDish
            bind:this={stepComponent}
            restaurantId={restaurantId}
            on:next={nextStep}
            on:prev={prevStep}
          />
        {/if}
        {#if currentStep === 4}
          <OnboardingStepHeroSlides
            bind:this={stepComponent}
            restaurantId={restaurantId}
            on:next={nextStep}
            on:prev={prevStep}
          />
        {/if}
        {#if currentStep === 5}
          <OnboardingStepSocialLinks
            bind:this={stepComponent}
            restaurant={restaurant}
            restaurantId={restaurantId}
            on:next={nextStep}
            on:prev={prevStep}
          />
        {/if}
        {#if currentStep === 6}
          <OnboardingStepSchedule
            bind:this={stepComponent}
            restaurant={restaurant}
            restaurantId={restaurantId}
            on:next={nextStep}
            on:prev={prevStep}
          />
        {/if}
        {#if currentStep === 7}
          <OnboardingStepFeatures
            bind:this={stepComponent}
            restaurant={restaurant}
            restaurantId={restaurantId}
            on:next={nextStep}
            on:prev={prevStep}
          />
        {/if}
        {#if currentStep === 8}
          <OnboardingStepLink
            bind:this={stepComponent}
            restaurant={restaurant}
            restaurantId={restaurantId}
            on:next={nextStep}
            on:prev={prevStep}
          />
        {/if}
        {#if currentStep === 9}
          <OnboardingStepQRCode
            bind:this={stepComponent}
            restaurant={restaurant}
            restaurantId={restaurantId}
            on:next={nextStep}
            on:prev={prevStep}
          />
        {/if}
      {:else if !isValidStep}
        <div class="wizard-error-state">
          <p class="wizard-error">Paso no válido</p>
          <button class="btn btn-primary" on:click={() => navigateToStep(1)}>
            Ir al primer paso
          </button>
        </div>
      {/if}
    </div>
    <div class="wizard-footer">
      {#if currentStep > 1}
        <button class="btn btn-secondary" on:click={prevStep}>Atrás</button>
      {/if}
      {#if currentStep < steps.length}
        <button class="btn btn-primary" on:click={handleNext}>Siguiente</button>
      {:else}
        <button class="btn btn-primary" on:click={handleFinish}>Finalizar</button>
      {/if}
    </div>
  </div>
</div>

<style>
  /* Contenedor principal del wizard */
  .wizard-container {
    background: linear-gradient(135deg, var(--bg-secondary), var(--bg-tertiary));
    width: 100vw;
    height: 100dvh;
    min-height: 100dvh;
    max-height: 100dvh;
    padding: 0;
    margin: 0;
    overflow: hidden;
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    -webkit-overflow-scrolling: touch;
    z-index: 1000;
  }
  
  /* Card principal del wizard */
  .wizard-card {
    width: 100%;
    max-width: 500px;
    height: 100vh;
    max-height: 100vh;
    display: flex;
    flex-direction: column;
    background: var(--bg-primary);
    box-shadow: var(--shadow-xl);
    border: 1px solid var(--bg-accent);
    border-radius: var(--radius-xl);
    position: relative;
    overflow: hidden;
    margin: 0;
    -webkit-overflow-scrolling: touch;
  }
  
  /* Barra de progreso */
  .wizard-progress-bar-container {
    width: 100%;
    height: 6px;
    background: var(--bg-accent);
    border-radius: var(--radius-xl) var(--radius-xl) 0 0;
    overflow: hidden;
    position: relative;
    z-index: 5;
    flex-shrink: 0;
  }
  
  .wizard-progress-bar {
    height: 100%;
    background: linear-gradient(90deg, var(--primary-color), var(--primary-light));
    transition: width 0.4s var(--transition-bounce);
    box-shadow: 0 2px 8px rgba(255, 107, 53, 0.3);
  }
  
  /* Header del wizard */
  .wizard-header {
    padding: var(--spacing-2xl) var(--spacing-xl) var(--spacing-lg);
    border-bottom: 1px solid var(--bg-accent);
    background: var(--bg-primary);
    position: relative;
    overflow: hidden;
    flex-shrink: 0;
    z-index: 5;
  }
  
  .wizard-header-content {
    display: flex;
    align-items: center;
    justify-content: space-between;
    width: 100%;
  }
  
  .wizard-step-counter {
    font-size: var(--font-sm);
    color: var(--text-muted);
    font-weight: var(--weight-medium);
  }
  
  .wizard-step-title {
    font-size: var(--font-xl);
    font-weight: var(--weight-bold);
    color: var(--primary-color);
  }
  
  /* Contenido principal */
  .wizard-content {
    flex: 1;
    overflow-y: auto;
    padding: var(--spacing-lg);
    min-height: 300px;
    position: relative;
    z-index: 1;
    -webkit-overflow-scrolling: touch;
    overscroll-behavior: contain;
    scroll-behavior: smooth;
  }
  
  /* Footer con botones */
  .wizard-footer {
    padding: var(--spacing-lg) var(--spacing-xl);
    padding-bottom: calc(var(--spacing-lg) + env(safe-area-inset-bottom, 0));
    background: var(--bg-primary);
    border-top: 1px solid var(--bg-accent);
    border-radius: 0 0 var(--radius-xl) var(--radius-xl);
    display: flex;
    align-items: center;
    justify-content: flex-end;
    gap: var(--spacing-lg);
    flex-shrink: 0;
    position: relative;
    z-index: 5;
  }
  
  /* Estados de loading y error */
  .wizard-loading {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 100%;
    width: 100%;
    min-height: 200px;
  }
  
  .wizard-loading-text {
    color: var(--primary-color);
    font-weight: var(--weight-bold);
    font-size: var(--font-lg);
    margin-top: var(--spacing-lg);
  }
  
  .wizard-error {
    color: var(--error);
    text-align: center;
    font-weight: var(--weight-medium);
  }
  
  .wizard-error-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 100%;
    gap: var(--spacing-lg);
  }
  
  /* Spinner */
  .spinner {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 56px;
    height: 56px;
    margin-bottom: var(--spacing-lg);
    position: relative;
    z-index: 2;
  }
  
  .spinner-svg {
    width: 56px;
    height: 56px;
    animation: spinner-rotate 1s linear infinite;
  }
  
  .spinner-bg {
    stroke: var(--bg-accent);
    opacity: 0.3;
  }
  
  .spinner-fg {
    stroke: var(--primary-color);
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
  
  /* Responsive para móviles */
  @media (max-width: 640px) {
    .wizard-card {
      width: 100vw;
      height: 100vh;
      max-width: 100vw;
      border-radius: 0;
      margin: 0;
    }
    
    .wizard-container {
      padding: 0;
    }
    
    .wizard-header {
      padding: var(--spacing-xl) var(--spacing-lg) var(--spacing-md);
    }
    
    .wizard-step-counter {
      font-size: var(--font-xs);
    }
    
    .wizard-step-title {
      font-size: var(--font-lg);
    }
    
    .wizard-content {
      padding: var(--spacing-md);
    }
    
    .wizard-footer {
      padding: var(--spacing-md) var(--spacing-lg);
      gap: var(--spacing-md);
    }
    
    .wizard-footer .btn {
      padding: var(--spacing-md) var(--spacing-lg);
      font-size: var(--font-sm);
      min-height: 44px;
    }
  }
  
  /* Responsive para tablets */
  @media (min-width: 641px) and (max-width: 1024px) {
    .wizard-card {
      max-width: 600px;
      margin: 0 var(--spacing-lg);
    }
  }
  
  /* Responsive para desktop */
  @media (min-width: 1025px) {
    .wizard-card {
      max-width: 500px;
      margin: 0;
    }
  }
  
  /* iOS specific fixes */
  @supports (-webkit-touch-callout: none) {
    .wizard-container {
      height: 100vh;
      height: -webkit-fill-available;
    }
    
    .wizard-card {
      height: 100vh;
      height: -webkit-fill-available;
    }
    
    .wizard-content {
      -webkit-overflow-scrolling: touch;
      overscroll-behavior: none;
    }
  }
  
  /* Dark mode support */
  @media (prefers-color-scheme: dark) {
    .wizard-container {
      background: linear-gradient(135deg, var(--bg-secondary), var(--bg-tertiary));
    }
    
    .wizard-card {
      background: var(--bg-primary);
      border-color: var(--bg-accent);
    }
    
    .wizard-header {
      background: var(--bg-primary);
      border-color: var(--bg-accent);
    }
    
    .wizard-footer {
      background: var(--bg-primary);
      border-color: var(--bg-accent);
    }
    
    .wizard-progress-bar-container {
      background: var(--bg-accent);
    }
    
    .spinner-bg {
      stroke: var(--bg-accent);
    }
  }
  
  /* Reduced motion support */
  @media (prefers-reduced-motion: reduce) {
    .wizard-progress-bar {
      transition: none;
    }
    
    .spinner-svg {
      animation: none;
    }
    
    .spinner-fg {
      animation: none;
    }
  }
  
  /* Asegurar que los botones sean visibles */
  .wizard-footer .btn {
    position: relative;
    z-index: 10;
    min-width: 100px;
    min-height: 44px;
    font-weight: var(--weight-semibold);
    box-shadow: var(--shadow-sm);
    transition: all var(--transition-normal);
  }
  
  .wizard-footer .btn:hover {
    box-shadow: var(--shadow-md);
    transform: translateY(-1px);
  }
  
  .wizard-footer .btn:active {
    transform: translateY(0);
  }
  
  /* Prevenir overflow en el contenido */
  .wizard-content > * {
    max-width: 100%;
    overflow-x: hidden;
  }
  
  /* Asegurar que el footer esté siempre visible */
  .wizard-footer {
    position: sticky;
    bottom: 0;
    background: var(--bg-primary);
    border-top: 1px solid var(--bg-accent);
    z-index: 20;
  }
  
  /* Ajustes específicos para pantallas muy pequeñas */
  @media (max-width: 375px) {
    .wizard-footer {
      padding: var(--spacing-sm) var(--spacing-md);
      gap: var(--spacing-sm);
    }
    
    .wizard-footer .btn {
      min-width: 80px;
      padding: var(--spacing-sm) var(--spacing-md);
      font-size: var(--font-sm);
    }
  }
  
  /* Asegurar que el contenido no se superponga con el footer */
  .wizard-content {
    padding-bottom: calc(var(--spacing-2xl) + 60px);
  }
  
  /* Mejorar la visibilidad en modo oscuro */
  @media (prefers-color-scheme: dark) {
    .wizard-footer {
      background: var(--bg-primary);
      border-top: 1px solid var(--bg-accent);
      box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.1);
    }
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