<!-- src/components/ui/IconPicker.svelte -->
<script>
  import { createEventDispatcher } from 'svelte';
  import { 
    getIconClass, 
    getPopularIcons, 
    getIconsByCategory,
    iconExists 
  } from '../../utils/iconUtils.ts';
  import './IconPicker.css';
  
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

