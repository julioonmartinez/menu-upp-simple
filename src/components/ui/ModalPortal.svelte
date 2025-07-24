<script>
  import { onMount, onDestroy } from 'svelte';
  export let show = false;
  let el;

  onMount(() => {
    if (el && show) {
      document.body.appendChild(el);
    }
  });

  $: if (el && show) {
    if (!document.body.contains(el)) {
      document.body.appendChild(el);
    }
  } else if (el && document.body.contains(el)) {
    el.remove();
  }

  onDestroy(() => {
    if (el && document.body.contains(el)) {
      el.remove();
    }
  });
</script>

{#if show}
  <div bind:this={el}>
    <slot />
  </div>
{/if} 