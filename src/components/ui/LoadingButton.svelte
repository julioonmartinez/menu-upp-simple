<!-- src/components/ui/LoadingButton.svelte -->
<script>
  export let type = 'button';
  export let loading = false;
  export let disabled = false;
  export let size = 'md';
  export let variant = 'primary'; // primary, secondary, ghost
  export let rounded = false;
  
  // Permitir clases personalizadas desde el padre
  let className = '';
  export { className as class };
</script>

<button
  {type}
  disabled={disabled || loading}
  class="loading-button {variant} {size} {rounded ? 'rounded' : ''} {className}"
  on:click
  {...$$restProps}
>
  {#if loading}
    <svg class="spinner" viewBox="0 0 24 24" aria-hidden="true">
      <circle 
        class="spinner-track" 
        cx="12" 
        cy="12" 
        r="10" 
        stroke="currentColor" 
        stroke-width="4"
        fill="none"
      />
      <path 
        class="spinner-indicator" 
        fill="currentColor" 
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  {/if}
  <slot />
</button>

<style>
  /* Base button styles using global CSS variables */
  .loading-button {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: var(--spacing-sm);
    font-weight: var(--weight-semibold);
    font-size: var(--font-base);
    line-height: 1;
    border-radius: var(--radius-lg);
    transition: all var(--transition-normal);
    cursor: pointer;
    border: none;
    min-height: 44px;
    text-decoration: none;
    position: relative;
    overflow: hidden;
    white-space: nowrap;
    
    /* Touch improvements */
    touch-action: manipulation;
    -webkit-tap-highlight-color: transparent;
    -webkit-appearance: none;
    appearance: none;
    
    /* Focus styles */
    outline: none;
  }

  /* Hover effect with global variables */
  .loading-button::before {
    content: '';
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
    transition: left 0.5s ease;
  }

  .loading-button:hover:not(:disabled)::before {
    left: 100%;
  }

  .loading-button:hover:not(:disabled) {
    transform: translateY(-2px);
  }

  .loading-button:active:not(:disabled) {
    transform: translateY(0);
  }

  /* Disabled state */
  .loading-button:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
    pointer-events: none;
  }

  /* Focus visible for accessibility */
  .loading-button:focus-visible {
    outline: 2px solid var(--primary-color);
    outline-offset: 2px;
    box-shadow: 0 0 0 3px rgba(255, 107, 53, 0.1);
  }

  /* Size variants using global spacing */
  .loading-button.sm {
    padding: var(--spacing-sm) var(--spacing-md);
    font-size: var(--font-sm);
    min-height: 36px;
  }

  .loading-button.md {
    padding: var(--spacing-md) var(--spacing-xl);
    font-size: var(--font-base);
    min-height: 44px;
  }

  .loading-button.lg {
    padding: var(--spacing-lg) var(--spacing-2xl);
    font-size: var(--font-lg);
    min-height: 52px;
  }

  /* Variant styles */
  .loading-button.primary {
    background: var(--primary-gradient);
    color: var(--text-inverse);
    box-shadow: var(--shadow-sm);
  }

  .loading-button.primary:hover:not(:disabled) {
    box-shadow: var(--primary-glow);
  }

  .loading-button.secondary {
    background: var(--bg-primary);
    color: var(--text-primary);
    border: 1px solid var(--bg-accent);
  }

  .loading-button.secondary:hover:not(:disabled) {
    border-color: var(--primary-color);
    color: var(--primary-color);
    background: var(--bg-tertiary);
  }

  .loading-button.ghost {
    background: transparent;
    color: var(--text-muted);
  }

  .loading-button.ghost:hover:not(:disabled) {
    background: var(--bg-tertiary);
    color: var(--text-primary);
  }

  /* Rounded variant */
  .loading-button.rounded {
    border-radius: var(--radius-full);
  }

  /* Spinner styles */
  .spinner {
    width: 1rem;
    height: 1rem;
    margin-right: var(--spacing-sm);
    animation: spin 1s linear infinite;
  }

  .spinner-track {
    opacity: 0.25;
  }

  .spinner-indicator {
    opacity: 0.75;
  }

  @keyframes spin {
    from {
      transform: rotate(0deg);
    }
    to {
      transform: rotate(360deg);
    }
  }

  /* Responsive adjustments */
  @media (max-width: 768px) {
    .loading-button {
      min-height: 48px; /* Better touch target on mobile */
    }
    
    .loading-button.sm {
      min-height: 40px;
    }
    
    .loading-button.lg {
      min-height: 56px;
    }
  }

  /* Reduced motion support */
  @media (prefers-reduced-motion: reduce) {
    .loading-button::before {
      display: none;
    }
    
    .loading-button:hover:not(:disabled) {
      transform: none;
    }
    
    .spinner {
      animation: none;
    }
  }

  /* Dark mode support */
  @media (prefers-color-scheme: dark) {
    .loading-button.secondary {
      background: var(--bg-tertiary);
      border-color: var(--bg-accent);
      color: var(--text-primary);
    }
    
    .loading-button.secondary:hover:not(:disabled) {
      background: var(--bg-accent);
      border-color: var(--primary-color);
    }
    
    .loading-button.ghost {
      color: var(--text-light);
    }
    
    .loading-button.ghost:hover:not(:disabled) {
      background: var(--bg-accent);
      color: var(--text-primary);
    }
  }

  /* High contrast mode */
  @media (prefers-contrast: high) {
    .loading-button {
      border-width: 2px;
    }
    
    .loading-button.secondary {
      border-width: 2px;
    }
  }
</style>