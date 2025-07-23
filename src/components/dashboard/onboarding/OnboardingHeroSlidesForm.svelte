<script lang="ts">
  import { onMount } from 'svelte';
  import { useHeroSlides } from '../../../stores/heroSlidesStore';
  import { heroSlidesService } from '../../../services/heroSlidesService';
  import ConfirmationModal from '../../ui/ConfirmationModal.svelte';
  import ImageUploader from '../../ui/ImageUploader.svelte';
  import { toastStore } from '../../../stores/toastStore';
  export let restaurantId: string;

  // Store
  const {
    slides,
    uploadInfo,
    isLoadingSlides,
    isLoadingUploadInfo,
    isAdding,
    isUpdating,
    isDeleting,
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
  let newSlideData = { title: '', subtitle: '', alt: '' };
  let newSlideImage: File | null = null;
  let newSlideImagePreview: string | null = null;
  let newSlideImageError = '';

  // Form data para edición
  let editingSlides: Map<number, any> = new Map();
  let editSlideImageError: Record<number, string> = {};

  // Estados de carga
  let isInitialLoading = true;
  let confirmDelete: { open: boolean; position: number | null } = { open: false, position: null };

  // Errores globales para el wizard
  let error: string | null = null;

  onMount(async () => {
    try {
      await Promise.all([
        loadHeroSlides(restaurantId),
        loadUploadInfo(restaurantId)
      ]);
    } catch (e) {
      error = 'Error al cargar slides';
    } finally {
      isInitialLoading = false;
    }
  });

  // Métodos de slide (idénticos a HeroSlidesForm, pero sin botones globales)
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
    if (!$slidesOrderedByPosition) return;
    const currentSlides = $slidesOrderedByPosition;
    const newPositions = [...currentSlides.map(s => s.position)];
    const fromIdx = currentSlides.findIndex(s => s.position === fromPosition);
    const toIdx = currentSlides.findIndex(s => s.position === toPosition);
    if (fromIdx === -1 || toIdx === -1) return;
    const [movedItem] = newPositions.splice(fromIdx, 1);
    newPositions.splice(toIdx, 0, movedItem);
    try {
      const result = await reorderHeroSlides(restaurantId, newPositions);
      if (result.success) {
        await loadHeroSlides(restaurantId, true);
        toastStore.success('Slides reordenados correctamente');
      } else {
        toastStore.error(`Error al reordenar los slides: ${result.error}`);
      }
    } catch (error) {
      toastStore.error('Error al reordenar los slides');
    }
  }

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
      } else {
        toastStore.error(result.error || 'Error al crear el slide');
      }
    } catch (error) {
      toastStore.error('Error al crear el slide');
    }
  }

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
      } else {
        toastStore.error(result.error || 'Error al actualizar el slide');
      }
    } catch (error) {
      toastStore.error('Error al actualizar el slide');
    }
  }

  function cancelEdit(position: number) {
    editingSlides.delete(position);
    editingSlides = editingSlides;
    expandedSlides.delete(position);
    expandedSlides = expandedSlides;
  }

  function cancelNewSlide() {
    newSlideData = { title: '', subtitle: '', alt: '' };
    newSlideImage = null;
    newSlideImagePreview = null;
    newSlideExpanded = false;
    clearAllErrors();
  }

  function askRemoveSlide(position: number) {
    confirmDelete = { open: true, position: position };
  }
  async function handleConfirmDelete() {
    if (confirmDelete.position !== null) {
      await removeSlide(confirmDelete.position);
      confirmDelete = { open: false, position: null };
    }
  }

  async function removeSlide(position: number) {
    try {
      const result = await deleteHeroSlide(restaurantId, position);
      if (result.success) {
        editingSlides.delete(position);
        editingSlides = editingSlides;
        expandedSlides.delete(position);
        expandedSlides = expandedSlides;
        toastStore.success('Slide eliminado correctamente');
      } else {
        toastStore.error(result.error || 'Error al eliminar el slide');
      }
    } catch (error) {
      toastStore.error('Error al eliminar el slide');
    }
  }

  // Exponer método save() para el wizard
  export async function save() {
    // Validar que haya al menos un slide guardado
    if (!$slidesOrderedByPosition || $slidesOrderedByPosition.length === 0) {
      error = 'Debes agregar al menos una imagen destacada.';
      return false;
    }
    error = null;
    return true;
  }
</script>

<div class="hero-slides-form onboarding-hero-slides-form">
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
    <div class="no-slides-container">
      <p>Error al cargar los hero slides.</p>
      <p>Intenta recargar la página.</p>
    </div>
  {:else}
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
                <h3>{slide.title}</h3>
                <p>{slide.subtitle}</p>
                <span class="position-badge">Posición {slide.position}</span>
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
  {/if}
  {#if error}
    <div class="error-state mt-lg">{error}</div>
  {/if}
</div>

<style>
.onboarding-hero-slides-form {
  max-width: 800px;
  margin: 0 auto;
  /* padding: var(--spacing-lg) var(--spacing-md); */
  font-family: inherit;
  background: var(--bg-primary);
  border-radius: var(--radius-xl);
  /* box-shadow: var(--shadow-md); */
}

.form-header h2 {
  color: var(--primary-color);
  font-size: var(--font-3xl);
  font-weight: var(--weight-bold);
  margin-bottom: var(--spacing-md);
}

.form-header .subtitle {
  color: var(--text-muted);
  font-size: var(--font-base);
  margin-bottom: var(--spacing-md);
}

.slots-info {
  color: var(--primary-color);
  font-weight: var(--weight-semibold);
}

.slides-container {
  margin-top: var(--spacing-md);
}

.slide-accordion {
  /* border: 1px solid var(--bg-accent); */
  border-radius: var(--radius-lg);
  margin-bottom: var(--spacing-md);
  background: var(--bg-primary);
  transition: box-shadow var(--transition-fast);
}
.slide-accordion.expanded {
  box-shadow: var(--shadow-lg);
}
.slide-accordion.dragging {
  opacity: 0.5;
  transform: rotate(2deg);
}
.slide-accordion.drag-over {
  border-color: var(--primary-color);
  background: var(--bg-tertiary);
}

.accordion-header {
  display: flex;
  align-items: center;
  padding: var(--spacing-md);
  cursor: pointer;
  background: var(--bg-secondary);
  border-radius: var(--radius-lg);
  transition: background-color var(--transition-fast);
}
.accordion-header:hover {
  background-color: var(--bg-tertiary);
}
.drag-handle {
  color: var(--text-light);
  font-size: var(--font-xl);
  margin-right: var(--spacing-md);
  cursor: grab;
}
.drag-handle:active {
  cursor: grabbing;
}
.slide-preview img {
  width: 60px;
  height: 40px;
  object-fit: cover;
  border-radius: var(--radius-sm);
}
.slide-info h3 {
  color: var(--text-primary);
  font-size: var(--font-lg);
  font-weight: var(--weight-semibold);
}
.slide-info p {
  color: var(--text-muted);
  font-size: var(--font-base);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.position-badge {
  background: var(--bg-accent);
  color: var(--text-primary);
  padding: 2px 8px;
  border-radius: var(--radius-full);
  font-size: var(--font-xs);
  font-weight: var(--weight-semibold);
}
.accordion-actions {
  margin-left: auto;
}
.btn-toggle {
  background: none;
  border: none;
  font-size: var(--font-xl);
  color: var(--text-light);
  cursor: pointer;
  padding: 4px;
  border-radius: var(--radius-sm);
  transition: background var(--transition-fast), color var(--transition-fast);
}
.btn-toggle:hover {
  background: var(--bg-accent);
  color: var(--primary-color);
}
.accordion-content {
  padding: var(--spacing-md);
  border-top: 1px solid var(--bg-accent);
  background: var(--bg-tertiary);
  max-height: 320px;
  overflow-y: auto;
}
.form-row {
  margin-bottom: var(--spacing-md);
}
.form-group label {
  margin-bottom: 4px;
  font-weight: var(--weight-medium);
  color: var(--text-primary);
  font-size: var(--font-base);
}
.form-group input[type="text"],
.form-group input[type="file"] {
  width: 100%;
  padding: var(--spacing-sm);
  border-radius: var(--radius-md);
  border: 1px solid var(--bg-accent);
  font-size: var(--font-base);
  background: var(--bg-primary);
  color: var(--text-primary);
  transition: border-color var(--transition-fast);
}
.form-group input[type="text"]:focus {
  border-color: var(--primary-color);
  outline: none;
  box-shadow: 0 0 0 2px var(--primary-color);
}
.file-info {
  margin-top: var(--spacing-xs);
  font-size: var(--font-xs);
  color: var(--text-muted);
  display: flex;
  justify-content: space-between;
}
.current-image,
.image-preview {
  width: 180px;
  height: 100px;
  border-radius: var(--radius-md);
  overflow: hidden;
  border: 1px solid var(--bg-accent);
}
.current-image img,
.image-preview img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.form-actions {
  display: flex;
  gap: var(--spacing-sm);
  margin-top: var(--spacing-md);
  padding-top: var(--spacing-md);
  border-top: 1px solid var(--bg-accent);
}
.btn-primary {
  background: var(--primary-gradient);
  color: var(--text-inverse);
}
.btn-danger {
  background: var(--error);
  color: var(--text-inverse);
}
.btn-secondary {
  background: var(--bg-accent);
  color: var(--text-primary);
}
.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
.view-mode {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}
.slide-details {
  flex: 1;
}
.detail-item {
  margin-bottom: var(--spacing-xs);
  font-size: var(--font-base);
}
.detail-item strong {
  color: var(--text-primary);
  margin-right: 8px;
}
.view-actions {
  margin-left: var(--spacing-lg);
}
.new-slide {
  border-style: dashed;
  border-color: var(--primary-color);
  background: var(--bg-tertiary);
}
.new-slide-icon {
  width: 36px;
  height: 36px;
  border: 2px dashed var(--primary-color);
  border-radius: var(--radius-full);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: var(--font-lg);
  color: var(--primary-color);
  margin-right: var(--spacing-md);
  flex-shrink: 0;
}
.new-slide-info h3 {
  color: var(--primary-color);
}
.no-more-slots {
  text-align: center;
  padding: var(--spacing-lg);
  background: var(--bg-tertiary);
  border: 1px solid var(--bg-accent);
  border-radius: var(--radius-lg);
  color: var(--text-muted);
}
.upload-info {
  margin-top: var(--spacing-xl);
  padding: var(--spacing-lg);
  background: var(--bg-tertiary);
  border-radius: var(--radius-lg);
  border: 1px solid var(--bg-accent);
}
.upload-info h4 {
  margin: 0 0 var(--spacing-md) 0;
  font-size: var(--font-lg);
  color: var(--text-primary);
}
.info-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: var(--spacing-sm);
}
.info-item {
  font-size: var(--font-base);
  color: var(--text-muted);
}
.info-item strong {
  color: var(--text-primary);
}
.error-message {
  margin-top: var(--spacing-md);
  padding: var(--spacing-md) var(--spacing-lg);
  background: var(--error-bg);
  border: 1px solid var(--error-light);
  border-radius: var(--radius-md);
  color: var(--error);
  font-size: var(--font-base);
}
.no-slides-container {
  text-align: center;
  padding: var(--spacing-xl) var(--spacing-md);
  background: var(--bg-tertiary);
  border: 2px dashed var(--bg-accent);
  border-radius: var(--radius-lg);
  color: var(--text-muted);
}
.no-slides-container p {
  margin: 8px 0;
  font-size: var(--font-lg);
}
.no-slides-container p:first-child {
  font-weight: var(--weight-semibold);
  color: var(--text-primary);
}
@media (max-width: 768px) {
  .onboarding-hero-slides-form {
    /* padding: var(--spacing-md); */
  }
  .accordion-header {
    padding: var(--spacing-sm);
  }
  .slide-preview img {
    width: 40px;
    height: 28px;
  }
  .accordion-content {
    padding: var(--spacing-sm);
  }
  .form-actions {
    flex-direction: column;
  }
  .view-mode {
    flex-direction: column;
  }
  .view-actions {
    margin-left: 0;
    margin-top: var(--spacing-md);
  }
  .info-grid {
    grid-template-columns: 1fr;
  }
}
</style> 