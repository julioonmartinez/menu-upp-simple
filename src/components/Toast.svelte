<script lang="ts">
  import { createEventDispatcher, onMount } from 'svelte';
  import { fly, scale, fade } from 'svelte/transition';
  import { quintOut, backOut } from 'svelte/easing';

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
          icon: '✅',
          iconBg: '#10b981',
          bgGradient: 'linear-gradient(135deg, #ecfdf5, #d1fae5)',
          borderColor: '#a7f3d0',
          textColor: '#065f46',
          progressColor: '#10b981',
          emoji: '🎉'
        };
      case 'error':
        return {
          icon: '❌',
          iconBg: '#ef4444',
          bgGradient: 'linear-gradient(135deg, #fef2f2, #fecaca)',
          borderColor: '#fca5a5',
          textColor: '#991b1b',
          progressColor: '#ef4444',
          emoji: '⚠️'
        };
      case 'info':
      default:
        return {
          icon: 'ℹ️',
          iconBg: '#3b82f6',
          bgGradient: 'linear-gradient(135deg, #eff6ff, #dbeafe)',
          borderColor: '#93c5fd',
          textColor: '#1e40af',
          progressColor: '#3b82f6',
          emoji: '💡'
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
      >
        <span class="icon-emoji">{isMobile ? config.emoji : config.icon}</span>
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

<style>
  .toast-container {
    position: fixed;
    top: 20px; /* Reducido de 24px */
    right: 20px;
    z-index: 9999;
    pointer-events: auto;
  }

  .toast-container.mobile {
    top: 12px;
    right: 12px;
    left: 12px;
  }

  .toast {
    background: white;
    border: 1px solid; /* Reducido de 2px */
    border-radius: 12px; /* Reducido de 16px */
    padding: 14px; /* Reducido de 20px */
    min-width: 280px; /* Reducido de 320px */
    max-width: 420px; /* Reducido de 480px */
    box-shadow: 
      0 10px 25px rgba(0, 0, 0, 0.12), /* Reducido de 20px 40px */
      0 4px 12px rgba(0, 0, 0, 0.08); /* Reducido de 8px 16px */
    display: flex;
    align-items: flex-start;
    gap: 10px; /* Reducido de 16px */
    position: relative;
    overflow: hidden;
    backdrop-filter: blur(8px); /* Reducido de 10px */
    transition: all 0.3s ease;
  }

  .toast.mobile {
    min-width: auto;
    max-width: none;
    padding: 12px;
    border-radius: 10px;
    gap: 8px;
  }

  .toast:hover {
    transform: translateY(-2px) scale(1.01); /* Reducido de -4px y 1.02 */
    box-shadow: 
      0 16px 32px rgba(0, 0, 0, 0.15), /* Reducido de 32px 64px */
      0 8px 20px rgba(0, 0, 0, 0.12); /* Reducido de 16px 32px */
  }

  .toast.mobile:hover {
    transform: none; /* Sin hover en móvil */
  }

  .toast-icon {
    width: 36px; /* Reducido de 48px */
    height: 36px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    position: relative;
    overflow: hidden;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15); /* Reducido de 8px 16px */
  }

  .toast-icon.mobile {
    width: 28px; /* Reducido para móvil */
    height: 28px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  }

  .toast-icon::before {
    content: '';
    position: absolute;
    top: -50%;
    left: -50%;
    width: 200%;
    height: 200%;
    background: linear-gradient(45deg, transparent, rgba(255, 255, 255, 0.2), transparent);
    animation: iconShine 2.5s linear infinite; /* Ralentizado */
  }

  @keyframes iconShine {
    0% { transform: translateX(-100%) translateY(-100%) rotate(45deg); }
    100% { transform: translateX(100%) translateY(100%) rotate(45deg); }
  }

  .icon-emoji {
    font-size: 1.25rem; /* Reducido de 1.5rem */
    position: relative;
    z-index: 1;
    animation: iconBounce 0.5s ease-out; /* Reducido de 0.6s */
  }

  .toast-icon.mobile .icon-emoji {
    font-size: 1rem; /* Más pequeño en móvil */
  }

  @keyframes iconBounce {
    0% { transform: scale(0) rotate(-90deg); }
    50% { transform: scale(1.2) rotate(-45deg); }
    100% { transform: scale(1) rotate(0deg); }
  }

  .toast-content {
    flex: 1;
    min-width: 0;
  }

  .toast-content.mobile {
    /* Ajustes específicos para móvil si es necesario */
  }

  .toast-message {
    margin: 0;
    font-size: 0.9rem; /* Reducido de 1rem */
    font-weight: 600;
    line-height: 1.4; /* Reducido de 1.5 */
    word-wrap: break-word;
  }

  .toast-message.mobile {
    font-size: 0.85rem;
    line-height: 1.3;
  }

  .toast-close {
    background: rgba(0, 0, 0, 0.08); /* Más transparente */
    border: none;
    border-radius: 6px; /* Reducido de 8px */
    width: 24px; /* Reducido de 32px */
    height: 24px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    color: currentColor;
    opacity: 0.7;
    transition: all 0.2s ease;
    flex-shrink: 0;
  }

  .toast-close.mobile {
    width: 20px;
    height: 20px;
    border-radius: 4px;
  }

  .toast-close:hover {
    background: rgba(0, 0, 0, 0.15); /* Reducido de 0.2 */
    opacity: 1;
    transform: scale(1.05); /* Reducido de 1.1 */
  }

  .toast-close:active {
    transform: scale(0.95);
  }

  .toast-progress {
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    height: 3px; /* Reducido de 4px */
    background: rgba(0, 0, 0, 0.08); /* Más transparente */
    overflow: hidden;
  }

  .toast-progress.mobile {
    height: 2px; /* Aún más delgado en móvil */
  }

  .progress-bar {
    height: 100%;
    transition: width 0.05s linear;
    background: linear-gradient(90deg, 
      currentColor 0%, 
      rgba(255, 255, 255, 0.2) 50%, /* Reducido de 0.3 */
      currentColor 100%);
    background-size: 200% 100%;
    animation: progressShine 2.5s linear infinite; /* Ralentizado */
  }

  @keyframes progressShine {
    0% { background-position: -200% 0; }
    100% { background-position: 200% 0; }
  }

  .toast-shine {
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(90deg, 
      transparent, 
      rgba(255, 255, 255, 0.2), /* Reducido de 0.4 */
      transparent);
    animation: toastShine 4s ease-in-out infinite; /* Ralentizado */
  }

  @keyframes toastShine {
    0% { left: -100%; }
    50% { left: 100%; }
    100% { left: 100%; }
  }

  .success-sparkles {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    pointer-events: none;
    overflow: hidden;
    border-radius: 12px;
  }

  .sparkle {
    position: absolute;
    width: 4px; /* Reducido de 6px */
    height: 4px;
    background: var(--sparkle-color);
    border-radius: 50%;
    top: 25%; /* Ajustado */
    animation: sparkleFloat 1.5s ease-out forwards; /* Reducido de 2s */
  }

  @keyframes sparkleFloat {
    0% {
      transform: translateY(0) scale(1);
      opacity: 1;
    }
    100% {
      transform: translateY(-25px) scale(0); /* Reducido de -40px */
      opacity: 0;
    }
  }

  /* Variantes de color más sutiles */
  .toast.success {
    animation: successPulse 0.5s ease-out; /* Reducido de 0.6s */
  }

  .toast.error {
    animation: errorShake 0.5s ease-out;
  }

  .toast.info {
    animation: infoBounce 0.5s ease-out;
  }

  @keyframes successPulse {
    0% { transform: scale(0.9); }
    50% { transform: scale(1.02); }
    100% { transform: scale(1); }
  }

  @keyframes errorShake {
    0%, 100% { transform: translateX(0); }
    25% { transform: translateX(-3px); } /* Reducido de -5px */
    75% { transform: translateX(3px); }
  }

  @keyframes infoBounce {
    0% { transform: translateY(15px) scale(0.9); } /* Reducido de 20px y 0.8 */
    50% { transform: translateY(-3px) scale(1.01); } /* Reducido de -5px y 1.02 */
    100% { transform: translateY(0) scale(1); }
  }

  /* Estados especiales */
  .toast:hover .toast-progress .progress-bar {
    animation-play-state: paused;
  }

  .toast:hover .icon-emoji {
    animation: iconHover 0.25s ease forwards; /* Reducido de 0.3s */
  }

  @keyframes iconHover {
    0% { transform: scale(1) rotate(0deg); }
    50% { transform: scale(1.05) rotate(3deg); } /* Reducido de 1.1 y 5deg */
    100% { transform: scale(1.02) rotate(-1deg); } /* Reducido de 1.05 y -2deg */
  }

  /* Responsive mejorado */
  @media (max-width: 480px) {
    .toast-container {
      top: 8px;
      right: 8px;
      left: 8px;
    }

    .toast {
      padding: 10px;
      border-radius: 8px;
      gap: 6px;
    }

    .toast-icon {
      width: 24px;
      height: 24px;
    }

    .icon-emoji {
      font-size: 0.9rem;
    }

    .toast-message {
      font-size: 0.8rem;
      line-height: 1.3;
    }

    .toast-close {
      width: 18px;
      height: 18px;
    }

    .toast-progress {
      height: 2px;
    }
  }

  /* Accesibilidad */
  @media (prefers-reduced-motion: reduce) {
    .toast,
    .toast-icon,
    .icon-emoji,
    .sparkle,
    .progress-bar,
    .toast-shine {
      animation: none;
    }

    .toast {
      transition: none;
    }

    .toast:hover {
      transform: none;
    }
  }

  /* Modo oscuro */
  @media (prefers-color-scheme: dark) {
    .toast {
      box-shadow: 
        0 10px 25px rgba(0, 0, 0, 0.3),
        0 4px 12px rgba(0, 0, 0, 0.2);
    }

    .toast-close {
      background: rgba(255, 255, 255, 0.08);
    }

    .toast-close:hover {
      background: rgba(255, 255, 255, 0.15);
    }

    .toast-progress {
      background: rgba(255, 255, 255, 0.08);
    }
  }

  /* Estados de focus mejorados */
  .toast-close:focus-visible {
    outline: 2px solid currentColor;
    outline-offset: 1px; /* Reducido de 2px */
  }

  /* Animaciones de entrada/salida específicas para móvil */
  @media (max-width: 768px) {
    .toast-container {
      /* Las animaciones de entrada ya están configuradas en el script */
    }
  }
</style>