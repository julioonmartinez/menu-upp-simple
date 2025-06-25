<!-- src/components/ui/LoadingSpinner.svelte -->
<script>
  export let size = 'md';
  
  $: spinnerClasses = `
    animate-spin rounded-full border-b-2 border-blue-600
    ${size === 'sm' ? 'h-4 w-4' : size === 'lg' ? 'h-8 w-8' : 'h-6 w-6'}
  `;
</script>

<div class={spinnerClasses}></div>

