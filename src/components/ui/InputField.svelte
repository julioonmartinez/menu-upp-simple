<!-- src/components/ui/InputField.svelte -->
<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  
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
  export let step: any = undefined;
  export let maxlength: number | undefined = undefined;
  
  const dispatch = createEventDispatcher();
  
  $: inputClasses = `
    input
    ${error ? 'border border-error text-error placeholder-red-400' : success ? 'border border-success' : 'border'}
    ${disabled ? 'bg-gray text-light' : ''}
  `;

  // Manejar el evento input para actualizar el valor
  function handleInput(event: Event) {
    const target = event.target as HTMLInputElement;
    value = target.value;
    dispatch('change', { value: target.value });
  }
  
  function handleChange(event: Event) {
    const target = event.target as HTMLInputElement;
    dispatch('change', { value: target.value });
  }
  
  function handleBlur(event: Event) {
    const target = event.target as HTMLInputElement;
    dispatch('blur', { value: target.value });
  }
  
  function handleFocus(event: Event) {
    const target = event.target as HTMLInputElement;
    dispatch('focus', { value: target.value });
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
      {maxlength}
      class={inputClasses}
      on:input={handleInput}
      on:change={handleChange}
      on:blur={handleBlur}
      on:focus={handleFocus}
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