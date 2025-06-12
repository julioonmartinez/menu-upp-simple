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

  onMount(() => {
    if (autoClose) {
      startTimer();
    }
    
    return () => {
      clearTimers();
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
    isPaused = true;
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
          progressColor: '#10b981'
        };
      case 'error':
        return {
          icon: '❌',
          iconBg: '#ef4444',
          bgGradient: 'linear-gradient(135deg, #fef2f2, #fecaca)',
          borderColor: '#fca5a5',
          textColor: '#991b1b',
          progressColor: '#ef4444'
        };
      case 'info':
      default:
        return {
          icon: 'ℹ️',
          iconBg: '#3b82f6',
          bgGradient: 'linear-gradient(135deg, #eff6ff, #dbeafe)',
          borderColor: '#93c5fd',
          textColor: '#1e40af',
          progressColor: '#3b82f6'
        };
    }
  }

  $: config = getToastConfig();
</script>

{#if visible}
  <div 
    class="toast-container"
    in:fly={{ x: 400, duration: 500, easing: backOut }}
    out:fly={{ x: 400, duration: 300, easing: quintOut }}
  >
    <div 
      class="toast"
      class:success={type === 'success'}
      class:error={type === 'error'}
      class:info={type === 'info'}
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
      <!-- Icono animado -->
      <div 
        class="toast-icon"
        style="background-color: {config.iconBg};"
        in:scale={{ duration: 600, delay: 200, easing: backOut }}
      >
        <span class="icon-emoji">{config.icon}</span>
      </div>

      <!-- Contenido del mensaje -->
      <div class="toast-content">
        <p class="toast-message" in:fly={{ y: 20, duration: 400, delay: 300 }}>
          {message}
        </p>
      </div>

      <!-- Botón de cerrar -->
      <button 
        class="toast-close"
        on:click={handleClose}
        title="Cerrar notificación"
        aria-label="Cerrar notificación"
        in:scale={{ duration: 300, delay: 400 }}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </button>

      <!-- Barra de progreso -->
      {#if autoClose}
        <div 
          class="toast-progress"
          style="background-color: {config.progressColor};"
          in:fade={{ duration: 200, delay: 500 }}
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

      <!-- Efectos visuales -->
      <div class="toast-shine" in:fade={{ duration: 800, delay: 100 }}></div>
      
      <!-- Partículas decorativas para success -->
      {#if type === 'success'}
        <div class="success-particles">
          {#each Array(6) as _, i}
            <div 
              class="particle"
              style="
                animation-delay: {i * 0.1}s;
                left: {20 + i * 10}%;
                --particle-color: {config.iconBg};
              "
              in:scale={{ duration: 300, delay: 600 + i * 100 }}
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
    top: 24px;
    right: 24px;
    z-index: 9999;
    pointer-events: auto;
  }

  .toast {
    background: white;
    border: 2px solid;
    border-radius: 16px;
    padding: 20px;
    min-width: 320px;
    max-width: 480px;
    box-shadow: 
      0 20px 40px rgba(0, 0, 0, 0.15),
      0 8px 16px rgba(0, 0, 0, 0.1);
    display: flex;
    align-items: flex-start;
    gap: 16px;
    position: relative;
    overflow: hidden;
    backdrop-filter: blur(10px);
    transition: all 0.3s ease;
  }

  .toast:hover {
    transform: translateY(-4px) scale(1.02);
    box-shadow: 
      0 32px 64px rgba(0, 0, 0, 0.2),
      0 16px 32px rgba(0, 0, 0, 0.15);
  }

  .toast-icon {
    width: 48px;
    height: 48px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    position: relative;
    overflow: hidden;
    box-shadow: 0 8px 16px rgba(0, 0, 0, 0.2);
  }

  .toast-icon::before {
    content: '';
    position: absolute;
    top: -50%;
    left: -50%;
    width: 200%;
    height: 200%;
    background: linear-gradient(45deg, transparent, rgba(255, 255, 255, 0.3), transparent);
    animation: iconShine 2s linear infinite;
  }

  @keyframes iconShine {
    0% { transform: translateX(-100%) translateY(-100%) rotate(45deg); }
    100% { transform: translateX(100%) translateY(100%) rotate(45deg); }
  }

  .icon-emoji {
    font-size: 1.5rem;
    position: relative;
    z-index: 1;
    animation: iconBounce 0.6s ease-out;
  }

  @keyframes iconBounce {
    0% { transform: scale(0) rotate(-180deg); }
    50% { transform: scale(1.3) rotate(-90deg); }
    100% { transform: scale(1) rotate(0deg); }
  }

  .toast-content {
    flex: 1;
    min-width: 0;
  }

  .toast-message {
    margin: 0;
    font-size: 1rem;
    font-weight: 600;
    line-height: 1.5;
    word-wrap: break-word;
  }

  .toast-close {
    background: rgba(0, 0, 0, 0.1);
    border: none;
    border-radius: 8px;
    width: 32px;
    height: 32px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    color: currentColor;
    opacity: 0.7;
    transition: all 0.2s ease;
    flex-shrink: 0;
  }

  .toast-close:hover {
    background: rgba(0, 0, 0, 0.2);
    opacity: 1;
    transform: scale(1.1);
  }

  .toast-close:active {
    transform: scale(0.95);
  }

  .toast-progress {
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    height: 4px;
    background: rgba(0, 0, 0, 0.1);
    overflow: hidden;
  }

  .progress-bar {
    height: 100%;
    transition: width 0.05s linear;
    background: linear-gradient(90deg, 
      currentColor 0%, 
      rgba(255, 255, 255, 0.3) 50%, 
      currentColor 100%);
    background-size: 200% 100%;
    animation: progressShine 2s linear infinite;
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
      rgba(255, 255, 255, 0.4), 
      transparent);
    animation: toastShine 3s ease-in-out infinite;
  }

  @keyframes toastShine {
    0% { left: -100%; }
    50% { left: 100%; }
    100% { left: 100%; }
  }

  .success-particles {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    pointer-events: none;
    overflow: hidden;
    border-radius: 16px;
  }

  .particle {
    position: absolute;
    width: 6px;
    height: 6px;
    background: var(--particle-color);
    border-radius: 50%;
    top: 20%;
    animation: particleFloat 2s ease-out forwards;
  }

  @keyframes particleFloat {
    0% {
      transform: translateY(0) scale(1);
      opacity: 1;
    }
    100% {
      transform: translateY(-40px) scale(0);
      opacity: 0;
    }
  }

  /* Variantes de color específicas */
  .toast.success {
    animation: successPulse 0.6s ease-out;
  }

  .toast.error {
    animation: errorShake 0.6s ease-out;
  }

  .toast.info {
    animation: infoBounce 0.6s ease-out;
  }

  @keyframes successPulse {
    0% { transform: scale(0.8); }
    50% { transform: scale(1.05); }
    100% { transform: scale(1); }
  }

  @keyframes errorShake {
    0%, 100% { transform: translateX(0); }
    25% { transform: translateX(-5px); }
    75% { transform: translateX(5px); }
  }

  @keyframes infoBounce {
    0% { transform: translateY(20px) scale(0.8); }
    50% { transform: translateY(-5px) scale(1.02); }
    100% { transform: translateY(0) scale(1); }
  }

  /* Estados especiales */
  .toast:hover .toast-progress .progress-bar {
    animation-play-state: paused;
  }

  .toast:hover .icon-emoji {
    animation: iconHover 0.3s ease forwards;
  }

  @keyframes iconHover {
    0% { transform: scale(1) rotate(0deg); }
    50% { transform: scale(1.1) rotate(5deg); }
    100% { transform: scale(1.05) rotate(-2deg); }
  }

  /* Responsive Design */
  @media (max-width: 768px) {
    .toast-container {
      top: 16px;
      right: 16px;
      left: 16px;
    }

    .toast {
      min-width: auto;
      max-width: none;
      padding: 16px;
      gap: 12px;
    }

    .toast-icon {
      width: 40px;
      height: 40px;
    }

    .icon-emoji {
      font-size: 1.25rem;
    }

    .toast-message {
      font-size: 0.95rem;
    }

    .toast-close {
      width: 28px;
      height: 28px;
    }
  }

  @media (max-width: 480px) {
    .toast-container {
      top: 12px;
      right: 12px;
      left: 12px;
    }

    .toast {
      padding: 14px;
      gap: 10px;
      border-radius: 12px;
    }

    .toast-icon {
      width: 36px;
      height: 36px;
    }

    .icon-emoji {
      font-size: 1.1rem;
    }

    .toast-message {
      font-size: 0.9rem;
    }
  }

  /* Accesibilidad */
  @media (prefers-reduced-motion: reduce) {
    .toast,
    .toast-icon,
    .icon-emoji,
    .particle,
    .progress-bar,
    .toast-shine {
      animation: none;
    }

    .toast {
      transition: none;
    }
  }

  /* Modo oscuro */
  @media (prefers-color-scheme: dark) {
    .toast {
      box-shadow: 
        0 20px 40px rgba(0, 0, 0, 0.4),
        0 8px 16px rgba(0, 0, 0, 0.3);
    }

    .toast-close {
      background: rgba(255, 255, 255, 0.1);
    }

    .toast-close:hover {
      background: rgba(255, 255, 255, 0.2);
    }
  }

  /* Estados de focus para accesibilidad */
  .toast-close:focus-visible {
    outline: 2px solid currentColor;
    outline-offset: 2px;
  }
</style>