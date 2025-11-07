<!-- src/components/restaurant/CategoryForm.svelte -->
<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { categoryService } from '../../services/index.ts';
  import type { Category, CategoryCreate, CategoryUpdate } from '../../interfaces/category.ts';
  import './CategoryForm.css';
  // Props
  export let category: Category | null = null;
  export let restaurantId: string;
  export let isSubmitting = false;
  export let error: string | null = null;

  // Event dispatcher
  const dispatch = createEventDispatcher();

  // Form data
  let formData : any = {
    name: category?.name || '',
    description: category?.description || ''
  };

  // Validation state
  let errors: { [key: string]: string } = {};
  let touched: { [key: string]: boolean } = {};

  // Computed
  $: isEditing = !!category;
  $: isValid = Object.keys(errors).length === 0 && formData.name.trim().length > 0;
  $: isDirty = category ? 
    (formData.name !== category.name || formData.description !== (category.description || '')) :
    (formData.name.trim().length > 0 || formData.description.trim().length > 0);

  // Reactive validation
  $: {
    validateField('name', formData.name);
    validateField('description', formData.description);
  }

  // Methods
  function validateField(field: string, value: string) {
    delete errors[field];

    switch (field) {
      case 'name':
        if (!value.trim()) {
          errors.name = 'El nombre es requerido';
        } else if (value.trim().length < 2) {
          errors.name = 'El nombre debe tener al menos 2 caracteres';
        } else if (value.trim().length > 100) {
          errors.name = 'El nombre no puede exceder 100 caracteres';
        }
        break;

      case 'description':
        if (value && value.length > 500) {
          errors.description = 'La descripción no puede exceder 500 caracteres';
        }
        break;
    }

    // Trigger reactivity
    errors = { ...errors };
  }

  function handleInput(field: string, event: Event) {
    const target = event.target as HTMLInputElement | HTMLTextAreaElement;
    formData[field] = target.value;
    touched[field] = true;
    
    // Trigger reactivity
    formData = { ...formData };
    touched = { ...touched };
  }

  function handleSubmit(event: Event) {
    event.preventDefault();
    
    if (!isValid || isSubmitting) return;

    // Mark all fields as touched
    touched = {
      name: true,
      description: true
    };

    // Final validation
    const finalData = {
      name: formData.name.trim(),
      description: formData.description.trim() || undefined
    };

    // Dispatch submit event
    dispatch('submit', finalData);
  }

  function handleCancel() {
    dispatch('cancel');
  }

  function getFieldError(field: string): string | null {
    return touched[field] && errors[field] ? errors[field] : null;
  }

  function getFieldClasses(field: string): string {
    const baseClasses = 'input';
    const errorClasses = getFieldError(field) ? ' input-error' : '';
    return baseClasses + errorClasses;
  }

  // Auto-resize textarea
  function autoResize(node: HTMLTextAreaElement) {
    function resize() {
      node.style.height = 'auto';
      node.style.height = node.scrollHeight + 'px';
    }

    // Initial resize
    resize();

    // Event listener
    node.addEventListener('input', resize);

    return {
      destroy() {
        node.removeEventListener('input', resize);
      }
    };
  }
</script>

<form class="category-form" on:submit={handleSubmit}>
  <!-- Error Display -->
  {#if error}
    <div class="error-state">
      <i>⚠️</i>
      <h3>Error al {isEditing ? 'actualizar' : 'crear'} categoría</h3>
      <p>{error}</p>
    </div>
  {/if}

  <!-- Form Fields -->
  <div class="form-fields">
    <!-- Name Field -->
    <div class="form-field">
      <label for="category-name" class="form-label">
        Nombre de la categoría
        <span class="form-required">*</span>
      </label>
      <input
        id="category-name"
        type="text"
        class={getFieldClasses('name')}
        placeholder="Ej: Entradas, Platos principales, Postres..."
        value={formData.name}
        on:input={(e) => handleInput('name', e)}
        on:blur={() => touched.name = true}
        disabled={isSubmitting}
        required
      />
      {#if getFieldError('name')}
        <p class="form-field-error">{getFieldError('name')}</p>
      {/if}
      <p class="form-field-hint">
        Nombre que aparecerá en tu menú para organizar los platillos
      </p>
    </div>

    <!-- Description Field -->
    <div class="form-field">
      <label for="category-description" class="form-label">
        Descripción (opcional)
      </label>
      <textarea
        id="category-description"
        class={getFieldClasses('description')}
        placeholder="Descripción breve de esta categoría..."
        value={formData.description}
        on:input={(e) => handleInput('description', e)}
        on:blur={() => touched.description = true}
        disabled={isSubmitting}
        rows="3"
        use:autoResize
      ></textarea>
      {#if getFieldError('description')}
        <p class="form-field-error">{getFieldError('description')}</p>
      {/if}
      <p class="form-field-hint">
        Opcional: Añade una descripción para ayudar a tus clientes a entender esta categoría
      </p>
    </div>
  </div>

  <!-- Form Actions -->
  <div class="form-actions">
    <button
      type="button"
      class="btn btn-secondary"
      on:click={handleCancel}
      disabled={isSubmitting}
    >
      Cancelar
    </button>
    
    <button
      type="submit"
      class="btn btn-primary"
      disabled={!isValid || isSubmitting}
    >
      {#if isSubmitting}
        <svg class="btn-icon animate-spin" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        {isEditing ? 'Actualizando...' : 'Creando...'}
      {:else}
        <svg class="btn-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
        </svg>
        {isEditing ? 'Actualizar Categoría' : 'Crear Categoría'}
      {/if}
    </button>
  </div>

  <!-- Form Info -->
  <div class="form-info">
    <div class="form-info-item">
      <svg class="form-info-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      <p class="form-info-text">
        Las categorías te ayudan a organizar tu menú y facilitan la navegación a tus clientes.
      </p>
    </div>
    
    {#if isDirty}
      <div class="form-info-item">
        <svg class="form-info-icon text-warning" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
        </svg>
        <p class="form-info-text text-warning">
          Tienes cambios sin guardar
        </p>
      </div>
    {/if}
  </div>
</form>

