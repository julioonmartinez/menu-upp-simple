<script>
  import OnboardingDishForm from './OnboardingDishForm.svelte';
  import { dishService, categoryService } from '../../../services/index.ts';
  import { createEventDispatcher, onMount } from 'svelte';

  export let restaurantId;
  const dispatch = createEventDispatcher();

  let categories = [];
  let formRef;

  async function loadCategories() {
    const result = await categoryService.getAllCategories(restaurantId);
    if (result.success) {
      categories = result.data;
    }
  }

  onMount(loadCategories);
  $: if (restaurantId) { loadCategories(); }

  // Exponer método save() para el wizard
  export async function save() {
    if (formRef && typeof formRef.save === 'function') {
      return await formRef.save();
    }
    return false;
  }
</script>

<div class="flex flex-col items-center justify-center w-full">
  <OnboardingDishForm
    bind:this={formRef}
    restaurantId={restaurantId}
    categories={categories}
  />
</div> 