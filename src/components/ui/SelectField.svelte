<!-- src/components/ui/SelectField.svelte -->
<script>
  import { createEventDispatcher } from 'svelte';
  
  export let label = '';
  export let id = '';
  export let value = '';
  export let options = [];
  export let placeholder = 'Seleccionar...';
  export let required = false;
  export let disabled = false;
  export let help = '';
  export let error = '';
  export let success = '';
  export let loading = false;
  
  const dispatch = createEventDispatcher();
  
  $: selectClasses = `
    input
    ${error ? 'border border-error text-error' : success ? 'border border-success' : 'border'}
    ${disabled ? 'bg-gray text-light' : ''}
  `;

  // Manejar el evento change para actualizar el valor
  function handleChange(event) {
    value = event.target.value;
    dispatch('change', { value });
  }
</script>

<div class="space-y-1">
  {#if label}
    <label for={id} class="block text-sm font-medium text-primary">
      {label}
      {#if required}
        <span class="text-error">*</span>
      {/if}
    </label>
  {/if}
  
  <div class="relative">
    <select
      {id}
      {value}
      {required}
      {disabled}
      class={selectClasses}
      on:change={handleChange}
      on:blur
      on:focus
    >
      {#if placeholder}
        <option value="" disabled={required}>{placeholder}</option>
      {/if}
      {#each options as option}
        {#if typeof option === 'object' && option.value !== undefined}
          <option value={option.value}>{option.label}</option>
        {:else}
          <option value={option}>{option}</option>
        {/if}
      {/each}
    </select>
    
    {#if loading}
      <div class="absolute inset-y-0 right-0 pr-3 flex items-center">
        <span class="spinner"></span>
      </div>
    {/if}
  </div>
  
  {#if error}
    <p class="text-sm text-error">{error}</p>
  {:else if success}
    <p class="text-sm text-success">{success}</p>
  {:else if help}
    <p class="text-sm text-muted">{help}</p>
  {/if}
</div>

<style>
/* Spinner puro CSS */
.spinner {
  display: inline-block;
  width: 1rem;
  height: 1rem;
  border: 2px solid var(--primary-color);
  border-bottom-color: transparent;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}
@keyframes spin {
  to { transform: rotate(360deg); }
}
</style> 