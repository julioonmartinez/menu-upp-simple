<!-- src/components/ui/TextareaField.svelte -->
<script>
  export let label = '';
  export let id = '';
  export let value = '';
  export let placeholder = '';
  export let required = false;
  export let disabled = false;
  export let help = '';
  export let error = '';
  export let rows = 3;
  export let maxLength = null; // Longitud máxima de caracteres
  export let minLength = null; // Longitud mínima de caracteres
  export let resize = 'vertical'; // vertical, horizontal, both, none
  
  // Calcular caracteres restantes
  $: remainingChars = maxLength ? maxLength - value.length : null;
  $: isOverLimit = maxLength && value.length > maxLength;
  
  $: textareaClasses = `
    block w-full px-3 py-2 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors resize-vertical
    ${error ? 'border-red-300 text-red-900 placeholder-red-400' : 'border-gray-300'}
    ${disabled ? 'bg-gray-50 text-gray-500' : 'bg-white text-gray-900'}
  `;

  // Manejar el evento input para actualizar el valor
  function handleInput(event) {
    value = event.target.value;
  }
</script>

<div class="textarea-field">
  {#if label}
    <label for={id} class="textarea-label">
      {label}
      {#if required}
        <span class="required-indicator">*</span>
      {/if}
      {#if maxLength}
        <span class="char-counter {isOverLimit ? 'over-limit' : ''}">
          {value.length}/{maxLength}
        </span>
      {/if}
    </label>
  {/if}
  
  <div class="textarea-wrapper">
    <textarea
      {id}
      {value}
      {placeholder}
      {required}
      {disabled}
      {rows}
      {maxLength}
      {minLength}
      class="textarea-input {error ? 'error' : ''} {disabled ? 'disabled' : ''} resize-{resize}"
      on:input={handleInput}
      on:input
      on:change
      on:blur
      on:focus
    ></textarea>
    
    <!-- Indicador de caracteres restantes -->
    {#if maxLength && remainingChars !== null && remainingChars <= 20}
      <div class="char-indicator {isOverLimit ? 'over-limit' : ''}">
        {remainingChars} caracter{remainingChars === 1 ? '' : 'es'} restante{remainingChars === 1 ? '' : 's'}
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
  </div>
</div>

<style>
  /* Container principal */
  .textarea-field {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-xs);
  }

  /* Label styles */
  .textarea-label {
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

  .char-counter {
    font-size: var(--font-xs);
    color: var(--text-muted);
    margin-left: auto;
    transition: color var(--transition-fast);
  }

  .char-counter.over-limit {
    color: var(--error);
  }

  /* Textarea wrapper */
  .textarea-wrapper {
    position: relative;
  }

  /* Textarea input */
  .textarea-input {
    width: 100%;
    padding: var(--spacing-md) var(--spacing-lg);
    border: 1px solid var(--bg-accent);
    border-radius: var(--radius-lg);
    font-size: var(--font-base);
    line-height: var(--leading-normal);
    background: var(--bg-primary);
    color: var(--text-primary);
    transition: all var(--transition-normal);
    min-height: 44px;
    font-family: inherit;
    
    /* Touch improvements */
    -webkit-appearance: none;
    appearance: none;
    
    /* Focus styles */
    outline: none;
  }

  .textarea-input:focus {
    border-color: var(--primary-color);
    box-shadow: 0 0 0 3px rgba(255, 107, 53, 0.1);
    transform: scale(1.01);
  }

  .textarea-input::placeholder {
    color: var(--text-light);
  }

  /* Error state */
  .textarea-input.error {
    border-color: var(--error);
    box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.1);
  }

  .textarea-input.error:focus {
    border-color: var(--error);
    box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.2);
  }

  /* Disabled state */
  .textarea-input.disabled {
    background: var(--bg-tertiary);
    color: var(--text-muted);
    cursor: not-allowed;
    opacity: 0.6;
  }

  .textarea-input.disabled:focus {
    transform: none;
    box-shadow: none;
  }

  /* Resize variants */
  .textarea-input.resize-none {
    resize: none;
  }

  .textarea-input.resize-vertical {
    resize: vertical;
  }

  .textarea-input.resize-horizontal {
    resize: horizontal;
  }

  .textarea-input.resize-both {
    resize: both;
  }

  /* Character indicator */
  .char-indicator {
    position: absolute;
    bottom: var(--spacing-xs);
    right: var(--spacing-md);
    font-size: var(--font-xs);
    color: var(--text-muted);
    background: var(--bg-primary);
    padding: var(--spacing-xs) var(--spacing-sm);
    border-radius: var(--radius-sm);
    transition: all var(--transition-fast);
  }

  .char-indicator.over-limit {
    color: var(--error);
    background: var(--error-bg);
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

  /* Responsive adjustments */
  @media (max-width: 768px) {
    .textarea-input {
      min-height: 48px; /* Better touch target on mobile */
      padding: var(--spacing-lg);
    }
    
    .char-indicator {
      bottom: var(--spacing-sm);
      right: var(--spacing-lg);
    }
  }

  /* Touch device optimizations */
  @media (hover: none) and (pointer: coarse) {
    .textarea-input {
      min-height: 48px;
      padding: var(--spacing-lg);
    }
    
    .textarea-input:focus {
      transform: none; /* Disable scale on touch devices */
    }
  }

  /* Reduced motion support */
  @media (prefers-reduced-motion: reduce) {
    .textarea-input,
    .char-counter,
    .char-indicator {
      transition: none;
    }
    
    .textarea-input:focus {
      transform: none;
    }
  }

  /* Dark mode support */
  @media (prefers-color-scheme: dark) {
    .textarea-input {
      background: var(--bg-tertiary);
      border-color: var(--bg-accent);
      color: var(--text-primary);
    }
    
    .textarea-input:focus {
      background: var(--bg-primary);
    }
    
    .textarea-input.disabled {
      background: var(--bg-accent);
      color: var(--text-muted);
    }
    
    .char-indicator {
      background: var(--bg-tertiary);
    }
    
    .char-indicator.over-limit {
      background: var(--error-bg);
    }
  }

  /* High contrast mode */
  @media (prefers-contrast: high) {
    .textarea-input {
      border-width: 2px;
    }
    
    .textarea-input.error {
      border-width: 3px;
    }
    
    .char-indicator {
      border: 1px solid var(--text-primary);
    }
  }

  /* Focus management */
  .textarea-input:focus-visible {
    outline: 2px solid var(--primary-color);
    outline-offset: 2px;
  }

  /* Scrollbar styling */
  .textarea-input::-webkit-scrollbar {
    width: 8px;
  }

  .textarea-input::-webkit-scrollbar-track {
    background: var(--bg-tertiary);
    border-radius: var(--radius-sm);
  }

  .textarea-input::-webkit-scrollbar-thumb {
    background: var(--bg-accent);
    border-radius: var(--radius-sm);
  }

  .textarea-input::-webkit-scrollbar-thumb:hover {
    background: var(--text-muted);
  }

  /* Auto-resize functionality (optional enhancement) */
  .textarea-input.auto-resize {
    overflow: hidden;
    resize: none;
  }

  /* Custom focus ring for better accessibility */
  .textarea-input:focus {
    outline: none;
  }

  .textarea-input:focus-visible {
    outline: 2px solid var(--primary-color);
    outline-offset: 2px;
  }

  /* Hover state */
  .textarea-input:hover:not(:disabled):not(:focus) {
    border-color: var(--text-muted);
  }

  /* Active state */
  .textarea-input:active:not(:disabled) {
    transform: scale(1.005);
  }

  /* Print styles */
  @media print {
    .textarea-input {
      border: 1px solid black;
      background: white;
      color: black;
    }
    
    .char-indicator,
    .char-counter {
      display: none;
    }
  }
</style>