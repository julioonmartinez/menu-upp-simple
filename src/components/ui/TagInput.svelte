<!-- src/components/ui/TagInput.svelte -->
<script>
  import { createEventDispatcher } from 'svelte';
  
  export let label = '';
  export let id = '';
  export let value = []; // Array de tags actuales
  export let placeholder = 'Agregar etiqueta...';
  export let required = false;
  export let disabled = false;
  export let help = '';
  export let error = '';
  export let maxTags = null; // Límite máximo de tags
  export let suggestions = []; // Sugerencias para autocompletado
  export let allowCustom = true; // Permitir tags personalizados
  export let caseSensitive = false; // Comparación sensible a mayúsculas
  export let separators = [',', ';', 'Enter']; // Separadores para crear tags
  export let minLength = 1; // Longitud mínima de un tag
  export let maxLength = 50; // Longitud máxima de un tag
  
  const dispatch = createEventDispatcher();
  
  let inputValue = '';
  let inputElement;
  let showSuggestions = false;
  let selectedSuggestionIndex = -1;
  let filteredSuggestions = [];
  
  // Reactive: filtrar sugerencias
  $: {
    if (inputValue.trim() && suggestions.length > 0) {
      const query = caseSensitive ? inputValue : inputValue.toLowerCase();
      filteredSuggestions = suggestions.filter(suggestion => {
        const suggestionText = caseSensitive ? suggestion : suggestion.toLowerCase();
        return suggestionText.includes(query) && !isTagExists(suggestion);
      });
      showSuggestions = filteredSuggestions.length > 0;
      selectedSuggestionIndex = -1;
    } else {
      filteredSuggestions = [];
      showSuggestions = false;
      selectedSuggestionIndex = -1;
    }
  }
  
  function isTagExists(tag) {
    const comparison = caseSensitive ? tag : tag.toLowerCase();
    return value.some(existingTag => 
      caseSensitive ? existingTag === comparison : existingTag.toLowerCase() === comparison
    );
  }
  
  function addTag(tagText) {
    const trimmedTag = tagText.trim();
    
    // Validaciones
    if (!trimmedTag) return false;
    if (trimmedTag.length < minLength) return false;
    if (trimmedTag.length > maxLength) return false;
    if (isTagExists(trimmedTag)) return false;
    if (maxTags && value.length >= maxTags) return false;
    if (!allowCustom && !suggestions.includes(trimmedTag)) return false;
    
    // Agregar tag
    const newTags = [...value, trimmedTag];
    value = newTags;
    dispatch('change', { tags: newTags });
    
    return true;
  }
  
  function removeTag(index) {
    const newTags = value.filter((_, i) => i !== index);
    value = newTags;
    dispatch('change', { tags: newTags });
  }
  
  function handleInputKeydown(event) {
    const { key } = event;
    
    // Manejar sugerencias con teclado
    if (showSuggestions) {
      if (key === 'ArrowDown') {
        event.preventDefault();
        selectedSuggestionIndex = Math.min(selectedSuggestionIndex + 1, filteredSuggestions.length - 1);
        return;
      }
      
      if (key === 'ArrowUp') {
        event.preventDefault();
        selectedSuggestionIndex = Math.max(selectedSuggestionIndex - 1, -1);
        return;
      }
      
      if (key === 'Tab' && selectedSuggestionIndex >= 0) {
        event.preventDefault();
        selectSuggestion(selectedSuggestionIndex);
        return;
      }
    }
    
    // Separadores para agregar tags
    if (separators.includes(key)) {
      event.preventDefault();
      
      if (showSuggestions && selectedSuggestionIndex >= 0) {
        selectSuggestion(selectedSuggestionIndex);
      } else if (inputValue.trim()) {
        if (addTag(inputValue)) {
          inputValue = '';
        }
      }
      return;
    }
    
    // Backspace para eliminar último tag
    if (key === 'Backspace' && !inputValue && value.length > 0) {
      removeTag(value.length - 1);
      return;
    }
    
    // Escape para cerrar sugerencias
    if (key === 'Escape') {
      showSuggestions = false;
      selectedSuggestionIndex = -1;
      return;
    }
  }
  
  function handleInputBlur() {
    // Delay para permitir click en sugerencias
    setTimeout(() => {
      if (inputValue.trim() && !showSuggestions) {
        addTag(inputValue);
        inputValue = '';
      }
      showSuggestions = false;
    }, 150);
  }
  
  function selectSuggestion(index) {
    const suggestion = filteredSuggestions[index];
    if (suggestion && addTag(suggestion)) {
      inputValue = '';
      showSuggestions = false;
      selectedSuggestionIndex = -1;
      inputElement?.focus();
    }
  }
  
  function handleSuggestionClick(suggestion) {
    if (addTag(suggestion)) {
      inputValue = '';
      showSuggestions = false;
      inputElement?.focus();
    }
  }
  
  function focusInput() {
    if (!disabled && inputElement) {
      inputElement.focus();
    }
  }
  
  // Calcular si se puede agregar más tags
  $: canAddMore = !maxTags || value.length < maxTags;
  $: remainingTags = maxTags ? maxTags - value.length : null;
</script>

<div class="tag-input flex flex-col gap-xs">
  {#if label}
    <label for={id} class="text-sm font-medium text-primary flex items-center gap-xs">
      {label}
      {#if required}
        <span class="text-error">*</span>
      {/if}
      {#if maxTags}
        <span class="text-xs text-muted ml-auto">({value.length}/{maxTags})</span>
      {/if}
    </label>
  {/if}
  <div class="relative">
    <div 
      class="tags-container flex flex-wrap gap-xs items-center min-h-[2.5rem] p-xs border rounded bg-white cursor-text transition-all w-full {error ? 'border-error' : 'border'} {disabled ? 'bg-gray opacity-50 cursor-not-allowed' : ''}"
      on:click={focusInput}
    >
      <!-- Tags existentes -->
      {#each value as tag, index}
        <div class="tag inline-flex items-center gap-2xs px-sm py-xs bg-accent text-primary rounded text-xs font-medium max-w-[200px]">
          <span class="tag-text truncate">{tag}</span>
          {#if !disabled}
            <button
              type="button"
              class="tag-remove btn btn-ghost btn-sm btn-rounded p-0"
              on:click|stopPropagation={() => removeTag(index)}
              aria-label="Eliminar {tag}"
            >
              <svg class="remove-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          {/if}
        </div>
      {/each}
      
      <!-- Input para nuevos tags -->
      {#if canAddMore && !disabled}
        <input
          bind:this={inputElement}
          bind:value={inputValue}
          {id}
          type="text"
          {placeholder}
          class="tag-input-field input border-0 bg-transparent text-sm flex-1 min-w-[120px] p-0"
          on:keydown={handleInputKeydown}
          on:blur={handleInputBlur}
          on:input={() => {}}
        />
      {/if}
      
      <!-- Placeholder cuando no hay tags -->
      {#if value.length === 0 && (!canAddMore || disabled)}
        <span class="empty-placeholder text-sm text-muted italic">
          {disabled ? 'Sin etiquetas' : 'Máximo de etiquetas alcanzado'}
        </span>
      {/if}
    </div>
    
    <!-- Sugerencias -->
    {#if showSuggestions && filteredSuggestions.length > 0}
      <div class="suggestions-container absolute left-0 right-0 bg-white border rounded shadow-lg max-h-[200px] overflow-y-auto z-[50] mt-xs">
        {#each filteredSuggestions as suggestion, index}
          <button
            type="button"
            class="suggestion-item w-full text-left px-md py-sm bg-transparent border-0 text-sm transition-all border-b last:border-b-0 {index === selectedSuggestionIndex ? 'bg-accent text-primary' : ''}"
            on:click={() => handleSuggestionClick(suggestion)}
          >
            {suggestion}
          </button>
        {/each}
      </div>
    {/if}
  </div>
  
  <!-- Mensajes de ayuda/error -->
  <div class="messages flex flex-col gap-2xs">
    {#if error}
      <p class="text-xs text-error m-0">{error}</p>
    {:else if help}
      <p class="text-xs text-muted m-0">{help}</p>
    {/if}
    
    {#if remainingTags !== null && remainingTags <= 3 && remainingTags > 0}
      <p class="text-xs text-info m-0">
        {remainingTags} etiqueta{remainingTags === 1 ? '' : 's'} restante{remainingTags === 1 ? '' : 's'}
      </p>
    {/if}
  </div>
  
  <!-- Hidden input para formularios -->
  <input
    type="hidden"
    name={id}
    value={JSON.stringify(value)}
  />
</div>

<style>
  .tag-input { position: relative; }
  .tags-container:focus-within {
    border-color: var(--primary-color);
    box-shadow: 0 0 0 3px rgba(255, 107, 53, 0.1);
  }
  .tag-remove .remove-icon {
    width: 0.75rem;
    height: 0.75rem;
  }
  .suggestion-item.selected,
  .suggestion-item:hover {
    background: var(--bg-accent);
    color: var(--primary-color);
  }
  @media (max-width: 640px) {
    .tag { max-width: 150px; }
    .tag-input-field { min-width: 100px; }
    .suggestions-container { left: -0.5rem; right: -0.5rem; }
  }
</style>