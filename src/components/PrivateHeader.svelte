<script lang="ts">
  // PrivateHeader.svelte - Header para páginas privadas/dashboard
  import { onMount } from 'svelte';
  import { fade, fly } from 'svelte/transition';
  import { authStore } from '../stores/authStore';
  import { onDestroy } from 'svelte';
  import Sidebar from './Sidebar.svelte';

  // Props
  export let showShadow = false;
  export let transparent = false;
  export let backUrl = '/dashboard';

  let isAuth: boolean = false;
  let unsubscribeAuth: () => void;

  // Estado del componente
  let isScrolled = false;
  let isMobile = false;
  let isSidebarOpen = false;

  // Detectar scroll
  function handleScroll() {
    if (typeof window !== 'undefined') {
      isScrolled = window.scrollY > 10;
    }
  }

  // Detectar tamaño de pantalla
  function checkMobile() {
    if (typeof window !== 'undefined') {
      isMobile = window.innerWidth < 768;
    }
  }

  // Navegación
  function navigateHome() {
    if (typeof window !== 'undefined') {
      window.location.href = '/';
    }
  }

  function handleMenuClick() {
    isSidebarOpen = true;
  }

  function handleSidebarClose() {
    isSidebarOpen = false;
  }

  function handleBackClick() {
    if (typeof window !== 'undefined') {
      if (window.history.length > 1) {
        window.history.back();
      } else {
        window.location.href = backUrl;
      }
    }
  }

  onMount(() => {
    if (typeof window !== 'undefined') {
      checkMobile();
      handleScroll();
      
      window.addEventListener('scroll', handleScroll, { passive: true });
      window.addEventListener('resize', checkMobile);
    }
    
    unsubscribeAuth = authStore.isAuthenticated.subscribe((val) => {
      isAuth = val;
    });

    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('scroll', handleScroll);
        window.removeEventListener('resize', checkMobile);
      }
      if (unsubscribeAuth) unsubscribeAuth();
    };
  });
</script>

<header 
  class="private-header"
  class:scrolled={isScrolled || showShadow}
  class:transparent
  class:mobile={isMobile}
>
  <nav class="nav-container">
    <div class="nav-content">
      <!-- Botón de navegación/back -->
      <button 
        class="nav-back-btn"
        on:click={handleBackClick}
        aria-label="Volver"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M19 12H5M12 19L5 12L12 5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </button>

      <!-- Logo/Brand centrado -->
      <button 
        class="brand-button"
        on:click={navigateHome}
        aria-label="Ir a inicio"
      >
        <div class="brand-logo">
          <span class="brand-text">Menu</span><span class="brand-accent">Upp</span>
        </div>
      </button>

      <!-- Botón de menú -->
      <button 
        class="menu-btn"
        on:click={handleMenuClick}
        aria-label="Abrir menú"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M3 12H21M3 6H21M3 18H21" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </button>
    </div>
  </nav>
</header>

<!-- Sidebar -->
<Sidebar 
  isOpen={isSidebarOpen} 
  onClose={handleSidebarClose}
/>

<style>
  .private-header {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    z-index: 1000;
    background: rgba(255, 255, 255, 0.95);
    backdrop-filter: blur(10px);
    border-bottom: 1px solid rgba(0, 0, 0, 0.1);
    transition: all 0.3s ease;
    height: var(--header-height);
  }

  .private-header.scrolled {
    background: rgba(255, 255, 255, 0.98);
    box-shadow: 0 2px 20px rgba(0, 0, 0, 0.1);
  }

  .private-header.transparent {
    background: transparent;
    border-bottom: none;
  }

  .private-header.transparent.scrolled {
    background: rgba(255, 255, 255, 0.95);
    border-bottom: 1px solid rgba(0, 0, 0, 0.1);
  }

  .nav-container {
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .nav-content {
    width: 100%;
    max-width: 1200px;
    padding: 0 1rem;
    display: flex;
    align-items: center;
    justify-content: space-between;
    position: relative;
  }

  .nav-back-btn {
    background: none;
    border: none;
    padding: 8px;
    border-radius: 8px;
    color: #374151;
    cursor: pointer;
    transition: all 0.2s ease;
    display: flex;
    align-items: center;
    justify-content: center;
    min-width: 40px;
    height: 40px;
  }

  .nav-back-btn:hover {
    background: rgba(0, 0, 0, 0.05);
    color: var(--primary-color);
  }

  .brand-button {
    background: none;
    border: none;
    padding: 8px 16px;
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.2s ease;
    position: absolute;
    left: 50%;
    transform: translateX(-50%);
  }

  .brand-button:hover {
    background: rgba(0, 0, 0, 0.05);
  }

  .brand-logo {
    display: flex;
    align-items: center;
    font-weight: 700;
    font-size: 1.25rem;
    letter-spacing: -0.025em;
  }

  .brand-text {
    color: #374151;
  }

  .brand-accent {
    color: var(--primary-color);
  }

  .menu-btn {
    background: none;
    border: none;
    padding: 8px;
    border-radius: 8px;
    color: #374151;
    cursor: pointer;
    transition: all 0.2s ease;
    display: flex;
    align-items: center;
    justify-content: center;
    min-width: 40px;
    height: 40px;
  }

  .menu-btn:hover {
    background: rgba(0, 0, 0, 0.05);
    color: var(--primary-color);
  }

  /* Mobile styles */
  .private-header.mobile {
    height: var(--header-height-mobile);
  }

  .private-header.mobile .nav-content {
    padding: 0 0.75rem;
  }

  .private-header.mobile .brand-button {
    padding: 6px 12px;
  }

  .private-header.mobile .brand-logo {
    font-size: 1.125rem;
  }

  /* Dark mode support */
  @media (prefers-color-scheme: dark) {
    .private-header {
      background: rgba(15, 23, 42, 0.95);
      border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    }

    .private-header.scrolled {
      background: rgba(15, 23, 42, 0.98);
    }

    .private-header.transparent {
      background: transparent;
      border-bottom: none;
    }

    .private-header.transparent.scrolled {
      background: rgba(15, 23, 42, 0.95);
      border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    }

    .nav-back-btn,
    .menu-btn {
      color: #e5e7eb;
    }

    .nav-back-btn:hover,
    .menu-btn:hover {
      background: rgba(255, 255, 255, 0.1);
    }

    .brand-text {
      color: #e5e7eb;
    }

    .brand-button:hover {
      background: rgba(255, 255, 255, 0.1);
    }
  }

  /* Focus styles for accessibility */
  .nav-back-btn:focus-visible,
  .brand-button:focus-visible,
  .menu-btn:focus-visible {
    outline: 2px solid var(--primary-color);
    outline-offset: 2px;
  }
</style> 