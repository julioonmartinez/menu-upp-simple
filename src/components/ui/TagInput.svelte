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

<div class="tag-input">
  {#if label}
    <label for={id} class="tag-label">
      {label}
      {#if required}
        <span class="required-indicator">*</span>
      {/if}
      {#if maxTags}
        <span class="tag-counter">({value.length}/{maxTags})</span>
      {/if}
    </label>
  {/if}
  
  <div class="tag-input-wrapper">
    <div 
      class="tags-container {error ? 'error' : ''} {disabled ? 'disabled' : ''}"
      on:click={focusInput}
    >
      <!-- Tags existentes -->
      {#each value as tag, index}
        <div class="tag">
          <span class="tag-text">{tag}</span>
          {#if !disabled}
            <button
              type="button"
              class="tag-remove"
              on:click|stopPropagation={() => removeTag(index)}
              aria-label="Eliminar {tag}"
            >
              <svg class="remove-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
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
          class="tag-input-field"
          on:keydown={handleInputKeydown}
          on:blur={handleInputBlur}
          on:input={() => {}}
        />
      {/if}
      
      <!-- Placeholder cuando no hay tags -->
      {#if value.length === 0 && (!canAddMore || disabled)}
        <span class="empty-placeholder">
          {disabled ? 'Sin etiquetas' : 'Máximo de etiquetas alcanzado'}
        </span>
      {/if}
    </div>
    
    <!-- Sugerencias -->
    {#if showSuggestions && filteredSuggestions.length > 0}
      <div class="suggestions-container">
        {#each filteredSuggestions as suggestion, index}
          <button
            type="button"
            class="suggestion-item {index === selectedSuggestionIndex ? 'selected' : ''}"
            on:click={() => handleSuggestionClick(suggestion)}
          >
            {suggestion}
          </button>
        {/each}
      </div>
    {/if}
  </div>
  
  <!-- Mensajes de ayuda/error -->
  <div class="messages">
    {#if error}
      <p class="error-message">{error}</p>
    {:else if help}
      <p class="help-message">{help}</p>
    {/if}
    
    {#if remainingTags !== null && remainingTags <= 3 && remainingTags > 0}
      <p class="remaining-message">
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
  /* Container principal */
  .tag-input {
    position: relative;
    display: flex;
    flex-direction: column;
    gap: var(--spacing-xs);
  }

  /* Label styles */
  .tag-label {
    font-size: var(--font-sm);
    font-weight: var(--weight-medium);
    color: var(--text-primary);
    display: flex;
    align-items: center;
    gap: var(--spacing-xs);
  }

  .required-indicator {
    color: var(--error);
  }

  .tag-counter {
    font-size: var(--font-xs);
    color: var(--text-muted);
    margin-left: auto;
  }

  /* Input wrapper */
  .tag-input-wrapper {
    position: relative;
  }

  /* Tags container */
  .tags-container {
    display: flex;
    flex-wrap: wrap;
    gap: var(--spacing-xs);
    align-items: center;
    min-height: 2.5rem;
    padding: var(--spacing-xs);
    border: 1px solid var(--bg-accent);
    border-radius: var(--radius-lg);
    background: var(--bg-primary);
    cursor: text;
    transition: all var(--transition-normal);
    width: 100%;
  }

  .tags-container:focus-within {
    border-color: var(--primary-color);
    box-shadow: 0 0 0 3px rgba(255, 107, 53, 0.1);
  }

  .tags-container.error {
    border-color: var(--error);
    box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.1);
  }

  .tags-container.disabled {
    background: var(--bg-tertiary);
    opacity: 0.5;
    cursor: not-allowed;
  }

  /* Individual tag styles */
  .tag {
    display: inline-flex;
    align-items: center;
    gap: var(--spacing-xs);
    padding: var(--spacing-xs) var(--spacing-sm);
    background: var(--bg-accent);
    color: var(--text-primary);
    border-radius: var(--radius-md);
    font-size: var(--font-xs);
    font-weight: var(--weight-medium);
    max-width: 200px;
    transition: all var(--transition-fast);
  }

  .tag:hover {
    background: var(--bg-tertiary);
  }

  .tag-text {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  /* Tag remove button */
  .tag-remove {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 16px;
    height: 16px;
    border: none;
    background: transparent;
    color: var(--text-muted);
    cursor: pointer;
    border-radius: var(--radius-xs);
    transition: all var(--transition-fast);
    padding: 0;
    min-width: auto;
    min-height: auto;
  }

  .tag-remove:hover {
    background: var(--bg-tertiary);
    color: var(--error);
    transform: scale(1.1);
  }

  .tag-remove:focus-visible {
    outline: 2px solid var(--primary-color);
    outline-offset: 2px;
  }

  .remove-icon {
    width: 0.75rem;
    height: 0.75rem;
  }

  /* Input field */
  .tag-input-field {
    border: none;
    background: transparent;
    font-size: var(--font-sm);
    flex: 1;
    min-width: 120px;
    padding: 0;
    outline: none;
    color: var(--text-primary);
    min-height: auto;
  }

  .tag-input-field::placeholder {
    color: var(--text-light);
  }

  /* Empty placeholder */
  .empty-placeholder {
    font-size: var(--font-sm);
    color: var(--text-muted);
    font-style: italic;
  }

  /* Suggestions container */
  .suggestions-container {
    position: absolute;
    left: 0;
    right: 0;
    top: 100%;
    background: var(--bg-primary);
    border: 1px solid var(--bg-accent);
    border-radius: var(--radius-lg);
    box-shadow: var(--shadow-lg);
    max-height: 200px;
    overflow-y: auto;
    z-index: var(--z-dropdown);
    margin-top: var(--spacing-xs);
  }

  /* Suggestion items */
  .suggestion-item {
    width: 100%;
    text-align: left;
    padding: var(--spacing-md) var(--spacing-lg);
    background: transparent;
    border: none;
    font-size: var(--font-sm);
    transition: all var(--transition-fast);
    border-bottom: 1px solid var(--bg-accent);
    cursor: pointer;
    color: var(--text-primary);
  }

  .suggestion-item:last-child {
    border-bottom: none;
  }

  .suggestion-item:hover,
  .suggestion-item.selected {
    background: var(--bg-accent);
    color: var(--primary-color);
  }

  .suggestion-item:focus-visible {
    outline: 2px solid var(--primary-color);
    outline-offset: -2px;
  }

  /* Messages container */
  .messages {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-xs);
  }

  .error-message {
    font-size: var(--font-xs);
    color: var(--error);
    margin: 0;
  }

  .help-message {
    font-size: var(--font-xs);
    color: var(--text-muted);
    margin: 0;
  }

  .remaining-message {
    font-size: var(--font-xs);
    color: var(--info);
    margin: 0;
  }

  /* Responsive adjustments */
  @media (max-width: 640px) {
    .tag {
      max-width: 150px;
    }
    
    .tag-input-field {
      min-width: 100px;
    }
    
    .suggestions-container {
      left: calc(-1 * var(--spacing-sm));
      right: calc(-1 * var(--spacing-sm));
    }
  }

  /* Touch device optimizations */
  @media (hover: none) and (pointer: coarse) {
    .tag-remove {
      width: 20px;
      height: 20px;
    }
    
    .remove-icon {
      width: 1rem;
      height: 1rem;
    }
    
    .suggestion-item {
      padding: var(--spacing-lg);
      min-height: 44px;
    }
  }

  /* Reduced motion support */
  @media (prefers-reduced-motion: reduce) {
    .tags-container,
    .tag,
    .tag-remove,
    .suggestion-item {
      transition: none;
    }
    
    .tag-remove:hover {
      transform: none;
    }
  }

  /* Dark mode support */
  @media (prefers-color-scheme: dark) {
    .tags-container {
      background: var(--bg-tertiary);
      border-color: var(--bg-accent);
    }
    
    .tag {
      background: var(--bg-accent);
      color: var(--text-primary);
    }
    
    .tag:hover {
      background: var(--bg-primary);
    }
    
    .suggestions-container {
      background: var(--bg-tertiary);
      border-color: var(--bg-accent);
    }
    
    .suggestion-item {
      border-bottom-color: var(--bg-accent);
    }
    
    .suggestion-item:hover,
    .suggestion-item.selected {
      background: var(--bg-accent);
    }
  }

  /* High contrast mode */
  @media (prefers-contrast: high) {
    .tags-container {
      border-width: 2px;
    }
    
    .tag {
      border: 1px solid var(--text-primary);
    }
    
    .suggestion-item {
      border-bottom-width: 2px;
    }
  }

  /* Focus management */
  .tag-input-field:focus {
    outline: none;
  }

  /* Scrollbar styling for suggestions */
  .suggestions-container::-webkit-scrollbar {
    width: 6px;
  }

  .suggestions-container::-webkit-scrollbar-track {
    background: var(--bg-tertiary);
    border-radius: var(--radius-sm);
  }

  .suggestions-container::-webkit-scrollbar-thumb {
    background: var(--bg-accent);
    border-radius: var(--radius-sm);
  }

  .suggestions-container::-webkit-scrollbar-thumb:hover {
    background: var(--text-muted);
  }
</style>