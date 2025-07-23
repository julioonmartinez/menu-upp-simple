<script>
  import OnboardingCategoryForm from './OnboardingCategoryForm.svelte';
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

<div class="flex flex-col items-center justify-center h-full w-full">
  <OnboardingCategoryForm
    bind:this={formRef}
    restaurantId={restaurantId}
  />
</div> 