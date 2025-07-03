<!-- src/components/ui/ConfirmationModal.svelte -->
<script>
  import { createEventDispatcher } from 'svelte';
  import { fly, scale, fade } from 'svelte/transition';
  import { quintOut, backOut } from 'svelte/easing';
  
  const dispatch = createEventDispatcher();
  
  // Props - usando sintaxis de Svelte 4
  export let isOpen = false;
  export let title = 'Confirmar Acción';
  export let message = '¿Estás seguro de que quieres realizar esta acción?';
  export let confirmText = 'Confirmar';
  export let cancelText = 'Cancelar';
  export let type = 'danger'; // 'danger', 'warning', 'info'
  export let icon = '⚠️';
  export let loading = false;
  export let loadingText = 'Procesando...';
  
  // Estados
  let isVisible = false;
  
  // Efectos reactivos
  $: if (isOpen) {
    isVisible = true;
  } else {
    isVisible = false;
  }
  
  // Funciones
  function handleConfirm() {
    if (loading) return;
    dispatch('confirm');
  }
  
  function handleCancel() {
    if (loading) return;
    isVisible = false;
    setTimeout(() => {
      dispatch('cancel');
    }, 200);
  }
  
  function handleBackdropClick(event) {
    if (event.target === event.currentTarget && !loading) {
      handleCancel();
    }
  }
  
  function handleKeydown(event) {
    if (event.key === 'Escape' && !loading) {
      handleCancel();
    } else if (event.key === 'Enter' && !loading) {
      handleConfirm();
    }
  }
  
  // Configuración según tipo
  function getConfig() {
    switch (type) {
      case 'danger':
        return {
          icon: '🗑️',
          iconBg: '#ef4444',
          bgGradient: 'linear-gradient(135deg, #fef2f2, #fecaca)',
          borderColor: '#fca5a5',
          textColor: '#991b1b',
          buttonBg: '#ef4444',
          buttonHover: '#dc2626'
        };
      case 'warning':
        return {
          icon: '⚠️',
          iconBg: '#f59e0b',
          bgGradient: 'linear-gradient(135deg, #fffbeb, #fed7aa)',
          borderColor: '#fdba74',
          textColor: '#92400e',
          buttonBg: '#f59e0b',
          buttonHover: '#d97706'
        };
      case 'info':
      default:
        return {
          icon: 'ℹ️',
          iconBg: '#3b82f6',
          bgGradient: 'linear-gradient(135deg, #eff6ff, #dbeafe)',
          borderColor: '#93c5fd',
          textColor: '#1e40af',
          buttonBg: '#3b82f6',
          buttonHover: '#2563eb'
        };
    }
  }
  
  $: config = getConfig();
</script>

<svelte:window on:keydown={handleKeydown} />

{#if isVisible}
  <div 
    class="confirmation-overlay"
    on:click={handleBackdropClick}
    in:fade={{ duration: 200 }}
    out:fade={{ duration: 150 }}
  >
    <div 
      class="confirmation-modal"
      style="
        background: {config.bgGradient};
        border-color: {config.borderColor};
        color: {config.textColor};
      "
      in:fly={{ y: 30, duration: 300, easing: backOut }}
      out:fly={{ y: -30, duration: 200, easing: quintOut }}
    >
      <!-- Icono -->
      <div 
        class="confirmation-icon"
        style="background-color: {config.iconBg};"
        in:scale={{ duration: 400, delay: 100, easing: backOut }}
      >
        <span class="icon-emoji">{config.icon}</span>
      </div>
      
      <!-- Contenido -->
      <div class="confirmation-content">
        <h3 class="confirmation-title" in:fly={{ y: 15, duration: 300, delay: 200 }}>
          {title}
        </h3>
        <p class="confirmation-message" in:fly={{ y: 15, duration: 300, delay: 250 }}>
          {message}
        </p>
      </div>
      
      <!-- Acciones -->
      <div class="confirmation-actions" in:fly={{ y: 15, duration: 300, delay: 300 }}>
        <button
          class="confirmation-btn cancel-btn"
          on:click={handleCancel}
          disabled={loading}
        >
          {cancelText}
        </button>
        <button
          class="confirmation-btn confirm-btn"
          style="
            background-color: {config.buttonBg};
            color: white;
          "
          on:click={handleConfirm}
          disabled={loading}
        >
          {#if loading}
            <div class="btn-spinner"></div>
            {loadingText}
          {:else}
            {confirmText}
          {/if}
        </button>
      </div>
    </div>
  </div>
{/if}

<style>
  .confirmation-overlay {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.6);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 10000;
    padding: 1rem;
    backdrop-filter: blur(4px);
  }
  
  .confirmation-modal {
    max-width: 400px;
    width: 100%;
    border-radius: 16px;
    border: 2px solid;
    padding: 2rem;
    text-align: center;
    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15);
    position: relative;
    overflow: hidden;
  }
  
  .confirmation-icon {
    width: 60px;
    height: 60px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 0 auto 1.5rem;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  }
  
  .icon-emoji {
    font-size: 1.5rem;
  }
  
  .confirmation-content {
    margin-bottom: 2rem;
  }
  
  .confirmation-title {
    font-size: 1.25rem;
    font-weight: 700;
    margin: 0 0 0.75rem 0;
    line-height: 1.3;
  }
  
  .confirmation-message {
    font-size: 0.95rem;
    line-height: 1.5;
    margin: 0;
    opacity: 0.9;
    white-space: pre-line;
  }
  
  .confirmation-actions {
    display: flex;
    gap: 0.75rem;
    justify-content: center;
  }
  
  .confirmation-btn {
    padding: 0.75rem 1.5rem;
    border: none;
    border-radius: 8px;
    font-size: 0.95rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s ease;
    min-width: 100px;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
  }
  
  .confirmation-btn:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
  
  .cancel-btn {
    background: rgba(255, 255, 255, 0.8);
    color: #6b7280;
    border: 1px solid rgba(0, 0, 0, 0.1);
  }
  
  .cancel-btn:hover:not(:disabled) {
    background: rgba(255, 255, 255, 0.9);
    transform: translateY(-1px);
  }
  
  .confirm-btn:hover:not(:disabled) {
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
  }
  
  .btn-spinner {
    width: 16px;
    height: 16px;
    border: 2px solid transparent;
    border-top: 2px solid currentColor;
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }
  
  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }
  
  /* Responsive */
  @media (max-width: 640px) {
    .confirmation-modal {
      margin: 1rem;
      padding: 1.5rem;
    }
    
    .confirmation-actions {
      flex-direction: column;
    }
    
    .confirmation-btn {
      width: 100%;
    }
  }
</style> 