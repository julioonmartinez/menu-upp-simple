<!-- src/components/ui/ColorPicker.svelte -->
<script>
  import { createEventDispatcher } from 'svelte';
  
  export let label = '';
  export let id = '';
  export let value = '#3b82f6'; // Color actual en formato hex
  export let required = false;
  export let disabled = false;
  export let help = '';
  export let error = '';
  export let showPresets = true;
  export let showCustomPicker = true;
  export let showInput = true;
  
  const dispatch = createEventDispatcher();
  
  let isOpen = false;
  let inputValue = value;
  let pickerValue = value;
  
  // Paleta de colores predefinidos
  const presetColors = [
    // Azules
    '#3b82f6', '#1d4ed8', '#1e40af', '#1e3a8a',
    // Rojos
    '#ef4444', '#dc2626', '#b91c1c', '#991b1b',
    // Verdes
    '#10b981', '#059669', '#047857', '#065f46',
    // Amarillos/Naranjas
    '#f59e0b', '#d97706', '#b45309', '#92400e',
    // Púrpuras
    '#8b5cf6', '#7c3aed', '#6d28d9', '#5b21b6',
    // Grises
    '#6b7280', '#4b5563', '#374151', '#1f2937',
    // Rosas
    '#ec4899', '#db2777', '#be185d', '#9d174d',
    // Otros
    '#06b6d4', '#0891b2', '#0e7490', '#155e75'
  ];
  
  // Reactive: sincronizar valores
  $: if (value !== inputValue) {
    inputValue = value;
    pickerValue = value;
  }
  
  function handleInputChange() {
    const color = validateAndFormatColor(inputValue);
    if (color) {
      value = color;
      pickerValue = color;
      dispatch('change', { color });
    }
  }
  
  function handlePickerChange(event) {
    const color = event.target.value;
    value = color;
    inputValue = color;
    pickerValue = color;
    dispatch('change', { color });
  }
  
  function selectPresetColor(color) {
    value = color;
    inputValue = color;
    pickerValue = color;
    dispatch('change', { color });
    isOpen = false;
  }
  
  function validateAndFormatColor(colorString) {
    // Remover espacios y convertir a lowercase
    let color = colorString.trim().toLowerCase();
    
    // Agregar # si no tiene
    if (!color.startsWith('#')) {
      color = '#' + color;
    }
    
    // Validar formato hex
    const hexRegex = /^#([0-9a-f]{3}|[0-9a-f]{6})$/;
    if (hexRegex.test(color)) {
      // Convertir hex corto a largo (ej: #abc -> #aabbcc)
      if (color.length === 4) {
        color = '#' + color[1] + color[1] + color[2] + color[2] + color[3] + color[3];
      }
      return color;
    }
    
    return null;
  }
  
  function toggleDropdown() {
    if (!disabled) {
      isOpen = !isOpen;
    }
  }
  
  function closeDropdown() {
    isOpen = false;
  }
  
  // Obtener contraste para el texto
  function getTextColor(bgColor) {
    const hex = bgColor.replace('#', '');
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);
    const brightness = (r * 299 + g * 587 + b * 114) / 1000;
    return brightness > 128 ? '#000000' : '#ffffff';
  }
  
  // Cerrar dropdown al hacer click afuera
  function handleClickOutside(event) {
    if (isOpen && !event.target.closest('.color-picker')) {
      closeDropdown();
    }
  }
</script>

<svelte:window on:click={handleClickOutside} />

<div class="flex flex-col gap-md relative color-picker">
  {#if label}
    <label for={id} class="text-sm font-medium text-primary">
      {label}
      {#if required}
        <span class="text-error">*</span>
      {/if}
    </label>
  {/if}
  <div class="relative picker-container">
    <!-- Color Display Button -->
    <button
      type="button"
      class="w-full h-2xl border rounded-lg flex items-center overflow-hidden transition-all bg-transparent px-0 {error ? 'border-error' : 'border-accent'} {disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:shadow'} color-display"
      style="background-color: {value}"
      on:click={toggleDropdown}
      {disabled}
      aria-label="Seleccionar color"
    >
      <div class="flex-1 flex items-center justify-center px-lg color-preview" style="background-color: {value}">
        <span class="text-sm font-medium color-text" style="color: {getTextColor(value)}">
          {value}
        </span>
      </div>
      <div class="w-2xl flex items-center justify-center bg-white border-l border-accent dropdown-arrow">
        <svg class="w-md h-md text-muted arrow-icon {isOpen ? 'rotated' : ''}" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
        </svg>
      </div>
    </button>
    {#if isOpen}
      <div class="dropdown-panel absolute left-0 right-0 mt-xs bg-white border border-accent rounded-xl shadow-lg p-lg z-50 flex flex-col gap-lg">
        {#if showInput}
          <div class="flex flex-col gap-xs input-section">
            <label class="text-xs font-medium text-primary input-label">Código de color:</label>
            <input
              type="text"
              bind:value={inputValue}
              on:change={handleInputChange}
              on:blur={handleInputChange}
              placeholder="#3b82f6"
              class="input input-sm font-mono color-input"
              maxlength="7"
            />
          </div>
        {/if}
        {#if showCustomPicker}
          <div class="flex flex-col gap-xs picker-section">
            <label class="text-xs font-medium text-primary input-label">Selector personalizado:</label>
            <input
              type="color"
              bind:value={pickerValue}
              on:input={handlePickerChange}
              class="w-full h-2xl rounded border border-accent cursor-pointer native-picker"
            />
          </div>
        {/if}
        {#if showPresets}
          <div class="flex flex-col gap-xs presets-section">
            <label class="text-xs font-medium text-primary input-label">Colores predefinidos:</label>
            <div class="grid gap-xs color-grid" style="grid-template-columns: repeat(8, minmax(0, 1fr));">
              {#each presetColors as color}
                <button
                  type="button"
                  class="w-xl h-xl border rounded cursor-pointer flex items-center justify-center transition-all preset-color {value === color ? 'border-primary border-2 selected' : 'border-accent'}"
                  style="background-color: {color}"
                  on:click={() => selectPresetColor(color)}
                  title={color}
                  aria-label="Seleccionar color {color}"
                >
                  {#if value === color}
                    <svg class="w-md h-md check-icon" fill="currentColor" viewBox="0 0 20 20" style="color: {getTextColor(color)}">
                      <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
                    </svg>
                  {/if}
                </button>
              {/each}
            </div>
          </div>
        {/if}
        <div class="flex justify-end gap-xs border-t border-accent pt-md actions">
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
    {id}
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
  /* Solo detalles visuales especiales para dropdown y animaciones */
  .dropdown-panel {
    animation: fadeIn 0.2s ease;
  }
  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(10px); }
    to { opacity: 1; transform: translateY(0); }
  }
  .arrow-icon.rotated {
    transform: rotate(180deg);
    transition: transform 0.2s;
  }
  @media (max-width: 640px) {
    .color-grid {
      grid-template-columns: repeat(6, minmax(0, 1fr));
    }
    .dropdown-panel {
      left: -1rem;
      right: -1rem;
    }
  }
</style>