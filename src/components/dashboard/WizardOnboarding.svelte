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

<div class="wizard-container flex flex-col items-center justify-center">
  <div class="card wizard-card w-full max-w-xl p-0 shadow-lg relative">
    <div class="wizard-progress-bar-container">
      <div class="wizard-progress-bar" style="width: {(currentStep/steps.length)*100}%"></div>
    </div>
    <div class="wizard-header p-2xl pb-lg border-b border-accent bg-white rounded-t-xl flex-shrink-0">
      <div class="flex items-center justify-between">
        <span class="text-sm text-muted font-medium">Paso {currentStep} de {steps.length}</span>
        <span class="text-lg font-semibold text-primary">{steps[currentStep-1]}</span>
      </div>
    </div>
    <div class="wizard-content p-xs pb-5xl flex-1 overflow-y-auto min-h-[200px] animate-fade-in">
      {#if loading}
        <div class="wizard-loading flex flex-col items-center justify-center h-full w-full animate-fade-in">
          <div class="spinner mb-md" aria-label="Cargando">
            <svg class="spinner-svg" viewBox="0 0 50 50">
              <circle class="spinner-bg" cx="25" cy="25" r="20" fill="none" stroke-width="6" />
              <circle class="spinner-fg" cx="25" cy="25" r="20" fill="none" stroke-width="6" />
            </svg>
          </div>
          <span class="text-primary font-semibold text-lg">Cargando…</span>
        </div>
      {:else if error}
        <p class="text-error">{error}</p>
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
        <div class="flex flex-col items-center justify-center h-full">
          <p class="text-error text-center">Paso no válido</p>
          <button class="btn btn-primary mt-md" on:click={() => navigateToStep(1)}>
            Ir al primer paso
          </button>
        </div>
      {/if}
    </div>
    <div class="wizard-footer px-sm py-sm flex items-center justify-end gap-lg bg-white border-t border-accent rounded-b-xl flex-shrink-0 sticky bottom-0 z-10">
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
  .wizard-container {
    background: linear-gradient(135deg, #fafbfc, #f8fafc);
    width: 100vw;
    height: 100dvh;
    min-height: 100dvh;
    padding: 0;
    padding-bottom: env(safe-area-inset-bottom, 0);
  }
  
  .wizard-card {
    height: 100dvh;
    max-height: 100dvh;
    display: flex;
    flex-direction: column;
    justify-content: flex-start;
    border-radius: var(--radius-xl);
    background: var(--bg-primary);
    box-shadow: var(--shadow-xl);
    border: 1px solid var(--bg-accent);
    position: relative;
    overflow: hidden;
  }
  
  .wizard-card::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 3px;
    background: linear-gradient(90deg, var(--primary-color), var(--secondary-color));
    opacity: 0.7;
    z-index: 10;
  }
  
  @media (max-width: 640px) {
    .wizard-card {
      border-radius: 0;
      max-width: 100vw;
      width: 100vw;
      height: 100dvh;
    }
  }
  
  .wizard-progress-bar-container {
    width: 100%;
    height: 6px;
    background: linear-gradient(135deg, #f1f5f9, #e2e8f0);
    border-radius: var(--radius-xl) var(--radius-xl) 0 0;
    overflow: hidden;
    position: relative;
    z-index: 5;
  }
  
  .wizard-progress-bar {
    height: 100%;
    background: linear-gradient(90deg, var(--primary-color), var(--secondary-color));
    transition: width 0.4s var(--transition-bounce);
    box-shadow: 0 2px 8px rgba(79, 70, 229, 0.3);
  }
  
  .wizard-header {
    /* background: linear-gradient(135deg, #fafbfc, #f8fafc); */
    border-bottom: 1px solid var(--bg-accent);
    /* border-radius: var(--radius-xl) var(--radius-xl) 0 0; */
    position: sticky;
    top: 0;
    z-index: 5;
    position: relative;
    overflow: hidden;
  }
  
  .wizard-header::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 2px;
    background: linear-gradient(90deg, var(--primary-color), var(--secondary-color));
    opacity: 0.5;
  }
  
  .wizard-header span:first-child {
    color: var(--text-secondary);
    font-weight: var(--weight-medium);
    position: relative;
    z-index: 2;
  }
  
  .wizard-header span:last-child {
    color: var(--primary-color);
    font-weight: var(--weight-bold);
    position: relative;
    z-index: 2;
  }
  
  .wizard-footer {
    background: linear-gradient(135deg, #fafbfc, #f8fafc);
    border-top: 1px solid var(--bg-accent);
    border-radius: 0 0 var(--radius-xl) var(--radius-xl);
    position: sticky;
    bottom: 0;
    padding-bottom: calc(var(--space-sm) + env(safe-area-inset-bottom, 0));
    z-index: 5;
    position: relative;
    overflow: hidden;
  }
  
  .wizard-footer::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 2px;
    background: linear-gradient(90deg, var(--primary-color), var(--secondary-color));
    opacity: 0.5;
  }
  
  .wizard-footer .btn {
    position: relative;
    z-index: 2;
    box-shadow: var(--shadow-sm);
    transition: all var(--transition-normal);
  }
  
  .wizard-footer .btn:hover {
    box-shadow: var(--shadow-lg);
    transform: translateY(-2px);
  }
  
  .wizard-content {
    min-height: 340px;
    animation: fadeIn 0.5s;
    overflow-y: auto;
    flex: 1 1 0%;
    /* background: var(--bg-primary); */
    position: relative;
    z-index: 1;
  }
  
  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(20px); }
    to { opacity: 1; transform: translateY(0); }
  }
  
  .wizard-loading {
    min-height: 200px;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-direction: column;
    width: 100%;
    height: 100%;
    /* background: linear-gradient(135deg, #fafbfc, #f8fafc); */
    /* border-radius: var(--radius-xl); */
    animation: fadeIn 0.5s;
    /* border: 1px solid var(--bg-accent); */
    position: relative;
    overflow: hidden;
  }
  
  /* .wizard-loading::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 3px;
    background: linear-gradient(90deg, var(--primary-color), var(--secondary-color));
    opacity: 0.7;
  } */
  
  .wizard-loading span {
    position: relative;
    z-index: 2;
    color: var(--primary-color);
    font-weight: var(--weight-bold);
  }
  
  .spinner {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 56px;
    height: 56px;
    margin-bottom: 1rem;
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
  
  /* Responsive mejorado */
  @media (max-width: 768px) {
    .wizard-header {
      padding: var(--spacing-xl) var(--spacing-lg);
    }
    
    .wizard-footer {
      padding: var(--spacing-lg);
    }
    
    .wizard-loading {
      padding: var(--spacing-xl);
    }
  }
  
  @media (max-width: 480px) {
    .wizard-header {
      padding: var(--spacing-lg) var(--spacing-md);
    }
    
    .wizard-header span:first-child {
      font-size: var(--font-sm);
    }
    
    .wizard-header span:last-child {
      font-size: var(--font-base);
    }
    
    .wizard-footer {
      padding: var(--spacing-md);
    }
    
    .wizard-footer .btn {
      padding: var(--spacing-sm) var(--spacing-lg);
      font-size: var(--font-sm);
    }
    
    .wizard-loading {
      padding: var(--spacing-lg);
    }
    
    .spinner {
      width: 48px;
      height: 48px;
    }
    
    .spinner-svg {
      width: 48px;
      height: 48px;
    }
  }
  
  @media (max-width: 360px) {
    .wizard-header {
      padding: var(--spacing-md) var(--spacing-sm);
    }
    
    .wizard-header span:first-child {
      font-size: var(--font-xs);
    }
    
    .wizard-header span:last-child {
      font-size: var(--font-sm);
    }
    
    .wizard-footer {
      padding: var(--spacing-sm);
    }
    
    .wizard-footer .btn {
      padding: var(--spacing-xs) var(--spacing-md);
      font-size: var(--font-xs);
    }
    
    .wizard-loading {
      padding: var(--spacing-md);
    }
    
    .spinner {
      width: 40px;
      height: 40px;
    }
    
    .spinner-svg {
      width: 40px;
      height: 40px;
    }
  }
  
  /* Dark mode support */
  @media (prefers-color-scheme: dark) {
    .wizard-container {
      background: linear-gradient(135deg, #1e293b, #334155);
    }
    
    .wizard-card {
      background: linear-gradient(135deg, #1e293b, #334155);
      border-color: var(--bg-accent);
    }
    
    .wizard-progress-bar-container {
      background: linear-gradient(135deg, #334155, #475569);
    }
    
    .wizard-header {
      /* background: linear-gradient(135deg, #1e293b, #334155); */
      border-color: var(--bg-accent);
    }
    
    .wizard-footer {
      background: linear-gradient(135deg, #1e293b, #334155);
      border-color: var(--bg-accent);
    }
    
    .wizard-content {
      /* background: linear-gradient(135deg, #1e293b, #334155); */
    }
    
    .wizard-loading {
      background: linear-gradient(135deg, #1e293b, #334155);
      border-color: var(--bg-accent);
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
    
    .wizard-footer .btn:hover {
      transform: none;
    }
    
    .spinner-svg {
      animation: none;
    }
    
    .spinner-fg {
      animation: none;
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