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

<div class="space-y-1">
  {#if label}
    <label for={id} class="block text-sm font-medium text-gray-700">
      {label}
      {#if required}
        <span class="text-red-500">*</span>
      {/if}
    </label>
  {/if}
  
  <textarea
    {id}
    {value}
    {placeholder}
    {required}
    {disabled}
    {rows}
    class={textareaClasses}
    on:input={handleInput}
    on:input
    on:change
    on:blur
    on:focus
  ></textarea>
  
  {#if error}
    <p class="text-sm text-red-600">{error}</p>
  {:else if help}
    <p class="text-sm text-gray-500">{help}</p>
  {/if}
</div>