<!-- src/components/restaurant/RestaurantDashboard.svelte -->
<!-- Dashboard integrado con gestión de categorías y platillos -->

<script lang="ts">
  import { onMount } from 'svelte';
  import { slide } from 'svelte/transition';
  import { quintOut } from 'svelte/easing';
  import GlobalModal from '../ui/GlobalModal.svelte';
  import ConfirmationModal from '../ui/ConfirmationModal.svelte';
  import CategoryForm from './CategoryForm.svelte';
  import DishForm from './DishForm.svelte';
  import restaurantService from '../../services/restaurantService';
  import {
    useCategories,
    useDishes,
    allCategories,
    allDishes,
    dishUtils,
    SORT_CONSTANTS,
    DEFAULT_DISH_CONFIG
  } from '../../services/index.ts';
  import type { Category } from '../../interfaces/category.ts';
  import type { Dish } from '../../interfaces/dish.ts';
  import type { DishSortField } from '../../services/dishService.ts';
  import { toastStore } from '../../stores/toastStore.ts';

  export let idRestaurant : string | null = null; 
  
  // Estado de carga y error
  let loading = false;
  let error: string | null = null;

  // Estado del restaurante
  export let restaurant: any = null;

  // Stores para categorías y platillos
  const {
    isLoadingAll: isLoadingCategories,
    isCreating: isCreatingCategory,
    isUpdating: isUpdatingCategory,
    isDeleting: isDeletingCategory,
    isReordering: isReorderingCategories,
    error: categoryError,
    createError: categoryCreateError,
    updateError: categoryUpdateError,
    deleteError: categoryDeleteError,
    reorderError: categoryReorderError,
    loadAllCategories,
    createCategory,
    updateCategory,
    deleteCategory,
    reorderAfterDragDrop,
    getCategoriesSortedByOrder,
    updateCategoryOrderOptimistically,
    revertCategoryOrderOptimistically,
    clearAllErrors: clearCategoryErrors
  } = useCategories();

  const {
    isLoadingAll: isLoadingDishes,
    isCreating: isCreatingDish,
    isUpdating: isUpdatingDish,
    isDeleting: isDeletingDish,
    isReorderingDishes,
    error: dishError,
    createError: dishCreateError,
    updateError: dishUpdateError,
    deleteError: dishDeleteError,
    reorderError: dishReorderError,
    loadDishesByFilters,
    createDish,
    updateDish,
    deleteDish,
    reorderDishes,
    clearAllErrors: clearDishErrors
  } = useDishes();

  // Estado del modal
  let activeModal: 'category' | 'dish' | null = null;
  let editingCategory: Category | null = null;
  let editingDish: Dish | null = null;
  let selectedCategoryForDish: Category | null = null;

  // Estado para el modal de confirmación
  let showConfirmModal = false;
  let confirmAction: 'deleteCategory' | 'deleteDish' | null = null;
  let itemToDelete: { id: string; name: string; type: 'category' | 'dish' } | null = null;

  // Estado para el modal informativo
  let showInfoModal = false;
  let infoModalMessage = '';

  // Estado para manejar errores de imágenes
  let imageErrors = new Set();
  let visibleActions = new Set();
  
  // Estado para categorías expandibles
  let expandedCategories: string[] = [];

  // Estado para drag & drop de categorías
  let draggedCategory: Category | null = null;
  let draggedOverCategory: Category | null = null;
  let isDraggingCategory = false;
  let categoryDragStartIndex = -1;
  let originalCategories: Category[] = [];

  // Estado para drag & drop de platillos
  let draggedDish: Dish | null = null;
  let draggedOverDish: Dish | null = null;
  let isDraggingDish = false;
  let dishDragStartIndex = -1;
  let originalDishes: Dish[] = [];
  let activeDragCategoryId: string | null = null;

  // Cargar restaurante cuando cambia idRestaurant
  $: if (idRestaurant) {
    loading = true;
    error = null;
    
    restaurantService.getRestaurant(idRestaurant)
      .then(result => {
        if (result.success) {
          restaurant = result.data;
          loadInitialData();
        } else {
          error = result.error || 'No se pudo cargar el restaurante';
          restaurant = null;
        }
      })
      .catch(e => {
        error = e.message || 'Error desconocido';
        restaurant = null;
      })
      .finally(() => {
        loading = false;
      });
  }

  // Event listener para cerrar controles de ordenamiento
  onMount(() => {
    document.addEventListener('click', handleClickOutside);
    
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  });

  // Computed
  $: hasCategories = Array.isArray(displayCategories) && displayCategories.length > 0;
  $: hasDishes = Array.isArray($allDishes) && $allDishes.length > 0;
  $: isLoading = loading || isLoadingCategories || isLoadingDishes || isReorderingDishes;
  
  // Debug para verificar reactividad
  $: console.log('allDishes updated:', $allDishes.length, 'dishes');
  $: console.log('isReorderingDishes:', isReorderingDishes);
  
  // Categorías ordenadas por el campo order
  $: sortedCategories = $allCategories
    .filter(c => !restaurant?.id || c.restaurantId === restaurant.id)
    .sort((a, b) => {
      const orderA = a.order || 0;
      const orderB = b.order || 0;
      return orderA - orderB;
    });
  
  // Fallback: si no hay categorías ordenadas pero sí hay categorías, usar las originales
  $: displayCategories = sortedCategories.length > 0 ? sortedCategories : $allCategories.filter(c => !restaurant?.id || c.restaurantId === restaurant.id);
  
  // Debug logging
  $: console.log('Debug - allCategories:', $allCategories);
  $: console.log('Debug - restaurant.id:', restaurant?.id);
  $: console.log('Debug - sortedCategories:', sortedCategories);
  $: console.log('Debug - displayCategories:', displayCategories);
  $: console.log('Debug - hasCategories:', hasCategories);

  // Methods
  async function loadInitialData() {
    if (!restaurant?.id) return;
    
    try {
      await loadAllCategories(restaurant.id);
      await loadDishesByFilters(undefined, restaurant.id, { limit: 100, page: 1 });
    } catch (error) {
      console.error('Error cargando datos iniciales:', error);
    }
  }

  function openCategoryForm(category: Category | null = null) {
    editingCategory = category;
    activeModal = 'category';
    clearCategoryErrors();
  }

  function openDishForm(category: Category | null = null, dish: Dish | null = null) {
    if (!hasCategories && !category) {
      alert('Necesitas crear al menos una categoría antes de agregar platillos.');
      return;
    }
    
    editingDish = dish;
    selectedCategoryForDish = category;
    activeModal = 'dish';
    clearDishErrors();
  }

  function closeModal() {
    activeModal = null;
    editingCategory = null;
    editingDish = null;
    selectedCategoryForDish = null;
  }

  async function handleCategorySubmit(event: CustomEvent) {
    const categoryData = event.detail;
    
    try {
      const result = editingCategory 
        ? await updateCategory(editingCategory.id!, categoryData)
        : await createCategory({ ...categoryData, restaurantId: restaurant.id });

      if (result.success) {
        closeModal();
        await loadInitialData();
        toastStore.success(editingCategory ? 'Categoría actualizada correctamente' : 'Categoría creada correctamente');
      } else if (result.error) {
        toastStore.error(result.error);
      }
    } catch (error) {
      console.error('Error con categoría:', error);
      toastStore.error('Error al guardar la categoría');
    }
  }

  async function handleDishSubmit(event: CustomEvent) {
    const { dishData, image } = event.detail;
    
    try {
      const finalData = {
        ...dishData,
        restaurantId: restaurant.id,
        categoryId: selectedCategoryForDish?.id || dishData.categoryId
      };

      const result = editingDish 
        ? await updateDish(editingDish.id!, finalData, image)
        : await createDish(finalData, image);

      if (result.success) {
        closeModal();
        await loadInitialData();
        toastStore.success(editingDish ? 'Platillo actualizado correctamente' : 'Platillo creado correctamente');
      } else if (result.error) {
        toastStore.error(result.error);
      }
    } catch (error) {
      console.error('Error con platillo:', error);
      toastStore.error('Error al guardar el platillo');
    }
  }

  async function handleDeleteCategory(categoryId: string) {
    const category = $allCategories.find(c => c.id === categoryId);
    if (!category) return;

    // Verifica si la categoría tiene platillos
    const dishesInCategory = getDishesForCategory(categoryId);
    if (dishesInCategory.length > 0) {
      infoModalMessage = 'Debes borrar primero todos los platillos de la categoría antes de poder eliminarla.';
      showInfoModal = true;
      return;
    }

    itemToDelete = { id: categoryId, name: category.name, type: 'category' };
    confirmAction = 'deleteCategory';
    showConfirmModal = true;
  }

  async function handleDeleteDish(dishId: string) {
    const dish = $allDishes.find(d => d.id === dishId);
    if (!dish) return;
    
    itemToDelete = { id: dishId, name: dish.name, type: 'dish' };
    confirmAction = 'deleteDish';
    showConfirmModal = true;
  }

  async function executeDelete() {
    if (!itemToDelete || !confirmAction) return;

    try {
      let result;
      
      if (confirmAction === 'deleteCategory') {
        result = await deleteCategory(itemToDelete.id);
      } else if (confirmAction === 'deleteDish') {
        result = await deleteDish(itemToDelete.id);
      }

      if (result?.success) {
        await loadInitialData();
        toastStore.success(itemToDelete.type === 'category' ? 'Categoría eliminada correctamente' : 'Platillo eliminado correctamente');
      } else if (result?.error) {
        toastStore.error(result.error);
      }
    } catch (error) {
      console.error('Error eliminando elemento:', error);
      toastStore.error('Error al eliminar el elemento');
    } finally {
      showConfirmModal = false;
      confirmAction = null;
      itemToDelete = null;
    }
  }

  function cancelDelete() {
    showConfirmModal = false;
    confirmAction = null;
    itemToDelete = null;
  }

  // Computed para platillos de cada categoría - Reactivo
  $: dishesByCategory = (categoryId: string) => {
    const dishes = $allDishes.filter(dish => dish.categoryId === categoryId);
    
    // Ordenar por posición si está disponible, sino por nombre
    return dishes.sort((a, b) => {
      const aPos = a.position || 0;
      const bPos = b.position || 0;
      
      if (aPos !== bPos) {
        return aPos - bPos;
      }
      
      // Si no hay posición, ordenar por nombre
      return a.name.localeCompare(b.name);
    });
  };

  // Función para compatibilidad
  function getDishesForCategory(categoryId: string): Dish[] {
    return dishesByCategory(categoryId);
  }

  function getCategoryName(categoryId: string): string {
    const category = $allCategories.find(c => c.id === categoryId);
    return category?.name || 'Sin categoría';
  }

  function formatPrice(price: number): string {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN'
    }).format(price);
  }

  // Funciones para drag & drop de platillos
  function handleDishDragStart(event: DragEvent, dish: Dish, index: number, categoryId: string) {
    if (!event.dataTransfer) return;
    
    draggedDish = dish;
    dishDragStartIndex = index;
    activeDragCategoryId = categoryId;
    originalDishes = [...dishesByCategory(categoryId)];
    isDraggingDish = true;
    
    // Configurar el drag data
    event.dataTransfer.effectAllowed = 'move';
    event.dataTransfer.setData('text/plain', dish.id || '');
    
    // Agregar clase visual
    const target = event.target as HTMLElement;
    if (target) {
      target.classList.add('dragging-dish');
    }
    
    console.log('Dish drag started:', dish.name, 'from index:', index, 'in category:', categoryId);
  }

  function handleDishDragOver(event: DragEvent, dish: Dish) {
    event.preventDefault();
    event.dataTransfer!.dropEffect = 'move';
    
    if (draggedDish && draggedDish.id !== dish.id) {
      draggedOverDish = dish;
    }
  }

  function handleDishDragEnter(event: DragEvent, dish: Dish) {
    event.preventDefault();
    if (draggedDish && draggedDish.id !== dish.id) {
      draggedOverDish = dish;
    }
  }

  function handleDishDragLeave(event: DragEvent) {
    event.preventDefault();
    const target = event.target as HTMLElement;
    const relatedTarget = event.relatedTarget as HTMLElement;
    
    if (!target.contains(relatedTarget)) {
      draggedOverDish = null;
    }
  }

  async function handleDishDrop(event: DragEvent, targetDish: Dish, targetIndex: number, categoryId: string) {
    event.preventDefault();
    
    if (!draggedDish || !event.dataTransfer || activeDragCategoryId !== categoryId) return;
    
    const draggedIndex = dishDragStartIndex;
    
    // Limpiar estado visual
    const target = event.target as HTMLElement;
    if (target) {
      target.classList.remove('dragging-dish');
    }
    
    // Verificar que realmente se movió
    if (draggedIndex === targetIndex) {
      console.log('No dish movement detected');
      resetDishDragState();
      return;
    }
    
    console.log('Dish drop detected:', {
      dragged: draggedDish.name,
      target: targetDish.name,
      fromIndex: draggedIndex,
      toIndex: targetIndex,
      categoryId
    });
    
    try {
      const result = await reorderDishes(originalDishes, draggedIndex, targetIndex, categoryId);
      
      if (result.success) {
        toastStore.success('Platillos reordenados correctamente');
        console.log('Dish reorder successful:', result.message);
      } else {
        toastStore.error(result.error || 'Error al reordenar platillos');
        console.error('Dish reorder failed:', result.error);
      }
    } catch (error) {
      console.error('Error during dish reorder:', error);
      toastStore.error('Error inesperado al reordenar platillos');
    } finally {
      resetDishDragState();
    }
  }

  function handleDishDragEnd(event: DragEvent) {
    event.preventDefault();
    
    // Limpiar clases visuales
    const target = event.target as HTMLElement;
    if (target) {
      target.classList.remove('dragging-dish');
    }
    
    resetDishDragState();
  }

  function resetDishDragState() {
    draggedDish = null;
    draggedOverDish = null;
    isDraggingDish = false;
    dishDragStartIndex = -1;
    originalDishes = [];
    activeDragCategoryId = null;
  }

  function getDishDragClasses(dish: Dish): string {
    let classes = 'dish-card';
    
    if (draggedDish?.id === dish.id) {
      classes += ' dragging-dish';
    }
    
    if (draggedOverDish?.id === dish.id && draggedDish?.id !== dish.id) {
      classes += ' drag-over-dish';
    }
    
    // Agregar clase de reordenamiento en progreso
    if (isReorderingDishes) {
      classes += ' reordering';
    }
    
    return classes;
  }

  // Función para determinar si se puede hacer drag & drop de categorías
  function canDragCategories(): boolean {
    return expandedCategories.length === 0;
  }

  // Función para determinar si se puede hacer drag & drop de platillos
  function canDragDishes(categoryId: string): boolean {
    return expandedCategories.includes(categoryId);
  }

  // Cerrar controles al hacer clic fuera
  function handleClickOutside(event: MouseEvent) {
    // Esta función se mantiene para futuras funcionalidades
  }

  function handleImageError(dishId: string) {
    imageErrors.add(dishId);
    imageErrors = imageErrors; // Trigger reactivity
  }

  function shouldShowImage(dish: Dish): boolean {
    return !!(dish.image && !imageErrors.has(dish.id!));
  }

  function showActions(dishId: string) {
    visibleActions.add(dishId);
    visibleActions = visibleActions;
  }

  function hideActions(dishId: string) {
    visibleActions.delete(dishId);
    visibleActions = visibleActions;
  }

  function areActionsVisible(dishId: string): boolean {
    return visibleActions.has(dishId);
  }

  function toggleCategory(categoryId: string) {
    console.log('Toggle category:', categoryId);
    console.log('Current expanded categories:', expandedCategories);
    
    if (expandedCategories.includes(categoryId)) {
      expandedCategories = expandedCategories.filter(id => id !== categoryId);
      console.log('Removed category from expanded');
    } else {
      expandedCategories = [...expandedCategories, categoryId];
      console.log('Added category to expanded');
    }
    
    console.log('Updated expanded categories:', expandedCategories);
  }

  function isCategoryExpanded(categoryId: string): boolean {
    const isExpanded = expandedCategories.includes(categoryId);
    console.log(`isCategoryExpanded called for ${categoryId}:`, isExpanded);
    console.log(`Current expandedCategories array:`, expandedCategories);
    return isExpanded;
  }

  // Reactive statement to force re-render when expandedCategories changes
  $: console.log('expandedCategories changed:', expandedCategories);

  function expandAllCategories() {
    console.log('Expanding all categories');
    expandedCategories = $allCategories.map(category => category.id!);
    console.log('All categories expanded:', expandedCategories);
  }

  function collapseAllCategories() {
    console.log('Collapsing all categories');
    expandedCategories = [];
    console.log('All categories collapsed');
  }

  // Drag & Drop Functions para categorías
  function handleDragStart(event: DragEvent, category: Category, index: number) {
    if (!event.dataTransfer || !canDragCategories()) return;
    
    draggedCategory = category;
    categoryDragStartIndex = index;
    originalCategories = [...sortedCategories];
    isDraggingCategory = true;
    
    // Configurar el drag data
    event.dataTransfer.effectAllowed = 'move';
    event.dataTransfer.setData('text/plain', category.id || '');
    
    // Agregar clase visual
    const target = event.target as HTMLElement;
    if (target) {
      target.classList.add('dragging');
    }
    
    console.log('Category drag started:', category.name, 'from index:', index);
  }

  function handleDragOver(event: DragEvent, category: Category) {
    event.preventDefault();
    event.dataTransfer!.dropEffect = 'move';
    
    if (draggedCategory && draggedCategory.id !== category.id) {
      draggedOverCategory = category;
    }
  }

  function handleDragEnter(event: DragEvent, category: Category) {
    event.preventDefault();
    if (draggedCategory && draggedCategory.id !== category.id) {
      draggedOverCategory = category;
    }
  }

  function handleDragLeave(event: DragEvent) {
    event.preventDefault();
    // Solo limpiar si no estamos sobre el mismo elemento
    const target = event.target as HTMLElement;
    const relatedTarget = event.relatedTarget as HTMLElement;
    
    if (!target.contains(relatedTarget)) {
      draggedOverCategory = null;
    }
  }

  async function handleDrop(event: DragEvent, targetCategory: Category, targetIndex: number) {
    event.preventDefault();
    
    if (!draggedCategory || !event.dataTransfer || !canDragCategories()) return;
    
    const draggedIndex = categoryDragStartIndex;
    
    // Limpiar estado visual
    const target = event.target as HTMLElement;
    if (target) {
      target.classList.remove('dragging');
    }
    
    // Verificar que realmente se movió
    if (draggedIndex === targetIndex) {
      console.log('No category movement detected');
      resetDragState();
      return;
    }
    
    console.log('Category drop detected:', {
      dragged: draggedCategory.name,
      target: targetCategory.name,
      fromIndex: draggedIndex,
      toIndex: targetIndex
    });
    
    try {
      // Actualización optimista
      const optimisticCategories = [...originalCategories];
      const [movedItem] = optimisticCategories.splice(draggedIndex, 1);
      optimisticCategories.splice(targetIndex, 0, movedItem);
      
      // Actualizar órdenes optimistamente
      optimisticCategories.forEach((cat, index) => {
        updateCategoryOrderOptimistically(cat.id!, index + 1);
      });
      
      // Llamar al servicio de reordenamiento
      const result = await reorderAfterDragDrop(originalCategories, draggedIndex, targetIndex);
      
      if (result.success) {
        toastStore.success('Categorías reordenadas correctamente');
        console.log('Category reorder successful:', result.message);
      } else {
        // Revertir cambios optimistas en caso de error
        originalCategories.forEach((cat, index) => {
          revertCategoryOrderOptimistically(cat.id!, cat.order || index + 1);
        });
        
        toastStore.error(result.error || 'Error al reordenar categorías');
        console.error('Category reorder failed:', result.error);
      }
    } catch (error) {
      // Revertir cambios optimistas en caso de excepción
      originalCategories.forEach((cat, index) => {
        revertCategoryOrderOptimistically(cat.id!, cat.order || index + 1);
      });
      
      console.error('Error during category reorder:', error);
      toastStore.error('Error inesperado al reordenar categorías');
    } finally {
      resetDragState();
    }
  }

  function handleDragEnd(event: DragEvent) {
    event.preventDefault();
    
    // Limpiar clases visuales
    const target = event.target as HTMLElement;
    if (target) {
      target.classList.remove('dragging');
    }
    
    resetDragState();
  }

  function resetDragState() {
    draggedCategory = null;
    draggedOverCategory = null;
    isDraggingCategory = false;
    categoryDragStartIndex = -1;
    originalCategories = [];
  }

  function getDragClasses(category: Category): string {
    let classes = 'category-card';
    
    if (!canDragCategories()) {
      classes += ' drag-disabled';
    }
    
    if (draggedCategory?.id === category.id) {
      classes += ' dragging';
    }
    
    if (draggedOverCategory?.id === category.id && draggedCategory?.id !== category.id) {
      classes += ' drag-over';
    }
    
    return classes;
  }
</script>

<div class="restaurant-dashboard">
  {#if loading}
    <div class="loading-state">
      <div class="spinner" aria-label="Cargando">
        <svg class="spinner-svg" viewBox="0 0 50 50">
          <circle class="spinner-bg" cx="25" cy="25" r="20" fill="none" stroke-width="6" />
          <circle class="spinner-fg" cx="25" cy="25" r="20" fill="none" stroke-width="6" />
        </svg>
      </div>
      <h3 class="loading-title">Cargando restaurante...</h3>
      <p class="loading-subtitle">Preparando tu panel de administración</p>
    </div>
  {:else if error}
    <div class="error-state">
      <i>⚠️</i>
      <h3>Error</h3>
      <p>{error}</p>
    </div>
  {:else if restaurant}
    <!-- Dashboard Header -->
    <div class="dashboard-header">
      <div class="header-content">
        <div class="restaurant-info">
          <h1 class="restaurant-name">{restaurant?.name}</h1>
          <p class="restaurant-subtitle">Panel de administración del menú</p>
        </div>
        
        <div class="stats-overview">
          <div class="stat-card">
            <div class="stat-icon">
              <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 002 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
            <div class="stat-content">
              <div class="stat-value">{$allCategories?.length || 0}</div>
              <div class="stat-label">Categorías</div>
            </div>
          </div>
          <div class="stat-card">
            <div class="stat-icon">
              <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
            <div class="stat-content">
              <div class="stat-value">{$allDishes?.length || 0}</div>
              <div class="stat-label">Platillos</div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Error Display -->
    {#if categoryError || dishError || categoryReorderError || dishReorderError}
      <div class="error-container">
        <div class="error-content">
          <svg class="error-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
          <div class="error-text">
            <p class="error-title">Error en el sistema</p>
            <p class="error-message">
              {categoryError || dishError || categoryReorderError || dishReorderError}
            </p>
          </div>
        </div>
      </div>
    {/if}

    <!-- Menu Management Section -->
    <div class="menu-management-section">
      <div class="section-header">
        <div class="header-text">
          <h2 class="section-title">Gestión del Menú</h2>
          <p class="section-subtitle">
            Organiza tu menú creando categorías y agregando platillos
            {#if hasCategories}
              {#if canDragCategories()}
                <br><span class="drag-hint">💡 Arrastra las categorías para reordenarlas</span>
              {:else}
                <br><span class="drag-hint">💡 Colapsa todas las categorías para reordenarlas</span>
              {/if}
            {/if}
          </p>
        </div>
        
        <div class="header-actions">
          <button
            type="button"
            class="btn-primary"
            on:click={() => openCategoryForm()}
            disabled={isLoading}
          >
            <svg class="btn-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
            </svg>
            Nueva Categoría
          </button>
          
          {#if hasCategories}
            <div class="expand-actions">
              <button
                type="button"
                class="btn-secondary btn-sm"
                on:click={() => {
                  console.log('Expand all clicked');
                  expandAllCategories();
                }}
                disabled={isLoading}
              >
                <svg class="btn-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                </svg>
                Expandir Todo
              </button>
              <button
                type="button"
                class="btn-secondary btn-sm"
                on:click={() => {
                  console.log('Collapse all clicked');
                  collapseAllCategories();
                }}
                disabled={isLoading}
              >
                <svg class="btn-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                </svg>
                Colapsar Todo
              </button>
            </div>
          {/if}
          
          <!-- Botón de recarga para debugging -->
          <button
            type="button"
            class="btn-secondary btn-sm"
            on:click={() => {
              console.log('Reloading data...');
              loadInitialData();
            }}
            disabled={isLoading}
            title="Recargar datos"
          >
            <svg class="btn-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Recargar
          </button>
        </div>  
      </div>

      <!-- Categories and Dishes -->
      {#if isLoading}
        <div class="loading-container">
          <div class="spinner" aria-label="Cargando menú">
            <svg class="spinner-svg" viewBox="0 0 50 50">
              <circle class="spinner-bg" cx="25" cy="25" r="20" fill="none" stroke-width="6" />
              <circle class="spinner-fg" cx="25" cy="25" r="20" fill="none" stroke-width="6" />
            </svg>
          </div>
          <p class="loading-text">Cargando menú...</p>
        </div>
      
      {:else if !hasCategories}
        <!-- Empty State - No Categories -->
        <div class="empty-state">
          <div class="empty-icon-container">
            <svg class="empty-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 002 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
          </div>
          <h3 class="empty-title">No hay categorías aún</h3>
          <p class="empty-subtitle">
            Crea tu primera categoría para comenzar a organizar tu menú
          </p>
          <button
            type="button"
            class="btn-primary"
            on:click={() => openCategoryForm()}
          >
            <svg class="btn-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
            </svg>
            Crear Primera Categoría
          </button>
        </div>
      
      {:else}
        <!-- Categories Grid with Drag & Drop -->
        <div class="categories-grid">
          {#each displayCategories as category, index}
            <div 
              class={getDragClasses(category)}
              draggable={canDragCategories()}
              on:dragstart={(e) => handleDragStart(e, category, index)}
              on:dragover={(e) => handleDragOver(e, category)}
              on:dragenter={(e) => handleDragEnter(e, category)}
              on:dragleave={handleDragLeave}
              on:drop={(e) => handleDrop(e, category, index)}
              on:dragend={handleDragEnd}
            >
              <div class="category-header">
                <div class="category-info" on:click={() => {
                  console.log('Category info clicked:', category.id);
                  toggleCategory(category.id!);
                }}>
                  <div class="category-title-row">
                    <div class="category-title-with-drag">
                      <div class="drag-handle" title="Arrastra para reordenar">
                        <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 8h16M4 16h16" />
                        </svg>
                      </div>
                      <h3 class="category-name">
                        {category.name}
                        <span class="click-indicator">👆</span>
                      </h3>
                    </div>
                    <div class="category-stats">
                      <span class="dish-count">{dishesByCategory(category.id!).length} platillos</span>
                      {#if category.order !== undefined}
                        <span class="order-indicator">#{category.order}</span>
                      {/if}
                      {#if canDragDishes(category.id!)}
                        <span class="drag-enabled-indicator" title="Drag & drop de platillos habilitado">
                          🎯
                        </span>
                      {/if}
                    </div>
                  </div>
                  {#if category.description}
                    <p class="category-description">{category.description}</p>
                  {/if}
                </div>
                
                <div class="category-controls">
                  <button
                    type="button"
                    class="btn-toggle"
                    class:expanded={expandedCategories.includes(category.id!)}
                    on:click={() => {
                      console.log('Toggle button clicked:', category.id);
                      toggleCategory(category.id!);
                    }}
                    title={expandedCategories.includes(category.id!) ? 'Colapsar categoría' : 'Expandir categoría'}
                  >
                    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                </div>
              </div>

              <!-- Dishes Section - Only show when expanded -->
              {#if expandedCategories.includes(category.id!)}
                <div class="dishes-section" in:slide={{ duration: 300, easing: quintOut }}>
                  <div class="dishes-header">
                    <div class="dishes-title-section">
                      <h4 class="dishes-title">
                        Platillos en {category.name}
                      </h4>
                      
                      <!-- Indicador de drag & drop -->
                      {#if canDragDishes(category.id!)}
                        <div class="drag-hint-dishes">
                          <span class="drag-hint-text">💡 Arrastra los platillos para reordenarlos</span>
                        </div>
                      {:else}
                        <div class="drag-hint-dishes">
                          <span class="drag-hint-text">💡 Expande la categoría para reordenar platillos</span>
                        </div>
                      {/if}
                    </div>
                    
                    <button
                      type="button"
                      class="btn-secondary btn-sm"
                      on:click={() => openDishForm(category)}
                    >
                      <svg class="btn-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
                      </svg>
                      Agregar Platillo
                    </button>
                  </div>

                  {#if dishesByCategory(category.id!).length === 0}
                    <div class="empty-dishes">
                      <p class="empty-dishes-text">No hay platillos en esta categoría</p>
                      <button
                        type="button"
                        class="btn-ghost btn-sm"
                        on:click={() => openDishForm(category)}
                      >
                        Agregar primer platillo
                      </button>
                    </div>
                  {:else}
                    <div class="dishes-grid">
                      {#each dishesByCategory(category.id!) as dish, index}
                        <div class={getDishDragClasses(dish)}
                             draggable={canDragDishes(category.id!)}
                             on:dragstart={(e) => handleDishDragStart(e, dish, index, category.id!)}
                             on:dragover={(e) => handleDishDragOver(e, dish)}
                             on:dragenter={(e) => handleDishDragEnter(e, dish)}
                             on:dragleave={handleDishDragLeave}
                             on:drop={(e) => handleDishDrop(e, dish, index, category.id!)}
                             on:dragend={handleDishDragEnd}
                             on:mouseenter={() => showActions(dish.id!)}
                             on:mouseleave={() => hideActions(dish.id!)}>
                          {#if shouldShowImage(dish)}
                            <div class="dish-image">
                              <img src={dish.image} alt={dish.name} on:error={() => handleImageError(dish.id!)} />
                            </div>
                          {:else}
                            <div class="dish-image-placeholder">
                              <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                            </div>
                          {/if}
                          
                          <div class="dish-content">
                            <h5 class="dish-name">{dish.name}</h5>
                            <p class="dish-description">{dish.description}</p>
                            
                            <div class="dish-details">
                              <span class="dish-price">{formatPrice(dish.price)}</span>
                              {#if dish.discount && dish.discount > 0}
                                <span class="dish-discount">-{dish.discount}%</span>
                              {/if}
                              <span class="dish-status" class:unavailable={!dish.inStock}>
                                {dish.inStock ? 'Disponible' : 'No disponible'}
                              </span>
                            </div>
                            
                            <!-- Indicador de posición -->
                            {#if dish.position}
                              <div class="dish-position-indicator">
                                <span class="position-icon">📍</span>
                                <span class="position-value">Posición {dish.position}</span>
                              </div>
                            {/if}
                          </div>
                          
                          <div class="dish-actions" 
                               class:visible={areActionsVisible(dish.id!)}>
                            <button
                              type="button"
                              class="btn-icon-btn"
                              on:click={() => openDishForm(category, dish)}
                              title="Editar platillo"
                            >
                              <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                            </button>
                            
                            <button
                              type="button"
                              class="btn-icon-btn btn-danger"
                              on:click={() => handleDeleteDish(dish.id!)}
                              title="Eliminar platillo"
                              disabled={isDeletingDish}
                            >
                              <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </div>
                        </div>
                      {/each}
                    </div>
                  {/if}
                </div>
              {/if}
              
              <!-- Category Actions - Separated from header -->
              <div class="category-actions">
                <button
                  type="button"
                  class="btn-icon-btn"
                  on:click={() => openDishForm(category)}
                  title="Agregar platillo a esta categoría"
                >
                  <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
                  </svg>
                </button>
                
                <button
                  type="button"
                  class="btn-icon-btn"
                  on:click={() => openCategoryForm(category)}
                  title="Editar categoría"
                >
                  <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </button>
                
                <button
                  type="button"
                  class="btn-icon-btn btn-danger"
                  on:click={() => handleDeleteCategory(category.id!)}
                  title="Eliminar categoría"
                  disabled={isDeletingCategory}
                >
                  <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            </div>
          {/each}
        </div>
      {/if}
    </div>

    <!-- Tips Section -->
    <div class="tips-section">
      <h2 class="section-title">💡 Consejos</h2>
      
      <div class="tips-grid">
        <div class="tip-card">
          <div class="tip-icon">📸</div>
          <div class="tip-content">
            <h4 class="tip-title">Agrega imágenes atractivas</h4>
            <p class="tip-description">
              Los platillos con imágenes de alta calidad reciben 3x más pedidos
            </p>
          </div>
        </div>

        <div class="tip-card">
          <div class="tip-icon">🏷️</div>
          <div class="tip-content">
            <h4 class="tip-title">Organiza con categorías</h4>
            <p class="tip-description">
              Facilita la navegación de tus clientes agrupando platillos similares
            </p>
          </div>
        </div>

        <div class="tip-card">
          <div class="tip-icon">📊</div>
          <div class="tip-content">
            <h4 class="tip-title">Información nutricional</h4>
            <p class="tip-description">
              Agrega datos nutricionales para atraer clientes conscientes de la salud
            </p>
          </div>
        </div>
      </div>
    </div>
  {/if}
</div>

<!-- Category Form Modal -->
{#if activeModal === 'category'}
  <GlobalModal
    isOpen={true}
    title={editingCategory ? 'Editar Categoría' : 'Nueva Categoría'}
    size="md"
    on:close={closeModal}
  >
    <CategoryForm
      category={editingCategory}
      restaurantId={restaurant.id}
      isSubmitting={isCreatingCategory || isUpdatingCategory}
      error={editingCategory ? categoryUpdateError : categoryCreateError}
      on:submit={handleCategorySubmit}
      on:cancel={closeModal}
    />
  </GlobalModal>
{/if}

<!-- Dish Form Modal -->
{#if activeModal === 'dish'}
  <GlobalModal
    isOpen={true}
    title={editingDish ? 'Editar Platillo' : 'Nuevo Platillo'}
    size="lg"
    on:close={closeModal}
  >
    <DishForm
      dish={editingDish}
      categories={$allCategories}
      restaurantId={restaurant.id}
      isSubmitting={isCreatingDish || isUpdatingDish}
      error={editingDish ? dishUpdateError : dishCreateError}
      on:submit={handleDishSubmit}
      on:cancel={closeModal}
    />
  </GlobalModal>
{/if}

<!-- Confirmation Modal -->
{#if showConfirmModal && itemToDelete}
  <ConfirmationModal
    isOpen={true}
    title={itemToDelete.type === 'category' ? 'Eliminar Categoría' : 'Eliminar Platillo'}
    message={
      itemToDelete.type === 'category' 
        ? `¿Estás seguro de que quieres eliminar la categoría "${itemToDelete.name}"?\n\n⚠️ Esta acción también eliminará todos los platillos asociados a esta categoría.`
        : `¿Estás seguro de que quieres eliminar el platillo "${itemToDelete.name}"?\n\nEsta acción no se puede deshacer.`
    }
    confirmText="Eliminar"
    cancelText="Cancelar"
    type="danger"
    icon="🗑️"
    loading={isDeletingCategory || isDeletingDish}
    loadingText="Eliminando..."
    on:confirm={executeDelete}
    on:cancel={cancelDelete}
  />
{/if}

<!-- Info Modal para categorías con platillos -->
{#if showInfoModal}
  <ConfirmationModal
    isOpen={true}
    title="No se puede eliminar la categoría"
    message={infoModalMessage}
    confirmText="Entendido"
    cancelText=""
    type="info"
    icon="ℹ️"
    loading={false}
    on:confirm={() => (showInfoModal = false)}
    on:cancel={() => (showInfoModal = false)}
  />
{/if}

<style>
  /* Component-specific styles that complement global styles */
  .restaurant-dashboard {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-2xl);
    padding: var(--spacing-2xl);
    max-width: var(--container-xl);
    margin: 0 auto;
  }

  /* Dashboard Header - Enhanced with global styles */
  .dashboard-header {
    background: linear-gradient(135deg, var(--bg-primary) 0%, var(--bg-secondary) 100%);
    border: 1px solid var(--bg-accent);
    border-radius: var(--radius-2xl);
    padding: var(--spacing-2xl);
    color: var(--text-primary);
    box-shadow: var(--shadow-sm);
    position: relative;
    overflow: hidden;
    margin-bottom: var(--spacing-xl);
  }

  .dashboard-header::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(135deg, rgba(255, 107, 53, 0.03) 0%, transparent 50%, rgba(255, 107, 53, 0.02) 100%);
    pointer-events: none;
  }

  .header-content {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: var(--spacing-xl);
    position: relative;
    z-index: 1;
  }

  .restaurant-info {
    flex: 1;
  }

  .restaurant-name {
    font-size: var(--font-2xl);
    font-weight: var(--weight-bold);
    margin: 0 0 var(--spacing-xs) 0;
    line-height: var(--leading-tight);
    color: var(--text-primary);
  }

  .restaurant-subtitle {
    font-size: var(--font-base);
    color: var(--text-secondary);
    margin: 0;
    font-weight: var(--weight-medium);
  }

  .stats-overview {
    display: flex;
    gap: var(--spacing-lg);
  }

  .stat-card {
    display: flex;
    align-items: center;
    gap: var(--spacing-md);
    background: var(--bg-primary);
    padding: var(--spacing-lg);
    border-radius: var(--radius-lg);
    border: 1px solid var(--bg-accent);
    box-shadow: var(--shadow-xs);
    transition: all var(--transition-normal);
    min-width: 140px;
  }

  .stat-card:hover {
    box-shadow: var(--shadow-sm);
    border-color: var(--primary-color);
    transform: translateY(-1px);
  }

  .stat-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 2.5rem;
    height: 2.5rem;
    background: var(--bg-tertiary);
    border-radius: var(--radius-md);
    color: var(--primary-color);
    flex-shrink: 0;
  }

  .stat-icon svg {
    width: 1.25rem;
    height: 1.25rem;
  }

  .stat-content {
    flex: 1;
    text-align: left;
  }

  .stat-value {
    font-size: var(--font-xl);
    font-weight: var(--weight-bold);
    color: var(--text-primary);
    line-height: 1;
    margin-bottom: var(--spacing-xs);
  }

  .stat-label {
    font-size: var(--font-sm);
    color: var(--text-secondary);
    font-weight: var(--weight-medium);
  }

  /* Error Display */
  .error-container {
    background-color: #fef2f2;
    border: 1px solid #fecaca;
    border-radius: var(--radius-lg);
    padding: var(--spacing-lg);
  }

  .error-content {
    display: flex;
    align-items: flex-start;
    gap: var(--spacing-sm);
  }

  .error-icon {
    width: 1.25rem;
    height: 1.25rem;
    color: #dc2626;
    flex-shrink: 0;
    margin-top: 0.125rem;
  }

  .error-text {
    flex: 1;
  }

  .error-title {
    font-size: var(--font-sm);
    font-weight: var(--weight-medium);
    color: #991b1b;
    margin: 0 0 var(--spacing-xs) 0;
  }

  .error-message {
    font-size: var(--font-sm);
    color: #dc2626;
    margin: 0;
  }

  /* Menu Management Section */
  .menu-management-section {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-xl);
  }

  .section-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: var(--spacing-lg);
    flex-wrap: wrap;
  }

  .header-text {
    flex: 1;
    min-width: 200px;
  }

  .section-title {
    font-size: var(--font-2xl);
    font-weight: var(--weight-bold);
    color: var(--text-primary);
    margin: 0 0 var(--spacing-sm) 0;
  }

  .section-subtitle {
    font-size: var(--font-base);
    color: var(--text-secondary);
    margin: 0;
  }

  .header-actions {
    display: flex;
    gap: var(--spacing-md);
    align-items: center;
  }

  .expand-actions {
    display: flex;
    gap: var(--spacing-sm);
  }

  /* Loading States */
  .loading-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: var(--spacing-4xl) var(--spacing-lg);
    text-align: center;
    min-height: 60vh;
  }

  .loading-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: var(--spacing-3xl) var(--spacing-lg);
    text-align: center;
  }

  .spinner {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 56px;
    height: 56px;
    margin-bottom: var(--spacing-lg);
  }

  .spinner-svg {
    width: 56px;
    height: 56px;
    animation: spinner-rotate 1s linear infinite;
  }

  .spinner-bg {
    stroke: var(--bg-accent);
    opacity: 0.3;
  }

  .spinner-fg {
    stroke: url(#spinner-gradient);
    stroke-dasharray: 90 150;
    stroke-dashoffset: 0;
    stroke-linecap: round;
    animation: spinner-dash 1.2s ease-in-out infinite;
  }

  .loading-title {
    font-size: var(--font-xl);
    font-weight: var(--weight-semibold);
    color: var(--text-primary);
    margin: 0 0 var(--spacing-sm) 0;
  }

  .loading-subtitle {
    font-size: var(--font-base);
    color: var(--text-secondary);
    margin: 0;
    font-weight: var(--weight-medium);
  }

  .loading-text {
    font-size: var(--font-base);
    color: var(--text-secondary);
    margin: 0;
    font-weight: var(--weight-medium);
  }

  @keyframes spinner-rotate {
    100% { transform: rotate(360deg); }
  }

  @keyframes spinner-dash {
    0% { stroke-dasharray: 1 150; stroke-dashoffset: 0; }
    50% { stroke-dasharray: 90 150; stroke-dashoffset: -35; }
    100% { stroke-dasharray: 90 150; stroke-dashoffset: -124; }
  }

  /* Empty State */
  .empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: var(--spacing-4xl) var(--spacing-lg);
    text-align: center;
    min-height: 50vh;
  }

  .empty-icon-container {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 80px;
    height: 80px;
    background: var(--bg-tertiary);
    border-radius: var(--radius-full);
    margin-bottom: var(--spacing-xl);
    border: 2px solid var(--bg-accent);
  }

  .empty-icon {
    width: 2.5rem;
    height: 2.5rem;
    color: var(--text-secondary);
  }

  .empty-title {
    font-size: var(--font-xl);
    font-weight: var(--weight-semibold);
    color: var(--text-primary);
    margin: 0 0 var(--spacing-sm) 0;
  }

  .empty-subtitle {
    font-size: var(--font-base);
    color: var(--text-secondary);
    margin: 0 0 var(--spacing-xl) 0;
    max-width: 400px;
  }

  /* Categories Grid */
  .categories-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
    gap: var(--spacing-xl);
    align-items: start;
  }

  .category-card {
    background: var(--bg-primary);
    border: 1px solid var(--bg-accent);
    border-radius: var(--radius-xl);
    overflow: hidden;
    box-shadow: var(--shadow-sm);
    transition: all var(--transition-normal);
    height: fit-content;
    /* min-height: 200px; */
    /* max-height: 80vh; */
    display: flex;
    flex-direction: column;
  }

  .category-card:hover {
    box-shadow: var(--shadow-md);
    border-color: var(--primary-color);
  }

  /* Drag & Drop Styles */
  .category-card.dragging {
    opacity: 0.5;
    transform: rotate(2deg);
    box-shadow: var(--shadow-lg);
    z-index: 1000;
    position: relative;
  }

  .category-card.drag-over {
    border-color: var(--primary-color);
    box-shadow: 0 0 0 2px var(--primary-color);
    transform: scale(1.02);
  }

  .category-card.drag-disabled {
    cursor: not-allowed;
    opacity: 0.7;
  }

  .category-card.drag-disabled .drag-handle {
    cursor: not-allowed;
    opacity: 0.5;
  }

  .category-card.dragging .drag-handle {
    cursor: grabbing;
  }

  /* Drag & Drop de Platillos */
  .dish-card.dragging-dish {
    opacity: 0.5;
    transform: rotate(1deg) scale(1.05);
    box-shadow: var(--shadow-lg);
    z-index: 1000;
    position: relative;
  }

  .dish-card.drag-over-dish {
    border-color: var(--primary-color);
    box-shadow: 0 0 0 2px var(--primary-color);
    transform: scale(1.02);
  }

  .dish-card:not([draggable="true"]) {
    cursor: default;
  }

  .dish-card[draggable="true"] {
    cursor: grab;
  }

  .dish-card[draggable="true"]:active {
    cursor: grabbing;
  }

  .dish-card.reordering {
    opacity: 0.8;
    pointer-events: none;
  }

  .dish-card.reordering::after {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(79, 70, 229, 0.1);
    border-radius: var(--radius-lg);
    pointer-events: none;
    z-index: 1;
  }

  .drag-hint {
    font-size: var(--font-xs);
    color: var(--text-secondary);
    font-style: italic;
  }

  .category-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: var(--spacing-md);
    padding: var(--spacing-lg);
    background: var(--bg-tertiary);
    border-bottom: 1px solid var(--bg-accent);
    transition: all var(--transition-normal);
    flex-shrink: 0;
  }

  .category-info {
    flex: 1;
    cursor: pointer;
    transition: all var(--transition-normal);
    padding: var(--spacing-md ) ;
    border-radius: var(--radius-md);
  }

  .category-info:hover {
    background: var(--bg-accent);
    transform: translateX(2px);
  }

  .category-title-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: var(--spacing-sm);
    margin-bottom: var(--spacing-xs);
  }

  .category-title-with-drag {
    display: flex;
    align-items: center;
    gap: var(--spacing-xs);
  }

  .drag-handle {
    cursor: grab;
    opacity: 0.5;
    transition: opacity var(--transition-normal);
  }

  .category-info:hover .drag-handle {
    opacity: 1;
  }

  .category-name {
    font-size: var(--font-base);
    font-weight: var(--weight-semibold);
    color: var(--text-primary);
    margin: 0;
    display: flex;
    align-items: center;
    gap: var(--spacing-xs);
  }

  .click-indicator {
    font-size: var(--font-xs);
    opacity: 0;
    transition: opacity var(--transition-normal);
  }

  .category-info:hover .click-indicator {
    opacity: 1;
  }

  .category-stats {
    display: flex;
    align-items: center;
    gap: var(--spacing-sm);
  }

  .order-indicator {
    font-size: var(--font-xs);
    color: var(--text-secondary);
    background: var(--bg-primary);
    padding: var(--spacing-xs) var(--spacing-sm);
    border-radius: var(--radius-full);
    font-weight: var(--weight-medium);
  }

  .dish-count {
    font-size: var(--font-xs);
    color: var(--text-secondary);
    background: var(--bg-primary);
    padding: var(--spacing-xs) var(--spacing-sm);
    border-radius: var(--radius-full);
    font-weight: var(--weight-medium);
  }

  .sort-indicator {
    font-size: var(--font-xs);
    color: var(--primary-color);
    background: var(--bg-primary);
    padding: var(--spacing-xs) var(--spacing-sm);
    border-radius: var(--radius-full);
    font-weight: var(--weight-bold);
    border: 1px solid var(--primary-color);
  }

  .drag-enabled-indicator {
    font-size: var(--font-xs);
    color: var(--success);
    background: var(--bg-primary);
    padding: var(--spacing-xs) var(--spacing-sm);
    border-radius: var(--radius-full);
    font-weight: var(--weight-bold);
    border: 1px solid var(--success);
  }

  .category-description {
    font-size: var(--font-xs);
    color: var(--text-secondary);
    margin: 0;
    line-height: var(--leading-relaxed);
  }

  .category-controls {
    display: flex;
    gap: var(--spacing-xs);
  }

  .btn-toggle {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 2rem;
    height: 2rem;
    background: var(--bg-primary);
    color: var(--text-secondary);
    border: 1px solid var(--bg-accent);
    border-radius: var(--radius-md);
    cursor: pointer;
    transition: all var(--transition-normal);
    flex-shrink: 0;
  }

  .btn-toggle:hover {
    background: var(--bg-tertiary);
    color: var(--text-primary);
    border-color: var(--primary-color);
    transform: scale(1.05);
  }

  .btn-toggle.expanded {
    transform: rotate(180deg);
  }

  .btn-toggle.expanded:hover {
    transform: rotate(180deg) scale(1.05);
  }

  .btn-toggle svg {
    width: 1rem;
    height: 1rem;
  }

  /* Dishes Section */
  .dishes-section {
    padding: var(--spacing-lg);
    flex: 1;
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }

  .dishes-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: var(--spacing-md);
    flex-shrink: 0;
    gap: var(--spacing-md);
  }

  .dishes-title-section {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: var(--spacing-sm);
  }

  .dishes-title {
    font-size: var(--font-sm);
    font-weight: var(--weight-semibold);
    color: var(--text-secondary);
    margin: 0;
  }

  .drag-hint-dishes {
    margin-top: var(--spacing-xs);
  }

  .drag-hint-text {
    font-size: var(--font-xs);
    color: var(--text-secondary);
    font-style: italic;
  }

  /* Controles de ordenamiento - Eliminados */

  .empty-dishes {
    text-align: center;
    padding: var(--spacing-lg);
    color: var(--text-light);
    flex: 1;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
  }

  .empty-dishes-text {
    font-size: var(--font-xs);
    margin: 0 0 var(--spacing-sm) 0;
  }

  /* Dishes Grid */
  .dishes-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: var(--spacing-lg);
    flex: 1;
    overflow-y: auto;
    max-height: 120vh;
    padding-right: var(--spacing-sm);
  }

  .dishes-grid::-webkit-scrollbar {
    width: 6px;
  }

  .dishes-grid::-webkit-scrollbar-track {
    background: var(--bg-accent);
    border-radius: var(--radius-full);
  }

  .dishes-grid::-webkit-scrollbar-thumb {
    background: var(--text-light);
    border-radius: var(--radius-full);
  }

  .dishes-grid::-webkit-scrollbar-thumb:hover {
    background: var(--text-secondary);
  }

  .dish-card {
    background: var(--bg-tertiary);
    border: 1px solid var(--bg-accent);
    border-radius: var(--radius-lg);
    overflow: hidden;
    transition: all var(--transition-normal);
    position: relative;
  }

  .dish-card:hover {
    box-shadow: var(--shadow-md);
    border-color: var(--primary-color);
  }

  .dish-image {
    width: 100%;
    height: 160px;
    overflow: hidden;
    position: relative;
    background: var(--bg-accent);
    border-radius: var(--radius-lg) var(--radius-lg) 0 0;
    display: flex;
    align-items: center;
    justify-content: center;
    opacity: 1 !important;
    visibility: visible !important;
  }

  .dish-image img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    object-position: center;
    display: block;
    border-radius: var(--radius-lg) var(--radius-lg) 0 0;
    background: var(--bg-accent);
    min-width: 100%;
    min-height: 100%;
    max-width: none;
    max-height: none;
    opacity: 1 !important;
    visibility: visible !important;
  }

  .dish-image img:not([src]), 
  .dish-image img[src=""],
  .dish-image img[src*="undefined"],
  .dish-image img[src*="null"] {
    display: none;
  }

  .dish-image img[src*="data:image/svg+xml"] {
    object-fit: contain;
    padding: var(--spacing-md);
  }

  .dish-image-placeholder {
    width: 100%;
    height: 160px;
    background: var(--bg-accent);
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--text-light);
    border-radius: var(--radius-lg) var(--radius-lg) 0 0;
    position: relative;
  }

  .dish-image-placeholder::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(45deg, transparent 30%, rgba(255, 255, 255, 0.1) 50%, transparent 70%);
    animation: shimmer 2s infinite;
  }

  @keyframes shimmer {
    0% { transform: translateX(-100%); }
    100% { transform: translateX(100%); }
  }

  .dish-image-placeholder svg {
    width: 2rem;
    height: 2rem;
    opacity: 0.6;
    position: relative;
    z-index: 1;
  }

  .dish-content {
    padding: var(--spacing-lg);
  }

  .dish-name {
    font-size: var(--font-base);
    font-weight: var(--weight-semibold);
    color: var(--text-primary);
    margin: 0 0 var(--spacing-xs) 0;
  }

  .dish-description {
    font-size: var(--font-sm);
    color: var(--text-secondary);
    margin: 0 0 var(--spacing-sm) 0;
    line-height: var(--leading-relaxed);
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }

  .dish-details {
    display: flex;
    align-items: center;
    gap: var(--spacing-sm);
    flex-wrap: wrap;
  }

  .dish-price {
    font-size: var(--font-sm);
    font-weight: var(--weight-semibold);
    color: var(--primary-color);
  }

  .dish-discount {
    font-size: var(--font-xs);
    background: var(--success);
    color: var(--text-inverse);
    padding: var(--spacing-xs) var(--spacing-sm);
    border-radius: var(--radius-full);
    font-weight: var(--weight-medium);
  }

  .dish-status {
    font-size: var(--font-xs);
    color: var(--success);
    font-weight: var(--weight-medium);
  }

  .dish-status.unavailable {
    color: var(--error);
  }

  /* Indicador de posición */
  .dish-position-indicator {
    display: flex;
    align-items: center;
    gap: var(--spacing-xs);
    margin-top: var(--spacing-xs);
    padding: var(--spacing-xs) var(--spacing-sm);
    background: var(--bg-accent);
    border-radius: var(--radius-sm);
    font-size: var(--font-xs);
    color: var(--primary-color);
  }

  .position-icon {
    font-size: var(--font-xs);
  }

  .position-value {
    font-weight: var(--weight-medium);
  }

  .dish-actions {
    position: absolute;
    top: var(--spacing-sm);
    right: var(--spacing-sm);
    display: flex;
    gap: var(--spacing-xs);
    opacity: 0;
    transition: all var(--transition-normal);
    z-index: 10;
    pointer-events: auto;
    transform: translateY(-4px);
  }

  .dish-card:hover .dish-actions,
  .dish-actions.visible {
    opacity: 1;
    transform: translateY(0);
  }

  /* Buttons */
  .btn-primary {
    display: inline-flex;
    align-items: center;
    gap: var(--spacing-sm);
    padding: var(--spacing-md) var(--spacing-lg);
    background: var(--primary-gradient);
    color: var(--text-inverse);
    border: none;
    border-radius: var(--radius-lg);
    font-size: var(--font-sm);
    font-weight: var(--weight-semibold);
    cursor: pointer;
    transition: all var(--transition-normal);
    text-decoration: none;
    box-shadow: var(--shadow-sm);
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
    display: inline-flex;
    align-items: center;
    gap: var(--spacing-sm);
    padding: var(--spacing-sm) var(--spacing-md);
    background: var(--bg-primary);
    color: var(--text-primary);
    border: 1px solid var(--bg-accent);
    border-radius: var(--radius-md);
    font-size: var(--font-sm);
    font-weight: var(--weight-medium);
    cursor: pointer;
    transition: all var(--transition-normal);
  }

  .btn-secondary:hover {
    border-color: var(--primary-color);
    color: var(--primary-color);
    background: var(--bg-tertiary);
  }

  .btn-secondary:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
  }

  .btn-secondary.btn-sm {
    padding: var(--spacing-xs) var(--spacing-sm);
    font-size: var(--font-xs);
  }

  .btn-ghost {
    display: inline-flex;
    align-items: center;
    gap: var(--spacing-sm);
    padding: var(--spacing-sm) var(--spacing-md);
    background: none;
    color: var(--text-secondary);
    border: none;
    border-radius: var(--radius-md);
    font-size: var(--font-sm);
    cursor: pointer;
    transition: all var(--transition-normal);
  }

  .btn-ghost:hover {
    background: var(--bg-accent);
    color: var(--text-primary);
  }

  .btn-ghost.btn-sm {
    padding: var(--spacing-xs) var(--spacing-sm);
    font-size: var(--font-xs);
  }

  .btn-icon-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 2rem;
    height: 2rem;
    background: var(--bg-primary);
    color: var(--text-secondary);
    border: 1px solid var(--bg-accent);
    border-radius: var(--radius-md);
    cursor: pointer;
    transition: all var(--transition-normal);
  }

  .btn-icon-btn:hover {
    background: var(--bg-tertiary);
    color: var(--text-primary);
    border-color: var(--primary-color);
  }

  .btn-icon-btn.btn-danger:hover {
    background: var(--error);
    color: var(--text-inverse);
    border-color: var(--error);
  }

  .btn-icon-btn svg {
    width: 1rem;
    height: 1rem;
  }

  .btn-icon {
    width: 1.25rem;
    height: 1.25rem;
  }

  /* Tips Section */
  .tips-section {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-xl);
  }

  .tips-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
    gap: var(--spacing-lg);
  }

  .tip-card {
    display: flex;
    align-items: flex-start;
    gap: var(--spacing-lg);
    padding: var(--spacing-2xl);
    background: var(--bg-primary);
    border: 1px solid var(--bg-accent);
    border-radius: var(--radius-xl);
    box-shadow: var(--shadow-sm);
    transition: all var(--transition-normal);
  }

  .tip-card:hover {
    box-shadow: var(--shadow-md);
    transform: translateY(-2px);
    border-color: var(--primary-color);
  }

  .tip-icon {
    font-size: 2.5rem;
    flex-shrink: 0;
  }

  .tip-content {
    flex: 1;
  }

  .tip-title {
    font-size: var(--font-base);
    font-weight: var(--weight-semibold);
    color: var(--text-primary);
    margin: 0 0 var(--spacing-sm) 0;
  }

  .tip-description {
    font-size: var(--font-sm);
    color: var(--text-secondary);
    margin: 0;
    line-height: var(--leading-relaxed);
  }

  /* Responsive Design */
  @media (max-width: 1024px) {
    .categories-grid {
      grid-template-columns: 1fr;
      align-items: stretch;
    }

    .dishes-grid {
      grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
    }

    .header-content {
      flex-direction: column;
      gap: var(--spacing-xl);
    }

    .stats-overview {
      align-self: stretch;
      justify-content: space-around;
    }
  }

  @media (min-width: 1025px) and (max-width: 1400px) {
    .categories-grid {
      grid-template-columns: repeat(auto-fit, minmax(450px, 1fr));
      align-items: start;
    }
  }

  @media (min-width: 1401px) {
    .categories-grid {
      grid-template-columns: repeat(auto-fit, minmax(500px, 1fr));
      align-items: start;
    }
  }

  @media (max-width: 768px) {
    .restaurant-dashboard {
      padding: var(--spacing-lg);
      gap: var(--spacing-xl);
    }

    .dashboard-header {
      padding: var(--spacing-xl);
    }

    .restaurant-name {
      font-size: var(--font-xl);
    }

    .header-content {
      flex-direction: column;
      align-items: stretch;
      gap: var(--spacing-lg);
    }

    .stats-overview {
      justify-content: space-around;
    }

    .stat-card {
      flex: 1;
      min-width: auto;
      justify-content: center;
    }

    .section-header {
      flex-direction: column;
      align-items: stretch;
    }

    .header-actions {
      justify-content: center;
      flex-wrap: wrap;
    }

    .expand-actions {
      width: 100%;
      justify-content: center;
      margin-top: var(--spacing-sm);
    }

    /* Category cards mobile improvements */
    .category-header {
      padding: var(--spacing-md);
      gap: var(--spacing-sm);
    }

    .category-title-row {
      /* flex-direction: column; */
      /* align-items: flex-start; */
      /* gap: var(--spacing-xs); */
    }

    .category-name {
      font-size: var(--font-sm);
    }

    .dish-count {
      font-size: var(--font-xs);
      padding: var(--spacing-xs) var(--spacing-sm);
    }

    .category-controls {
      justify-content: flex-end;
      align-self: flex-start;
    }

    .btn-toggle {
      width: 1.75rem;
      height: 1.75rem;
    }

    .btn-toggle svg {
      width: 0.875rem;
      height: 0.875rem;
    }

    .category-actions {
      padding: var(--spacing-sm) var(--spacing-md);
      gap: var(--spacing-xs);
      justify-content: center;
    }

    .category-actions .btn-icon-btn {
      width: 1.75rem;
      height: 1.75rem;
    }

    .category-actions .btn-icon-btn svg {
      width: 0.875rem;
      height: 0.875rem;
    }

    .dishes-section {
      padding: var(--spacing-md);
    }

    .dishes-header {
      flex-direction: column;
      align-items: stretch;
      gap: var(--spacing-sm);
    }

    .dishes-title-section {
      gap: var(--spacing-xs);
    }

    .sort-controls {
      align-self: flex-start;
    }

    .sort-dropdown {
      min-width: 200px;
      right: auto;
    }

    .dishes-grid {
      grid-template-columns: 1fr;
      gap: var(--spacing-md);
    }

    .tips-grid {
      grid-template-columns: 1fr;
    }

    .dish-image {
      height: 140px;
    }

    .dish-image-placeholder {
      height: 140px;
    }

    /* Mejorar la visibilidad en dispositivos móviles */
    .dish-actions {
      opacity: 1;
      /* background: rgba(255, 255, 255, 0.95); */
      /* backdrop-filter: blur(8px); */
      border-radius: var(--radius-md);
      padding: var(--spacing-xs);
      /* box-shadow: var(--shadow-sm); */
    }
  }

  @media (max-width: 480px) {
    .category-card {
      /* margin: 0 calc(-1 * var(--spacing-lg)); */
    }

    .dish-card {
      /* margin: 0 calc(-1 * var(--spacing-sm)); */
    }

    .dashboard-header {
      padding: var(--spacing-lg);
      /* margin: 0 calc(-1 * var(--spacing-lg)) var(--spacing-lg) calc(-1 * var(--spacing-lg)); */
      /* border-radius: 0; */
    }

    .stats-overview {
      flex-direction: column;
      gap: var(--spacing-sm);
    }

    .stat-card {
      padding: var(--spacing-md);
      min-width: auto;
    }

    .stat-icon {
      width: 2rem;
      height: 2rem;
    }

    .stat-icon svg {
      width: 1rem;
      height: 1rem;
    }

    .stat-value {
      font-size: var(--font-lg);
    }

    /* Category cards extra compact for small screens */
    .category-header {
      padding: var(--spacing-sm);
      gap: var(--spacing-xs);
    }

    .category-info {
      padding: var(--spacing-md );
    }

    .category-name {
      font-size: var(--font-sm);
      line-height: 1.2;
    }

    .category-description {
      font-size: var(--font-xs);
      line-height: 1.3;
    }

    .dish-count {
      font-size: var(--font-xs);
      padding: var(--spacing-xs) var(--spacing-sm);
      border-radius: var(--radius-sm);
    }

    .btn-toggle {
      width: 1.5rem;
      height: 1.5rem;
    }

    .btn-toggle svg {
      width: 0.75rem;
      height: 0.75rem;
    }

    .category-actions {
      padding: var(--spacing-xs) var(--spacing-sm);
      gap: var(--spacing-xs);
    }

    .category-actions .btn-icon-btn {
      width: 1.5rem;
      height: 1.5rem;
    }

    .category-actions .btn-icon-btn svg {
      width: 0.75rem;
      height: 0.75rem;
    }

    .dishes-section {
      padding: var(--spacing-sm);
    }

    .dishes-header {
      margin-bottom: var(--spacing-sm);
    }

    .dishes-title {
      font-size: var(--font-xs);
    }

    .dishes-grid {
      gap: var(--spacing-sm);
    }

    .dish-image {
      height: 120px;
    }

    .dish-image-placeholder {
      height: 120px;
    }
  }

  /* Touch device optimizations */
  @media (hover: none) and (pointer: coarse) {
    .dish-actions {
      opacity: 1;
      /* background: rgba(255, 255, 255, 0.9); */
      backdrop-filter: blur(8px);
      border-radius: var(--radius-md);
      padding: var(--spacing-xs);
    }
    
    .btn {
      min-height: 48px;
      padding: var(--spacing-lg) var(--spacing-xl);
    }

    .dish-image img {
      transform: none;
    }

    /* Mejorar drag & drop en dispositivos táctiles */
    .category-card {
      touch-action: pan-y;
    }

    .drag-handle {
      min-height: 44px;
      min-width: 44px;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .category-card.dragging {
      transform: rotate(1deg) scale(1.05);
    }
  }

  /* Reduced motion support */
  @media (prefers-reduced-motion: reduce) {
    .category-card,
    .dish-card,
    .tip-card,
    .btn-primary,
    .btn-secondary,
    .btn-ghost,
    .btn-icon-btn,
    .btn-toggle {
      transition: none;
    }
    
    .btn-primary:hover,
    .category-card:hover,
    .dish-card:hover,
    .tip-card:hover {
      transform: none;
    }

    .dish-image img {
      transition: none;
    }

    .dish-image-placeholder::before {
      animation: none;
    }

    .btn-toggle.expanded {
      transform: none;
    }
  }

  /* Loading state for images */
  .dish-image.loading {
    background: var(--bg-skeleton);
    animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
  }

  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.5; }
  }

  /* Category Actions - Separated from header */
  .category-actions {
    display: flex;
    gap: var(--spacing-xs);
    padding: var(--spacing-md) var(--spacing-lg);
    background: var(--bg-primary);
    border-top: 1px solid var(--bg-accent);
    justify-content: flex-end;
    align-items: center;
    flex-shrink: 0;
  }

  .category-actions .btn-icon-btn {
    width: 2rem;
    height: 2rem;
  }

  .category-actions .btn-icon-btn svg {
    width: 1rem;
    height: 1rem;
  }

  .category-actions .btn-icon-btn:first-child {
    background: var(--primary-color);
    color: var(--text-inverse);
    border-color: var(--primary-color);
  }

  .category-actions .btn-icon-btn:first-child:hover {
    background: var(--primary-dark);
    border-color: var(--primary-dark);
    transform: translateY(-1px);
  }
</style>

<!-- SVG gradient definition for spinner -->
<svg width="0" height="0">
  <defs>
    <linearGradient id="spinner-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="var(--primary-color, #4f46e5)" />
      <stop offset="100%" stop-color="var(--primary-light, #6366f1)" />
    </linearGradient>
  </defs>
</svg>