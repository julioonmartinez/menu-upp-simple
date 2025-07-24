<script>
  import OnboardingStepImagesAndColors from './onboarding/OnboardingStepImagesAndColors.svelte';
  import OnboardingStepCategory from './onboarding/OnboardingStepCategory.svelte';
  import OnboardingStepDish from './onboarding/OnboardingStepDish.svelte';
  import OnboardingStepHeroSlides from './onboarding/OnboardingStepHeroSlides.svelte';
  import OnboardingStepSocialLinks from './onboarding/OnboardingStepSocialLinks.svelte';
  import OnboardingStepQRCode from './onboarding/OnboardingStepQRCode.svelte';
  import { restaurantStore, currentRestaurant } from '../../stores/restaurantStore';
  import { onMount } from 'svelte';

  export let restaurantId;

  let step = 1;
  let loading = true;
  let error = null;
  let stepComponent;

  $: restaurant = $currentRestaurant;

  const steps = [
    'Imágenes y Colores',
    'Categoría',
    'Platillos',
    'Slides Hero',
    'Redes Sociales',
    'QR',
  ];

  onMount(async () => {
    loading = true;
    error = null;
    const result = await restaurantStore.loadRestaurant(restaurantId, true);
    if (!result.success) {
      error = result.error;
    }
    loading = false;
  });

  function nextStep() {
    if (step < steps.length) step += 1;
  }
  function prevStep() {
    if (step > 1) step -= 1;
  }

  async function handleNext() {
    if (stepComponent && typeof stepComponent.save === 'function') {
      const ok = await stepComponent.save();
      if (ok) nextStep();
    } else {
      nextStep();
    }
  }
</script>

<div class="wizard-container flex flex-col items-center justify-center">
  <div class="card wizard-card w-full max-w-xl p-0 shadow-lg relative">
    <div class="wizard-progress-bar-container">
      <div class="wizard-progress-bar" style="width: {(step/steps.length)*100}%"></div>
    </div>
    <div class="wizard-header p-2xl pb-lg border-b border-accent bg-white rounded-t-xl flex-shrink-0">
      <div class="flex items-center justify-between">
        <span class="text-sm text-muted font-medium">Paso {step} de {steps.length}</span>
        <span class="text-lg font-semibold text-primary">{steps[step-1]}</span>
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
      {:else if restaurant}
        {#if step === 1}
          <OnboardingStepImagesAndColors
            bind:this={stepComponent}
            restaurant={restaurant}
            restaurantId={restaurantId}
            on:next={nextStep}
          />
        {/if}
        {#if step === 2}
          <OnboardingStepCategory
            bind:this={stepComponent}
            restaurantId={restaurantId}
            on:next={nextStep}
            on:prev={prevStep}
          />
        {/if}
        {#if step === 3}
          <OnboardingStepDish
            bind:this={stepComponent}
            restaurantId={restaurantId}
            on:next={nextStep}
            on:prev={prevStep}
          />
        {/if}
        {#if step === 4}
          <OnboardingStepHeroSlides
            bind:this={stepComponent}
            restaurantId={restaurantId}
            on:next={nextStep}
            on:prev={prevStep}
          />
        {/if}
        {#if step === 5}
          <OnboardingStepSocialLinks
            bind:this={stepComponent}
            restaurant={restaurant}
            restaurantId={restaurantId}
            on:next={nextStep}
            on:prev={prevStep}
          />
        {/if}
        {#if step === 6}
          <OnboardingStepQRCode
            bind:this={stepComponent}
            restaurant={restaurant}
            restaurantId={restaurantId}
            on:next={nextStep}
            on:prev={prevStep}
          />
        {/if}
      {/if}
    </div>
    <div class="wizard-footer px-2xl py-xl flex items-center justify-end gap-lg bg-white border-t border-accent rounded-b-xl flex-shrink-0 sticky bottom-0 z-10">
      {#if step > 1}
        <button class="btn btn-secondary" on:click={prevStep}>Atrás</button>
      {/if}
      {#if step < steps.length}
        <button class="btn btn-primary" on:click={handleNext}>Siguiente</button>
      {:else}
        <button class="btn btn-primary" on:click={() => window.location.href = '/dashboard'}>Finalizar</button>
      {/if}
    </div>
  </div>
</div>

<style>
  .wizard-container {
    background: var(--bg-secondary);
    width: 100vw;
    height: 100vh;
    min-height: 100vh;
    padding: 0;
  }
  .wizard-card {
    height: 100vh;
    max-height: 100vh;
    display: flex;
    flex-direction: column;
    justify-content: flex-start;
    border-radius: var(--radius-xl);
  }
  @media (max-width: 640px) {
    .wizard-card {
      border-radius: 0;
      max-width: 100vw;
      width: 100vw;
      height: 100vh;
    }
  }
  .wizard-progress-bar-container {
    width: 100%;
    height: 6px;
    background: var(--bg-accent);
    border-radius: var(--radius-xl) var(--radius-xl) 0 0;
    overflow: hidden;
  }
  .wizard-progress-bar {
    height: 100%;
    background: var(--primary-gradient);
    transition: width 0.4s var(--transition-bounce);
  }
  .wizard-header {
    border-bottom: 1px solid var(--bg-accent);
    background: var(--bg-primary);
    border-radius: var(--radius-xl) var(--radius-xl) 0 0;
    position: static;
    top: 0;
  }
  .wizard-footer {
    border-top: 1px solid var(--bg-accent);
    background: var(--bg-primary);
    border-radius: 0 0 var(--radius-xl) var(--radius-xl);
    position: static;
    bottom: 0;
  }
  .wizard-content {
    min-height: 340px;
    animation: fadeIn 0.5s;
    overflow-y: auto;
    flex: 1 1 0%;
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