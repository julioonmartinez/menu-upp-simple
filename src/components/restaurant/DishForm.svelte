<!-- src/components/restaurant/DishForm.svelte -->
<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { dishUtils } from '../../services/index.ts';
  import type { Dish, DishCreate, DishUpdate, DishOption, NutritionalInfo } from '../../interfaces/dish.ts';
  import type { Category } from '../../interfaces/category.ts';
  import { toastStore } from '../../stores/toastStore.ts';

  // Props
  export let dish: Dish | null = null;
  export let categories: Category[] = [];
  export let restaurantId: string;
  export let isSubmitting = false;
  export let error: string | null = null;

  // Event dispatcher
  const dispatch = createEventDispatcher();

  // Form data
  let formData: any = {
    name: dish?.name || '',
    description: dish?.description || '',
    price: dish?.price || 0,
    categoryId: dish?.categoryId || '',
    inStock: dish?.inStock ?? true,
    discount: dish?.discount || 0,
    nutritionalInfo: {
      calories: dish?.nutritionalInfo?.calories || 0,
      protein: dish?.nutritionalInfo?.protein || 0,
      carbs: dish?.nutritionalInfo?.carbs || 0,
      fat: dish?.nutritionalInfo?.fat || 0,
      allergens: dish?.nutritionalInfo?.allergens || []
    }
  };

  // Image handling
  let imageFile: File | null = null;
  let imagePreview: string | null = dish?.image || null;
  let dragActive = false;

  // Advanced sections
  let showNutritionalInfo = false;
  let showAdvancedOptions = false;

  // Validation state
  let errors: { [key: string]: string } = {};
  let touched: { [key: string]: boolean } = {};
  let submitted = false; // Track if form has been submitted

  // Computed
  $: isEditing = !!dish;
  $: isValid = Object.keys(errors).length === 0 && 
              formData.name.trim().length > 0 && 
              formData.price > 0 &&
              formData.categoryId.length > 0;
  
  $: isDirty = dish ? 
    (formData.name !== dish.name || 
     formData.description !== dish.description ||
     formData.price !== dish.price ||
     formData.categoryId !== dish.categoryId ||
     formData.inStock !== dish.inStock ||
     formData.discount !== (dish.discount || 0) ||
     !!imageFile) :
    (formData.name.trim().length > 0 || 
     formData.price > 0 ||
     !!imageFile);

  $: discountedPrice = dishUtils.calculateDiscountedPrice(formData.price, formData.discount);
  $: hasDiscount = formData.discount > 0;

  // Reactive validation - only run when fields are touched or form is submitted
  $: {
    if (submitted || touched.name) validateField('name', formData.name);
    if (submitted || touched.description) validateField('description', formData.description);
    if (submitted || touched.price) validateField('price', formData.price.toString());
    if (submitted || touched.categoryId) validateField('categoryId', formData.categoryId);
    if (submitted || touched.discount) validateField('discount', formData.discount.toString());
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
        } else if (value.trim().length > 200) {
          errors.name = 'El nombre no puede exceder 200 caracteres';
        }
        break;

      case 'description':
        if (value.trim().length > 0 && value.trim().length < 10) {
          errors.description = 'La descripción debe tener al menos 10 caracteres';
        } else if (value.trim().length > 1000) {
          errors.description = 'La descripción no puede exceder 1000 caracteres';
        }
        break;

      case 'price':
        const price = parseFloat(value);
        if (isNaN(price) || price <= 0) {
          errors.price = 'El precio debe ser mayor a 0';
        } else if (price > 10000) {
          errors.price = 'El precio no puede exceder $10,000';
        }
        break;

      case 'categoryId':
        if (!value.trim()) {
          errors.categoryId = 'La categoría es requerida';
        }
        break;

      case 'discount':
        const discount = parseFloat(value);
        if (discount < 0 || discount > 100) {
          errors.discount = 'El descuento debe estar entre 0% y 100%';
        }
        break;
    }

    errors = { ...errors };
  }

  function handleInput(field: string, event: Event) {
    const target = event.target as HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement;
    
    if (field === 'price' || field === 'discount') {
      const numValue = parseFloat(target.value) || 0;
      formData[field] = numValue;
    } else if (field === 'inStock') {
      const checkbox = target as HTMLInputElement;
      formData.inStock = checkbox.checked;
    } else {
      formData[field] = target.value;
    }
    
    touched[field] = true;
    formData = { ...formData };
    touched = { ...touched };
  }

  function handleNutritionalInput(field: keyof NutritionalInfo, event: Event) {
    const target = event.target as HTMLInputElement;
    
    if (field === 'allergens') {
      // Handle allergens as comma-separated values
      const allergens = target.value.split(',').map(a => a.trim()).filter(a => a.length > 0);
      formData.nutritionalInfo.allergens = allergens;
    } else {
      const numValue = parseFloat(target.value) || 0;
      formData.nutritionalInfo[field] = numValue;
    }
    
    formData = { ...formData };
  }

  function handleImageSelect(event: Event) {
    const target = event.target as HTMLInputElement;
    const file = target.files?.[0];
    
    if (file) {
      handleImageFile(file);
    }
  }

  function handleImageFile(file: File) {
    // Validate image
    const validation = dishUtils.validateImage(file);
    if (!validation.isValid) {
      alert(validation.error);
      return;
    }

    imageFile = file;
    
    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      imagePreview = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  }

  function removeImage() {
    imageFile = null;
    imagePreview = dish?.image || null;
    
    // Reset file input
    const fileInput = document.getElementById('dish-image') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }
  }

  function handleDragOver(event: DragEvent) {
    event.preventDefault();
    dragActive = true;
  }

  function handleDragLeave(event: DragEvent) {
    event.preventDefault();
    dragActive = false;
  }

  function handleDrop(event: DragEvent) {
    event.preventDefault();
    dragActive = false;
    
    const file = event.dataTransfer?.files[0];
    if (file) {
      handleImageFile(file);
    }
  }

  function handleSubmit(event: Event) {
    event.preventDefault();
    
    if (isSubmitting) return;

    // Mark form as submitted to trigger validation
    submitted = true;
    
    // Mark all fields as touched to show errors
    touched = {
      name: true,
      description: true,
      price: true,
      categoryId: true,
      discount: true
    };

    // Force validation of all fields
    validateField('name', formData.name);
    validateField('description', formData.description);
    validateField('price', formData.price.toString());
    validateField('categoryId', formData.categoryId);
    validateField('discount', formData.discount.toString());

    // If there are validation errors, don't submit
    if (Object.keys(errors).length > 0) {
      // Mostrar notificación de error de validación con detalles
      const errorFields = Object.keys(errors);
      const errorCount = errorFields.length;
      const fieldNames = {
        name: 'nombre',
        description: 'descripción', 
        price: 'precio',
        categoryId: 'categoría',
        discount: 'descuento'
      };
      
      const fieldList = errorFields.map(field => fieldNames[field as keyof typeof fieldNames] || field).join(', ');
      
      toastStore.error(
        errorCount === 1 
          ? `Error en el campo: ${fieldList}`
          : `Errores en los campos: ${fieldList}`
      );
      return;
    }

    // Prepare final data
    const finalData: DishCreate | DishUpdate = {
      name: formData.name.trim(),
      description: formData.description.trim(),
      price: formData.price,
      categoryId: formData.categoryId,
      inStock: formData.inStock,
      discount: formData.discount > 0 ? formData.discount : undefined
    };

    // Add nutritional info if provided
    const hasNutritionalData = formData.nutritionalInfo.calories > 0 ||
                              formData.nutritionalInfo.protein > 0 ||
                              formData.nutritionalInfo.carbs > 0 ||
                              formData.nutritionalInfo.fat > 0 ||
                              formData.nutritionalInfo.allergens.length > 0;

    if (hasNutritionalData) {
      finalData.nutritionalInfo = {
        calories: formData.nutritionalInfo.calories || undefined,
        protein: formData.nutritionalInfo.protein || undefined,
        carbs: formData.nutritionalInfo.carbs || undefined,
        fat: formData.nutritionalInfo.fat || undefined,
        allergens: formData.nutritionalInfo.allergens.length > 0 ? formData.nutritionalInfo.allergens : undefined
      };
    }

    // Dispatch submit event
    dispatch('submit', {
      dishData: finalData,
      image: imageFile
    });
  }

  function handleCancel() {
    // Si hay cambios sin guardar, mostrar notificación
    if (isDirty) {
      toastStore.info('Cambios descartados');
    }
    
    submitted = false;
    errors = {};
    touched = {};
    dispatch('cancel');
  }

  function getFieldError(field: string): string | null {
    return (touched[field] || submitted) && errors[field] ? errors[field] : null;
  }

  function getFieldClasses(field: string): string {
    const baseClasses = 'input';
    const errorClasses = getFieldError(field) ? ' input-error' : '';
    return baseClasses + errorClasses;
  }

  function getCategoryName(categoryId: string): string {
    const category = categories.find(c => c.id === categoryId);
    return category?.name || '';
  }

  // Auto-resize textarea
  function autoResize(node: HTMLTextAreaElement) {
    function resize() {
      node.style.height = 'auto';
      node.style.height = node.scrollHeight + 'px';
    }

    resize();
    node.addEventListener('input', resize);

    return {
      destroy() {
        node.removeEventListener('input', resize);
      }
    };
  }
</script>

<form class="dish-form" on:submit={handleSubmit}>
  <!-- Error Display -->
  {#if error}
    <div class="error-state">
      <i>⚠️</i>
      <h3>Error al {isEditing ? 'actualizar' : 'crear'} platillo</h3>
      <p>{error}</p>
    </div>
  {/if}

  <!-- Validation Error Display -->
  {#if submitted && Object.keys(errors).length > 0}
    <div class="validation-error-state">
      <i>⚠️</i>
      <h3>Por favor corrige los siguientes errores:</h3>
      <ul class="validation-error-list">
        {#each Object.keys(errors) as field}
          <li>{errors[field]}</li>
        {/each}
      </ul>
    </div>
  {/if}

  <!-- Form Fields -->
  <div class="form-sections">
    <!-- Basic Information -->
    <div class="form-section">
      <h4 class="section-title">Información Básica</h4>
      
      <div class="form-fields">
        <!-- Name -->
        <div class="form-field">
          <label for="dish-name" class="form-label">
            Nombre del platillo
            <span class="form-required">*</span>
          </label>
          <input
            id="dish-name"
            type="text"
            class={getFieldClasses('name')}
            placeholder="Ej: Tacos al Pastor, Pasta Carbonara..."
            value={formData.name}
            on:input={(e) => handleInput('name', e)}
            on:blur={() => touched.name = true}
            disabled={isSubmitting}
            required
          />
          {#if getFieldError('name')}
            <p class="form-field-error">{getFieldError('name')}</p>
          {/if}
        </div>

        <!-- Description -->
        <div class="form-field">
          <label for="dish-description" class="form-label">
            Descripción
            <span class="form-optional">(opcional)</span>
          </label>
          <textarea
            id="dish-description"
            class={getFieldClasses('description')}
            placeholder="Describe los ingredientes, preparación y sabores de este platillo..."
            value={formData.description}
            on:input={(e) => handleInput('description', e)}
            on:blur={() => touched.description = true}
            disabled={isSubmitting}
            rows="4"
            use:autoResize
          ></textarea>
          {#if getFieldError('description')}
            <p class="form-field-error">{getFieldError('description')}</p>
          {/if}
          <p class="form-field-hint">
            Opcional. Si se ingresa, mínimo 10 caracteres. Incluye ingredientes principales y características especiales.
          </p>
        </div>

        <!-- Price and Category Row -->
        <div class="form-row">
          <!-- Price -->
          <div class="form-field">
            <label for="dish-price" class="form-label">
              Precio
              <span class="form-required">*</span>
            </label>
            <div class="price-input-wrapper">
              <span class="price-currency">$</span>
              <input
                id="dish-price"
                type="number"
                class={getFieldClasses('price')}
                placeholder="0.00"
                value={formData.price || ''}
                on:input={(e) => handleInput('price', e)}
                on:blur={() => touched.price = true}
                disabled={isSubmitting}
                min="0"
                max="10000"
                step="0.01"
                required
              />
            </div>
            {#if getFieldError('price')}
              <p class="form-field-error">{getFieldError('price')}</p>
            {/if}
          </div>

          <!-- Category -->
          <div class="form-field">
            <label for="dish-category" class="form-label">
              Categoría
              <span class="form-required">*</span>
            </label>
            <select
              id="dish-category"
              class={getFieldClasses('categoryId')}
              value={formData.categoryId}
              on:change={(e) => handleInput('categoryId', e)}
              on:blur={() => touched.categoryId = true}
              disabled={isSubmitting}
              required
            >
              <option value="">Seleccionar categoría</option>
              {#each categories as category}
                <option value={category.id}>{category.name}</option>
              {/each}
            </select>
            {#if getFieldError('categoryId')}
              <p class="form-field-error">{getFieldError('categoryId')}</p>
            {/if}
          </div>
        </div>

        <!-- Availability and Discount Row -->
        <div class="form-row">
          <!-- Availability -->
          <div class="form-field">
            <label class="form-checkbox-label">
              <input
                type="checkbox"
                class="form-checkbox"
                checked={formData.inStock}
                on:change={(e) => handleInput('inStock', e)}
                disabled={isSubmitting}
              />
              <span class="checkbox-text">Disponible para ordenar</span>
            </label>
            <p class="form-field-hint">
              Si está deshabilitado, el platillo aparecerá como "No disponible"
            </p>
          </div>

          <!-- Discount -->
          <div class="form-field">
            <label for="dish-discount" class="form-label">
              Descuento (opcional)
            </label>
            <div class="discount-input-wrapper">
              <input
                id="dish-discount"
                type="number"
                class={getFieldClasses('discount')}
                placeholder="0"
                value={formData.discount || ''}
                on:input={(e) => handleInput('discount', e)}
                on:blur={() => touched.discount = true}
                disabled={isSubmitting}
                min="0"
                max="100"
                step="1"
              />
              <span class="discount-symbol">%</span>
            </div>
            {#if getFieldError('discount')}
              <p class="form-field-error">{getFieldError('discount')}</p>
            {/if}
            {#if hasDiscount}
              <p class="form-field-hint discount-preview">
                Precio con descuento: <strong>{dishUtils.formatPrice(discountedPrice)}</strong>
              </p>
            {/if}
          </div>
        </div>
      </div>
    </div>

    <!-- Image Upload -->
    <div class="form-section">
      <h4 class="section-title">Imagen del Platillo</h4>
      
      <div class="image-upload-container">
        {#if imagePreview}
          <div class="image-preview">
            <img src={imagePreview} alt="Preview" class="preview-image" />
            <div class="image-overlay">
              <button
                type="button"
                class="image-action-btn image-remove"
                on:click={removeImage}
                disabled={isSubmitting}
              >
                <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                Eliminar
              </button>
              <label for="dish-image" class="image-action-btn image-change">
                <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                Cambiar
              </label>
            </div>
          </div>
        {:else}
          <div 
            class="image-dropzone"
            class:drag-active={dragActive}
            on:dragover={handleDragOver}
            on:dragleave={handleDragLeave}
            on:drop={handleDrop}
          >
            <svg class="dropzone-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <p class="dropzone-text">
              <label for="dish-image" class="dropzone-link">Haz clic para subir</label>
              o arrastra una imagen aquí
            </p>
            <p class="dropzone-hint">PNG, JPG, WEBP hasta 5MB</p>
          </div>
        {/if}

        <input
          id="dish-image"
          type="file"
          accept="image/*"
          class="image-input-hidden"
          on:change={handleImageSelect}
          disabled={isSubmitting}
        />
      </div>
    </div>

    <!-- Nutritional Information (Optional) -->
    <div class="form-section">
      <div class="section-header-expandable">
        <h4 class="section-title">Información Nutricional (Opcional)</h4>
        <button
          type="button"
          class="section-toggle"
          on:click={() => showNutritionalInfo = !showNutritionalInfo}
        >
          <svg 
            class="toggle-icon"
            class:rotated={showNutritionalInfo}
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
          >
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      </div>

      {#if showNutritionalInfo}
        <div class="nutritional-fields">
          <div class="form-row">
            <div class="form-field">
              <label for="calories" class="form-label">Calorías</label>
              <input
                id="calories"
                type="number"
                class="input"
                placeholder="0"
                value={formData.nutritionalInfo.calories || ''}
                on:input={(e) => handleNutritionalInput('calories', e)}
                disabled={isSubmitting}
                min="0"
              />
            </div>

            <div class="form-field">
              <label for="protein" class="form-label">Proteínas (g)</label>
              <input
                id="protein"
                type="number"
                class="input"
                placeholder="0"
                value={formData.nutritionalInfo.protein || ''}
                on:input={(e) => handleNutritionalInput('protein', e)}
                disabled={isSubmitting}
                min="0"
                step="0.1"
              />
            </div>
          </div>

          <div class="form-row">
            <div class="form-field">
              <label for="carbs" class="form-label">Carbohidratos (g)</label>
              <input
                id="carbs"
                type="number"
                class="input"
                placeholder="0"
                value={formData.nutritionalInfo.carbs || ''}
                on:input={(e) => handleNutritionalInput('carbs', e)}
                disabled={isSubmitting}
                min="0"
                step="0.1"
              />
            </div>

            <div class="form-field">
              <label for="fat" class="form-label">Grasas (g)</label>
              <input
                id="fat"
                type="number"
                class="input"
                placeholder="0"
                value={formData.nutritionalInfo.fat || ''}
                on:input={(e) => handleNutritionalInput('fat', e)}
                disabled={isSubmitting}
                min="0"
                step="0.1"
              />
            </div>
          </div>

          <div class="form-field">
            <label for="allergens" class="form-label">Alérgenos</label>
            <input
              id="allergens"
              type="text"
              class="input"
              placeholder="Ej: Gluten, Nueces, Lácteos (separados por comas)"
              value={formData.nutritionalInfo.allergens.join(', ')}
              on:input={(e) => handleNutritionalInput('allergens', e)}
              disabled={isSubmitting}
            />
            <p class="form-field-hint">
              Lista los principales alérgenos separados por comas
            </p>
          </div>
        </div>
      {/if}
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
      disabled={isSubmitting}
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
        {isEditing ? 'Actualizar Platillo' : 'Crear Platillo'}
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
        Completa toda la información para crear un platillo atractivo para tus clientes.
      </p>
    </div>
    
    {#if formData.categoryId}
      <div class="form-info-item">
        <svg class="form-info-icon text-info" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.99 1.99 0 013 12V7a4 4 0 014-4z" />
        </svg>
        <p class="form-info-text text-info">
          Categoría seleccionada: <strong>{getCategoryName(formData.categoryId)}</strong>
        </p>
      </div>
    {/if}
    
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
  .dish-form {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-xl);
    max-width: 100%;
  }

  /* Form Sections */
  .form-sections {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-2xl);
  }

  .form-section {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-lg);
    padding: var(--spacing-2xl);
    background: var(--bg-tertiary);
    border: 1px solid var(--bg-accent);
    border-radius: var(--radius-xl);
  }

  .section-title {
    font-size: var(--font-lg);
    font-weight: var(--weight-semibold);
    color: var(--text-secondary);
    margin: 0;
  }

  .section-header-expandable {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .section-toggle {
    background: none;
    border: none;
    color: var(--text-muted);
    cursor: pointer;
    padding: var(--spacing-xs);
    border-radius: var(--radius-sm);
    transition: all var(--transition-normal);
  }

  .section-toggle:hover {
    background: var(--bg-accent);
    color: var(--text-secondary);
  }

  .toggle-icon {
    width: 1.25rem;
    height: 1.25rem;
    transition: transform var(--transition-normal);
  }

  .toggle-icon.rotated {
    transform: rotate(180deg);
  }

  /* Form Fields */
  .form-fields {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-lg);
  }

  .form-row {
    display: grid;
    grid-template-columns: 1fr 1fr;
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
    min-height: 100px;
    max-height: 200px;
    font-family: inherit;
    line-height: var(--leading-relaxed);
  }

  /* Price Input */
  .price-input-wrapper {
    position: relative;
    display: flex;
    align-items: center;
  }

  .price-currency {
    position: absolute;
    left: var(--spacing-lg);
    font-size: var(--font-base);
    color: var(--text-muted);
    font-weight: var(--weight-medium);
    pointer-events: none;
  }

  .price-input-wrapper .input {
    padding-left: var(--spacing-2xl);
  }

  /* Discount Input */
  .discount-input-wrapper {
    position: relative;
    display: flex;
    align-items: center;
  }

  .discount-symbol {
    position: absolute;
    right: var(--spacing-lg);
    font-size: var(--font-base);
    color: var(--text-muted);
    font-weight: var(--weight-medium);
    pointer-events: none;
  }

  .discount-input-wrapper .input {
    padding-right: var(--spacing-2xl);
  }

  .discount-preview {
    color: var(--success) !important;
    font-weight: var(--weight-medium);
  }

  /* Checkbox */
  .form-checkbox-label {
    display: flex;
    align-items: center;
    gap: var(--spacing-sm);
    cursor: pointer;
  }

  .form-checkbox {
    width: 1.125rem;
    height: 1.125rem;
    accent-color: var(--primary-color);
  }

  .checkbox-text {
    font-size: var(--font-sm);
    color: var(--text-secondary);
    font-weight: var(--weight-medium);
  }

  /* Field Helpers */
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

  /* Image Upload */
  .image-upload-container {
    position: relative;
  }

  .image-preview {
    position: relative;
    border-radius: var(--radius-xl);
    overflow: hidden;
    background: var(--bg-tertiary);
    border: 2px dashed var(--bg-accent);
  }

  .preview-image {
    width: 100%;
    height: 200px;
    object-fit: cover;
    display: block;
  }

  .image-overlay {
    position: absolute;
    inset: 0;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    gap: var(--spacing-md);
    opacity: 0;
    transition: opacity var(--transition-normal);
  }

  .image-preview:hover .image-overlay {
    opacity: 1;
  }

  .image-action-btn {
    display: inline-flex;
    align-items: center;
    gap: var(--spacing-xs);
    padding: var(--spacing-sm) var(--spacing-md);
    border: none;
    border-radius: var(--radius-md);
    font-size: var(--font-xs);
    font-weight: var(--weight-medium);
    cursor: pointer;
    transition: all var(--transition-normal);
    text-decoration: none;
  }

  .image-action-btn svg {
    width: 1rem;
    height: 1rem;
  }

  .image-remove {
    background: var(--error);
    color: var(--text-inverse);
  }

  .image-remove:hover {
    background: var(--error-light);
  }

  .image-change {
    background: var(--primary-color);
    color: var(--text-inverse);
  }

  .image-change:hover {
    background: var(--primary-dark);
  }

  .image-dropzone {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: var(--spacing-3xl) var(--spacing-lg);
    border: 2px dashed var(--bg-accent);
    border-radius: var(--radius-xl);
    background: var(--bg-tertiary);
    transition: all var(--transition-normal);
    cursor: pointer;
  }

  .image-dropzone:hover,
  .image-dropzone.drag-active {
    border-color: var(--primary-color);
    background: var(--info-bg);
  }

  .dropzone-icon {
    width: 3rem;
    height: 3rem;
    color: var(--text-light);
    margin-bottom: var(--spacing-lg);
  }

  .dropzone-text {
    font-size: var(--font-sm);
    color: var(--text-muted);
    margin: 0 0 var(--spacing-sm) 0;
    text-align: center;
  }

  .dropzone-link {
    color: var(--primary-color);
    font-weight: var(--weight-medium);
    text-decoration: underline;
    cursor: pointer;
  }

  .dropzone-hint {
    font-size: var(--font-xs);
    color: var(--text-light);
    margin: 0;
  }

  .image-input-hidden {
    display: none;
  }

  /* Nutritional Fields */
  .nutritional-fields {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-lg);
    padding-top: var(--spacing-sm);
  }

  /* Form Actions */
  .form-actions {
    display: flex;
    justify-content: flex-end;
    gap: var(--spacing-md);
    padding-top: var(--spacing-xl);
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
    min-width: 160px;
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

  .form-info-icon.text-info {
    color: var(--info);
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

  .form-info-text.text-info {
    color: var(--info);
  }

  .form-info-text.text-warning {
    color: var(--warning);
  }

  /* Responsive Design */
  @media (max-width: 768px) {
    .form-row {
      grid-template-columns: 1fr;
    }

    .form-actions {
      flex-direction: column-reverse;
    }

    .btn {
      justify-content: center;
      width: 100%;
    }

    .form-section {
      padding: var(--spacing-lg);
    }

    .image-dropzone {
      padding: var(--spacing-2xl) var(--spacing-lg);
    }

    .preview-image {
      height: 150px;
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
    .input,
    .section-toggle,
    .toggle-icon,
    .image-overlay,
    .image-dropzone {
      transition: none;
    }
    
    .btn:hover {
      transform: none;
    }
  }

  /* Dark mode support */
  @media (prefers-color-scheme: dark) {
    .form-section {
      background: var(--bg-accent);
      border-color: var(--bg-tertiary);
    }
    
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
    
    .image-dropzone {
      background: var(--bg-accent);
    }
  }

  /* Validation Error State */
  .validation-error-state {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-md);
    padding: var(--spacing-lg);
    background: var(--error-bg);
    border: 1px solid var(--error);
    border-radius: var(--radius-lg);
    color: var(--error);
  }

  .validation-error-state i {
    font-size: var(--font-lg);
  }

  .validation-error-state h3 {
    font-size: var(--font-base);
    font-weight: var(--weight-semibold);
    margin: 0;
    color: var(--error);
  }

  .validation-error-list {
    margin: 0;
    padding-left: var(--spacing-lg);
    list-style-type: disc;
  }

  .validation-error-list li {
    font-size: var(--font-sm);
    margin-bottom: var(--spacing-xs);
    line-height: var(--leading-relaxed);
  }

  .validation-error-list li:last-child {
    margin-bottom: 0;
  }
</style>