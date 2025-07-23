<script lang="ts">
  import { createEventDispatcher, onMount } from 'svelte';
  import { dishService } from '../../../services/index.ts';
  export let restaurantId: string;
  export let categories: any[] = [];

  const dispatch = createEventDispatcher();

  let formData: { [key: string]: any } = {
    name: '',
    description: '',
    price: '',
    categoryId: categories[0]?.id || '',
    image: null
  };
  let errors: { [key: string]: string } = {};
  let touched: { [key: string]: boolean } = {};
  let isSubmitting = false;
  let error: string | null = null;
  let imagePreview: string | null = null;
  let dragActive = false;

  function validate() {
    errors = {};
    if (!formData.name.trim()) {
      errors.name = 'El nombre es requerido';
    }
    if (!formData.price || isNaN(Number(formData.price))) {
      errors.price = 'El precio es requerido y debe ser un número';
    }
    if (!formData.categoryId) {
      errors.categoryId = 'Selecciona una categoría';
    }
    // Descripción es opcional, solo validar si existe y es muy larga
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

  function handleImageChange(event: Event) {
    const target = event.target as HTMLInputElement;
    const file = target.files ? target.files[0] : null;
    setImage(file);
  }

  function handleDrop(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    dragActive = false;
    if (event.dataTransfer && event.dataTransfer.files && event.dataTransfer.files[0]) {
      setImage(event.dataTransfer.files[0]);
    }
  }

  function handleDragOver(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    dragActive = true;
  }

  function handleDragLeave(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    dragActive = false;
  }

  function setImage(file: File | null) {
    formData.image = file;
    touched.image = true;
    if (file) {
      imagePreview = URL.createObjectURL(file);
    } else {
      imagePreview = null;
    }
  }

  function removeImage() {
    formData.image = null;
    imagePreview = null;
    touched.image = true;
    // Limpiar el input file si es necesario
    const input = document.getElementById('dish-image') as HTMLInputElement;
    if (input) input.value = '';
  }

  // Exponer método save() para el wizard
  export async function save() {
    touched = { name: true, price: true, categoryId: true };
    if (!validate()) {
      return false;
    }
    isSubmitting = true;
    error = null;
    try {
      const result = await dishService.createDish({
        name: formData.name.trim(),
        description: formData.description ? formData.description.trim() : '',
        price: Number(formData.price),
        categoryId: formData.categoryId,
        restaurantId
      }, formData.image);
      if (result.success) {
        // result.dish puede estar en result.data o result.dish según la API
        const dish =  result.data ;
        dispatch('created', { dish });
        return true;
      } else {
        error = result.error || 'Error desconocido';
        return false;
      }
    } catch (e: any) {
      error = e?.message || 'Error desconocido';
      return false;
    } finally {
      isSubmitting = false;
    }
  }
</script>

<div class="onboarding-dish-form flex flex-col gap-xl w-full max-w-lg mx-auto">
  <h2 class="text-2xl font-bold text-primary text-center mb-lg">¡Agrega tu primer platillo!</h2>
  <div class="flex flex-col gap-lg">
    <label class="font-medium text-secondary" for="dish-name">Nombre del platillo <span class="text-error">*</span></label>
    <input
      id="dish-name"
      class="input"
      type="text"
      placeholder="Ej: Pizza, Ensalada, Hamburguesa..."
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
    <label class="font-medium text-secondary" for="dish-description">Descripción (opcional)</label>
    <textarea
      id="dish-description"
      class="input"
      placeholder="Descripción breve del platillo..."
      bind:value={formData.description}
      on:input={(e) => handleInput('description', e)}
      disabled={isSubmitting}
      rows="3"
    ></textarea>
  </div>
  <div class="flex flex-col gap-lg">
    <label class="font-medium text-secondary" for="dish-price">Precio <span class="text-error">*</span></label>
    <input
      id="dish-price"
      class="input"
      type="number"
      min="0"
      step="0.01"
      placeholder="Ej: 120.00"
      bind:value={formData.price}
      on:input={(e) => handleInput('price', e)}
      disabled={isSubmitting}
      required
    />
    {#if touched.price && errors.price}
      <p class="form-field-error">{errors.price}</p>
    {/if}
  </div>
  <div class="flex flex-col gap-lg">
    <label class="font-medium text-secondary" for="dish-category">Categoría <span class="text-error">*</span></label>
    <select
      id="dish-category"
      class="input"
      bind:value={formData.categoryId}
      on:input={(e) => handleInput('categoryId', e)}
      disabled={isSubmitting}
      required
    >
      <option value="" disabled>Selecciona una categoría</option>
      {#each categories as cat}
        <option value={cat.id}>{cat.name}</option>
      {/each}
    </select>
    {#if touched.categoryId && errors.categoryId}
      <p class="form-field-error">{errors.categoryId}</p>
    {/if}
  </div>
  <div class="flex flex-col gap-lg">
    <label class="font-medium text-secondary" for="dish-image">Imagen (opcional)</label>
    <div
      class="image-dropzone {dragActive ? 'active' : ''}"
      on:dragover={handleDragOver}
      on:dragleave={handleDragLeave}
      on:drop={handleDrop}
      on:click={() => document.getElementById('dish-image')?.click()}
      tabindex="0"
      role="button"
      aria-label="Subir imagen"
      style="cursor:pointer;"
    >
      {#if imagePreview}
        <img src={imagePreview} alt="Vista previa" class="image-preview" />
        <button type="button" class="remove-image-btn" on:click|stopPropagation={removeImage}>Quitar</button>
      {:else}
        <div class="image-dropzone-content">
          <svg width="32" height="32" fill="none" viewBox="0 0 24 24"><path stroke="#888" stroke-width="2" d="M12 16V4m0 0-4 4m4-4 4 4M4 20h16"/></svg>
          <span>Arrastra una imagen aquí o haz clic para seleccionar</span>
          <span class="image-hint">Formatos: JPG, PNG, GIF. Máx: 5MB</span>
        </div>
      {/if}
      <input
        id="dish-image"
        class="input"
        type="file"
        accept="image/*"
        on:change={handleImageChange}
        disabled={isSubmitting}
        style="display:none;"
      />
    </div>
  </div>
  {#if error}
    <div class="error-state mt-lg">{error}</div>
  {/if}
  {#if isSubmitting}
    <div class="text-center text-muted mt-lg animate-pulse">Guardando...</div>
  {/if}
</div>

<style>
.onboarding-dish-form {
  padding: 0;
  margin: 0 auto;
  box-sizing: border-box;
  padding-bottom: 100px;
}
.form-field-error {
  font-size: var(--font-xs);
  color: var(--error);
  margin: 0;
}
.image-dropzone {
  border: 2px dashed var(--primary-color);
  border-radius: var(--radius-xl, 0.75rem);
  padding: 2rem 1rem;
  text-align: center;
  background: var(--bg-tertiary, #fafbfc);
  transition: border-color 0.2s, background 0.2s;
  position: relative;
  min-height: 120px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}
.image-dropzone.active {
  border-color: var(--primary-dark);
  background: var(--bg-accent, #f0f4ff);
}
.image-dropzone-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  color: var(--text-muted);
}
.image-hint {
  font-size: var(--font-xs, 0.75rem);
  color: var(--text-light);
}
.image-preview {
  max-width: 100%;
  max-height: 160px;
  border-radius: var(--radius-lg, 0.5rem);
  margin-bottom: 0.5rem;
  box-shadow: var(--shadow-sm, 0 2px 8px rgba(0,0,0,0.07));
}
.remove-image-btn {
  background: var(--error, #ef4444);
  color: var(--text-inverse, #fff);
  border: none;
  border-radius: var(--radius-md, 0.375rem);
  padding: 0.25rem 0.75rem;
  font-size: 0.9rem;
  cursor: pointer;
  margin-top: 0.25rem;
  transition: background 0.2s;
}
.remove-image-btn:hover {
  background: var(--error-light, #b91c1c);
}
</style> 