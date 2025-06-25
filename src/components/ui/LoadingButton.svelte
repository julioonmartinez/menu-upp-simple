<!-- src/components/ui/LoadingButton.svelte -->
<script>
  export let type = 'button';
  export let loading = false;
  export let disabled = false;
  export let size = 'md';
  
  // Permitir clases personalizadas desde el padre
  let className = '';
  export { className as class };
</script>

<button
  {type}
  disabled={disabled || loading}
  class="button-base {size === 'sm' ? 'button-sm' : size === 'lg' ? 'button-lg' : 'button-md'} {className}"
  on:click
  {...$$restProps}
>
  {#if loading}
    <svg class="spinner" viewBox="0 0 24 24">
      <circle 
        class="opacity-25" 
        cx="12" 
        cy="12" 
        r="10" 
        stroke="currentColor" 
        stroke-width="4"
        fill="none"
      />
      <path 
        class="opacity-75" 
        fill="currentColor" 
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  {/if}
  <slot />
</button>

<style>
  .button-base {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    font-weight: 500;
    border-radius: 0.5rem;
    transition: all 0.15s ease-in-out;
    outline: none;
    border: 1px solid transparent;
    cursor: pointer;
    text-decoration: none;
    
    /* Estados disabled/loading */
    &:disabled {
      opacity: 0.6;
      cursor: not-allowed;
      pointer-events: none;
    }
    
    /* Focus */
    &:focus {
      outline: 2px solid transparent;
      outline-offset: 2px;
      box-shadow: 0 0 0 2px rgb(59 130 246 / 0.5);
    }
  }

  /* Tamaños */
  .button-sm {
    padding: 0.375rem 0.75rem;
    font-size: 0.875rem;
    line-height: 1.25rem;
  }

  .button-md {
    padding: 0.5rem 1rem;
    font-size: 0.875rem;
    line-height: 1.25rem;
  }

  .button-lg {
    padding: 0.75rem 1.5rem;
    font-size: 1rem;
    line-height: 1.5rem;
  }

  /* Spinner */
  .spinner {
    width: 1rem;
    height: 1rem;
    margin-right: 0.5rem;
    animation: spin 1s linear infinite;
  }

  @keyframes spin {
    from {
      transform: rotate(0deg);
    }
    to {
      transform: rotate(360deg);
    }
  }
</style>