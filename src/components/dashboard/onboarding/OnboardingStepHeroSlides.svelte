<script>
  import OnboardingHeroSlidesForm from './OnboardingHeroSlidesForm.svelte';
  import { createEventDispatcher } from 'svelte';
  export let restaurantId;
  const dispatch = createEventDispatcher();
  let formRef;

  // Exponer método save() para el wizard
  export async function save() {
    // Este paso es opcional, siempre retorna true
    // Si hay un formulario activo, intenta guardar pero no bloquea si falla
    if (formRef && typeof formRef.save === 'function') {
      try {
        await formRef.save();
      } catch (error) {
        // Si hay error, no bloqueamos el wizard ya que es opcional
        console.warn('Error saving hero slides (optional step):', error);
      }
    }
    return true;
  }
</script>

<div class="flex flex-col items-center justify-center w-full">
  <!-- <div class="text-center mb-6">
    <h3 class="text-lg font-semibold text-gray-800 mb-2">Hero Slides (Opcional)</h3>
    <p class="text-sm text-gray-600 mb-4">
      Configura las imágenes destacadas de tu restaurante. Puedes saltar este paso y configurarlo más tarde.
    </p>
    <button 
      class="btn btn-secondary text-sm"
      on:click={() => dispatch('next')}
    >
      Saltar este paso
    </button>
  </div> -->
  
  <OnboardingHeroSlidesForm
    bind:this={formRef}
    restaurantId={restaurantId}
    on:saved={(e) => dispatch('next', e.detail)}
  />
</div> 