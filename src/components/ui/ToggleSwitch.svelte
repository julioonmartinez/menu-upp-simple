<!-- src/components/ui/ToggleSwitch.svelte -->
<script>
  import { createEventDispatcher } from 'svelte';
  
  export let label = '';
  export let id = '';
  export let checked = false;
  export let disabled = false;
  export let help = '';
  export let error = '';
  export let size = 'md'; // 'sm', 'md', 'lg'
  export let color = 'blue'; // 'blue', 'green', 'red', 'purple', 'primary'
  export let labelPosition = 'right'; // 'left', 'right'
  
  const dispatch = createEventDispatcher();
  
  function handleToggle() {
    if (!disabled) {
      checked = !checked;
      dispatch('change', { checked });
    }
  }
  
  function handleKeydown(event) {
    if (event.key === ' ' || event.key === 'Enter') {
      event.preventDefault();
      handleToggle();
    }
  }
</script>

<div class="toggle-switch">
  <div class="switch-container {labelPosition === 'left' ? 'reverse' : ''}">
    {#if label && labelPosition === 'left'}
      <label for={id} class="switch-label">
        {label}
      </label>
    {/if}
    
    <button
      {id}
      type="button"
      role="switch"
      aria-checked={checked}
      class="switch switch-{size} switch-{color} {checked ? 'checked' : ''} {disabled ? 'disabled' : ''}"
      on:click={handleToggle}
      on:keydown={handleKeydown}
      {disabled}
    >
      <span class="switch-track">
        <span class="switch-thumb"></span>
      </span>
    </button>
    
    {#if label && labelPosition === 'right'}
      <label for={id} class="switch-label">
        {label}
      </label>
    {/if}
  </div>
  
  <!-- Hidden input para formularios -->
  <input
    type="hidden"
    name={id}
    value={checked}
  />
  
  <!-- Mensajes de ayuda/error -->
  {#if error}
    <p class="message error-message">{error}</p>
  {:else if help}
    <p class="message help-message">{help}</p>
  {/if}
</div>

<style>
  .toggle-switch {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-sm);
  }

  .switch-container {
    display: flex;
    align-items: center;
    gap: var(--spacing-md);
  }

  .switch-container.reverse {
    flex-direction: row-reverse;
    justify-content: flex-end;
  }

  .switch-label {
    font-size: var(--font-sm);
    font-weight: var(--weight-medium);
    color: var(--text-secondary);
    cursor: pointer;
    user-select: none;
    line-height: var(--leading-normal);
    transition: color var(--transition-fast);
  }

  .switch-label:hover {
    color: var(--text-primary);
  }

  /* Switch Button */
  .switch {
    position: relative;
    background: none;
    border: none;
    cursor: pointer;
    padding: 0;
    transition: all var(--transition-normal);
    border-radius: var(--radius-full);
    min-height: 44px; /* Touch target mínimo */
    min-width: 44px;
    touch-action: manipulation;
    -webkit-tap-highlight-color: transparent;
  }

  .switch:focus-visible {
    outline: 2px solid var(--primary-color);
    outline-offset: 2px;
    box-shadow: 0 0 0 4px rgba(255, 107, 53, 0.1);
  }

  .switch.disabled {
    opacity: 0.5;
    cursor: not-allowed;
    pointer-events: none;
  }

  /* Switch Track */
  .switch-track {
    position: relative;
    display: block;
    border-radius: var(--radius-full);
    transition: all var(--transition-normal);
    background-color: var(--bg-accent);
    border: 1px solid var(--bg-accent);
  }

  /* Switch Thumb */
  .switch-thumb {
    position: absolute;
    top: 2px;
    left: 2px;
    background-color: var(--bg-primary);
    border-radius: 50%;
    transition: all var(--transition-bounce);
    box-shadow: var(--shadow-sm);
    border: 1px solid var(--bg-accent);
  }

  /* Size Variants */
  .switch-sm .switch-track {
    width: 2.75rem;
    height: 1.5rem;
  }

  .switch-sm .switch-thumb {
    width: 1.25rem;
    height: 1.25rem;
  }

  .switch-md .switch-track {
    width: 3.5rem;
    height: 1.75rem;
  }

  .switch-md .switch-thumb {
    width: 1.5rem;
    height: 1.5rem;
  }

  .switch-lg .switch-track {
    width: 4rem;
    height: 2rem;
  }

  .switch-lg .switch-thumb {
    width: 1.75rem;
    height: 1.75rem;
  }

  /* Checked State */
  .switch.checked .switch-track {
    background-color: var(--switch-color, var(--primary-color));
    border-color: var(--switch-color, var(--primary-color));
  }

  .switch-sm.checked .switch-thumb {
    transform: translateX(1.25rem);
  }

  .switch-md.checked .switch-thumb {
    transform: translateX(1.75rem);
  }

  .switch-lg.checked .switch-thumb {
    transform: translateX(2rem);
  }

  /* Color Variants */
  .switch-primary {
    --switch-color: var(--primary-color);
  }

  .switch-primary:hover:not(.disabled) .switch-track {
    background-color: var(--primary-dark);
    border-color: var(--primary-dark);
  }

  .switch-blue {
    --switch-color: var(--info);
  }

  .switch-blue:hover:not(.disabled) .switch-track {
    background-color: #2563eb;
    border-color: #2563eb;
  }

  .switch-green {
    --switch-color: var(--success);
  }

  .switch-green:hover:not(.disabled) .switch-track {
    background-color: var(--success-light);
    border-color: var(--success-light);
  }

  .switch-red {
    --switch-color: var(--error);
  }

  .switch-red:hover:not(.disabled) .switch-track {
    background-color: var(--error-light);
    border-color: var(--error-light);
  }

  .switch-purple {
    --switch-color: #8b5cf6;
  }

  .switch-purple:hover:not(.disabled) .switch-track {
    background-color: #7c3aed;
    border-color: #7c3aed;
  }

  /* Hover Effects */
  .switch:hover:not(.disabled) .switch-thumb {
    box-shadow: var(--shadow-md);
    transform: scale(1.05);
  }

  .switch.checked:hover:not(.disabled) .switch-thumb {
    transform: translateX(calc(100% - 1.25rem)) scale(1.05);
  }

  .switch-md.checked:hover:not(.disabled) .switch-thumb {
    transform: translateX(calc(100% - 1.5rem)) scale(1.05);
  }

  .switch-lg.checked:hover:not(.disabled) .switch-thumb {
    transform: translateX(calc(100% - 1.75rem)) scale(1.05);
  }

  /* Active State */
  .switch:active:not(.disabled) .switch-thumb {
    transform: scale(0.95);
  }

  .switch.checked:active:not(.disabled) .switch-thumb {
    transform: translateX(calc(100% - 1.25rem)) scale(0.95);
  }

  .switch-md.checked:active:not(.disabled) .switch-thumb {
    transform: translateX(calc(100% - 1.5rem)) scale(0.95);
  }

  .switch-lg.checked:active:not(.disabled) .switch-thumb {
    transform: translateX(calc(100% - 1.75rem)) scale(0.95);
  }

  /* Messages */
  .message {
    font-size: var(--font-xs);
    margin: 0;
    line-height: var(--leading-tight);
  }

  .error-message {
    color: var(--error);
  }

  .help-message {
    color: var(--text-muted);
  }

  /* Responsive adjustments */
  @media (max-width: 480px) {
    .switch-container {
      gap: var(--spacing-sm);
    }
    
    .switch-label {
      font-size: var(--font-xs);
    }
  }

  /* Touch device optimizations */
  @media (hover: none) and (pointer: coarse) {
    .switch {
      min-height: 48px;
      min-width: 48px;
    }
    
    .switch:hover:not(.disabled) .switch-thumb {
      transform: none;
    }
    
    .switch.checked:hover:not(.disabled) .switch-thumb {
      transform: translateX(calc(100% - 1.25rem));
    }
    
    .switch-md.checked:hover:not(.disabled) .switch-thumb {
      transform: translateX(calc(100% - 1.5rem));
    }
    
    .switch-lg.checked:hover:not(.disabled) .switch-thumb {
      transform: translateX(calc(100% - 1.75rem));
    }
  }

  /* Reduced motion support */
  @media (prefers-reduced-motion: reduce) {
    .switch,
    .switch-track,
    .switch-thumb {
      transition: none;
    }
    
    .switch:hover:not(.disabled) .switch-thumb {
      transform: none;
    }
    
    .switch.checked:hover:not(.disabled) .switch-thumb {
      transform: translateX(calc(100% - 1.25rem));
    }
    
    .switch-md.checked:hover:not(.disabled) .switch-thumb {
      transform: translateX(calc(100% - 1.5rem));
    }
    
    .switch-lg.checked:hover:not(.disabled) .switch-thumb {
      transform: translateX(calc(100% - 1.75rem));
    }
  }

  /* High contrast mode support */
  @media (prefers-contrast: high) {
    .switch-track {
      border-width: 2px;
    }
    
    .switch-thumb {
      border-width: 2px;
      border-color: var(--text-primary);
    }
    
    .switch:focus-visible {
      outline-width: 3px;
    }
  }
</style>