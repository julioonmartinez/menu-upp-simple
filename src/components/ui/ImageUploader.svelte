<!-- src/components/ui/ImageUploader.svelte -->
<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  
  export let label = '';
  export let id = '';
  export let currentImage: string | null | undefined = null; // URL de la imagen actual
  export let accept = 'image/*';
  export let maxSize = 5; // MB
  export let width: number | string | null | undefined = null; // Ancho recomendado
  export let height: number | string | null | undefined = null; // Alto recomendado
  export let aspectRatio: string | null | undefined = null; // Ej: '16:9', '1:1', '4:3'
  export let required = false;
  export let disabled = false;
  export let help = '';
  export let error = '';
  export let uploading = false;
  
  const dispatch = createEventDispatcher();
  
  let fileInput: HTMLInputElement;
  let dragActive = false;
  let previewUrl: string | null | undefined = currentImage;
  let selectedFile: File | null = null;
  
  // Reactive: actualizar preview cuando cambie currentImage
  $: previewUrl = currentImage;
  
  // Formatos permitidos
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
  
  function handleFileSelect(event: Event) {
    const target = event.target as HTMLInputElement;
    const file = target.files?.[0];
    if (file) processFile(file);
  }
  
  function handleDrop(event: DragEvent) {
    event.preventDefault();
    dragActive = false;
    
    const file = event.dataTransfer?.files[0];
    if (file) processFile(file);
  }
  
  function handleDragOver(event: DragEvent) {
    event.preventDefault();
    dragActive = true;
  }
  
  function handleDragLeave(event: DragEvent) {
    event.preventDefault();
    // Solo cambiar si realmente salimos del área
    if (!event.currentTarget?.contains(event.relatedTarget as Node)) {
      dragActive = false;
    }
  }
  
  function processFile(file: File) {
    if (!file) return;
    
    // Validar tipo
    if (!allowedTypes.includes(file.type)) {
      dispatch('error', {
        message: 'Formato no permitido. Use JPG, PNG, WebP o GIF.',
        file
      });
      return;
    }
    
    // Validar tamaño
    const sizeInMB = file.size / (1024 * 1024);
    if (sizeInMB > maxSize) {
      dispatch('error', {
        message: `El archivo es muy grande. Máximo ${maxSize}MB.`,
        file,
        size: sizeInMB
      });
      return;
    }
    
    // Crear preview
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      previewUrl = result;
      selectedFile = file;
      
      // Validar dimensiones si es necesario
      if (width || height) {
        validateDimensions(result, file);
      } else {
        dispatch('fileSelected', { file, preview: result });
      }
    };
    reader.readAsDataURL(file);
  }
  
  function validateDimensions(dataUrl: string, file: File) {
    const img = new Image();
    img.onload = () => {
      const validation = {
        width: img.width,
        height: img.height,
        aspectRatio: img.width / img.height,
        file,
        preview: dataUrl
      };
      
      // Validar dimensiones exactas
      if (width && height) {
        const targetWidth = typeof width === 'string' ? parseInt(width) : width;
        const targetHeight = typeof height === 'string' ? parseInt(height) : height;
        
        if (img.width !== targetWidth || img.height !== targetHeight) {
          dispatch('dimensionWarning', {
            ...validation,
            message: `Dimensiones recomendadas: ${targetWidth}x${targetHeight}px. Actual: ${img.width}x${img.height}px`
          });
        }
      }
      
      // Validar aspect ratio
      if (aspectRatio) {
        const [w, h] = aspectRatio.split(':').map(Number);
        const expectedRatio = w / h;
        const actualRatio = img.width / img.height;
        
        if (Math.abs(actualRatio - expectedRatio) > 0.1) {
          dispatch('dimensionWarning', {
            ...validation,
            message: `Proporción recomendada: ${aspectRatio}. Actual: ${Math.round(actualRatio * 100) / 100}:1`
          });
        }
      }
      
      dispatch('fileSelected', validation);
    };
    img.src = dataUrl;
  }
  
  function removeImage() {
    previewUrl = null;
    selectedFile = null;
    if (fileInput) fileInput.value = '';
    dispatch('remove');
  }
  
  function triggerFileInput() {
    if (!disabled && fileInput) {
      fileInput.click();
    }
  }
  
  // Calcular texto de ayuda dinámico
  $: dynamicHelp = help || `
    ${allowedTypes.map(t => t.split('/')[1].toUpperCase()).join(', ')} • 
    Máx. ${maxSize}MB${width && height ? ` • ${width}x${height}px` : ''}${aspectRatio ? ` • ${aspectRatio}` : ''}
  `.trim();
</script>

<div class="flex flex-col gap-md image-uploader">
  {#if label}
    <label for={id} class="text-sm font-medium text-primary label">
      {label}
      {#if required}
        <span class="text-error required">*</span>
      {/if}
    </label>
  {/if}
  <div 
    class="upload-area border-2 border-dashed rounded-xl bg-white transition-all cursor-pointer overflow-hidden min-h-[200px] flex items-center justify-center {dragActive ? 'drag-active' : ''} {error ? 'border-error' : 'border-accent'} {disabled ? 'opacity-60 cursor-not-allowed bg-gray' : ''}"
    on:drop={handleDrop}
    on:dragover={handleDragOver}
    on:dragleave={handleDragLeave}
    on:click={triggerFileInput}
    role="button"
    tabindex={disabled ? -1 : 0}
    on:keydown={(e) => e.key === 'Enter' && triggerFileInput()}
  >
    {#if previewUrl}
      <div class="image-preview w-full h-full flex items-center justify-center relative">
        <img src={previewUrl} alt="Preview" class="max-w-full max-h-[200px] rounded-lg object-contain preview-image" />
        <div class="image-overlay absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 transition-opacity">
          <div class="flex gap-md overlay-actions">
            <button
              type="button"
              class="overlay-btn bg-white rounded-md flex items-center justify-center p-md transition-all"
              on:click|stopPropagation={triggerFileInput}
              disabled={disabled || uploading}
              title="Cambiar imagen"
            >
              <svg class="icon w-lg h-lg" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
              </svg>
            </button>
            <button
              type="button"
              class="overlay-btn bg-white rounded-md flex items-center justify-center p-md transition-all remove"
              on:click|stopPropagation={removeImage}
              disabled={disabled || uploading}
              title="Eliminar imagen"
            >
              <svg class="icon w-lg h-lg" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
        </div>
        {#if uploading}
          <div class="upload-progress absolute inset-0 flex flex-col items-center justify-center gap-md text-inverse text-sm bg-black/70">
            <div class="spinner"></div>
            <span>Subiendo...</span>
          </div>
        {/if}
      </div>
    {:else}
      <div class="empty-state flex flex-col items-center justify-center gap-lg p-2xl text-center">
        <div class="upload-icon w-2xl h-2xl text-muted">
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
          </svg>
        </div>
        <div class="upload-text flex flex-col gap-xs">
          <p class="primary-text text-sm font-medium text-primary m-0">
            {uploading ? 'Subiendo imagen...' : 'Click para seleccionar imagen'}
          </p>
          <p class="secondary-text text-xs text-muted m-0">
            o arrastra y suelta aquí
          </p>
        </div>
        {#if uploading}
          <div class="spinner"></div>
        {/if}
      </div>
    {/if}
  </div>
  <input
    bind:this={fileInput}
    {id}
    type="file"
    {accept}
    on:change={handleFileSelect}
    style="display: none;"
    {disabled}
  />
  {#if error}
    <p class="text-xs text-error mt-xs message error-message">{error}</p>
  {:else if dynamicHelp}
    <p class="text-xs text-muted mt-xs message help-message">{dynamicHelp}</p>
  {/if}
</div>

<style>
  /* Detalles visuales y transiciones especiales */
  .upload-area.drag-active {
    border-color: var(--primary-color);
    background-color: var(--bg-accent);
    transform: scale(1.02);
  }
  .upload-area:hover:not(.disabled) {
    border-color: var(--primary-color);
    background-color: var(--bg-secondary);
  }
  .upload-area.error {
    border-color: var(--error);
  }
  .image-preview:hover .image-overlay {
    opacity: 1;
  }
  .image-overlay {
    opacity: 0;
    transition: opacity 0.2s ease-in-out;
  }
  .overlay-btn.remove:hover {
    background: var(--error);
    color: var(--text-inverse);
  }
  .spinner {
    width: 1.5rem;
    height: 1.5rem;
    border: 2px solid transparent;
    border-bottom: 2px solid var(--primary-color);
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }
  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }
  @media (max-width: 640px) {
    .upload-area { min-height: 150px; }
    .empty-state { padding: 1.5rem; }
    .upload-icon { width: 2.5rem; height: 2.5rem; }
    .overlay-actions { gap: 0.25rem; }
    .overlay-btn { padding: 0.375rem; }
  }
</style>