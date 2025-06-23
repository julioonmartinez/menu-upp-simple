<script lang="ts">
  // Header.svelte - Navegación principal
  import { onMount } from 'svelte';
  import { fade, fly } from 'svelte/transition';
  import { isAuthenticated } from '../stores/authStore';
    import { authStore } from '../stores/authStore';
  // Props
  export let showShadow = false;
  export let transparent = false;

  console.log('auth', authStore.getIsAuthenticated)

  // Estado del componente
  let isScrolled = false;
  let isMobile = false;
  let showMobileMenu = false;
  let favoritesCount = 0;

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

  // Alternar menú móvil
  function toggleMobileMenu() {
    showMobileMenu = !showMobileMenu;
  }

  // Navegación
  function navigateHome() {
    if (typeof window !== 'undefined') {
      window.location.href = '/';
    }
  }

  function navigateSearch() {
    if (typeof window !== 'undefined') {
      window.location.href = '/buscar';
    }
  }

  onMount(() => {
    checkMobile();
    handleScroll();
    
    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', checkMobile);
    
    // Escuchar actualizaciones del contador de favoritos
    window.addEventListener('favoritesCountUpdate', (e) => {
      const customEvent = e as CustomEvent<{ count: number }>;
      favoritesCount = customEvent.detail?.count || 0;
    });

    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', checkMobile);
    };
  });
</script>

<header 
  class="main-header"
  class:scrolled={isScrolled || showShadow}
  class:transparent
  class:mobile={isMobile}
>
  <nav class="nav-container">
    <div class="nav-content">
      <!-- Logo/Brand -->
      <button 
        class="brand-button"
        onclick={navigateHome}
        aria-label="Ir a inicio"
      >
        <div class="brand-logo">
          <span class="brand-text">Menu</span><span class="brand-accent">Upp</span>
        </div>
      </button>

      <!-- Navigation Links - Desktop -->
      <!-- {#if !isMobile}
        <div class="nav-links">
          <button 
            class="nav-link"
            onclick={navigateHome}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M3 9L12 2L21 9V20C21 20.5523 20.4477 21 20 21H4C3.44772 21 3 20.5523 3 20V9Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              <path d="M9 22V12H15V22" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
            <span>Inicio</span>
          </button>
          
          <button 
            class="nav-link"
            onclick={navigateSearch}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M21 21L16.514 16.506L21 21ZM19 10.5C19 15.194 15.194 19 10.5 19C5.806 19 2 15.194 2 10.5C2 5.806 5.806 2 10.5 2C15.194 2 19 5.806 19 10.5Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
            <span>Buscar</span>
          </button>
        </div>
      {/if} -->

      <!-- Actions -->
      <div class="nav-actions">

        <!-- <button 
          class="action-btn favorites-btn"
          title="Favoritos"
          aria-label="Login"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M20 21V19C20 17.9391 19.5786 16.9217 18.8284 16.1716C18.0783 15.4214 17.0609 15 16 15H8C6.93913 15 5.92172 15.4214 5.17157 16.1716C4.42143 16.9217 4 17.9391 4 19V21" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
  <circle cx="12" cy="7" r="4" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
</svg>
         
        </button> -->
        <!-- Favorites -->
        {#if isAuthenticated}
         <a class="btn btn-ghost btn-sm "  href="/dashboard">Mi cuenta</a>
        {:else}
         <a class="btn btn-ghost btn-sm" href="/login">Crea una cuenta</a>
        {/if}
        <a
          class="action-btn favorites-btn"
          title="Favoritos"
          aria-label="Ver favoritos"
          href="/favorites"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M20.84 4.61C20.3292 4.099 19.7228 3.69364 19.0554 3.41708C18.3879 3.14052 17.6725 2.99817 16.95 2.99817C16.2275 2.99817 15.5121 3.14052 14.8446 3.41708C14.1772 3.69364 13.5708 4.099 13.06 4.61L12 5.67L10.94 4.61C9.9083 3.5783 8.50903 2.9987 7.05 2.9987C5.59096 2.9987 4.19169 3.5783 3.16 4.61C2.1283 5.6417 1.5487 7.04097 1.5487 8.5C1.5487 9.95903 2.1283 11.3583 3.16 12.39L4.22 13.45L12 21.23L19.78 13.45L20.84 12.39C21.351 11.8792 21.7563 11.2728 22.0329 10.6053C22.3095 9.93789 22.4518 9.22248 22.4518 8.5C22.4518 7.77752 22.3095 7.06211 22.0329 6.39467C21.7563 5.72723 21.351 5.1208 20.84 4.61V4.61Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
          {#if favoritesCount > 0}
            <span class="badge" in:fade={{ duration: 200 }}>{favoritesCount}</span>
          {/if}
        </a>

        <!-- Mobile Menu Toggle -->
        <!-- {#if isMobile}
          <button 
            class="mobile-menu-btn"
            onclick={toggleMobileMenu}
            aria-label="Abrir menú"
          >
            <div class="hamburger" class:active={showMobileMenu}>
              <span></span>
              <span></span>
              <span></span>
            </div>
          </button>
        {/if} -->
      </div>
    </div>

    <!-- Mobile Menu -->
    {#if isMobile && showMobileMenu}
      <div 
        class="mobile-menu"
        in:fly={{ y: -10, duration: 300 }}
        out:fly={{ y: -10, duration: 200 }}
      >
        <button 
          class="mobile-nav-link"
          onclick={() => { navigateHome(); toggleMobileMenu(); }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M3 9L12 2L21 9V20C21 20.5523 20.4477 21 20 21H4C3.44772 21 3 20.5523 3 20V9Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M9 22V12H15V22" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
          <span>Inicio</span>
        </button>
        
        <button 
          class="mobile-nav-link"
          onclick={() => { navigateSearch(); toggleMobileMenu(); }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M21 21L16.514 16.506L21 21ZM19 10.5C19 15.194 15.194 19 10.5 19C5.806 19 2 15.194 2 10.5C2 5.806 5.806 2 10.5 2C15.194 2 19 5.806 19 10.5Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
          <span>Buscar</span>
        </button>
      </div>
    {/if}
  </nav>
</header>

<style>
  /* Header Base */
  .main-header {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    z-index: 1000;
    background: rgba(255, 255, 255, 0.95);
    backdrop-filter: blur(10px);
    border-bottom: 1px solid transparent;
    transition: all 0.3s ease;
    height: 60px;
  }

  .main-header.transparent {
    background: rgba(255, 255, 255, 0.8);
  }

  .main-header.scrolled {
    background: rgba(255, 255, 255, 0.98);
    /* border-bottom-color: #e2e8f0; */
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  }

  .main-header.mobile {
    height: 56px;
  }

  /* Navigation Container */
  .nav-container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 0 1rem;
    height: 100%;
  }

  .nav-content {
    display: flex;
    align-items: center;
    justify-content: space-between;
    height: 100%;
  }

  /* Brand */
  .brand-button {
    background: none;
    border: none;
    cursor: pointer;
    padding: 0.5rem;
    transition: all 0.3s ease;
    border-radius: 8px;
  }

  .brand-button:hover {
    background: rgba(255, 107, 53, 0.1);
  }

  .brand-logo {
    display: flex;
    align-items: center;
    font-size: 1.5rem;
    font-weight: 800;
  }

  .brand-text {
    color: var(--text-primary);
  }

  .brand-accent {
    color: var(--primary-color) !important;
  }

  /* Navigation Links */
  .nav-links {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .nav-link {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.75rem 1rem;
    border: none;
    background: none;
    color: #64748b;
    font-weight: 600;
    font-size: 0.9rem;
    border-radius: 10px;
    cursor: pointer;
    transition: all 0.3s ease;
    text-decoration: none;
  }

  .nav-link:hover {
    background: #f8fafc;
    color: var(--primary-color, #ff6b35);
    transform: translateY(-1px);
  }

  /* Actions */
  .nav-actions {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .action-btn {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 44px;
    height: 44px;
    border: none;
    background: none;
    color: #64748b;
    border-radius: 10px;
    cursor: pointer;
    transition: all 0.3s ease;
  }

  .action-btn:hover {
    background: #f8fafc;
    color: var(--primary-color, #ff6b35);
    transform: translateY(-1px);
  }

  /* Badge */
  .badge {
    position: absolute;
    top: -2px;
    right: -2px;
    background: var(--primary-color, #ff6b35);
    color: white;
    border-radius: 50%;
    width: 18px;
    height: 18px;
    font-size: 0.7rem;
    font-weight: 700;
    display: flex;
    align-items: center;
    justify-content: center;
    border: 2px solid white;
  }

  /* Mobile Menu Button */
  .mobile-menu-btn {
    width: 44px;
    height: 44px;
    border: none;
    background: none;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 8px;
    transition: all 0.3s ease;
  }

  .mobile-menu-btn:hover {
    background: #f8fafc;
  }

  /* Hamburger */
  .hamburger {
    width: 20px;
    height: 16px;
    position: relative;
    transform: rotate(0deg);
    transition: 0.3s ease-in-out;
  }

  .hamburger span {
    display: block;
    position: absolute;
    height: 2px;
    width: 100%;
    background: #64748b;
    border-radius: 2px;
    opacity: 1;
    left: 0;
    transform: rotate(0deg);
    transition: 0.25s ease-in-out;
  }

  .hamburger span:nth-child(1) {
    top: 0px;
  }

  .hamburger span:nth-child(2) {
    top: 7px;
  }

  .hamburger span:nth-child(3) {
    top: 14px;
  }

  .hamburger.active span:nth-child(1) {
    top: 7px;
    transform: rotate(135deg);
  }

  .hamburger.active span:nth-child(2) {
    opacity: 0;
    left: -20px;
  }

  .hamburger.active span:nth-child(3) {
    top: 7px;
    transform: rotate(-135deg);
  }

  /* Mobile Menu */
  .mobile-menu {
    background: white;
    border-top: 1px solid #e2e8f0;
    padding: 1rem;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .mobile-nav-link {
    display: flex;
    align-items: center;
    gap: 1rem;
    padding: 1rem;
    border: none;
    background: none;
    color: #64748b;
    font-weight: 600;
    font-size: 1rem;
    border-radius: 10px;
    cursor: pointer;
    transition: all 0.3s ease;
    text-align: left;
    width: 100%;
  }

  .mobile-nav-link:hover {
    background: #f8fafc;
    color: var(--primary-color, #ff6b35);
  }

  /* Responsive adjustments */
  @media (max-width: 480px) {
    .nav-container {
      padding: 0 0.75rem;
    }

    .brand-logo {
      font-size: 1.25rem;
    }

    .action-btn {
      width: 40px;
      height: 40px;
    }
  }

  /* Dark mode support */
  @media (prefers-color-scheme: dark) {
    .main-header {
      background: rgba(15, 23, 42, 0.95);
      /* border-bottom-color: #334155; */
    }

    .main-header.scrolled {
      background: rgba(15, 23, 42, 0.98);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
    }

    .brand-text {
      color: #f8fafc;
    }

    .nav-link,
    .action-btn,
    .mobile-nav-link {
      color: #94a3b8;
    }

    .nav-link:hover,
    .action-btn:hover,
    .mobile-nav-link:hover {
      background: #1e293b;
    }

    .mobile-menu {
      background: #0f172a;
      border-top-color: #334155;
    }

    .hamburger span {
      background: #94a3b8;
    }
  }

  /* High contrast mode */
  @media (prefers-contrast: high) {
    .main-header {
      border-bottom: 2px solid #000;
    }

    .nav-link,
    .action-btn {
      border: 1px solid transparent;
    }

    .nav-link:hover,
    .action-btn:hover {
      border-color: var(--primary-color, #ff6b35);
    }
  }

  /* Reduced motion */
  @media (prefers-reduced-motion: reduce) {
    .main-header,
    .nav-link,
    .action-btn,
    .mobile-menu-btn,
    .hamburger,
    .hamburger span {
      transition: none;
    }

    .nav-link:hover,
    .action-btn:hover {
      transform: none;
    }
  }
</style>