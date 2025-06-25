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
  export let color = 'blue'; // 'blue', 'green', 'red', 'purple'
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
  /* Variables */
  :root {
    --color-gray-200: #e5e7eb;
    --color-gray-300: #d1d5db;
    --color-gray-400: #9ca3af;
    --color-gray-500: #6b7280;
    --color-gray-700: #374151;
    --color-blue-500: #3b82f6;
    --color-blue-600: #2563eb;
    --color-green-500: #10b981;
    --color-green-600: #059669;
    --color-red-500: #ef4444;
    --color-red-600: #dc2626;
    --color-purple-500: #8b5cf6;
    --color-purple-600: #7c3aed;
    --color-white: #ffffff;
  }

  .toggle-switch {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .switch-container {
    display: flex;
    align-items: center;
    gap: 0.75rem;
  }

  .switch-container.reverse {
    flex-direction: row-reverse;
    justify-content: flex-end;
  }

  .switch-label {
    font-size: 0.875rem;
    font-weight: 500;
    color: var(--color-gray-700);
    cursor: pointer;
    user-select: none;
  }

  /* Switch Button */
  .switch {
    position: relative;
    background: none;
    border: none;
    cursor: pointer;
    padding: 0;
    transition: all 0.2s ease-in-out;
    border-radius: 9999px;
    focus-visible: outline-none;
  }

  .switch:focus-visible {
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.3);
  }

  .switch.disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  /* Switch Track */
  .switch-track {
    position: relative;
    display: block;
    border-radius: 9999px;
    transition: all 0.2s ease-in-out;
    background-color: var(--color-gray-200);
  }

  /* Switch Thumb */
  .switch-thumb {
    position: absolute;
    top: 2px;
    left: 2px;
    background-color: var(--color-white);
    border-radius: 50%;
    transition: all 0.2s ease-in-out;
    box-shadow: 0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px 0 rgb(0 0 0 / 0.06);
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
    background-color: var(--switch-color, var(--color-blue-500));
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
  .switch-blue {
    --switch-color: var(--color-blue-500);
  }

  .switch-blue:hover:not(.disabled) .switch-track {
    background-color: var(--color-blue-600);
  }

  .switch-green {
    --switch-color: var(--color-green-500);
  }

  .switch-green:hover:not(.disabled) .switch-track {
    background-color: var(--color-green-600);
  }

  .switch-red {
    --switch-color: var(--color-red-500);
  }

  .switch-red:hover:not(.disabled) .switch-track {
    background-color: var(--color-red-600);
  }

  .switch-purple {
    --switch-color: var(--color-purple-500);
  }

  .switch-purple:hover:not(.disabled) .switch-track {
    background-color: var(--color-purple-600);
  }

  /* Hover Effects */
  .switch:hover:not(.disabled) .switch-thumb {
    box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -1px rgb(0 0 0 / 0.06);
  }

  /* Messages */
  .message {
    font-size: 0.75rem;
    margin: 0;
  }

  .error-message {
    color: var(--color-red-600);
  }

  .help-message {
    color: var(--color-gray-500);
  }
</style>