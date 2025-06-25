<!-- src/components/ui/InputField.svelte -->
<script>
  export let label = '';
  export let id = '';
  export let type = 'text';
  export let value = '';
  export let placeholder = '';
  export let required = false;
  export let disabled = false;
  export let help = '';
  export let error = '';
  export let success = '';
  export let loading = false;
  export let step = undefined;
  
  $: inputClasses = `
    input
    ${error ? 'border border-error text-error placeholder-red-400' : success ? 'border border-success' : 'border'}
    ${disabled ? 'bg-gray text-light' : ''}
  `;

  // Manejar el evento input para actualizar el valor
  function handleInput(event) {
    value = event.target.value;
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
    <input
      {id}
      {type}
      {value}
      {placeholder}
      {required}
      {disabled}
      {step}
      class={inputClasses}
      on:input={handleInput}
      on:change
      on:blur
      on:focus
    />
    
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