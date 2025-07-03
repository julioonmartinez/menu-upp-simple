<!-- src/components/ui/IconPicker.svelte -->
<script>
  import { createEventDispatcher } from 'svelte';
  import { 
    getIconClass, 
    getPopularIcons, 
    getIconsByCategory,
    iconExists 
  } from '../../utils/iconUtils.ts';
  
  export let label = '';
  export let id = '';
  export let value = ''; // Icono actual
  export let required = false;
  export let disabled = false;
  export let help = '';
  export let error = '';
  export let placeholder = 'Buscar icono...';
  
  const dispatch = createEventDispatcher();
  
  let isOpen = false;
  let searchTerm = '';
  let inputElement;
  
  // Iconos más populares/usados (chips rápidos) - Font Awesome 6.4.0
  const popularIcons = getPopularIcons();
  
  // Categorías compactas para búsqueda avanzada
  const iconCategories = getIconsByCategory();
  
  // Reactive: sincronizar valores
  $: if (value !== searchTerm && !isOpen) {
    searchTerm = value;
  }
  
  // Filtrar iconos populares basado en búsqueda
  $: filteredPopularIcons = popularIcons.filter(icon => 
    icon.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    icon.label.toLowerCase().includes(searchTerm.toLowerCase())
  ).slice(0, 10); // Máximo 10 resultados
  
  // Filtrar iconos por categoría con límite de 10 resultados
  $: filteredCategoryIcons = Object.entries(iconCategories).reduce((acc, [category, iconNames]) => {
    const filteredNames = iconNames.filter(name => 
      name.toLowerCase().includes(searchTerm.toLowerCase())
    ).slice(0, 10); // Máximo 10 por categoría
    if (filteredNames.length > 0) {
      acc[category] = filteredNames;
    }
    return acc;
  }, {});
  
  // Limitar resultados totales a 10
  $: limitedCategoryIcons = Object.entries(filteredCategoryIcons).slice(0, 3); // Máximo 3 categorías
  
  function handleInputChange() {
    const iconName = searchTerm.trim().toLowerCase();
    if (iconName && iconExists(iconName)) {
      value = iconName;
      dispatch('change', { icon: iconName });
    }
  }
  
  function selectIcon(iconName) {
    value = iconName;
    searchTerm = iconName;
    dispatch('change', { icon: iconName });
    isOpen = false;
    if (inputElement) {
      inputElement.blur();
    }
  }
  
  function handleInputFocus() {
    if (!disabled) {
      isOpen = true;
    }
  }
  
  function handleInputKeydown(event) {
    if (event.key === 'Enter') {
      handleInputChange();
      isOpen = false;
    } else if (event.key === 'Escape') {
      isOpen = false;
      if (inputElement) {
        inputElement.blur();
      }
    }
  }
  
  function closeDropdown() {
    isOpen = false;
  }
  
  // Cerrar dropdown al hacer click afuera
  function handleClickOutside(event) {
    if (isOpen && !event.target.closest('.icon-picker')) {
      closeDropdown();
    }
  }
  
  // Obtener el icono actual para mostrar
  function getCurrentIconClass() {
    if (!value) return 'fa-solid fa-circle-question';
    return getIconClass(value);
  }
  
  function getCurrentIconLabel() {
    if (!value) return placeholder;
    
    const popularIcon = popularIcons.find(icon => icon.name === value);
    if (popularIcon) return popularIcon.label;
    
    return value;
  }
  
  function getIconClassForDisplay(iconName) {
    return getIconClass(iconName);
  }
</script>

<svelte:window on:click={handleClickOutside} />

<div class="flex flex-col gap-md relative icon-picker">
  {#if label}
    <label for={id} class="text-sm font-medium text-secondary">
      {label}
      {#if required}
        <span class="text-error">*</span>
      {/if}
    </label>
  {/if}
  
  <div class="relative picker-container">
    <!-- Input con icono -->
    <div class="relative input-container">
      <input
        bind:this={inputElement}
        {id}
        type="text"
        bind:value={searchTerm}
        on:focus={handleInputFocus}
        on:keydown={handleInputKeydown}
        on:input={handleInputChange}
        {placeholder}
        class="w-full h-2xl border rounded-lg pl-3xl pr-lg transition-all bg-white {error ? 'border-error' : 'border-accent'} {disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-text hover:shadow'} {isOpen ? 'border-primary shadow-md' : ''}"
        {disabled}
      />
      <div class="absolute left-md top-1/2 transform -translate-y-1/2 icon-preview">
        <i class="{getCurrentIconClass()} text-lg text-muted"></i>
      </div>
      <div class="absolute right-md top-1/2 transform -translate-y-1/2 dropdown-arrow">
        <svg class="w-md h-md text-muted arrow-icon {isOpen ? 'rotated' : ''}" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
        </svg>
      </div>
    </div>
    
    {#if isOpen}
      <div class="dropdown-panel absolute left-0 right-0 top-full mt-xs bg-white border border-accent rounded-xl shadow-lg z-50 flex flex-col max-h-80 overflow-hidden">
        
        <!-- Iconos Populares (Chips) -->
        {#if filteredPopularIcons.length > 0}
          <div class="flex flex-col gap-sm p-lg popular-section border-b border-accent">
            <label class="text-xs font-semibold text-primary popular-label">Iconos Populares:</label>
            <div class="flex flex-wrap gap-xs popular-chips">
              {#each filteredPopularIcons as icon}
                <button
                  type="button"
                  class="flex items-center gap-xs px-sm py-xs border rounded-full cursor-pointer transition-all popular-chip {value === icon.name ? 'border-primary bg-primary text-white selected' : 'border-accent hover:bg-accent hover:border-primary'}"
                  on:click={() => selectIcon(icon.name)}
                  title="{icon.label}"
                  aria-label="Seleccionar {icon.label}"
                >
                  <i class="{icon.class} text-sm chip-icon"></i>
                  <span class="text-xs font-medium chip-label">{icon.label}</span>
                </button>
              {/each}
            </div>
          </div>
        {/if}
        
        <!-- Resultados de Búsqueda por Categoría (Limitados) -->
        {#if limitedCategoryIcons.length > 0}
          <div class="flex flex-col gap-md p-lg search-results overflow-y-auto">
            {#each limitedCategoryIcons as [category, iconNames]}
              <div class="flex flex-col gap-xs category-section">
                <h4 class="text-xs font-semibold text-secondary category-title">{category}:</h4>
                <div class="grid gap-xs icon-grid" style="grid-template-columns: repeat(auto-fill, minmax(80px, 1fr));">
                  {#each iconNames as iconName}
                    <button
                      type="button"
                      class="flex items-center gap-sm p-xs border rounded cursor-pointer transition-all icon-option {value === iconName ? 'border-primary bg-primary text-white selected' : 'border-accent hover:bg-accent hover:border-primary'}"
                      on:click={() => selectIcon(iconName)}
                      title="{iconName}"
                      aria-label="Seleccionar {iconName}"
                    >
                      <i class="{getIconClassForDisplay(iconName)} text-sm icon-item"></i>
                      <span class="text-xs font-medium icon-name">{iconName}</span>
                    </button>
                  {/each}
                </div>
              </div>
            {/each}
          </div>
        {/if}
        
        <!-- Sin resultados -->
        {#if searchTerm && filteredPopularIcons.length === 0 && limitedCategoryIcons.length === 0}
          <div class="flex flex-col items-center justify-center py-lg text-center no-results">
            <i class="fa-solid fa-magnifying-glass text-xl text-muted mb-sm"></i>
            <p class="text-sm text-muted">No se encontraron iconos para "{searchTerm}"</p>
            <p class="text-xs text-light mt-xs">Intenta con otro término de búsqueda</p>
          </div>
        {/if}
        
        <!-- Sin búsqueda - Mostrar categorías compactas -->
        {#if !searchTerm}
          <div class="flex flex-col gap-md p-lg categories-section overflow-y-auto">
            {#each Object.entries(iconCategories).slice(0, 3) as [category, iconNames]}
              <div class="flex flex-col gap-xs category-section">
                <h4 class="text-xs font-semibold text-secondary category-title">{category}:</h4>
                <div class="flex flex-wrap gap-xs category-chips">
                  {#each iconNames.slice(0, 6) as iconName}
                    <button
                      type="button"
                      class="flex items-center gap-xs px-sm py-xs border rounded-full cursor-pointer transition-all category-chip {value === iconName ? 'border-primary bg-primary text-white selected' : 'border-accent hover:bg-accent hover:border-primary'}"
                      on:click={() => selectIcon(iconName)}
                      title="{iconName}"
                      aria-label="Seleccionar {iconName}"
                    >
                      <i class="{getIconClassForDisplay(iconName)} text-sm chip-icon"></i>
                      <span class="text-xs font-medium chip-label">{iconName}</span>
                    </button>
                  {/each}
                </div>
              </div>
            {/each}
          </div>
        {/if}
        
        <div class="flex justify-end gap-xs border-t border-accent p-sm actions bg-gray">
          <button
            type="button"
            class="btn btn-secondary btn-sm action-btn"
            on:click={closeDropdown}
          >
            Cerrar
          </button>
        </div>
      </div>
    {/if}
  </div>
  
  <input
    type="hidden"
    {value}
    name={id}
  />
  
  {#if error}
    <p class="text-xs text-error mt-xs message error-message">{error}</p>
  {:else if help}
    <p class="text-xs text-muted mt-xs message help-message">{help}</p>
  {/if}
</div>

<style>
  /* Estilos consistentes con LinkManager */
  .icon-picker {
    width: 100%;
  }
  
  .picker-container {
    width: 100%;
  }
  
  .input-container {
    width: 100%;
  }
  
  .input-container input {
    width: 100%;
    padding: var(--spacing-md) var(--spacing-lg);
    border: 1px solid var(--bg-accent);
    border-radius: var(--radius-lg);
    font-size: var(--font-base);
    background: var(--bg-primary);
    color: var(--text-primary);
    transition: all var(--transition-normal);
    min-height: 44px;
    padding-left: 3rem; /* Espacio para el icono */
    padding-right: 2.5rem; /* Espacio para la flecha */
  }
  
  .input-container input:focus {
    outline: none;
    border-color: var(--primary-color);
    box-shadow: 0 0 0 3px rgba(255, 107, 53, 0.1);
    transform: scale(1.01);
  }
  
  .input-container input::placeholder {
    color: var(--text-light);
  }
  
  .icon-preview {
    color: var(--text-muted);
    z-index: 1;
  }
  
  .dropdown-arrow {
    color: var(--text-muted);
    z-index: 1;
  }
  
  .arrow-icon {
    transition: transform var(--transition-fast);
  }
  
  .arrow-icon.rotated {
    transform: rotate(180deg);
  }
  
  /* Dropdown que cubre todo el input */
  .dropdown-panel {
    width: 100%;
    top: 100%;
    left: 0;
    right: 0;
    margin-top: 0.25rem;
    background: var(--bg-primary);
    border: 1px solid var(--bg-accent);
    border-radius: var(--radius-lg);
    box-shadow: var(--shadow-lg);
    z-index: var(--z-dropdown);
    max-height: 320px;
    overflow: hidden;
    display: flex;
    flex-direction: column;
  }
  
  /* Chips mejorados */
  .popular-chip,
  .category-chip {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.5rem 0.75rem;
    border: 1px solid var(--bg-accent);
    border-radius: var(--radius-full);
    background: var(--bg-primary);
    color: var(--text-primary);
    font-size: var(--font-xs);
    font-weight: var(--weight-medium);
    cursor: pointer;
    transition: all var(--transition-fast);
    white-space: nowrap;
    min-height: 32px;
  }
  
  .popular-chip:hover,
  .category-chip:hover {
    background: var(--bg-tertiary);
    border-color: var(--primary-color);
    color: var(--primary-color);
    transform: translateY(-1px);
    box-shadow: var(--shadow-sm);
  }
  
  .popular-chip.selected,
  .category-chip.selected {
    background: var(--primary-color);
    border-color: var(--primary-color);
    color: var(--text-inverse);
    transform: scale(1.02);
    box-shadow: var(--shadow-md);
  }
  
  .chip-icon {
    font-size: 0.875rem;
    flex-shrink: 0;
  }
  
  .chip-label {
    font-weight: var(--weight-medium);
  }
  
  /* Opciones de iconos en grid */
  .icon-option {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.5rem;
    border: 1px solid var(--bg-accent);
    border-radius: var(--radius-md);
    background: var(--bg-primary);
    color: var(--text-primary);
    cursor: pointer;
    transition: all var(--transition-fast);
    min-height: 36px;
  }
  
  .icon-option:hover {
    background: var(--bg-tertiary);
    border-color: var(--primary-color);
    color: var(--primary-color);
    transform: translateY(-1px);
  }
  
  .icon-option.selected {
    background: var(--primary-color);
    border-color: var(--primary-color);
    color: var(--text-inverse);
    transform: scale(1.02);
  }
  
  .icon-item {
    font-size: 0.875rem;
    flex-shrink: 0;
  }
  
  .icon-name {
    font-weight: var(--weight-medium);
    font-size: var(--font-xs);
  }
  
  /* Secciones del dropdown */
  .popular-section,
  .search-results,
  .categories-section {
    flex: 1;
    overflow-y: auto;
  }
  
  .popular-label,
  .category-title {
    color: var(--text-secondary);
    margin-bottom: 0.5rem;
    font-weight: var(--weight-semibold);
  }
  
  .popular-chips,
  .category-chips {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
  }
  
  .icon-grid {
    display: grid;
    gap: 0.5rem;
    grid-template-columns: repeat(auto-fill, minmax(80px, 1fr));
  }
  
  /* Estados especiales */
  .no-results {
    padding: 2rem 1rem;
    color: var(--text-muted);
  }
  
  .actions {
    background: var(--bg-secondary);
    border-top: 1px solid var(--bg-accent);
    padding: 0.75rem 1rem;
    flex-shrink: 0;
  }
  
  .action-btn {
    font-size: var(--font-sm);
    padding: 0.375rem 0.75rem;
    min-height: 32px;
  }
  
  /* Responsive */
  @media (max-width: 640px) {
    .dropdown-panel {
      left: -0.5rem;
      right: -0.5rem;
      max-height: 60vh;
    }
    
    .popular-chips,
    .category-chips {
      justify-content: center;
    }
    
    .icon-grid {
      grid-template-columns: repeat(auto-fill, minmax(70px, 1fr));
    }
    
    .input-container input {
      min-height: 48px;
    }
  }
  
  /* Dark mode */
  @media (prefers-color-scheme: dark) {
    .input-container input {
      background: var(--bg-tertiary);
      border-color: var(--bg-accent);
      color: var(--text-primary);
    }
    
    .input-container input:focus {
      background: var(--bg-primary);
    }
    
    .dropdown-panel {
      background: var(--bg-primary);
      border-color: var(--bg-accent);
    }
    
    .popular-chip,
    .category-chip,
    .icon-option {
      background: var(--bg-tertiary);
      border-color: var(--bg-accent);
      color: var(--text-primary);
    }
    
    .popular-chip:hover,
    .category-chip:hover,
    .icon-option:hover {
      background: var(--bg-accent);
    }
  }
  
  /* Reduced motion */
  @media (prefers-reduced-motion: reduce) {
    .popular-chip:hover,
    .category-chip:hover,
    .icon-option:hover,
    .popular-chip.selected,
    .category-chip.selected,
    .icon-option.selected {
      transform: none;
    }
    
    .arrow-icon,
    .input-container input,
    .popular-chip,
    .category-chip,
    .icon-option {
      transition: none;
    }
  }
  
  /* High contrast */
  @media (prefers-contrast: high) {
    .input-container input,
    .popular-chip,
    .category-chip,
    .icon-option {
      border-width: 2px;
    }
  }
</style> 