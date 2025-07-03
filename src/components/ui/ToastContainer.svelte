<!-- src/components/ui/ToastContainer.svelte -->
<script>
  import { toastStore } from '../../stores/toastStore.ts';
  import Toast from '../Toast.svelte';
  
  // Obtener toasts del store
  $: toasts = $toastStore.toasts;
  
  function handleToastClose(toastId) {
    toastStore.removeToast(toastId);
  }
</script>

<!-- Contenedor de toasts -->
<div class="toast-container-wrapper">
  {#each toasts as toast (toast.id)}
    <Toast
      message={toast.message}
      type={toast.type}
      duration={toast.duration}
      autoClose={toast.autoClose}
      on:close={() => handleToastClose(toast.id)}
    />
  {/each}
</div>

<style>
  .toast-container-wrapper {
    position: fixed;
    top: 1rem;
    right: 1rem;
    z-index: 10000;
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
    max-width: 400px;
    width: 100%;
    pointer-events: none;
  }
  
  /* En móvil, centrar en la parte superior */
  @media (max-width: 768px) {
    .toast-container-wrapper {
      top: 1rem;
      left: 1rem;
      right: 1rem;
      max-width: none;
    }
  }
</style> 