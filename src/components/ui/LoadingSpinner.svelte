<!-- src/components/ui/LoadingSpinner.svelte -->
<script>
  export let size = 'md';
  export let message = '';

  $: spinnerSize = size === 'sm' ? 40 : size === 'lg' ? 56 : 48;
  $: spinnerClass = `spinner${size === 'sm' ? ' spinner-sm' : size === 'lg' ? ' spinner-lg' : ''}`;
</script>

<div class="flex flex-col items-center justify-center">
  <div class={spinnerClass} aria-label="Cargando">
    <svg class="spinner-svg" viewBox="0 0 50 50" width={spinnerSize} height={spinnerSize}>
      <circle class="spinner-bg" cx="25" cy="25" r="20" fill="none" stroke-width="6" />
      <circle class="spinner-fg" cx="25" cy="25" r="20" fill="none" stroke-width="6" />
      <defs>
        <linearGradient id="spinner-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stop-color="var(--primary, #4f46e5)" />
          <stop offset="100%" stop-color="var(--primary-light, #6366f1)" />
        </linearGradient>
      </defs>
    </svg>
  </div>
  {#if message}
    <span class="text-primary font-semibold text-lg mt-xs">{message}</span>
  {/if}
</div>

<style>
.spinner {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 48px;
  height: 48px;
  margin-bottom: 1rem;
  position: relative;
  z-index: 2;
}
.spinner-sm {
  width: 40px;
  height: 40px;
}
.spinner-lg {
  width: 56px;
  height: 56px;
}
.spinner-svg {
  width: 100%;
  height: 100%;
  animation: spinner-rotate 1s linear infinite;
}
.spinner-bg {
  stroke: var(--bg-accent);
  opacity: 0.3;
}
.spinner-fg {
  stroke: url(#spinner-gradient);
  stroke-dasharray: 90 150;
  stroke-dashoffset: 0;
  stroke-linecap: round;
  animation: spinner-dash 1.2s ease-in-out infinite;
}
@keyframes spinner-rotate {
  100% { transform: rotate(360deg); }
}
@keyframes spinner-dash {
  0% { stroke-dasharray: 1 150; stroke-dashoffset: 0; }
  50% { stroke-dasharray: 90 150; stroke-dashoffset: -35; }
  100% { stroke-dasharray: 90 150; stroke-dashoffset: -124; }
}
@media (max-width: 480px) {
  .spinner { width: 40px; height: 40px; }
  .spinner-svg { width: 40px; height: 40px; }
}
</style>

