<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { categoryService } from '../../../services/index.ts';
  export let restaurantId: string;
  export let initialCategory: any = null;

  const dispatch = createEventDispatcher();

  let formData = {
    name: initialCategory?.name || '',
    description: initialCategory?.description || ''
  };
  let errors: { [key: string]: string } = {};
  let touched: { [key: string]: boolean } = {};
  let isSubmitting = false;
  let error: string | null = null;

  function validate() {
    errors = {};
    if (!formData.name.trim()) {
      errors.name = 'El nombre es requerido';
    } else if (formData.name.trim().length < 2) {
      errors.name = 'El nombre debe tener al menos 2 caracteres';
    } else if (formData.name.trim().length > 100) {
      errors.name = 'El nombre no puede exceder 100 caracteres';
    }
    if (formData.description && formData.description.length > 500) {
      errors.description = 'La descripción no puede exceder 500 caracteres';
    }
    return Object.keys(errors).length === 0;
  }

  function handleInput(field: string, event: Event) {
    const target = event.target as HTMLInputElement | HTMLTextAreaElement;
    formData[field] = target.value;
    touched[field] = true;
    formData = { ...formData };
    touched = { ...touched };
  }

  // Exponer método save() para el wizard
  export async function save() {
    touched = { name: true, description: true };
    if (!validate()) {
      return false;
    }
    isSubmitting = true;
    error = null;
    try {
      const result = await categoryService.createCategory({
        name: formData.name.trim(),
        description: formData.description.trim() || undefined,
        restaurantId
      });
      if (result.success) {
        dispatch('created', { category: result.category });
        return true;
      } else {
        error = result.error;
        return false;
      }
    } catch (e) {
      error = e.message || 'Error desconocido';
      return false;
    } finally {
      isSubmitting = false;
    }
  }
</script>

<div class="onboarding-category-form flex flex-col gap-xl w-full max-w-lg mx-auto">
  <h2 class="text-2xl font-bold text-primary text-center mb-lg">¡Crea tu primera categoría!</h2>
  <div class="flex flex-col gap-lg">
    <label class="font-medium text-secondary" for="category-name">Nombre de la categoría <span class="text-error">*</span></label>
    <input
      id="category-name"
      class="input"
      type="text"
      placeholder="Ej: Entradas, Platos principales, Postres..."
      bind:value={formData.name}
      on:input={(e) => handleInput('name', e)}
      disabled={isSubmitting}
      required
    />
    {#if touched.name && errors.name}
      <p class="form-field-error">{errors.name}</p>
    {/if}
  </div>
  <div class="flex flex-col gap-lg">
    <label class="font-medium text-secondary" for="category-description">Descripción (opcional)</label>
    <textarea
      id="category-description"
      class="input"
      placeholder="Descripción breve de esta categoría..."
      bind:value={formData.description}
      on:input={(e) => handleInput('description', e)}
      disabled={isSubmitting}
      rows="3"
    ></textarea>
    {#if touched.description && errors.description}
      <p class="form-field-error">{errors.description}</p>
    {/if}
  </div>
  {#if error}
    <div class="error-state mt-lg">{error}</div>
  {/if}
  {#if isSubmitting}
    <div class="text-center text-muted mt-lg animate-pulse">Guardando...</div>
  {/if}
</div>

<style>
.onboarding-category-form {
  padding: 0;
  margin: 0 auto;
  box-sizing: border-box;
}
.form-field-error {
  font-size: var(--font-xs);
  color: var(--error);
  margin: 0;
}
</style> 