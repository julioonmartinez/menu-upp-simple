<script lang="ts">
  import { createEventDispatcher, onMount } from 'svelte';
  import { fly, scale, fade } from 'svelte/transition';
  import { quintOut, backOut } from 'svelte/easing';

  // Importar los estilos
  import './Toast.css';

  // Props
  export let message: string;
  export let type: 'success' | 'error' | 'info' = 'info';
  export let duration: number = 4000;
  export let autoClose: boolean = true;

  // Dispatcher
  const dispatch = createEventDispatcher<{
    close: void
  }>();

  // Estado local
  let visible = true;
  let progress = 100;
  let isPaused = false;
  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  let intervalId: ReturnType<typeof setInterval> | null = null;
  let isMobile = false;

  // Detectar móvil
  function checkMobile() {
    if (typeof window !== 'undefined') {
      isMobile = window.innerWidth < 768;
    }
  }

  onMount(() => {
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    if (autoClose) {
      startTimer();
    }
    
    return () => {
      clearTimers();
      window.removeEventListener('resize', checkMobile);
    };
  });

  function startTimer() {
    clearTimers();
    
    if (!autoClose) return;
    
    const startTime = Date.now();
    
    intervalId = setInterval(() => {
      if (!isPaused) {
        const elapsed = Date.now() - startTime;
        const remaining = Math.max(0, duration - elapsed);
        progress = (remaining / duration) * 100;
        
        if (remaining <= 0) {
          handleClose();
        }
      }
    }, 50);
  }

  function clearTimers() {
    if (timeoutId) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }
    if (intervalId) {
      clearInterval(intervalId);
      intervalId = null;
    }
  }

  function handleClose() {
    visible = false;
    clearTimers();
    
    // Delay para permitir la animación de salida
    setTimeout(() => {
      dispatch('close');
    }, 300);
  }

  function handleMouseEnter() {
    if (!isMobile) {
      isPaused = true;
    }
  }

  function handleMouseLeave() {
    isPaused = false;
  }

  function getToastConfig() {
    switch (type) {
      case 'success':
        return {
          iconClass: 'fas fa-check-circle',
          iconBg: '#10b981',
          bgGradient: 'linear-gradient(135deg, #ecfdf5, #d1fae5)',
          borderColor: '#a7f3d0',
          textColor: '#065f46',
          progressColor: '#10b981',
          ariaLabel: 'Éxito'
        };
      case 'error':
        return {
          iconClass: 'fas fa-times-circle',
          iconBg: '#ef4444',
          bgGradient: 'linear-gradient(135deg, #fef2f2, #fecaca)',
          borderColor: '#fca5a5',
          textColor: '#991b1b',
          progressColor: '#ef4444',
          ariaLabel: 'Error'
        };
      case 'info':
      default:
        return {
          iconClass: 'fas fa-info-circle',
          iconBg: '#3b82f6',
          bgGradient: 'linear-gradient(135deg, #eff6ff, #dbeafe)',
          borderColor: '#93c5fd',
          textColor: '#1e40af',
          progressColor: '#3b82f6',
          ariaLabel: 'Información'
        };
    }
  }

  $: config = getToastConfig();
</script>

{#if visible}
  <div 
    class="toast-container"
    class:mobile={isMobile}
    in:fly={{ x: isMobile ? 0 : 300, y: isMobile ? -50 : 0, duration: 400, easing: backOut }}
    out:fly={{ x: isMobile ? 0 : 300, y: isMobile ? -50 : 0, duration: 250, easing: quintOut }}
  >
    <div 
      class="toast"
      class:success={type === 'success'}
      class:error={type === 'error'}
      class:info={type === 'info'}
      class:mobile={isMobile}
      style="
        background: {config.bgGradient};
        border-color: {config.borderColor};
        color: {config.textColor};
      "
      on:mouseenter={handleMouseEnter}
      on:mouseleave={handleMouseLeave}
      role="alert"
      aria-live="polite"
    >
      <!-- Icono compacto -->
      <div 
        class="toast-icon"
        class:mobile={isMobile}
        style="background-color: {config.iconBg};"
        in:scale={{ duration: 500, delay: 150, easing: backOut }}
        aria-label={config.ariaLabel}
        title={config.ariaLabel}
      >
        <i class={config.iconClass} aria-hidden="true"></i>
      </div>

      <!-- Contenido del mensaje compacto -->
      <div class="toast-content" class:mobile={isMobile}>
        <p class="toast-message" class:mobile={isMobile} in:fly={{ y: 15, duration: 300, delay: 200 }}>
          {message}
        </p>
      </div>

      <!-- Botón de cerrar compacto -->
      <button 
        class="toast-close"
        class:mobile={isMobile}
        on:click={handleClose}
        title="Cerrar"
        aria-label="Cerrar notificación"
        in:scale={{ duration: 250, delay: 300 }}
      >
        <svg width={isMobile ? "14" : "16"} height={isMobile ? "14" : "16"} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </button>

      <!-- Barra de progreso compacta -->
      {#if autoClose}
        <div 
          class="toast-progress"
          class:mobile={isMobile}
          style="background-color: {config.progressColor};"
          in:fade={{ duration: 150, delay: 400 }}
        >
          <div 
            class="progress-bar"
            style="
              width: {progress}%;
              background-color: {config.progressColor};
            "
          ></div>
        </div>
      {/if}

      <!-- Efectos visuales sutiles -->
      <div class="toast-shine" in:fade={{ duration: 600, delay: 100 }}></div>
      
      <!-- Micro-animación para success (solo desktop) -->
      {#if type === 'success' && !isMobile}
        <div class="success-sparkles">
          {#each Array(4) as _, i}
            <div 
              class="sparkle"
              style="
                animation-delay: {i * 0.15}s;
                left: {20 + i * 15}%;
                --sparkle-color: {config.iconBg};
              "
              in:scale={{ duration: 200, delay: 500 + i * 75 }}
            ></div>
          {/each}
        </div>
      {/if}
    </div>
  </div>
{/if}