<script lang="ts">
  import { onMount } from 'svelte';
  import { fly, fade, scale } from 'svelte/transition';
  import { quintOut } from 'svelte/easing';

  // Props
  const { showShadow = false, transparent = false } = $props();

  // Estado local
  let isScrolled = $state(false);
  let isMobile = $state(false);
  let showLoginModal = $state(false);
  let favoritesCount = $state(0); // Esto se conectaría con tu store de favoritos

  // Detectar scroll y móvil
  function handleScroll() {
    if (typeof window !== 'undefined') {
      isScrolled = window.scrollY > 10;
    }
  }

  function checkMobile() {
    if (typeof window !== 'undefined') {
      isMobile = window.innerWidth < 768;
    }
  }

  onMount(() => {
    checkMobile();
    handleScroll();
    
    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', checkMobile);
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', checkMobile);
    };
  });

  // Handlers
  function handleLogin() {
    showLoginModal = true;
    // Aquí conectarías con tu sistema de autenticación
    console.log('Abrir modal de login');
  }

  function handleFavorites() {
    // Aquí navegarías a la página de favoritos o abrirías un panel
    console.log('Navegar a favoritos');
  }

  function handleHome() {
    if (typeof window !== 'undefined') {
      window.location.href = '/';
    }
  }

  function closeLoginModal() {
    showLoginModal = false;
  }
</script>

<!-- Font Awesome CDN -->
<svelte:head>
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css">
</svelte:head>

<header 
  class="header"
  class:scrolled={isScrolled || showShadow}
  class:transparent
  class:mobile={isMobile}
>
  <div class="header-container">
    <!-- Logo/Brand -->
    <button 
      class="brand-button"
      on:click={handleHome}
      aria-label="Ir al inicio"
    >
      <div class="brand-content">
        <div class="brand-icon">
          <i class="fas fa-utensils"></i>
        </div>
        <span class="brand-text">MENU<span style="color: var(--primary-color);" >UPP</span></span>
      </div>
    </button>

    <!-- Navigation Actions -->
    <nav class="nav-actions" role="navigation">
      <!-- Favorites Button -->
      <button 
        class="nav-btn favorites-btn"
        on:click={handleFavorites}
        aria-label="Ver favoritos"
        title="Mis favoritos"
      >
        <div class="btn-icon">
          <i class="fas fa-heart"></i>
          {#if favoritesCount > 0}
            <span 
              class="badge"
              in:scale={{ duration: 300, delay: 100 }}
            >
              {favoritesCount > 99 ? '99+' : favoritesCount}
            </span>
          {/if}
        </div>
        {#if !isMobile}
          <span class="btn-text">Guardados</span>
        {/if}
      </button>

      <!-- Login Button -->
      <button 
        class="nav-btn login-btn"
        on:click={handleLogin}
        aria-label="Iniciar sesión"
        title="Iniciar sesión"
      >
        <div class="btn-icon">
          <i class="fas fa-user"></i>
        </div>
        {#if !isMobile}
          <span class="btn-text">Entrar</span>
        {/if}
      </button>
    </nav>
  </div>

  <!-- Modal de Login (placeholder) -->
  {#if showLoginModal}
    <div 
      class="modal-overlay"
      on:click={closeLoginModal}
      in:fade={{ duration: 200 }}
      out:fade={{ duration: 150 }}
    >
      <div 
        class="modal-content"
        on:click|stopPropagation
        in:fly={{ y: 50, duration: 300, easing: quintOut }}
        out:fly={{ y: 30, duration: 200 }}
      >
        <div class="modal-header">
          <h3>Iniciar Sesión</h3>
          <button 
            class="modal-close"
            on:click={closeLoginModal}
            aria-label="Cerrar modal"
          >
            <i class="fas fa-times"></i>
          </button>
        </div>
        <div class="modal-body">
          <p>¡Próximamente! Sistema de autenticación en desarrollo.</p>
          <button class="btn-primary" on:click={closeLoginModal}>
            Entendido
          </button>
        </div>
      </div>
    </div>
  {/if}
</header>

<style>
  .header {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    z-index: 100;
    background: rgba(255, 255, 255, 0.95);
    backdrop-filter: blur(10px);
    border-bottom: 1px solid transparent;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    height: 60px;
    display: flex;
    align-items: center;
  }

  .header.mobile {
    height: 56px;
  }

  .header.scrolled {
    background: rgba(255, 255, 255, 0.98);
    border-bottom-color: #f1f5f9;
    box-shadow: 0 2px 20px rgba(0, 0, 0, 0.08);
  }

  .header.transparent {
    background: transparent;
    backdrop-filter: none;
  }

  .header-container {
    width: 100%;
    max-width: 1200px;
    margin: 0 auto;
    padding: 0 16px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    height: 100%;
  }

  /* Brand/Logo */
  .brand-button {
    background: none;
    border: none;
    cursor: pointer;
    padding: 8px 0;
    display: flex;
    align-items: center;
    transition: all 0.3s ease;
    border-radius: 12px;
  }

  .brand-button:hover {
    transform: translateY(-1px);
  }

  .brand-content {
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .brand-icon {
    width: 36px;
    height: 36px;
    background: linear-gradient(135deg, var(--primary-color, #ff6b35), #ff8c69);
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    font-size: 1.1rem;
    box-shadow: 0 4px 12px rgba(255, 107, 53, 0.25);
    transition: all 0.3s ease;
  }

  .header.mobile .brand-icon {
    width: 32px;
    height: 32px;
    font-size: 1rem;
    border-radius: 10px;
  }

  .brand-button:hover .brand-icon {
    transform: scale(1.05);
    box-shadow: 0 6px 16px rgba(255, 107, 53, 0.35);
  }

  .brand-text {
    font-size: 1.5rem;
    font-weight: 800;
    color: #0D1B2A;
    letter-spacing: -0.02em;
    user-select: none;
  }

  .header.mobile .brand-text {
    font-size: 1.3rem;
  }

  /* Navigation Actions */
  .nav-actions {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .nav-btn {
    background: white;
    border: 1px solid #e2e8f0;
    border-radius: 12px;
    padding: 10px 14px;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 8px;
    transition: all 0.3s ease;
    color: #64748b;
    font-weight: 600;
    font-size: 0.9rem;
    min-height: 44px;
    position: relative;
  }

  .header.mobile .nav-btn {
    padding: 10px 12px;
    border-radius: 10px;
    min-height: 40px;
  }

  .nav-btn:hover {
    background: #f8fafc;
    border-color: var(--primary-color, #ff6b35);
    color: var(--primary-color, #ff6b35);
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(255, 107, 53, 0.15);
  }

  .nav-btn:active {
    transform: translateY(0);
  }

  .btn-icon {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.1rem;
  }

  .header.mobile .btn-icon {
    font-size: 1rem;
  }

  .btn-text {
    font-size: 0.85rem;
    white-space: nowrap;
  }

  /* Badge para contador de favoritos */
  .badge {
    position: absolute;
    top: -6px;
    right: -6px;
    background: var(--primary-color, #ff6b35);
    color: white;
    border-radius: 10px;
    padding: 2px 6px;
    font-size: 0.7rem;
    font-weight: 700;
    min-width: 18px;
    height: 18px;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 2px 8px rgba(255, 107, 53, 0.3);
    border: 2px solid white;
  }

  /* Botones específicos */
  .favorites-btn:hover .btn-icon i {
    color: #ef4444;
  }

  .login-btn {
    background: linear-gradient(135deg, #0D1B2A, #1e293b);
    color: white;
    border: none;
  }

  .login-btn:hover {
    background: linear-gradient(135deg, #1e293b, #334155);
    box-shadow: 0 6px 16px rgba(13, 27, 42, 0.25);
  }

  /* Modal */
  .modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.5);
    z-index: 200;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 20px;
  }

  .modal-content {
    background: white;
    border-radius: 16px;
    max-width: 400px;
    width: 100%;
    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15);
    overflow: hidden;
  }

  .modal-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 20px;
    border-bottom: 1px solid #f1f5f9;
  }

  .modal-header h3 {
    margin: 0;
    color: #0D1B2A;
    font-size: 1.2rem;
    font-weight: 700;
  }

  .modal-close {
    background: none;
    border: none;
    color: #64748b;
    font-size: 1.2rem;
    cursor: pointer;
    padding: 4px;
    border-radius: 6px;
    transition: all 0.2s ease;
  }

  .modal-close:hover {
    background: #f1f5f9;
    color: #374151;
  }

  .modal-body {
    padding: 20px;
    text-align: center;
  }

  .modal-body p {
    margin: 0 0 20px 0;
    color: #64748b;
    line-height: 1.5;
  }

  .btn-primary {
    background: linear-gradient(135deg, var(--primary-color, #ff6b35), #ff8c69);
    color: white;
    border: none;
    padding: 12px 24px;
    border-radius: 10px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.3s ease;
  }

  .btn-primary:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(255, 107, 53, 0.3);
  }

  /* Responsive adjustments */
  @media (max-width: 480px) {
    .header-container {
      padding: 0 12px;
    }

    .nav-actions {
      gap: 6px;
    }

    .brand-text {
      font-size: 1.2rem;
    }

    .modal-content {
      margin: 20px;
      max-width: calc(100vw - 40px);
    }

    .modal-header,
    .modal-body {
      padding: 16px;
    }
  }

  /* Modo oscuro */
  @media (prefers-color-scheme: dark) {
    .header {
      background: rgba(15, 23, 42, 0.95);
    }

    .header.scrolled {
      background: rgba(15, 23, 42, 0.98);
      border-bottom-color: #334155;
    }

    .brand-text {
      color: #f8fafc;
    }

    .nav-btn {
      background: #1e293b;
      border-color: #334155;
      color: #94a3b8;
    }

    .nav-btn:hover {
      background: #334155;
      color: var(--primary-color, #ff6b35);
    }

    .modal-content {
      background: #1e293b;
    }

    .modal-header {
      border-bottom-color: #334155;
    }

    .modal-header h3 {
      color: #f8fafc;
    }

    .modal-body p {
      color: #94a3b8;
    }
  }
</style>