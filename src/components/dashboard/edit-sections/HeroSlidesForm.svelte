<script lang="ts">
  import { onMount } from 'svelte';
  import { useHeroSlides } from '../../../stores/heroSlidesStore';
  import { heroSlidesService } from '../../../services/heroSlidesService';
  import type { HeroSlideResponse, HeroSlideCreateRequest, HeroSlideUpdateRequest } from '../../../services/heroSlidesService';
  import type { HeroSlidesUploadInfo } from '../../../services/heroSlidesService';
  import ConfirmationModal from '../../ui/ConfirmationModal.svelte';
  import { toastStore } from '../../../stores/toastStore';
  import ImageUploader from '../../ui/ImageUploader.svelte';
  
  // Props
  export let restaurantId: string;
  export let onSave: (() => void) | undefined = undefined;
  export let onCancel: (() => void) | undefined = undefined;

  // Store
  const {
    slides,
    uploadInfo,
    isLoadingSlides,
    isLoadingUploadInfo,
    isAdding,
    isUpdating,
    isDeleting,
    isReordering,
    addError,
    updateError,
    deleteError,
    loadHeroSlides,
    loadUploadInfo,
    addHeroSlide,
    updateHeroSlide,
    deleteHeroSlide,
    reorderHeroSlides,
    clearAllErrors,
    slidesOrderedByPosition,
    canAddMore,
    availableSlots,
    utils
  } = useHeroSlides();

  // Estado local
  let expandedSlides: Set<number> = new Set();
  let newSlideExpanded = false;
  let dragStartIndex: number | null = null;
  let dragOverIndex: number | null = null;

  // Form data para nuevo slide
  let newSlideData: HeroSlideCreateRequest = {
    title: '',
    subtitle: '',
    alt: ''
  };
  let newSlideImage: File | null = null;
  let newSlideImagePreview: string | null = null;

  // Form data para edición
  let editingSlides: Map<number, {
    data: HeroSlideUpdateRequest;
    image: File | null;
    imagePreview: string | null;
    originalImage: string;
  }> = new Map();

  // Estados de carga
  let isInitialLoading = true;

  // Estados para confirmación de borrado
  let confirmDelete : {open: boolean, position: number | null} = { open: false, position: null };
  let newSlideImageError = '';
  let editSlideImageError: Record<number, string> = {};

  // Cargar datos al montar
  onMount(async () => {
    try {
      await Promise.all([
        loadHeroSlides(restaurantId),
        loadUploadInfo(restaurantId)
      ]);
    } catch (error) {
      console.error('Error loading hero slides:', error);
    } finally {
      isInitialLoading = false;
    }
  });

  // Expandir/contraer slide
  function toggleSlideExpanded(position: number) {
    if (expandedSlides.has(position)) {
      expandedSlides.delete(position);
    } else {
      expandedSlides.add(position);
      // Inicializar datos de edición si no existen
      if (!editingSlides.has(position)) {
        const slide = $slides.find(s => s.position === position);
        if (slide) {
          editingSlides.set(position, {
            data: {
              title: slide.title,
              subtitle: slide.subtitle,
              alt: slide.alt || ''
            },
            image: null,
            imagePreview: null,
            originalImage: slide.imageUrl
          });
        }
      }
    }
    expandedSlides = expandedSlides;
  }

  // Expandir/contraer nuevo slide
  function toggleNewSlideExpanded() {
    newSlideExpanded = !newSlideExpanded;
    if (!newSlideExpanded) {
      // Limpiar datos del nuevo slide
      newSlideData = { title: '', subtitle: '', alt: '' };
      newSlideImage = null;
      newSlideImagePreview = null;
      clearAllErrors();
    }
  }

  // Manejar imagen del nuevo slide
  function handleNewSlideImage(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    
    if (file) {
      // Validar archivo
      const validation = heroSlidesService.utils.validateImageFile(file);
      if (!validation.isValid) {
        alert(validation.errors.join('\n'));
        input.value = '';
        return;
      }

      newSlideImage = file;
      
      // Generar preview
      heroSlidesService.utils.generateImagePreview(file).then(preview => {
        newSlideImagePreview = preview;
      });
    }
  }

  // Manejar imagen de edición
  function handleEditSlideImage(event: Event, position: number) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    
    if (file) {
      // Validar archivo
      const validation = heroSlidesService.utils.validateImageFile(file);
      if (!validation.isValid) {
        alert(validation.errors.join('\n'));
        input.value = '';
        return;
      }

      const editingSlide = editingSlides.get(position);
      if (editingSlide) {
        editingSlide.image = file;
        
        // Generar preview
        heroSlidesService.utils.generateImagePreview(file).then(preview => {
          editingSlide.imagePreview = preview;
          editingSlides = editingSlides;
        });
      }
    }
  }

  // Crear nuevo slide
  async function createNewSlide() {
    if (!newSlideImage) {
      newSlideImageError = 'Debes seleccionar una imagen';
      toastStore.error('Debes seleccionar una imagen');
      return;
    }
    const validation = heroSlidesService.utils.validateHeroSlideData(newSlideData);
    if (!validation.isValid) {
      toastStore.error(validation.errors.join('\n'));
      return;
    }
    try {
      const result = await addHeroSlide(restaurantId, newSlideData, newSlideImage);
      if (result.success) {
        newSlideData = { title: '', subtitle: '', alt: '' };
        newSlideImage = null;
        newSlideImagePreview = null;
        newSlideExpanded = false;
        if (result.slide) {
          expandedSlides.add(result.slide.position);
          expandedSlides = expandedSlides;
        }
        toastStore.success('Slide creado correctamente');
        if (onSave) onSave();
      } else {
        toastStore.error(result.error || 'Error al crear el slide');
      }
    } catch (error) {
      toastStore.error('Error al crear el slide');
    }
  }

  // Actualizar slide
  async function updateSlide(position: number) {
    const editingSlide = editingSlides.get(position);
    if (!editingSlide) return;
    try {
      const result = await updateHeroSlide(
        restaurantId, 
        position, 
        editingSlide.data, 
        editingSlide.image || undefined
      );
      if (result.success) {
        editingSlides.delete(position);
        editingSlides = editingSlides;
        expandedSlides.delete(position);
        expandedSlides = expandedSlides;
        toastStore.success('Slide actualizado correctamente');
        if (onSave) onSave();
      } else {
        toastStore.error(result.error || 'Error al actualizar el slide');
      }
    } catch (error) {
      toastStore.error('Error al actualizar el slide');
    }
  }

  // Eliminar slide con modal de confirmación
  function askRemoveSlide(position: number) {
    confirmDelete = { open: true, position: position };
  }
  async function handleConfirmDelete() {
    if (confirmDelete.position !== null) {
      await removeSlide(confirmDelete.position);
      confirmDelete = { open: false, position: null };
    }
  }

  // Eliminar slide
  async function removeSlide(position: number) {
    try {
      const result = await deleteHeroSlide(restaurantId, position);
      if (result.success) {
        editingSlides.delete(position);
        editingSlides = editingSlides;
        expandedSlides.delete(position);
        expandedSlides = expandedSlides;
        toastStore.success('Slide eliminado correctamente');
        if (onSave) onSave();
      } else {
        toastStore.error(result.error || 'Error al eliminar el slide');
      }
    } catch (error) {
      toastStore.error('Error al eliminar el slide');
    }
  }

  // Drag and drop para reordenar
  function handleDragStart(event: DragEvent, position: number) {
    dragStartIndex = position;
    if (event.dataTransfer) {
      event.dataTransfer.effectAllowed = 'move';
    }
  }

  function handleDragOver(event: DragEvent, position: number) {
    event.preventDefault();
    dragOverIndex = position;
  }

  function handleDrop(event: DragEvent, position: number) {
    event.preventDefault();
    
    if (dragStartIndex !== null && dragStartIndex !== position) {
      reorderSlides(dragStartIndex, position);
    }
    
    dragStartIndex = null;
    dragOverIndex = null;
  }

  async function reorderSlides(fromPosition: number, toPosition: number) {
    console.log('🔧 reorderSlides called with:', { fromPosition, toPosition });
    console.log('🔧 Current slidesOrderedByPosition:', $slidesOrderedByPosition);
    
    // Verificar que los datos estén disponibles
    if (!$slidesOrderedByPosition) {
      console.error('slidesOrderedByPosition is not available');
      alert('Error: Los datos de slides no están disponibles');
      return;
    }
    
    if (!Array.isArray($slidesOrderedByPosition)) {
      console.error('slidesOrderedByPosition is not an array:', typeof $slidesOrderedByPosition);
      alert('Error: Los datos de slides no son válidos');
      return;
    }
    
    if ($slidesOrderedByPosition.length === 0) {
      console.error('No hay slides disponibles para reordenar');
      alert('No hay slides disponibles para reordenar');
      return;
    }

    const currentSlides = $slidesOrderedByPosition;
    const newPositions = [...currentSlides.map(s => s.position)];
    
    // Verificar que las posiciones sean válidas
    if (fromPosition < 0 || fromPosition >= currentSlides.length || 
        toPosition < 0 || toPosition >= currentSlides.length) {
      console.error('Posiciones inválidas para reordenamiento:', { fromPosition, toPosition, length: currentSlides.length });
      alert('Posiciones inválidas para reordenamiento');
      return;
    }
    
    // Mover el elemento
    const [movedItem] = newPositions.splice(fromPosition, 1);
    newPositions.splice(toPosition, 0, movedItem);
    
    console.log('Reordering slides:', { fromPosition, toPosition, newPositions, currentSlides });
    
    try {
      const result = await reorderHeroSlides(restaurantId, newPositions);
      if (result.success) {
        await loadHeroSlides(restaurantId, true);
        toastStore.success('Slides reordenados correctamente');
        if (onSave) onSave();
      } else {
        toastStore.error(`Error al reordenar los slides: ${result.error}`);
      }
    } catch (error) {
      toastStore.error(`Error al reordenar los slides: ${error instanceof Error ? error.message : 'Error desconocido'}`);
    }
  }

  // Cancelar edición
  function cancelEdit(position: number) {
    editingSlides.delete(position);
    editingSlides = editingSlides;
    expandedSlides.delete(position);
    expandedSlides = expandedSlides;
  }

  // Cancelar nuevo slide
  function cancelNewSlide() {
    newSlideData = { title: '', subtitle: '', alt: '' };
    newSlideImage = null;
    newSlideImagePreview = null;
    newSlideExpanded = false;
    clearAllErrors();
  }

  // Formatear tamaño de archivo
  function formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
</script>

<div class="hero-slides-form">
  <!-- Header -->
  <div class="form-header">
    <h2>Hero Slides</h2>
    <p class="subtitle">
      Gestiona las imágenes del carrusel principal de tu restaurante
      {#if $uploadInfo}
        <span class="slots-info">
          ({$slides.length}/{$uploadInfo.maxSlides} slides)
        </span>
      {/if}
    </p>
  </div>

  <!-- Loading inicial -->
  {#if isInitialLoading}
    <div class="loading-container">
      <div class="spinner"></div>
      <p>Cargando hero slides...</p>
    </div>
  {:else if !$slidesOrderedByPosition}
    <!-- Datos no disponibles -->
    <div class="no-slides-container">
      <p>Error al cargar los hero slides.</p>
      <p>Intenta recargar la página.</p>
    </div>
  {:else if $slidesOrderedByPosition.length === 0}
    <!-- No hay slides -->
    <div class="no-slides-container">
      <p>No hay hero slides configurados.</p>
      <p>Agrega tu primer slide usando el formulario de abajo.</p>
    </div>
  {/if}

  <!-- Slides existentes -->
  {#if $slidesOrderedByPosition && $slidesOrderedByPosition.length > 0}
    <div class="slides-container">
      {#each $slidesOrderedByPosition as slide (slide.position)}
        <div 
          class="slide-accordion"
          class:expanded={expandedSlides.has(slide.position)}
          class:dragging={dragStartIndex === slide.position}
          class:drag-over={dragOverIndex === slide.position}
        >
          <!-- Header de la cinta -->
          <div 
            class="accordion-header"
            draggable="true"
            on:dragstart={(e) => handleDragStart(e, slide.position)}
            on:dragover={(e) => handleDragOver(e, slide.position)}
            on:drop={(e) => handleDrop(e, slide.position)}
          >
            <div class="drag-handle">⋮⋮</div>
            
            <div class="slide-preview">
              <img src={slide.imageUrl} alt={slide.alt || slide.title} />
            </div>
            
            <div class="slide-info">
              <h3 title={slide.title}>{slide.title}</h3>
              <p title={slide.subtitle}>{slide.subtitle}</p>
              <span class="position-badge">Posición {slide.position + 1}</span>
            </div>
            
            <div class="accordion-actions">
              <button 
                class="btn-toggle"
                on:click={() => toggleSlideExpanded(slide.position)}
                aria-label={expandedSlides.has(slide.position) ? 'Contraer' : 'Expandir'}
              >
                {expandedSlides.has(slide.position) ? '−' : '+'}
              </button>
            </div>
          </div>

          <!-- Contenido expandible -->
          {#if expandedSlides.has(slide.position)}
            <div class="accordion-content">
              {#if editingSlides.has(slide.position)}
                <!-- Modo edición -->
                {@const editingSlide = editingSlides.get(slide.position)!}
                <div class="edit-form">
                  <div class="form-row">
                    <div class="form-group">
                      <label for="edit-title-{slide.position}">Título *</label>
                      <input
                        id="edit-title-{slide.position}"
                        type="text"
                        bind:value={editingSlide.data.title}
                        maxlength="100"
                        placeholder="Título del slide"
                      />
                    </div>
                  </div>

                  <div class="form-row">
                    <div class="form-group">
                      <label for="edit-subtitle-{slide.position}">Subtítulo *</label>
                      <input
                        id="edit-subtitle-{slide.position}"
                        type="text"
                        bind:value={editingSlide.data.subtitle}
                        maxlength="200"
                        placeholder="Subtítulo del slide"
                      />
                    </div>
                  </div>

                  <div class="form-row">
                    <div class="form-group">
                      <label for="edit-alt-{slide.position}">Texto alternativo</label>
                      <input
                        id="edit-alt-{slide.position}"
                        type="text"
                        bind:value={editingSlide.data.alt}
                        maxlength="150"
                        placeholder="Descripción para accesibilidad"
                      />
                    </div>
                  </div>

                  <div class="form-row">
                    <div class="form-group">
                      <label>Imagen actual</label>
                      <div class="current-image">
                        <img src={editingSlide.imagePreview || editingSlide.originalImage} alt="Preview" />
                      </div>
                    </div>
                  </div>

                  <div class="form-row">
                    <div class="form-group">
                      <ImageUploader
                        label="Nueva imagen (opcional)"
                        id={`edit-image-${slide.position}`}
                        accept="image/jpeg,image/jpg,image/png,image/webp"
                        currentImage={editingSlide.imagePreview || editingSlide.originalImage}
                        on:fileSelected={(e) => {
                          editingSlide.image = e.detail.file;
                          editingSlide.imagePreview = e.detail.preview;
                          editSlideImageError[slide.position] = '';
                          editingSlides = editingSlides;
                        }}
                        on:error={(e) => {
                          editSlideImageError[slide.position] = e.detail.message;
                          toastStore.error(e.detail.message);
                        }}
                        on:dimensionWarning={(e) => toastStore.info(e.detail.message)}
                        error={editSlideImageError[slide.position]}
                        uploading={$isUpdating}
                      />
                    </div>
                  </div>

                  <div class="form-actions">
                    <button 
                      class="btn btn-primary"
                      on:click={() => updateSlide(slide.position)}
                      disabled={$isUpdating}
                    >
                      {#if $isUpdating}
                        <span class="spinner-small"></span>
                        Guardando...
                      {:else}
                        Guardar cambios
                      {/if}
                    </button>
                    <button 
                      class="btn btn-secondary"
                      on:click={() => cancelEdit(slide.position)}
                      disabled={$isUpdating}
                    >
                      Cancelar
                    </button>
                    <button 
                      class="btn btn-danger"
                      on:click={() => askRemoveSlide(slide.position)}
                      disabled={$isDeleting}
                    >
                      {#if $isDeleting}
                        <span class="spinner-small"></span>
                        Eliminando...
                      {:else}
                        Eliminar slide
                      {/if}
                    </button>
                  </div>
                </div>
              {:else}
                <!-- Modo vista -->
                <div class="view-mode">
                  <div class="slide-details">
                    <div class="detail-item">
                      <strong>Título:</strong> {slide.title}
                    </div>
                    <div class="detail-item">
                      <strong>Subtítulo:</strong> {slide.subtitle}
                    </div>
                    {#if slide.alt}
                      <div class="detail-item">
                        <strong>Texto alternativo:</strong> {slide.alt}
                      </div>
                    {/if}
                    <div class="detail-item">
                      <strong>Posición:</strong> {slide.position}
                    </div>
                  </div>
                  
                  <div class="view-actions">
                    <button 
                      class="btn btn-primary"
                      on:click={() => toggleSlideExpanded(slide.position)}
                    >
                      Editar slide
                    </button>
                  </div>
                </div>
              {/if}
            </div>
          {/if}
        </div>
      {/each}
    </div>
  {/if}

  <!-- Cinta para nuevo slide -->
  {#if $canAddMore}
    <div class="slide-accordion new-slide" class:expanded={newSlideExpanded}>
      <div class="accordion-header" on:click={toggleNewSlideExpanded}>
        <div class="new-slide-icon">+</div>
        <div class="new-slide-info">
          <h3>Agregar nuevo slide</h3>
          <p>Crear un nuevo slide para el carrusel</p>
        </div>
        <div class="accordion-actions">
          <button 
            class="btn-toggle"
            aria-label={newSlideExpanded ? 'Contraer' : 'Expandir'}
          >
            {newSlideExpanded ? '−' : '+'}
          </button>
        </div>
      </div>

      {#if newSlideExpanded}
        <div class="accordion-content">
          <div class="new-slide-form">
            <div class="form-row">
              <div class="form-group">
                <label for="new-title">Título *</label>
                <input
                  id="new-title"
                  type="text"
                  bind:value={newSlideData.title}
                  maxlength="100"
                  placeholder="Título del slide"
                />
              </div>
            </div>

            <div class="form-row">
              <div class="form-group">
                <label for="new-subtitle">Subtítulo *</label>
                <input
                  id="new-subtitle"
                  type="text"
                  bind:value={newSlideData.subtitle}
                  maxlength="200"
                  placeholder="Subtítulo del slide"
                />
              </div>
            </div>

            <div class="form-row">
              <div class="form-group">
                <label for="new-alt">Texto alternativo</label>
                <input
                  id="new-alt"
                  type="text"
                  bind:value={newSlideData.alt}
                  maxlength="150"
                  placeholder="Descripción para accesibilidad"
                />
              </div>
            </div>

            <div class="form-row">
              <div class="form-group">
                <ImageUploader
                  label="Imagen *"
                  id="new-image"
                  accept="image/jpeg,image/jpg,image/png,image/webp"
                  required
                  on:fileSelected={(e) => {
                    newSlideImage = e.detail.file;
                    newSlideImagePreview = e.detail.preview;
                    newSlideImageError = '';
                  }}
                  on:error={(e) => {
                    newSlideImageError = e.detail.message;
                    toastStore.error(e.detail.message);
                  }}
                  on:dimensionWarning={(e) => toastStore.info(e.detail.message)}
                  error={newSlideImageError}
                  uploading={$isAdding}
                />
              </div>
            </div>

            {#if newSlideImagePreview}
              <div class="form-row">
                <div class="form-group">
                  <label>Vista previa</label>
                  <div class="image-preview">
                    <img src={newSlideImagePreview} alt="Preview" />
                  </div>
                </div>
              </div>
            {/if}

            <div class="form-actions">
              <button 
                class="btn btn-primary"
                on:click={createNewSlide}
                disabled={$isAdding || !newSlideImage}
              >
                {#if $isAdding}
                  <span class="spinner-small"></span>
                  Creando...
                {:else}
                  Crear slide
                {/if}
              </button>
              <button 
                class="btn btn-secondary"
                on:click={cancelNewSlide}
                disabled={$isAdding}
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      {/if}
    </div>
  {:else}
    <div class="no-more-slots">
      <p>Has alcanzado el límite máximo de slides (5)</p>
    </div>
  {/if}

    <!-- Información de upload -->
    {#if $uploadInfo && $uploadInfo.recommendations}
      <div class="upload-info">
        <h4>Información técnica</h4>
        <div class="info-grid">
          <div class="info-item">
            <strong>Formato recomendado:</strong> {$uploadInfo.recommendations.imageFormat || 'No especificado'}
          </div>
          <div class="info-item">
            <strong>Tamaño recomendado:</strong> {$uploadInfo.recommendations.imageSize || 'No especificado'}
          </div>
          <div class="info-item">
            <strong>Relación de aspecto:</strong> {$uploadInfo.recommendations.aspectRatio || 'No especificado'}
          </div>
          <div class="info-item">
            <strong>Tamaño máximo:</strong> {$uploadInfo.recommendations.maxFileSize || 'No especificado'}
          </div>
        </div>
      </div>
    {/if}

  <!-- Errores -->
  {#if $addError}
    <div class="error-message">
      <strong>Error al crear:</strong> {$addError}
    </div>
  {/if}
  {#if $updateError}
    <div class="error-message">
      <strong>Error al actualizar:</strong> {$updateError}
    </div>
  {/if}
  {#if $deleteError}
    <div class="error-message">
      <strong>Error al eliminar:</strong> {$deleteError}
    </div>
  {/if}

  <!-- Modal de confirmación de borrado -->
  <ConfirmationModal
    isOpen={confirmDelete.open}
    title="¿Eliminar slide?"
    message="¿Estás seguro de que quieres eliminar este slide? Esta acción no se puede deshacer."
    confirmText="Eliminar"
    cancelText="Cancelar"
    type="danger"
    loading={$isDeleting}
    on:confirm={handleConfirmDelete}
    on:cancel={() => (confirmDelete = { open: false, position: null })}
  />
</div>

<style>
  .hero-slides-form {
    max-width: 800px;
    margin: 0 auto;
    /* padding: var(--spacing-2xl); */
    font-family: inherit;
    background: var(--bg-primary);
    border-radius: var(--radius-xl);
    /* box-shadow: var(--shadow-md); */
  }

  .hero-slides-form .form-header h2 {
    color: var(--primary-color);
    font-size: var(--font-3xl);
    font-weight: var(--weight-bold);
  }

  .hero-slides-form .subtitle {
    color: var(--text-muted);
    font-size: var(--font-base);
  }

  .hero-slides-form .slots-info {
    color: var(--primary-color);
    font-weight: var(--weight-semibold);
  }

  .hero-slides-form .slide-accordion {
    border: 1px solid var(--bg-accent);
    border-radius: var(--radius-lg);
    margin-bottom: var(--spacing-lg);
    background: var(--bg-primary);
    transition: box-shadow var(--transition-fast);
  }
  .hero-slides-form .slide-accordion.expanded {
    box-shadow: var(--shadow-lg);
  }
  .hero-slides-form .slide-accordion.dragging {
    opacity: 0.5;
    transform: rotate(2deg);
  }
  .hero-slides-form .slide-accordion.drag-over {
    border-color: var(--primary-color);
    background: var(--bg-tertiary);
  }

  .hero-slides-form .accordion-header {
    display: flex;
    align-items: center;
    padding: var(--spacing-lg);
    cursor: pointer;
    background: var(--bg-secondary);
    border-radius: var(--radius-lg);
    transition: background-color var(--transition-fast);
    gap: var(--spacing-md);
    min-height: 80px;
  }
  .hero-slides-form .accordion-header:hover {
    background-color: var(--bg-tertiary);
  }
  .hero-slides-form .drag-handle {
    color: var(--text-light);
    font-size: var(--font-xl);
    margin-right: var(--spacing-md);
    cursor: grab;
  }
  .hero-slides-form .drag-handle:active {
    cursor: grabbing;
  }
  .hero-slides-form .slide-preview {
    flex-shrink: 0;
  }
  .hero-slides-form .slide-preview img {
    width: 60px;
    height: 40px;
    object-fit: cover;
    border-radius: var(--radius-sm);
  }
  .hero-slides-form .slide-info {
    flex: 1;
    min-width: 0;
    overflow: hidden;
  }
  .hero-slides-form .slide-info h3 {
    color: var(--text-primary);
    font-size: var(--font-lg);
    font-weight: var(--weight-semibold);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    margin: 0 0 4px 0;
  }
  .hero-slides-form .slide-info p {
    color: var(--text-muted);
    font-size: var(--font-base);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    margin: 0 0 8px 0;
  }
  .hero-slides-form .position-badge {
    background: var(--bg-accent);
    color: var(--text-primary);
    padding: 2px 8px;
    border-radius: var(--radius-full);
    font-size: var(--font-xs);
    font-weight: var(--weight-semibold);
  }
  .hero-slides-form .accordion-actions {
    margin-left: auto;
    flex-shrink: 0;
  }
  .hero-slides-form .btn-toggle {
    background: none;
    border: none;
    font-size: var(--font-xl);
    color: var(--text-light);
    cursor: pointer;
    padding: 4px;
    border-radius: var(--radius-sm);
    transition: background var(--transition-fast), color var(--transition-fast);
  }
  .hero-slides-form .btn-toggle:hover {
    background: var(--bg-accent);
    color: var(--primary-color);
  }
  .hero-slides-form .accordion-content {
    padding: var(--spacing-xl);
    border-top: 1px solid var(--bg-accent);
    background: var(--bg-tertiary);
  }
  .hero-slides-form .form-row {
    margin-bottom: var(--spacing-lg);
  }
  .hero-slides-form .form-group label {
    margin-bottom: 6px;
    font-weight: var(--weight-medium);
    color: var(--text-primary);
    font-size: var(--font-base);
  }
  .hero-slides-form .form-group input[type="text"],
  .hero-slides-form .form-group input[type="file"] {
    width: 100%;
    padding: var(--spacing-md);
    border-radius: var(--radius-md);
    border: 1px solid var(--bg-accent);
    font-size: var(--font-base);
    background: var(--bg-primary);
    color: var(--text-primary);
    transition: border-color var(--transition-fast);
  }
  .hero-slides-form .form-group input[type="text"]:focus {
    border-color: var(--primary-color);
    outline: none;
    box-shadow: 0 0 0 2px var(--primary-color);
  }
  .hero-slides-form .file-info {
    margin-top: var(--spacing-xs);
    font-size: var(--font-xs);
    color: var(--text-muted);
    display: flex;
    justify-content: space-between;
  }
  .hero-slides-form .current-image,
  .hero-slides-form .image-preview {
    width: 200px;
    height: 120px;
    border-radius: var(--radius-md);
    overflow: hidden;
    border: 1px solid var(--bg-accent);
  }
  .hero-slides-form .current-image img,
  .hero-slides-form .image-preview img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
  .hero-slides-form .form-actions {
    display: flex;
    gap: var(--spacing-md);
    margin-top: var(--spacing-lg);
    padding-top: var(--spacing-lg);
    border-top: 1px solid var(--bg-accent);
  }
  .hero-slides-form .btn {
    /* Hereda de global, solo personaliza si es necesario */
  }
  .hero-slides-form .btn-primary {
    background: var(--primary-gradient);
    color: var(--text-inverse);
  }
  .hero-slides-form .btn-danger {
    background: var(--error);
    color: var(--text-inverse);
  }
  .hero-slides-form .btn-secondary {
    background: var(--bg-accent);
    color: var(--text-primary);
  }
  .hero-slides-form .btn:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
  .hero-slides-form .view-mode {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
  }
  .hero-slides-form .slide-details {
    flex: 1;
  }
  .hero-slides-form .detail-item {
    margin-bottom: var(--spacing-xs);
    font-size: var(--font-base);
  }
  .hero-slides-form .detail-item strong {
    color: var(--text-primary);
    margin-right: 8px;
  }
  .hero-slides-form .view-actions {
    margin-left: var(--spacing-xl);
  }
  .hero-slides-form .new-slide {
    border-style: dashed;
    border-color: var(--primary-color);
    background: var(--bg-tertiary);
  }
  .hero-slides-form .new-slide-icon {
    width: 40px;
    height: 40px;
    border: 2px dashed var(--primary-color);
    border-radius: var(--radius-full);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: var(--font-xl);
    color: var(--primary-color);
    margin-right: var(--spacing-md);
    flex-shrink: 0;
  }
  .hero-slides-form .new-slide-info h3 {
    color: var(--primary-color);
  }
  .hero-slides-form .no-more-slots {
    text-align: center;
    padding: var(--spacing-xl);
    background: var(--bg-tertiary);
    border: 1px solid var(--bg-accent);
    border-radius: var(--radius-lg);
    color: var(--text-muted);
  }
  .hero-slides-form .upload-info {
    margin-top: var(--spacing-2xl);
    padding: var(--spacing-xl);
    background: var(--bg-tertiary);
    border-radius: var(--radius-lg);
    border: 1px solid var(--bg-accent);
  }
  .hero-slides-form .upload-info h4 {
    margin: 0 0 var(--spacing-md) 0;
    font-size: var(--font-lg);
    color: var(--text-primary);
  }
  .hero-slides-form .info-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: var(--spacing-md);
  }
  .hero-slides-form .info-item {
    font-size: var(--font-base);
    color: var(--text-muted);
  }
  .hero-slides-form .info-item strong {
    color: var(--text-primary);
  }
  .hero-slides-form .error-message {
    margin-top: var(--spacing-md);
    padding: var(--spacing-md) var(--spacing-lg);
    background: var(--error-bg);
    border: 1px solid var(--error-light);
    border-radius: var(--radius-md);
    color: var(--error);
    font-size: var(--font-base);
  }
  .hero-slides-form .no-slides-container {
    text-align: center;
    padding: var(--spacing-2xl) var(--spacing-lg);
    background: var(--bg-tertiary);
    border: 2px dashed var(--bg-accent);
    border-radius: var(--radius-lg);
    color: var(--text-muted);
  }
  .hero-slides-form .no-slides-container p {
    margin: 8px 0;
    font-size: var(--font-lg);
  }
  .hero-slides-form .no-slides-container p:first-child {
    font-weight: var(--weight-semibold);
    color: var(--text-primary);
  }
  /* Responsive */
  @media (max-width: 768px) {
    .hero-slides-form {
      /* padding: var(--spacing-lg); */
    }
    .hero-slides-form .accordion-header {
      padding: var(--spacing-md);
      gap: var(--spacing-sm);
      min-height: 70px;
    }
    .hero-slides-form .slide-preview img {
      width: 50px;
      height: 35px;
    }
    .hero-slides-form .slide-info h3 {
      font-size: var(--font-base);
    }
    .hero-slides-form .slide-info p {
      font-size: var(--font-sm);
    }
    .hero-slides-form .accordion-content {
      padding: var(--spacing-md);
    }
    .hero-slides-form .form-actions {
      flex-direction: column;
    }
    .hero-slides-form .view-mode {
      flex-direction: column;
    }
    .hero-slides-form .view-actions {
      margin-left: 0;
      margin-top: var(--spacing-lg);
    }
    .hero-slides-form .info-grid {
      grid-template-columns: 1fr;
    }
  }
</style>
