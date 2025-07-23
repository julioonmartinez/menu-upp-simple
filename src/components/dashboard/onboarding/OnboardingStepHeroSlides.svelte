<script>
  import OnboardingHeroSlidesForm from './OnboardingHeroSlidesForm.svelte';
  import { createEventDispatcher } from 'svelte';
  export let restaurantId;
  const dispatch = createEventDispatcher();
  let formRef;

  // Exponer método save() para el wizard
  export async function save() {
    if (formRef && typeof formRef.save === 'function') {
      return await formRef.save();
    }
    return false;
  }
</script>

<div class="flex flex-col items-center justify-center w-full">
  <OnboardingHeroSlidesForm
    bind:this={formRef}
    restaurantId={restaurantId}
    on:saved={(e) => dispatch('next', e.detail)}
  />
</div> 