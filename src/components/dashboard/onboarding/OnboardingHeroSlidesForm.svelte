<script lang="ts">
  import { onMount } from 'svelte';
  import { useHeroSlides } from '../../../stores/heroSlidesStore';
  import { heroSlidesService } from '../../../services/heroSlidesService';
  import ConfirmationModal from '../../ui/ConfirmationModal.svelte';
  import CompactImageCard from '../../ui/CompactImageCard.svelte';
  import { toastStore } from '../../../stores/toastStore';
  import './OnboardingHeroSlidesForm.css';
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
      toastStore.error('Error al cargar slides');
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
    // Para el wizard, este paso es opcional
    // Si no hay slides, simplemente retornamos true
    if (!$slidesOrderedByPosition || $slidesOrderedByPosition.length === 0) {
      // No es un error, simplemente no hay slides configurados
      error = null;
      return true;
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
                      <div class="form-group image-card-center">
                        <CompactImageCard
                          label="Nueva imagen (opcional)"
                          accept="image/jpeg,image/jpg,image/png,image/webp"
                          currentImage={editingSlide.imagePreview || editingSlide.originalImage}
                          on:fileSelected={(e) => {
                            editingSlide.image = e.detail.file;
                            if (e.detail.file) {
                              const reader = new FileReader();
                              reader.onload = (ev) => {
                                editingSlide.imagePreview = ev.target?.result;
                                editSlideImageError[slide.position] = '';
                                editingSlides = editingSlides;
                              };
                              reader.readAsDataURL(e.detail.file);
                            } else {
                              editingSlide.imagePreview = null;
                              editingSlides = editingSlides;
                            }
                          }}
                          on:remove={() => {
                            editingSlide.image = null;
                            editingSlide.imagePreview = null;
                            editingSlides = editingSlides;
                          }}
                          error={editSlideImageError[slide.position]}
                          uploading={$isUpdating}
                          width={180}
                          height={100}
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
                <div class="form-group image-card-center">
                  <CompactImageCard
                    label="Imagen *"
                    accept="image/jpeg,image/jpg,image/png,image/webp"
                    required={true}
                    currentImage={newSlideImagePreview}
                    on:fileSelected={(e) => {
                      newSlideImage = e.detail.file;
                      if (e.detail.file) {
                        const reader = new FileReader();
                        reader.onload = (ev) => {
                          newSlideImagePreview = ev.target?.result as string;
                          newSlideImageError = '';
                        };
                        reader.readAsDataURL(e.detail.file);
                      } else {
                        newSlideImagePreview = null;
                      }
                    }}
                    on:remove={() => {
                      newSlideImage = null;
                      newSlideImagePreview = null;
                    }}
                    error={newSlideImageError}
                    uploading={$isAdding}
                    width={180}
                    height={100}
                  />
                </div>
              </div>
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
</div>
