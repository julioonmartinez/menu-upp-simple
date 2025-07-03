<!-- src/components/restaurant/CategoryForm.svelte -->
<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { categoryService } from '../../services/index.ts';
  import type { Category, CategoryCreate, CategoryUpdate } from '../../interfaces/category.ts';

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

<style>
  /* Component-specific styles that complement global styles */
  .category-form {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-xl);
  }

  /* Form Fields */
  .form-fields {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-lg);
  }

  .form-field {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-sm);
  }

  .form-label {
    font-size: var(--font-sm);
    font-weight: var(--weight-medium);
    color: var(--text-secondary);
    display: flex;
    align-items: center;
    gap: var(--spacing-xs);
  }

  .form-required {
    color: var(--error);
    font-weight: var(--weight-semibold);
  }

  /* Input overrides for form-specific styling */
  .input {
    width: 100%;
    padding: var(--spacing-md) var(--spacing-lg);
    border: 1px solid var(--bg-accent);
    border-radius: var(--radius-lg);
    font-size: var(--font-base);
    background: var(--bg-primary);
    color: var(--text-primary);
    transition: all var(--transition-normal);
    min-height: 44px;
  }

  .input:focus {
    outline: none;
    border-color: var(--primary-color);
    box-shadow: 0 0 0 3px rgba(255, 107, 53, 0.1);
  }

  .input:disabled {
    background: var(--bg-tertiary);
    color: var(--text-muted);
    cursor: not-allowed;
  }

  .input-error {
    border-color: var(--error);
  }

  .input-error:focus {
    border-color: var(--error);
    box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.1);
  }

  textarea.input {
    resize: none;
    min-height: 80px;
    max-height: 200px;
    font-family: inherit;
    line-height: var(--leading-relaxed);
  }

  .form-field-error {
    font-size: var(--font-xs);
    color: var(--error);
    margin: 0;
    display: flex;
    align-items: center;
    gap: var(--spacing-xs);
  }

  .form-field-hint {
    font-size: var(--font-xs);
    color: var(--text-muted);
    margin: 0;
    line-height: var(--leading-relaxed);
  }

  /* Form Actions */
  .form-actions {
    display: flex;
    justify-content: flex-end;
    gap: var(--spacing-md);
    padding-top: var(--spacing-lg);
    border-top: 1px solid var(--bg-accent);
  }

  /* Button overrides for form-specific styling */
  .btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: var(--spacing-sm);
    padding: var(--spacing-md) var(--spacing-xl);
    border-radius: var(--radius-lg);
    font-weight: var(--weight-semibold);
    font-size: var(--font-base);
    line-height: 1;
    transition: all var(--transition-normal);
    cursor: pointer;
    border: none;
    min-height: 44px;
    text-decoration: none;
    position: relative;
    overflow: hidden;
    white-space: nowrap;
  }

  .btn-primary {
    background: var(--primary-gradient);
    color: var(--text-inverse);
    box-shadow: var(--shadow-sm);
    min-width: 140px;
  }

  .btn-primary:hover:not(:disabled) {
    box-shadow: var(--primary-glow);
    transform: translateY(-2px);
  }

  .btn-primary:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
  }

  .btn-secondary {
    background: var(--bg-primary);
    color: var(--text-primary);
    border: 1px solid var(--bg-accent);
  }

  .btn-secondary:hover:not(:disabled) {
    border-color: var(--primary-color);
    color: var(--primary-color);
    background: var(--bg-tertiary);
  }

  .btn-secondary:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .btn-icon {
    width: 1.25rem;
    height: 1.25rem;
    flex-shrink: 0;
  }

  /* Form Info */
  .form-info {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-md);
    padding: var(--spacing-lg);
    background: var(--bg-tertiary);
    border-radius: var(--radius-lg);
    border: 1px solid var(--bg-accent);
  }

  .form-info-item {
    display: flex;
    align-items: flex-start;
    gap: var(--spacing-sm);
  }

  .form-info-icon {
    width: 1rem;
    height: 1rem;
    color: var(--text-muted);
    flex-shrink: 0;
    margin-top: 0.125rem;
  }

  .form-info-icon.text-warning {
    color: var(--warning);
  }

  .form-info-text {
    font-size: var(--font-xs);
    color: var(--text-muted);
    margin: 0;
    line-height: var(--leading-relaxed);
  }

  .form-info-text.text-warning {
    color: var(--warning);
  }

  /* Responsive Design */
  @media (max-width: 640px) {
    .form-actions {
      flex-direction: column-reverse;
    }

    .btn {
      justify-content: center;
      width: 100%;
    }
  }

  /* Touch device optimizations */
  @media (hover: none) and (pointer: coarse) {
    .btn {
      min-height: 48px;
      padding: var(--spacing-lg) var(--spacing-xl);
    }
    
    .input {
      min-height: 48px;
      padding: var(--spacing-lg);
    }
  }

  /* Reduced motion support */
  @media (prefers-reduced-motion: reduce) {
    .btn,
    .input {
      transition: none;
    }
    
    .btn:hover {
      transform: none;
    }
  }

  /* Dark mode support */
  @media (prefers-color-scheme: dark) {
    .form-info {
      background: var(--bg-accent);
      border-color: var(--bg-tertiary);
    }
    
    .input {
      background: var(--bg-tertiary);
      border-color: var(--bg-accent);
    }
    
    .input:focus {
      background: var(--bg-primary);
    }
  }
</style>